# Auto-Profile System Architecture Diagram

## Current System Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FLOWORX AUTO-PROFILE SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   BACKEND       │    │   DATABASE      │    │   EXTERNAL      │
│   (Vite)        │    │   (Express)     │    │   (Supabase)    │    │   SERVICES      │
│   Port 5174     │    │   Port 3000     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ React App       │    │ API Server      │    │ PostgreSQL      │    │ OpenAI API      │
│ (localhost:5174)│    │ (localhost:3000)│    │ (Supabase)      │    │ (GPT-4o-mini)   │
│                 │    │                 │    │                 │    │                 │
│ • OAuth Flow    │    │ • /api/ai/      │    │ • profiles      │    │ • Email Analysis│
│ • Business Info │    │   analyze-      │    │ • integrations  │    │ • Profile Extract│
│ • Auto-Prefill  │    │   business-     │    │ • extracted_    │    │ • Confidence    │
│ • Form Display  │    │   profile       │    │   business_     │    │   Scoring       │
│                 │    │ • /health       │    │   profiles      │    │                 │
│                 │    │ • /test         │    │ • ai_analysis_  │    │                 │
│                 │    │                 │    │   logs          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                                 ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ PROXY           │    │ AUTHENTICATION  │
                    │ Configuration   │    │ & VALIDATION    │
                    │                 │    │                 │
                    │ /api/* → 3000   │    │ • User Profile  │
                    │ CORS enabled    │    │ • OAuth Tokens  │
                    │ Change Origin   │    │ • Permissions   │
                    └─────────────────┘    └─────────────────┘
```

## Current Working Status

### ✅ WORKING COMPONENTS:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API SERVER    │    │   DATABASE      │    │   CORE LOGIC    │
│                 │    │                 │    │                 │
│ ✅ Port 3000    │    │ ✅ Supabase     │    │ ✅ Email Parse  │
│ ✅ Health Check │    │ ✅ Schema Fixed │    │ ✅ AI Analysis  │
│ ✅ Mock Profiles│    │ ✅ User Tables  │    │ ✅ Profile Gen  │
│ ✅ CORS Setup   │    │ ✅ RLS Policies │    │ ✅ Confidence   │
└─────────────────┘    └─────────────────┘    └─────────────────┘

### ⚠️ PARTIALLY WORKING:
┌─────────────────┐
│   FRONTEND      │
│                 │
│ ⚠️ Port 5174    │
│ ⚠️ Proxy Setup  │
│ ⚠️ TypeScript   │
│ ⚠️ OAuth Flow   │
└─────────────────┘

## Data Flow Sequence

```
1. USER ACTION
   │
   ▼
┌─────────────────┐
│ User completes  │
│ OAuth (Gmail/   │
│ Outlook)        │
└─────────────────┘
   │
   ▼
┌─────────────────┐
│ Navigate to     │
│ Business Info   │
│ Step            │
└─────────────────┘
   │
   ▼
┌─────────────────┐    ┌─────────────────┐
│ Frontend calls  │───▶│ API Server      │
│ /api/ai/analyze │    │ receives emails │
│ business-profile│    │ & user data     │
└─────────────────┘    └─────────────────┘
   │                           │
   ▼                           ▼
┌─────────────────┐    ┌─────────────────┐
│ Display "Analyze│    │ Fetch emails    │
│ My Emails" btn  │    │ from OAuth      │
│                 │    │ provider        │
└─────────────────┘    └─────────────────┘
   │                           │
   ▼                           ▼
┌─────────────────┐    ┌─────────────────┐
│ User clicks     │    │ Parse email     │
│ "Analyze"       │    │ content &       │
│                 │    │ signatures      │
└─────────────────┘    └─────────────────┘
   │                           │
   ▼                           ▼
┌─────────────────┐    ┌─────────────────┐
│ Show loading    │    │ Call OpenAI API │
│ spinner         │    │ for analysis    │
└─────────────────┘    └─────────────────┘
   │                           │
   ▼                           ▼
┌─────────────────┐    ┌─────────────────┐
│ Receive         │◀───│ Return structured│
│ structured      │    │ business profile│
│ profile JSON    │    │ with confidence │
└─────────────────┘    └─────────────────┘
   │
   ▼
┌─────────────────┐
│ Auto-prefill    │
│ form fields     │
│ with AI data    │
└─────────────────┘
   │
   ▼
┌─────────────────┐
│ User reviews    │
│ & edits data    │
└─────────────────┘
   │
   ▼
┌─────────────────┐
│ Save to         │
│ database        │
└─────────────────┘
```

## API Endpoints

### Backend API (Port 3000):
```
GET  /health                          - Health check
GET  /test                           - Test endpoint
POST /api/ai/analyze-business-profile - Main analysis endpoint
```

### Request Format:
```json
{
  "emails": [
    {
      "from": "user@example.com",
      "subject": "Business Email",
      "content": "Email body content...",
      "date": "2025-10-05T21:00:00Z"
    }
  ],
  "userId": "867894f7-bc68-4f27-8f93-b8f14d55304b",
  "provider": "outlook",
  "startTime": 1759692530525
}
```

### Response Format:
```json
{
  "success": true,
  "response": "Raw OpenAI response",
  "profile": {
    "company_name": {"value": "Test Company", "confidence": 0.95},
    "business_type": {"value": "Technology Services", "confidence": 0.88},
    "timezone": {"value": "America/New_York", "confidence": 0.90},
    "address": {"value": "123 Main St, New York, NY 10001", "confidence": 0.75},
    "phone": {"value": "+1-555-123-4567", "confidence": 0.85},
    "website": {"value": "https://testcompany.com", "confidence": 0.92},
    "email": {"value": "info@testcompany.com", "confidence": 0.98}
  },
  "model": "gpt-4o-mini",
  "timestamp": "2025-10-05T21:15:00.000Z"
}
```

## Database Schema

### Core Tables:
```sql
-- User profiles
profiles (
  id UUID PRIMARY KEY,
  email VARCHAR,
  onboarding_step VARCHAR,
  client_config JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- OAuth integrations
integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  provider VARCHAR, -- 'gmail' or 'outlook'
  access_token TEXT,
  refresh_token TEXT,
  status VARCHAR,
  created_at TIMESTAMP
)

-- Extracted business profiles
extracted_business_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  profile_data JSONB,
  form_data JSONB,
  extracted_at TIMESTAMP,
  analysis_status VARCHAR
)

-- AI analysis logs
ai_analysis_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  analysis_type VARCHAR,
  input_data JSONB,
  output_data JSONB,
  model_used VARCHAR,
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  status VARCHAR,
  created_at TIMESTAMP
)
```

## Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# Supabase Configuration
VITE_SUPABASE_URL=https://oinxzvqszingwstrbdro.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration
API_PORT=3000
VITE_PORT=5174
```

## Current Issues & Solutions

### ❌ Issues:
1. **Vite Frontend**: Port conflicts, TypeScript compilation errors
2. **OpenAI API**: Invalid API key (401 error)
3. **Database**: Some schema mismatches

### ✅ Solutions Applied:
1. **Port Configuration**: Changed Vite to port 5174
2. **TypeScript Fixes**: Removed interfaces from JS files
3. **Database Fixes**: Removed subscription_status dependency
4. **Mock Responses**: Using simple-api-server.js for testing

### 🎯 Next Steps:
1. Fix OpenAI API key
2. Ensure Vite starts cleanly
3. Test complete OAuth → Analysis → Prefill flow
4. Deploy to production
