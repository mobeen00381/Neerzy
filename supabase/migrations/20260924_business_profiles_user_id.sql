-- Owner key for accounts that are NOT identified by a WhatsApp number.
--
-- Email/Google signup is now the primary entry point, and a user may connect
-- WhatsApp later — or never. Until now business_profiles was keyed by
-- user_phone (NOT NULL + UNIQUE), so an email user could not have a business
-- profile at all: onboarding ended at "No phone number linked yet".
--
-- user_id becomes the first-class owner. user_phone stays for the WhatsApp
-- pipeline (jobs, review requests, posts) and is filled in when the user
-- connects WhatsApp later.

ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS user_id UUID;

-- New rows may exist without any phone yet.
ALTER TABLE public.business_profiles ALTER COLUMN user_phone DROP NOT NULL;

-- Plain (non-partial) unique index on purpose: Postgres treats NULLs as
-- distinct, so many legacy phone-only rows can have a NULL user_id while a
-- given user_id still appears at most once — and `ON CONFLICT (user_id)` can
-- be inferred by PostgREST upserts (a partial index could not be).
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_profiles_user_id
  ON public.business_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_business_profiles_user_phone_lookup
  ON public.business_profiles(user_phone);

-- Backfill: rows created while signed in (auth metadata carries the account id
-- for WhatsApp-connected users) can be linked by phone via profiles.
UPDATE public.business_profiles bp
SET user_id = p.id
FROM public.profiles p
WHERE bp.user_id IS NULL
  AND bp.user_phone IS NOT NULL
  AND p.phone IS NOT NULL
  AND regexp_replace(bp.user_phone, '[^0-9]', '', 'g') = regexp_replace(p.phone, '[^0-9]', '', 'g');
