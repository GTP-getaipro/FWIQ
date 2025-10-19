# FloWorx Production Deployment Guide

**Date:** 2025-01-15  
**Architecture:** Multi-tier SaaS with Microservices  
**Hosting:** Hybrid (Vercel + Hostinger VPS + Supabase Cloud)

---

## 🏗️ **Architecture Overview**

### **Deployment Stack:**

| Component | Hosting | Technology | Purpose |
|-----------|---------|------------|---------|
| **Frontend** | Vercel/Netlify | React 19 + Vite | User interface, CDN delivery |
| **Backend API** | Hostinger VPS (Coolify) | Node.js + Express | Business logic, OAuth, API gateway |
| **n8n Workflows** | Hostinger VPS (Coolify) | n8n (Docker) | Email automation, AI processing |
| **Database** | Supabase Cloud | PostgreSQL + RLS | Data storage, auth, templates |
| **Edge Functions** | Supabase Cloud | Deno | Workflow deployment, serverless |
| **Cache** | Hostinger VPS (Coolify) | Redis | Performance optimization |

---

## 📋 **Deployment Checklist**

### **Phase 1: Infrastructure Setup** ✅

- [x] Hostinger VPS provisioned (srv995290.hstgr.cloud)
- [x] Coolify installed and configured
- [x] Supabase project created (ygdcxqigrfzhqvqpqhxl)
- [x] Domain purchased (floworx.com)
- [ ] DNS records configured
- [ ] SSL certificates configured

### **Phase 2: Backend Deployment** ⏳

- [ ] Backend Docker image built
- [ ] Backend deployed to Coolify
- [ ] Environment variables configured
- [ ] Health checks configured
- [ ] Redis cache deployed
- [ ] Nginx reverse proxy configured

### **Phase 3: n8n Deployment** ✅

- [x] n8n deployed to Coolify
- [x] n8n accessible at n8n.srv995290.hstgr.cloud
- [ ] n8n custom domain configured (n8n.floworx.com)
- [ ] n8n API key secured
- [ ] Workflow templates uploaded

### **Phase 4: Database & Edge Functions** ⏳

- [x] Database schema migrated
- [x] Business type templates loaded
- [x] RLS policies configured
- [ ] Edge Functions deployed
- [ ] Database backups configured

### **Phase 5: Frontend Deployment** ⏳

- [ ] Frontend built for production
- [ ] Environment variables configured
- [ ] Deployed to Vercel/Netlify
- [ ] Custom domain configured (floworx.com)
- [ ] CDN configured

### **Phase 6: External Integrations** ⏳

- [ ] Gmail OAuth configured
- [ ] Outlook OAuth configured
- [ ] OpenAI API keys configured
- [ ] Stripe webhooks configured
- [ ] DNS records verified

---

## 🚀 **Step-by-Step Deployment**

### **Step 1: Configure DNS Records**

**Add these DNS records in Hostinger DNS:**

```
Type    Name        Value                           TTL
A       @           [Vercel IP]                     3600
A       api         [Hostinger VPS IP]              3600
A       n8n         [Hostinger VPS IP]              3600
CNAME   www         floworx.com                     3600
TXT     @           [Vercel verification]           3600
```

**Get Hostinger VPS IP:**
```bash
ssh root@srv995290.hstgr.cloud
curl ifconfig.me
```

---

### **Step 2: Deploy Backend to Coolify**

**2.1. Create Dockerfile (if not exists):**

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "src/server.js"]
```

**2.2. Deploy via Coolify:**

1. **Login to Coolify:** https://coolify.srv995290.hstgr.cloud
2. **Create New Resource** → Docker Compose
3. **Configure:**
   - **Name:** floworx-backend
   - **Repository:** https://github.com/your-repo/floworx
   - **Branch:** main
   - **Build Path:** ./backend
   - **Port:** 3001
   - **Domain:** api.floworx.com

4. **Environment Variables:**
```env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://ygdcxqigrfzhqvqpqhxl.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n
N8N_BASE_URL=https://n8n.floworx.com
N8N_API_KEY=your-n8n-api-key

# Gmail OAuth
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret

# Outlook OAuth
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

# OpenAI
OPENAI_API_KEY=your-openai-key

# Redis
REDIS_URL=redis://redis:6379

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

5. **Deploy:** Click "Deploy"

---

### **Step 3: Deploy Redis Cache**

**3.1. Create Redis Service in Coolify:**

1. **Create New Resource** → Database → Redis
2. **Configure:**
   - **Name:** floworx-redis
   - **Version:** 7-alpine
   - **Port:** 6379
   - **Password:** Generate secure password

3. **Connect to Backend:**
   - Update backend env: `REDIS_URL=redis://redis:6379`

---

### **Step 4: Configure Nginx Reverse Proxy**

**4.1. Nginx Configuration (Coolify handles this automatically):**

Coolify will automatically configure Nginx for:
- SSL/TLS termination (Let's Encrypt)
- Reverse proxy to backend (port 3001)
- Reverse proxy to n8n (port 5678)

**Manual Nginx config (if needed):**

```nginx
# /etc/nginx/sites-available/floworx-backend
server {
    listen 80;
    server_name api.floworx.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.floworx.com;

    ssl_certificate /etc/letsencrypt/live/api.floworx.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.floworx.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### **Step 5: Deploy Frontend to Vercel**

**5.1. Install Vercel CLI:**

```bash
npm install -g vercel
```

**5.2. Configure Frontend Environment:**

Create `.env.production`:

```env
VITE_SUPABASE_URL=https://ygdcxqigrfzhqvqpqhxl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://api.floworx.com
VITE_GMAIL_CLIENT_ID=your-gmail-client-id
VITE_OUTLOOK_CLIENT_ID=your-outlook-client-id
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

**5.3. Deploy:**

```bash
cd C:\FWIQv2
vercel --prod
```

**5.4. Configure Custom Domain:**

1. Go to Vercel Dashboard → Settings → Domains
2. Add domain: `floworx.com`
3. Add domain: `www.floworx.com`
4. Vercel will provide DNS records to add

---

### **Step 6: Deploy Supabase Edge Functions**

**6.1. Install Supabase CLI:**

```bash
npm install -g supabase
```

**6.2. Login and Deploy:**

```bash
supabase login
supabase functions deploy deploy-n8n --project-ref ygdcxqigrfzhqvqpqhxl
```

**6.3. Set Edge Function Secrets:**

```bash
supabase secrets set --project-ref ygdcxqigrfzhqvqpqhxl \
  N8N_BASE_URL=https://n8n.floworx.com \
  N8N_API_KEY=your-n8n-api-key \
  OPENAI_KEY_1=your-openai-key-1 \
  OPENAI_KEY_2=your-openai-key-2 \
  OPENAI_KEY_3=your-openai-key-3 \
  OPENAI_KEY_4=your-openai-key-4 \
  OPENAI_KEY_5=your-openai-key-5 \
  GMAIL_CLIENT_ID=your-gmail-client-id \
  GMAIL_CLIENT_SECRET=your-gmail-client-secret
```

---

## 🔒 **Security Checklist**

- [ ] All API keys stored in environment variables (not in code)
- [ ] Supabase RLS policies enabled
- [ ] HTTPS/SSL configured for all domains
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Database backups configured
- [ ] Secrets rotation policy established
- [ ] Firewall rules configured on VPS
- [ ] n8n authentication enabled
- [ ] Webhook signature verification enabled (Stripe)

---

## 📊 **Monitoring & Logging**

### **Backend Monitoring:**
- Coolify built-in monitoring
- Health check endpoint: `https://api.floworx.com/health`

### **n8n Monitoring:**
- n8n built-in execution logs
- Webhook: `https://n8n.floworx.com/webhook/health`

### **Database Monitoring:**
- Supabase Dashboard → Database → Performance

### **Frontend Monitoring:**
- Vercel Analytics
- Vercel Logs

---

## 🧪 **Testing Deployment**

### **Test Backend:**
```bash
curl https://api.floworx.com/health
# Expected: {"status":"ok","timestamp":"..."}
```

### **Test n8n:**
```bash
curl https://n8n.floworx.com/healthz
# Expected: {"status":"ok"}
```

### **Test Frontend:**
```bash
curl https://floworx.com
# Expected: HTML response
```

### **Test Database:**
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) FROM business_type_templates WHERE is_active = true;
-- Expected: 12
```

---

## 🚀 **Go Live Checklist**

- [ ] All services deployed and healthy
- [ ] DNS propagated (check with `nslookup floworx.com`)
- [ ] SSL certificates valid
- [ ] Environment variables verified
- [ ] Database migrations applied
- [ ] Business templates loaded
- [ ] Test user account created
- [ ] End-to-end workflow tested
- [ ] Monitoring configured
- [ ] Backups configured
- [ ] Documentation updated

---

**Ready to deploy!** 🎉

