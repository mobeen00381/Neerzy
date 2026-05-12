import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
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

    // Force WhatsApp delivery via template
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER || '';
    const formattedPhone = phone.replace(/\s+/g, '');
    const toNumber = `whatsapp:${formattedPhone}`;
    const contentSid = process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID;

    if (!contentSid) {
      return NextResponse.json({ error: "WhatsApp template not configured" }, { status: 500 });
    }

    try {
      const message = await twilioClient.messages.create({
        from: twilioFrom,
        to: toNumber,
        contentSid: contentSid,
        contentVariables: JSON.stringify({ "1": otpCode }),
      });
      console.log(`✅ WhatsApp OTP sent to ${toNumber}. SID: ${message.sid}`);
      return NextResponse.json({ success: true, sid: message.sid });
    } catch (waErr: any) {
      console.error(`❌ WhatsApp OTP failed for ${toNumber}:`, waErr.message);
      return NextResponse.json({ 
        error: "Failed to send WhatsApp OTP", 
        details: waErr.message 
      }, { status: 500 });
    }


    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
