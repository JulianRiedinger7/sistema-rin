-- Allow Admins to INSERT workout items
create policy "Admins can insert workout_items"
  on workout_items for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
