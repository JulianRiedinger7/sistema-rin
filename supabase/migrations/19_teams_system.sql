-- Create teams table
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create team_players table
create table if not exists team_players (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  height numeric, -- in cm
  weight numeric, -- in kg
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create player_assessments table
create table if not exists player_assessments (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references team_players(id) on delete cascade not null,
  exercise text not null check (exercise in ('Sentadilla', 'Hip Thrust', 'Banco Plano', 'Remo', 'Dominadas')),
  value numeric not null,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies

-- Enable RLS
alter table teams enable row level security;
alter table team_players enable row level security;
alter table player_assessments enable row level security;

-- Teams Policies (Admin only for now, maybe read for others later but req says Admin perspective)
create policy "Admins can manage teams"
  on teams
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Team Players Policies
create policy "Admins can manage team players"
  on team_players
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Player Assessments Policies
create policy "Admins can manage player assessments"
  on player_assessments
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
