-- Fix duplicate health_sheets and add unique constraint
-- Deduplicate existing rows (keep the most recently created one)
DELETE FROM health_sheets
WHERE id NOT IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
        FROM health_sheets
    ) t
    WHERE t.row_num = 1
);

-- Now that duplicates are gone, we can safely add the unique constraint
ALTER TABLE health_sheets
ADD CONSTRAINT health_sheets_user_id_key UNIQUE (user_id);
