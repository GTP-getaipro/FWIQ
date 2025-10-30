-- Migration: Add Department Scope to Business Profiles
-- Date: October 30, 2025
-- Purpose: Allow users to configure workflow to handle only specific departments

-- Add department_scope column to business_profiles (changed to JSONB array for multi-select)
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS department_scope JSONB DEFAULT '["all"]'::jsonb;

-- Add constraint to ensure valid department values
-- Removed single-value constraint, will validate in application layer

-- Add department_categories for custom department configurations
ALTER TABLE business_profiles
ADD COLUMN IF NOT EXISTS department_categories JSONB DEFAULT NULL;

-- Comment the columns
COMMENT ON COLUMN business_profiles.department_scope IS 
  'Array of departments this workflow handles. Examples: ["all"], ["sales"], ["sales", "support"], ["operations", "urgent"]';

COMMENT ON COLUMN business_profiles.department_categories IS 
  'Custom category list when department_scope is "custom". Example: ["SALES", "FORMSUB"]';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_business_profiles_department_scope 
ON business_profiles(department_scope);

-- Update existing profiles to '["all"]' (email hub mode)
UPDATE business_profiles 
SET department_scope = '["all"]'::jsonb 
WHERE department_scope IS NULL;

-- Add department_scope to workflows table for tracking
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS department_scope JSONB DEFAULT '["all"]'::jsonb;

COMMENT ON COLUMN workflows.department_scope IS 
  'Array of departments this workflow handles';

-- Create index
CREATE INDEX IF NOT EXISTS idx_workflows_department_scope 
ON workflows(user_id, department_scope);

-- Migration success log
DO $$
BEGIN
  RAISE NOTICE '✅ Department scope migration completed successfully';
  RAISE NOTICE '   - Added department_scope to business_profiles';
  RAISE NOTICE '   - Added department_categories for custom configurations';
  RAISE NOTICE '   - Added department_scope to workflows';
  RAISE NOTICE '   - Created indexes for performance';
  RAISE NOTICE '   - Updated existing profiles to "all" (email hub)';
END $$;

