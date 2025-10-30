-- ============================================================================
-- Classification Feedback System for Continuous AI Learning
-- Date: October 30, 2025
-- Purpose: Capture user corrections to build business-specific training data
-- ============================================================================

-- ============================================================================
-- 1. Classification Feedback Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.classification_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id text NOT NULL,
  thread_id text,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'imap')),
  
  -- Original AI Classification
  original_classification jsonb NOT NULL,
  original_primary_category text,
  original_secondary_category text,
  original_confidence numeric(3,2),
  original_ai_can_reply boolean,
  
  -- User Corrections
  corrected_primary_category text NOT NULL,
  corrected_secondary_category text,
  corrected_tertiary_category text,
  corrected_ai_can_reply boolean,
  correction_reason text,
  
  -- Email Context (for training)
  email_subject text,
  email_from text,
  email_body_preview text, -- First 500 chars
  email_metadata jsonb, -- Additional context
  
  -- Feedback Metadata
  feedback_type text CHECK (feedback_type IN ('manual_correction', 'approve', 'reject', 'suggest')),
  confidence_rating integer CHECK (confidence_rating BETWEEN 1 AND 5), -- User's confidence in correction
  correction_source text CHECK (correction_source IN ('web_portal', 'gmail_addon', 'outlook_addon', 'api', 'mobile_app')),
  
  -- Learning Status
  training_status text DEFAULT 'pending' CHECK (training_status IN ('pending', 'approved', 'rejected', 'used_in_training', 'discarded')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_email_id CHECK (length(email_id) > 0),
  CONSTRAINT valid_categories CHECK (corrected_primary_category IS NOT NULL)
);

-- ============================================================================
-- 2. Classification Performance Metrics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.classification_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Volume Metrics
  total_classifications integer DEFAULT 0,
  total_corrections integer DEFAULT 0,
  correction_rate numeric(5,2), -- Percentage
  
  -- Category Accuracy (JSONB for flexibility)
  category_accuracy jsonb, -- { "SALES": 0.95, "SUPPORT": 0.88, ... }
  most_corrected_category text,
  least_corrected_category text,
  
  -- Confidence Analysis
  avg_original_confidence numeric(3,2),
  avg_confidence_when_wrong numeric(3,2),
  high_confidence_errors integer, -- Confident but wrong (>0.8 confidence)
  
  -- AI Reply Performance
  ai_replies_sent integer DEFAULT 0,
  ai_replies_corrected integer DEFAULT 0,
  ai_reply_accuracy numeric(5,2),
  
  -- Time-based metrics
  week_number integer,
  month_number integer,
  year integer,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, measurement_date)
);

-- ============================================================================
-- 3. Training Dataset Export View
-- ============================================================================
CREATE OR REPLACE VIEW public.classification_training_dataset AS
SELECT 
  cf.id,
  cf.user_id,
  cf.email_subject,
  cf.email_from,
  cf.email_body_preview,
  cf.email_metadata,
  
  -- Training labels (corrected classification)
  cf.corrected_primary_category as label_primary,
  cf.corrected_secondary_category as label_secondary,
  cf.corrected_tertiary_category as label_tertiary,
  cf.corrected_ai_can_reply as label_can_reply,
  
  -- Original prediction (for analysis)
  cf.original_primary_category,
  cf.original_confidence,
  
  -- Quality indicators
  cf.confidence_rating,
  cf.training_status,
  cf.feedback_type,
  
  -- Business context
  bp.business_types,
  bp.primary_business_type,
  bp.department_scope,
  
  cf.created_at
FROM classification_feedback cf
LEFT JOIN business_profiles bp ON cf.user_id = bp.user_id
WHERE cf.training_status IN ('approved', 'used_in_training')
  AND cf.confidence_rating >= 3 -- Only high-quality corrections
ORDER BY cf.created_at DESC;

-- ============================================================================
-- 4. Indexes for Performance
-- ============================================================================
CREATE INDEX idx_classification_feedback_user_id ON classification_feedback(user_id);
CREATE INDEX idx_classification_feedback_email_id ON classification_feedback(email_id);
CREATE INDEX idx_classification_feedback_created_at ON classification_feedback(created_at DESC);
CREATE INDEX idx_classification_feedback_training_status ON classification_feedback(training_status);
CREATE INDEX idx_classification_feedback_original_category ON classification_feedback(original_primary_category);
CREATE INDEX idx_classification_feedback_corrected_category ON classification_feedback(corrected_primary_category);

CREATE INDEX idx_performance_metrics_user_date ON classification_performance_metrics(user_id, measurement_date DESC);
CREATE INDEX idx_performance_metrics_date ON classification_performance_metrics(measurement_date DESC);

-- ============================================================================
-- 5. Row Level Security (RLS)
-- ============================================================================
ALTER TABLE classification_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE classification_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view own feedback" ON classification_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON classification_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON classification_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only see their own metrics
CREATE POLICY "Users can view own metrics" ON classification_performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Automatic Timestamp Updates
-- ============================================================================
CREATE OR REPLACE FUNCTION update_classification_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classification_feedback_updated_at
  BEFORE UPDATE ON classification_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_classification_feedback_updated_at();

CREATE TRIGGER classification_performance_metrics_updated_at
  BEFORE UPDATE ON classification_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_classification_feedback_updated_at();

-- ============================================================================
-- 7. Functions for Metrics Calculation
-- ============================================================================

-- Calculate daily metrics for a user
CREATE OR REPLACE FUNCTION calculate_classification_metrics(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  v_total_classifications integer;
  v_total_corrections integer;
  v_correction_rate numeric;
  v_category_accuracy jsonb;
  v_avg_confidence numeric;
  v_avg_confidence_wrong numeric;
  v_high_conf_errors integer;
BEGIN
  -- Count corrections for the date
  SELECT COUNT(*) INTO v_total_corrections
  FROM classification_feedback
  WHERE user_id = p_user_id 
    AND DATE(created_at) = p_date;
  
  -- If no corrections, exit
  IF v_total_corrections = 0 THEN
    RETURN;
  END IF;
  
  -- Calculate averages
  SELECT 
    AVG(original_confidence),
    COUNT(*) FILTER (WHERE original_confidence > 0.8)
  INTO v_avg_confidence, v_high_conf_errors
  FROM classification_feedback
  WHERE user_id = p_user_id 
    AND DATE(created_at) = p_date;
  
  -- Insert or update metrics
  INSERT INTO classification_performance_metrics (
    user_id,
    measurement_date,
    total_corrections,
    avg_original_confidence,
    high_confidence_errors,
    week_number,
    month_number,
    year
  ) VALUES (
    p_user_id,
    p_date,
    v_total_corrections,
    v_avg_confidence,
    v_high_conf_errors,
    EXTRACT(WEEK FROM p_date)::integer,
    EXTRACT(MONTH FROM p_date)::integer,
    EXTRACT(YEAR FROM p_date)::integer
  )
  ON CONFLICT (user_id, measurement_date) DO UPDATE SET
    total_corrections = EXCLUDED.total_corrections,
    avg_original_confidence = EXCLUDED.avg_original_confidence,
    high_confidence_errors = EXCLUDED.high_confidence_errors,
    updated_at = now();
    
  RAISE NOTICE 'Metrics calculated for user % on %', p_user_id, p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Export training data for a user (for fine-tuning)
CREATE OR REPLACE FUNCTION export_training_data(
  p_user_id uuid,
  p_min_quality integer DEFAULT 3,
  p_limit integer DEFAULT 1000
)
RETURNS TABLE (
  prompt text,
  completion text,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Prompt: Email content
    format('Subject: %s\nFrom: %s\n\n%s', 
      email_subject, 
      email_from, 
      email_body_preview
    ) as prompt,
    
    -- Completion: Corrected classification (JSON format for OpenAI fine-tuning)
    jsonb_build_object(
      'primary_category', corrected_primary_category,
      'secondary_category', corrected_secondary_category,
      'tertiary_category', corrected_tertiary_category,
      'ai_can_reply', corrected_ai_can_reply
    )::text as completion,
    
    -- Metadata for tracking
    jsonb_build_object(
      'feedback_id', id,
      'confidence_rating', confidence_rating,
      'created_at', created_at,
      'original_category', original_primary_category,
      'was_wrong', (original_primary_category != corrected_primary_category)
    ) as metadata
  FROM classification_feedback
  WHERE user_id = p_user_id
    AND training_status IN ('approved', 'used_in_training')
    AND confidence_rating >= p_min_quality
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Comments
-- ============================================================================
COMMENT ON TABLE classification_feedback IS 
  'Stores user corrections to AI email classifications for continuous learning and model improvement';

COMMENT ON COLUMN classification_feedback.original_classification IS 
  'Complete original AI classification result (JSONB for full context)';

COMMENT ON COLUMN classification_feedback.training_status IS 
  'pending: new correction, approved: verified for training, used_in_training: included in fine-tuning, rejected: invalid correction';

COMMENT ON TABLE classification_performance_metrics IS 
  'Aggregated daily metrics tracking AI classification accuracy and improvement over time';

COMMENT ON VIEW classification_training_dataset IS 
  'Curated, high-quality training dataset for AI model fine-tuning - only approved corrections with high confidence ratings';

COMMENT ON FUNCTION calculate_classification_metrics IS 
  'Calculates and stores daily classification performance metrics for a user';

COMMENT ON FUNCTION export_training_data IS 
  'Exports training data in OpenAI fine-tuning format (prompt/completion pairs)';

-- ============================================================================
-- 9. Success Log
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Classification Feedback System created successfully';
  RAISE NOTICE '   - classification_feedback table (stores corrections)';
  RAISE NOTICE '   - classification_performance_metrics table (tracks accuracy)';
  RAISE NOTICE '   - classification_training_dataset view (exports for fine-tuning)';
  RAISE NOTICE '   - RLS policies enabled for data security';
  RAISE NOTICE '   - Helper functions for metrics and export';
  RAISE NOTICE '';
  RAISE NOTICE '🎓 Next Steps:';
  RAISE NOTICE '   1. Build UI for users to correct classifications';
  RAISE NOTICE '   2. Add API endpoint to submit feedback';
  RAISE NOTICE '   3. Review corrections weekly';
  RAISE NOTICE '   4. Export data monthly for model fine-tuning';
  RAISE NOTICE '   5. Monitor metrics to track AI improvement';
END $$;

