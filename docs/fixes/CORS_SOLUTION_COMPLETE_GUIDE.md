# Complete CORS Solution Guide for FloworxV2

## 🎯 Problem Summary

Frontend (`http://localhost:5173`) → n8n (`https://n8n.srv995290.hstgr.cloud`) = **CORS Blocked**

```
Access to fetch at 'https://n8n.srv995290.hstgr.cloud/api/v1/workflows/...' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

---

## ✅ Solution: Three-Tier Approach

### 🥇 **Option 1: Enable CORS on n8n (Production - Recommended)**

#### Step 1: Add Environment Variables to n8n

On your Hostinger VPS, find your n8n configuration and add:

```bash
# n8n CORS Configuration
N8N_CORS_ALLOW_ORIGIN=*
N8N_CORS_ALLOW_HEADERS=Authorization,Keep-Alive,User-Agent,Cache-Control,Content-Type,X-N8N-API-KEY
N8N_CORS_ALLOW_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
N8N_CORS_CREDENTIALS=true
```

#### Step 2: Restart n8n

```bash
# SSH into your VPS
ssh root@srv995290.hstgr.cloud

# Restart n8n (adjust command based on your setup)
systemctl restart n8n
# OR
pm2 restart n8n
# OR if using Docker:
docker restart n8n
```

#### Step 3: Verify CORS Headers

```bash
curl -I -X OPTIONS https://n8n.srv995290.hstgr.cloud/api/v1/workflows \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET"
```

You should see:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: ...
```

---

### 🥈 **Option 2: Supabase Edge Function Proxy (Production - Most Secure)**

This is what you started but the Edge Function needs to be properly deployed.

#### Current Issue

```
POST https://oinxzvqszingwstrbdro.supabase.co/functions/v1/n8n-proxy 404
```

The Edge Function exists but returns 404 for some requests.

#### Fix: Redeploy with Correct Code

1. **Verify the Edge Function code** in Supabase Dashboard:
   - Go to: https://supabase.com/dashboard/project/oinxzvqszingwstrbdro/functions/n8n-proxy
   - Make sure it matches: `supabase/functions/n8n-proxy/index.ts`

2. **Ensure environment variables are set**:
   - `N8N_BASE_URL` = `https://n8n.srv995290.hstgr.cloud`
   - `N8N_API_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **The code should be**:
   ```typescript
   Deno.serve(async (req: Request) => {
     if (req.method === 'OPTIONS') {
       return new Response(null, { 
         status: 200, 
         headers: CORS_HEADERS 
       });
     }

     const { endpoint, method, body } = await req.json();
     
     const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
       method: method || 'GET',
       headers: {
         'Content-Type': 'application/json',
         'X-N8N-API-KEY': N8N_API_KEY
       },
       body: body ? JSON.stringify(body) : undefined
     });

     const data = await response.json();
     
     return new Response(JSON.stringify(data), {
       status: response.status,
       headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
     });
   });
   ```

---

### 🥉 **Option 3: Vite Proxy (Local Development - Fastest)**

For **immediate local testing**, add this to `vite.config.js`:

```javascript
export default defineConfig({
  // ... existing config ...
  server: {
    port: 5173,
    proxy: {
      '/n8n-api': {
        target: 'https://n8n.srv995290.hstgr.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/n8n-api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add n8n API key to proxied requests
            proxyReq.setHeader('X-N8N-API-KEY', process.env.VITE_N8N_API_KEY || '');
          });
        }
      }
    }
  }
});
```

Then update your n8n calls:

```javascript
// Before (CORS blocked):
fetch('https://n8n.srv995290.hstgr.cloud/api/v1/workflows/...')

// After (proxied through Vite):
fetch('/n8n-api/api/v1/workflows/...')
```

**Restart Vite** after adding this.

---

## 🔍 Diagnostic Commands

### Check if n8n CORS is enabled:

```bash
curl -I -X OPTIONS https://n8n.srv995290.hstgr.cloud/healthz \
  -H "Origin: http://localhost:5173"
```

### Check if Edge Function is deployed:

```bash
curl -X POST https://oinxzvqszingwstrbdro.supabase.co/functions/v1/n8n-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"endpoint":"/healthz","method":"GET"}'
```

### Test n8n API key:

```bash
curl https://n8n.srv995290.hstgr.cloud/api/v1/workflows \
  -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🚀 Recommended Implementation Order

### Phase 1: Local Development (Now)
1. ✅ Add Vite proxy to `vite.config.js`
2. ✅ Restart dev server
3. ✅ Update `n8nCorsProxy.js` to use `/n8n-api` prefix for local
4. ✅ Test deployment

### Phase 2: Production (This Week)
1. ✅ Enable CORS on n8n server (environment variables)
2. ✅ Restart n8n service
3. ✅ Verify CORS headers present
4. ✅ Remove Vite proxy (direct calls now work)

### Phase 3: Security Hardening (Next Week)
1. ✅ Deploy Supabase Edge Function properly
2. ✅ Route all production calls through Edge Function
3. ✅ Restrict CORS to specific origins (not `*`)
4. ✅ Hide n8n API key from frontend

---

## 📋 Quick Fix (5 Minutes)

**For immediate testing**, add Vite proxy:

1. **Edit `vite.config.js`**:
   ```javascript
   server: {
     proxy: {
       '/n8n-api': {
         target: 'https://n8n.srv995290.hstgr.cloud',
         changeOrigin: true,
         rewrite: (path) => path.replace(/^\/n8n-api/, '')
       }
     }
   }
   ```

2. **Update `src/lib/n8nCorsProxy.js`**:
   ```javascript
   // In directApiCall method, change:
   const url = `/n8n-api${endpoint}`;  // Use proxy in development
   ```

3. **Restart Vite**:
   ```bash
   npm run dev
   ```

4. **Test**: Deploy workflow → Should work!

---

## 🔒 Security Note

**For Production**:
- ❌ Don't use `CORS_ALLOW_ORIGIN=*` (allows any site)
- ✅ Use specific origins: `N8N_CORS_ALLOW_ORIGIN=https://app.floworx-iq.com,http://localhost:5173`
- ✅ Use Supabase Edge Function to hide API keys
- ✅ Implement rate limiting on n8n

---

## 📊 Current Error Breakdown

| Error | Cause | Fix |
|-------|-------|-----|
| `CORS policy: No 'Access-Control-Allow-Origin'` | n8n doesn't allow localhost:5173 | Enable CORS on n8n |
| `POST .../n8n-proxy 404` | Edge Function not found/deployed | Redeploy Edge Function |
| `POST .../n8n-proxy 400` | Edge Function receiving invalid payload | Check Edge Function code |
| `Failed to fetch` | Browser blocking due to CORS | Use proxy or enable CORS |

---

## ✅ Success Indicators

After fixing, you should see:

```
🔐 Creating n8n OAuth2 credential for outlook...
📤 Sending credential creation request to n8n (endpoint: /rest/credentials)...
✅ n8n credential created: cred_abc123
✅ Workflow deployed to N8N: EfLQpviPzoQ0w2Fk
✅ Workflow is fully active and functional
```

**No CORS errors in browser console!**

---

**Recommended**: Start with Option 3 (Vite proxy) for immediate testing, then implement Option 1 (n8n CORS) for production.

