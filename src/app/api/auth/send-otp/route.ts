// app/api/auth/send-otp/route.ts
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    // ✅ CRITICAL: Format for WhatsApp (not SMS)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const toNumber = `whatsapp:${formattedPhone}`; // ← This prefix forces WhatsApp

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Supabase
    await supabaseAdmin.from('otp_verifications').insert({
      phone_number: formattedPhone,
      code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    });

    // ✅ SEND VIA WHATSAPP TEMPLATE (NO SMS FALLBACK)
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // whatsapp:+18338872999
      to: toNumber, // whatsapp:+923006291617
      contentSid: process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID, // HXae27daecf4d89e88ac375dcc5677507f
      contentVariables: JSON.stringify({ '1': otp }),
    });

    console.log('✅ WhatsApp OTP sent:', {
      sid: message.sid,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: toNumber,
      template: process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID,
      status: message.status,
    });

    return Response.json({
      success: true,
      sid: message.sid,
      channel: 'whatsapp', // ← Confirm it's WhatsApp
    });

  } catch (error: any) {
    console.error('❌ WhatsApp OTP failed:', {
      code: error.code,
      message: error.message,
      status: error.status,
    });

    // ⚠️ DO NOT FALLBACK TO SMS - let it fail so you can debug
    return Response.json(
      { 
        error: 'Failed to send WhatsApp OTP', 
        details: error.message,
        twilioCode: error.code,
        hint: 'Ensure phone number is registered on WhatsApp and has messaged your business number'
      },
      { status: 500 }
    );
  }
}
