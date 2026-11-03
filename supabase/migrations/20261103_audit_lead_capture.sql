-- ============================================================================
-- 20261103_audit_lead_capture.sql
-- GMB audit tool -> Admin -> Leads
--
-- Every visitor who generates a report on /gmb-audit-tool is a real business
-- owner with a live Google Business Profile - the warmest lead the site can
-- produce. Until now those scans never reached Admin -> Leads, because only
-- /api/leads/submit inserted rows.
--
-- This migration only EXTENDS public.leads (created in
-- 20260905_admin_dashboard.sql) so audit rows travel through the exact same
-- pipeline - same statuses, same notes, same admin actions. No new tables,
-- no new RLS policies, nothing to re-grant.
--
-- Safe to re-run: every statement is IF NOT EXISTS.
-- ============================================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS audit_score INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS report_link TEXT;

COMMENT ON COLUMN public.leads.place_id IS
  'Google Places place_id for gmb_audit leads - one lead per business.';
COMMENT ON COLUMN public.leads.audit_score IS
  'Last GBP audit score 0-100 (gmb_audit leads only).';
COMMENT ON COLUMN public.leads.report_link IS
  'Shareable /gmb-audit-tool/results?placeId=... link - re-runs the live report.';

-- One lead per business: re-auditing the same listing UPDATES that row instead
-- of creating a duplicate. The partial predicate keeps every ad-form lead
-- (place_id NULL) completely unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_place_id
  ON public.leads(place_id)
  WHERE place_id IS NOT NULL;

-- Admin -> Leads sorts/filters audit leads by score when picking who to call.
CREATE INDEX IF NOT EXISTS idx_leads_audit_score
  ON public.leads(audit_score DESC)
  WHERE place_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- email_log: audit delivery is user-triggered and repeatable
--
-- The at-most-once guard on (email_type, channel, lead_id) is right for the
-- automated onboarding sends, but an audit report is sent on request (work
-- email, then personal) and follow-ups are manual. Keeping the guard for those
-- two types would silently drop log rows, so it is scoped to the automation
-- types only.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.email_log') IS NOT NULL THEN
    DROP INDEX IF EXISTS public.uq_email_log_lead_sent;
    CREATE UNIQUE INDEX IF NOT EXISTS uq_email_log_lead_sent
      ON public.email_log(email_type, channel, lead_id)
      WHERE status = 'sent' AND lead_id IS NOT NULL
        AND email_type IN ('welcome', 'howto', 'lead_ack', 'lead_owner_notify');
  END IF;
END $$;
