-- Support for Weekly Routine Structure

-- 1. Updates to 'workouts' table
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS global_structure text, -- e.g. "10/10/8/8/6"
ADD COLUMN IF NOT EXISTS global_rpe text;       -- e.g. "7-8"

-- 2. Updates to 'workout_items' table
ALTER TABLE workout_items
ADD COLUMN IF NOT EXISTS day_number int DEFAULT 1,
ADD COLUMN IF NOT EXISTS block_type text DEFAULT 'Fuerza'; -- 'Fuerza', 'Aerobico', 'Potencia', 'Movilidad'

-- 3. Change 'reps' from int to text to support split reps
ALTER TABLE workout_items
ALTER COLUMN reps TYPE text USING reps::text;
