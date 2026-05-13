// app/api/auth/send-otp/route.ts - MINIMAL SANDBOX VERSION
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();
  if (!phoneNumber) return Response.json({ error: 'Phone required' }, { status: 400 });

  // Format phone
  const clean = phoneNumber.replace(/[^\d+]/g, '');
  const e164 = clean.startsWith('+') ? clean : `+${clean}`;
  const to = `whatsapp:${e164}`;

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await supabase.from('otp_verifications').insert({
    phone_number: e164,
    code: otp,
    expires_at: new Date(Date.now() + 600000).toISOString(),
    used: false,
  });

  // Twilio client
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // 🔥 SANDBOX CALL - ONLY 3 PARAMS, NO TEMPLATES
  const msg = await client.messages.create({
    from: 'whatsapp:+14155238886',  // Sandbox only
    to: to,                          // whatsapp:+92...
    body: `Your Neerzy verification code is ${otp}. This code expires in 10 minutes.`,
  });

  return Response.json({ success: true, sid: msg.sid });
}
