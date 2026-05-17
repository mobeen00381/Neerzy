import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 🎭 MOCK MODE fallback to guarantee development and test workflows
    if (!apiKey || process.env.NODE_ENV === 'development') {
      const mockPlaces = [
        {
          placeId: `mock_${Date.now()}_1`,
          name: query || 'Ali Plumbing Services',
          displayName: { text: query || 'Ali Plumbing Services' },
          formattedAddress: '123 Main Street, Karachi, Pakistan',
          formatted_address: '123 Main Street, Karachi, Pakistan',
          types: ['plumber', 'establishment'],
          rating: 4.8,
          user_ratings_total: 42
        },
        {
          placeId: `mock_${Date.now()}_2`,
          name: `${query || 'Ali Plumbing'} & Sons`,
          displayName: { text: `${query || 'Ali Plumbing'} & Sons` },
          formattedAddress: '456 Road, Lahore, Pakistan',
          formatted_address: '456 Road, Lahore, Pakistan',
          types: ['plumber', 'establishment'],
          rating: 4.5,
          user_ratings_total: 18
        }
      ];
      return NextResponse.json({ places: mockPlaces, mode: 'mock' });
    }

    // 🌍 REAL GOOGLE API CALL
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status !== 'OK') {
      return NextResponse.json({ places: [] });
    }

    const places = data.results.map((result: any) => ({
      placeId: result.place_id,
      name: result.name,
      displayName: { text: result.name },
      formattedAddress: result.formatted_address,
      formatted_address: result.formatted_address,
      types: result.types,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Audit Search Error:', error);
    return NextResponse.json({ places: [], error: 'Search failed' }, { status: 500 });
  }
}
