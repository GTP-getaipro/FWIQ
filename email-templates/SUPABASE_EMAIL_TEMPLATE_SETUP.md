# 📧 FloWorx Branded Email Templates - Setup Guide

## 🎨 Overview

Professional, branded email templates for all FloWorx authentication emails:
- ✅ **Email Verification** (Signup confirmation)
- 🔐 **Password Reset**
- 🔑 **Magic Link** (Passwordless login)
- 📬 **Email Change Confirmation**

All templates feature:
- FloWorx branding with blue gradient theme
- Mobile-responsive design
- Clear call-to-action buttons
- Security warnings where appropriate
- Alternative text links (for email clients that don't support buttons)

---

## 🚀 How to Configure in Supabase

### **Step 1: Access Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your project: **FloWorx** (Project ID: `oinxzvqszingwstrbdro`)
3. Navigate to: **Authentication** → **Email Templates**

---

### **Step 2: Configure Each Template**

#### **📧 Confirm Signup Template**

1. Click on **"Confirm signup"** in the list
2. Replace the default template with the content from `verification-email-template.html`
3. Make sure to keep the `{{ .ConfirmationURL }}` variable intact
4. Click **Save**

**Subject Line:**
```
Verify your email - Welcome to FloWorx! 🎉
```

---

#### **🔐 Reset Password Template**

1. Click on **"Reset password"** in the list
2. Replace with content from `password-reset-template.html`
3. Keep the `{{ .ConfirmationURL }}` variable
4. Click **Save**

**Subject Line:**
```
Reset your FloWorx password 🔐
```

---

#### **🔑 Magic Link Template**

1. Click on **"Magic Link"** in the list
2. Use a variation of the verification template (modify the header text)
3. Keep the `{{ .ConfirmationURL }}` variable
4. Click **Save**

**Subject Line:**
```
Your secure login link for FloWorx ✨
```

---

#### **📬 Change Email Address Template**

1. Click on **"Change Email Address"** in the list
2. Use a variation of the verification template
3. Keep the `{{ .ConfirmationURL }}` variable
4. Click **Save**

**Subject Line:**
```
Confirm your new email address - FloWorx
```

---

## 🎯 Template Variables

Supabase provides these variables you can use in your templates:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | The action link (verify, reset, etc.) | `https://app.floworx-iq.com/...` |
| `{{ .Token }}` | OTP token (if using OTP instead of links) | `123456` |
| `{{ .TokenHash }}` | Hashed version of the token | `abc123...` |
| `{{ .SiteURL }}` | Your configured site URL | `https://app.floworx-iq.com` |
| `{{ .Email }}` | User's email address | `user@example.com` |

---

## ⚙️ Template Configuration

### **Email Settings to Configure:**

1. **Navigate to:** Authentication → Email Templates → Settings

2. **Configure these fields:**

```
Site URL: https://app.floworx-iq.com
Redirect URLs:
  - https://app.floworx-iq.com/login
  - https://app.floworx-iq.com/
  - http://localhost:5173/login
  - http://localhost:5173/
```

3. **Email Rate Limits:**
```
Rate limiting: Enabled
Max emails per hour: 4 (to prevent spam)
```

4. **SMTP Settings (if using custom SMTP):**
```
From Email: noreply@floworx.com
From Name: FloWorx
Reply-To: support@floworx.com
```

---

## 🧪 Testing Your Templates

### **Test Email Verification:**

1. Register a new test user in your app
2. Check the email inbox
3. Verify the email looks branded and professional
4. Click the verification button
5. Ensure it redirects correctly

### **Test Password Reset:**

1. Go to your app's "Forgot Password" page
2. Enter an email address
3. Check the inbox
4. Verify the email design
5. Click the reset button
6. Ensure it works correctly

---

## 🎨 Customization Options

### **Colors:**

Current blue theme:
```css
Primary Blue: #2563eb
Dark Blue: #1d4ed8
```

To change to a different color scheme, update these values in the templates:
- `background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);`
- `.verify-button` background
- Border colors in info/warning boxes

### **Logo:**

Current: Text-based "FloWorx" logo

To add an image logo:
```html
<img src="https://your-cdn.com/logo.png" alt="FloWorx" style="height: 40px; width: auto;" />
```

Replace the text logo in the header section.

---

## 📱 Mobile Responsiveness

All templates are mobile-responsive with:
- Flexible layouts
- Touch-friendly buttons (min 44px tap target)
- Readable font sizes on small screens
- Proper viewport meta tag

Test on:
- iPhone (Safari)
- Android (Gmail app)
- Desktop (Outlook, Gmail, Apple Mail)

---

## ✅ Checklist

Before going live:

- [ ] All 4 email templates configured in Supabase
- [ ] Subject lines updated
- [ ] Test email verification flow
- [ ] Test password reset flow  
- [ ] Test on mobile devices
- [ ] Test on different email clients (Gmail, Outlook, Apple Mail)
- [ ] Verify all links work correctly
- [ ] Check spam folder (shouldn't land there)
- [ ] Update SMTP settings (if using custom domain)
- [ ] Configure SPF, DKIM, DMARC records (for better deliverability)

---

## 🔧 Troubleshooting

### **Emails not sending?**
- Check Supabase email logs: Dashboard → Logs → Select "Auth"
- Verify SMTP settings if using custom SMTP
- Check rate limits

### **Emails going to spam?**
- Configure SPF/DKIM/DMARC records
- Use a custom domain email (not Gmail/Outlook)
- Warm up your sending domain gradually

### **Links not working?**
- Verify redirect URLs are configured correctly
- Check that Site URL matches your domain
- Ensure `{{ .ConfirmationURL }}` variable is intact

### **Template not updating?**
- Clear browser cache
- Try in incognito mode
- Wait 1-2 minutes after saving (Supabase caching)
- Send a test email to verify

---

## 📞 Support

Need help with email templates?

- **Supabase Docs:** https://supabase.com/docs/guides/auth/auth-email-templates
- **FloWorx Support:** support@floworx.com
- **Supabase Discord:** https://discord.supabase.com

---

## 🎉 What's Next?

After setting up templates:

1. Configure redirect URLs in Supabase
2. Test the entire authentication flow
3. Monitor email deliverability
4. Collect user feedback on email experience
5. Consider adding:
   - Welcome email series
   - Onboarding tips emails
   - Feature announcement emails

---

## 📊 Email Best Practices

✅ **Do:**
- Keep subject lines under 50 characters
- Use clear, action-oriented CTAs
- Include both button and text links
- Show security warnings for sensitive actions
- Brand consistently across all emails
- Test on multiple email clients

❌ **Don't:**
- Use generic subject lines
- Overcomplicate the design
- Forget mobile users
- Send too many emails (respect rate limits)
- Use suspicious-looking links
- Ignore accessibility (alt text, semantic HTML)

---

## 🔒 Security Considerations

- ✅ Links expire after set time (24h for verification, 1h for reset)
- ✅ Warn users about suspicious activity
- ✅ Never include passwords or sensitive data
- ✅ Use HTTPS for all links
- ✅ Implement rate limiting
- ✅ Log all email sends for audit trail

