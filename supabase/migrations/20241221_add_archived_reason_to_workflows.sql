-- Add archived_reason column to workflows table
-- This column will store the reason why a workflow was archived

ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN workflows.archived_reason IS 'Reason why the workflow was archived (e.g., manually deleted, replaced, etc.)';

-- Update existing archived workflows to have a default reason
UPDATE workflows 
SET archived_reason = 'Legacy archive' 
WHERE status = 'archived' AND archived_reason IS NULL;
