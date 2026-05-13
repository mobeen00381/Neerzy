// app/api/auth/send-otp/route.ts - SANDBOX VALIDATED
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    // 🔥 STRICT PHONE FORMATTING FOR SANDBOX
    // Remove everything except digits and +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    const e164Phone = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    
    // Add whatsapp: prefix (lowercase!)
    const toNumber = `whatsapp:${e164Phone}`;
    
    console.log('📱 Phone formatting:', {
      original: phoneNumber,
      cleaned: cleaned,
      e164: e164Phone,
      final: toNumber,
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Supabase (your existing logic)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabaseAdmin.from('otp_verifications').insert({
      phone_number: e164Phone,
      code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      used: false,
    });

    // 🔥 SANDBOX-SPECIFIC TWILIO CALL
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await twilioClient.messages.create({
      from: 'whatsapp:+14155238886',  // ✅ Sandbox number (exact)
      to: toNumber,                    // ✅ Formatted above
      body: `Your Neerzy verification code is ${otp}. This code expires in 10 minutes.`,
      // ⚠️ SANDBOX: Keep body simple - no emojis, no complex formatting
    });

    console.log('✅ Twilio success:', { sid: message.sid, status: message.status });

    return Response.json({ success: true, sid: message.sid });

  } catch (error: any) {
    console.error('❌ Twilio 400 Error Details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
    });

    return Response.json(
      { 
        error: 'Failed to send OTP',
        details: error.message,
        hint: 'Ensure phone is E.164 format and joined sandbox'
      },
      { status: 500 }
    );
  }
}
