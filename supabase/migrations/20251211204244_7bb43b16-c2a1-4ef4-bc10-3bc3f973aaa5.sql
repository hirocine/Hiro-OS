-- Trigger para notificações de tarefas
CREATE OR REPLACE FUNCTION public.handle_task_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _action_user_id UUID;
  _action_user_name TEXT;
  _assigned_user_name TEXT;
BEGIN
  _action_user_id := auth.uid();
  
  -- Buscar nome do usuário que fez a ação
  SELECT COALESCE(p.display_name, au.email)
  INTO _action_user_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE au.id = _action_user_id;

  -- Tarefa criada (apenas tarefas públicas)
  IF TG_OP = 'INSERT' AND NOT NEW.is_private THEN
    PERFORM public.create_notification_for_all_users(
      'Nova tarefa criada',
      'A tarefa "' || NEW.title || '" foi criada por ' || COALESCE(_action_user_name, 'usuário anônimo'),
      'task',
      'tasks',
      NEW.id,
      _action_user_id
    );
  END IF;

  -- Tarefa atualizada
  IF TG_OP = 'UPDATE' AND NOT NEW.is_private THEN
    -- Tarefa concluída
    IF OLD.status != 'concluida' AND NEW.status = 'concluida' THEN
      PERFORM public.create_notification_for_all_users(
        'Tarefa concluída ✅',
        'A tarefa "' || NEW.title || '" foi concluída por ' || COALESCE(_action_user_name, 'usuário anônimo'),
        'task',
        'tasks',
        NEW.id,
        _action_user_id
      );
    END IF;

    -- Tarefa atribuída a alguém
    IF (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) AND NEW.assigned_to IS NOT NULL THEN
      -- Buscar nome do usuário atribuído
      SELECT COALESCE(p.display_name, au.email)
      INTO _assigned_user_name
      FROM auth.users au
      LEFT JOIN public.profiles p ON p.user_id = au.id
      WHERE au.id = NEW.assigned_to;
      
      PERFORM public.create_notification_for_all_users(
        'Tarefa atribuída',
        'A tarefa "' || NEW.title || '" foi atribuída a ' || COALESCE(_assigned_user_name, 'usuário') || ' por ' || COALESCE(_action_user_name, 'usuário anônimo'),
        'task',
        'tasks',
        NEW.id,
        _action_user_id
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Criar trigger para tarefas
DROP TRIGGER IF EXISTS on_task_change ON tasks;
CREATE TRIGGER on_task_change
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_notifications();

-- Trigger para notificações de projetos audiovisuais
CREATE OR REPLACE FUNCTION public.handle_av_project_notifications()
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
      'Novo projeto AV criado 🎬',
      'O projeto "' || NEW.name || '" foi criado por ' || COALESCE(_action_user_name, 'usuário anônimo'),
      'av_project',
      'audiovisual_projects',
      NEW.id,
      _action_user_id
    );
  END IF;

  -- Projeto atualizado
  IF TG_OP = 'UPDATE' THEN
    -- Mudança de status para concluído
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      PERFORM public.create_notification_for_all_users(
        'Projeto AV concluído 🎉',
        'O projeto "' || NEW.name || '" foi concluído por ' || COALESCE(_action_user_name, 'usuário anônimo'),
        'av_project',
        'audiovisual_projects',
        NEW.id,
        _action_user_id
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Criar trigger para projetos AV
DROP TRIGGER IF EXISTS on_av_project_change ON audiovisual_projects;
CREATE TRIGGER on_av_project_change
  AFTER INSERT OR UPDATE ON audiovisual_projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_av_project_notifications();