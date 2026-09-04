-- ============================================================
-- 20260905_admin_dashboard.sql
-- Admin dashboard foundation:
--   1) transactions  — immutable record of every Paddle payment event
--   2) leads         — inbound lead pipeline (ads / social / Google / organic)
--   3) profiles      — signup attribution columns (source + UTM)
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 0. SAFETY: make this file SELF-CONTAINED
-- The leads trigger below uses update_modified_column(). That helper is
-- normally created by the very first core migration, but if it is missing in
-- your database the whole batch would fail and roll back. Recreating it here
-- (idempotent) guarantees this migration can never fail on a missing helper.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. TRANSACTIONS
-- Every Paddle webhook event (transaction.completed,
-- subscription.created, subscription.canceled, refunds...) is
-- appended here by /api/webhook/paddle. `paddle_event_id` is
-- unique so duplicate webhook deliveries never double-count.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paddle_event_id TEXT UNIQUE,
  paddle_transaction_id TEXT,
  paddle_subscription_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  plan TEXT,
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  event_type TEXT,            -- subscription.created | transaction.completed | subscription.canceled | ...
  origin TEXT,                -- subscription_creation | subscription_renewal | subscription_cycle | web | ...
  status TEXT DEFAULT 'completed',
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred ON public.transactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_event ON public.transactions(paddle_event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(event_type);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions service access'
  ) THEN
    DROP POLICY "transactions service access" ON public.transactions;
  END IF;
END $$;
CREATE POLICY "transactions service access" ON public.transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. LEADS
-- Inbound leads captured from ad landing pages (Facebook,
-- Instagram, Google Ads) and organic forms via POST
-- /api/leads/submit. `status` is the admin pipeline.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  business_name TEXT,
  service_type TEXT,
  source TEXT DEFAULT 'organic',     -- facebook | instagram | google_ads | organic | referral | direct
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new | contacted | trial_started | converted | lost
  notes TEXT,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_converted_user ON public.leads(converted_user_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads' AND policyname = 'leads service access'
  ) THEN
    DROP POLICY "leads service access" ON public.leads;
  END IF;
END $$;
CREATE POLICY "leads service access" ON public.leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_leads_modtime ON public.leads;
CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. SIGNUP ATTRIBUTION on profiles
-- Filled by the signup flow from UTM query params so the admin
-- dashboard can answer "which ad channel produced this user?"
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lead_id UUID;
