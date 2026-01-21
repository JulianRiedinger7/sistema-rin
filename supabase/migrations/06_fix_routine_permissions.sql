-- Allow Admins to DELETE workouts
create policy "Admins can delete workouts"
  on workouts for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Allow Admins to UPDATE workouts
create policy "Admins can update workouts"
  on workouts for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Allow Admins to DELETE workout items (needed if doing manual cleanup, though cascade handles most)
create policy "Admins can delete workout items"
  on workout_items for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Allow Admins to UPDATE workout items
create policy "Admins can update workout items"
  on workout_items for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
