-- MASTER SECURITY AUDIT & FIX SCRIPT (CORRECTED)
-- Run this to ensure all RLS policies are correct and prevent "Access Denied" issues.

-- 1. PROFILES (Already done, but ensuring consistency)
alter table profiles enable row level security;
-- (Assuming policies exist from previous fix, skipping Drop/Create to avoid noise, but ensure Grants)
grant select, update, insert on public.profiles to authenticated;
grant select, update, insert on public.profiles to service_role;


-- 2. EXERCISES (Content - Everyone Authenticated Read, Admins Write)
alter table exercises enable row level security;

-- Drop potentially conflicting/duplicate policies
drop policy if exists "Authenticated users can view exercises" on exercises;
drop policy if exists "Admins can manage exercises" on exercises; -- Generic name
drop policy if exists "Admins can insert exercises" on exercises;
drop policy if exists "Admins can update exercises" on exercises;
drop policy if exists "Admins can delete exercises" on exercises;

-- Create Policies
create policy "Authenticated users can view exercises" on exercises
  for select to authenticated using (true);

create policy "Admins can insert exercises" on exercises
  for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update exercises" on exercises
  for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete exercises" on exercises
  for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));


-- 3. WORKOUTS (Routines) & ITEMS
-- Logic: Users see assigned + Admins see all. Admins Write.
alter table workouts enable row level security;
alter table workout_items enable row level security;

-- Workouts Policies
drop policy if exists "Admins can full access workouts" on workouts; -- Catch-all
drop policy if exists "Admins can insert workouts" on workouts;
drop policy if exists "Admins can update workouts" on workouts; 
drop policy if exists "Admins can delete workouts" on workouts;
drop policy if exists "Admins can select all workouts" on workouts;

create policy "Admins can insert workouts" on workouts for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update workouts" on workouts for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete workouts" on workouts for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can select all workouts" on workouts for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Note: We assume "Users can view assigned workouts" exists from migration 05/06. We won't touch it to avoid complex logic overwrite unless requested.

-- Workout Items Policies
drop policy if exists "Admins can full access workout items" on workout_items;
create policy "Admins can full access workout items" on workout_items for all 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
-- Note: "Users can view relevant workout items" exists from migration 08.


-- 4. PAYMENTS
alter table payments enable row level security;

drop policy if exists "Users can view own payments" on payments;
drop policy if exists "Admins can view all payments" on payments;
drop policy if exists "Admins can manage payments" on payments;

create policy "Users can view own payments" on payments
  for select using (auth.uid() = user_id);

create policy "Admins can view all payments" on payments
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage payments" on payments
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));


-- 5. PILATES BOOKINGS
alter table pilates_bookings enable row level security;
-- Bookings are strictly managed.
-- Users Select Own. Admins Select All. Service Role writes.
drop policy if exists "Users can view their own bookings" on pilates_bookings;
drop policy if exists "Admins can view all bookings" on pilates_bookings;

create policy "Users can view their own bookings" on pilates_bookings
  for select using (auth.uid() = user_id);

create policy "Admins can view all bookings" on pilates_bookings
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Note: No Insert/Update/Delete for users here (handled by Actions). Admin might need delete/insert in Dashboard.
drop policy if exists "Admins can full access bookings" on pilates_bookings; -- <--- ADDED DROP
create policy "Admins can full access bookings" on pilates_bookings
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));


-- 6. COMPLETIONS & PROGRESS
-- benchmark_logs
alter table benchmark_logs enable row level security;
drop policy if exists "Users view own benchmarks" on benchmark_logs;
drop policy if exists "Users insert own benchmarks" on benchmark_logs;
drop policy if exists "Admins view all benchmarks" on benchmark_logs;

create policy "Users view own benchmarks" on benchmark_logs for select using (auth.uid() = user_id);
create policy "Users insert own benchmarks" on benchmark_logs for insert with check (auth.uid() = user_id);
create policy "Admins view all benchmarks" on benchmark_logs for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- workout_completions
alter table workout_completions enable row level security;
drop policy if exists "Admins full access completions" on workout_completions; -- <--- ADDED DROP
-- (Assuming existing 09_workout_completions.sql policies hold, but adding Admin Full Access just in case)
create policy "Admins full access completions" on workout_completions for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
