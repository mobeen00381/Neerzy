-- Rate limiting table for serverless-safe API rate limiting
-- Uses a simple counter-per-IP with TTL cleanup

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL DEFAULT 'posts/create',
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by IP + endpoint within current window
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
  ON public.rate_limits(ip_address, endpoint, window_start DESC);

-- Cleanup old entries (older than 1 hour)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
  ON public.rate_limits(created_at);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role access
CREATE POLICY "Service role full access" ON public.rate_limits 
  FOR ALL TO service_role USING (true) WITH CHECK (true);
