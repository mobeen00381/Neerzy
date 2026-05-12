// app/api/auth/send-otp/route.ts - DEBUG VERSION
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
  console.log('🔍 [DEBUG] OTP request received');
  
  try {
    const { phoneNumber } = await request.json();
    console.log('📱 Phone from client:', phoneNumber);

    if (!phoneNumber) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }

    // ✅ Format phone EXACTLY for WhatsApp
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    const toNumber = `whatsapp:${formattedPhone}`;
    
    console.log('🔗 Formatted for Twilio:', {
      original: phoneNumber,
      cleaned: cleanPhone,
      formatted: formattedPhone,
      toNumber: toNumber,
    });

    // ✅ Verify env vars are loaded
    console.log('🔐 Env var check:', {
      hasWhatsappNumber: !!process.env.TWILIO_WHATSAPP_NUMBER,
      whatsappNumberValue: process.env.TWILIO_WHATSAPP_NUMBER,
      hasTemplateSid: !!process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID,
      templateSidValue: process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID?.slice(0, 10) + '...',
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Generated OTP:', otp);

    // Store in Supabase
    const { error: storeError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        phone_number: formattedPhone,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      });

    if (storeError) {
      console.error('❌ Supabase store failed:', storeError);
      return Response.json({ error: 'Failed to store OTP' }, { status: 500 });
    }

    // ✅ Send via WhatsApp template
    console.log('📤 Calling Twilio API...');
    
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: toNumber,
      contentSid: process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID,
      contentVariables: JSON.stringify({ '1': otp }),
    });

    console.log('✅ Twilio response:', {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      direction: message.direction,
      dateCreated: message.dateCreated,
    });

    return Response.json({
      success: true,
      sid: message.sid,
      status: message.status,
      to: toNumber,
      debug: {
        envVarsLoaded: {
          whatsappNumber: !!process.env.TWILIO_WHATSAPP_NUMBER,
          templateSid: !!process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR:', {
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
        details: error.message,
        twilioCode: error.code,
        debug: 'Check Vercel logs for full error object'
      },
      { status: 500 }
    );
  }
}
