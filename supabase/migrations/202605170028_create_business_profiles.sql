-- SQL script to create the business_profiles table
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT,
  category TEXT,
  google_place_id TEXT,
  google_maps_url TEXT,
  review_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Add Service Role Policy
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage business_profiles') THEN
        CREATE POLICY "Service role can manage business_profiles" ON public.business_profiles 
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Index for faster lookups by phone
CREATE INDEX IF NOT EXISTS idx_business_profiles_phone ON public.business_profiles(user_phone);
