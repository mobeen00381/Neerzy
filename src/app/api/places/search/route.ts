import { NextResponse } from 'next/server';
import { guardPublicRequest, SEARCH_LIMIT } from '@/lib/api-guard';
import { getCached, searchCacheKey, setCached, SEARCH_CACHE_MS } from '@/lib/places-cache';

/**
 * Autocomplete lookup for the dashboard GMB checker — same call pattern and
 * limits as /api/audit/search: SEARCH_LIMIT (30/min, then a 1-hour block) plus
 * a 24h memo per identical query so repeats never reach Google again.
 */
const TOO_MANY_SEARCHES =
  'Too many business searches from this device — please wait a few minutes and try again.';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('CRITICAL: GOOGLE_PLACES_API_KEY is missing from environment');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Rate limit BEFORE the paid Google call.
    const guard = await guardPublicRequest(req, 'places:search', SEARCH_LIMIT, TOO_MANY_SEARCHES);
    if (!guard.allowed) return guard.response;

    const cacheKey = searchCacheKey('places:search', query);
    const cached = getCached<any>(cacheKey);
    if (cached) return NextResponse.json(cached);

    // Call Google Places API - New v1 Search Text (More reliable for modern keys)
    const res = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types'
        },
        body: JSON.stringify({ textQuery: query })
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error('Places API Error:', data.error);
      return NextResponse.json({ results: [] }, { status: 500 });
    }

    // Format results for autocomplete
    const results = (data.places || []).map((place: any) => ({
      placeId: place.id,
      name: place.displayName?.text,
      address: place.formattedAddress,
      rating: place.rating || null,
      reviewCount: place.userRatingCount || 0,
      types: place.types || []
    }));

    const payload = { results, status: data.status };
    // Only memoise a page that actually has results (see places-cache).
    if (results.length > 0) setCached(cacheKey, payload, SEARCH_CACHE_MS);
    return NextResponse.json(payload);

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
