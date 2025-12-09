-- Add crop_settings column to team_members table
ALTER TABLE team_members 
ADD COLUMN crop_settings jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN team_members.crop_settings IS 'Stores cropper parameters: { crop: { x, y }, zoom, rotation }';