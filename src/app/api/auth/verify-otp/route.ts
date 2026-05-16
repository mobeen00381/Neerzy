import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateJWT(user: any) {
  return jwt.sign(
    { userId: user.id, phone: user.phone },
    process.env.JWT_SECRET || "neerzy-super-secret-key-2026",
    { expiresIn: "7d" }
  );
}

export async function POST(req: Request) {
  try {
    const { phone, otp, plan } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    // 1. Find the latest valid OTP record
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', formattedPhone)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // 2. Direct comparison (matches your plain-text storage in send-otp)
    if (otp !== otpData.otp_hash) {
      await supabase.from('otp_verifications')
        .update({ attempts: (otpData.attempts || 0) + 1 })
        .eq('id', otpData.id);
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // 3. Mark as verified
    await supabase.from('otp_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpData.id);

    // 4. Handle User Creation / Profiles
    let authUser;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: formattedPhone,
      phone_confirm: true,
      user_metadata: { signup_method: 'otp', selected_plan: plan || 'free' }
    });

    if (authError && authError.message.includes('already registered')) {
      const { data: { user } } = await supabase.auth.admin.getUserByPhone(formattedPhone);
      authUser = user;
    } else {
      authUser = authData.user;
    }

    await supabase.from('users').upsert({ id: authUser?.id, phone: formattedPhone, plan: plan || 'free' });
    await supabase.from('profiles').upsert({ id: authUser?.id, phone: formattedPhone, selected_plan: plan || 'free', onboarded_at: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      userId: authUser?.id,
      token: generateJWT({ id: authUser?.id, phone: formattedPhone }),
      message: 'Verified successfully'
    });

  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
