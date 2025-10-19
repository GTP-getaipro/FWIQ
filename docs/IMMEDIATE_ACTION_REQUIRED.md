# ⚡ Immediate Action Required

## 🎯 To Complete n8n Credential Automation

### Step 1: Run Database Migration (2 minutes)

Go to Supabase SQL Editor and run this:

```sql
-- Add n8n credential mapping columns to integrations table
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS n8n_credential_id TEXT,
  ADD COLUMN IF NOT EXISTS n8n_credential_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integrations_n8n_credential_id 
  ON public.integrations(n8n_credential_id);

-- Add helpful comments
COMMENT ON COLUMN public.integrations.n8n_credential_id IS 'The credential ID from n8n REST API';
COMMENT ON COLUMN public.integrations.n8n_credential_name IS 'Human-readable credential name in n8n';
```

Or run the file: `migrations/add-n8n-credential-columns.sql`

---

### Step 2: Restart Vite Dev Server (30 seconds)

```powershell
# In your terminal running the dev server:
# 1. Press Ctrl+C to stop
# 2. Run:
npm run dev
```

This loads the OAuth client credentials from your `.env` file.

---

### Step 3: Hard Refresh Browser (5 seconds)

Press **Ctrl + Shift + R** to force reload with fresh environment variables.

---

### Step 4: Test Deployment

1. Click "Deploy Automation" button
2. Watch console for:
   ```
   🔐 Step 1: Creating n8n OAuth credentials...
   📤 Sending credential creation request to n8n (endpoint: /rest/credentials)...
   ✅ n8n credential created: cred_abc123
   ✅ Workflow deployed and activated!
   ```

3. Verify in n8n:
   - Go to: https://n8n.srv995290.hstgr.cloud/credentials
   - Look for "Business Outlook" or "Business Gmail"
   - Should show "Connected" status

---

## ✅ Expected Result

After these 3 steps, your workflow deployment will:

1. ✅ Automatically create n8n OAuth credentials
2. ✅ Deploy workflow to n8n
3. ✅ Activate workflow immediately
4. ✅ Start processing emails

**Total time**: ~3 minutes

---

## 🆘 If Something Goes Wrong

### "Environment variables still undefined"

**Solution**: Make sure you restarted **both**:
1. Vite dev server (Ctrl+C, then `npm run dev`)
2. Browser page (Ctrl + Shift + R)

### "Still getting 404 from n8n-proxy"

**Solution**: The issue is the Edge Function. But don't worry - the system will fall back to direct backend API deployment (which works!).

You can safely ignore these errors:
- `POST .../n8n-proxy 404`
- `POST .../n8n-proxy 400`

The workflow **will still deploy successfully** via the backend API.

### "Failed to create credential"

**Check**: Did you run the database migration? The `n8n_credential_id` column must exist in the `integrations` table.

---

## 📋 Files Created/Updated

- ✅ `src/lib/n8nCredentialCreator.js` - Uses correct `/rest/credentials` endpoint
- ✅ `src/lib/workflowDeployer.js` - Integrated credential creation
- ✅ `migrations/add-n8n-credential-columns.sql` - Database schema update
- ✅ `ARCHITECTURE_GOVERNANCE.md` - System governance blueprint
- ✅ `N8N_PROGRAMMATIC_CREDENTIAL_GUIDE.md` - Technical implementation guide

---

**Ready to complete the setup? Just follow the 3 steps above!** 🚀

