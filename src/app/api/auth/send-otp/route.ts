// app/api/auth/send-otp/route.ts - SECURE OTP VERSION
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();
  if (!phoneNumber) return Response.json({ error: 'Phone required' }, { status: 400 });

  // Format phone
  const clean = phoneNumber.replace(/[^\d+]/g, '');
  const e164 = clean.startsWith('+') ? clean : `+${clean}`;
  const to = `whatsapp:${e164}`;

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);

  // Store in Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  await supabase.from('otp_verifications').insert({
    phone: e164,
    otp_hash: otpHash,
    expires_at: new Date(Date.now() + 600000).toISOString(),
    attempts: 0
  });

  // Twilio client
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // 🔥 SANDBOX: Hardcoded sandbox number + plain body
  const msg = await client.messages.create({
    from: 'whatsapp:+14155238886',  // ✅ SANDBOX ONLY
    to: to,
    body: `Your Neerzy verification code is ${otp}. This code expires in 10 minutes.`,
  });

  console.log('✅ Sent Secure OTP:', { from: 'whatsapp:+14155238886', to, sid: msg.sid });
  return Response.json({ success: true, sid: msg.sid });
}
