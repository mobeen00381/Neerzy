import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store in Supabase
    const { error: dbError } = await supabase
      .from("otps")
      .upsert({ 
        phone: phone.replace(/\s+/g, ''), 
        code: otpCode, 
        expires_at: expiresAt 
      }, { onConflict: 'phone' });

    if (dbError) {
      console.error("Supabase OTP Store Error:", dbError);
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    // Send via Twilio WhatsApp
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `whatsapp:${phone.replace(/\s+/g, '')}`,
      body: `Your Neerzy verification code is: ${otpCode}. It expires in 10 minutes.`
    });

    console.log(`✅ OTP sent to ${phone}: ${otpCode}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
