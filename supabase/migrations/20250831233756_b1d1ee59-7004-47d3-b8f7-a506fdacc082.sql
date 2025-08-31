-- Fix project deletion by removing conflicting triggers and consolidating equipment update logic

-- Drop all duplicate/conflicting triggers on loans table
DROP TRIGGER IF EXISTS sync_equipment_on_loan_change ON public.loans;
DROP TRIGGER IF EXISTS update_equipment_status_trigger ON public.loans;
DROP TRIGGER IF EXISTS sync_project_equipment_on_delete ON public.loans;
DROP TRIGGER IF EXISTS sync_project_equipment_on_insert ON public.loans; 
DROP TRIGGER IF EXISTS sync_project_equipment_on_update ON public.loans;
DROP TRIGGER IF EXISTS sync_project_equipment_trigger ON public.loans;

-- Keep only the essential triggers with consolidated logic
-- 1. Equipment loan status sync (handles equipment fields)
CREATE TRIGGER sync_equipment_loan_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_equipment_loan_status();

-- 2. Project equipment sync (handles project loan_ids and equipment_count)
CREATE TRIGGER sync_project_equipment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_equipment();

-- Update the sync_equipment_loan_status function to avoid conflicts
-- Remove simplified_status updates to prevent conflicts with other triggers
CREATE OR REPLACE FUNCTION public.sync_equipment_loan_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only update equipment reference fields, don't touch simplified_status
  -- Let other functions handle status logic to avoid conflicts
  
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE equipments 
    SET 
      current_borrower = NEW.borrower_name,
      current_loan_id = NEW.id,
      last_loan_date = NEW.loan_date
    WHERE id = NEW.equipment_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- When loan is returned, check if there are other active loans
    IF OLD.status = 'active' AND NEW.status = 'returned' THEN
      -- Find the most recent active loan for this equipment
      UPDATE equipments 
      SET 
        current_borrower = (
          SELECT borrower_name 
          FROM loans 
          WHERE equipment_id = NEW.equipment_id 
            AND status = 'active' 
          ORDER BY loan_date DESC, created_at DESC 
          LIMIT 1
        ),
        current_loan_id = (
          SELECT id 
          FROM loans 
          WHERE equipment_id = NEW.equipment_id 
            AND status = 'active' 
          ORDER BY loan_date DESC, created_at DESC 
          LIMIT 1
        )
      WHERE id = NEW.equipment_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Clear references if this was the current loan
    UPDATE equipments 
    SET 
      current_borrower = (
        SELECT borrower_name 
        FROM loans 
        WHERE equipment_id = OLD.equipment_id 
          AND status = 'active' 
        ORDER BY loan_date DESC, created_at DESC 
        LIMIT 1
      ),
      current_loan_id = (
        SELECT id 
        FROM loans 
        WHERE equipment_id = OLD.equipment_id 
          AND status = 'active' 
        ORDER BY loan_date DESC, created_at DESC 
        LIMIT 1
      )
    WHERE id = OLD.equipment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Ensure project cleanup trigger exists
DROP TRIGGER IF EXISTS cleanup_loans_on_project_delete ON public.projects;

CREATE TRIGGER cleanup_loans_on_project_delete
  BEFORE DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_project_loans();