# Cleanup Duplicate Workflows

## Issue

You have **2 duplicate workflows** in n8n with the same name:
- `the-hot-tub-man-40b2d-workflow` (Active)
- `the-hot-tub-man-40b2d-workflow` (Inactive)

Only **1 workflow** should exist per user.

---

## Quick Fix: Manual Cleanup

### Option 1: Delete Manually in n8n UI

1. Go to your n8n workflows page
2. Find the **inactive** workflow
3. Click on it
4. Delete it

### Option 2: Use Cleanup Edge Function

Created: `supabase/functions/cleanup-duplicate-workflows/index.ts`

**To deploy and use:**

```bash
# Deploy the cleanup function
supabase functions deploy cleanup-duplicate-workflows

# Run the cleanup
curl -X POST https://your-project.supabase.co/functions/v1/cleanup-duplicate-workflows \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

**What it does:**
- Finds all workflows for your business
- Keeps the active, most recent one
- Deletes inactive duplicates
- Updates database to track correct workflow ID

---

## Prevention: Why It Happened

The duplicate detection logic exists but might not have run during your last deployment. The code at lines 2874-2949 in `deploy-n8n/index.ts` should:

1. Find all workflows with matching name
2. Keep the active/recent one
3. Delete duplicates

**Next deployment will handle this automatically.**

---

## Recommended Action

**For now:**
1. **Manually delete** the inactive workflow in n8n UI (fastest)
2. **Or** deploy and run the cleanup function

**Then:**
- Re-deploy your workflow normally
- The system will now update the existing one
- No more duplicates should be created

---

## Verification

After cleanup, you should see:
- ✅ Only 1 workflow in n8n
- ✅ Status: Active
- ✅ Name: the-hot-tub-man-40b2d-workflow
- ✅ Contains all latest nodes (including manager routing)

---

**Cleanup function ready to deploy if needed!**

