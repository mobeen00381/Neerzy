-- Idempotent migration: allow review requests to be tracked as needing a manual
-- fallback send (device link) when automated WhatsApp delivery fails.

ALTER TABLE public.review_requests
  DROP CONSTRAINT IF EXISTS review_requests_status_check;

ALTER TABLE public.review_requests
  ADD CONSTRAINT review_requests_status_check
  CHECK (status IN ('sent', 'opened', 'review_received', 'manual_fallback'));
