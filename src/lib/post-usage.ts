// lib/post-usage.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Counts a user's posts across BOTH storage locations:
 * - `posts` table        → posts created from the web dashboard (keyed by user_id)
 * - `pending_posts`      → posts created via WhatsApp (keyed by user_phone)
 *
 * This is the single source of truth for plan post-quota checks so that
 * WhatsApp + dashboard usage are counted TOGETHER against the trader's plan.
 *
 * `cycleStartIso` (start of the user's 30-day billing cycle) limits the "total"
 * count to the current cycle — matching the plan's per-month quota. The daily
 * count always uses "today".
 *
 * IMPORTANT: only COMPLETED posts count toward quota. WhatsApp `pending_posts`
 * rows start life as `status = 'draft'` the moment a photo/description/customer
 * is received — counting those would block a brand-new user's very first POST
 * (the draft being generated is not a used post). A row only counts once it has
 * been generated (`generated`) or published (`published`). Rows must also
 * carry generated content (`google_post`) — review-request-only rows that were
 * completed via the DONE workflow have no post content and are excluded.
 */
const COMPLETED_POST_STATUSES = ['generated', 'published'];
export async function countUserPosts(
  userId: string | null,
  phone?: string | null,
  cycleStartIso?: string
): Promise<{ total: number; daily: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const totalSince = cycleStartIso || '1970-01-01T00:00:00.000Z';

  let total = 0;
  let daily = 0;

  // 1) Web dashboard posts
  if (userId) {
    const { count: totalCount, error: totalErr } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', totalSince);

    const { count: dailyCount, error: dailyErr } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayIso);

    if (!totalErr && totalCount !== null) total += totalCount;
    if (!dailyErr && dailyCount !== null) daily += dailyCount;
  }

  // 2) WhatsApp posts
  if (phone) {
    const { count: totalCount, error: totalErr } = await supabase
      .from('pending_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_phone', phone)
      .in('status', COMPLETED_POST_STATUSES)
      // A completed post always carries generated content. Review-request-only
      // rows (customer details, no google_post) must never count toward quota.
      .not('google_post', 'is', null)
      .gte('created_at', totalSince);

    const { count: dailyCount, error: dailyErr } = await supabase
      .from('pending_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_phone', phone)
      .in('status', COMPLETED_POST_STATUSES)
      .not('google_post', 'is', null)
      .gte('created_at', todayIso);

    if (!totalErr && totalCount !== null) total += totalCount;
    if (!dailyErr && dailyCount !== null) daily += dailyCount;
  }

  return { total, daily };
}
