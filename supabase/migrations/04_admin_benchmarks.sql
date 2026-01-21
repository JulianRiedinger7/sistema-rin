-- Allow admins to Select all benchmarks
create policy "Admins can select all benchmarks"
  on benchmark_logs for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Allow admins to Insert benchmarks (for any user)
create policy "Admins can insert benchmarks"
  on benchmark_logs for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Allow admins to Update all benchmarks
create policy "Admins can update all benchmarks"
  on benchmark_logs for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Allow admins to Delete all benchmarks
create policy "Admins can delete all benchmarks"
  on benchmark_logs for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
