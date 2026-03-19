-- Fix RLS infinite recursion on profiles table
-- Creates a SECURITY DEFINER function to check admin role without triggering RLS

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Drop the recursive admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate admin policies using the safe function
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

-- Fix the admin UPDATE policy too
DROP POLICY IF EXISTS "Admins can update student profiles" ON profiles;
CREATE POLICY "Admins can update student profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  );
