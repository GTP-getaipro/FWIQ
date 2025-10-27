# 🚀 Quick Setup: FloWorx Branded Email Templates

## ⚡ 5-Minute Setup

### **Step 1: Access Supabase** (30 seconds)
1. Go to: https://supabase.com/dashboard
2. Select project: **oinxzvqszingwstrbdro** (FloWorx)
3. Click: **Authentication** → **Email Templates**

---

### **Step 2: Copy & Paste Templates** (2 minutes)

#### **📧 Confirm Signup Template:**
1. Click **"Confirm signup"**
2. Open: `verification-email-template.html`
3. Copy ALL the HTML code
4. Paste into Supabase template editor
5. Update Subject to: `Verify your email - Welcome to FloWorx! 🎉`
6. Click **Save**

#### **🔐 Reset Password Template:**
1. Click **"Reset password"**
2. Open: `password-reset-template.html`
3. Copy ALL the HTML code
4. Paste into Supabase template editor
5. Update Subject to: `Reset your FloWorx password 🔐`
6. Click **Save**

#### **🔑 Magic Link Template:**
1. Click **"Magic Link"**
2. Open: `magic-link-template.html`
3. Copy ALL the HTML code
4. Paste into Supabase template editor
5. Update Subject to: `Your secure login link for FloWorx ✨`
6. Click **Save**

---

### **Step 3: Configure Email Settings** (1 minute)

1. In Supabase: **Authentication** → **Settings** → **Email Auth**
2. Update these fields:

```
Site URL: https://app.floworx-iq.com

Redirect URLs (add these):
- https://app.floworx-iq.com/login
- https://app.floworx-iq.com/
- http://localhost:5173/login
- http://localhost:5173/
```

3. Click **Save**

---

### **Step 4: Test** (1 minute)

1. Register a new test user in your app
2. Check your email inbox
3. Verify the branded email template appears
4. Click the verification button
5. ✅ Done!

---

## 📸 What You'll See

### Before:
```
Subject: Confirm your signup

Confirm your signup
Follow this link to confirm your user:
[Confirm your mail]
```

### After:
```
Subject: Verify your email - Welcome to FloWorx! 🎉

[Beautiful branded email with:]
- FloWorx logo with blue gradient header
- Professional typography
- Clear "Verify My Email Address" button
- Security notice
- Alternative text link
- Branded footer with support links
```

---

## ✅ Success Checklist

- [ ] Email verification template updated
- [ ] Password reset template updated
- [ ] Magic link template updated (optional)
- [ ] Site URL configured
- [ ] Redirect URLs added
- [ ] Test email sent and received
- [ ] Email displays correctly on mobile
- [ ] Links work correctly

---

## 🔧 Troubleshooting

**Template not updating?**
- Clear cache and try in incognito mode
- Wait 1-2 minutes after saving
- Send a new test email

**Emails going to spam?**
- Check your spam folder first
- Configure SPF/DKIM records (advanced)
- Use a custom domain email

**Links not working?**
- Verify redirect URLs are correct
- Make sure `{{ .ConfirmationURL }}` is intact
- Check Site URL matches your domain

---

## 📞 Need Help?

1. Check: `SUPABASE_EMAIL_TEMPLATE_SETUP.md` (detailed guide)
2. Supabase Docs: https://supabase.com/docs/guides/auth/auth-email-templates
3. Contact: support@floworx.com

---

## 🎨 Customization (Optional)

Want to change colors or add your logo?

**Colors:** Search for `#2563eb` and `#1d4ed8` in templates and replace with your brand colors

**Logo:** Replace this line in the header:
```html
<h1 class="logo">FloWorx</h1>
```

With:
```html
<img src="YOUR_LOGO_URL" alt="FloWorx" style="height: 40px;" />
```

---

## 🚀 Next Steps

After templates are working:
1. Test on different devices (mobile, desktop)
2. Test in different email clients (Gmail, Outlook)
3. Monitor email deliverability
4. Set up custom SMTP (optional, for better deliverability)

