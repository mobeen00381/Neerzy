import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import twilio from 'twilio';
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

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // 1. Verify OTP using Twilio Verify
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks
      .create({ to: formattedPhone, code: otp });

    if (verificationCheck.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

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
