import { NextResponse } from 'next/server';
import { guardPublicRequest, SEARCH_LIMIT } from '@/lib/api-guard';
import { getCached, searchCacheKey, setCached, SEARCH_CACHE_MS } from '@/lib/places-cache';

/**
 * Onboarding "find your business" lookup. Public and unauthenticated, so it gets
 * the same SEARCH_LIMIT guard + 24h query memo as the other search routes.
 */
const TOO_MANY_SEARCHES =
  'Too many business searches from this device — please wait a few minutes and try again.';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 🎭 MOCK MODE: Return realistic mock data for testing
    if (!apiKey || process.env.NODE_ENV === 'development') {
      const mockResults = [
        {
          placeId: `mock_${Date.now()}_1`,
          name: query,
          displayName: { text: query },
          formatted_address: '123 Main Street, Your City',
          types: ['establishment', 'point_of_interest'],
          googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(query)}`
        },
        {
          placeId: `mock_${Date.now()}_2`,
          name: `${query} - Branch`,
          displayName: { text: `${query} - Branch` },
          formatted_address: '456 Oak Avenue, Your City',
          types: ['establishment'],
          googleMapsUri: `https://maps.google.com/?q=${encodeURIComponent(query + ' branch')}`
        }
      ];
      return NextResponse.json({ places: mockResults, count: mockResults.length, mode: 'mock' });
    }

    // Rate limit BEFORE the paid Google call (mock mode above costs nothing).
    const guard = await guardPublicRequest(req, 'onboarding:search-gbp', SEARCH_LIMIT, TOO_MANY_SEARCHES);
    if (!guard.allowed) return guard.response;

    const cacheKey = searchCacheKey('onboarding:search-gbp', String(query || ''));
    const cached = getCached<any[]>(cacheKey);
    if (cached) return NextResponse.json({ places: cached, count: cached.length });

    // 🌍 REAL GOOGLE API CALL
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ error: data.error_message || data.status, places: [] }, { status: res.status });
    }

    // Transform to our format + include types for category
    const places = data.results.map((result: any) => ({
      placeId: result.place_id,
      name: result.name,
      displayName: { text: result.name },
      formatted_address: result.formatted_address,
      formattedAddress: result.formatted_address,
      types: result.types || [],
      googleMapsUri: `https://maps.google.com/?q=${result.place_id}`
    }));

    // Only memoise a page that actually has results (see places-cache).
    if (places.length > 0) setCached(cacheKey, places, SEARCH_CACHE_MS);
    return NextResponse.json({ places, count: places.length });

  } catch (error: any) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: error.message, places: [] }, { status: 500 });
  }
}
