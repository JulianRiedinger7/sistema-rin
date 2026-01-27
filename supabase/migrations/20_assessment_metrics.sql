-- Add metrics and notes to player_assessments
-- We first drop the check constraint to allow 'CMJ' and potentially other types
alter table player_assessments drop constraint if exists player_assessments_exercise_check;

alter table player_assessments 
add column if not exists metrics jsonb,
add column if not exists notes text;

-- Create assessment_configs table
create table if not exists assessment_configs (
  id uuid default gen_random_uuid() primary key,
  key text not null unique, -- e.g., 'cmj_asymmetry_thresholds'
  value jsonb not null, -- e.g., { "regular": 10, "bad": 15 }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table assessment_configs enable row level security;

-- Policies for assessment_configs
create policy "Admins can manage assessment configs"
  on assessment_configs
  for all
  using ( exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin') );

-- Insert default config for CMJ Asymmetry
insert into assessment_configs (key, value)
values ('cmj_asymmetry_thresholds', '{"regular": 10, "bad": 15}'::jsonb)
on conflict (key) do nothing;
