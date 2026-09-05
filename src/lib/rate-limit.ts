import { createClient } from "@supabase/supabase-js";

/**
 * Shared DB-backed rate limiter (serverless-safe — state persists across
 * invocations via Supabase).
 *
 * Per (ip, endpoint):
 *   - allows up to `max` requests inside a `windowMs` window
 *   - when the window cap is exceeded the caller is BLOCKED for `blockMs`
 *     (default 1 hour) via the rate_limits.blocked_until column
 *
 * The chat endpoint is public + unauthenticated and every model call burns AI
 * tokens, so a DB failure FAILS CLOSED (deny) — the same posture as posts/create.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
);

const HOUR_MS = 3_600_000;

export type RateLimitReason = "ok" | "blocked" | "error";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Epoch ms when the current minute-window resets (non-blocked case). */
  resetAt: number;
  /** Epoch ms when an active 1-hour lock lifts (null when not blocked). */
  blockedUntil: number | null;
  reason: RateLimitReason;
}

export interface CheckRateLimitOptions {
  ip: string;
  endpoint: string;
  /** Max requests allowed per window (default 10). */
  max?: number;
  /** Window length in ms (default 1 minute). */
  windowMs?: number;
  /** Lock length in ms once the cap is exceeded (default 1 hour). */
  blockMs?: number;
}

export async function checkRateLimit(opts: CheckRateLimitOptions): Promise<RateLimitResult> {
  const { ip, endpoint } = opts;
  const max = opts.max ?? 10;
  const windowMs = opts.windowMs ?? 60_000;
  const blockMs = opts.blockMs ?? HOUR_MS;

  const now = Date.now();

  try {
    // Fire-and-forget cleanup of stale rows (keeps the table tiny).
    void supabase
      .from("rate_limits")
      .delete()
      .lt("created_at", new Date(now - HOUR_MS).toISOString());

    // Latest row for this ip + endpoint (any window).
    const { data: existing, error } = await supabase
      .from("rate_limits")
      .select("id, request_count, window_start, blocked_until")
      .eq("ip_address", ip)
      .eq("endpoint", endpoint)
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // ── Active 1-hour block? Reject everything until it lifts ──
    const blockedUntilMs = existing?.blocked_until
      ? new Date(existing.blocked_until).getTime()
      : 0;
    if (blockedUntilMs > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockedUntilMs,
        blockedUntil: blockedUntilMs,
        reason: "blocked",
      };
    }

    // ── No row yet, or the row's window has expired → start a fresh window ──
    const windowStartMs = existing?.window_start
      ? new Date(existing.window_start).getTime()
      : 0;
    const windowActive = !!existing && now - windowStartMs < windowMs;

    if (!windowActive) {
      await supabase.from("rate_limits").insert({
        ip_address: ip,
        endpoint,
        request_count: 1,
        window_start: new Date(now).toISOString(),
      });
      return {
        allowed: true,
        remaining: max - 1,
        resetAt: now + windowMs,
        blockedUntil: null,
        reason: "ok",
      };
    }

    // ── Window active: has the cap been hit? Exceeding it LOCKS for 1 hour ──
    if (existing!.request_count >= max) {
      await supabase
        .from("rate_limits")
        .update({
          blocked_until: new Date(now + blockMs).toISOString(),
          // Start a fresh window at lock time so the counter resets the moment
          // the block lifts (this window_start will then be > windowMs old).
          window_start: new Date(now).toISOString(),
        })
        .eq("id", existing!.id);

      return {
        allowed: false,
        remaining: 0,
        resetAt: now + blockMs,
        blockedUntil: now + blockMs,
        reason: "blocked",
      };
    }

    // ── Within the cap → increment and allow ──
    await supabase
      .from("rate_limits")
      .update({ request_count: existing!.request_count + 1 })
      .eq("id", existing!.id);

    return {
      allowed: true,
      remaining: max - (existing!.request_count + 1),
      resetAt: windowStartMs + windowMs,
      blockedUntil: null,
      reason: "ok",
    };
  } catch (err) {
    // Fail-closed: this is a public, cost-bearing endpoint.
    console.error(`Rate limiter DB error for endpoint ${endpoint} (failing closed):`, err);
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + windowMs,
      blockedUntil: null,
      reason: "error",
    };
  }
}

/**
 * Explicitly block an ip + endpoint for `blockMs` (used when a visitor racks up
 * consecutive off-topic messages). Best-effort — never throws.
 */
export async function blockClient(
  ip: string,
  endpoint: string,
  blockMs: number = HOUR_MS
): Promise<void> {
  try {
    const now = Date.now();
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("id")
      .eq("ip_address", ip)
      .eq("endpoint", endpoint)
      .order("window_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    const blockUntil = new Date(now + blockMs).toISOString();
    if (existing?.id) {
      await supabase
        .from("rate_limits")
        .update({
          blocked_until: blockUntil,
          window_start: new Date(now).toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("rate_limits").insert({
        ip_address: ip,
        endpoint,
        request_count: 1,
        window_start: new Date(now).toISOString(),
        blocked_until: blockUntil,
      });
    }
  } catch (err) {
    console.error(`blockClient failed for ${ip} / ${endpoint}:`, err);
  }
}
