-- ============================================================================
-- CREATE AI_HUMAN_COMPARISON TABLE
-- This table stores AI-generated drafts vs human edits for voice training
-- ============================================================================

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_human_comparison (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_id TEXT NOT NULL,
    category TEXT,
    ai_draft TEXT,
    human_reply TEXT,
    differences JSONB,
    analysis_results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_human_comparison_client ON ai_human_comparison(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_human_comparison_category ON ai_human_comparison(category);
CREATE INDEX IF NOT EXISTS idx_ai_human_comparison_created ON ai_human_comparison(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_human_comparison_human_reply ON ai_human_comparison(client_id, category) WHERE human_reply IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE ai_human_comparison ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own ai_human_comparison records" ON ai_human_comparison
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can insert their own ai_human_comparison records" ON ai_human_comparison
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own ai_human_comparison records" ON ai_human_comparison
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Users can delete their own ai_human_comparison records" ON ai_human_comparison
    FOR DELETE USING (auth.uid() = client_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_human_comparison_updated_at 
    BEFORE UPDATE ON ai_human_comparison 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- Only insert if the table has the expected structure
DO $$
BEGIN
    -- Check if email_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_human_comparison' 
        AND column_name = 'email_id' 
        AND table_schema = 'public'
    ) THEN
        -- Insert sample data
        INSERT INTO ai_human_comparison (client_id, email_id, category, ai_draft, human_reply) VALUES
        (
            'fedf818f-986f-4b30-bfa1-7fc339c7bb60', -- Replace with your test user ID
            'sample_email_001',
            'Sales',
            'Thank you for your interest in our product. I would be happy to schedule a demo for you.',
            'Thanks for reaching out! I''d love to show you how our solution can help your business. When would be a good time for a 30-minute demo?'
        ),
        (
            'fedf818f-986f-4b30-bfa1-7fc339c7bb60', -- Replace with your test user ID
            'sample_email_002',
            'Support',
            'I understand you are experiencing an issue. Let me help you resolve this problem.',
            'Hi there! I''m sorry to hear you''re having trouble. Let''s get this sorted out for you right away. Can you tell me more about what''s happening?'
        ),
        (
            'fedf818f-986f-4b30-bfa1-7fc339c7bb60', -- Replace with your test user ID
            'sample_email_003',
            'Urgent',
            'I have received your urgent request and will address it immediately.',
            'Got your urgent message! I''m on it right now and will have this resolved within the hour. I''ll keep you updated on progress.'
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Sample data inserted successfully';
    ELSE
        RAISE NOTICE 'Table structure mismatch - email_id column not found. Skipping sample data insertion.';
    END IF;
END $$;

-- Verify the table was created successfully
SELECT 'ai_human_comparison table created successfully' as status;
SELECT COUNT(*) as sample_records_count FROM ai_human_comparison;
