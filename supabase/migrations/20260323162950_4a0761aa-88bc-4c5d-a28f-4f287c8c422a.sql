ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type = ANY (ARRAY['project'::text, 'equipment'::text, 'loan'::text, 'system'::text, 'task'::text, 'av_project'::text]));