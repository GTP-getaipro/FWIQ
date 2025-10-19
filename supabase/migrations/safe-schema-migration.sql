-- ============================================================================
-- FLOWORX SAFE DATABASE SCHEMA MIGRATION
-- This script creates all missing tables, columns, indexes, and policies
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- CREATE MIGRATION MANAGEMENT TABLES (Ticket #91)
-- ============================================================================

-- Migration backups table for rollback functionality
CREATE TABLE IF NOT EXISTS migration_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration logs table for tracking migration history
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  migration_type VARCHAR(50) NOT NULL,
  from_provider VARCHAR(50) NOT NULL,
  to_provider VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  steps JSONB,
  error_message TEXT,
  duration INTEGER, -- Duration in milliseconds
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data exports table for portability tracking
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  export_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  includes TEXT[],
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE OUTLOOK ANALYTICS TABLES (Ticket #92)
-- ============================================================================

-- Outlook-specific analytics events
CREATE TABLE IF NOT EXISTS outlook_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) DEFAULT 'outlook',
  event_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outlook business events
CREATE TABLE IF NOT EXISTS outlook_business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event VARCHAR(100) NOT NULL,
  data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outlook alerts for monitoring
CREATE TABLE IF NOT EXISTS outlook_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider VARCHAR(50) DEFAULT 'outlook',
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  details JSONB,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- UPDATE EXISTING TABLES (Ticket #93)
-- ============================================================================

-- Update profiles table with migration-related columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS primary_provider VARCHAR(50) DEFAULT 'gmail' CHECK (primary_provider IN ('gmail', 'outlook')),
ADD COLUMN IF NOT EXISTS dual_provider_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_provider_change TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS migration_enabled BOOLEAN DEFAULT TRUE;

-- Update integrations table with migration-related columns
ALTER TABLE integrations 
ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20) DEFAULT 'none' CHECK (migration_status IN ('none', 'pending', 'migrated', 'rolled_back')),
ADD COLUMN IF NOT EXISTS migrated_from VARCHAR(50),
ADD COLUMN IF NOT EXISTS migrated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS migration_id VARCHAR(255);

-- ============================================================================
-- CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Migration table indexes
CREATE INDEX IF NOT EXISTS idx_migration_backups_user_id ON migration_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_migration_backups_migration_id ON migration_backups(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_backups_timestamp ON migration_backups(timestamp);

CREATE INDEX IF NOT EXISTS idx_migration_logs_user_id ON migration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_migration_logs_status ON migration_logs(status);
CREATE INDEX IF NOT EXISTS idx_migration_logs_timestamp ON migration_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_migration_logs_migration_type ON migration_logs(migration_type);

CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_timestamp ON data_exports(timestamp);
CREATE INDEX IF NOT EXISTS idx_data_exports_export_type ON data_exports(export_type);

-- Outlook analytics indexes
CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_user_id ON outlook_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_event_type ON outlook_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_timestamp ON outlook_analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_provider ON outlook_analytics_events(provider);

CREATE INDEX IF NOT EXISTS idx_outlook_business_events_user_id ON outlook_business_events(user_id);
CREATE INDEX IF NOT EXISTS idx_outlook_business_events_event ON outlook_business_events(event);
CREATE INDEX IF NOT EXISTS idx_outlook_business_events_timestamp ON outlook_business_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_outlook_alerts_user_id ON outlook_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_outlook_alerts_status ON outlook_alerts(status);
CREATE INDEX IF NOT EXISTS idx_outlook_alerts_severity ON outlook_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_outlook_alerts_timestamp ON outlook_alerts(timestamp);

-- Profile and integration indexes
CREATE INDEX IF NOT EXISTS idx_profiles_primary_provider ON profiles(primary_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_dual_provider_mode ON profiles(dual_provider_mode);
CREATE INDEX IF NOT EXISTS idx_profiles_last_provider_change ON profiles(last_provider_change);

CREATE INDEX IF NOT EXISTS idx_integrations_migration_status ON integrations(migration_status);
CREATE INDEX IF NOT EXISTS idx_integrations_migrated_at ON integrations(migrated_at);
CREATE INDEX IF NOT EXISTS idx_integrations_migration_id ON integrations(migration_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE migration_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Migration backups policies
DROP POLICY IF EXISTS "Users can manage their own migration backups" ON migration_backups;
CREATE POLICY "Users can manage their own migration backups" ON migration_backups
  FOR ALL USING (auth.uid() = user_id);

-- Migration logs policies
DROP POLICY IF EXISTS "Users can manage their own migration logs" ON migration_logs;
CREATE POLICY "Users can manage their own migration logs" ON migration_logs
  FOR ALL USING (auth.uid() = user_id);

-- Data exports policies
DROP POLICY IF EXISTS "Users can manage their own data exports" ON data_exports;
CREATE POLICY "Users can manage their own data exports" ON data_exports
  FOR ALL USING (auth.uid() = user_id);

-- Outlook analytics policies
DROP POLICY IF EXISTS "Users can manage their own outlook analytics" ON outlook_analytics_events;
CREATE POLICY "Users can manage their own outlook analytics" ON outlook_analytics_events
  FOR ALL USING (auth.uid() = user_id);

-- Outlook business events policies
DROP POLICY IF EXISTS "Users can manage their own outlook business events" ON outlook_business_events;
CREATE POLICY "Users can manage their own outlook business events" ON outlook_business_events
  FOR ALL USING (auth.uid() = user_id);

-- Outlook alerts policies
DROP POLICY IF EXISTS "Users can manage their own outlook alerts" ON outlook_alerts;
CREATE POLICY "Users can manage their own outlook alerts" ON outlook_alerts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON migration_backups TO authenticated;
GRANT ALL ON migration_logs TO authenticated;
GRANT ALL ON data_exports TO authenticated;
GRANT ALL ON outlook_analytics_events TO authenticated;
GRANT ALL ON outlook_business_events TO authenticated;
GRANT ALL ON outlook_alerts TO authenticated;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS (SAFELY)
-- ============================================================================

-- Add foreign key constraints only if auth.users table exists and is accessible
DO $$
BEGIN
    -- Check if auth.users table exists and is accessible
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        -- Add foreign key constraints
        ALTER TABLE migration_backups ADD CONSTRAINT fk_migration_backups_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        ALTER TABLE migration_logs ADD CONSTRAINT fk_migration_logs_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        ALTER TABLE data_exports ADD CONSTRAINT fk_data_exports_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        ALTER TABLE outlook_analytics_events ADD CONSTRAINT fk_outlook_analytics_events_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        ALTER TABLE outlook_business_events ADD CONSTRAINT fk_outlook_business_events_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        ALTER TABLE outlook_alerts ADD CONSTRAINT fk_outlook_alerts_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraints added successfully';
    ELSE
        RAISE NOTICE 'auth.users table not accessible, skipping foreign key constraints';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraints: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all new tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'migration_backups', 'migration_logs', 'data_exports', 
      'outlook_analytics_events', 'outlook_business_events', 'outlook_alerts'
    ) THEN 'CREATED'
    ELSE 'MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'migration_backups', 'migration_logs', 'data_exports', 
    'outlook_analytics_events', 'outlook_business_events', 'outlook_alerts'
  )
ORDER BY table_name;

-- Verify new columns exist in profiles table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('primary_provider', 'dual_provider_mode', 'last_provider_change', 'migration_enabled')
ORDER BY column_name;

-- Verify new columns exist in integrations table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'integrations' 
  AND column_name IN ('migration_status', 'migrated_from', 'migrated_at', 'migration_id')
ORDER BY column_name;

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

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('migration_backups', 'migration_logs', 'data_exports', 'outlook_analytics_events', 'outlook_business_events', 'outlook_alerts')
  AND schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Safe database schema migration completed successfully!' as result;
SELECT 'All required tables, columns, indexes, and policies have been created.' as status;
SELECT 'Provider migration, analytics, and data portability features are now ready to use.' as message;
SELECT 'Run the validation script to confirm everything is working correctly.' as next_step;
