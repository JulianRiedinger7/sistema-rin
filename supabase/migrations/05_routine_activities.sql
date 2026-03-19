-- Add activity_type to workouts and make user_id nullable for global assignment
alter table workouts 
add column activity_type text check (activity_type in ('gym', 'pilates', 'mixed', 'trial'));

alter table workouts 
alter column user_id drop not null;

-- Update RLS for Workouts
-- Routines are always 'gym'. Users with gym access (gym, mixed) can view them.
drop policy "Users can view their own workouts" on workouts;
create policy "Users can view assigned workouts" on workouts for select using (
  (auth.uid() = user_id) OR 
  (
    activity_type is not null AND 
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and profiles.activity_type IN ('gym', 'mixed')
    )
  )
);
