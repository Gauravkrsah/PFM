-- Quick fix for Soniya's expenses showing "Unknown User"
UPDATE expenses 
SET added_by = COALESCE(profiles.full_name, 
                       CASE 
                         WHEN profiles.email LIKE '%soniya%' THEN 'Soniya'
                         ELSE INITCAP(SPLIT_PART(profiles.email, '@', 1))
                       END)
FROM profiles 
WHERE profiles.id = expenses.user_id::uuid 
AND expenses.group_id = 25
AND (expenses.added_by IS NULL OR expenses.added_by = 'Unknown User' OR expenses.added_by = 'Unknown');