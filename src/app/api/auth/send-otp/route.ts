import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Supabase (for production verification later)
    await supabase.from('otp_verifications').insert({
      phone,
      otp_hash: otp, // ⚠️ In production, hash this with bcrypt!
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      verified: false
    });

    // ✅ FOR TESTING: Return the OTP in the response
    // (In production, remove this line and send via WhatsApp/SMS)
    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent',
      test_otp: otp  // 🔥 REMOVE THIS LINE IN PRODUCTION
    });

  } catch (error: any) {
    console.error('OTP Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to send OTP' 
    }, { status: 500 });
  }
}
