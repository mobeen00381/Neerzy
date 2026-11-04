-- ============================================================================
-- 20261105_lead_activity.sql
-- Manual review / activity log behind the Admin -> Leads detail drawer.
--
-- The drawer (src/components/admin/LeadDrawer.tsx) needs an append-only
-- timeline per lead: internal notes, outreach attempts (WhatsApp / email /
-- call), manual review checklist ticks and status changes. One row per event
-- so the admin can answer what has already been tried with this lead.
--
-- Also adds leads.last_contacted_at - stamped by the log_contact action so
-- when-did-we-last-reach-this-lead stays a cheap column read.
--
-- leads.id is a UUID (20260905_admin_dashboard.sql), so lead_id is UUID too.
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS /
-- ADD COLUMN IF NOT EXISTS, and the policy block only drops-and-recreates the
-- policy when it already exists (same pattern as the leads table policy).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- note | contacted_whatsapp | contacted_email | called | status_change | reviewed
  body TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The drawer always loads one lead timeline, newest first.
CREATE INDEX IF NOT EXISTS lead_activity_lead_id_idx
  ON public.lead_activity(lead_id, created_at DESC);

ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;

-- Same pattern as the leads table policy (20260905_admin_dashboard.sql):
-- the admin API talks to Supabase with the service-role key only.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lead_activity' AND policyname = 'lead_activity service access'
  ) THEN
    DROP POLICY "lead_activity service access" ON public.lead_activity;
  END IF;
END $$;
CREATE POLICY "lead_activity service access" ON public.lead_activity
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Stamped by POST /api/admin/leads/[id] (action: log_contact).
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
