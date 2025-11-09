-- Add foreign key linking platform_accesses to profiles table
-- This allows JOIN queries to fetch creator display names
ALTER TABLE platform_accesses 
ADD CONSTRAINT platform_accesses_profile_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_platform_accesses_profile_user_id 
ON platform_accesses(user_id);