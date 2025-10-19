-- ============================================================================
-- FLOWORX SUPABASE SCHEMA EXTRACTION
-- Run this in Supabase SQL Editor to get complete schema information
-- ============================================================================

-- ============================================================================
-- 1. LIST ALL TABLES
-- ============================================================================
SELECT 
  '=== TABLES ===' AS section,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. TABLE COLUMNS WITH DETAILS
-- ============================================================================
SELECT 
  '=== COLUMNS ===' AS section,
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- 3. ALL INDEXES
-- ============================================================================
SELECT 
  '=== INDEXES ===' AS section,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. PRIMARY KEYS
-- ============================================================================
SELECT 
  '=== PRIMARY KEYS ===' AS section,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 5. FOREIGN KEYS
-- ============================================================================
SELECT 
  '=== FOREIGN KEYS ===' AS section,
  tc.table_name AS from_table,
  kcu.column_name AS from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 6. UNIQUE CONSTRAINTS
-- ============================================================================
SELECT 
  '=== UNIQUE CONSTRAINTS ===' AS section,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- 7. CHECK CONSTRAINTS
-- ============================================================================
SELECT 
  '=== CHECK CONSTRAINTS ===' AS section,
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'c'
  AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================
SELECT 
  '=== RLS POLICIES ===' AS section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS command,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 9. TABLE SIZES AND ROW COUNTS
-- ============================================================================
SELECT 
  '=== TABLE STATISTICS ===' AS section,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
  n_live_tup AS row_count,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 10. FUNCTIONS AND TRIGGERS
-- ============================================================================
SELECT 
  '=== FUNCTIONS ===' AS section,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- 11. TRIGGERS
-- ============================================================================
SELECT 
  '=== TRIGGERS ===' AS section,
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table AS table_name,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 12. VIEWS
-- ============================================================================
SELECT 
  '=== VIEWS ===' AS section,
  table_name AS view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 13. SEQUENCES
-- ============================================================================
SELECT 
  '=== SEQUENCES ===' AS section,
  sequence_schema,
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value,
  increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================================================
-- 14. ENUMS (Custom Types)
-- ============================================================================
SELECT 
  '=== ENUM TYPES ===' AS section,
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- ============================================================================
-- 15. EXTENSIONS
-- ============================================================================
SELECT 
  '=== EXTENSIONS ===' AS section,
  extname AS extension_name,
  extversion AS version,
  extrelocatable AS relocatable
FROM pg_extension
ORDER BY extname;

-- ============================================================================
-- 16. RLS STATUS
-- ============================================================================
SELECT 
  '=== RLS STATUS ===' AS section,
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 17. INDEX USAGE STATISTICS
-- ============================================================================
SELECT 
  '=== INDEX USAGE ===' AS section,
  schemaname,
  tablename,
  indexrelname AS index_name,
  idx_scan AS times_used,
  idx_tup_read AS rows_read,
  idx_tup_fetch AS rows_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================================================
-- 18. MISSING INDEXES (Tables with high sequential scans)
-- ============================================================================
SELECT 
  '=== POTENTIAL MISSING INDEXES ===' AS section,
  schemaname,
  tablename,
  seq_scan AS sequential_scans,
  seq_tup_read AS rows_read_sequentially,
  idx_scan AS index_scans,
  n_live_tup AS row_count,
  CASE 
    WHEN seq_scan > idx_scan AND n_live_tup > 1000 THEN '⚠️ NEEDS INDEX'
    ELSE '✅ OK'
  END AS status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 0
ORDER BY seq_scan DESC;

-- ============================================================================
-- 19. STORAGE PARAMETERS
-- ============================================================================
SELECT 
  '=== STORAGE PARAMETERS ===' AS section,
  schemaname,
  tablename,
  reloptions AS storage_parameters
FROM pg_tables
WHERE schemaname = 'public'
  AND reloptions IS NOT NULL
ORDER BY tablename;

-- ============================================================================
-- 20. COMPLETE SCHEMA DDL (for backup)
-- ============================================================================
-- Note: This generates CREATE TABLE statements
SELECT 
  '=== TABLE DDL ===' AS section,
  'CREATE TABLE ' || table_name || ' (' ||
  string_agg(
    column_name || ' ' || 
    data_type || 
    CASE WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL 
      THEN ' DEFAULT ' || column_default 
      ELSE '' 
    END,
    ', '
  ) || ');' AS create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Run each section separately in Supabase SQL Editor
-- Copy results to document the schema
-- Use for backup, documentation, and migration planning
-- ============================================================================

