-- SQL script to create jobs and website_posts tables for Phase 4

-- Ensure users table has a website_url column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  plan_tier TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'draft',
  title TEXT,
  content TEXT,
  hashtags JSONB,
  media_urls JSONB DEFAULT '[]'::jsonb,
  customer_name TEXT,
  customer_phone TEXT,
  has_website BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_jobs_modtime
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create website_posts table
CREATE TABLE IF NOT EXISTS public.website_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  content TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER update_website_posts_modtime
BEFORE UPDATE ON public.website_posts
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable RLS (Service role access only)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage jobs" ON public.jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.website_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage website_posts" ON public.website_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
