-- Snapshots diários do GA4
CREATE TABLE public.marketing_ga4_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  captured_date DATE NOT NULL,
  sessions INTEGER,
  total_users INTEGER,
  new_users INTEGER,
  page_views INTEGER,
  avg_session_duration NUMERIC,
  bounce_rate NUMERIC,
  engagement_rate NUMERIC,
  conversions INTEGER,
  top_source TEXT,
  raw_response JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, captured_date)
);

ALTER TABLE public.marketing_ga4_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ga4_snapshots"
  ON public.marketing_ga4_snapshots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert ga4_snapshots"
  ON public.marketing_ga4_snapshots
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update ga4_snapshots"
  ON public.marketing_ga4_snapshots
  FOR UPDATE TO service_role USING (true);

CREATE INDEX idx_ga4_snapshots_date ON public.marketing_ga4_snapshots(captured_date DESC);

-- Dimensões agregadas
CREATE TABLE public.marketing_ga4_dimensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id TEXT NOT NULL,
  captured_date DATE NOT NULL,
  sources_breakdown JSONB,
  top_pages JSONB,
  mediums_breakdown JSONB,
  devices_breakdown JSONB,
  countries_breakdown JSONB,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, captured_date)
);

ALTER TABLE public.marketing_ga4_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ga4_dimensions"
  ON public.marketing_ga4_dimensions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert ga4_dimensions"
  ON public.marketing_ga4_dimensions
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update ga4_dimensions"
  ON public.marketing_ga4_dimensions
  FOR UPDATE TO service_role USING (true);

-- Adicionar refresh_token na marketing_integrations se não existe
ALTER TABLE public.marketing_integrations
  ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Campos UTM em marketing_posts
ALTER TABLE public.marketing_posts
  ADD COLUMN IF NOT EXISTS utm_url TEXT,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS destination_url TEXT;

COMMENT ON COLUMN public.marketing_posts.destination_url IS 'URL original sem UTM (ex: hiro.film/portfolio)';
COMMENT ON COLUMN public.marketing_posts.utm_url IS 'URL completa com UTM (ex: hiro.film/portfolio?utm_source=instagram...)';