-- Ensure progress_logs RLS is configured correctly

-- Attempt to create table if not exists (just in case, to make this idempotent-ish)
-- Note: We assume the table exists based on previous success inserting, but let's be safe on schema.
-- (We won't create it here fully to avoid conflict if it differs, but we WILL enable RLS and add policies)

alter table progress_logs enable row level security;

-- Drop existing policies to ensure clean state
drop policy if exists "Users can view their own logs" on progress_logs;
drop policy if exists "Users can insert their own logs" on progress_logs;
drop policy if exists "Admins can view all logs" on progress_logs;

-- Re-create policies
create policy "Users can view their own logs"
  on progress_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on progress_logs for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all logs"
  on progress_logs for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Also allow admins to delete/update if necessary, but starting with SELECT fix.
