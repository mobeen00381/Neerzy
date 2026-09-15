-- ============================================================
-- 20260915_audit_reviews.sql
-- Real, visitor-submitted reviews for the public /gmb-audit-tool page.
--
-- Why this table exists: the page previously carried a hardcoded
-- AggregateRating ("4.9 from 127 reviews") in its JSON-LD. That violated
-- Google's review-snippet guidelines — the rating must describe real reviews
-- a visitor can actually read on the page. This table is the source of truth
-- for the visible reviews section, and the JSON-LD AggregateRating is now
-- generated from the same `published` rows. No published rows → no stars.
--
-- Trust model (matches every other table in this project):
--   • RLS is ON and the ONLY policy is service_role. Nothing reaches this
--     table through the public anon key.
--   • Every write goes through /api/audit/review, which runs server-side with
--     the service-role key, rate-limits per IP and hashes the IP before insert.
--   • Reads for the public page are done server-side in
--     src/lib/audit-reviews.ts (service role) and only ever select
--     status = 'published'.
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. AUDIT_REVIEWS
-- One row per submitted rating of the audit tool itself (not of the scanned
-- business — the schema describes the SoftwareApplication).
--
--   rating        1–5 stars, enforced by a CHECK constraint
--   comment       optional one-liner (forcing text kills response rates)
--   author_name   optional free-text display name
--   scan_place_id the Google place id whose audit prompted the review.
--                 Used with ip_hash to allow one rating per scan per person.
--                 NULL is allowed (Postgres permits repeated NULLs in a
--                 unique index) so a review without a scan still saves.
--   ip_hash       sha256(client_ip + REVIEW_IP_SALT). Raw IPs are never stored.
--   status        pending | published | rejected. Defaults to `pending` so
--                 nothing renders on a crawled page without a human approving
--                 it — the tool is public and unauthenticated.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.audit_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  author_name TEXT,
  scan_place_id TEXT,
  ip_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The public page's only query: published reviews, newest first.
CREATE INDEX IF NOT EXISTS idx_audit_reviews_published
  ON public.audit_reviews(status, created_at DESC);

-- One rating per scan per person.
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_reviews_ip_scan
  ON public.audit_reviews(ip_hash, scan_place_id);

-- The /admin moderation queue: newest pending first.
CREATE INDEX IF NOT EXISTS idx_audit_reviews_pending
  ON public.audit_reviews(created_at DESC)
  WHERE status = 'pending';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. RLS — service role only (idempotent, same pattern as transactions/leads)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE public.audit_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_reviews'
      AND policyname = 'audit_reviews service access'
  ) THEN
    CREATE POLICY "audit_reviews service access" ON public.audit_reviews
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
