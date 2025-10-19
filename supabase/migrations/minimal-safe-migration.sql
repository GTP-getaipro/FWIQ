-- ============================================================================
-- FLOWORX MINIMAL SAFE MIGRATION - NO USER_ID REFERENCES
-- This script creates tables and columns without any user_id references
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- CREATE MIGRATION MANAGEMENT TABLES (Ticket #91) - NO USER_ID COLUMNS
-- ============================================================================

-- Migration backups table for rollback functionality
CREATE TABLE IF NOT EXISTS migration_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration logs table for tracking migration history
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  export_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  includes TEXT[],
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE OUTLOOK ANALYTICS TABLES (Ticket #92) - NO USER_ID COLUMNS
-- ============================================================================

-- Outlook-specific analytics events
CREATE TABLE IF NOT EXISTS outlook_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) DEFAULT 'outlook',
  event_type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outlook business events
CREATE TABLE IF NOT EXISTS outlook_business_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event VARCHAR(100) NOT NULL,
  data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outlook alerts for monitoring
CREATE TABLE IF NOT EXISTS outlook_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- CREATE BASIC INDEXES (NO USER_ID INDEXES)
-- ============================================================================

-- Migration table indexes
CREATE INDEX IF NOT EXISTS idx_migration_backups_migration_id ON migration_backups(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_backups_timestamp ON migration_backups(timestamp);

CREATE INDEX IF NOT EXISTS idx_migration_logs_status ON migration_logs(status);
CREATE INDEX IF NOT EXISTS idx_migration_logs_timestamp ON migration_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_migration_logs_migration_type ON migration_logs(migration_type);

CREATE INDEX IF NOT EXISTS idx_data_exports_timestamp ON data_exports(timestamp);
CREATE INDEX IF NOT EXISTS idx_data_exports_export_type ON data_exports(export_type);

-- Outlook analytics indexes
CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_event_type ON outlook_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_timestamp ON outlook_analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_outlook_analytics_events_provider ON outlook_analytics_events(provider);

CREATE INDEX IF NOT EXISTS idx_outlook_business_events_event ON outlook_business_events(event);
CREATE INDEX IF NOT EXISTS idx_outlook_business_events_timestamp ON outlook_business_events(timestamp);

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

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Minimal safe migration completed successfully!' as result;
SELECT 'All required tables and columns have been created without user_id references.' as status;
SELECT 'Tables are ready for data - user_id columns can be added later.' as note;
SELECT 'Run the validation script to confirm everything is working correctly.' as next_step;
