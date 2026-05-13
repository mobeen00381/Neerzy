import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";

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
    const { method, email, password, phone, googleToken } = await req.json();

    if (method === "whatsapp") {
      if (!phone) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }

      // Validate env vars early
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

      if (!twilioSid || !twilioToken || !twilioFrom) {
        const missing = [
          !twilioSid && "TWILIO_ACCOUNT_SID",
          !twilioToken && "TWILIO_AUTH_TOKEN",
          !twilioFrom && "TWILIO_PHONE_NUMBER",
        ].filter(Boolean);
        console.error("Missing Twilio env vars:", missing);
        return NextResponse.json({ 
          error: `Messaging not configured. Missing: ${missing.join(", ")}` 
        }, { status: 500 });
      }

      const formattedPhone = phone.replace(/\s+/g, '');
      console.log(`[SIGNUP] OTP request for: ${formattedPhone}`);

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp_hash = await bcrypt.hash(otp, 10);
      console.log(`[SIGNUP] OTP generated, storing in database...`);
      
      // Store OTP verification
      const { error: otpError } = await supabase.from("otp_verifications").insert({
        phone: formattedPhone,
        otp_hash: otp_hash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0
      });

      if (otpError) {
        console.error("[SIGNUP] Supabase OTP insert error:", otpError);
        return NextResponse.json({ error: "Failed to store verification code" }, { status: 500 });
      }
      console.log(`[SIGNUP] OTP stored successfully, sending via Twilio WhatsApp...`);

      const twilioClient = twilio(twilioSid, twilioToken);
      const toNumber = `whatsapp:${formattedPhone}`;
      try {
        const message = await twilioClient.messages.create({
          from: 'whatsapp:+14155238886', // SANDBOX ONLY
          to: toNumber,
          body: `Your Neerzy verification code is ${otp}. This code expires in 10 minutes.`,
        });

        console.log(`[SIGNUP] ✅ Sandbox WhatsApp OTP sent. SID: ${message.sid}`);
        return NextResponse.json({ message: "OTP sent via WhatsApp" });
      } catch (waErr: any) {
        console.error(`[SIGNUP] ❌ WhatsApp OTP failed:`, waErr.message);
        return NextResponse.json({ 
          error: "Failed to send WhatsApp OTP",
          details: waErr.message 
        }, { status: 500 });
      }
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

      return NextResponse.json({ message: "Account created. Please verify your email." });
    }

    if (method === "google") {
      // Lazy-import to avoid initialization crash when Google credentials aren't set
      const { OAuth2Client } = await import("google-auth-library");
      const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      const ticket = await oauth2Client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
      }

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

    return NextResponse.json({ error: "Invalid signup method" }, { status: 400 });

  } catch (error: any) {
    console.error("[SIGNUP] ❌ Error:", error?.message || error);
    console.error("[SIGNUP] Stack:", error?.stack);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

