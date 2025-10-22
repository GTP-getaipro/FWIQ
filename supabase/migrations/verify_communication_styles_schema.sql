-- Verification Query for Communication Styles Schema Enhancement
-- Run this to verify that all columns and indexes were created successfully

-- 1. Check that all columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'communication_styles'
ORDER BY ordinal_position;

-- 2. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'communication_styles'
ORDER BY indexname;

-- 3. Check trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'communication_styles';

-- 4. Check if data was migrated (if any exists)
SELECT 
  user_id,
  CASE WHEN vocabulary_patterns IS NOT NULL THEN '✅' ELSE '❌' END as has_vocabulary,
  CASE WHEN tone_analysis IS NOT NULL THEN '✅' ELSE '❌' END as has_tone,
  CASE WHEN signature_phrases IS NOT NULL THEN '✅' ELSE '❌' END as has_phrases,
  CASE WHEN response_templates IS NOT NULL THEN '✅' ELSE '❌' END as has_templates,
  sample_size,
  updated_at
FROM communication_styles
LIMIT 10;

-- 5. Check column comments
SELECT 
  col_description('communication_styles'::regclass, ordinal_position) as comment,
  column_name
FROM information_schema.columns
WHERE table_name = 'communication_styles'
  AND col_description('communication_styles'::regclass, ordinal_position) IS NOT NULL
ORDER BY ordinal_position;

