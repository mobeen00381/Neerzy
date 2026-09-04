# Deploying the Neerzy Admin Dashboard

Private dashboard at **`/admin`** with:
- Revenue / transactions (from Paddle webhooks → new `transactions` table)
- Leads pipeline (new `leads` table + `/api/leads/submit` capture endpoint)
- Per-user quota usage + cycle reset dates
- Signup source / UTM attribution

Do these **3 steps in order**.

---

## Step 1 — Run the database migration (required first)

Open your project's Supabase dashboard:
`https://supabase.com/dashboard` → your project → **SQL Editor** → **New query**.

Then paste the **entire contents** of this file:

```
supabase/migrations/20260905_admin_dashboard.sql
```

...and click **Run** (or press `⌘/Ctrl + Enter`).

You should see “Success. No rows returned” — it creates:

| Object | Purpose |
|---|---|
| `public.transactions` | Ledger of every Paddle payment event (idempotent, linked to users) |
| `public.leads` | Inbound leads from Facebook / Instagram / Google Ads / organic |
| `profiles.signup_source`, `utm_source`, `utm_medium`, `utm_campaign`, `lead_id` | Signup attribution columns |

### Alternative (if you have the Supabase CLI installed)
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### How to verify
Run this in the SQL editor:
```sql
SELECT * FROM public.transactions LIMIT 5;   -- should not error
SELECT * FROM public.leads LIMIT 5;          -- should not error
SELECT signup_source, utm_source FROM public.profiles LIMIT 5;
```
All three must run without a “relation does not exist” error.

---

## Step 2 — Add environment variables in Vercel

Go to **Vercel → your Neerzy project → Settings → Environment Variables**
and add all three (for **Production**, and optionally Preview):

| Name | Value |
|---|---|
| `ADMIN_EMAIL` | `mobeen0381@gmail.com` |
| `ADMIN_PASSWORD` | choose a strong password (different from the local one if you like) |
| `ADMIN_JWT_SECRET` | a long random string, e.g. generate at `https://1password.com/password-generator/` (or run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |

> ⚠️ The dashboard **refuses to work** if any of these three are missing. No fallback credentials exist in code anymore.

After adding them, click **Redeploy** on the latest deployment.

### Local note
These are already set in your local `.env.local` — don’t commit that file.

---

## Step 3 — After deploy: sanity check

1. Open `https://www.neerzy.com/admin` → sign in.
2. **Overview** should load. If Transactions/Leads show empty, that is expected until money/leads flow in.
3. Do a **test payment** (Paddle sandbox) and confirm it appears under **Transactions** → this proves the webhook → `transactions` ledger works.
4. Submit a lead from an ad landing page with `POST /api/leads/submit` and confirm it appears under **Leads**.

---

## Bonus: make a test lead right now (from the browser console)
```js
fetch('/api/leads/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test Plumber',
    phone: '+447000000001',
    business_name: 'Test Plumbing Ltd',
    utm_source: 'facebook',
    utm_campaign: 'launch-test'
  })
}).then(r => r.json()).then(console.log)
```
