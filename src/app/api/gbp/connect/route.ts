import { createClient } from '@supabase/supabase-js';
import { after, NextResponse } from 'next/server';
import { syncWebsitePhotosForUser } from '@/lib/website-builder';
import { saveBusinessProfileForUser } from '@/lib/business-profile';
import { sendWelcomeEmailForUser } from '@/lib/onboarding-emails';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // ── Identity comes from the caller's Supabase ACCESS TOKEN, never from the
    // request body. The onboarding page sends `Authorization: Bearer <token>`.
    // A body-supplied `userId` is just an unverified uuid: trusting it would let
    // anyone write another account's business profile - and, since the welcome
    // email below, trigger that account's email too.
    const accessToken = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
    if (!accessToken) {
      return NextResponse.json({ error: 'Please sign in again and retry.' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Please sign in again and retry.' }, { status: 401 });
    }

    // The ONLY user id this request may touch from here on.
    const connectedUserId = authData.user.id;

    const data = await req.json();

    let targetPhone = data.phone;
    if (!targetPhone && connectedUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', connectedUserId)
        .maybeSingle();
      if (profile?.phone) {
        targetPhone = profile.phone;
      }
    }

    // Email/Google signup is the primary flow, so a missing WhatsApp number is
    // NO LONGER an error: the profile is owned by user_id and the number is
    // attached later, if and when the user connects WhatsApp from the
    // dashboard. Only an account with neither key can't be saved.
    if (!connectedUserId && !targetPhone) {
      return NextResponse.json(
        { error: 'We could not tell which account this business belongs to. Please sign in again and retry.' },
        { status: 400 }
      );
    }

    console.log(
      `🔗 Connecting business listing: "${data.businessName}" ` +
        `(owner: ${connectedUserId ? `user ${connectedUserId}` : `phone ${targetPhone}`})`
    );

    // Owner key: user_id when we have it (works with no phone at all), phone
    // only as the legacy fallback.
    const saveResult = await saveBusinessProfileForUser(supabase, connectedUserId, targetPhone, {
      business_name: data.businessName,
      address: data.address,
      category: data.category,
      google_place_id: data.googlePlaceId,
      google_maps_url: data.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${data.googlePlaceId}`,
      review_link: `https://search.google.com/local/writereview?placeid=${data.googlePlaceId}`,
      created_at: new Date().toISOString()
    });

    if (!saveResult.ok) {
      console.error('Database error:', saveResult.error);
      // If the Phase A migration has not been applied yet, say so in plain
      // language instead of leaking a raw column error to the visitor.
      const migrationPending =
        /user_id/i.test(saveResult.error) && /column|does not exist/i.test(saveResult.error);
      return NextResponse.json(
        {
          error: migrationPending
            ? 'Business profiles are being upgraded right now. Please try again in a few minutes.'
            : 'Failed to save profile',
        },
        { status: 500 }
      );
    }

    console.log(`✅ Business profile saved (keyed by ${saveResult.keyedBy})`);

    let existingProfile: any = null;

    // Sync the business details with the user's Auth metadata (bulletproof source of truth)
    if (connectedUserId) {
      // Fetch the existing profile first so we never reset the one-time trial.
      const { data: fetchedProfile } = await supabase
        .from('profiles')
        .select('id, trial_started_at, created_at')
        .eq('id', connectedUserId)
        .maybeSingle();
      existingProfile = fetchedProfile;

      try {
        await supabase.auth.admin.updateUserById(connectedUserId, {
          user_metadata: {
            ...(targetPhone ? { phone: targetPhone } : {}),
            business_name: data.businessName,
            gbp_connected: true,
            gbp_connected_at: new Date().toISOString(),
            onboarded_at: new Date().toISOString(),
            trial_started_at: existingProfile?.trial_started_at || new Date().toISOString()
          }
        });
        console.log(`✅ Successfully updated auth user_metadata for user: ${connectedUserId}`);
      } catch (authMetaErr) {
        console.error('❌ Failed to update auth user_metadata:', authMetaErr);
      }
    }

    // Sync with profiles table — this is CRITICAL for trial_started_at and plan tracking
    if (connectedUserId) {
      // Reuse the profile already fetched above (trial_started_at preserved).
      const profilePayload: Record<string, any> = {
        id: connectedUserId,
        business_name: data.businessName,
        // Only when a WhatsApp number exists — writing null here would erase a
        // number that was linked later.
        ...(targetPhone ? { phone: targetPhone } : {}),
        selected_plan: data.plan || 'free',
        gbp_connected: true,
        gbp_connected_at: new Date().toISOString(),
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Only set trial_started_at on FIRST creation (never overwrite existing)
      if (!existingProfile) {
        profilePayload.trial_started_at = new Date().toISOString();
        profilePayload.created_at = new Date().toISOString();
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileUpdateError) {
        // This IS a real error — log it visibly so we know profiles table has issues
        console.error('❌ CRITICAL: Failed to upsert profiles table for user', connectedUserId, ':', profileUpdateError.message);
        // Don't block the response — the auth metadata fallback still works
      } else {
        console.log(`✅ Successfully upserted profile ID: ${connectedUserId} in profiles table (trial_started_at: ${existingProfile ? 'preserved' : 'set to now'})`);
      }
    } else {
      // Fallback: Attempt to sync via logged-in user session if userId was not provided in the payload
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch existing profile first so we never reset the one-time trial.
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, trial_started_at, created_at')
            .eq('id', user.id)
            .maybeSingle();

          // Update metadata via admin (preserve original trial start)
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...(targetPhone ? { phone: targetPhone } : {}),
              business_name: data.businessName,
              gbp_connected: true,
              gbp_connected_at: new Date().toISOString(),
              onboarded_at: new Date().toISOString(),
              trial_started_at: existingProfile?.trial_started_at || new Date().toISOString()
            }
          });

          const profilePayload: Record<string, any> = {
            id: user.id,
            business_name: data.businessName,
            phone: targetPhone,
            selected_plan: data.plan || 'free',
            gbp_connected: true,
            gbp_connected_at: new Date().toISOString(),
            onboarded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          if (!existingProfile) {
            profilePayload.trial_started_at = new Date().toISOString();
            profilePayload.created_at = new Date().toISOString();
          }

          const { error: fallbackProfileError } = await supabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' });

          if (fallbackProfileError) {
            console.error('❌ CRITICAL: Failed to upsert profiles table in fallback path for user', user.id, ':', fallbackProfileError.message);
          } else {
            console.log('✅ Synchronized public profile via fallback auth session upsert.');
          }
        }
      } catch (profileErr) {
        console.error('❌ CRITICAL: Fallback public profile sync failed:', profileErr);
      }
    }

    // ── Photo re-sync: now that Google Business Profile is connected, swap the
    // template placeholders for the trader's REAL Google photos. Fire-and-forget
    // so the connect response is never delayed (and nothing to sync → no-op).
    if (connectedUserId) {
      void syncWebsitePhotosForUser(connectedUserId).catch((e: any) =>
        console.warn('⚠️ [GBP Connect] photo sync failed:', e?.message || e)
      );
    }

    // ── Welcome email: sent ONCE, on the first successful connect.
    // after() runs it past the response so the visitor is never kept waiting.
    // Exactly-once lives in lib/onboarding-emails.ts (a conditional-UPDATE
    // claim), so a reconnect - or a double submit - sends nothing at all.
    after(() => sendWelcomeEmailForUser(supabase, connectedUserId, { businessName: data.businessName }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
