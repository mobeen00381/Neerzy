import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log('🔍 Search Query:', query);
    console.log('🔑 API Key exists:', !!apiKey);
    console.log('🔑 API Key starts with:', apiKey?.substring(0, 10) + '...');

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Google API key not configured',
        places: []
      }, { status: 500 });
    }

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Search query too short',
        places: []
      }, { status: 400 });
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    
    console.log('📡 Calling Google Places API...');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.placeId,places.googleMapsUri'
      },
      body: JSON.stringify({ 
        textQuery: query,
        languageCode: 'en'
      })
    });

    console.log('📥 Response Status:', res.status);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('❌ Google API Error:', errorData);
      return NextResponse.json({ 
        error: `Google API error: ${res.status}`,
        details: errorData,
        places: []
      }, { status: res.status });
    }

    const data = await res.json();
    console.log('✅ Response received. Places count:', data.places?.length || 0);
    
    if (data.places && data.places.length > 0) {
      console.log('📍 First result:', data.places[0].displayName);
    }

    return NextResponse.json({ 
      places: data.places || [],
      count: data.places?.length || 0
    });

  } catch (error: any) {
    console.error('💥 Search API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Search failed',
      places: []
    }, { status: 500 });
  }
}
