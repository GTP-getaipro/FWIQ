# 🚀 Deploy to Coolify - FloWorx

## 📋 What's Being Deployed

**Changes on SignUpApp branch:**
1. ✅ Fixed email verification redirect with user-friendly error page
2. ✅ Added SendGrid email configuration
3. ✅ Professional branded email templates
4. ✅ Resend verification email functionality

---

## 🎯 Option 1: Quick Deploy (Update Coolify Branch) - RECOMMENDED

### **Step 1: Change Coolify to Watch SignUpApp Branch**

1. Go to: https://coolify.srv995290.hstgr.cloud
2. Click on your **FloWorx** application
3. Go to: **Settings** → **General** → **Git**
4. Change:
   ```
   Branch: master  →  SignUpApp
   ```
5. Click **Save**

### **Step 2: Deploy**

1. Click **Redeploy** button in Coolify
2. Wait 5-10 minutes for build
3. ✅ Done!

---

## 🎯 Option 2: Merge to Master & Deploy

### **Step 1: Merge SignUpApp to Master**

```powershell
cd c:\FloWorx-Production

# Switch to master
git checkout master

# Pull latest
git pull origin master

# Merge SignUpApp
git merge SignUpApp

# Push to master
git push origin master
```

### **Step 2: Coolify Auto-Deploys**

- If you have webhooks configured, Coolify will auto-deploy
- Or click **Redeploy** in Coolify dashboard

---

## ⚙️ Configure Environment Variables in Coolify

**IMPORTANT:** Add these to Coolify before deploying:

### **Navigate to Environment Variables:**
1. Coolify Dashboard → Your Application
2. Click **Environment Variables**
3. Add these:

### **Required Variables:**

```env
# Node Environment
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.floworx-iq.com

# Supabase
SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# SendGrid (NEW - Get from .sendgrid-credentials.txt)
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
SENDGRID_FROM_EMAIL=noreply@floworx-iq.com
SENDGRID_FROM_NAME=FloWorx-iq team
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
SMTP_SENDER=noreply@floworx-iq.com

# Session & Monitoring
SESSION_SECRET=FloworxSecureSession2024RandomKey789XYZ123ABC456DEF
SENTRY_DSN=https://1935358f905dfdf1ee61f7b0ee6f4924@o4509979625455616.ingest.us.sentry.io/4509979725660160

# N8N Integration
N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=your_n8n_api_key

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# AI
OPENAI_API_KEY=your_openai_api_key

# Redis
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=info
```

---

## 🔍 Monitor Deployment

### **View Build Logs:**

1. In Coolify Dashboard
2. Click on your application
3. Go to **Deployments** tab
4. Click on latest deployment
5. Watch real-time logs

### **Common Issues:**

**Issue: Container fails to start**
- Check environment variables are set
- Verify all required secrets are present
- Check Docker logs in Coolify

**Issue: Build fails**
- Check build logs for errors
- Verify Dockerfile is correct
- Ensure all dependencies in package.json

**Issue: Application not responding**
- Check health endpoint: `https://your-domain.com/health`
- Verify ports are correctly mapped
- Check application logs

---

## ✅ Post-Deployment Checklist

After deployment succeeds:

### **1. Configure Supabase (CRITICAL):**

- [ ] Go to: https://supabase.com/dashboard
- [ ] Select: **oinxzvqszingwstrbdro**
- [ ] Configure SMTP Settings (SendGrid)
- [ ] Update Email Templates (branded templates)
- [ ] Add Redirect URLs:
  ```
  https://app.floworx-iq.com/login
  https://app.floworx-iq.com/
  ```
- [ ] Set Site URL: `https://app.floworx-iq.com`

### **2. Test Email Verification Flow:**

- [ ] Register a new test user
- [ ] Check email arrives from SendGrid
- [ ] Verify branded template appears
- [ ] Click verification link
- [ ] Should redirect to `/login`

### **3. Test Expired Link Handling:**

- [ ] Go to: `https://app.floworx-iq.com/#error=access_denied&error_code=otp_expired`
- [ ] Should see error page with resend button
- [ ] Click "Resend Verification Email"
- [ ] Enter email and verify it works

### **4. Verify Domain in SendGrid:**

- [ ] Go to: https://app.sendgrid.com/settings/sender_auth
- [ ] Click "Authenticate Your Domain"
- [ ] Add DNS records for `floworx-iq.com`
- [ ] Wait for verification

### **5. Monitor Email Delivery:**

- [ ] Check SendGrid Activity: https://app.sendgrid.com/email_activity
- [ ] Verify emails are sending
- [ ] Check delivery rates
- [ ] Ensure not going to spam

---

## 🧪 Testing Endpoints

After deployment:

```bash
# Test health endpoint
curl https://app.floworx-iq.com/health

# Test API
curl https://app.floworx-iq.com/api/health

# Test frontend
curl https://app.floworx-iq.com/

# Expected: All should return 200 OK
```

---

## 🔧 Rollback (If Needed)

If something goes wrong:

### **Quick Rollback:**

1. In Coolify Dashboard
2. Go to **Deployments**
3. Find previous working deployment
4. Click **Redeploy** on that version

### **Or via Git:**

```powershell
cd c:\FloWorx-Production
git checkout master
git revert HEAD
git push origin master
```

Then redeploy in Coolify.

---

## 📊 Expected Deployment Timeline

- ⏱️ **Build Time:** 5-8 minutes
- ⏱️ **Container Start:** 30-60 seconds
- ⏱️ **Health Check:** 30 seconds
- ⏱️ **DNS Propagation:** Instant (using existing domain)
- ⏱️ **Total:** ~10 minutes

---

## 🆘 Troubleshooting

### **Deployment Stuck?**

```bash
# SSH into your Coolify server
ssh root@srv995290.hstgr.cloud

# Check running containers
docker ps

# Check logs
docker logs <container_id>

# Restart Docker if needed
systemctl restart docker

# Retry deployment in Coolify UI
```

### **Still Having Issues?**

Check these files for detailed troubleshooting:
- `COOLIFY_DEPLOYMENT_FIX_STEPS.md`
- `COOLIFY_REBUILD_CHECKLIST.md`

---

## 📞 Quick Commands

```powershell
# Check what branch you're on
git branch --show-current

# View commit history
git log --oneline -5

# Check git status
git status

# Pull latest from remote
git pull origin SignUpApp

# View environment variables (local)
Get-Content .sendgrid-credentials.txt
```

---

## ✨ What Happens After Successful Deploy

1. ✅ Frontend accessible at: `https://app.floworx-iq.com`
2. ✅ Backend API at: `https://app.floworx-iq.com/api`
3. ✅ Email verification with branded templates
4. ✅ Expired link handling with resend functionality
5. ✅ All emails sent via SendGrid
6. ✅ Professional email experience for users

---

## 🚀 Deploy Now!

Choose your option:
- **Option 1** (Recommended): Change Coolify to watch `SignUpApp` branch
- **Option 2**: Merge to `master` first

Then click **Redeploy** in Coolify! 🎉

