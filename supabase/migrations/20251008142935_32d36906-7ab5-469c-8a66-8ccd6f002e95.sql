-- Security Fix 1: Remove public access to equipments table
-- This fixes CRITICAL vulnerability: PUBLIC_EQUIPMENT_DATA
DROP POLICY IF EXISTS "Allow unauthenticated users to view equipments (temporary)" ON public.equipments;

-- Security Fix 2: Require authentication for equipment categories
-- This fixes INFO vulnerability: equipment_categories_overly_permissive
DROP POLICY IF EXISTS "All authenticated users can view categories" ON public.equipment_categories;

CREATE POLICY "Authenticated users can view categories"
ON public.equipment_categories
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Security Fix 3: Allow project responsibles to access their borrower contacts
-- This fixes WARN vulnerability: borrower_contacts_missing_user_access
CREATE POLICY "Project responsibles can view their borrower contacts"
ON public.borrower_contacts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  loan_id IN (
    SELECT l.id 
    FROM public.loans l
    INNER JOIN public.projects p ON (l.project = p.name OR l.project = p.id::text)
    WHERE p.responsible_user_id = auth.uid()
  )
);

-- Add comment for audit trail
COMMENT ON POLICY "Project responsibles can view their borrower contacts" ON public.borrower_contacts 
IS 'Allows project responsibles to access contact information for borrowers in their projects while maintaining data privacy';