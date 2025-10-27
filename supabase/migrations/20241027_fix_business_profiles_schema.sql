-- ============================================================================
-- FIX BUSINESS_PROFILES TABLE SCHEMA
-- Add missing columns that the application code expects
-- ============================================================================

BEGIN;

-- Add missing columns to existing business_profiles table
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS service_areas TEXT,
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS managers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS suppliers JSONB DEFAULT '[]'::jsonb;

-- Ensure updated_at exists
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Make user_id NOT NULL (it's currently nullable)
ALTER TABLE public.business_profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Add UNIQUE constraint on user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'business_profiles_user_id_key'
    AND table_name = 'business_profiles'
  ) THEN
    ALTER TABLE public.business_profiles 
    ADD CONSTRAINT business_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Sync business_name from client_config if it exists
UPDATE public.business_profiles
SET business_name = client_config->>'businessName'
WHERE business_name IS NULL 
AND client_config->>'businessName' IS NOT NULL;

-- Sync business_type from primary_business_type
UPDATE public.business_profiles
SET business_type = primary_business_type
WHERE business_type IS NULL 
AND primary_business_type IS NOT NULL;

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_business_profiles_updated_at ON public.business_profiles;
CREATE TRIGGER trg_business_profiles_updated_at
BEFORE UPDATE ON public.business_profiles
FOR EACH ROW
EXECUTE FUNCTION update_business_profiles_updated_at();

-- Ensure RLS policies exist
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS business_profiles_user_access ON public.business_profiles;
DROP POLICY IF EXISTS "Users can manage their own business profile" ON public.business_profiles;

CREATE POLICY "Users can manage their own business profile"
ON public.business_profiles
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.business_profiles TO postgres, authenticated, anon, service_role;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verification
DO $$
DECLARE
  has_business_name BOOLEAN;
  has_managers BOOLEAN;
  has_suppliers BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' 
    AND column_name = 'business_name'
  ) INTO has_business_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' 
    AND column_name = 'managers'
  ) INTO has_managers;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_profiles' 
    AND column_name = 'suppliers'
  ) INTO has_suppliers;
  
  IF has_business_name AND has_managers AND has_suppliers THEN
    RAISE NOTICE 'SUCCESS: business_profiles schema fixed - all columns present';
  ELSE
    RAISE WARNING 'WARNING: Some columns still missing';
    IF NOT has_business_name THEN
      RAISE WARNING '  - business_name missing';
    END IF;
    IF NOT has_managers THEN
      RAISE WARNING '  - managers missing';
    END IF;
    IF NOT has_suppliers THEN
      RAISE WARNING '  - suppliers missing';
    END IF;
  END IF;
END $$;

COMMIT;

