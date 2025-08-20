-- Sistema de Notificações Completo

-- 1. Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('project', 'equipment', 'loan', 'system')),
  related_entity TEXT CHECK (related_entity IN ('projects', 'equipments', 'loans')),
  entity_id UUID,
  responsible_user_id UUID REFERENCES auth.users(id),
  responsible_user_name TEXT,
  responsible_user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Criar tabela de status de notificações por usuário
CREATE TABLE public.user_notification_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- 3. Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_status ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para notifications
CREATE POLICY "All authenticated users can view notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update notifications" 
ON public.notifications 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Políticas RLS para user_notification_status
CREATE POLICY "Users can view their own notification status" 
ON public.user_notification_status 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification status" 
ON public.user_notification_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification status" 
ON public.user_notification_status 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification status for all users" 
ON public.user_notification_status 
FOR INSERT 
WITH CHECK (true);

-- 6. Função para criar notificação para todos os usuários
CREATE OR REPLACE FUNCTION public.create_notification_for_all_users(
  _title TEXT,
  _description TEXT DEFAULT NULL,
  _type TEXT DEFAULT 'system',
  _related_entity TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _responsible_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 7. Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(
  _notification_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_notification_status
  SET is_read = TRUE, read_at = now()
  WHERE user_id = auth.uid() 
    AND notification_id = _notification_id 
    AND is_read = FALSE;
END;
$$;

-- 8. Função para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated_count INTEGER;
BEGIN
  UPDATE public.user_notification_status
  SET is_read = TRUE, read_at = now()
  WHERE user_id = auth.uid() AND is_read = FALSE;
  
  GET DIAGNOSTICS _updated_count = ROW_COUNT;
  RETURN _updated_count;
END;
$$;

-- 9. Trigger para criar notificações automáticas em projetos
CREATE OR REPLACE FUNCTION public.handle_project_notifications()
RETURNS TRIGGER
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

-- 10. Criar trigger para projetos
CREATE TRIGGER project_notifications_trigger
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_project_notifications();

-- 11. Trigger para criar notificações automáticas em empréstimos
CREATE OR REPLACE FUNCTION public.handle_loan_notifications()
RETURNS TRIGGER
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
$$;

-- 12. Criar trigger para empréstimos
CREATE TRIGGER loan_notifications_trigger
  AFTER INSERT OR UPDATE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_loan_notifications();

-- 13. Habilitar realtime para as tabelas
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.user_notification_status REPLICA IDENTITY FULL;

-- 14. Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification_status;

-- 15. Trigger para atualizar updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Criar índices para performance
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_user_notification_status_user_read ON public.user_notification_status(user_id, is_read);
CREATE INDEX idx_user_notification_status_notification ON public.user_notification_status(notification_id);