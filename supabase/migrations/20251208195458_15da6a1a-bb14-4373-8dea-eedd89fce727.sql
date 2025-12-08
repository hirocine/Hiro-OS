-- Add is_private column to tasks table
ALTER TABLE public.tasks ADD COLUMN is_private boolean DEFAULT false NOT NULL;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all tasks" ON public.tasks;

-- Create new SELECT policy: users can see public tasks OR their own private tasks
CREATE POLICY "Users can view public or own private tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  (NOT is_private) OR 
  (is_private AND created_by = auth.uid())
);

-- Update INSERT policy to ensure private tasks can only be created by the user
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON public.tasks;
CREATE POLICY "Authenticated users can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (created_by = auth.uid()) AND
  -- Private tasks cannot be assigned to others
  (NOT is_private OR assigned_to IS NULL OR assigned_to = auth.uid())
);

-- Update the UPDATE policy to handle private tasks
DROP POLICY IF EXISTS "Users can update their tasks" ON public.tasks;
CREATE POLICY "Users can update accessible tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (created_by = auth.uid()) OR 
  (assigned_to = auth.uid() AND NOT is_private)
)
WITH CHECK (
  -- Private tasks cannot be assigned to others
  (NOT is_private OR assigned_to IS NULL OR assigned_to = auth.uid())
);

-- Update can_access_task function to handle private tasks
CREATE OR REPLACE FUNCTION public.can_access_task(_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks
    WHERE id = _task_id
    AND (
      (NOT is_private) OR 
      (is_private AND created_by = auth.uid())
    )
  )
$$;