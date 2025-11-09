-- Add is_active column to platform_accesses
ALTER TABLE platform_accesses 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_platform_accesses_is_active 
ON platform_accesses(is_active);