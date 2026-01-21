-- FIX RLS POLICIES FOR PROFILES (CORREGIDO)
-- Run this in SQL Editor to ensure users can read their own profile.

-- 1. Reset RLS
alter table public.profiles enable row level security;

-- 2. Drop potential conflicting policies (ALL OF THEM)
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles; -- <--- AGREGADO

drop policy if exists "Admins can view all profiles" on profiles;
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Enable read access for all users" on profiles;
drop policy if exists "Enable insert for authenticated users only" on profiles;

-- 3. Create SIMPLE, GUARANTEED Policy for Select
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
);

-- 4. Create Policy for Update
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ( auth.uid() = id );

-- 5. Force Grant permissions
grant select, update, insert on public.profiles to authenticated;
grant select, update, insert on public.profiles to service_role;
