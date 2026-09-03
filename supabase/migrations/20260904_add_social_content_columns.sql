-- Phase 1.5: Unified Post Flow — store Facebook & Instagram social content
-- alongside the Google post so full history shows all 3 posts in the dashboard
-- and analytics can count each platform.
-- Safe: ADD COLUMN IF NOT EXISTS — no data touched.

ALTER TABLE public.pending_posts ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE public.pending_posts ADD COLUMN IF NOT EXISTS social_instagram TEXT;

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS social_instagram TEXT;
