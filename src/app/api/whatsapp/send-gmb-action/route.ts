import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { getOpenAIClient, DEFAULT_OPENAI_MODEL } from '@/lib/openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = getOpenAIClient();

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: Request) {
  try {
    const { placeId, action, phoneNumber } = await req.json();

    if (!placeId || !action) {
      return NextResponse.json({ error: 'Missing placeId or action' }, { status: 400 });
    }

    // 1. Fetch GMB data from jobs table
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('gmb_place_id', placeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job/GMB data not found' }, { status: 404 });
    }

    const businessName = job.gmb_business_name;
    const healthScore = job.gmb_health_score;
    const city = job.gmb_address?.split(',').reverse()[2]?.trim() || 'your area';

    // 2. Generate AI Content using OpenAI
    let aiMessage = '';
    
    if (action === 'generate_post') {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          { role: "system", content: "You are a local SEO expert. Write a short, punchy WhatsApp message for a business to share their recent success." },
          { role: "user", content: `Write a WhatsApp post for ${businessName} in ${city}. They just completed a high-quality job. Keep it under 40 words and include relevant local hashtags.` }
        ]
      });
      aiMessage = completion.choices[0].message.content || '';
    } else if (action === 'send_review') {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          { role: "system", content: "You are a customer success manager. Write a polite WhatsApp message asking for a Google review." },
          { role: "user", content: `Write a polite review request for ${businessName}. Mention that the customer's feedback helps other locals in ${city}. Keep it very friendly and short.` }
        ]
      });
      aiMessage = completion.choices[0].message.content || '';
    }

    // 3. Send via WhatsApp API
    // Note: process.env.TWILIO_WHATSAPP_NUMBER should include 'whatsapp:' prefix
    const from = process.env.TWILIO_WHATSAPP_NUMBER?.startsWith('whatsapp:') 
      ? process.env.TWILIO_WHATSAPP_NUMBER 
      : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
      
    const to = phoneNumber?.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber || job.customer_phone || '+1234567890'}`;

    const msg = await twilioClient.messages.create({
      from,
      to,
      body: `🚀 ${businessName} Update:\n\n${aiMessage}\n\nCheck out our work: ${process.env.NEXT_PUBLIC_APP_URL}/showcase/${placeId}`
    });

    // 4. Log the action in Supabase
    await supabase.from('audit_logs').insert({
      action: `whatsapp_${action}`,
      meta: { placeId, businessName, twilioSid: msg.sid, message: aiMessage }
    });

    return NextResponse.json({
      success: true,
      sid: msg.sid,
      message: aiMessage,
      sentTo: to
    });

  } catch (error: any) {
    console.error('WhatsApp Action Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete WhatsApp action' }, { status: 500 });
  }
}
