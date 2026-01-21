-- Create Enums
create type user_role as enum ('admin', 'student');
create type exercise_category as enum ('Hypertrophy', 'Power', 'Cardio', 'Pilates', 'Mobility');
create type payment_method as enum ('cash', 'transfer');
create type payment_status as enum ('paid', 'pending', 'overdue');

-- Create Profiles Table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role user_role default 'student',
  full_name text,
  dni text unique,
  phone text,
  date_of_birth date,
  activity_type text,
  health_declaration_date timestamp with time zone,
  has_accepted_terms boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- Create Health Sheets
create table health_sheets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  injuries text,
  allergies text,
  goals text,
  medical_conditions text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table health_sheets enable row level security;
create policy "Users can view their own health sheet" on health_sheets for select using (auth.uid() = user_id);
create policy "Admins can view all health sheets" on health_sheets for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can update their own health sheet" on health_sheets for insert with check (auth.uid() = user_id);
create policy "Users can edit their own health sheet" on health_sheets for update using (auth.uid() = user_id);

-- Create Exercises
create table exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  video_url text,
  muscle_group text,
  category exercise_category not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table exercises enable row level security;
create policy "Everyone can view exercises" on exercises for select using (true);
create policy "Admins can insert exercises" on exercises for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update exercises" on exercises for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Create Routines / Workouts
create table workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  assigned_by uuid references profiles(id),
  name text,
  notes text,
  is_completed boolean default false,
  assigned_date date default CURRENT_DATE,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table workouts enable row level security;
create policy "Users can view their own workouts" on workouts for select using (auth.uid() = user_id);
create policy "Admins can view all workouts" on workouts for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can insert workouts" on workouts for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Workout Items (Exercises within a workout)
create table workout_items (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references workouts(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  sets int,
  reps int,
  target_rpe int,
  notes text,
  order_index int
);

alter table workout_items enable row level security;
create policy "Users can view their own workout items" on workout_items for select using (
  exists (select 1 from workouts w where w.id = workout_items.workout_id and w.user_id = auth.uid())
);
create policy "Admins can view all workout items" on workout_items for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Progress Logs (Actual logs by students)
create table progress_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  workout_item_id uuid references workout_items(id),
  exercise_id uuid references exercises(id) not null,
  weight_used numeric,
  rpe_actual int,
  notes text,
  logged_at timestamp with time zone default timezone('utc'::text, now())
);

alter table progress_logs enable row level security;
create policy "Users can view/insert their own logs" on progress_logs for all using (auth.uid() = user_id);
create policy "Admins can view all logs" on progress_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Payments
create table payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  amount numeric not null,
  date date default CURRENT_DATE,
  method payment_method not null,
  proof_url text,
  status payment_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table payments enable row level security;
create policy "Users can view their own payments" on payments for select using (auth.uid() = user_id);
create policy "Users can insert transfer payments" on payments for insert with check (auth.uid() = user_id);
create policy "Admins can view all payments" on payments for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update payments" on payments for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Pilates Bookings
create table pilates_slots (
  id uuid default uuid_generate_v4() primary key,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  capacity int default 5,
  booked_count int default 0,
  is_cancelled boolean default false
);

alter table pilates_slots enable row level security;
create policy "Everyone can view slots" on pilates_slots for select using (true);
create policy "Admins can manage slots" on pilates_slots for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create table pilates_bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  slot_id uuid references pilates_slots(id) not null,
  status text default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, slot_id)
);

alter table pilates_bookings enable row level security;
create policy "Users can view their bookings" on pilates_bookings for select using (auth.uid() = user_id);
create policy "Users can book" on pilates_bookings for insert with check (auth.uid() = user_id);
create policy "Admins can view all bookings" on pilates_bookings for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Function to handle new user setup (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, dni, role, has_accepted_terms)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'dni',
    'student',
    (new.raw_user_meta_data->>'has_accepted_terms')::boolean
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
