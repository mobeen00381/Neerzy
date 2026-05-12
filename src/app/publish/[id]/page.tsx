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

  // Fallback to 'pending_posts' table for backward compatibility
  const { data: legacyData, error: legacyError } = await supabase
    .from("pending_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (legacyError || !legacyData) {
    return null;
  }

  // Map legacy format to match what PublishClient expects
  return {
    id: legacyData.id,
    title: legacyData.draft_name || "New Post",
    content: "Content is being generated...",
    hashtags: ["#localbusiness"],
    media_urls: []
  };
}

export default async function PublishHelper({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);

  if (!job) {
    notFound();
  }

  return <PublishClient job={job} />;
}
