import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

function generateJWT(user: any) {
  return jwt.sign(
    { userId: user.id, phone: user.phone_number || user.phone },
    process.env.JWT_SECRET || "neerzy-super-secret-key-2026",
    { expiresIn: "7d" }
  );
}

export async function POST(request: Request) {
  try {
    const { phoneNumber, otpCode, plan } = await request.json();
    
    if (!phoneNumber || !otpCode) {
      return Response.json({ error: 'Phone and OTP required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 🔍 STEP 1: Fetch OTP record by phone
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('phone', phoneNumber)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !otpRecord) {
      console.error('❌ OTP fetch failed:', fetchError);
      return Response.json(
        { error: 'Invalid or expired OTP', debug: 'OTP record not found or already verified' },
        { status: 400 }
      );
    }

    // 🔐 STEP 2: Compare plain OTP with hashed value
    const isValidOtp = await bcrypt.compare(otpCode, otpRecord.otp_hash);

    if (!isValidOtp) {
      console.log('❌ OTP mismatch - hash comparison failed');
      return Response.json(
        { error: 'Invalid or expired OTP', debug: 'Hash mismatch' },
        { status: 400 }
      );
    }

    // ✅ STEP 3: Mark as verified
    await supabaseAdmin
      .from('otp_verifications')
      .update({ 
        verified_at: new Date().toISOString(),
        attempts: (otpRecord.attempts || 0) + 1
      })
      .eq('id', otpRecord.id);

    console.log('✅ OTP verified successfully');

    // 🔍 STEP 4: Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, selected_plan')
      .eq('phone', phoneNumber)
      .maybeSingle();

    if (existingUser) {
      const user = {
        id: existingUser.id,
        phone: phoneNumber,
        plan: existingUser.selected_plan,
      };

      return Response.json({
        success: true,
        message: 'User already exists - logging in',
        user,
        token: generateJWT(user),
        isNewUser: false,
      });
    }

    // 🔍 STEP 5: Create NEW user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: phoneNumber,
      password: Math.random().toString(36).slice(-10),
      phone_confirm: true,           // ← CRITICAL: Skips phone confirmation for OTP
      user_metadata: {
        signup_method: 'otp',
        otp_verified: true,
        phone_number: phoneNumber,
        selected_plan: plan || 'free',
        onboarded_at: new Date().toISOString(),
      },
    });

    if (authError) {
      if (authError.message?.includes('already registered') || authError.code === 'user_already_exists') {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserByPhone(phoneNumber);
        const userData = { id: user?.id, phone: phoneNumber };
        return Response.json({
          success: true,
          message: 'User already exists - logging in',
          user: userData,
          token: generateJWT(userData),
          isNewUser: false,
        });
      }
      throw authError;
    }

    // Create public profile
    await supabaseAdmin.from('profiles').upsert({
      id: authUser.user.id,
      phone: phoneNumber,
      selected_plan: plan || 'free',
      created_at: new Date().toISOString(),
    });

    const newUser = {
      id: authUser.user.id,
      phone: phoneNumber,
      plan: plan || 'free',
    };

    return Response.json({
      success: true,
      message: 'User created successfully',
      user: newUser,
      token: generateJWT(newUser),
      isNewUser: true,
    });

  } catch (error: any) {
    console.error('❌ Signup error:', error);
    return Response.json(
      { error: 'Signup failed', details: error.message },
      { status: 500 }
    );
  }
}
