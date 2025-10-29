-- Check if performance_metrics table exists and has correct schema
-- Run this in Supabase SQL Editor

-- 1. Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'performance_metrics'
ORDER BY ordinal_position;

-- 2. Check if any data exists
SELECT COUNT(*) as total_records
FROM performance_metrics;

-- 3. Check recent records for this user
SELECT 
    user_id,
    metric_date,
    metric_name,
    metric_value,
    dimensions,
    created_at
FROM performance_metrics
WHERE user_id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if column is user_id or client_id
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'performance_metrics' AND column_name = 'user_id'
        ) THEN 'user_id'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'performance_metrics' AND column_name = 'client_id'
        ) THEN 'client_id'
        ELSE 'neither'
    END as id_column_name;

