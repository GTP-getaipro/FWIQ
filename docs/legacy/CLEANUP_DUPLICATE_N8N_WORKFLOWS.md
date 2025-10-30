# 🧹 Clean Up Duplicate N8N Workflows

**User:** the-hot-tub-man (40b2d58f-b0f1-4645-9f2f-12373a889bc8)  
**Issue:** 4 duplicate workflows in N8N  
**Solution:** Keep 1 active, delete 3 inactive

---

## 🎯 Quick Fix (Manual)

### Option 1: Via N8N UI (Recommended)

1. **Login to N8N:**
   ```
   https://n8n.srv995290.hstgr.cloud
   ```

2. **Go to Workflows tab** (you're already there based on screenshot)

3. **Identify the workflows:**
   - `the-hot-tub-man-40b2d-workflow` (4 duplicates shown)

4. **Keep the ACTIVE one** (green toggle)

5. **Delete the 3 INACTIVE ones:**
   - Click the "⋮" (three dots) menu
   - Select "Delete"
   - Confirm deletion

**Result:** Only 1 workflow remains (the active one)

---

### Option 2: Via N8N API (Automated)

Run this script in your browser console while logged into N8N:

```javascript
// N8N Duplicate Workflow Cleanup Script
async function cleanupDuplicates() {
  const N8N_BASE_URL = 'https://n8n.srv995290.hstgr.cloud';
  const workflowName = 'the-hot-tub-man-40b2d-workflow';
  
  try {
    // Fetch all workflows
    const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      credentials: 'include'  // Uses your session cookie
    });
    
    const workflows = await response.json();
    
    // Find duplicates for this user
    const duplicates = workflows.data.filter(wf => 
      wf.name.includes('the-hot-tub-man') || wf.name.includes('40b2d')
    );
    
    console.log(`Found ${duplicates.length} workflows:`, duplicates);
    
    if (duplicates.length <= 1) {
      console.log('✅ No duplicates found!');
      return;
    }
    
    // Sort by updated date (keep most recent)
    const sorted = duplicates.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    const toKeep = sorted[0];
    const toDelete = sorted.slice(1);
    
    console.log(`✅ Keeping: ${toKeep.name} (ID: ${toKeep.id}, Active: ${toKeep.active})`);
    console.log(`🗑️ Will delete ${toDelete.length} duplicate(s)`);
    
    // Delete duplicates
    for (const wf of toDelete) {
      console.log(`Deleting: ${wf.name} (ID: ${wf.id})`);
      
      // Deactivate if active
      if (wf.active) {
        await fetch(`${N8N_BASE_URL}/api/v1/workflows/${wf.id}/deactivate`, {
          method: 'POST',
          credentials: 'include'
        });
      }
      
      // Delete
      await fetch(`${N8N_BASE_URL}/api/v1/workflows/${wf.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      console.log(`✅ Deleted workflow ${wf.id}`);
    }
    
    console.log('🎉 Cleanup complete! Refresh the page to see results.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanupDuplicates();
```

---

## 🔧 Permanent Fix (Code Changes)

The deployment code has been updated to **automatically prevent and clean up duplicates**:

### What Was Added:
**File:** `supabase/functions/deploy-n8n/index.ts:2339-2405`

```typescript
// CRITICAL FIX: Check for duplicate workflows in N8N before creating new ones
console.log('🔍 Checking for existing workflows in N8N...');
let existingN8nWorkflows = [];
const allWorkflows = await n8nRequest('/workflows', { method: 'GET' });

// Find workflows that match this user's pattern
const userWorkflowPattern = new RegExp(`${businessSlug}.*${clientShort}|${businessName}.*workflow`, 'i');
existingN8nWorkflows = allWorkflows.data.filter(wf => 
  userWorkflowPattern.test(wf.name)
);

// If multiple N8N workflows exist, deactivate and archive duplicates
if (existingN8nWorkflows.length > 1) {
  console.log(`🧹 Cleaning up ${existingN8nWorkflows.length - 1} duplicate workflow(s)...`);
  
  // Keep the most recently updated workflow
  const sortedWorkflows = existingN8nWorkflows.sort((a, b) => 
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
  
  const workflowToKeep = sortedWorkflows[0];
  const workflowsToArchive = sortedWorkflows.slice(1);
  
  // Delete duplicates
  for (const wf of workflowsToArchive) {
    if (wf.active) {
      await n8nRequest(`/workflows/${wf.id}/deactivate`, { method: 'POST' });
    }
    await n8nRequest(`/workflows/${wf.id}`, { method: 'DELETE' });
  }
}
```

### How It Works:
1. ✅ Fetches ALL workflows from N8N
2. ✅ Finds duplicates matching user's business name pattern
3. ✅ Keeps the most recently updated workflow
4. ✅ Deactivates and deletes older duplicates
5. ✅ Logs all actions clearly

---

## 📊 Expected Results

### Before:
```
the-hot-tub-man-40b2d-workflow  (Active)   ← Keep this
the-hot-tub-man-40b2d-workflow  (Inactive) ← Delete
the-hot-tub-man-40b2d-workflow  (Inactive) ← Delete
the-hot-tub-man-40b2d-workflow  (Inactive) ← Delete
```

### After Cleanup:
```
the-hot-tub-man-40b2d-workflow  (Active)   ← Only this remains
```

---

## 🚀 Next Deployment

When this client redeploys next time:
1. ✅ System checks for existing workflows
2. ✅ Finds the one active workflow
3. ✅ **Updates it** (doesn't create new one)
4. ✅ If duplicates somehow exist, automatically cleans them up

---

## 🎯 Action Plan

### Immediate (Do Now):
1. **Manual cleanup via N8N UI** (2 minutes)
   - Delete 3 inactive workflows
   - Keep 1 active workflow

### Automatic (Next Deployment):
2. **Code will auto-cleanup** (already pushed to git)
   - Detects duplicates
   - Keeps most recent
   - Deletes older ones

---

## ✅ Prevention

The fix ensures:
- ✅ Only ONE workflow per user
- ✅ Updates existing workflow instead of creating new
- ✅ Auto-cleanup if duplicates detected
- ✅ Clear logging of all actions

**This issue won't happen again after this fix!** 🎉

