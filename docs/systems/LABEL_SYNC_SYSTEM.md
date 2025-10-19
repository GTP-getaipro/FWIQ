# Label Sync System - Comprehensive Guide

## 🎯 Overview

The Label Sync System ensures that your Supabase database always reflects the **real** state of Gmail and Outlook folders, preventing stale label IDs and 409 Conflict errors when labels are manually deleted.

## 🔧 Key Features

- **Provider IDs as Primary Keys**: Uses Gmail's `Label_123` and Outlook's `AAMkAD...` as authoritative UUIDs
- **Sync-Then-Create Pattern**: Always syncs before provisioning to prevent conflicts
- **Soft Deletes**: Marks labels as deleted instead of removing records
- **Scheduled Sync**: Admin script for periodic synchronization
- **UPSERT Operations**: Prevents duplicate records and handles updates gracefully

---

## 📊 Architecture

### 1. Database Schema

The `business_labels` table uses real provider IDs as primary keys:

```sql
-- Primary key on provider-specific label_id
ALTER TABLE business_labels
  ADD CONSTRAINT business_labels_pkey PRIMARY KEY (label_id);

-- Unique constraint per provider
ALTER TABLE business_labels
  ADD CONSTRAINT business_labels_unique_key UNIQUE (provider, label_id);

-- Columns
- label_id (TEXT, PRIMARY KEY)      -- Gmail: "Label_123", Outlook: "AAMkAD..."
- business_profile_id (UUID)         -- Reference to profile
- label_name (TEXT)                  -- Display name
- business_type (TEXT)               -- "Pools", "HVAC", etc.
- provider (TEXT)                    -- "gmail" or "outlook"
- color (TEXT)                       -- Label color (Gmail only)
- parent_id (TEXT)                   -- Parent folder ID (Outlook nested folders)
- synced_at (TIMESTAMPTZ)            -- Last sync timestamp
- is_deleted (BOOLEAN)               -- Soft delete flag
```

### 2. Services

#### `src/lib/labelSyncService.js`
Core sync logic for Gmail and Outlook:

```javascript
import { syncGmailLabels, syncOutlookFolders, syncAllLabels, getExistingLabels } from '@/lib/labelSyncService';

// Sync Gmail labels
await syncGmailLabels(accessToken, businessProfileId, businessType);

// Sync Outlook folders
await syncOutlookFolders(accessToken, businessProfileId, businessType);

// Sync all providers for a profile
await syncAllLabels(businessProfileId, businessType);

// Get existing labels (non-deleted)
const labels = await getExistingLabels(businessProfileId, provider);
```

#### `src/lib/labelProvisionService.js`
Updated to use sync-then-create pattern:

```javascript
// OLD: Direct provisioning (could cause conflicts)
await manager.integrateAllFolders(standardLabels, []);

// NEW: Sync first, then create only missing labels
await syncGmailLabels(token, userId, businessType);
const existingLabels = await getExistingLabels(userId, provider);
await manager.integrateAllFolders(standardLabels, existingLabels);
```

---

## 🔄 How It Works

### Label Provisioning Flow

```
1. User triggers provisioning
   ↓
2. Sync existing labels from provider
   → Fetch all labels from Gmail/Outlook API
   → UPSERT to Supabase (updates existing, creates new)
   → Mark stale labels as deleted
   ↓
3. Get existing labels from database
   ↓
4. Compare with desired schema
   ↓
5. Create only missing labels
   ↓
6. UPSERT created labels to database
```

### Sync Process

#### Gmail Sync
```javascript
1. Fetch labels: GET /gmail/v1/users/me/labels
2. Filter user-created labels (exclude system labels)
3. Normalize to Supabase format:
   {
     label_id: "Label_1234567890",
     label_name: "BANKING",
     provider: "gmail",
     business_profile_id: "uuid",
     synced_at: "2025-01-07T12:00:00Z",
     is_deleted: false
   }
4. UPSERT to business_labels (onConflict: label_id)
5. Mark stale labels (exist in DB but not in Gmail) as deleted
```

#### Outlook Sync
```javascript
1. Fetch folders: GET /graph/v1.0/me/mailFolders
2. Recursively fetch child folders
3. Normalize to Supabase format:
   {
     label_id: "AAMkADAwATNiZmYAZS05Zj...",
     label_name: "BANKING",
     provider: "outlook",
     parent_id: "AAMkADAwATNiZm...",
     business_profile_id: "uuid",
     synced_at: "2025-01-07T12:00:00Z",
     is_deleted: false
   }
4. UPSERT to business_labels (onConflict: label_id)
5. Mark stale folders as deleted
```

---

## 🚀 Usage

### Automatic Sync (Recommended)

Provisioning now automatically syncs before creating labels:

```javascript
import { provisionLabelSchemaFor } from '@/lib/labelProvisionService';

// This now includes automatic sync
await provisionLabelSchemaFor(userId, 'Pools');
```

### Manual Sync

```javascript
import { syncAllLabels, syncGmailLabels, syncOutlookFolders } from '@/services/labelSyncService';

// Sync all providers
await syncAllLabels(businessProfileId, businessType);

// Sync specific provider
await syncGmailLabels(accessToken, businessProfileId, businessType);
await syncOutlookFolders(accessToken, businessProfileId, businessType);
```

### Admin Script

Run the sync script manually or via cron:

```bash
# Sync all profiles
node scripts/syncEmailLabels.js

# Sync specific profile
node scripts/syncEmailLabels.js --profile=fedf818f-986f-4b30-bfa1-7fc339c7bb60

# Sync only Gmail
node scripts/syncEmailLabels.js --provider=gmail

# Dry run (no changes)
node scripts/syncEmailLabels.js --dry-run

# Verbose output
node scripts/syncEmailLabels.js --verbose
```

### Scheduled Sync (Cron)

Add to your crontab for daily sync at 2 AM:

```bash
# Sync email labels daily
0 2 * * * cd /path/to/FloworxV2 && node scripts/syncEmailLabels.js >> /var/log/label-sync.log 2>&1
```

Or use a scheduler service (e.g., GitHub Actions, Heroku Scheduler):

```yaml
# .github/workflows/sync-labels.yml
name: Sync Email Labels
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: node scripts/syncEmailLabels.js
```

---

## 🛠️ Database Migration

### Apply the Schema Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Run the migration
\i migrations/fix-business-labels-schema.sql
```

Or manually execute the key parts:

```sql
-- Make label_id the primary key
ALTER TABLE business_labels 
  DROP CONSTRAINT IF EXISTS business_labels_pkey CASCADE;
  
ALTER TABLE business_labels
  ADD CONSTRAINT business_labels_pkey PRIMARY KEY (label_id);

-- Add unique constraint
ALTER TABLE business_labels
  ADD CONSTRAINT business_labels_unique_key UNIQUE (provider, label_id);

-- Add sync tracking
ALTER TABLE business_labels 
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
```

---

## 🎯 Benefits

### Before (Problems)

❌ User deletes label in Gmail → Supabase still has stale record  
❌ Re-provision tries to create label → `409 Conflict: Label already exists`  
❌ Label IDs in database don't match actual provider IDs  
❌ No way to detect manually deleted labels  

### After (Solutions)

✅ Sync before provisioning → Database reflects reality  
✅ UPSERT with provider ID → No duplicate conflicts  
✅ Soft deletes → Track deleted labels without losing history  
✅ Scheduled sync → Automatic drift prevention  
✅ Provider IDs as primary keys → Guaranteed 1:1 mapping  

---

## 📋 Example: Handling Manual Deletion

### Scenario

1. User creates label "URGENT" via provisioning
2. Label created in Gmail with ID `Label_1234567890`
3. Record in Supabase: `{label_id: "Label_1234567890", label_name: "URGENT", is_deleted: false}`
4. User manually deletes "URGENT" in Gmail
5. Next provisioning attempt would fail with 409 Conflict

### How the System Handles It

```javascript
// Step 1: Sync before provisioning
await syncGmailLabels(token, userId, businessType);
// → Fetches current labels from Gmail
// → URGENT not found in Gmail
// → Marks Supabase record as deleted: is_deleted = true

// Step 2: Get existing (non-deleted) labels
const existing = await getExistingLabels(userId, 'gmail');
// → Returns labels where is_deleted = false
// → URGENT not included

// Step 3: Create missing labels
const missing = desiredLabels.filter(l => 
  !existing.some(e => e.label_name === l.name)
);
// → URGENT is missing, so create it

// Step 4: Create in Gmail
const created = await createLabelInGmail(token, 'URGENT');
// → New ID: Label_9876543210

// Step 5: UPSERT to database
await supabase.from('business_labels').upsert({
  label_id: 'Label_9876543210',
  label_name: 'URGENT',
  is_deleted: false
});
// → Creates new record with new ID
// → Old record remains as soft-deleted history
```

---

## 🔍 Troubleshooting

### Error: `409 Conflict: Label already exists`

**Cause**: Database has stale label ID that doesn't exist in provider

**Solution**:
```javascript
// Run sync manually
await syncGmailLabels(token, userId, businessType);

// Then retry provisioning
await provisionLabelSchemaFor(userId, businessType);
```

### Error: `Invalid labelId`

**Cause**: Using label ID from database that was deleted in provider

**Solution**: Same as above - sync before provisioning

### Labels not syncing

**Check**:
1. OAuth token is valid and not expired
2. User has permission to read labels/folders
3. Supabase connection is active
4. Run with `--verbose` flag for detailed logs

```bash
node scripts/syncEmailLabels.js --verbose
```

---

## 📚 API Reference

### `syncGmailLabels(accessToken, businessProfileId, businessType)`

Syncs Gmail labels with Supabase database.

**Parameters**:
- `accessToken` (string): Gmail OAuth access token
- `businessProfileId` (string): UUID of business profile
- `businessType` (string): Business type (e.g., "Pools")

**Returns**: `Promise<{synced: number, created: number, deleted: number}>`

---

### `syncOutlookFolders(accessToken, businessProfileId, businessType)`

Syncs Outlook folders with Supabase database.

**Parameters**:
- `accessToken` (string): Outlook OAuth access token
- `businessProfileId` (string): UUID of business profile
- `businessType` (string): Business type (e.g., "HVAC")

**Returns**: `Promise<{synced: number, created: number, deleted: number}>`

---

### `syncAllLabels(businessProfileId, businessType)`

Syncs all providers (Gmail and Outlook) for a business profile.

**Parameters**:
- `businessProfileId` (string): UUID of business profile
- `businessType` (string): Business type

**Returns**: `Promise<{gmail?: object, outlook?: object}>`

---

### `getExistingLabels(businessProfileId, provider)`

Gets existing non-deleted labels from database.

**Parameters**:
- `businessProfileId` (string): UUID of business profile
- `provider` (string): "gmail" or "outlook"

**Returns**: `Promise<Array<Label>>`

---

## 🎓 Best Practices

1. **Always sync before provisioning**: The updated `provisionLabelSchemaFor` does this automatically
2. **Run scheduled sync daily**: Prevents drift from manual changes
3. **Use soft deletes**: Never hard-delete labels - use `is_deleted` flag
4. **Monitor sync logs**: Check for API errors or token expiration
5. **Use UPSERT operations**: Always use `{onConflict: 'label_id'}` for inserts

---

## 🚨 Important Notes

- **Provider IDs are authoritative**: Never manually change `label_id` in database
- **Outlook allows duplicate names**: Always use ID, not name, for matching
- **Sync is non-destructive**: Uses soft deletes to preserve history
- **Token refresh**: Ensure OAuth tokens are refreshed before expiration
- **Rate limits**: Gmail/Outlook APIs have rate limits - sync respects them

---

## ✅ Checklist for Implementation

- [x] Update database schema with migration
- [x] Create label sync service
- [x] Update provisioning logic to sync-then-create
- [x] Create admin sync script
- [ ] Apply migration to Supabase database
- [ ] Test sync with Gmail integration
- [ ] Test sync with Outlook integration
- [ ] Set up scheduled sync (cron job)
- [ ] Monitor sync logs for errors
- [ ] Update frontend to handle sync status

---

## 📞 Support

If you encounter issues:

1. Check the logs: `node scripts/syncEmailLabels.js --verbose`
2. Verify OAuth tokens are valid
3. Ensure database migration was applied
4. Review the troubleshooting section above

For more help, consult the main README or raise an issue.

