import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    console.log('🔍 ========== SEARCH DEBUG START ==========');
    console.log('Query:', query);
    console.log('API Key exists:', !!apiKey);
    console.log('API Key prefix:', apiKey ? apiKey.substring(0, 15) + '...' : 'NONE');

    if (!apiKey) {
      console.error('❌ NO API KEY');
      return NextResponse.json({ error: 'API key missing', places: [] }, { status: 500 });
    }

    // Use classic Text Search API
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    
    console.log('📡 Request URL:', url);

    const res = await fetch(url);
    const rawText = await res.text(); // Get raw response first
    console.log('📥 Raw Response Status:', res.status);
    console.log('📥 Raw Response Body:', rawText.substring(0, 500) + '...');

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e);
      return NextResponse.json({ error: 'Invalid JSON response', raw: rawText, places: [] }, { status: 500 });
    }

    console.log('📊 Parsed Response:', JSON.stringify(data, null, 2).substring(0, 1000));
    console.log('📊 Response Status Field:', data.status);

    // Handle different error statuses
    if (data.status !== 'OK') {
      console.error('❌ Google API Error Details:', {
        status: data.status,
        error_message: data.error_message,
        html_attributions: data.html_attributions,
        results: data.results?.length
      });
      
      return NextResponse.json({ 
        error: data.error_message || data.status,
        google_status: data.status,
        debug: data,
        places: [] 
      }, { status: res.status });
    }

    // Success - transform results
    const places = (data.results || []).map((result: any) => ({
      placeId: result.place_id,
      displayName: { text: result.name },
      formattedAddress: result.formatted_address,
      googleMapsUri: `https://maps.google.com/?q=${result.place_id}`
    }));

    console.log('✅ Success! Found', places.length, 'places');
    console.log('🔍 ========== SEARCH DEBUG END ==========');
    
    return NextResponse.json({ places, count: places.length });

  } catch (error: any) {
    console.error('💥 CATCH ERROR:', error);
    console.log('🔍 ========== SEARCH DEBUG END (ERROR) ==========');
    return NextResponse.json({ 
      error: error.message || 'Unknown error',
      places: []
    }, { status: 500 });
  }
}
