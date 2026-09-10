-- ============================================================
-- 20260912_website_content.sql
-- Part 2 — Website builder content:
--   websites.content        — generated site JSON (hero, about, services,
--                             hours, photos, reviews, seo, palette)
--   websites.template_id    — chosen template (TEMPLATE_REGISTRY id)
--   websites.preview_ready  — content generated → dashboard preview available
--   websites.reviews_cache  — Google reviews cached for the site (Phase 2 sync
--                             writes here; nothing calls Google on page view)
--   build_* timestamps      — build telemetry + stuck-build retry
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS preview_ready BOOLEAN DEFAULT FALSE;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS reviews_cache JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS reviews_synced_at TIMESTAMPTZ;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS build_started_at TIMESTAMPTZ;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS build_finished_at TIMESTAMPTZ;

-- Stuck-build retry: rows left in 'building' without content
CREATE INDEX IF NOT EXISTS idx_websites_build_pending
  ON public.websites(build_started_at)
  WHERE status = 'building' AND preview_ready = FALSE;
