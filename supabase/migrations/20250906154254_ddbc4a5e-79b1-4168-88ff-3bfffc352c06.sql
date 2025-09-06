-- Finalização da ETAPA 1: Correção das últimas funções SECURITY DEFINER

-- 31. get_current_user_role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE WHEN role = 'admin' THEN 1 ELSE 2 END
  LIMIT 1
$function$;

-- 32. get_users_for_admin
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
 RETURNS TABLE(id uuid, email text, display_name text, "position" text, department text, created_at timestamp with time zone, role app_role, last_sign_in_at timestamp with time zone, email_confirmed_at timestamp with time zone, is_active boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.user_id as id,
    au.email,
    COALESCE(p.display_name, 'Usuário Anônimo') as display_name,
    COALESCE(p."position", 'Não informado') as "position",
    COALESCE(p.department, 'Não informado') as department,
    p.created_at,
    COALESCE(ur.role, 'user'::app_role) as role,
    au.last_sign_in_at,
    au.email_confirmed_at,
    NOT au.banned_until IS NOT NULL as is_active
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  ORDER BY p.created_at DESC;
$function$;

-- 33. manual_sync_equipment_status
CREATE OR REPLACE FUNCTION public.manual_sync_equipment_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Corrigir equipamentos com referências órfãs
  UPDATE equipments 
  SET 
    current_loan_id = NULL,
    current_borrower = NULL,
    simplified_status = 'available'
  WHERE current_loan_id IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM loans 
      WHERE loans.id = equipments.current_loan_id
      AND loans.status IN ('active', 'overdue')
    );
  
  -- Corrigir equipamentos sem empréstimos ativos mas marcados como in_project
  UPDATE equipments 
  SET simplified_status = 'available'
  WHERE simplified_status = 'in_project'
    AND NOT EXISTS (
      SELECT 1 FROM loans 
      WHERE loans.equipment_id = equipments.id 
      AND loans.status IN ('active', 'overdue')
    );
  
  -- Atualizar equipamentos que deveriam ter referências atualizadas
  UPDATE equipments 
  SET 
    current_loan_id = l.id,
    current_borrower = l.borrower_name,
    last_loan_date = l.loan_date,
    simplified_status = 'in_project'
  FROM (
    SELECT DISTINCT ON (equipment_id) 
      id, equipment_id, borrower_name, loan_date
    FROM loans 
    WHERE status IN ('active', 'overdue')
    ORDER BY equipment_id, loan_date DESC
  ) l
  WHERE equipments.id = l.equipment_id
    AND (
      equipments.current_loan_id IS NULL 
      OR equipments.current_loan_id != l.id
      OR equipments.simplified_status != 'in_project'
    );
END;
$function$;

-- 34. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, position, department)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'position',
    NEW.raw_user_meta_data ->> 'department'
  );
  RETURN NEW;
END;
$function$;