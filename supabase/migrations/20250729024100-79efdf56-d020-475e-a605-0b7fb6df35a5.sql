-- Fix function search path mutable warning
-- Update existing functions to have proper search_path set

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS role_change_audit_trigger ON public.user_roles;
CREATE TRIGGER role_change_audit_trigger
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- Update other functions to have proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE WHEN role = 'admin' THEN 1 ELSE 2 END
  LIMIT 1
$$;