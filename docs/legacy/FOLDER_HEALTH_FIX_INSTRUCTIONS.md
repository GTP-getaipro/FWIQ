# Folder Health Check - Missing Labels Fix

## Issue
```
📁 Expected folders from business_labels: 0
```

The `business_labels` table has no data because labels were never synced to it.

## Root Cause

When labels are provisioned in Gmail/Outlook, they are stored in:
1. ✅ `profiles.email_labels` (working)
2. ❌ `business_labels` table (NOT synced)

The folder health check looks at `business_labels` table, which is empty.

## Solution

### Option 1: Re-run Team Setup (Recommended)
1. Go to `/onboarding/team-setup` in your dashboard
2. Click "Save and Continue"
3. This will trigger `syncGmailLabelsWithDatabase()` which syncs to `business_labels`

### Option 2: Manual Database Fix (Temporary)

Run this SQL in Supabase to manually sync existing labels:

```sql
-- Get the user's business profile ID
WITH user_profile AS (
  SELECT 
    bp.id as business_profile_id,
    p.id as user_id,
    p.email_labels,
    i.provider
  FROM profiles p
  JOIN integrations i ON i.user_id = p.id AND i.status = 'active'
  LEFT JOIN business_profiles bp ON bp.user_id = p.id
  WHERE p.id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
)
-- Insert labels from profiles.email_labels into business_labels
INSERT INTO business_labels (
  label_id,
  label_name,
  provider,
  business_profile_id,
  business_type,
  synced_at,
  is_deleted
)
SELECT 
  key as label_id,
  key as label_name,
  up.provider,
  up.business_profile_id,
  'Hot tub & Spa' as business_type,
  NOW() as synced_at,
  false as is_deleted
FROM user_profile up,
LATERAL jsonb_each_text(up.email_labels) AS labels(key, value)
ON CONFLICT (label_id) DO UPDATE SET
  synced_at = NOW(),
  is_deleted = false;
```

### Option 3: Code Fix (Permanent)

The issue is that `syncGmailLabelsWithDatabase()` is being called without a `businessProfileId`.

**Fix in `src/lib/labelProvisionService.js`:**

After line 165 (where it gets integrations), add:

```javascript
// Get business profile ID for syncing to business_labels table
const { data: businessProfile } = await supabase
  .from('business_profiles')
  .select('id')
  .eq('user_id', userId)
  .single();

const businessProfileId = businessProfile?.id;
```

Then pass it to the sync function (around line 173):

```javascript
const syncResult = await syncGmailLabelsWithDatabase(
  userId, 
  integrations.provider,
  businessProfileId,  // Add this
  finalBusinessTypes[0]  // Add this
);
```

## Verification

After applying any fix, check in browser console:

```
📁 Expected folders from business_labels: [number greater than 0]
```

Should show something like:
```
📁 Expected folders from business_labels: 55
```

## Quick Test Query

Run this in Supabase to check if labels are synced:

```sql
SELECT COUNT(*) FROM business_labels 
WHERE business_profile_id IN (
  SELECT id FROM business_profiles WHERE user_id = 'fedf818f-986f-4b30-bfa1-7fc339c7bb60'
);
```

Should return count > 0 after fix.

