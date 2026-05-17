import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, limit = 15 } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 🎭 MOCK MODE: Return realistic mock results when key is missing or in dev
    if (!apiKey || process.env.NODE_ENV === 'development') {
      const mockResults = [
        {
          placeId: `mock_${Date.now()}_1`,
          name: query,
          displayName: { text: query },
          formattedAddress: '123 Main Street, Karachi',
          formatted_address: '123 Main Street, Karachi',
          rating: 4.6,
          user_ratings_total: 82,
          types: ['plumber', 'establishment', 'point_of_interest']
        },
        {
          placeId: `mock_${Date.now()}_2`,
          name: `${query} - Branch`,
          displayName: { text: `${query} - Branch` },
          formattedAddress: '456 Oak Road, Lahore',
          formatted_address: '456 Oak Road, Lahore',
          rating: 4.2,
          user_ratings_total: 19,
          types: ['contractor', 'establishment']
        },
        {
          placeId: `mock_${Date.now()}_3`,
          name: `${query} & Sons`,
          displayName: { text: `${query} & Sons` },
          formattedAddress: '789 Pine Ave, Islamabad',
          formatted_address: '789 Pine Ave, Islamabad',
          rating: 4.8,
          user_ratings_total: 145,
          types: ['electrician', 'establishment']
        }
      ].slice(0, limit);

      return NextResponse.json({ places: mockResults });
    }

    // 🌍 REAL GOOGLE API CALL
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    );
    
    const data = await res.json();
    
    if (data.status !== 'OK') {
      return NextResponse.json({ places: [] });
    }

    const places = data.results.slice(0, limit).map((result: any) => ({
      placeId: result.place_id,
      name: result.name,
      displayName: { text: result.name },
      formattedAddress: result.formatted_address,
      formatted_address: result.formatted_address,
      rating: result.rating,
      user_ratings_total: result.user_ratings_total,
      types: result.types
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Audit Search Error:', error);
    return NextResponse.json({ places: [], error: 'Search failed' }, { status: 500 });
  }
}
