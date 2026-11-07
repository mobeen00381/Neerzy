// src/lib/automation/admin-view.ts
/**
 * Read-only projections of the automation queue for the admin dashboard.
 *
 * Both /api/admin/automation (the tab) and /api/admin/leads/[id] (the drawer)
 * must show the same row shape, so the mapping and the counting live here
 * instead of being copy-pasted into two route files.
 *
 * Everything is defensive: the 20261107 migration may not be applied on this
 * environment, and a missing table must render "run the migration", not a 500.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AutomationQueueRow, AutomationStats } from "@/lib/admin-types";
import { startOfUtcDay } from "@/lib/automation/drain";
import { stepLabel } from "@/lib/automation/sequences";

/** One message_queue row -> the shape the admin UI renders. */
export function toQueueRow(raw: any, lead?: any): AutomationQueueRow {
  return {
    id: String(raw?.id || ""),
    lead_id: String(raw?.lead_id || ""),
    email: String(raw?.email || ""),
    step_key: String(raw?.step_key || ""),
    step_label: stepLabel(raw?.step_key),
    segment: String(raw?.segment || ""),
    kind: String(raw?.kind || ""),
    status: String(raw?.status || "pending"),
    run_at: raw?.run_at || null,
    attempts: Number(raw?.attempts) || 0,
    sent_at: raw?.sent_at || null,
    last_error: raw?.last_error || null,
    business_name: lead?.business_name || null,
    lead_status: lead?.status || null,
  };
}

/**
 * Queue rows, oldest-due first, with the lead's business name attached.
 * A missing table (migration not applied) returns an empty list.
 */
export async function loadQueueRows(
  supabase: SupabaseClient,
  options: { status?: string | null; leadId?: string | null; limit?: number } = {}
): Promise<AutomationQueueRow[]> {
  const limit = Math.min(Math.max(options.limit || 50, 1), 200);

  let query = supabase
    .from("message_queue")
    .select("id, lead_id, email, step_key, segment, kind, status, run_at, attempts, sent_at, last_error")
    .limit(limit);

  // Terminal history reads newest-first; the working set reads oldest-due-first
  // because that is the order the drainer will treat it in.
  if (options.leadId) {
    query = query.eq("lead_id", options.leadId).order("run_at", { ascending: true });
  } else if (options.status === "sent") {
    query = query.eq("status", "sent").order("sent_at", { ascending: false });
  } else {
    if (options.status) query = query.eq("status", options.status);
    query = query.order("run_at", { ascending: true });
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const leadIds = Array.from(
    new Set(data.map((row: any) => String(row.lead_id || "")).filter(Boolean))
  );
  const leadsById = new Map<string, any>();
  if (leadIds.length > 0) {
    const { data: leads } = await supabase
      .from("leads")
      .select("id, business_name, status")
      .in("id", leadIds);
    for (const lead of leads || []) leadsById.set(String((lead as any).id), lead);
  }

  return data.map((row: any) => toQueueRow(row, leadsById.get(String(row.lead_id))));
}

/** Head-counts for every status the tab displays. */
export async function loadAutomationStats(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<AutomationStats> {
  const head = (status: string) =>
    supabase.from("message_queue").select("id", { count: "exact", head: true }).eq("status", status);

  const [pending, sending, sent, skipped, cancelled, failed, sentToday, dueNow] = await Promise.all([
    head("pending"),
    head("sending"),
    head("sent"),
    head("skipped"),
    head("cancelled"),
    head("failed"),
    supabase
      .from("message_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", startOfUtcDay(now).toISOString()),
    supabase
      .from("message_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("run_at", now.toISOString()),
  ]);

  return {
    pending: pending.count || 0,
    sending: sending.count || 0,
    sent: sent.count || 0,
    skipped: skipped.count || 0,
    cancelled: cancelled.count || 0,
    failed: failed.count || 0,
    sentToday: sentToday.count || 0,
    dueNow: dueNow.count || 0,
  };
}
