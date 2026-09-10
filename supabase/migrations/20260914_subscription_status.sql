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
