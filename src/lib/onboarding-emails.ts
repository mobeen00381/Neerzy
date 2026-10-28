// src/lib/onboarding-emails.ts
/**
 * Exactly-once onboarding emails.
 *
 * M2 scope: the WELCOME email, fired after a successful GMB connect. The same
 * claim primitive is written for "howto" so the follow-up cron can reuse it
 * without touching this file again.
 *
 * WHY A CLAIM AND NOT A BOOLEAN CHECK
 * The connect hook runs inside `after()`, so the send is asynchronous and the
 * endpoint can legitimately be hit twice (double submit, retry, second tab).
 * A read-then-write check lets both invocations see 'none' and both send. So
 * the M1 state machine is driven by ONE conditional UPDATE:
 *
 *   'none' -> 'pending' (claimed) -> 'sent' | 'failed' | 'none'
 *
 *  - the UPDATE only matches rows that are still claimable, so exactly one
 *    caller gets a row back from `.select('id')` - that caller is the winner,
 *  - 'sent' is terminal, so a reconnect NEVER resends,
 *  - a claim older than CLAIM_STALE_MS is abandoned and may be taken over, so
 *    a crashed invocation can not block the email forever,
 *  - any failure - and every DRY_RUN send - RELEASES the claim, so the real
 *    send is never consumed by a preview run or a transient Resend error.
 *
 * SAFETY RULES
 *  - column names come ONLY from the COLUMNS whitelist below (never from a
 *    caller), so no identifier can ever be injected into a filter,
 *  - the stale cutoff is an ISO-8601 UTC string built in JS, which needs no
 *    quoting or escaping inside the PostgREST `.or()` filter,
 *  - logs carry the user id, the kind and the outcome - never an email
 *    address, never a subject/body, never an env value,
 *  - every error string passes through redact() before it is logged,
 *  - nothing here ever throws: callers are fire-and-forget hooks.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logEmailSend, redact, sendEmail } from "@/lib/email";
import { howtoEmailContent, welcomeEmailContent } from "@/lib/email-templates";

/** A claim older than this is treated as abandoned and may be taken over. */
export const CLAIM_STALE_MS = 10 * 60 * 1000;

export type OnboardingEmailKind = "welcome" | "howto";

interface OnboardingEmailColumns {
  status: string;
  claimedAt: string;
  sentAt: string;
}

/**
 * Column WHITELIST. Every identifier used in a query is read from this table,
 * so a bad/unknown `kind` can only ever be rejected - it can never become SQL.
 */
const COLUMNS: Record<OnboardingEmailKind, OnboardingEmailColumns> = {
  welcome: {
    status: "welcome_email_status",
    claimedAt: "welcome_email_claimed_at",
    sentAt: "welcome_sent_at",
  },
  howto: {
    status: "howto_email_status",
    claimedAt: "howto_email_claimed_at",
    sentAt: "howto_sent_at",
  },
};

/** Returns the column set for a kind, or null when the kind is not whitelisted. */
export function onboardingEmailColumns(kind: string): OnboardingEmailColumns | null {
  return Object.prototype.hasOwnProperty.call(COLUMNS, kind)
    ? COLUMNS[kind as OnboardingEmailKind]
    : null;
}

export type ClaimOutcome =
  | { claimed: true; claimedAtIso: string }
  | {
      claimed: false;
      reason: "unknown_kind" | "missing_user" | "already_claimed" | "db_error";
      error?: string;
    };

/**
 * Tries to take the at-most-once claim for (user, kind).
 *
 * The filter is the whole point: a row is claimable when it has never been
 * attempted, when a previous attempt failed, or when an earlier claim went
 * stale. 'sent' matches none of those, which is what makes a re-connect a
 * guaranteed no-op. PostgREST applies the filter to the UPDATE itself, so the
 * check and the write are a single atomic statement - that is what makes
 * concurrent invocations safe.
 *
 * NOTE: a 'pending' row always carries its claimed_at (written by the same
 * UPDATE), so `.lt` alone is enough. A hand-edited 'pending' row with a NULL
 * claimed_at can not match and would need a manual release.
 */
export async function claimOnboardingEmail(
  supabase: SupabaseClient,
  userId: string,
  kind: OnboardingEmailKind
): Promise<ClaimOutcome> {
  const cols = onboardingEmailColumns(kind);
  if (!cols) return { claimed: false, reason: "unknown_kind" };
  if (!userId) return { claimed: false, reason: "missing_user" };

  const claimedAtIso = new Date().toISOString();
  const staleCutoffIso = new Date(Date.now() - CLAIM_STALE_MS).toISOString();

  const claimable = [
    `${cols.status}.in.(none,failed)`,
    `and(${cols.status}.eq.pending,${cols.claimedAt}.lt.${staleCutoffIso})`,
  ].join(",");

  const { data, error } = await supabase
    .from("profiles")
    .update({ [cols.status]: "pending", [cols.claimedAt]: claimedAtIso })
    .eq("id", userId)
    .or(claimable)
    .select("id");

  if (error) return { claimed: false, reason: "db_error", error: redact(error.message) };
  // No row back = somebody else owns the claim, or it is already 'sent'.
  if (!Array.isArray(data) || data.length === 0) return { claimed: false, reason: "already_claimed" };
  return { claimed: true, claimedAtIso };
}

/**
 * Gives a claim back. `status` is the state the row should return to:
 *   "none"   - nothing usable happened (no email address, or a DRY_RUN send),
 *              so the real send must still be possible later,
 *   "failed" - a real send failed; the row stays retryable.
 *
 * The `.eq(status, "pending")` guard means only OUR claim is released: if a
 * concurrent worker already recorded 'sent', that terminal state is never
 * downgraded.
 */
export async function releaseOnboardingEmailClaim(
  supabase: SupabaseClient,
  userId: string,
  kind: OnboardingEmailKind,
  status: "none" | "failed"
): Promise<boolean> {
  const cols = onboardingEmailColumns(kind);
  if (!cols || !userId) return false;

  const { data, error } = await supabase
    .from("profiles")
    .update({ [cols.status]: status, [cols.claimedAt]: null })
    .eq("id", userId)
    .eq(cols.status, "pending")
    .select("id");

  if (error) {
    console.error(`[OnboardingEmail] release failed kind=${kind} user=${userId}: ${redact(error.message)}`);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

/** Records the terminal 'sent' state. Only called after a REAL successful send. */
async function markOnboardingEmailSent(
  supabase: SupabaseClient,
  userId: string,
  kind: OnboardingEmailKind
): Promise<boolean> {
  const cols = onboardingEmailColumns(kind);
  if (!cols) return false;

  const { error } = await supabase
    .from("profiles")
    .update({ [cols.status]: "sent", [cols.sentAt]: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    // The email really did go out; the claim stays 'pending' so the 10-minute
    // takeover reconciles it instead of silently resending.
    console.error(`[OnboardingEmail] mark sent failed kind=${kind} user=${userId}: ${redact(error.message)}`);
    return false;
  }
  return true;
}

/** Conservative address check - a junk/missing address means "do not send". */
export function isValidEmail(value: unknown): value is string {
  const email = String(value ?? "").trim();
  if (email.length < 4 || email.length > 254) return false;
  if (/[\r\n]/.test(email)) return false;
  return /^[^\s@,;:<>()[\]\\]+@[^\s@,;:<>()[\]\\]+\.[A-Za-z]{2,}$/.test(email);
}

/**
 * The recipient address. `profiles` stores no email column, so auth.users is
 * the source of truth - the same conclusion as getAllAuthEmails() in
 * lib/admin-server.ts. The address is never logged.
 */
async function resolveUserEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      console.warn(`[OnboardingEmail] auth lookup failed user=${userId}: ${redact(error.message)}`);
      return null;
    }
    const email = data?.user?.email;
    return isValidEmail(email) ? email.trim() : null;
  } catch (err: any) {
    console.warn(`[OnboardingEmail] auth lookup threw user=${userId}: ${redact(String(err?.message || err))}`);
    return null;
  }
}

export type OnboardingEmailOutcome = {
  kind: OnboardingEmailKind;
  outcome: "sent" | "dry_run_released" | "skipped";
  /** Why it was skipped - safe to log (no addresses, no bodies). */
  reason?: string;
};

/**
 * Claim -> send -> commit-or-release for one (user, kind).
 *
 * NEVER throws: it always resolves to an outcome, because the caller is a
 * fire-and-forget `after()` hook that must not affect the HTTP response.
 */
export async function sendOnboardingEmail(
  supabase: SupabaseClient,
  userId: string,
  kind: OnboardingEmailKind,
  opts?: { businessName?: string | null }
): Promise<OnboardingEmailOutcome> {
  const log = (outcome: string) =>
    console.log(`[OnboardingEmail] kind=${kind} user=${userId} outcome=${outcome}`);

  try {
    const cols = onboardingEmailColumns(kind);
    if (!cols) {
      log("skipped_unknown_kind");
      return { kind, outcome: "skipped", reason: "unknown_kind" };
    }

    // 1. Claim BEFORE anything else: the claim is the concurrency gate, so two
    //    simultaneous invocations can not both proceed.
    const claim = await claimOnboardingEmail(supabase, userId, kind);
    if (!claim.claimed) {
      if (claim.reason === "db_error") {
        console.error(
          `[OnboardingEmail] claim failed kind=${kind} user=${userId} outcome=skipped_db_error: ${redact(claim.error || "")}`
        );
      } else {
        // Already sent (reconnect) or owned by another invocation: silent no-op.
        log(`skipped_${claim.reason}`);
      }
      return { kind, outcome: "skipped", reason: claim.reason };
    }

    // 2. No valid address -> release the claim so a later connect can send it.
    const email = await resolveUserEmail(supabase, userId);
    if (!email) {
      await releaseOnboardingEmailClaim(supabase, userId, kind, "none");
      log("skipped_no_email");
      return { kind, outcome: "skipped", reason: "no_email" };
    }

    const content =
      kind === "welcome"
        ? welcomeEmailContent(opts?.businessName ?? null)
        : howtoEmailContent(opts?.businessName ?? null);

    const send = await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      text: content.text,
      template: kind,
    });

    // 3. DRY_RUN delivered nothing: never 'sent', never a consumed claim.
    //    logEmailSend() is already a no-op in DRY_RUN, so no audit row either.
    if (send.dryRun) {
      await releaseOnboardingEmailClaim(supabase, userId, kind, "none");
      log("dry_run_released");
      return { kind, outcome: "dry_run_released" };
    }

    // 4. Real send failed -> release as 'failed' so a retry is possible.
    if (!send.ok) {
      await releaseOnboardingEmailClaim(supabase, userId, kind, "failed");
      await logEmailSend({
        emailType: kind,
        userId,
        toEmail: email,
        status: "failed",
        error: send.error ? redact(send.error) : null,
      });
      console.error(
        `[OnboardingEmail] send failed kind=${kind} user=${userId} outcome=skipped_send_failed: ${redact(send.error || "unknown")}`
      );
      return { kind, outcome: "skipped", reason: "send_failed" };
    }

    // 5. Real send succeeded -> terminal 'sent' + audit row.
    await markOnboardingEmailSent(supabase, userId, kind);
    await logEmailSend({
      emailType: kind,
      userId,
      toEmail: email,
      providerId: send.id ?? null,
      status: "sent",
    });
    log("sent");
    return { kind, outcome: "sent" };
  } catch (err: any) {
    // Last-resort guard: release so a real send is never lost. Release is only
    // attempted for a claim this call may own, and it re-checks 'pending'.
    await releaseOnboardingEmailClaim(supabase, userId, kind, "none").catch(() => false);
    console.error(
      `[OnboardingEmail] unexpected error kind=${kind} user=${userId} outcome=skipped_error: ${redact(String(err?.message || err))}`
    );
    return { kind, outcome: "skipped", reason: "exception" };
  }
}

/**
 * M2 entry point: the ONE welcome email for a successful GMB connect.
 * Called from src/app/api/gbp/connect/route.ts inside after().
 * Reconnects are no-ops because the claim can no longer match a 'sent' row.
 */
export async function sendWelcomeEmailForUser(
  supabase: SupabaseClient,
  userId: string,
  opts?: { businessName?: string | null }
): Promise<OnboardingEmailOutcome> {
  return sendOnboardingEmail(supabase, userId, "welcome", opts);
}
