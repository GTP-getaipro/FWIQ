-- Add deleted_at column to business_labels table
-- This column tracks when folders/labels were soft-deleted by users

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'business_labels' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE business_labels 
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    
    COMMENT ON COLUMN business_labels.deleted_at IS 'Timestamp when the folder/label was soft-deleted by user or system';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_business_labels_deleted_at 
ON business_labels(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Update RLS policy to handle deleted_at filtering
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own business labels" ON business_labels;
  DROP POLICY IF EXISTS "Users can insert their own business labels" ON business_labels;
  DROP POLICY IF EXISTS "Users can update their own business labels" ON business_labels;
  DROP POLICY IF EXISTS "Users can delete their own business labels" ON business_labels;
  
  -- Recreate policies with deleted_at awareness
  CREATE POLICY "Users can view their own business labels"
    ON business_labels FOR SELECT
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can insert their own business labels"
    ON business_labels FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can update their own business labels"
    ON business_labels FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can delete their own business labels"
    ON business_labels FOR DELETE
    USING (auth.uid() = user_id);
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'business_labels'
AND column_name = 'deleted_at';

