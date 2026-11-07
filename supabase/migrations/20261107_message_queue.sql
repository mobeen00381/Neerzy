-- ============================================================================
-- 20261107_message_queue.sql
-- Lead automation Phase 1: the outbound QUEUE, the global switches, and the
-- per-lead automation flags.
--
-- Phase 0 (20261106_consent_suppression.sql) gave us the vocabulary - consent,
-- suppression, unsubscribe. This migration gives the drainer somewhere to put
-- the emails it owes people, so nothing is ever sent twice and nothing is lost
-- when a cron run dies halfway through:
--
--   public.message_queue  one row per (lead, step). The cron only ever claims
--                         rows that are due, so a re-run can never double-send.
--   public.agent_settings one global row: the human "pause everything" switch
--                         and the daily send cap.
--   public.leads          sequence_segment / sequence_enrolled_at (what plan a
--                         lead is on) and marketing_paused (per-lead stop).
--
-- Design notes that matter later:
--
--   * NO CHECK constraint on status or kind. The domains table taught us this
--     lesson: a CHECK turns "we added a status" into "every write fails until
--     someone runs a migration". The allowed values are documented in COMMENTs
--     and enforced by the drainer, exactly like leads.status.
--   * lead_id is UUID because public.leads.id is UUID
--     (20260905_admin_dashboard.sql). ON DELETE CASCADE: deleting a lead drops
--     its pending mail with it, which is what "delete this person" should mean.
--   * The address is SNAPSHOT into the row (email column). A queue row must be
--     deliverable on its own even if the lead's contact is edited later, and the
--     drainer re-checks suppression against this exact address.
--   * RLS: service-role only, same policy pattern as every other table here.
--
-- Safe to re-run: CREATE TABLE/INDEX IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
-- INSERT ... ON CONFLICT DO NOTHING, and the policy block only drops and
-- recreates the policy when it already exists.
-- ============================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. MESSAGE QUEUE
-- status:  pending | sending | sent | skipped | cancelled | failed
--   pending   - due at run_at, waiting for the drainer
--   sending   - claimed by a run (a row stuck here is reclaimed after 15 min)
--   sent      - delivered by Resend
--   skipped   - eligible when queued, but not sent (no consent, no website
--               offer left to make, review link not configured, ...)
--   cancelled - stopped by a stop event: unsubscribe, bounce/complaint,
--               manual pause, lead lost/converted, admin cancel
--   failed    - tried max attempts (send kept failing)
-- kind:    sales | review
--   sales  - marketing mail: needs an active marketing consent + no suppression
--   review - service follow-up to someone who asked for an audit: needs no
--            consent, but still respects bounces/complaints
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  -- Lowercase address as it was at enrollment time (see lib/unsubscribe.ts).
  email TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  -- hot_d1 | hot_d3 | hot_d7 | warm_d2 | warm_d6 | review_d5 (lib/automation/sequences.ts)
  step_key TEXT NOT NULL,
  -- The segment the plan was built for: hot | warm | cold
  segment TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'sales',
  status TEXT NOT NULL DEFAULT 'pending',
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.message_queue IS
  'Outbound automation queue (one row per lead + step). Drained by /api/cron/automation; re-running is idempotent because rows are claimed, not re-read.';
COMMENT ON COLUMN public.message_queue.status IS
  'pending | sending | sent | skipped | cancelled | failed. Enforced by the drainer, deliberately NOT a CHECK constraint.';
COMMENT ON COLUMN public.message_queue.kind IS
  'Label only, not a consent gate: sales = pitch step | review = the day-5 review ask. Every row is marketing mail, so an active marketing opt-in is required for both (lib/automation/drain.ts).';
COMMENT ON COLUMN public.message_queue.email IS
  'Snapshot of the recipient address at enrollment (lowercase). Suppression is re-checked against this value on every send.';
COMMENT ON COLUMN public.message_queue.last_error IS
  'Last guard/send problem, redacted (lib/email.ts#redact). Cleared on a successful send.';

-- One row per step, ever: re-enrolling is a no-op instead of a second send.
CREATE UNIQUE INDEX IF NOT EXISTS message_queue_lead_step_uniq
  ON public.message_queue(lead_id, step_key);

-- The drainer's only query: due rows, oldest first.
CREATE INDEX IF NOT EXISTS message_queue_due_idx
  ON public.message_queue(status, run_at);

-- Cancelling "everything for this address" (unsubscribe / bounce / complaint)
-- must stay cheap even with a long history.
CREATE INDEX IF NOT EXISTS message_queue_email_idx
  ON public.message_queue(email, status);

CREATE INDEX IF NOT EXISTS message_queue_lead_idx
  ON public.message_queue(lead_id, created_at DESC);

ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'message_queue' AND policyname = 'message_queue service access'
  ) THEN
    DROP POLICY "message_queue service access" ON public.message_queue;
  END IF;
END $$;
CREATE POLICY "message_queue service access" ON public.message_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_message_queue_modtime ON public.message_queue;
CREATE TRIGGER update_message_queue_modtime BEFORE UPDATE ON public.message_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. AGENT SETTINGS (singleton)
-- The Admin -> Automation tab edits the row with id = 'default'.
--   automation_paused - stop EVERY queued send without redeploying anything
--   daily_send_cap    - hard ceiling on deliveries per UTC day; the drainer
--                       stops once it is reached, so a backlog can never turn
--                       into a reputation-damaging blast
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CREATE TABLE IF NOT EXISTS public.agent_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  -- TRUE by default: applying this migration must never start sending mail on
  -- its own. The admin tab flips it once the copy, the review link and the
  -- sending domain have been checked.
  automation_paused BOOLEAN NOT NULL DEFAULT true,
  daily_send_cap INTEGER NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

COMMENT ON TABLE public.agent_settings IS
  'Global automation switches (single row, id = default). Read by /api/cron/automation before any send.';
COMMENT ON COLUMN public.agent_settings.daily_send_cap IS
  'Maximum automated emails per UTC day (default 50). The drainer stops when today''s sent count reaches it.';

-- Seed the singleton row, explicitly paused: the cron reads this row before any
-- send, so an applied-but-unreviewed migration can only ever do nothing.
INSERT INTO public.agent_settings (id, automation_paused, daily_send_cap)
VALUES ('default', true, 50)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_settings' AND policyname = 'agent_settings service access'
  ) THEN
    DROP POLICY "agent_settings service access" ON public.agent_settings;
  END IF;
END $$;
CREATE POLICY "agent_settings service access" ON public.agent_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. LEADS - automation state
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- hot | warm | cold, decided once at enrollment by lib/lead-priority.ts so the
-- plan the lead was promised stays readable even if the score changes later.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sequence_segment TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sequence_enrolled_at TIMESTAMPTZ;
-- Per-lead stop: the admin can silence ONE person without touching the global
-- switch (reply "stop", a phone call asking us to stop, ...).
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS marketing_paused BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.leads.sequence_segment IS
  'hot | warm | cold - the automation plan this lead was enrolled in (lib/automation/sequences.ts).';
COMMENT ON COLUMN public.leads.sequence_enrolled_at IS
  'When the sequence rows were queued. NULL = never enrolled.';
COMMENT ON COLUMN public.leads.marketing_paused IS
  'TRUE = this lead receives no automated marketing mail (pending rows are cancelled by the drainer).';
