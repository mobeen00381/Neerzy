import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');
  const fileName = searchParams.get('name') || 'image.jpg';

  if (!imageUrl) return new Response('Missing URL', { status: 400 });

  try {
    const headers: HeadersInit = {};
    
    // Meta WhatsApp media URLs (graph.facebook.com) use Bearer token
    if (imageUrl.includes('graph.facebook.com') && process.env.META_WHATSAPP_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}`;
    }
    // Legacy Twilio media URLs (api.twilio.com) use Basic auth
    else if (imageUrl.includes('api.twilio.com') && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const imageRes = await fetch(imageUrl, { headers });
    if (!imageRes.ok) throw new Error(`Failed to fetch from source: ${imageRes.status}`);
    const buffer = await imageRes.arrayBuffer();
    
    return new Response(buffer, {
      headers: {
        'Content-Type': imageRes.headers.get('content-type') || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Image download error:', error);
    return new Response('Failed to fetch image', { status: 500 });
  }
}
