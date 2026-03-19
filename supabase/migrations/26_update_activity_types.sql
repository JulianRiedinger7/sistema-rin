-- Migration 26: Create activity_prices and expenses tables
-- Price model: 7 fixed pack prices, each independently editable by admin
-- Keys: gym, pilates_1, pilates_2, pilates_3, mixed_1, mixed_2, mixed_3

-- 1. Create Activity Prices Table
create table if not exists activity_prices (
  activity_type text primary key,
  price numeric not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table activity_prices enable row level security;

create policy "Everyone can view activity prices" on activity_prices for select using (true);
create policy "Admins can update activity prices" on activity_prices for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can insert activity prices" on activity_prices for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 2. Seed all 7 pack prices
insert into activity_prices (activity_type, price) values
  ('gym',       40000),
  ('pilates_1', 30000),
  ('pilates_2', 45000),
  ('pilates_3', 65000),
  ('mixed_1',   70000),
  ('mixed_2',   85000),
  ('mixed_3',   95000)
on conflict (activity_type) do nothing;

-- 3. Create Expenses Table
create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  amount numeric not null,
  date date default CURRENT_DATE,
  activity text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table expenses enable row level security;

create policy "Admins can view expenses" on expenses for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can insert expenses" on expenses for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete expenses" on expenses for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 4. Add activity column to payments if it doesn't exist
alter table payments add column if not exists activity text;

-- 5. Fix RLS for Payments (Admins need to insert for others)
drop policy if exists "Admins can insert any payment" on payments;
create policy "Admins can insert any payment" on payments for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
