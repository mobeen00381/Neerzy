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

const clamp = (v: unknown, max: number) => (v ? String(v).slice(0, max) : null);

/** Maps a UTM source to a Neerzy channel bucket for admin signup attribution. */
function inferSignupSource(utmSource: string | null | undefined): string | null {
  const s = (utmSource || "").toLowerCase();
  if (!s) return null;
  if (s.includes("facebook") || s.includes("fb") || s.includes("meta")) return "facebook";
  if (s.includes("instagram") || s.includes("ig")) return "instagram";
  if (s.includes("google") || s.includes("gads")) return "google_ads";
  if (s.includes("referral")) return "referral";
  if (s.includes("organic") || s.includes("search")) return "organic";
  return s;
}

export async function POST(request: Request) {
  try {
    const { phoneNumber, otpCode, plan, utm_source, utm_medium, utm_campaign, signup_source } = await request.json();
    
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
        redirect: '/dashboard',
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
        const { data: { user } } = await (supabaseAdmin.auth.admin as any).getUserByPhone(phoneNumber);
        const userData = { id: user?.id, phone: phoneNumber };
        return Response.json({
          success: true,
          message: 'User already exists - logging in',
          redirect: '/dashboard',
          user: userData,
          token: generateJWT(userData),
          isNewUser: false,
        });
      }
      throw authError;
    }

    // Attribution captured from the landing URL (UTM params sent by the login page).
    const attribution = {
      utm_source: clamp(utm_source, 120),
      utm_medium: clamp(utm_medium, 120),
      utm_campaign: clamp(utm_campaign, 160),
      signup_source: clamp(signup_source, 60) || inferSignupSource(clamp(utm_source, 120)),
    };

    // Create public profile
    const profilePayload: any = {
      id: authUser.user.id,
      phone: phoneNumber,
      selected_plan: plan || 'free',
      created_at: new Date().toISOString(),
    };
    if (attribution.signup_source) profilePayload.signup_source = attribution.signup_source;
    if (attribution.utm_source) profilePayload.utm_source = attribution.utm_source;
    if (attribution.utm_medium) profilePayload.utm_medium = attribution.utm_medium;
    if (attribution.utm_campaign) profilePayload.utm_campaign = attribution.utm_campaign;

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(profilePayload);
    if (profileError) {
      // Fallback for databases that haven't run the admin-dashboard migration yet:
      // retry with only the legacy columns so signup still works.
      console.warn('⚠️ Profile upsert with attribution failed, retrying without UTM columns:', profileError.message);
      const legacyPayload: any = {
        id: authUser.user.id,
        phone: phoneNumber,
        selected_plan: plan || 'free',
        created_at: new Date().toISOString(),
      };
      await supabaseAdmin.from('profiles').upsert(legacyPayload);
    }

    // If this phone was an inbound ad lead, mark it converted and link the user.
    try {
      const { data: matchedLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('phone', phoneNumber)
        .in('status', ['new', 'contacted', 'trial_started'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (matchedLead) {
        await supabaseAdmin
          .from('leads')
          .update({ status: 'converted', converted_user_id: authUser.user.id })
          .eq('id', matchedLead.id);
      }
    } catch (leadErr) {
      console.warn('⚠️ Lead conversion link skipped:', leadErr);
    }

    const newUser = {
      id: authUser.user.id,
      phone: phoneNumber,
      plan: plan || 'free',
    };

    return Response.json({
      success: true,
      message: 'User created successfully',
      redirect: '/dashboard',
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
