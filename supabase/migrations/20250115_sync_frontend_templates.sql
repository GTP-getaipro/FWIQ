-- =====================================================
-- Sync Database Templates with Frontend
-- =====================================================
-- Date: 2025-01-15
-- Purpose: Deactivate templates not in frontend UI
-- Frontend has 12 types, database has 17
-- This migration deactivates the 5 extra templates
-- =====================================================

-- Deactivate templates not in frontend
UPDATE business_type_templates
SET 
  is_active = false,
  updated_at = NOW()
WHERE business_type IN (
  'General',
  'Cleaning Services',
  'Pest Control',
  'Locksmith',
  'Appliance Repair'
);

-- Verify the update
DO $$
DECLARE
  active_count INTEGER;
  inactive_count INTEGER;
BEGIN
  -- Count active templates
  SELECT COUNT(*) INTO active_count
  FROM business_type_templates
  WHERE is_active = true;
  
  -- Count inactive templates
  SELECT COUNT(*) INTO inactive_count
  FROM business_type_templates
  WHERE is_active = false;
  
  -- Raise notice with results
  RAISE NOTICE 'Active templates: %', active_count;
  RAISE NOTICE 'Inactive templates: %', inactive_count;
  
  -- Verify we have exactly 12 active templates
  IF active_count != 12 THEN
    RAISE WARNING 'Expected 12 active templates, found %', active_count;
  ELSE
    RAISE NOTICE '✅ Database synced with frontend - 12 active templates';
  END IF;
END $$;

-- Display active templates (should match frontend exactly)
SELECT 
  business_type,
  is_active,
  template_version,
  jsonb_array_length(inquiry_types) as inquiry_count,
  jsonb_array_length(special_rules) as rules_count,
  jsonb_array_length(upsell_prompts) as upsell_count
FROM business_type_templates
WHERE is_active = true
ORDER BY business_type;

-- Display inactive templates (archived)
SELECT 
  business_type,
  is_active,
  template_version
FROM business_type_templates
WHERE is_active = false
ORDER BY business_type;

