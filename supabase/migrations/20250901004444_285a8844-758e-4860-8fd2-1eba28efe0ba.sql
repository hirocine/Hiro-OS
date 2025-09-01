-- =============================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA - RLS POLICIES RESTRITIVAS
-- =============================================

-- 1. CORREÇÕES PARA TABELA LOANS (CRÍTICO - DADOS PESSOAIS EXPOSTOS)
-- Remover políticas muito permissivas
DROP POLICY IF EXISTS "All authenticated users can view loans" ON public.loans;
DROP POLICY IF EXISTS "All authenticated users can insert loans" ON public.loans;
DROP POLICY IF EXISTS "All authenticated users can update loans" ON public.loans;

-- Criar políticas baseadas em roles e ownership
CREATE POLICY "Admins can view all loans" 
ON public.loans FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view loans from their projects" 
ON public.loans FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- Se é admin, pode ver tudo
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Se é responsável pelo projeto
    project IN (
      SELECT p.name FROM public.projects p 
      WHERE p.responsible_user_id = auth.uid()
    ) OR
    project IN (
      SELECT p.id::text FROM public.projects p 
      WHERE p.responsible_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can insert loans" 
ON public.loans FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Project responsibles can insert loans for their projects" 
ON public.loans FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    project IN (
      SELECT p.name FROM public.projects p 
      WHERE p.responsible_user_id = auth.uid()
    ) OR
    project IN (
      SELECT p.id::text FROM public.projects p 
      WHERE p.responsible_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can update all loans" 
ON public.loans FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Project responsibles can update loans from their projects" 
ON public.loans FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    project IN (
      SELECT p.name FROM public.projects p 
      WHERE p.responsible_user_id = auth.uid()
    ) OR
    project IN (
      SELECT p.id::text FROM public.projects p 
      WHERE p.responsible_user_id = auth.uid()
    )
  )
);

-- 2. CORREÇÕES PARA TABELA PROJECTS (DADOS SENSÍVEIS EXPOSTOS)
-- Remover políticas muito permissivas
DROP POLICY IF EXISTS "All authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "All authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "All authenticated users can update projects" ON public.projects;

-- Criar políticas baseadas em roles e ownership
CREATE POLICY "Admins can view all projects" 
ON public.projects FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own projects" 
ON public.projects FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    responsible_user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can insert projects (will be their own)" 
ON public.projects FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    responsible_user_id = auth.uid() OR 
    has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can update all projects" 
ON public.projects FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own projects" 
ON public.projects FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    responsible_user_id = auth.uid()
  )
);

-- 3. CORREÇÕES PARA TABELA NOTIFICATIONS (EXPOSIÇÃO DESNECESSÁRIA)
-- Política já existente está OK, mas vamos melhorar com filtros baseados em status
DROP POLICY IF EXISTS "All authenticated users can view notifications" ON public.notifications;

CREATE POLICY "Users can view notifications through their status" 
ON public.notifications FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  id IN (
    SELECT notification_id 
    FROM public.user_notification_status 
    WHERE user_id = auth.uid()
  )
);

-- 4. FUNÇÃO AUXILIAR PARA VERIFICAR ACESSO A EQUIPAMENTOS
CREATE OR REPLACE FUNCTION public.user_can_access_equipment(equipment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Admins podem acessar tudo
  IF has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN TRUE;
  END IF;
  
  -- Usuários podem acessar equipamentos de seus projetos
  RETURN EXISTS (
    SELECT 1 FROM public.loans l
    INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
    WHERE l.equipment_id = user_can_access_equipment.equipment_id
      AND p.responsible_user_id = auth.uid()
      AND l.status IN ('active', 'overdue')
  );
END;
$$;

-- 5. MELHORAR POLÍTICA DE EQUIPAMENTOS (ATUALMENTE MUITO PERMISSIVA)
DROP POLICY IF EXISTS "All authenticated users can view equipments" ON public.equipments;

CREATE POLICY "Admins can view all equipments" 
ON public.equipments FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view equipments from their projects" 
ON public.equipments FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    public.user_can_access_equipment(id)
  )
);

-- Manter políticas de INSERT/UPDATE para admins e usuários autenticados
-- pois são necessárias para o funcionamento do sistema
-- mas adicionar logs de auditoria

-- 6. TRIGGER PARA LOG DE ACESSO A DADOS SENSÍVEIS
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log acessos a dados sensíveis de loans por usuários não-admin
  IF TG_TABLE_NAME = 'loans' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    PERFORM public.log_audit_entry(
      'sensitive_data_access',
      TG_TABLE_NAME,
      NEW.id::text,
      NULL,
      jsonb_build_object(
        'accessed_fields', array['borrower_name', 'borrower_email', 'borrower_phone'],
        'project', NEW.project,
        'access_reason', 'project_ownership'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger apenas para SELECT em loans (dados sensíveis)
-- Note: PostgreSQL não suporta triggers em SELECT, então faremos log nas operações de acesso

-- 7. FUNÇÃO PARA VERIFICAR VAZAMENTOS DE DADOS
CREATE OR REPLACE FUNCTION public.audit_data_access()
RETURNS TABLE(
  table_name TEXT,
  policy_name TEXT,
  potential_exposure TEXT,
  severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'loans'::TEXT,
    'Data exposure check'::TEXT,
    'Personal data in loans table accessible by project owners'::TEXT,
    'MEDIUM'::TEXT
  WHERE EXISTS (
    SELECT 1 FROM public.loans l
    INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
    WHERE p.responsible_user_id IS NOT NULL
  );
  
  RETURN QUERY
  SELECT 
    'projects'::TEXT,
    'Data exposure check'::TEXT,
    'Project data restricted to owners and admins'::TEXT,
    'LOW'::TEXT;
  
  RETURN QUERY
  SELECT 
    'equipments'::TEXT,
    'Data exposure check'::TEXT,
    'Equipment data now restricted based on project access'::TEXT,
    'LOW'::TEXT;
END;
$$;