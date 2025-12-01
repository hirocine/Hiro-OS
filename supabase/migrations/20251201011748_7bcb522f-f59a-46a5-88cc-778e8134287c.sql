-- Create task_history table for tracking task changes
CREATE TABLE public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_task_history_task_id ON public.task_history(task_id);
CREATE INDEX idx_task_history_created_at ON public.task_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;

-- Users can view history of tasks they can access
CREATE POLICY "Users can view history of accessible tasks"
  ON public.task_history FOR SELECT
  USING (can_access_task(task_id));

-- Users can insert history on tasks they can access
CREATE POLICY "Users can insert history on accessible tasks"
  ON public.task_history FOR INSERT
  WITH CHECK (can_access_task(task_id) AND user_id = auth.uid());