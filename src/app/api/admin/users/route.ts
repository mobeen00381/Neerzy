import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  getAllAuthEmails,
  countUserCyclePosts,
  countUserCycleReviews,
  normalizePlan,
} from "@/lib/admin-server";
import { PLAN_LIMITS, getCycleStartIso, getRemainingDays } from "@/lib/plans";
import type { AdminUser, AdminUserList, CycleInfo } from "@/lib/admin-types";

const CYCLE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Runs an async worker over items with limited concurrency. */
async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  limit = 8
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const idx = next;
      next += 1;
      results[idx] = await worker(items[idx]);
    }
  }
  const runners: Promise<void>[] = [];
  for (let i = 0; i < Math.min(limit, items.length); i++) runners.push(run());
  await Promise.all(runners);
  return results;
}

async function buildCycleInfo(
  supabase: ReturnType<typeof getAdminSupabase>,
  profile: any
): Promise<CycleInfo> {
  const tier = normalizePlan(profile.selected_plan);
  const limits = PLAN_LIMITS[tier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const anchor = profile.plan_started_at || profile.trial_started_at || profile.created_at || new Date().toISOString();
  const startIso = getCycleStartIso(anchor);
  const startMs = new Date(startIso).getTime();
  const resetIso = new Date(startMs + CYCLE_DAYS * DAY_MS).toISOString();
  const daysLeft = Math.max(0, Math.ceil((startMs + CYCLE_DAYS * DAY_MS - Date.now()) / DAY_MS));

  const [postsUsed, reviewsUsed] = await Promise.all([
    countUserCyclePosts(supabase, profile.id, profile.phone, startIso),
    countUserCycleReviews(supabase, profile.id, startIso),
  ]);

  const postsLimit = limits.totalPosts;
  const reviewsLimit = limits.totalReviewRequests;
  return {
    startIso,
    resetIso,
    daysLeft,
    postsUsed,
    postsLimit,
    postsPct: postsLimit > 0 ? Math.min(100, Math.round((postsUsed / postsLimit) * 100)) : 0,
    reviewsUsed,
    reviewsLimit,
    reviewsPct: reviewsLimit > 0 ? Math.min(100, Math.round((reviewsUsed / reviewsLimit) * 100)) : 0,
  };
}

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const plan = (url.searchParams.get("plan") || "").trim().toLowerCase();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10) || 25));

  try {
    let base = supabase
      .from("profiles")
      .select("*", { count: "exact" });

    const filters: string[] = [];
    if (q) {
      const escaped = q.replace(/[%_,]/g, "\\$&");
      filters.push(`phone.ilike.%${escaped}%,business_name.ilike.%${escaped}%`);
    }
    if (filters.length) base = base.or(filters.join(","));
    if (plan && ["free", "pro", "growth", "agency"].includes(plan)) {
      base = base.eq("selected_plan", plan);
    }

    const from = (page - 1) * pageSize;
    const { data: rows, count, error } = await base
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    // Emails (auth.users) + plan breakdown + agency client counts.
    const emailMap = await getAllAuthEmails(supabase);
    const { data: planRows } = await supabase.from("profiles").select("selected_plan");
    const planCounts: Record<string, number> = {};
    for (const r of planRows || []) {
      const tier = normalizePlan(r.selected_plan);
      planCounts[tier] = (planCounts[tier] || 0) + 1;
    }
    const planBreakdown = Object.entries(planCounts).map(([planName, count]) => ({ plan: planName, count }));

    const agencyIds = (rows || [])
      .filter((r: any) => normalizePlan(r.selected_plan) === "agency")
      .map((r: any) => r.id);
    const agencyCounts = new Map<string, number>();
    if (agencyIds.length) {
      const { data: ac } = await supabase
        .from("agency_clients").select("agency_user_id").in("agency_user_id", agencyIds);
      for (const c of ac || []) {
        agencyCounts.set(c.agency_user_id, (agencyCounts.get(c.agency_user_id) || 0) + 1);
      }
    }

    const profileRows = rows || [];
    const cycleInfos = await mapWithConcurrency(profileRows, (p) => buildCycleInfo(supabase, p), 6);

    const users: AdminUser[] = profileRows.map((p, i) => {
      const tier = normalizePlan(p.selected_plan);
      let status: AdminUser["status"];
      if (tier === "agency") status = "agency";
      else if (tier === "pro" || tier === "growth") status = "active";
      else {
        const anchor = p.plan_started_at || p.trial_started_at || p.created_at || new Date().toISOString();
        const rem = getRemainingDays(anchor, PLAN_LIMITS.free.trialDays);
        status = rem > 0 ? "trial" : "free";
      }
      return {
        id: p.id,
        email: emailMap.get(p.id) || null,
        phone: p.phone || null,
        business_name: p.business_name || p.company_name || null,
        selected_plan: tier,
        status,
        gbp_connected: Boolean(p.gbp_connected),
        agencyClients: agencyCounts.get(p.id) || 0,
        signup_source: p.signup_source || null,
        utm_source: p.utm_source || null,
        utm_medium: p.utm_medium || null,
        utm_campaign: p.utm_campaign || null,
        created_at: p.created_at || null,
        onboarded_at: p.onboarded_at || null,
        plan_started_at: p.plan_started_at || null,
        trial_started_at: p.trial_started_at || null,
        last_active_at: p.updated_at || null,
        cycle: cycleInfos[i],
        totalPostsAllTime: 0,
      };
    });

    const payload: AdminUserList = {
      users,
      total: count || 0,
      page,
      pageSize,
      planBreakdown,
    };
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("admin/users error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load users" }, { status: 500 });
  }
}

