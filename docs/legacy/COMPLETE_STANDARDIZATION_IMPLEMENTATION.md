# Complete Standardization Implementation Plan

## The Problem

Currently we have inconsistent references throughout the entire system:
- 1,024 occurrences across 228 frontend files
- 11 database migration files
- Backend code
- Inconsistent column names
- Inconsistent variable names
- This causes bugs and confusion

## The Solution: ENFORCE ONE STANDARD

**THE STANDARD: Always use `user_id`, NEVER use `client_id`**

---

## Phase 1: Database Standardization (CRITICAL)

### Migrations to Run:

1. **20241027_standardize_user_id.sql** - Convert all client_id to user_id
2. **20250122_enhance_communication_styles_for_voice_training.sql** - Fix communication_styles schema
3. **NOTIFY pgrst, 'reload schema';** - Refresh cache

**Status:** Ready to execute

---

## Phase 2: Frontend Code Standardization

### Strategy: Automated Find & Replace

**Files to Update:** 228 files

**Pattern to Replace:**
```javascript
// OLD (wrong):
client_id
clientId
.eq('client_id', userId)
.from('table').update({ client_id: userId })

// NEW (correct):
user_id
userId
.eq('user_id', userId)
.from('table').update({ user_id: userId })
```

### Critical Files (Priority 1):

1. `src/lib/workflowDeployer.js` - Already fixed
2. `src/lib/enhancedWorkflowDeployer.js` - NEEDS FIX
3. `src/lib/deployment.js` - NEEDS FIX
4. `src/lib/profileService.js` - NEEDS FIX
5. `src/lib/emailVoiceAnalyzer.js` - NEEDS FIX
6. `src/lib/styleAnalyzer.js` - NEEDS FIX

### All Other Files (Priority 2):

All remaining 222 files with client_id references

---

## Phase 3: Backend Standardization

**Backend Files:**
```bash
backend/src/**/*.js
```

Search for `client_id` and replace with `user_id`

---

## Phase 4: Create Coding Standards

### File: `docs/CODING_STANDARDS.md`

```markdown
# FloWorx Coding Standards

## 1. Database Column Naming

### User References
ALWAYS use: `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
NEVER use: `client_id`, `customer_id`, `account_id`

### Timestamps
ALWAYS use:
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

NEVER use: `createdAt`, `updatedAt`, `timestamp`

### JSONB Columns
Use descriptive names:
- `config` (not `data` or `json`)
- `metadata` (not `meta`)
- `client_config` (business configuration)

### Boolean Flags
Format: `is_{condition}` or `has_{feature}`
Examples: `is_active`, `is_functional`, `has_access`
NEVER use: `active`, `functional`, `access`

## 2. JavaScript/TypeScript Naming

### Variables Referencing User
```javascript
// CORRECT
const userId = user.id;
await supabase.from('profiles').select('*').eq('user_id', userId);

// WRONG
const clientId = user.id;
await supabase.from('profiles').select('*').eq('client_id', clientId);
```

### Function Parameters
```javascript
// CORRECT
async function getProfile(userId) {
  return await supabase.from('profiles').select('*').eq('user_id', userId);
}

// WRONG
async function getProfile(clientId) {
  return await supabase.from('profiles').select('*').eq('client_id', clientId);
}
```

## 3. RLS Policy Standard

```sql
-- Template for all tables
CREATE POLICY "{table_name}_tenant_isolation"
ON public.{table_name}
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## 4. Migration Standard

Every migration must:
- [ ] Use `user_id` (not `client_id`)
- [ ] Include `created_at` and `updated_at`
- [ ] Add RLS policies
- [ ] Add proper indexes
- [ ] Add foreign key constraints
- [ ] Include `NOTIFY pgrst, 'reload schema';`
- [ ] Add verification at end
- [ ] NO EMOJIS in SQL
```

---

## Phase 5: Automated Enforcement

### Create Pre-commit Hook

**File:** `.husky/pre-commit`

```bash
#!/bin/bash

echo "Checking for client_id usage..."

# Check for client_id in staged files
if git diff --cached --name-only | grep -E '\.(js|jsx|ts|tsx|sql)$' | xargs grep -l 'client_id' 2>/dev/null; then
  echo "ERROR: Found client_id usage in staged files!"
  echo "Please use user_id instead of client_id"
  echo ""
  echo "Files with client_id:"
  git diff --cached --name-only | grep -E '\.(js|jsx|ts|tsx|sql)$' | xargs grep -l 'client_id'
  exit 1
fi

echo "Standardization check passed!"
```

### Create ESLint Rule

**File:** `.eslintrc.cjs`

```javascript
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Identifier[name="clientId"]',
        message: 'Use userId instead of clientId for consistency'
      },
      {
        selector: 'Literal[value="client_id"]',
        message: 'Use user_id instead of client_id for consistency'
      }
    ]
  }
};
```

---

## Implementation Timeline

### Immediate (Today):
- [x] Database migration created
- [x] Critical frontend file fixed (workflowDeployer.js)
- [ ] Run database migrations in Supabase
- [ ] Run communication_styles migration
- [ ] Test workflow deployment works

### Short-term (This Week):
- [ ] Update all 228 frontend files
- [ ] Update backend files
- [ ] Create coding standards doc
- [ ] Test entire system

### Long-term (Next Sprint):
- [ ] Implement pre-commit hooks
- [ ] Add ESLint rules
- [ ] Update developer onboarding docs
- [ ] Code review checklist

---

## Automated Batch Update Script

### Script: `scripts/standardize-codebase.js`

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting codebase standardization...');

const replacements = [
  // JavaScript/JSX patterns
  { find: /client_id/g, replace: 'user_id' },
  { find: /clientId/g, replace: 'userId' },
  { find: /\.eq\('client_id'/g, replace: ".eq('user_id'" },
  { find: /client_id:/g, replace: 'user_id:' },
  { find: /"client_id"/g, replace: '"user_id"' },
  { find: /'client_id'/g, replace: "'user_id'" },
  
  // SQL patterns
  { find: /client_id UUID/gi, replace: 'user_id UUID' },
  { find: /client_id = auth\.uid/gi, replace: 'user_id = auth.uid' },
];

// Directories to process
const dirs = [
  'src/lib',
  'src/pages',
  'src/components',
  'src/contexts',
  'src/hooks',
  'backend/src'
];

let filesUpdated = 0;
let totalReplacements = 0;

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) return;
  
  const files = execSync(`find ${dirPath} -type f \\( -name "*.js" -o -name "*.jsx" \\)`, 
    { encoding: 'utf-8' })
    .split('\n')
    .filter(f => f.trim());
  
  files.forEach(file => {
    if (!file) return;
    
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    replacements.forEach(({ find, replace }) => {
      if (find.test(content)) {
        content = content.replace(find, replace);
        modified = true;
        totalReplacements++;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      filesUpdated++;
      console.log(`Updated: ${file}`);
    }
  });
});

console.log(`\nStandardization complete!`);
console.log(`Files updated: ${filesUpdated}`);
console.log(`Total replacements: ${totalReplacements}`);
```

**Run with:**
```bash
node scripts/standardize-codebase.js
```

---

## Testing Plan

### After Standardization:

1. **Database Tests:**
```sql
-- Should return 0
SELECT COUNT(*) FROM information_schema.columns
WHERE column_name = 'client_id' AND table_schema = 'public';
```

2. **Code Tests:**
```bash
# Should return nothing
grep -r "client_id" src/ --include="*.js" --include="*.jsx"
grep -r "clientId" src/ --include="*.js" --include="*.jsx"
```

3. **Functional Tests:**
- [ ] User registration
- [ ] Email verification
- [ ] Onboarding (all 5 steps)
- [ ] Workflow deployment
- [ ] Email processing
- [ ] Voice analysis
- [ ] Label provisioning

---

## Rollback Plan

If something breaks:

### Database Rollback:
```sql
-- Restore client_id (if needed)
ALTER TABLE workflows ADD COLUMN client_id UUID;
UPDATE workflows SET client_id = user_id;
-- etc.
```

### Code Rollback:
```bash
git revert <commit-hash>
git push origin master
```

---

## Success Criteria

System is fully standardized when:

- [ ] Zero occurrences of `client_id` in database
- [ ] Zero occurrences of `client_id` in frontend code
- [ ] Zero occurrences of `clientId` in frontend code
- [ ] Zero occurrences of `client_id` in backend code
- [ ] All tests pass
- [ ] No console errors
- [ ] Workflow deployment succeeds
- [ ] Documentation updated
- [ ] Pre-commit hooks active

---

## Immediate Next Steps

1. Run database migrations (3 migrations)
2. Test that they work
3. Run automated code standardization script
4. Test entire system
5. Commit and deploy

Estimated time: 2-3 hours for complete standardization

