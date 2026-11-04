-- ============================================================================
-- 20261104_leads_audit_signals.sql
-- Audit signals on public.leads: website / has_website / review_count / rating
--
-- Admin -> Leads now shows a HOT / WARM / COLD priority badge per lead
-- (src/lib/lead-priority.ts). That triage needs to know whether the business
-- has a website and how thin its review profile is - and until now those
-- signals only existed as prose inside `notes`
-- ("GMB audit 72/100 · 4.8★ (213 reviews) · roofing contractor · site: x.com").
--
-- This migration only EXTENDS public.leads (created in
-- 20260905_admin_dashboard.sql), exactly like 20261103_audit_lead_capture.sql:
-- no new tables, no new RLS policies, nothing to re-grant. Ad-form leads keep
-- every one of these columns NULL, which the priority helper reads as
-- "unknown" rather than "bad".
--
-- Safe to re-run: every statement is IF NOT EXISTS, and the backfill below only
-- touches rows whose target column is still NULL.
-- ============================================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website TEXT;
-- NULL = unknown (never audited); TRUE = had a site at the last audit;
-- FALSE = the Places listing had no website.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS has_website BOOLEAN;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS review_count INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);

COMMENT ON COLUMN public.leads.website IS
  'Website from the last GBP audit (gmb_audit leads only) - kept with its protocol so the admin can link to it.';
COMMENT ON COLUMN public.leads.has_website IS
  'TRUE/FALSE as measured by the last audit; NULL = not checked yet (never treat NULL as "no website").';
COMMENT ON COLUMN public.leads.review_count IS
  'Google review count at the last audit (gmb_audit leads only).';
COMMENT ON COLUMN public.leads.rating IS
  'Google star rating at the last audit, 1 decimal (gmb_audit leads only).';

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill - audit leads only (audit_score IS NOT NULL)
--
-- IMPORTANT: everything below is INFERRED by re-parsing the `notes` string that
-- src/lib/audit-lead.ts#buildAuditNotes() wrote, because these values were
-- never stored structurally. Two consequences:
--   * precision is capped by the notes format - rating is 1 decimal, the
--     website is stored without its protocol, and review_count falls back to 0
--     when the fragment is missing (buildAuditNotes() omits it when reviews = 0,
--     so a missing "(N reviews)" really does mean zero reviews);
--   * these are throw-away estimates - the next audit re-run of the same
--     listing overwrites all four columns with the live Places values (see
--     captureAuditLead(), which always writes them).
--
-- Ad-form leads (audit_score IS NULL) are never touched, so their badge stays
-- COLD / "No audit data".
-- ─────────────────────────────────────────────────────────────────────────────

-- "… (213 reviews)" -> 213; no fragment -> 0.
UPDATE public.leads
SET review_count = COALESCE((regexp_match(notes, '\((\d+) reviews?\)'))[1]::integer, 0)
WHERE audit_score IS NOT NULL
  AND review_count IS NULL
  AND notes IS NOT NULL;

-- "… 4.8★ (213 reviews) …" -> 4.8. The star anchor keeps street numbers
-- ("12 Main St") out of the match.
UPDATE public.leads
SET rating = (regexp_match(notes, '([0-9]\.[0-9])★'))[1]::numeric(2,1)
WHERE audit_score IS NOT NULL
  AND rating IS NULL
  AND notes ~ '[0-9]\.[0-9]★';

-- "… · site: x.com · …" -> x.com (protocol-less, as the notes builder wrote it).
UPDATE public.leads
SET website = (regexp_match(notes, 'site: ([^ ·]+)'))[1]
WHERE audit_score IS NOT NULL
  AND website IS NULL
  AND notes ~ 'site: ';

-- Audit leads without the "site: " fragment had no website at audit time.
UPDATE public.leads
SET has_website = (position('site: ' in notes) > 0)
WHERE audit_score IS NOT NULL
  AND has_website IS NULL
  AND notes IS NOT NULL;

-- Admin -> Leads only ever shows the newest leads first, but the badge now
-- ranks audit leads by review volume when picking who to call.
CREATE INDEX IF NOT EXISTS idx_leads_review_count
  ON public.leads(review_count)
  WHERE place_id IS NOT NULL;
