-- Fix notification foreign key ambiguity in user_notification_status table
-- This ensures only one clear FK exists between user_notification_status and notifications

-- Drop any existing FK constraints on notification_id (if they exist)
DO $$ 
BEGIN
    -- Drop all foreign key constraints on notification_id column
    EXECUTE (
        SELECT string_agg('ALTER TABLE user_notification_status DROP CONSTRAINT IF EXISTS ' || constraint_name || ';', ' ')
        FROM information_schema.table_constraints
        WHERE table_name = 'user_notification_status' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%notification%'
    );
END $$;

-- Add a single, explicitly named FK constraint
ALTER TABLE user_notification_status
ADD CONSTRAINT user_notification_status_notification_id_fkey 
FOREIGN KEY (notification_id) 
REFERENCES notifications(id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_notification_status_notification_id 
ON user_notification_status(notification_id);

-- Create index for user queries
CREATE INDEX IF NOT EXISTS idx_user_notification_status_user_id 
ON user_notification_status(user_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT user_notification_status_notification_id_fkey 
ON user_notification_status 
IS 'Single FK to notifications table - used in Supabase queries with !user_notification_status_notification_id_fkey syntax';