-- Create Benchmark Logs for tracking specific exercises
create table benchmark_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  exercise_type text not null, -- 'Squat', 'Hip Thrust', 'Bench', 'Row', 'Pull-up'
  weight numeric not null,
  date date default CURRENT_DATE,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS
alter table benchmark_logs enable row level security;

create policy "Users can view their own benchmarks" 
  on benchmark_logs for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own benchmarks" 
  on benchmark_logs for insert 
  with check (auth.uid() = user_id);

create policy "Users can delete their own benchmarks" 
  on benchmark_logs for delete 
  using (auth.uid() = user_id);

-- Enforce specific exercise types via check constraint if desired, 
-- or handle in app logic. For flexibility, we'll keep it text but comment valid values:
-- 'Sentadilla', 'Hip Thrust', 'Banco Plano', 'Remo', 'Dominadas'
