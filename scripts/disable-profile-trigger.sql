-- ============================================================================
-- DISABLE PROFILE TRIGGER APPROACH
-- This disables automatic profile creation and handles it in the application
-- ============================================================================

-- Remove any existing triggers that might be causing the issue
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_profile_for_user();

-- Make sure profiles table has proper RLS policies
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable profile creation for new users" ON public.profiles;
DROP POLICY IF EXISTS "Enable profile access for users" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile management" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

-- Create a simple RLS policy
CREATE POLICY "Users can manage their own profiles" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;

SELECT 'Profile triggers disabled - profile creation will be handled by the application' as status;
