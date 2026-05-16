import twilio from 'twilio';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Format phone to E.164 (e.g., +923...)
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // ✅ USE VERIFY API with explicit Template SID
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications
      .create({ 
        to: formattedPhone, 
        channel: 'whatsapp',
        templateSid: 'HXae27daecf4d89e88ac375dcc5677507f' // Using approved template from .env.local
      });

    return NextResponse.json({ 
      success: true, 
      sid: verification.sid 
    });

  } catch (error: any) {
    console.error('Twilio Verify Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send OTP' 
    }, { status: 500 });
  }
}
