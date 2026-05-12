-- SQL script to fully initialize Neerzy Auth & Onboarding tables

-- 1. Create otp_verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create users profile table (if not exists)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  whatsapp_verified BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free',
  business_name TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON public.otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- Enable RLS and add Service Role Policies
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage otp') THEN
        CREATE POLICY "Service role can manage otp" ON public.otp_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage users') THEN
        CREATE POLICY "Service role can manage users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage audit_logs') THEN
        CREATE POLICY "Service role can manage audit_logs" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;
