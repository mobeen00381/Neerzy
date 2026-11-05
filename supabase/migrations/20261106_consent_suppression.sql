-- ============================================================================
-- 20261106_consent_suppression.sql
-- Phase 0 of lead automation: consent, suppression/unsubscribe, bounce handling
-- and phone normalization storage. NO automated sequences are wired up yet - the
-- tables/columns below are the foundation they will read from.
--
--   public.lead_consent      - one row per (lead, channel, purpose): when the
--                              visitor opted in, the EXACT wording they saw, and
--                              when they opted out again.
--   public.email_suppression - global "never email this address" list filled by
--                              /unsubscribe, the Resend webhook and admins.
--   public.leads.country / .phone_e164 - normalized phone data (lib/phone.ts).
--                              leads.phone keeps the raw string a human typed.
--
-- leads.id is UUID (20260905_admin_dashboard.sql), so lead_id is UUID too.
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS /
-- ADD COLUMN IF NOT EXISTS, constraints guarded by pg_constraint, and the policy
-- blocks only drop-and-recreate the policy that already exists (the same pattern
-- as 20261105_lead_activity.sql).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. LEAD_CONSENT - proof of what the visitor agreed to, per channel
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,                          -- email | whatsapp
  purpose TEXT NOT NULL DEFAULT 'marketing',      -- marketing (future: product, billing)
  opted_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- NULL = still opted in. Set by /unsubscribe (and by a manual admin action).
  opted_out_at TIMESTAMPTZ,
  source TEXT,                                    -- audit_report_card | unsubscribe | ...
  consent_text TEXT,                              -- exact wording the visitor saw
  CONSTRAINT lead_consent_channel_check CHECK (channel IN ('email', 'whatsapp')),
  -- One consent record per lead+channel+purpose: re-ticking the same box updates
  -- the row instead of stacking duplicates (ON CONFLICT in /api/audit/report/send).
  CONSTRAINT lead_consent_lead_channel_purpose_key UNIQUE (lead_id, channel, purpose)
);

-- Re-assert the constraints for a database created from an earlier draft of this
-- file (CREATE TABLE IF NOT EXISTS would silently skip them).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_consent_channel_check'
  ) THEN
    ALTER TABLE public.lead_consent ADD CONSTRAINT lead_consent_channel_check
      CHECK (channel IN ('email', 'whatsapp'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_consent_lead_channel_purpose_key'
  ) THEN
    ALTER TABLE public.lead_consent ADD CONSTRAINT lead_consent_lead_channel_purpose_key
      UNIQUE (lead_id, channel, purpose);
  END IF;
END $$;

-- /unsubscribe looks consents up by lead email; the future sequence builder looks
-- them up per channel+purpose. Both want the opt-out state cheap to read.
CREATE INDEX IF NOT EXISTS lead_consent_lead_id_idx
  ON public.lead_consent(lead_id, channel);
CREATE INDEX IF NOT EXISTS lead_consent_opted_in_idx
  ON public.lead_consent(channel, purpose)
  WHERE opted_out_at IS NULL;

ALTER TABLE public.lead_consent ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'lead_consent' AND policyname = 'lead_consent service access'
  ) THEN
    DROP POLICY "lead_consent service access" ON public.lead_consent;
  END IF;
END $$;
CREATE POLICY "lead_consent service access" ON public.lead_consent
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. EMAIL_SUPPRESSION - the global do-not-email list
--
-- The email address IS the key: a suppression is about the mailbox, not the lead
-- row, so it survives a lead being deleted and covers every future send. Always
-- stored lowercase - the CHECK makes that impossible to forget.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_suppression (
  email TEXT PRIMARY KEY,
  reason TEXT NOT NULL,               -- unsubscribe | bounce | complaint | manual
  source TEXT,                        -- unsubscribe_page | resend_webhook | admin | ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_suppression_reason_check
    CHECK (reason IN ('unsubscribe', 'bounce', 'complaint', 'manual')),
  CONSTRAINT email_suppression_lowercase_check
    CHECK (email = lower(btrim(email)))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_suppression_reason_check'
  ) THEN
    ALTER TABLE public.email_suppression ADD CONSTRAINT email_suppression_reason_check
      CHECK (reason IN ('unsubscribe', 'bounce', 'complaint', 'manual'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_suppression_lowercase_check'
  ) THEN
    ALTER TABLE public.email_suppression ADD CONSTRAINT email_suppression_lowercase_check
      CHECK (email = lower(btrim(email)));
  END IF;
END $$;

-- Admin wants "recent suppressions" newest first; the send path hits the primary
-- key directly.
CREATE INDEX IF NOT EXISTS email_suppression_created_at_idx
  ON public.email_suppression(created_at DESC);

ALTER TABLE public.email_suppression ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'email_suppression' AND policyname = 'email_suppression service access'
  ) THEN
    DROP POLICY "email_suppression service access" ON public.email_suppression;
  END IF;
END $$;
CREATE POLICY "email_suppression service access" ON public.email_suppression
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. LEADS - normalized phone + country
--
-- phone stays exactly what the visitor/Places gave us (it is what the admin
-- reads and dials); phone_e164 is the machine form WhatsApp/marketing needs.
-- Both are nullable: normalization fails for landlines in unknown countries, and
-- NULL honestly means "we could not parse it" rather than a guess.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phone_e164 TEXT;

COMMENT ON COLUMN public.leads.country IS
  'ISO 3166-1 alpha-2 country derived from the phone number (lib/phone.ts). NULL = unknown.';
COMMENT ON COLUMN public.leads.phone_e164 IS
  'E.164 form of leads.phone (lib/phone.ts). NULL = not parseable / no country context.';
