
-- 1. Create task_assignees junction table
CREATE TABLE public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function to check task visibility (avoids recursion)
CREATE OR REPLACE FUNCTION public.can_see_task(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks WHERE id = _task_id AND created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.task_assignees WHERE task_id = _task_id AND user_id = _user_id
  )
$$;

-- 4. RLS policies for task_assignees
CREATE POLICY "Users can view assignees of their tasks"
ON public.task_assignees FOR SELECT TO authenticated
USING (public.can_see_task(auth.uid(), task_id));

CREATE POLICY "Users can manage assignees of tasks they created or are assigned to"
ON public.task_assignees FOR INSERT TO authenticated
WITH CHECK (public.can_see_task(auth.uid(), task_id));

CREATE POLICY "Users can delete assignees of tasks they can see"
ON public.task_assignees FOR DELETE TO authenticated
USING (public.can_see_task(auth.uid(), task_id));

-- 5. Drop existing RLS policies on tasks table and recreate for new visibility model
DROP POLICY IF EXISTS "Users can view non-private tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their private tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "authenticated_select" ON public.tasks;

-- New SELECT policy: user sees tasks they created OR are assigned to
CREATE POLICY "Users can view own tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.task_assignees WHERE task_id = id AND user_id = auth.uid()
  )
);

-- 6. Migrate existing assigned_to data to task_assignees
INSERT INTO public.task_assignees (task_id, user_id)
SELECT id, assigned_to FROM public.tasks WHERE assigned_to IS NOT NULL
ON CONFLICT (task_id, user_id) DO NOTHING;
