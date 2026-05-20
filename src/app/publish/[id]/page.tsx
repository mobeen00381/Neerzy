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
    .select("*, users(*)")
    .eq("id", id)
    .single();

  if (!error && data) {
    let gbpLink = 'https://business.google.com/';
    if (data.users?.whatsapp_phone) {
      const { data: business } = await supabase
        .from('business_profiles')
        .select('business_name, google_place_id')
        .eq('user_phone', data.users.whatsapp_phone)
        .maybeSingle();

      if (business) {
        if (business.business_name) {
          gbpLink = `https://www.google.com/search?q=${encodeURIComponent(business.business_name)}`;
        } else if (business.google_place_id) {
          gbpLink = `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`;
        }
      }
    }
    return {
      ...data,
      gbpLink
    };
  }

  // Fallback to 'pending_posts' table (WhatsApp flow stores data here)
  const { data: legacyData, error: legacyError } = await supabase
    .from("pending_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (legacyError || !legacyData) {
    return null;
  }

  // Fetch business profile to build direct GBP link for legacy draft
  let gbpLink = 'https://business.google.com/';
  if (legacyData.user_phone) {
    const { data: business } = await supabase
      .from('business_profiles')
      .select('business_name, google_place_id')
      .eq('user_phone', legacyData.user_phone)
      .maybeSingle();

    if (business) {
      if (business.business_name) {
        gbpLink = `https://www.google.com/search?q=${encodeURIComponent(business.business_name)}`;
      } else if (business.google_place_id) {
        gbpLink = `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`;
      }
    }
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
    status: legacyData.status,
    gbpLink: gbpLink
  };
}

export default async function PublishHelper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  return <PublishClient job={job} />;
}
