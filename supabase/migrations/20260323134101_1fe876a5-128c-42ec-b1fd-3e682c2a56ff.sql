
-- Insert Pedro as assignee for all his tasks (where he is the creator)
-- This ensures his tasks appear in the "Minhas" tab
INSERT INTO public.task_assignees (task_id, user_id)
SELECT id, 'b10e9d32-47c2-4411-a5bf-6007d6eb0772'::uuid
FROM public.tasks
WHERE created_by = 'b10e9d32-47c2-4411-a5bf-6007d6eb0772'
ON CONFLICT DO NOTHING;
