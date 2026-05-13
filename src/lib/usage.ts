// lib/usage.ts
import { createClient } from '@supabase/supabase-js';
import { PlanType, PLAN_LIMITS, getRemainingDays } from './plans';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  
  // Fetch jobs created today
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());
  
  if (error) {
    console.error('Error fetching daily jobs:', error);
    throw error;
  }
  
  const dailyPostsUsed = jobs?.length || 0;
  const totalPostsUsed = await getTotalPostsCount(userId);
  
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

async function getTotalPostsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching total jobs count:', error);
    throw error;
  }
  return count || 0;
}
