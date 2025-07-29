-- Populate the profiles table with data from Supabase Auth users
-- Using columns: UID (id), Display name (full_name), Email (email)

insert into public.profiles (id, full_name, email)
select id, raw_user_meta_data->>'name' as full_name, email
from auth.users
where id not in (select id from public.profiles);
