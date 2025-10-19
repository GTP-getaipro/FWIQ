# 🚨 CORS Fix for n8n Deployment

## ❌ **Problem Identified**
Your frontend is getting **CORS errors** when trying to deploy to n8n:
```
Access to fetch at 'https://n8n.srv995290.hstgr.cloud/healthz' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## ✅ **Solution: CORS Proxy**

I've created a **CORS proxy solution** that routes n8n API calls through your backend to avoid CORS issues.

### 📁 **Files Created:**
- `src/lib/n8nCorsProxy.js` - Frontend proxy client
- `supabase/functions/n8n-proxy/index.ts` - Supabase Edge Function proxy
- `deploy-n8n-proxy.sh` - Deployment script

### 🔧 **Files Updated:**
- `src/lib/n8nPreDeploymentValidator.js` - Now uses CORS proxy
- `src/lib/n8nWorkflowActivationManager.js` - Now uses CORS proxy

---

## 🚀 **Quick Fix Steps**

### **Step 1: Deploy the CORS Proxy**
```bash
# Make the script executable
chmod +x deploy-n8n-proxy.sh

# Deploy the Edge Function
./deploy-n8n-proxy.sh
```

### **Step 2: Set Environment Variables**
In your **Supabase Dashboard** → **Settings** → **Edge Functions** → **Environment Variables**:

```env
N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzUyYTAyMi1hZWQzLTQ5YjItOTI3MS1hYWY0MDBiZGU3MTAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU5NTk1OTE0fQ.M1GAoAVvmU9BqMz0qR8Okr38YwI3L9PWYIPYDtlhjFY
```

### **Step 3: Test the Proxy**
```bash
curl -X POST https://oinxzvqszingwstrbdro.supabase.co/functions/v1/n8n-proxy \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"endpoint": "/healthz"}'
```

### **Step 4: Refresh and Deploy**
1. **Refresh your browser** (hard refresh: Ctrl+F5)
2. **Try deployment again** - the CORS errors should be gone!

---

## 🔍 **How It Works**

### **Before (CORS Error):**
```
Frontend (localhost:5173) → n8n API (n8n.srv995290.hstgr.cloud) ❌ CORS BLOCKED
```

### **After (CORS Proxy):**
```
Frontend (localhost:5173) → Supabase Edge Function → n8n API (n8n.srv995290.hstgr.cloud) ✅ WORKS
```

### **Flow:**
1. **Frontend** calls `n8nCorsProxy.checkHealth()`
2. **CORS Proxy** forwards request to Supabase Edge Function
3. **Edge Function** makes the actual API call to n8n
4. **Response** flows back through the proxy to frontend

---

## 🛠️ **Technical Details**

### **CORS Proxy Client (`n8nCorsProxy.js`):**
- Provides clean API methods (`checkHealth()`, `getWorkflow()`, `activateWorkflow()`)
- Routes all requests through Supabase Edge Function
- Handles errors and responses consistently

### **Edge Function (`n8n-proxy/index.ts`):**
- Acts as a server-side proxy
- Adds proper CORS headers
- Forwards requests to n8n with API key authentication
- Returns responses with CORS headers

### **Updated Validators:**
- `n8nPreDeploymentValidator` now uses `this.corsProxy.checkHealth()`
- `n8nWorkflowActivationManager` now uses `this.corsProxy.getWorkflow()`
- All direct `fetch()` calls replaced with proxy methods

---

## 🎯 **Expected Results**

After applying this fix:

✅ **No more CORS errors**  
✅ **n8n health checks work**  
✅ **Workflow deployment succeeds**  
✅ **All n8n API calls routed through proxy**  
✅ **Frontend can communicate with n8n**  

---

## 🚨 **If Still Having Issues**

### **Check Edge Function Logs:**
```bash
supabase functions logs n8n-proxy
```

### **Verify Environment Variables:**
Make sure `N8N_BASE_URL` and `N8N_API_KEY` are set in Supabase Dashboard.

### **Test Proxy Manually:**
Use the curl command above to verify the proxy is working.

### **Check Network Tab:**
Look for requests to `/functions/v1/n8n-proxy` instead of direct n8n calls.

---

This CORS proxy solution will **completely eliminate** the CORS errors and allow your deployment to work properly! 🎉