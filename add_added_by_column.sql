-- Add 'added_by' column to expenses table
-- This column will store the name of the user who added the expense to the system
-- (different from 'paid_by' which stores who paid for the expense from NLP parsing)

ALTER TABLE expenses 
ADD COLUMN added_by TEXT;

-- Update existing records to have a default value
-- You can run this after adding the column
UPDATE expenses 
SET added_by = 'Unknown' 
WHERE added_by IS NULL;