# 🗄️ FloWorx Database Audit & Data Flow Diagram

## 📊 Database Schema Overview

### **Core Tables (14 tables total)**

---

## 1️⃣ **Authentication & User Management**

### **`auth.users`** (Supabase managed)
- **Purpose:** Core authentication
- **Key Fields:** `id`, `email`, `email_confirmed_at`, `created_at`
- **Managed by:** Supabase Auth
- **Triggers:** `handle_user_email_confirmed` → Creates profile after verification

### **`profiles`**
- **Purpose:** User profiles and onboarding state
- **Key Fields:**
  - `id` (UUID, references auth.users)
  - `email` (TEXT)
  - `onboarding_step` (TEXT) - Current step in onboarding
  - `business_type` (TEXT)
  - `business_types` (TEXT[]) - Array for multi-business support
  - `managers` (JSONB) - Array of manager names
  - `suppliers` (JSONB) - Array of supplier info
  - `client_config` (JSONB) - Comprehensive business configuration
  - `has_seen_new_user_dashboard` (BOOLEAN)
  - `created_at`, `updated_at`
- **RLS:** Users can only access their own profile
- **Indexes:** `email`, `business_type`, `onboarding_step`

### **`onboarding_data`**
- **Purpose:** Stores data from each onboarding step
- **Key Fields:**
  - `user_id` (UUID)
  - `step` (TEXT) - Which onboarding step
  - `data` (JSONB) - Step-specific data
  - `completed` (BOOLEAN)
- **RLS:** Users can CRUD their own onboarding data
- **Unique:** `(user_id, step)`

---

## 2️⃣ **Email Integration**

### **`integrations`**
- **Purpose:** OAuth integrations (Gmail/Outlook)
- **Key Fields:**
  - `id` (UUID)
  - `user_id` (UUID)
  - `provider` (TEXT) - 'gmail' or 'outlook'
  - `access_token` (TEXT, encrypted)
  - `refresh_token` (TEXT, encrypted)
  - `expires_at` (TIMESTAMPTZ)
  - `scopes` (TEXT[])
  - `status` (TEXT) - 'active', 'inactive', 'expired'
  - `n8n_credential_id` (TEXT) - N8N credential reference
  - `last_sync` (TIMESTAMPTZ)
- **RLS:** Users can only access their own integrations
- **Indexes:** `user_id`, `provider`, `status`, `expires_at`
- **Unique:** `(user_id, provider)`

### **`business_profiles`**
- **Purpose:** Comprehensive business information for AI
- **Key Fields:**
  - `id` (UUID)
  - `user_id` (UUID, UNIQUE)
  - `business_name` (TEXT)
  - `service_areas` (TEXT)
  - `contact_info` (JSONB)
  - `business_hours` (JSONB)
  - `managers` (JSONB)
  - `suppliers` (JSONB)
  - `client_config` (JSONB)
- **RLS:** Users can only access their own business profile

---

## 3️⃣ **Workflow & Automation**

### **`workflows`**
- **Purpose:** N8N workflow deployments
- **Key Fields:**
  - `id` (UUID)
  - `client_id` (UUID) / `user_id` (UUID) - Both supported
  - `name` (TEXT)
  - `status` (TEXT) - 'active', 'paused', 'archived'
  - `n8n_workflow_id` (TEXT) - ID in N8N system
  - `version` (INTEGER)
  - `config` (JSONB) - Workflow configuration
  - `is_functional` (BOOLEAN)
  - `archived_reason` (TEXT)
  - `created_at`, `updated_at`
- **RLS:** Tenant isolation by user_id/client_id
- **Indexes:** `user_id`, `status`, `n8n_workflow_id`
- **Unique:** `(client_id, name)`

### **`email_queue`**
- **Purpose:** Email processing queue
- **Key Fields:**
  - `id` (UUID)
  - `client_id` (UUID)
  - `direction` (TEXT) - 'inbound', 'outbound'
  - `message_id` (TEXT)
  - `from_addr`, `to_addrs`, `cc_addrs`, `bcc_addrs`
  - `subject`, `body_text`, `body_html`
  - `status` (TEXT) - 'queued', 'processing', 'succeeded', 'failed'
  - `attempts` (INTEGER)
  - `metadata` (JSONB)
- **RLS:** Tenant isolation
- **Indexes:** `status`, `client_id`, `next_attempt_at`

### **`email_logs`**
- **Purpose:** Email processing event logs
- **Key Fields:**
  - `id` (UUID)
  - `client_id` / `user_id` (UUID)
  - `email_queue_id` (UUID, references email_queue)
  - `event_type` (TEXT)
  - `detail` (JSONB)
  - `event_at`, `created_at`
- **RLS:** Tenant isolation
- **Indexes:** `user_id`, `email_queue_id`, `event_at`

---

## 4️⃣ **AI & Learning**

### **`ai_responses`**
- **Purpose:** AI-generated email responses
- **Key Fields:**
  - `id` (UUID)
  - `client_id` / `user_id` (UUID)
  - `source_email_id` (UUID)
  - `model` (TEXT) - AI model used
  - `prompt_hash` (TEXT) - For caching
  - `prompt_tokens`, `completion_tokens` (INTEGER)
  - `response_text` (TEXT)
  - `latency_ms` (INTEGER)
  - `quality_score` (NUMERIC)
  - `created_by` (TEXT) - 'ai' or 'human'
- **RLS:** Tenant isolation
- **Indexes:** `user_id`, `source_email_id`, `prompt_hash`

### **`ai_draft_learning`**
- **Purpose:** Learn from AI draft corrections
- **Key Fields:**
  - `id` (UUID)
  - `user_id` (UUID)
  - `thread_id`, `message_id` (VARCHAR)
  - `original_subject`, `original_body` (TEXT)
  - `ai_draft` (TEXT)
  - `classification` (JSONB)
  - `confidence` (DECIMAL)
- **RLS:** Tenant isolation
- **Indexes:** `user_id`, `thread_id`, `message_id`

### **`ai_draft_corrections`**
- **Purpose:** Track user edits to AI drafts
- **Key Fields:**
  - `id` (UUID)
  - `user_id` (UUID)
  - `ai_draft_text`, `user_final_text` (TEXT)
  - `edit_distance` (INTEGER)
  - `similarity_score` (DECIMAL)
  - `correction_type` (TEXT) - 'minor', 'moderate', 'major', 'complete_rewrite'
  - `email_category` (TEXT)
  - `learned` (BOOLEAN)
- **RLS:** Tenant isolation
- **Indexes:** `user_id`, `thread_id`, `category`, `learned`

### **`ai_human_comparison`**
- **Purpose:** Compare AI vs human responses
- **Key Fields:**
  - `id` (UUID)
  - `client_id` (UUID)
  - `category` (TEXT)
  - `ai_draft`, `human_reply` (TEXT)
  - `similarity_score` (DECIMAL)
  - `learned_improvements` (TEXT[])
- **RLS:** Tenant isolation

### **`communication_styles`**
- **Purpose:** User's unique communication patterns
- **Key Fields:**
  - `id` (UUID)
  - `user_id` (UUID, UNIQUE)
  - `vocabulary_patterns` (JSONB)
  - `tone_analysis` (JSONB)
  - `signature_phrases` (TEXT[])
  - `response_templates` (JSONB)
  - `sample_size` (INTEGER)
  - `updated_at`
- **RLS:** Tenant isolation
- **Purpose:** AI voice training and personalization

### **`voice_learning_metrics`**
- **Purpose:** Track learning progress
- **Key Fields:**
  - `user_id` (UUID, UNIQUE)
  - `total_corrections` (INTEGER)
  - `avg_similarity_score` (DECIMAL)
  - `learning_status` (TEXT)
  - `last_learned_at` (TIMESTAMPTZ)

### **`enhanced_prompts`**
- **Purpose:** Store AI system prompts
- **Key Fields:**
  - `id` (UUID)
  - `user_id` (UUID)
  - `prompt_type` (TEXT)
  - `prompt_text` (TEXT)
  - `is_active` (BOOLEAN)
  - `metadata` (JSONB)

### **`system_messages`**
- **Purpose:** Reusable AI system message templates
- **Key Fields:**
  - `id` (UUID)
  - `name` (TEXT, UNIQUE)
  - `message_template` (TEXT)
  - `business_type` (TEXT)
  - `is_active` (BOOLEAN)
  - `metadata` (JSONB)

---

## 5️⃣ **Analytics & Performance**

### **`performance_metrics`**
- **Purpose:** Track system performance
- **Key Fields:**
  - `id` (UUID)
  - `client_id` / `user_id` (UUID)
  - `metric_date` (DATE)
  - `metric_name` (TEXT)
  - `metric_value` (NUMERIC)
  - `dimensions` (JSONB)
- **RLS:** Tenant isolation
- **Unique Index:** `(client_id, metric_date, metric_name, dimensions->>'workflow')`

---

## 📈 **Data Flow Diagram**

### **🔐 Authentication Flow**

```
┌──────────────────┐
│  User Registers  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ auth.users (created)     │
│ email_confirmed_at: NULL │
└────────┬─────────────────┘
         │
         │ Email sent
         │
         ▼
┌──────────────────────────┐
│ User Clicks Verify Link  │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ auth.users.email_confirmed_at   │
│ set to NOW()                    │
└────────┬────────────────────────┘
         │
         │ Trigger fires!
         ▼
┌──────────────────────────────┐
│ profiles (created by trigger)│
│ - id: user.id                │
│ - email: user.email          │
│ - onboarding_step:           │
│   'email_integration'        │
└──────────────────────────────┘
```

---

### **📧 Onboarding Flow**

```
Step 1: Email Integration
┌──────────────────────────┐
│ User connects Gmail/     │
│ Outlook via OAuth        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ integrations table               │
│ - provider: 'gmail'/'outlook'    │
│ - access_token (encrypted)       │
│ - refresh_token (encrypted)      │
│ - status: 'active'               │
│ - n8n_credential_id: TBD         │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ onboarding_data                  │
│ - step: 'email_integration'      │
│ - data: { provider, timestamps } │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ profiles.onboarding_step =       │
│ 'business_type'                  │
└──────────────────────────────────┘
```

```
Step 2: Business Type
┌──────────────────────────┐
│ User selects business    │
│ type (Hot tub & Spa)     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ profiles                         │
│ - business_type: 'Hot tub & Spa' │
│ - onboarding_step: 'team_setup'  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ onboarding_data                  │
│ - step: 'business_type'          │
│ - data: { type, selected_at }    │
└──────────────────────────────────┘
```

```
Step 3: Team Setup
┌──────────────────────────┐
│ User adds managers &     │
│ suppliers                │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ profiles                         │
│ - managers: [{name}, ...]        │
│ - suppliers: [{name, domains}]   │
│ - onboarding_step: 'business_    │
│   type' (stays here)             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ onboarding_data                  │
│ - step: 'team_setup'             │
│ - data: { managers, suppliers }  │
└────────┬─────────────────────────┘
         │
         │ Background: Label provisioning
         ▼
┌──────────────────────────────────┐
│ business_profiles (created)      │
│ - business_name                  │
│ - managers, suppliers            │
│ - client_config (full config)    │
└──────────────────────────────────┘
```

```
Step 4: Business Information
┌──────────────────────────┐
│ User fills business      │
│ details form             │
└────────┬─────────────────┘
         │
         ▼
┌────────────────────────────────────┐
│ profiles.client_config             │
│ {                                  │
│   businessName, address,           │
│   serviceArea, timezone,           │
│   businessHours: {                 │
│     monday: {open, close},         │
│     tuesday: {...}, ...            │
│   },                               │
│   primaryContactName,              │
│   services: [...],                 │
│   crmProvider, ...                 │
│ }                                  │
└────────┬───────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ onboarding_data                  │
│ - step: 'business_information'   │
│ - data: { full form data }       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ profiles.onboarding_step =       │
│ 'deploy'                         │
└──────────────────────────────────┘
```

```
Step 5: Deploy AI Workflow
┌──────────────────────────┐
│ User clicks Deploy       │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend: WorkflowDeployer      │
│ 1. Gathers all user data        │
│ 2. Builds AI classifier JSON    │
│ 3. Builds draft agent config    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Supabase Edge Function:         │
│ deploy-n8n                      │
│ 1. Receives workflow JSON       │
│ 2. Creates N8N credentials      │
│ 3. Deploys workflow to N8N      │
│ 4. Activates workflow           │
└────────┬────────────────────────┘
         │
         │ Returns: n8n_workflow_id
         ▼
┌─────────────────────────────────┐
│ workflows table                 │
│ - n8n_workflow_id: 'ABC123'     │
│ - status: 'active'              │
│ - config: { full workflow }     │
│ - is_functional: true           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ integrations table (updated)    │
│ - n8n_credential_id: 'XYZ'      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ profiles.onboarding_step =      │
│ 'completed'                     │
└─────────────────────────────────┘
```

---

## 🔄 **Runtime Data Flow (After Onboarding)**

### **Email Processing Pipeline**

```
1. Gmail/Outlook receives email
         │
         ▼
2. N8N Workflow (polls every 5 min)
   - Fetches new emails
   - Uses credentials from integrations table
         │
         ▼
3. AI Classifier (in N8N)
   - Uses client_config from profiles
   - Classifies email (Sales, Support, etc.)
   - Determines urgency
         │
         ▼
4. AI Draft Generator (in N8N)
   - Uses business info from profiles
   - Uses communication_styles for voice
   - Generates draft response
         │
         ▼
5. Store Results
   ┌──────────────────────────────┐
   │ email_queue                  │
   │ - Email details              │
   ├──────────────────────────────┤
   │ email_logs                   │
   │ - Processing events          │
   ├──────────────────────────────┤
   │ ai_responses                 │
   │ - Generated draft            │
   ├──────────────────────────────┤
   │ ai_draft_learning            │
   │ - Learning data              │
   └──────────────────────────────┘
         │
         ▼
6. Frontend Dashboard
   - Fetches from ai_responses
   - Shows draft to user
   - User can edit & approve
         │
         ▼
7. User Edits & Sends
   ┌──────────────────────────────┐
   │ ai_draft_corrections         │
   │ - Tracks what user changed   │
   ├──────────────────────────────┤
   │ communication_styles (updated)│
   │ - Learns user's voice        │
   └──────────────────────────────┘
```

---

## 🗺️ **Frontend → Backend → Database Map**

### **Authentication**

| Frontend | Backend | Database |
|----------|---------|----------|
| `src/contexts/SupabaseAuthContext.jsx` | Supabase Auth API | `auth.users` |
| `src/pages/RegisterPage.jsx` | `POST /auth/signup` | `auth.users` (created) |
| `src/pages/LoginPage.jsx` | `POST /auth/login` | `auth.users` (verified) |
| Email verification link | Supabase | `auth.users.email_confirmed_at` |
| Trigger fires | Database trigger | `profiles` (created) |

### **Onboarding**

| Frontend Component | State Management | Database Tables |
|-------------------|------------------|-----------------|
| `Step2Email.jsx` | `SupabaseAuthContext.signInWithOAuth()` | `integrations` |
| `StepBusinessType.jsx` | Direct to Supabase | `profiles.business_type` |
| `StepTeamSetup.jsx` | Direct to Supabase | `profiles.managers`, `profiles.suppliers` |
| `StepBusinessInformation.jsx` | Direct to Supabase | `profiles.client_config` |
| `StepDeploy.jsx` | Edge Function → N8N | `workflows`, `integrations.n8n_credential_id` |

### **Email Processing**

| Component | API/Service | Database |
|-----------|-------------|----------|
| N8N Gmail Trigger | Gmail API | `integrations.access_token` |
| N8N Classifier | OpenAI API | `profiles.client_config`, `business_profiles` |
| N8N Draft Generator | OpenAI API | `profiles.client_config`, `communication_styles` |
| N8N Store Results | Supabase REST API | `email_queue`, `email_logs`, `ai_responses` |
| Dashboard | Frontend fetch | `ai_responses`, `email_logs` |

---

## 🔑 **Key Relationships**

```
auth.users (1)
    ├──→ profiles (1) [One-to-One]
    ├──→ integrations (*) [One-to-Many]
    ├──→ workflows (*) [One-to-Many]
    ├──→ business_profiles (1) [One-to-One]
    ├──→ onboarding_data (*) [One-to-Many by step]
    ├──→ email_queue (*) [One-to-Many]
    ├──→ email_logs (*) [One-to-Many]
    ├──→ ai_responses (*) [One-to-Many]
    ├──→ ai_draft_learning (*) [One-to-Many]
    ├──→ communication_styles (1) [One-to-One]
    └──→ performance_metrics (*) [One-to-Many]

integrations (1)
    └──→ N8N Credentials (external) [One-to-One per provider]

workflows (1)
    └──→ N8N Workflow (external) [One-to-One]

email_queue (1)
    └──→ email_logs (*) [One-to-Many events]
```

---

## 🔒 **Security Model (RLS)**

All tables use **Row Level Security (RLS)** with tenant isolation:

```sql
-- Pattern used across all tables:
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid())

-- Or for tables using client_id:
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid())

-- Workflows uses both:
USING (COALESCE(user_id, client_id) = auth.uid())
```

**Benefits:**
- ✅ Users can ONLY access their own data
- ✅ No cross-tenant data leaks
- ✅ Database enforces security (not just app logic)
- ✅ Works with Supabase REST API automatically

---

## 📊 **Current Issues Identified**

### **1. Column Name Inconsistency ❌**
- Some tables use `client_id`
- Others use `user_id`
- **Recommendation:** Standardize on `user_id`

### **2. Missing Tables ❌**
- `business_profiles` - Not created yet
- **Fixed:** Migration created

### **3. Schema Cache Issues ❌**
- Supabase cache not refreshing after migrations
- **Fix:** Run `NOTIFY pgrst, 'reload schema';` after each migration

### **4. Missing Columns in workflows ❌**
- `config` column missing in some deployments
- `user_id` vs `client_id` confusion
- **Fixed:** Migration created

---

## ✅ **Recommendations**

### **Immediate Fixes:**
1. ✅ Run `20241027_create_business_profiles.sql`
2. ✅ Run `20241027_fix_workflows_schema.sql`
3. ✅ Standardize `client_id` → `user_id` across all tables
4. ✅ Always run `NOTIFY pgrst, 'reload schema';` after migrations

### **Data Consistency:**
1. Ensure `profiles.client_config` and `business_profiles` stay in sync
2. Consider using database triggers to sync them
3. Or deprecate one in favor of the other

### **Performance:**
1. ✅ Indexes already exist for common queries
2. ✅ JSONB columns for flexible data storage
3. Consider partitioning `email_logs` by date (if > 1M rows)

---

## 📁 **File Locations**

**Frontend:**
- Auth: `src/contexts/SupabaseAuthContext.jsx`
- Onboarding: `src/pages/onboarding/*`
- Dashboard: `src/pages/Dashboard.jsx`
- API Client: `src/lib/customSupabaseClient.js`

**Backend:**
- Edge Functions: `supabase/functions/deploy-n8n/`
- Migrations: `supabase/migrations/`
- N8N Workflows: External (https://n8n.srv995290.hstgr.cloud)

**Database:**
- Supabase Project: `oinxzvqszingwstrbdro`
- Primary Tables: 14 (listed above)
- All with RLS enabled

---

## 🎯 **Summary**

**Total Tables:** 14+
**Total Migrations:** 44 files
**RLS Policies:** All tables protected
**Indexes:** Optimized for common queries
**Foreign Keys:** Proper relationships with CASCADE deletes
**Triggers:** Auto-timestamps, profile creation

**Current Status:**
- ✅ Core infrastructure complete
- ✅ Authentication working
- ✅ Onboarding mostly working
- ❌ Workflow deployment needs schema fixes
- ❌ business_profiles table missing (migration ready)

---

See the visual diagram above for complete data flow! 🚀

