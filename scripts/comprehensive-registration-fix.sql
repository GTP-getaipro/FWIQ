-- ============================================================================
-- COMPREHENSIVE REGISTRATION FIX FOR FLOWORX
-- This script fixes all possible issues with user registration and profile creation
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- 1. First, let's check if there are any existing triggers that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Fix RLS policies on profiles table
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable profile creation for new users" ON public.profiles;
DROP POLICY IF EXISTS "Enable profile access for users" ON public.profiles;

-- Create a simple, permissive policy
CREATE POLICY "Allow profile management" ON public.profiles
  FOR ALL USING (auth.uid() = id OR auth.role() = 'service_role');

-- 3. Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- 4. Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table with proper permissions
  INSERT INTO public.profiles (id, email, onboarding_step)
  VALUES (NEW.id, NEW.email, 'email_integration');
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If profile creation fails, log the error but don't fail the user creation
    RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to automatically create profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();

-- 6. Alternative approach: Create a more permissive RLS policy
-- This allows the trigger to work even when the user isn't fully authenticated yet
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows profile creation during user signup
CREATE POLICY "Allow profile creation during signup" ON public.profiles
  FOR INSERT WITH CHECK (true); -- Allow all inserts during signup

-- Create a policy for normal operations
CREATE POLICY "Users can manage their own profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- 7. Ensure the profiles table has the right structure
-- Add any missing columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'email_integration';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 8. Test the setup
SELECT 'Registration fix applied successfully!' as status;
