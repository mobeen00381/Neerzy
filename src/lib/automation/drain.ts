// src/lib/automation/drain.ts
/**
 * The DRAINER: turn due public.message_queue rows into (at most) one email each.
 *
 * Lives in lib/ (not in the route) so two callers share one implementation:
 * /api/cron/automation (the daily 10:00 UTC run) and Admin -> Automation's
 * "run now" button. Nothing about a send lives in the route.
 *
 * The invariants, in the order they are enforced:
 *
 *  1. GLOBAL SWITCHES FIRST. agent_settings is read before anything else. If it
 *     cannot be read, the run ABORTS - we do not know whether automation is
 *     paused, so sending would be a guess. `automation_paused` stops the run,
 *     `daily_send_cap` bounds it (today's sent count is a head-count on
 *     message_queue, so the cap also survives a manual run from the admin tab).
 *  2. CLAIM, THEN SEND. A row is only sent after an atomic
 *     `UPDATE ... WHERE status = 'pending'` returns it. Two overlapping runs
 *     therefore cannot send the same email twice, and a row left in "sending"
 *     by a crashed run is reclaimed after 15 minutes.
 *  3. FAIL CLOSED PER ROW. Every guard in lib/automation/guards.ts is tri-state:
 *     "blocked" closes the row (cancelled/skipped), "error" puts it back to
 *     pending for tomorrow and never sends. Suppression and marketing consent are
 *     what make the review ask safe too - both are checked for EVERY row, because
 *     every step the sequences owe is marketing mail.
 *  4. THE QUEUE IS THE TRUTH. Every outcome is written back to the row
 *     (status + last_error + attempts), plus one lead_activity entry per send, so
 *     the admin tab can explain each lead without replaying logs.
 *
 * DRY RUN comes in two shapes and neither one consumes a row:
 *  - the `dryRun` option (admin "dry run" button): guards are evaluated so the
 *    plan is real, nothing is claimed, nothing is sent, nothing is written;
 *  - AUTOMATION_DRY_RUN=1 (lib/email.ts): rows ARE claimed and rendered, sendEmail()
 *    is a no-op that reports `dryRun: true`, and the row is put straight back to
 *    pending - never marked sent, never counted against the daily cap.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { auditReportUrl, isMockPlaceId } from "@/lib/audit-lead";
import { logEmailSend, redact, sendEmail } from "@/lib/email";
import { sequenceEmailContent } from "@/lib/email-templates";
import { appBaseUrl, reviewInviteUrl, websitePreviewUrl } from "@/lib/automation/offer-facts";
import {
  checkMarketingConsent,
  checkSuppressionStrict,
  isSignedUp,
  isStopStatus,
  loadSignedUpIndex,
  type SignedUpIndex,
} from "@/lib/automation/guards";
import { stepByKey, type SequenceStep } from "@/lib/automation/sequences";
import { makeUnlockToken } from "@/lib/report-unlock";

/** Send attempts before a row is parked as "failed" (admin can re-enrol). */
export const MAX_ATTEMPTS = 3;
/** A "sending" row older than this belongs to a run that died. */
export const STALE_SENDING_MINUTES = 15;
/** Rows considered per run - keeps one run inside the platform timeout. */
export const BATCH_LIMIT = 50;
/** Retry delay after a provider failure (attempts 1 and 2). */
const RETRY_DELAY_HOURS = 6;
/** Used when agent_settings has no row (migration applied, seed deleted). */
const FALLBACK_CAP = 50;
/** Sanity ceiling so a typo in the admin UI cannot mean "email everyone". */
const MAX_CAP = 1000;

/**
 * Steps whose whole argument is "you have nowhere to send your Google traffic".
 * A lead whose listing already links a website gets no email from them: it would
 * be a question we already know the answer to.
 */
const WEBSITE_OFFER_STEPS = new Set<string>(["hot_d3", "hot_d7", "warm_d6"]);

/** One note per run when AUTOMATION_DRY_RUN is on, so sent=0 is not alarming. */
const EMAIL_DRY_RUN_NOTE =
  "AUTOMATION_DRY_RUN is set: emails were rendered but not delivered, and every row stayed pending";

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

/** What happened to one queue row this run. */
export type DrainAction =
  | "sent"
  | "skipped"
  | "cancelled"
  | "failed"
  | "retry"
  | "would_send"
  | "would_skip"
  | "would_cancel";

export interface DrainOutcome {
  id: string;
  leadId: string;
  stepKey: string;
  kind: string;
  action: DrainAction;
  /** Short admin-facing reason. Redacted. Never contains an email address. */
  reason?: string;
}

export interface DrainOptions {
  /** Rehearsal: evaluate every guard, send nothing, write nothing. */
  dryRun?: boolean;
  /** Cap the rows handled in this call (admin "run now" previews use 10). */
  limit?: number;
  /** Fixed clock for tests / backfills. */
  now?: Date;
}

export interface DrainResult {
  ok: boolean;
  dryRun: boolean;
  paused: boolean;
  /** Daily cap currently in force. */
  cap: number;
  /** Rows already sent today (UTC). */
  sentToday: number;
  /** Cap headroom left when the run started. */
  remaining: number;
  /** Rows moved from "sending" back to "pending" (crashed run). */
  reclaimed: number;
  /** Rows this run looked at. */
  claimed: number;
  sent: number;
  skipped: number;
  cancelled: number;
  failed: number;
  /** Rows left pending for a later run (guard error or provider failure). */
  retried: number;
  /** True when there was more work left than this run handled. */
  backlog: boolean;
  /** Non-fatal note, e.g. the account list hit its page limit. */
  notes: string[];
  outcomes: DrainOutcome[];
  error?: string;
}

/** Every terminal/non-terminal action, initialised to zero. */
function emptyCounts() {
  return { sent: 0, skipped: 0, cancelled: 0, failed: 0, retried: 0 };
}

/** UTC midnight of `date` - the window the daily cap is counted over. */
export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
}

function clampCap(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return FALLBACK_CAP;
  return Math.min(Math.max(Math.trunc(parsed), 0), MAX_CAP);
}

/** The live report link for a lead, unlocked when we know the place. */
function reportUrlFor(lead: any): string {
  const placeId = String(lead?.place_id || "").trim();
  if (!placeId || isMockPlaceId(placeId)) return `${appBaseUrl()}/gmb-audit-tool`;
  return auditReportUrl(placeId, lead?.business_name || null, makeUnlockToken(placeId));
}

/** A claimed row plus the lead it belongs to. */
interface WorkRow {
  id: string;
  lead_id: string;
  email: string;
  step_key: string;
  kind: string;
  attempts: number;
  lead: any;
}

/**
 * Writes the new state of one queue row. Never throws: a lost update is logged
 * and the next run simply sees the row as it was.
 */
async function updateRow(
  supabase: SupabaseClient,
  id: string,
  patch: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from("message_queue")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error(`[Automation] queue update failed: ${redact(String(error.message || error.code))}`);
    }
  } catch (error: any) {
    console.error(`[Automation] queue update failed: ${redact(String(error?.message || error))}`);
  }
}

/** One timeline entry per send, so the drawer shows what the robot did. */
async function logActivity(
  supabase: SupabaseClient,
  leadId: string,
  type: string,
  body: string
): Promise<void> {
  try {
    const { error } = await supabase.from("lead_activity").insert({
      lead_id: leadId,
      type,
      body,
      created_by: "automation",
    });
    if (error) {
      console.error(`[Automation] activity insert failed: ${redact(String(error.message || error.code))}`);
    }
  } catch (error: any) {
    console.error(`[Automation] activity insert failed: ${redact(String(error?.message || error))}`);
  }
}

/** Actions a real run can take; dry run prefixes the first three with "would_". */
type LiveAction = "sent" | "skipped" | "cancelled" | "failed" | "retry";

interface RowContext {
  supabase: SupabaseClient;
  dryRun: boolean;
  now: Date;
  /** Built lazily: only sales rows need the account list, and only once. */
  signedUp: { value: SignedUpIndex | null };
  notes: string[];
}

/**
 * Evaluates and (outside a dry run) executes one queue row.
 *
 * Order matters: the cheap "is this person still a target" checks run before any
 * network call, and the provider call is last, after the claim, so a crash in
 * between can only ever mean "not sent".
 */
async function processRow(row: WorkRow, ctx: RowContext): Promise<DrainOutcome> {
  const { supabase, dryRun, now } = ctx;

  const outcome = (action: LiveAction, reason?: string): DrainOutcome => ({
    id: row.id,
    leadId: row.lead_id,
    stepKey: row.step_key,
    kind: row.kind,
    action: dryRun
      ? action === "sent"
        ? "would_send"
        : action === "skipped"
          ? "would_skip"
          : action === "cancelled"
            ? "would_cancel"
            : action
      : action,
    ...(reason ? { reason: redact(reason).slice(0, 300) } : {}),
  });

  /** Terminal state: the row will never be sent. */
  const close = async (
    status: "cancelled" | "skipped" | "failed",
    reason: string
  ): Promise<DrainOutcome> => {
    if (!dryRun) {
      await updateRow(supabase, row.id, {
        status,
        claimed_at: null,
        last_error: redact(reason).slice(0, 500),
      });
    }
    return outcome(status === "cancelled" ? "cancelled" : status === "skipped" ? "skipped" : "failed", reason);
  };

  /** Not sent, not closed: put it back in the queue (guard error / provider blip). */
  const retryLater = async (reason: string, attempts: number): Promise<DrainOutcome> => {
    if (!dryRun) {
      await updateRow(supabase, row.id, {
        status: "pending",
        attempts,
        claimed_at: null,
        run_at: new Date(now.getTime() + RETRY_DELAY_HOURS * 60 * 60 * 1000).toISOString(),
        last_error: redact(reason).slice(0, 500),
      });
    }
    return outcome("retry", reason);
  };

  const step: SequenceStep | null = stepByKey(row.step_key);
  if (!step) return close("cancelled", `unknown step key "${row.step_key}"`);
  if (step.key !== row.step_key.trim()) return close("cancelled", "step key does not match a known plan");

  const lead = row.lead || {};
  if (row.kind !== "sales" && row.kind !== "review") {
    return close("cancelled", `unknown queue kind "${row.kind}"`);
  }
  if (String(row.email || "").trim().length === 0) {
    return close("cancelled", "queue row has no email address");
  }
  if (isStopStatus(lead.status)) {
    return close("cancelled", `lead status "${lead.status}" ends automation`);
  }
  if (lead.marketing_paused === true) {
    return close("cancelled", "automation paused for this lead");
  }

  // Hard do-not-email first: unsubscribed, bounced, complained. Both kinds.
  const suppression = await checkSuppressionStrict(supabase, row.email);
  if (suppression.state === "blocked") {
    return close("cancelled", suppression.reason || "address is suppressed");
  }
  if (suppression.state === "error") {
    return retryLater(suppression.reason || "suppression check failed", row.attempts || 0);
  }

  // EVERY step the sequences owe is marketing mail - the day-5 review ask
  // included - so every row needs an active marketing opt-in. Missing consent
  // cancels the row; a consent table we could not read only postpones it.
  const consent = await checkMarketingConsent(supabase, row.lead_id);
  if (consent.state === "blocked") {
    return close("cancelled", consent.reason || "no active marketing consent");
  }
  if (consent.state === "error") {
    return retryLater(consent.reason || "consent check failed", row.attempts || 0);
  }

  // Already a customer? Then the sales sequence is over, whatever the lead row
  // says (they may have signed up from another browser). The review ask skips
  // this check on purpose: asking a customer for a review is the point of it.
  if (step.kind === "sales") {
    if (!ctx.signedUp.value) ctx.signedUp.value = await loadSignedUpIndex(supabase);
    const index = ctx.signedUp.value;
    if (!index.ok) {
      return retryLater(index.error || "could not read the account list", row.attempts || 0);
    }
    if (index.truncated && !ctx.notes.includes("account list truncated (very large user base)")) {
      ctx.notes.push("account list truncated (very large user base)");
    }
    if (isSignedUp(row.email, index)) {
      return close("cancelled", "recipient already has a Neerzy account");
    }
  }

  // A website-offer email to a business that already has a website asks a
  // question we know the answer to. Only a measured `true` skips the step -
  // null means "never checked", not "none", and an unchecked lead still gets it.
  if (lead.has_website === true && WEBSITE_OFFER_STEPS.has(step.key)) {
    return close("skipped", "lead already has a website");
  }

  const content = sequenceEmailContent({
    stepKey: step.key,
    businessName: lead.business_name,
    score: typeof lead.audit_score === "number" ? lead.audit_score : null,
    reviewCount: typeof lead.review_count === "number" ? lead.review_count : null,
    rating: typeof lead.rating === "number" ? Number(lead.rating) : null,
    hasWebsite: typeof lead.has_website === "boolean" ? lead.has_website : null,
    reportUrl: reportUrlFor(lead),
    previewUrl: websitePreviewUrl(),
    reviewUrl: reviewInviteUrl(),
    email: row.email,
  });

  // No copy = no email. The review ask is the only step that can land here in
  // practice (NEERZY_REVIEW_URL not configured), and sending "leave us a review"
  // with no button is worse than sending nothing.
  if (!content) {
    return close(
      "skipped",
      step.kind === "review"
        ? "review link not configured (NEERZY_REVIEW_URL)"
        : `no message copy for step "${step.key}"`
    );
  }

  if (dryRun) return outcome("sent", `${step.label} would be sent`);

  const result = await sendEmail({
    to: row.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
    template: `automation_${step.key}`,
    // Every step is marketing mail, so every send respects the suppression list
    // and carries the RFC 8058 one-click unsubscribe headers.
    marketing: true,
  });

  // AUTOMATION_DRY_RUN makes sendEmail() a no-op that reports dryRun: true. A row
  // that was "sent" in that mode must not be consumed: put it back to pending with
  // its run_at and attempts untouched (no attempts++ means a rehearsal can never
  // park a real row as failed), so the next live run still owes it. Rows are
  // processed from a one-shot snapshot taken at the start of the run, so nothing
  // can be re-picked in this run and the loop terminates.
  if (result.dryRun === true) {
    await updateRow(supabase, row.id, {
      status: "pending",
      claimed_at: null,
      last_error: "dry run: not sent",
    });
    if (!ctx.notes.includes(EMAIL_DRY_RUN_NOTE)) ctx.notes.push(EMAIL_DRY_RUN_NOTE);
    return outcome("retry", `${step.label} not sent (dry run)`);
  }

  const sentAt = new Date();

  if (result.ok) {
    await updateRow(supabase, row.id, {
      status: "sent",
      sent_at: sentAt.toISOString(),
      claimed_at: null,
      last_error: null,
    });

    await logEmailSend({
      emailType: `automation_${step.key}`,
      channel: "email",
      leadId: row.lead_id,
      toEmail: row.email,
      providerId: result.id ?? null,
      status: "sent",
    });

    // Drives "when did we last reach this lead" in the admin leads table.
    try {
      const { error } = await supabase
        .from("leads")
        .update({ last_contacted_at: sentAt.toISOString() })
        .eq("id", row.lead_id);
      if (error) {
        console.error(`[Automation] lead stamp failed: ${redact(String(error.message || error.code))}`);
      }
    } catch (error: any) {
      console.error(`[Automation] lead stamp failed: ${redact(String(error?.message || error))}`);
    }

    await logActivity(supabase, row.lead_id, "automation_sent", `${step.label} sent`);
    return outcome("sent", `${step.label} sent`);
  }

  // A suppressed address is a definite NO, not a transient failure.
  if (result.error === "suppressed") {
    return close("cancelled", "address is on the do-not-email list");
  }

  const attempts = (row.attempts || 0) + 1;
  const reason = `send failed (attempt ${attempts}/${MAX_ATTEMPTS}): ${result.error || "unknown error"}`;

  if (attempts >= MAX_ATTEMPTS) {
    await updateRow(supabase, row.id, {
      status: "failed",
      attempts,
      claimed_at: null,
      last_error: redact(reason).slice(0, 500),
    });
    await logEmailSend({
      emailType: `automation_${step.key}`,
      channel: "email",
      leadId: row.lead_id,
      toEmail: row.email,
      status: "failed",
      error: reason,
    });
    await logActivity(supabase, row.lead_id, "automation_failed", `${step.label}: ${redact(reason)}`);
    return outcome("failed", reason);
  }

  return retryLater(reason, attempts);
}

/**
 * Drains the queue once. Never throws: every failure comes back as ok:false with
 * a redacted reason, so the caller can answer 500 without wrapping anything.
 */
export async function drainQueue(options: DrainOptions = {}): Promise<DrainResult> {
  const now = options.now instanceof Date ? options.now : new Date();
  const dryRun = options.dryRun === true;
  const base: DrainResult = {
    ok: false,
    dryRun,
    paused: false,
    cap: FALLBACK_CAP,
    sentToday: 0,
    remaining: 0,
    reclaimed: 0,
    claimed: 0,
    ...emptyCounts(),
    backlog: false,
    notes: [],
    outcomes: [],
  };

  const supabase = serviceClient();
  if (!supabase) {
    console.error("[Automation] drain skipped: Supabase service credentials are not configured.");
    return { ...base, error: "supabase not configured" };
  }

  // ── 1. Global switches ────────────────────────────────────────────────────
  const { data: settings, error: settingsError } = await supabase
    .from("agent_settings")
    .select("automation_paused, daily_send_cap")
    .eq("id", "default")
    .maybeSingle();

  // Unknown pause state = do not send. The migration may be missing, which is
  // exactly when guessing would be most expensive.
  if (settingsError) {
    const message = redact(String(settingsError.message || settingsError.code));
    console.error(`[Automation] settings lookup failed, aborting run: ${message}`);
    return { ...base, error: `settings lookup failed: ${message}` };
  }

  const cap = clampCap((settings as any)?.daily_send_cap);
  // No seed row = unknown pause state = do not send. The migration seeds
  // id='default' with automation_paused = true, so this only catches a
  // half-migrated environment where guessing would be most expensive.
  const paused = !settings || (settings as any).automation_paused === true;

  const { count: sentToday, error: countError } = await supabase
    .from("message_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", startOfUtcDay(now).toISOString());

  if (countError) {
    const message = redact(String(countError.message || countError.code));
    console.error(`[Automation] could not count today's sends, aborting run: ${message}`);
    return { ...base, cap, paused, error: `send count failed: ${message}` };
  }

  const alreadySent = sentToday || 0;
  const remaining = Math.max(0, cap - alreadySent);
  const withLimits: DrainResult = { ...base, ok: true, cap, paused, sentToday: alreadySent, remaining };

  if (paused) {
    console.log("[Automation] run skipped: automation is paused in agent_settings.");
    return withLimits;
  }
  if (remaining === 0) {
    console.log(`[Automation] run skipped: daily cap reached (${alreadySent}/${cap}).`);
    return withLimits;
  }

  // ── 2. Reclaim rows abandoned by a run that died mid-send ─────────────────
  const cutoff = new Date(now.getTime() - STALE_SENDING_MINUTES * 60 * 1000).toISOString();
  let staleIds: string[] = [];
  try {
    for (const filter of ["is", "lt"] as const) {
      const query = supabase.from("message_queue").select("id").eq("status", "sending");
      const { data, error } =
        filter === "is" ? await query.is("claimed_at", null) : await query.lt("claimed_at", cutoff);
      if (error) {
        console.error(`[Automation] stale claim scan failed: ${redact(String(error.message || error.code))}`);
        continue;
      }
      staleIds = staleIds.concat((data || []).map((row: any) => String(row.id)));
    }
  } catch (error: any) {
    console.error(`[Automation] stale claim scan failed: ${redact(String(error?.message || error))}`);
  }

  if (staleIds.length > 0 && !dryRun) {
    const { error } = await supabase
      .from("message_queue")
      .update({ status: "pending", claimed_at: null, updated_at: now.toISOString() })
      .in("id", staleIds);
    if (error) {
      console.error(`[Automation] reclaim failed: ${redact(String(error.message || error.code))}`);
      staleIds = [];
    }
  }

  // ── 3. Pull the due rows ──────────────────────────────────────────────────
  const requested = Number(options.limit);
  const limit = Math.max(
    1,
    Math.min(Number.isFinite(requested) && requested > 0 ? Math.trunc(requested) : BATCH_LIMIT, BATCH_LIMIT, remaining)
  );

  const { data: dueRows, error: dueError } = await supabase
    .from("message_queue")
    .select("id, lead_id, email, step_key, kind, attempts, run_at")
    .eq("status", "pending")
    .lte("run_at", now.toISOString())
    .order("run_at", { ascending: true })
    .limit(limit);

  if (dueError) {
    const message = redact(String(dueError.message || dueError.code));
    console.error(`[Automation] queue read failed: ${message}`);
    return { ...withLimits, ok: false, reclaimed: staleIds.length, error: `queue read failed: ${message}` };
  }

  const rows: any[] = dueRows || [];
  if (rows.length === 0) {
    return { ...withLimits, reclaimed: staleIds.length };
  }

  // ── 4. One lead read for the whole batch (not one per row) ────────────────
  const leadIds = Array.from(new Set(rows.map((row) => String(row.lead_id)).filter(Boolean)));
  const leadsById = new Map<string, any>();
  const { data: leadRows, error: leadError } = await supabase
    .from("leads")
    .select(
      "id, business_name, status, audit_score, has_website, review_count, rating, marketing_paused, place_id"
    )
    .in("id", leadIds);

  if (leadError) {
    const message = redact(String(leadError.message || leadError.code));
    console.error(`[Automation] lead read failed: ${message}`);
    return { ...withLimits, ok: false, reclaimed: staleIds.length, error: `lead read failed: ${message}` };
  }
  for (const lead of leadRows || []) {
    leadsById.set(String((lead as any).id), lead);
  }

  // ── 5. Claim + send, one row at a time ────────────────────────────────────
  const ctx: RowContext = { supabase, dryRun, now, signedUp: { value: null }, notes: [] };
  const counts = emptyCounts();
  const outcomes: DrainOutcome[] = [];
  let claimed = 0;

  for (const row of rows) {
    const lead = leadsById.get(String(row.lead_id));
    if (!lead) {
      // The FK makes this impossible; if it ever happens the row is not sendable.
      if (!dryRun) {
        await updateRow(supabase, row.id, {
          status: "cancelled",
          claimed_at: null,
          last_error: "lead no longer exists",
        });
      }
      counts.cancelled += 1;
      outcomes.push({
        id: row.id,
        leadId: String(row.lead_id),
        stepKey: String(row.step_key),
        kind: String(row.kind),
        action: dryRun ? "would_cancel" : "cancelled",
        reason: "lead no longer exists",
      });
      continue;
    }

    if (!dryRun) {
      // Atomic claim: only the run whose UPDATE still sees status 'pending' wins.
      const { data: claimedRows, error: claimError } = await supabase
        .from("message_queue")
        .update({
          status: "sending",
          claimed_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", row.id)
        .eq("status", "pending")
        .select("id");

      if (claimError || (claimedRows || []).length === 0) {
        // Someone else took it, or the write failed: leave it alone.
        console.warn(
          `[Automation] claim lost for ${row.id}${
            claimError ? `: ${redact(String(claimError.message || claimError.code))}` : ""
          }`
        );
        continue;
      }
    }

    claimed += 1;
    const workRow: WorkRow = {
      id: String(row.id),
      lead_id: String(row.lead_id),
      email: String(row.email || ""),
      step_key: String(row.step_key || ""),
      kind: String(row.kind || ""),
      attempts: Number(row.attempts) || 0,
      lead,
    };

    const outcome = await processRow(workRow, ctx);
    outcomes.push(outcome);
    switch (outcome.action) {
      case "sent":
      case "would_send":
        counts.sent += 1;
        break;
      case "skipped":
      case "would_skip":
        counts.skipped += 1;
        break;
      case "cancelled":
      case "would_cancel":
        counts.cancelled += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
      default:
        counts.retried += 1;
    }
  }

  const result: DrainResult = {
    ...withLimits,
    ...counts,
    reclaimed: staleIds.length,
    claimed,
    backlog: rows.length >= limit,
    notes: ctx.notes,
    outcomes,
  };

  console.log(
    `[Automation] run done${dryRun ? " (dry run)" : ""}: sent=${counts.sent} skipped=${counts.skipped} ` +
      `cancelled=${counts.cancelled} failed=${counts.failed} retry=${counts.retried} ` +
      `reclaimed=${result.reclaimed} cap=${cap} sentToday=${alreadySent}`
  );

  return result;
}
