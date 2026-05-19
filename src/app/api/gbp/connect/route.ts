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

    // Attempt to sync the business name with the logged-in user profile if available, for dashboard rendering
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            business_name: data.businessName,
            company_name: data.businessName,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        console.log('✅ Synchronized public profile with business name.');
      }
    } catch (profileErr) {
      console.warn('⚠️ Public profile sync skipped or failed.', profileErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Connect error:', error);
    return NextResponse.json({ error: 'Failed to connect' }, { status: 500 });
  }
}
