# FloworxV2 - Architecture Quick Reference

**🚀 For Developers, DevOps, and System Architects**

---

## 📦 Tech Stack at a Glance

| Layer | Technology | Port/URL |
|-------|-----------|----------|
| **Frontend** | React 18 + Vite 7.1.9 | `5173` |
| **Main API** | Express.js + Node.js | `3000` |
| **Backend API** | Express.js + Node.js | `3001` |
| **Database** | Supabase (PostgreSQL 15+) | Cloud |
| **Edge Functions** | Deno (Supabase) | Cloud |
| **Workflow Engine** | n8n (Self-hosted) | `5678` |
| **AI/LLM** | OpenAI gpt-4o-mini | API |
| **Email** | Gmail + Outlook OAuth2 | API |

---

## 🗄️ Database Tables (13 Core Tables)

### User & Profile Management
- `auth.users` - Supabase auth (managed)
- `profiles` - User profiles + onboarding state
- `business_profiles` - Multi-business support
- `integrations` - OAuth tokens (Gmail/Outlook)

### Email & AI
- `email_logs` - Email processing analytics
- `communication_styles` - Voice training profiles
- `ai_human_comparison` - Learning dataset
- `ai_configurations` - AI behavior config

### Labels & Automation
- `business_labels` - Gmail/Outlook label mappings
- `workflows` - n8n workflow tracking
- `deployment_history` - Deployment audit trail

### Credentials & Keys
- `credentials` - Encrypted API keys
- `openai_api_keys` - OpenAI key pool

---

## 📁 Directory Structure

```
FloworxV2/
├── src/                        # Frontend (React)
│   ├── lib/                    # Core business logic
│   │   ├── integratedProfileSystem.js      # 3-tier profile system
│   │   ├── n8nConfigMapper.js              # Profile → n8n config
│   │   ├── templateService.js              # Template injection
│   │   ├── workflowDeployer.js             # n8n deployment
│   │   ├── labelProvisionService.js        # Gmail/Outlook labels
│   │   ├── aiSchemaInjector.js             # Layer 1: AI keywords
│   │   ├── behaviorSchemaInjector.js       # Layer 2: AI tone
│   │   └── voicePromptEnhancer.js          # Voice learning
│   ├── businessSchemas/        # Layer 1: AI Classification (13 files)
│   ├── behaviorSchemas/        # Layer 2: AI Behavior (13 files)
│   └── labelSchemas/           # Layer 3: Email Folders (13 files)
├── backend/                    # Backend API
│   └── src/
│       ├── routes/             # API routes (8 files)
│       └── services/           # Business services
├── supabase/
│   ├── migrations/             # SQL migrations
│   └── functions/              # Deno Edge Functions (10)
├── server.js                   # Main API (Port 3000)
└── docs/                       # Documentation (98 files)
```

---

## 🔄 3-Layer Schema System

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: AI Classification (businessSchemas/)      │
│  → Keywords, Intents, Classification Rules          │
│  → Merged by aiSchemaMerger.js                      │
│  → Injected by aiSchemaInjector.js                  │
├─────────────────────────────────────────────────────┤
│  Layer 2: AI Reply Behavior (behaviorSchemas/)      │
│  → Voice Tone, Behavior Goals, Upsell Rules         │
│  → Merged by behaviorSchemaMerger.js                │
│  → Injected by behaviorSchemaInjector.js            │
├─────────────────────────────────────────────────────┤
│  Layer 3: Email Folders (labelSchemas/)             │
│  → Label Hierarchy, Colors, Nested Structure        │
│  → Merged by labelSchemaMerger.js                   │
│  → Provisioned by labelProvisionService.js          │
└─────────────────────────────────────────────────────┘
```

**Supported Business Types (13):**
- Electrician
- Plumber
- Pools & Spas
- Hot tub & Spa
- Sauna & Icebath
- HVAC
- General Contractor
- Painting Contractor
- Roofing Contractor
- Flooring Contractor
- Landscaping
- Insulation & Foam Spray
- Auto Repair (partial)

---

## 🎤 Voice Training System

```
AI Draft → Human Edit → n8n Capture → Analysis → Profile Update → Next AI Draft
   │                         │              │            │              │
   │                         │              │            │              └─ Uses learned voice
   │                         │              │            └─ Updates communication_styles
   │                         │              └─ Analyzes differences
   │                         └─ Stores in ai_human_comparison
   └─ Generated with current voice profile
```

**Voice Profile Metrics:**
- `empathyLevel` (0-1)
- `formalityLevel` (0-1)
- `directnessLevel` (0-1)
- `confidence` (0-1)
- `signaturePhrases` (array)
- `vocabulary` (array)

---

## 🚀 Deployment Flow

```
User Completes Onboarding
  │
  ├─ Step 1: Select Business Type(s)
  ├─ Step 2: OAuth (Gmail/Outlook)
  ├─ Step 3: Business Info (Auto-filled by AI)
  ├─ Step 4: Team Setup (Managers + Suppliers)
  │
  └─ Step 5: Deploy Automation
       │
       ├─ 1. labelProvisionService creates Gmail/Outlook labels
       │
       ├─ 2. n8nConfigMapper aggregates:
       │     - Profile data
       │     - Voice profile
       │     - Email labels
       │     - All 3 schema layers
       │
       ├─ 3. templateService injects:
       │     - AI keywords (Layer 1)
       │     - Behavior tone (Layer 2)
       │     - Label IDs (Layer 3)
       │     - Voice profile
       │
       ├─ 4. workflowDeployer calls Supabase Edge Function
       │
       └─ 5. Edge Function (deploy-n8n) creates n8n workflow
             │
             └─ Workflow activated and running
```

---

## 📡 Key API Endpoints

### Main API (Port 3000)
```
POST   /api/ai/analyze-business-profile    # Auto-fill profile
POST   /api/email-logs                     # Log email events
GET    /health                              # Health check
```

### Backend API (Port 3001)
```
POST   /api/workflows/deploy                # Deploy n8n workflow
GET    /api/workflows/:userId               # Get user workflows
POST   /api/credentials                     # Store credentials
GET    /api/oauth/gmail/start               # Start Gmail OAuth
GET    /api/oauth/gmail/callback            # Gmail OAuth callback
GET    /api/oauth/outlook/start             # Start Outlook OAuth
GET    /api/oauth/outlook/callback          # Outlook OAuth callback
GET    /api/analytics/email-performance     # Email metrics
GET    /health                               # Health check
```

### Supabase Edge Functions
```
POST   /deploy-n8n                          # Deploy workflow to n8n
POST   /style-memory                        # Update voice profile
POST   /gmail-webhook                       # Gmail webhook handler
POST   /outlook-webhook                     # Outlook webhook handler
GET    /n8n-proxy                           # Proxy n8n API calls
```

---

## 🔑 Environment Variables

### Frontend (`.env`)
```bash
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_N8N_API_KEY=eyJhbGc...
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (`.env`)
```bash
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-proj-...
N8N_BASE_URL=https://n8n.srv995290.hstgr.cloud
N8N_API_KEY=eyJhbGc...
GMAIL_CLIENT_ID=636568831348-...
GMAIL_CLIENT_SECRET=GOCSPX-...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## 🛠️ Quick Commands

### Development
```bash
# Start all services
npm run dev                      # Frontend (Port 5173)
node server.js                   # Main API (Port 3000)
cd backend && node src/server.js # Backend API (Port 3001)

# Or use automated script
.\start-dev.ps1                  # PowerShell (Windows)
```

### Testing
```bash
npm run test:all                 # All tests
npm run test:unit                # Unit tests
npm run test:integration         # Integration tests
npm run test:e2e                 # E2E tests

npm run validate-schemas         # Validate all 39 schemas
```

### Deployment
```bash
npm run build                    # Build frontend
npm run deploy:staging           # Deploy to staging
npm run deploy:production        # Deploy to production
```

---

## 🔍 Troubleshooting

### Port Already in Use
```powershell
# Find process
netstat -ano | findstr :5173

# Kill process
Stop-Process -Id <PID> -Force
```

### Database Connection Issues
```bash
# Test connection
curl https://[project].supabase.co/rest/v1/
```

### n8n Not Reachable
```bash
# Check n8n health
curl https://n8n.srv995290.hstgr.cloud/healthz
```

### OAuth Tokens Expired
```sql
-- Check token expiry
SELECT email, access_token_expires_at 
FROM integrations 
WHERE user_id = '<uuid>';

-- Trigger refresh (via UI)
Navigate to Settings > Integrations > Reconnect
```

---

## 📊 System Metrics

| Metric | Count |
|--------|-------|
| **Total Code Files** | 500+ |
| **Database Tables** | 13 |
| **API Endpoints** | 20+ |
| **Edge Functions** | 10 |
| **Business Schemas** | 39 (13×3) |
| **n8n Templates** | 7 |
| **Documentation Files** | 98 |
| **Test Cases** | 120+ |
| **NPM Scripts** | 50+ |

---

## 🔒 Security Features

✅ Row Level Security (RLS) on all tables  
✅ JWT-based authentication (Supabase Auth)  
✅ Rate limiting (100 req/15min)  
✅ CORS restricted to frontend origin  
✅ Helmet.js security headers  
✅ Input validation on all endpoints  
✅ Encrypted credential storage  
✅ HTTPS enforced in production  
✅ OAuth2 token refresh automation  

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| **FLOWORX_V2_COMPREHENSIVE_ARCHITECTURE.md** | Complete system architecture |
| **ARCHITECTURE_QUICK_REFERENCE.md** | This file - quick lookup |
| **APPLICATION_INTEGRATION_COMPLETE.md** | Integration summary |
| **VOICE_TRAINING_SYSTEM_COMPLETE.md** | Voice learning details |
| **THREE_LAYER_SCHEMA_SYSTEM_COMPLETE.md** | Schema system docs |
| **README.md** | Quick start guide |

**Full docs:** `docs/` (98 files organized by category)

---

## 🎯 Key Files to Know

| File | Purpose |
|------|---------|
| `src/lib/integratedProfileSystem.js` | **Enterprise profile orchestrator** |
| `src/lib/n8nConfigMapper.js` | **3-tier profile aggregation** |
| `src/lib/templateService.js` | **n8n template injection** |
| `src/lib/workflowDeployer.js` | **n8n deployment manager** |
| `supabase/functions/deploy-n8n/index.ts` | **Edge function deployer** |
| `backend/src/routes/workflows.js` | **Workflow API routes** |
| `server.js` | **Main API server** |
| `backend/src/server.js` | **Backend API server** |

---

## 🚦 System Status

```
✅ Frontend:              OPERATIONAL (Vite 7.1.9)
✅ Main API:              OPERATIONAL (Express)
✅ Backend API:           OPERATIONAL (Express)
✅ Database:              OPERATIONAL (Supabase)
✅ n8n:                   OPERATIONAL (VPS)
✅ 3-Layer Schema System: OPERATIONAL (39 schemas)
✅ Voice Training:        OPERATIONAL (Learning enabled)
✅ Dynamic Labels:        OPERATIONAL (No hard-coded IDs)
✅ Documentation:         COMPLETE (98 files)
```

---

**Last Updated:** January 8, 2025  
**Version:** 2.0  
**Status:** 🟢 Production Ready

**Quick Links:**
- Full Architecture: `docs/architecture/FLOWORX_V2_COMPREHENSIVE_ARCHITECTURE.md`
- Main README: `README.md`
- Troubleshooting: `docs/guides/TROUBLESHOOTING_GUIDE.md`
- Testing Guide: `docs/testing/QUICK_TEST_GUIDE.md`

