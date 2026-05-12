import { NextResponse } from 'next/server';
import { getSession, createSession, updateSession, WhatsAppSession } from '@/lib/whatsapp-sessions';
import { transcribeAudio } from '@/lib/whisper';
import { sendTwilioMessage } from '@/lib/twilio';
import { supabase } from '@/lib/supabase';
// Assuming enrichLocationData and createGBPDraft are available as in inbound/route.ts
// import { enrichLocationData } from '@/lib/google';
// import { createGBPDraft } from '@/lib/gbp';

// Helper to map sendWhatsApp to Twilio
const sendWhatsApp = async (to: string, body: string) => {
  return sendTwilioMessage(to, body);
};

import { generateAndSavePost } from '@/lib/generate-post';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const body = Object.fromEntries(formData) as Record<string, string>;
    const fromPhone = body.From.replace('whatsapp:', '').replace('+', '');
    
    let session = await getSession(fromPhone);
    if (!session) session = await createSession(fromPhone);

    // 1. Handle Images (up to 5)
    const numMedia = parseInt(body.NumMedia || '0');
    if (numMedia > 0) {
      const newImages = [];
      for (let i = 0; i < Math.min(numMedia, 5); i++) {
        newImages.push(body[`MediaUrl${i}`]); // Twilio uses 0-indexed MediaUrl for some things, but standard is MediaUrl0, MediaUrl1 etc. Let's use what user provided: MediaUrl${i+1} or MediaUrl0
      }
      
      // Twilio uses MediaUrl0, MediaUrl1 ...
      const actualImages = [];
      for (let i = 0; i < numMedia; i++) {
        if (body[`MediaUrl${i}`]) actualImages.push(body[`MediaUrl${i}`]);
      }

      session.accumulated_images = [...(session.accumulated_images || []), ...actualImages].slice(0, 5);
      await updateSession(session.id, { 
        accumulated_images: session.accumulated_images,
        step: 'awaiting_content' 
      });
      await sendWhatsApp(`+${fromPhone}`, `📸 ${actualImages.length} photo(s) saved. Send more, or describe the job.`);
      return NextResponse.json({ status: 'images_saved' });
    }

    // 2. Handle Voice Notes
    if (body.MediaContentType0?.includes('audio')) {
      const audioUrl = body.MediaUrl0;
      const transcript = await transcribeAudio(audioUrl); // OpenAI Whisper
      session.transcript = (session.transcript || '') + ' ' + transcript;
      await updateSession(session.id, { transcript: session.transcript });
      await sendWhatsApp(`+${fromPhone}`, `🎤 Voice noted: "${transcript}". Continue or send customer details.`);
      return NextResponse.json({ status: 'audio_transcribed' });
    }

    // 3. Handle Text (Job Description or Customer Details)
    const text = body.Body?.trim() || "";
    
    if (session.step === 'awaiting_content' || session.step === 'initial') {
      // Check if text contains customer pattern: "Name +Phone"
      const customerMatch = text.match(/^(.+?)\s*([+\d\s()-]{7,})$/);
      if (customerMatch) {
        session.customer_name = customerMatch[1].trim();
        session.customer_phone = customerMatch[2].replace(/\s/g, '');
        session.step = 'processing';
        await updateSession(session.id, {
          customer_name: session.customer_name,
          customer_phone: session.customer_phone,
          step: session.step
        });
        
        // Trigger AI generation
        await sendWhatsApp(`+${fromPhone}`, `⏳ Processing job for ${session.customer_name}... generating content.`);
        const jobId = await generateAndSavePost(session);
        
        // Reset session step after successful generation
        await updateSession(session.id, { step: 'completed' });
        
        await sendWhatsApp(`+${fromPhone}`, `✅ Post created!\n\n🔗 Review & publish:\nhttps://www.neerzy.com/publish/${jobId}\n\nTap to copy, download images & open Google.`);
        return NextResponse.json({ status: 'post_generated' });
      } else {
        // Append to job description
        session.transcript = (session.transcript || '') + ' ' + text;
        await updateSession(session.id, { 
          transcript: session.transcript,
          step: 'awaiting_content'
        });
        await sendWhatsApp(`+${fromPhone}`, `📝 Noted. Send more details or customer info (e.g., John +14441112233).`);
        return NextResponse.json({ status: 'text_noted' });
      }
    }

    return NextResponse.json({ status: 'ignored' });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
