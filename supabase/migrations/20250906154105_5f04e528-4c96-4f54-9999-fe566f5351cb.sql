-- Continuação da ETAPA 1: Correção do Search Path nas funções restantes

-- 11. deactivate_user
CREATE OR REPLACE FUNCTION public.deactivate_user(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role app_role;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT public.get_current_user_role() INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem desativar usuários';
  END IF;
  
  -- Não permitir que admin desative a si mesmo
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode desativar sua própria conta';
  END IF;
  
  -- Desativar o usuário definindo banned_until para uma data futura
  UPDATE auth.users 
  SET banned_until = now() + interval '100 years'
  WHERE id = _user_id;
  
  -- Log da ação
  PERFORM public.log_audit_entry(
    'deactivate_user',
    'auth.users',
    _user_id::text,
    null,
    jsonb_build_object('deactivated_at', now())
  );
  
  RETURN true;
END;
$function$;

-- 12. get_equipment_project_count
CREATE OR REPLACE FUNCTION public.get_equipment_project_count(equipment_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 13. sync_project_equipment
CREATE OR REPLACE FUNCTION public.sync_project_equipment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  project_record RECORD;
  loan_ids_array UUID[];
  equipment_count_val INTEGER;
BEGIN
  -- Determinar qual projeto foi afetado
  IF TG_OP = 'DELETE' THEN
    -- Para DELETE, usar OLD para obter o projeto
    SELECT * INTO project_record FROM public.projects WHERE name = OLD.project OR id::text = OLD.project;
  ELSE
    -- Para INSERT/UPDATE, usar NEW
    SELECT * INTO project_record FROM public.projects WHERE name = NEW.project OR id::text = NEW.project;
  END IF;

  -- Se não encontrar o projeto, sair
  IF project_record IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Buscar todos os empréstimos ativos/em atraso do projeto
  SELECT 
    ARRAY_AGG(l.id) AS loan_ids,
    COUNT(*) AS equipment_count
  INTO loan_ids_array, equipment_count_val
  FROM public.loans l
  WHERE (l.project = project_record.name OR l.project = project_record.id::text)
    AND l.status IN ('active', 'overdue');

  -- Se não há empréstimos, definir arrays vazios
  IF loan_ids_array IS NULL THEN
    loan_ids_array := '{}';
    equipment_count_val := 0;
  END IF;

  -- Atualizar o projeto
  UPDATE public.projects 
  SET 
    equipment_count = equipment_count_val,
    loan_ids = loan_ids_array,
    updated_at = now()
  WHERE id = project_record.id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 14. get_project_equipment
CREATE OR REPLACE FUNCTION public.get_project_equipment(_project_id uuid)
 RETURNS TABLE(equipment_id uuid, equipment_name text, equipment_brand text, equipment_category text, equipment_subcategory text, equipment_custom_category text, equipment_status text, equipment_item_type text, equipment_parent_id uuid, equipment_serial_number text, equipment_purchase_date date, equipment_last_maintenance date, equipment_description text, equipment_image text, equipment_value numeric, equipment_patrimony_number text, equipment_depreciated_value numeric, equipment_receive_date date, equipment_store text, equipment_invoice text, equipment_current_loan_id uuid, equipment_current_borrower text, equipment_last_loan_date date, loan_id uuid, loan_borrower_name text, loan_date date, loan_expected_return_date date, loan_status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    e.id,
    e.name,
    e.brand,
    e.category,
    e.subcategory,
    e.custom_category,
    e.status,
    e.item_type,
    e.parent_id,
    e.serial_number,
    e.purchase_date,
    e.last_maintenance,
    e.description,
    e.image,
    e.value,
    e.patrimony_number,
    e.depreciated_value,
    e.receive_date,
    e.store,
    e.invoice,
    e.current_loan_id,
    e.current_borrower,
    e.last_loan_date,
    l.id,
    l.borrower_name,
    l.loan_date,
    l.expected_return_date,
    l.status
  FROM public.equipments e
  INNER JOIN public.loans l ON l.equipment_id = e.id
  INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
  WHERE p.id = _project_id 
    AND l.status IN ('active', 'overdue')
  ORDER BY l.loan_date DESC;
$function$;

-- 15. log_role_change
CREATE OR REPLACE FUNCTION public.log_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log role changes with enhanced security info
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'role_change',
      'user_roles',
      NEW.user_id::text,
      jsonb_build_object('old_role', OLD.role),
      jsonb_build_object('new_role', NEW.role, 'changed_user_id', NEW.user_id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 16. sync_equipment_loan_status
CREATE OR REPLACE FUNCTION public.sync_equipment_loan_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only update equipment reference fields, don't touch simplified_status
  -- Let other functions handle status logic to avoid conflicts
  
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE equipments 
    SET 
      current_borrower = NEW.borrower_name,
      current_loan_id = NEW.id,
      last_loan_date = NEW.loan_date
    WHERE id = NEW.equipment_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- When loan is returned, check if there are other active loans
    IF OLD.status = 'active' AND NEW.status = 'returned' THEN
      -- Find the most recent active loan for this equipment
      UPDATE equipments 
      SET 
        current_borrower = (
          SELECT borrower_name 
          FROM loans 
          WHERE equipment_id = NEW.equipment_id 
            AND status = 'active' 
          ORDER BY loan_date DESC, created_at DESC 
          LIMIT 1
        ),
        current_loan_id = (
          SELECT id 
          FROM loans 
          WHERE equipment_id = NEW.equipment_id 
            AND status = 'active' 
          ORDER BY loan_date DESC, created_at DESC 
          LIMIT 1
        )
      WHERE id = NEW.equipment_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Clear references if this was the current loan
    UPDATE equipments 
    SET 
      current_borrower = (
        SELECT borrower_name 
        FROM loans 
        WHERE equipment_id = OLD.equipment_id 
          AND status = 'active' 
        ORDER BY loan_date DESC, created_at DESC 
        LIMIT 1
      ),
      current_loan_id = (
        SELECT id 
        FROM loans 
        WHERE equipment_id = OLD.equipment_id 
          AND status = 'active' 
        ORDER BY loan_date DESC, created_at DESC 
        LIMIT 1
      )
    WHERE id = OLD.equipment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 17. has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- 18. handle_new_user_role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;

-- 19. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 20. get_project_loans_with_fallback
CREATE OR REPLACE FUNCTION public.get_project_loans_with_fallback(_project_id uuid)
 RETURNS TABLE(loan_id uuid, equipment_id uuid, equipment_name text, borrower_name text, loan_date date, expected_return_date date, status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    l.id,
    l.equipment_id,
    l.equipment_name,
    l.borrower_name,
    l.loan_date,
    l.expected_return_date,
    l.status
  FROM public.loans l
  INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
  WHERE p.id = _project_id 
    AND l.status IN ('active', 'overdue')
  ORDER BY l.loan_date DESC;
$function$;