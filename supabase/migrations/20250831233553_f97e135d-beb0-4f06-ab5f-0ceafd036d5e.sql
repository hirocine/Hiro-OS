-- Remove duplicate triggers that are causing conflicts during project deletion
-- These triggers are all executing the same sync_project_equipment function
-- causing "tuple to be deleted was already modified" errors

DROP TRIGGER IF EXISTS sync_project_equipment_on_delete ON public.loans;
DROP TRIGGER IF EXISTS sync_project_equipment_on_insert ON public.loans; 
DROP TRIGGER IF EXISTS sync_project_equipment_on_update ON public.loans;

-- Ensure we have the main trigger that handles all events
-- This trigger should already exist, but we'll recreate it to be sure
DROP TRIGGER IF EXISTS sync_project_equipment_trigger ON public.loans;

CREATE TRIGGER sync_project_equipment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_equipment();

-- Also ensure the cleanup trigger exists for project deletions
DROP TRIGGER IF EXISTS cleanup_loans_on_project_delete ON public.projects;

CREATE TRIGGER cleanup_loans_on_project_delete
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_project_loans();