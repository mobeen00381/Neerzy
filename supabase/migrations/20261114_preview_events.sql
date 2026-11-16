-- ============================================================================
-- 20261114_preview_events.sql
-- /website-builder preview funnel: the four measurable steps of the hero widget.
--
--   preview_searched      the widget's search returned at least one listing
--   preview_selected      the visitor picked a listing from the dropdown
--   preview_build_click   "Build This Website" was clicked
--   preview_try_another   "Try another business" was clicked
--
-- Written by POST /api/preview/event (public, 60 events/hour/IP, fails open)
-- and read by GET /api/admin/preview-events (admin JWT, last 30 days).
--
-- PRIVACY: this table deliberately holds NO personal data. No email, no phone,
-- no IP, no user agent. place_id is the PUBLIC Google listing id, trade is one
-- of our own template ids, and session_id is a random id the widget keeps in
-- sessionStorage — it links one tab's steps and nothing else.
--
-- NO CHECK constraint on event: same lesson as leads.status and
-- message_queue.status - a CHECK turns "we added a step" into "every write
-- fails until someone runs a migration". The allowlist is enforced by the
-- route (src/lib/preview-events.ts) and documented here.
--
-- Safe to re-run: CREATE TABLE/INDEX IF NOT EXISTS, COMMENT replaces itself,
-- and the policy block only drops and recreates its own policy.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.preview_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- preview_searched | preview_selected | preview_build_click | preview_try_another
  event TEXT NOT NULL,
  -- Google Places id of the listing (public, no business contact data).
  place_id TEXT,
  -- Template id the preview matched: plumber | dentist | ... | generic.
  trade TEXT,
  -- Surface that produced the event; the widget sends 'website_builder'.
  source TEXT,
  -- Random per-tab id from sessionStorage. NOT linked to an account or person.
  session_id TEXT
);

COMMENT ON TABLE public.preview_events IS
  'Anonymous /website-builder preview funnel beacons. No emails, IPs or other personal data by design.';

COMMENT ON COLUMN public.preview_events.event IS
  'Allowlisted by POST /api/preview/event: preview_searched | preview_selected | preview_build_click | preview_try_another.';

COMMENT ON COLUMN public.preview_events.session_id IS
  'Random id kept in sessionStorage by the widget; joins one tab''s steps only, never a person.';

-- The admin card counts one event over the last 30 days; the pair index keeps
-- that head-count cheap as the table grows.
CREATE INDEX IF NOT EXISTS preview_events_event_created_at_idx
  ON public.preview_events(event, created_at DESC);
CREATE INDEX IF NOT EXISTS preview_events_created_at_idx
  ON public.preview_events(created_at DESC);

ALTER TABLE public.preview_events ENABLE ROW LEVEL SECURITY;

-- Same service-role-only posture as every other table here: no anon or
-- authenticated policy exists, so only the service key can read or write.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'preview_events' AND policyname = 'preview_events service access'
  ) THEN
    DROP POLICY "preview_events service access" ON public.preview_events;
  END IF;
END $$;
CREATE POLICY "preview_events service access" ON public.preview_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
