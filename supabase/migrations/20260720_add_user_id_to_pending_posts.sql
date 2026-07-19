-- Add user_id column to pending_posts for quota tracking
-- This allows the dashboard to count WhatsApp-published posts toward plan limits

ALTER TABLE public.pending_posts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_pending_posts_user_id ON public.pending_posts(user_id);

-- Backfill: link existing pending_posts to users by matching phone numbers
-- This is a best-effort backfill — posts whose phone doesn't match any user will remain unlinked
UPDATE public.pending_posts pp
SET user_id = u.id
FROM auth.users u
WHERE pp.user_id IS NULL
  AND u.phone = pp.user_phone;

-- Also try matching via user_metadata (some users have phone stored there)
UPDATE public.pending_posts pp
SET user_id = u.id
FROM auth.users u
WHERE pp.user_id IS NULL
  AND u.raw_user_meta_data->>'phone' = pp.user_phone;

-- Log how many were linked
DO $$
DECLARE
  linked_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO linked_count FROM public.pending_posts WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO total_count FROM public.pending_posts;
  RAISE NOTICE 'pending_posts backfill: % / % linked to users', linked_count, total_count;
END $$;
