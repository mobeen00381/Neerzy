import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log('✅ Webhook loaded - Twilio SID:', process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...');

export async function POST(req: Request) {
  console.log('📥 ========== WEBHOOK HIT ==========');
  
  try {
    // Parse form data (Twilio sends form-urlencoded)
    const formData = await req.formData();
    
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const numMedia = parseInt(formData.get('NumMedia') as string || '0', 10);
    const mediaUrl0 = formData.get('MediaUrl0') as string;

    console.log('📱 From:', from);
    console.log('💬 Body:', body);
    console.log('🖼️ NumMedia:', numMedia);
    console.log('🔗 MediaUrl0:', mediaUrl0);

    // Extract phone number (remove 'whatsapp:' prefix)
    const phone = from?.replace('whatsapp:', '');
    
    if (!phone) {
      console.error('❌ No phone number found');
      return NextResponse.json({ error: 'No phone' }, { status: 400 });
    }

    // Simple reply test
    console.log('📤 Sending reply to:', phone);
    
    const replyText = `✅ *Neerzy Bot Active!*\n\nI received: "${body || 'media'}"\n\nType *POST* to generate your Google Post.`;
    
    // Send reply via Twilio
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917',
      to: `whatsapp:${phone}`,
      body: replyText
    });

    console.log('✅ Message sent! SID:', message.sid);
    console.log('📊 Message status:', message.status);

    return NextResponse.json({ success: true, sid: message.sid });

  } catch (error) {
    console.error('❌ WEBHOOK ERROR:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
