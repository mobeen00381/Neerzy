import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { encrypt, decrypt } from "./encryption";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gbp/callback`
);

/**
 * Ensures a valid Google Business Profile access token for a given user.
 * Refreshes the token automatically if it is expired or close to expiry.
 */
export async function refreshGBPToken(userId: string) {
  try {
    // 1. Fetch connection details
    const { data: conn, error: fetchError } = await supabase
      .from("gbp_connections")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (fetchError || !conn) {
      throw new Error(`No GBP connection found for user: ${userId}`);
    }

    // 2. Check if token is still valid (with a 5-minute buffer)
    const expiryDate = new Date(conn.token_expires_at);
    const now = new Date();
    const buffer = 5 * 60 * 1000; // 5 minutes

    if (now.getTime() < expiryDate.getTime() - buffer) {
      return conn.access_token;
    }

    // 3. Token is expired or expiring soon, refresh via Google OAuth
    if (!conn.refresh_token) {
      throw new Error(`No refresh token available for user: ${userId}`);
    }

    const decryptedRefreshToken = decrypt(conn.refresh_token);
    oauth2Client.setCredentials({ refresh_token: decryptedRefreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();

    // 4. Update the database with the new access token and expiry
    const newExpiry = credentials.expiry_date 
      ? new Date(credentials.expiry_date).toISOString() 
      : new Date(Date.now() + 3600000).toISOString();

    const { error: updateError } = await supabase
      .from("gbp_connections")
      .update({
        access_token: encrypt(credentials.access_token || ""),
        token_expires_at: newExpiry,
      })
      .eq("id", conn.id);

    if (updateError) throw updateError;

    console.log(`✅ GBP Token refreshed for user: ${userId}`);
    return credentials.access_token;

  } catch (error: any) {
    console.error("GBP Token Refresh Error:", error);
    throw error;
  }
}
