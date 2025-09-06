-- Fix all remaining functions with search_path security issues
-- This includes all function types that need explicit search_path

-- Fix all remaining trigger and notification functions
CREATE OR REPLACE FUNCTION public.handle_project_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _action_user_id UUID;
  _action_user_name TEXT;
BEGIN
  _action_user_id := auth.uid();
  
  -- Buscar nome do usuário que fez a ação
  SELECT COALESCE(p.display_name, au.email)
  INTO _action_user_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE au.id = _action_user_id;

  -- Projeto criado
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification_for_all_users(
      'Novo projeto criado',
      'O projeto "' || NEW.name || '" foi criado por ' || COALESCE(_action_user_name, 'usuário anônimo'),
      'project',
      'projects',
      NEW.id,
      _action_user_id
    );
  END IF;

  -- Projeto atualizado
  IF TG_OP = 'UPDATE' THEN
    -- Mudança de status
    IF OLD.status != NEW.status THEN
      PERFORM public.create_notification_for_all_users(
        'Status do projeto alterado',
        'O projeto "' || NEW.name || '" mudou para ' || NEW.status || ' por ' || COALESCE(_action_user_name, 'usuário anônimo'),
        'project',
        'projects',
        NEW.id,
        _action_user_id
      );
    END IF;
    
    -- Mudança de step
    IF OLD.step != NEW.step THEN
      PERFORM public.create_notification_for_all_users(
        'Etapa do projeto atualizada',
        'O projeto "' || NEW.name || '" mudou para etapa ' || NEW.step || ' por ' || COALESCE(_action_user_name, 'usuário anônimo'),
        'project',
        'projects',
        NEW.id,
        _action_user_id
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix sync functions
CREATE OR REPLACE FUNCTION public.sync_project_equipment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;