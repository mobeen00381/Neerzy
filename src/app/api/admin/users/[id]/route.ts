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
import type { UserDetail, AdminTransaction } from "@/lib/admin-types";

const CYCLE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const supabase = getAdminSupabase();
  try {
    const { data: p, error } = await supabase
      .from("profiles").select("*").eq("id", id).maybeSingle();
    if (error || !p) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const emailMap = await getAllAuthEmails(supabase);
    const tier = normalizePlan(p.selected_plan);
    const limits = PLAN_LIMITS[tier as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
    const anchor = p.plan_started_at || p.trial_started_at || p.created_at || new Date().toISOString();
    const startIso = getCycleStartIso(anchor);
    const resetIso = new Date(new Date(startIso).getTime() + CYCLE_DAYS * DAY_MS).toISOString();
    const daysLeft = Math.max(0, Math.ceil((new Date(startIso).getTime() + CYCLE_DAYS * DAY_MS - Date.now()) / DAY_MS));

    const [postsUsed, reviewsUsed, totalPosts] = await Promise.all([
      countUserCyclePosts(supabase, p.id, p.phone, startIso),
      countUserCycleReviews(supabase, p.id, startIso),
      (async () => {
        let total = 0;
        const { count: w } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", p.id);
        total += w || 0;
        if (p.phone) {
          const { count: wa } = await supabase
            .from("pending_posts").select("*", { count: "exact", head: true })
            .eq("user_phone", p.phone).in("status", ["generated", "published"])
            .not("google_post", "is", null);
          total += wa || 0;
        }
        return total;
      })(),
    ]);

    let status: "active" | "trial" | "free" | "agency";
    if (tier === "agency") status = "agency";
    else if (tier === "pro" || tier === "growth") status = "active";
    else status = getRemainingDays(anchor, PLAN_LIMITS.free.trialDays) > 0 ? "trial" : "free";

    let agencyClients = 0;
    if (tier === "agency") {
      const { count } = await supabase.from("agency_clients").select("*", { count: "exact", head: true }).eq("agency_user_id", p.id);
      agencyClients = count || 0;
    }

    const posts: UserDetail["activity"]["posts"] = [];
    const { data: webPosts } = await supabase
      .from("posts").select("id, content, image_url, status, created_at")
      .eq("user_id", p.id).order("created_at", { ascending: false }).limit(20);
    for (const wp of webPosts || []) {
      posts.push({
        id: `w-${wp.id}`,
        text: (wp.content || "").replace(/<[^>]*>/g, ""),
        platform: "google",
        created_at: wp.created_at || null,
      });
    }

    if (p.phone) {
      const { data: waPosts } = await supabase
        .from("pending_posts").select("id, google_post, images, status, created_at")
        .eq("user_phone", p.phone).order("created_at", { ascending: false }).limit(20);
      for (const wa of waPosts || []) {
        posts.push({ id: `wa-${wa.id}`, text: "[WhatsApp post]", platform: "google", created_at: wa.created_at || null });
      }
    }
    posts.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    const { data: reviewRows } = await supabase
      .from("review_requests")
      .select("customer_name, status, sent_at, converted_at")
      .eq("user_id", p.id).order("sent_at", { ascending: false }).limit(20);
    const reviews = (reviewRows || []).map((r) => ({
      customer_name: r.customer_name || null,
      status: r.status || null,
      sent_at: r.sent_at || null,
      converted_at: r.converted_at || null,
    }));

    const { data: tx } = await supabase
      .from("transactions").select("*")
      .eq("user_id", p.id).order("occurred_at", { ascending: false }).limit(50);
    const transactions: AdminTransaction[] = (tx || []).map((t) => ({
      id: t.id,
      email: t.email || emailMap.get(p.id) || null,
      plan: t.plan || null,
      amount: t.amount !== null && t.amount !== undefined ? Number(t.amount) : null,
      currency: t.currency || null,
      event_type: t.event_type || null,
      origin: t.origin || null,
      status: t.status || null,
      paddle_subscription_id: t.paddle_subscription_id || null,
      occurred_at: t.occurred_at || null,
    }));

    const payload: UserDetail = {
      user: {
        id: p.id,
        email: emailMap.get(p.id) || null,
        phone: p.phone || null,
        business_name: p.business_name || p.company_name || null,
        selected_plan: tier,
        status,
        gbp_connected: Boolean(p.gbp_connected),
        agencyClients,
        signup_source: p.signup_source || null,
        utm_source: p.utm_source || null,
        utm_medium: p.utm_medium || null,
        utm_campaign: p.utm_campaign || null,
        created_at: p.created_at || null,
        onboarded_at: p.onboarded_at || null,
        plan_started_at: p.plan_started_at || null,
        trial_started_at: p.trial_started_at || null,
        last_active_at: p.updated_at || null,
        cycle: {
          startIso,
          resetIso,
          daysLeft,
          postsUsed,
          postsLimit: limits.totalPosts,
          postsPct: limits.totalPosts > 0 ? Math.min(100, Math.round((postsUsed / limits.totalPosts) * 100)) : 0,
          reviewsUsed,
          reviewsLimit: limits.totalReviewRequests,
          reviewsPct: limits.totalReviewRequests > 0 ? Math.min(100, Math.round((reviewsUsed / limits.totalReviewRequests) * 100)) : 0,
        },
        totalPostsAllTime: totalPosts,
      },
      activity: { posts, reviews },
      transactions,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("admin/user detail error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load user" }, { status: 500 });
  }
}

