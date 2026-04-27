-- ============================================
-- Tabela: marketing_references
-- ============================================
CREATE TABLE public.marketing_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  image_url TEXT,
  platform TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  category TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view marketing_references"
  ON public.marketing_references FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert marketing_references"
  ON public.marketing_references FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update marketing_references"
  ON public.marketing_references FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete marketing_references"
  ON public.marketing_references FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_marketing_references_updated_at
  BEFORE UPDATE ON public.marketing_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Tabela: marketing_ideas
-- ============================================
CREATE TABLE public.marketing_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  source TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  reference_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view marketing_ideas"
  ON public.marketing_ideas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert marketing_ideas"
  ON public.marketing_ideas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update marketing_ideas"
  ON public.marketing_ideas FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete marketing_ideas"
  ON public.marketing_ideas FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_marketing_ideas_updated_at
  BEFORE UPDATE ON public.marketing_ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Tabela: marketing_personas
-- ============================================
CREATE TABLE public.marketing_personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  segment TEXT,
  company_size TEXT,
  main_pains TEXT[] NOT NULL DEFAULT '{}',
  common_objections TEXT[] NOT NULL DEFAULT '{}',
  buying_triggers TEXT[] NOT NULL DEFAULT '{}',
  channels_consumed TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view marketing_personas"
  ON public.marketing_personas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert marketing_personas"
  ON public.marketing_personas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update marketing_personas"
  ON public.marketing_personas FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete marketing_personas"
  ON public.marketing_personas FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_marketing_personas_updated_at
  BEFORE UPDATE ON public.marketing_personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Storage bucket: marketing-assets (público)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-assets', 'marketing-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Marketing assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-assets');

CREATE POLICY "Authenticated can upload marketing-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketing-assets');

CREATE POLICY "Authenticated can update marketing-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'marketing-assets');

CREATE POLICY "Authenticated can delete marketing-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'marketing-assets');