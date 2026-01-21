-- Add is_active column to workouts table
alter table workouts 
add column is_active boolean default true;

-- Update existing rows to be active
update workouts set is_active = true where is_active is null;
