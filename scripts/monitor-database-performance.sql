-- ============================================================================
-- FLOWORX DATABASE PERFORMANCE MONITORING
-- Run these queries in Supabase SQL Editor to monitor performance
-- ============================================================================

-- ============================================================================
-- 1. QUERY PERFORMANCE OVERVIEW
-- ============================================================================

-- Enable pg_stat_statements if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 20 slowest queries by average execution time
SELECT 
  LEFT(query, 100) AS query_preview,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_time_ms,
  ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
  ROUND(max_exec_time::numeric, 2) AS max_time_ms,
  ROUND(stddev_exec_time::numeric, 2) AS stddev_ms,
  ROUND((100.0 * total_exec_time / SUM(total_exec_time) OVER ())::numeric, 2) AS pct_total_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_catalog%'
  AND calls > 10  -- Only queries called more than 10 times
ORDER BY mean_exec_time DESC
LIMIT 20;

-- ============================================================================
-- 2. INDEX USAGE STATISTICS
-- ============================================================================

-- Check which indexes are being used most
SELECT 
  schemaname,
  tablename,
  indexrelname AS index_name,
  idx_scan AS times_used,
  idx_tup_read AS rows_read,
  idx_tup_fetch AS rows_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️ UNUSED'
    WHEN idx_scan < 100 THEN '⚡ LOW USAGE'
    WHEN idx_scan < 1000 THEN '✅ MODERATE'
    ELSE '🔥 HIGH USAGE'
  END AS usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- Unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS wasted_space,
  idx_scan AS times_used
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexrelname LIKE 'idx_%'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 3. TABLE STATISTICS
-- ============================================================================

-- Table sizes and row counts
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
  n_live_tup AS row_count,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Tables that need VACUUM
SELECT 
  schemaname,
  tablename,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
  AND n_dead_tup > n_live_tup * 0.1  -- More than 10% dead rows
ORDER BY dead_pct DESC;

-- ============================================================================
-- 4. CACHE HIT RATIOS
-- ============================================================================

-- Database-wide cache hit ratio (should be > 99%)
SELECT 
  'Database Cache Hit Ratio' AS metric,
  ROUND(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) AS hit_ratio_pct,
  CASE 
    WHEN ROUND(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) >= 99 THEN '✅ EXCELLENT'
    WHEN ROUND(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) >= 95 THEN '⚡ GOOD'
    WHEN ROUND(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2) >= 90 THEN '⚠️ FAIR'
    ELSE '🔴 POOR'
  END AS status
FROM pg_stat_database
WHERE datname = current_database();

-- Per-table cache hit ratios
SELECT 
  schemaname,
  tablename,
  heap_blks_read AS disk_reads,
  heap_blks_hit AS cache_hits,
  ROUND(100.0 * heap_blks_hit / NULLIF(heap_blks_hit + heap_blks_read, 0), 2) AS cache_hit_ratio_pct,
  CASE 
    WHEN ROUND(100.0 * heap_blks_hit / NULLIF(heap_blks_hit + heap_blks_read, 0), 2) >= 99 THEN '✅ EXCELLENT'
    WHEN ROUND(100.0 * heap_blks_hit / NULLIF(heap_blks_hit + heap_blks_read, 0), 2) >= 95 THEN '⚡ GOOD'
    WHEN ROUND(100.0 * heap_blks_hit / NULLIF(heap_blks_hit + heap_blks_read, 0), 2) >= 90 THEN '⚠️ FAIR'
    ELSE '🔴 POOR'
  END AS status
FROM pg_statio_user_tables
WHERE schemaname = 'public'
  AND (heap_blks_hit + heap_blks_read) > 0
ORDER BY cache_hit_ratio_pct ASC;

-- ============================================================================
-- 5. SEQUENTIAL SCANS (Should be minimal with proper indexes)
-- ============================================================================

-- Tables with high sequential scan counts
SELECT 
  schemaname,
  tablename,
  seq_scan AS sequential_scans,
  seq_tup_read AS rows_read_sequentially,
  idx_scan AS index_scans,
  n_live_tup AS row_count,
  ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) AS seq_scan_pct,
  CASE 
    WHEN seq_scan > idx_scan AND n_live_tup > 1000 THEN '⚠️ NEEDS INDEX'
    WHEN seq_scan > 100 AND n_live_tup > 10000 THEN '⚠️ CHECK QUERIES'
    ELSE '✅ OK'
  END AS status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 0
ORDER BY seq_scan DESC
LIMIT 20;

-- ============================================================================
-- 6. BLOAT ANALYSIS
-- ============================================================================

-- Estimate table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  ROUND(100 * n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS bloat_pct,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) * n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0)) AS estimated_bloat_size,
  CASE 
    WHEN ROUND(100 * n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 20 THEN '🔴 HIGH BLOAT - VACUUM NEEDED'
    WHEN ROUND(100 * n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 10 THEN '⚠️ MODERATE BLOAT'
    ELSE '✅ LOW BLOAT'
  END AS status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_live_tup > 0
ORDER BY bloat_pct DESC NULLS LAST;

-- ============================================================================
-- 7. LONG-RUNNING QUERIES
-- ============================================================================

-- Currently running queries (longer than 1 second)
SELECT 
  pid,
  now() - query_start AS duration,
  state,
  LEFT(query, 100) AS query_preview,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%'
  AND now() - query_start > interval '1 second'
ORDER BY duration DESC;

-- ============================================================================
-- 8. CONNECTION STATISTICS
-- ============================================================================

-- Active connections by state
SELECT 
  state,
  COUNT(*) AS connection_count,
  MAX(now() - query_start) AS longest_query_duration
FROM pg_stat_activity
WHERE pid != pg_backend_pid()
GROUP BY state
ORDER BY connection_count DESC;

-- ============================================================================
-- 9. SPECIFIC FLOWORX TABLE PERFORMANCE
-- ============================================================================

-- Email logs performance
SELECT 
  'email_logs' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS rows_last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS rows_last_7d,
  pg_size_pretty(pg_total_relation_size('email_logs')) AS total_size
FROM email_logs;

-- AI responses performance
SELECT 
  'ai_responses' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS rows_last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS rows_last_7d,
  pg_size_pretty(pg_total_relation_size('ai_responses')) AS total_size
FROM ai_responses;

-- Workflows performance
SELECT 
  'workflows' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE status = 'active') AS active_workflows,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS created_last_7d,
  pg_size_pretty(pg_total_relation_size('workflows')) AS total_size
FROM workflows;

-- ============================================================================
-- 10. INDEX HEALTH CHECK
-- ============================================================================

-- Verify all optimization indexes exist
SELECT 
  CASE 
    WHEN COUNT(*) >= 35 THEN '✅ ALL INDEXES PRESENT'
    ELSE '⚠️ MISSING INDEXES: ' || (35 - COUNT(*))::text
  END AS index_status,
  COUNT(*) AS index_count
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN (
    'email_logs', 'ai_responses', 'workflows', 
    'outlook_analytics_events', 'performance_metrics',
    'integrations', 'profiles', 'email_queue',
    'communication_styles', 'response_templates'
  );

-- List all optimization indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN (
    'email_logs', 'ai_responses', 'workflows', 
    'outlook_analytics_events', 'performance_metrics',
    'integrations', 'profiles'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- 11. RESET STATISTICS (Use with caution)
-- ============================================================================

-- Uncomment to reset query statistics (useful after optimization)
-- SELECT pg_stat_statements_reset();
-- SELECT pg_stat_reset();

-- ============================================================================
-- 12. MAINTENANCE COMMANDS
-- ============================================================================

-- Run VACUUM ANALYZE on all tables (improves performance)
-- VACUUM ANALYZE email_logs;
-- VACUUM ANALYZE ai_responses;
-- VACUUM ANALYZE workflows;
-- VACUUM ANALYZE outlook_analytics_events;
-- VACUUM ANALYZE performance_metrics;

-- Or run on all tables at once
-- VACUUM ANALYZE;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Run these queries regularly (daily or weekly)
-- 2. Save results to track performance trends over time
-- 3. Alert if cache hit ratio < 95%
-- 4. Alert if sequential scans > index scans on large tables
-- 5. Run VACUUM ANALYZE if bloat > 20%
-- 6. Remove unused indexes after 30 days of no usage
-- ============================================================================

