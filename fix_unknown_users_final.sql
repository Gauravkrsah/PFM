-- Fix all Unknown User entries by updating them with proper names from profiles
UPDATE expenses 
SET added_by = CASE 
  WHEN profiles.full_name IS NOT NULL AND profiles.full_name != '' THEN profiles.full_name
  WHEN profiles.email LIKE '%gaurav%' THEN 'Gaurav Sah'
  WHEN profiles.email LIKE '%soniya%' THEN 'Soniya'
  ELSE INITCAP(SPLIT_PART(profiles.email, '@', 1))
END
FROM profiles 
WHERE profiles.id = expenses.user_id::uuid 
AND expenses.group_id = '25'
AND (expenses.added_by IS NULL OR expenses.added_by = 'Unknown User' OR expenses.added_by = 'Unknown');

-- Verify the update
SELECT id, item, amount, added_by, user_id FROM expenses WHERE group_id = '25' ORDER BY date DESC;