import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  getAllAuthEmails,
  isMissingTableError,
} from "@/lib/admin-server";
import type { AdminTransaction, AdminTransactionList } from "@/lib/admin-types";

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const plan = (url.searchParams.get("plan") || "").trim().toLowerCase();
  const eventType = (url.searchParams.get("event_type") || "").trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10) || 25));

  try {
    let base = supabase
      .from("transactions")
      .select("*", { count: "exact" });

    if (q) {
      const escaped = q.replace(/[%_,]/g, "\\$&");
      base = base.or(`email.ilike.%${escaped}%,paddle_transaction_id.ilike.%${escaped}%`);
    }
    if (plan && ["free", "pro", "growth", "agency"].includes(plan)) {
      base = base.eq("plan", plan);
    }
    if (eventType) base = base.eq("event_type", eventType);

    const from = (page - 1) * pageSize;
    const { data: rows, count, error } = await base
      .order("occurred_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error && !isMissingTableError(error)) throw error;

    // Revenue totals (money source of truth = completed transaction.completed rows).
    let revenueFilter = supabase
      .from("transactions")
      .select("amount, currency, occurred_at")
      .eq("event_type", "transaction.completed")
      .eq("status", "completed");
    if (plan && ["free", "pro", "growth", "agency"].includes(plan)) revenueFilter = revenueFilter.eq("plan", plan);
    const { data: revenueRows, error: revenueError } = await revenueFilter;
    if (revenueError && !isMissingTableError(revenueError)) throw revenueError;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    let revenue = 0;
    let revenueThisMonth = 0;
    let totalCurrency = "USD";
    for (const r of revenueRows || []) {
      const amt = Number(r.amount || 0);
      if (!isFinite(amt)) continue;
      revenue += amt;
      if (r.occurred_at && new Date(r.occurred_at).getTime() >= monthStart.getTime()) revenueThisMonth += amt;
      if (r.currency) totalCurrency = r.currency;
    }

    // Resolve emails for transaction rows that have none stored.
    const userIds = [...new Set((rows || []).map((t: any) => t.user_id).filter(Boolean))] as string[];
    const emailMap = await getAllAuthEmails(supabase);

    const transactions: AdminTransaction[] = (rows || []).map((t: any) => ({
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

    const payload: AdminTransactionList = {
      transactions,
      total: count || 0,
      page,
      pageSize,
      totals: {
        revenue: Math.round(revenue * 100) / 100,
        revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
        currency: totalCurrency,
      },
    };
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("admin/transactions error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load transactions" }, { status: 500 });
  }
}
