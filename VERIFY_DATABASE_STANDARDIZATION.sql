-- ============================================================================
-- DATABASE STANDARDIZATION VERIFICATION
-- Run these queries to verify all migrations completed successfully
-- ============================================================================

-- ============================================================================
-- 1. Check for any remaining client_id columns (should return 0 rows)
-- ============================================================================
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'client_id'
ORDER BY table_name;

-- Expected: No rows (all converted to user_id)

-- ============================================================================
-- 2. Verify all tables use user_id
-- ============================================================================
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'user_id'
ORDER BY table_name;

-- Expected: Multiple tables listed (profiles, integrations, workflows, etc.)

-- ============================================================================
-- 3. Verify business_profiles table exists and has correct schema
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'business_profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, business_name, business_type, service_areas,
-- contact_info, business_hours, managers, suppliers, client_config,
-- created_at, updated_at

-- ============================================================================
-- 4. Verify workflows table has all required columns
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'workflows'
AND column_name IN ('user_id', 'config', 'is_functional', 'n8n_workflow_id')
ORDER BY ordinal_position;

-- Expected: user_id, config, is_functional, n8n_workflow_id

-- ============================================================================
-- 5. Verify communication_styles has enhanced columns
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'communication_styles'
AND column_name IN ('vocabulary_patterns', 'tone_analysis', 'signature_phrases', 'response_templates', 'sample_size', 'updated_at')
ORDER BY ordinal_position;

-- Expected: All 6 columns listed

-- ============================================================================
-- 6. Verify RLS policies are using user_id
-- ============================================================================
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('workflows', 'business_profiles', 'communication_styles', 'integrations')
ORDER BY tablename, policyname;

-- Expected: All policies should reference user_id, not client_id

-- ============================================================================
-- 7. Verify foreign key constraints
-- ============================================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND kcu.column_name = 'user_id'
ORDER BY tc.table_name;

-- Expected: Multiple tables with user_id -> auth.users(id) foreign keys

-- ============================================================================
-- 8. Verify indexes exist
-- ============================================================================
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%user_id%'
ORDER BY tablename;

-- Expected: Multiple indexes on user_id columns

-- ============================================================================
-- 9. Test inserting into business_profiles (will rollback)
-- ============================================================================
BEGIN;

INSERT INTO business_profiles (user_id, business_name, business_type)
VALUES (
  '40b2d58f-b0f1-4645-9f2f-12373a889bc8',
  'Test Business',
  'Test Type'
)
ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name;

SELECT 
  user_id,
  business_name,
  business_type,
  created_at
FROM business_profiles
WHERE user_id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8';

ROLLBACK;

-- Expected: Should work without errors, then rollback

-- ============================================================================
-- 10. Test inserting into workflows (will rollback)
-- ============================================================================
BEGIN;

INSERT INTO workflows (user_id, n8n_workflow_id, name, status, config, is_functional)
VALUES (
  '40b2d58f-b0f1-4645-9f2f-12373a889bc8',
  'test-workflow-id',
  'Test Workflow',
  'active',
  '{"test": true}'::jsonb,
  true
)
ON CONFLICT (user_id, name) DO NOTHING;

SELECT 
  user_id,
  n8n_workflow_id,
  name,
  config,
  is_functional
FROM workflows
WHERE user_id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8';

ROLLBACK;

-- Expected: Should work without errors, then rollback

-- ============================================================================
-- 11. Final Summary Check
-- ============================================================================
DO $$
DECLARE
  client_id_count INTEGER;
  user_id_count INTEGER;
  business_profiles_exists BOOLEAN;
  comm_styles_enhanced BOOLEAN;
BEGIN
  -- Count tables with client_id
  SELECT COUNT(DISTINCT table_name) INTO client_id_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'client_id';
  
  -- Count tables with user_id
  SELECT COUNT(DISTINCT table_name) INTO user_id_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'user_id';
  
  -- Check business_profiles exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'business_profiles'
  ) INTO business_profiles_exists;
  
  -- Check communication_styles has new columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'communication_styles' 
    AND column_name = 'vocabulary_patterns'
  ) INTO comm_styles_enhanced;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'DATABASE VERIFICATION SUMMARY';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tables with client_id: %', client_id_count;
  RAISE NOTICE 'Tables with user_id: %', user_id_count;
  RAISE NOTICE 'business_profiles exists: %', business_profiles_exists;
  RAISE NOTICE 'communication_styles enhanced: %', comm_styles_enhanced;
  RAISE NOTICE '================================================';
  
  IF client_id_count = 0 AND user_id_count > 0 AND business_profiles_exists AND comm_styles_enhanced THEN
    RAISE NOTICE 'SUCCESS: Database is fully standardized and ready!';
  ELSE
    RAISE WARNING 'WARNING: Database standardization incomplete!';
    IF client_id_count > 0 THEN
      RAISE WARNING '  - Still have % tables with client_id', client_id_count;
    END IF;
    IF NOT business_profiles_exists THEN
      RAISE WARNING '  - business_profiles table missing';
    END IF;
    IF NOT comm_styles_enhanced THEN
      RAISE WARNING '  - communication_styles not enhanced';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 12. Refresh schema cache one more time
-- ============================================================================
NOTIFY pgrst, 'reload schema';

SELECT 'Verification complete - schema cache refreshed' as status;

