import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
} from "@/lib/admin-server";
import type { ActivityPost } from "@/lib/admin-types";

const COMPLETED_POST_STATUSES = ["generated", "published"];

function extractField(line: string, prefix: string): string {
  if (!line) return "";
  const idx = line.toUpperCase().indexOf(prefix);
  if (idx === -1) return "";
  const after = line.slice(idx + prefix.length).replace(/^[:*\s]+/, "");
  return after.trim();
}
function waPostText(p: any): string {
  const lines = (p.google_post || "").split("\n");
  const headline = lines.map((l: string) => extractField(l, "HEADLINE")).find(Boolean) || "";
  const body = lines.map((l: string) => extractField(l, "BODY")).find(Boolean) || "";
  return [headline, body].filter(Boolean).join("\n") || "[Voice note / media draft]";
}

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  try {
    const { data: webPosts } = await supabase
      .from("posts").select("id, content, image_url, status, created_at, user_id")
      .order("created_at", { ascending: false }).limit(30);
    const { data: waPosts } = await supabase
      .from("pending_posts").select("id, google_post, images, status, created_at, user_phone")
      .in("status", COMPLETED_POST_STATUSES)
      .order("created_at", { ascending: false }).limit(30);

    const ids = [...new Set((webPosts || []).map((p: any) => p.user_id).filter(Boolean))] as string[];
    const phones = [...new Set((waPosts || []).map((p: any) => p.user_phone).filter(Boolean))] as string[];
    const authors: { id: string; business_name: string | null; phone: string | null }[] = [];
    if (ids.length) {
      const { data } = await supabase.from("profiles").select("id, business_name, phone").in("id", ids);
      if (data) authors.push(...data);
    }
    if (phones.length) {
      const { data } = await supabase.from("profiles").select("id, business_name, phone").in("phone", phones);
      if (data) authors.push(...data);
    }
    const byId = new Map(authors.map((a) => [a.id, a.business_name || "—"]));
    const byPhone = new Map(authors.map((a) => [a.phone, a.business_name || "—"]));

    const rows: ActivityPost[] = [];
    for (const p of webPosts || []) {
      rows.push({
        id: `w-${p.id}`,
        text: (p.content || "").replace(/<[^>]*>/g, ""),
        source: "webapp",
        platform: null,
        author: byId.get(p.user_id) || "—",
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
        time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        status: p.status || "draft",
        image: p.image_url || null,
      });
    }
    for (const p of waPosts || []) {
      rows.push({
        id: `wa-${p.id}`,
        text: waPostText(p),
        source: "whatsapp",
        platform: "google",
        author: byPhone.get(p.user_phone) || "—",
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
        time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        status: p.status === "published" ? "published" : "generated",
        image: (p.images && p.images[0]) || null,
      });
    }
    // Merge sorting by the raw date isn't possible here (dates are formatted),
    // so keep deterministic order: newest WhatsApp first is acceptable for the
    // feed, but we instead re-derive by re-sorting using a stored timestamp.
    const combined = await mergeFeed(webPosts || [], waPosts || [], rows);
    return NextResponse.json({ activity: combined.slice(0, 50) });
  } catch (error: any) {
    console.error("admin/feed error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load feed" }, { status: 500 });
  }
}

/** Sorts feed rows by the original created_at timestamps. */
async function mergeFeed(web: any[], wa: any[], rows: ActivityPost[]): Promise<ActivityPost[]> {
  const webByIndex = new Map<string, number>();
  web.forEach((p: any, i: number) => webByIndex.set(`w-${p.id}`, i));
  const waByIndex = new Map<string, number>();
  wa.forEach((p: any, i: number) => waByIndex.set(`wa-${p.id}`, i));

  return rows
    .map((r) => {
      const idx = r.id.startsWith("wa-") ? waByIndex.get(r.id) : webByIndex.get(r.id);
      const src = idx !== undefined ? (r.id.startsWith("wa-") ? wa[idx] : web[idx]) : null;
      return { row: r, ts: src?.created_at || "" };
    })
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .map((x) => x.row);
}
