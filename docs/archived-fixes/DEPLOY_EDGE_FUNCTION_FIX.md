# 🚀 Deploy Edge Function Fix

## Issue Fixed
The edge function was querying for `'google'` provider instead of dynamically using the `emailProvider` parameter sent from the frontend. This caused a 500 Internal Server Error during workflow deployment.

## Changes Made
- ✅ Modified `supabase/functions/deploy-n8n/index.ts` (lines 1056-1069)
- ✅ Added `emailProvider` parameter extraction from request body
- ✅ Dynamic provider query: `eq('provider', provider)` instead of hardcoded `'google'`
- ✅ Added console logging to track which provider is being used

## How to Deploy

### Option 1: Using Supabase CLI (Recommended)

```powershell
# 1. Login to Supabase (one-time setup)
npx supabase login

# 2. Link your project (one-time setup)
npx supabase link --project-ref oinxzvqszingwstrbdro

# 3. Deploy the fixed edge function
npx supabase functions deploy deploy-n8n --project-ref oinxzvqszingwstrbdro --no-verify-jwt
```

### Option 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/oinxzvqszingwstrbdro
2. Navigate to **Edge Functions**
3. Find **deploy-n8n** function
4. Click **Deploy New Version**
5. Copy the contents of `supabase/functions/deploy-n8n/index.ts`
6. Paste and deploy

## Testing After Deployment

1. Refresh your browser
2. Go back to the onboarding flow
3. Click "Deploy Automation" again
4. You should see in the console:
   ```
   📧 Using email provider: gmail
   ```
   (or whatever provider you have configured)
5. The deployment should now succeed! ✅

## What This Fixes

**Before:**
```typescript
const { data: integration } = await supabaseAdmin
  .from('integrations')
  .eq('provider', 'google')  // ❌ Hardcoded wrong value
  .single();
```

**After:**
```typescript
const { workflowData, emailProvider } = requestBody;
const provider = emailProvider || 'gmail';  // ✅ Dynamic
console.log(`📧 Using email provider: ${provider}`);

const { data: integration } = await supabaseAdmin
  .from('integrations')
  .eq('provider', provider)  // ✅ Uses correct provider
  .single();
```

## Expected Results

After deploying this fix:
- ✅ No more 500 Internal Server Error
- ✅ Edge function correctly queries for your email provider (gmail/outlook)
- ✅ Workflow deployment completes successfully
- ✅ n8n workflow is created and activated

---

## Need Help?

If you encounter any issues:

1. **Check Supabase Logs:**
   - Go to Supabase Dashboard > Edge Functions > deploy-n8n > Logs
   - Look for any error messages

2. **Verify Integration:**
   ```sql
   SELECT provider, status FROM integrations WHERE user_id = 'YOUR_USER_ID';
   ```
   Make sure you have an active integration with status='active'

3. **Check Frontend Payload:**
   - Open browser DevTools > Network tab
   - Filter for "deploy-n8n"
   - Check the request payload includes `emailProvider` field


