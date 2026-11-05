// src/lib/unsubscribe.ts
/**
 * Signed unsubscribe links (HMAC-SHA256, stateless).
 *
 * Shape: `<base64url(email)>.<base64url(hmac)>`. The address has to travel in
 * the link because a one-click unsubscribe (RFC 8058) is a bare POST with no
 * body we control - the token IS the payload. The signature is what makes it
 * unforgeable: without it, anyone could unsubscribe anyone by editing the URL.
 *
 * Why not a database token: an unsubscribe link sits in inboxes for years. A
 * stateless HMAC needs no cleanup job, no expiry sweep, and cannot be replayed
 * against a different address (the address is inside the signed payload).
 *
 * Env vars (values are NEVER logged):
 *   UNSUBSCRIBE_SECRET - signing key. Optional: falls back to REPORT_UNLOCK_SECRET,
 *                        then REVIEW_IP_SALT, then a dev constant, so a missing
 *                        env var can never break an unsubscribe link. Rotating it
 *                        invalidates every link already delivered.
 */
import { createHmac, timingSafeEqual } from "crypto";

/** Where the public confirm page lives (also the List-Unsubscribe target). */
function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.neerzy.com").replace(/\/+$/, "");
}

function unsubscribeSecret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.REPORT_UNLOCK_SECRET ||
    process.env.REVIEW_IP_SALT ||
    "neerzy_unsubscribe_dev_secret"
  );
}

/** Emails are matched case-insensitively everywhere, so the payload is lowercase. */
export function normalizeEmail(email: string | null | undefined): string {
  return String(email || "").trim().toLowerCase();
}

function sign(email: string): string {
  return createHmac("sha256", unsubscribeSecret()).update(email).digest("base64url");
}

/** Mints the opaque token for one address. Empty string for a missing address. */
export function makeUnsubscribeToken(email: string | null | undefined): string {
  const address = normalizeEmail(email);
  if (!address) return "";
  return `${Buffer.from(address, "utf8").toString("base64url")}.${sign(address)}`;
}

export interface UnsubscribeTokenResult {
  ok: boolean;
  /** Only set when the signature verified; always lowercase. */
  email?: string;
}

/**
 * Verifies a token and returns the address it was minted for.
 * The comparison is constant-time, and the decoded payload is re-checked as a
 * plausible email so a forged (unsigned) payload can never reach the database.
 */
export function verifyUnsubscribeToken(token: string | null | undefined): UnsubscribeTokenResult {
  const raw = String(token || "").trim();
  if (!raw) return { ok: false };

  const separator = raw.indexOf(".");
  if (separator <= 0) return { ok: false };

  let address = "";
  try {
    address = normalizeEmail(Buffer.from(raw.slice(0, separator), "base64url").toString("utf8"));
  } catch {
    return { ok: false };
  }
  if (!address || address.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address)) {
    return { ok: false };
  }

  const given = Buffer.from(raw.slice(separator + 1));
  const expected = Buffer.from(sign(address));
  if (given.length !== expected.length) return { ok: false };
  if (!timingSafeEqual(given, expected)) return { ok: false };

  return { ok: true, email: address };
}

/**
 * The public unsubscribe URL for one address. Used by buildUnsubscribeHeaders()
 * below for every marketing send, and by templates that want a text link.
 */
export function buildUnsubscribeUrl(email: string | null | undefined): string {
  const token = makeUnsubscribeToken(email);
  return token ? `${appUrl()}/unsubscribe?t=${token}` : `${appUrl()}/unsubscribe`;
}

/**
 * Headers that make a marketing email one-click unsubscribable in Gmail/Outlook
 * (RFC 8058). `List-Unsubscribe-Post` is what turns the link into a POST the
 * mailbox provider can fire without the recipient visiting a page.
 */
export function unsubscribeHeaders(email: string | null | undefined): Record<string, string> {
  const url = buildUnsubscribeUrl(email);
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
