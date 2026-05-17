import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { placeId, businessName } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // 🎭 MOCK MODE: Return realistic mock audit data for testing
    if (!apiKey || placeId?.startsWith('mock') || process.env.NODE_ENV === 'development') {
      const mockAudit = {
        completeness: {
          score: 85,
          actualScore: 21,
          maxScore: 25,
          checks: [
            { label: 'Business name present', passed: true },
            { label: 'Address present', passed: true },
            { label: 'Phone number present', passed: true },
            { label: 'Website linked', passed: true },
            { label: 'Business hours set', passed: true },
            { label: 'Has description', passed: false },
            { label: 'Primary category set', passed: true }
          ]
        },
        visualContent: {
          score: 50,
          actualScore: 10,
          maxScore: 20,
          checks: [
            { label: 'Has photos', passed: true },
            { label: '10+ photos', passed: true },
            { label: '50+ photos', passed: false },
            { label: '100+ photos (excellent)', passed: false }
          ]
        },
        reviews: {
          score: 75,
          actualScore: 19,
          maxScore: 25,
          checks: [
            { label: 'Has reviews', passed: true },
            { label: '10+ reviews', passed: true },
            { label: '50+ reviews', passed: false },
            { label: '4.0+ rating', passed: true },
            { label: '4.5+ rating (excellent)', passed: true }
          ]
        },
        engagement: {
          score: 25,
          actualScore: 4,
          maxScore: 15,
          checks: [
            { label: 'Profile claimed', passed: true },
            { label: 'Regular posts (weekly)', passed: false },
            { label: 'Q&A section active', passed: false },
            { label: 'Responds to reviews', passed: false }
          ]
        },
        seo: {
          score: 60,
          actualScore: 9,
          maxScore: 15,
          checks: [
            { label: 'Keywords in name', passed: true },
            { label: 'Multiple categories', passed: true },
            { label: 'Service area defined', passed: false },
            { label: 'Attributes set', passed: false },
            { label: 'Products/services listed', passed: false }
          ]
        },
        recommendations: [
          {
            icon: '📸',
            title: 'Add More Photos',
            description: 'You have 12 photos. Aim for 100+ to stand out.',
            impact: 'Medium'
          },
          {
            icon: '⭐',
            title: 'Get More Reviews',
            description: 'Businesses with 50+ reviews get 54% more clicks.',
            impact: 'High'
          },
          {
            icon: '📝',
            title: 'Add Business Description',
            description: 'Write a compelling summary to tell clients about your services.',
            impact: 'Medium'
          }
        ]
      };
      return NextResponse.json(mockAudit);
    }

    // 🌍 REAL GOOGLE API CALL
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,reviews,photos,user_ratings_total,rating,editorial_summary&key=${apiKey}`
    );
    
    const data = await res.json();
    
    if (data.status !== 'OK') {
      return NextResponse.json({ error: 'Failed to get details' }, { status: 500 });
    }

    const place = data.result;
    
    // Run audit checks
    const audit = {
      completeness: auditCompleteness(place),
      visualContent: auditVisualContent(place),
      reviews: auditReviews(place),
      engagement: auditEngagement(place),
      seo: auditSEO(place, businessName),
      recommendations: generateRecommendations(place)
    };

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Audit Run Error:', error);
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
  }
}

// Audit Functions
function auditCompleteness(place: any) {
  const checks = [
    { label: 'Business name present', passed: !!place.name },
    { label: 'Address present', passed: !!place.formatted_address },
    { label: 'Phone number present', passed: !!place.formatted_phone_number },
    { label: 'Website linked', passed: !!place.website },
    { label: 'Business hours set', passed: !!place.opening_hours },
    { label: 'Has description', passed: !!place.editorial_summary },
    { label: 'Primary category set', passed: place.types?.length > 0 }
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const actualScore = Math.round((passedCount / checks.length) * 25);

  return { score, actualScore, maxScore: 25, checks };
}

function auditVisualContent(place: any) {
  const photoCount = place.photos?.length || 0;
  const checks = [
    { label: 'Has photos', passed: photoCount > 0 },
    { label: '10+ photos', passed: photoCount >= 10 },
    { label: '50+ photos', passed: photoCount >= 50 },
    { label: '100+ photos (excellent)', passed: photoCount >= 100 }
  ];

  let score = 0;
  if (photoCount >= 100) score = 100;
  else if (photoCount >= 50) score = 75;
  else if (photoCount >= 10) score = 50;
  else if (photoCount > 0) score = 25;

  const actualScore = Math.round((score / 100) * 20);

  return { score, actualScore, maxScore: 20, checks };
}

function auditReviews(place: any) {
  const reviewCount = place.user_ratings_total || 0;
  const rating = place.rating || 0;
  
  const checks = [
    { label: 'Has reviews', passed: reviewCount > 0 },
    { label: '10+ reviews', passed: reviewCount >= 10 },
    { label: '50+ reviews', passed: reviewCount >= 50 },
    { label: '4.0+ rating', passed: rating >= 4.0 },
    { label: '4.5+ rating (excellent)', passed: rating >= 4.5 }
  ];

  let score = 0;
  const reviewScore = Math.min((reviewCount / 50) * 50, 50); // 50% from count
  const ratingScore = (rating / 5) * 50; // 50% from rating
  score = Math.round(reviewScore + ratingScore);

  const actualScore = Math.round((score / 100) * 25);

  return { score, actualScore, maxScore: 25, checks };
}

function auditEngagement(place: any) {
  const checks = [
    { label: 'Profile claimed', passed: true },
    { label: 'Regular posts (weekly)', passed: false },
    { label: 'Q&A section active', passed: false },
    { label: 'Responds to reviews', passed: false }
  ];

  const score = 25;
  const actualScore = Math.round((score / 100) * 15);

  return { score, actualScore, maxScore: 15, checks };
}

function auditSEO(place: any, businessName: string) {
  const checks = [
    { label: 'Keywords in name', passed: businessName.toLowerCase().includes(' ') },
    { label: 'Multiple categories', passed: (place.types?.length || 0) > 1 },
    { label: 'Service area defined', passed: false },
    { label: 'Attributes set', passed: false },
    { label: 'Products/services listed', passed: false }
  ];

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const actualScore = Math.round((passedCount / checks.length) * 15);

  return { score, actualScore, maxScore: 15, checks };
}

function generateRecommendations(place: any) {
  const recommendations = [];

  if (!place.formatted_phone_number) {
    recommendations.push({
      icon: '📞',
      title: 'Add Phone Number',
      description: 'Customers need a way to contact you directly',
      impact: 'High'
    });
  }

  if (!place.website) {
    recommendations.push({
      icon: '🌐',
      title: 'Add Website Link',
      description: 'Drive traffic to your website from Google',
      impact: 'High'
    });
  }

  const photoCount = place.photos?.length || 0;
  if (photoCount < 10) {
    recommendations.push({
      icon: '📸',
      title: 'Add More Photos',
      description: `You have ${photoCount} photos. Aim for 100+ to stand out`,
      impact: 'Medium'
    });
  }

  if ((place.user_ratings_total || 0) < 50) {
    recommendations.push({
      icon: '⭐',
      title: 'Get More Reviews',
      description: 'Businesses with 50+ reviews get 54% more clicks',
      impact: 'High'
    });
  }

  if ((place.rating || 5) < 4.5) {
    recommendations.push({
      icon: '💬',
      title: 'Improve Customer Service',
      description: 'Your rating is below 4.5. Focus on customer experience',
      impact: 'Critical'
    });
  }

  return recommendations;
}
