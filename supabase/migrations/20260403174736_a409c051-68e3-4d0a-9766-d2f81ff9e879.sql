
-- Create proposal_cases table (reusable portfolio bank)
CREATE TABLE public.proposal_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  campaign_name TEXT NOT NULL DEFAULT '',
  vimeo_id TEXT NOT NULL DEFAULT '',
  vimeo_hash TEXT DEFAULT '',
  destaque BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create proposal_pain_points table (reusable pain points bank)
CREATE TABLE public.proposal_pain_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add sent_date column to orcamentos
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS sent_date DATE;

-- Enable RLS on both tables
ALTER TABLE public.proposal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_pain_points ENABLE ROW LEVEL SECURITY;

-- RLS policies for proposal_cases (authenticated access)
CREATE POLICY "Authenticated users can view proposal_cases"
  ON public.proposal_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert proposal_cases"
  ON public.proposal_cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update proposal_cases"
  ON public.proposal_cases FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete proposal_cases"
  ON public.proposal_cases FOR DELETE TO authenticated USING (true);

-- RLS policies for proposal_pain_points (authenticated access)
CREATE POLICY "Authenticated users can view proposal_pain_points"
  ON public.proposal_pain_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert proposal_pain_points"
  ON public.proposal_pain_points FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update proposal_pain_points"
  ON public.proposal_pain_points FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete proposal_pain_points"
  ON public.proposal_pain_points FOR DELETE TO authenticated USING (true);

-- Seed default pain points
INSERT INTO public.proposal_pain_points (label, title, description) VALUES
  ('Prioridade', 'Qualidade visual premium', 'A marca precisa de um padrão visual cinematográfico que transmita profissionalismo e sofisticação em todas as peças.'),
  ('Desafio', 'Prazos apertados e alta demanda', 'A necessidade de entregar conteúdo de alto nível em janelas de tempo curtas exige uma equipe experiente e processos ágeis.'),
  ('Contexto', 'Presença multiplataforma', 'O conteúdo precisa ser adaptado para diferentes formatos e plataformas, mantendo a consistência da identidade visual.'),
  ('Prioridade', 'Posicionamento de marca', 'Fortalecer a percepção da marca no mercado através de conteúdo audiovisual estratégico e de alto impacto.'),
  ('Desafio', 'ROI mensurável', 'Garantir que o investimento em produção audiovisual gere resultados tangíveis e mensuráveis para o negócio.'),
  ('Contexto', 'Diferenciação competitiva', 'Criar conteúdo que destaque a marca dos concorrentes e estabeleça uma narrativa visual única e memorável.'),
  ('Prioridade', 'Engajamento do público', 'Produzir conteúdo que gere conexão emocional e engajamento real com o público-alvo da marca.'),
  ('Desafio', 'Escalabilidade de conteúdo', 'Estruturar uma produção que permita escalar a criação de conteúdo sem perder qualidade ou identidade.');
