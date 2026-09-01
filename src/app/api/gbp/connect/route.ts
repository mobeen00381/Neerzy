import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    let targetPhone = data.phone;
    if (!targetPhone && data.userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', data.userId)
        .maybeSingle();
      if (profile?.phone) {
        targetPhone = profile.phone;
      }
    }

    if (!targetPhone) {
      return NextResponse.json(
        { error: 'No phone number linked yet. Connect your WhatsApp number first.' },
        { status: 400 }
      );
    }

    console.log(`🔗 Connecting business listing: "${data.businessName}" to phone: "${targetPhone}"`);

    // ✅ Removed user_id - just save the business info using upsert on user_phone to prevent duplicate key crashes
    const { error } = await supabase
      .from('business_profiles')
      .upsert({
        user_phone: targetPhone,
        business_name: data.businessName,
        address: data.address,
        category: data.category,
        google_place_id: data.googlePlaceId,
        google_maps_url: data.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${data.googlePlaceId}`,
        review_link: `https://search.google.com/local/writereview?placeid=${data.googlePlaceId}`,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_phone' });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    let existingProfile: any = null;

    // Sync the business details with the user's Auth metadata (bulletproof source of truth)
    if (data.userId) {
      // Fetch the existing profile first so we never reset the one-time trial.
      const { data: fetchedProfile } = await supabase
        .from('profiles')
        .select('id, trial_started_at, created_at')
        .eq('id', data.userId)
        .maybeSingle();
      existingProfile = fetchedProfile;

      try {
        await supabase.auth.admin.updateUserById(data.userId, {
          user_metadata: {
            phone: targetPhone,
            business_name: data.businessName,
            gbp_connected: true,
            gbp_connected_at: new Date().toISOString(),
            onboarded_at: new Date().toISOString(),
            trial_started_at: existingProfile?.trial_started_at || new Date().toISOString()
          }
        });
        console.log(`✅ Successfully updated auth user_metadata for user: ${data.userId}`);
      } catch (authMetaErr) {
        console.error('❌ Failed to update auth user_metadata:', authMetaErr);
      }
    }

    // Sync with profiles table — this is CRITICAL for trial_started_at and plan tracking
    if (data.userId) {
      // Reuse the profile already fetched above (trial_started_at preserved).
      const profilePayload: Record<string, any> = {
        id: data.userId,
        business_name: data.businessName,
        phone: targetPhone,
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
        console.error('❌ CRITICAL: Failed to upsert profiles table for user', data.userId, ':', profileUpdateError.message);
        // Don't block the response — the auth metadata fallback still works
      } else {
        console.log(`✅ Successfully upserted profile ID: ${data.userId} in profiles table (trial_started_at: ${existingProfile ? 'preserved' : 'set to now'})`);
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
              phone: targetPhone,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
