-- ============================================================================
-- FLOWORX RE-ENABLE RLS WITH PROPER POLICIES
-- This script re-enables RLS with secure policies after validation
-- Run this AFTER validation passes successfully
-- ============================================================================

-- ============================================================================
-- RE-ENABLE RLS ON ALL NEW TABLES
-- ============================================================================

ALTER TABLE migration_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_business_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE SECURE RLS POLICIES
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
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================

GRANT ALL ON migration_backups TO authenticated;
GRANT ALL ON migration_logs TO authenticated;
GRANT ALL ON data_exports TO authenticated;
GRANT ALL ON outlook_analytics_events TO authenticated;
GRANT ALL ON outlook_business_events TO authenticated;
GRANT ALL ON outlook_alerts TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'RLS re-enabled with secure policies!' as result;
SELECT 'All tables are now properly secured with user-scoped access.' as status;
SELECT 'Database migration is complete and secure.' as message;
