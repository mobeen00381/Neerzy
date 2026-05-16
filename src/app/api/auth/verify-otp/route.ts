import { NextResponse } from 'next/server';

// /api/auth/verify-otp/route.ts - TEST MODE ONLY
export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();
    
    // Accept ANY 6-digit code for testing
    if (otp && otp.length === 6) {
      return NextResponse.json({ success: true, phone });
    }
    
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
