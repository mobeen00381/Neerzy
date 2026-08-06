-- Idempotent migration: ensure review_requests has all columns the codebase expects.
-- Production table was created without business_id (or with a stale schema cache),
-- causing PGRST204 errors on every INSERT. This migration ALTERs the table safely.

-- Core fix: the column causing PGRST204
ALTER TABLE public.review_requests
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.business_profiles(id);

-- Safety net: ensure any other columns code relies on exist
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS sent_via TEXT DEFAULT 'whatsapp';
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.review_requests ADD COLUMN IF NOT EXISTS review_link TEXT;

-- Refresh PostgREST schema cache so the columns are visible immediately
NOTIFY pgrst, 'reload schema';