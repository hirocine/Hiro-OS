-- Create a function to get users with emails for admin (escaped keywords)
CREATE OR REPLACE FUNCTION public.get_users_for_admin()
RETURNS TABLE(
  id uuid,
  email text,
  display_name text,
  "position" text,
  department text,
  created_at timestamptz,
  role app_role
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
    COALESCE(ur.role, 'user'::app_role) as role
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  ORDER BY p.created_at DESC;
$$;