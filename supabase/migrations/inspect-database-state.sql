-- ============================================================================
-- DATABASE STATE INSPECTION
-- Check what tables and data already exist that we can reuse
-- ============================================================================

-- 1. List all tables in the public schema
SELECT '=== EXISTING TABLES ===' as section;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check email_logs table structure
SELECT '=== EMAIL_LOGS TABLE STRUCTURE ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if performance_metrics table exists
SELECT '=== PERFORMANCE_METRICS TABLE CHECK ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_metrics' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as performance_metrics_status;

-- 4. Check if ai_draft_learning table exists
SELECT '=== AI_DRAFT_LEARNING TABLE CHECK ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_draft_learning' AND table_schema = 'public')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as ai_draft_learning_status;

-- 5. Check email_logs data count
SELECT '=== EMAIL_LOGS DATA COUNT ===' as section;
SELECT 
    COUNT(*) as total_emails,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN processed_at IS NOT NULL THEN 1 END) as processed_emails,
    COUNT(CASE WHEN processed_at IS NULL THEN 1 END) as unprocessed_emails
FROM email_logs;

-- 6. Check recent email_logs data
SELECT '=== RECENT EMAIL_LOGS DATA (Last 10) ===' as section;
SELECT 
    id,
    user_id,
    provider,
    subject,
    from_email,
    received_at,
    processed_at,
    status
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Check if performance_metrics table exists and has data
SELECT '=== PERFORMANCE_METRICS DATA CHECK ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_metrics' AND table_schema = 'public')
        THEN (SELECT COUNT(*) FROM performance_metrics)
        ELSE 0
    END as performance_metrics_count;

-- 8. Check if ai_draft_learning table exists and has data
SELECT '=== AI_DRAFT_LEARNING DATA CHECK ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_draft_learning' AND table_schema = 'public')
        THEN (SELECT COUNT(*) FROM ai_draft_learning)
        ELSE 0
    END as ai_draft_learning_count;

-- 9. Check user integrations
SELECT '=== USER INTEGRATIONS ===' as section;
SELECT 
    user_id,
    provider,
    status,
    n8n_credential_id,
    created_at
FROM integrations 
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
ORDER BY created_at DESC;

-- 10. Check workflows
SELECT '=== USER WORKFLOWS ===' as section;
SELECT 
    id,
    user_id,
    n8n_workflow_id,
    status,
    is_functional,
    created_at
FROM workflows 
WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
ORDER BY created_at DESC;

-- 11. Check what columns are missing from email_logs that N8N needs
SELECT '=== MISSING COLUMNS IN EMAIL_LOGS ===' as section;
SELECT 
    'avgMinutesPerEmail' as missing_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'avg_minutes_per_email')
        THEN 'EXISTS (as avg_minutes_per_email)'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT 
    'timeSavedHours' as missing_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'time_saved_hours')
        THEN 'EXISTS (as time_saved_hours)'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT 
    'moneySaved' as missing_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'money_saved')
        THEN 'EXISTS (as money_saved)'
        ELSE 'MISSING'
    END as status
UNION ALL
SELECT 
    'receptionistHourlyRate' as missing_column,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_logs' AND column_name = 'receptionist_hourly_rate')
        THEN 'EXISTS (as receptionist_hourly_rate)'
        ELSE 'MISSING'
    END as status;

SELECT '=== INSPECTION COMPLETE ===' as section;
