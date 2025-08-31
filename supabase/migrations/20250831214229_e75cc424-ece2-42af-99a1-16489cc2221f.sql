-- Remove restrictive triggers and functions that prevent multiple loans
-- Update the sync function to be informative rather than restrictive

-- Drop existing restrictive triggers
DROP TRIGGER IF EXISTS sync_equipment_loan_status_trigger ON loans;
DROP TRIGGER IF EXISTS update_equipment_simplified_status_trigger ON equipments;

-- Update the sync function to allow multiple active loans
CREATE OR REPLACE FUNCTION sync_equipment_loan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update equipment info for reference, don't restrict availability
  -- Update current_borrower to show the most recent borrower for display
  -- Update current_loan_id to the most recent active loan
  
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE equipments 
    SET 
      current_borrower = NEW.borrower_name,
      current_loan_id = NEW.id,
      last_loan_date = NEW.loan_date,
      -- Keep simplified_status as 'available' - equipment can be in multiple projects
      simplified_status = 'available'
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
        ),
        simplified_status = 'available'  -- Always keep as available
      WHERE id = NEW.equipment_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with new non-restrictive function
CREATE TRIGGER sync_equipment_loan_status_trigger
  AFTER INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION sync_equipment_loan_status();

-- Create helper function to count active projects for an equipment
CREATE OR REPLACE FUNCTION get_equipment_project_count(equipment_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT p.id)
    FROM projects p
    WHERE p.id = ANY(
      SELECT DISTINCT l.project::UUID
      FROM loans l
      WHERE l.equipment_id = get_equipment_project_count.equipment_id
        AND l.status = 'active'
        AND l.project IS NOT NULL
    )
    AND p.status = 'active'
  );
END;
$$ LANGUAGE plpgsql;

-- Update all existing equipment to be available
UPDATE equipments SET simplified_status = 'available' WHERE simplified_status != 'maintenance';