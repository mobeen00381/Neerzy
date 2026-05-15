import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = body.phone || body.phoneNumber;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Format phone to E.164 (ensure it has +)
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP for secure storage
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Store OTP in database (expires in 10 minutes)
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .insert({
        phone: formattedPhone,
        otp_hash: otpHash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0
      });

    if (dbError) {
      console.error('Supabase error:', dbError);
      return NextResponse.json({ error: 'Failed to store OTP' }, { status: 500 });
    }

    // Send OTP via WhatsApp using approved template
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Use environment variable for from number if available, fallback to provided number
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    const contentSid = 'HX7aa52a97082b7f17ed5d15325d1e3bfb'; // neerzy_otp_verification

    await client.messages.create({
      from: fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`,
      to: `whatsapp:${formattedPhone}`,
      contentSid: contentSid,
      contentVariables: JSON.stringify({ '1': otp })
    });

    console.log('✅ Sent Template OTP:', { to: formattedPhone, contentSid });

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent via WhatsApp'
    });

  } catch (error: any) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ 
      error: 'Failed to send OTP. Please try again.',
      details: error.message
    }, { status: 500 });
  }
}
