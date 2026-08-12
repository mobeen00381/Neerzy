import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendMetaTemplate } from '@/lib/whatsapp';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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
    let businessName = 'Our Services';
    try {
      const lookupPhone = post.source === 'pending_posts' ? post.user_phone : null;
      
      if (lookupPhone) {
        const { data: business } = await supabaseAdmin
          .from('business_profiles')
          .select('review_link, google_place_id, business_name')
          .eq('user_phone', lookupPhone)
          .maybeSingle();

        if (business) {
          if (business.review_link) {
            reviewLink = business.review_link;
          } else if (business.google_place_id) {
            reviewLink = `https://search.google.com/local/writereview?placeid=${business.google_place_id}`;
          }
          if (business.business_name) {
            businessName = business.business_name;
          }
        }
      }
    } catch (dbErr) {
      console.warn('⚠️ Could not fetch review link:', dbErr);
    }

    // Send WhatsApp review request to the customer via Meta template
    try {
      const templateName = 'review_request'; // Meta template name
      const components = [
        {
          type: "body" as const,
          parameters: [
            { type: "text" as const, text: customerName },
            { type: "text" as const, text: businessName },
            { type: "text" as const, text: reviewLink },
          ]
        }
      ];

      await sendMetaTemplate({
        to: customerPhone,
        templateName,
        languageCode: "en",
        components,
      });
      console.log(`✅ Review request template sent to ${customerName} at ${customerPhone}`);
    } catch (metaErr: any) {
      console.error('❌ Failed to send WhatsApp review request:', metaErr.message);
    }

    // Meta WhatsApp templates are reliable — no SMS fallback needed

    // Update post status — also set user_id if it's a pending_posts record
    const table = post.source === 'pending_posts' ? 'pending_posts' : 'jobs';
    const updateData: any = { status: 'published' };
    
    // For pending_posts, try to link user_id if not already set
    if (post.source === 'pending_posts' && !post.user_id && post.user_phone) {
      const { data: userByPhone } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', post.user_phone)
        .maybeSingle();
      if (userByPhone?.id) {
        updateData.user_id = userByPhone.id;
      }
    }
    
    await supabaseAdmin
      .from(table)
      .update(updateData)
      .eq('id', jobId);

    return NextResponse.json({ success: true, reviewLink });
  } catch (error: any) {
    console.error("mark-published Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
