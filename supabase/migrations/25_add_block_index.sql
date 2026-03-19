-- Add block_index to workout_items to distinguish multiple blocks
-- with the same name (e.g., two separate "Fuerza" blocks in the same day)
ALTER TABLE workout_items
ADD COLUMN IF NOT EXISTS block_index int DEFAULT 0;
