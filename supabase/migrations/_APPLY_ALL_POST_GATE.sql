-- NEERZY - APPLY THE UNIFIED POST GATE
-- Paste this whole file into the Supabase SQL Editor and run it ONCE, top to bottom.
-- Order matters: the quota function must exist before the INSERT policy is dropped,
-- otherwise every post path fails closed with 503 until it does.
-- Generated from 20261018_create_post_with_quota.sql + 20261019_lock_posts_inserts.sql
-- + 20261020_tighten_posts_policies.sql.
-- Copy of record only - edit those migrations, not this file.

-- ------------------------ 20261018_create_post_with_quota.sql ------------------------

-- ============================================================
-- Unified, race-safe post quota gate
-- ============================================================
-- Why this exists
--   Quota was checked in JavaScript (count → decide → write) in three
--   different places (dashboard, WhatsApp, quick-post). Two parallel
--   requests could both read "1 post used" and both write a post, so a
--   free plan with a 1/day limit could post twice. The dashboard also
--   inserted the `posts` row from the browser, so a client could simply
--   skip the check.
--
-- What this does
--   `create_post_with_quota()` performs the connection check, the plan
--   limit check and the post write in ONE transaction, serialized per
--   user with a transaction-scoped advisory lock. Nothing else may
--   insert into `posts` afterwards (that INSERT policy is dropped in a
--   later migration), so every post goes through this function.
--
-- Counting semantics — MUST stay identical to src/lib/post-usage.ts:
--   * `posts`         → every row for the user (web dashboard / quick-post)
--   * `pending_posts` → WhatsApp rows for the user's phone variants with
--                       status in ('generated','published') AND
--                       google_post IS NOT NULL (review-request-only rows
--                       never count; drafts being generated never count)
--   * total → rows created since the start of the user's 30-day cycle
--   * daily → rows created since 00:00 **UTC** (day boundary is UTC in
--             SQL and in JS — never the server's local midnight)
--
-- Plan limits are hardcoded below on purpose: this function must be able
-- to run without the Node app, and SQL cannot import TypeScript. KEEP IN
-- SYNC WITH src/lib/plans.ts (PLAN_LIMITS):
--   free       5 posts/cycle, 1/day, 30-day trial
--   pro       25 posts/cycle, 2/day
--   growth    60 posts/cycle, 4/day
--   agency   300 posts/cycle, 30/day
--   unlimited  -1 / -1  (internal tier: every limit bypassed)
-- An unknown/blank plan is treated as `free` (same as getPlan()).
--
-- In-flight WhatsApp posts
--   WhatsApp posts are reserved with `post_gate_reservations` (one row per
--   user, UNIQUE user_id): the reservation is taken BEFORE the AI call and
--   released by the caller when generation finishes or fails. A second
--   parallel POST therefore gets `reason = 'in_progress'` instead of
--   generating a second post. Reservations older than 15 minutes are
--   treated as crashed and cleared, so a dead request can never lock the
--   account out of posting forever.
--
-- Fail-closed contract
--   Any error (missing function, missing table, DB outage) makes the
--   caller (src/lib/post-gate.ts) return 503 and REFUSE the post. This
--   function never returns `allowed = true` when it cannot prove the
--   user is connected and under quota.
-- ============================================================

-- 1. In-flight generation reservations (internal table, service role only)
CREATE TABLE IF NOT EXISTS public.post_gate_reservations (
  user_id    UUID PRIMARY KEY,
  phone      TEXT,
  source     TEXT NOT NULL DEFAULT 'whatsapp',
  draft_id   UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.post_gate_reservations ENABLE ROW LEVEL SECURITY;

-- No policies on purpose: browsers/anon keys can never read or write this.
REVOKE ALL ON TABLE public.post_gate_reservations FROM anon, authenticated;
GRANT ALL ON TABLE public.post_gate_reservations TO service_role;

-- 2. The gate itself
CREATE OR REPLACE FUNCTION public.create_post_with_quota(
  p_user_id  UUID,
  p_phone    TEXT    DEFAULT NULL,
  p_source   TEXT    DEFAULT 'dashboard',   -- 'dashboard' | 'quick_post' | 'whatsapp'
  p_payload  JSONB   DEFAULT '{}'::jsonb,   -- post columns for dashboard/quick_post
  p_draft_id UUID    DEFAULT NULL           -- pending_posts draft for whatsapp
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_source       TEXT := lower(COALESCE(p_source, 'dashboard'));
  v_profile      JSONB;
  v_phones       TEXT[];
  v_phone        TEXT;
  v_anchor       TIMESTAMPTZ;
  v_trial_end    TIMESTAMPTZ;
  v_plan         TEXT;
  v_trial_days   INTEGER := 0;
  v_total_limit  INTEGER := 5;
  v_daily_limit  INTEGER := 1;
  v_days_left    INTEGER := 0;
  v_cycle_start  TIMESTAMPTZ;
  v_today_start  TIMESTAMPTZ;
  v_resets_at    TIMESTAMPTZ;
  v_used_total   INTEGER := 0;
  v_used_today   INTEGER := 0;
  v_channel      INTEGER := 0;
  v_connected    BOOLEAN := false;
  v_has_title    BOOLEAN := false;
  v_claimed      INTEGER := 0;
  v_draft_status TEXT;
  v_post_id      UUID;
  v_meta         JSONB;
BEGIN
  -- Never allow a post we cannot attribute to an account.
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'no_account',
      'message', 'We could not match this request to an account.'
    );
  END IF;

  -- Serialize every quota decision for this user for the rest of the
  -- transaction. Without this, count-then-write is a race.
  PERFORM pg_advisory_xact_lock(hashtextextended('post_gate:' || p_user_id::text, 0));

  -- Read the profile as JSON so a not-yet-applied column migration can
  -- never make the gate throw (which would block every post). Missing
  -- keys simply read as NULL and fall back to the safe defaults below.
  SELECT to_jsonb(p) INTO v_profile
    FROM public.profiles p
   WHERE p.id = p_user_id;

  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'no_account',
      'message', 'We could not match this request to an account.'
    );
  END IF;

  -- ---- Plan → limits (mirror of src/lib/plans.ts) -----------------------
  v_plan := lower(COALESCE(NULLIF(v_profile->>'selected_plan', ''), 'free'));

  CASE v_plan
    WHEN 'pro' THEN
      v_trial_days  := 0;
      v_total_limit := 25;
      v_daily_limit := 2;
    WHEN 'growth' THEN
      v_trial_days  := 0;
      v_total_limit := 60;
      v_daily_limit := 4;
    WHEN 'agency' THEN
      v_trial_days  := 0;
      v_total_limit := 300;
      v_daily_limit := 30;
    WHEN 'unlimited' THEN
      v_trial_days  := 0;
      v_total_limit := -1;
      v_daily_limit := -1;
    ELSE
      v_plan        := 'free';
      v_trial_days  := 30;
      v_total_limit := 5;
      v_daily_limit := 1;
  END CASE;

  -- ---- Cycle anchor (same fallbacks as the app) -------------------------
  v_anchor := COALESCE(
    NULLIF(v_profile->>'plan_started_at', '')::timestamptz,
    NULLIF(v_profile->>'trial_started_at', '')::timestamptz,
    NULLIF(v_profile->>'created_at', '')::timestamptz
  );

  IF v_anchor IS NULL OR v_anchor > NOW() THEN
    v_cycle_start := NOW();
  ELSE
    -- floor((now - anchor) / 30 days) * 30 days — identical to getCycleStartIso()
    v_cycle_start := v_anchor
      + (floor(EXTRACT(EPOCH FROM (NOW() - v_anchor)) / 2592000.0) * INTERVAL '30 days');
  END IF;

  -- UTC day boundary (never the server's local midnight).
  v_today_start := date_trunc('day', NOW() AT TIME ZONE 'utc') AT TIME ZONE 'utc';
  v_resets_at   := v_today_start + INTERVAL '1 day';

  -- ---- Phone variants (mirror of phoneVariants() in business-profile.ts) -
  v_phone := NULLIF(btrim(COALESCE(p_phone, v_profile->>'phone', '')), '');
  IF v_phone IS NOT NULL THEN
    v_phones := ARRAY[v_phone];
    IF regexp_replace(v_phone, '\D', '', 'g') <> '' THEN
      v_phones := v_phones
        || regexp_replace(v_phone, '\D', '', 'g')
        || ('+' || regexp_replace(v_phone, '\D', '', 'g'));
      SELECT array_agg(DISTINCT x) INTO v_phones FROM unnest(v_phones) AS x;
    END IF;
  END IF;

  -- ---- Connected = a Google place id exists for this account ------------
  SELECT EXISTS (
    SELECT 1
      FROM public.business_profiles bp
     WHERE (
             bp.user_id = p_user_id
             OR (v_phones IS NOT NULL AND bp.user_phone = ANY(v_phones))
           )
       AND NULLIF(btrim(COALESCE(bp.google_place_id, '')), '') IS NOT NULL
  ) INTO v_connected;

  -- ---- Usage (both tables, same filters as src/lib/post-usage.ts) ------
  SELECT count(*)::int INTO v_used_total
    FROM public.posts p
   WHERE p.user_id = p_user_id
     AND p.created_at >= v_cycle_start;

  SELECT count(*)::int INTO v_used_today
    FROM public.posts p
   WHERE p.user_id = p_user_id
     AND p.created_at >= v_today_start;

  IF v_phones IS NOT NULL THEN
    SELECT count(*)::int INTO v_channel
      FROM public.pending_posts pp
     WHERE pp.user_phone = ANY(v_phones)
       AND pp.status IN ('generated', 'published')
       AND pp.google_post IS NOT NULL
       AND pp.created_at >= v_cycle_start;
    v_used_total := v_used_total + v_channel;

    SELECT count(*)::int INTO v_channel
      FROM public.pending_posts pp
     WHERE pp.user_phone = ANY(v_phones)
       AND pp.status IN ('generated', 'published')
       AND pp.google_post IS NOT NULL
       AND pp.created_at >= v_today_start;
    v_used_today := v_used_today + v_channel;
  END IF;

  -- ---- Trial window (free plan only, same math as getRemainingDays()) --
  IF v_trial_days > 0 AND v_anchor IS NOT NULL THEN
    v_trial_end := v_anchor + (v_trial_days || ' days')::interval;
    v_days_left := GREATEST(
      0,
      ceil(EXTRACT(EPOCH FROM (v_trial_end - NOW())) / 86400.0)
    )::int;
  END IF;

  v_meta := jsonb_build_object(
    'plan',       v_plan,
    'usedTotal',  v_used_total,
    'usedToday',  v_used_today,
    'limitTotal', v_total_limit,
    'limitDaily', v_daily_limit,
    'daysLeft',   v_days_left,
    'resetsAt',   v_resets_at,
    'connected',  v_connected
  );

  -- ---- Gate 1: connected ------------------------------------------------
  IF NOT v_connected THEN
    RETURN v_meta || jsonb_build_object(
      'allowed', false,
      'reason',  'not_connected',
      'message', 'Choose your Google business first.'
    );
  END IF;

  -- ---- Gate 2: trial expired -------------------------------------------
  IF v_trial_days > 0 AND v_trial_end IS NOT NULL AND NOW() >= v_trial_end THEN
    RETURN v_meta || jsonb_build_object(
      'allowed', false,
      'reason',  'trial_expired',
      'message', 'Your 30-day free trial has ended. Upgrade to continue posting.'
    );
  END IF;

  -- ---- Gate 3: monthly (30-day cycle) limit ----------------------------
  IF v_total_limit <> -1 AND v_used_total >= v_total_limit THEN
    RETURN v_meta || jsonb_build_object(
      'allowed', false,
      'reason',  'monthly_limit',
      'message', 'You have used all ' || v_total_limit || ' posts included in your plan this month.'
    );
  END IF;

  -- ---- Gate 4: daily limit (UTC day) -----------------------------------
  IF v_daily_limit <> -1 AND v_used_today >= v_daily_limit THEN
    RETURN v_meta || jsonb_build_object(
      'allowed', false,
      'reason',  'daily_limit',
      'message', 'Daily limit reached.'
    );
  END IF;

  -- ---- Write the post (the quota "consumption" happens here) -----------
  IF v_source = 'whatsapp' THEN
    -- One in-flight generation per account: a parallel POST can never
    -- reserve a second slot while the first is still generating.
    DELETE FROM public.post_gate_reservations r
     WHERE r.user_id = p_user_id
       AND r.created_at < NOW() - INTERVAL '15 minutes';

    INSERT INTO public.post_gate_reservations (user_id, phone, source, draft_id)
    VALUES (p_user_id, v_phone, v_source, p_draft_id)
    ON CONFLICT (user_id) DO NOTHING;
    GET DIAGNOSTICS v_claimed = ROW_COUNT;

    IF v_claimed = 0 THEN
      RETURN v_meta || jsonb_build_object(
        'allowed', false,
        'reason',  'in_progress',
        'message', 'A post is already being generated for this account.'
      );
    END IF;

    -- The draft must still exist and still be an ungenerated draft, so a
    -- retry can never regenerate an already-completed post.
    IF p_draft_id IS NOT NULL THEN
      SELECT pp.status INTO v_draft_status
        FROM public.pending_posts pp
       WHERE pp.id = p_draft_id
         AND (v_phones IS NULL OR pp.user_phone = ANY(v_phones))
       FOR UPDATE;

      IF v_draft_status IS NULL THEN
        DELETE FROM public.post_gate_reservations WHERE user_id = p_user_id;
        RETURN v_meta || jsonb_build_object(
          'allowed', false,
          'reason',  'no_draft',
          'message', 'We could not find a draft to generate. Send the job details again.'
        );
      ELSIF v_draft_status <> 'draft' THEN
        DELETE FROM public.post_gate_reservations WHERE user_id = p_user_id;
        RETURN v_meta || jsonb_build_object(
          'allowed', false,
          'reason',  'in_progress',
          'message', 'This post has already been generated.'
        );
      END IF;
    END IF;

  ELSIF v_source IN ('dashboard', 'quick_post') THEN
    -- `posts.title` is not part of the tracked migrations (some projects
    -- have it, some don't), so it is written only when it really exists.
    SELECT EXISTS (
      SELECT 1
        FROM information_schema.columns c
       WHERE c.table_schema = 'public'
         AND c.table_name   = 'posts'
         AND c.column_name  = 'title'
    ) INTO v_has_title;

    IF v_has_title THEN
      INSERT INTO public.posts
        (user_id, title, content, image_url, status, ai_reply, social_facebook, social_instagram)
      VALUES (
        p_user_id,
        NULLIF(p_payload->>'title', ''),
        COALESCE(p_payload->>'content', ''),
        NULLIF(p_payload->>'image_url', ''),
        COALESCE(NULLIF(p_payload->>'status', ''), 'published'),
        NULLIF(p_payload->>'ai_reply', ''),
        NULLIF(p_payload->>'social_facebook', ''),
        NULLIF(p_payload->>'social_instagram', '')
      )
      RETURNING id INTO v_post_id;
    ELSE
      INSERT INTO public.posts
        (user_id, content, image_url, status, ai_reply, social_facebook, social_instagram)
      VALUES (
        p_user_id,
        COALESCE(p_payload->>'content', ''),
        NULLIF(p_payload->>'image_url', ''),
        COALESCE(NULLIF(p_payload->>'status', ''), 'published'),
        NULLIF(p_payload->>'ai_reply', ''),
        NULLIF(p_payload->>'social_facebook', ''),
        NULLIF(p_payload->>'social_instagram', '')
      )
      RETURNING id INTO v_post_id;
    END IF;

  ELSE
    RETURN v_meta || jsonb_build_object(
      'allowed', false,
      'reason',  'bad_source',
      'message', 'Unknown post source.'
    );
  END IF;

  RETURN v_meta || jsonb_build_object(
    'allowed', true,
    'reason',  'ok',
    'postId',  v_post_id
  );
END;
$$;

-- 3. Release an in-flight reservation (call when generation finishes/fails)
CREATE OR REPLACE FUNCTION public.release_post_gate(
  p_user_id  UUID,
  p_draft_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  DELETE FROM public.post_gate_reservations
   WHERE user_id = p_user_id
     AND (p_draft_id IS NULL OR draft_id IS NULL OR draft_id = p_draft_id);

  RETURN true;
END;
$$;

-- 4. Lock the functions down to the service role
REVOKE ALL ON FUNCTION public.create_post_with_quota(UUID, TEXT, TEXT, JSONB, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_post_with_quota(UUID, TEXT, TEXT, JSONB, UUID)
  TO service_role;

REVOKE ALL ON FUNCTION public.release_post_gate(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_post_gate(UUID, UUID)
  TO service_role;

-- ------------------------ 20261019_lock_posts_inserts.sql ------------------------

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

-- ------------------------ 20261020_tighten_posts_policies.sql ------------------------

-- ============================================================
-- Tighten posts policies: role membership instead of JWT claims
-- ============================================================
-- Why this exists
--   Dashboard-created policies on posts gated access on
--   auth.role() = 'service_role' (a claim inside the JWT) while being granted
--   TO public. That works for normal traffic, but it fails open if the JWT
--   secret ever leaks: anyone could self-sign role = 'service_role' and get
--   full write access. Restricting them to the service_role role removes that
--   class of failure, because a browser cannot become a member of that role.
--
--   Behaviour for the gate is unchanged: create_post_with_quota() is
--   SECURITY DEFINER and service_role bypasses RLS entirely, so neither policy
--   was ever load-bearing for posting.
--
--   The guards matter: on a database built from these migrations the two
--   policies do not exist (they were created in the dashboard), and an
--   unguarded ALTER POLICY would abort the migration.
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

-- ============================================================
-- VERIFY - run right after the script above
-- ============================================================
-- 1) posts policies: expect NO INSERT/ALL row whose roles include public,
--    anon or authenticated. Leftover service_role-only policies may appear;
--    they are unreachable from a browser and change nothing.
--    SELECT / UPDATE / DELETE stay: history reads, ai_reply save,
--    cleanup-on-failure delete, and the gate's service-role INSERT.
SELECT policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'public' AND tablename = 'posts'
 ORDER BY cmd;

-- 1b) the crisp version: expect 0. Counts INSERT/ALL policies that apply to
--     a browser role. Dashboard-created "service role only" policies are
--     excluded, because they cannot be reached from the anon/authenticated role.
SELECT count(*) AS browser_insert_policies
  FROM pg_policies
 WHERE schemaname = 'public'
   AND tablename  = 'posts'
   AND cmd IN ('INSERT', 'ALL')
   AND roles && ARRAY['public'::name, 'anon'::name, 'authenticated'::name];

-- 2) the gate functions: expect exactly two rows.
SELECT p.proname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.proname IN ('create_post_with_quota', 'release_post_gate');

-- 3) the reservation table exists and has RLS on (expect one row, true).
SELECT relname, relrowsecurity
  FROM pg_class
 WHERE oid = to_regclass('public.post_gate_reservations');
