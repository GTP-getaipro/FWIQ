-- Migration: Enhance communication_styles table for AI Voice Training
-- Adds dedicated columns for vocabulary patterns, tone analysis, signature phrases, 
-- response templates, sample size, and updated_at timestamp
-- Date: 2025-01-22

-- Add new columns for AI Voice Training
ALTER TABLE communication_styles 
ADD COLUMN IF NOT EXISTS vocabulary_patterns JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tone_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS signature_phrases TEXT[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS response_templates JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS sample_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_communication_styles_vocabulary 
  ON communication_styles USING GIN (vocabulary_patterns);

CREATE INDEX IF NOT EXISTS idx_communication_styles_tone 
  ON communication_styles USING GIN (tone_analysis);

CREATE INDEX IF NOT EXISTS idx_communication_styles_templates 
  ON communication_styles USING GIN (response_templates);

CREATE INDEX IF NOT EXISTS idx_communication_styles_sample_size 
  ON communication_styles(sample_size DESC);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_communication_styles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_styles_updated_at ON communication_styles;
CREATE TRIGGER trg_communication_styles_updated_at
  BEFORE UPDATE ON communication_styles
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_styles_updated_at();

-- Add comments to explain each column
COMMENT ON COLUMN communication_styles.vocabulary_patterns IS 'JSONB storing common words, phrases, and linguistic patterns used by the user. Format: {"common_words": [...], "preferred_phrases": [...], "avoid_words": [...]}';

COMMENT ON COLUMN communication_styles.tone_analysis IS 'JSONB storing tone metrics. Format: {"formality": "professional", "personality": "friendly", "confidence_level": 0.85, "tone": "professional and helpful"}';

COMMENT ON COLUMN communication_styles.signature_phrases IS 'Array of signature phrases the user commonly uses. Example: ["Best regards", "Let me know if you need anything else"]';

COMMENT ON COLUMN communication_styles.response_templates IS 'JSONB storing response templates by category. Format: {"greeting": "...", "closing": "...", "followup": "...", "urgent": "..."}';

COMMENT ON COLUMN communication_styles.sample_size IS 'Number of emails analyzed to build this communication style profile';

COMMENT ON COLUMN communication_styles.updated_at IS 'Timestamp of last update (automatically managed by trigger)';

-- Migrate existing data from style_profile JSONB to dedicated columns
-- This preserves backward compatibility while moving to the new structure
UPDATE communication_styles
SET 
  vocabulary_patterns = COALESCE(style_profile->'vocabulary', '{}'::jsonb),
  tone_analysis = jsonb_build_object(
    'tone', COALESCE(style_profile->>'tone', 'professional'),
    'formality', COALESCE(style_profile->>'formality', 'professional'),
    'personality', COALESCE(style_profile->>'personality', 'friendly'),
    'confidence_level', COALESCE((style_profile->>'confidence_level')::numeric, 0.75)
  ),
  signature_phrases = COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(style_profile->'signaturePhrases')),
    ARRAY[]::text[]
  ),
  response_templates = COALESCE(style_profile->'response_templates', '{}'::jsonb),
  sample_size = COALESCE((style_profile->>'sample_size')::integer, learning_count),
  updated_at = COALESCE(last_updated, NOW())
WHERE style_profile IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: communication_styles table enhanced for AI Voice Training';
  RAISE NOTICE '📊 New columns added:';
  RAISE NOTICE '   - vocabulary_patterns (JSONB) - Common words and phrases';
  RAISE NOTICE '   - tone_analysis (JSONB) - Tone, formality, personality metrics';
  RAISE NOTICE '   - signature_phrases (TEXT[]) - User signature phrases';
  RAISE NOTICE '   - response_templates (JSONB) - Response templates by category';
  RAISE NOTICE '   - sample_size (INTEGER) - Number of emails analyzed';
  RAISE NOTICE '   - updated_at (TIMESTAMPTZ) - Auto-managed timestamp';
  RAISE NOTICE '🔄 Existing data migrated from style_profile JSONB';
  RAISE NOTICE '⚡ Performance indexes created for JSONB columns';
  RAISE NOTICE '🔒 RLS policies remain unchanged';
END $$;

