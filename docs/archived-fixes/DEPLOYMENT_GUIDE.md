# 🚀 FloWorx Deployment Guide

**Version**: 2.0  
**Last Updated**: October 14, 2025  
**Status**: ✅ **PRODUCTION READY**

---

## 📋 **Quick Start**

### **1. Install Dependencies**
```bash
cd C:\FWIQv2
npm install

cd backend
npm install
```

### **2. Configure Environment Variables**

Create `.env` in project root:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OAuth Configuration
VITE_GMAIL_CLIENT_ID=your-google-client-id
VITE_GMAIL_CLIENT_SECRET=your-google-client-secret
VITE_OUTLOOK_CLIENT_ID=your-microsoft-client-id
VITE_OUTLOOK_CLIENT_SECRET=your-microsoft-client-secret

# n8n Configuration
N8N_API_URL=https://n8n.srv995290.hstgr.cloud/api/v1
N8N_API_KEY=your-n8n-api-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

Create `.env` in `backend/` directory:
```env
# Same as above, backend needs these too
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_API_URL=https://n8n.srv995290.hstgr.cloud/api/v1
N8N_API_KEY=your-n8n-api-key
VITE_GMAIL_CLIENT_ID=your-google-client-id
VITE_GMAIL_CLIENT_SECRET=your-google-client-secret
VITE_OUTLOOK_CLIENT_ID=your-microsoft-client-id
VITE_OUTLOOK_CLIENT_SECRET=your-microsoft-client-secret
OPENAI_API_KEY=your-openai-api-key
```

### **3. Deploy Edge Function**
```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Deploy the Edge Function
npx supabase functions deploy deploy-n8n
```

### **4. Start the Application**
```bash
cd C:\FWIQv2
npm start
```

This will start:
- ✅ **Frontend** on http://localhost:5173 (cyan output)
- ✅ **Backend** on http://localhost:3001 (magenta output)

---

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                        │
│              http://localhost:5173                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│               REACT FRONTEND (Vite)                      │
│                   Port: 5173                             │
│  - Onboarding Wizard                                    │
│  - Dashboard                                            │
│  - OAuth Flow                                           │
└────────┬──────────────────────┬─────────────────────────┘
         │                      │
         │                      ↓
         │            ┌─────────────────────┐
         │            │  BACKEND API        │
         │            │  (Express.js)       │
         │            │  Port: 3001         │
         │            │  - OAuth Exchange   │
         │            │  - Token Refresh    │
         │            │  - Voice Analysis   │
         │            └──────────┬──────────┘
         │                       │
         ↓                       ↓
┌─────────────────────────────────────────────────────────┐
│            SUPABASE (Cloud Database)                     │
│  - Authentication (Row-Level Security)                  │
│  - Database (PostgreSQL)                                │
│  - Edge Functions (Deno)                                │
│    └─ deploy-n8n (n8n workflow deployment)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 N8N INSTANCE                             │
│         https://n8n.srv995290.hstgr.cloud               │
│  - Client Workflows (isolated per client)               │
│  - OAuth Credentials (one per client)                   │
│  - Shared OpenAI Credential                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 **Supported Business Types**

The application now supports **12 business types** with industry-specific schemas:

1. ✅ **Hot tub & Spa** - Hot tub services, water care, installation
2. ✅ **Pools & Spas** - Pool maintenance, repairs, seasonal services
3. ✅ **HVAC** - Heating, cooling, maintenance, emergency repairs
4. ✅ **Electrician** - Electrical repairs, panel upgrades, EV chargers
5. ✅ **Plumber** - Plumbing repairs, water heaters, drain cleaning
6. ✅ **Roofing** - Roof installations, repairs, inspections, insurance claims
7. ✅ **Landscaping** - Lawn care, tree services, hardscaping, irrigation
8. ✅ **Painting** - Interior/exterior painting, surface prep, color consultation
9. ✅ **Flooring** - Hardwood, tile, carpet, vinyl installation and refinishing
10. ✅ **General Construction** - Renovations, additions, remodeling, permits
11. ✅ **Insulation & Foam Spray** - Insulation installation, energy efficiency
12. ✅ **General** - Fallback for other business types

Each business type includes:
- ✅ Industry-specific label categories
- ✅ Pre-loaded supplier names
- ✅ 15 predefined services
- ✅ Custom urgent keywords
- ✅ Business-specific AI prompts

---

## 🎯 **Key Features**

### **Multi-Tenant Architecture**
- ✅ **Shared n8n Instance**: 100s of clients on one n8n server
- ✅ **Isolated Credentials**: Each client has unique OAuth credentials
- ✅ **Database Isolation**: Row-Level Security (RLS) prevents data leakage
- ✅ **Independent Workflows**: Each client has their own n8n workflow

### **Intelligent Label Provisioning**
- ✅ **Hierarchical Labels**: 3-level nested labels (Parent/Sub/Nested)
- ✅ **Color Consistency**: Sub-labels inherit parent colors
- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Full Recovery**: Recreates deleted labels automatically
- ✅ **Dynamic Values**: Injects manager and supplier names

### **AI-Powered Email Processing**
- ✅ **Voice Training**: Learns from client's sent emails
- ✅ **Multi-Level Classification**: Primary, secondary, tertiary categories
- ✅ **Auto-Reply Detection**: AI determines if it can safely respond
- ✅ **Service Catalog Integration**: References pricing and services
- ✅ **Business-Specific Prompts**: Each business type has custom AI behavior

### **3-Layer Schema System**
- ✅ **Layer 1**: Universal base schema (consistent across all businesses)
- ✅ **Layer 2**: Business-specific extensions (industry customization)
- ✅ **Layer 3**: Dynamic injection (client managers/suppliers)

---

## 🔐 **Security Features**

### **Multi-Tenant Isolation**
- ✅ **Row-Level Security (RLS)**: Database-level data isolation
- ✅ **OAuth Credential Isolation**: Each client uses their own tokens
- ✅ **Workflow Isolation**: Workflows can't access other clients' data
- ✅ **User ID Injection**: All database operations scoped to user

### **Data Protection**
- ✅ **PII Protection**: Sensitive data sanitized
- ✅ **Token Encryption**: OAuth tokens encrypted at rest
- ✅ **Audit Logging**: Complete audit trail
- ✅ **Error Sanitization**: No sensitive data in error messages

---

## 📦 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge Function deployed
- [ ] n8n instance accessible
- [ ] OpenAI API key valid

### **Deployment Steps**

**1. Database Setup**
```bash
# Run all migrations
cd C:\FWIQv2\supabase
npx supabase db push
```

**2. Deploy Edge Function**
```bash
cd C:\FWIQv2
npx supabase functions deploy deploy-n8n
```

**3. Start Application**
```bash
npm start
```

**4. Verify Deployment**
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend responds at http://localhost:3001
- [ ] OAuth flow works (test with Gmail/Outlook)
- [ ] Label provisioning works (check Gmail labels)
- [ ] n8n workflow deploys successfully
- [ ] AI classification works

---

## 🧪 **Testing Guide**

### **Test Scenario 1: New Client Onboarding (Hot Tub & Spa)**

**Steps**:
1. Navigate to http://localhost:5173
2. Register new account
3. Complete Step 1: Email Integration (Gmail)
4. Complete Step 2: Business Type (Hot tub & Spa)
5. Complete Step 3: Team Setup (Add manager: "Hailey")
6. Complete Step 4: Business Information (Add services)
7. Complete Step 5: Deploy Workflow

**Expected Results**:
- ✅ Gmail labels created (50+ labels)
- ✅ Labels organized hierarchically
- ✅ All labels have correct colors
- ✅ Manager name appears in MANAGER label
- ✅ n8n workflow deployed
- ✅ Workflow appears in n8n dashboard
- ✅ Credential created: `gmail-[business-name]-[user-id]`

### **Test Scenario 2: Label Recovery (Deleted Labels)**

**Steps**:
1. Manually delete some Gmail labels
2. Navigate to Settings → Integrations
3. Click "Re-provision Labels" (or redeploy workflow)

**Expected Results**:
- ✅ Deleted labels recreated
- ✅ Existing labels unchanged
- ✅ Hierarchy restored
- ✅ Colors match original

### **Test Scenario 3: Multiple Clients (Multi-Tenant)**

**Steps**:
1. Onboard Client A (Hot tub & Spa)
2. Onboard Client B (HVAC)
3. Onboard Client C (Electrician)

**Expected Results**:
- ✅ 3 separate workflows in n8n
- ✅ 3 separate Gmail credentials
- ✅ Each client sees only their own data
- ✅ Workflows run independently
- ✅ No data leakage between clients

---

## 🐛 **Troubleshooting**

### **Issue: OAuth Exchange Fails**
**Error**: `POST http://localhost:3001/api/oauth/exchange-token net::ERR_CONNECTION_REFUSED`

**Solution**:
```bash
# Make sure backend is running
npm run dev:backend

# Or start both together
npm start
```

### **Issue: Provider Not Found**
**Error**: `No active gmail integration found`

**Solution**:
- ✅ System now handles both `'gmail'` and `'google'`
- ✅ System now handles both `'outlook'` and `'microsoft'`
- If still failing, check database: `SELECT * FROM integrations WHERE user_id = 'your-user-id'`

### **Issue: Labels Not Created**
**Error**: `400 Bad Request` or `Label name contains reserved word`

**Solution**:
- ✅ System now validates label names
- ✅ Removes reserved words (GOOGLE, GMAIL)
- ✅ Cleans invalid characters
- Check Edge Function logs in Supabase Dashboard

### **Issue: Workflow Deployment Fails**
**Error**: `Failed to deploy workflow to n8n`

**Solution**:
1. Check n8n API credentials in `.env`
2. Verify n8n instance is accessible
3. Check Edge Function logs
4. Verify credentials exist in n8n

---

## 📈 **Performance & Scaling**

### **Current Capacity**
- **n8n Instance**: Medium VPS (4 CPU, 8GB RAM)
- **Estimated Capacity**: 200-300 clients
- **Current Load**: 1-5 clients
- **Headroom**: 98% available

### **Scaling Guidelines**
- **50-100 clients**: Current setup sufficient
- **100-300 clients**: Monitor n8n performance, consider upgrade
- **300+ clients**: Upgrade to large VPS or dedicated server
- **1000+ clients**: Consider n8n clustering

### **Resource Usage per Client**
- **Database**: ~5MB per client (emails, labels, configs)
- **n8n Workflow**: ~500KB per workflow
- **n8n Credential**: ~2KB per credential
- **Total**: ~5.5MB per client

---

## 🎯 **Business Type Schema Reference**

Each business type has:
- **13-16 label categories** (depending on industry)
- **30-50 sub-labels** (hierarchical organization)
- **5-10 pre-loaded suppliers** (industry-specific)
- **15 predefined services** (ready to use)

### **Label Categories (Universal)**
All business types include:
- `BANKING` 🔵 - Financial transactions
- `FORMS` 🟢 - Customer submissions
- `REVIEWS` 🟡 - Customer feedback
- `MANAGER` 🔴 - Internal routing
- `SALES` 🟣 - Revenue opportunities
- `SUPPLIERS` 🟠 - Vendor communications
- `SUPPORT` 🔵 - Customer service
- `URGENT` 🔴 - Emergencies
- `MISC` ⚪ - General
- `PHONE` 🔵 - Call tracking
- `PROMO` 🔴 - Marketing
- `RECRUITMENT` 🟢 - HR
- `SOCIAL` 🟣 - Social media

### **Industry-Specific Categories**
Certain business types add:
- **HVAC**: `SERVICE`, `WARRANTY`
- **Electrician**: `SERVICE`
- **Roofing**: `INSPECTIONS`, `PROJECTS`, `INSURANCE`
- **Landscaping**: `PROJECTS`, `MAINTENANCE`, `ESTIMATES`
- **Painting**: `PROJECTS`, `ESTIMATES`
- **Flooring**: `INSTALLATIONS`, `PROJECTS`
- **General Construction**: `PROJECTS`, `PERMITS`, `SAFETY`

---

## 🔄 **Update & Maintenance**

### **Updating Edge Function**
```bash
# Make changes to: supabase/functions/deploy-n8n/index.ts
# Deploy updates:
npx supabase functions deploy deploy-n8n
```

### **Database Migrations**
```bash
# Create new migration
npx supabase migration new your-migration-name

# Apply migrations
npx supabase db push
```

### **Updating Frontend/Backend**
```bash
# Pull latest code
git pull

# Install dependencies
npm install
cd backend && npm install

# Restart application
npm start
```

---

## 📊 **Monitoring & Analytics**

### **Application Logs**
- **Frontend**: Browser console (F12)
- **Backend**: Terminal output (magenta)
- **Edge Function**: Supabase Dashboard → Edge Functions → Logs

### **Database Monitoring**
- **Supabase Dashboard**: Real-time metrics
- **SQL Editor**: Run custom queries
- **Performance**: Table sizes, query performance

### **n8n Monitoring**
- **n8n Dashboard**: Workflow executions
- **Execution History**: Success/failure rates
- **Credential Status**: Active credentials per client

---

## 🎉 **Success Indicators**

When everything is working correctly, you'll see:

### **During Onboarding**:
```
✅ OAuth successful (Gmail/Outlook connected)
✅ Business type selected
✅ Team configured (managers, suppliers)
✅ Services added (15 predefined + custom)
✅ Labels provisioned (50+ labels created)
✅ n8n workflow deployed
✅ Workflow activated
✅ Onboarding complete!
```

### **In Gmail/Outlook**:
```
Gmail Account:
├─ BANKING 🔵
│  ├─ BankAlert 🔵
│  ├─ e-Transfer 🔵
│  ├─ Invoice 🔵
│  └─ Receipts 🔵
├─ SALES 🟣
│  ├─ New Hot Tubs 🟣
│  └─ Quotes 🟣
├─ URGENT 🔴
│  ├─ Pump Not Working 🔴
│  └─ Heater Error 🔴
└─ ... (50+ total labels)
```

### **In n8n Dashboard**:
```
Workflows:
├─ The Hot Tub Man Ltd. Automation Workflow v1 (Active)
├─ ABC Electric Automation Workflow v1 (Active)
└─ Skyline Roofing Automation Workflow v1 (Active)

Credentials:
├─ gmail-the-hot-tub-man-fedf81 (gmailOAuth2)
├─ gmail-abc-electric-a1b2c3 (gmailOAuth2)
├─ outlook-skyline-roofing-d4e5 (microsoftOutlookOAuth2Api)
└─ openai-shared (openAi) - Shared across all clients
```

### **In Dashboard**:
```
✅ Email Integration: Connected (Gmail)
✅ Business Type: Hot tub & Spa
✅ Team: 1 manager, 2 suppliers
✅ Services: 15 services configured
✅ Automation: Active (v1)
✅ Labels: 52 labels synced
```

---

## 🚨 **Common Issues & Solutions**

### **1. Backend Not Running**
**Symptoms**: OAuth fails, deployment fails, token refresh fails

**Solution**:
```bash
# Always use npm start (runs both frontend and backend)
npm start
```

### **2. Edge Function Not Deployed**
**Symptoms**: Workflow deployment fails with 500 error

**Solution**:
```bash
npx supabase functions deploy deploy-n8n
```

### **3. Wrong Provider Name**
**Symptoms**: "No active gmail integration found"

**Solution**: ✅ **FIXED** - System now handles both `'gmail'/'google'` and `'outlook'/'microsoft'`

### **4. Duplicate Credentials in n8n**
**Symptoms**: Multiple credentials with same name

**Solution**: ✅ **FIXED** - System automatically cleans up duplicates

---

## 🎯 **Production Deployment**

### **Deployment to Vercel/Netlify (Frontend)**
```bash
# Build frontend
npm run build

# Deploy to Vercel
vercel deploy

# Or deploy to Netlify
netlify deploy --prod
```

### **Deployment to Heroku/Railway (Backend)**
```bash
# Navigate to backend
cd backend

# Deploy to Heroku
heroku create your-app-name
git subtree push --prefix backend heroku main

# Or deploy to Railway
railway up
```

### **Edge Function Deployment**
```bash
# Already deployed to Supabase
# Edge functions are serverless - no additional deployment needed
```

---

## 📚 **Additional Resources**

- **Architecture Documentation**: `docs/TECHNICAL_ARCHITECTURE.md`
- **API Reference**: `docs/API.md`
- **User Guide**: `docs/USER_GUIDE.md`
- **Multi-Tenant Guide**: `docs/guides/MULTI_BUSINESS_OPERATIONAL_GUIDE.md`
- **Voice Training**: `docs/systems/VOICE_TRAINING_FLOW_INTEGRATION.md`
- **3-Layer Schema**: `docs/SCHEMA_SYSTEM_ARCHITECTURE.md`

---

## ✅ **Deployment Checklist**

Before going live:
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Edge Function deployed and tested
- [ ] n8n instance accessible and configured
- [ ] OAuth credentials (Google/Microsoft) configured
- [ ] OpenAI API key configured and tested
- [ ] Frontend builds without errors
- [ ] Backend starts without errors
- [ ] Test onboarding flow end-to-end
- [ ] Test label provisioning
- [ ] Test workflow deployment
- [ ] Test with real email (send test email)
- [ ] Verify AI classification works
- [ ] Verify AI draft generation works
- [ ] Test with multiple clients (multi-tenant)
- [ ] Monitor performance and logs

---

## 🚀 **You're Ready!**

The application is now **production-ready** and can support:
- ✅ Unlimited clients (limited by server capacity)
- ✅ 12 business types with full customization
- ✅ Both Gmail and Outlook providers
- ✅ Complete label provisioning (50+ labels per client)
- ✅ AI-powered email automation
- ✅ Multi-tenant isolation and security

**Start onboarding your first production client!** 🎉

---

**Questions?** Check the documentation in the `docs/` directory or review the inline code comments.

