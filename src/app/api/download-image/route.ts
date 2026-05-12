import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');
  const fileName = searchParams.get('name') || 'image.jpg';

  if (!imageUrl) return new Response('Missing URL', { status: 400 });

  try {
    const imageRes = await fetch(imageUrl);
    const buffer = await imageRes.arrayBuffer();
    
    return new Response(buffer, {
      headers: {
        'Content-Type': imageRes.headers.get('content-type') || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch {
    return new Response('Failed to fetch image', { status: 500 });
  }
}
