# Folder Health Check Troubleshooting Guide

## Issue
Folder health check widget is not working on production server (Coolify deployment).

## Potential Root Causes

### 1. **Module Import Issues**
The `folderHealthCheck.js` imports several dependencies that may not be available in the production build:

```javascript
import { supabase } from './customSupabaseClient.js';
import { getValidAccessToken } from './oauthTokenManager.js';
import { getFolderIdsForN8n } from './labelSyncValidator.js';
```

**Check:**
- ✅ Are all these modules bundled correctly in Vite build?
- ✅ Are there any circular dependency issues?
- ✅ Does the build process include all necessary files?

### 2. **API Call Failures**
The folder health check makes several API calls:

1. **Supabase Database Queries:**
   - `integrations` table → Get email provider
   - `business_labels` table → Get expected folders
   - `business_profiles` table → Get business info for classifier validation

2. **OAuth Token Management:**
   - `getValidAccessToken()` → May fail if token is expired

3. **Email Provider APIs:**
   - Gmail API: `https://gmail.googleapis.com/gmail/v1/users/me/labels`
   - Outlook API: `https://graph.microsoft.com/v1.0/me/mailFolders`

**Check:**
- ✅ Are Supabase queries returning data?
- ✅ Is OAuth token valid and not expired?
- ✅ Are CORS headers configured correctly for Gmail/Outlook APIs?
- ✅ Is the access token being passed correctly?

### 3. **Database Schema Issues**
The function queries these tables:
- `integrations` → Should have `user_id`, `provider`, `status` columns
- `business_labels` → Should have `business_profile_id`, `label_name`, `label_id`, `is_deleted` columns
- `business_profiles` → Should have `user_id`, `business_type`, `managers`, `suppliers` columns

**Check:**
- ✅ Do all required tables exist in production?
- ✅ Are all required columns present?
- ✅ Is there data in these tables for the test user?

### 4. **Environment Variables**
The function may rely on environment variables:
- Supabase URL and keys
- API keys for Gmail/Outlook (if any)

**Check:**
- ✅ Are all environment variables set in Coolify?
- ✅ Is `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured?

### 5. **Build Configuration**
Vite may not be bundling the module correctly.

**Check:**
- ✅ Is `folderHealthCheck.js` included in the build?
- ✅ Are dynamic imports handled correctly?
- ✅ Is tree-shaking removing needed code?

### 6. **Error Silencing**
The widget has error handling that might be silencing issues:

```javascript
} catch (error) {
  console.error('❌ Failed to check folder health:', error);
  toast({
    variant: 'destructive',
    title: 'Health Check Failed',
    description: 'Could not check folder status. Please try again.',
    duration: 5000
  });
}
```

**Check:**
- ✅ Look in browser console for error messages
- ✅ Check network tab for failed API calls
- ✅ Are toasts being displayed?

## Debugging Steps

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for:
```
❌ Failed to check folder health: [error message]
```

### Step 2: Check Network Tab
Look for failed requests to:
- Supabase API (`https://[project].supabase.co/rest/v1/...`)
- Gmail API (`https://gmail.googleapis.com/...`)
- Outlook API (`https://graph.microsoft.com/...`)

### Step 3: Verify Database
Run these queries in Supabase SQL editor:

```sql
-- Check integrations table
SELECT * FROM integrations WHERE user_id = '[test-user-id]';

-- Check business_labels table
SELECT COUNT(*) FROM business_labels WHERE business_profile_id = '[test-user-id]';

-- Check business_profiles table
SELECT business_type, managers, suppliers FROM business_profiles WHERE user_id = '[test-user-id]';
```

### Step 4: Test getFolderHealthSummary Directly
Add this to browser console:

```javascript
import { getFolderHealthSummary } from '@/lib/folderHealthCheck';

// Test the function
getFolderHealthSummary('[test-user-id]', 'gmail')
  .then(result => console.log('✅ Health result:', result))
  .catch(error => console.error('❌ Health check failed:', error));
```

### Step 5: Check for Missing Dependencies
Verify these files exist in the production build:
- `customSupabaseClient.js`
- `oauthTokenManager.js`
- `labelSyncValidator.js`
- `gmailLabelSync.js` (for `fetchCurrentGmailLabels`)

### Step 6: Verify Widget is Rendered
Check if the `FolderHealthWidget` is actually rendered on the page:

```javascript
// In browser console
document.querySelector('[class*="FolderHealthWidget"]');
// Should return an element, not null
```

### Step 7: Check Provider Detection
The widget receives `provider` as a prop from `DashboardDefault`:

```javascript
const emailProvider = getEmailProvider();
// Should return 'gmail' or 'outlook', not null
```

## Quick Fixes

### Fix 1: Add Better Error Logging
Update `FolderHealthWidget.jsx` to log more details:

```javascript
const checkFolderHealth = async () => {
  setIsChecking(true);
  console.log('🔍 Starting folder health check...', { userId, provider });
  try {
    const health = await getFolderHealthSummary(userId, provider);
    console.log('✅ Health check result:', health);
    setFolderHealth(health);
    
    if (!health.healthy && health.missingCount > 0) {
      console.warn(`⚠️ ${health.missingCount} folders are missing:`, health.missingFolders);
    }
  } catch (error) {
    console.error('❌ Failed to check folder health:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      userId,
      provider
    });
    toast({
      variant: 'destructive',
      title: 'Health Check Failed',
      description: `Could not check folder status: ${error.message}`,
      duration: 5000
    });
  } finally {
    setIsChecking(false);
  }
};
```

### Fix 2: Add Fallback for Missing Provider
Update `checkFolderHealth` to handle missing provider:

```javascript
export async function checkFolderHealth(userId, provider = null) {
  try {
    console.log(`🔍 Starting folder health check for user: ${userId}, provider: ${provider || 'auto-detect'}`);
    
    // Validate userId
    if (!userId) {
      throw new Error('User ID is required for folder health check');
    }
    
    // Rest of the function...
  } catch (error) {
    console.error('❌ Folder health check failed:', error);
    // Return structured error instead of throwing
    return {
      success: false,
      error: error.message,
      provider: provider || null,
      totalExpected: 0,
      totalFound: 0,
      missingFolders: [],
      allFoldersPresent: false,
      healthy: false,
      healthPercentage: 0
    };
  }
}
```

### Fix 3: Ensure Widget is Properly Placed
Verify `DashboardDefault.jsx` has the widget after the calculator:

```javascript
{/* Folder Health Widget */}
{profile?.id && (
  <FolderHealthWidget 
    userId={profile.id}
    provider={emailProvider}
    onRefreshNeeded={() => navigate('/onboarding/team-setup')}
  />
)}
```

### Fix 4: Check Vite Build Configuration
Ensure `vite.config.js` includes all necessary files:

```javascript
export default defineConfig({
  // ...
  build: {
    rollupOptions: {
      external: [],  // Don't externalize any imports
      output: {
        manualChunks: undefined  // Let Vite handle chunking
      }
    }
  }
});
```

## Common Issues and Solutions

### Issue: "No active email integration found"
**Solution:** User needs to complete email integration first. Redirect to `/onboarding/email-integration`.

### Issue: "Could not get valid access token"
**Solution:** Token has expired. User needs to re-authenticate with Gmail/Outlook.

### Issue: "Expected folders from business_labels: 0"
**Solution:** User hasn't provisioned folders yet. Run folder provisioning from `/onboarding/team-setup`.

### Issue: Widget stuck on "Checking Folder Health..."
**Solution:** The promise is never resolving. Check for:
- Network requests hanging
- Async functions not returning
- Uncaught errors in the promise chain

### Issue: Widget not visible on dashboard
**Solution:** Check:
- Is `profile?.id` truthy?
- Is `emailProvider` being detected correctly?
- Is the component rendered in the DOM?

## Testing Checklist

- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls
- [ ] Database queries return data
- [ ] OAuth token is valid
- [ ] Widget is rendered in DOM
- [ ] Provider is detected correctly
- [ ] `getFolderHealthSummary` returns valid data
- [ ] Error toast appears if check fails
- [ ] Success state shows correct folder count
- [ ] Warning state shows missing folders
- [ ] Classifier coverage section displays correctly

## Next Steps

1. **Check browser console** for error messages
2. **Inspect network tab** for failed API calls
3. **Verify database** has required data
4. **Test function directly** in console
5. **Add enhanced logging** to narrow down issue
6. **Check Coolify logs** for server-side errors

Once you identify the specific error, apply the appropriate fix from above.
