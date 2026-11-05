// src/lib/email.ts
/**
 * Resend email client - the GUARANTEED delivery channel for onboarding and
 * lead-automation emails (WhatsApp is best-effort only; see lib/whatsapp.ts).
 * Plain fetch, no SDK - same style as lib/whatsapp.ts.
 *
 * Env vars (values are NEVER logged):
 *   RESEND_API_KEY     - Resend API key. Missing => sendEmail returns ok:false (never throws).
 *   EMAIL_FROM         - default "Neerzy <support@neerzy.com>"
 *   EMAIL_REPLY_TO     - default "support@neerzy.com"
 *   AUTOMATION_DRY_RUN - "1"/"true" logs instead of sending (local tests / staging).
 *
 * Marketing vs transactional:
 *  - transactional sends (report delivery, admin follow-ups, onboarding) behave
 *    exactly as before,
 *  - a send with `marketing: true` is checked against public.email_suppression
 *    and carries the RFC 8058 one-click unsubscribe headers (lib/unsubscribe.ts).
 *
 * Security rules:
 *  - sendEmail() NEVER throws; callers record sent/failed from the result.
 *  - every error string passes through redact() before logging or storing.
 *  - DRY_RUN logs template name + recipient count ONLY - no subject, no body,
 *    no names/addresses, no env values, no headers.
 *  - DRY_RUN never writes email_log rows (nothing was actually sent).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { unsubscribeHeaders } from "@/lib/unsubscribe";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Strips secrets from any string before it is logged or persisted:
 * Resend keys (re_*), Anthropic keys (sk-ant-*), Bearer tokens and JWTs.
 */
export function redact(input: string): string {
  if (!input) return input;
  return String(input)
    .replace(/\bre_[A-Za-z0-9_-]{6,}/g, "re_[REDACTED]")
    .replace(/\bsk-ant-[A-Za-z0-9_-]{6,}/g, "sk-ant-[REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "[REDACTED_JWT]");
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Template name for logs - DRY_RUN prints this instead of body content. */
  template?: string;
  replyTo?: string;
  from?: string;
  headers?: Record<string, string>;
  /**
   * Marketing mail (tips, previews, sequences) as opposed to transactional mail
   * (a report the visitor asked for, a follow-up from an admin).
   *
   * When true, sendEmail():
   *  - refuses to send to any recipient on public.email_suppression and returns
   *    { ok:false, error:"suppressed" } (nothing leaves the building),
   *  - adds the RFC 8058 one-click unsubscribe headers.
   * Existing transactional sends are untouched - they never set this flag.
   */
  marketing?: boolean;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  status?: number;
  dryRun?: boolean;
}

export function isDryRun(): boolean {
  const v = (process.env.AUTOMATION_DRY_RUN || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "Neerzy <support@neerzy.com>";
}

export function getEmailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO || "support@neerzy.com";
}

/**
 * Service-role Supabase client. Returns null when the env vars are absent, so
 * every caller below can degrade instead of throwing.
 */
function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export type SuppressionReason = "unsubscribe" | "bounce" | "complaint" | "manual";

/**
 * Which of these addresses are on public.email_suppression (see
 * 20261106_consent_suppression.sql). Always lowercase on both sides - the column
 * stores lowercase only.
 *
 * FAIL-OPEN on purpose: a missing table (migration not applied yet), a network
 * blip or a missing service key all return an empty set and log. The alternative
 * - refusing to send whenever the lookup fails - would turn a database hiccup
 * into "Neerzy never emails anyone again", which is the worse failure. The
 * suppression list is checked again on every single send, so the moment the
 * table is readable the block applies.
 */
export async function getSuppressedEmails(emails: string[]): Promise<Set<string>> {
  const addresses = Array.from(
    new Set(emails.map((e) => String(e || "").trim().toLowerCase()).filter(Boolean))
  );
  if (addresses.length === 0) return new Set();

  const supabase = serviceClient();
  if (!supabase) return new Set();

  try {
    const { data, error } = await supabase
      .from("email_suppression")
      .select("email")
      .in("email", addresses);
    if (error) {
      console.error(`[Email] suppression lookup failed: ${redact(String(error.message || error.code))}`);
      return new Set();
    }
    return new Set(
      (data || [])
        .map((row: any) => String(row?.email || "").trim().toLowerCase())
        .filter((email: string) => Boolean(email))
    );
  } catch (err: any) {
    console.error(`[Email] suppression lookup failed: ${redact(String(err?.message || err))}`);
    return new Set();
  }
}

/** True when this one address must never receive marketing mail again. */
export async function isEmailSuppressed(email: string | null | undefined): Promise<boolean> {
  const address = String(email || "").trim().toLowerCase();
  if (!address) return false;
  const blocked = await getSuppressedEmails([address]);
  return blocked.has(address);
}

/**
 * Adds an address to the do-not-email list. Idempotent: the email address is the
 * primary key and duplicates are ignored, so a repeated bounce webhook or a
 * visitor clicking unsubscribe twice cannot fail. Returns true when the address
 * is (now) suppressed; an unwritable database returns false so the caller can
 * report a retryable failure instead of pretending.
 */
export async function suppressEmail(input: {
  email: string;
  reason: SuppressionReason;
  source?: string | null;
}): Promise<boolean> {
  const address = String(input.email || "").trim().toLowerCase();
  if (!address) return false;

  const supabase = serviceClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("email_suppression")
      .upsert(
        { email: address, reason: input.reason, source: input.source ?? null },
        { onConflict: "email", ignoreDuplicates: true }
      );
    if (error) {
      console.error(`[Email] suppression insert failed: ${redact(String(error.message || error.code))}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`[Email] suppression insert failed: ${redact(String(err?.message || err))}`);
    return false;
  }
}

/** Sends via Resend. NEVER throws - always resolves to a result. */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const to = (Array.isArray(params.to) ? params.to : [params.to])
    .map((t) => t.trim())
    .filter(Boolean);
  if (to.length === 0) return { ok: false, error: "sendEmail: no recipient" };

  if (isDryRun()) {
    // Template name + recipient count ONLY (no subject, no body, no addresses).
    console.log(`[Email][DRY_RUN] template=${params.template || "custom"} recipients=${to.length}`);
    return { ok: true, id: `dry-run-${Date.now()}`, dryRun: true };
  }

  // Marketing mail must respect the suppression list. Nothing is sent, and the
  // block is recorded in email_log so the pipeline can show why a send stopped.
  if (params.marketing) {
    const normalized = to.map((address) => address.toLowerCase());
    const blocked = await getSuppressedEmails(normalized);
    if (blocked.size > 0) {
      console.log(
        `[Email][suppressed] template=${params.template || "custom"} blocked=${blocked.size}`
      );
      await logEmailSend({
        emailType: "marketing",
        channel: "email",
        toEmail: Array.from(blocked)[0],
        status: "failed",
        error: "suppressed: recipient is on the unsubscribe list",
      });
      return { ok: false, error: "suppressed" };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Email] RESEND_API_KEY is not set - email not sent.");
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  // Marketing mail carries the RFC 8058 one-click headers. Caller-supplied
  // headers win, so a specific send can still override them deliberately.
  const headers = params.marketing
    ? { ...unsubscribeHeaders(to[0]), ...(params.headers || {}) }
    : params.headers;

  const payload = {
    from: params.from || getEmailFrom(),
    to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    reply_to: params.replyTo || getEmailReplyTo(),
    ...(headers ? { headers } : {}),
  };

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok || data?.error) {
      const msg = redact(String(data?.error?.message || data?.message || `HTTP ${res.status}`));
      console.error(`[Email] Resend error (${res.status}): ${msg}`);
      return { ok: false, error: msg, status: res.status };
    }

    console.log(`[Email] sent template=${params.template || "custom"} id=${data.id}`);
    return { ok: true, id: data.id as string, status: res.status };
  } catch (err: any) {
    const msg = redact(String(err?.message || "network error"));
    console.error(`[Email] Resend request failed: ${msg}`);
    return { ok: false, error: msg };
  }
}

export type EmailLogType =
  | "welcome"
  | "howto"
  | "lead_ack"
  | "lead_owner_notify"
  | "audit_report"
  | "audit_followup"
  /**
   * Marketing mail. Phase 0 of lead automation adds no sequences yet, so today
   * this type only appears when a marketing send is BLOCKED by the suppression
   * list (recorded so the block is visible in the pipeline).
   */
  | "marketing";


/**
 * Best-effort audit write into public.email_log. Never throws.
 * In DRY_RUN nothing is written at all (nothing was actually delivered), so a
 * preview run can never create a 'sent' row that would block the real send.
 */
export async function logEmailSend(entry: {
  emailType: EmailLogType;
  channel?: "email" | "whatsapp";
  userId?: string | null;
  leadId?: string | null;
  toEmail?: string | null;
  providerId?: string | null;
  status: "sent" | "failed";
  error?: string | null;
}): Promise<void> {
  if (isDryRun()) {
    console.log(`[Email][DRY_RUN] email_log skipped type=${entry.emailType}`);
    return;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    const { error } = await supabase.from("email_log").insert({
      email_type: entry.emailType,
      channel: entry.channel || "email",
      user_id: entry.userId ?? null,
      lead_id: entry.leadId ?? null,
      to_email: entry.toEmail ?? null,
      provider_id: entry.providerId ?? null,
      status: entry.status,
      error: entry.error ? redact(String(entry.error)).slice(0, 500) : null,
    });
    if (error) console.error(`[Email] email_log insert failed: ${redact(String(error.message))}`);
  } catch (err: any) {
    console.error(`[Email] email_log write failed: ${redact(String(err?.message || err))}`);
  }
}
