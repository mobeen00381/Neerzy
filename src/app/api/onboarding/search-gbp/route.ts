import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log('🔍 Searching for:', query);
    console.log('🔑 API Key loaded:', apiKey ? 'YES' : 'NO');

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API key missing', 
        places: [] 
      }, { status: 500 });
    }

    // ✅ USE TEXT SEARCH API (More reliable for business search)
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    
    console.log('📡 Calling:', url.substring(0, 100) + '...');

    const res = await fetch(url);
    const data = await res.json();

    console.log('📥 Google Response Status:', data.status);

    if (data.status !== 'OK') {
      console.error('❌ Google API Error:', data);
      return NextResponse.json({ 
        error: data.error_message || data.status,
        places: [],
        debug: data
      }, { status: res.status });
    }

    // Transform results to match our expected format
    const places = data.results.map((result: any) => ({
      placeId: result.place_id,
      displayName: { text: result.name },
      formattedAddress: result.formatted_address,
      googleMapsUri: `https://maps.google.com/?q=${result.place_id}`
    }));

    console.log('✅ Found', places.length, 'places');
    
    return NextResponse.json({ 
      places,
      count: places.length
    });

  } catch (error: any) {
    console.error('💥 Search Error:', error);
    return NextResponse.json({ 
      error: error.message,
      places: []
    }, { status: 500 });
  }
}
