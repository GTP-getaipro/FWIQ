-- Migration: Business Type Templates
-- Purpose: Move hardcoded business type templates from Edge Function to database
-- Date: 2025-01-15
-- Impact: Enables template updates without redeploying Edge Function

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Business type templates table
CREATE TABLE IF NOT EXISTS business_type_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL UNIQUE,
  template_version INTEGER NOT NULL DEFAULT 1,
  inquiry_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  protocols TEXT,
  special_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  upsell_prompts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Constraints
  CONSTRAINT business_type_not_empty CHECK (char_length(business_type) > 0),
  CONSTRAINT template_version_positive CHECK (template_version > 0)
);

-- Template version history table
CREATE TABLE IF NOT EXISTS business_type_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES business_type_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  template_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_notes TEXT,
  
  -- Constraints
  CONSTRAINT version_positive CHECK (version > 0),
  CONSTRAINT unique_template_version UNIQUE (template_id, version)
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Fast lookup by business type
CREATE INDEX IF NOT EXISTS idx_business_type_templates_type 
  ON business_type_templates(business_type) 
  WHERE is_active = true;

-- Fast lookup by active status
CREATE INDEX IF NOT EXISTS idx_business_type_templates_active 
  ON business_type_templates(is_active);

-- Version history lookup
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id 
  ON business_type_template_versions(template_id);

CREATE INDEX IF NOT EXISTS idx_template_versions_created_at 
  ON business_type_template_versions(created_at DESC);

-- ============================================================================
-- 3. CREATE TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_type_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_business_type_template_updated_at
  BEFORE UPDATE ON business_type_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_business_type_template_updated_at();

-- Auto-create version history on update
CREATE OR REPLACE FUNCTION create_template_version_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version history if template data changed
  IF (OLD.inquiry_types IS DISTINCT FROM NEW.inquiry_types) OR
     (OLD.protocols IS DISTINCT FROM NEW.protocols) OR
     (OLD.special_rules IS DISTINCT FROM NEW.special_rules) OR
     (OLD.upsell_prompts IS DISTINCT FROM NEW.upsell_prompts) THEN
    
    -- Increment version
    NEW.template_version = OLD.template_version + 1;
    
    -- Save old version to history
    INSERT INTO business_type_template_versions (
      template_id,
      version,
      template_data,
      created_by,
      change_notes
    ) VALUES (
      OLD.id,
      OLD.template_version,
      jsonb_build_object(
        'inquiry_types', OLD.inquiry_types,
        'protocols', OLD.protocols,
        'special_rules', OLD.special_rules,
        'upsell_prompts', OLD.upsell_prompts
      ),
      NEW.created_by,
      'Auto-saved version history'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_template_version_history
  BEFORE UPDATE ON business_type_templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version_history();

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE business_type_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_type_template_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Service role can do everything
CREATE POLICY "Service role can manage templates"
  ON business_type_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage template versions"
  ON business_type_template_versions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read active templates
CREATE POLICY "Authenticated users can read active templates"
  ON business_type_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Authenticated users can read template versions
CREATE POLICY "Authenticated users can read template versions"
  ON business_type_template_versions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get active template by business type
CREATE OR REPLACE FUNCTION get_business_type_template(p_business_type TEXT)
RETURNS TABLE (
  id UUID,
  business_type TEXT,
  template_version INTEGER,
  inquiry_types JSONB,
  protocols TEXT,
  special_rules JSONB,
  upsell_prompts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.business_type,
    t.template_version,
    t.inquiry_types,
    t.protocols,
    t.special_rules,
    t.upsell_prompts
  FROM business_type_templates t
  WHERE t.business_type = p_business_type
    AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get template version history
CREATE OR REPLACE FUNCTION get_template_version_history(p_template_id UUID)
RETURNS TABLE (
  version INTEGER,
  template_data JSONB,
  created_at TIMESTAMPTZ,
  change_notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.version,
    v.template_data,
    v.created_at,
    v.change_notes
  FROM business_type_template_versions v
  WHERE v.template_id = p_template_id
  ORDER BY v.version DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_business_type_template(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_template_version_history(UUID) TO authenticated, service_role;

-- ============================================================================
-- 8. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE business_type_templates IS 'Stores business type templates for AI system message generation';
COMMENT ON TABLE business_type_template_versions IS 'Version history for business type templates';

COMMENT ON COLUMN business_type_templates.business_type IS 'Business type name (e.g., "Hot tub & Spa", "Electrician")';
COMMENT ON COLUMN business_type_templates.template_version IS 'Current version number, auto-incremented on updates';
COMMENT ON COLUMN business_type_templates.inquiry_types IS 'Array of inquiry type objects with name, description, keywords, pricing';
COMMENT ON COLUMN business_type_templates.protocols IS 'Business-specific protocols and procedures';
COMMENT ON COLUMN business_type_templates.special_rules IS 'Array of special rules for this business type';
COMMENT ON COLUMN business_type_templates.upsell_prompts IS 'Array of upsell prompts for this business type';
COMMENT ON COLUMN business_type_templates.is_active IS 'Whether this template is currently active';

COMMENT ON FUNCTION get_business_type_template(TEXT) IS 'Get active template for a specific business type';
COMMENT ON FUNCTION get_template_version_history(UUID) IS 'Get version history for a template';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_type_templates') THEN
    RAISE NOTICE '✅ business_type_templates table created successfully';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_type_template_versions') THEN
    RAISE NOTICE '✅ business_type_template_versions table created successfully';
  END IF;
END $$;

