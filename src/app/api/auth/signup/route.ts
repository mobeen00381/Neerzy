// app/api/auth/signup/route.ts - HANDLE EXISTING USERS
import { createClient } from '@supabase/supabase-js';

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
      .eq('phone_number', phoneNumber)
      .eq('code', otpCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpVerification) {
      return Response.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // 🔍 STEP 2: Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users') // or 'profiles' - whichever table stores user data
      .select('id, email, selected_plan')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUser) {
      // ✅ User exists - mark OTP as used & return success (login flow)
      await supabaseAdmin
        .from('otp_verifications')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', otpVerification.id);

      return Response.json({
        success: true,
        message: 'User already exists - logging in',
        user: {
          id: existingUser.id,
          phone: phoneNumber,
          plan: existingUser.selected_plan,
        },
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

        return Response.json({
          success: true,
          message: 'User already exists - logging in',
          user: { id: user?.id, phone: phoneNumber },
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
    // Checking if 'profiles' or 'users' is used. The snippet tries 'profiles' here.
    await supabaseAdmin.from('profiles').upsert({
      id: authUser.user.id,
      phone_number: phoneNumber,
      selected_plan: plan || 'free',
      created_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authUser.user.id,
        phone: phoneNumber,
        plan: plan || 'free',
      },
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
