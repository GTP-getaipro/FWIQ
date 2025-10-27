-- Check existing data for specific users before cleanup
-- Target users: dizelll2007@gmail.com, ai@thehottubman.ca

-- Create temp table with target users
CREATE TEMP TABLE target_users AS
SELECT id, email 
FROM auth.users 
WHERE email IN ('dizelll2007@gmail.com', 'ai@thehottubman.ca')
   OR id IN ('867894f7-bc68-4f27-8f93-b8f14d55304b', 'fedf818f-986f-4b30-bfa1-7fc339c7bb60');

-- Show target users
SELECT 'TARGET USERS' as section, id, email
FROM target_users;

-- Check data counts across tables
SELECT 'PROFILES' as table_name, COUNT(*) as count
FROM profiles 
WHERE id IN (SELECT id FROM target_users)
UNION ALL

SELECT 'INTEGRATIONS' as table_name, COUNT(*) as count
FROM integrations 
WHERE user_id IN (SELECT id FROM target_users)
UNION ALL

SELECT 'WORKFLOWS' as table_name, COUNT(*) as count
FROM workflows 
WHERE user_id IN (SELECT id FROM target_users)
UNION ALL

SELECT 'EMAIL_LOGS' as table_name, COUNT(*) as count
FROM email_logs 
WHERE user_id IN (SELECT id FROM target_users)
UNION ALL

SELECT 'AI_RESPONSES' as table_name, COUNT(*) as count
FROM ai_responses 
WHERE user_id IN (SELECT id FROM target_users)
UNION ALL

SELECT 'COMMUNICATION_STYLES' as table_name, COUNT(*) as count
FROM communication_styles 
WHERE user_id IN (SELECT id FROM target_users)
UNION ALL

SELECT 'PERFORMANCE_METRICS' as table_name, COUNT(*) as count
FROM performance_metrics 
WHERE user_id IN (SELECT id FROM target_users);

-- Detailed profile data (basic columns only)
SELECT 'PROFILE DETAILS' as section, 
       p.id, p.email, p.onboarding_step
FROM profiles p
WHERE p.id IN (SELECT id FROM target_users);

-- Detailed integration data (basic columns only)
SELECT 'INTEGRATION DETAILS' as section,
       i.id, i.user_id, i.provider, i.status
FROM integrations i
WHERE i.user_id IN (SELECT id FROM target_users);

-- Clean up temp table
DROP TABLE target_users;