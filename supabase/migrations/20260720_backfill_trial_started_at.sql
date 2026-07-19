-- BACKFILL MIGRATION: trial_started_at for existing users
-- 
-- This is a DRY-RUN first. Run the SELECT queries below to see the report.
-- The actual UPDATE is at the bottom, commented out, ready to be applied after review.
--
-- Strategy: Use auth.users.created_at as the authoritative source for signup date.
-- This is fair because it's the actual timestamp when the user created their account.
--
-- Run: psql or Supabase SQL Editor
-- Date: 2026-07-20

-- ============================================================
-- REPORT 1: How many users currently have trial_started_at set?
-- ============================================================
SELECT 
  'REPORT 1: Profile trial_started_at status' as report_name,
  COUNT(*) FILTER (WHERE p.trial_started_at IS NOT NULL) as already_set,
  COUNT(*) FILTER (WHERE p.trial_started_at IS NULL) as needs_backfill,
  COUNT(*) as total_profiles
FROM public.profiles p;

-- ============================================================
-- REPORT 2: How many auth users have NO profile row at all?
-- ============================================================
SELECT 
  'REPORT 2: Auth users without profiles row' as report_name,
  COUNT(*) as users_without_profile
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- ============================================================
-- REPORT 3: Days remaining after backfill, grouped by plan tier
-- Shows how many users would land at 0 or negative days
-- ============================================================
WITH backfill_candidates AS (
  -- Users who need backfill (no trial_started_at)
  SELECT 
    p.id,
    p.selected_plan,
    COALESCE(p.trial_started_at, au.created_at) as effective_trial_start,
    au.created_at as auth_created_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.trial_started_at IS NULL
  
  UNION ALL
  
  -- Users with no profile row at all
  SELECT 
    au.id,
    'free' as selected_plan,
    au.created_at as effective_trial_start,
    au.created_at as auth_created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL
)
SELECT 
  'REPORT 3: Days remaining after backfill' as report_name,
  selected_plan,
  COUNT(*) as total_users,
  COUNT(*) FILTER (
    WHERE EXTRACT(DAY FROM NOW() - effective_trial_start) >= 30
  ) as expired_or_negative_days,  -- trial already over
  COUNT(*) FILTER (
    WHERE EXTRACT(DAY FROM NOW() - effective_trial_start) BETWEEN 20 AND 29
  ) as less_than_10_days_left,
  COUNT(*) FILTER (
    WHERE EXTRACT(DAY FROM NOW() - effective_trial_start) BETWEEN 10 AND 19
  ) as between_10_and_20_days_left,
  COUNT(*) FILTER (
    WHERE EXTRACT(DAY FROM NOW() - effective_trial_start) < 10
  ) as more_than_20_days_left,
  ROUND(AVG(EXTRACT(DAY FROM NOW() - effective_trial_start))::numeric, 1) as avg_days_since_signup
FROM backfill_candidates
GROUP BY selected_plan
ORDER BY selected_plan;

-- ============================================================
-- REPORT 4: Detailed breakdown of users at 0 or negative days
-- ============================================================
WITH backfill_candidates AS (
  SELECT 
    p.id,
    p.selected_plan,
    COALESCE(p.trial_started_at, au.created_at) as effective_trial_start,
    au.created_at as auth_created_at,
    au.email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.trial_started_at IS NULL
  
  UNION ALL
  
  SELECT 
    au.id,
    'free' as selected_plan,
    au.created_at as effective_trial_start,
    au.created_at as auth_created_at,
    au.email
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL
)
SELECT 
  'REPORT 4: Users who would be at 0 or negative days' as report_name,
  id,
  email,
  selected_plan,
  auth_created_at,
  EXTRACT(DAY FROM NOW() - effective_trial_start) as days_since_signup,
  GREATEST(0, 30 - EXTRACT(DAY FROM NOW() - effective_trial_start)) as days_remaining_after_backfill
FROM backfill_candidates
WHERE EXTRACT(DAY FROM NOW() - effective_trial_start) >= 30
ORDER BY days_since_signup DESC;

-- ============================================================
-- REPORT 5: Summary stats for decision making
-- ============================================================
WITH backfill_candidates AS (
  SELECT 
    p.id,
    p.selected_plan,
    COALESCE(p.trial_started_at, au.created_at) as effective_trial_start,
    au.created_at as auth_created_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.trial_started_at IS NULL
  
  UNION ALL
  
  SELECT 
    au.id,
    'free' as selected_plan,
    au.created_at as effective_trial_start,
    au.created_at as auth_created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL
)
SELECT 
  'REPORT 5: Executive Summary' as report_name,
  COUNT(*) as total_users_needing_backfill,
  COUNT(*) FILTER (WHERE EXTRACT(DAY FROM NOW() - effective_trial_start) >= 30) as would_expire_immediately,
  COUNT(*) FILTER (WHERE EXTRACT(DAY FROM NOW() - effective_trial_start) < 30) as would_get_remaining_days,
  ROUND(
    (COUNT(*) FILTER (WHERE EXTRACT(DAY FROM NOW() - effective_trial_start) >= 30)::numeric / 
     NULLIF(COUNT(*), 0) * 100), 1
  ) as pct_would_expire
FROM backfill_candidates;

-- ============================================================
-- ACTUAL BACKFILL (commented out — uncomment after review)
-- ============================================================
-- BEGIN;
-- 
-- -- Step 1: Backfill trial_started_at for profiles that have no value
-- UPDATE public.profiles p
-- SET trial_started_at = au.created_at,
--     updated_at = NOW()
-- FROM auth.users au
-- WHERE p.id = au.id
--   AND p.trial_started_at IS NULL;
-- 
-- -- Step 2: Create profile rows for auth users who don't have one
-- INSERT INTO public.profiles (id, trial_started_at, selected_plan, created_at, updated_at)
-- SELECT 
--   au.id,
--   au.created_at,
--   'free',
--   NOW(),
--   NOW()
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON p.id = au.id
-- WHERE p.id IS NULL;
-- 
-- COMMIT;
