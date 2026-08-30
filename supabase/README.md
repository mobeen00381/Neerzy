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

## Latest migration: manual fallback review status

File: `supabase/migrations/20260830_add_manual_fallback_status.sql`

This adds `manual_fallback` to the allowed `review_requests.status` values. It is
idempotent and safe to re-run.

To verify it applied correctly:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.review_requests'::regclass
  AND contype = 'c';
```

The `review_requests_status_check` row should include `'manual_fallback'::text`.
