-- Safe User Data Cleanup Script
-- Removes all related data for specific users with CASCADE handling
-- Target users: drizell2007@gmail.com, art@thehotubman.ca

BEGIN;

-- Store user IDs for reference
CREATE TEMP TABLE users_to_delete AS
SELECT id, email 
FROM auth.users 
WHERE email IN ('drizell2007@gmail.com', 'art@thehotubman.ca')
   OR id IN ('8c789447-bc68-4f27-8f35-b8f1dd653040', 'fedf8f8f-986f-4b30-bfaf-7fc339c7bb60');

-- Verify users exist
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users_to_delete;
    RAISE NOTICE 'Found % users to delete', user_count;
    
    IF user_count = 0 THEN
        RAISE EXCEPTION 'No matching users found. Aborting cleanup.';
    END IF;
END $$;

-- 1. Clear AI-related data
DELETE FROM ai_usage_logs 
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM ai_responses 
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM ai_draft_corrections 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 2. Clear communication and response data
DELETE FROM communication_styles 
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM response_templates 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 3. Clear email-related data
DELETE FROM email_logs 
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM email_queue 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 4. Clear analytics and metrics
DELETE FROM performance_metrics 
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM outlook_analytics_events 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 5. Clear workflow data
DELETE FROM workflows 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 6. Clear integration data
DELETE FROM integrations 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 7. Clear migration-related data
DELETE FROM migration_backups 
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM migration_logs 
WHERE user_id IN (SELECT id FROM users_to_delete);

DELETE FROM data_exports 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 8. Clear notification settings
DELETE FROM notification_settings 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 9. Clear subscription data
DELETE FROM subscriptions 
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 10. Clear profiles (this should cascade to any remaining related data)
DELETE FROM profiles 
WHERE id IN (SELECT id FROM users_to_delete);

-- 11. Finally, remove from auth.users
DELETE FROM auth.users 
WHERE id IN (SELECT id FROM users_to_delete);

-- Verification queries
SELECT 
    'Cleanup Summary' as status,
    'Users deleted: ' || COUNT(*) as result
FROM users_to_delete

UNION ALL

SELECT 
    'Remaining profiles' as status,
    COUNT(*)::text as result
FROM profiles 
WHERE id IN ('8c789447-bc68-4f27-8f35-b8f1dd653040', 'fedf8f8f-986f-4b30-bfaf-7fc339c7bb60')

UNION ALL

SELECT 
    'Remaining auth users' as status,
    COUNT(*)::text as result
FROM auth.users 
WHERE email IN ('drizell2007@gmail.com', 'art@thehotubman.ca');

-- Clean up temp table
DROP TABLE users_to_delete;

COMMIT;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE '✅ User cleanup completed successfully!';
    RAISE NOTICE 'All data for specified users has been safely removed.';
    RAISE NOTICE 'Users: drizell2007@gmail.com, art@thehotubman.ca';
END $$;