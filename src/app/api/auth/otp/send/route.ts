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

    // Strategy: try SMS first (no messaging window restriction), then WhatsApp template
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER || '';
    const smsNumber = process.env.TWILIO_SMS_NUMBER || twilioFrom.replace(/^whatsapp:/, '');
    const formattedPhone = phone.replace(/\s+/g, '');
    
    let message;
    try {
      message = await twilioClient.messages.create({
        from: smsNumber,
        to: formattedPhone,
        body: `Your Neerzy verification code is: ${otpCode}. It expires in 10 minutes.`
      });
      console.log(`✅ OTP sent via SMS to ${formattedPhone}. SID: ${message.sid}`);
    } catch (smsErr: any) {
      console.warn(`⚠️ SMS failed (${smsErr?.code || smsErr?.message}), trying WhatsApp...`);
      
      const contentSid = process.env.TWILIO_WHATSAPP_OTP_TEMPLATE_SID;
      const waFrom = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
      
      if (contentSid) {
        message = await twilioClient.messages.create({
          from: waFrom,
          to: `whatsapp:${formattedPhone}`,
          contentSid: contentSid,
          contentVariables: JSON.stringify({ "1": otpCode }),
        });
      } else {
        // Free-form fallback (may fail with 63016 outside messaging window)
        message = await twilioClient.messages.create({
          from: waFrom,
          to: `whatsapp:${formattedPhone}`,
          body: `Your Neerzy verification code is: ${otpCode}. It expires in 10 minutes.`
        });
      }
      console.log(`✅ OTP sent via WhatsApp to ${formattedPhone}. SID: ${message!.sid}`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
