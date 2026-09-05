# Supabase Migrations

This folder contains SQL migrations for the Neerzy project. Files are applied
in filename order by the Supabase CLI, or can be run manually in the Supabase
SQL Editor.

## Applying a migration

### Option 1 — Supabase CLI

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option 2 — Supabase SQL Editor

Open the Supabase dashboard for the target project, go to **SQL Editor**, paste
the contents of the migration file, and run it.

## Latest migration: Agency clients + pooled quotas

File: `supabase/migrations/20260904_agency_clients.sql`

Adds the `agency_clients` table and the `agency_client_phone` column on
`review_requests`. **The WhatsApp webhook's tracking insert writes
`agency_client_phone`, so this migration must be applied** — without it every
review request shows the "couldn't save the delivery-tracking record" warning
(column `review_requests.agency_client_phone does not exist`, code 42703).
Idempotent and safe to re-run.

## Earlier: Meta message ID + delivery statuses

File: `supabase/migrations/20260902_add_meta_message_id.sql`

Adds `meta_message_id` (the Meta WhatsApp `wamid`) and `last_error` (delivery
failure details) to `review_requests`, and adds `delivered` / `failed` to the
allowed `status` values so the WhatsApp webhook can record real delivery state
from Meta `statuses[]` callbacks. Idempotent and safe to re-run.

To verify it applied correctly:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.review_requests'::regclass
  AND contype = 'c';
```

The `review_requests_status_check` row should include `'delivered'::text` and
`'failed'::text`.
