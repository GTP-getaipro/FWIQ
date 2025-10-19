-- ============================================================================
-- FLOWORX SAFE ADD INDEXES SCRIPT
-- This script safely adds indexes with column existence checks
-- Run this AFTER the ultra-minimal-tables-only.sql has completed successfully
-- ============================================================================

-- ============================================================================
-- SAFELY CREATE PERFORMANCE INDEXES WITH COLUMN CHECKS
-- ============================================================================

-- Migration table indexes (with column existence checks)
DO $$
BEGIN
    -- Check if migration_backups table exists and has migration_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_backups' 
        AND column_name = 'migration_id'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_migration_backups_migration_id ON migration_backups(migration_id);
        RAISE NOTICE 'Created index on migration_backups.migration_id';
    ELSE
        RAISE NOTICE 'Skipping migration_backups.migration_id index - column does not exist';
    END IF;

    -- Check if migration_backups table exists and has timestamp column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_backups' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_migration_backups_timestamp ON migration_backups(timestamp);
        RAISE NOTICE 'Created index on migration_backups.timestamp';
    ELSE
        RAISE NOTICE 'Skipping migration_backups.timestamp index - column does not exist';
    END IF;
END $$;

-- Migration logs indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_migration_logs_status ON migration_logs(status);
        RAISE NOTICE 'Created index on migration_logs.status';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_migration_logs_timestamp ON migration_logs(timestamp);
        RAISE NOTICE 'Created index on migration_logs.timestamp';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'migration_logs' 
        AND column_name = 'migration_type'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_migration_logs_migration_type ON migration_logs(migration_type);
        RAISE NOTICE 'Created index on migration_logs.migration_type';
    END IF;
END $$;

-- Data exports indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_exports' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_data_exports_timestamp ON data_exports(timestamp);
        RAISE NOTICE 'Created index on data_exports.timestamp';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'data_exports' 
        AND column_name = 'export_type'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_data_exports_export_type ON data_exports(export_type);
        RAISE NOTICE 'Created index on data_exports.export_type';
    END IF;
END $$;

-- Outlook analytics indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outlook_analytics_events' 
        AND column_name = 'event_type'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_event_type ON outlook_analytics_events(event_type);
        RAISE NOTICE 'Created index on outlook_analytics_events.event_type';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outlook_analytics_events' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_timestamp ON outlook_analytics_events(timestamp);
        RAISE NOTICE 'Created index on outlook_analytics_events.timestamp';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outlook_analytics_events' 
        AND column_name = 'provider'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_provider ON outlook_analytics_events(provider);
        RAISE NOTICE 'Created index on outlook_analytics_events.provider';
    END IF;
END $$;

-- Outlook business events indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outlook_business_events' 
        AND column_name = 'event'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_outlook_business_events_event ON outlook_business_events(event);
        RAISE NOTICE 'Created index on outlook_business_events.event';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outlook_business_events' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_outlook_business_events_timestamp ON outlook_business_events(timestamp);
        RAISE NOTICE 'Created index on outlook_business_events.timestamp';
    END IF;
END $$;

-- Outlook alerts indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outlook_alerts' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_outlook_alerts_status ON outlook_alerts(status);
        RAISE NOTICE 'Created index on outlook_alerts.status';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outlook_alerts' 
        AND column_name = 'severity'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_outlook_alerts_severity ON outlook_alerts(severity);
        RAISE NOTICE 'Created index on outlook_alerts.severity';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'outlook_alerts' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_outlook_alerts_timestamp ON outlook_alerts(timestamp);
        RAISE NOTICE 'Created index on outlook_alerts.timestamp';
    END IF;
END $$;

-- Profile and integration indexes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'primary_provider'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_primary_provider ON profiles(primary_provider);
        RAISE NOTICE 'Created index on profiles.primary_provider';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'dual_provider_mode'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_dual_provider_mode ON profiles(dual_provider_mode);
        RAISE NOTICE 'Created index on profiles.dual_provider_mode';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'last_provider_change'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_last_provider_change ON profiles(last_provider_change);
        RAISE NOTICE 'Created index on profiles.last_provider_change';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integrations' 
        AND column_name = 'migration_status'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_integrations_migration_status ON integrations(migration_status);
        RAISE NOTICE 'Created index on integrations.migration_status';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integrations' 
        AND column_name = 'migrated_at'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_integrations_migrated_at ON integrations(migrated_at);
        RAISE NOTICE 'Created index on integrations.migrated_at';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'integrations' 
        AND column_name = 'migration_id'
        AND table_schema = 'public'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_integrations_migration_id ON integrations(migration_id);
        RAISE NOTICE 'Created index on integrations.migration_id';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify indexes exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('migration_backups', 'migration_logs', 'data_exports', 'outlook_analytics_events', 'outlook_business_events', 'outlook_alerts', 'profiles', 'integrations')
  AND schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Safe performance indexes added successfully!' as result;
SELECT 'All available indexes have been created with column existence checks.' as status;
SELECT 'Run the add-user-id-columns script next to add user scoping.' as next_step;
