-- ============================================================================
-- Template Merging Functions for Multi-Business Support
-- ============================================================================
-- Purpose: Database functions to fetch and merge multiple business templates
-- Created: 2025-01-15
-- ============================================================================

-- ============================================================================
-- Function: get_merged_business_template
-- ============================================================================
-- Purpose: Fetch and merge multiple business type templates
-- Parameters:
--   - business_types: Array of business type names to merge
-- Returns: JSONB object with merged template data
-- ============================================================================

CREATE OR REPLACE FUNCTION get_merged_business_template(
  business_types TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record RECORD;
  merged_result JSONB;
  all_inquiry_types JSONB := '[]'::jsonb;
  all_protocols TEXT := '';
  all_special_rules JSONB := '[]'::jsonb;
  all_upsell_prompts JSONB := '[]'::jsonb;
  business_type_list JSONB := '[]'::jsonb;
  template_count INT := 0;
BEGIN
  -- Validate input
  IF business_types IS NULL OR array_length(business_types, 1) IS NULL THEN
    RAISE EXCEPTION 'business_types array cannot be null or empty';
  END IF;
  
  IF array_length(business_types, 1) > 12 THEN
    RAISE EXCEPTION 'Cannot merge more than 12 business types';
  END IF;
  
  -- Fetch and merge templates
  FOR template_record IN
    SELECT 
      business_type,
      inquiry_types,
      protocols,
      special_rules,
      upsell_prompts
    FROM business_type_templates
    WHERE business_type = ANY(business_types)
      AND is_active = true
    ORDER BY business_type
  LOOP
    template_count := template_count + 1;
    
    -- Add business type to list
    business_type_list := business_type_list || to_jsonb(template_record.business_type);
    
    -- Merge inquiry types
    all_inquiry_types := all_inquiry_types || template_record.inquiry_types;
    
    -- Merge protocols with section headers
    IF all_protocols = '' THEN
      all_protocols := '**' || template_record.business_type || ' Protocols:**' || E'\n' || template_record.protocols;
    ELSE
      all_protocols := all_protocols || E'\n\n---\n\n' || '**' || template_record.business_type || ' Protocols:**' || E'\n' || template_record.protocols;
    END IF;
    
    -- Merge special rules
    all_special_rules := all_special_rules || template_record.special_rules;
    
    -- Merge upsell prompts
    all_upsell_prompts := all_upsell_prompts || template_record.upsell_prompts;
  END LOOP;
  
  -- Check if any templates were found
  IF template_count = 0 THEN
    RAISE EXCEPTION 'No active templates found for the specified business types';
  END IF;
  
  -- Build merged result
  merged_result := jsonb_build_object(
    'business_types', business_type_list,
    'inquiry_types', all_inquiry_types,
    'protocols', all_protocols,
    'special_rules', all_special_rules,
    'upsell_prompts', all_upsell_prompts,
    'template_count', template_count,
    'merged_at', NOW()
  );
  
  RETURN merged_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_merged_business_template(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_merged_business_template(TEXT[]) TO service_role;

-- ============================================================================
-- Function: get_available_business_types
-- ============================================================================
-- Purpose: Get list of all available business types
-- Returns: Array of business type names
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_business_types()
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT array_agg(business_type ORDER BY business_type)
  FROM business_type_templates
  WHERE is_active = true;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_available_business_types() TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_business_types() TO service_role;
GRANT EXECUTE ON FUNCTION get_available_business_types() TO anon;

-- ============================================================================
-- Function: validate_business_types
-- ============================================================================
-- Purpose: Validate that all business types exist and are active
-- Parameters:
--   - business_types: Array of business type names to validate
-- Returns: Boolean (true if all valid, raises exception otherwise)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_business_types(
  business_types TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invalid_types TEXT[];
  available_types TEXT[];
BEGIN
  -- Get available business types
  SELECT array_agg(business_type)
  INTO available_types
  FROM business_type_templates
  WHERE is_active = true;
  
  -- Find invalid types
  SELECT array_agg(bt)
  INTO invalid_types
  FROM unnest(business_types) AS bt
  WHERE bt != ALL(available_types);
  
  -- Raise exception if any invalid types found
  IF invalid_types IS NOT NULL AND array_length(invalid_types, 1) > 0 THEN
    RAISE EXCEPTION 'Invalid business types: %. Available types: %', 
      array_to_string(invalid_types, ', '),
      array_to_string(available_types, ', ');
  END IF;
  
  RETURN true;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_business_types(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_business_types(TEXT[]) TO service_role;

-- ============================================================================
-- Update profiles table to support multiple business types
-- ============================================================================

-- Check if business_types column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'business_types'
  ) THEN
    -- Add business_types array column
    ALTER TABLE profiles
    ADD COLUMN business_types TEXT[] DEFAULT NULL;

    -- Migrate existing business_type to business_types array
    UPDATE profiles
    SET business_types = ARRAY[business_type]
    WHERE business_type IS NOT NULL;

    -- Add check constraint to ensure at least one business type
    ALTER TABLE profiles
    ADD CONSTRAINT check_business_types_not_empty
    CHECK (
      business_types IS NULL OR
      array_length(business_types, 1) > 0
    );

    -- Add check constraint to limit to 12 business types
    ALTER TABLE profiles
    ADD CONSTRAINT check_business_types_max_12
    CHECK (
      business_types IS NULL OR
      array_length(business_types, 1) <= 12
    );

    -- Create index for faster lookups
    CREATE INDEX idx_profiles_business_types
    ON profiles USING GIN (business_types);

    RAISE NOTICE 'Added business_types column to profiles table';
  ELSE
    RAISE NOTICE 'business_types column already exists in profiles table';
  END IF;
END $$;

-- ============================================================================
-- Function: get_user_business_template
-- ============================================================================
-- Purpose: Get merged template for a specific user based on their business types
-- Parameters:
--   - user_id: UUID of the user
-- Returns: JSONB object with merged template data
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_business_template(
  user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_business_types TEXT[];
  merged_template JSONB;
BEGIN
  -- Get user's business types
  SELECT business_types
  INTO user_business_types
  FROM profiles
  WHERE id = user_id;

  -- Check if user exists
  IF user_business_types IS NULL THEN
    -- Fallback to single business_type column if business_types is null
    SELECT ARRAY[business_type]
    INTO user_business_types
    FROM profiles
    WHERE id = user_id AND business_type IS NOT NULL;
  END IF;

  -- If still null, raise exception
  IF user_business_types IS NULL OR array_length(user_business_types, 1) IS NULL THEN
    RAISE EXCEPTION 'User % has no business types configured', user_id;
  END IF;

  -- Get merged template
  merged_template := get_merged_business_template(user_business_types);

  RETURN merged_template;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_business_template(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_business_template(UUID) TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION get_merged_business_template(TEXT[]) IS 
'Fetch and merge multiple business type templates into a single unified template';

COMMENT ON FUNCTION get_available_business_types() IS 
'Get list of all available active business types';

COMMENT ON FUNCTION validate_business_types(TEXT[]) IS 
'Validate that all business types exist and are active';

COMMENT ON FUNCTION get_user_business_template(UUID) IS 
'Get merged template for a specific user based on their business types';

-- ============================================================================
-- Example Usage
-- ============================================================================

-- Get merged template for HVAC + Plumber
-- SELECT get_merged_business_template(ARRAY['HVAC', 'Plumber']);

-- Get all available business types
-- SELECT get_available_business_types();

-- Validate business types
-- SELECT validate_business_types(ARRAY['HVAC', 'Plumber', 'Electrician']);

-- Get template for a specific user
-- SELECT get_user_business_template('user-uuid-here');

-- Update user to have multiple business types
-- UPDATE profiles
-- SET business_types = ARRAY['HVAC', 'Plumber', 'Electrician']
-- WHERE id = 'user-uuid-here';

