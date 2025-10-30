# Folder Health Check Fix Summary

## Issue
Folder health check widget not working on production server (Coolify deployment).

## Changes Implemented

### 1. **Enhanced Error Logging in FolderHealthWidget** (`src/components/dashboard/FolderHealthWidget.jsx`)

**Added:**
- Detailed console logging for debugging
- Timestamp tracking for each check
- Complete error details (name, message, stack)
- User ID and provider validation
- Error state handling to display widget even on failure
- Improved toast notifications with specific error messages

**Key Improvements:**
```javascript
console.log('🔍 Starting folder health check...', { userId, provider, timestamp });
console.log('✅ Health check result:', { healthy, healthPercentage, totalFolders, missingCount, provider, error });
console.error('❌ Error details:', { name, message, stack, userId, provider });
```

### 2. **Comprehensive Error Handling in folderHealthCheck.js** (`src/lib/folderHealthCheck.js`)

**Added:**
- Try-catch wrapper in `getFolderHealthSummary()`
- Input validation (userId required)
- Detailed logging at each step
- Fallback return object on error
- Safe property access with fallback values
- Never throws - always returns valid object

**Key Improvements:**
```javascript
// Always returns valid object, never throws
return {
  healthy: false,
  healthPercentage: 0,
  totalFolders: 0,
  missingCount: 0,
  missingFolders: [],
  provider: provider || 'unknown',
  lastChecked: new Date().toISOString(),
  error: error.message || 'Failed to check folder health',
  businessLabelsCount: 0,
  actualFoldersCount: 0,
  classifierCoverage: null
};
```

### 3. **Troubleshooting Guide** (`FOLDER_HEALTH_CHECK_TROUBLESHOOTING.md`)

Created comprehensive guide covering:
- 6 potential root causes
- Debugging steps (browser console, network tab, database queries)
- Quick fixes for common issues
- Testing checklist
- Production-specific troubleshooting

## How to Debug on Production

### Step 1: Check Browser Console
1. Open the dashboard in production
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for these log messages:
   ```
   🔍 Starting folder health check... {userId: "...", provider: "gmail", timestamp: "..."}
   ```

### Step 2: Identify the Error
Look for one of these error patterns:

**Pattern 1: Missing Data**
```
📁 Expected folders from business_labels: 0
❌ Error: No folders configured yet
```
**Solution:** User needs to complete team setup and provision folders

**Pattern 2: Token Issues**
```
❌ Error: Could not get valid access token
```
**Solution:** User needs to re-authenticate with Gmail/Outlook

**Pattern 3: API Failures**
```
❌ Gmail API error: 401 Unauthorized
```
**Solution:** Check OAuth credentials and token expiration

**Pattern 4: Database Query Failures**
```
❌ Error fetching business labels: [error message]
```
**Solution:** Check Supabase connection and RLS policies

### Step 3: Check Network Tab
1. In DevTools, go to Network tab
2. Filter by "Fetch/XHR"
3. Look for failed requests to:
   - `supabase.co/rest/v1/integrations`
   - `supabase.co/rest/v1/business_labels`
   - `gmail.googleapis.com/gmail/v1/users/me/labels`
   - `graph.microsoft.com/v1.0/me/mailFolders`

### Step 4: Verify Database
Run these queries in Supabase SQL Editor:

```sql
-- Check if user has integration
SELECT * FROM integrations WHERE user_id = '[user-id]' AND status = 'active';

-- Check if user has provisioned folders
SELECT COUNT(*) FROM business_labels WHERE business_profile_id = '[user-id]';

-- Check business profile
SELECT business_type, managers, suppliers 
FROM business_profiles 
WHERE user_id = '[user-id]';
```

## Expected Behavior After Fix

### Normal Flow (Success):
1. Widget shows "Checking Folder Health..." (spinning icon)
2. Console logs: `🔍 Starting folder health check...`
3. Console logs: `✅ Health check result: {healthy: true, healthPercentage: 100, ...}`
4. Widget displays green check mark with folder count
5. Shows classifier coverage section

### Error Flow (Handled Gracefully):
1. Widget shows "Checking Folder Health..." (spinning icon)
2. Console logs: `🔍 Starting folder health check...`
3. Console logs: `❌ Failed to check folder health: [error]`
4. Console logs: `❌ Error details: {name, message, stack, userId, provider}`
5. Widget displays amber warning with error message
6. Toast notification shows specific error
7. Widget remains visible with "Redeploy Folders" button

## Common Issues and Solutions

### Issue 1: Widget Not Visible
**Symptoms:** Widget doesn't appear on dashboard at all

**Check:**
- Is `profile?.id` truthy?
- Is `emailProvider` detected correctly?
- Is component rendering in DOM?

**Console command to test:**
```javascript
// Check if widget exists in DOM
document.querySelector('[class*="FolderHealth"]');
// Should return element, not null
```

### Issue 2: Stuck on "Checking..."
**Symptoms:** Widget shows loading state indefinitely

**Causes:**
- API request hanging (no response)
- Promise never resolves
- Network timeout

**Check:**
- Network tab shows pending requests
- Console shows no completion logs
- No error thrown

**Fix:**
- Check network connectivity
- Verify API endpoints are accessible
- Check for CORS issues

### Issue 3: "User ID is required" Error
**Symptoms:** Toast shows "User ID is required"

**Cause:** `profile.id` is null/undefined

**Fix:**
- User not authenticated properly
- Profile not loaded yet
- Redirect to login

### Issue 4: "No active email integration found"
**Symptoms:** Error message in widget

**Cause:** No Gmail/Outlook integration in database

**Fix:**
- User needs to complete email integration
- Redirect to `/onboarding/email-integration`

### Issue 5: "Could not get valid access token"
**Symptoms:** Error after successful provider detection

**Cause:** OAuth token expired or invalid

**Fix:**
- User needs to re-authenticate
- Implement token refresh logic
- Check OAuth consent scopes

## Testing Checklist

After deployment to production, verify:

- [ ] Widget appears on dashboard (after calculator)
- [ ] Console shows: `🔍 Starting folder health check...`
- [ ] Console shows: `✅ Health check result:` or `❌ Failed to check folder health:`
- [ ] Network requests complete successfully
- [ ] Widget displays health status (green check or amber warning)
- [ ] Classifier coverage section displays
- [ ] "Redeploy Folders" button works
- [ ] Toast notifications appear on error
- [ ] Error messages are specific and actionable

## Next Steps

1. **Deploy to production** - Coolify will rebuild with new changes
2. **Monitor console** - Look for the new detailed log messages
3. **Identify specific error** - Use the troubleshooting guide
4. **Apply appropriate fix** - Based on the error type
5. **Report findings** - Share console logs and error details for further assistance

## Additional Resources

- `FOLDER_HEALTH_CHECK_TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- `CLASSIFIER_COVERAGE_ENHANCEMENT_SUMMARY.md` - Details on classifier validation
- `FOLDER_INTEGRATION_ANALYSIS.md` - Integration architecture overview

## Contact

If issues persist after following this guide, provide:
1. Complete browser console logs (from page load to error)
2. Network tab screenshot showing failed requests
3. Database query results from Step 4
4. User ID and email provider being used
