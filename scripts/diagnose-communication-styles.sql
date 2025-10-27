-- Diagnostic Script: Communication Styles Table
-- Run this in Supabase SQL Editor to check current state
-- Last Updated: 2025-10-27

-- ================================================
-- 1. CHECK IF TABLE EXISTS
-- ================================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'communication_styles'
    ) THEN '✅ Table EXISTS'
    ELSE '❌ Table MISSING - Run base migration first'
  END as table_status;

-- ================================================
-- 2. CHECK ALL COLUMNS
-- ================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'communication_styles'
ORDER BY ordinal_position;

-- ================================================
-- 3. CHECK FOR REQUIRED VOICE TRAINING COLUMNS
-- ================================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'communication_styles' 
      AND column_name = 'vocabulary_patterns'
    ) THEN '✅ vocabulary_patterns'
    ELSE '❌ vocabulary_patterns MISSING'
  END as vocab_status,
  
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'communication_styles' 
      AND column_name = 'tone_analysis'
    ) THEN '✅ tone_analysis'
    ELSE '❌ tone_analysis MISSING'
  END as tone_status,
  
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'communication_styles' 
      AND column_name = 'signature_phrases'
    ) THEN '✅ signature_phrases'
    ELSE '❌ signature_phrases MISSING'
  END as phrases_status,
  
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'communication_styles' 
      AND column_name = 'response_templates'
    ) THEN '✅ response_templates'
    ELSE '❌ response_templates MISSING'
  END as templates_status,
  
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'communication_styles' 
      AND column_name = 'sample_size'
    ) THEN '✅ sample_size'
    ELSE '❌ sample_size MISSING'
  END as sample_size_status,
  
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'communication_styles' 
      AND column_name = 'updated_at'
    ) THEN '✅ updated_at'
    ELSE '❌ updated_at MISSING'
  END as updated_at_status;

-- ================================================
-- 4. CHECK INDEXES
-- ================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'communication_styles'
ORDER BY indexname;

-- ================================================
-- 5. CHECK TRIGGERS
-- ================================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'communication_styles';

-- ================================================
-- 6. CHECK RLS POLICIES
-- ================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'communication_styles';

-- ================================================
-- 7. COUNT EXISTING RECORDS
-- ================================================
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN style_profile IS NOT NULL THEN 1 END) as records_with_profile,
  COUNT(CASE WHEN analysis_status = 'completed' THEN 1 END) as completed_analyses,
  COUNT(CASE WHEN analysis_status = 'in_progress' THEN 1 END) as in_progress_analyses,
  COUNT(CASE WHEN analysis_status = 'skipped' THEN 1 END) as skipped_analyses,
  COUNT(CASE WHEN analysis_status = 'failed' THEN 1 END) as failed_analyses
FROM communication_styles;

-- ================================================
-- 8. MIGRATION STATUS SUMMARY
-- ================================================
SELECT 
  '📊 MIGRATION STATUS SUMMARY' as report_section,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'communication_styles'
    ) >= 18 
    THEN '✅ ALL MIGRATIONS APPLIED (18+ columns)'
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'communication_styles'
    ) >= 12
    THEN '⚠️ PARTIAL - Voice Training Migration MISSING (12+ columns, need 18)'
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'communication_styles'
    ) >= 6
    THEN '⚠️ PARTIAL - Enhancement & Voice Training Migrations MISSING (6+ columns, need 18)'
    ELSE '❌ CRITICAL - Base table only or missing (need 18 columns)'
  END as migration_status,
  
  (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'communication_styles'
  ) as current_column_count,
  
  18 as required_column_count;

-- ================================================
-- 9. RECOMMENDATION
-- ================================================
SELECT 
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'communication_styles' 
      AND column_name IN ('vocabulary_patterns', 'tone_analysis', 'signature_phrases', 'response_templates', 'sample_size', 'updated_at')
    ) = 6
    THEN '✅ Schema is READY - No action needed'
    ELSE '❌ ACTION REQUIRED: Run migration file: supabase/migrations/20250122_enhance_communication_styles_for_voice_training.sql'
  END as recommendation;

