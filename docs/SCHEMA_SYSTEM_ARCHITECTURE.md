# Schema System Architecture - Complete Guide

## 🎯 **Two-Layer Schema System**

FloworxV2 uses **two complementary schema systems** that work together:

---

## 📊 **Layer 1: Business AI Schemas** (`src/businessSchemas/*.ai.json`)

### **Purpose:** Instruct the AI classifier in n8n workflows

### **Contains:**
- ✅ **AI Keywords** - Classification intelligence ("spark" → URGENT)
- ✅ **AI Prompts** - System messages & reply templates
- ✅ **Tone Profiles** - How AI should respond (professional, urgent, friendly)
- ✅ **Intent Mapping** - ai.emergency_request → URGENT label
- ✅ **Escalation Rules** - SLA thresholds, auto-reply settings
- ✅ **Confidence Thresholds** - When AI can auto-reply
- ✅ **Environment Variables** - For n8n workflow configuration
- ✅ **Label Schema** - Embedded label structure (same as Layer 2)

### **Used By:**
- n8n workflow AI Agent nodes
- Email classification system
- Auto-reply decision engine
- Escalation routing logic

### **Example:**
```json
{
  "businessType": "Electrician",
  "keywords": {
    "emergency": ["spark", "shock", "fire", "smoke", "no power"]
  },
  "aiPrompts": {
    "systemMessage": "You are an expert email processor for {{BUSINESS_NAME}}..."
  },
  "labelSchema": {
    "labels": {
      "URGENT": {
        "sub": ["No Power", "Electrical Hazard", "Sparking"],
        "intent": "ai.emergency_request"
      }
    }
  }
}
```

---

## 📋 **Layer 2: Label Schemas** (`src/labelSchemas/*.json`)

### **Purpose:** Define Gmail/Outlook folder/label structure

### **Contains:**
- ✅ **Label Hierarchy** - Parent/child relationships
- ✅ **Colors** - Gmail/Outlook label colors
- ✅ **Nested Structure** - Multi-level folders (URGENT > No Power)
- ✅ **Dynamic Variables** - {{Manager1}}, {{Supplier1}} placeholders
- ✅ **Provisioning Order** - Top-to-bottom creation sequence

### **Used By:**
- `labelProvisionService.js` - Creates actual labels in email
- Gmail API / Outlook API
- Label sync and validation systems

### **Example:**
```json
{
  "labels": [
    {
      "name": "URGENT",
      "color": { "backgroundColor": "#fb4c2f", "textColor": "#ffffff" },
      "sub": [
        { "name": "No Power" },
        { "name": "Electrical Hazard" },
        { "name": "Sparking" }
      ]
    }
  ]
}
```

---

## 🔗 **How They Connect**

```
┌──────────────────────────────────────────────────────────┐
│  USER SELECTS: ['Electrician', 'Plumber']               │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│  PROFILE STORED:                                         │
│  business_types: ['Electrician', 'Plumber']             │
│  managers: [{ name: 'John' }, { name: 'Jane' }]         │
└──────────────────────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────────┐
        │                                   │
        ↓                                   ↓
┌─────────────────────┐         ┌─────────────────────┐
│  AI Schema Merger   │         │  Label Schema       │
│  (aiSchemaMerger.js)│         │  Merger             │
│                     │         │  (labelSchemaMerger)│
│  Merges:            │         │                     │
│  • Keywords         │         │  Merges:            │
│  • Prompts          │         │  • Label hierarchy  │
│  • Intents          │         │  • Colors           │
│  • Escalations      │         │  • Dynamic vars     │
│  • Tone profiles    │         │                     │
└─────────────────────┘         └─────────────────────┘
        ↓                                   ↓
        ↓                                   ↓
┌─────────────────────┐         ┌─────────────────────┐
│  n8n Workflow       │         │  Gmail/Outlook API  │
│  AI Classification  │         │  Label Provisioning │
│                     │         │                     │
│  Uses merged:       │         │  Creates:           │
│  • Keywords to      │         │  📁 URGENT          │
│    detect urgency   │         │    ├─ No Power      │
│  • Prompts to       │         │    ├─ Burst Pipe    │
│    generate replies │         │  📁 PERMITS         │
│  • Intents to route │         │  📁 INSPECTIONS     │
└─────────────────────┘         └─────────────────────┘
```

---

## ✅ **Ensuring Consistency**

### **Problem:** Two schema systems could drift apart

### **Solution:** `schemaIntegrationBridge.js`

```javascript
import { getUnifiedMultiBusinessConfig } from '@/lib/schemaIntegrationBridge';

// Get both AI and label schemas in one call
const config = getUnifiedMultiBusinessConfig(
  ['Electrician', 'Plumber'],
  managers,
  suppliers
);

// config.aiSchema → For n8n AI classification
// config.labelSchema → For Gmail/Outlook provisioning
// Both guaranteed to be consistent!
```

**Benefits:**
- ✅ Single function call gets both schemas
- ✅ Automatic consistency validation
- ✅ Dynamic variables replaced in both
- ✅ Perfect alignment between classification and routing

---

## 📦 **Complete File Inventory**

### **Business AI Schemas** (11 files)
```
src/businessSchemas/
├── base.ai.schema.json              - Base inheritance template
├── ai-schema-template.json          - Template for new schemas
├── electrician.ai.json              - Electrician AI config
├── plumber.ai.json                  - Plumber AI config
├── pools_spas.ai.json               - Pools & Spas AI config
├── flooring_contractor.ai.json      - Flooring AI config
├── general_contractor.ai.json       - General contractor AI config
├── hvac.ai.json                     - HVAC AI config
├── landscaping.ai.json              - Landscaping AI config
├── painting_contractor.ai.json      - Painting AI config
└── roofing_contractor.ai.json       - Roofing AI config
```

### **Label Schemas** (13 files)
```
src/labelSchemas/
├── _template.json                   - Label schema template
├── electrician.json                 - Electrician labels
├── plumber.json                     - Plumber labels
├── pools_spas.json                  - Pools & Spas labels
├── hot_tub_spa.json                 - Hot Tub & Spa labels
├── sauna_icebath.json               - Sauna & Icebath labels
├── flooring_contractor.json         - Flooring labels
├── general_contractor.json          - General contractor labels
├── hvac.json                        - HVAC labels
├── insulation_foam_spray.json       - Insulation labels
├── landscaping.json                 - Landscaping labels
├── painting_contractor.json         - Painting labels
└── roofing.json                     - Roofing labels
```

### **Integration Layer** (3 files)
```
src/lib/
├── aiSchemaMerger.js                - Merges businessSchemas (AI)
├── labelSchemaMerger.js             - Merges labelSchemas (provisioning)
└── schemaIntegrationBridge.js       - Connects both systems
```

---

## 🔄 **Complete Multi-Business Flow**

### **Step 1: User Onboarding**
```javascript
// Step3BusinessType.jsx
selectedTypes: ['Electrician', 'Plumber']

// Saved to profiles table
await supabase.from('profiles').update({
  business_types: ['Electrician', 'Plumber'],
  business_type: 'Electrician'  // Primary
});
```

### **Step 2: Label Provisioning**
```javascript
// labelProvisionService.js
import { getUnifiedMultiBusinessConfig } from '@/lib/schemaIntegrationBridge';

const config = getUnifiedMultiBusinessConfig(
  profile.business_types,
  profile.managers,
  profile.suppliers
);

// Use config.labelSchema for Gmail/Outlook provisioning
const result = await provisionLabels(config.labelSchema);
```

### **Step 3: n8n Workflow Deployment**
```javascript
// templateService.js / n8nConfigMapper.js
import { getUnifiedMultiBusinessConfig } from '@/lib/schemaIntegrationBridge';

const config = getUnifiedMultiBusinessConfig(
  profile.business_types,
  profile.managers,
  profile.suppliers
);

// Inject AI schema into n8n workflow
const workflowTemplate = injectAIConfig({
  keywords: config.aiSchema.keywords,
  prompts: config.aiSchema.aiPrompts,
  intents: config.aiSchema.intentMapping,
  escalation: config.aiSchema.escalationRules,
  labelMap: config.labelSchema  // For routing
});
```

### **Step 4: Email Processing (n8n)**
```javascript
// n8n workflow receives email
{
  subject: "Emergency - No power to panel",
  body: "Breaker keeps tripping..."
}

// AI Classifier uses merged keywords
keywords.emergency: ["spark", "shock", "no power", "burst pipe", "flooding"]
                     ↑ From Electrician    ↑ From Plumber

// Detects: "no power" → ai.emergency_request → URGENT
// Routes to Gmail label: "Label_123456" (URGENT)
```

---

## 📋 **Schema Comparison Table**

| Aspect | businessSchemas/ | labelSchemas/ | Bridge Integration |
|--------|-----------------|---------------|-------------------|
| **Format** | Full AI config | Label structure only | Connects both |
| **Size** | ~350 lines | ~150 lines | Validates consistency |
| **Keywords** | ✅ Yes | ❌ No | Extracted from AI |
| **Prompts** | ✅ Yes | ❌ No | Passed to n8n |
| **Labels** | ✅ Embedded | ✅ Primary data | Must match |
| **Colors** | ✅ Yes | ✅ Yes | Synchronized |
| **Intents** | ✅ Yes | ❌ No | Maps to labels |
| **SLA Rules** | ✅ Yes | ❌ No | Controls urgency |
| **Multi-merge** | ✅ aiSchemaMerger.js | ✅ labelSchemaMerger.js | Both supported |

---

## 🎯 **Best Practices**

### **DO:**
✅ Use `getUnifiedMultiBusinessConfig()` for multi-business setups  
✅ Keep both schema systems in sync (same label names)  
✅ Test merged schemas with `validateSchemaConsistency()`  
✅ Use AI schema for n8n workflow intelligence  
✅ Use label schema for Gmail/Outlook provisioning  

### **DON'T:**
❌ Modify one schema system without updating the other  
❌ Create labels in AI schema that don't exist in label schema  
❌ Use different colors in both schemas for same label  
❌ Skip validation after merging  

---

## 🧪 **Testing Both Systems**

```bash
# Test AI schema merging
node test-ai-schema-merger.js

# Test label schema merging
node test-multi-business-schema-merger.js

# Test integration bridge
node test-schema-integration-bridge.js
```

---

## 🚀 **Production Usage**

### **Recommended Pattern:**

```javascript
import { getUnifiedMultiBusinessConfig } from '@/lib/schemaIntegrationBridge';

async function setupMultiBusinessClient(userId) {
  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_types, managers, suppliers')
    .eq('id', userId)
    .single();

  // Get unified configuration
  const config = getUnifiedMultiBusinessConfig(
    profile.business_types,
    profile.managers,
    profile.suppliers
  );

  // Validate consistency
  const validation = validateSchemaConsistency(
    config.aiSchema,
    config.labelSchema
  );

  if (!validation.consistent) {
    console.error('Schema mismatch:', validation.mismatches);
    throw new Error('AI and label schemas are inconsistent');
  }

  // Provision labels
  await provisionLabels(userId, config.labelSchema);

  // Deploy n8n workflow with AI config
  await deployN8nWorkflow(userId, config.aiSchema);

  return {
    success: true,
    metadata: config.metadata
  };
}
```

---

## 📈 **Data Flow Diagram**

```
ONBOARDING
    ↓
┌────────────────────────────────────────┐
│ User selects: Electrician + Plumber    │
└────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────┐
│ Saved to profiles.business_types[]     │
└────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────┐
│ schemaIntegrationBridge.js             │
│ getUnifiedMultiBusinessConfig()        │
│    ↓                            ↓      │
│  AI Schema               Label Schema  │
│  Merger                  Merger        │
└────────────────────────────────────────┘
    ↓                            ↓
    ↓                            ↓
┌──────────────────┐    ┌──────────────────┐
│ n8n Workflow     │    │ Gmail/Outlook    │
│                  │    │ Provisioning     │
│ AI Classifier:   │    │                  │
│ • Keywords       │    │ Creates:         │
│ • Prompts        │    │ 📁 URGENT        │
│ • Intents        │    │   ├─ No Power    │
│ • Tone           │    │   ├─ Burst Pipe  │
│                  │    │ 📁 PERMITS       │
│ Classifies email │    │ 📁 INSPECTIONS   │
│      ↓           │    │                  │
└──────────────────┘    └──────────────────┘
         ↓                       ↓
         └───────────────────────┘
                    ↓
         ┌──────────────────────┐
         │ Email routed to:     │
         │ URGENT label         │
         │ (Label_123456)       │
         └──────────────────────┘
```

---

## 🔍 **Why Two Systems?**

### **Separation of Concerns:**

1. **AI Schema (`businessSchemas/`)** = **Business Intelligence**
   - Changes when AI behavior needs adjustment
   - Updated by data scientists / AI engineers
   - Contains business logic and classification rules

2. **Label Schema (`labelSchemas/`)** = **Email Organization**
   - Changes when folder structure needs adjustment
   - Updated by operations / IT teams
   - Contains pure structural information

### **Benefits:**
- ✅ AI improvements don't require label restructuring
- ✅ Label reorganization doesn't affect AI intelligence
- ✅ Can test AI changes without touching email folders
- ✅ Can provision labels independently of AI deployment
- ✅ Cleaner separation for version control

---

## 🎯 **Multi-Business Support Matrix**

| Business Combination | AI Schema Merger | Label Schema Merger | Status |
|---------------------|-----------------|-------------------|---------|
| Single business | Uses schema directly | Uses schema directly | ✅ Working |
| Electrician + Plumber | Merges keywords, prompts | Merges PERMITS + INSPECTIONS | ✅ Implemented |
| Pools + Hot Tub + Sauna | Merges aquatics keywords | Merges SEASONAL + WELLNESS | ✅ Implemented |
| General + Flooring + Painting | Merges contractor intents | Merges SUBCONTRACTORS + ESTIMATES | ✅ Implemented |
| 5+ business types | Supported (not recommended) | Supported (not recommended) | ⚠️ Testing needed |

---

## 🔧 **Key Integration Functions**

### **1. Get Unified Config (Recommended)**
```javascript
import { getUnifiedMultiBusinessConfig } from '@/lib/schemaIntegrationBridge';

const config = getUnifiedMultiBusinessConfig(businessTypes, managers, suppliers);
// Returns: { aiSchema, labelSchema, metadata }
```

### **2. Merge AI Schemas Only**
```javascript
import { mergeAIBusinessSchemas } from '@/lib/aiSchemaMerger';

const aiSchema = mergeAIBusinessSchemas(['Electrician', 'Plumber']);
// Returns: Full AI config with merged keywords, prompts, etc.
```

### **3. Merge Label Schemas Only**
```javascript
import { mergeBusinessTypeSchemas } from '@/lib/labelSchemaMerger';

const labelSchema = mergeBusinessTypeSchemas(['Electrician', 'Plumber']);
// Returns: Label structure for provisioning
```

### **4. Validate Consistency**
```javascript
import { validateSchemaConsistency } from '@/lib/schemaIntegrationBridge';

const validation = validateSchemaConsistency(aiSchema, labelSchema);
// Returns: { consistent: true/false, mismatches: [...] }
```

---

## 📝 **Missing Business Type AI Schemas**

Currently in `businessSchemas/`:
- ✅ `electrician.ai.json`
- ✅ `plumber.ai.json`
- ✅ `pools_spas.ai.json`
- ✅ `flooring_contractor.ai.json`
- ✅ `general_contractor.ai.json`
- ✅ `hvac.ai.json`
- ✅ `landscaping.ai.json`
- ✅ `painting_contractor.ai.json`
- ✅ `roofing_contractor.ai.json`

**Missing (need to create):**
- ❌ `hot_tub_spa.ai.json`
- ❌ `sauna_icebath.ai.json`
- ❌ `insulation_foam_spray.ai.json`

**Note:** These currently fall back to `pools_spas.ai.json` or `hvac.ai.json`

---

## 🎓 **Summary**

### **businessSchemas/*.ai.json:**
- **WHO USES:** n8n AI Agent, email classifier
- **WHAT FOR:** AI intelligence (keywords, prompts, intents)
- **WHEN:** During email classification & reply generation

### **labelSchemas/*.json:**
- **WHO USES:** Gmail/Outlook API, label provisioning service
- **WHAT FOR:** Creating folder structure in email
- **WHEN:** During onboarding Step 5 (label provisioning)

### **schemaIntegrationBridge.js:**
- **WHO USES:** System integration layer
- **WHAT FOR:** Ensuring both schemas stay aligned
- **WHEN:** Multi-business config generation

**Both systems work together seamlessly!** 🚀

---

**Created:** 2025-10-08  
**Last Updated:** 2025-10-08  
**Version:** 2.0  
**Status:** ✅ Production Ready

