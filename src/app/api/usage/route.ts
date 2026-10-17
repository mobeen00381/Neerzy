import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBusinessProfileForUser } from '@/lib/business-profile';
import { getCycleStartIso, getPlan } from '@/lib/plans';
import { countUserPosts } from '@/lib/post-usage';
import { DEFAULT_MESSAGE, withResetHint, type PostGateReason } from '@/lib/post-gate';

/**
 * GET /api/usage
 *
 * Read-only snapshot of "how much of my plan have I used, and can I post right
 * now?" for the dashboard chips, the usage card and the composer.
 *
 * Why a route instead of a read RPC: the counters already live in
 * `src/lib/post-usage.ts` and the plan table in `src/lib/plans.ts`, both of
 * which mirror `public.create_post_with_quota()`. This route evaluates the
 * SAME four gates in the SAME order (connected → trial → monthly → daily) and
 * reuses the gate's denial copy, so the dashboard can disable the composer with
 * the exact sentence the server would have returned. The post itself is still
 * only ever admitted by the database function — this endpoint never writes.
 *
 * Identity comes from the Bearer token, never from a query parameter.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const DAY_MS = 24 * 60 * 60 * 1000;

/** Next UTC midnight — identical to `v_resets_at` in create_post_with_quota(). */
function nextUtcMidnightIso(now: Date): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  ).toISOString();
}

export async function GET(req: Request) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const userId = authData?.user?.id;
  if (authError || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const resetsAt = nextUtcMidnightIso(now);

    // `select('*')` on purpose: a profile column that has not been applied to
    // this database yet must degrade to a default, never 500 the dashboard.
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const phone: string | null = profileData?.phone || authData?.user?.phone || null;
    const plan = String(profileData?.selected_plan || 'free').toLowerCase();
    const limits = getPlan(plan);

    const business = await getBusinessProfileForUser(supabase, userId, phone).catch(() => null);
    const connected = Boolean(String(business?.google_place_id || '').trim());

    // Same anchor + 30-day cycle as the gate: plan_started_at → trial → created.
    const anchorIso: string | null =
      profileData?.plan_started_at || profileData?.trial_started_at || profileData?.created_at || null;
    const cycleStart = getCycleStartIso(anchorIso, now);

    // `posts` + `pending_posts`, current cycle and UTC day.
    const used = await countUserPosts(userId, phone, cycleStart);

    const parsedAnchor = anchorIso ? new Date(anchorIso) : null;
    const anchor = parsedAnchor && !isNaN(parsedAnchor.getTime()) ? parsedAnchor : null;
    const trialEnd =
      anchor && limits.trialDays > 0 ? new Date(anchor.getTime() + limits.trialDays * DAY_MS) : null;
    const daysLeft = trialEnd
      ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / DAY_MS))
      : 0;
    const trialExpired = Boolean(trialEnd && now >= trialEnd);

    // Gate order copied from create_post_with_quota(): a user who is both
    // unconnected and out of posts must be told to connect first.
    let canPost = true;
    let reason: PostGateReason = 'ok';
    let message = '';

    if (!connected) {
      canPost = false;
      reason = 'not_connected';
      message = DEFAULT_MESSAGE.not_connected || '';
    } else if (trialExpired) {
      canPost = false;
      reason = 'trial_expired';
      message = DEFAULT_MESSAGE.trial_expired || '';
    } else if (limits.totalPosts !== -1 && used.total >= limits.totalPosts) {
      canPost = false;
      reason = 'monthly_limit';
      // Same sentence the SQL gate builds, including the plan's own number.
      message = `You have used all ${limits.totalPosts} posts included in your plan this month.`;
    } else if (limits.dailyPosts !== -1 && used.daily >= limits.dailyPosts) {
      canPost = false;
      reason = 'daily_limit';
      message = withResetHint(DEFAULT_MESSAGE.daily_limit || 'Daily limit reached.', resetsAt);
    }

    return NextResponse.json(
      {
        ok: true,
        plan,
        planName: limits.name,
        connected,
        businessName: business?.business_name || null,
        trialExpired,
        daysLeft,
        cycleStart,
        resetsAt,
        usage: { total: used.total, daily: used.daily },
        limits: {
          totalPosts: limits.totalPosts,
          dailyPosts: limits.dailyPosts,
          trialDays: limits.trialDays,
          totalReviewRequests: limits.totalReviewRequests,
          dailyReviewRequests: limits.dailyReviewRequests,
          price: limits.price,
        },
        remaining: {
          total: limits.totalPosts === -1 ? null : Math.max(0, limits.totalPosts - used.total),
          daily: limits.dailyPosts === -1 ? null : Math.max(0, limits.dailyPosts - used.daily),
        },
        canPost,
        reason,
        message,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('usage: failed to build usage snapshot:', err);
    return NextResponse.json({ error: 'Could not load usage right now.' }, { status: 500 });
  }
}
