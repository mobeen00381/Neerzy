// src/app/api/unsubscribe/route.ts
/**
 * POST /api/unsubscribe - the ONE place an address is added to the do-not-email
 * list by the recipient themselves.
 *
 * Two callers, one handler:
 *  1. /unsubscribe (the public confirm page) POSTs { token } after the visitor
 *     clicks the button. The page never unsubscribes on load, because mailbox
 *     scanners and chat previews prefetch links - a GET that unsubscribed would
 *     silently drop real subscribers.
 *  2. Gmail/Outlook one-click (RFC 8058): they POST to the List-Unsubscribe URL
 *     with the body `List-Unsubscribe=One-Click` and no JSON at all. That is why
 *     the token lives in the query string.
 *
 * Rules:
 *  - the token is an HMAC over the address (lib/unsubscribe.ts); an invalid or
 *    edited token is rejected without touching the database,
 *  - the response is identical whether or not that address was ever a lead, so
 *    this endpoint cannot be used to test whether someone is a customer,
 *  - idempotent: the second click is not an error,
 *  - rate limited per IP (guardPublicRequest) because it writes a row.
 *
 * Transactional mail already sent (a report the visitor asked for) is unaffected:
 * suppression only blocks marketing sends (see sendEmail's `marketing` option).
 */

import { NextResponse } from "next/server";
import { guardPublicRequest, UNSUBSCRIBE_LIMIT } from "@/lib/api-guard";
import { optOutLeadConsent } from "@/lib/audit-lead";
import { cancelQueueForEmail } from "@/lib/automation/enroll";
import { redact, suppressEmail } from "@/lib/email";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

const TOO_MANY = "Too many unsubscribe requests from this device - please try again later.";
const GENERIC_OK = "You're unsubscribed from Neerzy emails.";
const INVALID_TOKEN = "This unsubscribe link is not valid. Please use the link in the email footer.";
const WRITE_FAILED = "We couldn't record that right now - please try again in a moment.";

/**
 * Pulls the token out of the query string, then (only if absent) out of a JSON
 * or form-encoded body. Reading the body only when needed keeps the RFC 8058
 * POST - whose body is a fixed `List-Unsubscribe=One-Click` string - working.
 */
async function readToken(req: Request): Promise<string> {
  const fromQuery = new URL(req.url).searchParams;
  const queryToken = fromQuery.get("t") || fromQuery.get("token") || "";
  if (queryToken) return queryToken.trim();

  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  const raw = await req.text().catch(() => "");
  if (!raw) return "";

  try {
    if (contentType.includes("application/json")) {
      const parsed: any = JSON.parse(raw);
      return String(parsed?.token || parsed?.t || "").trim();
    }
    // application/x-www-form-urlencoded (RFC 8058 one-click, or a plain form)
    return String(new URLSearchParams(raw).get("token") || "").trim();
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  const guard = await guardPublicRequest(req, "unsubscribe", UNSUBSCRIBE_LIMIT, TOO_MANY);
  if (!guard.allowed) return guard.response;

  try {
    const token = await readToken(req);
    const verified = verifyUnsubscribeToken(token);
    if (!verified.ok || !verified.email) {
      // Same shape as any other failure: never confirms whether the address exists.
      return NextResponse.json({ error: INVALID_TOKEN }, { status: 400 });
    }
    const email = verified.email;

    // 1. Global do-not-email entry (idempotent - the address is the primary key).
    const suppressed = await suppressEmail({
      email,
      reason: "unsubscribe",
      source: "unsubscribe_page",
    });
    if (!suppressed) {
      return NextResponse.json({ error: WRITE_FAILED }, { status: 503 });
    }

    // 2. Keep the per-lead consent history truthful. A failure here is logged but
    //    not surfaced: the suppression row above already stops every send.
    await optOutLeadConsent(email);

    // 3. Drop every queued email for this address. Not strictly required - the
    //    drainer re-checks suppression before each send - but it makes Admin ->
    //    Automation show "cancelled" instead of a list of rows that will quietly
    //    refuse to send, and it cannot fail the request (returns a count).
    await cancelQueueForEmail(email, "recipient unsubscribed");

    return NextResponse.json({ success: true, message: GENERIC_OK });
  } catch (error: any) {
    console.error(`unsubscribe error: ${redact(String(error?.message || error))}`);
    return NextResponse.json({ error: WRITE_FAILED }, { status: 500 });
  }
}


