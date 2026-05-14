import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { businessName, address, userId } = await req.json();

    if (!businessName) {
      return NextResponse.json({ error: 'Missing business name' }, { status: 400 });
    }

    // 1. Call Google Places API (New v1 Search Text)
    const query = `${businessName} ${address || ''}`;
    const placesRes = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.photos'
        },
        body: JSON.stringify({ textQuery: query })
      }
    );

    const placesData = await placesRes.json();
    const place = placesData.places?.[0];

    if (!place) {
      return NextResponse.json({ error: 'Business not found on Google' }, { status: 404 });
    }

    // 2. Calculate Health Score
    const missingItems = [];
    let score = 0;

    if (place.photos?.length > 0) score += 20; else missingItems.push('photos');
    if (place.websiteUri) score += 20; else missingItems.push('website');
    if (place.nationalPhoneNumber) score += 20; else missingItems.push('phone');
    if (place.rating && place.userRatingCount >= 5) score += 20; else missingItems.push('reviews');
    if (place.formattedAddress) score += 20; else missingItems.push('address');

    // 3. Save to Supabase jobs table
    // Note: This assumes the jobs table has been updated with these GMB columns
    // 3. Save to Supabase jobs table if userId is present
    if (userId) {
      const { error: dbError } = await supabase.from('jobs').insert({
        user_id: userId,
        plan_tier: 'starter',
        status: 'gmb_checked',
        title: `GMB Check: ${businessName}`,
        gmb_place_id: place.id,
        gmb_business_name: place.displayName?.text,
        gmb_address: place.formattedAddress,
        gmb_phone: place.nationalPhoneNumber,
        gmb_website: place.websiteUri,
        gmb_rating: place.rating,
        gmb_review_count: place.userRatingCount,
        gmb_health_score: score,
        gmb_missing_items: missingItems,
        content: JSON.stringify({ missingItems, score })
      });

      if (dbError) {
        console.error('DB Error:', dbError);
        // We don't throw here to avoid failing the search if DB save fails
      }
    }

    return NextResponse.json({
      success: true,
      placeId: place.id,
      healthScore: score,
      missingItems,
      rating: place.rating,
      reviewCount: place.userRatingCount,
      nextSteps: missingItems.length === 0 ? 'generate_post' : 'optimize_profile'
    });

  } catch (error) {
    console.error('GMB Check Error:', error);
    return NextResponse.json({ error: 'Failed to check GMB listing' }, { status: 500 });
  }
}
