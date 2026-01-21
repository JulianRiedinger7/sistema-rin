-- Add Personal Data fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS emergency_phone text;

-- Add Health Questionnaire fields to health_sheets
ALTER TABLE public.health_sheets
ADD COLUMN IF NOT EXISTS has_chronic_disease boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_allergies_bool boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_under_treatment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS takes_medication boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS had_surgery boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_physical_limitation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS relevant_conditions text; -- JSON or CSV string for checkboxes (Diabetes, etc)
