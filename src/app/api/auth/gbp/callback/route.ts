import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { encrypt } from "@/lib/encryption";
import { pickVerifiedLocation, type ManagedLocation } from "@/lib/gbp-verify";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

/** Which Google credentials are configured well enough to attempt a real flow. */
function hasRealGoogleCredentials(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID || "";
  const secret = process.env.GOOGLE_CLIENT_SECRET || "";
  return (
    id !== "" &&
    !id.includes("your_google_client") &&
    secret !== "" &&
    !secret.includes("your_google_secret")
  );
}

/** A failed OAuth exchange or an empty account may only fake success in dev. */
const isDev = process.env.NODE_ENV !== "production";

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

    // Missing/placeholder credentials: a local-dev convenience, but in
    // production it must be a visible error — never a fake "connected" business.
    if (!hasRealGoogleCredentials()) {
      if (isDev) {
        console.log("⚠️ Google Client ID/Secret is missing or placeholder. Running mock Google OAuth bypass (development only).");
        return await handleMockOAuthBypass(state);
      }
      console.error("❌ Google OAuth credentials are not configured in production.");
      return NextResponse.redirect(`${APP_URL}/dashboard?gbp_error=not_configured`);
    }

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Fetch user info
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      // Fetch every GBP account the connected Google user has access to.
      const myBusiness: any = google.mybusinessbusinessinformation({ version: "v1", auth: oauth2Client });
      const accountsRes = await myBusiness.accounts.list();
      const accounts = accountsRes.data.accounts;

      if (!accounts || accounts.length === 0) {
        console.warn("⚠️ Connected Google account has no GBP account.");
        if (isDev) return await handleMockOAuthBypass(state);
        return NextResponse.redirect(`${APP_URL}/dashboard?gbp_error=no_business_account`);
      }

      // Collect EVERY managed location across ALL accounts. The old code took
      // locations[0] of accounts[0] and silently ignored every other listing,
      // which is how an owner with two listings got the wrong business.
      const managedLocations: ManagedLocation[] = [];
      for (const account of accounts) {
        let pageToken: string | undefined = undefined;
        do {
          const locationsRes: any = await myBusiness.accounts.locations.list({
            parent: account.name,
            pageSize: 100,
            pageToken,
            readMask:
              "name,title,storeCode,regularHours,adWordsLocationCustomCodes,serviceArea,labels,latlng,openInfo,metadata,profile,relationshipData,moreHours,placeId",
          });
          for (const loc of locationsRes.data.locations || []) {
            managedLocations.push({ name: loc.name, title: loc.title, placeId: loc.placeId ?? null });
          }
          pageToken = locationsRes.data.nextPageToken || undefined;
        } while (pageToken);
      }

      // OWNERSHIP CHECK: the business claimed during onboarding must be one this
      // Google account actually manages. Nothing is written until it matches.
      const claimedPlaceId = await getClaimedPlaceId(state);
      const verdict = pickVerifiedLocation(managedLocations, claimedPlaceId);
      console.log(
        `🔍 GBP ownership check: verdict=${verdict.status} managed=${managedLocations.length} claimed=${claimedPlaceId ? "yes" : "no"}`
      );

      if (verdict.status === "no_locations" || verdict.status === "no_locations_claimed") {
        console.warn("⚠️ Connected Google account manages no verifiable locations.");
        if (isDev) return await handleMockOAuthBypass(state);
        return NextResponse.redirect(`${APP_URL}/dashboard?gbp_error=no_business_account`);
      }

      if (verdict.status === "mismatch") {
        // The connected account manages DIFFERENT businesses than the one the
        // user claimed in onboarding: save nothing and let them connect the
        // right account (or fix the claim) instead of pairing silently.
        console.warn("⚠️ GBP ownership mismatch — claimed listing is not managed by the connected account.");
        return NextResponse.redirect(`${APP_URL}/dashboard?gbp_mismatch=1`);
      }

      if (verdict.status === "no_claim_multiple") {
        // Several listings and nothing claimed: we cannot know which one is
        // theirs. A chooser is the follow-up; blocking beats guessing.
        console.warn("⚠️ GBP account manages multiple locations and nothing was claimed during onboarding.");
        return NextResponse.redirect(`${APP_URL}/dashboard?gbp_multiple=1`);
      }

      const location: any = verdict.location;

      // Store connection in Supabase (verified listing only)
      const { error: dbError } = await supabase.from("gbp_connections").upsert({
        user_id: state, // passed from the frontend as the current user's ID
        google_location_id: location.name,
        place_id: location.placeId,
        business_name: location.title,
        review_link: `https://search.google.com/local/writereview?placeid=${location.placeId}`,
        access_token: encrypt(tokens.access_token || ""),
        refresh_token: encrypt(tokens.refresh_token || ""),
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        account_name: String(location.name).split("/locations/")[0],
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
        // Google is the source of truth: replace the unverified onboarding claim
        // with the listing this account provably manages.
        await syncVerifiedListingIntoBusinessProfile(state, location);
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gbp_connected=true`);
    } catch (realOAuthErr) {
      // A failed token exchange must NEVER become a fake verified business —
      // that is how a production account with no Google profile ended up
      // "connected" to a hardcoded placeholder listing.
      console.error("❌ Google OAuth token exchange failed:", realOAuthErr);
      if (isDev) return await handleMockOAuthBypass(state);
      return NextResponse.redirect(`${APP_URL}/dashboard?gbp_error=oauth_failed`);
    }

  } catch (error: any) {
    console.error("GBP Callback Error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=callback_failed`);
  }
}

/**
 * The business the user claimed during onboarding, if any. Read from
 * business_profiles (keyed by the account's phone number) — this is what the
 * OAuth result must match before anything is saved.
 */
async function getClaimedPlaceId(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const phone =
      authUser?.user?.phone ||
      authUser?.user?.user_metadata?.phone ||
      authUser?.user?.user_metadata?.phone_number ||
      null;
    if (!phone) return null;

    const { data } = await supabase
      .from("business_profiles")
      .select("google_place_id")
      .eq("user_phone", phone)
      .maybeSingle();

    return data?.google_place_id || null;
  } catch (err) {
    console.warn("⚠️ Could not read the claimed business:", err);
    return null;
  }
}

/**
 * Once Google has PROVEN ownership, its listing replaces the unverified claim:
 * the user's business name, place id, review link and maps URL become the ones
 * their Google account actually manages, so onboarding and the connected
 * profile can never disagree.
 */
async function syncVerifiedListingIntoBusinessProfile(userId: string, location: ManagedLocation) {
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const phone =
      authUser?.user?.phone ||
      authUser?.user?.user_metadata?.phone ||
      authUser?.user?.user_metadata?.phone_number ||
      null;
    // business_profiles is keyed by phone; without one there is nothing to sync
    // (the gbp_connections row is keyed by user_id and already saved).
    if (!phone || !location.placeId) return;

    const payload: Record<string, unknown> = {
      user_phone: phone,
      business_name: location.title,
      google_place_id: location.placeId,
      review_link: `https://search.google.com/local/writereview?placeid=${location.placeId}`,
      google_maps_url: `https://www.google.com/maps/place/?q=place_id:${location.placeId}`,
      updated_at: new Date().toISOString(),
    };

    const category = (location as any).profile?.primaryCategory?.displayName;
    if (category) payload.category = category;

    const { error } = await supabase
      .from("business_profiles")
      .upsert(payload, { onConflict: "user_phone" });

    if (error) {
      console.error("Failed to sync the verified listing into business_profiles:", error.message);
    } else {
      console.log(`✅ business_profiles now holds the Google-verified listing ${location.placeId}`);
    }
  } catch (err) {
    console.error("Verified-listing sync error:", err);
  }
}

async function handleMockOAuthBypass(userId: string | null) {
  try {
    if (!userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=no_user`);
    }

    // 1. Get the user's profile to find their phone
    const { data: profile } = await supabase
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
