# Complete Dashboard Fix Guide - The Hot Tub Man

**Date:** October 27, 2025  
**User ID:** `40b2d58f-b0f1-4645-9f2f-12373a889bc8`  
**User:** The Hot Tub Man  
**Issue:** Dashboard shows 0/0 folders, no email processing

---

## 🔍 Root Cause Analysis

The user completed onboarding successfully:
- ✅ Profile created
- ✅ Gmail integration active (credential ID: `5Xb2gDYu8pXd8cMg`)
- ✅ N8N workflow deployed (ID: `bCpZNxNblk9hLvs8`, version 1)
- ❌ **FOLDER PROVISIONING NEVER RAN OR FAILED**

The automatic folder provisioning system (`automaticFolderProvisioning.js`) should have been triggered during onboarding but either:
1. Was skipped because email integration wasn't active yet
2. Failed silently without proper error handling
3. Ran but didn't save results to database

---

## 🚀 Fix Option 1: Browser Console Script (RECOMMENDED)

This is the fastest and most reliable fix. Run this in the browser console while on the dashboard.

### Steps:

1. **Open Dashboard:** Navigate to `https://app.floworx-iq.com/dashboard`
2. **Open Console:** Press F12, go to Console tab
3. **Run Script:** Copy and paste the following:

```javascript
// AUTOMATED FIX: Provision missing folders
(async function() {
  console.log('🚀 Starting folder provisioning fix...');
  
  const { provisionLabelSchemaFor } = await import('/src/lib/labelProvisionService.js');
  const { supabase } = await import('/src/lib/customSupabaseClient.js');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('✅ User:', user.email);
  
  // Get profile to determine business type
  const { data: profile } = await supabase
    .from('profiles')
    .select('client_config, managers, suppliers')
    .eq('id', user.id)
    .single();
  
  const businessType = profile.client_config?.business_type || 
                       profile.client_config?.business_types?.[0] ||
                       'Hot tub & Spa';
  
  console.log('🏢 Business Type:', businessType);
  console.log('👥 Managers:', profile.managers?.length || 0);
  console.log('🏭 Suppliers:', profile.suppliers?.length || 0);
  
  // Run full provisioning with team folders
  console.log('⏳ Provisioning folders... (this may take 30-60 seconds)');
  
  const result = await provisionLabelSchemaFor(user.id, businessType, {
    skeletonOnly: false,
    injectTeamFolders: true
  });
  
  console.log('✅ COMPLETE!', result);
  console.log('📊 Folders created:', Object.keys(result.labelMap || {}).length);
  console.log('🔄 Please refresh the dashboard (F5)');
  
  return result;
})();
```

4. **Wait for completion** (30-60 seconds)
5. **Refresh the dashboard** (F5)
6. **Verify:** You should now see "X/X folders found (100%)"

---

## 🛠️ Fix Option 2: Trigger Automatic Provisioning (ALTERNATIVE)

If the console script doesn't work, manually trigger the automatic provisioning system:

### Steps:

1. Open browser console on dashboard
2. Run this:

```javascript
// Import automatic provisioning
const { autoProvisionOnOnboardingComplete } = await import('/src/lib/automaticFolderProvisioning.js');
const { supabase } = await import('/src/lib/customSupabaseClient.js');

// Get user ID
const { data: { user } } = await supabase.auth.getUser();

// Run automatic provisioning
const result = await autoProvisionOnOnboardingComplete(user.id);
console.log('Provisioning result:', result);
```

This uses the exact same logic that should have run during onboarding.

---

## 🔧 Fix Option 3: Use Dashboard Button (USER-FRIENDLY)

The dashboard has a "Reconfigure & Redeploy" button that should trigger folder provisioning:

1. **Find the button:** Look for "Redeploy or Reconfigure Automation" card
2. **Click:** "Reconfigure & Redeploy"  button
3. **Follow prompts:** This should re-run the onboarding provisioning logic

**Note:** This may require re-entering some configuration data.

---

## 📊 Verify the Fix

After running any fix option, verify success:

### 1. Check Dashboard
- Refresh the page (F5)
- "Folder Health" widget should show: **"X/X folders found (100%)"**
- Example: "12/12 folders found (100%)" for Hot Tub business

### 2. Check Browser Console
Run this to see folder count:

```javascript
const { supabase } = await import('/src/lib/customSupabaseClient.js');
const { data: { user } } = await supabase.auth.getUser();

const { data: profile } = await supabase
  .from('profiles')
  .select('email_labels')
  .eq('id', user.id)
  .single();

console.log('Folders in database:', Object.keys(profile.email_labels || {}).length);
console.log('Folder details:', profile.email_labels);
```

Expected output: 10-15 folders depending on business type

### 3. Check Gmail
Log into Gmail and verify folders exist:
- BANKING
- FORMSUB
- GOOGLE REVIEW
- CALENDAR
- MANAGER (with subfolders)
- SUPPLIERS (with subfolders)
- And more...

### 4. Wait for Email Processing
After folders are created:
- Send a test email to yourself
- Wait 30-60 seconds
- Check dashboard metrics - they should update
- Check Gmail - email should be categorized into appropriate folder

---

## 🎯 Expected Business Folders

For **"Hot Tub & Spa"** or **"Pools & Spas"** business, expect these folders:

### Core Business Folders:
1. BANKING
2. FORMSUB (Form Submissions)
3. GOOGLE REVIEW
4. CALENDAR (Scheduling)
5. EQUIPMENT & SUPPLIES
6. MAINTENANCE & SERVICE
7. CUSTOMER INQUIRIES
8. VENDOR COMMUNICATIONS

### Dynamic Team Folders:
9. MANAGER
   - Unassigned (default)
   - [Manager names from profile]
10. SUPPLIERS
    - [Supplier names from profile]

**Total:** Usually 12-15 folders depending on team size

---

## 🔍 Diagnostic Queries

If you need to check the database directly, run these SQL queries:

### Query 1: Check Profile Configuration
```sql
SELECT 
  id,
  email,
  onboarding_step,
  client_config->'business_type' as business_type,
  client_config->'business_types' as business_types,
  jsonb_object_keys(email_labels) as folder_count,
  managers,
  suppliers
FROM profiles
WHERE id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8';
```

### Query 2: Check Email Labels
```sql
SELECT 
  id,
  jsonb_object_keys(email_labels) as folder_names
FROM profiles
WHERE id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8'
  AND email_labels IS NOT NULL;
```

### Query 3: Check Business Labels Table (if exists)
```sql
SELECT 
  COUNT(*) as total_labels,
  provider,
  array_agg(label_name) as label_names
FROM business_labels
WHERE user_id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8'
  AND is_deleted = false
GROUP BY provider;
```

---

## 🐛 Troubleshooting

### Issue: "Import failed" error
**Solution:** Make sure you're on the dashboard page before running scripts. The modules need to be loaded.

### Issue: "No active integration" error
**Solution:** Check Gmail integration status:
```javascript
const { supabase } = await import('/src/lib/customSupabaseClient.js');
const { data: { user } } = await supabase.auth.getUser();

const { data: integration } = await supabase
  .from('integrations')
  .select('*')
  .eq('user_id', user.id)
  .eq('provider', 'gmail')
  .single();

console.log('Integration status:', integration);
```

If integration is not active, reauthorize Gmail first.

### Issue: "Provisioning succeeded but folders not appearing"
**Possible causes:**
1. Database write failed - check Supabase logs
2. Access token expired - refresh integration
3. Gmail API rate limit - wait and retry

**Solution:** Run verification query to see if folders are in database:
```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('email_labels')
  .eq('id', user.id)
  .single();

if (Object.keys(profile.email_labels || {}).length === 0) {
  console.error('❌ Folders NOT in database - provisioning failed to save');
} else {
  console.log('✅ Folders in database:', Object.keys(profile.email_labels || {}).length);
}
```

### Issue: Folders in database but not in Gmail
**Solution:** Sync needs to run in opposite direction. Check if `labelMap` has Gmail IDs:
```javascript
const labelMap = profile.email_labels;
const hasGmailIds = Object.values(labelMap || {}).some(label => 
  label.id && label.id.startsWith('Label_')
);

if (!hasGmailIds) {
  console.error('❌ Labels in database but missing Gmail IDs - need to create in Gmail');
}
```

---

## 💡 Prevention for Future Users

To prevent this issue for other users, ensure these checks in onboarding:

### 1. Step 3 (Business Type)
```javascript
// In Step3BusinessType.jsx
const result = await autoProvisionOnBusinessTypeChange(userId, businessTypes);
if (!result.success && !result.skipped) {
  // Show error to user
  toast.error('Failed to create folders: ' + result.message);
}
```

### 2. Step 4 (Team Setup)
```javascript
// In StepTeamSetup.jsx (already has this)
import { provisionLabelSchemaFor } from '@/lib/labelProvisionService';

// After saving managers/suppliers
await provisionLabelSchemaFor(user.id, businessType, {
  skeletonOnly: false,
  injectTeamFolders: true
});
```

### 3. Onboarding Completion
```javascript
// In final onboarding step
const result = await autoProvisionOnOnboardingComplete(userId);
if (!result.success) {
  // Retry or show warning
  console.error('Folder provisioning failed during onboarding');
}
```

---

## 📋 Summary Checklist

- [ ] Ran fix script in browser console
- [ ] Verified folders created (12-15 folders)
- [ ] Refreshed dashboard
- [ ] Dashboard shows "X/X folders found (100%)"
- [ ] Sent test email
- [ ] Email was categorized correctly
- [ ] Dashboard metrics updating
- [ ] Documented what happened for team

---

## 🎬 Next Steps After Fix

1. **Monitor for 24 hours:** Check if emails are being processed
2. **Review workflow:** Ensure n8n workflow has correct folder IDs
3. **Check email logs:** Verify entries appearing in `email_logs` table
4. **Update documentation:** Document this issue for reference

---

## ⚠️ Important Notes

- **Do not delete folders manually from Gmail** - This will break the system
- **If you need to reset:** Contact support - there's a proper reset process
- **Backup before changes:** Export current configuration before major changes

---

## 📞 Support

If these fixes don't work, provide this information to support:

1. User ID: `40b2d58f-b0f1-4645-9f2f-12373a889bc8`
2. Error messages from console
3. Results of diagnostic queries
4. Screenshot of dashboard showing 0/0 folders

---

**Created:** October 27, 2025  
**Status:** Ready to execute  
**Estimated fix time:** 2-5 minutes

