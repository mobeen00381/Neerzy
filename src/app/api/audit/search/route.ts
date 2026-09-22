import { NextResponse } from 'next/server';
import { guardPublicRequest, SEARCH_LIMIT } from '@/lib/api-guard';
import { getCached, searchCacheKey, setCached, SEARCH_CACHE_MS } from '@/lib/places-cache';

/**
 * Public business-name lookup behind the /gmb-audit-tool hero search.
 *
 * This is live autocomplete: the client fires a request on every typing pause
 * (>= 3 chars, 300ms debounce), so one visitor produces 4-8 calls. Guarded with
 * SEARCH_LIMIT (30/min, then a 1-hour block) and memoised for 24h per identical
 * query — repeating your own business name is the single most common pattern.
 */
const TOO_MANY_SEARCHES =
  'Too many business searches from this device — please wait a few minutes and try again.';

export async function POST(req: Request) {
  try {
    const { query, limit = 15 } = await req.json();
    
    // Use the correct env var names from .env.local
    const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

    // 🎭 MOCK MODE: Only fall back to mock if NO API key is configured at all
    if (!placesApiKey && !mapsApiKey) {
      console.warn('⚠️ No GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY found — returning mock data');
      const mockResults = [
        {
          placeId: `mock_${Date.now()}_1`,
          name: query,
          displayName: { text: query },
          formattedAddress: '123 Main Street, Austin, TX',
          formatted_address: '123 Main Street, Austin, TX',
          rating: 4.6,
          user_ratings_total: 82,
          types: ['plumber', 'establishment', 'point_of_interest']
        },
        {
          placeId: `mock_${Date.now()}_2`,
          name: `${query} - Branch`,
          displayName: { text: `${query} - Branch` },
          formattedAddress: '456 Oak Road, Denver, CO',
          formatted_address: '456 Oak Road, Denver, CO',
          rating: 4.2,
          user_ratings_total: 19,
          types: ['contractor', 'establishment']
        },
        {
          placeId: `mock_${Date.now()}_3`,
          name: `${query} & Sons`,
          displayName: { text: `${query} & Sons` },
          formattedAddress: '789 Pine Avenue, Seattle, WA',
          formatted_address: '789 Pine Avenue, Seattle, WA',
          rating: 4.8,
          user_ratings_total: 145,
          types: ['electrician', 'establishment']
        }
      ].slice(0, limit);

      return NextResponse.json({ places: mockResults });
    }

    // Rate limit BEFORE any paid Google call (the mock branch above costs nothing).
    const guard = await guardPublicRequest(req, 'audit:search', SEARCH_LIMIT, TOO_MANY_SEARCHES);
    if (!guard.allowed) return guard.response;

    const maxResults = Math.min(Number(limit) || 15, 20);
    const cacheKey = searchCacheKey('audit:search', String(query || ''), maxResults);
    const cached = getCached<any[]>(cacheKey);
    if (cached) return NextResponse.json({ places: cached });

    /** Cache a non-empty page of results, then answer. */
    const respond = (places: any[]) => {
      setCached(cacheKey, places, SEARCH_CACHE_MS);
      return NextResponse.json({ places });
    };

    // Try the NEW Places API (v1) first if GOOGLE_PLACES_API_KEY exists
    if (placesApiKey) {
      console.log('🔍 Searching via NEW Google Places API (v1) for:', query);
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': placesApiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.photos'
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: maxResults,
          // Trades are PURE SERVICE-AREA businesses (a plumber works at the
          // customer's address and has no shop front). Google's Text Search
          // EXCLUDES those by default, which is why a real listing such as
          // "Prk gas & plumbing 24/7 ltd" came back as zero results while
          // Google Maps happily showed it. Verified: this flag returns it.
          includePureServiceAreaBusinesses: true
        })
      });

      const data = await res.json();

      if (data.places && data.places.length > 0) {
        const places = data.places.slice(0, maxResults).map((place: any) => {
          // Build photo URL from the first photo resource name
          let photoUrl = '';
          if (place.photos && place.photos.length > 0) {
            const photoName = place.photos[0].name;
            photoUrl = `/api/places/photo?name=${encodeURIComponent(photoName)}&w=400`;
          }
          return {
            placeId: place.id,
            name: place.displayName?.text || '',
            displayName: place.displayName || { text: '' },
            formattedAddress: place.formattedAddress || '',
            formatted_address: place.formattedAddress || '',
            rating: place.rating || 0,
            user_ratings_total: place.userRatingCount || 0,
            types: place.types || [],
            photoUrl
          };
        });

        console.log(`✅ Found ${places.length} real places for "${query}" via new API`);
        return respond(places);
      }

      // Log if the new API returned an error or empty results
      console.warn('⚠️ New Places API returned no results (HTTP ' + res.status + '), data:', JSON.stringify(data).slice(0, 300));
    }

    // Fallback: Try the LEGACY Places API if GOOGLE_MAPS_API_KEY exists
    if (mapsApiKey) {
      console.log('🔍 Falling back to LEGACY Google Places API for:', query);
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${mapsApiKey}`
      );

      const data = await res.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const places = data.results.slice(0, maxResults).map((result: any) => {
          let photoUrl = '';
          if (result.photos && result.photos.length > 0 && mapsApiKey) {
            photoUrl = `/api/places/photo?ref=${encodeURIComponent(result.photos[0].photo_reference)}&w=400`;
          }
          return {
            placeId: result.place_id,
            name: result.name,
            displayName: { text: result.name },
            formattedAddress: result.formatted_address,
            formatted_address: result.formatted_address,
            rating: result.rating || 0,
            user_ratings_total: result.user_ratings_total || 0,
            types: result.types,
            photoUrl
          };
        });

        console.log(`✅ Found ${places.length} real places for "${query}" via legacy API`);
        return respond(places);
      }

      console.error('Legacy Places API error:', data.status, data.error_message);
    }

    // No results from either API (an empty list is deliberately never cached)
    return respond([]);
  } catch (error) {
    console.error('Audit Search Error:', error);
    return NextResponse.json({ places: [], error: 'Search failed' }, { status: 500 });
  }
}
