import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateJWT(user: any) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || "neerzy-super-secret-key-2026",
    { expiresIn: "7d" }
  );
}

export async function POST(req: Request) {
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  try {
    const { method, email, password, phone, googleToken } = await req.json();

    if (method === "google") {
      // Verify Google ID token
      const ticket = await oauth2Client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
      }

      // Upsert user
      const { data: user, error: upsertError } = await supabase
        .from("users")
        .upsert({
          email: payload.email,
          google_id: payload.sub,
          email_verified: true,
          full_name: payload.name,
          avatar_url: payload.picture
        }, { onConflict: "google_id" })
        .select()
        .single();

      if (upsertError) throw upsertError;

      return NextResponse.json({ 
        user, 
        token: generateJWT(user) 
      });
    }

    if (method === "email") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);
      
      const { data: user, error: insertError } = await supabase
        .from("users")
        .insert({ 
          email, 
          password_hash,
          email_verified: false 
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === "23505") { // Unique violation
          return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }
        throw insertError;
      }

      // TODO: sendVerificationEmail(user.email, user.id);
      
      return NextResponse.json({ message: "Account created. Please verify your email." });
    }

    if (method === "whatsapp") {
      if (!phone) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }

      const formattedPhone = phone.replace(/\s+/g, '');
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp_hash = await bcrypt.hash(otp, 10);
      
      // Store OTP verification
      const { error: otpError } = await supabase.from("otp_verifications").insert({
        phone: formattedPhone,
        otp_hash: otp_hash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0
      });

      if (otpError) throw otpError;
      
      // Send via Twilio
      await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `whatsapp:${formattedPhone}`,
        body: `Your Neerzy verification code is: ${otp}. It expires in 10 minutes.`
      });

      return NextResponse.json({ message: "OTP sent to WhatsApp" });
    }

    return NextResponse.json({ error: "Invalid signup method" }, { status: 400 });

  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
