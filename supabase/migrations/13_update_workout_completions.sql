-- Update workout_completions to track daily progress and duration
ALTER TABLE workout_completions
ADD COLUMN day_number integer DEFAULT 1,
ADD COLUMN duration_seconds integer;

-- Drop old unique constraint (if exists by name, or simplistic approach)
ALTER TABLE workout_completions DROP CONSTRAINT IF EXISTS workout_completions_user_id_workout_id_key;

-- Add new unique constraint
ALTER TABLE workout_completions
ADD CONSTRAINT workout_completions_user_id_workout_id_day_number_key UNIQUE (user_id, workout_id, day_number);
