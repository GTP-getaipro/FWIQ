# FloWorx Deployment Guide

**Version:** 2.0.0  
**Last Updated:** October 29, 2025

---

## 🎯 Overview

This guide covers deploying FloWorx to production using Coolify (recommended), Docker Compose, or Vercel. Choose the deployment method that best fits your infrastructure.

---

## 📋 Pre-Deployment Checklist

### Required Services Setup

- [ ] **Supabase Project**
  - Create project at [supabase.com](https://supabase.com)
  - Note your Project URL and API keys
  - Run all database migrations
  - Deploy edge functions

- [ ] **N8N Instance**
  - Self-hosted N8N (VPS recommended)
  - SSL certificate configured
  - API key generated
  - Base URL accessible

- [ ] **OpenAI Account**
  - API key with GPT-4o-mini access
  - Billing configured
  - Usage limits set (optional)

- [ ] **OAuth Applications**
  - Google Cloud Console: OAuth 2.0 client
  - Microsoft Azure: App registration
  - Redirect URIs configured

- [ ] **Email Provider** (for notifications)
  - SendGrid account (optional)
  - SMTP credentials configured

---

## 🚀 Deployment Option 1: Coolify (Recommended)

Coolify is a self-hosted PaaS that simplifies Docker deployment with automatic SSL, health checks, and zero-downtime deploys.

### Prerequisites

- Coolify instance running
- Git repository (GitHub/GitLab)
- Domain names configured:
  - `app.floworx-iq.com` (frontend)
  - `api.floworx-iq.com` (backend)

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git add -A
git commit -m "Prepare for production deployment"
git push origin master
```

### Step 2: Create Coolify Resources

**Frontend Service:**
```yaml
Name: floworx-frontend
Type: Docker Compose
Repository: https://github.com/your-org/FloWorx-Production
Branch: master
Docker Compose File: docker-compose.yml
Build Pack: Dockerfile
```

**Backend Service:**
```yaml
Name: floworx-backend
Type: Docker Compose
Repository: https://github.com/your-org/FloWorx-Production
Branch: master
Docker Compose File: docker-compose.yml
Build Pack: backend/Dockerfile
```

**Redis Service:**
```yaml
Name: floworx-redis
Type: Docker Image
Image: redis:7-alpine
Persistent Storage: /data
```

### Step 3: Configure Environment Variables

**Frontend Environment (`floworx-frontend`):**
```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Backend API
VITE_BACKEND_URL=http://floworx-backend:3001  # Internal Coolify network

# Optional
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_ANALYTICS_ID=G-XXXXXXXXXX
```

**Backend Environment (`floworx-backend`):**
```bash
# Server Config
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI
OPENAI_API_KEY=sk-proj-xxx

# N8N
N8N_API_URL=https://n8n.floworx-iq.com
N8N_API_KEY=your-n8n-api-key
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your-secure-password

# Redis
REDIS_URL=redis://floworx-redis:6379  # Internal Coolify network

# OAuth (Google)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://api.floworx-iq.com/api/oauth/callback/google

# OAuth (Microsoft)
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
MICROSOFT_REDIRECT_URI=https://api.floworx-iq.com/api/oauth/callback/microsoft

# Optional
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
```

### Step 4: Configure Networking

**Important**: Coolify uses internal Docker networks for service-to-service communication.

**Fix nginx.conf** (if using nginx proxy):
```nginx
# ❌ WRONG - Uses external domain
proxy_pass http://api.floworx-iq.com;

# ✅ CORRECT - Uses internal Coolify service name
proxy_pass http://floworx-backend:3001;
```

### Step 5: Deploy Services

1. **Deploy Redis First:**
   ```
   Coolify Dashboard → floworx-redis → Deploy
   Wait for: Status = Running
   ```

2. **Deploy Backend:**
   ```
   Coolify Dashboard → floworx-backend → Deploy
   Wait for: Health check passing
   ```

3. **Deploy Frontend:**
   ```
   Coolify Dashboard → floworx-frontend → Deploy
   Wait for: Health check passing
   ```

### Step 6: Configure SSL

```
Coolify → floworx-frontend → Domains
  - Domain: app.floworx-iq.com
  - SSL: Auto (Let's Encrypt)
  - Click "Generate Certificate"

Coolify → floworx-backend → Domains
  - Domain: api.floworx-iq.com
  - SSL: Auto (Let's Encrypt)
  - Click "Generate Certificate"
```

### Step 7: Verify Deployment

```bash
# Frontend health
curl https://app.floworx-iq.com
# Expected: HTML response

# Backend health
curl https://api.floworx-iq.com/health
# Expected: {"status":"healthy","uptime":...}

# Redis (from backend container)
redis-cli -h floworx-redis ping
# Expected: PONG
```

### Troubleshooting Coolify

**Issue: Bad Gateway (502)**
```bash
# Check backend is running
Coolify → floworx-backend → Logs

# Verify VITE_BACKEND_URL uses internal network
echo $VITE_BACKEND_URL
# Should be: http://floworx-backend:3001
```

**Issue: Redis Connection Failed**
```bash
# Check Redis is running
Coolify → floworx-redis → Status

# Verify REDIS_URL in backend
echo $REDIS_URL
# Should be: redis://floworx-redis:6379
```

**Issue: Build Fails**
```bash
# Force rebuild without cache
Coolify → Service → Settings → Clear Build Cache → Deploy
```

---

## 🐳 Deployment Option 2: Docker Compose

Standalone Docker Compose deployment (no Coolify required).

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- SSL certificates (or use Traefik/Caddy)

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/FloWorx-Production
cd FloWorx-Production
```

### Step 2: Configure Environment

```bash
# Copy environment templates
cp .env.production.example .env.production
cp backend/.env.production.example backend/.env.production

# Edit with your values
nano .env.production
nano backend/.env.production
```

### Step 3: Build and Deploy

```bash
# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 4: Configure Reverse Proxy

**Option A: Nginx Reverse Proxy**

Create `/etc/nginx/sites-available/floworx`:
```nginx
# Frontend
server {
    listen 80;
    server_name app.floworx-iq.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend
server {
    listen 80;
    server_name api.floworx-iq.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/floworx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Certbot
sudo certbot --nginx -d app.floworx-iq.com -d api.floworx-iq.com
```

**Option B: Traefik (Automatic SSL)**

Add labels to `docker-compose.yml`:
```yaml
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.floworx-frontend.rule=Host(`app.floworx-iq.com`)"
      - "traefik.http.routers.floworx-frontend.tls.certresolver=letsencrypt"
  
  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.floworx-backend.rule=Host(`api.floworx-iq.com`)"
      - "traefik.http.routers.floworx-backend.tls.certresolver=letsencrypt"
```

---

## ☁️ Deployment Option 3: Vercel (Frontend Only)

Deploy frontend to Vercel, backend separately.

### Prerequisites

- Vercel account
- Vercel CLI installed

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Configure Vercel

Create `vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "VITE_BACKEND_URL": "@backend-url"
  },
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": { "cache-control": "public, max-age=31536000, immutable" }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Step 3: Deploy

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Add environment variables (one-time)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_BACKEND_URL production
```

### Step 4: Deploy Backend Separately

Backend must be deployed to a VPS or cloud provider (AWS, DigitalOcean, etc.) since Vercel only supports serverless functions.

---

## 🗄️ Database Setup

### Step 1: Create Supabase Project

```bash
# Go to https://supabase.com
# Click "New Project"
# Note your Project URL and API keys
```

### Step 2: Run Migrations

**Option A: Supabase Dashboard (Recommended)**
```bash
# Navigate to: Project → SQL Editor
# Run each migration file in order from supabase/migrations/
# Start with earliest date: 20241027_*.sql
```

**Option B: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Required Migrations (In Order)

1. `20241027_create_business_profiles.sql`
2. `20241027_fix_business_profiles_schema.sql`
3. `20241027_fix_onboarding_rls.sql`
4. `20241027_fix_workflows_schema.sql`
5. `20241027_standardize_user_id.sql`
6. `20241220_create_communication_styles_table.sql`
7. `20241221_enhance_communication_styles_table.sql`
8. `20250107_multi_business_system.sql`
9. `20250114_voice_learning_tables.sql`
10. `20250115_business_type_templates.sql`
11. `20250122_enhance_communication_styles_for_voice_training.sql`
12. `20251029_add_deleted_at_to_business_labels.sql`

### Step 3: Verify Schema

```sql
-- Run verification query
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected tables:
-- profiles, business_profiles, business_labels, oauth_tokens,
-- communication_styles, voice_training_samples, workflows,
-- performance_metrics, email_logs, ai_draft_learning
```

---

## ⚡ Supabase Edge Functions

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
supabase login
```

### Step 2: Link Project

```bash
supabase link --project-ref your-project-ref
```

### Step 3: Deploy Functions

```bash
# Deploy all functions
supabase functions deploy deploy-n8n
supabase functions deploy style-memory
supabase functions deploy detect-provider
supabase functions deploy gmail-webhook
supabase functions deploy outlook-webhook
supabase functions deploy email-webhook

# Or deploy all at once
cd supabase/functions
for func in */; do
  supabase functions deploy "${func%/}"
done
```

### Step 4: Set Function Secrets

```bash
# OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-proj-xxx

# N8N Configuration
supabase secrets set N8N_API_URL=https://n8n.floworx-iq.com
supabase secrets set N8N_API_KEY=your-n8n-api-key

# Supabase (for edge functions)
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 5: Verify Functions

```bash
# Test deploy-n8n function
curl -X POST https://xxxxx.supabase.co/functions/v1/deploy-n8n \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id"}'

# Expected: {"success":true,...} or detailed error
```

---

## 🔧 N8N Setup

### Step 1: Deploy N8N (VPS)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Create N8N directory
mkdir -p ~/.n8n

# Run N8N
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your-secure-password \
  -e N8N_HOST=n8n.floworx-iq.com \
  -e N8N_PROTOCOL=https \
  -e WEBHOOK_URL=https://n8n.floworx-iq.com/ \
  n8n/n8n:latest
```

### Step 2: Configure SSL (Caddy)

```bash
# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | apt-key add -
echo "deb https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy

# Configure Caddyfile
cat > /etc/caddy/Caddyfile << EOF
n8n.floworx-iq.com {
    reverse_proxy localhost:5678
}
EOF

# Start Caddy
systemctl enable caddy
systemctl start caddy
```

### Step 3: Generate N8N API Key

```bash
# Access N8N
https://n8n.floworx-iq.com

# Login with credentials
# Go to: Settings → API → Create API Key
# Copy key for backend environment
```

---

## 🔐 OAuth Application Setup

### Google OAuth (Gmail)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "FloWorx Production"
3. Enable APIs:
   - Gmail API
   - Google OAuth2 API
4. Create OAuth 2.0 Client:
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     https://api.floworx-iq.com/api/oauth/callback/google
     https://app.floworx-iq.com/oauth/callback/google
     ```
5. Copy Client ID and Client Secret

### Microsoft OAuth (Outlook)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: Azure Active Directory → App registrations → New registration
3. Name: "FloWorx Production"
4. Redirect URI:
   ```
   https://api.floworx-iq.com/api/oauth/callback/microsoft
   https://app.floworx-iq.com/oauth/callback/microsoft
   ```
5. API Permissions:
   - Mail.ReadWrite
   - Mail.Send
   - MailboxSettings.ReadWrite
   - offline_access
6. Certificates & Secrets → New client secret
7. Copy Application (client) ID and Client Secret

---

## 🎯 Post-Deployment Verification

### Automated Health Checks

```bash
#!/bin/bash
# health-check.sh

echo "🏥 FloWorx Health Check"

# Frontend
echo -n "Frontend: "
curl -sf https://app.floworx-iq.com > /dev/null && echo "✅ OK" || echo "❌ FAIL"

# Backend
echo -n "Backend: "
curl -sf https://api.floworx-iq.com/health > /dev/null && echo "✅ OK" || echo "❌ FAIL"

# Supabase
echo -n "Supabase: "
curl -sf https://xxxxx.supabase.co/rest/v1/ > /dev/null && echo "✅ OK" || echo "❌ FAIL"

# N8N
echo -n "N8N: "
curl -sf https://n8n.floworx-iq.com > /dev/null && echo "✅ OK" || echo "❌ FAIL"
```

### Manual Testing

1. **User Registration:**
   - Visit https://app.floworx-iq.com
   - Sign up with test email
   - Verify email confirmation

2. **OAuth Integration:**
   - Complete onboarding
   - Connect Gmail or Outlook
   - Verify redirect back to app

3. **Folder Provisioning:**
   - Select business type
   - Check email folders created
   - Verify folder health > 70%

4. **N8N Workflow:**
   - Check workflow deployed in N8N
   - Send test email
   - Verify classification & labeling

5. **Performance Dashboard:**
   - Check metrics appear
   - Verify graphs render
   - Test date range filters

---

## 🔄 Update & Maintenance

### Rolling Updates (Coolify)

```bash
# Coolify auto-deploys on git push
git add -A
git commit -m "Update: Feature X"
git push origin master

# Coolify will:
# 1. Pull latest code
# 2. Build new image
# 3. Run health checks
# 4. Switch traffic (zero downtime)
# 5. Keep old container as backup
```

### Manual Updates (Docker Compose)

```bash
# Pull latest code
git pull origin master

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f
```

### Database Migrations

```bash
# New migration file
supabase/migrations/20251030_new_feature.sql

# Apply migration
supabase db push

# Or via SQL Editor in Supabase Dashboard
```

### Edge Function Updates

```bash
# Make changes to function
nano supabase/functions/deploy-n8n/index.ts

# Deploy updated function
supabase functions deploy deploy-n8n

# Verify
curl -X POST https://xxxxx.supabase.co/functions/v1/deploy-n8n \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🚨 Rollback Procedures

### Coolify Rollback

```
Coolify Dashboard → Service → Deployments → Previous Deployment → Redeploy
```

### Docker Compose Rollback

```bash
# Checkout previous version
git checkout HEAD~1

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database Rollback

```sql
-- If migration has down/rollback script
-- Run rollback migration

-- Otherwise, restore from backup
-- Supabase: Project Settings → Backups → Restore
```

---

## 📊 Monitoring & Logging

### Log Aggregation

**Coolify:**
```
Dashboard → Service → Logs (live tail)
```

**Docker Compose:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### Application Logs

**Backend Logs:**
```bash
# Winston logs to files
backend/logs/combined.log    # All logs
backend/logs/error.log       # Errors only
backend/logs/exceptions.log  # Uncaught exceptions
backend/logs/rejections.log  # Unhandled promise rejections
```

### Metrics & Alerts (Optional)

**Sentry Integration:**
```javascript
// Frontend
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });

// Backend
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

**Uptime Monitoring:**
- UptimeRobot: Monitor https://app.floworx-iq.com
- Pingdom: Monitor API endpoints
- Healthchecks.io: Cron job monitoring

---

## 🔒 Security Best Practices

### SSL/TLS

- ✅ Use Let's Encrypt for free SSL
- ✅ Enforce HTTPS (redirect HTTP → HTTPS)
- ✅ Use TLS 1.3 minimum
- ✅ HSTS headers enabled

### Secrets Management

```bash
# ❌ NEVER commit secrets
.env
.env.production.local
*.key
*.pem

# ✅ Use environment variables
export OPENAI_API_KEY=sk-xxx

# ✅ Use secret managers (production)
# - Supabase Vault
# - AWS Secrets Manager
# - HashiCorp Vault
```

### Regular Updates

```bash
# Update dependencies monthly
npm audit
npm update

# Update Docker images
docker pull node:20-alpine
docker pull redis:7-alpine
docker pull nginx:alpine
```

---

## 📚 Additional Resources

- [Architecture Documentation](ARCHITECTURE.md)
- [API Reference](docs/api/README.md)
- [Troubleshooting Guide](docs/guides/TROUBLESHOOTING.md)
- [Supabase Documentation](https://supabase.com/docs)
- [N8N Documentation](https://docs.n8n.io)
- [Coolify Documentation](https://coolify.io/docs)

---

## 🆘 Support & Troubleshooting

### Common Issues

**Issue: Build fails with module not found**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue: OAuth redirect fails**
```bash
# Check redirect URI matches exactly
# Google Console / Azure Portal
# Include trailing slash if needed
```

**Issue: N8N workflow not triggering**
```bash
# Check N8N workflow is active
# Verify webhook URL is correct
# Check N8N logs for errors
docker logs n8n
```

### Getting Help

- **Documentation**: Check `/docs` folder
- **GitHub Issues**: Open issue with logs
- **Email Support**: support@floworx-iq.com

---

**Deployment Checklist Summary:**

- [ ] Supabase project created & migrations run
- [ ] N8N instance deployed with SSL
- [ ] OAuth applications configured (Google + Microsoft)
- [ ] Environment variables set (frontend + backend)
- [ ] Services deployed (frontend + backend + redis)
- [ ] SSL certificates generated
- [ ] Health checks passing
- [ ] Test user onboarding completed
- [ ] Monitoring & alerts configured

**You're ready for production! 🚀**

