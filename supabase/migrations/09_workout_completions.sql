-- Create table to track user completions of workouts
create table workout_completions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  workout_id uuid references workouts(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, workout_id) -- Prevent duplicate completions for now, or allow? 
  -- If we allow re-doing the same routine (weeks later), we should remove unique constraint.
  -- User request: "Student sees routine, finishes it, it disappears". 
  -- Implies one-time completion per assignment. 
  -- But if it's a "Gym" routine for "Week 1", maybe they do it 3 times?
  -- For now, let's assume they want it cleared once done. 
  -- We can always add a "Reset" or specific logic later.
);

-- Enable RLS
alter table workout_completions enable row level security;

-- Policies
create policy "Users can view their own completions" 
  on workout_completions for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own completions" 
  on workout_completions for insert 
  with check (auth.uid() = user_id);

create policy "Admins can view all completions" 
  on workout_completions for select 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
