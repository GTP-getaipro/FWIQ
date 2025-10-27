# FloWorx Coding Standards

**Version:** 1.0  
**Last Updated:** October 27, 2025  
**Status:** ENFORCED

---

## 1. Database Standards

### Column Naming Conventions

#### User References
**ALWAYS use:** `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`

**NEVER use:** `client_id`, `customer_id`, `account_id`, `user`, `customer`

**Example:**
```sql
-- CORRECT
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- WRONG
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
```

#### Timestamps
**ALWAYS use:**
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

**NEVER use:** `createdAt`, `updatedAt`, `timestamp`, `date_created`

#### JSONB Columns
**Use descriptive names:**
- `config` - Configuration data
- `metadata` - Additional metadata
- `client_config` - Business-specific configuration
- `settings` - User settings

**NEVER use:** `data`, `json`, `blob`, `info`

#### Boolean Columns
**Format:** `is_{condition}` or `has_{feature}`

**Examples:**
- `is_active` (not `active`)
- `is_functional` (not `functional`)
- `has_access` (not `access`)
- `is_verified` (not `verified`)

#### Foreign Keys
**Format:** `{table_name}_id`

**Examples:**
- `workflow_id` (references workflows table)
- `integration_id` (references integrations table)
- `profile_id` (references profiles table)

---

## 2. JavaScript/TypeScript Standards

### Variable Naming

#### User ID Variables
```javascript
// CORRECT
const userId = user.id;
const { user_id } = data;
async function getProfile(userId) { }

// WRONG
const clientId = user.id;
const { client_id } = data;
async function getProfile(clientId) { }
```

#### Database Queries
```javascript
// CORRECT
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId);

const record = {
  user_id: userId,
  name: 'Example'
};

// WRONG
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('client_id', clientId);

const record = {
  client_id: clientId,
  name: 'Example'
};
```

### Function Parameters
```javascript
// CORRECT
async function deployWorkflow(userId, workflowData) {
  const workflow = {
    user_id: userId,
    config: workflowData
  };
  return await supabase.from('workflows').insert(workflow);
}

// WRONG
async function deployWorkflow(clientId, workflowData) {
  const workflow = {
    client_id: clientId,
    config: workflowData
  };
  return await supabase.from('workflows').insert(workflow);
}
```

### Component Props
```javascript
// CORRECT
function UserProfile({ userId }) {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    supabase.from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => setProfile(data));
  }, [userId]);
}

// WRONG
function UserProfile({ clientId }) {
  // ...
}
```

---

## 3. SQL Standards

### Table Creation
```sql
-- Template
CREATE TABLE IF NOT EXISTS public.{table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Other columns here
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes
```sql
-- Naming: idx_{table_name}_{column_names}
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_user_id_status ON workflows(user_id, status);
```

### Foreign Keys
```sql
-- Naming: {table_name}_{column_name}_fkey
ALTER TABLE workflows
ADD CONSTRAINT workflows_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### RLS Policies
```sql
-- Template for tenant isolation
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{table_name}_tenant_isolation"
ON public.{table_name}
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Migration Best Practices
```sql
-- Always include:
-- 1. Idempotent checks (IF NOT EXISTS, IF EXISTS)
-- 2. Schema refresh
-- 3. Verification
-- 4. NO EMOJIS

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'example' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE example ADD COLUMN user_id UUID NOT NULL;
    RAISE NOTICE 'Added user_id column';
  ELSE
    RAISE NOTICE 'user_id column already exists';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
```

---

## 4. API Standards

### Request Bodies
```javascript
// CORRECT
const requestBody = {
  user_id: userId,
  workflow_data: data
};

// WRONG
const requestBody = {
  client_id: clientId,
  workflow_data: data
};
```

### Response Handling
```javascript
// CORRECT
const { user_id, email, created_at } = response.data;

// WRONG
const { client_id, email, created_at } = response.data;
```

---

## 5. Error Messages

### Consistent Error Format
```javascript
// CORRECT
throw new Error(`User not found: ${userId}`);
console.error('Failed to fetch user profile:', { userId, error });

// WRONG
throw new Error(`Client not found: ${clientId}`);
console.error('Failed to fetch client profile:', { clientId, error });
```

---

## 6. Code Review Checklist

Before merging any PR:

- [ ] No occurrences of `client_id` in new code
- [ ] No occurrences of `clientId` in new code
- [ ] All database queries use `user_id`
- [ ] All RLS policies use `user_id = auth.uid()`
- [ ] All foreign keys reference `user_id`
- [ ] All function parameters use `userId`
- [ ] All component props use `userId`
- [ ] Migration includes schema refresh
- [ ] No emojis in SQL migrations
- [ ] Tests pass

---

## 7. Automated Enforcement

### Pre-commit Hook
Location: `.husky/pre-commit`

Prevents commits containing `client_id` or `clientId`

### ESLint Rule
Location: `.eslintrc.cjs`

Shows errors for `clientId` usage in code editor

### CI/CD Check
Run before deployment:
```bash
npm run lint:standards
```

---

## 8. Migration Template

**File:** `docs/migration-template.sql`

```sql
-- ============================================================================
-- MIGRATION: {Description}
-- Date: {YYYY-MM-DD}
-- Author: {Name}
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE 'Starting migration: {description}';
END $$;

-- ============================================================================
-- {Section Name}
-- ============================================================================

DO $$
BEGIN
  -- Check if change is needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = '{table}' AND column_name = 'user_id'
  ) THEN
    -- Make changes
    ALTER TABLE {table} ADD COLUMN user_id UUID NOT NULL;
    
    -- Add constraints
    ALTER TABLE {table}
    ADD CONSTRAINT {table}_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Add indexes
    CREATE INDEX idx_{table}_user_id ON {table}(user_id);
    
    RAISE NOTICE 'SUCCESS: {table} updated';
  ELSE
    RAISE NOTICE 'SKIP: {table} already has user_id';
  END IF;
END $$;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "{table}_tenant_isolation" ON {table};
CREATE POLICY "{table}_tenant_isolation"
ON {table}
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Refresh Schema Cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
END $$;

COMMIT;
```

---

## 9. Testing Standards

### Unit Tests
```javascript
// Test file naming: {feature}.test.js

describe('User Profile', () => {
  it('should fetch profile by userId', async () => {
    const userId = 'test-user-id';
    const profile = await getProfile(userId);
    expect(profile.user_id).toBe(userId);
  });
});
```

### Integration Tests
```javascript
describe('Workflow Deployment', () => {
  it('should deploy workflow with user_id', async () => {
    const userId = 'test-user-id';
    const result = await deployWorkflow(userId, workflowData);
    expect(result.workflow.user_id).toBe(userId);
  });
});
```

---

## 10. Documentation Standards

### API Documentation
```markdown
## Deploy Workflow

POST /api/workflows/deploy

Request Body:
{
  "user_id": "uuid",  // NEVER client_id
  "workflow_data": {}
}
```

### Code Comments
```javascript
/**
 * Deploy workflow for a user
 * @param {string} userId - User ID from auth.users table
 * @param {Object} workflowData - Workflow configuration
 * @returns {Promise<Object>} Deployment result
 */
async function deployWorkflow(userId, workflowData) {
  // Implementation
}
```

---

## Enforcement

This standard is ENFORCED through:
1. Pre-commit hooks (prevents commits with client_id)
2. ESLint rules (shows errors in IDE)
3. Code review checklist
4. Automated testing
5. CI/CD checks

**Any deviation from this standard will block deployment.**

---

## Questions?

See `COMPLETE_STANDARDIZATION_IMPLEMENTATION.md` for the full implementation plan.

Contact: Development team

