CREATE OR REPLACE FUNCTION public.has_marketing_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('marketing'::app_role, 'producao'::app_role, 'admin'::app_role)
  );
$$;

COMMENT ON FUNCTION public.has_marketing_access IS 'Retorna TRUE se o usuário tem qualquer role com acesso a Marketing';