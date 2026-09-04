// src/lib/admin-server.ts
// Server-only helpers for the private /admin dashboard.
// Every /api/admin/* route must call verifyAdminRequest() first.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
export const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";

/** All three admin env vars must exist before the portal works at all. */
export const IS_ADMIN_CONFIGURED = Boolean(
  ADMIN_EMAIL && ADMIN_PASSWORD && ADMIN_JWT_SECRET
);

export function getAdminSupabase(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

/** True when the request carries a valid admin JWT (role === 'admin'). */
export function verifyAdminRequest(req: Request): boolean {
  if (!ADMIN_JWT_SECRET) return false;
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  try {
    const payload = jwt.verify(header.slice(7), ADMIN_JWT_SECRET) as {
      role?: string;
    };
    return payload?.role === "admin";
  } catch {
    return false;
  }
}

export function adminUnauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function adminNotConfigured() {
  return NextResponse.json(
    { error: "Admin portal not configured: ADMIN_* env vars missing" },
    { status: 500 }
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Quota counting — mirrors the trader plan-enforcement engine in
// lib/post-usage.ts + analytics/stats. Only COMPLETED posts count.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COMPLETED_POST_STATUSES = ["generated", "published"];

export async function countUserCyclePosts(
  supabase: SupabaseClient,
  userId: string | null,
  phone: string | null | undefined,
  cycleStartIso: string
): Promise<number> {
  let used = 0;
  if (userId) {
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", cycleStartIso);
    used += count || 0;
  }
  if (phone) {
    const { count } = await supabase
      .from("pending_posts")
      .select("*", { count: "exact", head: true })
      .eq("user_phone", phone)
      .in("status", COMPLETED_POST_STATUSES)
      .not("google_post", "is", null)
      .gte("created_at", cycleStartIso);
    used += count || 0;
  }
  return used;
}

export async function countUserCycleReviews(
  supabase: SupabaseClient,
  userId: string | null,
  cycleStartIso: string
): Promise<number> {
  if (!userId) return 0;
  const { count } = await supabase
    .from("review_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("sent_at", cycleStartIso);
  return count || 0;
}

/** auth.users email map (id → email) — profiles store no email column. */
export async function getAllAuthEmails(
  supabase: SupabaseClient
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;
  const perPage = 1000;
  try {
    for (;;) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error || !data) break;
      for (const u of data.users) map.set(u.id, u.email || "");
      if (data.users.length < perPage) break;
      page += 1;
    }
  } catch {
    // Best effort — email simply stays null when listing fails.
  }
  return map;
}

/** Normalizes "Pro" / "GROWTH" → 'pro'. */
export function normalizePlan(tier: string | null | undefined): string {
  return (tier || "free").toLowerCase().trim();
}

/** True when a Supabase/PostgREST error means the underlying table is missing. */
export function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const msg = String(error.message || "");
  return (
    code.startsWith("42P01") ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.toLowerCase().includes("could not find")
  );
}
