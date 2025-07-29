-- Remover função existente
DROP FUNCTION public.get_users_for_admin();

-- Recriar função com novos campos
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(
  id uuid, 
  email text, 
  display_name text, 
  "position" text, 
  department text, 
  created_at timestamp with time zone, 
  role app_role,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Função para desativar usuário
CREATE OR REPLACE FUNCTION public.deactivate_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;