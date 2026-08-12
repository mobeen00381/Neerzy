import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMetaText } from "@/lib/whatsapp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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

    // Send OTP via Meta WhatsApp
    const formattedPhone = phone.replace(/\s+/g, '');
    try {
      const result = await sendMetaText({
        to: formattedPhone,
        body: `Your Neerzy verification code is ${otpCode}. This code expires in 10 minutes.`,
      });
      console.log(`✅ Meta WhatsApp OTP sent to ${formattedPhone}. ID: ${result.messages?.[0]?.id}`);
      return NextResponse.json({ success: true, messageId: result.messages?.[0]?.id });
    } catch (waErr: any) {
      console.error(`❌ WhatsApp OTP failed for ${formattedPhone}:`, waErr.message);
      return NextResponse.json({ 
        error: "Failed to send WhatsApp OTP", 
        details: waErr.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
