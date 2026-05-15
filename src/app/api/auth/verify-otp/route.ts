import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

    const formattedPhone = phone.replace(/[^\d+]/g, '').startsWith('+') 
      ? phone.replace(/[^\d+]/g, '') 
      : `+${phone.replace(/[^\d+]/g, '')}`;

    // 1. Find OTP record
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

    // 2. Verify OTP hash (SECURE COMPARED TO PLAIN TEXT)
    const isValid = await bcrypt.compare(otp, otpData.otp_hash);
    if (!isValid) {
      await supabase.from('otp_verifications').update({ attempts: (otpData.attempts || 0) + 1 }).eq('id', otpData.id);
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // 3. Mark OTP as verified
    await supabase
      .from('otp_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpData.id);

    // 4. Handle User Creation (Supabase Auth + Custom Tables)
    let authUser;
    
    // Create/Update in Supabase Auth (Crucial for onboarding/getUser)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: formattedPhone,
      phone_confirm: true,
      user_metadata: { 
        signup_method: 'otp',
        otp_verified: true,
        selected_plan: plan || 'free'
      }
    });

    if (authError && authError.message.includes('already registered')) {
      const { data: { user } } = await supabase.auth.admin.getUserByPhone(formattedPhone);
      authUser = user;
    } else if (authError) {
      throw authError;
    } else {
      authUser = authData.user;
    }

    // Upsert into custom 'users' table
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (!existingUser) {
      await supabase
        .from('users')
        .insert({
          id: authUser?.id,
          phone: formattedPhone,
          plan: plan || 'free',
          created_at: new Date().toISOString()
        });
    }

    // Upsert into 'profiles' table (Required by dashboard)
    await supabase.from('profiles').upsert({
      id: authUser?.id,
      phone: formattedPhone,
      selected_plan: plan || 'free',
      onboarded_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      userId: authUser?.id,
      message: 'OTP verified successfully',
      token: generateJWT({ id: authUser?.id, phone: formattedPhone })
    });

  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ 
      error: 'Verification failed. Please try again.',
      details: error.message
    }, { status: 500 });
  }
}
