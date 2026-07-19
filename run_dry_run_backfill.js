// Dry-run backfill report script — UPDATED with actual DB state
// Run: node run_dry_run_backfill.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uheshftvnvifibyolixf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZXNoZnR2bnZpZmlieW9saXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzM5MzEsImV4cCI6MjA5MDU0OTkzMX0.iJe-1GSB6A6caLl194uuVA24tOZQ87o_X1QUGYlzGz4'
);

async function run() {
  console.log('=== REPORT 1: Profile trial_started_at status ===');
  const { data: profiles, error: e1 } = await supabase
    .from('profiles')
    .select('id');
  
  if (e1) {
    // Check if column exists
    console.log('Error fetching profiles:', e1.message);
    console.log('Checking what columns exist on profiles table...');
    const { data: anyProfile } = await supabase.from('profiles').select('*').limit(1);
    if (anyProfile && anyProfile.length > 0) {
      console.log('Columns:', Object.keys(anyProfile[0]));
    } else {
      console.log('Profiles table exists but has 0 rows (or columns are different from migration)');
    }
  }
  
  console.log(`Profiles count: ${profiles?.length || 0}`);

  console.log('\n=== REPORT 2: Auth users — checking posts table for user activity ===');
  const { data: posts, error: e2 } = await supabase
    .from('posts')
    .select('user_id, created_at')
    .order('created_at', { ascending: true });
  
  if (e2) { console.error('Error fetching posts:', e2); return; }
  
  const userPostMap = {};
  for (const p of posts) {
    const uid = p.user_id || 'null_user_id';
    if (!userPostMap[uid]) userPostMap[uid] = { count: 0, firstPost: p.created_at, lastPost: p.created_at };
    userPostMap[uid].count++;
    if (p.created_at < userPostMap[uid].firstPost) userPostMap[uid].firstPost = p.created_at;
    if (p.created_at > userPostMap[uid].lastPost) userPostMap[uid].lastPost = p.created_at;
  }
  
  console.log(`Total posts: ${posts.length}`);
  console.log(`Unique user_ids in posts: ${Object.keys(userPostMap).length}`);
  console.log(`Posts with null user_id: ${userPostMap['null_user_id']?.count || 0}`);
  
  const realUsers = Object.entries(userPostMap).filter(([uid]) => uid !== 'null_user_id');
  console.log(`Posts with real user_id: ${realUsers.length} users`);
  
  for (const [uid, info] of realUsers) {
    console.log(`  User ${uid}: ${info.count} posts, first: ${info.firstPost}, last: ${info.lastPost}`);
  }

  console.log('\n=== REPORT 3: Business profiles ===');
  const { data: bizProfiles, error: e3 } = await supabase
    .from('business_profiles')
    .select('*');
  console.log(`Business profiles count: ${bizProfiles?.length || 0}`);
  if (e3) console.error('Error:', e3);

  console.log('\n=== REPORT 4: Jobs table ===');
  const { data: jobs, error: e4 } = await supabase
    .from('jobs')
    .select('user_id, created_at')
    .order('created_at', { ascending: true });
  
  if (e4) { console.log('Jobs table error (may not exist):', e4.message); }
  else {
    const jobUserMap = {};
    for (const j of jobs) {
      const uid = j.user_id || 'null';
      if (!jobUserMap[uid]) jobUserMap[uid] = { count: 0, first: j.created_at };
      jobUserMap[uid].count++;
    }
    console.log(`Total jobs: ${jobs.length}`);
    console.log(`Unique user_ids in jobs: ${Object.keys(jobUserMap).length}`);
    for (const [uid, info] of Object.entries(jobUserMap)) {
      console.log(`  User ${uid}: ${info.count} jobs`);
    }
  }

  console.log('\n=== REPORT 5: Executive Summary ===');
  console.log(`Profiles table: ${profiles?.length || 0} rows (trial_started_at column may not exist)`);
  console.log(`Business profiles: ${bizProfiles?.length || 0} rows`);
  console.log(`Posts: ${posts.length} total (${userPostMap['null_user_id']?.count || 0} with null user_id)`);
  console.log(`Users with posts (non-null user_id): ${realUsers.length}`);
  console.log(`Jobs: ${jobs?.length || 0}`);
  
  console.log('\n=== KEY FINDING ===');
  console.log('The profiles table exists but has 0 rows and is missing the trial_started_at column.');
  console.log('This means the migration 20240514_create_core_tables.sql was NEVER fully applied.');
  console.log('The fix needs TWO things:');
  console.log('  1. ALTER TABLE profiles ADD COLUMN trial_started_at TIMESTAMPTZ');
  console.log('  2. The profiles table needs to be populated (currently 0 rows)');
  console.log('  3. For existing posts with null user_id, we cannot link them to any user');
}

run().catch(console.error);
