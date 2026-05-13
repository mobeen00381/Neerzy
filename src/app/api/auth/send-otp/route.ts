// app/api/auth/send-otp/route.ts - SANDBOX VERSION
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

    // Format phone for WhatsApp
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const toNumber = `whatsapp:${formattedPhone}`;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Supabase
    await supabaseAdmin.from('otp_verifications').insert({
      phone_number: formattedPhone,
      code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    });

    // ✅ SANDBOX: Use free-form body (NO contentSid needed)
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886', // Use sandbox number from env or fallback
      to: toNumber,
      body: `🔐 Your Neerzy verification code:

${otp}

This code expires in 10 minutes.`,
    });

    console.log('✅ Sandbox OTP sent:', {
      sid: message.sid,
      to: toNumber,
      status: message.status,
    });

    return Response.json({
      success: true,
      sid: message.sid,
      channel: 'whatsapp-sandbox',
    });

  } catch (error: any) {
    console.error('❌ OTP send failed:', {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    return Response.json(
      { error: 'Failed to send OTP', details: error.message },
      { status: 500 }
    );
  }
}
