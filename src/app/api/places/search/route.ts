import { NextResponse } from 'next/server';

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

    return NextResponse.json({ results, status: data.status });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
