import twilio from 'twilio';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // ✅ USE VERIFY API to check code
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks
      .create({ 
        to: formattedPhone, 
        code: otp 
      });

    if (verificationCheck.status === 'approved') {
      return NextResponse.json({ 
        success: true, 
        phone: formattedPhone 
      });
    } else {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Verification Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Verification failed' 
    }, { status: 500 });
  }
}
