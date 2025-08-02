-- Update existing expenses to populate added_by field with proper user names
-- This script will update expenses that have null or 'Unknown' added_by values

-- First, update from profiles table where we have full_name
UPDATE expenses 
SET added_by = profiles.full_name
FROM profiles 
WHERE profiles.id = expenses.user_id::uuid 
AND profiles.full_name IS NOT NULL 
AND profiles.full_name != ''
AND (expenses.added_by IS NULL OR expenses.added_by = 'Unknown' OR expenses.added_by = 'Unknown User');

-- Then, update remaining ones using email name (before @)
UPDATE expenses 
SET added_by = INITCAP(REPLACE(SPLIT_PART(profiles.email, '@', 1), '.', ' '))
FROM profiles 
WHERE profiles.id = expenses.user_id::uuid 
AND profiles.email IS NOT NULL 
AND (expenses.added_by IS NULL OR expenses.added_by = 'Unknown' OR expenses.added_by = 'Unknown User');

-- Finally, set any remaining null values to 'Unknown User'
UPDATE expenses 
SET added_by = 'Unknown User'
WHERE added_by IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_expenses,
    COUNT(CASE WHEN added_by IS NOT NULL AND added_by != 'Unknown User' THEN 1 END) as expenses_with_names,
    COUNT(CASE WHEN added_by = 'Unknown User' THEN 1 END) as unknown_users
FROM expenses;