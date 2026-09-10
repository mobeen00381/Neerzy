-- ============================================================
-- 20260913_website_seo.sql
-- SEO / AEO / GEO protection:
--   websites.seo_locked — TRUE means SEO fields (title, description,
--   keywords, FAQ, schema data, rating/reviews) are system-managed and
--   must never be writable from the customer editor. The editor API
--   enforces a whitelist; this flag is the explicit contract + lets a
--   future admin tool unlock it deliberately.
-- ============================================================

ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS seo_locked BOOLEAN DEFAULT TRUE;

-- Freshly created rows are always locked (belt and braces)
UPDATE public.websites SET seo_locked = TRUE WHERE seo_locked IS NULL;
