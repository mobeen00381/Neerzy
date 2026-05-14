import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 3) {
      return NextResponse.json({ results: [] });
    }

    // Use NEW Places API with proper field mask
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.photos,places.types,places.googleMapsUri'
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: 'en',
          regionCode: 'PK' // Pakistan region, change as needed
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Places API Error:', data);
      return NextResponse.json({ results: [], error: data.error?.message }, { status: response.status });
    }

    // Format results EXACTLY like Localo
    const results = (data.places || []).map((place: any) => ({
      placeId: place.id,
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || '',
      phone: place.nationalPhoneNumber || '',
      website: place.websiteUri || '',
      rating: place.rating || null,
      reviewCount: place.userRatingCount || 0,
      types: place.types || [],
      hasPhotos: place.photos?.length > 0,
      photoUrl: place.photos?.length > 0 
        ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?key=${process.env.GOOGLE_PLACES_API_KEY}&maxWidthPx=100&maxHeightPx=100` 
        : null,
      googleMapsUrl: place.googleMapsUri || '',
      // Extract business type from types
      businessType: place.types?.find((t: string) => !t.includes('point_of_interest')) || 'business'
    }));

    return NextResponse.json({ 
      results,
      status: 'OK'
    });

  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
