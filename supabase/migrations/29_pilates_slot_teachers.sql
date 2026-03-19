-- Pilates Slot Teachers: assign a teacher name to a specific date+hour slot
CREATE TABLE IF NOT EXISTS pilates_slot_teachers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    hour integer NOT NULL CHECK (hour >= 0 AND hour <= 23),
    teacher_name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(date, hour)
);

-- RLS
ALTER TABLE pilates_slot_teachers ENABLE ROW LEVEL SECURITY;

-- Everyone can view teacher assignments
CREATE POLICY "Everyone can view teacher assignments"
    ON pilates_slot_teachers FOR SELECT
    USING (true);

-- Only admins can manage teacher assignments
CREATE POLICY "Admins can manage teacher assignments"
    ON pilates_slot_teachers FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
