-- Update existing expenses to populate the added_by field
-- This script will set added_by based on user profiles

-- First, update expenses where we can match user_id to profiles
UPDATE expenses 
SET added_by = (
  SELECT COALESCE(profiles.full_name, SPLIT_PART(profiles.email, '@', 1), 'Unknown')
  FROM profiles 
  WHERE profiles.id = expenses.user_id
)
WHERE expenses.added_by IS NULL 
AND expenses.user_id IS NOT NULL;

-- For any remaining expenses without added_by, set a default
UPDATE expenses 
SET added_by = 'Unknown User'
WHERE added_by IS NULL;