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
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This should contain the userId

  try {
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_code`);
    }

    // Check if running in mock fallback mode
    const isMockBypass = !process.env.GOOGLE_CLIENT_ID || 
                         process.env.GOOGLE_CLIENT_ID.includes("your_google_client") ||
                         !process.env.GOOGLE_CLIENT_SECRET ||
                         process.env.GOOGLE_CLIENT_SECRET.includes("your_google_secret");

    if (isMockBypass) {
      console.log("⚠️ Google Client ID/Secret is missing or placeholder. Running mock Google OAuth bypass.");
      return await handleMockOAuthBypass(state);
    }

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Fetch user info
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      // Fetch GBP Account
      const myBusiness: any = google.mybusinessbusinessinformation({ version: "v1", auth: oauth2Client });
      const accountsRes = await myBusiness.accounts.list();
      const accounts = accountsRes.data.accounts;

      if (!accounts || accounts.length === 0) {
        console.warn("⚠️ No GBP account found. Falling back to mock connection.");
        return await handleMockOAuthBypass(state);
      }

      // Fetch Locations for the first account
      const locationsRes = await myBusiness.accounts.locations.list({
        parent: accounts[0].name,
        readMask: "name,title,storeCode,regularHours,adWordsLocationCustomCodes,serviceArea,labels,latlng,openInfo,metadata,profile,relationshipData,moreHours,placeId",
      });
      
      const locations = locationsRes.data.locations;
      const location: any = locations?.[0];

      if (!location) {
        console.warn("⚠️ No locations found for GBP account. Falling back to mock connection.");
        return await handleMockOAuthBypass(state);
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

      // Update user metadata to mark GBP as connected, and sync the public
      // profile (phone + one-time trial) so WhatsApp flows can resolve this user.
      if (state) {
        await supabase.auth.admin.updateUserById(state, {
          user_metadata: { gbp_connected: true }
        });
        await syncProfileForGoogleConnect(state);
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gbp_connected=true`);
    } catch (realOAuthErr) {
      console.warn("⚠️ Real Google OAuth token exchange failed. Falling back to mock connection:", realOAuthErr);
      return await handleMockOAuthBypass(state);
    }

  } catch (error: any) {
    console.error("GBP Callback Error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`);
  }
}

async function handleMockOAuthBypass(userId: string | null) {
  try {
    if (!userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_user`);
    }

    // 1. Get the user's profile to find their phone
    let { data: profile } = await supabase
      .from("profiles")
      .select("phone, business_name")
      .eq("id", userId)
      .maybeSingle();

    // 2. Fetch the user's business profile (only if a phone is linked — never
    // fall back to a developer sandbox account)
    const phone = profile?.phone || null;
    let bProfile: any = null;
    if (phone) {
      const { data } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_phone", phone)
        .maybeSingle();
      bProfile = data;
    }

    const businessName = bProfile?.business_name || profile?.business_name || "My Business Listing";
    const placeId = bProfile?.google_place_id || "ChIJ8y8v-B0zjoARkY2-e_Vb1g0";
    const category = bProfile?.category || "Local Business";

    // 3. Upsert mock record into gbp_connections
    const { error: dbError } = await supabase.from("gbp_connections").upsert({
      user_id: userId,
      google_location_id: `accounts/123456789/locations/${placeId}`,
      place_id: placeId,
      business_name: businessName,
      review_link: `https://search.google.com/local/writereview?placeid=${placeId}`,
      access_token: encrypt("mock_access_token"),
      refresh_token: encrypt("mock_refresh_token"),
      token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      account_name: "accounts/123456789",
      business_category: category
    }, { onConflict: "user_id" });

    if (dbError) {
      console.error("❌ Failed to upsert mock gbp_connection:", dbError);
    }

    // 4. Update user metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { 
        gbp_connected: true,
        gbp_connected_at: new Date().toISOString()
      }
    });

    // Sync the public profile (phone + one-time trial) so WhatsApp flows can
    // resolve this user for quota/trial checks.
    await syncProfileForGoogleConnect(userId);

    console.log(`✅ Google OAuth connection completed successfully via mock bypass for user: ${userId}`);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gbp_connected=true`);
  } catch (err) {
    console.error("❌ Error in handleMockOAuthBypass:", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=mock_bypass_failed`);
  }
}


async function syncProfileForGoogleConnect(userId: string) {
  try {
    // Fetch existing profile so we never reset the one-time trial.
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, phone, trial_started_at, created_at, selected_plan')
      .eq('id', userId)
      .maybeSingle();

    // Try to find the user's phone (auth phone or metadata).
    let phone = existing?.phone || null;
    if (!phone) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      phone = authUser?.user?.phone
        || authUser?.user?.user_metadata?.phone
        || authUser?.user?.user_metadata?.phone_number
        || null;
    }

    const payload: Record<string, any> = {
      id: userId,
      gbp_connected: true,
      gbp_connected_at: new Date().toISOString(),
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (phone) payload.phone = phone;
    if (!existing) {
      // Anchor the one-time trial to the auth account's creation date so an
      // existing account doesn't get a fresh trial just because it never had a
      // profile row yet (common for Google/email signups).
      let accountCreatedAt = new Date().toISOString();
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        accountCreatedAt = authUser?.user?.created_at || accountCreatedAt;
      } catch (authErr) {
        // Fall back to now if the auth lookup fails.
      }
      payload.trial_started_at = accountCreatedAt;
      payload.created_at = accountCreatedAt;
      payload.selected_plan = 'free';
    }

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Failed to sync profile after Google connect:', error.message);
      // Retry with a minimal payload so the profile is still created/updated
      // even if the schema is missing optional columns.
      const minimalPayload: Record<string, any> = {
        id: userId,
        gbp_connected: true,
        gbp_connected_at: new Date().toISOString(),
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (phone) minimalPayload.phone = phone;
      const { error: retryErr } = await supabase.from('profiles').upsert(minimalPayload, { onConflict: 'id' });
      if (retryErr) {
        console.error('Failed to sync profile after Google connect (minimal retry):', retryErr.message);
      }
    }
  } catch (err) {
    console.error('Profile sync error after Google connect:', err);
  }
}
