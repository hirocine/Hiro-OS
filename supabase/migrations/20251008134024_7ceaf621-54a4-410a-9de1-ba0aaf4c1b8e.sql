-- Drop e recriar a função get_users_for_admin para incluir avatar_url
DROP FUNCTION IF EXISTS public.get_users_for_admin();

CREATE FUNCTION public.get_users_for_admin()
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
  is_active boolean,
  avatar_url text
)
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
    NOT au.banned_until IS NOT NULL as is_active,
    p.avatar_url
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  ORDER BY p.created_at DESC;
$function$;