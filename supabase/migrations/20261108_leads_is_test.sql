-- ============================================================================
-- 20261108_leads_is_test.sql
-- public.leads.is_test: flags a lead as an INTERNAL TEST lead.
--
-- Why: the admin tests the automation sequences on purpose-made leads (a real
-- audit row for a business we own, a throw-away address). Those rows must keep
-- being enrolled, queued and mailed exactly like a real lead - that is the
-- whole point of them - but they should not clutter Admin -> Leads.
--
-- So the flag is display-only: LeadsTab hides test leads behind a "Hide test
-- leads" checkbox (on by default) and leaves them out of the NEW count.
-- NOTHING in lib/automation/* reads this column, and nothing filters on it in
-- the sequence code, which is deliberate.
--
-- Only EXTENDS public.leads (created in 20260905_admin_dashboard.sql), exactly
-- like 20261104_leads_audit_signals.sql: no new tables, no new RLS policies,
-- nothing to re-grant. NOT NULL DEFAULT false means every existing row stays a
-- real lead.
--
-- Safe to re-run: the ALTER is IF NOT EXISTS and COMMENT replaces itself.
-- ============================================================================

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.leads.is_test IS
  'TRUE = internal test lead: hidden by default in Admin -> Leads (and excluded from the NEW count) but still treated like any lead by the automation sequences.';
