-- Add GMB Health Check fields to the jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS gmb_place_id TEXT,
ADD COLUMN IF NOT EXISTS gmb_business_name TEXT,
ADD COLUMN IF NOT EXISTS gmb_address TEXT,
ADD COLUMN IF NOT EXISTS gmb_phone TEXT,
ADD COLUMN IF NOT EXISTS gmb_website TEXT,
ADD COLUMN IF NOT EXISTS gmb_rating DECIMAL,
ADD COLUMN IF NOT EXISTS gmb_review_count INTEGER,
ADD COLUMN IF NOT EXISTS gmb_health_score INTEGER,
ADD COLUMN IF NOT EXISTS gmb_missing_items JSONB DEFAULT '[]'::jsonb;

-- Update status options comment
COMMENT ON COLUMN public.jobs.status IS 'draft, gmb_checked, scheduled, published, failed';
