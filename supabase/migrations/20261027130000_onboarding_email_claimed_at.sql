-- ============================================================
-- 20261027130000_onboarding_email_claimed_at.sql
-- Milestone 2: claim timestamps for the onboarding emails.
--
-- The status columns from 20261027120000 already encode the state machine:
--   'none' -> 'pending' (claimed) -> 'sent' | 'failed' | 'none'
-- but a claim has no expiry without a timestamp, so a crashed invocation
-- would leave a row stuck in 'pending' forever and the email would never be
-- sent. These columns record WHEN the claim was taken so the claim UPDATE can
-- take over a claim older than 10 minutes (see src/lib/onboarding-emails.ts).
--
-- welcome_sent_at / howto_sent_at stay as the delivery audit trail; these are
-- the claim bookkeeping only. Idempotent and safe to re-run.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS welcome_email_claimed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS howto_email_claimed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.welcome_email_claimed_at IS
  'When the welcome email was claimed (welcome_email_status = pending). Claims older than 10 minutes are treated as abandoned and may be taken over.';
COMMENT ON COLUMN public.profiles.howto_email_claimed_at IS
  'When the how-to email was claimed (howto_email_status = pending). Claims older than 10 minutes are treated as abandoned and may be taken over.';
