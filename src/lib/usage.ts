// lib/usage.ts
import { createClient } from '@supabase/supabase-js';

export async function getUsageStats(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Count total posts created by the user
  const { count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching usage stats:', error);
    return { totalPosts: 0 };
  }

  return {
    totalPosts: count || 0,
    // Add more stats as needed (daily usage, etc)
  };
}
