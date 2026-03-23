
-- Drop the broken policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view public or own private tasks" ON public.tasks;

-- Create a single correct SELECT policy
-- A user can see a task if they created it OR are assigned to it via task_assignees
CREATE POLICY "Users can view accessible tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.task_assignees ta
      WHERE ta.task_id = tasks.id AND ta.user_id = auth.uid()
    )
  );
