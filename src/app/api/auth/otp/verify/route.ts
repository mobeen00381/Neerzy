import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 });
    }

    // 1. Verify OTP in database
    const { data: otpData, error: otpError } = await supabase
      .from("otps")
      .select("*")
      .eq("phone", phone.replace(/\s+/g, ''))
      .eq("code", code)
      .single();

    if (otpError || !otpData) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Check expiry
    if (new Date(otpData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code has expired" }, { status: 400 });
    }

    // 2. Clear OTP
    await supabase.from("otps").delete().eq("phone", phone.replace(/\s+/g, ''));

    // 3. Find or Create User
    // We check if a user with this whatsapp_phone exists
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("whatsapp_phone", phone.replace(/\s+/g, ''))
      .single();

    if (userError || !user) {
      // Create new user if not exists (Auto-registration)
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ 
          whatsapp_phone: phone.replace(/\s+/g, ''),
          role: "customer",
          business_name: "My New Business" // Placeholder
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      user = newUser;
    }

    // 4. Generate a Session/Token for the client
    // In a real app, you'd use Supabase Admin Auth to create a session or return a JWT
    // For this MVP, we return the user profile and let the client handle the "session" 
    // (though in production you MUST use proper auth tokens)
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        businessName: user.business_name
      }
    });

  } catch (error: any) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
