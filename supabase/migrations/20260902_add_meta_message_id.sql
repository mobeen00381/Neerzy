-- Idempotent migration: track Meta WhatsApp message IDs so delivery status
-- callbacks (value.statuses[]) can be correlated to review_requests rows.
-- Root cause: the webhook previously ignored Meta statuses, so undelivered
-- requests were silently dropped while traders were told delivery succeeded.

-- Meta's message ID (wamid.*) returned by the send API
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS meta_message_id TEXT;

-- Human-readable error detail when Meta reports a delivery failure
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Allow status values written by the delivery-status webhook
ALTER TABLE public.review_requests
  DROP CONSTRAINT IF EXISTS review_requests_status_check;

ALTER TABLE public.review_requests
  ADD CONSTRAINT review_requests_status_check
  CHECK (status IN ('sent', 'opened', 'review_received', 'manual_fallback', 'delivered', 'failed'));

-- Fast lookup when a status callback arrives
CREATE INDEX IF NOT EXISTS idx_review_requests_meta_message_id
  ON public.review_requests(meta_message_id);

-- Refresh PostgREST schema cache so the columns are visible immediately
NOTIFY pgrst, 'reload schema';
