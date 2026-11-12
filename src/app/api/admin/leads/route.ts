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
import { getLeadPriority } from "@/lib/lead-priority";
import { effectiveHasWebsite } from "@/lib/website-signal";

const STATUSES = ["new", "contacted", "trial_started", "converted", "lost"];
// `gmb_audit` = a visitor who ran a free Google Business Profile audit
// (/api/audit/run captures it server-side; see lib/audit-lead.ts).
const SOURCES = [
  "facebook",
  "instagram",
  "google_ads",
  "organic",
  "referral",
  "direct",
  "landing",
  "gmb_audit",
];

/** PostgREST may hand back numeric/integer as a string - normalise it. */
function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * The columns the pipeline pill aggregation reads. `is_test` only exists once
 * 20261108_leads_is_test.sql is applied, hence the optional shape.
 */
type AggLeadRow = { status?: string | null; source?: string | null; is_test?: boolean | null };

/** A parseable ISO timestamp from the ?from / ?to date filter, or null. */
function isoParam(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Everything the WHERE clause below needs (all values already validated). */
interface LeadFilters {
  status: string;
  source: string;
  /** Free-text search (name, email, phone, business). */
  q: string;
  /** Viewer-local "from" boundary, normalized to UTC ISO. */
  fromIso: string | null;
  /** Viewer-local "to" boundary, normalized to UTC ISO. */
  toIso: string | null;
}

/**
 * The shared WHERE clause for the list page, the pipeline pills and the
 * page-boundary probe - so the three can never drift apart.
 */
function applyFilters<T>(query: T, filters: LeadFilters): T {
  let q = query as any;
  const { status, source, q: search, fromIso, toIso } = filters;
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  if (source && SOURCES.includes(source)) q = q.eq("source", source);
  if (search) {
    const escaped = search.replace(/[%_,]/g, "\\$&");
    q = q.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%,business_name.ilike.%${escaped}%`);
  }
  // The browser sends its local midnight as an ISO instant, so comparing the
  // UTC-stored created_at needs no time zone knowledge here.
  if (fromIso) q = q.gte("created_at", fromIso);
  if (toIso) q = q.lte("created_at", toIso);
  return q as T;
}

export async function GET(req: Request) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const supabase = getAdminSupabase();
  const url = new URL(req.url);
  const status = (url.searchParams.get("status") || "").trim();
  const source = (url.searchParams.get("source") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();
  // Local-calendar bounds for the date filter, computed in the viewer's browser.
  const fromIso = isoParam(url.searchParams.get("from"));
  const toIso = isoParam(url.searchParams.get("to"));
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10) || 25));
  const filters: LeadFilters = { status, source, q, fromIso, toIso };

  try {
    const from = (page - 1) * pageSize;
    // created_at ordering happens in the database, so a page is always a real
    // slice of the whole list (priority is only re-applied inside each day
    // group on the client).
    const { data: rows, count, error } = await applyFilters(
      supabase.from("leads").select("*", { count: "exact" }),
      filters
    )
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error && !isMissingTableError(error)) throw error;

    // The last row of the previous page: the client repeats its first day
    // header with "(cont.)" when that day started on the earlier page.
    let prevCreatedAt: string | null = null;
    if (page > 1) {
      const { data: prevRows } = await applyFilters(
        supabase.from("leads").select("created_at"),
        filters
      )
        .order("created_at", { ascending: false })
        .range(from - 1, from - 1);
      prevCreatedAt = prevRows?.[0]?.created_at || null;
    }

    // The pipeline pills follow status/source/date but not the text search,
    // exactly as before.
    const pillFilters: LeadFilters = { ...filters, q: "" };
    let aggRows: AggLeadRow[] | null = (
      await applyFilters(supabase.from("leads").select("status, source, is_test"), pillFilters)
    ).data;
    if (!aggRows) {
      // Pre-20261108 environment: no is_test column, so nothing can be a test
      // lead. Retry without it instead of losing the pipeline pills.
      aggRows = (
        await applyFilters(supabase.from("leads").select("status, source"), pillFilters)
      ).data;
    }


    const byStatusCounts: Record<string, number> = {};
    const bySourceCounts: Record<string, number> = {};
    for (const r of aggRows || []) {
      const s = r.status || "new";
      // Test leads are hidden by default in the table, so they must not inflate
      // the NEW pill either. Every other bucket and the automation keep them.
      const isTestLead = r.is_test === true;
      if (!(isTestLead && s === "new")) {
        byStatusCounts[s] = (byStatusCounts[s] || 0) + 1;
      }
      const src = r.source || "organic";
      bySourceCounts[src] = (bySourceCounts[src] || 0) + 1;
    }

    const leads: AdminLead[] = (rows || []).map((r: any) => {
      const lead: AdminLead = {
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
        last_contacted_at: r.last_contacted_at || null,
        notes: r.notes || null,
        // Missing on an environment that has not applied
        // 20261108_leads_is_test.sql yet: absent column reads as "not a test".
        is_test: r.is_test === true,
        converted_user_id: r.converted_user_id || null,
        created_at: r.created_at || null,
        place_id: r.place_id || null,
        audit_score: typeof r.audit_score === "number" ? r.audit_score : null,
        report_link: r.report_link || null,
        website: r.website || null,
        // NULL from the DB stays NULL (unknown) - coercing it to false would
        // claim "no website" for every lead that was never audited. A social
        // page / link-in-bio stored in `website` IS a measured "no website"
        // (lib/website-signal.ts), so the badge and the automation agree.
        hasWebsite: effectiveHasWebsite(r.has_website, r.website),
        reviewCount: numberOrNull(r.review_count),
        rating: numberOrNull(r.rating),
      };
      // Derived here (not stored) so the badge and the CSV export share one rule set.
      return { ...lead, priority: getLeadPriority(lead) };
    });

    const payload: AdminLeadList = {
      leads,
      total: count || 0,
      page,
      pageSize,
      // Enables the "(cont.)" day header on the next page.
      prevCreatedAt,
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
    // "Test lead" toggle in the drawer (20261108_leads_is_test.sql).
    if (body.is_test !== undefined) updates.is_test = body.is_test === true;

    const { data, error } = await supabase
      .from("leads").update(updates).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ success: true, lead: data });
  } catch (error: any) {
    console.error("admin/leads POST error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to save lead" }, { status: 500 });
  }
}

