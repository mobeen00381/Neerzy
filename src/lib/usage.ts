// lib/usage.ts
import { supabase } from './supabase';
import { PlanType, PLAN_LIMITS, getRemainingDays, getCycleStartIso } from './plans';

export interface UsageStats {
  totalPostsUsed: number;
  dailyPostsUsed: number;
  remainingToday: number;
  remainingTotal: number;
  daysLeft: number;
  isLimited: boolean;
}

export async function getUserUsage(
  userId: string,
  plan: PlanType,
  trialStart: string
): Promise<UsageStats> {
  const limits = PLAN_LIMITS[plan];

  // Get today's date in UTC
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 30-day billing cycle anchor (uses the plan-start/onboarding date)
  const cycleStartIso = getCycleStartIso(trialStart);

  // Fetch this cycle's posts from BOTH storage tables:
  // `posts` (web dashboard) + `pending_posts` (WhatsApp) — both count toward the plan
  const [postsRes, pendingRes] = await Promise.all([
    supabase.from('posts').select('id, created_at').eq('user_id', userId).gte('created_at', cycleStartIso),
    supabase.from('pending_posts').select('id, created_at').eq('user_id', userId)
      .in('status', ['generated', 'published']).not('google_post', 'is', null)
      .gte('created_at', cycleStartIso),
  ]);

  if (postsRes.error) console.error('Error fetching daily posts:', postsRes.error);
  if (pendingRes.error) console.error('Error fetching daily pending_posts:', pendingRes.error);

  const cycleRows = [...(postsRes.data || []), ...(pendingRes.data || [])];
  const dailyPostsUsed = cycleRows.filter((p: any) => new Date(p.created_at) >= today).length;
  const totalPostsUsed = cycleRows.length;

  const remainingToday = Math.max(0, limits.dailyPosts - dailyPostsUsed);
  const remainingTotal = limits.totalPosts === -1 
    ? Infinity 
    : Math.max(0, limits.totalPosts - totalPostsUsed);
  
  const daysLeft = limits.trialDays > 0 
    ? getRemainingDays(trialStart, limits.trialDays)
    : Infinity;
  
  const isLimited = (remainingToday <= 0 && limits.dailyPosts > 0) || 
                    (remainingTotal <= 0 && limits.totalPosts !== -1) || 
                    (daysLeft <= 0 && limits.trialDays > 0);
  
  return {
    totalPostsUsed,
    dailyPostsUsed,
    remainingToday,
    remainingTotal,
    daysLeft,
    isLimited,
  };
}
