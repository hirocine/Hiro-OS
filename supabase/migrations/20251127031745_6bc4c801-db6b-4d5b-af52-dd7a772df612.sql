-- Remove the is_team_task column from tasks table
-- This column was used to mark tasks as visible to "Time Hiro" (team tasks)
-- but is no longer needed after the redesign where all tasks are visible to all users

ALTER TABLE tasks DROP COLUMN IF EXISTS is_team_task;