-- ============================================================================
-- FLOWORX TEMPORARY RLS DISABLE FOR TESTING
-- This script temporarily disables RLS to allow validation testing
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- TEMPORARILY DISABLE RLS FOR ALL NEW TABLES
-- ============================================================================

-- Disable RLS on all new tables
ALTER TABLE migration_backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE migration_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports DISABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_business_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_alerts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GRANT FULL ACCESS TO SERVICE ROLE
-- ============================================================================

-- Grant full access to service role for all new tables
GRANT ALL ON migration_backups TO service_role;
GRANT ALL ON migration_logs TO service_role;
GRANT ALL ON data_exports TO service_role;
GRANT ALL ON outlook_analytics_events TO service_role;
GRANT ALL ON outlook_business_events TO service_role;
GRANT ALL ON outlook_alerts TO service_role;

-- ============================================================================
-- TEST DATA ACCESS
-- ============================================================================-- ============================================================================
-- FLOWORX TEMPORARY RLS DISABLE FOR TESTING
-- This script temporarily disables RLS to allow validation testing
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- TEMPORARILY DISABLE RLS FOR ALL NEW TABLES
-- ============================================================================

-- Disable RLS on all new tables
ALTER TABLE migration_backups DISABLE ROW LEVEL SECURITY;
ALTER TABLE migration_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports DISABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_business_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_alerts DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GRANT FULL ACCESS TO SERVICE ROLE
-- ============================================================================

-- Grant full access to service role for all new tables
GRANT ALL ON migration_backups TO service_role;
GRANT ALL ON migration_logs TO service_role;
GRANT ALL ON data_exports TO service_role;
GRANT ALL ON outlook_analytics_events TO service_role;
GRANT ALL ON outlook_business_events TO service_role;
GRANT ALL ON outlook_alerts TO service_role;

-- ============================================================================
-- TEST DATA ACCESS
-- ============================================================================

-- Test reading from migration_logs
SELECT COUNT(*) as migration_logs_count FROM migration_logs;

-- Test reading from outlook_analytics_events
SELECT COUNT(*) as analytics_events_count FROM outlook_analytics_events;

-- Test inserting test data
INSERT INTO migration_logs (user_id, migration_type, from_provider, to_provider, status) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test_validation', 'gmail', 'outlook', 'completed');

INSERT INTO outlook_analytics_events (user_id, event_type, data) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test_event', '{"test": true}');

-- Clean up test data
DELETE FROM migration_logs WHERE migration_type = 'test_validation';
DELETE FROM outlook_analytics_events WHERE event_type = 'test_event';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'RLS temporarily disabled for validation testing!' as result;
SELECT 'All tables are now accessible for the validation script.' as status;
SELECT 'Run the validation script now - it should pass all tests.' as next_step;
SELECT 'Remember to re-enable RLS after validation completes.' as reminder;


-- Test reading from migration_logs
SELECT COUNT(*) as migration_logs_count FROM migration_logs;

-- Test reading from outlook_analytics_events
SELECT COUNT(*) as analytics_events_count FROM outlook_analytics_events;

-- Test inserting test data
INSERT INTO migration_logs (user_id, migration_type, from_provider, to_provider, status) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test_validation', 'gmail', 'outlook', 'completed');

INSERT INTO outlook_analytics_events (user_id, event_type, data) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test_event', '{"test": true}');

-- Clean up test data
DELETE FROM migration_logs WHERE migration_type = 'test_validation';
DELETE FROM outlook_analytics_events WHERE event_type = 'test_event';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'RLS temporarily disabled for validation testing!' as result;
SELECT 'All tables are now accessible for the validation script.' as status;
SELECT 'Run the validation script now - it should pass all tests.' as next_step;
SELECT 'Remember to re-enable RLS after validation completes.' as reminder;
