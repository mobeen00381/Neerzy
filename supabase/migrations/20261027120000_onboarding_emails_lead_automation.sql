-- ============================================================
-- 20261027120000_onboarding_emails_lead_automation.sql
-- Automated onboarding emails + lead-response automation.
--
-- Retry-safe state model:
--   'none' -> 'pending' (claimed) -> 'sent' | 'failed'
--   Claiming happens with a conditional UPDATE ... WHERE status IN ('none','failed'),
--   so two concurrent workers can never both claim, and a failed send RELEASES
--   the claim so the cron can retry. 'sent' is terminal -> at-most-once on success.
-- Idempotent and safe to re-run.
-- ============================================================

-- -----------------------------------------------------------
-- 1. PROFILES - onboarding email flags
-- -----------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS howto_email_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS howto_sent_at TIMESTAMPTZ;
-- The how-to cron skips users who opted out of tips emails.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_email_opt_out BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_welcome_email_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_welcome_email_status_check
      CHECK (welcome_email_status IN ('none', 'pending', 'sent', 'failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_howto_email_status_check') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_howto_email_status_check
      CHECK (howto_email_status IN ('none', 'pending', 'sent', 'failed'));
  END IF;
END $$;

-- -----------------------------------------------------------
-- 2. LEADS - automation tracking (admin-owned leads; no owner column)
-- -----------------------------------------------------------
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_reply TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_reply_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_reply_generated_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS owner_notify_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS owner_notified_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ack_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ack_sent_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS reply_sent_at TIMESTAMPTZ;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_ai_reply_status_check') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_ai_reply_status_check
      CHECK (ai_reply_status IN ('none', 'generating', 'draft_ready', 'sent', 'failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_owner_notify_status_check') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_owner_notify_status_check
      CHECK (owner_notify_status IN ('none', 'pending', 'sent', 'failed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_ack_status_check') THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_ack_status_check
      CHECK (ack_status IN ('none', 'pending', 'sent', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_ai_reply_status ON public.leads(ai_reply_status);
CREATE INDEX IF NOT EXISTS idx_leads_ack_status ON public.leads(ack_status);
CREATE INDEX IF NOT EXISTS idx_leads_owner_notify_status ON public.leads(owner_notify_status);

-- -----------------------------------------------------------
-- 3. EMAIL_LOG - delivery audit + hard at-most-once dedup.
--    Partial unique indexes include channel: at most one SUCCESSFUL row per
--    (type, channel, user) and per (type, channel, lead); failed attempts stay
--    loggable for the retry trail. DRY_RUN never writes rows at all.
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type  TEXT NOT NULL,                  -- welcome | howto | lead_ack | lead_owner_notify
  channel     TEXT NOT NULL DEFAULT 'email',  -- email | whatsapp (best-effort)
  user_id     UUID,
  lead_id     UUID,
  to_email    TEXT,
  provider_id TEXT,                           -- Resend message id (or Meta wamid)
  status      TEXT NOT NULL DEFAULT 'sent',   -- sent | failed
  error       TEXT,                           -- redacted message only, never env values
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_type ON public.email_log(email_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_user ON public.email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_lead ON public.email_log(lead_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_log_user_sent
  ON public.email_log(email_type, channel, user_id)
  WHERE status = 'sent' AND user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_log_lead_sent
  ON public.email_log(email_type, channel, lead_id)
  WHERE status = 'sent' AND lead_id IS NOT NULL;

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_log service access" ON public.email_log;
CREATE POLICY "email_log service access" ON public.email_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);
