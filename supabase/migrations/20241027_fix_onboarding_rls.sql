-- Migration: Fix RLS policies for onboarding_data table
-- This fixes the 401 error when storing registration/onboarding data

-- Ensure onboarding_data table has RLS enabled
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can insert own onboarding data" ON public.onboarding_data;
DROP POLICY IF EXISTS "Users can update own onboarding data" ON public.onboarding_data;

-- Allow users to read their own onboarding data
CREATE POLICY "Users can view own onboarding data"
  ON public.onboarding_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own onboarding data
CREATE POLICY "Users can insert own onboarding data"
  ON public.onboarding_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own onboarding data
CREATE POLICY "Users can update own onboarding data"
  ON public.onboarding_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own onboarding data
DROP POLICY IF EXISTS "Users can delete own onboarding data" ON public.onboarding_data;
CREATE POLICY "Users can delete own onboarding data"
  ON public.onboarding_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Onboarding data RLS policies updated successfully';
END $$;

