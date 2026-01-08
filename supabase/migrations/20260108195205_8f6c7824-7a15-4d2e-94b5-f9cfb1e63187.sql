-- First, delete duplicate drafts keeping only the most recent one per user
DELETE FROM withdrawal_drafts 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM withdrawal_drafts
  ORDER BY user_id, updated_at DESC
);

-- Add unique constraint on user_id to ensure only 1 draft per user
ALTER TABLE withdrawal_drafts 
ADD CONSTRAINT withdrawal_drafts_user_id_unique UNIQUE (user_id);