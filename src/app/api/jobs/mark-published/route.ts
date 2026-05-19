import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const twilioClient = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function getPost(jobId: string) {
  // Try jobs table first
  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!jobError && job) return { ...job, source: 'jobs' };

  // Fallback to pending_posts table (WhatsApp flow)
  const { data: post, error: postError } = await supabaseAdmin
    .from('pending_posts')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!postError && post) return { ...post, source: 'pending_posts' };

  return null;
}

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    
    const post = await getPost(jobId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get customer phone from the post data
    const customerPhone = post.customer_phone;
    const customerName = post.customer_name || 'Customer';
    const userPhone = post.user_phone || post.user_id;

    if (!customerPhone) {
      return NextResponse.json({ error: 'No customer phone number found' }, { status: 400 });
    }

    // Get review link from business_profiles using the user's phone
    let reviewLink = 'https://g.page/r/your-review-link';
    try {
      const lookupPhone = post.source === 'pending_posts' ? post.user_phone : null;
      
      if (lookupPhone) {
        const { data: business } = await supabaseAdmin
          .from('business_profiles')
          .select('review_link, google_place_id')
          .eq('user_phone', lookupPhone)
          .maybeSingle();

        if (business?.review_link) {
          reviewLink = business.review_link;
        } else if (business?.google_place_id) {
          reviewLink = `https://search.google.com/local/writereview?placeid=${business.google_place_id}`;
        }
      }
    } catch (dbErr) {
      console.warn('⚠️ Could not fetch review link:', dbErr);
    }

    // Send WhatsApp review request to the customer
    const defaultFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+923056500917';
    
    try {
      await twilioClient.messages.create({
        from: defaultFrom,
        to: `whatsapp:${customerPhone}`,
        body: `Hi ${customerName}! 👋\n\nThanks for choosing us for your service. Would you mind leaving a quick review? It helps us grow! ⭐\n\n🔗 ${reviewLink}\n\nReply STOP to opt out.`
      });
      console.log(`✅ Review request sent to ${customerName} at ${customerPhone}`);
    } catch (twilioErr: any) {
      console.error('❌ Failed to send WhatsApp review request:', twilioErr.message);
      return NextResponse.json({ error: `Failed to send review: ${twilioErr.message}` }, { status: 500 });
    }

    // Update post status
    const table = post.source === 'pending_posts' ? 'pending_posts' : 'jobs';
    await supabaseAdmin
      .from(table)
      .update({ status: 'published' })
      .eq('id', jobId);

    return NextResponse.json({ success: true, reviewLink });
  } catch (error: any) {
    console.error("mark-published Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
