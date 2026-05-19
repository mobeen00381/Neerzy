import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import PublishClient from "./PublishClient";

// Since this route needs to query the database, we use the server client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function getJob(id: string) {
  // First try the new 'jobs' table
  let { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (!error && data) return data;

  // Fallback to 'pending_posts' table (WhatsApp flow stores data here)
  const { data: legacyData, error: legacyError } = await supabase
    .from("pending_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (legacyError || !legacyData) {
    return null;
  }

  // Parse the AI-generated google_post content into structured fields
  const googlePost = legacyData.google_post || '';
  const lines = googlePost.split('\n');

  const extractField = (prefix: string) => {
    const line = lines.find((l: string) => l.toUpperCase().includes(prefix.toUpperCase()));
    return line ? line.replace(new RegExp(`\\*{0,2}${prefix}\\*{0,2}`, 'i'), '').trim() : '';
  };

  const headline = extractField('HEADLINE:') || legacyData.customer_name || 'New Post';
  const body = extractField('BODY:') || legacyData.voice_note || 'Job completed successfully.';
  const cta = extractField('CTA:') || 'Contact us today!';
  const hashtagsRaw = extractField('HASHTAGS:') || '#localbusiness';
  const hashtags = hashtagsRaw.split(/\s+/).filter((t: string) => t.startsWith('#'));

  // Map legacy format to match what PublishClient expects
  return {
    id: legacyData.id,
    title: headline,
    content: `${body}\n\n${cta}`,
    hashtags: hashtags.length > 0 ? hashtags : ['#localbusiness'],
    media_urls: legacyData.images || [],
    customer_name: legacyData.customer_name,
    customer_phone: legacyData.customer_phone,
    user_phone: legacyData.user_phone,
    status: legacyData.status
  };
}

export default async function PublishHelper({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);

  if (!job) {
    notFound();
  }

  return <PublishClient job={job} />;
}
