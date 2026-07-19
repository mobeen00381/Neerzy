# Answers to Follow-Up Questions

## Q1: Why does the profile upsert in /api/gbp/connect fail silently?

### The catch block (lines 85-87 of `/api/gbp/connect/route.ts`):

```typescript
} catch (profileErr) {
  console.warn('⚠️ Skip public profiles table update:', profileErr);
}
```

**Why it fails:** The `/api/gbp/connect` route creates a Supabase admin client using `SUPABASE_SERVICE_ROLE_KEY` (line 5-6), so the upsert itself should succeed from a permissions standpoint. However, the `profiles` table has RLS policies that restrict access:

```sql
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

The admin client bypasses RLS, so the upsert should work. **The real failure point is more likely that the `profiles` table doesn't exist yet** (if migrations haven't been fully applied), or the `id` column reference fails because the auth user doesn't exist in the admin client's context.

**But the more critical issue** is that even when the upsert succeeds, it only sets `{ id, business_name, phone, updated_at }` — it does NOT set `trial_started_at`. The column has `DEFAULT NOW()` in the schema, so on first INSERT it gets set. But on subsequent upserts (which use `onConflict: 'id'`), the `updated_at` changes but `trial_started_at` stays at the original value. This is actually correct behavior — the problem is that for users who never got a profile row created, there's no `trial_started_at` at all.

### Similar "silent catch, fallback default" patterns elsewhere:

**1. `/app/dashboard/page.tsx` lines 133-142** — Profile fetch silently fails:
```typescript
try {
  const { data: fetchedProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  profileData = fetchedProfile;
} catch (dbErr) {
  console.warn('⚠️ Could not load profiles table:', dbErr);
}
```
If this fails, `profileData` stays `null`, which cascades to line 554:
```typescript
const trialStart = profile?.trial_started_at || profile?.created_at || new Date().toISOString();
```
Since `profile` is `null`, it falls through to `new Date().toISOString()`.

**2. `/app/dashboard/page.tsx` lines 174-190** — Profile update in healing silently fails:
```typescript
try {
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .update({...})
    .eq('id', user.id)
    .select()
    .single();
  if (updatedProfile) { profileData = updatedProfile; }
} catch (dbErr) {
  console.warn('⚠️ profiles table update skipped in healing:', dbErr);
}
```

**3. `/app/dashboard/page.tsx` lines 214-223** — pending_posts fetch silently fails:
```typescript
try {
  const { data: wpData } = await supabase
    .from('pending_posts')
    .select('*')
    .eq('user_phone', phone)
    .order('created_at', { ascending: true });
  if (wpData) whatsappPosts = wpData;
} catch (wpErr) {
  console.warn('⚠️ Could not load pending_posts:', wpErr);
}
```

**4. `/app/api/gbp/connect/route.ts` lines 63-65** — Auth metadata update silently fails:
```typescript
} catch (authMetaErr) {
  console.error('❌ Failed to update auth user_metadata:', authMetaErr);
}
```

**5. `/app/api/gbp/connect/route.ts` lines 85-87** — Profile upsert silently fails (the one in question).

**6. `/app/api/gbp/connect/route.ts` lines 112-116** — Fallback profile sync silently fails:
```typescript
} catch (profileErr) {
  console.warn('⚠️ Fallback public profile sync skipped.', profileErr);
}
```

**Pattern:** The codebase uses a "never crash the dashboard" pattern where DB operations are wrapped in try/catch with `console.warn`. This is defensive but means failures cascade silently — a failed profile fetch → null profile → fallback to `new Date().toISOString()` → trial always shows 30 days.

---

## Q2: Backfill strategy for existing users with no trial_started_at

### Proposed approach (fair to all users):

**Use `auth.users.created_at` as the authoritative source.** Supabase Auth stores the exact timestamp when the user signed up. This is immutable and cannot be tampered with client-side.

**Backfill SQL (run once via Supabase SQL editor):**

```sql
-- Backfill trial_started_at for profiles that have no value
UPDATE public.profiles p
SET trial_started_at = u.created_at
FROM auth.users u
WHERE p.id = u.id
  AND p.trial_started_at IS NULL;

-- For users who have NO profile row at all, create one
INSERT INTO public.profiles (id, trial_started_at, selected_plan, created_at)
SELECT 
  au.id,
  au.created_at,
  'free',
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
```

**Why this is fair:**
- `auth.users.created_at` is the actual signup timestamp — it's the ground truth
- A user who signed up 45 days ago will see `max(0, 30 - 45) = 0 days left` (trial expired)
- A user who signed up 10 days ago will see `30 - 10 = 20 days left`
- No one gets extra free days beyond what they've already used
- No one gets cut off unfairly — if they signed up yesterday, they still have 29 days

**Alternative if auth.users.created_at is not accessible** (some setups restrict access to `auth` schema):
Use the earliest post timestamp from the `posts` table:
```sql
UPDATE public.profiles p
SET trial_started_at = sub.first_post_date
FROM (
  SELECT user_id, MIN(created_at) as first_post_date
  FROM public.posts
  GROUP BY user_id
) sub
WHERE p.id = sub.user_id
  AND p.trial_started_at IS NULL;
```

**For users with no posts and no profile:** Set `trial_started_at` to `NOW()` — they get the full 30 days from today, which is the most generous interpretation and avoids support complaints.

---

## Q3: PostUsageTracker and PlanStatusCard — prop shape compatibility

### PostUsageTracker expects (via `usage: any`):
| Property | Type | Used in component | Provided by usage.ts? |
|----------|------|-------------------|----------------------|
| `dailyPostsUsed` | number | Line 30: `{usage.dailyPostsUsed} / {planConfig.dailyPosts}` | ✅ Yes |
| `totalPostsUsed` | number | Line 54: `{usage.totalPostsUsed} / {planConfig.totalPosts}` | ✅ Yes |
| `remainingToday` | number | Line 36: `usage.remainingToday <= 0` | ✅ Yes |
| `remainingTotal` | number | Line 60: `usage.remainingTotal <= 0` | ✅ Yes |
| `isLimited` | boolean | Line 71: `usage.isLimited` | ✅ Yes |

**Verdict: Safe to render.** `PostUsageTracker` uses `usage: any` and accesses properties that exactly match `UsageStats` from `usage.ts`.

### PlanStatusCard expects (via `usage: any`):
| Property | Type | Used in component | Provided by usage.ts? |
|----------|------|-------------------|----------------------|
| `daysLeft` | number | Line 13: `usage?.daysLeft \|\| ...` | ✅ Yes |

**Verdict: Safe to render.** `PlanStatusCard` also accepts `trialStart` as a separate prop as fallback. The `usage?.daysLeft` access is optional (uses `||` fallback), so it won't crash even if `usage` is null.

**Both components are ready to use — they just need to be wired up.** The dashboard currently does its own inline rendering of counts instead of using these components.

---

## Q4: Proposed review_requests table schema

```sql
-- Review requests tracking table
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  message_text TEXT NOT NULL,           -- The WhatsApp message that was generated
  review_link TEXT NOT NULL,            -- The Google review link used
  status TEXT DEFAULT 'sent',           -- 'sent', 'opened', 'conversion_pending', 'review_received'
  sent_via TEXT DEFAULT 'whatsapp',     -- 'whatsapp', 'copy_link', 'sms'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,             -- When a matching review was detected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_review_requests_user_id ON public.review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_sent_at ON public.review_requests(sent_at);

-- RLS
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own review requests" 
  ON public.review_requests FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own review requests" 
  ON public.review_requests FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_review_requests_modtime 
  BEFORE UPDATE ON public.review_requests 
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
```

**Design rationale:**
- `user_id` links to auth.users for quota counting
- `business_id` links to business_profiles for the review_link
- `customer_name` and `customer_phone` are optional (user may just copy the link)
- `status` tracks the lifecycle: sent → (if customer clicks) → review_received
- `converted_at` enables conversion rate calculation
- Separate from `posts` table so review request quota is distinct from post quota

**For detecting "review_received" without a Google API:** The simplest viable approach is a manual flag — when the business owner sees a new Google review, they can mark the request as converted in the dashboard. A future enhancement could poll the Google Business Profile API periodically.
