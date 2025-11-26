-- =====================================================
-- GESTÃO DE TAREFAS - Sistema Completo
-- =====================================================

-- 1. TABELA PRINCIPAL: tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluida', 'cancelada')),
  due_date DATE,
  department TEXT,
  assigned_to UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  is_team_task BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABELA: task_subtasks
CREATE TABLE public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABELA: task_comments
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA: task_attachments
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_is_team_task ON public.tasks(is_team_task);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_task_subtasks_task_id ON public.task_subtasks(task_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_attachments_task_id ON public.task_attachments(task_id);

-- =====================================================
-- FUNÇÃO SECURITY DEFINER (previne recursão RLS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_access_task(_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE id = _task_id
      AND (
        -- Tarefas do time: todos veem
        is_team_task = true
        -- Atribuída ao usuário atual
        OR assigned_to = auth.uid()
        -- Criada pelo usuário atual
        OR created_by = auth.uid()
        -- Admin vê tudo
        OR has_role(auth.uid(), 'admin'::app_role)
      )
  )
$$;

-- =====================================================
-- TRIGGER: updated_at automático
-- =====================================================

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_subtasks_updated_at
  BEFORE UPDATE ON public.task_subtasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS: tasks
-- =====================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- SELECT: Vê se é tarefa do time, atribuída, criada por ele, ou é admin
CREATE POLICY "Users can view accessible tasks"
  ON public.tasks
  FOR SELECT
  USING (
    is_team_task = true
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- INSERT: Qualquer usuário autenticado pode criar
CREATE POLICY "Authenticated users can create tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- UPDATE: Admin OU criador OU responsável
CREATE POLICY "Users can update their tasks"
  ON public.tasks
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
  );

-- DELETE: Admin OU criador
CREATE POLICY "Users can delete their tasks"
  ON public.tasks
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR created_by = auth.uid()
  );

-- =====================================================
-- RLS: task_subtasks
-- =====================================================

ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtasks of accessible tasks"
  ON public.task_subtasks
  FOR SELECT
  USING (public.can_access_task(task_id));

CREATE POLICY "Users can insert subtasks on accessible tasks"
  ON public.task_subtasks
  FOR INSERT
  WITH CHECK (public.can_access_task(task_id));

CREATE POLICY "Users can update subtasks on accessible tasks"
  ON public.task_subtasks
  FOR UPDATE
  USING (public.can_access_task(task_id));

CREATE POLICY "Users can delete subtasks on accessible tasks"
  ON public.task_subtasks
  FOR DELETE
  USING (public.can_access_task(task_id));

-- =====================================================
-- RLS: task_comments
-- =====================================================

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on accessible tasks"
  ON public.task_comments
  FOR SELECT
  USING (public.can_access_task(task_id));

CREATE POLICY "Users can insert comments on accessible tasks"
  ON public.task_comments
  FOR INSERT
  WITH CHECK (
    public.can_access_task(task_id)
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON public.task_comments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete their own comments"
  ON public.task_comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- =====================================================
-- RLS: task_attachments
-- =====================================================

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments on accessible tasks"
  ON public.task_attachments
  FOR SELECT
  USING (public.can_access_task(task_id));

CREATE POLICY "Users can insert attachments on accessible tasks"
  ON public.task_attachments
  FOR INSERT
  WITH CHECK (
    public.can_access_task(task_id)
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can delete their own attachments"
  ON public.task_attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );