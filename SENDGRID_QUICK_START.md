# ⚡ SendGrid Quick Start - 5 Minutes

## 🎯 Configure Supabase SMTP (2 minutes)

1. Go to: https://supabase.com/dashboard
2. Select: **oinxzvqszingwstrbdro** (FloWorx)
3. Click: **Settings** → **Authentication**
4. Scroll to: **SMTP Settings**
5. Configure:

```
✅ Enable Custom SMTP: ON

Sender email: noreply@floworx-iq.com
Sender name: FloWorx-iq team

Host: smtp.sendgrid.net
Port: 465
Username: apikey
Password: YOUR_SENDGRID_API_KEY
```

6. Click **Save**

---

## 📧 Update Email Templates (2 minutes)

1. In Supabase: **Authentication** → **Email Templates**

2. **Confirm signup:**
   - Copy content from: `email-templates/verification-email-template.html`
   - Subject: `Verify your email - Welcome to FloWorx! 🎉`
   - Save

3. **Reset password:**
   - Copy content from: `email-templates/password-reset-template.html`
   - Subject: `Reset your FloWorx password 🔐`
   - Save

---

## 🧪 Test (1 minute)

### Option 1: Quick Test
```bash
node scripts/test-sendgrid.js your-email@example.com
```

### Option 2: Real User Test
1. Register a new user in your app
2. Check email inbox
3. Verify branded email arrived
4. Click verification link

---

## ✅ Success Indicators

- ✅ Test email received
- ✅ Emails from `noreply@floworx-iq.com`
- ✅ Beautiful branded design
- ✅ Links work correctly

---

## ⚠️ Important: Domain Authentication

**For production, you MUST authenticate your domain in SendGrid:**

1. Go to: https://app.sendgrid.com/settings/sender_auth
2. Click: **Authenticate Your Domain**
3. Add DNS records to your domain
4. Wait for verification (24-48 hours)

**Without domain authentication:**
- ❌ Emails may go to spam
- ❌ Lower delivery rates
- ❌ No SPF/DKIM protection

---

## 📚 Full Documentation

- **Detailed Setup:** `SENDGRID_EMAIL_SETUP.md`
- **Email Templates:** `email-templates/` folder
- **Test Script:** `scripts/test-sendgrid.js`

---

## 🆘 Troubleshooting

**"apikey authentication failed"**
→ Make sure username is literally "apikey" (not your actual key)

**Emails not sending**
→ Check SendGrid activity: https://app.sendgrid.com/email_activity

**Emails going to spam**
→ Authenticate your domain in SendGrid

---

## 📞 Support

- SendGrid Docs: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/
- FloWorx: support@floworx.com

