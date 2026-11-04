import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed unlock tokens for the audit report.
 *
 * The public results page shows the score and the diagnosis for free, but the
 * part worth keeping - the ordered fix list, the head-to-head table and the
 * evidence detail - is withheld by the API until the visitor asks for the report
 * and hands over an email or a number. Hiding it with CSS would not be gating:
 * the data would still be in the response, one devtools tab away. So the token
 * below is the only thing that makes `/api/audit/run` return the full report.
 *
 * Shape: `<expiryEpochMs>.<base64url hmac>`, signed over `placeId:expiry`.
 * Stateless on purpose - no table, no cleanup job, and a token for one listing
 * can never unlock another.
 */

/** A report link stays usable for a month; re-asking re-issues a fresh one. */
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Signing key. Optional everywhere: falls back to the review salt and then a
 * fixed dev string, so no deploy can break on a missing env var. Rotating it
 * invalidates every report link already sitting in someone's inbox - they
 * reopen as the teaser, and the owner can request the link again.
 */
function unlockSecret(): string {
  return (
    process.env.REPORT_UNLOCK_SECRET ||
    process.env.REVIEW_IP_SALT ||
    "neerzy_report_unlock_dev_secret"
  );
}

function sign(placeId: string, expiry: number): string {
  return createHmac("sha256", unlockSecret()).update(`${placeId}:${expiry}`).digest("base64url");
}

/** Mints a token for one listing. Empty string for a missing id (mock scans). */
export function makeUnlockToken(placeId: string, now = Date.now()): string {
  const id = String(placeId || "").trim();
  if (!id) return "";
  const expiry = now + TOKEN_TTL_MS;
  return `${expiry}.${sign(id, expiry)}`;
}

/**
 * True only for a well-formed, unexpired token minted for THIS place id.
 * Comparison is constant-time so a wrong token cannot be narrowed down by timing.
 */
export function verifyUnlockToken(token: string | null | undefined, placeId: string): boolean {
  const id = String(placeId || "").trim();
  const raw = String(token || "").trim();
  if (!id || !raw) return false;

  const separator = raw.indexOf(".");
  if (separator <= 0) return false;

  const expiry = Number(raw.slice(0, separator));
  const signature = raw.slice(separator + 1);
  if (!Number.isFinite(expiry) || !signature || expiry < Date.now()) return false;

  const expected = sign(id, expiry);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length) return false;
  return timingSafeEqual(given, want);
}
