# 🏗️ FloWorx System Architecture - Visual Diagram

## 🗺️ Complete System Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     🌐 USER'S BROWSER                                          │
│                                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐    │
│  │                         REACT FRONTEND (Vite + React Router)                         │    │
│  │                                                                                        │    │
│  │  📄 Pages                           🧩 Components                  🎛️ Contexts        │    │
│  │  ├─ RegisterPage.jsx                ├─ SmartRedirect.jsx          ├─ AuthContext     │    │
│  │  ├─ LoginPage.jsx                   ├─ EmailProvider.jsx          ├─ DashboardContext │    │
│  │  ├─ Dashboard.jsx                   └─ WorkflowDeployer.jsx       └─ ThemeContext    │    │
│  │  └─ Onboarding/                                                                       │    │
│  │      ├─ Step2Email.jsx              📚 Services                                       │    │
│  │      ├─ StepBusinessType.jsx        ├─ supabaseClient.js                             │    │
│  │      ├─ StepTeamSetup.jsx           ├─ analytics.js                                  │    │
│  │      ├─ StepBusinessInfo.jsx        └─ logger.js                                     │    │
│  │      └─ StepDeploy.jsx                                                                │    │
│  └────────────────────────────────────────────────────────────────────────────────────────┘    │
│                                           │                                                    │
│                                           │ HTTPS                                              │
│                                           ▼                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              🔐 SUPABASE BACKEND (PostgreSQL + Auth)                           │
│                                                                                                │
│  ┌─────────────────────────┐          ┌─────────────────────────┐                            │
│  │   🔒 SUPABASE AUTH      │          │   📡 SUPABASE REST API   │                            │
│  │   (Built-in Service)    │          │   (PostgREST)            │                            │
│  │                          │          │                          │                            │
│  │  • User Registration     │          │  • Auto-generates from   │                            │
│  │  • Email Verification    │          │    database schema       │                            │
│  │  • JWT Token Management  │          │  • RLS enforcement       │                            │
│  │  • OAuth Flows           │          │  • RESTful endpoints     │                            │
│  └─────────────────────────┘          └─────────────────────────┘                            │
│              │                                     │                                           │
│              │                                     │                                           │
│              ▼                                     ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         🗄️ POSTGRESQL DATABASE                                          │  │
│  │                                                                                          │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │  auth.users     │  │   profiles      │  │  integrations   │  │ onboarding_data │   │  │
│  │  │  (Supabase)     │  │                 │  │                 │  │                 │   │  │
│  │  │                 │  │  - id           │  │  - provider     │  │  - step         │   │  │
│  │  │  - id           │──┤  - email        │  │  - access_token │  │  - data (JSONB) │   │  │
│  │  │  - email        │  │  - onboarding_  │  │  - refresh_token│  │  - completed    │   │  │
│  │  │  - email_       │  │    step         │  │  - n8n_cred_id  │  │                 │   │  │
│  │  │    confirmed_at │  │  - business_type│  │  - expires_at   │  │                 │   │  │
│  │  │  - created_at   │  │  - managers     │  │  - status       │  │                 │   │  │
│  │  └─────────────────┘  │  - suppliers    │  └─────────────────┘  └─────────────────┘   │  │
│  │          │             │  - client_config│                                              │  │
│  │          │             │    (JSONB)      │                                              │  │
│  │  [TRIGGER FIRES]      └─────────────────┘                                              │  │
│  │   on email                    │                                                        │  │
│  │   verification                │                                                        │  │
│  │          │                    │                                                        │  │
│  │          └────────────────────┘                                                        │  │
│  │                                                                                          │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │  workflows      │  │ business_       │  │  email_queue    │  │  email_logs     │   │  │
│  │  │                 │  │ profiles        │  │                 │  │                 │   │  │
│  │  │  - n8n_workflow │  │                 │  │  - direction    │  │  - event_type   │   │  │
│  │  │    _id          │  │  - business_name│  │  - message_id   │  │  - detail       │   │  │
│  │  │  - status       │  │  - service_areas│  │  - from_addr    │  │  - event_at     │   │  │
│  │  │  - config       │  │  - business_hrs │  │  - subject      │  │                 │   │  │
│  │  │  - is_functional│  │  - managers     │  │  - body_text    │  │                 │   │  │
│  │  └─────────────────┘  │  - suppliers    │  │  - status       │  └─────────────────┘   │  │
│  │                        │  - client_config│  └─────────────────┘                        │  │
│  │                        └─────────────────┘                                              │  │
│  │                                                                                          │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │  ai_responses   │  │ ai_draft_       │  │  ai_draft_      │  │  communication_ │   │  │
│  │  │                 │  │ learning        │  │  corrections    │  │  styles         │   │  │
│  │  │  - model        │  │                 │  │                 │  │                 │   │  │
│  │  │  - prompt_hash  │  │  - thread_id    │  │  - ai_draft_text│  │  - vocabulary_  │   │  │
│  │  │  - response_text│  │  - ai_draft     │  │  - user_final_  │  │    patterns     │   │  │
│  │  │  - quality_score│  │  - classification│  │    text         │  │  - tone_analysis│   │  │
│  │  │  - latency_ms   │  │  - confidence   │  │  - similarity_  │  │  - signature_   │   │  │
│  │  └─────────────────┘  └─────────────────┘  │    score        │  │    phrases      │   │  │
│  │                                              │  - learned      │  │  - response_    │   │  │
│  │  ┌─────────────────┐                        └─────────────────┘  │    templates    │   │  │
│  │  │  performance_   │                                              └─────────────────┘   │  │
│  │  │  metrics        │                                                                    │  │
│  │  │                 │                                                                    │  │
│  │  │  - metric_date  │  🔐 ALL TABLES HAVE ROW LEVEL SECURITY (RLS)                      │  │
│  │  │  - metric_name  │  ✅ Users can only access their own data                          │  │
│  │  │  - metric_value │                                                                    │  │
│  │  │  - dimensions   │                                                                    │  │
│  │  └─────────────────┘                                                                    │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      ⚡ SUPABASE EDGE FUNCTIONS (Deno)                                  │  │
│  │                                                                                          │  │
│  │  📦 deploy-n8n/index.ts                                                                 │  │
│  │  ├─ Receives workflow JSON from frontend                                               │  │
│  │  ├─ Creates N8N credentials for Gmail/Outlook                                          │  │
│  │  ├─ Deploys workflow to N8N                                                            │  │
│  │  ├─ Activates workflow                                                                 │  │
│  │  └─ Returns n8n_workflow_id to frontend                                                │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                           │                                                    │
│                                           │ HTTPS                                              │
│                                           ▼                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              🤖 N8N AUTOMATION SERVER                                          │
│                          (https://n8n.srv995290.hstgr.cloud)                                   │
│                                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           WORKFLOW: Email Processing Pipeline                           │  │
│  │                                                                                          │  │
│  │  1️⃣ GMAIL/OUTLOOK TRIGGER (every 5 minutes)                                             │  │
│  │     │                                                                                    │  │
│  │     │  Uses credentials from integrations table                                         │  │
│  │     │  Fetches new unread emails                                                        │  │
│  │     ▼                                                                                    │  │
│  │  2️⃣ EMAIL CLASSIFIER (OpenAI GPT-4)                                                     │  │
│  │     │                                                                                    │  │
│  │     │  Input: Email content + profiles.client_config                                    │  │
│  │     │  Output: Category (Sales, Support, etc.), Urgency, Sentiment                      │  │
│  │     ▼                                                                                    │  │
│  │  3️⃣ DECISION: Should AI respond?                                                        │  │
│  │     │                                                                                    │  │
│  │     ├─ Yes → Continue to draft generator                                                │  │
│  │     └─ No  → Tag and notify user only                                                   │  │
│  │           │                                                                              │  │
│  │           ▼                                                                              │  │
│  │  4️⃣ AI DRAFT GENERATOR (OpenAI GPT-4)                                                   │  │
│  │     │                                                                                    │  │
│  │     │  Input:                                                                            │  │
│  │     │  - Email content                                                                   │  │
│  │     │  - profiles.client_config (business info)                                         │  │
│  │     │  - communication_styles (user's voice)                                            │  │
│  │     │  - business_profiles (full context)                                               │  │
│  │     │                                                                                    │  │
│  │     │  Output: AI-generated draft response                                              │  │
│  │     ▼                                                                                    │  │
│  │  5️⃣ STORE RESULTS IN SUPABASE                                                           │  │
│  │     │                                                                                    │  │
│  │     ├─→ email_queue (email details)                                                     │  │
│  │     ├─→ email_logs (processing events)                                                  │  │
│  │     ├─→ ai_responses (draft text)                                                       │  │
│  │     └─→ ai_draft_learning (learning data)                                               │  │
│  │                                                                                          │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  🌍 EXTERNAL SERVICES                                          │
│                                                                                                │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐                      │
│  │  📧 GMAIL API    │     │  📧 OUTLOOK API  │     │  🤖 OPENAI API   │                      │
│  │                  │     │                  │     │                  │                      │
│  │  OAuth 2.0       │     │  OAuth 2.0       │     │  GPT-4           │                      │
│  │  Access via N8N  │     │  Access via N8N  │     │  Embeddings      │                      │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘                      │
│                                                                                                │
│  ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐                      │
│  │  📮 SENDGRID     │     │  📊 SENTRY       │     │  🔒 COOLIFY      │                      │
│  │                  │     │                  │     │                  │                      │
│  │  Email Delivery  │     │  Error Tracking  │     │  CI/CD Platform  │                      │
│  │  SMTP: 465       │     │  Monitoring      │     │  Deployment      │                      │
│  └──────────────────┘     └──────────────────┘     └──────────────────┘                      │
│                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete User Journey Flow

### **🆕 New User Registration & Onboarding**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│  USER ACTION                     FRONTEND                   BACKEND               DATABASE  │
│                                                                                             │
│  1. Fills signup form            RegisterPage.jsx                                          │
│         │                              │                                                    │
│         │  Enter email/password        │                                                    │
│         └─────────────────────────────▶│                                                    │
│                                         │                                                    │
│                                         │  signUp()                                          │
│                                         ├────────────────────▶ Supabase Auth                │
│                                         │                              │                     │
│                                         │                              │  INSERT auth.users │
│                                         │                              │  (email_confirmed   │
│                                         │                              │   _at = NULL)       │
│                                         │                              └────────────────────▶│
│                                         │                                                    │
│                                         │  ◀───── User created (not confirmed yet)          │
│                                         │                                                    │
│         Confirmation email sent ◀───────┤                                                    │
│                                                                                             │
│  2. Checks email inbox                                                                      │
│         │                                                                                    │
│         │  Opens verification link                                                          │
│         └─────────────────────────────▶ Supabase Auth                                       │
│                                                   │                                          │
│                                                   │  UPDATE auth.users                       │
│                                                   │  SET email_confirmed_at = NOW()          │
│                                                   └────────────────────────────────────────▶│
│                                                                                             │
│                                                   [TRIGGER: on_user_email_confirmed]        │
│                                                                                      │       │
│                                                                       INSERT profiles│       │
│                                                                       (id, email,    │       │
│                                                                        onboarding_   │       │
│                                                                        step =        │       │
│                                                                        'email_       │       │
│                                                                        integration') │       │
│                                                                                      ▼       │
│                                                                                             │
│         Redirect to /onboarding ◀──────┤                                                    │
│                                         │                                                    │
│  3. Connect Email Provider     Step2Email.jsx                                               │
│         │                              │                                                    │
│         │  Click "Connect Gmail"       │                                                    │
│         └─────────────────────────────▶│                                                    │
│                                         │                                                    │
│                                         │  signInWithOAuth('google')                         │
│                                         ├────────────────────▶ Supabase Auth                │
│                                         │                              │                     │
│                                         │                              │  OAuth flow         │
│         Opens Google OAuth popup ◀──────┤                              │  to Gmail          │
│                                                                        │                     │
│  User authorizes app                                                  │                     │
│         │                                                              │                     │
│         │  Callback with tokens                                       │                     │
│         └──────────────────────────────────────────────────────────────┘                     │
│                                                                                             │
│                                         │  Store tokens                                      │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │                          INSERT integrations       │
│                                         │                          (provider = 'gmail',      │
│                                         │                           access_token,            │
│                                         │                           refresh_token,           │
│                                         │                           expires_at,              │
│                                         │                           status = 'active')       │
│                                         │                                                    │
│                                         │  UPDATE profiles                                   │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │  SET onboarding_step = 'business_type'            │
│                                                                                             │
│  4. Select Business Type   StepBusinessType.jsx                                             │
│         │                              │                                                    │
│         │  Select "Hot tub & Spa"      │                                                    │
│         └─────────────────────────────▶│                                                    │
│                                         │                                                    │
│                                         │  UPDATE profiles                                   │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │  SET business_type = 'Hot tub & Spa',             │
│                                         │      onboarding_step = 'team_setup'               │
│                                                                                             │
│  5. Add Team Members       StepTeamSetup.jsx                                                │
│         │                              │                                                    │
│         │  Add managers & suppliers    │                                                    │
│         └─────────────────────────────▶│                                                    │
│                                         │                                                    │
│                                         │  UPDATE profiles                                   │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │  SET managers = [{name}],                         │
│                                         │      suppliers = [{name, domains}]                │
│                                                                                             │
│  6. Fill Business Info  StepBusinessInformation.jsx                                         │
│         │                              │                                                    │
│         │  Fill comprehensive form     │                                                    │
│         └─────────────────────────────▶│                                                    │
│                                         │                                                    │
│                                         │  UPDATE profiles                                   │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │  SET client_config = {                            │
│                                         │    businessName, address, timezone,               │
│                                         │    businessHours, services, etc.                  │
│                                         │  },                                               │
│                                         │  onboarding_step = 'deploy'                       │
│                                         │                                                    │
│                                         │  INSERT business_profiles                          │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │  (comprehensive business data)                     │
│                                                                                             │
│  7. Deploy AI Workflow        StepDeploy.jsx                                                │
│         │                              │                                                    │
│         │  Click "Deploy AI"           │                                                    │
│         └─────────────────────────────▶│                                                    │
│                                         │                                                    │
│                                         │  WorkflowDeployer.deploy()                         │
│                                         │  ├─ Gather all user data                          │
│                                         │  ├─ Build AI classifier JSON                      │
│                                         │  ├─ Build draft agent config                      │
│                                         │  └─ Call Edge Function                            │
│                                         │                                                    │
│                                         │  POST /functions/v1/deploy-n8n                     │
│                                         ├────────────────────▶ Edge Function                │
│                                         │                              │                     │
│                                         │                              │  Create N8N creds  │
│                                         │                              ├──────────▶ N8N API │
│                                         │                              │                     │
│                                         │                              │  Deploy workflow   │
│                                         │                              ├──────────▶ N8N API │
│                                         │                              │                     │
│                                         │                              │  Activate workflow │
│                                         │                              ├──────────▶ N8N API │
│                                         │                              │                     │
│                                         │  ◀──── { n8n_workflow_id,                          │
│                                         │          n8n_credential_id }                       │
│                                         │                                                    │
│                                         │  INSERT workflows                                  │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │  (n8n_workflow_id, status='active',               │
│                                         │   config, is_functional=true)                      │
│                                         │                                                    │
│                                         │  UPDATE integrations                               │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │  SET n8n_credential_id = 'XYZ'                    │
│                                         │                                                    │
│                                         │  UPDATE profiles                                   │
│                                         ├────────────────────────────────────────────────────▶│
│                                         │  SET onboarding_step = 'completed'                │
│                                                                                             │
│         Redirect to Dashboard ◀─────────┤                                                    │
│                                                                                             │
│  ✅ ONBOARDING COMPLETE!                                                                     │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### **📨 Email Processing (After Onboarding)**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│  EMAIL ARRIVES            N8N WORKFLOW           SUPABASE             AI            RESULT   │
│                                                                                             │
│  1. Email arrives                                                                           │
│      at Gmail/Outlook                                                                       │
│         │                                                                                    │
│         │  Wait 5 minutes...                                                                │
│         ▼                                                                                    │
│                                                                                             │
│  2. N8N Trigger fires                                                                       │
│         (every 5 min)         Gmail/Outlook Trigger                                         │
│                                      │                                                       │
│                                      │  Fetch new unread emails                             │
│                                      │  (using integrations.access_token)                   │
│                                      ▼                                                       │
│                                                                                             │
│  3. Fetch user config                │                                                       │
│                                      │  GET /rest/v1/profiles?id=eq.{user_id}              │
│                                      │  GET /rest/v1/business_profiles?user_id=...         │
│                                      │  GET /rest/v1/communication_styles?user_id=...      │
│                                      ├─────────────────▶ Supabase                           │
│                                      │                        │                             │
│                                      │  ◀──── {               │                             │
│                                      │    client_config,      │                             │
│                                      │    business_info,      │                             │
│                                      │    voice_patterns      │                             │
│                                      │  }                     │                             │
│                                      │                                                       │
│  4. Classify Email                   │                                                       │
│                                      │                                                       │
│                                      │  POST /v1/chat/completions                           │
│                                      ├───────────────────────────────────▶ OpenAI           │
│                                      │  {                                                    │
│                                      │    model: "gpt-4",                                   │
│                                      │    messages: [                                       │
│                                      │      {role: "system",                                │
│                                      │       content: <business context>},                  │
│                                      │      {role: "user",                                  │
│                                      │       content: <email to classify>}                  │
│                                      │    ]                                                  │
│                                      │  }                                                    │
│                                      │                                                       │
│                                      │  ◀──────────────────────────── {                     │
│                                      │    category: "Support",                              │
│                                      │    urgency: "High",                                  │
│                                      │    sentiment: "Frustrated",                          │
│                                      │    shouldRespond: true                               │
│                                      │  }                                                    │
│                                      │                                                       │
│  5. Decision Branch                  │                                                       │
│                                      │                                                       │
│                      ┌───────────────┴───────────────┐                                       │
│                      │                                │                                       │
│                  shouldRespond                   shouldRespond                               │
│                  = true                          = false                                     │
│                      │                                │                                       │
│                      ▼                                ▼                                       │
│                                                                                             │
│  6a. Generate Draft                            6b. Tag & Notify Only                         │
│                      │                                │                                       │
│      POST /v1/chat/completions                       │  POST /rest/v1/email_queue           │
│      ├──────────────────────▶ OpenAI                 ├──────────────────▶ Supabase          │
│      │  {                                            │  { status: 'review_needed',          │
│      │    model: "gpt-4",                            │    category, urgency }               │
│      │    messages: [                                │                                       │
│      │      {role: "system",                         │                                       │
│      │       content: <full context +                │  Notify user ──────────▶ Dashboard   │
│      │                user's voice>},                │                                       │
│      │      {role: "user",                           │                                       │
│      │       content: <email to respond>}            │                                       │
│      │    ]                                          │                                       │
│      │  }                                            │                                       │
│      │                                               │                                       │
│      │  ◀───────────── { draft_text }               │                                       │
│      │                                               │                                       │
│      ▼                                               │                                       │
│                                                                                             │
│  7. Store Results                                                                           │
│                      │                                                                       │
│                      │  POST /rest/v1/email_queue                                           │
│                      │  POST /rest/v1/email_logs                                            │
│                      │  POST /rest/v1/ai_responses                                          │
│                      │  POST /rest/v1/ai_draft_learning                                     │
│                      ├─────────────────▶ Supabase                                           │
│                      │                        │                                             │
│                      │                        │  INSERT data with RLS                       │
│                      │                        │  (user_id matches)                          │
│                      │                        ▼                                             │
│                                                                                             │
│  8. User sees draft                                                                         │
│      in Dashboard                                                                           │
│         │                                                                                    │
│         │  Dashboard.jsx fetches                                                            │
│         │  GET /rest/v1/ai_responses?user_id=...                                            │
│         └─────────────────────────────────────▶ Supabase                                    │
│                                                       │                                      │
│                                     ◀──── [drafts]   │                                      │
│                                                                                             │
│  9. User edits & approves                                                                   │
│         │                                                                                    │
│         │  Dashboard.jsx                                                                    │
│         │  POST /rest/v1/ai_draft_corrections                                               │
│         └─────────────────────────────────────▶ Supabase                                    │
│                                                       │                                      │
│                                                       │  Store corrections                   │
│                                                       │  Update communication_styles         │
│                                                       ▼                                      │
│                                                                                             │
│  10. Email sent via Gmail/Outlook                                                           │
│          (N8N sends via API)                                                                │
│                                                                                             │
│  ✅ COMPLETE! AI learns from corrections                                                     │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Isolation

### **Row Level Security (RLS) Flow**

```
┌────────────────────────────────────────────────────────────────┐
│                    USER MAKES A REQUEST                        │
│                                                                │
│  Example: GET /rest/v1/profiles                                │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│              SUPABASE AUTH EXTRACTS JWT TOKEN                  │
│                                                                │
│  Authorization: Bearer eyJhbGciOi...                           │
│                                                                │
│  Decoded JWT:                                                  │
│  {                                                             │
│    "sub": "40b2d58f-b0f1-4645-9f2f-12373a889bc8",           │
│    "email": "user@example.com",                               │
│    "role": "authenticated",                                   │
│    ...                                                         │
│  }                                                             │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                  POSTGRESQL RLS POLICY RUNS                    │
│                                                                │
│  CREATE POLICY "tenant_isolation" ON profiles                 │
│  USING (id = auth.uid())                                      │
│                                                                │
│  Translates to:                                                │
│  SELECT * FROM profiles                                        │
│  WHERE id = '40b2d58f-b0f1-4645-9f2f-12373a889bc8'           │
│        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^          │
│        (from JWT sub claim)                                    │
│                                                                │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                    ONLY USER'S DATA RETURNED                   │
│                                                                │
│  {                                                             │
│    "id": "40b2d58f-b0f1-4645-9f2f-12373a889bc8",             │
│    "email": "user@example.com",                               │
│    "business_type": "Hot tub & Spa",                          │
│    ...                                                         │
│  }                                                             │
│                                                                │
│  ✅ User can NEVER see other users' data                       │
│  ✅ Enforced at DATABASE level (not app logic)                 │
│  ✅ SQL injection safe                                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Summary

- **Frontend:** React + Vite, deployed on Coolify
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Automation:** N8N for email workflows
- **AI:** OpenAI GPT-4 for classification & drafting
- **Security:** JWT + RLS for multi-tenant isolation
- **Total Tables:** 14+ with comprehensive relationships
- **Data Flow:** Unidirectional, secure, auditable

All components work together to provide a secure, scalable email automation platform! 🚀

