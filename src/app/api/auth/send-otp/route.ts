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
      return Response.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    // Format phone number (remove non-digits, ensure E.164)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in Supabase (expires in 10 minutes)
    const { error: storeError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        phone_number: formattedPhone,
        code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        used: false,
      });

    if (storeError) {
      console.error('❌ Failed to store OTP:', storeError);
      return Response.json({ error: 'Failed to generate OTP' }, { status: 500 });
    }

    // ✅ Send via APPROVED TEMPLATE (this is the key fix!)
    const message = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // e.g., 'whatsapp:+18338872999'
      to: `whatsapp:${formattedPhone}`,
      contentSid: process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID, // HXae27daecf4d89e88ac375dcc5677507f
      contentVariables: JSON.stringify({ '1': otp }),
    });

    console.log('✅ OTP sent via template:', {
      sid: message.sid,
      to: formattedPhone,
      template: process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID,
    });

    return Response.json({
      success: true,
      message: 'OTP sent successfully',
      sid: message.sid,
    });

  } catch (error: any) {
    console.error('❌ Send OTP error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
    });

    return Response.json(
      { 
        error: 'Failed to send OTP',
        details: error.message,
        twilioCode: error.code,
      },
      { status: 500 }
    );
  }
}
