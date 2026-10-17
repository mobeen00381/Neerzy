-- ============================================================
-- Tighten posts policies: role membership instead of JWT claims
-- ============================================================
-- Why this exists
--   The live project had two policies granted TO public that gated access on
--   auth.role() = 'service_role' (a claim inside the JWT):
--
--     "Service role full access on posts"  ALL     USING (auth.role() = 'service_role'::text)
--     "Service role can insert posts"      INSERT  WITH CHECK (auth.role() = 'service_role'::text)
--
--   That works for normal traffic, but it fails open if the JWT secret ever
--   leaks: anyone could self-sign a token with role = 'service_role' and get
--   full write access to posts. Restricting the policies to the service_role
--   role removes that whole class of failure, because a browser cannot become
--   a member of that role.
--
--   Behaviour for the gate is unchanged: create_post_with_quota() is
--   SECURITY DEFINER and service_role bypasses RLS entirely, so neither policy
--   was ever load-bearing for posting. This only removes a latent bypass.
--
--   Applied manually to the live project on 2026-10-18. Afterwards
--   browser_insert_policies on posts returned 0.
--
--   The guards matter: on a database built from these migrations the two
--   policies do not exist (they were created in the dashboard), and an
--   unguarded ALTER POLICY would abort the migration. EXECUTE is used because
--   ALTER POLICY takes no parameters and cannot depend on the IF branch.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'posts'
       AND policyname = 'Service role full access on posts'
  ) THEN
    EXECUTE 'ALTER POLICY "Service role full access on posts" ON public.posts TO service_role';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'posts'
       AND policyname = 'Service role can insert posts'
  ) THEN
    EXECUTE 'ALTER POLICY "Service role can insert posts" ON public.posts TO service_role';
  END IF;
END
$$;

-- Verification — expect 0 rows: no INSERT/ALL policy on posts is reachable
-- from a browser role any more.
SELECT count(*) AS browser_insert_policies
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename  = 'posts'
   AND cmd IN ('INSERT', 'ALL')
   AND roles && ARRAY['public'::name, 'anon'::name, 'authenticated'::name];
