-- Multi-Business Profile System Schema Migration
-- Implements the complete multi-tenant, multi-domain automation engine

-- ============================================================================
-- 1. Business Profiles Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_types text[] NOT NULL DEFAULT '{}',
  primary_business_type text NOT NULL,
  client_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1,
  
  -- Deployment tracking
  n8n_workflow_id text,
  deployment_status text DEFAULT 'pending',
  last_deployed_at timestamptz,
  deployment_error jsonb,
  
  -- Constraints
  CONSTRAINT business_types_not_empty CHECK (array_length(business_types, 1) > 0),
  CONSTRAINT valid_deployment_status CHECK (deployment_status IN ('pending', 'deploying', 'deployed', 'failed', 'archived'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_types ON public.business_profiles USING GIN(business_types);
CREATE INDEX IF NOT EXISTS idx_business_profiles_deployment_status ON public.business_profiles(deployment_status);
CREATE INDEX IF NOT EXISTS idx_business_profiles_n8n_workflow_id ON public.business_profiles(n8n_workflow_id);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own business profiles"
  ON public.business_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business profiles"
  ON public.business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profiles"
  ON public.business_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business profiles"
  ON public.business_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. Business Labels Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  business_type text NOT NULL,
  label_id text NOT NULL,
  label_name text NOT NULL,
  color jsonb NOT NULL DEFAULT '{"backgroundColor": "#cccccc", "textColor": "#000000"}'::jsonb,
  
  -- Gmail/Outlook metadata
  provider text DEFAULT 'gmail' CHECK (provider IN ('gmail', 'outlook')),
  provider_label_id text, -- Actual Gmail/Outlook label ID
  
  -- Classification metadata
  intent text,
  keywords text[],
  priority integer DEFAULT 0,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_label_per_profile UNIQUE (business_profile_id, label_id),
  CONSTRAINT valid_color_format CHECK (
    jsonb_typeof(color->'backgroundColor') = 'string' AND
    jsonb_typeof(color->'textColor') = 'string'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_labels_profile_id ON public.business_labels(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_labels_business_type ON public.business_labels(business_type);
CREATE INDEX IF NOT EXISTS idx_business_labels_provider ON public.business_labels(provider);
CREATE INDEX IF NOT EXISTS idx_business_labels_label_id ON public.business_labels(label_id);

-- Enable RLS
ALTER TABLE public.business_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view labels for their profiles"
  ON public.business_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert labels for their profiles"
  ON public.business_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update labels for their profiles"
  ON public.business_labels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete labels for their profiles"
  ON public.business_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. AI Configuration Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  business_type text NOT NULL,
  
  -- Classifier behavior
  classifier_behavior jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- { categories: {...}, urgent_keywords: [...] }
  
  -- Responder behavior
  responder_behavior jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- { toneProfile: {...}, responseTemplates: {...} }
  
  -- Model configuration
  model_config jsonb DEFAULT '{
    "classifier_model": "gpt-4o-mini",
    "responder_model": "gpt-4o-mini",
    "temperature": 0.3,
    "max_tokens": 1000
  }'::jsonb,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  version integer DEFAULT 1,
  
  -- Constraints
  CONSTRAINT unique_ai_config_per_type UNIQUE (business_profile_id, business_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_configurations_profile_id ON public.ai_configurations(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_business_type ON public.ai_configurations(business_type);

-- Enable RLS
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view AI configs for their profiles"
  ON public.ai_configurations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage AI configs for their profiles"
  ON public.ai_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Deployment History Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.deployment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  
  -- Deployment details
  n8n_workflow_id text NOT NULL,
  workflow_version integer DEFAULT 1,
  deployment_type text DEFAULT 'create' CHECK (deployment_type IN ('create', 'update', 'rollback')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'success', 'failed')),
  
  -- Workflow snapshot
  workflow_json jsonb NOT NULL,
  
  -- Deployment metadata
  deployed_by uuid REFERENCES auth.users(id),
  deployment_duration_ms integer,
  error_message text,
  error_details jsonb,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deployment_history_profile_id ON public.deployment_history(business_profile_id);
CREATE INDEX IF NOT EXISTS idx_deployment_history_n8n_workflow_id ON public.deployment_history(n8n_workflow_id);
CREATE INDEX IF NOT EXISTS idx_deployment_history_status ON public.deployment_history(status);
CREATE INDEX IF NOT EXISTS idx_deployment_history_created_at ON public.deployment_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.deployment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view deployment history for their profiles"
  ON public.deployment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_profiles
      WHERE id = business_profile_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_labels_updated_at
  BEFORE UPDATE ON public.business_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_configurations_updated_at
  BEFORE UPDATE ON public.ai_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get complete business profile with labels and AI config
CREATE OR REPLACE FUNCTION get_complete_business_profile(profile_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'profile', row_to_json(bp.*),
    'labels', (
      SELECT jsonb_agg(row_to_json(bl.*))
      FROM public.business_labels bl
      WHERE bl.business_profile_id = bp.id
    ),
    'ai_configs', (
      SELECT jsonb_agg(row_to_json(ac.*))
      FROM public.ai_configurations ac
      WHERE ac.business_profile_id = bp.id
    )
  ) INTO result
  FROM public.business_profiles bp
  WHERE bp.id = profile_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for duplicate workflow deployments
CREATE OR REPLACE FUNCTION check_duplicate_workflow(user_uuid uuid, workflow_types text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_profiles
    WHERE user_id = user_uuid
      AND business_types = workflow_types
      AND deployment_status = 'deployed'
      AND n8n_workflow_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Migration from Existing Profiles
-- ============================================================================

-- Migrate existing profiles.business_type to business_profiles table
INSERT INTO public.business_profiles (
  user_id,
  business_types,
  primary_business_type,
  client_config,
  created_at,
  updated_at
)
SELECT 
  id as user_id,
  (CASE 
    WHEN business_types IS NOT NULL AND jsonb_array_length(business_types) > 0 
    THEN ARRAY(SELECT jsonb_array_elements_text(business_types))
    WHEN business_type IS NOT NULL 
    THEN ARRAY[business_type]
    ELSE ARRAY['General Construction']
  END)::text[] as business_types,
  COALESCE(
    CASE 
      WHEN business_types IS NOT NULL AND jsonb_array_length(business_types) > 0
      THEN (business_types->0)::text
      ELSE business_type
    END,
    'General Construction'
  ) as primary_business_type,
  COALESCE(client_config, '{}'::jsonb) as client_config,
  created_at,
  updated_at
FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM public.business_profiles bp 
  WHERE bp.user_id = profiles.id
);

-- ============================================================================
-- 7. Grants and Permissions
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_labels TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_configurations TO authenticated;
GRANT SELECT ON public.deployment_history TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 8. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.business_profiles IS 'Multi-business profile configurations for automation workflows';
COMMENT ON TABLE public.business_labels IS 'Email labels organized by business type with Gmail/Outlook integration';
COMMENT ON TABLE public.ai_configurations IS 'AI behavior configurations for classifier and responder per business type';
COMMENT ON TABLE public.deployment_history IS 'Complete audit trail of n8n workflow deployments';

COMMENT ON COLUMN public.business_profiles.business_types IS 'Array of business types selected by user (e.g., ["Pools", "Hot tub & Spa"])';
COMMENT ON COLUMN public.business_profiles.primary_business_type IS 'Primary business type used for template selection';
COMMENT ON COLUMN public.business_profiles.deployment_status IS 'Current deployment status: pending, deploying, deployed, failed, archived';
COMMENT ON COLUMN public.business_labels.provider_label_id IS 'Actual Gmail or Outlook label ID from their API';

-- ============================================================================
-- 9. Refresh PostgREST Schema Cache
-- ============================================================================

SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================================
-- 10. Verification Queries
-- ============================================================================

-- Check table creation
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('business_profiles', 'business_labels', 'ai_configurations', 'deployment_history')
ORDER BY tablename;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('business_profiles', 'business_labels', 'ai_configurations', 'deployment_history')
ORDER BY tablename, policyname;
