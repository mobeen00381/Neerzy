-- ============================================================
-- Add plan_started_at to profiles — the 30-day billing cycle anchor
-- ============================================================
-- All plans (free + paid) follow a monthly (30-day) quota cycle anchored to
-- the user's onboarding date (free) or plan purchase date (paid).

-- 1. Add column (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ;

-- 2. Backfill: anchor = trial_started_at (onboarding date) or created_at
UPDATE public.profiles
SET plan_started_at = COALESCE(trial_started_at, created_at, NOW())
WHERE plan_started_at IS NULL;
