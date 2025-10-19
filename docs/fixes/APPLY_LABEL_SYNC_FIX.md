# Quick Start: Apply Label Sync Fix

## 🎯 What This Fixes

- ❌ **Before**: `409 Conflict: Label already exists` errors when re-provisioning
- ❌ **Before**: Stale label IDs in database after manual deletions
- ❌ **Before**: Database drift from actual Gmail/Outlook state
- ✅ **After**: Database always reflects reality
- ✅ **After**: UPSERT operations prevent conflicts
- ✅ **After**: Automatic sync before provisioning

---

## 🚀 3-Step Implementation

### Step 1: Apply Database Migration

Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) and run:

```sql
-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS business_labels_backup AS 
SELECT * FROM business_labels;

-- Step 2: Drop existing primary key
ALTER TABLE business_labels 
  DROP CONSTRAINT IF EXISTS business_labels_pkey CASCADE;

-- Step 3: Ensure label_id is NOT NULL
UPDATE business_labels 
SET label_id = gen_random_uuid()::text 
WHERE label_id IS NULL;

ALTER TABLE business_labels 
  ALTER COLUMN label_id SET NOT NULL;

-- Step 4: Add primary key on label_id
ALTER TABLE business_labels
  ADD CONSTRAINT business_labels_pkey PRIMARY KEY (label_id);

-- Step 5: Add unique constraint per provider
ALTER TABLE business_labels
  DROP CONSTRAINT IF EXISTS business_labels_unique_key;

ALTER TABLE business_labels
  ADD CONSTRAINT business_labels_unique_key UNIQUE (provider, label_id);

-- Step 6: Add sync tracking columns
ALTER TABLE business_labels 
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_business_labels_profile 
  ON business_labels(business_profile_id);

CREATE INDEX IF NOT EXISTS idx_business_labels_provider_type 
  ON business_labels(provider, business_type);

-- Done!
SELECT '✅ Migration complete!' as status;
```

**Verify it worked:**

```sql
-- Check schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'business_labels' 
  AND column_name IN ('label_id', 'synced_at', 'is_deleted');

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'business_labels'::regclass;
```

---

### Step 2: Test the Sync Service

The sync service has already been integrated into your provisioning flow. Test it:

```javascript
// In your browser console (while logged in)
import { syncGmailLabels } from '@/lib/labelSyncService';

// Get your access token from integrations table
const { data } = await supabase
  .from('integrations')
  .select('access_token')
  .eq('provider', 'gmail')
  .single();

// Run sync
await syncGmailLabels(
  data.access_token,
  'your-user-id',
  'Pools'
);

// Check results
const { data: labels } = await supabase
  .from('business_labels')
  .select('*')
  .eq('provider', 'gmail')
  .order('synced_at', { ascending: false });

console.log('Synced labels:', labels);
```

---

### Step 3: Set Up Scheduled Sync (Optional but Recommended)

#### Option A: Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line (sync daily at 2 AM)
0 2 * * * cd /path/to/FloworxV2 && node scripts/syncEmailLabels.js >> /var/log/label-sync.log 2>&1
```

#### Option B: Windows Task Scheduler

1. Open Task Scheduler
2. Create Task → Name: "Floworx Label Sync"
3. Trigger: Daily at 2:00 AM
4. Action: Start program
   - Program: `node`
   - Arguments: `scripts/syncEmailLabels.js`
   - Start in: `C:\FloworxV2`

#### Option C: GitHub Actions (if using GitHub)

Create `.github/workflows/sync-labels.yml`:

```yaml
name: Sync Email Labels
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - name: Sync labels
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: node scripts/syncEmailLabels.js
```

Add secrets to your GitHub repository:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Verification

### Check Database

```sql
-- Should show recent synced_at timestamps
SELECT 
  label_name,
  provider,
  synced_at,
  is_deleted
FROM business_labels
ORDER BY synced_at DESC
LIMIT 10;

-- Should show labels marked as deleted (if any were manually deleted)
SELECT label_name, provider, synced_at
FROM business_labels
WHERE is_deleted = true;
```

### Test Provisioning

Try provisioning labels again:

```javascript
import { provisionLabelSchemaFor } from '@/lib/labelProvisionService';

// Should now automatically sync before creating labels
const result = await provisionLabelSchemaFor(userId, 'Pools');

console.log('Provisioning result:', result);
// Should see: "✅ Sync complete, database now reflects actual provider state"
```

### Run Manual Sync

```bash
# Sync all profiles
node scripts/syncEmailLabels.js

# Should output:
# 🚀 Email Labels Sync Script
# 📊 Found X integration(s) to sync
# 📧 Syncing gmail for user abc12345...
#   ✅ Synced 15 labels, deleted 0 stale labels
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📊 Sync Summary
#   ✅ Successful: 1
#   ❌ Failed: 0
#   📋 Total synced: 15
#   🗑️  Total deleted: 0
```

---

## 🧪 Test Scenario: Manual Label Deletion

1. **Create a test label via provisioning**:
   ```javascript
   await provisionLabelSchemaFor(userId, 'Pools');
   ```

2. **Manually delete a label in Gmail**:
   - Go to Gmail → Settings → Labels
   - Delete "URGENT" label

3. **Run sync**:
   ```bash
   node scripts/syncEmailLabels.js --verbose
   ```

4. **Check database**:
   ```sql
   SELECT label_name, is_deleted, synced_at
   FROM business_labels
   WHERE label_name = 'URGENT';
   ```
   Should show: `is_deleted = true`

5. **Re-provision**:
   ```javascript
   await provisionLabelSchemaFor(userId, 'Pools');
   ```
   ✅ Should create "URGENT" again with a NEW label_id (no conflict!)

---

## 📊 Expected Results

### Before Fix

```
User provisions labels → Creates in Gmail → Saves to DB
User deletes label manually → Label gone in Gmail, still in DB
User re-provisions → Error: "409 Conflict: Label already exists"
```

### After Fix

```
User provisions labels → 
  1. Syncs with Gmail (updates DB) → 
  2. Checks existing labels → 
  3. Creates only missing ones → 
  4. UPSERT to DB (no conflicts!)
  
User deletes label manually → 
  1. Next sync marks it as deleted in DB → 
  2. Re-provision sees it's missing → 
  3. Creates new label with new ID → 
  4. Everything works! ✅
```

---

## 🎯 Quick Commands Reference

```bash
# Apply migration (in Supabase SQL Editor)
# Copy SQL from Step 1 above

# Test sync (one profile)
node scripts/syncEmailLabels.js --profile=YOUR_USER_ID --verbose

# Test sync (Gmail only)
node scripts/syncEmailLabels.js --provider=gmail

# Dry run (no changes)
node scripts/syncEmailLabels.js --dry-run

# Full sync (all profiles)
node scripts/syncEmailLabels.js

# Check logs
tail -f /var/log/label-sync.log
```

---

## 🚨 Rollback (If Needed)

If something goes wrong, you can restore from backup:

```sql
-- Restore from backup
DROP TABLE business_labels;
CREATE TABLE business_labels AS 
SELECT * FROM business_labels_backup;

-- Recreate constraints (your original schema)
ALTER TABLE business_labels
  ADD CONSTRAINT business_labels_pkey PRIMARY KEY (id);
```

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ No more `409 Conflict` errors
- ✅ `synced_at` timestamps update regularly
- ✅ Manually deleted labels get marked `is_deleted = true`
- ✅ Re-provisioning creates missing labels without errors
- ✅ Sync script runs without errors

---

## 📞 Need Help?

Check the detailed guide: [LABEL_SYNC_SYSTEM.md](./LABEL_SYNC_SYSTEM.md)

Or review the migration file: [migrations/fix-business-labels-schema.sql](./migrations/fix-business-labels-schema.sql)

