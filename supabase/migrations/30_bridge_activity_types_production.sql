-- =============================================================================
-- MIGRATION 30: Bridge migration for production
-- Production has old types (gym, pilates, mixed). This migrates to the new model
-- with simplified types + pilates_weekly_classes column.
-- Also updates activity_prices to the 7-pack model.
-- =============================================================================

-- STEP 1: Update the CHECK constraint on profiles.activity_type
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_activity_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_activity_type_check
  CHECK (activity_type IN ('gym', 'pilates', 'mixed', 'trial'));

-- STEP 2: Add pilates_weekly_classes column if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pilates_weekly_classes integer 
  CHECK (pilates_weekly_classes IN (1, 2, 3));

-- STEP 3: Set default weekly classes for existing pilates/mixed users (default to 2 = 8 classes/month)
UPDATE profiles SET pilates_weekly_classes = 2 
  WHERE activity_type IN ('pilates', 'mixed') AND pilates_weekly_classes IS NULL;

-- STEP 4: Update workouts CHECK constraint
ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_activity_type_check;
ALTER TABLE workouts ADD CONSTRAINT workouts_activity_type_check
  CHECK (activity_type IN ('gym', 'pilates', 'mixed', 'trial'));

-- STEP 5: Update RLS policy for workouts
DROP POLICY IF EXISTS "Users can view assigned workouts" ON workouts;
CREATE POLICY "Users can view assigned workouts" ON workouts FOR SELECT USING (
  (auth.uid() = user_id) OR
  (
    activity_type IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND profiles.activity_type IN ('gym', 'mixed')
    )
  )
);

-- STEP 6: Update RLS policy for workout_items
DROP POLICY IF EXISTS "Users can view relevant workout items" ON workout_items;
CREATE POLICY "Users can view relevant workout items" ON workout_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_items.workout_id
    AND (
      (auth.uid() = w.user_id) OR
      (
        w.activity_type = 'gym' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND profiles.activity_type IN ('gym', 'mixed')
        )
      )
    )
  )
);

-- STEP 7: Migrate activity_prices to 7-pack model
-- Remove old per-class price if it exists
DELETE FROM activity_prices WHERE activity_type = 'pilates_class';

-- Insert all 7 pack prices (skip if they already exist)
INSERT INTO activity_prices (activity_type, price) VALUES
  ('gym',       40000),
  ('pilates_1', 30000),
  ('pilates_2', 45000),
  ('pilates_3', 65000),
  ('mixed_1',   70000),
  ('mixed_2',   85000),
  ('mixed_3',   95000)
ON CONFLICT (activity_type) DO NOTHING;
