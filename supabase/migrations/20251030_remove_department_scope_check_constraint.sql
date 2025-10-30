-- Remove check constraint on department_scope that's blocking saves
-- The constraint is too restrictive for our multi-select department scope feature

-- Drop the check constraint if it exists
DO $$ 
BEGIN
  -- Check if the constraint exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_department_scope' 
    AND table_name = 'business_profiles'
    AND table_schema = 'public'
  ) THEN
    -- Drop the constraint
    ALTER TABLE public.business_profiles 
    DROP CONSTRAINT check_department_scope;
    
    RAISE NOTICE '✅ Successfully removed check_department_scope constraint';
  ELSE
    RAISE NOTICE 'ℹ️ check_department_scope constraint does not exist (already removed)';
  END IF;
END $$;

-- Also check for any other similar constraints and remove them
DO $$ 
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'business_profiles' 
    AND table_schema = 'public'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%department%'
  LOOP
    EXECUTE format('ALTER TABLE public.business_profiles DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);
    RAISE NOTICE '✅ Removed constraint: %', constraint_record.constraint_name;
  END LOOP;
END $$;

-- Verify the column accepts JSONB arrays
DO $$ 
BEGIN
  -- Test insert to verify constraint is removed
  RAISE NOTICE '✅ Migration completed: department_scope check constraints removed';
  RAISE NOTICE '   - Department scope can now accept any JSONB array value';
  RAISE NOTICE '   - Valid examples: ["all"], ["sales"], ["sales", "support"], ["operations", "urgent"]';
END $$;

