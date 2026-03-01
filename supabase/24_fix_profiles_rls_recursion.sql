-- Fix infinite recursion in profiles RLS policies (error 42P17)
-- ============================================================
-- The "Admins can view all profiles" policy does a SELECT on profiles
-- inside a profiles policy check → infinite recursion.
-- 
-- Solution: Create a SECURITY DEFINER helper function that safely
-- checks admin role without triggering RLS on profiles.

-- Step 1: Create a safe admin check function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop only the problematic recursive SELECT policy on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
-- No need to recreate it — "Public profiles are viewable by everyone." already covers SELECT.

-- Step 3: Fix admin UPDATE policy on profiles to use safe function
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin());
