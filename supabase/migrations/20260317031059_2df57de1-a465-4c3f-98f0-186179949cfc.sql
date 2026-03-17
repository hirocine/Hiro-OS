-- Tabela principal da esteira de pós-produção
CREATE TABLE public.post_production_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  project_id uuid REFERENCES public.audiovisual_projects(id) ON DELETE SET NULL,
  project_name text,
  client_name text,
  editor_id uuid,
  editor_name text,
  status text NOT NULL DEFAULT 'fila',
  priority text NOT NULL DEFAULT 'media',
  due_date date,
  start_date date,
  delivered_date date,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER set_post_production_queue_updated_at
  BEFORE UPDATE ON public.post_production_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.post_production_queue ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler
CREATE POLICY "Authenticated users can read post_production_queue"
  ON public.post_production_queue
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin e producao podem inserir
CREATE POLICY "Admin and producao can insert post_production_queue"
  ON public.post_production_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'producao')
  );

-- Admin e producao podem atualizar
CREATE POLICY "Admin and producao can update post_production_queue"
  ON public.post_production_queue
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'producao')
  );

-- Admin e producao podem deletar
CREATE POLICY "Admin and producao can delete post_production_queue"
  ON public.post_production_queue
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'producao')
  );