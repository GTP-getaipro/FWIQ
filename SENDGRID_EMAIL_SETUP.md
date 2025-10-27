# 📧 SendGrid Email Configuration - FloWorx

## 🎯 Overview

Configure FloWorx to send all authentication and transactional emails through SendGrid for reliable delivery.

---

## ⚙️ Your SendGrid Credentials

```env
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@floworx-iq.com
SENDGRID_FROM_NAME=FloWorx-iq team
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key_here
```

---

## 🚀 Setup Steps

### **Step 1: Configure Supabase to Use SendGrid**

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select project: **oinxzvqszingwstrbdro** (FloWorx)

2. **Navigate to Project Settings:**
   - Click **Settings** (gear icon in sidebar)
   - Click **Authentication**
   - Scroll to **SMTP Settings**

3. **Configure SMTP Settings:**
   ```
   Enable Custom SMTP: ✅ ON
   
   Sender email: noreply@floworx-iq.com
   Sender name: FloWorx-iq team
   
   Host: smtp.sendgrid.net
   Port: 465
   Username: apikey
   Password: SG.your_sendgrid_api_key_here
   ```

4. **Click "Save"**

---

### **Step 2: Verify Domain in SendGrid (CRITICAL)**

⚠️ **This step is required for production email delivery!**

1. **Go to SendGrid Dashboard:**
   - https://app.sendgrid.com/
   - Navigate to: **Settings** → **Sender Authentication**

2. **Authenticate Domain:**
   - Click **"Authenticate Your Domain"**
   - Select your DNS host provider
   - Enter domain: `floworx-iq.com`
   - Follow instructions to add DNS records

3. **DNS Records to Add:**
   SendGrid will provide specific records. They'll look like:

   ```
   Type: CNAME
   Host: s1._domainkey
   Value: s1.domainkey.u12345678.wl123.sendgrid.net

   Type: CNAME  
   Host: s2._domainkey
   Value: s2.domainkey.u12345678.wl123.sendgrid.net

   Type: CNAME
   Host: em1234
   Value: u12345678.wl123.sendgrid.net
   ```

4. **Verify DNS Records:**
   - After adding records, click **"Verify"** in SendGrid
   - DNS propagation can take 24-48 hours
   - You'll receive an email when verification is complete

---

### **Step 3: Configure Backend Environment Variables**

Create/update `.env.production` in your backend:

```env
# Node Environment
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.floworx-iq.com

# Supabase Configuration
SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# SendGrid Configuration
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@floworx-iq.com
SENDGRID_FROM_NAME=FloWorx-iq team

# SMTP Configuration (for nodemailer)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key_here
SMTP_SENDER=noreply@floworx-iq.com

# Session & Security
SESSION_SECRET=FloworxSecureSession2024RandomKey789XYZ123ABC456DEF

# Monitoring
SENTRY_DSN=https://1935358f905dfdf1ee61f7b0ee6f4924@o4509979625455616.ingest.us.sentry.io/4509979725660160

# N8N Integration
N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=your_n8n_api_key_here
VITE_N8N_API_KEY=your_n8n_api_key_here

# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key

# Logging
LOG_LEVEL=info

# Redis
REDIS_URL=redis://redis:6379
```

---

### **Step 4: Configure Coolify Environment Variables**

If deploying via Coolify:

1. Go to Coolify Dashboard
2. Select your FloWorx application
3. Go to **Environment Variables**
4. Add these variables:

```
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@floworx-iq.com
SENDGRID_FROM_NAME=FloWorx-iq team
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_api_key_here
SMTP_SENDER=noreply@floworx-iq.com
SESSION_SECRET=FloworxSecureSession2024RandomKey789XYZ123ABC456DEF
SENTRY_DSN=https://1935358f905dfdf1ee61f7b0ee6f4924@o4509979625455616.ingest.us.sentry.io/4509979725660160
```

5. Click **Save**
6. **Redeploy** the application

---

## 🧪 Testing Email Delivery

### **Test 1: Send Test Email from SendGrid**

1. Go to SendGrid Dashboard
2. Navigate to: **Email API** → **Integration Guide**
3. Select **SMTP Relay**
4. Click **"Send a Test Email"**
5. Check your inbox

### **Test 2: Test Authentication Emails**

1. **Register a new test user** in your app
2. Check email inbox for verification email
3. Verify it:
   - Comes from `noreply@floworx-iq.com`
   - Has your branded template
   - Links work correctly

### **Test 3: Test Password Reset**

1. Go to "Forgot Password"
2. Enter email address
3. Check inbox for reset email
4. Verify branding and functionality

---

## 📊 Monitor Email Delivery

### **SendGrid Dashboard:**

1. **Activity Feed:**
   - https://app.sendgrid.com/email_activity
   - View all sent emails in real-time

2. **Statistics:**
   - https://app.sendgrid.com/statistics
   - Track delivery rates, opens, clicks

3. **Suppressions:**
   - https://app.sendgrid.com/suppressions
   - View bounces, spam reports, unsubscribes

---

## 🔧 Troubleshooting

### **Emails Not Sending?**

**Check 1: Verify API Key**
```bash
curl -i --request GET \
  --url https://api.sendgrid.com/v3/user/account \
  --header "Authorization: Bearer YOUR_SENDGRID_API_KEY"
```

**Check 2: View SendGrid Activity**
- Go to: https://app.sendgrid.com/email_activity
- Filter by date and sender email
- Check for errors

**Check 3: Verify Domain Authentication**
- Go to: https://app.sendgrid.com/settings/sender_auth
- Ensure domain shows "Verified" status

**Check 4: Check Supabase Logs**
- Go to Supabase Dashboard
- Navigate to: **Logs** → **Auth Logs**
- Look for email send errors

---

### **Emails Going to Spam?**

✅ **Solutions:**

1. **Complete Domain Authentication** (required)
   - Add all DNS records SendGrid provides
   - Wait for verification

2. **Configure SPF Record:**
   ```
   Type: TXT
   Host: @
   Value: v=spf1 include:sendgrid.net ~all
   ```

3. **Configure DMARC Record:**
   ```
   Type: TXT
   Host: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:postmaster@floworx-iq.com
   ```

4. **Warm Up Your Domain:**
   - Start with low email volume
   - Gradually increase over 2-3 weeks

---

### **"apikey" Authentication Failed?**

Make sure you're using **exactly** this:
```
Username: apikey
Password: YOUR_SENDGRID_API_KEY
```

Note: Username is literally "apikey", not your actual key!

---

## 🔒 Security Best Practices

✅ **Do:**
- Rotate API keys every 90 days
- Use different keys for dev/staging/prod
- Monitor SendGrid activity for suspicious sends
- Set up IP access management
- Enable 2FA on SendGrid account

❌ **Don't:**
- Commit API keys to git
- Share keys via email/Slack
- Use same key across environments
- Ignore bounce/spam reports

---

## 📈 Email Deliverability Tips

1. **Keep Clean Lists:**
   - Remove bounced emails
   - Honor unsubscribes
   - Don't buy email lists

2. **Monitor Metrics:**
   - Aim for >95% delivery rate
   - Keep bounce rate <5%
   - Keep spam rate <0.1%

3. **Content Best Practices:**
   - Avoid spam trigger words
   - Balance text/image ratio
   - Include unsubscribe link
   - Use proper HTML structure

4. **Sending Reputation:**
   - Start slow and ramp up
   - Maintain consistent volume
   - Respond to abuse reports
   - Monitor blacklists

---

## ✅ Setup Checklist

**Supabase Configuration:**
- [ ] SMTP settings configured in Supabase
- [ ] Email templates updated (verification, reset, etc.)
- [ ] Site URL and redirect URLs configured
- [ ] Test email sent successfully

**SendGrid Configuration:**
- [ ] Domain authenticated in SendGrid
- [ ] DNS records added and verified
- [ ] SPF record configured
- [ ] DKIM records configured
- [ ] DMARC policy set

**Application Configuration:**
- [ ] Environment variables set in Coolify/backend
- [ ] Application redeployed with new settings
- [ ] Backend nodemailer configured for SendGrid
- [ ] Error monitoring (Sentry) configured

**Testing:**
- [ ] Registration email works
- [ ] Password reset email works
- [ ] Emails not going to spam
- [ ] Email branding looks correct
- [ ] Links in emails work
- [ ] Mobile display is correct

---

## 📞 Support

**SendGrid Support:**
- Docs: https://docs.sendgrid.com/
- Support: https://support.sendgrid.com/
- Status: https://status.sendgrid.com/

**FloWorx Support:**
- Email: support@floworx.com

---

## 🚀 Next Steps

After SendGrid is configured:

1. ✅ Monitor first 24 hours of sends closely
2. ✅ Set up alerts for bounce rate > 5%
3. ✅ Configure dedicated IP (if sending >50k emails/month)
4. ✅ Set up email analytics tracking
5. ✅ Create email templates for other transactional emails
6. ✅ Document email sending procedures for team

