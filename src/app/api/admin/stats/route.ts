import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  getAllAuthEmails,
} from "@/lib/admin-server";
import { PLAN_MONTHLY_PRICE } from "@/lib/plans";
import type { AdminOverview, ActivityPost } from "@/lib/admin-types";

const COMPLETED_POST_STATUSES = ["generated", "published"];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function monthKey(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
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
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const fourteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  try {
    // ── Users ────────────────────────────────────────────────────────
    const { count: totalUsers } = await supabase
      .from("profiles").select("*", { count: "exact", head: true });
    const { count: usersThisMonth } = await supabase
      .from("profiles").select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());
    const { count: gbpConnected } = await supabase
      .from("profiles").select("*", { count: "exact", head: true })
      .eq("gbp_connected", true);
    const { count: agencyClients } = await supabase
      .from("agency_clients").select("*", { count: "exact", head: true });

    const { data: planRows } = await supabase.from("profiles").select("selected_plan");
    const planCounts: Record<string, number> = {};
    let payingUsers = 0;
    let mrr = 0;
    for (const r of planRows || []) {
      const tier = (r.selected_plan || "free").toLowerCase();
      planCounts[tier] = (planCounts[tier] || 0) + 1;
      if (tier === "pro" || tier === "growth" || tier === "agency") {
        payingUsers += 1;
        mrr += PLAN_MONTHLY_PRICE[tier as keyof typeof PLAN_MONTHLY_PRICE] || 0;
      }
    }
    const planBreakdown = Object.entries(planCounts).map(([plan, count]) => ({ plan, count }));

    // ── Posts ────────────────────────────────────────────────────────
    const [paAll, paToday, waAll, waToday] = await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      supabase.from("pending_posts").select("*", { count: "exact", head: true })
        .in("status", COMPLETED_POST_STATUSES).not("google_post", "is", null),
      supabase.from("pending_posts").select("*", { count: "exact", head: true })
        .in("status", COMPLETED_POST_STATUSES).not("google_post", "is", null)
        .gte("created_at", todayStart.toISOString()),
    ]);
    const postsAllTime = (paAll.count || 0) + (waAll.count || 0);
    const postsToday = (paToday.count || 0) + (waToday.count || 0);

    // ── Revenue (transaction.completed rows are the money source of truth) ─
    const { data: txRows } = await supabase
      .from("transactions")
      .select("amount, currency, event_type, status, occurred_at")
      .eq("event_type", "transaction.completed")
      .eq("status", "completed");

    let revenueAllTime = 0;
    let revenueThisMonth = 0;
    const revenueByMonth = new Map<string, { revenue: number; count: number }>();
    for (const t of txRows || []) {
      const amt = Number(t.amount || 0);
      if (!isFinite(amt)) continue;
      revenueAllTime += amt;
      const occ = t.occurred_at;
      if (occ && new Date(occ).getTime() >= monthStart.getTime()) revenueThisMonth += amt;
      const mk = monthKey(occ);
      if (mk && occ && new Date(occ).getTime() >= sixMonthsAgo.getTime()) {
        const cur = revenueByMonth.get(mk) || { revenue: 0, count: 0 };
        cur.revenue += amt;
        cur.count += 1;
        revenueByMonth.set(mk, cur);
      }
    }
    const revenueSeries: { month: string; revenue: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cur = revenueByMonth.get(mk);
      revenueSeries.push({ month: mk, revenue: Math.round((cur?.revenue || 0) * 100) / 100, count: cur?.count || 0 });
    }

    // ── Leads ────────────────────────────────────────────────────────
    const { count: leadsTotal } = await supabase
      .from("leads").select("*", { count: "exact", head: true });
    const { count: leadsNew } = await supabase
      .from("leads").select("*", { count: "exact", head: true }).eq("status", "new");
    const { data: leadRows } = await supabase.from("leads").select("status, source");

    const statusCounts: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    for (const l of leadRows || []) {
      const s = l.status || "new";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      const src = l.source || "organic";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }
    const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
    const leadsBySource = Object.entries(sourceCounts).map(([source, count]) => ({ source, count }));
    const totalLeads = leadsTotal || 0;
    const conversionRate = totalLeads > 0 ? Math.round(((statusCounts.converted || 0) / totalLeads) * 100) : 0;

    // ── Signups (14-day series + source buckets) ─────────────────────
    const { data: recentProfileRows } = await supabase
      .from("profiles")
      .select("created_at, signup_source, utm_source")
      .gte("created_at", fourteenDaysAgo.toISOString());

    const signupSeries: { date: string; count: number }[] = [];
    {
      const counts = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        counts.set(dayKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)), 0);
      }
      for (const p of recentProfileRows || []) {
        if (!p.created_at) continue;
        const k = dayKey(new Date(p.created_at));
        if (counts.has(k)) counts.set(k, (counts.get(k) || 0) + 1);
      }
      for (const [date, count] of counts) signupSeries.push({ date, count });
    }
    const sourceAcc: Record<string, number> = {};
    for (const p of recentProfileRows || []) {
      const src = p.signup_source || p.utm_source || "direct";
      sourceAcc[src] = (sourceAcc[src] || 0) + 1;
    }
    const signupSources = Object.entries(sourceAcc).map(([source, count]) => ({ source, count }));

    // ── Recent transactions / leads / activity ───────────────────────
    const { data: recentTx } = await supabase
      .from("transactions")
      .select("id, email, user_id, plan, amount, currency, event_type, origin, status, paddle_subscription_id, occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(8);
    const emailMap = await getAllAuthEmails(supabase);
    const recentTransactions = (recentTx || []).map((t) => ({
      id: t.id,
      email: t.email || (t.user_id ? emailMap.get(t.user_id) || null : null),
      plan: t.plan || null,
      amount: t.amount !== null && t.amount !== undefined ? Number(t.amount) : null,
      currency: t.currency || null,
      event_type: t.event_type || null,
      origin: t.origin || null,
      status: t.status || null,
      paddle_subscription_id: t.paddle_subscription_id || null,
      occurred_at: t.occurred_at || null,
    }));

    const { data: recentLeadsRaw } = await supabase
      .from("leads").select("*").order("created_at", { ascending: false }).limit(8);
    const recentLeads = (recentLeadsRaw || []).map((l: any) => ({
      id: l.id,
      name: l.name || null,
      email: l.email || null,
      phone: l.phone || null,
      business_name: l.business_name || null,
      service_type: l.service_type || null,
      source: l.source || null,
      utm_source: l.utm_source || null,
      utm_medium: l.utm_medium || null,
      utm_campaign: l.utm_campaign || null,
      status: l.status || "new",
      notes: l.notes || null,
      converted_user_id: l.converted_user_id || null,
      created_at: l.created_at || null,
    }));

    const { data: recentPosts } = await supabase
      .from("posts").select("id, content, image_url, status, created_at, user_id")
      .order("created_at", { ascending: false }).limit(15);
    const { data: recentWaPosts } = await supabase
      .from("pending_posts").select("id, google_post, images, status, created_at, user_phone")
      .order("created_at", { ascending: false }).limit(15);

    const profileIds = [...new Set((recentPosts || []).map((p: any) => p.user_id).filter(Boolean))] as string[];
    const profilePhones = [...new Set((recentWaPosts || []).map((p: any) => p.user_phone).filter(Boolean))] as string[];
    const authorProfiles: { id: string; business_name: string | null; phone: string | null }[] = [];
    if (profileIds.length) {
      const { data: d } = await supabase.from("profiles").select("id, business_name, phone").in("id", profileIds);
      if (d) authorProfiles.push(...d);
    }
    if (profilePhones.length) {
      const { data: d } = await supabase.from("profiles").select("id, business_name, phone").in("phone", profilePhones);
      if (d) authorProfiles.push(...d);
    }
    const bizById = new Map(authorProfiles.map((p) => [p.id, p.business_name || "—"]));
    const bizByPhone = new Map(authorProfiles.map((p) => [p.phone, p.business_name || "—"]));

    const activityRows: (ActivityPost & { created_at: string | null })[] = [];
    for (const p of recentPosts || []) {
      activityRows.push({
        id: `w-${p.id}`,
        text: (p.content || "").replace(/<[^>]*>/g, ""),
        source: "webapp",
        platform: null,
        author: bizById.get(p.user_id) || "—",
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
        time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        status: p.status || "draft",
        image: p.image_url || null,
        created_at: p.created_at || null,
      });
    }
    for (const p of recentWaPosts || []) {
      activityRows.push({
        id: `wa-${p.id}`,
        text: waPostText(p),
        source: "whatsapp",
        platform: "google",
        author: bizByPhone.get(p.user_phone) || "—",
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
        time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
        status: p.status === "published" ? "published" : "generated",
        image: (p.images && p.images[0]) || null,
        created_at: p.created_at || null,
      });
    }
    activityRows.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    const recentActivity: ActivityPost[] = activityRows
      .slice(0, 12)
      .map(({ created_at, ...rest }) => rest);

    const overview: AdminOverview = {
      totals: {
        users: totalUsers || 0,
        usersThisMonth: usersThisMonth || 0,
        payingUsers,
        mrr: Math.round(mrr * 100) / 100,
        revenueAllTime: Math.round(revenueAllTime * 100) / 100,
        revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
        postsAllTime,
        postsToday,
        gbpConnected: gbpConnected || 0,
        agencyClients: agencyClients || 0,
        leadsTotal: totalLeads,
        leadsNew: leadsNew || 0,
        conversionRate,
      },
      planBreakdown,
      signupSources,
      leadsBySource,
      leadsByStatus,
      revenueSeries,
      signupSeries,
      recentTransactions,
      recentLeads,
      recentActivity,
    };

    return NextResponse.json(overview);
  } catch (error: any) {
    console.error("admin/stats error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load overview" }, { status: 500 });
  }
}
