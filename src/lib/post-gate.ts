// lib/post-gate.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * The ONE gate every post must pass through.
 *
 * Before this file existed each entry point (dashboard, WhatsApp, quick-post
 * link) enforced the plan quota with its own TypeScript check and then INSERTed
 * the post afterwards. Two requests arriving together both read "0 used" and
 * both wrote a post, so a 1-post-per-day trial could publish 2. The check and
 * the write are now a single serialized transaction inside
 * `public.create_post_with_quota()` (see
 * supabase/migrations/20261018_create_post_with_quota.sql), and this module is
 * the only caller of it.
 *
 * Failure policy: FAIL CLOSED. If the RPC cannot be executed (missing env,
 * database error, unexpected payload) the post is denied with a 503 — never
 * "allowed" — because a quota bypass is worse than an outage of one request.
 */

export type PostSource = 'dashboard' | 'whatsapp' | 'quick_post';

export type PostGateReason =
  | 'ok'
  | 'bad_source'
  | 'no_account'
  | 'not_connected'
  | 'trial_expired'
  | 'monthly_limit'
  | 'daily_limit'
  | 'in_progress'
  | 'no_draft'
  | 'gate_unavailable';

export interface PostGateResult {
  allowed: boolean;
  reason: PostGateReason;
  /** Trader-facing text (dashboard chat / WhatsApp reply). Empty when allowed. */
  message: string;
  /** HTTP status the route should return (200 when allowed). */
  status: number;
  /** The created `posts` row id (dashboard + quick-post only). */
  postId: string | null;
  plan: string;
  usedTotal: number;
  usedToday: number;
  limitTotal: number;
  limitDaily: number;
  daysLeft: number;
  /** Next UTC midnight — when the daily counter resets. */
  resetsAt: string | null;
  connected: boolean;
}

export interface PostGateInput {
  userId: string | null | undefined;
  phone?: string | null;
  source: PostSource;
  /**
   * dashboard / quick_post: the `posts` row to create
   * (content, title?, image_url?, status?, ai_reply?, social_facebook?, social_instagram?).
   * whatsapp: ignored — the draft row is the source of truth.
   */
  payload?: Record<string, unknown>;
  /** whatsapp only: the `pending_posts` draft being generated. */
  draftId?: string | null;
}

/** Status per denial reason. 403 = "your plan says no", 409 = "already running". */
const DENIAL_STATUS: Record<PostGateReason, number> = {
  ok: 200,
  bad_source: 400,
  no_account: 401,
  not_connected: 403,
  trial_expired: 403,
  monthly_limit: 403,
  daily_limit: 403,
  in_progress: 409,
  no_draft: 409,
  gate_unavailable: 503,
};

const UNAVAILABLE_MESSAGE =
  "We couldn't verify your plan right now. Please try again in a moment.";

/**
 * Trader-facing denial copy. Exported so `/api/usage` repeats the exact same
 * words instead of inventing a near-duplicate the user sees differently in the
 * usage card vs. the chat.
 */
export const DEFAULT_MESSAGE: Partial<Record<PostGateReason, string>> = {
  bad_source: 'Unknown post source.',
  no_account: 'Please sign in again.',
  not_connected: 'Choose your Google business first.',
  trial_expired: 'Your 30-day free trial has ended. Upgrade to continue posting.',
  monthly_limit: 'You have used all the posts included in your plan this month.',
  daily_limit: 'Daily limit reached.',
  in_progress: 'A post is already being generated for this account.',
  no_draft: 'We could not find a draft to generate. Send the job details again.',
  gate_unavailable: UNAVAILABLE_MESSAGE,
};

let cachedAdmin: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (!cachedAdmin) {
    cachedAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return cachedAdmin;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/**
 * "Daily limit reached." on its own is unhelpful, so append when the counter
 * actually resets (the SQL returns the next UTC midnight).
 */
export function withResetHint(message: string, resetsAt: string | null): string {
  if (!resetsAt) return message;
  const reset = new Date(resetsAt);
  if (isNaN(reset.getTime())) return message;
  const hours = Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 3_600_000));
  const hhmm = reset.toISOString().slice(11, 16);
  return `${message} Resets at ${hhmm} UTC (in ${hours}h).`;
}


/**
 * Ask the database (atomically) whether this account may create a post, and
 * for dashboard/quick_post create it in the same transaction.
 *
 * Never throws — every failure becomes a denial so a route can always reply
 * with a sensible message instead of crashing into a 500.
 */
export async function checkPostGate(input: PostGateInput): Promise<PostGateResult> {
  const empty: Pick<PostGateResult, 'plan' | 'usedTotal' | 'usedToday' | 'limitTotal' | 'limitDaily' | 'daysLeft' | 'resetsAt' | 'connected' | 'postId'> = {
    plan: 'free',
    usedTotal: 0,
    usedToday: 0,
    limitTotal: 0,
    limitDaily: 0,
    daysLeft: 0,
    resetsAt: null,
    connected: false,
    postId: null,
  };

  if (!input.userId) {
    return {
      ...empty,
      allowed: false,
      reason: 'no_account',
      message: DEFAULT_MESSAGE.no_account as string,
      status: DENIAL_STATUS.no_account,
    };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('post-gate: Supabase env vars missing — denying post (fail closed)');
    return {
      ...empty,
      allowed: false,
      reason: 'gate_unavailable',
      message: UNAVAILABLE_MESSAGE,
      status: DENIAL_STATUS.gate_unavailable,
    };
  }

  let payload: unknown = null;
  try {
    const { data, error } = await admin().rpc('create_post_with_quota', {
      p_user_id: input.userId,
      p_phone: input.phone || null,
      p_source: input.source,
      p_payload: input.payload || {},
      p_draft_id: input.draftId || null,
    });

    if (error) {
      // Includes "function does not exist" when the migration hasn't run yet.
      console.error('post-gate: RPC failed (denying post):', error.message);
      return {
        ...empty,
        allowed: false,
        reason: 'gate_unavailable',
        message: UNAVAILABLE_MESSAGE,
        status: DENIAL_STATUS.gate_unavailable,
      };
    }

    payload = data;
  } catch (err) {
    console.error('post-gate: RPC threw (denying post):', err);
    return {
      ...empty,
      allowed: false,
      reason: 'gate_unavailable',
      message: UNAVAILABLE_MESSAGE,
      status: DENIAL_STATUS.gate_unavailable,
    };
  }

  const row = asRecord(payload);
  const resetsAt = asString(row.resetsAt);
  // Strict `=== true`: anything missing/garbled is treated as a denial.
  const allowed = row.allowed === true;
  const rawReason = asString(row.reason);
  const reason = (rawReason || (allowed ? 'ok' : 'gate_unavailable')) as PostGateReason;

  const meta = {
    plan: asString(row.plan) || 'free',
    usedTotal: asNumber(row.usedTotal),
    usedToday: asNumber(row.usedToday),
    limitTotal: asNumber(row.limitTotal),
    limitDaily: asNumber(row.limitDaily),
    daysLeft: asNumber(row.daysLeft),
    resetsAt,
    connected: row.connected === true,
  };

  if (allowed) {
    return {
      ...meta,
      allowed: true,
      reason: 'ok',
      message: '',
      status: 200,
      postId: asString(row.postId),
    };
  }

  const base = asString(row.message) || DEFAULT_MESSAGE[reason] || UNAVAILABLE_MESSAGE;
  const message = reason === 'daily_limit' ? withResetHint(base, resetsAt) : base;

  return {
    ...meta,
    allowed: false,
    reason,
    message,
    status: DENIAL_STATUS[reason] ?? 403,
    postId: null,
  };
}

/**
 * Give an in-flight WhatsApp reservation back when generation finishes (or
 * fails). Without this the account is locked out until the 15-minute stale
 * window clears. Never throws; a leaked reservation self-heals.
 */
export async function releasePostGate(
  userId: string | null | undefined,
  draftId?: string | null
): Promise<void> {
  if (!userId) return;
  try {
    const { error } = await admin().rpc('release_post_gate', {
      p_user_id: userId,
      p_draft_id: draftId || null,
    });
    if (error) {
      console.warn('post-gate: release failed (reservation expires in 15 min):', error.message);
    }
  } catch (err) {
    console.warn('post-gate: release threw (reservation expires in 15 min):', err);
  }
}

/** JSON response for a denial. `error` is kept for older clients, `message` is the new key. */
export function postGateResponse(result: PostGateResult) {
  return NextResponse.json(
    {
      error: result.message,
      message: result.message,
      reason: result.reason,
      resetsAt: result.resetsAt,
      plan: result.plan,
      usedTotal: result.usedTotal,
      usedToday: result.usedToday,
      limitTotal: result.limitTotal,
      limitDaily: result.limitDaily,
      daysLeft: result.daysLeft,
      connected: result.connected,
    },
    { status: result.status }
  );
}
