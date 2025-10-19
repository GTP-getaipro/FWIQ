-- ============================================================================
-- FLOWORX MINIMAL COLUMN MIGRATION
-- This script only adds the missing columns identified by validation
-- Safe to run - no foreign key constraints that might cause errors
-- ============================================================================

-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
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
-- CREATE PERFORMANCE INDEXES FOR NEW COLUMNS
-- ============================================================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_primary_provider ON profiles(primary_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_dual_provider_mode ON profiles(dual_provider_mode);
CREATE INDEX IF NOT EXISTS idx_profiles_last_provider_change ON profiles(last_provider_change);

-- Integration indexes
CREATE INDEX IF NOT EXISTS idx_integrations_migration_status ON integrations(migration_status);
CREATE INDEX IF NOT EXISTS idx_integrations_migrated_at ON integrations(migrated_at);
CREATE INDEX IF NOT EXISTS idx_integrations_migration_id ON integrations(migration_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

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
WHERE tablename IN ('profiles', 'integrations')
  AND indexname LIKE 'idx_%_primary_provider%' 
   OR indexname LIKE 'idx_%_dual_provider_mode%'
   OR indexname LIKE 'idx_%_last_provider_change%'
   OR indexname LIKE 'idx_%_migration_status%'
   OR indexname LIKE 'idx_%_migrated_at%'
   OR indexname LIKE 'idx_%_migration_id%'
ORDER BY tablename, indexname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Missing columns have been added successfully!' as result;
SELECT 'Profiles and integrations tables are now ready for provider migration features.' as status;
SELECT 'Run the validation script again to confirm all columns are present.' as next_step;
