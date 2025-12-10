-- =============================================
-- TORNAR PROJETOS AV ACESSÍVEL PARA TODOS
-- =============================================

-- Remover policies de admin-only para audiovisual_projects
DROP POLICY IF EXISTS "Admins can insert AV projects" ON public.audiovisual_projects;
DROP POLICY IF EXISTS "Admins can update AV projects" ON public.audiovisual_projects;
DROP POLICY IF EXISTS "Admins can delete AV projects" ON public.audiovisual_projects;

-- Criar novas policies para todos autenticados
CREATE POLICY "Authenticated users can insert AV projects"
ON public.audiovisual_projects FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update AV projects"
ON public.audiovisual_projects FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete AV projects"
ON public.audiovisual_projects FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Remover policies de admin-only para av_project_steps
DROP POLICY IF EXISTS "Admins can insert steps" ON public.av_project_steps;
DROP POLICY IF EXISTS "Admins can update steps" ON public.av_project_steps;
DROP POLICY IF EXISTS "Admins can delete steps" ON public.av_project_steps;

-- Criar novas policies para todos autenticados
CREATE POLICY "Authenticated users can insert steps"
ON public.av_project_steps FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update steps"
ON public.av_project_steps FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete steps"
ON public.av_project_steps FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Remover policies de admin-only para av_project_substeps
DROP POLICY IF EXISTS "Admins can insert substeps" ON public.av_project_substeps;
DROP POLICY IF EXISTS "Admins can update substeps" ON public.av_project_substeps;
DROP POLICY IF EXISTS "Admins can delete substeps" ON public.av_project_substeps;

-- Criar novas policies para todos autenticados
CREATE POLICY "Authenticated users can insert substeps"
ON public.av_project_substeps FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update substeps"
ON public.av_project_substeps FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete substeps"
ON public.av_project_substeps FOR DELETE
USING (auth.uid() IS NOT NULL);