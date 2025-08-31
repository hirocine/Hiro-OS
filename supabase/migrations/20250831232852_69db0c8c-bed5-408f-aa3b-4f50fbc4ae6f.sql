-- Add office_receipt to the projects step check constraint
ALTER TABLE projects 
DROP CONSTRAINT projects_step_check;

ALTER TABLE projects 
ADD CONSTRAINT projects_step_check 
CHECK (step = ANY (ARRAY[
  'pending_separation'::text, 
  'separated'::text, 
  'ready_for_pickup'::text, 
  'in_use'::text, 
  'pending_verification'::text, 
  'office_receipt'::text,
  'verified'::text
]));

-- Now fix the project step history and reset to proper step
UPDATE projects 
SET 
  step_history = '[
    {"step":"pending_separation","timestamp":"2025-08-31T21:47:11.443Z"},
    {"step":"separated","timestamp":"2025-08-31T22:05:36.181Z"},
    {"step":"ready_for_pickup","timestamp":"2025-08-31T22:47:02.596Z"},
    {"step":"in_use","timestamp":"2025-08-31T22:51:05.581Z"},
    {"step":"pending_verification","timestamp":"2025-08-31T23:06:36.665Z"},
    {"step":"office_receipt","timestamp":"2025-08-31T23:07:00.000Z"}
  ]'::jsonb,
  step = 'office_receipt',
  status = 'active',
  updated_at = now()
WHERE 
  id = '5a683917-0b0a-46c8-b22e-3a4d976bd623';