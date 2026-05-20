import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

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

      // Fetch business profile to build direct GBP link
      let gbpLink = 'https://business.google.com/';
      if (post.user_phone) {
        const { data: business } = await supabase
          .from('business_profiles')
          .select('business_name, google_place_id')
          .eq('user_phone', post.user_phone)
          .maybeSingle();

        if (business) {
          if (business.business_name) {
            gbpLink = `https://www.google.com/search?q=${encodeURIComponent(business.business_name)}`;
          } else if (business.google_place_id) {
            gbpLink = `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`;
          }
        }
      }

      return NextResponse.json({
        id: post.id,
        google_post: post.google_post || fullText,
        images: post.images || [],
        customer_name: post.customer_name || '',
        gbpLink,
        text: fullText
      });
    }

    // Fallback to jobs table
    const { data: job } = await supabase
      .from('jobs')
      .select('*, users(*)')
      .eq('id', id)
      .maybeSingle();

    if (job) {
      const fullText = [job.title, '', job.content, '', Array.isArray(job.hashtags) ? job.hashtags.join(' ') : ''].filter(Boolean).join('\n');

      // Fetch business profile to build direct GBP link
      let gbpLink = 'https://business.google.com/';
      const userPhone = job.users?.whatsapp_phone;
      if (userPhone) {
        const { data: business } = await supabase
          .from('business_profiles')
          .select('business_name, google_place_id')
          .eq('user_phone', userPhone)
          .maybeSingle();

        if (business) {
          if (business.business_name) {
            gbpLink = `https://www.google.com/search?q=${encodeURIComponent(business.business_name)}`;
          } else if (business.google_place_id) {
            gbpLink = `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`;
          }
        }
      }

      return NextResponse.json({
        id: job.id,
        google_post: fullText,
        images: job.media_urls || [],
        customer_name: job.customer_name || '',
        gbpLink,
        text: fullText
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching post data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
