-- Migration: Secure System Messages
-- Creates secure storage for system messages to prevent source code exposure
-- Date: 2025-01-15

-- System message metadata
CREATE TABLE IF NOT EXISTS system_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_type VARCHAR(50) NOT NULL, -- 'classifier', 'draft_agent', 'multi_business'
  business_types TEXT[] NOT NULL,
  message_hash VARCHAR(128) NOT NULL, -- SHA-256 hash for integrity
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, message_type, business_types)
);

-- Encrypted system message content
CREATE TABLE IF NOT EXISTS system_message_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES system_messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- Encrypted content
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_messages_user_type ON system_messages(user_id, message_type);
CREATE INDEX IF NOT EXISTS idx_system_messages_hash ON system_messages(message_hash);
CREATE INDEX IF NOT EXISTS idx_system_messages_active ON system_messages(is_active);
CREATE INDEX IF NOT EXISTS idx_system_message_content_message_id ON system_message_content(message_id);
CREATE INDEX IF NOT EXISTS idx_system_message_content_version ON system_message_content(message_id, version);

-- Row Level Security
ALTER TABLE system_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_message_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_messages
DROP POLICY IF EXISTS "Users can only access their own system messages" ON system_messages;
CREATE POLICY "Users can only access their own system messages" ON system_messages
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for system_message_content
DROP POLICY IF EXISTS "Users can only access content of their own messages" ON system_message_content;
CREATE POLICY "Users can only access content of their own messages" ON system_message_content
  FOR ALL USING (
    message_id IN (
      SELECT id FROM system_messages WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_system_message_updated_at ON system_messages;
CREATE TRIGGER trigger_update_system_message_updated_at
  BEFORE UPDATE ON system_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_system_message_updated_at();

-- Function to clean up old versions (keep last 5 versions)
CREATE OR REPLACE FUNCTION cleanup_old_system_message_versions()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old versions, keeping only the last 5
  DELETE FROM system_message_content 
  WHERE message_id = NEW.message_id 
    AND version < (
      SELECT MAX(version) - 4 
      FROM system_message_content 
      WHERE message_id = NEW.message_id
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up old versions
DROP TRIGGER IF EXISTS trigger_cleanup_old_versions ON system_message_content;
CREATE TRIGGER trigger_cleanup_old_versions
  AFTER INSERT ON system_message_content
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_system_message_versions();

-- Function to get latest system message content
CREATE OR REPLACE FUNCTION get_latest_system_message_content(message_id_param UUID)
RETURNS TABLE(content TEXT, version INTEGER, created_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  SELECT smc.content, smc.version, smc.created_at
  FROM system_message_content smc
  WHERE smc.message_id = message_id_param
  ORDER BY smc.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system message with latest content
CREATE OR REPLACE FUNCTION get_system_message_with_content(message_id_param UUID, user_id_param UUID)
RETURNS TABLE(
  id UUID,
  message_type VARCHAR(50),
  business_types TEXT[],
  message_hash VARCHAR(64),
  content TEXT,
  version INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.message_type,
    sm.business_types,
    sm.message_hash,
    smc.content,
    smc.version,
    sm.created_at,
    sm.updated_at
  FROM system_messages sm
  JOIN system_message_content smc ON sm.id = smc.message_id
  WHERE sm.id = message_id_param 
    AND sm.user_id = user_id_param
    AND sm.is_active = true
    AND smc.version = (
      SELECT MAX(version) 
      FROM system_message_content 
      WHERE message_id = sm.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON system_messages TO authenticated;
GRANT ALL ON system_message_content TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_system_message_content(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_message_with_content(UUID, UUID) TO authenticated;

-- Insert sample data for testing (optional)
-- This can be removed in production
INSERT INTO system_messages (user_id, message_type, business_types, message_hash, is_active)
VALUES 
  (
    (SELECT id FROM profiles LIMIT 1),
    'classifier',
    ARRAY['pools_spas'],
    'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
    true
  )
ON CONFLICT (user_id, message_type, business_types) DO NOTHING;

-- Insert sample encrypted content (this would be encrypted in real usage)
INSERT INTO system_message_content (message_id, content, version)
SELECT 
  sm.id,
  '{"encrypted":"sample_encrypted_content","iv":"sample_iv","authTag":"sample_auth_tag"}',
  1
FROM system_messages sm
WHERE sm.message_type = 'classifier'
  AND sm.message_hash = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890'
ON CONFLICT DO NOTHING;

-- Create view for easy querying (optional)
CREATE OR REPLACE VIEW system_message_summary AS
SELECT 
  sm.id,
  sm.user_id,
  sm.message_type,
  sm.business_types,
  sm.message_hash,
  sm.is_active,
  sm.created_at,
  sm.updated_at,
  smc.version,
  smc.created_at as content_created_at
FROM system_messages sm
LEFT JOIN LATERAL (
  SELECT version, created_at
  FROM system_message_content smc
  WHERE smc.message_id = sm.id
  ORDER BY smc.version DESC
  LIMIT 1
) smc ON true;

-- Grant access to the view
GRANT SELECT ON system_message_summary TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE system_messages IS 'Stores metadata for encrypted system messages to prevent source code exposure';
COMMENT ON TABLE system_message_content IS 'Stores encrypted content of system messages with versioning';
COMMENT ON COLUMN system_messages.message_hash IS 'SHA-256 hash of the original content for integrity verification';
COMMENT ON COLUMN system_message_content.content IS 'Encrypted system message content as JSON string';
COMMENT ON FUNCTION get_system_message_with_content IS 'Retrieves system message with latest encrypted content for authorized users';
