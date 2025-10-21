-- Migration: Enhance communication_styles table for Voice Learning System 2.0
-- Adds status tracking, metadata, and quality metrics

-- Add new columns to communication_styles table
ALTER TABLE communication_styles 
ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_sample_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skip_reason TEXT,
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER CHECK (data_quality_score >= 0 AND data_quality_score <= 100);

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_communication_styles_status ON communication_styles(analysis_status);
CREATE INDEX IF NOT EXISTS idx_communication_styles_user_status ON communication_styles(user_id, analysis_status);

-- Add comment to explain the table
COMMENT ON TABLE communication_styles IS 'Voice Learning System 2.0 - Stores user communication styles learned from historical emails';

-- Add comments to new columns
COMMENT ON COLUMN communication_styles.analysis_status IS 'Current status: pending, in_progress, completed, skipped, failed';
COMMENT ON COLUMN communication_styles.analysis_started_at IS 'Timestamp when voice analysis started';
COMMENT ON COLUMN communication_styles.analysis_completed_at IS 'Timestamp when voice analysis completed';
COMMENT ON COLUMN communication_styles.email_sample_count IS 'Number of emails analyzed for this profile';
COMMENT ON COLUMN communication_styles.skip_reason IS 'Reason why analysis was skipped or failed';
COMMENT ON COLUMN communication_styles.data_quality_score IS 'Quality score 0-100 based on email count, confidence, examples, and phrases';

-- Update existing rows to have 'completed' status if they have a style_profile
UPDATE communication_styles 
SET analysis_status = 'completed',
    analysis_completed_at = last_updated
WHERE style_profile IS NOT NULL 
  AND analysis_status IS NULL;

-- Update existing rows without style_profile to 'pending'
UPDATE communication_styles 
SET analysis_status = 'pending'
WHERE style_profile IS NULL 
  AND analysis_status IS NULL;

-- Add helpful view for monitoring voice learning status
CREATE OR REPLACE VIEW voice_learning_status AS
SELECT 
  cs.user_id,
  p.email as user_email,
  cs.analysis_status,
  cs.email_sample_count,
  cs.data_quality_score,
  cs.learning_count,
  cs.analysis_started_at,
  cs.analysis_completed_at,
  cs.last_updated,
  cs.skip_reason,
  CASE 
    WHEN cs.style_profile IS NOT NULL THEN 'Has Profile'
    ELSE 'No Profile'
  END as profile_status,
  EXTRACT(EPOCH FROM (cs.analysis_completed_at - cs.analysis_started_at)) as analysis_duration_seconds
FROM communication_styles cs
LEFT JOIN auth.users u ON cs.user_id = u.id
LEFT JOIN profiles p ON cs.user_id = p.id
ORDER BY cs.last_updated DESC;

-- Grant access to the view
GRANT SELECT ON voice_learning_status TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: communication_styles table enhanced for Voice Learning System 2.0';
  RAISE NOTICE '📊 New columns added: analysis_status, analysis_started_at, analysis_completed_at, email_sample_count, skip_reason, data_quality_score';
  RAISE NOTICE '📈 View created: voice_learning_status for monitoring';
END $$;

