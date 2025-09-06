-- Fix function search path security issue
-- Update existing functions to have proper search_path set

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE WHEN role = 'admin' THEN 1 ELSE 2 END
  LIMIT 1
$$;

-- Fix user_can_access_equipment function
CREATE OR REPLACE FUNCTION public.user_can_access_equipment(equipment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix other security definer functions
CREATE OR REPLACE FUNCTION public.get_equipment_project_count(equipment_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT p.id)
    FROM projects p
    WHERE p.id = ANY(
      SELECT DISTINCT l.project::UUID
      FROM loans l
      WHERE l.equipment_id = get_equipment_project_count.equipment_id
        AND l.status = 'active'
        AND l.project IS NOT NULL
    )
    AND p.status = 'active'
  );
END;
$$;