-- ============================================================
-- 20260910_domains.sql
-- Buy-Domain feature (dashboard) + real Porkbun registration:
--   1) domains      — per-domain rows owned by a user (Pro/Growth = 1,
--                     Agency = up to 10, one per client/trader).
--   2) users        — add domain / domain_expires_at (the Paddle webhook
--                     already writes `domain`, but no migration ever created
--                     the column, so that write has been failing silently).
--   3) RLS          — owners may read/update their own rows; service_role
--                     manages everything (used by webhook + renewal cron).
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 0. SAFETY: idempotent helper (mirrors 20260905 migration)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. FIX users.domain (webhook writes this — column was missing)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS domain_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website_url TEXT;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. DOMAINS
-- Status lifecycle:
--   provisioning → created by /api/domains/purchase while the Paddle
--                  transaction is open (payment pending).
--   active       → payment confirmed + registered on Porkbun + added to Vercel.
--   failed       → payment confirmed but registration errored (admin needs to
--                  look at `error` / refund).
--   expired      → set by renewal tooling / manual admin action.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'provisioning',
  client_label TEXT,                     -- Agency: which trader/client this domain is for
  price_paid NUMERIC(10,2) DEFAULT 19.00,
  currency TEXT DEFAULT 'USD',
  provider TEXT DEFAULT 'porkbun',
  registered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                -- expiry drives the day-330 renewal notice
  auto_renew BOOLEAN DEFAULT TRUE,
  renewal_notified_at TIMESTAMPTZ,       -- set once the day-330 WhatsApp notice was sent
  paddle_transaction_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_user ON public.domains(user_id);

-- NOTE: some databases already had an older `domains` table
-- (id, user_id, domain_name, is_primary, status, dns_records, created_at).
-- CREATE TABLE IF NOT EXISTS skips it, so make sure every column we rely on
-- exists, plus the UNIQUE constraint the webhook's upsert(onConflict) needs.
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS client_label TEXT;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS price_paid NUMERIC(10,2) DEFAULT 19.00;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'porkbun';
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS renewal_notified_at TIMESTAMPTZ;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS paddle_transaction_id TEXT;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE public.domains ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.domains'::regclass
      AND conname = 'domains_domain_name_key'
  ) THEN
    ALTER TABLE public.domains ADD CONSTRAINT domains_domain_name_key UNIQUE (domain_name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_domains_due_renewal
  ON public.domains(expires_at)
  WHERE status = 'active' AND auto_renew = TRUE AND renewal_notified_at IS NULL;

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Service role: full access (webhook + cron)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'domains' AND policyname = 'domains service access'
  ) THEN
    DROP POLICY "domains service access" ON public.domains;
  END IF;
END $$;
CREATE POLICY "domains service access" ON public.domains
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Owners: read + update their own rows (dashboard DomainPanel reads directly)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'domains' AND policyname = 'Users can view own domains'
  ) THEN
    DROP POLICY "Users can view own domains" ON public.domains;
  END IF;
END $$;
CREATE POLICY "Users can view own domains" ON public.domains
  FOR SELECT USING (auth.uid() = user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'domains' AND policyname = 'Users can update own domains'
  ) THEN
    DROP POLICY "Users can update own domains" ON public.domains;
  END IF;
END $$;
CREATE POLICY "Users can update own domains" ON public.domains
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_domains_modtime ON public.domains;
CREATE TRIGGER update_domains_modtime BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
