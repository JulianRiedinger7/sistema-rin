-- 1. Profiles Table Security
-- Ensure RLS is enabled
alter table profiles enable row level security;

-- Drop potentially insecure or default policies to ensure a clean slate
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins can update all profiles" on profiles;
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;

-- Create strict policies

-- SELECT: Users see themselves, Admins see everyone
create policy "Users can view own profile" on profiles
  for select using ( auth.uid() = id );

create policy "Admins can view all profiles" on profiles
  for select using ( 
    -- We can safely query profiles here because the "view own profile" policy allows the admin to read their own row
    exists (select 1 from profiles where id = auth.uid() and role = 'admin') 
  );

-- UPDATE: Users update themselves, Admins update everyone
create policy "Users can update own profile" on profiles
  for update using ( auth.uid() = id );

create policy "Admins can update all profiles" on profiles
  for update using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );


-- 2. Pilates Bookings Security (Lockdown)
-- We are moving booking logic to a Secure Server Action (Service Role).
-- Therefore, we REVOKE direct Insert/Delete permissions for authenticated users to prevent bypassing capacity checks.

-- Drop existing "allow" policies for write operations
drop policy if exists "Users can book" on pilates_bookings;
drop policy if exists "Users can insert their own booking" on pilates_bookings;
drop policy if exists "Users can cancel" on pilates_bookings;
drop policy if exists "Users can delete their own booking" on pilates_bookings;

-- Re-affirm SELECT policies (Users see own, Admins see all)
drop policy if exists "Users can view their own bookings" on pilates_bookings;
create policy "Users can view their own bookings" on pilates_bookings
  for select using ( auth.uid() = user_id );

drop policy if exists "Admins can view all bookings" on pilates_bookings;
create policy "Admins can view all bookings" on pilates_bookings
  for select using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

-- Note: We do NOT create INSERT/DELETE policies for 'authenticated' role.
-- Writes must now happen via Service Role (Admin Client) or explicit Admin-only policies.
-- We can add Admin-only policies for convenience in Supabase Studio:

create policy "Admins can full access bookings" on pilates_bookings
  for all using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );
