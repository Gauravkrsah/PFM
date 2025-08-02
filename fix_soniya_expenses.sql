-- Fix the specific expense that shows "Unknown User" for Soniya
-- First, let's see what user_id corresponds to Soniya's email
SELECT id, full_name, email FROM profiles WHERE email = 'soniyakhatrichhetri@gmail.com';

-- Update expenses that have "Unknown User" or NULL added_by with proper names
UPDATE expenses 
SET added_by = COALESCE(profiles.full_name, 
                       INITCAP(SPLIT_PART(profiles.email, '@', 1)), 
                       'Unknown User')
FROM profiles 
WHERE profiles.id = expenses.user_id::uuid 
AND (expenses.added_by IS NULL OR expenses.added_by = 'Unknown User' OR expenses.added_by = 'Unknown');

-- Specifically for the Chiya expense, let's check and fix it
SELECT e.*, p.full_name, p.email 
FROM expenses e 
LEFT JOIN profiles p ON p.id = e.user_id::uuid 
WHERE e.item = 'Chiya' AND e.group_id = 25;