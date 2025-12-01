-- Create task_links table for external file links (Google Drive, Dropbox, etc.)
CREATE TABLE public.task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'other',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies (following task_attachments pattern)
CREATE POLICY "Users can view links on accessible tasks"
  ON public.task_links FOR SELECT
  USING (can_access_task(task_id));

CREATE POLICY "Users can insert links on accessible tasks"
  ON public.task_links FOR INSERT
  WITH CHECK (can_access_task(task_id) AND created_by = auth.uid());

CREATE POLICY "Users can delete their own links or admin"
  ON public.task_links FOR DELETE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Index for performance
CREATE INDEX idx_task_links_task_id ON public.task_links(task_id);