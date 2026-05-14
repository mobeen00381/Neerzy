import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID required' }, { status: 400 });
    }

    // Fetch place details
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,photos,types,openingHours'
        }
      }
    );

    const place = await response.json();

    // Calculate health score
    const missingItems = [];
    let score = 0;

    if (place.photos?.length > 0) score += 20; else missingItems.push('photos');
    if (place.websiteUri) score += 20; else missingItems.push('website');
    if (place.nationalPhoneNumber) score += 20; else missingItems.push('phone number');
    if (place.rating && place.userRatingCount >= 5) score += 20; else missingItems.push('reviews (need 5+)');
    if (place.formattedAddress) score += 20; else missingItems.push('complete address');

    return NextResponse.json({
      healthScore: score,
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      missingItems,
      place
    });

  } catch (error) {
    console.error('Audit Error:', error);
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
  }
}
