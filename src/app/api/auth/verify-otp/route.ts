import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();
    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    // Ensure consistent phone format
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // Find valid OTP in Supabase
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('id, phone, otp_hash, expires_at')
      .eq('phone', formattedPhone)
      .eq('otp_hash', otp)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // ✅ OTP is valid! 
    // (In production, create a session/JWT here)
    return NextResponse.json({ 
      success: true, 
      phone: formattedPhone 
    });

  } catch (err: any) {
    console.error('Verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
