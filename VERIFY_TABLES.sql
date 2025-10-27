-- ============================================================================
-- VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to check table status
-- ============================================================================

-- 1. Check if business_profiles table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'business_profiles';

-- 2. Check business_profiles columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'business_profiles'
ORDER BY ordinal_position;

-- 3. Check workflows table columns (verify user_id exists)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'workflows'
AND column_name IN ('user_id', 'client_id', 'config', 'is_functional')
ORDER BY ordinal_position;

-- 4. Check for client_id in any table
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
AND column_name = 'client_id'
ORDER BY table_name;

-- 5. Test inserting into business_profiles (as authenticated user)
-- This will fail if table doesn't exist or RLS is wrong
-- Replace YOUR_USER_ID with your actual user ID
-- INSERT INTO business_profiles (user_id, business_name)
-- VALUES ('40b2d58f-b0f1-4645-9f2f-12373a889bc8', 'Test Business')
-- ON CONFLICT (user_id) DO NOTHING;

-- 6. Refresh schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Schema cache refreshed - wait 5 seconds then try again' as status;

