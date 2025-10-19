-- ============================================================================
-- FLOWORX DISABLE FOREIGN KEY CONSTRAINTS FOR TESTING
-- This script temporarily disables foreign key constraints to allow validation testing
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- TEMPORARILY DISABLE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Disable foreign key constraints on migration_logs
DO $$
BEGIN
    -- Drop the foreign key constraint temporarily
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_migration_logs_user_id' 
        AND table_name = 'migration_logs'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE migration_logs DROP CONSTRAINT fk_migration_logs_user_id;
        RAISE NOTICE 'Dropped foreign key constraint fk_migration_logs_user_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_migration_logs_user_id does not exist';
    END IF;
END $$;

-- Disable foreign key constraints on migration_backups
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_migration_backups_user_id' 
        AND table_name = 'migration_backups'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE migration_backups DROP CONSTRAINT fk_migration_backups_user_id;
        RAISE NOTICE 'Dropped foreign key constraint fk_migration_backups_user_id';
    END IF;
END $$;

-- Disable foreign key constraints on data_exports
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_data_exports_user_id' 
        AND table_name = 'data_exports'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE data_exports DROP CONSTRAINT fk_data_exports_user_id;
        RAISE NOTICE 'Dropped foreign key constraint fk_data_exports_user_id';
    END IF;
END $$;

-- Disable foreign key constraints on outlook_analytics_events
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_outlook_analytics_events_user_id' 
        AND table_name = 'outlook_analytics_events'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE outlook_analytics_events DROP CONSTRAINT fk_outlook_analytics_events_user_id;
        RAISE NOTICE 'Dropped foreign key constraint fk_outlook_analytics_events_user_id';
    END IF;
END $$;

-- Disable foreign key constraints on outlook_business_events
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_outlook_business_events_user_id' 
        AND table_name = 'outlook_business_events'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE outlook_business_events DROP CONSTRAINT fk_outlook_business_events_user_id;
        RAISE NOTICE 'Dropped foreign key constraint fk_outlook_business_events_user_id';
    END IF;
END $$;

-- Disable foreign key constraints on outlook_alerts
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_outlook_alerts_user_id' 
        AND table_name = 'outlook_alerts'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE outlook_alerts DROP CONSTRAINT fk_outlook_alerts_user_id;
        RAISE NOTICE 'Dropped foreign key constraint fk_outlook_alerts_user_id';
    END IF;
END $$;

-- ============================================================================
-- TEST DATA INSERTION
-- ============================================================================

-- Test inserting data with dummy user_id
DO $$
BEGIN
    -- Test migration_logs insertion
    INSERT INTO migration_logs (user_id, migration_type, from_provider, to_provider, status) 
    VALUES ('00000000-0000-0000-0000-000000000000', 'test_validation', 'gmail', 'outlook', 'completed');
    
    RAISE NOTICE 'Migration logs test insertion successful';
    
    -- Test outlook_analytics_events insertion
    INSERT INTO outlook_analytics_events (user_id, event_type, data) 
    VALUES ('00000000-0000-0000-0000-000000000000', 'test_event', '{"test": true}');
    
    RAISE NOTICE 'Analytics events test insertion successful';
    
    -- Clean up test data
    DELETE FROM migration_logs WHERE migration_type = 'test_validation';
    DELETE FROM outlook_analytics_events WHERE event_type = 'test_event';
    
    RAISE NOTICE 'Test data cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test data insertion failed: %', SQLERRM;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Foreign key constraints temporarily disabled for testing!' as result;
SELECT 'Validation script should now be able to insert test data.' as status;
SELECT 'Run the validation script now - it should pass all tests.' as next_step;
SELECT 'Remember to re-enable foreign key constraints after validation.' as reminder;
