// src/app/api/admin/leads/[id]/route.ts
// One lead, in full, for the Admin -> Leads detail drawer (LeadDrawer.tsx).
//   GET  -> the whole leads row (untruncated notes, audit signals) plus its
//           lead_activity timeline, newest first.
//   POST -> append-only logging actions. The lead itself (status, contact
//           fields, notes) keeps being edited through /api/admin/leads; this
//           route only writes lead_activity rows (and stamps
//           leads.last_contacted_at on log_contact).
// Like every /api/admin/* route, both handlers start with the standard
// IS_ADMIN_CONFIGURED / verifyAdminRequest checks and use the service-role
// client.
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAdminSupabase,
  verifyAdminRequest,
  adminUnauthorized,
  adminNotConfigured,
  IS_ADMIN_CONFIGURED,
  isMissingTableError,
} from "@/lib/admin-server";
import type { AdminLead, LeadActivity } from "@/lib/admin-types";
import { getLeadPriority } from "@/lib/lead-priority";

const STATUSES = ["new", "contacted", "trial_started", "converted", "lost"];
/** leads.id is a UUID (20260905_admin_dashboard.sql) - reject anything else before Postgres. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ACTIVITY_BODY = 2000;
/** POST channel -> lead_activity.type */
const CONTACT_CHANNELS: Record<string, string> = {
  whatsapp: "contacted_whatsapp",
  email: "contacted_email",
  call: "called",
};

/** PostgREST may hand back numeric/integer as a string - normalise it. */
function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Same mapping as the list route, so the drawer and its table row agree. */
function toLead(r: any): AdminLead {
  return {
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
    converted_user_id: r.converted_user_id || null,
    created_at: r.created_at || null,
    place_id: r.place_id || null,
    audit_score: numberOrNull(r.audit_score),
    report_link: r.report_link || null,
    website: r.website || null,
    // NULL from the DB stays NULL (unknown) - coercing it to false would
    // claim "no website" for every lead that was never audited.
    hasWebsite: typeof r.has_website === "boolean" ? r.has_website : null,
    reviewCount: numberOrNull(r.review_count),
    rating: numberOrNull(r.rating),
  };
}

/** Insert one timeline row; a dead lead id (FK violation) reads as 404. */
async function insertActivity(supabase: SupabaseClient, entry: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("lead_activity").insert(entry);
  if (error) {
    if (String(error.code) === "23503") {
      const notFound: any = new Error("Lead not found");
      notFound.status = 404;
      throw notFound;
    }
    throw error;
  }
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const { id } = await params;
  if (!id || !UUID_RE.test(id)) return bad("Invalid lead id");

  const supabase = getAdminSupabase();
  try {
    const { data: row, error } = await supabase
      .from("leads").select("*").eq("id", id).maybeSingle();
    if (error && !isMissingTableError(error)) throw error;
    if (!row) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // The timeline must never break the drawer: if the lead_activity table is
    // missing (migration not applied yet) the lead still opens, minus the log.
    let activity: LeadActivity[] = [];
    const { data: activityRows, error: activityError } = await supabase
      .from("lead_activity").select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false });
    if (!activityError) {
      activity = (activityRows || []).map((a: any) => ({
        id: a.id,
        lead_id: a.lead_id,
        type: a.type,
        body: a.body || null,
        created_by: a.created_by || null,
        created_at: a.created_at || null,
      }));
    }

    const mapped = toLead(row);
    const lead: AdminLead = { ...mapped, priority: getLeadPriority(mapped) };
    return NextResponse.json({ lead, activity });
  } catch (error: any) {
    console.error("admin/lead detail error:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Failed to load lead" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!IS_ADMIN_CONFIGURED) return adminNotConfigured();
  if (!verifyAdminRequest(req)) return adminUnauthorized();

  const { id } = await params;
  if (!id || !UUID_RE.test(id)) return bad("Invalid lead id");

  const supabase = getAdminSupabase();
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return bad("Invalid JSON body");
    const action = String(body.action || "");
    const text = body.body === undefined || body.body === null ? "" : String(body.body).trim();

    if (action === "add_note") {
      if (!text) return bad("Note text is required");
      if (text.length > MAX_ACTIVITY_BODY) {
        return bad("Note must be " + MAX_ACTIVITY_BODY + " characters or fewer");
      }
      await insertActivity(supabase, {
        lead_id: id, type: "note", body: text, created_by: "admin",
      });
      return NextResponse.json({ success: true });
    }

    if (action === "log_contact") {
      const type = CONTACT_CHANNELS[String(body.channel || "")];
      if (!type) return bad("channel must be one of: whatsapp, email, call");
      await insertActivity(supabase, {
        lead_id: id,
        type,
        body: text ? text.slice(0, MAX_ACTIVITY_BODY) : null,
        created_by: "admin",
      });
      // Best effort: a missing last_contacted_at column (migration not yet
      // applied) must not lose the activity row that was already written.
      const { error: updateError } = await supabase
        .from("leads")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", id);
      if (updateError) console.error("admin/lead: last_contacted_at update failed", updateError.message);
      return NextResponse.json({ success: true });
    }

    if (action === "mark_reviewed") {
      // body carries which manual-check item was ticked (Profile reviewed, ...).
      await insertActivity(supabase, {
        lead_id: id,
        type: "reviewed",
        body: text ? text.slice(0, MAX_ACTIVITY_BODY) : null,
        created_by: "admin",
      });
      return NextResponse.json({ success: true });
    }

    if (action === "log_status_change") {
      // The update itself went through /api/admin/leads; this only records it.
      const to = String(body.to || "");
      if (!STATUSES.includes(to)) return bad("to must be a valid lead status");
      const from = body.from ? String(body.from) : null;
      await insertActivity(supabase, {
        lead_id: id,
        type: "status_change",
        body: from ? from + " -> " + to : to,
        created_by: "admin",
      });
      return NextResponse.json({ success: true });
    }

    return bad("Unknown action");
  } catch (error: any) {
    console.error("admin/lead detail POST error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to log lead activity" },
      { status: error?.status || 500 }
    );
  }
}
