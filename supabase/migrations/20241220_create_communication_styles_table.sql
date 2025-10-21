-- Migration: Create communication_styles table
-- Base table for Voice Learning System
-- Date: 2024-12-20

-- Create communication_styles table
CREATE TABLE IF NOT EXISTS communication_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  style_profile JSONB,
  learning_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_communication_styles_user_id ON communication_styles(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_styles_updated ON communication_styles(last_updated DESC);

-- Enable Row Level Security
ALTER TABLE communication_styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own communication styles" ON communication_styles;
CREATE POLICY "Users can view their own communication styles" ON communication_styles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own communication styles" ON communication_styles;
CREATE POLICY "Users can insert their own communication styles" ON communication_styles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own communication styles" ON communication_styles;
CREATE POLICY "Users can update their own communication styles" ON communication_styles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own communication styles" ON communication_styles;
CREATE POLICY "Users can delete their own communication styles" ON communication_styles
  FOR DELETE USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE communication_styles IS 'Voice Learning System - Stores user communication styles learned from historical emails';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: communication_styles table created';
  RAISE NOTICE '📊 Columns: id, user_id, style_profile, learning_count, last_updated, created_at';
  RAISE NOTICE '🔒 RLS policies enabled for user data protection';
END $$;

