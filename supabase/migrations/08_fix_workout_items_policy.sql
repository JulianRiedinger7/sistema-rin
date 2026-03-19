-- Allow users to view workout items if they can view the parent workout
drop policy "Users can view their own workout items" on workout_items;

create policy "Users can view relevant workout items" on workout_items for select using (
  exists (
    select 1 from workouts w 
    where w.id = workout_items.workout_id 
    and (
      (auth.uid() = w.user_id) OR
      (
        w.activity_type = 'gym' AND 
        exists (
          select 1 from profiles 
          where id = auth.uid() 
          and profiles.activity_type IN ('gym', 'mixed')
        )
      )
    )
  )
);
