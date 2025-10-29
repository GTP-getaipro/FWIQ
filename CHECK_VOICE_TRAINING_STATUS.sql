-- Check if voice training was completed during onboarding
-- Run this in Supabase SQL Editor

-- 1. Check if communication_styles exists and has data
SELECT 
    user_id,
    analysis_status,
    analysis_started_at,
    analysis_completed_at,
    skip_reason,
    learning_count,
    style_profile->'voice' AS voice_metrics,
    style_profile->'fewShotExamples' AS few_shot_examples,
    jsonb_typeof(style_profile->'fewShotExamples') AS examples_type,
    last_updated
FROM communication_styles
WHERE user_id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8';

-- 2. Check the full style_profile structure
SELECT 
    user_id,
    jsonb_pretty(style_profile) AS full_profile
FROM communication_styles
WHERE user_id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8';

-- 3. Check if voice analysis completed successfully
SELECT 
    user_id,
    analysis_status,
    CASE 
        WHEN style_profile IS NULL THEN 'No profile data'
        WHEN style_profile->'voice' IS NULL THEN 'No voice data'
        WHEN style_profile->'fewShotExamples' IS NULL THEN 'No examples data'
        ELSE 'Has data'
    END AS data_status,
    created_at,
    last_updated
FROM communication_styles
WHERE user_id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8';

