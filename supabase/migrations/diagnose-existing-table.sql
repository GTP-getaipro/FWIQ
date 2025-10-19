-- ============================================================================
-- DIAGNOSE EXISTING AI_HUMAN_COMPARISON TABLE
-- This script checks what columns actually exist in your table
-- ============================================================================

SELECT '=== EXISTING TABLE DIAGNOSIS ===' as section;

-- Check if table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_human_comparison' AND table_schema = 'public')
        THEN '✅ ai_human_comparison table EXISTS'
        ELSE '❌ ai_human_comparison table does NOT exist'
    END as table_status;

-- Show all columns in the existing table
SELECT '=== EXISTING TABLE COLUMNS ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_human_comparison' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if required columns exist
SELECT '=== REQUIRED COLUMNS CHECK ===' as section;
SELECT 
    'client_id' as required_column,
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
    'email_id' as required_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ai_human_comparison' 
            AND column_name = 'email_id' 
            AND table_schema = 'public'
        )
        THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
UNION ALL
SELECT 
    'category' as required_column,
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
    'ai_draft' as required_column,
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
    'human_reply' as required_column,
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
    'created_at' as required_column,
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

-- Show sample data if table exists and has data
SELECT '=== SAMPLE DATA (if any) ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_human_comparison' AND table_schema = 'public')
        THEN 'Table exists - showing sample data below'
        ELSE 'Table does not exist'
    END as data_status;

-- Show sample data (limit to 3 records)
SELECT * FROM ai_human_comparison LIMIT 3;

-- Show recommendations
SELECT '=== RECOMMENDATIONS ===' as section;

DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_human_comparison' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 ACTION: Create the ai_human_comparison table using create-ai-human-comparison-table.sql';
    ELSE
        -- Check if email_id column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ai_human_comparison' 
            AND column_name = 'email_id' 
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE '🔧 ACTION: Add email_id column to existing table';
            RAISE NOTICE '   Run: ALTER TABLE ai_human_comparison ADD COLUMN email_id TEXT;';
        END IF;
        
        -- Check if other required columns exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ai_human_comparison' 
            AND column_name = 'client_id' 
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE '🔧 ACTION: Add client_id column to existing table';
            RAISE NOTICE '   Run: ALTER TABLE ai_human_comparison ADD COLUMN client_id UUID REFERENCES auth.users(id);';
        END IF;
        
        RAISE NOTICE '✅ Table exists - check column status above for any missing columns';
    END IF;
END $$;
