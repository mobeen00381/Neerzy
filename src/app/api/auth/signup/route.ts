import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

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

    // 🔍 STEP 1: Verify OTP first
    const { data: otpVerification, error: otpError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('code', otpCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    console.log('🔍 OTP query result:', {
      found: !!otpVerification,
      error: otpError?.message,
      queryParams: {
        phoneColumn: 'phone',
        codeColumn: 'code',
        phoneNumber,
        otpCode,
      },
    });

    if (otpError || !otpVerification) {
      return Response.json(
        { 
          error: 'Invalid or expired OTP',
          debug: otpError?.message || 'OTP not found'
        }, 
        { status: 400 }
      );
    }

    // 🔍 STEP 2: Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users') // or 'profiles' - whichever table stores user data
      .select('id, email, selected_plan')
      .eq('phone', phoneNumber)
      .maybeSingle();

    if (existingUser) {
      // ✅ User exists - mark OTP as used & return success (login flow)
      await supabaseAdmin
        .from('otp_verifications')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', otpVerification.id);

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

    // 🔍 STEP 3: Create NEW user (only if doesn't exist)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      phone: phoneNumber,
      password: Math.random().toString(36).slice(-10), // Random password for phone auth
      user_metadata: {
        phone_number: phoneNumber,
        selected_plan: plan || 'free',
        onboarded_at: new Date().toISOString(),
      },
    });

    if (authError) {
      // Handle "phone already registered" from Auth specifically
      if (authError.message?.includes('already registered') || authError.code === 'user_already_exists') {
        // Fallback: fetch the existing user from auth
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserByPhone(phoneNumber);
        
        await supabaseAdmin
          .from('otp_verifications')
          .update({ used: true, used_at: new Date().toISOString() })
          .eq('id', otpVerification.id);

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

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_verifications')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', otpVerification.id);

    // Create public profile (if you use a separate profiles table)
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
