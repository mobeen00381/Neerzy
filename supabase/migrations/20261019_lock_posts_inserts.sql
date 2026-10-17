-- ============================================================
-- Close the last quota bypass: no browser may INSERT into posts
-- ============================================================
-- Why this exists
--   20261018_create_post_with_quota.sql moved the quota check and the post
--   write into one serialized transaction, and src/lib/post-gate.ts is the
--   only caller. That fix is worthless while "Users can create their own
--   posts" still exists: an authenticated browser can skip the RPC and INSERT
--   into public.posts directly, which is the exact bypass the gate was built
--   to remove. Dropping the INSERT policy makes the service-role RPC the only
--   writer of new post rows.
--
-- What is deliberately NOT touched
--   "Users can view their own posts"   — dashboard history + /api/post-data
--   "Users can update their own posts" — /api/generate-post saves ai_reply,
--                                        /api/posts/create saves title, both
--                                        on the row the gate just created
--   "Users can delete their own posts" — /api/generate-post deletes the row
--                                        again when generation fails, so a
--                                        failed AI call does not burn a credit
--   "Service role full access"         — the gate's own INSERT
--
-- Ordering requirement
--   Apply 20261018_create_post_with_quota.sql FIRST. Without the function
--   every post path fails closed with 503 (src/lib/post-gate.ts never returns
--   "allowed" when the gate cannot be reached), which is safe but blocks
--   posting.
-- ============================================================

DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;

-- Verification — expect 0 rows: anon/authenticated can no longer INSERT.
SELECT policyname, cmd
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename  = 'posts'
   AND cmd        = 'INSERT';

-- Rollback (only if a browser-side INSERT must be restored for an emergency):
-- CREATE POLICY "Users can create their own posts" ON public.posts
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
