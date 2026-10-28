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
 * Security rules:
 *  - sendEmail() NEVER throws; callers record sent/failed from the result.
 *  - every error string passes through redact() before logging or storing.
 *  - DRY_RUN logs template name + recipient count ONLY - no subject, no body,
 *    no names/addresses, no env values, no headers.
 *  - DRY_RUN never writes email_log rows (nothing was actually sent).
 */

import { createClient } from "@supabase/supabase-js";

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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[Email] RESEND_API_KEY is not set - email not sent.");
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  const payload = {
    from: params.from || getEmailFrom(),
    to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    reply_to: params.replyTo || getEmailReplyTo(),
    ...(params.headers ? { headers: params.headers } : {}),
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

export type EmailLogType = "welcome" | "howto" | "lead_ack" | "lead_owner_notify";

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
