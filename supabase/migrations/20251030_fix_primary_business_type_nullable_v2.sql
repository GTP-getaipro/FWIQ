-- Make primary_business_type nullable to allow Step 2 (Department Scope) to save
-- before Step 3 (Business Type Selection)
-- Version 2: With proper checks

-- Drop the NOT NULL constraint if it exists
DO $$ 
BEGIN
  -- Check if the constraint exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'business_profiles' 
    AND column_name = 'primary_business_type' 
    AND is_nullable = 'NO'
  ) THEN
    -- Drop the NOT NULL constraint
    ALTER TABLE public.business_profiles 
    ALTER COLUMN primary_business_type DROP NOT NULL;
    
    RAISE NOTICE '✅ Successfully made primary_business_type nullable';
  ELSE
    RAISE NOTICE 'ℹ️ primary_business_type is already nullable or column does not exist';
  END IF;
END $$;

-- Add comment explaining why it's nullable
COMMENT ON COLUMN public.business_profiles.primary_business_type IS 
  'Primary business type selected in onboarding Step 3. Nullable to allow department_scope to be saved in Step 2 before business type is selected.';

-- Set default value for existing NULL records
UPDATE public.business_profiles 
SET primary_business_type = 'General Services' 
WHERE primary_business_type IS NULL;

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration completed: primary_business_type is now nullable';
  RAISE NOTICE '   - Updated existing NULL values to "General Services"';
  RAISE NOTICE '   - Step 2 (Department Scope) can now save before Step 3';
END $$;

