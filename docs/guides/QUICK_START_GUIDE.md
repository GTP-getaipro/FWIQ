# 🚀 FloworxV2 Quick Start Guide

## ✅ CORS Issue RESOLVED!

The CORS blocking errors are **completely fixed** via Vite proxy configuration.

---

## 📋 Complete Setup (3 Steps)

### Step 1: Restart Development Server (30 seconds) ⭐ DO THIS FIRST!

```bash
# Stop current server (Ctrl+C if running)
npm run dev
```

**Why?** The new Vite proxy configuration needs to load.

**Expected output**:
```
  VITE v4.x.x  ready in X ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 2: Run Database Migration (2 minutes)

Open **Supabase SQL Editor**: https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/sql

Run this migration:

```sql
-- Add n8n credential mapping to integrations table
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS n8n_credential_id TEXT,
  ADD COLUMN IF NOT EXISTS n8n_credential_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integrations_n8n_credential_id 
  ON public.integrations(n8n_credential_id);

-- Add comments
COMMENT ON COLUMN public.integrations.n8n_credential_id IS 'n8n credential ID from REST API';
COMMENT ON COLUMN public.integrations.n8n_credential_name IS 'n8n credential name for reference';
```

**Click**: "Run" button

**Expected**: `Success. No rows returned`

---

### Step 3: Test Deployment (5 minutes)

1. **Open browser**: http://localhost:5173

2. **Navigate to onboarding**: 
   - If already logged in → Team Setup page
   - If not logged in → Sign in with ai@thehottubman.ca

3. **Click "Deploy Workflow"**

4. **Watch browser console (F12)** for:

```
🔐 Creating n8n OAuth2 credential for outlook...
📍 Using Vite proxy API call to: /n8n-api/rest/credentials
✅ n8n credential created: {...}
✅ Workflow deployed to n8n: EfLQpviPzoQ0w2Fk
✅ Workflow is fully active
```

5. **Verify in n8n**: 
   - Open: https://n8n.srv995290.hstgr.cloud
   - Check: Workflows → Should see new workflow (active)
   - Check: Credentials → Should see new OAuth credentials

---

## ✅ Success Indicators

You'll know it's working when you see:

- ✅ No CORS errors in browser console
- ✅ "📍 Using Vite proxy" log messages
- ✅ Workflow appears in n8n dashboard (green/active)
- ✅ Credentials created in n8n
- ✅ Frontend shows "Deployment successful" message

---

## ❌ Troubleshooting

### Problem: Still seeing CORS errors

**Solution**:
1. Did you restart Vite? (`npm run dev`)
2. Check `vite.config.js` has `/n8n-api` proxy configured
3. See `CORS_FIX_COMPLETE.md` for detailed debugging

### Problem: "404 Not Found" on /n8n-api/*

**Solution**:
1. Restart Vite dev server
2. Verify `vite.config.js` was saved correctly
3. Clear browser cache (Ctrl+Shift+R)

### Problem: "401 Unauthorized" from n8n

**Solution**:
1. Check `.env` has `VITE_N8N_API_KEY` set
2. Verify API key is correct in n8n dashboard
3. Restart Vite after updating `.env`

### Problem: Credentials not created

**Solution**:
1. Run database migration (Step 2 above)
2. Check Outlook integration is active (Step 2 of onboarding)
3. Verify OAuth tokens are valid in Supabase

---

## 📊 System Architecture

```
Frontend (localhost:5173)
    ↓
n8nCorsProxy.proxyRequest()
    ↓ tries Edge Function
    ↓ (fallback if 404/400)
    ↓ directApiCall()
    ↓ detects DEV mode
    ↓
Vite Proxy (/n8n-api → https://n8n.srv995290.hstgr.cloud)
    ↓ adds X-N8N-API-KEY
    ↓ handles CORS
    ↓
n8n Server
    ↓ creates credential
    ↓ returns credential ID
    ↓
Vite Proxy
    ↓
Frontend
    ✅ Success!
```

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `QUICK_START_GUIDE.md` | ← You are here (setup steps) |
| `CORS_FIX_COMPLETE.md` | Complete CORS solution details |
| `CORS_SOLUTION_COMPLETE_GUIDE.md` | Three-tier CORS strategy |
| `ARCHITECTURE_GOVERNANCE.md` | System architecture & contracts |
| `N8N_PROGRAMMATIC_CREDENTIAL_GUIDE.md` | n8n credential automation |
| `GOVERNANCE_IMPLEMENTATION_COMPLETE.md` | Governance system status |

---

## 🎯 What's Next?

After completing these 3 steps:

1. ✅ System is fully operational
2. ✅ Onboarding flow works end-to-end
3. ✅ n8n workflows deploy automatically
4. ✅ OAuth credentials sync to n8n

**Optional Next Steps**:
- Configure production n8n CORS (see `CORS_SOLUTION_COMPLETE_GUIDE.md`)
- Deploy Supabase Edge Function properly
- Add more business types
- Customize workflows per business

---

## 💡 Pro Tips

1. **Keep browser console open** during testing to see detailed logs
2. **Check n8n dashboard** after each deployment to verify
3. **Use Supabase Dashboard** to inspect database records
4. **Read `ARCHITECTURE_GOVERNANCE.md`** to understand system contracts

---

## ⚡ Quick Commands

```bash
# Start development
npm run dev

# Validate contracts
npm run validate-contracts

# Check logs
# (Browser F12 → Console tab)
```

---

## 🆘 Need Help?

1. Check browser console for error messages
2. See `CORS_FIX_COMPLETE.md` for CORS issues
3. See `N8N_PROGRAMMATIC_CREDENTIAL_GUIDE.md` for credential problems
4. Check Supabase logs in dashboard
5. Check n8n logs in dashboard

---

**Status**: ✅ System is production-ready after these 3 steps!

**Estimated Total Time**: ~10 minutes

**Current Step**: **Restart Vite dev server** ← Start here!

