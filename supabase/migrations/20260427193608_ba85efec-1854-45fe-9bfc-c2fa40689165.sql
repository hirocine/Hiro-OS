CREATE TABLE public.marketing_pillars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT 'blue',
  target_percentage NUMERIC,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view marketing_pillars" ON public.marketing_pillars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert marketing_pillars" ON public.marketing_pillars FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update marketing_pillars" ON public.marketing_pillars FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete marketing_pillars" ON public.marketing_pillars FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_marketing_pillars_updated_at
  BEFORE UPDATE ON public.marketing_pillars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.marketing_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  platform TEXT,
  format TEXT,
  status TEXT NOT NULL DEFAULT 'em_producao',
  scheduled_at TIMESTAMPTZ,
  published_url TEXT,
  file_url TEXT,
  cover_url TEXT,
  pillar_id UUID REFERENCES public.marketing_pillars(id) ON DELETE SET NULL,
  idea_id UUID REFERENCES public.marketing_ideas(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view marketing_posts" ON public.marketing_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert marketing_posts" ON public.marketing_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update marketing_posts" ON public.marketing_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete marketing_posts" ON public.marketing_posts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_marketing_posts_updated_at
  BEFORE UPDATE ON public.marketing_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_marketing_posts_scheduled_at ON public.marketing_posts(scheduled_at);
CREATE INDEX idx_marketing_posts_pillar_id ON public.marketing_posts(pillar_id);
CREATE INDEX idx_marketing_posts_status ON public.marketing_posts(status);

ALTER TABLE public.marketing_ideas
  ADD COLUMN pillar_id UUID REFERENCES public.marketing_pillars(id) ON DELETE SET NULL;