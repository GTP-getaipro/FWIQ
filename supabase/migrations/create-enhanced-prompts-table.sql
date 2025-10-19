-- Create table to store enhanced behavior prompts with historical email data
CREATE TABLE IF NOT EXISTS user_enhanced_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enhanced_behavior_prompt TEXT NOT NULL,
  voice_analysis JSONB,
  category_examples JSONB,
  prompt_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_enhanced_prompts_user_id ON user_enhanced_prompts(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_enhanced_prompts_updated_at 
  BEFORE UPDATE ON user_enhanced_prompts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE user_enhanced_prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own enhanced prompts
CREATE POLICY "Users can access own enhanced prompts" ON user_enhanced_prompts
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can access all enhanced prompts (for n8n deployment)
CREATE POLICY "Service role can access all enhanced prompts" ON user_enhanced_prompts
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON user_enhanced_prompts TO authenticated;
GRANT ALL ON user_enhanced_prompts TO service_role;
