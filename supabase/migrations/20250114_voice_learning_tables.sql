-- Voice Learning Tables
-- These tables track AI draft corrections and enable continuous learning

-- Table: ai_draft_corrections
-- Stores every correction a user makes to an AI-generated draft
CREATE TABLE IF NOT EXISTS ai_draft_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  email_id TEXT NOT NULL,
  
  -- AI Draft
  ai_draft_text TEXT NOT NULL,
  ai_draft_html TEXT,
  ai_confidence DECIMAL(3,2),
  
  -- User Corrections
  user_final_text TEXT NOT NULL,
  user_final_html TEXT,
  
  -- Analysis
  edit_distance INTEGER NOT NULL, -- Levenshtein distance
  similarity_score DECIMAL(3,2) NOT NULL, -- 0-1 similarity
  correction_type TEXT NOT NULL CHECK (correction_type IN ('minor', 'moderate', 'major', 'complete_rewrite')),
  
  -- Categorization
  email_category TEXT, -- Support, Sales, Urgent, etc.
  correction_patterns JSONB, -- What was changed (tone, structure, facts, etc.)
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  -- Learning
  learned BOOLEAN DEFAULT FALSE,
  learning_applied_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB
);

-- Indexes for ai_draft_corrections
CREATE INDEX IF NOT EXISTS idx_corrections_user ON ai_draft_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_corrections_thread ON ai_draft_corrections(thread_id);
CREATE INDEX IF NOT EXISTS idx_corrections_category ON ai_draft_corrections(email_category);
CREATE INDEX IF NOT EXISTS idx_corrections_learned ON ai_draft_corrections(user_id, learned) WHERE learned = FALSE;
CREATE INDEX IF NOT EXISTS idx_corrections_created ON ai_draft_corrections(created_at DESC);

-- Table: voice_learning_metrics
-- Tracks overall learning progress and metrics for each user
CREATE TABLE IF NOT EXISTS voice_learning_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Overall Metrics
  total_drafts_generated INTEGER DEFAULT 0,
  total_corrections_made INTEGER DEFAULT 0,
  avg_edit_distance DECIMAL(8,2) DEFAULT 0,
  avg_similarity_score DECIMAL(3,2) DEFAULT 1.0,
  
  -- Category Metrics
  metrics_by_category JSONB DEFAULT '{}',
  
  -- Learning Progress
  learning_iterations INTEGER DEFAULT 0,
  voice_confidence DECIMAL(3,2) DEFAULT 0.5,
  last_learning_update TIMESTAMPTZ,
  learning_in_progress BOOLEAN DEFAULT FALSE,
  
  -- Trend Analysis
  improvement_trend JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for voice_learning_metrics
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_metrics_user ON voice_learning_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_metrics_confidence ON voice_learning_metrics(voice_confidence);

-- Add RLS (Row Level Security) policies
ALTER TABLE ai_draft_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_learning_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own corrections
CREATE POLICY "Users can view own corrections"
  ON ai_draft_corrections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own corrections
CREATE POLICY "Users can insert own corrections"
  ON ai_draft_corrections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own corrections
CREATE POLICY "Users can update own corrections"
  ON ai_draft_corrections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can view their own metrics
CREATE POLICY "Users can view own metrics"
  ON voice_learning_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own metrics
CREATE POLICY "Users can insert own metrics"
  ON voice_learning_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own metrics
CREATE POLICY "Users can update own metrics"
  ON voice_learning_metrics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on voice_learning_metrics
DROP TRIGGER IF EXISTS update_voice_metrics_updated_at ON voice_learning_metrics;
CREATE TRIGGER update_voice_metrics_updated_at
  BEFORE UPDATE ON voice_learning_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate correction stats
CREATE OR REPLACE FUNCTION calculate_correction_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_corrections BIGINT,
  avg_similarity NUMERIC,
  improvement_rate NUMERIC,
  zero_edit_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_corrections,
    AVG(similarity_score)::NUMERIC as avg_similarity,
    (AVG(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN similarity_score END) - 
     AVG(CASE WHEN created_at < NOW() - INTERVAL '7 days' THEN similarity_score END))::NUMERIC as improvement_rate,
    COUNT(CASE WHEN similarity_score > 0.98 THEN 1 END)::BIGINT as zero_edit_count
  FROM ai_draft_corrections
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on tables
COMMENT ON TABLE ai_draft_corrections IS 'Stores corrections users make to AI-generated email drafts for continuous learning';
COMMENT ON TABLE voice_learning_metrics IS 'Tracks overall AI learning progress and metrics per user';

-- Comment on columns
COMMENT ON COLUMN ai_draft_corrections.edit_distance IS 'Levenshtein distance between AI draft and user final';
COMMENT ON COLUMN ai_draft_corrections.similarity_score IS 'Similarity score (0-1) where 1 = identical';
COMMENT ON COLUMN ai_draft_corrections.correction_type IS 'Severity of correction: minor, moderate, major, or complete_rewrite';
COMMENT ON COLUMN ai_draft_corrections.learned IS 'Whether this correction has been incorporated into the voice profile';
COMMENT ON COLUMN voice_learning_metrics.voice_confidence IS 'AI confidence score (0-1) based on learning iterations';
COMMENT ON COLUMN voice_learning_metrics.improvement_trend IS 'Historical improvement data points';

-- Grant permissions for service role (for Edge Functions)
GRANT ALL ON ai_draft_corrections TO service_role;
GRANT ALL ON voice_learning_metrics TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Voice learning tables created successfully';
  RAISE NOTICE '📊 Tables: ai_draft_corrections, voice_learning_metrics';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '🎯 Ready for continuous AI learning!';
END $$;





