-- Create Pilates Configuration Table
create table pilates_config (
    id int primary key default 1, -- Single row configuration
    morning_start_hour int default 7,
    morning_end_hour int default 12,
    afternoon_start_hour int default 16,
    afternoon_end_hour int default 21,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Force single row constraint
alter table pilates_config add constraint single_row_config check (id = 1);

-- Initial Seed
insert into pilates_config (id, morning_start_hour, morning_end_hour, afternoon_start_hour, afternoon_end_hour)
values (1, 7, 12, 16, 21)
on conflict do nothing;

alter table pilates_config enable row level security;
create policy "Everyone can view pilates config" on pilates_config for select using (true);
create policy "Admins can update pilates config" on pilates_config for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Drop old tables if they exist to simplify (based on previous schema check, they might not be heavily used yet)
drop table if exists pilates_bookings;
drop table if exists pilates_slots;

-- Create New Simplified Bookings Table
create table pilates_bookings (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    date date not null, -- YYYY-MM-DD
    hour int not null,  -- 7, 8, 9...
    created_at timestamp with time zone default timezone('utc'::text, now()),
    
    unique(user_id, date, hour) -- Prevent double booking by same user same slot
);

alter table pilates_bookings enable row level security;

-- Policies
create policy "Users can view their own bookings" on pilates_bookings for select using (auth.uid() = user_id);

-- Admins can view all bookings (to see who is coming)
create policy "Admins can view all bookings" on pilates_bookings for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Users can insert their own booking
create policy "Users can book" on pilates_bookings for insert with check (auth.uid() = user_id);

-- Users can delete their own booking
create policy "Users can cancel" on pilates_bookings for delete using (auth.uid() = user_id);

-- Admins can delete any booking (cancel for student)
create policy "Admins can cancel for student" on pilates_bookings for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
