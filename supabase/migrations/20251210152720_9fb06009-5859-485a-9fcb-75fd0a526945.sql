-- =============================================
-- AUDIOVISUAL PROJECTS MANAGEMENT SYSTEM
-- =============================================

-- 1. Tabela principal de projetos audiovisuais
CREATE TABLE public.audiovisual_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  logo_url TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  deadline DATE,
  actual_end_date DATE,
  responsible_user_id UUID,
  responsible_user_name TEXT,
  created_by UUID,
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de seções padrão (template)
CREATE TABLE public.av_project_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de steps de cada projeto
CREATE TABLE public.av_project_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.audiovisual_projects(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.av_project_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  responsible_user_id UUID,
  responsible_user_name TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluido', 'bloqueado')),
  display_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de substeps
CREATE TABLE public.av_project_substeps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id UUID NOT NULL REFERENCES public.av_project_steps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  responsible_user_id UUID,
  responsible_user_name TEXT,
  deadline DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.audiovisual_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.av_project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.av_project_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.av_project_substeps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audiovisual_projects
CREATE POLICY "Authenticated users can view all AV projects"
ON public.audiovisual_projects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert AV projects"
ON public.audiovisual_projects FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update AV projects"
ON public.audiovisual_projects FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete AV projects"
ON public.audiovisual_projects FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for av_project_sections (template sections - read only for users)
CREATE POLICY "Authenticated users can view sections"
ON public.av_project_sections FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sections"
ON public.av_project_sections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for av_project_steps
CREATE POLICY "Authenticated users can view steps"
ON public.av_project_steps FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert steps"
ON public.av_project_steps FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update steps"
ON public.av_project_steps FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete steps"
ON public.av_project_steps FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for av_project_substeps
CREATE POLICY "Authenticated users can view substeps"
ON public.av_project_substeps FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert substeps"
ON public.av_project_substeps FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update substeps"
ON public.av_project_substeps FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete substeps"
ON public.av_project_substeps FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_audiovisual_projects_updated_at
BEFORE UPDATE ON public.audiovisual_projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_av_project_steps_updated_at
BEFORE UPDATE ON public.av_project_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_av_project_substeps_updated_at
BEFORE UPDATE ON public.av_project_substeps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections (template)
INSERT INTO public.av_project_sections (name, display_order, icon) VALUES
('Primeiro Contato', 1, 'Phone'),
('Briefing', 2, 'FileText'),
('Orçamento', 3, 'Calculator'),
('Jurídico e Financeiro', 4, 'Scale'),
('Pré-Produção', 5, 'ClipboardList'),
('Produção', 6, 'Video'),
('Pós Produção', 7, 'Film');

-- Function to create default steps when a project is created
CREATE OR REPLACE FUNCTION public.create_av_project_default_steps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  section_record RECORD;
BEGIN
  -- Primeiro Contato
  SELECT id INTO section_record FROM av_project_sections WHERE name = 'Primeiro Contato';
  INSERT INTO av_project_steps (project_id, section_id, title, display_order) VALUES
    (NEW.id, section_record.id, 'Briefing Inicial', 1),
    (NEW.id, section_record.id, 'Marcar Reunião com Cliente', 2);

  -- Briefing
  SELECT id INTO section_record FROM av_project_sections WHERE name = 'Briefing';
  INSERT INTO av_project_steps (project_id, section_id, title, display_order) VALUES
    (NEW.id, section_record.id, 'Briefing Detalhado', 1);

  -- Orçamento
  SELECT id INTO section_record FROM av_project_sections WHERE name = 'Orçamento';
  INSERT INTO av_project_steps (project_id, section_id, title, display_order) VALUES
    (NEW.id, section_record.id, 'Reunião de Kick-Off', 1),
    (NEW.id, section_record.id, 'Planilha de Budget', 2),
    (NEW.id, section_record.id, 'Orçamento', 3),
    (NEW.id, section_record.id, 'Envio de Orçamento', 4);

  -- Jurídico e Financeiro
  SELECT id INTO section_record FROM av_project_sections WHERE name = 'Jurídico e Financeiro';
  INSERT INTO av_project_steps (project_id, section_id, title, display_order) VALUES
    (NEW.id, section_record.id, 'Contrato', 1),
    (NEW.id, section_record.id, 'NFe', 2);

  -- Pré-Produção
  SELECT id INTO section_record FROM av_project_sections WHERE name = 'Pré-Produção';
  INSERT INTO av_project_steps (project_id, section_id, title, display_order) VALUES
    (NEW.id, section_record.id, 'Decupagem', 1),
    (NEW.id, section_record.id, 'Budget Final', 2),
    (NEW.id, section_record.id, 'Alinhamento de Entregas e Prazos', 3),
    (NEW.id, section_record.id, 'Preparação Gravação', 4);

  -- Produção
  SELECT id INTO section_record FROM av_project_sections WHERE name = 'Produção';
  INSERT INTO av_project_steps (project_id, section_id, title, display_order) VALUES
    (NEW.id, section_record.id, 'Montagem', 1),
    (NEW.id, section_record.id, 'Gravação', 2);

  -- Pós Produção
  SELECT id INTO section_record FROM av_project_sections WHERE name = 'Pós Produção';
  INSERT INTO av_project_steps (project_id, section_id, title, display_order) VALUES
    (NEW.id, section_record.id, 'Log e Organização de Arquivos', 1),
    (NEW.id, section_record.id, 'Edição', 2);

  RETURN NEW;
END;
$$;

-- Trigger to auto-create steps when project is created
CREATE TRIGGER create_av_project_steps_on_insert
AFTER INSERT ON public.audiovisual_projects
FOR EACH ROW EXECUTE FUNCTION public.create_av_project_default_steps();

-- Indexes for performance
CREATE INDEX idx_av_projects_status ON public.audiovisual_projects(status);
CREATE INDEX idx_av_projects_deadline ON public.audiovisual_projects(deadline);
CREATE INDEX idx_av_steps_project_id ON public.av_project_steps(project_id);
CREATE INDEX idx_av_steps_section_id ON public.av_project_steps(section_id);
CREATE INDEX idx_av_substeps_step_id ON public.av_project_substeps(step_id);