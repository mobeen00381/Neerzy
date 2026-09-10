-- ============================================================
-- 20260911_websites.sql
-- BUILD WEBSITE feature (dashboard):
--   1) websites — one row per built website (per domain).
--      Pricing model:
--        • Early adopters (created before WEBSITE_EARLY_ADOPTER_ENDS):
--          $99 setup fee WAIVED FOREVER; hosting free for their first 90
--          days (hosting_status='trial', free_until=+90d), then $10/mo.
--        • Everyone after the window: pay $99 setup + $10/mo hosting
--          BEFORE the build starts (status='pending' until paid).
--   2) RLS — owner read/update; service_role full (webhook + cron).
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  domain_name TEXT,
  -- pending: latecomer waiting to pay | building: paid/free, build running
  -- live: published (Part 2)     | paused: hosting unpaid or canceled
  status TEXT NOT NULL DEFAULT 'pending',
  -- Early-adopter bookkeeping
  setup_waived BOOLEAN DEFAULT FALSE,
  setup_paid BOOLEAN DEFAULT FALSE,
  setup_paid_at TIMESTAMPTZ,
  -- Hosting ($10/mo). trial = free period running
  hosting_status TEXT DEFAULT 'none',   -- none | trial | active | canceled
  free_until TIMESTAMPTZ,               -- end of the 90-day free hosting window
  -- Paddle references
  paddle_transaction_id TEXT,           -- $99 setup payment
  paddle_subscription_id TEXT,          -- $10/mo hosting subscription
  -- Cron bookkeeping (so reminders are sent once)
  notice_sent_at TIMESTAMPTZ,           -- "hosting starts in X days"
  pause_notice_sent_at TIMESTAMPTZ,     -- "website paused — reactivate"
  -- Build metadata (Part 2)
  template TEXT,
  pages JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_websites_user ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON public.websites(domain_id);
CREATE INDEX IF NOT EXISTS idx_websites_hosting_due
  ON public.websites(free_until)
  WHERE hosting_status = 'trial' AND status IN ('building', 'live');

ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'websites' AND policyname = 'websites service access'
  ) THEN
    DROP POLICY "websites service access" ON public.websites;
  END IF;
END $$;
CREATE POLICY "websites service access" ON public.websites
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'websites' AND policyname = 'Users can view own websites'
  ) THEN
    DROP POLICY "Users can view own websites" ON public.websites;
  END IF;
END $$;
CREATE POLICY "Users can view own websites" ON public.websites
  FOR SELECT USING (auth.uid() = user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'websites' AND policyname = 'Users can update own websites'
  ) THEN
    DROP POLICY "Users can update own websites" ON public.websites;
  END IF;
END $$;
CREATE POLICY "Users can update own websites" ON public.websites
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_websites_modtime ON public.websites;
CREATE TRIGGER update_websites_modtime BEFORE UPDATE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
