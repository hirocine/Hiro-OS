-- ETAPA 1: Correção do Search Path em todas as funções SECURITY DEFINER
-- Esta correção resolve a vulnerabilidade crítica "Function Search Path Mutable"

-- 1. check_password_security
CREATE OR REPLACE FUNCTION public.check_password_security()
 RETURNS TABLE(setting_name text, status text, recommendation text, priority text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return recommendations for password security
  RETURN QUERY
  SELECT 
    'Password Strength Validation'::TEXT as setting_name,
    'Client-side validation implemented'::TEXT as status,
    'Robust password validation now active'::TEXT as recommendation,
    'COMPLETED'::TEXT as priority;
    
  RETURN QUERY
  SELECT 
    'Input Sanitization'::TEXT as setting_name,
    'Enhanced sanitization implemented'::TEXT as status,
    'All user inputs now sanitized against XSS'::TEXT as recommendation,
    'COMPLETED'::TEXT as priority;
    
  RETURN QUERY
  SELECT 
    'Secure File Upload'::TEXT as setting_name,
    'Validation and sanitization active'::TEXT as status,
    'File uploads now have security checks'::TEXT as recommendation,
    'COMPLETED'::TEXT as priority;
END;
$function$;

-- 2. create_notification_for_all_users
CREATE OR REPLACE FUNCTION public.create_notification_for_all_users(_title text, _description text DEFAULT NULL::text, _type text DEFAULT 'system'::text, _related_entity text DEFAULT NULL::text, _entity_id uuid DEFAULT NULL::uuid, _responsible_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _notification_id UUID;
  _responsible_name TEXT;
  _responsible_email TEXT;
  _user_record RECORD;
BEGIN
  -- Buscar dados do usuário responsável se fornecido
  IF _responsible_user_id IS NOT NULL THEN
    SELECT 
      COALESCE(p.display_name, au.email) as name,
      au.email
    INTO _responsible_name, _responsible_email
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE au.id = _responsible_user_id;
  END IF;

  -- Criar a notificação
  INSERT INTO public.notifications (
    title, description, type, related_entity, entity_id,
    responsible_user_id, responsible_user_name, responsible_user_email
  ) VALUES (
    _title, _description, _type, _related_entity, _entity_id,
    _responsible_user_id, _responsible_name, _responsible_email
  ) RETURNING id INTO _notification_id;

  -- Criar status para todos os usuários ativos
  FOR _user_record IN (
    SELECT DISTINCT au.id 
    FROM auth.users au 
    WHERE au.banned_until IS NULL OR au.banned_until < now()
  ) LOOP
    INSERT INTO public.user_notification_status (user_id, notification_id)
    VALUES (_user_record.id, _notification_id)
    ON CONFLICT (user_id, notification_id) DO NOTHING;
  END LOOP;

  RETURN _notification_id;
END;
$function$;

-- 3. mark_notification_as_read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(_notification_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_notification_status
  SET is_read = TRUE, read_at = now()
  WHERE user_id = auth.uid() 
    AND notification_id = _notification_id 
    AND is_read = FALSE;
END;
$function$;

-- 4. mark_all_notifications_as_read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _updated_count INTEGER;
BEGIN
  UPDATE public.user_notification_status
  SET is_read = TRUE, read_at = now()
  WHERE user_id = auth.uid() AND is_read = FALSE;
  
  GET DIAGNOSTICS _updated_count = ROW_COUNT;
  RETURN _updated_count;
END;
$function$;

-- 5. handle_loan_notifications
CREATE OR REPLACE FUNCTION public.handle_loan_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Empréstimo criado
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification_for_all_users(
      'Novo empréstimo registrado',
      'Equipamento "' || NEW.equipment_name || '" emprestado para ' || NEW.borrower_name || ' por ' || COALESCE(_action_user_name, 'usuário anônimo'),
      'loan',
      'loans',
      NEW.id,
      _action_user_id
    );
  END IF;

  -- Empréstimo retornado
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status = 'returned' THEN
    PERFORM public.create_notification_for_all_users(
      'Equipamento devolvido',
      'Equipamento "' || NEW.equipment_name || '" foi devolvido por ' || NEW.borrower_name,
      'loan',
      'loans',
      NEW.id,
      _action_user_id
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 6. user_can_access_equipment
CREATE OR REPLACE FUNCTION public.user_can_access_equipment(equipment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 7. update_project_name
CREATE OR REPLACE FUNCTION public.update_project_name()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If we have the new fields, construct the name from them
  IF NEW.project_number IS NOT NULL AND NEW.company IS NOT NULL AND NEW.project_name IS NOT NULL THEN
    NEW.name = NEW.project_number || ' - ' || NEW.company || ': ' || NEW.project_name;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 8. log_audit_entry
CREATE OR REPLACE FUNCTION public.log_audit_entry(_action text, _table_name text, _record_id text DEFAULT NULL::text, _old_values jsonb DEFAULT NULL::jsonb, _new_values jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _user_email TEXT;
BEGIN
  SELECT auth.uid() INTO _user_id;
  
  IF _user_id IS NOT NULL THEN
    SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  END IF;
  
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  )
  VALUES (
    _user_id,
    _user_email,
    _action,
    _table_name,
    _record_id,
    _old_values,
    _new_values
  );
END;
$function$;

-- 9. handle_project_notifications
CREATE OR REPLACE FUNCTION public.handle_project_notifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 10. update_equipment_simplified_status
CREATE OR REPLACE FUNCTION public.update_equipment_simplified_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Atualizar status do equipamento baseado em loans
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status IN ('active', 'overdue') THEN
      UPDATE public.equipments 
      SET simplified_status = 'in_project'
      WHERE id = NEW.equipment_id;
    ELSIF NEW.status = 'returned' THEN
      -- Verificar se não há outros loans ativos para este equipamento
      IF NOT EXISTS (
        SELECT 1 FROM public.loans 
        WHERE equipment_id = NEW.equipment_id 
        AND status IN ('active', 'overdue')
        AND id != NEW.id
      ) THEN
        UPDATE public.equipments 
        SET simplified_status = 'available'
        WHERE id = NEW.equipment_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Ao deletar loan, verificar se equipamento deve voltar a disponível
    IF NOT EXISTS (
      SELECT 1 FROM public.loans 
      WHERE equipment_id = OLD.equipment_id 
      AND status IN ('active', 'overdue')
    ) THEN
      UPDATE public.equipments 
      SET simplified_status = 'available'
      WHERE id = OLD.equipment_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;