ALTER TABLE public.marketing_ideas
  ADD COLUMN IF NOT EXISTS format TEXT;

COMMENT ON COLUMN public.marketing_ideas.format IS 'Formato planejado: reels, carrossel, video_longo, foto, stories, short, outro';