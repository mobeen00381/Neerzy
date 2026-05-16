import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    const res = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.id,places.googleMapsUri'
        },
        body: JSON.stringify({ textQuery: query })
      }
    );

    const data = await res.json();
    
    // Log for debugging if needed (remove in production)
    // console.log('Places API Response:', data);

    return NextResponse.json({ places: data.places || [] });
  } catch (error: any) {
    console.error('Search GBP Error:', error);
    return NextResponse.json({ error: 'Search failed: ' + error.message }, { status: 500 });
  }
}
