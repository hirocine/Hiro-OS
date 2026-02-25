
-- Tabela de orçamentos/propostas comerciais
CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  client_name text NOT NULL,
  project_name text NOT NULL,
  project_number text,
  client_responsible text,
  validity_date date NOT NULL,
  briefing text,
  video_url text,
  moodboard_images jsonb DEFAULT '[]'::jsonb,
  scope_pre_production jsonb DEFAULT '[]'::jsonb,
  scope_production jsonb DEFAULT '[]'::jsonb,
  scope_post_production jsonb DEFAULT '[]'::jsonb,
  timeline jsonb DEFAULT '[]'::jsonb,
  base_value numeric DEFAULT 0,
  discount_pct numeric DEFAULT 0,
  final_value numeric DEFAULT 0,
  payment_terms text DEFAULT '50% no fechamento do projeto mediante contrato e os outros 50% na entrega do material final',
  status text DEFAULT 'draft' NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Trigger para updated_at
CREATE TRIGGER set_orcamentos_updated_at
  BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- SELECT público (para a página pública funcionar sem login)
CREATE POLICY "Anyone can view orcamentos"
  ON public.orcamentos FOR SELECT
  USING (true);

-- INSERT: apenas admin e producao
CREATE POLICY "Admin and producao can insert orcamentos"
  ON public.orcamentos FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'producao'::app_role)
  );

-- UPDATE: apenas admin e producao
CREATE POLICY "Admin and producao can update orcamentos"
  ON public.orcamentos FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'producao'::app_role)
  );

-- DELETE: apenas admin e producao
CREATE POLICY "Admin and producao can delete orcamentos"
  ON public.orcamentos FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'producao'::app_role)
  );

-- Storage bucket para moodboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-moodboard', 'proposal-moodboard', true);

-- Storage RLS: leitura pública
CREATE POLICY "Public read access for proposal moodboard"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proposal-moodboard');

-- Storage RLS: upload para admin/producao
CREATE POLICY "Admin and producao can upload proposal moodboard"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'proposal-moodboard'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'producao'::app_role)
    )
  );

-- Storage RLS: delete para admin/producao
CREATE POLICY "Admin and producao can delete proposal moodboard"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'proposal-moodboard'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'producao'::app_role)
    )
  );
