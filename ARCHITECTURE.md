# FloWorx System Architecture

**Version:** 2.0.0  
**Last Updated:** October 29, 2025

---

## 🎯 System Overview

FloWorx is a multi-tenant, AI-powered email automation platform that intelligently classifies, routes, and responds to business emails using N8N workflows, OpenAI, and provider-specific email APIs (Gmail/Outlook).

### Key Capabilities
- **AI Email Classification**: Automatically categorizes emails into business-specific folders
- **Voice Profile Training**: Learns individual writing styles for personalized AI responses
- **Dynamic Workflow Deployment**: Deploys custom N8N workflows per user
- **Multi-Provider Support**: Works with both Gmail and Microsoft Outlook/365
- **Multi-Tenant Architecture**: Supports 12 business types with customized configurations

---

## 🏗️ High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER LAYER                                │
├──────────────────────────────────────────────────────────────────┤
│  React Frontend (Vite) - Dashboard, Onboarding, Analytics        │
│  - Authentication (Supabase Auth)                                 │
│  - Onboarding Wizard (6 steps)                                    │
│  - Performance Dashboard                                          │
│  - Settings & Configuration                                       │
└──────────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌──────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│  Backend API (Node.js + Express)         Supabase Edge Functions │
│  - OAuth Management                       - deploy-n8n            │
│  - Analytics & Metrics                    - style-memory          │
│  - Template Management                    - detect-provider       │
│  - Voice Learning                         - webhook handlers      │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATION LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│  N8N Workflows (User-Specific)                                    │
│  - Email Monitoring Trigger                                       │
│  - AI Classification (OpenAI)                                     │
│  - Label/Folder Application                                       │
│  - Draft Generation                                               │
│  - Manager Routing                                                │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│  Gmail API           Outlook/Graph API         OpenAI API         │
│  - OAuth 2.0         - OAuth 2.0               - GPT-4o-mini      │
│  - Labels            - Folders                 - Classification   │
│  - Messages          - Messages                - Draft Generation │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                 │
├──────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL                Redis (Caching)               │
│  - User Profiles                    - Session Storage             │
│  - Business Configurations          - OAuth Token Cache           │
│  - Performance Metrics              - API Response Cache          │
│  - Voice Training Data                                            │
│  - Email Logs                                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Details

### Frontend (`src/`)

**Technology Stack:**
- React 19.2.0
- Vite 7.1.9
- Tailwind CSS 3.4.18
- React Router 7.9.3
- Radix UI (accessibility)

**Key Directories:**
```
src/
├── components/          # Reusable UI components
│   ├── dashboard/       # Dashboard widgets
│   ├── ui/              # Base UI components (buttons, cards, etc.)
│   └── enhanced/        # Enhanced feature components
├── pages/               # Route pages
│   ├── onboarding/      # 6-step onboarding wizard
│   ├── Dashboard.jsx    # Main dashboard
│   └── Settings.jsx     # User settings
├── lib/                 # Business logic & utilities
│   ├── templates/       # N8N workflow templates
│   ├── labelSyncValidator.js
│   ├── emailVoiceAnalyzer.js
│   └── supabaseClient.js
├── businessSchemas/     # AI schemas per business type (12 types)
├── behaviorSchemas/     # Behavior configs per business type
└── labelSchemas/        # Label/folder structures per business type
```

**Key Features:**
- OAuth flow management (Gmail/Outlook)
- Folder health monitoring
- Performance metrics visualization
- Voice training interface

### Backend (`backend/`)

**Technology Stack:**
- Node.js 18+
- Express 4.21.2
- PostgreSQL (via Supabase)
- Redis 7 (caching)

**Structure:**
```
backend/
├── src/
│   ├── routes/          # API endpoints
│   │   ├── oauth.js     # OAuth management
│   │   ├── workflows.js # N8N workflow management
│   │   ├── analytics.js # Performance metrics
│   │   └── voice-learning.js
│   ├── services/        # Business logic
│   │   ├── aiService.js
│   │   ├── emailService.js
│   │   ├── cacheManager.js
│   │   └── vpsN8nDeployment.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # JWT validation
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── cache.js
│   └── server.js        # Entry point
└── templates/           # N8N workflow templates
    ├── gmail-workflow-template.json
    └── outlook-workflow-template.json
```

**Key Responsibilities:**
- OAuth token management & refresh
- N8N workflow deployment
- Performance metrics aggregation
- Voice training data processing
- Caching layer (Redis)

### Supabase Edge Functions (`supabase/functions/`)

**Serverless Functions:**

1. **deploy-n8n** (Most Critical)
   - Provisions email folders/labels
   - Generates AI classifier with business-specific rules
   - Deploys customized N8N workflow
   - Validates folder health before activation

2. **style-memory**
   - Fetches voice profile examples
   - Supports sender-specific, thread-aware context
   - Returns training data for AI draft generation

3. **detect-provider**
   - Normalizes provider detection (gmail/outlook/microsoft)
   - Returns consistent provider identifiers

4. **Webhook Handlers**
   - `gmail-webhook`: Processes Gmail push notifications
   - `outlook-webhook`: Processes Outlook webhook events
   - `email-webhook`: Generic email event processor

### Database Schema

**Core Tables:**

```sql
-- User Management
profiles                    -- User profiles (extends Supabase auth)
business_profiles          -- Business configurations per user

-- Email Configuration
business_labels            -- User's email labels/folders
oauth_tokens               -- OAuth credentials (encrypted)
email_logs                 -- Email processing history

-- AI & Learning
communication_styles       -- Voice profiles
voice_training_samples     -- Training data from sent emails
ai_draft_learning         -- AI draft quality tracking

-- Workflows & Metrics
workflows                  -- N8N workflow metadata
performance_metrics        -- Email processing analytics

-- Team Management
managers                   -- Manager configurations
suppliers                  -- Supplier contacts
```

**Key Indexes:**
- `idx_voice_training_sender` - Fast sender-based lookups
- `idx_performance_metrics_user_date` - Analytics queries
- `idx_email_logs_user_created` - Log retrieval

**Security:**
- Row Level Security (RLS) enabled on all tables
- User can only access their own data
- Service role for edge functions

---

## 🔄 Data Flow

### 1. User Onboarding Flow

```
User Signs Up
    ↓
Step 1: Email Integration (OAuth)
    ↓ Grants permissions
Gmail/Outlook API
    ↓ Returns access token
Backend stores OAuth token (encrypted)
    ↓
Step 2: Business Type Selection
    ↓ Triggers automatic folder provisioning
deploy-n8n Edge Function
    ↓ Creates folders via provider API
Gmail/Outlook API
    ↓ Validates folders created
Folder Health Check (>70% required)
    ↓
Step 3: Team Setup (Managers/Suppliers)
    ↓
Step 4: Business Information
    ↓
Step 5: Voice Training (optional)
    ↓ Analyzes sent emails
style-memory Edge Function
    ↓
Step 6: Deploy Workflow
    ↓ Generates custom N8N workflow
deploy-n8n Edge Function
    ↓ Activates workflow
N8N Instance
```

### 2. Email Processing Flow (Runtime)

```
Email Arrives → Gmail/Outlook
    ↓
N8N Workflow Triggered
    ↓
Fetch Email Data
    ↓ Call OpenAI
AI Classifier (GPT-4o-mini)
    ↓ Returns: category, confidence, can_reply
Route to Manager (if MANAGER category)
    ↓ Matches manager by name/role/content
Can AI Reply? (confidence ≥ 90%)
    ↓ YES
Fetch Voice Context
    ↓ sender-specific examples
Generate AI Draft
    ↓
Apply Label/Folder
    ↓
Save to Drafts (if applicable)
    ↓
Forward to Manager (if no email provided)
    ↓
Calculate Performance Metrics
    ↓ Save to database
Supabase (performance_metrics table)
```

### 3. Voice Training Flow

```
User Completes Onboarding
    ↓ Trigger voice training
style-memory Edge Function
    ↓ Fetch sent emails
Gmail/Outlook API (sentitems folder)
    ↓ Analyze 20-50 emails
OpenAI Analysis (tone, style, patterns)
    ↓ Extract voice profile
{
  tone: "professional",
  formality: 0.7,
  avg_length: 150,
  common_phrases: [...],
  greeting_style: "Hi there",
  closing_style: "Best"
}
    ↓ Save to database
communication_styles table
    ↓ Update workflow
N8N uses voice profile in drafts
```

---

## 🔐 Security Architecture

### Authentication & Authorization

**User Authentication:**
- Supabase Auth (JWT-based)
- OAuth 2.0 for Gmail/Outlook
- Session management via HTTP-only cookies

**API Security:**
```
Frontend → Backend:
  - JWT in Authorization header
  - CORS restricted to production domain
  - Rate limiting (TODO)

Backend → Supabase:
  - Service role key (edge functions)
  - User JWT (client requests)
  - RLS policies enforce user isolation

Backend → N8N:
  - Basic auth (VPS deployment)
  - API key authentication
  - HTTPS only

Backend → OpenAI:
  - API key rotation support
  - Key stored in environment variables
  - Usage tracking per user
```

### Data Protection

**At Rest:**
- OAuth tokens encrypted (Supabase Vault)
- Database encrypted (Supabase default)
- Redis ephemeral (session/cache only)

**In Transit:**
- HTTPS everywhere (TLS 1.3)
- Webhook signatures validated
- API keys never logged

**RLS Policies:**
```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view own metrics"
  ON performance_metrics FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🎨 Design Patterns

### 1. Template Pattern (N8N Workflows)

**Problem:** Each user needs a customized workflow
**Solution:** Template with placeholder injection

```javascript
// Template
const template = {
  nodes: [...],
  connections: {...}
};

// Injection
const replacements = {
  '<<<USER_ID>>>': userId,
  '<<<AI_SYSTEM_MESSAGE>>>': generatedClassifier,
  '<<<LABEL_MAP>>>': JSON.stringify(labelMapping),
  '<<<TEAM_CONFIG>>>': JSON.stringify(teamConfig)
};

// Deploy
const workflow = injectPlaceholders(template, replacements);
```

### 2. Strategy Pattern (Provider Abstraction)

**Problem:** Gmail and Outlook have different APIs
**Solution:** Unified interface with provider-specific strategies

```javascript
// Unified interface
async function createFolder(provider, folderName, parentId) {
  if (provider === 'gmail') {
    return createGmailLabel(folderName, parentId);
  } else if (provider === 'outlook') {
    return createOutlookFolder(folderName, parentId);
  }
}

// Usage is provider-agnostic
await createFolder(userProvider, 'SALES', null);
```

### 3. Factory Pattern (AI Classifier Generation)

**Problem:** 12 business types need different classifiers
**Solution:** Factory that generates business-specific configs

```javascript
class EnhancedDynamicClassifierGenerator {
  generate(businessType, teamConfig) {
    const baseSchema = this.getBaseSchema(businessType);
    const teamFolders = this.generateTeamFolders(teamConfig);
    const systemMessage = this.buildSystemMessage(baseSchema, teamFolders);
    return systemMessage;
  }
}
```

### 4. Semantic Layer (Data Abstraction)

**Problem:** Business logic scattered across codebase
**Solution:** Centralized business logic layer

```
Presentation Layer (UI)
    ↓
Semantic Layer (lib/)
  - labelSyncValidator.js
  - emailVoiceAnalyzer.js
  - EnhancedDynamicClassifierGenerator.js
    ↓
Data Access Layer (Supabase)
```

---

## 🔧 Configuration Management

### Environment Variables

**Frontend (.env.production):**
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_BACKEND_URL=https://api.floworx-iq.com
```

**Backend (backend/.env.production):**
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx...
REDIS_URL=redis://localhost:6379
N8N_API_URL=https://n8n.floworx-iq.com
N8N_API_KEY=xxx
PORT=3001
```

**Supabase Edge Functions:**
- Environment variables set in Supabase dashboard
- Secrets managed via Supabase Vault

### Business Type Configurations

**12 Supported Business Types:**
1. HVAC
2. Plumbing
3. Electrician
4. Pools/Spas
5. Hot Tub/Spa
6. Sauna/Ice Bath
7. Roofing Contractor
8. General Contractor
9. Painting Contractor
10. Flooring Contractor
11. Landscaping
12. Insulation/Foam Spray

**Each business type has:**
- AI schema (`businessSchemas/{type}.ai.json`)
- Behavior config (`behaviorSchemas/{type}.json`)
- Label structure (`labelSchemas/{type}.json`)

---

## 📊 Performance Considerations

### Caching Strategy

**Redis Cache:**
```
- OAuth tokens (1 hour TTL)
- Provider API responses (5 min TTL)
- User profiles (15 min TTL)
- Voice profiles (1 hour TTL)
```

**Supabase Caching:**
```
- Business schemas (in-memory, app lifecycle)
- Label mappings (5 min TTL)
```

### Database Optimization

**Indexes:**
- All foreign keys indexed
- Composite indexes on (user_id, created_at)
- Partial indexes for active workflows

**Query Optimization:**
```sql
-- Use materialized views for analytics
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT user_id, DATE(created_at), COUNT(*), AVG(processing_time)
FROM performance_metrics
GROUP BY user_id, DATE(created_at);
```

### Rate Limiting

**Gmail API:**
- 250 quota units/user/second
- 10,000 requests/day per user

**Outlook/Graph API:**
- 10,000 requests/10 minutes
- Retry with exponential backoff

**Implementation:**
```javascript
const retryConfig = {
  maxRetries: provider === 'outlook' ? 3 : 1,
  baseDelay: provider === 'outlook' ? 2000 : 1000,
  maxDelay: 10000
};
```

---

## 🚀 Deployment Architecture

### Production Environment (Coolify)

```
┌─────────────────────────────────────────┐
│        Coolify Orchestration             │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │   Frontend Container             │   │
│  │   - Nginx                        │   │
│  │   - React build                  │   │
│  │   - Port: 80                     │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │   Backend Container              │   │
│  │   - Node.js + Express            │   │
│  │   - Port: 3001                   │   │
│  └─────────────────────────────────┘   │
│                                          │
│  ┌─────────────────────────────────┐   │
│  │   Redis Container                │   │
│  │   - Redis 7-alpine               │   │
│  │   - Port: 6379                   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
            ↓ External Services
┌─────────────────────────────────────────┐
│  Supabase (Database + Edge Functions)   │
│  N8N VPS (Workflow Execution)            │
│  OpenAI API (AI Classification)          │
└─────────────────────────────────────────┘
```

### Health Checks

**Frontend:**
```nginx
GET / → 200 OK (Nginx health)
```

**Backend:**
```javascript
GET /health → {
  status: 'healthy',
  uptime: 12345,
  redis: 'connected',
  supabase: 'connected'
}
```

**Redis:**
```bash
redis-cli ping → PONG
```

---

## 🔄 Scalability Considerations

### Current Limitations
- Single N8N instance (VPS)
- Redis single-node
- Manual deployment process

### Future Scaling Path

**Phase 1: Horizontal Scaling (100-1000 users)**
- Load balancer for backend
- Redis cluster (3 nodes)
- Multiple N8N workers

**Phase 2: Microservices (1000-10000 users)**
- Separate services:
  - Auth Service
  - Workflow Service
  - Analytics Service
  - Voice Training Service
- Message queue (RabbitMQ/SQS)
- Dedicated cache layer

**Phase 3: Global Distribution (10000+ users)**
- Multi-region deployment
- CDN for frontend
- Edge computing for workflows
- Database sharding by user

---

## 📚 Key Technologies Reference

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend Framework | React | 19.2.0 | UI |
| Build Tool | Vite | 7.1.9 | Fast builds |
| CSS Framework | Tailwind CSS | 3.4.18 | Styling |
| UI Components | Radix UI | Various | Accessibility |
| Backend Framework | Express | 4.21.2 | API |
| Database | PostgreSQL | 15+ | Data storage |
| BaaS | Supabase | Latest | Auth, DB, Functions |
| Cache | Redis | 7 | Session, API cache |
| Workflow Engine | N8N | Latest | Email automation |
| AI Model | OpenAI GPT-4o-mini | Latest | Classification, Drafts |
| OAuth Providers | Google, Microsoft | OAuth 2.0 | Email access |

---

## 🎯 Architecture Decisions

### Why Supabase?
- Built-in authentication
- Row Level Security (RLS)
- Edge Functions for serverless logic
- PostgreSQL (familiar, powerful)
- Realtime subscriptions (future feature)

### Why N8N?
- Visual workflow builder
- Extensive integrations (Gmail, Outlook, OpenAI)
- Self-hosted option (data control)
- Workflow as code (JSON templates)
- Active community

### Why OpenAI?
- Best-in-class language models
- Good pricing for GPT-4o-mini
- Fine-tuning support (future)
- Reliable API
- JSON mode for structured output

### Why Redis?
- Fast session storage
- OAuth token caching
- API response caching
- Lightweight, battle-tested

---

## 📖 Related Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [API Documentation](docs/api/README.md)
- [Database Schema](supabase/migrations/README.md)
- [Contributing Guide](CONTRIBUTING.md)

---

**Last Review:** October 29, 2025  
**Maintained By:** FloWorx Team

