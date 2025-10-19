-- ============================================================================
-- FLOWORX QUERY OPTIMIZATION - DATABASE INDEXES
-- This migration adds missing indexes to optimize frequently used queries
-- Run this in Supabase Dashboard SQL Editor
-- ============================================================================

-- ============================================================================
-- PERFORMANCE ANALYSIS
-- ============================================================================
-- This migration addresses:
-- 1. Missing composite indexes for common query patterns
-- 2. Indexes for date range queries
-- 3. Indexes for filtered list endpoints
-- 4. Indexes for analytics and reporting queries
-- ============================================================================

BEGIN;

-- ============================================================================
-- EMAIL_LOGS TABLE INDEXES
-- ============================================================================
-- Query pattern: SELECT * FROM email_logs WHERE user_id = ? ORDER BY created_at DESC
-- Query pattern: SELECT * FROM email_logs WHERE user_id = ? AND category = ? AND created_at >= ?

-- Composite index for user + timestamp (most common query)
CREATE INDEX IF NOT EXISTS idx_email_logs_user_created 
ON email_logs(user_id, created_at DESC);

-- Composite index for user + category + timestamp (filtered queries)
CREATE INDEX IF NOT EXISTS idx_email_logs_user_category_created 
ON email_logs(user_id, category, created_at DESC);

-- Composite index for user + urgency + timestamp
CREATE INDEX IF NOT EXISTS idx_email_logs_user_urgency_created 
ON email_logs(user_id, urgency, created_at DESC);

-- Index for email sender filtering
CREATE INDEX IF NOT EXISTS idx_email_logs_email_from 
ON email_logs(email_from);

-- Index for response status
CREATE INDEX IF NOT EXISTS idx_email_logs_response_sent 
ON email_logs(response_sent);

-- Index for escalation queries
CREATE INDEX IF NOT EXISTS idx_email_logs_escalated 
ON email_logs(escalated);

-- ============================================================================
-- AI_RESPONSES TABLE INDEXES
-- ============================================================================
-- Query pattern: SELECT * FROM ai_responses WHERE user_id = ? ORDER BY created_at DESC
-- Query pattern: SELECT * FROM ai_responses WHERE user_id = ? AND status = ?

-- Composite index for user + timestamp
CREATE INDEX IF NOT EXISTS idx_ai_responses_user_created 
ON ai_responses(user_id, created_at DESC);

-- Composite index for user + status + timestamp
CREATE INDEX IF NOT EXISTS idx_ai_responses_user_status_created 
ON ai_responses(user_id, status, created_at DESC);

-- Index for email_id lookups (join queries)
CREATE INDEX IF NOT EXISTS idx_ai_responses_email_id 
ON ai_responses(email_id);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_ai_responses_category 
ON ai_responses(category);

-- Index for response type filtering
CREATE INDEX IF NOT EXISTS idx_ai_responses_response_type 
ON ai_responses(response_type);

-- Index for prompt hash (cache lookups)
CREATE INDEX IF NOT EXISTS idx_ai_responses_prompt_hash 
ON ai_responses(prompt_hash) WHERE prompt_hash IS NOT NULL;

-- ============================================================================
-- WORKFLOWS TABLE INDEXES
-- ============================================================================
-- Query pattern: SELECT * FROM workflows WHERE user_id = ? AND status = ? ORDER BY created_at DESC

-- Composite index for user + status + timestamp
CREATE INDEX IF NOT EXISTS idx_workflows_user_status_created 
ON workflows(user_id, status, created_at DESC);

-- Index for workflow name searches
CREATE INDEX IF NOT EXISTS idx_workflows_name 
ON workflows(name);

-- Index for n8n_workflow_id lookups
CREATE INDEX IF NOT EXISTS idx_workflows_n8n_id 
ON workflows(n8n_workflow_id) WHERE n8n_workflow_id IS NOT NULL;

-- ============================================================================
-- OUTLOOK_ANALYTICS_EVENTS TABLE INDEXES
-- ============================================================================
-- Query pattern: SELECT * FROM outlook_analytics_events WHERE user_id = ? AND timestamp >= ?

-- Composite index for user + timestamp
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp 
ON outlook_analytics_events(user_id, timestamp DESC);

-- Composite index for user + event_type + timestamp
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type_timestamp 
ON outlook_analytics_events(user_id, event_type, timestamp DESC);

-- Index for provider filtering
CREATE INDEX IF NOT EXISTS idx_analytics_events_provider 
ON outlook_analytics_events(provider);

-- ============================================================================
-- PERFORMANCE_METRICS TABLE INDEXES
-- ============================================================================
-- Query pattern: SELECT * FROM performance_metrics WHERE client_id = ? AND metric_date >= ?

-- Composite index for client + metric_date
CREATE INDEX IF NOT EXISTS idx_performance_metrics_client_date 
ON performance_metrics(client_id, metric_date DESC);

-- Composite index for client + metric_name + date
CREATE INDEX IF NOT EXISTS idx_performance_metrics_client_name_date 
ON performance_metrics(client_id, metric_name, metric_date DESC);

-- Index for metric_name filtering
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name 
ON performance_metrics(metric_name);

-- ============================================================================
-- INTEGRATIONS TABLE INDEXES
-- ============================================================================
-- Query pattern: SELECT * FROM integrations WHERE user_id = ? AND provider = ?

-- Composite index for user + provider (already exists in some migrations, but ensuring)
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider 
ON integrations(user_id, provider);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_integrations_status 
ON integrations(status);

-- Index for expires_at (token refresh queries)
CREATE INDEX IF NOT EXISTS idx_integrations_expires_at 
ON integrations(expires_at) WHERE expires_at IS NOT NULL;

-- Index for last_sync (sync status queries)
CREATE INDEX IF NOT EXISTS idx_integrations_last_sync 
ON integrations(last_sync DESC) WHERE last_sync IS NOT NULL;

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================
-- Query pattern: SELECT * FROM profiles WHERE id = ? (already has primary key)
-- Query pattern: SELECT * FROM profiles WHERE email = ?

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email) WHERE email IS NOT NULL;

-- Index for business_type filtering
CREATE INDEX IF NOT EXISTS idx_profiles_business_type 
ON profiles(business_type) WHERE business_type IS NOT NULL;

-- Index for onboarding_step (onboarding queries)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_step 
ON profiles(onboarding_step) WHERE onboarding_step IS NOT NULL;

-- ============================================================================
-- EMAIL_QUEUE TABLE INDEXES (if exists)
-- ============================================================================
-- Query pattern: SELECT * FROM email_queue WHERE status = ? AND scheduled_for <= NOW()

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'email_queue' 
        AND table_schema = 'public'
    ) THEN
        -- Composite index for status + scheduled_for
        CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled 
        ON email_queue(status, scheduled_for);

        -- Index for user_id + status
        CREATE INDEX IF NOT EXISTS idx_email_queue_user_status 
        ON email_queue(user_id, status);

        -- Index for priority
        CREATE INDEX IF NOT EXISTS idx_email_queue_priority 
        ON email_queue(priority DESC);

        RAISE NOTICE 'Created indexes on email_queue table';
    END IF;
END $$;

-- ============================================================================
-- COMMUNICATION_STYLES TABLE INDEXES (if exists)
-- ============================================================================
-- Query pattern: SELECT * FROM communication_styles WHERE user_id = ?

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'communication_styles' 
        AND table_schema = 'public'
    ) THEN
        -- Index for user_id
        CREATE INDEX IF NOT EXISTS idx_communication_styles_user_id 
        ON communication_styles(user_id);

        -- Index for updated_at (recent styles)
        CREATE INDEX IF NOT EXISTS idx_communication_styles_updated 
        ON communication_styles(updated_at DESC);

        RAISE NOTICE 'Created indexes on communication_styles table';
    END IF;
END $$;

-- ============================================================================
-- RESPONSE_TEMPLATES TABLE INDEXES (if exists)
-- ============================================================================
-- Query pattern: SELECT * FROM response_templates WHERE user_id = ? AND category = ?

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'response_templates' 
        AND table_schema = 'public'
    ) THEN
        -- Composite index for user + category
        CREATE INDEX IF NOT EXISTS idx_response_templates_user_category 
        ON response_templates(user_id, category);

        -- Index for active templates
        CREATE INDEX IF NOT EXISTS idx_response_templates_active 
        ON response_templates(active) WHERE active = true;

        RAISE NOTICE 'Created indexes on response_templates table';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- List all indexes created by this migration
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN (
    'email_logs', 'ai_responses', 'workflows', 
    'outlook_analytics_events', 'performance_metrics',
    'integrations', 'profiles', 'email_queue',
    'communication_styles', 'response_templates'
  )
ORDER BY tablename, indexname;

-- Check index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Analyze tables to update statistics
ANALYZE email_logs;
ANALYZE ai_responses;
ANALYZE workflows;
ANALYZE outlook_analytics_events;
ANALYZE performance_metrics;
ANALYZE integrations;
ANALYZE profiles;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All indexes use IF NOT EXISTS to prevent errors on re-run
-- 2. Composite indexes are ordered by selectivity (most selective first)
-- 3. DESC ordering on timestamp columns for ORDER BY DESC queries
-- 4. Partial indexes (WHERE clauses) for nullable columns to save space
-- 5. ANALYZE updates query planner statistics for optimal query plans
-- ============================================================================

