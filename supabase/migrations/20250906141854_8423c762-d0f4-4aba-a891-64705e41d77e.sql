-- Fix remaining functions that need search_path security fixes
-- Update all trigger functions and other security definer functions

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, position, department)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'position',
    NEW.raw_user_meta_data ->> 'department'
  );
  RETURN NEW;
END;
$$;

-- Fix handle_new_user_role function  
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_project_name function
CREATE OR REPLACE FUNCTION public.update_project_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If we have the new fields, construct the name from them
  IF NEW.project_number IS NOT NULL AND NEW.company IS NOT NULL AND NEW.project_name IS NOT NULL THEN
    NEW.name = NEW.project_number || ' - ' || NEW.company || ': ' || NEW.project_name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix log_audit_entry function
CREATE OR REPLACE FUNCTION public.log_audit_entry(_action text, _table_name text, _record_id text DEFAULT NULL::text, _old_values jsonb DEFAULT NULL::jsonb, _new_values jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;