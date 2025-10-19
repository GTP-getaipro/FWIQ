-- ============================================================================
-- VOICE CONTEXT SYSTEM VALIDATION
-- End-to-end validation of the "Fetch Voice Context" functionality
-- ============================================================================

-- ============================================================================
-- 1. CHECK REQUIRED TABLES EXIST
-- ============================================================================

SELECT '=== VOICE CONTEXT SYSTEM VALIDATION ===' as section;

-- Check if ai_human_comparison table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_human_comparison' AND table_schema = 'public')
        THEN '✅ ai_human_comparison table EXISTS'
        ELSE '❌ ai_human_comparison table MISSING - CRITICAL ERROR'
    END as table_status;

-- Check if communication_styles table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'communication_styles' AND table_schema = 'public')
        THEN '✅ communication_styles table EXISTS'
        ELSE '❌ communication_styles table MISSING - CRITICAL ERROR'
    END as table_status;

-- ============================================================================
-- 2. CHECK TABLE STRUCTURE
-- ============================================================================

SELECT '=== AI_HUMAN_COMPARISON TABLE STRUCTURE ===' as section;

-- Check ai_human_comparison table structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_human_comparison' AND table_schema = 'public')
        THEN 'Table exists - showing structure below'
        ELSE 'Table does not exist'
    END as table_status;

-- Show table structure if it exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_human_comparison' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK REQUIRED COLUMNS
-- ============================================================================

SELECT '=== REQUIRED COLUMNS CHECK ===' as section;

-- Check required columns in ai_human_comparison
SELECT 
    'client_id' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ai_human_comparison' 
            AND column_name = 'client_id' 
            AND table_schema = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
UNION ALL
SELECT 
    'category' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ai_human_comparison' 
            AND column_name = 'category' 
            AND table_schema = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
UNION ALL
SELECT 
    'ai_draft' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ai_human_comparison' 
            AND column_name = 'ai_draft' 
            AND table_schema = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
UNION ALL
SELECT 
    'human_reply' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ai_human_comparison' 
            AND column_name = 'human_reply' 
            AND table_schema = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
UNION ALL
SELECT 
    'created_at' as column_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ai_human_comparison' 
            AND column_name = 'created_at' 
            AND table_schema = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- ============================================================================
-- 4. CHECK DATA AVAILABILITY
-- ============================================================================

SELECT '=== DATA AVAILABILITY CHECK ===' as section;

-- Check if there's any data in ai_human_comparison
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_human_comparison' AND table_schema = 'public')
        THEN 'Table exists - showing data summary below'
        ELSE 'Table does not exist'
    END as data_status;

-- Show data summary if table exists
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(CASE WHEN human_reply IS NOT NULL THEN 1 END) as records_with_human_reply,
    COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as records_with_category
FROM ai_human_comparison;

-- ============================================================================
-- 5. CHECK SUPABASE FUNCTION
-- ============================================================================

SELECT '=== SUPABASE FUNCTION CHECK ===' as section;

-- Check if style-memory function exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'style-memory' 
            AND routine_schema = 'public'
        )
        THEN '✅ style-memory function EXISTS'
        ELSE '❌ style-memory function MISSING - Check Supabase Edge Functions'
    END as function_status;

-- ============================================================================
-- 6. CHECK INDEXES FOR PERFORMANCE
-- ============================================================================

SELECT '=== INDEX CHECK ===' as section;

-- Check for recommended indexes
SELECT 
    'idx_ai_human_comparison_client' as index_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_ai_human_comparison_client' 
            AND schemaname = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '⚠️ MISSING - Performance impact'
    END as status
UNION ALL
SELECT 
    'idx_ai_human_comparison_category' as index_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_ai_human_comparison_category' 
            AND schemaname = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '⚠️ MISSING - Performance impact'
    END as status
UNION ALL
SELECT 
    'idx_ai_human_comparison_created' as index_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'idx_ai_human_comparison_created' 
            AND schemaname = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '⚠️ MISSING - Performance impact'
    END as status;

-- ============================================================================
-- 7. TEST QUERY SIMULATION
-- ============================================================================

SELECT '=== QUERY SIMULATION ===' as section;

-- Simulate the exact query used by style-memory function
DO $$
DECLARE
    test_client_id UUID := 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'; -- Use your test user ID
    test_category TEXT := 'Sales';
    result_count INTEGER;
BEGIN
    -- Check if table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_human_comparison' AND table_schema = 'public') THEN
        -- Simulate the exact query from style-memory function (count records that would be returned)
        SELECT COUNT(*) INTO result_count
        FROM (
            SELECT ai_draft, human_reply
            FROM ai_human_comparison
            WHERE client_id = test_client_id
            AND category = test_category
            AND human_reply IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 5
        ) subquery;
        
        RAISE NOTICE 'Query simulation successful: Found % records for client % and category %', result_count, test_client_id, test_category;
    ELSE
        RAISE NOTICE 'Cannot simulate query: ai_human_comparison table does not exist';
    END IF;
END $$;

-- ============================================================================
-- 8. CHECK N8N WORKFLOW CONFIGURATION
-- ============================================================================

SELECT '=== N8N WORKFLOW CONFIGURATION CHECK ===' as section;

-- Check if workflows table has the required configuration
SELECT 
    'workflows' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflows' AND table_schema = 'public')
        THEN 'workflows table exists - showing summary below'
        ELSE 'workflows table does not exist'
    END as workflow_status;

-- Show workflow summary if table exists
SELECT 
    COUNT(*) as total_workflows,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_workflows,
    COUNT(CASE WHEN is_functional = true THEN 1 END) as functional_workflows
FROM workflows;

-- ============================================================================
-- 9. CHECK USER INTEGRATIONS
-- ============================================================================

SELECT '=== USER INTEGRATIONS CHECK ===' as section;

-- Check if test user has proper integrations
SELECT 
    user_id,
    provider,
    status,
    n8n_credential_id,
    created_at
FROM integrations 
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60' -- Replace with your test user ID
ORDER BY created_at DESC;

-- ============================================================================
-- 10. RECOMMENDATIONS
-- ============================================================================

SELECT '=== RECOMMENDATIONS ===' as section;

DO $$
BEGIN
    -- Check if ai_human_comparison table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_human_comparison' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 ACTION REQUIRED: Create ai_human_comparison table';
        RAISE NOTICE '   Run: CREATE TABLE ai_human_comparison (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, email_id text NOT NULL, category text, ai_draft text, human_reply text, differences jsonb, created_at timestamptz DEFAULT now());';
    END IF;
    
    -- Check if style-memory function exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'style-memory' AND routine_schema = 'public') THEN
        RAISE NOTICE '🔧 ACTION REQUIRED: Deploy style-memory Supabase Edge Function';
        RAISE NOTICE '   Check: supabase/functions/style-memory/index.ts exists and is deployed';
    END IF;
    
    -- Check for missing indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_human_comparison_client' AND schemaname = 'public') THEN
        RAISE NOTICE '🔧 RECOMMENDATION: Create index for better performance';
        RAISE NOTICE '   Run: CREATE INDEX idx_ai_human_comparison_client ON ai_human_comparison(client_id);';
    END IF;
    
    RAISE NOTICE '✅ Validation complete - Check results above for any issues';
END $$;

SELECT '=== VALIDATION COMPLETE ===' as section;
