# 🧭 Floworx Multi-Business n8n Architecture Blueprint

## 🎯 Overview: End-to-End Flow

```
Onboarding UI  →  n8n Webhook (Data Intake)
                         ↓
                  Business Config Builder
                    (merge JSONs)
                         ↓
                Validate + Store Config
                         ↓
                 Email Runtime Workflow
     (classifier + responder use same config)
```

## 🧩 PHASE 1 — Onboarding Integration Flow

### 🔹 1. Webhook: "Onboarding Data Ingest"

**Node Type:** Webhook (POST)  
**Purpose:** Receives the completed onboarding data from Floworx onboarding app.

📥 **Example Input JSON:**
```json
{
  "businessType": "Pools & Spas",
  "businessProfile": {
    "businessName": "The Hot Tub Man Ltd",
    "category": "Pools & Spas",
    "timezone": "Canada/Mountain",
    "currency": "CAD",
    "emailDomain": "thehottubman.ca",
    "crmProvider": "ServiceTitan"
  },
  "team": {
    "managers": [
      {"name": "John Smith", "email": "john@thehottubman.ca", "role": "Owner"},
      {"name": "Sarah Johnson", "email": "sarah@thehottubman.ca", "role": "Manager"}
    ],
    "suppliers": [
      {"name": "Strong Spas", "email": "orders@strongspas.com"},
      {"name": "Pool Supply Co", "email": "sales@poolsupply.com"}
    ]
  },
  "services": [
    {"name": "Pool Opening", "category": "Maintenance", "pricing": "Fixed"},
    {"name": "Heater Repair", "category": "Repair", "pricing": "Hourly"}
  ]
}
```

**n8n Node Name:** `Webhook → Onboarding Intake`

---

### 🔹 2. HTTP Request Nodes — Load Industry Templates

You'll have **3 static JSONs** hosted per business type:

* `/labelSchema.json`
* `/classifierBehavior.json` 
* `/responderBehavior.json`

**Nodes:**

```
GET https://cdn.floworx.ai/schemas/{{ $json.businessType }}/labelSchema.json
GET https://cdn.floworx.ai/schemas/{{ $json.businessType }}/classifierBehavior.json
GET https://cdn.floworx.ai/schemas/{{ $json.businessType }}/responderBehavior.json
```

✅ **Output:** three distinct JSONs for that business type.

**n8n Node Names:**
* `Fetch Label Schema`
* `Fetch Classifier Behavior`
* `Fetch Responder Behavior`

---

### 🔹 3. Set Node — Profile Metadata

Use a **Set Node** to clean up incoming profile data.

**Output JSON:**
```json
{
  "profile": {
    "businessName": "The Hot Tub Man Ltd",
    "category": "Pools & Spas",
    "timezone": "Canada/Mountain",
    "currency": "CAD",
    "emailDomain": "thehottubman.ca",
    "crmProvider": "ServiceTitan"
  },
  "team": {
    "managers": [
      {"name": "John Smith", "email": "john@thehottubman.ca", "role": "Owner"},
      {"name": "Sarah Johnson", "email": "sarah@thehottubman.ca", "role": "Manager"}
    ],
    "suppliers": [
      {"name": "Strong Spas", "email": "orders@strongspas.com"},
      {"name": "Pool Supply Co", "email": "sales@poolsupply.com"}
    ]
  },
  "services": [
    {"name": "Pool Opening", "category": "Maintenance", "pricing": "Fixed"},
    {"name": "Heater Repair", "category": "Repair", "pricing": "Hourly"}
  ]
}
```

**n8n Node Name:** `Format Profile`

---

### 🔹 4. Code Node — Merge All JSONs

```javascript
const profile = $json["profile"];
const team = $json["team"];
const services = $json["services"];
const labels = $json["Fetch Label Schema"];
const classifier = $json["Fetch Classifier Behavior"];
const responder = $json["Fetch Responder Behavior"];

// Merge dynamic variables into labels
const mergedLabels = labels.labels.map(label => {
  if (label.name === "MANAGER") {
    return {
      ...label,
      sub: team.managers.map(manager => ({
        name: manager.name,
        email: manager.email,
        role: manager.role
      }))
    };
  }
  if (label.name === "SUPPLIERS") {
    return {
      ...label,
      sub: team.suppliers.map(supplier => ({
        name: supplier.name,
        email: supplier.email
      }))
    };
  }
  return label;
});

return {
  json: {
    businessType: profile.category,
    profile,
    team,
    services,
    labels: {
      ...labels,
      labels: mergedLabels
    },
    classifierBehavior: classifier,
    responderBehavior: responder,
    meta: {
      schemaVersion: "v2.0",
      collectedAt: new Date().toISOString(),
      source: "onboarding-ui",
      validated: true
    }
  }
};
```

**n8n Node Name:** `Build Unified Config JSON`

---

### 🔹 5. Validation Node (Optional)

Add another **Code Node** to validate structure.

```javascript
const data = $json;
const errors = [];

// Validate required fields
if (!data.profile || !data.profile.businessName) {
  errors.push("Missing business name");
}
if (!data.classifierBehavior || !data.classifierBehavior.categories) {
  errors.push("Missing classifier behavior");
}
if (!data.responderBehavior || !data.responderBehavior.toneProfile) {
  errors.push("Missing responder behavior");
}
if (!data.labels || !data.labels.labels) {
  errors.push("Missing labels schema");
}

if (errors.length > 0) {
  throw new Error(`Validation failed: ${errors.join(", ")}`);
}

return { 
  json: { 
    valid: true, 
    data,
    validationErrors: []
  } 
};
```

**n8n Node Name:** `Validate Config Schema`

---

### 🔹 6. Store Config (Persistent Storage)

Store your full unified JSON into:

#### Option A: n8n Data Store
Use "Data Store" node
→ Key = `businessEmailDomain`
→ Value = unified JSON

#### Option B: External API (Preferred for Scaling)
POST to your backend:

```
POST https://api.floworx.ai/business-configs
```

Payload:
```json
{
  "domain": "thehottubman.ca",
  "config": {{ $json }}
}
```

✅ **Response Example:**
```json
{ 
  "configId": "floworx_789a5f", 
  "status": "stored",
  "domain": "thehottubman.ca"
}
```

**n8n Node Name:** `Store Business Config`

---

### 🔹 7. Confirmation Response

Send confirmation back to the onboarding app:

```json
{
  "status": "success",
  "message": "Business configuration stored successfully",
  "configId": "floworx_789a5f",
  "domain": "thehottubman.ca"
}
```

**n8n Node Name:** `Return Success Response`

---

## ⚡ PHASE 2 — Runtime Email Processing Flow

When an email arrives (via Gmail or Outlook trigger), the same unified JSON powers classification + reply generation.

---

### 🔹 1. Gmail Trigger: New Email Received

**Node Type:** Gmail Trigger  
**Output:** Full email metadata + body HTML/text.

**Example Output:**
```json
{
  "id": "1764b1234567890",
  "threadId": "1764b1234567890",
  "from": "customer@example.com",
  "to": "info@thehottubman.ca",
  "subject": "Pool heater not working",
  "body": "Hi, my pool heater stopped working yesterday...",
  "date": "2025-01-05T10:30:00Z"
}
```

---

### 🔹 2. HTTP Request — Fetch Config

Lookup config using sender's business domain:

```
GET https://api.floworx.ai/business-configs?domain=thehottubman.ca
```

✅ Returns full JSON built in onboarding:

```json
{
  "businessType": "Pools & Spas",
  "profile": {
    "businessName": "The Hot Tub Man Ltd",
    "category": "Pools & Spas",
    "timezone": "Canada/Mountain",
    "currency": "CAD",
    "emailDomain": "thehottubman.ca",
    "crmProvider": "ServiceTitan"
  },
  "labels": {
    "labels": [
      {
        "name": "SUPPORT",
        "intent": "ai.support_ticket",
        "color": {"backgroundColor": "#4285f4", "textColor": "#ffffff"},
        "sub": [
          {"name": "Technical Support"},
          {"name": "Appointment Scheduling"},
          {"name": "General"}
        ]
      }
    ]
  },
  "classifierBehavior": {
    "industry": "Pools & Spas",
    "categories": {
      "Support": ["Technical Support", "Appointment Scheduling", "General"],
      "Sales": ["New Installations", "Consultations", "Service Agreements"],
      "Urgent": ["Emergency Repair", "Safety Issue", "Equipment Failure"]
    }
  },
  "responderBehavior": {
    "toneProfile": {
      "default": "Professional and friendly",
      "urgent": "Concise, direct, and reassuring",
      "support": "Helpful and empathetic"
    }
  }
}
```

**n8n Node Name:** `Fetch Business Config`

---

### 🔹 3. LangChain Node — AI Master Classifier

**Node Type:** `@n8n/n8n-nodes-langchain.agent`

**Inputs:**
* Email body (from Gmail)
* Classification JSON from `config.classifierBehavior`
* Business profile context

**PromptType:** `define`  
**Purpose:** Classify incoming email and output structured JSON with category, confidence, entities, etc.

**System Message:**
```
You are an expert email classification agent for {{ $json.profile.businessName }}, a {{ $json.businessType }} company. 

Analyze the incoming email and classify it according to these categories:
{{ $json.classifierBehavior.categories }}

Output a JSON with:
- summary: One-line summary of email purpose
- primary_category: Main category
- secondary_category: Subcategory or null
- confidence: Float 0.0-1.0
- ai_can_reply: Boolean
- entities: Extracted contact info, service details, etc.
```

**Output Example:**
```json
{
  "summary": "Customer reporting heater failure",
  "primary_category": "Support",
  "secondary_category": "TechnicalSupport",
  "confidence": 0.92,
  "ai_can_reply": true,
  "entities": {
    "contact_name": "Sarah Johnson",
    "phone_number": "555-1234",
    "equipment_model": "Pool Heater",
    "service_address": "123 Main St"
  }
}
```

**n8n Node Name:** `AI Master Classifier`

---

### 🔹 4. LangChain Node — Draft Response Generator

**Node Type:** `@n8n/n8n-nodes-langchain.agent`

**Inputs:**
* Classification JSON (from previous node)
* Email context
* Response behavior rules (from `config.responderBehavior`)
* Profile/team (from `config.profile`)

**PromptType:** `generate`  
**Purpose:** Create a professional, context-aware draft reply.

**System Message:**
```
You are {{ $json.profile.businessName }}'s AI assistant. Generate a professional email response based on:

Business Context:
- Company: {{ $json.profile.businessName }}
- Industry: {{ $json.businessType }}
- Timezone: {{ $json.profile.timezone }}
- Currency: {{ $json.profile.currency }}

Tone Profile:
{{ $json.responderBehavior.toneProfile }}

Classification:
- Category: {{ $json.primary_category }}
- Subcategory: {{ $json.secondary_category }}
- Confidence: {{ $json.confidence }}

Generate a response that:
1. Acknowledges the customer's concern
2. Provides helpful information
3. Offers next steps
4. Maintains professional tone
5. Includes appropriate signature
```

**Output Example:**
```json
{
  "reply_text": "Hi Sarah, thanks for reaching out about your pool heater issue. We understand how frustrating this can be, especially during the winter months. Our technical team can help diagnose and repair your heater quickly. I'll have our lead technician, John Smith, contact you within the next 2 hours to schedule a service call. In the meantime, please ensure the heater is turned off for safety. Best regards, The Hot Tub Man Ltd Team",
  "tone": "Professional",
  "confidence": 0.95,
  "suggested_actions": ["Schedule service call", "Send technician contact info"]
}
```

**n8n Node Name:** `AI Draft Generator`

---

### 🔹 5. Gmail Node — Create Draft or Send

If `ai_can_reply = true`, create a Gmail draft for human review (or auto-send if confidence ≥ 0.9).

**Decision Logic:**
```javascript
const confidence = $json.confidence;
const aiCanReply = $json.ai_can_reply;

if (aiCanReply && confidence >= 0.9) {
  // Auto-send high confidence replies
  return { action: "send", reply: $json.reply_text };
} else if (aiCanReply && confidence >= 0.75) {
  // Create draft for review
  return { action: "draft", reply: $json.reply_text };
} else {
  // Route to human
  return { action: "route_to_human" };
}
```

**n8n Node Name:** `Gmail Action Decision`

---

### 🔹 6. Logging + Analytics

Store classification + response stats back to your Floworx analytics DB:

```json
{
  "threadId": "1764b1234567890",
  "businessDomain": "thehottubman.ca",
  "classification": "Support.TechnicalSupport",
  "confidence": 0.92,
  "ai_can_reply": true,
  "response_length": 184,
  "processing_time_ms": 4221,
  "timestamp": "2025-01-05T10:35:00Z"
}
```

**n8n Node Name:** `Analytics Logging`

---

## 🧱 ARCHITECTURE LAYERS SUMMARY

| Layer | Description | Example Artifact |
|-------|-------------|------------------|
| **1. Business Config** | Master JSON built on onboarding | `config.json` |
| **2. Classifier Behavior** | Category mapping + logic | `classifierBehavior.json` |
| **3. Responder Behavior** | Tone, rules, examples | `responderBehavior.json` |
| **4. Labels Schema** | Gmail/Outlook folder setup | `labelSchema.json` |
| **5. Runtime Pipeline** | n8n workflow using above | `Floworx_Classifier_Response_Workflow` |

---

## 📊 Visual Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FLOWORX n8n ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────────┘

PHASE 1: ONBOARDING INTEGRATION FLOW
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  [Onboarding UI]                                                                │
│         ↓ (POST JSON)                                                           │
│  [Webhook: Onboarding Intake]                                                   │
│         ↓                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    HTTP Request Nodes                                  │    │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │    │
│  │  │ Fetch Label      │ │ Fetch Classifier│ │ Fetch Responder  │         │    │
│  │  │ Schema           │ │ Behavior        │ │ Behavior        │         │    │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│         ↓                                                                       │
│  [Set Node: Format Profile]                                                    │
│         ↓                                                                       │
│  [Code Node: Build Unified Config JSON]                                        │
│         ↓                                                                       │
│  [Code Node: Validate Config Schema]                                            │
│         ↓                                                                       │
│  [Store Business Config]                                                       │
│         ↓                                                                       │
│  [Return Success Response]                                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

PHASE 2: RUNTIME EMAIL PROCESSING FLOW
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  [Gmail Trigger: New Email]                                                     │
│         ↓                                                                       │
│  [HTTP Request: Fetch Business Config]                                          │
│         ↓                                                                       │
│  [LangChain Node: AI Master Classifier]                                        │
│         ↓                                                                       │
│  [LangChain Node: AI Draft Generator]                                           │
│         ↓                                                                       │
│  [Gmail Node: Action Decision]                                                  │
│         ↓                                                                       │
│  [Analytics Logging]                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

DATA FLOW INTEGRATION POINTS
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  Business Profile JSON ←→ Industry Behavior JSONs ←→ Unified Config JSON      │
│         ↓                           ↓                           ↓               │
│  Dynamic Variables          Classification Rules        Runtime Processing      │
│  (Managers, Suppliers)      (Categories, Keywords)     (AI Classification)    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### Environment Variables Required

```bash
# API Endpoints
FLOWORX_API_BASE_URL=https://api.floworx.ai
FLOWORX_CDN_BASE_URL=https://cdn.floworx.ai

# Gmail Integration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token

# LangChain Configuration
OPENAI_API_KEY=your_openai_api_key
LANGCHAIN_MODEL=gpt-4o-mini

# Database/Storage
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
```

### n8n Node Configuration Examples

#### Webhook Node Configuration
```json
{
  "name": "Onboarding Intake",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "onboarding-intake",
    "httpMethod": "POST",
    "responseMode": "responseNode"
  }
}
```

#### LangChain Classifier Node Configuration
```json
{
  "name": "AI Master Classifier",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "model": "gpt-4o-mini",
    "promptType": "define",
    "systemMessage": "You are an expert email classification agent...",
    "temperature": 0.1,
    "maxTokens": 1000
  }
}
```

---

## 🚀 Next Steps

1. **Generate n8n Workflow Export** - Complete JSON for direct import
2. **Create API Endpoints** - Backend services for config storage/retrieval
3. **Test Integration** - Validate end-to-end flow with sample data
4. **Deploy to Production** - Scale across multiple business types

This architecture provides the **master blueprint** for Floworx's multi-business AI email automation system! 🎯
