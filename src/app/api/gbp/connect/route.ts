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
      targetPhone = '+923056500917';
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
        google_maps_url: data.googleMapsUrl || `https://search.google.com/local/dashboard?q=place_id:${data.googlePlaceId}`,
        review_link: `https://search.google.com/local/writereview?placeid=${data.googlePlaceId}`,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_phone' });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    // Sync the business details with the user's Auth metadata (bulletproof source of truth)
    if (data.userId) {
      try {
        await supabase.auth.admin.updateUserById(data.userId, {
          user_metadata: {
            phone: targetPhone,
            business_name: data.businessName,
            gbp_connected: true,
            gbp_connected_at: new Date().toISOString(),
            onboarded_at: new Date().toISOString()
          }
        });
        console.log(`✅ Successfully updated auth user_metadata for user: ${data.userId}`);
      } catch (authMetaErr) {
        console.error('❌ Failed to update auth user_metadata:', authMetaErr);
      }
    }

    // Try to sync with profiles table, but catch errors to prevent blocking setups
    if (data.userId) {
      try {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .upsert({
            id: data.userId,
            business_name: data.businessName,
            phone: targetPhone,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (profileUpdateError) {
          console.warn('⚠️ profiles table sync warning (can ignore if columns are missing):', profileUpdateError.message);
        } else {
          console.log(`✅ Successfully upserted profile ID: ${data.userId} in profiles table`);
        }
      } catch (profileErr) {
        console.warn('⚠️ Skip public profiles table update:', profileErr);
      }
    } else {
      // Fallback: Attempt to sync via logged-in user session if userId was not provided in the payload
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Update metadata via admin
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
              phone: targetPhone,
              business_name: data.businessName,
              gbp_connected: true,
              gbp_connected_at: new Date().toISOString(),
              onboarded_at: new Date().toISOString()
            }
          });
          
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              business_name: data.businessName,
              phone: targetPhone,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
          console.log('✅ Synchronized public profile via fallback auth session upsert.');
        }
      } catch (profileErr) {
        console.warn('⚠️ Fallback public profile sync skipped.', profileErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
