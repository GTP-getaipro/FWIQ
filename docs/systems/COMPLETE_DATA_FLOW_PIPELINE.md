# 🧭 Complete Data Flow Pipeline: Onboarding → AI Configuration → n8n Workflow Export

## 🎯 Overview

This document provides the **complete technical architecture map** showing how Floworx gathers business data, generates AI configurations, and assembles the final n8n export. The entire pipeline from user onboarding to production-ready n8n workflow is documented here.

## 🏆 System Architecture Summary

**Title:** "AI Business Setup → n8n JSON Workflow Generation"

**Purpose:** Complete automation pipeline that transforms business onboarding data into production-ready n8n workflows with industry-specific AI intelligence.

---

## 🧩 **STAGE 1: ONBOARDING STAGE – DATA GATHERING**

### **User Interface:** Onboarding Wizard (React/Vue Web App)

**Purpose:** Collects all business and operational information needed for AI configuration.

#### **Input Data Collected:**

| Category | Description | Example |
|----------|-------------|---------|
| **Business Info** | Core identity and service details | "The Hot Tub Man Ltd", "Roofing Contractor", `Alberta`, `CAD` |
| **Contact Info** | Primary and emergency contacts | Admin name, role, email, after-hours line |
| **CRM Config** | CRM type and notification emails | `ServiceTitan`, `alerts@servicetitan.com` |
| **Business Hours** | Operating schedule | M–F 9–5, Sat 10–4 |
| **AI Config** | Tone, signature style, pricing visibility | Professional, Warm, Includes Signature |
| **Team** | Managers and suppliers | "Hailey", "Stacie", "Strong Spas" |
| **Services** | Key services offered | Diagnostics, Sales, Maintenance, Emergency |
| **Rules** | Escalation and SLA rules | "24h response", escalate after 4h |
| **Industry Selection** | Defines label + behavior JSON to use | HVAC, Roofing, Painting, etc. |

#### **✅ Output:**
→ **Business Profile JSON** saved as `/jsons/business/{businessId}.json`

**Example Business Profile:**
```json
{
  "businessId": "hottubman_001",
  "businessName": "The Hot Tub Man Ltd",
  "category": "Pools & Spas",
  "emailProvider": "gmail",
  "emailDomain": "hottubman.ca",
  "timezone": "America/Edmonton",
  "currency": "CAD",
  "contactInfo": {
    "primaryContactName": "John Smith",
    "primaryContactRole": "Owner",
    "primaryEmail": "john@hottubman.ca",
    "afterHoursSupportLine": "780-555-0123"
  },
  "team": {
    "managers": [
      { "name": "Hailey", "email": "hailey@hottubman.ca", "role": "Manager" },
      { "name": "Stacie", "email": "stacie@hottubman.ca", "role": "Assistant Manager" }
    ],
    "suppliers": [
      { "name": "Strong Spas", "email": "orders@strongspas.com" },
      { "name": "Pool Supply Co", "email": "sales@poolsupply.com" }
    ]
  },
  "services": [
    { "name": "Pool Opening", "category": "Maintenance", "pricing": "Fixed" },
    { "name": "Water Testing", "category": "Service", "pricing": "Hourly" },
    { "name": "Emergency Repair", "category": "Emergency", "pricing": "Fixed" }
  ],
  "aiConfig": {
    "toneOfVoice": "Professional",
    "allowPricingInReplies": true,
    "includeSignature": true,
    "signatureTemplate": "Best regards,\n{{businessName}} Team\n{{afterHoursSupportLine}}"
  },
  "businessRules": {
    "responseSLA": "24h",
    "escalationPolicy": "Escalate after 4h if no response",
    "businessHours": "M-F 9-5, Sat 10-4",
    "crmProvider": "ServiceTitan",
    "crmAlertEmails": ["alerts@servicetitan.com"]
  }
}
```

---

## 🧠 **STAGE 2: AI BEHAVIOR GENERATION STAGE**

### **AI Config Generator Module**

**Purpose:** Builds **AI Response Behavior JSON** based on industry, tone, and selected rules.

#### **Inputs:**
- `businessProfile.category` → e.g., "Pools & Spas"
- `businessProfile.aiConfig` → tone, signature, upsell rules
- `services[]` and `rules[]`

#### **Process:**
1. Load industry-specific behavior template
2. Apply business-specific customizations
3. Generate dynamic placeholders
4. Validate behavior configuration

#### **✅ Output:**
→ `/jsons/behavior/{industry}.json`

**Example Behavior JSON:**
```json
{
  "meta": {
    "schemaVersion": "v2.0",
    "industry": "Pools & Spas",
    "author": "AI Config Generator",
    "lastUpdated": "2025-10-05T00:00:00Z"
  },
  "voiceProfile": {
    "tone": "Relaxed, friendly, and water-focused",
    "formalityLevel": "casual",
    "allowPricingInReplies": true,
    "includeSignature": true
  },
  "signature": {
    "closingText": "Enjoy your crystal-clear water!",
    "signatureBlock": "Best regards,\n{{businessProfile.businessName}} Team\n{{contactInfo.afterHoursSupportLine}}"
  },
  "aiDraftRules": {
    "behaviorGoals": [
      "Help customers maintain perfect water chemistry",
      "Provide seasonal care guidance",
      "Offer equipment maintenance solutions",
      "Ensure safe and enjoyable water experiences"
    ],
    "autoReplyPolicy": {
      "enableForCategories": ["Support", "Sales", "Maintenance", "Water Care"],
      "minConfidence": 0.75,
      "excludeInternalDomains": ["@hottubman.ca"]
    },
    "followUpGuidelines": {
      "acknowledgeDelay": true,
      "requireNextStep": true,
      "preferredPhrasing": [
        "We'll test your water and provide a detailed chemical balance report.",
        "Your pool will be ready for swimming in no time!",
        "Let's get your water chemistry back to perfect balance."
      ]
    },
    "upsellGuidelines": {
      "enabled": true,
      "triggerCategories": ["Maintenance", "Water Care"],
      "text": "We can also check your filters, pumps, and heaters while we're there — keeping everything running efficiently."
    }
  }
}
```

---

## 🏷️ **STAGE 3: LABEL MAP GENERATION STAGE**

### **Label Schema Generator**

**Purpose:** Builds Gmail/Outlook label hierarchy and routing map.

#### **Inputs:**
- Industry type (e.g. `Pools & Spas`, `HVAC`)
- Business team + suppliers
- Rules + escalation policy

#### **Process:**
1. Load industry-specific label template
2. Apply business-specific team/supplier data
3. Generate dynamic manager/supplier placeholders
4. Validate label structure

#### **✅ Output:**
→ `/jsons/labels/{industry}.json`

**Example Label Schema:**
```json
{
  "meta": {
    "schemaVersion": "v2.0",
    "industry": "Pools & Spas",
    "author": "AI Config Generator",
    "lastUpdated": "2025-10-05T00:00:00Z"
  },
  "description": "Label schema for pools & spas businesses — supports water care, maintenance, equipment, and supplier management.",
  "rootOrder": [
    "BANKING", "FORMSUB", "GOOGLE REVIEW", "MANAGER", "SALES", 
    "SUPPLIERS", "SUPPORT", "URGENT", "WATER_CARE", "MISC", 
    "PHONE", "PROMO", "RECRUITMENT"
  ],
  "labels": [
    {
      "name": "WATER_CARE",
      "intent": "ai.water_care",
      "color": { "backgroundColor": "#4caf50", "textColor": "#ffffff" },
      "sub": [
        { "name": "Chemical Balance" },
        { "name": "Water Testing" },
        { "name": "Filter Maintenance" },
        { "name": "Equipment Issues" }
      ]
    },
    {
      "name": "SUPPLIERS",
      "intent": "ai.vendor_communication",
      "color": { "backgroundColor": "#ffad47", "textColor": "#000000" },
      "sub": [
        { "name": "Strong Spas" },
        { "name": "Pool Supply Co" },
        { "name": "{{Supplier1}}" },
        { "name": "{{Supplier2}}" }
      ]
    },
    {
      "name": "MANAGER",
      "intent": "ai.internal_routing",
      "color": { "backgroundColor": "#ffad47", "textColor": "#000000" },
      "sub": [
        { "name": "Unassigned" },
        { "name": "Escalations" },
        { "name": "Hailey" },
        { "name": "Stacie" }
      ]
    }
  ],
  "dynamicVariables": {
    "managers": ["Hailey", "Stacie"],
    "suppliers": ["Strong Spas", "Pool Supply Co"]
  }
}
```

---

## ⚙️ **STAGE 4: CONFIG AGGREGATION STAGE**

### **Config Compiler**

**Purpose:** Merges all configs into a single unified JSON object that n8n can ingest.

#### **Process:**
```javascript
const business = load('/jsons/business/hottubman_001.json');
const behavior = load(`/jsons/behavior/${business.category}.json`);
const labels = load(`/jsons/labels/${business.category}.json`);

const compiledConfig = {
  ...business,
  aiBehavior: behavior,
  labelSchema: labels,
  meta: {
    compiledAt: new Date().toISOString(),
    version: "1.0.0",
    source: "onboarding-pipeline"
  }
};

return compiledConfig;
```

#### **✅ Output:**
→ `compiledConfig.json` saved as `/jsons/compiled/{businessId}_compiled.json`

---

## 🔑 **STAGE 5: CREDENTIAL SETUP STAGE**

### **OAuth Handling for Gmail/Outlook**

#### **Process:**
1. During onboarding, user grants OAuth access
2. n8n automatically saves the credential in `Credentials > {BusinessName}_Gmail` or `{BusinessName}_Outlook`
3. The credential ID is stored in the compiled JSON

#### **Credential Storage:**
```json
{
  "credentials": {
    "gmail": "gmail-hottubman-ca-credential-id",
    "outlook": null
  },
  "oauthData": {
    "access_token": "ya29.oauth_token",
    "refresh_token": "1//refresh_token",
    "expires_in": 3599,
    "token_type": "Bearer"
  }
}
```

---

## 🧩 **STAGE 6: WORKFLOW ASSEMBLY STAGE**

### **n8n JSON Builder**

**Purpose:** Injects compiled configs into a **workflow template**.

#### **Process Flow:**
1. Load **workflow base template** (nodes + connections)
2. Inject configurations:
   - `AI behavior system message` → in **AI Draft Node**
   - `Label map` → in **Dynamic Label Generator Node**
   - `OAuth credential reference` → in **Gmail/Outlook Trigger Node**
   - `Business info (signature, tone)` → in **AI Prompt Node**
3. Auto-generate workflow name: `AI_Workflow_{businessProfile.businessName}_{industry}.json`

#### **Workflow Template Injection:**
```javascript
// Load base workflow template
const baseWorkflow = loadWorkflowTemplate('base-template.json');

// Inject AI behavior into AI Draft Node
const aiDraftNode = baseWorkflow.nodes.find(node => node.name === 'AI Draft Generator');
aiDraftNode.parameters.systemMessage = JSON.stringify(compiledConfig.aiBehavior, null, 2);

// Inject label schema into Dynamic Label Generator
const labelNode = baseWorkflow.nodes.find(node => node.name === 'Dynamic Label Generator');
labelNode.parameters.labelSchema = compiledConfig.labelSchema;

// Inject credential into Gmail Trigger
const gmailTrigger = baseWorkflow.nodes.find(node => node.name === 'Gmail Trigger');
gmailTrigger.credentials.gmailOAuth2Api = {
  id: compiledConfig.credentials.gmail,
  name: `gmail-${compiledConfig.emailDomain.replace('.', '-')}`
};

// Update workflow metadata
baseWorkflow.name = `AI Workflow - ${compiledConfig.businessName} (${compiledConfig.category})`;
baseWorkflow.tags = [
  { id: `business-${compiledConfig.businessId}`, name: `Business: ${compiledConfig.businessName}` },
  { id: `industry-${compiledConfig.category.toLowerCase().replace(/\s+/g, '-')}`, name: `Industry: ${compiledConfig.category}` }
];
```

#### **✅ Output:**
→ Final `n8n.json` saved to `/exports/{businessId}/n8n.workflow.json`

---

## 🚀 **STAGE 7: DEPLOYMENT STAGE**

### **Workflow Deployment**

#### **Options:**

**Option A: Auto-upload to n8n via API**
```bash
POST /rest/workflows
Content-Type: application/json
Authorization: Bearer {n8n_api_key}

{
  "name": "AI Workflow - The Hot Tub Man Ltd (Pools & Spas)",
  "active": true,
  "nodes": [...],
  "connections": {...}
}
```

**Option B: Provide download link to user's dashboard**
- Generate secure download link
- User downloads and imports manually
- Track deployment status

---

## 🧩 **VISUAL FLOW DIAGRAM**

### **Complete Data Flow Pipeline:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   🧭 ONBOARDING │    │  📄 BUSINESS    │    │ 🤖 AI BEHAVIOR  │
│      WIZARD     │───▶│     PROFILE     │───▶│   GENERATOR     │
│   (React/Vue)   │    │     JSON        │    │     MODULE      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 🏷️ LABEL SCHEMA │    │ ⚙️ CONFIG       │    │ 🔑 CREDENTIAL   │
│   GENERATOR     │───▶│   COMPILER      │◀───│     SETUP       │
│     MODULE      │    │     MODULE      │    │ (OAuth Handler) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 🧩 N8N WORKFLOW │    │ 💾 FINAL EXPORT │    │ 🚀 DEPLOYMENT   │
│     BUILDER     │───▶│   (n8n.json)    │───▶│     STAGE       │
│     MODULE      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Detailed Process Flow:**

```
[User Onboarding]
    ↓ Collects business data
[Business Profile JSON]
    ↓ Triggers AI config generation
[AI Behavior Generator]
    ↓ Loads industry template + applies customizations
[Behavior JSON]
    ↓ Triggers label schema generation
[Label Schema Generator]
    ↓ Loads industry template + applies team/supplier data
[Label Schema JSON]
    ↓ All configs ready
[Config Compiler]
    ↓ Merges all JSONs into unified config
[Compiled Config JSON]
    ↓ OAuth credentials obtained
[Credential Setup]
    ↓ Credentials stored in compiled config
[n8n Workflow Builder]
    ↓ Injects configs into workflow template
[Final n8n.json Export]
    ↓ Ready for deployment
[Deployment Stage]
    ↓ Auto-upload to n8n or download link
[Production n8n Workflow]
```

---

## 📦 **Example Directory Structure**

```
/jsons/
├── business/
│   ├── hottubman_001.json
│   ├── skyline_roofing_002.json
│   └── greenlandscape_003.json
├── behavior/
│   ├── _template.json
│   ├── pools_spas.json
│   ├── roofing_contractor.json
│   ├── hvac.json
│   ├── landscaping.json
│   └── painting_contractor.json
├── labels/
│   ├── _template.json
│   ├── pools_spas.json
│   ├── roofing_contractor.json
│   ├── hvac.json
│   ├── landscaping.json
│   └── painting_contractor.json
└── compiled/
    ├── hottubman_001_compiled.json
    ├── skyline_roofing_002_compiled.json
    └── greenlandscape_003_compiled.json

/exports/
├── hottubman_001/
│   └── n8n.workflow.json
├── skyline_roofing_002/
│   └── n8n.workflow.json
└── greenlandscape_003/
    └── n8n.workflow.json

/src/
├── lib/
│   ├── unifiedEmailProvisioning.ts
│   ├── aiJsonSchemaLoader.js
│   └── dynamicLabelProvisioningManager.js
├── scripts/
│   ├── validate-behavior-json.ts
│   └── validate-label-schema.ts
├── behaviorSchemas/
│   └── [industry behavior JSONs]
└── labelSchemas/
    └── [industry label JSONs]
```

---

## 🎯 **Key Benefits of This Architecture**

### **✅ Complete Automation**
- **Zero Manual Editing** - Entire pipeline automated from onboarding to n8n export
- **Industry-Specific Intelligence** - Each business gets tailored AI behavior and labels
- **Dynamic Configuration** - All configs generated based on business data

### **✅ Scalability**
- **Unlimited Industries** - Add new industries by creating behavior/label templates
- **Multi-Tenant Ready** - Each business gets isolated configuration
- **Template-Based** - Consistent structure across all industries

### **✅ Production Ready**
- **Comprehensive Validation** - All configs validated before deployment
- **Error Handling** - Complete rollback system for failed operations
- **Cross-Platform Support** - Works with Gmail and Outlook

### **✅ Developer Friendly**
- **Clear Separation** - Each stage has distinct responsibilities
- **Modular Design** - Easy to extend and maintain
- **Comprehensive Testing** - Full test coverage for all components

---

## 🚀 **Implementation Status**

| Stage | Component | Status | Description |
|-------|-----------|--------|-------------|
| **1** | Onboarding Wizard | ✅ Complete | React/Vue web app collecting business data |
| **2** | AI Behavior Generator | ✅ Complete | Generates industry-specific AI behavior JSONs |
| **3** | Label Schema Generator | ✅ Complete | Generates industry-specific label schemas |
| **4** | Config Compiler | ✅ Complete | Merges all configs into unified JSON |
| **5** | Credential Setup | ✅ Complete | OAuth handling for Gmail/Outlook |
| **6** | n8n Workflow Builder | ✅ Complete | Injects configs into workflow template |
| **7** | Deployment Stage | ✅ Complete | Auto-upload or download deployment |

---

## 🎉 **Summary**

This **complete data flow pipeline** provides:

- **✅ End-to-End Automation** - From user onboarding to production n8n workflow
- **✅ Industry-Specific Intelligence** - Tailored AI behavior and labels per business type
- **✅ Zero Manual Editing** - Entire process automated with validation
- **✅ Scalable Architecture** - Supports unlimited industries and business types
- **✅ Production Ready** - Comprehensive error handling and rollback systems
- **✅ Cross-Platform Support** - Works with Gmail and Outlook
- **✅ Developer Friendly** - Clear separation of concerns and modular design

The system successfully transforms **raw business data** into **production-ready n8n workflows** with industry-specific AI intelligence, making Floworx truly **multi-business adaptable** with complete automation! 🚀🧠
