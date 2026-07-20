-- Review Requests table
-- Tracks every review request sent to a customer, its status, and conversion
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.business_profiles(id),
  customer_name TEXT,
  customer_phone TEXT,
  message_text TEXT,
  review_link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'review_received')),
  sent_via TEXT DEFAULT 'whatsapp',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user-scoped lookups
CREATE INDEX IF NOT EXISTS idx_review_requests_user_id ON public.review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status);

-- Enable RLS
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access" ON public.review_requests 
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User-specific policies
CREATE POLICY "Users can view their own review requests" ON public.review_requests 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own review requests" ON public.review_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own review requests" ON public.review_requests 
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_review_requests_modtime BEFORE UPDATE ON public.review_requests 
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();
