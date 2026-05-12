import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { encrypt } from "@/lib/encryption";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gbp/callback`
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This should contain the userId

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/welcome?error=missing_code`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch user info
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    // Fetch GBP Account
    const myBusiness = google.mybusinessbusinessinformation({ version: "v1", auth: oauth2Client });
    const accountsRes = await myBusiness.accounts.list();
    const accounts = accountsRes.data.accounts;

    if (!accounts || accounts.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/welcome?error=no_gbp_account`);
    }

    // Fetch Locations for the first account
    const locationsRes = await myBusiness.accounts.locations.list({
      parent: accounts[0].name,
      readMask: "name,title,storeCode,regularHours,adWordsLocationCustomCodes,serviceArea,labels,adWordsLocationCustomCodes,latlng,openInfo,metadata,profile,relationshipData,moreHours,placeId",
    });
    
    const locations = locationsRes.data.locations;
    const location = locations?.[0];

    if (!location) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/welcome?error=no_locations`);
    }

    // Store connection in Supabase
    const { error: dbError } = await supabase.from("gbp_connections").upsert({
      user_id: state, // Assuming 'state' was passed from the frontend as the current user's ID
      google_location_id: location.name,
      place_id: location.placeId,
      business_name: location.title,
      review_link: `https://search.google.com/local/writereview?placeid=${location.placeId}`,
      access_token: encrypt(tokens.access_token || ""),
      refresh_token: encrypt(tokens.refresh_token || ""),
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      account_name: accounts[0].name,
      business_category: location.profile?.primaryCategory?.displayName
    }, { onConflict: "user_id" });

    if (dbError) throw dbError;

    // Update user metadata to mark GBP as connected
    if (state) {
      await supabase.auth.admin.updateUserById(state, {
        user_metadata: { gbp_connected: true }
      });
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gbp_connected=true`);

  } catch (error: any) {
    console.error("GBP Callback Error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/welcome?error=callback_failed`);
  }
}
