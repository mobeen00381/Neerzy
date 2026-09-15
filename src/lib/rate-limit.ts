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
 * tokens, so a DB failure FAILS CLOSED (deny) by default — the same posture as
 * posts/create. Callers that would rather degrade than lock everyone out can
 * pass `fallbackToMemory: true` (see /api/chat, /api/audit/review), which
 * swaps in a best-effort per-instance memory limiter when the shared store is
 * unreachable.
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
  /**
   * When true, a limiter DB outage (missing table, RLS/permission problem,
   * network failure) falls back to a best-effort per-instance in-memory
   * limiter that still returns a real allow/deny answer, instead of failing
   * closed. Use this on user-facing endpoints where a broken shared dependency
   * must never lock real visitors out (e.g. /api/chat). Leave it false where
   * the caller prefers dropping requests over risking cost/abuse.
   */
  fallbackToMemory?: boolean;
}

/**
 * Last-resort per-instance limiter, consulted only when the shared DB limiter
 * itself is unreachable. It mirrors the DB semantics (max per window, then a
 * block) but the state lives in the serverless instance's memory, so it is
 * best-effort - still far better than telling every visitor they are
 * rate-limited because OUR table is missing.
 */
interface MemoryBucket {
  count: number;
  windowStart: number;
  blockedUntil: number;
}

const MEMORY_BUCKETS = new Map<string, MemoryBucket>();
const MEMORY_BUCKET_CAP = 5_000;

function checkMemoryLimit(
  key: string,
  max: number,
  windowMs: number,
  blockMs: number
): RateLimitResult {
  const now = Date.now();

  // Keep the map from growing without bound on long-lived instances.
  if (MEMORY_BUCKETS.size > MEMORY_BUCKET_CAP) {
    for (const [k, v] of MEMORY_BUCKETS) {
      if (v.blockedUntil <= now && now - v.windowStart >= windowMs) {
        MEMORY_BUCKETS.delete(k);
      }
    }
  }

  const bucket = MEMORY_BUCKETS.get(key);

  if (bucket) {
    // Active block → reject until it lifts.
    if (bucket.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.blockedUntil,
        blockedUntil: bucket.blockedUntil,
        reason: "blocked",
      };
    }

    // Same window → cap check.
    if (now - bucket.windowStart < windowMs) {
      if (bucket.count >= max) {
        bucket.blockedUntil = now + blockMs;
        return {
          allowed: false,
          remaining: 0,
          resetAt: bucket.blockedUntil,
          blockedUntil: bucket.blockedUntil,
          reason: "blocked",
        };
      }

      bucket.count += 1;
      return {
        allowed: true,
        remaining: max - bucket.count,
        resetAt: bucket.windowStart + windowMs,
        blockedUntil: null,
        reason: "ok",
      };
    }
  }

  // No bucket, or the window expired → start a fresh window.
  MEMORY_BUCKETS.set(key, { count: 1, windowStart: now, blockedUntil: 0 });
  return {
    allowed: true,
    remaining: max - 1,
    resetAt: now + windowMs,
    blockedUntil: null,
    reason: "ok",
  };
}

export async function checkRateLimit(opts: CheckRateLimitOptions): Promise<RateLimitResult> {
  const { ip, endpoint } = opts;
  const max = opts.max ?? 10;
  const windowMs = opts.windowMs ?? 60_000;
  const blockMs = opts.blockMs ?? HOUR_MS;
  const fallbackToMemory = opts.fallbackToMemory === true;

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
    // Shared limiter is unreachable. Endpoints that opted into the memory
    // fallback keep working (bounded per instance); everything else fails
    // closed, since it is public and cost-bearing.
    if (fallbackToMemory) {
      const fallback = checkMemoryLimit(`${ip}:${endpoint}`, max, windowMs, blockMs);
      console.warn(
        `Rate limiter DB unavailable for ${endpoint} (${ip}) - in-memory fallback ${
          fallback.allowed ? "allowed" : "denied"
        }:`,
        err
      );
      return fallback;
    }

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
