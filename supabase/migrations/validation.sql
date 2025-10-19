-- Database Validation SQL Scripts
-- These scripts validate database schema, constraints, and data integrity

-- ============================================================================
-- SCHEMA VALIDATION
-- ============================================================================

-- Check that all required tables exist
DO $$
DECLARE
    required_tables TEXT[] := ARRAY[
        'profiles', 'integrations', 'communication_styles', 'business_hours',
        'escalation_rules', 'notification_settings', 'email_logs', 'email_queue',
        'ai_responses', 'analytics_events', 'performance_metrics', 'workflows',
        'workflow_metrics', 'subscriptions', 'invoices', 'error_logs', 'dead_letter_queue'
    ];
    table_name TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = table_name 
            AND table_schema = 'public'
        ) THEN
            missing_tables := missing_tables || table_name;
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE 'All required tables exist';
END $$;

-- ============================================================================
-- FOREIGN KEY VALIDATION
-- ============================================================================

-- Validate foreign key relationships
DO $$
DECLARE
    fk_violations INTEGER;
BEGIN
    -- Check integrations -> profiles
    SELECT COUNT(*) INTO fk_violations
    FROM integrations i 
    LEFT JOIN profiles p ON i.client_id = p.id 
    WHERE p.id IS NULL;
    
    IF fk_violations > 0 THEN
        RAISE EXCEPTION 'Foreign key violation: % orphaned records in integrations', fk_violations;
    END IF;
    
    -- Check communication_styles -> profiles
    SELECT COUNT(*) INTO fk_violations
    FROM communication_styles cs 
    LEFT JOIN profiles p ON cs.client_id = p.id 
    WHERE p.id IS NULL;
    
    IF fk_violations > 0 THEN
        RAISE EXCEPTION 'Foreign key violation: % orphaned records in communication_styles', fk_violations;
    END IF;
    
    -- Check email_logs -> profiles
    SELECT COUNT(*) INTO fk_violations
    FROM email_logs el 
    LEFT JOIN profiles p ON el.client_id = p.id 
    WHERE p.id IS NULL;
    
    IF fk_violations > 0 THEN
        RAISE EXCEPTION 'Foreign key violation: % orphaned records in email_logs', fk_violations;
    END IF;
    
    -- Check ai_responses -> email_logs
    SELECT COUNT(*) INTO fk_violations
    FROM ai_responses ar 
    LEFT JOIN email_logs el ON ar.email_log_id = el.id 
    WHERE el.id IS NULL;
    
    IF fk_violations > 0 THEN
        RAISE EXCEPTION 'Foreign key violation: % orphaned records in ai_responses', fk_violations;
    END IF;
    
    RAISE NOTICE 'All foreign key relationships are valid';
END $$;

-- ============================================================================
-- CONSTRAINT VALIDATION
-- ============================================================================

-- Validate check constraints
DO $$
DECLARE
    constraint_violations INTEGER;
BEGIN
    -- Check email_queue status values
    SELECT COUNT(*) INTO constraint_violations
    FROM email_queue 
    WHERE status NOT IN ('pending', 'processing', 'completed', 'failed');
    
    IF constraint_violations > 0 THEN
        RAISE EXCEPTION 'Check constraint violation: % invalid status values in email_queue', constraint_violations;
    END IF;
    
    -- Check email_logs status values
    SELECT COUNT(*) INTO constraint_violations
    FROM email_logs 
    WHERE status NOT IN ('pending', 'processed', 'escalated', 'failed');
    
    IF constraint_violations > 0 THEN
        RAISE EXCEPTION 'Check constraint violation: % invalid status values in email_logs', constraint_violations;
    END IF;
    
    -- Check integration provider values
    SELECT COUNT(*) INTO constraint_violations
    FROM integrations 
    WHERE provider NOT IN ('gmail', 'outlook');
    
    IF constraint_violations > 0 THEN
        RAISE EXCEPTION 'Check constraint violation: % invalid provider values in integrations', constraint_violations;
    END IF;
    
    -- Check subscription status values
    SELECT COUNT(*) INTO constraint_violations
    FROM subscriptions 
    WHERE status NOT IN ('active', 'canceled', 'past_due', 'unpaid');
    
    IF constraint_violations > 0 THEN
        RAISE EXCEPTION 'Check constraint violation: % invalid status values in subscriptions', constraint_violations;
    END IF;
    
    -- Check error log severity values
    SELECT COUNT(*) INTO constraint_violations
    FROM error_logs 
    WHERE severity NOT IN ('low', 'medium', 'high', 'critical');
    
    IF constraint_violations > 0 THEN
        RAISE EXCEPTION 'Check constraint violation: % invalid severity values in error_logs', constraint_violations;
    END IF;
    
    RAISE NOTICE 'All check constraints are valid';
END $$;

-- ============================================================================
-- UNIQUE CONSTRAINT VALIDATION
-- ============================================================================

-- Validate unique constraints
DO $$
DECLARE
    unique_violations INTEGER;
BEGIN
    -- Check email message_id uniqueness per client
    SELECT COUNT(*) INTO unique_violations
    FROM (
        SELECT client_id, message_id, COUNT(*) as count 
        FROM email_logs 
        GROUP BY client_id, message_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF unique_violations > 0 THEN
        RAISE EXCEPTION 'Unique constraint violation: % duplicate message_id per client in email_logs', unique_violations;
    END IF;
    
    -- Check one active communication style per client
    SELECT COUNT(*) INTO unique_violations
    FROM (
        SELECT client_id, COUNT(*) as count 
        FROM communication_styles 
        WHERE is_active = true 
        GROUP BY client_id 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF unique_violations > 0 THEN
        RAISE EXCEPTION 'Unique constraint violation: % clients with multiple active communication styles', unique_violations;
    END IF;
    
    RAISE NOTICE 'All unique constraints are valid';
END $$;

-- ============================================================================
-- DATA TYPE VALIDATION
-- ============================================================================

-- Validate JSONB fields
DO $$
DECLARE
    json_violations INTEGER;
BEGIN
    -- Check profile client_config is valid JSON
    SELECT COUNT(*) INTO json_violations
    FROM profiles 
    WHERE client_config IS NULL 
    OR jsonb_typeof(client_config) != 'object';
    
    IF json_violations > 0 THEN
        RAISE EXCEPTION 'JSON validation error: % invalid client_config values in profiles', json_violations;
    END IF;
    
    -- Check communication_styles personality_traits is valid JSON array
    SELECT COUNT(*) INTO json_violations
    FROM communication_styles 
    WHERE personality_traits IS NOT NULL 
    AND jsonb_typeof(personality_traits) != 'array';
    
    IF json_violations > 0 THEN
        RAISE EXCEPTION 'JSON validation error: % invalid personality_traits values in communication_styles', json_violations;
    END IF;
    
    RAISE NOTICE 'All JSONB fields are valid';
END $$;

-- ============================================================================
-- INDEX VALIDATION
-- ============================================================================

-- Validate that required indexes exist
DO $$
DECLARE
    required_indexes TEXT[] := ARRAY[
        'idx_email_logs_client_status', 'idx_email_logs_processed_at',
        'idx_email_queue_status_scheduled', 'idx_email_queue_priority',
        'idx_analytics_events_client_timestamp', 'idx_analytics_events_type',
        'idx_workflow_metrics_workflow_recorded',
        'idx_error_logs_severity_created', 'idx_error_logs_client_created'
    ];
    index_name TEXT;
    missing_indexes TEXT[] := '{}';
BEGIN
    FOREACH index_name IN ARRAY required_indexes
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = index_name 
            AND schemaname = 'public'
        ) THEN
            missing_indexes := missing_indexes || index_name;
        END IF;
    END LOOP;
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE WARNING 'Missing recommended indexes: %', array_to_string(missing_indexes, ', ');
    ELSE
        RAISE NOTICE 'All recommended indexes exist';
    END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY VALIDATION
-- ============================================================================

-- Validate RLS is enabled on key tables
DO $$
DECLARE
    required_rls_tables TEXT[] := ARRAY[
        'profiles', 'integrations', 'communication_styles', 'email_logs',
        'email_queue', 'ai_responses', 'analytics_events'
    ];
    table_name TEXT;
    missing_rls_tables TEXT[] := '{}';
    rls_enabled BOOLEAN;
BEGIN
    FOREACH table_name IN ARRAY required_rls_tables
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = table_name AND n.nspname = 'public';
        
        IF NOT rls_enabled THEN
            missing_rls_tables := missing_rls_tables || table_name;
        END IF;
    END LOOP;
    
    IF array_length(missing_rls_tables, 1) > 0 THEN
        RAISE WARNING 'RLS not enabled on tables: %', array_to_string(missing_rls_tables, ', ');
    ELSE
        RAISE NOTICE 'RLS is enabled on all required tables';
    END IF;
END $$;

-- ============================================================================
-- PERFORMANCE VALIDATION
-- ============================================================================

-- Check for performance issues
DO $$
DECLARE
    unused_indexes INTEGER;
    large_tables INTEGER;
BEGIN
    -- Check for unused indexes
    SELECT COUNT(*) INTO unused_indexes
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexname NOT LIKE '%_pkey';
    
    IF unused_indexes > 0 THEN
        RAISE WARNING 'Found % unused indexes - consider dropping them', unused_indexes;
    END IF;
    
    -- Check for tables with high row counts
    SELECT COUNT(*) INTO large_tables
    FROM (
        SELECT schemaname, tablename, n_tup_ins + n_tup_upd + n_tup_del as total_ops
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        AND n_tup_ins + n_tup_upd + n_tup_del > 100000
    ) large;
    
    IF large_tables > 0 THEN
        RAISE NOTICE 'Found % tables with high activity - consider partitioning', large_tables;
    END IF;
    
    RAISE NOTICE 'Performance validation completed';
END $$;

-- ============================================================================
-- DATA RETENTION VALIDATION
-- ============================================================================

-- Check for old data that should be cleaned up
DO $$
DECLARE
    old_email_logs INTEGER;
    old_error_logs INTEGER;
    old_analytics INTEGER;
    old_completed_queue INTEGER;
BEGIN
    -- Check for old email logs
    SELECT COUNT(*) INTO old_email_logs
    FROM email_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    IF old_email_logs > 0 THEN
        RAISE WARNING 'Found % email logs older than 1 year - consider archiving', old_email_logs;
    END IF;
    
    -- Check for old error logs
    SELECT COUNT(*) INTO old_error_logs
    FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    IF old_error_logs > 0 THEN
        RAISE WARNING 'Found % error logs older than 6 months - consider archiving', old_error_logs;
    END IF;
    
    -- Check for old analytics events
    SELECT COUNT(*) INTO old_analytics
    FROM analytics_events 
    WHERE timestamp < NOW() - INTERVAL '2 years';
    
    IF old_analytics > 0 THEN
        RAISE WARNING 'Found % analytics events older than 2 years - consider archiving', old_analytics;
    END IF;
    
    -- Check for old completed queue items
    SELECT COUNT(*) INTO old_completed_queue
    FROM email_queue 
    WHERE status = 'completed' 
    AND updated_at < NOW() - INTERVAL '1 month';
    
    IF old_completed_queue > 0 THEN
        RAISE WARNING 'Found % completed queue items older than 1 month - consider cleaning up', old_completed_queue;
    END IF;
    
    RAISE NOTICE 'Data retention validation completed';
END $$;

-- ============================================================================
-- FINAL VALIDATION SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database validation completed successfully!';
    RAISE NOTICE 'All schema, constraints, and integrity checks passed.';
    RAISE NOTICE '========================================';
END $$;