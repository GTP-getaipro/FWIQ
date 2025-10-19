# FloworxV2 - Comprehensive System Architecture

**Version:** 2.0  
**Last Updated:** January 8, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Database Architecture](#database-architecture)
5. [Backend Services](#backend-services)
6. [Frontend Architecture](#frontend-architecture)
7. [Integration Systems](#integration-systems)
8. [3-Layer Schema System](#3-layer-schema-system)
9. [Voice Training System](#voice-training-system)
10. [Data Flow](#data-flow)
11. [API Reference](#api-reference)
12. [Deployment Architecture](#deployment-architecture)
13. [Security & Authentication](#security--authentication)
14. [Monitoring & Observability](#monitoring--observability)

---

## 🎯 System Overview

FloworxV2 is an AI-powered email automation and management platform that provides:
- **Multi-business type support** with dynamic schema merging
- **AI-driven email classification** and draft generation
- **Voice learning system** that adapts communication style
- **n8n workflow orchestration** for email automation
- **Dynamic label provisioning** for Gmail/Outlook
- **Real-time analytics** and performance monitoring

### Core Capabilities

```
┌──────────────────────────────────────────────────────────────┐
│                    FLOWORX V2 PLATFORM                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   AI Email  │  │   Voice      │  │  Dynamic Label  │    │
│  │ Classifier  │  │   Training   │  │  Provisioning   │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │  n8n Auto   │  │  3-Layer     │  │  Multi-Business │    │
│  │  Workflows  │  │  Schema Sys  │  │  Support        │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### **Frontend Layer**
```yaml
Framework: React 18.x
Build Tool: Vite 7.1.9
Language: JavaScript (ES6+), TypeScript
UI Library: Tailwind CSS
State Management: React Context API
HTTP Client: Native Fetch API
Authentication: Supabase Auth (JWT)
```

### **Backend Layer**
```yaml
Runtime: Node.js 18+
Framework: Express.js 4.x
Language: JavaScript (CommonJS)
API Style: RESTful
Middleware: 
  - CORS
  - Helmet (Security)
  - Compression
  - Rate Limiting
  - Morgan (Logging)
```

### **Database Layer**
```yaml
Primary DB: Supabase (PostgreSQL 15+)
ORM: Direct SQL with Supabase Client
Migrations: SQL-based (supabase/migrations/)
Row Level Security: Enabled
Real-time: Supabase Realtime subscriptions
```

### **AI/ML Services**
```yaml
LLM Provider: OpenAI
Models:
  - gpt-4o-mini (Classification)
  - gpt-4o-mini (Draft Generation)
  - text-embedding-3-small (Voice Analysis)
Temperature: 0.3 (Classifier), 0.7 (Drafts)
Max Tokens: 1000-2000
```

### **Workflow Automation**
```yaml
Platform: n8n (Self-hosted)
Version: Latest
Deployment: VPS (Hostinger)
URL: https://n8n.srv995290.hstgr.cloud
API: REST API with custom credentials
```

### **Email Integration**
```yaml
Providers:
  - Gmail (OAuth2 + API)
  - Microsoft Outlook (OAuth2 + Graph API)
Webhooks: n8n-based email triggers
Token Management: Automatic refresh
```

### **Edge Functions**
```yaml
Runtime: Deno
Platform: Supabase Edge Functions
Functions:
  - deploy-n8n
  - style-memory
  - gmail-webhook
  - outlook-webhook
  - n8n-proxy
```

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite) - Port 5173                                 │   │
│  │  - Dashboard  - Onboarding  - Settings  - Analytics           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                         HTTPS / REST API
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                               │
│                                                                       │
│  ┌─────────────────┐      ┌─────────────────┐                       │
│  │  Main API       │      │  Backend API    │                       │
│  │  (Express)      │      │  (Express)      │                       │
│  │  Port: 3000     │      │  Port: 3001     │                       │
│  │                 │      │                 │                       │
│  │ - Profile Mgmt  │      │ - Workflow      │                       │
│  │ - Auto Profile  │      │ - Credentials   │                       │
│  │ - Email Logs    │      │ - OAuth Flows   │                       │
│  │ - Analytics     │      │ - n8n Deploy    │                       │
│  └─────────────────┘      └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
┌───────────────────────────────┐  ┌──────────────────────────────┐
│   SUPABASE EDGE FUNCTIONS     │  │   EXTERNAL SERVICES          │
│   (Deno Runtime)               │  │                              │
│                                │  │  ┌────────────────────────┐  │
│  - deploy-n8n/index.ts         │  │  │  n8n Automation        │  │
│  - style-memory/index.ts       │  │  │  Port: 5678            │  │
│  - gmail-webhook/index.ts      │  │  │                        │  │
│  - outlook-webhook/index.ts    │  │  │  - Workflow Engine     │  │
│  - n8n-proxy/index.ts          │  │  │  - Credential Store    │  │
│                                │  │  │  - Email Triggers      │  │
│                                │  │  │  - AI Nodes            │  │
│                                │  │  └────────────────────────┘  │
└───────────────────────────────┘  └──────────────────────────────┘
                                                    │
┌──────────────────────────────────────────────────┼──────────────────┐
│                    DATABASE LAYER                │                  │
│                                                   │                  │
│  ┌───────────────────────────────────────────────▼───────────────┐  │
│  │  Supabase PostgreSQL 15+                                      │  │
│  │                                                                │  │
│  │  Core Tables:                                                  │  │
│  │  - profiles                  - integrations                    │  │
│  │  - business_profiles         - business_labels                 │  │
│  │  - email_logs                - communication_styles            │  │
│  │  - ai_human_comparison       - credentials                     │  │
│  │  - workflows                 - deployment_history              │  │
│  │  - ai_configurations         - openai_api_keys                 │  │
│  │                                                                │  │
│  │  Features:                                                     │  │
│  │  - Row Level Security (RLS)  - Real-time Subscriptions         │  │
│  │  - Automatic Backups         - Point-in-time Recovery          │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Architecture

### Core Tables

#### 1. **`profiles`** - User Profiles
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  onboarding_step text DEFAULT 'welcome',
  client_config jsonb,
  managers jsonb DEFAULT '[]'::jsonb,
  suppliers jsonb DEFAULT '[]'::jsonb,
  email_labels jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose:** Central user profile with onboarding status and legacy config storage.

#### 2. **`business_profiles`** - Multi-Business Support
```sql
CREATE TABLE business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_types text[] NOT NULL DEFAULT '{}',
  primary_business_type text NOT NULL,
  client_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  n8n_workflow_id text,
  deployment_status text DEFAULT 'pending',
  last_deployed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose:** Support for users with multiple business types (e.g., Electrician + Plumber).

#### 3. **`business_labels`** - Dynamic Email Labels
```sql
CREATE TABLE business_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid REFERENCES business_profiles(id) ON DELETE CASCADE,
  business_type text NOT NULL,
  label_id text NOT NULL,
  label_name text NOT NULL,
  color jsonb NOT NULL DEFAULT '{"backgroundColor": "#cccccc", "textColor": "#000000"}',
  provider text DEFAULT 'gmail' CHECK (provider IN ('gmail', 'outlook')),
  provider_label_id text, -- Actual Gmail/Outlook ID
  intent text,
  keywords text[],
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Store provisioned Gmail/Outlook label IDs mapped to business types.

#### 4. **`integrations`** - OAuth Integrations
```sql
CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'quickbooks')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  email text,
  access_token text,
  refresh_token text,
  access_token_expires_at timestamptz,
  n8n_credential_id text, -- ID in n8n
  scopes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose:** Store OAuth tokens and link to n8n credentials.

#### 5. **`communication_styles`** - Voice Training
```sql
CREATE TABLE communication_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  style_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  learning_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Store learned voice profiles (empathy, formality, signature phrases).

**Example `style_profile`:**
```json
{
  "voice": {
    "tone": "Professional and friendly",
    "empathyLevel": 0.75,
    "formalityLevel": 0.82,
    "directnessLevel": 0.68,
    "confidence": 0.85,
    "signOff": "Best regards,\nJohn Smith",
    "vocabulary": ["certainly", "absolutely", "appreciate"],
    "commonPhrases": ["I'd be happy to help", "Looking forward to"]
  },
  "signaturePhrases": [
    {
      "phrase": "I'd be happy to assist",
      "confidence": 0.92,
      "context": "service requests",
      "frequency": 15
    }
  ]
}
```

#### 6. **`ai_human_comparison`** - Learning Data
```sql
CREATE TABLE ai_human_comparison (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id text NOT NULL,
  category text,
  ai_draft text,
  human_reply text,
  differences jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Purpose:** Store AI-generated drafts vs human edits for voice training.

#### 7. **`email_logs`** - Email Analytics
```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  provider text CHECK (provider IN ('gmail', 'outlook')),
  status text CHECK (status IN ('new', 'read', 'draft_created', 'sent')),
  category text,
  subject text,
  from_address text,
  to_address text,
  message_id text,
  thread_id text,
  received_at timestamptz,
  processed_at timestamptz DEFAULT now()
);
```

**Purpose:** Track email processing for analytics dashboard.

#### 8. **`workflows`** - n8n Workflow Tracking
```sql
CREATE TABLE workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  n8n_workflow_id text UNIQUE,
  workflow_name text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 9. **`ai_configurations`** - AI Behavior Config
```sql
CREATE TABLE ai_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid REFERENCES business_profiles(id) ON DELETE CASCADE,
  business_type text NOT NULL,
  classifier_behavior jsonb NOT NULL DEFAULT '{}'::jsonb,
  responder_behavior jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_config jsonb DEFAULT '{"classifier_model": "gpt-4o-mini", "responder_model": "gpt-4o-mini", "temperature": 0.3, "max_tokens": 1000}'::jsonb,
  created_at timestamptz DEFAULT now()
);
```

### Database Relationships

```
auth.users (Supabase Auth)
  │
  ├──► profiles (1:1)
  │     │
  │     ├──► integrations (1:N) ──► n8n credentials
  │     ├──► email_logs (1:N)
  │     ├──► communication_styles (1:1)
  │     ├──► ai_human_comparison (1:N)
  │     ├──► workflows (1:N)
  │     └──► credentials (1:N)
  │
  └──► business_profiles (1:N)
        │
        ├──► business_labels (1:N) ──► Gmail/Outlook labels
        ├──► ai_configurations (1:N)
        └──► deployment_history (1:N)
```

---

## 🔧 Backend Services

### Main API Server (`server.js` - Port 3000)

**Purpose:** Handles profile management, email analytics, and AI business analysis.

#### Key Endpoints:

```javascript
// Auto Profile API
POST /api/email/recent-emails
POST /api/ai/analyze-business-profile

// Email Logging
POST /api/email-logs
GET /api/email-logs/:userId

// Health Check
GET /health
```

#### Features:
- **Auto-Profile Generation:** Analyzes recent sent emails to auto-fill business profile
- **Email Analytics:** Stores and retrieves email processing metrics
- **Gmail/Outlook Integration:** Fetches recent emails via provider APIs
- **Token Refresh:** Automatically refreshes expired OAuth tokens

### Backend API Server (`backend/src/server.js` - Port 3001)

**Purpose:** Manages workflows, n8n deployment, OAuth flows, and credentials.

#### Key Endpoints:

```javascript
// Workflow Management
POST /api/workflows/deploy
GET /api/workflows/:userId
PUT /api/workflows/:workflowId/activate

// OAuth
GET /api/oauth/gmail/start
GET /api/oauth/gmail/callback
GET /api/oauth/outlook/start
GET /api/oauth/outlook/callback

// Credentials
POST /api/credentials
GET /api/credentials/:userId
DELETE /api/credentials/:credentialId

// AI Analysis
POST /api/ai/analyze

// Analytics
GET /api/analytics/email-performance
GET /api/analytics/category-breakdown
GET /api/analytics/trends

// Health & Security
GET /health
GET /api/security/audit
```

#### Core Services:

**1. VPS n8n Deployment Service:**
```javascript
// backend/src/services/vpsN8nDeployment.js
- createOrUpdateN8nWorkflow()
- ensureN8nCredentials()
- activateWorkflow()
- deployViaSupabaseEdgeFunction()
```

**2. Credential Service:**
```javascript
// backend/src/services/credentialService.js
- encryptCredential()
- decryptCredential()
- storeN8nCredentials()
- getUserCredentials()
```

**3. Email Service:**
```javascript
// backend/src/services/emailService.js
- fetchGmailEmails()
- fetchOutlookEmails()
- analyzeEmailVoice()
```

### Middleware Stack

```javascript
// Security
app.use(helmet({
  contentSecurityPolicy: { ... },
}));

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Compression
app.use(compression());
```

---

## 🎨 Frontend Architecture

### Technology Stack

```yaml
Framework: React 18.x
Build Tool: Vite 7.1.9
Routing: React Router v6
Styling: Tailwind CSS
State: React Context API
Forms: Controlled Components
HTTP: Fetch API
Real-time: Supabase Realtime
```

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── AuthForm.jsx
│   ├── NavigationBar.jsx
│   ├── ProtectedRoute.jsx
│   └── ui/              # UI primitives
├── contexts/            # React Context providers
│   ├── AuthContext.jsx
│   └── ProfileContext.jsx
├── lib/                 # Core business logic
│   ├── customSupabaseClient.js
│   ├── deployment.js
│   ├── n8nConfigMapper.js
│   ├── integratedProfileSystem.js
│   ├── templateService.js
│   ├── labelProvisionService.js
│   ├── workflowDeployer.js
│   ├── aiSchemaInjector.js
│   ├── behaviorSchemaInjector.js
│   ├── aiSchemaMerger.js
│   ├── behaviorSchemaMerger.js
│   ├── labelSchemaMerger.js
│   ├── schemaIntegrationBridge.js
│   ├── voicePromptEnhancer.js
│   └── emailVoiceAnalyzer.js
├── pages/               # Page components
│   ├── Dashboard.jsx
│   ├── LoginPage.jsx
│   ├── onboarding/
│   │   ├── OnboardingWizard.jsx
│   │   ├── Step2EmailN8n.jsx
│   │   ├── Step3BusinessType.jsx
│   │   ├── StepTeamSetup.jsx
│   │   └── Step5ProvisionLabels.jsx
│   └── settings/
├── businessSchemas/     # AI Classification Layer
│   ├── electrician.json
│   ├── plumber.json
│   └── ... (13 total)
├── behaviorSchemas/     # AI Reply Behavior Layer
│   ├── electrician.json
│   ├── plumber.json
│   └── ... (13 total)
├── labelSchemas/        # Email Folder Structure Layer
│   ├── electrician.json
│   ├── plumber.json
│   └── ... (13 total)
└── scripts/             # Validation & CLI tools
    ├── validate-ai-schema.ts
    ├── validate-behavior-json.ts
    ├── validate-label-schema.ts
    └── validate-all-schemas.ts
```

### Key Components

#### 1. **OnboardingWizard** (`src/pages/onboarding/OnboardingWizard.jsx`)
- Multi-step wizard (5 steps)
- Progress tracking
- State persistence to Supabase

#### 2. **Dashboard** (`src/pages/Dashboard.jsx`)
- Real-time email analytics
- Category breakdown charts
- Trend analysis
- Auto-refresh every 60s

#### 3. **IntegratedProfileSystem** (`src/lib/integratedProfileSystem.js`)
- Enterprise-grade profile orchestration
- Performance optimization with caching
- Error handling with automatic fallbacks
- Template management

---

## 🔗 Integration Systems

### 3-Layer Schema System

FloworxV2 uses a sophisticated 3-layer schema system to configure AI behavior, email folder structure, and reply tone:

```
┌────────────────────────────────────────────────────────────────┐
│                    3-LAYER SCHEMA SYSTEM                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: AI Classification (src/businessSchemas/)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Keywords & Intents                                     │  │
│  │ • Classification Rules                                   │  │
│  │ • Escalation Rules                                       │  │
│  │ • Category Definitions                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 2: AI Reply Behavior (src/behaviorSchemas/)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Voice & Tone Profile                                   │  │
│  │ • Behavior Goals                                         │  │
│  │ • Upsell Guidelines                                      │  │
│  │ • Signature Templates                                    │  │
│  │ • Follow-up Rules                                        │  │
│  │ • Category-specific Overrides                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 3: Email Folder Structure (src/labelSchemas/)           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Label Hierarchy                                        │  │
│  │ • Colors & Visual Identity                               │  │
│  │ • Nested Structure                                       │  │
│  │ • Provider-specific (Gmail/Outlook)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

#### Layer 1: AI Classification (`businessSchemas/`)

**Example:** `src/businessSchemas/electrician.json`

```json
{
  "businessType": "Electrician",
  "keywords": {
    "primary": ["electrical", "wiring", "breaker", "panel", "outlet"],
    "emergency": ["no power", "sparking", "smoking", "burning smell"],
    "sales": ["quote", "estimate", "pricing", "cost"],
    "support": ["help", "issue", "problem", "not working"]
  },
  "intentMapping": {
    "ai.emergency_request": "URGENT",
    "ai.quote_request": "SALES",
    "ai.service_inquiry": "SUPPORT"
  },
  "classificationRules": [
    {
      "condition": "contains_any(keywords.emergency)",
      "action": "set_category('URGENT')",
      "priority": 100
    }
  ],
  "escalationRules": [
    {
      "trigger": "category === 'URGENT' && after_hours",
      "action": "notify_manager",
      "channels": ["sms", "email"]
    }
  ]
}
```

#### Layer 2: AI Reply Behavior (`behaviorSchemas/`)

**Example:** `src/behaviorSchemas/electrician.json`

```json
{
  "businessType": "Electrician",
  "voiceProfile": {
    "tone": "Safety-focused, professional, and reassuring",
    "formality": "professional",
    "empathy": "high",
    "urgency": "immediate for safety issues"
  },
  "behaviorGoals": [
    "Prioritize safety above all else",
    "Clearly communicate electrical hazards",
    "Provide transparent pricing",
    "Emphasize licensed/insured credentials"
  ],
  "upsellGuidelines": {
    "context": "After addressing immediate need",
    "suggestions": [
      "Panel upgrades for older homes",
      "GFCI outlet installation",
      "Whole-home surge protection"
    ],
    "tone": "Consultative, not pushy"
  },
  "signatureTemplate": "Best regards,\n{{BUSINESS_NAME}}\nLicensed Electrician #{{LICENSE}}\n{{PHONE}}\n{{EMAIL}}",
  "categoryOverrides": {
    "URGENT": {
      "tone": "Calm, directive, safety-focused",
      "responseTime": "immediate",
      "customLanguage": ["Safety first", "Turn off breaker", "Do not touch"]
    }
  }
}
```

#### Layer 3: Email Folder Structure (`labelSchemas/`)

**Example:** `src/labelSchemas/electrician.json`

```json
{
  "businessType": "Electrician",
  "labels": [
    {
      "name": "URGENT",
      "color": { "backgroundColor": "#fb4c2f", "textColor": "#ffffff" },
      "sub": [
        { "name": "No Power" },
        { "name": "Electrical Hazard" },
        { "name": "Sparking/Smoking" },
        { "name": "Breaker Issues" }
      ]
    },
    {
      "name": "PERMITS",
      "color": { "backgroundColor": "#4a86e8", "textColor": "#ffffff" },
      "sub": [
        { "name": "Permit Applications" },
        { "name": "Inspections" },
        { "name": "Code Compliance" }
      ]
    }
  ]
}
```

### Schema Merging Logic

For users with multiple business types (e.g., "Electrician + Plumber"):

**AI Schema Merger** (`src/lib/aiSchemaMerger.js`):
- Merges keywords (deduplicates)
- Combines intent mappings
- Preserves highest-priority classification rules

**Behavior Schema Merger** (`src/lib/behaviorSchemaMerger.js`):
- Blends voice tone (weighted average)
- Combines behavior goals
- Merges upsell suggestions

**Label Schema Merger** (`src/lib/labelSchemaMerger.js`):
- Merges label hierarchies
- Deduplicates common categories (e.g., "URGENT")
- Preserves industry-specific labels

---

## 🎤 Voice Training System

The Voice Training System learns from human-edited emails to adapt AI-generated drafts to match the user's communication style.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                  VOICE TRAINING WORKFLOW                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  1. AI generates draft → Stored in n8n                     │
│                                                             │
│  2. Human edits draft → Sent via Gmail/Outlook             │
│                                                             │
│  3. n8n captures sent email → Compares AI vs Human         │
│                                                             │
│  4. Differences analyzed → Stored in ai_human_comparison   │
│                                                             │
│  5. Voice profiler runs → Updates communication_styles     │
│                                                             │
│  6. Next AI draft → Uses learned voice profile             │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Voice Profile Structure

Stored in `communication_styles.style_profile`:

```json
{
  "voice": {
    "tone": "Professional and friendly",
    "empathyLevel": 0.75,
    "formalityLevel": 0.82,
    "directnessLevel": 0.68,
    "confidence": 0.85,
    "signOff": "Best regards,\nJohn",
    "vocabulary": ["certainly", "absolutely", "appreciate"],
    "commonPhrases": ["I'd be happy to help", "Looking forward to"]
  },
  "signaturePhrases": [
    {
      "phrase": "I'd be happy to assist",
      "confidence": 0.92,
      "context": "service requests",
      "frequency": 15
    }
  ]
}
```

### Learning Process

**1. Email Voice Analyzer** (`src/lib/emailVoiceAnalyzer.js`):
```javascript
export async function analyzeEmailVoice(emails) {
  // Extract tone, formality, empathy from emails
  // Use OpenAI embeddings for similarity
  // Return voice profile metrics
}
```

**2. Style Memory Edge Function** (`supabase/functions/style-memory/index.ts`):
```typescript
// Compare AI draft vs human edit
const differences = analyzeDifferences(aiDraft, humanReply);

// Update voice profile
await updateVoiceProfile(userId, differences);
```

**3. Voice Prompt Enhancer** (`src/lib/voicePromptEnhancer.js`):
```javascript
export async function buildVoiceEnhancedPrompt(
  basePrompt,
  voiceProfile,
  businessName,
  clientId,
  category
) {
  // Add learned voice to AI system prompt
  // Include signature phrases
  // Fetch few-shot examples
}
```

---

## 🔄 Data Flow

### Onboarding Flow

```
User Registration
  │
  ├──► Email Verification (Supabase Auth)
  │
  ├──► Step 1: Business Type Selection
  │     │
  │     └──► Saves to profiles.client_config.business_type
  │
  ├──► Step 2: Gmail/Outlook OAuth
  │     │
  │     ├──► OAuth flow via backend/src/routes/oauth.js
  │     ├──► Tokens saved to integrations table
  │     └──► n8n credential created via Edge Function
  │
  ├──► Step 3: Business Information
  │     │
  │     └──► Auto-profile API analyzes recent emails
  │         └──► Prefills business name, services, tone
  │
  ├──► Step 4: Team Setup (Managers & Suppliers)
  │     │
  │     └──► Saves to profiles.managers, profiles.suppliers
  │
  └──► Step 5: Label Provisioning & Deployment
        │
        ├──► labelProvisionService creates Gmail/Outlook labels
        ├──► Saves label IDs to business_labels table
        ├──► workflowDeployer.deployWorkflow() called
        │     │
        │     ├──► n8nConfigMapper.mapClientConfigToN8n()
        │     │     └──► Aggregates profile + voice + labels
        │     │
        │     ├──► templateService.injectOnboardingData()
        │     │     ├──► Applies AI schema (Layer 1)
        │     │     ├──► Applies behavior schema (Layer 2)
        │     │     └──► Applies label IDs (Layer 3)
        │     │
        │     └──► Supabase Edge Function: deploy-n8n
        │           └──► Creates/updates workflow in n8n
        │
        └──► Onboarding Complete → Redirect to Dashboard
```

### Email Processing Flow (n8n)

```
Gmail/Outlook Trigger (every 2 min)
  │
  ├──► Fetch new emails
  │
  ├──► AI Master Classifier Node
  │     │
  │     ├──► System Prompt: Uses merged AI keywords (Layer 1)
  │     └──► Output: { category: "URGENT", confidence: 0.95 }
  │
  ├──► Category Router (Switch Node)
  │     │
  │     └──► Routes based on category
  │
  ├──► Apply Gmail Label Node
  │     │
  │     └──► Uses dynamic label ID from business_labels table
  │
  ├──► AI Draft Reply Node
  │     │
  │     ├──► System Prompt: Uses merged behavior tone (Layer 2)
  │     ├──► Includes learned voice profile
  │     └──► Output: Professional email draft
  │
  ├──► Create Gmail Draft
  │
  ├──► Save Metrics to Postgres (email_logs)
  │
  └──► (If human edits draft before sending)
        │
        └──► Voice Training Workflow
              │
              ├──► Compare AI draft vs human edit
              ├──► Save to ai_human_comparison
              └──► Update communication_styles
```

---

## 📡 API Reference

### Main API (Port 3000)

#### POST `/api/ai/analyze-business-profile`
Analyzes recent emails to auto-fill business profile.

**Request:**
```json
{
  "userId": "uuid",
  "maxResults": 50,
  "includeBody": true
}
```

**Response:**
```json
{
  "success": true,
  "businessType": "Electrician",
  "businessName": "Smith Electric",
  "services": [...],
  "tone": "Professional and safety-focused",
  "confidence": 0.89
}
```

#### POST `/api/email-logs`
Log email processing events.

**Request:**
```json
{
  "user_id": "uuid",
  "provider": "gmail",
  "status": "draft_created",
  "category": "URGENT",
  "message_id": "abc123"
}
```

### Backend API (Port 3001)

#### POST `/api/workflows/deploy`
Deploy n8n workflow for a user.

**Request:**
```json
{
  "userId": "uuid",
  "workflowData": { ...injected n8n workflow JSON... },
  "deployToN8n": true
}
```

**Response:**
```json
{
  "success": true,
  "workflowId": "n8n-workflow-id",
  "version": 1,
  "credentialsCreated": ["gmail-cred-id", "openai-cred-id"]
}
```

#### GET `/api/analytics/email-performance`
Get email processing analytics.

**Query Parameters:**
- `userId` (required)
- `timeRange`: "7d" | "30d" | "90d" | "365d"

**Response:**
```json
{
  "totalProcessed": 1247,
  "urgentCount": 23,
  "categoryBreakdown": {
    "URGENT": 23,
    "SALES": 145,
    "SUPPORT": 89
  },
  "trends": {
    "percentChange": 12.5,
    "direction": "up"
  }
}
```

---

## 🚀 Deployment Architecture

### Development Environment

```yaml
Frontend:
  URL: http://localhost:5173
  Command: npm run dev

Main API:
  URL: http://localhost:3000
  Command: node server.js

Backend API:
  URL: http://localhost:3001
  Command: cd backend && node src/server.js

Database:
  Provider: Supabase Cloud
  URL: https://[project-id].supabase.co

n8n:
  URL: https://n8n.srv995290.hstgr.cloud
  Deployment: VPS (Hostinger)
```

### Production Environment

```yaml
Frontend:
  Platform: Vercel / Netlify
  Build: npm run build
  Output: dist/

APIs:
  Platform: Docker + VPS
  Containers:
    - floworx-frontend
    - floworx-api
    - floworx-backend

Database:
  Provider: Supabase Production
  Backups: Automatic daily
  PITR: 7 days

n8n:
  Platform: Self-hosted VPS
  Reverse Proxy: Nginx
  SSL: Let's Encrypt
```

---

## 🔐 Security & Authentication

### Authentication Flow

```
User Login/Register
  │
  ├──► Supabase Auth (Email + Password)
  │
  ├──► JWT Token issued
  │     │
  │     └──► Stored in localStorage
  │
  ├──► AuthContext provides token
  │
  └──► All API requests include:
        Authorization: Bearer <jwt-token>
```

### Row Level Security (RLS)

All tables have RLS policies:

```sql
-- Example: profiles table
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### API Security

- **CORS:** Restricted to frontend origin
- **Rate Limiting:** 100 requests/15 min per IP
- **Helmet.js:** CSP, XSS protection
- **Input Validation:** All endpoints validate inputs
- **HTTPS Only:** Production enforces HTTPS

---

## 📊 Monitoring & Observability

### Logging

```javascript
// Backend logging with Winston
const logger = require('./utils/logger');

logger.info('Workflow deployed', { userId, workflowId });
logger.error('Deployment failed', { error, userId });
```

### Analytics

- **Email Processing Metrics:** email_logs table
- **Deployment History:** deployment_history table
- **Voice Training Progress:** communication_styles.learning_count

### Health Checks

```javascript
GET /health

Response:
{
  "status": "healthy",
  "uptime": 3600,
  "database": "connected",
  "n8n": "reachable"
}
```

---

## 🎯 Summary

FloworxV2 is a **production-ready, AI-powered email automation platform** with:

✅ **39 business-specific schemas** across 3 layers  
✅ **Voice training system** that learns from human interactions  
✅ **Dynamic label routing** with no hard-coded IDs  
✅ **Multi-business support** with intelligent schema merging  
✅ **Enterprise-grade architecture** with fallback systems  
✅ **Comprehensive API** with 20+ endpoints  
✅ **Real-time analytics** and monitoring  
✅ **Secure by design** with RLS and rate limiting  

**Total System Components:**
- 2 API servers (Express)
- 1 Frontend (React + Vite)
- 10 Supabase Edge Functions
- 13 Database tables
- 39 Business schemas (AI, Behavior, Label)
- 7 n8n workflow templates
- 50+ NPM scripts
- 98 Documentation files

---

**Documentation Version:** 2.0  
**Last Updated:** January 8, 2025  
**Status:** ✅ Production Ready

