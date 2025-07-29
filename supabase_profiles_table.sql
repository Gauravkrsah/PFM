-- Create profiles table to store user metadata linked to Supabase Auth users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

-- Index on email for quick lookup
create unique index profiles_email_idx on public.profiles(email);

-- Example insert (replace with actual user data)
-- insert into public.profiles (id, full_name, email) values
-- ('user-uuid-1', 'John Doe', 'john@example.com'),
-- ('user-uuid-2', 'Jane Smith', 'jane@example.com');
