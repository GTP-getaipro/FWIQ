-- Simple RLS Fix for Profiles Table
-- This makes the profiles table more permissive for profile creation

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;

-- Create a simple policy that allows users to manage their own profiles
CREATE POLICY "Users can manage their own profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
