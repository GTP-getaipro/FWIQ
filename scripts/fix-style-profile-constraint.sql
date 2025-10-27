-- Fix: Make style_profile nullable to allow initial insert
-- Issue: style_profile is NOT NULL but frontend doesn't provide it during initial status insert
-- Solution: Make it nullable since it gets populated later by voice analysis
-- Date: 2025-10-27

-- Check current constraint
SELECT 
  column_name, 
  is_nullable, 
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_name = 'communication_styles' 
  AND column_name = 'style_profile';

-- Fix: Make style_profile nullable
ALTER TABLE communication_styles 
ALTER COLUMN style_profile DROP NOT NULL;

-- Verify the fix
SELECT 
  column_name, 
  is_nullable, 
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_name = 'communication_styles' 
  AND column_name = 'style_profile';

-- Expected result after fix:
-- column_name: style_profile
-- is_nullable: YES  ← Should now be YES
-- column_default: NULL
-- data_type: jsonb

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed: style_profile column is now nullable';
  RAISE NOTICE '✅ Frontend can now insert rows without providing style_profile';
  RAISE NOTICE '✅ Voice analysis will populate style_profile later';
END $$;

