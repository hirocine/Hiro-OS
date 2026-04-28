ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.last_seen_at IS 'Última vez que o usuário foi visto ativo no sistema. Atualizado pelo cliente via AuthContext (throttle 5min).';

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON public.profiles(last_seen_at DESC NULLS LAST);

DROP FUNCTION IF EXISTS public.get_users_for_admin();

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
AS $function$
  SELECT
    p.user_id as id,
    au.email,
    COALESCE(p.display_name, 'Usuário Anônimo') as display_name,
    COALESCE(p."position", 'Não informado') as "position",
    COALESCE(p.department, 'Não informado') as department,
    p.created_at,
    COALESCE(ur.role, 'user'::app_role) as role,
    COALESCE(p.last_seen_at, au.last_sign_in_at) as last_sign_in_at,
    au.email_confirmed_at,
    NOT au.banned_until IS NOT NULL as is_active
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  ORDER BY p.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
     SET last_seen_at = now()
   WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.update_last_seen IS 'Atualiza o last_seen_at do usuário autenticado. Chamada pelo cliente com throttle de 5min via AuthContext.';

GRANT EXECUTE ON FUNCTION public.update_last_seen() TO authenticated;