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
 */
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
      .gte('created_at', totalSince);

    const { count: dailyCount, error: dailyErr } = await supabase
      .from('pending_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_phone', phone)
      .gte('created_at', todayIso);

    if (!totalErr && totalCount !== null) total += totalCount;
    if (!dailyErr && dailyCount !== null) daily += dailyCount;
  }

  return { total, daily };
}
