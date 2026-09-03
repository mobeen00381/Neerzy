-- Simplified Agency Plan: 10 traders per agency, 300 posts + 300 review
-- requests pooled per month (30 each per trader), 3 posts/day per trader,
-- and every trader gets the full Google + Facebook + Instagram flow.

-- 1) agency_clients: links an agency account to its traders' WhatsApp phones.
CREATE TABLE IF NOT EXISTS public.agency_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  status TEXT DEFAULT 'invited',        -- 'invited' | 'connected' | 'paused'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agency_user_id, client_phone)
);

CREATE INDEX IF NOT EXISTS idx_agency_clients_agency ON public.agency_clients(agency_user_id);
CREATE INDEX IF NOT EXISTS idx_agency_clients_phone ON public.agency_clients(client_phone);

ALTER TABLE public.agency_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency clients service access" ON public.agency_clients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Agency reads own clients" ON public.agency_clients
  FOR SELECT TO authenticated USING (agency_user_id = auth.uid());

CREATE POLICY "Agency manages own clients" ON public.agency_clients
  FOR ALL TO authenticated USING (agency_user_id = auth.uid()) WITH CHECK (agency_user_id = auth.uid());

-- 2) review_requests: remember which agency trader a request was sent for, so
-- per-trader (30/month, 3/day) and agency-pool (300/month) quotas can be counted.
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS agency_client_phone TEXT;
CREATE INDEX IF NOT EXISTS idx_review_requests_agency_client_phone ON public.review_requests(agency_client_phone);
