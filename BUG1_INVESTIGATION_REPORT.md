# Bug #1 Investigation Report: Quota/Countdown Not Tracking Usage

## Root Cause Analysis

### Issue: "30 days left" always shows on a 30-day-old free account

**The problem is in `/src/app/dashboard/page.tsx`, lines 554-556:**

```typescript
const trialStart = profile?.trial_started_at || profile?.created_at || new Date().toISOString();
const daysLeft = planLimits.trialDays > 0 ? getRemainingDays(trialStart, planLimits.trialDays) : 30;
const daysCountdown = planLimits.trialDays > 0 ? `${daysLeft} days left` : 'Unlimited';
```

**The fallback chain is the culprit:**
1. It tries `profile?.trial_started_at` — but the `profiles` table is **never populated with `trial_started_at`** during signup or onboarding.
2. It falls back to `profile?.created_at` — but the `profiles` table is **only upserted with `{ id, business_name, phone, updated_at }`** in the `/api/gbp/connect` route (line 73-78 of `gbp/connect/route.ts`). The `created_at` column has a `DEFAULT NOW()` so it gets set, BUT...
3. If the profile upsert fails (which it silently catches on line 80-87), it falls through to `new Date().toISOString()` — meaning **today's date is used as the trial start**, so `getRemainingDays` always returns 30.

**Even when the profile IS created successfully**, the `trial_started_at` column is **never explicitly set** in the `/api/gbp/connect` route. The migration schema (`20240514_create_core_tables.sql` line 51) shows `trial_started_at TIMESTAMPTZ DEFAULT NOW()`, so it would get the current timestamp on first insert. But the `/api/gbp/connect` route uses `upsert` with `{ onConflict: 'id' }` — meaning on subsequent calls, it updates the row but does NOT include `trial_started_at` in the update payload, so it stays at the original value.

**However**, the real issue is that the `profiles` table row may not even exist for many users. The signup flow (`/signup/page.tsx`) creates an auth user but does NOT insert a row into the `profiles` table. The `/api/gbp/connect` route tries to upsert a profile, but wraps it in a try/catch that silently swallows errors. If the profiles table has RLS policies that block the client-side upsert (since the client uses the anon key, not the service role), the profile row never gets created.

### Issue: "5/5 remaining" always shows even after posting

**The problem is in `/src/app/dashboard/page.tsx`, lines 557-559:**

```typescript
const totalRemaining = planLimits.totalPosts === -1 ? 'Unlimited' : Math.max(0, planLimits.totalPosts - stats.total);
const totalCountdown = planLimits.totalPosts === -1 ? 'Unlimited' : `${totalRemaining}/${planLimits.totalPosts} remaining`;
```

**The `stats.total` is calculated from `dbMessages` (line 284):**
```typescript
const totalCount = dbMessages.filter(p => p.status === 'published').length;
```

**But `dbMessages` is built from TWO sources:**
1. `posts` table — queried by `user_id` (line 226-230)
2. `pending_posts` table — queried by `user_phone` (line 214-223)

**The `handleSendMessage` function (line 476) inserts into the `posts` table and then increments local state:**
```typescript
setStats(prev => ({
  total: prev.total + 1,
  daily: prev.daily + 1
}));
```

**So the local state IS incremented on post.** But the problem is that `loadDashboardData()` is called ONCE on mount (line 298-300), and the `stats` state is initialized from that initial load. When `handleSendMessage` runs, it increments the local state correctly.

**However**, if the user refreshes the page, `loadDashboardData()` runs again and recalculates from the database. If the `posts` table insert succeeded, the count should be correct after refresh.

**The REAL bug is more subtle — the `stats` state is initialized as `{ total: 0, daily: 0 }` (line 54):**
```typescript
const [stats, setStats] = useState({ total: 0, daily: 0 });
```

And the `loadDashboardData` function sets it from the DB query. But look at the `totalCount` calculation on line 284:
```typescript
const totalCount = dbMessages.filter(p => p.status === 'published').length;
```

This filters by `status === 'published'`. The `handleSendMessage` function inserts posts with `status: 'published'` (line 489), so they should be counted. **This part actually works correctly.**

### The REAL reason "5/5 remaining" persists

The actual bug is that **the header display uses `stats.total` which is calculated from `dbMessages`**, but `dbMessages` only includes posts from the `posts` table (filtered by `user_id`) and `pending_posts` table (filtered by `user_phone`). 

**If the user's `user_id` doesn't match** (e.g., the auth user's ID doesn't match the `user_id` column in the `posts` table because the posts were inserted with a different user reference), the posts won't show up in the count.

**More importantly**, the `usage.ts` library (which is the proper centralized usage tracking) is **never actually called from the dashboard page**. The dashboard page has its own inline calculation that duplicates (and conflicts with) the logic in `usage.ts`. The `PostUsageTracker` and `PlanStatusCard` components receive `usage` as a prop but are **never rendered** in the dashboard page — the dashboard page does its own inline rendering of counts.

## Summary of Bugs Found

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 1 | `trial_started_at` never set during onboarding | `/api/gbp/connect/route.ts` (line 73-78) | **HIGH** |
| 2 | Fallback to `new Date().toISOString()` makes trial always reset to 30 days | `/app/dashboard/page.tsx` (line 554) | **HIGH** |
| 3 | `usage.ts` library exists but is never used by the dashboard | `lib/usage.ts` vs `app/dashboard/page.tsx` | **MEDIUM** |
| 4 | `PostUsageTracker` and `PlanStatusCard` components exist but are never rendered | `components/dashboard/` | **LOW** |
| 5 | No `review_requests` table or quota tracking exists | Entire codebase | **MISSING FEATURE** |
| 6 | `AnalyticsPanel` calls `get_trader_analytics` RPC which likely doesn't exist | `components/dashboard/AnalyticsPanel.tsx` (line 103) | **MEDIUM** |
