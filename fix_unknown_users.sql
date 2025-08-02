-- Fix existing expenses with Unknown User in added_by field
UPDATE expenses 
SET added_by = COALESCE(profiles.full_name, SPLIT_PART(profiles.email, '@', 1), 'Unknown User')
FROM profiles 
WHERE profiles.id = expenses.user_id::uuid 
AND (expenses.added_by = 'Unknown User' OR expenses.added_by IS NULL);