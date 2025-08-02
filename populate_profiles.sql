-- Insert user data into profiles table from auth.users
INSERT INTO profiles (id, full_name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email_confirmed_at::text, email),
  email
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  email = EXCLUDED.email;

-- Now update expenses with proper user names
UPDATE expenses 
SET added_by = COALESCE(profiles.full_name, SPLIT_PART(profiles.email, '@', 1))
FROM profiles 
WHERE profiles.id = expenses.user_id::uuid;