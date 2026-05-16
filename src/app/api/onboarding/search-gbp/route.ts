import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google API key not configured' }, { status: 500 });
    }

    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // Note: Corrected 'places.placeId' to 'places.id' as required by the v1 API
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.id,places.googleMapsUri'
        },
        body: JSON.stringify({ textQuery: query })
      }
    );

    const data = await res.json();
    
    return NextResponse.json({ 
      places: data.places || [],
      count: data.places?.length || 0
    });
  } catch (error) {
    console.error('Places API Error:', error);
    return NextResponse.json({ error: 'Search failed', places: [] }, { status: 500 });
  }
}
