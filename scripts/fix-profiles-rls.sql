-- Fix Profiles RLS Issue
-- This script creates a function to handle profile creation with proper permissions

-- Create a function that can create profiles with elevated permissions
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, onboarding_step)
  VALUES (NEW.id, NEW.email, 'email_integration');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that calls this function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Alternative: Update the RLS policy to allow profile creation
-- First, let's check what policies exist
-- DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;

-- Create a more permissive policy for profile creation
CREATE POLICY "Enable profile creation for new users" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Also allow users to read and update their own profiles
CREATE POLICY "Enable profile access for users" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
