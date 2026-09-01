import { createClient } from '@supabase/supabase-js';
import { chatWithFallback } from '@/lib/openai';

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

  // AI Prompt
  const prompt = `Create a Google Business Profile post for:
  - Service: ${session.transcript || 'General Handyman Work'}
  - Images: ${session.accumulated_images?.length || 0}
  - Customer: ${session.customer_name || 'A customer'}
  Return JSON EXACTLY in this format: { "title": "...", "description": "...", "hashtags": ["#..."], "call_to_action": "..." }`;

  const aiResponse = await chatWithFallback({
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const contentStr = aiResponse.choices[0].message.content || '{}';
  const content = JSON.parse(contentStr);

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
