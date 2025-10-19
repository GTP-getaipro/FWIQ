-- ============================================================================
-- CREATE AI_DRAFT_LEARNING TABLE
-- This table stores AI draft learning data from N8N workflows
-- ============================================================================

-- Create ai_draft_learning table
CREATE TABLE IF NOT EXISTS public.ai_draft_learning (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thread_id VARCHAR(255),
    message_id VARCHAR(255),
    original_subject TEXT,
    original_from_email TEXT,
    original_body TEXT,
    ai_draft TEXT,
    classification JSONB,
    confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_draft_learning_user_id ON public.ai_draft_learning (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_draft_learning_thread_id ON public.ai_draft_learning (thread_id);
CREATE INDEX IF NOT EXISTS idx_ai_draft_learning_message_id ON public.ai_draft_learning (message_id);
CREATE INDEX IF NOT EXISTS idx_ai_draft_learning_created_at ON public.ai_draft_learning (created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_draft_learning ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY ai_draft_learning_tenant_isolation
ON public.ai_draft_learning
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.ai_draft_learning TO postgres;
GRANT ALL ON public.ai_draft_learning TO authenticated;
GRANT ALL ON public.ai_draft_learning TO anon;

-- Add trigger for updated_at
CREATE TRIGGER trg_ai_draft_learning_updated_at
    BEFORE UPDATE ON public.ai_draft_learning
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

SELECT 'AI draft learning table created successfully!' as result;
