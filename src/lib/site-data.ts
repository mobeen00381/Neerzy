import { createClient } from "@supabase/supabase-js";

/**
 * Server-side helpers for rendering trader websites.
 * Used by /site (custom domains), /site/blog and /site/preview/[id].
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/** "WWW.Example.com:443" → "example.com" */
export function normalizeHost(host: string | null | undefined): string {
  const h = (host || "").split(":")[0].toLowerCase().trim();
  return h.startsWith("www.") ? h.slice(4) : h;
}

export async function getSiteByHost(host: string | null | undefined) {
  const h = normalizeHost(host);
  if (!h) return null;
  const { data } = await supabaseAdmin
    .from("websites")
    .select("*")
    .in("domain_name", [h, `www.${h}`])
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

export async function getSiteById(id: string) {
  if (!id) return null;
  const { data } = await supabaseAdmin
    .from("websites")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data || null;
}

export type SitePost = { title: string; text: string; image: string | null; date: string };

/** Latest job updates for a trader (WhatsApp post → website_posts pipeline). */
export async function getSitePosts(userId: string, limit = 9): Promise<SitePost[]> {
  try {
    const { data: jobs } = await supabaseAdmin
      .from("jobs")
      .select("id, title, media_urls, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    const jobList = jobs || [];
    if (jobList.length === 0) return [];

    const ids = jobList.map((j: any) => j.id);
    const { data: wps } = await supabaseAdmin
      .from("website_posts")
      .select("job_id, content, created_at")
      .in("job_id", ids)
      .order("created_at", { ascending: false });

    const byJob = new Map<string, any>();
    for (const wp of wps || []) byJob.set(wp.job_id, wp);

    return jobList
      .filter((j: any) => byJob.has(j.id))
      .slice(0, limit)
      .map((j: any) => {
        const wp = byJob.get(j.id);
        const media = Array.isArray(j.media_urls) ? j.media_urls : [];
        return {
          title: j.title || "Recent job",
          text: wp?.content || "",
          image: media[0] || null,
          date: wp?.created_at || j.created_at,
        };
      });
  } catch (err: any) {
    console.warn("⚠️ [Site Data] posts fetch failed:", err?.message || err);
    return [];
  }
}
