-- Add added_by column to expenses table
ALTER TABLE expenses ADD COLUMN added_by TEXT;

-- Update existing expenses with user names from profiles
UPDATE expenses 
SET added_by = COALESCE(profiles.full_name, SPLIT_PART(profiles.email, '@', 1), 'Unknown')
FROM profiles 
WHERE profiles.id = expenses.user_id::uuid;

-- Set default for any remaining null values
UPDATE expenses 
SET added_by = 'Unknown User'
WHERE added_by IS NULL;