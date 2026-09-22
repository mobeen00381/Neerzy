import { NextResponse } from 'next/server';
import { guardPublicRequest, DETAIL_LIMIT } from '@/lib/api-guard';
import { detailCacheKey, getCached, setCached, DETAIL_CACHE_MS } from '@/lib/places-cache';

/**
 * Place-details health score for one listing — the expensive follow-up after a
 * search, not autocomplete. Guarded with DETAIL_LIMIT (5/hour per IP, then a
 * 1-hour block); the raw place payload is memoised for 10 minutes so reloading
 * a report doesn't re-bill Google.
 */
const TOO_MANY_AUDITS =
  'Too many audits from this device — please try again later.';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placeId = searchParams.get('placeId');

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID required' }, { status: 400 });
    }

    // Rate limit BEFORE the paid Google call.
    const guard = await guardPublicRequest(req, 'gmb:audit', DETAIL_LIMIT, TOO_MANY_AUDITS);
    if (!guard.allowed) return guard.response;

    // Fetch place details (10-minute memo — review counts move slowly)
    const cacheKey = detailCacheKey('gmb:audit', placeId);
    let place = getCached<any>(cacheKey);

    if (!place) {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          headers: {
            'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,photos,types,openingHours'
          }
        }
      );

      place = await response.json();
      setCached(cacheKey, place, DETAIL_CACHE_MS);
    }

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
