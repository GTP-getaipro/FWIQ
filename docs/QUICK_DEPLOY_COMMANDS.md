# Quick Deploy Commands - FloWorx

**Copy and paste these commands to deploy FloWorx to production**

---

## 🚀 **1. Frontend Deployment (Vercel)**

```bash
# Navigate to project
cd C:\FWIQv2

# Install Vercel CLI (if not installed)
npm install -g vercel

# Build frontend
npm run build

# Deploy to production
vercel --prod

# Follow prompts:
# - Link to existing project or create new
# - Set project name: floworx
# - Set framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

**Add environment variables in Vercel Dashboard:**
```
VITE_SUPABASE_URL=https://ygdcxqigrfzhqvqpqhxl.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=https://api.floworx.com
```

---

## 🔧 **2. Backend Deployment (Coolify)**

### **Option A: Via Coolify UI**

1. Open Coolify: https://coolify.srv995290.hstgr.cloud
2. Create New Resource → Docker Compose
3. Paste this docker-compose.yml:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      SUPABASE_URL: https://ygdcxqigrfzhqvqpqhxl.supabase.co
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      N8N_BASE_URL: https://n8n.srv995290.hstgr.cloud
      N8N_API_KEY: ${N8N_API_KEY}
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health')"]
      interval: 30s
      timeout: 3s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3
```

4. Click Deploy

### **Option B: Via SSH**

```bash
# SSH into VPS
ssh root@srv995290.hstgr.cloud

# Navigate to project directory
cd /var/www/floworx

# Pull latest code
git pull origin main

# Build and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f backend
```

---

## ⚡ **3. n8n Deployment (Already Running)**

**n8n is already deployed at:** https://n8n.srv995290.hstgr.cloud

**To update n8n:**

```bash
# SSH into VPS
ssh root@srv995290.hstgr.cloud

# Navigate to n8n directory
cd /var/lib/docker/volumes/coolify/n8n

# Pull latest n8n image
docker pull n8nio/n8n:latest

# Restart n8n via Coolify UI
# Or via command:
docker restart <n8n-container-id>
```

---

## 🗄️ **4. Database Migrations (Supabase)**

**Run migrations in Supabase SQL Editor:**

```sql
-- 1. Business Type Templates (if not already run)
-- Copy from: supabase/migrations/20250115_business_type_templates.sql

-- 2. Template Merging Functions (if not already run)
-- Copy from: supabase/migrations/20250115_template_merging_functions.sql

-- 3. Sync Frontend Templates (if not already run)
-- Copy from: supabase/migrations/20250115_sync_frontend_templates.sql

-- 4. Verify migrations
SELECT 
  business_type,
  is_active,
  template_version
FROM business_type_templates
ORDER BY is_active DESC, business_type;
```

---

## ⚙️ **5. Edge Functions Deployment (Supabase)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy deploy-n8n Edge Function
supabase functions deploy deploy-n8n --project-ref ygdcxqigrfzhqvqpqhxl

# Set Edge Function secrets
supabase secrets set --project-ref ygdcxqigrfzhqvqpqhxl \
  N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud \
  N8N_API_KEY=<your-n8n-api-key> \
  OPENAI_KEY_1=<key-1> \
  OPENAI_KEY_2=<key-2> \
  OPENAI_KEY_3=<key-3> \
  OPENAI_KEY_4=<key-4> \
  OPENAI_KEY_5=<key-5>
```

---

## 🌐 **6. DNS Configuration (Hostinger)**

**Add these DNS records in Hostinger DNS Manager:**

```
Type    Name    Value                           TTL
A       @       76.76.21.21 (Vercel)           3600
A       api     <VPS-IP>                        3600
A       n8n     <VPS-IP>                        3600
CNAME   www     floworx.com                     3600
```

**Get VPS IP:**
```bash
ssh root@srv995290.hstgr.cloud
curl ifconfig.me
```

---

## 🧪 **7. Verify Deployment**

```bash
# Test Frontend
curl https://floworx.com
# Expected: HTML response

# Test Backend
curl https://api.floworx.com/health
# Expected: {"status":"ok"}

# Test n8n
curl https://n8n.srv995290.hstgr.cloud/healthz
# Expected: {"status":"ok"}

# Test Database
# Run in Supabase SQL Editor:
SELECT COUNT(*) FROM business_type_templates WHERE is_active = true;
# Expected: 12
```

---

## 🔄 **8. Update Deployment (After Changes)**

### **Frontend Update:**
```bash
cd C:\FWIQv2
git pull
npm run build
vercel --prod
```

### **Backend Update:**
```bash
# Via Coolify UI: Click "Redeploy"
# Or via SSH:
ssh root@srv995290.hstgr.cloud
cd /var/www/floworx
git pull
docker-compose up -d --build
```

### **Edge Function Update:**
```bash
supabase functions deploy deploy-n8n --project-ref ygdcxqigrfzhqvqpqhxl
```

---

## 🚨 **9. Rollback (If Needed)**

### **Frontend Rollback:**
```bash
# In Vercel Dashboard:
# Deployments → Select previous deployment → Promote to Production
```

### **Backend Rollback:**
```bash
ssh root@srv995290.hstgr.cloud
cd /var/www/floworx
git checkout <previous-commit-hash>
docker-compose up -d --build
```

### **Database Rollback:**
```sql
-- Restore from Supabase backup
-- Dashboard → Database → Backups → Restore
```

---

## 📊 **10. Monitor Deployment**

### **Check Logs:**

```bash
# Backend logs
ssh root@srv995290.hstgr.cloud
docker-compose logs -f backend

# n8n logs
docker logs -f <n8n-container-id>

# Frontend logs
# Vercel Dashboard → Deployments → View Logs

# Edge Function logs
# Supabase Dashboard → Edge Functions → Logs
```

### **Health Checks:**

```bash
# Create health-check.sh
#!/bin/bash

echo "🔍 Checking FloWorx Health..."

# Frontend
echo -n "Frontend: "
curl -s -o /dev/null -w "%{http_code}" https://floworx.com
echo ""

# Backend
echo -n "Backend: "
curl -s -o /dev/null -w "%{http_code}" https://api.floworx.com/health
echo ""

# n8n
echo -n "n8n: "
curl -s -o /dev/null -w "%{http_code}" https://n8n.srv995290.hstgr.cloud/healthz
echo ""

echo "✅ Health check complete!"
```

Run: `bash health-check.sh`

---

## 🎯 **Quick Deploy Order**

**For first-time deployment, follow this order:**

1. ✅ Database Migrations (Supabase SQL Editor)
2. ✅ Edge Functions (Supabase CLI)
3. ✅ Backend (Coolify)
4. ✅ Frontend (Vercel)
5. ✅ DNS Configuration (Hostinger)
6. ✅ Verify All Services

**Total time: ~30-45 minutes**

---

## 🆘 **Troubleshooting**

### **Frontend not loading:**
```bash
# Check Vercel deployment status
vercel ls

# Check DNS propagation
nslookup floworx.com
```

### **Backend API errors:**
```bash
# Check backend logs
ssh root@srv995290.hstgr.cloud
docker-compose logs backend

# Check environment variables
docker-compose config
```

### **n8n not accessible:**
```bash
# Check n8n container status
docker ps | grep n8n

# Restart n8n
docker restart <n8n-container-id>
```

### **Database connection errors:**
```bash
# Test Supabase connection
curl https://ygdcxqigrfzhqvqpqhxl.supabase.co/rest/v1/

# Check RLS policies in Supabase Dashboard
```

---

**Ready to deploy!** 🚀

**Need help?** Check `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed instructions.

