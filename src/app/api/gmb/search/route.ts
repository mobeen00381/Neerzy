import { NextResponse } from 'next/server';
import { guardPublicRequest, SEARCH_LIMIT } from '@/lib/api-guard';
import { getCached, searchCacheKey, setCached, SEARCH_CACHE_MS } from '@/lib/places-cache';

/**
 * GMB business search (new Places API, PK region). Public and unauthenticated —
 * guarded with SEARCH_LIMIT and memoised 24h per identical query.
 */
const TOO_MANY_SEARCHES =
  'Too many business searches from this device — please wait a few minutes and try again.';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json({ results: [] });
    }

    // Rate limit BEFORE the paid Google call.
    const guard = await guardPublicRequest(req, 'gmb:search', SEARCH_LIMIT, TOO_MANY_SEARCHES);
    if (!guard.allowed) return guard.response;

    const cacheKey = searchCacheKey('gmb:search', query);
    const cached = getCached<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Use NEW Places API with proper field mask
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.photos,places.types,places.googleMapsUri'
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: 'en',
          // Trades are PURE SERVICE-AREA businesses (no shop front, they work
          // at the customer's address) and Google's Text Search EXCLUDES those
          // by default — real listings came back as "no results" while Google
          // Maps showed them. This flag includes them.
          includePureServiceAreaBusinesses: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(`Places API error (HTTP ${response.status}):`, data);
      return NextResponse.json({ results: [], error: data.error?.message }, { status: response.status });
    }

    // Format results EXACTLY like Localo
    const results = (data.places || []).map((place: any) => ({
      placeId: place.id,
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || '',
      phone: place.nationalPhoneNumber || '',
      website: place.websiteUri || '',
      rating: place.rating || null,
      reviewCount: place.userRatingCount || 0,
      types: place.types || [],
      hasPhotos: place.photos?.length > 0,
      photoUrl: place.photos?.length > 0 
        ? `/api/places/photo?name=${encodeURIComponent(place.photos[0].name)}&w=100` 
        : null,
      googleMapsUrl: place.googleMapsUri || '',
      // Extract business type from types
      businessType: place.types?.find((t: string) => !t.includes('point_of_interest')) || 'business'
    }));

    const payload = {
      results,
      status: 'OK'
    };
    // Only memoise a page that actually has results (see places-cache).
    if (results.length > 0) setCached(cacheKey, payload, SEARCH_CACHE_MS);
    return NextResponse.json(payload);

  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
