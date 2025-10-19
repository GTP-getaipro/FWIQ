# Comprehensive Label Sync Fix

**Date:** 2025-10-07  
**Issues:** RLS violation on business_labels + 409 folder conflicts + token refresh errors

---

## Issues Identified

### 1. ❌ RLS Policy Violation (403 Forbidden)
```
POST https://...supabase.co/rest/v1/business_labels 403 (Forbidden)
Error: "new row violates row-level security policy for table \"business_labels\""
```

**Root Cause:** No RLS policies exist for the `business_labels` table.

### 2. ⚠️ 409 Conflict (Folders Already Exist)
```
POST https://graph.microsoft.com/v1.0/me/mailFolders 409 (Conflict)
Error: "A folder with the specified name already exists"
```

**Root Cause:** Code is trying to create folders that already exist in Outlook. The error handling exists but isn't being utilized correctly.

### 3. ❌ Token Refresh Error (400 Bad Request)
```
POST http://localhost:5173/api/auth/refresh-token 400 (Bad Request)
Error: "Missing required fields"
```

**Root Cause:** Token refresh API expects specific fields that aren't being sent.

---

## Fix 1: Apply RLS Policies for business_labels

**Run this SQL in Supabase SQL Editor:**

```sql
-- Enable RLS on business_labels
ALTER TABLE public.business_labels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own business labels" ON public.business_labels;
DROP POLICY IF EXISTS "Users can update their own business labels" ON public.business_labels;
DROP POLICY IF EXISTS "Users can delete their own business labels" ON public.business_labels;
DROP POLICY IF EXISTS "Users can select their own business labels" ON public.business_labels;

-- Create RLS policies that check via business_profile_id
CREATE POLICY "Users can insert their own business labels"
ON public.business_labels FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id = business_labels.business_profile_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own business labels"
ON public.business_labels FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id = business_labels.business_profile_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id = business_labels.business_profile_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own business labels"
ON public.business_labels FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id = business_labels.business_profile_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can select their own business labels"
ON public.business_labels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.extracted_business_profiles
    WHERE id = business_labels.business_profile_id
    AND user_id = auth.uid()
  )
);

-- Verify
SELECT 'business_labels RLS policies created successfully!' as result;
```

---

## Fix 2: Better Handling of 409 Conflicts

The code already handles `ErrorFolderExists`, but needs to skip upserting when folders can't be created.

**Update required in:** `src/lib/labelSyncService.js`

The fix is to catch 409 errors gracefully and fetch existing folder IDs instead of failing.

---

## Fix 3: Fix Token Refresh API

The token refresh endpoint expects `provider`, `refresh_token`, and `user_id`.

**Update required in:** `src/lib/emailVoiceAnalyzer.js`

---

## Quick Fix Script

Run this to apply all fixes at once:

```bash
# 1. Apply RLS policies (run the SQL above in Supabase)

# 2. Clear browser cache
# Press Ctrl+Shift+R or Cmd+Shift+R

# 3. Test the integration again
```

---

## Why These Errors Occurred

1. **RLS Not Configured**: The `business_labels` table was created without RLS policies, so any insert/update from the client fails with 403.

2. **Folders Pre-Exist**: User may have run the sync before, or folders were created manually. The code needs to handle this gracefully by fetching existing folder IDs.

3. **Token Refresh**: The API endpoint exists but the client isn't sending all required fields.

---

## Expected Behavior After Fix

### ✅ Business Labels
- Insert/Update/Delete will work via RLS policies
- Only users can modify their own business labels
- Labels are validated through `extracted_business_profiles` ownership

### ✅ Folder Sync
- 409 conflicts will be handled gracefully
- Existing folders will be detected and their IDs retrieved
- No duplicate folder creation attempts

### ✅ Token Refresh
- Refresh token API will receive all required fields
- Token expiration will be handled automatically
- Email fetching will work correctly

---

## Testing After Fix

1. **Run SQL migration** in Supabase
2. **Clear browser cache** and reload
3. **Test label provisioning** - should complete without 403 errors
4. **Test with existing folders** - should handle 409 gracefully
5. **Test email voice analysis** - should refresh tokens properly

---

## Next Steps

1. Apply the RLS SQL migration (copy from above)
2. I'll update the code to better handle 409 conflicts
3. I'll fix the token refresh API call

Let me know when you've applied the SQL migration and I'll proceed with the code fixes!

