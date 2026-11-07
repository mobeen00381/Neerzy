// src/lib/automation/enroll.ts
/**
 * Enrollment: turn "this lead was captured" into "these emails are owed".
 *
 * One call queues every future step of the lead's plan into public.message_queue
 * with an absolute run_at. Nothing is sent here - /api/cron/automation drains the
 * queue once a day - so the audit request stays fast and a send failure can never
 * break the visitor's report.
 *
 * The four rules this file exists to enforce:
 *
 *  1. IDEMPOTENT. A lead is enrolled once (`leads.sequence_enrolled_at`) and the
 *     (lead_id, step_key) unique index backs it up, so a double-submitted card or
 *     a retried request cannot queue the same email twice.
 *  2. CONSENT-GATED. EVERY queued step is marketing mail - the day-5 review ask
 *     included - so nothing is queued without an active marketing consent. A
 *     lead without consent gets no rows and one lead_activity line saying why:
 *     the admin tab then shows the truth instead of a plan the drainer would
 *     have to cancel later.
 *  3. SUPPRESSION FIRST. An address that unsubscribed, hard-bounced or complained
 *     is never enrolled, and if the suppression list cannot be read we enroll
 *     nothing rather than guess (the next report card simply tries again).
 *  4. QUIET WHEN IT SHOULD BE. Customers, trial users and lost leads are never
 *     enrolled, and a per-lead `marketing_paused` stops everything.
 *
 * Everything is best-effort from the caller's point of view: it returns a result
 * object, never throws, and logs redacted errors only.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { redact } from "@/lib/email";
import { getLeadPriority, type LeadPrioritySignals } from "@/lib/lead-priority";
import { normalizeEmail } from "@/lib/unsubscribe";
import { checkMarketingConsent, checkSuppressionStrict, isStopStatus } from "@/lib/automation/guards";
import { planForSegment, type SequenceSegment } from "@/lib/automation/sequences";

/** milliseconds in a day - the schedule is expressed in whole days. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Where enrollment was triggered (shown in lead_activity). */
export type EnrollReason = "audit_report" | "admin" | "backfill";

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface PlannedRow {
  step_key: string;
  kind: "sales" | "review";
  segment: SequenceSegment;
  /** ISO timestamp the drainer may send from. */
  run_at: string;
}

/**
 * PURE: the rows a plan produces for one address.
 *
 * Exported so the admin tab can show exactly what enrolling would queue without
 * writing anything. Day 1 means "tomorrow" - the visitor gets the report and the
 * audit today, and the first nudge lands the next morning, never minutes after
 * the form.
 *
 * Every row it returns is marketing mail, so the caller must have established an
 * active marketing consent before calling it (see enrollLead).
 */
export function planQueueRows(input: {
  segment: SequenceSegment;
  email: string;
  startAt: Date;
}): PlannedRow[] {
  const email = normalizeEmail(input.email);
  if (!email) return [];

  return planForSegment(input.segment).map((step) => ({
    step_key: step.key,
    kind: step.kind,
    segment: input.segment,
    run_at: new Date(input.startAt.getTime() + step.day * DAY_MS).toISOString(),
  }));
}

export interface EnrollResult {
  ok: boolean;
  segment?: SequenceSegment;
  /** How many queue rows were created (0 on a repeat call). */
  queued?: number;
  /** Why nothing was queued - safe to show in the admin tab. */
  skipped?: string;
  error?: string;
}

export interface EnrollLeadInput {
  leadId: string | null | undefined;
  /** Falls back to leads.email when omitted. */
  email?: string | null;
  reason?: EnrollReason;
  /** Defaults to now (tests / backfills pass a fixed clock). */
  startAt?: Date;
}

/**
 * One lead_activity line explaining why NOTHING was queued, so an empty plan in
 * the drawer has a reason attached. Best-effort: enrollment must never fail
 * because the timeline could not be written.
 */
async function logSkipNote(supabase: SupabaseClient, leadId: string, body: string): Promise<void> {
  try {
    const { error } = await supabase.from("lead_activity").insert({
      lead_id: leadId,
      type: "automation_skipped",
      body: redact(body).slice(0, 500),
      created_by: "automation",
    });
    if (error) {
      console.error(`[Automation] skip note failed: ${redact(String(error.message || error.code))}`);
    }
  } catch (error: any) {
    console.error(`[Automation] skip note failed: ${redact(String(error?.message || error))}`);
  }
}

/**
 * Queues the plan for one lead. Never throws.
 *
 * Returns ok:true with `queued: 0` when the lead is legitimately skipped
 * (already enrolled, customer, paused, no consent) - that is not an error, and
 * the caller should not retry it.
 */
export async function enrollLead(input: EnrollLeadInput): Promise<EnrollResult> {
  try {
    const leadId = String(input.leadId || "").trim();
    if (!leadId) return { ok: false, error: "no lead id" };

    const supabase = serviceClient();
    if (!supabase) return { ok: false, error: "supabase not configured" };

    const { data: leadRow, error: leadError } = await supabase
      .from("leads")
      .select(
        "id,email,status,marketing_paused,sequence_enrolled_at,audit_score,has_website,review_count,rating"
      )
      .eq("id", leadId)
      .maybeSingle();

    // A missing table/column means the migration is not applied here: report it
    // (the admin tab surfaces the reason) instead of pretending a plan exists.
    if (leadError) {
      const message = redact(String(leadError.message || leadError.code));
      console.error(`[Automation] enroll lookup failed: ${message}`);
      return { ok: false, error: message };
    }
    if (!leadRow?.id) return { ok: false, error: "lead not found" };
    const lead: any = leadRow;

    const email = normalizeEmail(input.email || lead.email);
    if (!email) return { ok: false, skipped: "lead has no email address" };

    // Hard do-not-email before anything else: an address that unsubscribed or
    // hard-bounced must never reach the queue, whatever the consent table says.
    const suppression = await checkSuppressionStrict(supabase, email);
    if (suppression.state === "error") {
      // Cannot tell -> enroll nothing. The next report card tries again, so an
      // outage of the suppression table can only delay a plan, never skip it
      // silently and never mail an unsubscribed address.
      return { ok: false, error: suppression.reason || "suppression check failed" };
    }
    if (suppression.state === "blocked") {
      const reason = suppression.reason || "address is on the do-not-email list";
      await logSkipNote(supabase, leadId, `Not enrolled: ${reason}`);
      return { ok: true, queued: 0, skipped: reason };
    }

    if (isStopStatus(lead.status)) {
      return { ok: true, queued: 0, skipped: `status "${lead.status}" ends automation` };
    }
    if (lead.marketing_paused === true) {
      return { ok: true, queued: 0, skipped: "automation paused for this lead" };
    }
    if (lead.sequence_enrolled_at) {
      return { ok: true, queued: 0, skipped: "already enrolled" };
    }

    // Segment from the stored audit signals - the same function the leads table
    // uses for its badge, so the plan and the badge can never disagree.
    const signals: LeadPrioritySignals = {
      audit_score: lead.audit_score ?? null,
      hasWebsite: typeof lead.has_website === "boolean" ? lead.has_website : null,
      reviewCount: lead.review_count ?? null,
      rating: lead.rating ?? null,
    };
    const segment: SequenceSegment = getLeadPriority(signals).level;

    // EVERY step is marketing mail - the review ask included - so an active
    // opt-in is required before a single row is written.
    const consent = await checkMarketingConsent(supabase, leadId);
    if (consent.state === "error") {
      // Cannot tell -> queue nothing rather than queue un-consented mail. A
      // later send of the report card enrolls again, so nothing is lost.
      return { ok: false, error: consent.reason || "consent check failed" };
    }
    if (consent.state === "blocked") {
      const reason = consent.reason || "no active marketing consent";
      await logSkipNote(supabase, leadId, `Not enrolled: ${reason}`);
      return { ok: true, segment, queued: 0, skipped: reason };
    }

    const startAt = input.startAt instanceof Date ? input.startAt : new Date();
    const rows = planQueueRows({ segment, email, startAt });
    if (rows.length === 0) {
      return { ok: true, segment, queued: 0, skipped: "no steps apply to this lead" };
    }

    // Mark the lead FIRST: this is the lock that makes a concurrent second call
    // give up (`sequence_enrolled_at` is checked above), and it is also what the
    // admin tab reads.
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        sequence_segment: segment,
        sequence_enrolled_at: startAt.toISOString(),
      })
      .eq("id", leadId);

    if (updateError) {
      const message = redact(String(updateError.message || updateError.code));
      console.error(`[Automation] enroll update failed: ${message}`);
      return { ok: false, error: message };
    }

    const { data: inserted, error: insertError } = await supabase
      .from("message_queue")
      .upsert(
        rows.map((row) => ({
          lead_id: leadId,
          email,
          channel: "email",
          step_key: row.step_key,
          segment: row.segment,
          kind: row.kind,
          status: "pending",
          run_at: row.run_at,
        })),
        { onConflict: "lead_id,step_key", ignoreDuplicates: true }
      )
      .select("id");

    if (insertError) {
      const message = redact(String(insertError.message || insertError.code));
      console.error(`[Automation] enroll insert failed: ${message}`);
      return { ok: false, segment, error: message };
    }

    const queued = (inserted || []).length;

    // Timeline entry: the drawer should explain where the plan came from.
    const { error: activityError } = await supabase.from("lead_activity").insert({
      lead_id: leadId,
      type: "automation_enrolled",
      body: `${segment.toUpperCase()} plan: ${rows.length} email(s) queued`,
      created_by: "automation",
    });
    if (activityError) {
      // Never fail enrollment because the timeline could not be written.
      console.error(
        `[Automation] enroll activity failed: ${redact(String(activityError.message || activityError.code))}`
      );
    }

    return { ok: true, segment, queued };
  } catch (error: any) {
    const message = redact(String(error?.message || error));
    console.error(`[Automation] enroll failed: ${message}`);
    return { ok: false, error: message };
  }
}

/**
 * Cancels every PENDING row for one address.
 *
 * Used by the stop events that arrive from outside the queue: an unsubscribe
 * (/api/unsubscribe), a hard bounce or a spam complaint (/api/webhooks/resend).
 * Already-sent rows keep status "sent" - the history stays true - and rows in
 * "sending" are left alone; the drainer re-checks suppression right before the
 * provider call, so an in-flight row cannot sneak past this.
 */
export async function cancelQueueForEmail(
  email: string | null | undefined,
  reason: string,
  supabase?: SupabaseClient | null
): Promise<number> {
  const address = normalizeEmail(email);
  if (!address) return 0;

  const client = supabase || serviceClient();
  if (!client) return 0;

  try {
    const { data, error } = await client
      .from("message_queue")
      .update({
        status: "cancelled",
        last_error: redact(reason),
        updated_at: new Date().toISOString(),
      })
      .eq("email", address)
      .eq("status", "pending")
      .select("id");

    if (error) {
      console.error(`[Automation] cancel by email failed: ${redact(String(error.message || error.code))}`);
      return 0;
    }
    return (data || []).length;
  } catch (error: any) {
    console.error(`[Automation] cancel by email failed: ${redact(String(error?.message || error))}`);
    return 0;
  }
}

/** Same as cancelQueueForEmail, scoped to one lead (manual pause / lead lost). */
export async function cancelQueueForLead(
  leadId: string | null | undefined,
  reason: string,
  supabase?: SupabaseClient | null
): Promise<number> {
  const id = String(leadId || "").trim();
  if (!id) return 0;

  const client = supabase || serviceClient();
  if (!client) return 0;

  try {
    const { data, error } = await client
      .from("message_queue")
      .update({
        status: "cancelled",
        last_error: redact(reason),
        updated_at: new Date().toISOString(),
      })
      .eq("lead_id", id)
      .eq("status", "pending")
      .select("id");

    if (error) {
      console.error(`[Automation] cancel by lead failed: ${redact(String(error.message || error.code))}`);
      return 0;
    }
    return (data || []).length;
  } catch (error: any) {
    console.error(`[Automation] cancel by lead failed: ${redact(String(error?.message || error))}`);
    return 0;
  }
}

