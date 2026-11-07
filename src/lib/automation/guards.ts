// src/lib/automation/guards.ts
/**
 * Fail-CLOSED send guards for automated mail.
 *
 * Phase 0 made the transactional path fail-open on purpose: if the suppression
 * table is unreadable, lib/email.ts still delivers, because "Neerzy never emails
 * anyone again after a database hiccup" is the worse failure for a report
 * someone just asked for.
 *
 * Automation is the opposite trade. Nobody is waiting for day-3 of a sequence,
 * and mailing someone who unsubscribed is a compliance incident, so every check
 * here is TRI-STATE:
 *
 *   "clear"   - the guard passed, the step may be sent
 *   "blocked" - a definite NO (unsubscribed, no consent, stopped status, ...)
 *               -> the row is cancelled/skipped with that reason
 *   "error"   - we could NOT tell (DB down, migration missing, ...)
 *               -> the row stays pending and is retried, never sent blind
 *
 * The drainer treats "error" as "try again tomorrow" and logs the reason, so a
 * failure never silently turns into a send OR silently drops the sequence.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { CONSENT_PURPOSE_MARKETING } from "@/lib/consent";
import { redact } from "@/lib/email";
import { normalizeEmail } from "@/lib/unsubscribe";

/**
 * Lead statuses that END automation.
 *
 * `converted` and `trial_started` mean the person is already a customer, and
 * selling someone the product they just bought is the fastest way to look
 * broken. `lost` is the admin saying "stop". `new` and `contacted` keep going:
 * a called lead still needs the day-7 email, that is the whole point.
 */
export const STOP_STATUSES = ["converted", "trial_started", "lost"] as const;

export type StopStatus = (typeof STOP_STATUSES)[number];

export function isStopStatus(status: string | null | undefined): boolean {
  return (STOP_STATUSES as readonly string[]).includes(String(status || "").trim().toLowerCase());
}

/** Three-state answer shared by every guard below. */
export type GuardState = "clear" | "blocked" | "error";

export interface GuardResult {
  state: GuardState;
  /** Short, admin-facing reason. Always redacted before it is stored. */
  reason?: string;
}

const CLEAR: GuardResult = { state: "clear" };

function blocked(reason: string): GuardResult {
  return { state: "blocked", reason };
}

function failed(reason: string): GuardResult {
  return { state: "error", reason: redact(reason) };
}

/**
 * Hard do-not-email check (unsubscribe, permanent bounce, spam complaint).
 *
 * Strict version of lib/email.ts#isEmailSuppressed: a query failure is "error",
 * not "not suppressed". Applies to BOTH kinds - a review ask must not go to a
 * mailbox that already bounced.
 */
export async function checkSuppressionStrict(
  supabase: SupabaseClient,
  email: string | null | undefined
): Promise<GuardResult> {
  const address = normalizeEmail(email);
  if (!address) return blocked("lead has no email address");

  try {
    const { data, error } = await supabase
      .from("email_suppression")
      .select("email")
      .eq("email", address)
      .maybeSingle();

    // PGRST205 / 42P01: the Phase 0 migration is not applied on this
    // environment. Mailing from here could hit an unsubscribed address, so it
    // is an error (retry later) rather than a pass.
    if (error) return failed(`suppression lookup failed: ${error.message || error.code}`);
    if (data?.email) return blocked("address is on the do-not-email list");
    return CLEAR;
  } catch (err: any) {
    return failed(`suppression lookup failed: ${err?.message || err}`);
  }
}

/**
 * Active marketing opt-in for one lead + the email channel.
 *
 * `lead_consent` is the record of what the visitor actually ticked
 * (lib/consent.ts#MARKETING_CONSENT_TEXT), so this is the only thing that can
 * authorise a sales email. Opted-out rows stay in the table for the audit trail,
 * which is why the query filters on `opted_out_at IS NULL`.
 */
export async function checkMarketingConsent(
  supabase: SupabaseClient,
  leadId: string | null | undefined
): Promise<GuardResult> {
  const id = String(leadId || "").trim();
  if (!id) return blocked("no lead to check consent for");

  try {
    const { data, error } = await supabase
      .from("lead_consent")
      .select("id")
      .eq("lead_id", id)
      .eq("channel", "email")
      .eq("purpose", CONSENT_PURPOSE_MARKETING)
      .is("opted_out_at", null)
      .limit(1)
      .maybeSingle();

    if (error) return failed(`consent lookup failed: ${error.message || error.code}`);
    if (!data?.id) return blocked("no active marketing consent");
    return CLEAR;
  } catch (err: any) {
    return failed(`consent lookup failed: ${err?.message || err}`);
  }
}

/**
 * Everyone who already has a Neerzy account, as a lowercase email set.
 *
 * There is no email column on public.profiles - the address only exists in
 * auth.users - so the only reliable check is Supabase's admin listUsers API
 * (the call lib/admin-server.ts#getAllAuthEmails already makes). It is built
 * ONCE per cron run and shared by every row: one page-through is cheap, and
 * doing it per queue row would be 25 identical calls.
 *
 * Unlike getAllAuthEmails (best effort, partial map on failure), a listing
 * failure here is REPORTED: a partial set would mean emailing a customer.
 */
export interface SignedUpIndex {
  /** false = the list could not be read; treat matches as unknown. */
  ok: boolean;
  emails: Set<string>;
  pages: number;
  /** true when the scan stopped at MAX_USER_PAGES (very large user base). */
  truncated: boolean;
  error?: string;
}

/**
 * Upper bound on listUsers pages: 20 x 1000 = 20k accounts. Past that the scan
 * stops and reports `truncated` so the drainer can log it rather than pretend
 * it looked at everybody.
 */
const MAX_USER_PAGES = 20;
const USERS_PER_PAGE = 1000;

export async function loadSignedUpIndex(supabase: SupabaseClient): Promise<SignedUpIndex> {
  const emails = new Set<string>();
  let page = 1;

  try {
    for (;;) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: USERS_PER_PAGE,
      });

      if (error || !data) {
        return {
          ok: false,
          emails,
          pages: page,
          truncated: false,
          error: redact(String(error?.message || "user listing failed")),
        };
      }

      for (const user of data.users) {
        const address = normalizeEmail(user?.email);
        if (address) emails.add(address);
      }

      if (data.users.length < USERS_PER_PAGE) {
        return { ok: true, emails, pages: page, truncated: false };
      }
      if (page >= MAX_USER_PAGES) {
        return { ok: true, emails, pages: page, truncated: true };
      }
      page += 1;
    }
  } catch (err: any) {
    return {
      ok: false,
      emails,
      pages: page,
      truncated: false,
      error: redact(String(err?.message || err)),
    };
  }
}

/** True when this address already has an account (see loadSignedUpIndex). */
export function isSignedUp(email: string | null | undefined, index: SignedUpIndex): boolean {
  const address = normalizeEmail(email);
  if (!address) return false;
  return index.emails.has(address);
}
