import { NextResponse } from "next/server";
import { oauth2Client } from "@/lib/google-auth";
import { createClient } from "@supabase/supabase-js";

// Init server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateUserId = url.searchParams.get("state"); // This is the userId

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log("✅ Google Auth Successful. Refresh Token Received.");
    
    if (stateUserId && tokens.refresh_token) {
      console.log(`Locking token to User ID: ${stateUserId}`);
      // Save 'tokens.refresh_token' to your database associated with the user
      const { error } = await supabase
        .from("users")
        .update({ gmb_refresh_token: tokens.refresh_token })
        .eq("id", stateUserId);
        
      if (error) {
        console.error("❌ Failed to update Supabase with Google token:", error);
      }
    } else {
      console.warn("⚠️ No stateUserId or refresh_token received.");
    }
    
    // Redirect back to dashboard with success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gmb=connected`);
  } catch (error: any) {
    console.error("Google Callback Error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`);
  }
}
