-- Add 1-hour block support to the rate_limits table.
--
-- When a caller exceeds the per-minute limit (or repeatedly sends off-topic
-- messages), blocked_until is set to now + 1 hour. Every subsequent request is
-- checked against this column first and rejected with HTTP 429 until it
-- expires. This is used by the /api/chat Neerzy AI agent route.

ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMPTZ;

-- Fast lookup of active (non-null) blocks per ip + endpoint
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until
  ON public.rate_limits(ip_address, endpoint)
  WHERE blocked_until IS NOT NULL;
