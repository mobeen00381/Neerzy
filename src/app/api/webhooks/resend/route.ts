// src/app/api/webhooks/resend/route.ts
/**
 * POST /api/webhooks/resend - Resend delivery events -> email_suppression.
 *
 * Two events matter for compliance:
 *   email.bounced  - PERMANENT (hard) bounces only. A transient bounce means the
 *                    mailbox was full or the server was down; Resend retries those
 *                    and suppressing them would drop reachable customers.
 *   email.complained - the recipient hit "report spam" in their mailbox. One of
 *                    these is worth a thousand unsubscribes: never mail them again.
 *
 * Everything else (sent / delivered / opened / clicked / delivery_delayed) is
 * acknowledged with 200 and ignored - Phase 0 adds no sequences, so there is
 * nothing to record yet.
 *
 * Signature: Resend signs webhooks with Svix. The signature is an HMAC-SHA256 of
 * `${svix-id}.${svix-timestamp}.${raw body}` using the base64 key inside
 * RESEND_WEBHOOK_SECRET (`whsec_...`). This route verifies it from the RAW body -
 * parsing the JSON first would re-serialize and break the digest - then rejects
 * anything with a bad signature (401) or a timestamp older than 5 minutes
 * (replay protection). Secrets are never logged.
 *
 * Idempotent: email is the primary key of email_suppression and duplicate
 * inserts are ignored, so a webhook retried by Resend cannot error.
 */
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { redact, suppressEmail, type SuppressionReason } from "@/lib/email";
import { normalizeEmail } from "@/lib/unsubscribe";

/** Svix recommends 5 minutes of clock tolerance. */
const TOLERANCE_SECONDS = 5 * 60;

/**
 * Verifies a Svix-signed payload. `signatureHeader` may hold several
 * space-separated entries ("v1,<sig> v1,<sig2>") because Svix rotates keys -
 * ANY valid v1 entry is enough.
 */
function verifySvixSignature(input: {
  id: string;
  timestamp: string;
  signatureHeader: string;
  body: string;
  secret: string;
}): boolean {
  const seconds = Number(input.timestamp);
  if (!Number.isFinite(seconds) || seconds <= 0) return false;
  if (Math.abs(Date.now() / 1000 - seconds) > TOLERANCE_SECONDS) return false;

  const rawSecret = input.secret.trim().replace(/^whsec_/, "");
  if (!rawSecret) return false;

  let key: Buffer;
  try {
    key = Buffer.from(rawSecret, "base64");
  } catch {
    return false;
  }
  if (key.length === 0) return false;

  const expected = createHmac("sha256", key)
    .update(`${input.id}.${input.timestamp}.${input.body}`)
    .digest("base64");
  const expectedBuffer = Buffer.from(expected);

  let matched = false;
  for (const part of input.signatureHeader.split(" ")) {
    const entry = part.trim();
    if (!entry.startsWith("v1,")) continue;
    const given = Buffer.from(entry.slice(3));
    if (given.length !== expectedBuffer.length) continue;
    // Constant-time compare per candidate (no early return on the first match).
    if (timingSafeEqual(given, expectedBuffer)) matched = true;
  }
  return matched;
}

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * The addresses a bounce/complaint refers to. Resend sends `data.to` as an array;
 * when it is missing we fall back to the email_log row for the same Resend
 * message id, because email_log always carries to_email for our own sends.
 */
async function recipientsFor(
  event: any,
  supabase: SupabaseClient | null
): Promise<string[]> {
  const raw = event?.data?.to ?? event?.data?.recipient ?? null;
  const direct = (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .map((value: unknown) => normalizeEmail(typeof value === "string" ? value : ""))
    .filter(Boolean);
  if (direct.length > 0) return Array.from(new Set(direct));

  const emailId = String(event?.data?.email_id || event?.data?.emailId || "").trim();
  if (!emailId || !supabase) return [];

  const { data } = await supabase
    .from("email_log")
    .select("to_email")
    .eq("provider_id", emailId)
    .limit(1)
    .maybeSingle();
  const fallback = normalizeEmail(data?.to_email);
  return fallback ? [fallback] : [];
}

/**
 * Suppresses the recipients of one event and mirrors the outcome onto email_log.
 *
 * email_log has no dedicated "bounce" column, so the status column is used where
 * it is honest: a hard bounce means the message never arrived, so that row moves
 * from 'sent' to 'failed' with the reason in `error`. A complaint DID arrive -
 * rewriting its status would be a lie, so only `error` records it there.
 */
async function suppressFromEvent(
  event: any,
  reason: SuppressionReason,
  note: string
): Promise<void> {
  const supabase = serviceClient();
  const recipients = await recipientsFor(event, supabase);
  if (recipients.length === 0) {
    console.error(`[ResendWebhook] ${reason} event without a usable recipient - nothing suppressed.`);
    return;
  }

  for (const address of recipients) {
    await suppressEmail({ email: address, reason, source: "resend_webhook" });
  }

  const emailId = String(event?.data?.email_id || event?.data?.emailId || "").trim();
  if (!emailId || !supabase) return;

  const patch: Record<string, unknown> =
    reason === "bounce" ? { status: "failed", error: note } : { error: note };
  try {
    const { error } = await supabase.from("email_log").update(patch).eq("provider_id", emailId);
    if (error) {
      console.error(`[ResendWebhook] email_log update failed: ${redact(String(error.message || error.code))}`);
    }
  } catch (err: any) {
    console.error(`[ResendWebhook] email_log update failed: ${redact(String(err?.message || err))}`);
  }
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  if (!secret) {
    // 5xx on purpose: Resend retries, so events are not lost while the env var
    // is missing. The value itself is never logged.
    console.error("[ResendWebhook] RESEND_WEBHOOK_SECRET is not set - rejecting event.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  // RAW body - the signature covers these exact bytes.
  const body = await req.text();
  const id = req.headers.get("svix-id") || "";
  const timestamp = req.headers.get("svix-timestamp") || "";
  const signatureHeader = req.headers.get("svix-signature") || "";

  if (!id || !timestamp || !signatureHeader) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
  }
  if (!verifySvixSignature({ id, timestamp, signatureHeader, body, secret })) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const type = String(event?.type || "");

  try {
    if (type === "email.bounced") {
      const bounceType = String(event?.data?.bounce?.type || "").toLowerCase();
      if (bounceType !== "permanent") {
        // Transient / undetermined: Resend retries, the mailbox may recover.
        return NextResponse.json({ ok: true, ignored: "transient_bounce" });
      }
      await suppressFromEvent(event, "bounce", "bounced permanently (hard bounce)");
      return NextResponse.json({ ok: true });
    }

    if (type === "email.complained") {
      await suppressFromEvent(event, "complaint", "recipient marked this email as spam");
      return NextResponse.json({ ok: true });
    }
  } catch (error: any) {
    // 5xx so Resend retries: a failed suppression write must not be swallowed.
    console.error(`[ResendWebhook] ${type} handling failed: ${redact(String(error?.message || error))}`);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  // email.sent / delivered / opened / clicked / delivery_delayed ...: nothing to do.
  return NextResponse.json({ ok: true, ignored: type || "unknown" });
}
