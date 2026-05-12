import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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
    const { phone, otp, code, plan } = await req.json();
    const actualOtp = otp || code;

    if (!phone || !actualOtp) {
      return NextResponse.json({ error: "Phone and OTP are required" }, { status: 400 });
    }

    const formattedPhone = phone.replace(/\s+/g, '');

    // Find unexpired OTP record
    const { data: record, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("phone", formattedPhone)
      .is("verified_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Verify OTP hash
    const valid = await bcrypt.compare(actualOtp, record.otp_hash);
    
    if (!valid) {
      // Increment attempts, lock after 5 fails (logic could be added here)
      await supabase
        .from("otp_verifications")
        .update({ attempts: (record.attempts || 0) + 1 })
        .eq("id", record.id);
        
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Mark as verified
    await supabase
      .from("otp_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", record.id);

    // Create/update user with plan via Supabase Admin Auth
    let authUser;
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      phone: formattedPhone,
      phone_confirm: true,
      user_metadata: { 
        phone_number: formattedPhone,
        selected_plan: plan || 'free',
        plan_status: 'trial',
      },
    });

    if (createError && createError.message.includes('already exists')) {
      // Find existing user in custom table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("phone", formattedPhone)
        .single();
        
      if (existingUser) {
        authUser = { id: existingUser.id };
        await supabase.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            phone_number: formattedPhone,
            selected_plan: plan || 'free',
            plan_status: 'trial',
          }
        });
      } else {
        throw createError;
      }
    } else if (createError) {
      throw createError;
    } else {
      authUser = authData.user;
    }

    // Keep custom users table in sync
    const { data: user, error: userError } = await supabase
      .from("users")
      .upsert({ 
        id: authUser.id,
        phone: formattedPhone, 
        whatsapp_verified: true,
        plan: plan || 'starter'
      }, { onConflict: "phone" })
      .select()
      .single();

    if (userError) throw userError;

    // Log onboarding completion
    await supabase.from('audit_logs').insert({
      action: 'user_onboarded',
      meta: { phone: formattedPhone, plan: plan || 'starter', user_id: authUser.id },
    });

    return NextResponse.json({ 
      success: true, 
      userId: authUser.id,
      user, 
      token: generateJWT(user) 
    });

  } catch (error: any) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
