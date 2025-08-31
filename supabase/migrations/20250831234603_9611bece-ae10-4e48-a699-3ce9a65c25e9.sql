-- Fix project deletion trigger conflict by changing from BEFORE to AFTER DELETE
-- and adjusting the cleanup logic

DROP TRIGGER IF EXISTS cleanup_loans_on_project_delete ON public.projects;

-- Create the trigger as AFTER DELETE to avoid conflicts
CREATE TRIGGER cleanup_loans_on_project_delete
  AFTER DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_project_loans();

-- Update the cleanup function to work with AFTER DELETE
-- Store project info in a variable before deletion
CREATE OR REPLACE FUNCTION public.cleanup_project_loans()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_name_val TEXT;
  project_id_val UUID;
BEGIN
  -- For AFTER DELETE, use OLD to get the deleted project data
  project_name_val := OLD.name;
  project_id_val := OLD.id;
  
  -- Set a session variable to indicate we're in cleanup mode
  PERFORM set_config('app.in_project_cleanup', 'true', true);
  
  -- Return all equipment from the deleted project
  -- Use both project name and ID for matching
  UPDATE loans 
  SET status = 'returned',
      actual_return_date = CURRENT_DATE,
      return_notes = 'Equipamento retornado automaticamente - projeto deletado',
      return_condition = 'good'
  WHERE (project = project_name_val OR project = project_id_val::text)
    AND status IN ('active', 'overdue');
  
  -- Reset the session variable
  PERFORM set_config('app.in_project_cleanup', 'false', true);
  
  RETURN OLD;
END;
$$;