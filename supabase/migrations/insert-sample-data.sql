-- ============================================================================
-- INSERT SAMPLE DATA FOR VOICE CONTEXT TESTING
-- This script works with your existing table schema
-- ============================================================================

-- Insert sample data for testing the voice context system
INSERT INTO ai_human_comparison (client_id, email_id, category, ai_draft, human_reply, created_at) VALUES
(
    'fedf818f-986f-4b30-bfa1-7fc339c7bb60', -- Replace with your test user ID
    'sample_email_001',
    'Sales',
    'Thank you for your interest in our product. I would be happy to schedule a demo for you.',
    'Thanks for reaching out! I''d love to show you how our solution can help your business. When would be a good time for a 30-minute demo?',
    NOW()
),
(
    'fedf818f-986f-4b30-bfa1-7fc339c7bb60', -- Replace with your test user ID
    'sample_email_002',
    'Support',
    'I understand you are experiencing an issue. Let me help you resolve this problem.',
    'Hi there! I''m sorry to hear you''re having trouble. Let''s get this sorted out for you right away. Can you tell me more about what''s happening?',
    NOW()
),
(
    'fedf818f-986f-4b30-bfa1-7fc339c7bb60', -- Replace with your test user ID
    'sample_email_003',
    'Urgent',
    'I have received your urgent request and will address it immediately.',
    'Got your urgent message! I''m on it right now and will have this resolved within the hour. I''ll keep you updated on progress.',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify sample data was inserted
SELECT 'Sample data inserted successfully' as status;
SELECT COUNT(*) as total_records FROM ai_human_comparison;
SELECT COUNT(*) as records_with_human_reply FROM ai_human_comparison WHERE human_reply IS NOT NULL;
