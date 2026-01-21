-- Add activity_type to workouts and make user_id nullable for global assignment
alter table workouts 
add column activity_type text check (activity_type in ('gym', 'pilates', 'mixed'));

alter table workouts 
alter column user_id drop not null;

-- Update RLS for Workouts
drop policy "Users can view their own workouts" on workouts;
create policy "Users can view assigned workouts" on workouts for select using (
  (auth.uid() = user_id) OR 
  (
    activity_type is not null AND 
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and (
        -- If routine is 'mixed', everyone sees it? Or only 'mixed' users? 
        -- Logic: If user is 'gym', they see 'gym'. If 'mixed', they see 'gym' AND 'pilates' AND 'mixed'? 
        -- Simplest MVP: Exact match or 'mixed' covers all? 
        -- Re-reading request: "dependienndo de a que actividad estan inscriptos"
        -- Let's stick to strict match first, or handle logic in App.
        -- Actually, 'mixed' usually means they have access to both. 
        -- Let's allow fetching by App logic (service role or public filter) 
        -- OR update policy to match profile activity.
        
        -- Policy: User sees workout if direct assignment OR activity match
        (activity_type = profiles.activity_type) OR
        (profiles.activity_type = 'mixed' AND activity_type in ('gym', 'pilates', 'mixed')) OR
        (activity_type = 'mixed' AND profiles.activity_type = 'mixed') -- Redundant but clear
      )
    )
  )
);
