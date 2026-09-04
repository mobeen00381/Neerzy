import { NextResponse } from "next/server";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  isMissingTableError,
} from "@/lib/admin-server";
import type { AdminLead, AdminLeadList } from "@/lib/admin-types";

const STATUSES = ["new", "contacted", "trial_started", "converted", "lost"];
const SOURCES = ["facebook", "instagram", "google_ads", "organic", "referral", "direct", "landing"];

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "").trim();
  const source = (url.searchParams.get("source") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10) || 25));

  try {
    let base = supabase.from("leads").select("*", { count: "exact" });
    if (status && STATUSES.includes(status)) base = base.eq("status", status);
    if (source && SOURCES.includes(source)) base = base.eq("source", source);
    if (q) {
      const escaped = q.replace(/[%_,]/g, "\\$&");
      base = base.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%,business_name.ilike.%${escaped}%`);
    }

    const from = (page - 1) * pageSize;
    const { data: rows, count, error } = await base
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error && !isMissingTableError(error)) throw error;

    let agg = supabase.from("leads").select("status, source");
    if (status && STATUSES.includes(status)) agg = agg.eq("status", status);
    if (source && SOURCES.includes(source)) agg = agg.eq("source", source);
    const { data: aggRows } = await agg;

    const byStatusCounts: Record<string, number> = {};
    const bySourceCounts: Record<string, number> = {};
    for (const r of aggRows || []) {
      const s = r.status || "new";
      byStatusCounts[s] = (byStatusCounts[s] || 0) + 1;
      const src = r.source || "organic";
      bySourceCounts[src] = (bySourceCounts[src] || 0) + 1;
    }

    const leads: AdminLead[] = (rows || []).map((r: any) => ({
      id: r.id,
      name: r.name || null,
      email: r.email || null,
      phone: r.phone || null,
      business_name: r.business_name || null,
      service_type: r.service_type || null,
      source: r.source || null,
      utm_source: r.utm_source || null,
      utm_medium: r.utm_medium || null,
      utm_campaign: r.utm_campaign || null,
      status: r.status || "new",
      notes: r.notes || null,
      converted_user_id: r.converted_user_id || null,
      created_at: r.created_at || null,
    }));

    const payload: AdminLeadList = {
      leads,
      total: count || 0,
      page,
      pageSize,
      byStatus: Object.entries(byStatusCounts).map(([name, count]) => ({ status: name, count })),
      bySource: Object.entries(bySourceCounts).map(([name, count]) => ({ source: name, count })),
    };
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("admin/leads error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load leads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  try {
    const body = await req.json();
    const action = body.action || "update";

    if (action === "create") {
      const lead = {
        name: body.name ? String(body.name) : null,
        email: body.email ? String(body.email) : null,
        phone: body.phone ? String(body.phone) : null,
        business_name: body.business_name ? String(body.business_name) : null,
        service_type: body.service_type ? String(body.service_type) : null,
        source: body.source && SOURCES.includes(String(body.source)) ? String(body.source) : "organic",
        utm_source: body.utm_source ? String(body.utm_source) : null,
        utm_medium: body.utm_medium ? String(body.utm_medium) : null,
        utm_campaign: body.utm_campaign ? String(body.utm_campaign) : null,
        status: body.status && STATUSES.includes(String(body.status)) ? String(body.status) : "new",
        notes: body.notes ? String(body.notes) : null,
      };
      const { data, error } = await supabase.from("leads").insert(lead).select("*").single();
      if (error) throw error;
      return NextResponse.json({ success: true, lead: data });
    }

    const id = body.id;
    if (!id) return NextResponse.json({ error: "Missing lead id" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (body.status && STATUSES.includes(String(body.status))) updates.status = String(body.status);
    if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes) : null;
    if (body.converted_user_id !== undefined) updates.converted_user_id = body.converted_user_id || null;
    if (body.name !== undefined) updates.name = body.name || null;
    if (body.phone !== undefined) updates.phone = body.phone || null;
    if (body.email !== undefined) updates.email = body.email || null;
    if (body.source && SOURCES.includes(String(body.source))) updates.source = String(body.source);

    const { data, error } = await supabase
      .from("leads").update(updates).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ success: true, lead: data });
  } catch (error: any) {
    console.error("admin/leads POST error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to save lead" }, { status: 500 });
  }
}

