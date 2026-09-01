-- ============================================================
-- Add missing columns to profiles that production was missing
-- ============================================================
-- Production's profiles table was not created from the canonical
-- 20240514_create_core_tables.sql and was missing core columns
-- (notably phone, trial_started_at, gbp_connected, updated_at,
-- selected_plan). This made every WhatsApp CONNECT upsert fail
-- with "column X does not exist" and silently disabled the
-- dashboard/WhatsApp trial & quota enforcement.
-- All statements are idempotent so this is safe to re-run.

-- 1. Add missing columns (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gbp_connected BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gbp_connected_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selected_plan TEXT DEFAULT 'free';

-- 2. Backfill the one-time trial + monthly cycle anchors from account creation
UPDATE public.profiles
SET trial_started_at = COALESCE(created_at, NOW())
WHERE trial_started_at IS NULL;

UPDATE public.profiles
SET plan_started_at = COALESCE(trial_started_at, created_at, NOW())
WHERE plan_started_at IS NULL;
