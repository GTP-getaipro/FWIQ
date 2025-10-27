-- ============================================================================
-- STANDARDIZE ALL TABLES TO USE user_id INSTEAD OF client_id
-- This ensures consistency across the entire database
-- Run this migration to fix all inconsistencies
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE 'Starting database standardization...';
  RAISE NOTICE 'Converting all client_id columns to user_id';
END $$;

-- ============================================================================
-- 1. email_queue table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'email_queue' AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE 'Processing email_queue...';
    
    -- Add user_id column
    ALTER TABLE public.email_queue ADD COLUMN IF NOT EXISTS user_id UUID;
    
    -- Copy data from client_id to user_id
    UPDATE public.email_queue SET user_id = client_id WHERE user_id IS NULL;
    
    -- Make user_id NOT NULL
    ALTER TABLE public.email_queue ALTER COLUMN user_id SET NOT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE public.email_queue 
    DROP CONSTRAINT IF EXISTS email_queue_user_id_fkey;
    
    ALTER TABLE public.email_queue 
    ADD CONSTRAINT email_queue_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Drop old RLS policy that references client_id
    DROP POLICY IF EXISTS email_queue_tenant_isolation ON public.email_queue;
    
    -- Drop old constraint and column
    ALTER TABLE public.email_queue DROP CONSTRAINT IF EXISTS email_queue_client_id_fkey;
    ALTER TABLE public.email_queue DROP COLUMN IF EXISTS client_id;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON public.email_queue(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_queue_user_id_status ON public.email_queue(user_id, status);
    
    RAISE NOTICE 'SUCCESS: email_queue: client_id -> user_id';
  ELSE
    RAISE NOTICE 'SKIP: email_queue: Already using user_id';
  END IF;
END $$;

-- ============================================================================
-- 2. email_logs table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'email_logs' AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE 'Processing email_logs...';
    
    ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS user_id UUID;
    UPDATE public.email_logs SET user_id = client_id WHERE user_id IS NULL;
    ALTER TABLE public.email_logs ALTER COLUMN user_id SET NOT NULL;
    
    ALTER TABLE public.email_logs 
    DROP CONSTRAINT IF EXISTS email_logs_user_id_fkey;
    
    ALTER TABLE public.email_logs 
    ADD CONSTRAINT email_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Drop old RLS policy that references client_id
    DROP POLICY IF EXISTS email_logs_tenant_isolation ON public.email_logs;
    
    ALTER TABLE public.email_logs DROP CONSTRAINT IF EXISTS email_logs_client_id_fkey;
    ALTER TABLE public.email_logs DROP COLUMN IF EXISTS client_id;
    
    CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_logs_user_id_event ON public.email_logs(user_id, event_at DESC);
    
    RAISE NOTICE 'SUCCESS: email_logs: client_id -> user_id';
  ELSE
    RAISE NOTICE 'SKIP: email_logs: Already using user_id';
  END IF;
END $$;

-- ============================================================================
-- 3. ai_responses table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'ai_responses' AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE 'Processing ai_responses...';
    
    ALTER TABLE public.ai_responses ADD COLUMN IF NOT EXISTS user_id UUID;
    UPDATE public.ai_responses SET user_id = client_id WHERE user_id IS NULL;
    ALTER TABLE public.ai_responses ALTER COLUMN user_id SET NOT NULL;
    
    ALTER TABLE public.ai_responses 
    DROP CONSTRAINT IF EXISTS ai_responses_user_id_fkey;
    
    ALTER TABLE public.ai_responses 
    ADD CONSTRAINT ai_responses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Drop old RLS policy that references client_id
    DROP POLICY IF EXISTS ai_responses_tenant_isolation ON public.ai_responses;
    
    ALTER TABLE public.ai_responses DROP CONSTRAINT IF EXISTS ai_responses_client_id_fkey;
    ALTER TABLE public.ai_responses DROP COLUMN IF EXISTS client_id;
    
    CREATE INDEX IF NOT EXISTS idx_ai_responses_user_id ON public.ai_responses(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_responses_user_id_created ON public.ai_responses(user_id, created_at DESC);
    
    RAISE NOTICE 'SUCCESS: ai_responses: client_id -> user_id';
  ELSE
    RAISE NOTICE 'SKIP: ai_responses: Already using user_id';
  END IF;
END $$;

-- ============================================================================
-- 4. workflows table (ensure complete migration)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'workflows' AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE 'Processing workflows...';
    
    -- Ensure user_id exists
    ALTER TABLE public.workflows ADD COLUMN IF NOT EXISTS user_id UUID;
    
    -- Copy any remaining data
    UPDATE public.workflows SET user_id = client_id WHERE user_id IS NULL AND client_id IS NOT NULL;
    
    -- Make user_id NOT NULL
    ALTER TABLE public.workflows ALTER COLUMN user_id SET NOT NULL;
    
    -- Add foreign key
    ALTER TABLE public.workflows 
    DROP CONSTRAINT IF EXISTS workflows_user_id_fkey;
    
    ALTER TABLE public.workflows 
    ADD CONSTRAINT workflows_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Drop old RLS policies that reference client_id
    DROP POLICY IF EXISTS workflows_tenant_isolation ON public.workflows;
    DROP POLICY IF EXISTS "Users can manage their own workflows" ON public.workflows;
    
    -- Drop old constraint and column
    ALTER TABLE public.workflows DROP CONSTRAINT IF EXISTS workflows_client_id_fkey;
    ALTER TABLE public.workflows DROP COLUMN IF EXISTS client_id;
    
    CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
    CREATE INDEX IF NOT EXISTS idx_workflows_user_id_status ON public.workflows(user_id, status);
    
    RAISE NOTICE 'SUCCESS: workflows: client_id -> user_id (removed client_id)';
  ELSE
    RAISE NOTICE 'SKIP: workflows: Already using user_id only';
  END IF;
END $$;

-- ============================================================================
-- 5. performance_metrics table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'performance_metrics' AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE 'Processing performance_metrics...';
    
    ALTER TABLE public.performance_metrics ADD COLUMN IF NOT EXISTS user_id UUID;
    UPDATE public.performance_metrics SET user_id = client_id WHERE user_id IS NULL;
    ALTER TABLE public.performance_metrics ALTER COLUMN user_id SET NOT NULL;
    
    ALTER TABLE public.performance_metrics 
    DROP CONSTRAINT IF EXISTS performance_metrics_user_id_fkey;
    
    ALTER TABLE public.performance_metrics 
    ADD CONSTRAINT performance_metrics_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Drop all old RLS policies that reference client_id
    DROP POLICY IF EXISTS perf_metrics_tenant_isolation ON public.performance_metrics;
    DROP POLICY IF EXISTS "Users can only see their own metrics" ON public.performance_metrics;
    
    ALTER TABLE public.performance_metrics DROP CONSTRAINT IF EXISTS performance_metrics_client_id_fkey;
    ALTER TABLE public.performance_metrics DROP COLUMN IF EXISTS client_id;
    
    CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);
    CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id_date ON public.performance_metrics(user_id, metric_date DESC);
    
    RAISE NOTICE 'SUCCESS: performance_metrics: client_id -> user_id';
  ELSE
    RAISE NOTICE 'SKIP: performance_metrics: Already using user_id';
  END IF;
END $$;

-- ============================================================================
-- 6. credentials table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'credentials' AND column_name = 'client_id'
  ) THEN
    RAISE NOTICE 'Processing credentials...';
    
    ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS user_id UUID;
    UPDATE public.credentials SET user_id = client_id WHERE user_id IS NULL;
    ALTER TABLE public.credentials ALTER COLUMN user_id SET NOT NULL;
    
    ALTER TABLE public.credentials 
    DROP CONSTRAINT IF EXISTS credentials_user_id_fkey;
    
    ALTER TABLE public.credentials 
    ADD CONSTRAINT credentials_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Drop old RLS policy that references client_id
    DROP POLICY IF EXISTS credentials_tenant_isolation ON public.credentials;
    
    ALTER TABLE public.credentials DROP CONSTRAINT IF EXISTS credentials_client_id_fkey;
    ALTER TABLE public.credentials DROP COLUMN IF EXISTS client_id;
    
    CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON public.credentials(user_id);
    CREATE INDEX IF NOT EXISTS idx_credentials_user_id_provider ON public.credentials(user_id, provider);
    
    RAISE NOTICE 'SUCCESS: credentials: client_id -> user_id';
  ELSE
    RAISE NOTICE 'SKIP: credentials: Already using user_id';
  END IF;
END $$;

-- ============================================================================
-- UPDATE ALL RLS POLICIES TO USE user_id
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Updating RLS policies...';
END $$;

-- email_queue
DROP POLICY IF EXISTS email_queue_tenant_isolation ON public.email_queue;
CREATE POLICY email_queue_tenant_isolation
ON public.email_queue
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- email_logs
DROP POLICY IF EXISTS email_logs_tenant_isolation ON public.email_logs;
CREATE POLICY email_logs_tenant_isolation
ON public.email_logs
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ai_responses
DROP POLICY IF EXISTS ai_responses_tenant_isolation ON public.ai_responses;
CREATE POLICY ai_responses_tenant_isolation
ON public.ai_responses
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- workflows
DROP POLICY IF EXISTS workflows_tenant_isolation ON public.workflows;
DROP POLICY IF EXISTS "Users can manage their own workflows" ON public.workflows;
CREATE POLICY "Users can manage their own workflows"
ON public.workflows
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- performance_metrics
DROP POLICY IF EXISTS perf_metrics_tenant_isolation ON public.performance_metrics;
CREATE POLICY perf_metrics_tenant_isolation
ON public.performance_metrics
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- credentials
DROP POLICY IF EXISTS credentials_tenant_isolation ON public.credentials;
CREATE POLICY credentials_tenant_isolation
ON public.credentials
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: RLS policies updated';
END $$;

-- ============================================================================
-- REFRESH SCHEMA CACHE
-- ============================================================================
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE 'Schema cache refreshed';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  rec RECORD;
  has_client_id BOOLEAN;
  has_user_id BOOLEAN;
  client_id_count INTEGER := 0;
  user_id_count INTEGER := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'VERIFICATION: Checking all tables';
  RAISE NOTICE '================================================';
  
  FOR rec IN 
    SELECT DISTINCT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE '%migration%'
    AND tablename NOT LIKE '%backup%'
    ORDER BY tablename
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = rec.tablename 
      AND column_name = 'client_id'
    ) INTO has_client_id;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = rec.tablename 
      AND column_name = 'user_id'
    ) INTO has_user_id;
    
    IF has_client_id THEN
      RAISE NOTICE 'ERROR: %: Still has client_id!', rec.tablename;
      client_id_count := client_id_count + 1;
    ELSIF has_user_id THEN
      RAISE NOTICE 'SUCCESS: %: Uses user_id', rec.tablename;
      user_id_count := user_id_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Tables with user_id: %', user_id_count;
  RAISE NOTICE '  Tables with client_id: % (should be 0!)', client_id_count;
  RAISE NOTICE '================================================';
  
  IF client_id_count = 0 THEN
    RAISE NOTICE 'DATABASE STANDARDIZATION COMPLETE!';
  ELSE
    RAISE WARNING 'WARNING: Some tables still have client_id - manual review needed';
  END IF;
END $$;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'Standardization migration completed successfully!';
END $$;

