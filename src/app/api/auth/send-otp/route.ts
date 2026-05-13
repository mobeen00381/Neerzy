// app/api/auth/send-otp/route.ts - SANDBOX ONLY (NO TEMPLATES)
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Format phone: whatsapp:+923006291617
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    const e164 = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    const toNumber = `whatsapp:${e164}`;

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_hash = await bcrypt.hash(otp, 10);

    // Store in Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Using schema columns: phone, otp_hash
    await supabaseAdmin.from('otp_verifications').insert({
      phone: e164,
      otp_hash: otp_hash,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    // Twilio client
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // ✅ SANDBOX: Use PLAIN BODY only - NO contentSid, NO contentVariables
    const message = await twilioClient.messages.create({
      from: 'whatsapp:+14155238886',  // Sandbox number
      to: toNumber,
      body: `Your Neerzy verification code is ${otp}. This code expires in 10 minutes.`,
      // ❌ DO NOT include contentSid or contentVariables for sandbox
    });

    console.log('✅ Sandbox OTP sent:', {
      sid: message.sid,
      status: message.status,
    });

    return Response.json({ success: true, sid: message.sid });

  } catch (error: any) {
    console.error('❌ OTP failed:', {
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
    });

    return Response.json(
      { error: 'Failed to send OTP', details: error.message },
      { status: 500 }
    );
  }
}
