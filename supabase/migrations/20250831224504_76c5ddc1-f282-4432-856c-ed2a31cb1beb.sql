-- Fix the projects step constraint to include all valid steps
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_step_check;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_step_check 
CHECK (step = ANY (ARRAY[
  'pending_separation'::text, 
  'separated'::text, 
  'ready_for_pickup'::text,
  'in_use'::text, 
  'pending_verification'::text, 
  'verified'::text
]));