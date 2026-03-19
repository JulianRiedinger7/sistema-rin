-- Create Pilates Week Configurations Table
CREATE TABLE IF NOT EXISTS pilates_week_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    week_start DATE NOT NULL UNIQUE, -- Store the Monday of the week
    morning_start_hour INT NOT NULL,
    morning_end_hour INT NOT NULL,
    afternoon_start_hour INT NOT NULL,
    afternoon_end_hour INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE pilates_week_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Everyone can view pilates week configs" ON pilates_week_configs FOR SELECT USING (true);
CREATE POLICY "Admins can manage pilates week configs" ON pilates_week_configs USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
