ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.orcamentos(id);
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS is_latest_version boolean DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_orcamentos_parent_id ON public.orcamentos(parent_id);