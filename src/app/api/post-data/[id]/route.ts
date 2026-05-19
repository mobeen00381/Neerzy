import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Try pending_posts first (WhatsApp flow)
    const { data: post } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (post) {
      // Parse AI-generated content
      const googlePost = post.google_post || '';
      const lines = googlePost.split('\n');
      
      const extractField = (prefix: string) => {
        const line = lines.find((l: string) => l.toUpperCase().includes(prefix.toUpperCase()));
        return line ? line.replace(new RegExp(`\\*{0,2}${prefix}\\*{0,2}`, 'i'), '').trim() : '';
      };

      const headline = extractField('HEADLINE:') || 'New Post';
      const body = extractField('BODY:') || post.voice_note || '';
      const cta = extractField('CTA:') || '';
      const hashtags = extractField('HASHTAGS:') || '';

      const fullText = [headline, '', body, '', cta, '', hashtags].filter(Boolean).join('\n');

      return NextResponse.json({
        text: fullText,
        images: post.images || [],
      });
    }

    // Fallback to jobs table
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (job) {
      const fullText = [job.title, '', job.content, '', (job.hashtags || []).join(' ')].filter(Boolean).join('\n');
      return NextResponse.json({
        text: fullText,
        images: job.media_urls || [],
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching post data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
