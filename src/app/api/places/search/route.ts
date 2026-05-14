import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Call Google Places API - Text Search (Legacy API as requested)
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY!);
    url.searchParams.set('language', 'en');

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API Error:', data);
      return NextResponse.json({ results: [] }, { status: 500 });
    }

    // Format results for autocomplete
    const results = (data.results || []).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || null,
      reviewCount: place.user_ratings_total || 0,
      types: place.types || [],
      icon: place.icon || null
    }));

    return NextResponse.json({ results, status: data.status });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
