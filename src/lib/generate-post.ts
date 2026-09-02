import { createClient } from '@supabase/supabase-js';
import { chatWithFallback } from '@/lib/openai';
import { buildPostPrompt, isUsableJobDescription, type PostPromptContext } from '@/lib/post-prompt';
import { parsePostContent } from '@/lib/post-parser';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function getUserByPhone(phone: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    console.warn(`User not found for phone: ${phone}`);
    return null;
  }
  return data;
}

export async function generateAndSavePost(session: any) {
  const user = await getUserByPhone(session.phone);
  const hasWebsite = !!user?.website_url;

  // Use trial plan tier if not explicitly set
  const planTier = user?.plan || 'starter';

  // Business context (real name, category, location) for SEO/AEO/GEO enrichment.
  const postCtx: PostPromptContext = { businessName: 'Local Business' };
  try {
    if (user?.phone) {
      const { data: business } = await supabaseAdmin
        .from('business_profiles')
        .select('business_name, address, category')
        .eq('user_phone', user.phone)
        .maybeSingle();

      if (business) {
        postCtx.businessName = business.business_name || 'Local Business';
        postCtx.category = business.category || null;
        postCtx.locationHint = business.address || null;
      }
    }
  } catch (dbErr) {
    console.warn('⚠️ Could not fetch business context for post:', dbErr);
  }

  // Only a real description grounds the post. Missing transcripts, transcription
  // failures, and one-word acks ("yes"/"done"/"post") are treated as "no
  // description" so the shared prompt emits a grounded, minimal job-completed
  // post (rule 4) instead of a generic/unrelated one.
  const rawDescription = (session.transcript || '').trim();
  const jobDescription = isUsableJobDescription(rawDescription) ? rawDescription : '';
  const hasImage = (session.accumulated_images?.length || 0) > 0;

  // Shared grounded prompt — identical SEO/AEO/GEO enrichment as the WhatsApp
  // webhook and the dashboard generate API.
  const { system, user: userPrompt } = buildPostPrompt(postCtx, { jobDescription, hasImage });

  const aiResponse = await chatWithFallback({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
  });

  const contentStr = aiResponse.choices[0].message.content || '';
  const parsed = parsePostContent(contentStr);

  const content = {
    title: parsed.headline || rawDescription.slice(0, 58) || 'Job Completed',
    description: parsed.body || rawDescription,
    hashtags: parsed.hashtags || '',
    call_to_action: parsed.cta || '',
  };

  // Save to DB
  const { data: job, error: jobError } = await supabaseAdmin.from('jobs').insert({
    user_id: user?.id,
    plan_tier: planTier,
    status: 'draft',
    title: content.title,
    content: content.description,
    hashtags: content.hashtags,
    media_urls: session.accumulated_images || [],
    customer_name: session.customer_name,
    customer_phone: session.customer_phone,
    has_website: hasWebsite,
  }).select().single();

  if (jobError) throw new Error(`Failed to save job: ${jobError.message}`);

  // If website exists, generate website post too (store in same job or separate table)
  if (hasWebsite) {
    await supabaseAdmin.from('website_posts').insert({
      job_id: job.id,
      content: content.description,
      status: 'pending',
    });
  }

  // Clear session
  await supabaseAdmin.from('whatsapp_sessions').update({ step: 'idle' }).eq('id', session.id);

  return job.id;
}
