-- Better approach: modify the validation function to skip validation during cleanup
DROP FUNCTION IF EXISTS public.cleanup_project_loans_direct(text, text);

-- Modify the cleanup function to use session variables to bypass validation
CREATE OR REPLACE FUNCTION public.cleanup_project_loans()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set a session variable to indicate we're in cleanup mode
  PERFORM set_config('app.in_project_cleanup', 'true', true);
  
  -- Return all equipment from the deleted project
  UPDATE loans 
  SET status = 'returned',
      actual_return_date = CURRENT_DATE,
      return_notes = 'Equipamento retornado automaticamente - projeto deletado',
      return_condition = 'good'
  WHERE (project = OLD.name OR project = OLD.id::text)
    AND status IN ('active', 'overdue');
  
  -- Reset the session variable
  PERFORM set_config('app.in_project_cleanup', 'false', true);
  
  RETURN OLD;
END;
$$;

-- Modify the validation function to skip validation during cleanup
CREATE OR REPLACE FUNCTION public.validate_project_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip validation if we're in project cleanup mode
  IF current_setting('app.in_project_cleanup', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se o projeto existe
  IF NOT EXISTS (
    SELECT 1 FROM projects 
    WHERE name = NEW.project OR id::text = NEW.project
  ) THEN
    RAISE EXCEPTION 'Projeto "%" não encontrado', NEW.project;
  END IF;
  
  RETURN NEW;
END;
$$;