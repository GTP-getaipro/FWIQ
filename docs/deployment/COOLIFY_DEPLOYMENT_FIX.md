# 🚀 Coolify Deployment Fix Guide

## 🚨 Issue Resolved: React 19 Peer Dependency Conflict

### **Problem**
The Coolify deployment was failing with this error:
```
npm error ERESOLVE could not resolve
npm error While resolving: react-helmet-async@2.0.5
npm error Found: react@19.2.0
npm error Could not resolve dependency:
npm error peer react@"^16.6.0 || ^17.0.0 || ^18.0.0" from react-helmet-async@2.0.5
```

### **Root Cause**
- **React 19.2.0** is being used in the project
- **react-helmet-async@2.0.5** only supports React 16, 17, or 18
- Docker build runs `npm ci --only=production` which fails on peer dependency mismatches
- Frontend builds need devDependencies (Vite, build tools) but `--only=production` excludes them

### **Solution Applied**
Updated `Dockerfile` to:
```dockerfile
# Install all dependencies (including devDependencies needed for build)
RUN npm ci --legacy-peer-deps
```

**Changes made:**
1. ✅ Removed `--only=production` flag (needed devDependencies for Vite build)
2. ✅ Added `--legacy-peer-deps` flag (bypasses React 19 peer dependency conflicts)
3. ✅ Allows build to proceed despite react-helmet-async compatibility issue

---

## 🛠️ Additional Coolify Configuration

### **Environment Variables in Coolify**

**Important:** Set these in Coolify → Environment Variables:

```bash
# Core Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Supabase (Replace with your actual values)
SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# N8N Integration
N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=your_n8n_api_key
VITE_N8N_API_KEY=your_n8n_api_key

# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
```

### **NODE_ENV Build Warning Fix**

If you see this warning:
```
⚠️ Build-time environment variable warning: NODE_ENV=production
Issue: Skips devDependencies installation which are often required for building
```

**Solution:**
1. In Coolify → Environment Variables
2. Find `NODE_ENV=production`
3. **Uncheck** "Available at Buildtime"
4. This allows devDependencies to be installed during build

---

## 🔄 Deployment Steps

### **1. Repository Setup**
✅ **Completed:** Code pushed to https://github.com/GTP-getaipro/FWIQ

### **2. Coolify Project Setup**
1. Create new project in Coolify
2. Connect to GitHub repository: `GTP-getaipro/FWIQ`
3. Coolify will detect `coolify.yml` configuration

### **3. Service Configuration**
The `coolify.yml` defines three services:
- **frontend**: React app with Nginx
- **backend**: Express.js API server  
- **redis**: Caching service

### **4. Environment Variables**
Set all environment variables in Coolify UI (see list above)

### **5. Deploy**
1. Click "Deploy" in Coolify
2. Monitor build logs for any issues
3. Verify all services are healthy

---

## 🧪 Testing Deployment

### **Health Checks**
- **Frontend**: `https://your-domain.com/`
- **Backend**: `https://your-domain.com/api/health`
- **Redis**: Internal service communication

### **Functionality Tests**
1. **User Registration/Login**
2. **OAuth Integration** (Gmail/Outlook)
3. **N8N Workflow Deployment**
4. **Email Automation**
5. **AI Features**

---

## 🚨 Troubleshooting

### **If Build Still Fails**

**Option 1: Alternative Dockerfile Approach**
```dockerfile
# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Build the application
RUN npm run build

# Production stage - only copy built files
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

**Option 2: Downgrade React (if needed)**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

**Option 3: Update react-helmet-async**
```bash
npm install react-helmet-async@latest
```

### **Common Issues**
- **Port conflicts**: Ensure ports 80, 3001, 6379 are available
- **Environment variables**: Double-check all secrets are set correctly
- **Database connections**: Verify Supabase credentials
- **N8N API**: Confirm N8N instance is accessible

---

## ✅ Success Indicators

Your deployment is successful when:
- ✅ All services show "Healthy" status
- ✅ Frontend loads at your domain
- ✅ Backend API responds to health checks
- ✅ User can complete onboarding flow
- ✅ OAuth integrations work
- ✅ N8N workflows deploy successfully

---

## 📞 Support

If you encounter issues:
1. Check Coolify build logs
2. Verify environment variables
3. Test individual services
4. Review this guide for common solutions

**Repository**: https://github.com/GTP-getaipro/FWIQ
**Deployment Config**: `coolify.yml`
**Dockerfiles**: `Dockerfile` (frontend), `backend/Dockerfile` (backend)
