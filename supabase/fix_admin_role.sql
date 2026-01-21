-- Check your current user role
select * from profiles where id = auth.uid();

-- If the result is empty or role is 'student', run this to fix it:

-- 1. Ensure profile exists (if missing)
-- Note: 'email' is in auth.users, not profiles. We typically don't duplicate it unless necessary.
insert into public.profiles (id, full_name, role)
select id, 'Admin Principal', 'admin'
from auth.users
where email = 'YOUR_ADMIN_EMAIL_HERE' -- REPLACE THIS with your actual email
on conflict (id) do update
set role = 'admin';

-- 2. Force update just in case it exists but is wrong
update public.profiles
set role = 'admin'
where id = auth.uid(); -- Can be run in SQL Editor safely if you are the one logged in
