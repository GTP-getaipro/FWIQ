-- Check what columns business_profiles actually has
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'business_profiles'
ORDER BY ordinal_position;

