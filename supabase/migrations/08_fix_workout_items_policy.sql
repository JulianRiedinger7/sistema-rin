-- Allow users to view workout items if they can view the parent workout
drop policy "Users can view their own workout items" on workout_items;

create policy "Users can view relevant workout items" on workout_items for select using (
  exists (
    select 1 from workouts w 
    where w.id = workout_items.workout_id 
    and (
      (auth.uid() = w.user_id) OR -- Direct assignment
      (
        w.activity_type is not null AND 
        exists (
          select 1 from profiles 
          where id = auth.uid() 
          and (
            (w.activity_type = profiles.activity_type) OR -- Same activity
            (profiles.activity_type = 'mixed' AND w.activity_type in ('gym', 'pilates', 'mixed')) OR -- Mixed sees all
            (w.activity_type = 'mixed' AND profiles.activity_type = 'mixed') -- Redundant check
          )
        )
      )
    )
  )
);
