-- 1. Fix RLS for Payments (Admins need to insert for others)
drop policy if exists "Admins can insert any payment" on payments;
create policy "Admins can insert any payment" on payments for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- 2. Create Activity Prices Table
create table if not exists activity_prices (
  activity_type text primary key,
  price numeric not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Seed Initial Data
insert into activity_prices (activity_type, price) values
('gym', 25000),
('pilates', 30000),
('mixed', 45000)
on conflict (activity_type) do nothing;

-- 4. Enable RLS for Activity Prices
alter table activity_prices enable row level security;

-- 5. Policies for Activity Prices
drop policy if exists "Everyone can view activity prices" on activity_prices;
create policy "Everyone can view activity prices" on activity_prices for select using (true);

drop policy if exists "Admins can update activity prices" on activity_prices;
create policy "Admins can update activity prices" on activity_prices for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins can insert activity prices" on activity_prices;
create policy "Admins can insert activity prices" on activity_prices for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
