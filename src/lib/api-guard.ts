import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Shared guards for PUBLIC, unauthenticated, cost-bearing endpoints.
 *
 * Every route here calls Google Places (or an LLM) per request, and none of
 * them required a session — a single script could burn the Places quota or AI
 * budget in a loop. This module is the one place the limits are defined so the
 * numbers can be reasoned about (and tuned) together instead of drifting
 * across a dozen route files.
 *
 * Two tiers, because the call cost is not the same:
 *
 *   SEARCH_LIMIT — live autocomplete. The audit tool fires a request every time
 *     the visitor pauses typing (>= 3 chars, 300ms debounce), so ONE real
 *     visitor produces 4-8 calls per session. A tight hourly cap here (the
 *     original "5 searches per hour" idea) would lock real people out mid-typing
 *     and break the highest-intent page on the site. Generous per-minute,
 *     brutal on floods: 30/min, then a 1-hour block.
 *
 *   DETAIL_LIMIT — the expensive follow-up: place details / a full audit for a
 *     chosen listing. A real visitor scans 1-3 businesses, so 5/hour is
 *     comfortable for humans and still caps automated abuse at 5 calls/hour.
 *
 * Both use `fallbackToMemory: true` — the same posture as /api/chat and
 * /api/audit/review: a limiter-DB outage must not take the marketing tools
 * down for everyone. The per-instance memory limiter still enforces the cap
 * best-effort while the shared store is unreachable.
 */

export interface LimitPreset {
  /** Requests allowed inside one `windowMs` window. */
  max: number;
  /** Window length in ms. */
  windowMs: number;
  /** Lock duration once the cap is exceeded (defaults to 1 hour in the limiter). */
  blockMs?: number;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;

/** Live autocomplete / suggestion lookups. */
export const SEARCH_LIMIT: LimitPreset = { max: 30, windowMs: MINUTE_MS, blockMs: HOUR_MS };

/** Place details + full audit runs (one per business a visitor actually picks). */
export const DETAIL_LIMIT: LimitPreset = { max: 5, windowMs: HOUR_MS, blockMs: HOUR_MS };

/**
 * Owner-initiated website builds: once per 10 minutes per ACCOUNT (not per IP —
 * the build is an authenticated action, and one IP can be a whole office).
 * The build itself is idempotent for live sites, so this exists to stop repeat
 * clicks from re-billing AI copy + Places enrichment on a pending/failed build.
 */
export const BUILD_LIMIT: LimitPreset = { max: 1, windowMs: 10 * MINUTE_MS, blockMs: 10 * MINUTE_MS };

/**
 * Voice-note transcription (paid ASR call per recording). /api/transcribe is
 * reachable without a Neerzy session (a one-time quick-post token is enough),
 * so it is keyed on the visitor IP: a real tradesperson records one or two
 * notes per job, while a script looping uploads hits the wall in seconds.
 */
export const TRANSCRIBE_LIMIT: LimitPreset = { max: 10, windowMs: HOUR_MS, blockMs: HOUR_MS };

export type GuardResult =
  | { allowed: true; remaining: number }
  | { allowed: false; response: NextResponse };

/**
 * Rate-limit one key (an IP for public routes, a user id for authenticated
 * ones) and return either a pass or a ready-to-return 429 with a `Retry-After`
 * header so a real person knows why they were stopped and when to come back.
 */
async function guardKey(
  key: string,
  endpoint: string,
  preset: LimitPreset,
  message: string
): Promise<GuardResult> {
  const result = await checkRateLimit({
    ip: key,
    endpoint,
    max: preset.max,
    windowMs: preset.windowMs,
    blockMs: preset.blockMs,
    fallbackToMemory: true,
  });

  if (result.allowed) {
    return { allowed: true, remaining: result.remaining };
  }

  const untilMs = result.blockedUntil ?? result.resetAt;
  const retryAfterSeconds = Math.max(1, Math.ceil((untilMs - Date.now()) / 1000));

  return {
    allowed: false,
    response: NextResponse.json(
      { error: message, retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    ),
  };
}

/** Guard a public (unauthenticated) route, keyed on the visitor's real IP. */
export function guardPublicRequest(
  req: Request,
  endpoint: string,
  preset: LimitPreset,
  message = "Too many requests from this device — please wait a few minutes and try again."
): Promise<GuardResult> {
  return guardKey(getClientIp(req), endpoint, preset, message);
}

/** Guard an authenticated action, keyed on the account (an IP can be an office). */
export function guardUserAction(
  userId: string,
  endpoint: string,
  preset: LimitPreset,
  message = "You're going a little fast — please wait a few minutes and try again."
): Promise<GuardResult> {
  return guardKey(userId, endpoint, preset, message);
}
