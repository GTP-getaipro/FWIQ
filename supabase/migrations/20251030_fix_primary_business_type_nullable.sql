-- Make primary_business_type nullable to allow Step 2 (Department Scope) to save
-- before Step 3 (Business Type Selection)

-- Drop the NOT NULL constraint
ALTER TABLE business_profiles 
ALTER COLUMN primary_business_type DROP NOT NULL;

-- Add comment explaining why it's nullable
COMMENT ON COLUMN business_profiles.primary_business_type IS 
  'Primary business type selected in onboarding Step 3. Nullable to allow department_scope to be saved in Step 2.';

-- Update existing rows with NULL to a default if needed (optional)
-- UPDATE business_profiles 
-- SET primary_business_type = 'general' 
-- WHERE primary_business_type IS NULL;

