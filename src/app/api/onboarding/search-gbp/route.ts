import { NextResponse } from 'next/server';

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

    return NextResponse.json({ places, count: places.length });

  } catch (error: any) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: error.message, places: [] }, { status: 500 });
  }
}
