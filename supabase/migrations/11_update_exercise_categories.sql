-- Migration to update exercise_category enum to Spanish

-- 1. Rename old type
ALTER TYPE exercise_category RENAME TO exercise_category_old;

-- 2. Create new type
CREATE TYPE exercise_category AS ENUM ('Fuerza', 'Potencia', 'Aerobico', 'Movilidad', 'Pilates');

-- 3. Update table to use new type using a USING clause for casting
ALTER TABLE exercises 
ALTER COLUMN category TYPE exercise_category 
USING (
  CASE category::text
    WHEN 'Hypertrophy' THEN 'Fuerza'::exercise_category
    WHEN 'Power' THEN 'Potencia'::exercise_category
    WHEN 'Cardio' THEN 'Aerobico'::exercise_category
    WHEN 'Mobility' THEN 'Movilidad'::exercise_category
    WHEN 'Pilates' THEN 'Pilates'::exercise_category
    ELSE 'Fuerza'::exercise_category -- Fallback
  END
);

-- 4. Drop old type
DROP TYPE exercise_category_old;
