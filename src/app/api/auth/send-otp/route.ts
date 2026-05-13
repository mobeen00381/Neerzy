// app/api/auth/send-otp/route.ts - DEBUG VERSION
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export async function POST(request: Request) {
  console.log('🔍 [DEBUG] OTP request started');
  
  try {
    // 1. Check env vars FIRST
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    console.log('🔐 Env check:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      accountSidPreview: accountSid?.slice(0, 10) + '...',
    });
    
    if (!accountSid || !authToken) {
      throw new Error('Missing Twilio credentials in environment variables');
    }

    const { phoneNumber } = await request.json();
    console.log('📱 Phone received:', phoneNumber);

    if (!phoneNumber) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Format phone
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const toNumber = `whatsapp:${formattedPhone}`;
    console.log('🔗 Formatted to:', toNumber);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Generated OTP:', otp);

    // Supabase setup
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Store OTP
    const { error: storeError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        phone_number: formattedPhone,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      });

    if (storeError) {
      console.error('❌ Supabase error:', storeError);
      throw new Error(`Failed to store OTP: ${storeError.message}`);
    }

    // Twilio client
    const twilioClient = twilio(accountSid, authToken);
    
    // Send via SANDBOX
    console.log('📤 Sending via Twilio Sandbox...');
    const message = await twilioClient.messages.create({
      from: 'whatsapp:+14155238886',
      to: toNumber,
      body: `🔐 Your Neerzy verification code:\n\n${otp}\n\nThis code expires in 10 minutes.`,
    });

    console.log('✅ Success:', { sid: message.sid, status: message.status });

    return Response.json({ success: true, sid: message.sid });

  } catch (error: any) {
    // 🔥 LOG EVERYTHING
    console.error('💥 FULL ERROR OBJECT:', {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      details: error.details,
      stack: error.stack,
    });

    return Response.json(
      { 
        error: 'Failed to send OTP',
        message: error.message,
        debug: 'Check Vercel logs for full error object'
      },
      { status: 500 }
    );
  }
}
