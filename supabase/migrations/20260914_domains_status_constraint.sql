-- ============================================================
-- Fix the stale `domains.status` CHECK constraint
-- ============================================================
--
-- WHY: the application uses a status lifecycle that the LIVE databases'
-- legacy constraint rejects. Older databases were created before
-- 20260910_domains.sql with a legacy `domains` table whose
-- `domains_status_check` only allowed ('pending','active'); because
-- `CREATE TABLE IF NOT EXISTS` skipped the newer definition, the constraint
-- was never widened.
--
-- Observable symptom (reproduced 2026-09-13 against production data):
--   ⚠️ Could not pre-provision domain row:
--      new row for relation "domains" violates check constraint
--      "domains_status_check"
--
-- Who needs which value:
--   /api/domains/purchase        → inserts 'provisioning' ("payment processing…")
--   /api/webhook/paddle          → upserts 'active' on success, 'failed' on failure
--   /api/cron/domain-renewals    → reads rows where status = 'active'
--   /api/domains/purchase (quota)→ counts ['active','provisioning']
--   DomainPanel.tsx              → renders 'active' | 'provisioning' | 'failed'
--
-- Safe to re-run: the constraint is dropped before being re-created.
-- No data is modified.

ALTER TABLE public.domains DROP CONSTRAINT IF EXISTS domains_status_check;

ALTER TABLE public.domains ADD CONSTRAINT domains_status_check
  CHECK (status IN (
    'pending',        -- legacy value, kept for existing rows
    'provisioning',   -- checkout started, Paddle payment pending
    'active',         -- registered + serving
    'failed',         -- registration failed (surfaced in the dashboard)
    'expired',        -- renewal lapsed
    'paused',         -- hosting paused / manual hold
    'cancelled',      -- cancelled by the trader
    'canceled'        -- spelling used by Paddle subscription events
  ));

COMMENT ON COLUMN public.domains.status IS
  'pending | provisioning | active | failed | expired | paused | cancelled';
