-- Migration: Create profile only AFTER email verification
-- This ensures users must verify their email before their profile is created

-- Remove the old trigger that fires on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function that only runs after email confirmation
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if email is confirmed
  -- Check if email_confirmed_at was just set (transition from NULL to NOT NULL)
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      onboarding_step,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      'email_integration',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Profile created for user % after email verification', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when user record is updated (email confirmed)
CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON FUNCTION public.handle_user_email_confirmed() IS 'Creates user profile only after email verification is complete';
COMMENT ON TRIGGER on_user_email_confirmed ON auth.users IS 'Triggers profile creation when user confirms their email';

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Profiles will now be created only after email verification';
END $$;

