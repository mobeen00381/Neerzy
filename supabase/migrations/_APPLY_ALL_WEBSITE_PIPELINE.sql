-- NEERZY � APPLY ALL WEBSITE PIPELINE MIGRATIONS (v2: handles pre-existing domains table; paste into Supabase SQL Editor, run once)

-- ------------------------ 20260910_domains.sql ------------------------
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


-- ------------------------ 20260911_websites.sql ------------------------
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


-- ------------------------ 20260912_website_content.sql ------------------------
-- ============================================================
-- 20260912_website_content.sql
-- Part 2 — Website builder content:
--   websites.content        — generated site JSON (hero, about, services,
--                             hours, photos, reviews, seo, palette)
--   websites.template_id    — chosen template (TEMPLATE_REGISTRY id)
--   websites.preview_ready  — content generated → dashboard preview available
--   websites.reviews_cache  — Google reviews cached for the site (Phase 2 sync
--                             writes here; nothing calls Google on page view)
--   build_* timestamps      — build telemetry + stuck-build retry
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS preview_ready BOOLEAN DEFAULT FALSE;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS reviews_cache JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS reviews_synced_at TIMESTAMPTZ;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS build_started_at TIMESTAMPTZ;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS build_finished_at TIMESTAMPTZ;

-- Stuck-build retry: rows left in 'building' without content
CREATE INDEX IF NOT EXISTS idx_websites_build_pending
  ON public.websites(build_started_at)
  WHERE status = 'building' AND preview_ready = FALSE;


-- ------------------------ 20260913_website_seo.sql ------------------------
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


-- ------------------------ 20260914_subscription_status.sql ------------------------
-- ============================================================
-- 20260914_subscription_status.sql
-- Review-sync gating: only paid + ACTIVE subscriptions get Google review
-- sync (bounded API cost). Canceled/past-due users stop syncing entirely.
--   subscription_status: active | canceled | past_due
-- Maintained by the Paddle webhook on subscription lifecycle events.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_canceled_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reviews_synced_at TIMESTAMPTZ;

-- Review-sync due lookup (websites table drives the scan; keep it cheap)
CREATE INDEX IF NOT EXISTS idx_websites_reviews_due
  ON public.websites(reviews_synced_at)
  WHERE status = 'live';


