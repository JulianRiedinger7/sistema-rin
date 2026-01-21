-- Run this script in the Supabase SQL Editor to fix the issue where DNI is not being saved.

-- 1. Ensure the DNI column exists (just in case)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dni text unique;

-- 2. Update the Trigger Function to correctly save the DNI from the User Metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, dni, role, has_accepted_terms)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'dni',
    'student',
    COALESCE((new.raw_user_meta_data->>'has_accepted_terms')::boolean, false)
  );
  RETURN new;
END;
$$;
