ALTER TABLE public.marketing_ideas
  ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.marketing_personas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_ideas_persona_id 
  ON public.marketing_ideas(persona_id) 
  WHERE persona_id IS NOT NULL;

ALTER TABLE public.marketing_posts
  ADD COLUMN IF NOT EXISTS persona_id UUID REFERENCES public.marketing_personas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_posts_persona_id 
  ON public.marketing_posts(persona_id) 
  WHERE persona_id IS NOT NULL;

COMMENT ON COLUMN public.marketing_ideas.persona_id IS 'Persona-alvo desta ideia (opcional)';
COMMENT ON COLUMN public.marketing_posts.persona_id IS 'Persona-alvo deste post (opcional)';