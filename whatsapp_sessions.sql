-- SQL to create whatsapp_sessions table for state machine tracking
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  accumulated_images JSONB DEFAULT '[]'::jsonb,
  transcript TEXT DEFAULT '',
  step TEXT DEFAULT 'initial',
  customer_name TEXT,
  customer_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_whatsapp_sessions_modtime
BEFORE UPDATE ON public.whatsapp_sessions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Optional: RLS policies (if needed, defaulting to service role only access)
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage sessions" 
ON public.whatsapp_sessions 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
