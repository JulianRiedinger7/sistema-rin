-- Clean up script for Production Launch
-- Run this in the Supabase SQL Editor to wipe transactional data AND Content (Exercises/Routines)


-- 1. PILATES SYSTEM
-- Delete all bookings
truncate table pilates_bookings cascade;

-- 2. PAYMENTS
-- Delete all registered payments
truncate table payments cascade;

-- 3. CONTENT (Exercises & Routines)
-- Delete all routines/workouts
truncate table workouts cascade;
-- Delete all exercises
truncate table exercises cascade;

-- 4. PROGRESS
-- Delete user benchmark logs (weight tracking)
truncate table benchmark_logs cascade;
-- Delete workout completion history
truncate table workout_completions cascade;
-- Delete progress logs
truncate table progress_logs cascade;


-- 5. USERS (Optional but Recommended)
-- Note: You cannot easily delete users via SQL due to Supabase Auth restrictions.
-- Ideally, go to Authentication > Users in the Dashboard and delete all test users.
-- Their profile rows in the `public.profiles` table will be deleted automatically 
-- if you have 'ON DELETE CASCADE' set up.
