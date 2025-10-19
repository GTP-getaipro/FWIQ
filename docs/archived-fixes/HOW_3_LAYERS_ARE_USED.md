# 🔄 How the 3 Schema Layers Are Used in FloworxV2

## 📊 **Complete Usage Map**

```
┌─────────────────────────────────────────────────────────────┐
│  THREE SCHEMA LAYERS - USAGE FLOW                           │
└─────────────────────────────────────────────────────────────┘

USER ONBOARDING
     ↓
[Step 3] Select Business Types
     ↓
[Step 4] Team Setup (managers, suppliers)
     ↓
[Step 5] Label Provisioning ← Uses LAYER 3
     ↓
[Deploy] n8n Workflow ← Uses LAYER 1 + LAYER 2
     ↓
EMAIL PROCESSING
     ↓
AI Classification ← Uses LAYER 1
     ↓
AI Reply Generation ← Uses LAYER 2
     ↓
Email Routing ← Uses LAYER 3
```

---

## 🎯 **LAYER 1: businessSchemas/*.ai.json (AI Classification)**

### **Used By:**

1. ✅ **`src/lib/aiJsonSchemaLoader.js`**
   - Loads AI schemas for business types
   - Caches loaded schemas for performance
   - Provides methods to extract keywords, intents, prompts

2. ✅ **`src/lib/dynamicLabelProvisioningManager.js`**
   - Uses AI schemas to get label structure
   - Extracts label colors, provisioning order
   - Gets category groups and critical labels

3. ✅ **`src/lib/aiSchemaMerger.js`** (NEW - We created)
   - Merges multiple AI schemas for multi-business
   - Combines keywords across business types
   - Merges intent mappings and escalation rules

4. ✅ **n8n Workflow Templates**
   - AI Classifier Node uses systemMessage from AI schema
   - Keywords injected for classification
   - Intent mapping used for routing decisions

### **Code Flow:**

```javascript
// 1. Load AI Schema
import { loadBusinessSchema } from '@/lib/aiJsonSchemaLoader';
const aiSchema = await loadBusinessSchema('electrician');

// 2. Extract AI Configuration
const keywords = aiSchema.keywords;
// {
//   primary: ["electrician", "electrical", "wiring"],
//   emergency: ["spark", "shock", "fire", "no power"]
// }

const intentMapping = aiSchema.intentMapping;
// {
//   "ai.emergency_request": "URGENT",
//   "ai.service_request": "SERVICE"
// }

const systemMessage = aiSchema.aiPrompts.systemMessage;
// "You are an expert email processor for {{BUSINESS_NAME}}..."

// 3. Inject into n8n Workflow
const n8nNode = {
  name: "AI Master Classifier",
  type: "@n8n/n8n-nodes-langchain.agent",
  parameters: {
    options: {
      systemMessage: systemMessage  // ← Layer 1 used here
    }
  }
};
```

### **Where It's Actually Used:**

**File:** `src/lib/dynamicLabelProvisioningManager.js`
```javascript
// Line 5
import { AIJsonSchemaLoader, loadBusinessSchema } from './aiJsonSchemaLoader.js';

// Line 24
this.schema = await this.schemaLoader.loadSchema(this.businessType);

// Line 35
return this.schema.labelSchema;  // ← Extracts label structure from AI schema
```

**File:** `supabase/functions/deploy-n8n/index.ts`
```typescript
// Lines 68-84 - Injects AI config into n8n workflow
const replacements: Record<string, string> = {
  '<<<BUSINESS_NAME>>>': business.name,
  '<<<MANAGERS_TEXT>>>': managersText,
  '<<<SUPPLIERS>>>': JSON.stringify(suppliers),
  '<<<LABEL_MAP>>>': JSON.stringify(email_labels),
  // ... etc - these get injected into AI nodes
};
```

**File:** `src/lib/n8n-templates/hot_tub_base_template.json`
```json
{
  "parameters": {
    "options": {
      "systemMessage": "You are an email classifier for <<<BUSINESS_NAME>>>..."
      // ← Layer 1 AI schema content gets injected here
    }
  }
}
```

---

## 💬 **LAYER 2: behaviorSchemas/*.json (AI Reply Behavior)**

### **Used By:**

1. ✅ **`src/scripts/validate-behavior-json.ts`**
   - Validates behavior schema structure
   - Ensures all required fields present

2. ✅ **`src/lib/behaviorSchemaMerger.js`** (NEW - We created)
   - Merges behavior schemas for multi-business
   - Blends voice profiles
   - Combines behavior goals and upsell text

3. ✅ **`src/lib/schemaIntegrationBridge.js`** (NEW - We created)
   - Extracts behavior config for n8n
   - Replaces template variables
   - Generates complete reply configuration

4. ✅ **n8n Workflow Templates**
   - AI Reply Agent Node uses replyPrompt
   - Voice tone injected into reply generation
   - Category-specific language used

### **Code Flow:**

```javascript
// 1. Load Behavior Schema
import { getBehaviorSchemaForBusinessType } from '@/lib/behaviorSchemaMerger';
const behaviorSchema = getBehaviorSchemaForBusinessType('hot_tub_spa');

// 2. Extract Behavior Config
const voiceProfile = behaviorSchema.voiceProfile;
// {
//   tone: "Super-friendly, enthusiastic, water-care focused",
//   formalityLevel: "casual",
//   allowPricingInReplies: true
// }

const upsell = behaviorSchema.aiDraftRules.upsellGuidelines;
// {
//   enabled: true,
//   text: "If you need any filters, chemicals, or test strips..."
// }

const categoryOverrides = behaviorSchema.categoryOverrides;
// {
//   Urgent: {
//     customLanguage: ["That sounds frustrating..."]
//   }
// }

// 3. Inject into n8n AI Reply Node
const replyPrompt = `
Draft replies using this tone: ${voiceProfile.tone}
Formality: ${voiceProfile.formalityLevel}
Upsell: ${upsell.text}
For URGENT emails, use: ${categoryOverrides.Urgent.customLanguage[0]}
`;
```

### **Where It's Actually Used:**

**File:** `src/lib/behaviorSchemaMerger.js` (We created)
```javascript
// Lines 13-18 - Imports all behavior schemas
import electricianBehavior from '@/behaviorSchemas/electrician.json';
import plumberBehavior from '@/behaviorSchemas/plumber.json';
// ...

// Line 61 - Merges voice profiles for multi-business
const mergeVoiceProfiles = (schemas, businessTypes) => {
  const tones = schemas.map(s => s.voiceProfile?.tone).filter(t => t);
  const blendedTone = characteristics.join(', ') + 
    ` with multi-service expertise (${businessTypes.join(' + ')})`;
  return blendedTone;
};
```

**File:** `src/lib/schemaIntegrationBridge.js`
```javascript
// Line 28 - Merge behavior schemas
const mergedBehaviorSchema = mergeBusinessTypeBehaviors(businessTypes);

// Line 186 - Extract for n8n deployment
const behaviorConfig = extractBehaviorForN8n(behaviorSchema, businessInfo);

// Lines 205-215 - Inject into n8n workflow
replyBehavior: {
  voiceTone: behaviorConfig.tone,  // ← Layer 2 used here
  behaviorGoals: behaviorConfig.behaviorGoals,
  upsellText: behaviorConfig.upsellText,
  categoryOverrides: behaviorConfig.categoryOverrides
}
```

**File:** `src/lib/n8n-templates/hot_tub_base_template.json`
```json
{
  "parameters": {
    "options": {
      "systemMessage": "Draft replies for <<<BUSINESS_NAME>>> using <<<REPLY_TONE>>> tone..."
      // ← Layer 2 behavior schema tone gets injected here
    }
  }
}
```

---

## 📁 **LAYER 3: labelSchemas/*.json (Email Folder Structure)**

### **Used By:**

1. ✅ **`src/lib/labelProvisionService.js`**
   - **PRIMARY USAGE**
   - Loads label schemas to create Gmail/Outlook folders
   - Uses merger for multi-business types
   - Replaces dynamic variables ({{Manager1}})

2. ✅ **`src/lib/labelSchemaMerger.js`** (NEW - We created)
   - Merges multiple label schemas
   - Deduplicates standard categories
   - Combines industry-specific categories

3. ✅ **`src/lib/baseMasterSchema.js`**
   - Base template for all label structures
   - Provides `getCompleteSchemaForBusiness()`
   - Used as fallback for single-business

4. ✅ **`src/lib/labelSyncValidator.js`**
   - Uses hardcoded `standardLabels` for validation
   - Should eventually use labelSchemas instead

5. ✅ **Gmail/Outlook APIs**
   - Label schemas define what folders to create
   - Colors from schemas applied to labels
   - Hierarchy determines parent/child relationships

### **Code Flow:**

```javascript
// 1. Load Label Schema (Multi-business)
import { mergeBusinessTypeSchemas } from '@/lib/labelSchemaMerger';
const labelSchema = mergeBusinessTypeSchemas(['Electrician', 'Plumber']);

// 2. Result Structure
// {
//   labels: [
//     {
//       name: "URGENT",
//       color: { backgroundColor: "#fb4c2f", textColor: "#ffffff" },
//       sub: [
//         { name: "No Power" },        // From Electrician
//         { name: "Burst Pipe" }       // From Plumber
//       ]
//     },
//     { name: "PERMITS", ... },        // From Electrician only
//     { name: "INSPECTIONS", ... }     // From Plumber only
//   ]
// }

// 3. Create Gmail Labels
for (const label of labelSchema.labels) {
  await createGmailLabel({
    name: label.name,
    color: label.color,
    // ← Layer 3 defines structure
  });
  
  // Create subcategories
  for (const sub of label.sub) {
    await createGmailLabel({
      name: `${label.name}/${sub.name}`,
      parent: label.id
    });
  }
}
```

### **Where It's Actually Used:**

**File:** `src/lib/labelProvisionService.js`
```javascript
// Lines 9-10 - Imports label schema systems
import { getCompleteSchemaForBusiness } from './baseMasterSchema';
import { mergeBusinessTypeSchemas } from './labelSchemaMerger';

// Lines 32-37 - Uses merger for multi-business
if (businessTypes.length > 1) {
  console.log('📦 Using multi-business schema merger');
  const mergedSchema = mergeBusinessTypeSchemas(businessTypes);
  return replaceDynamicVariables(mergedSchema, managers, suppliers);
}

// Line 41 - Uses baseMasterSchema for single business
return getCompleteSchemaForBusiness(businessTypes[0], managers, suppliers);

// Line 127 - Schema used for provisioning
const schema = processDynamicSchema(finalBusinessTypes, managers, suppliers);
// ← Layer 3 schema drives label creation
```

**File:** `src/lib/baseMasterSchema.js`
```javascript
// Lines 9-38 - Base label schema defined
export const baseMasterSchema = {
  labels: [
    {
      name: "BANKING",
      color: { backgroundColor: "#16a766", textColor: "#ffffff" },
      sub: [
        { name: "e-Transfer", sub: [{ name: "From Business" }, ...] }
      ]
    },
    // ... all standard categories
  ]
};

// Line 1842 - Function that loads schema for business type
export function getCompleteSchemaForBusiness(businessType, managers, suppliers) {
  const extendedSchema = applyBusinessExtension(businessType);
  const processedSchema = injectDynamicValues(extendedSchema, managers, suppliers);
  return processedSchema;
  // ← This is what labelProvisionService calls
}
```

**File:** `src/lib/dynamicLabelProvisioningManager.js`
```javascript
// Line 5 - Imports AI schema loader
import { AIJsonSchemaLoader, loadBusinessSchema } from './aiJsonSchemaLoader.js';

// Line 24 - Loads AI schema (which contains label schema inside)
this.schema = await this.schemaLoader.loadSchema(this.businessType);

// Line 35 - Extracts label schema from AI schema
return this.schema.labelSchema;
// ← Layer 1 (AI schema) contains Layer 3 (label schema) embedded!
```

---

## 🔄 **Complete Usage Flow for Multi-Business User**

### **Scenario: User selects Electrician + Plumber**

```
STEP 1: ONBOARDING
─────────────────────────────────────────────────────────
File: src/pages/onboarding/Step3BusinessType.jsx

User clicks: ☑️ Electrician  ☑️ Plumber

Saved to database:
  profiles.business_types = ['Electrician', 'Plumber']
  profiles.managers = [{ name: 'John' }, { name: 'Jane' }]
  profiles.suppliers = [{ name: 'Home Depot' }]


STEP 2: LABEL PROVISIONING (Layer 3)
─────────────────────────────────────────────────────────
File: src/lib/labelProvisionService.js

Code Path:
1. provisionLabelSchemaFor(userId, businessType)
2. Fetches profile: business_types, managers, suppliers
3. Calls: processDynamicSchema(businessTypes, managers, suppliers)
4. Detects multiple business types (2)
5. Calls: mergeBusinessTypeSchemas(['Electrician', 'Plumber'])

File: src/lib/labelSchemaMerger.js

6. Loads labelSchemas/electrician.json
7. Loads labelSchemas/plumber.json
8. Merges:
   - URGENT: ["No Power", "Burst Pipe"]  // Combined!
   - PERMITS (from Electrician)           // Preserved
   - INSPECTIONS (from Plumber)           // Preserved
9. Replaces: {{Manager1}} → "John", {{Manager2}} → "Jane"
10. Returns unified label schema

Back to: src/lib/labelProvisionService.js

11. Creates Gmail labels using merged schema
12. POST to https://www.googleapis.com/gmail/v1/users/me/labels
    Body: {
      name: "URGENT",
      color: { backgroundColor: "#fb4c2f" }  // ← From Layer 3
    }
13. Creates subcategories:
    - URGENT/No Power
    - URGENT/Burst Pipe
    - PERMITS/Permit Applications
    - INSPECTIONS/Camera Inspections
14. Saves to profiles.email_labels:
    {
      "URGENT": "Label_123456",
      "PERMITS": "Label_789012",
      "INSPECTIONS": "Label_345678"
    }


STEP 3: N8N WORKFLOW DEPLOYMENT (Layers 1 & 2)
─────────────────────────────────────────────────────────
File: src/lib/n8nConfigMapper.js

Code Path:
1. mapClientConfigToN8n(userId)
2. Fetches profile data
3. Builds n8nConfig object with business info

File: src/lib/templateService.js

4. injectOnboardingData(clientData)
5. Gets n8n template for primary business type
6. Replaces placeholders in template:

Placeholder Injection (uses profile data, NOT direct schema access):
├── <<<BUSINESS_NAME>>> → "ABC Electrical & Plumbing"
├── <<<MANAGERS_TEXT>>> → "John, Jane"
├── <<<SUPPLIERS>>> → "[{name: 'Home Depot', ...}]"
├── <<<LABEL_MAP>>> → "{URGENT: 'Label_123456', ...}"
├── <<<SIGNATURE_BLOCK>>> → "\n\nBest regards..."
├── <<<REPLY_TONE>>> → "Professional"  // ← Should come from Layer 2
└── <<<SERVICE_CATALOG_TEXT>>> → Service list

File: supabase/functions/deploy-n8n/index.ts

7. Deploys workflow to n8n
8. Activates workflow


STEP 4: EMAIL ARRIVES (Runtime - All 3 Layers)
─────────────────────────────────────────────────────────
Email: "Emergency! Panel sparking and water leak!"

┌─────────────────────────────────────────────────────────┐
│  n8n Workflow Processes Email                           │
└─────────────────────────────────────────────────────────┘

NODE 1: AI Master Classifier (Uses Layer 1)
──────────────────────────────────────────
File: n8n workflow (deployed from template)

AI receives systemMessage:
"You are an email classifier for ABC Electrical & Plumbing..."

Email text analyzed against keywords (from Layer 1):
- "spark" → matches electrician.ai.json emergency keywords
- "water leak" → matches plumber.ai.json emergency keywords

Classification Result:
{
  primary_category: "URGENT",
  secondary_category: "Emergency",
  ai_can_reply: true
}

NODE 2: AI Draft Reply (Uses Layer 2)
──────────────────────────────────────
(Currently NOT directly using behaviorSchemas - OPPORTUNITY!)

Current: Uses generic replyPrompt from template
Should Use: behaviorSchemas/electrician.json + plumber.json

What it SHOULD do:
1. Load merged behavior schema
2. Use blended tone: "Safety-focused, professional, emergency-ready"
3. Apply category override for URGENT:
   "⚠️ SAFETY FIRST: Turn off power! Call emergency plumber!"
4. Include upsell from both:
   "Check electrical panel + water pressure while we're there"

NODE 3: Label Router (Uses Layer 3)
────────────────────────────────────
File: n8n workflow routing logic

Uses email_labels mapping from profile:
{
  "URGENT": "Label_123456"
}

Applies Gmail label: Label_123456 (URGENT)
↓
Email routed to: URGENT folder ✅
```

---

## 🔍 **Current State vs. Ideal State**

### **✅ Currently Working:**

| Layer | Current Usage | Where |
|-------|--------------|-------|
| **Layer 1 (AI)** | Embedded in `dynamicLabelProvisioningManager` | Used to extract label structure |
| **Layer 2 (Behavior)** | Validated by scripts | **NOT actively used in workflows** ⚠️ |
| **Layer 3 (Labels)** | `labelProvisionService` + `baseMasterSchema` | Gmail/Outlook label creation |

### **⚠️ Gaps Identified:**

1. **Layer 1 (AI businessSchemas):**
   - ✅ Loaded by `aiJsonSchemaLoader.js`
   - ⚠️ **Keywords NOT directly injected into n8n templates**
   - ⚠️ Currently uses hardcoded systemMessage in templates
   - 💡 **Opportunity:** Inject merged keywords into AI Classifier node

2. **Layer 2 (behaviorSchemas):**
   - ✅ Validated by scripts
   - ✅ Merger built (we created it)
   - ❌ **NOT currently used in n8n workflow deployment**
   - 💡 **Opportunity:** Inject behavior config into AI Reply node

3. **Layer 3 (labelSchemas):**
   - ✅ Used by `labelProvisionService`
   - ✅ Merger working (we created it)
   - ✅ Creates actual Gmail/Outlook labels
   - ✅ **Fully functional**

---

## 💡 **How They SHOULD Be Used (Ideal)**

### **Complete Integration:**

```javascript
// File: src/lib/deployment.js or wherever workflow is deployed

import { getUnifiedMultiBusinessConfig, generateN8nConfigFromUnified } 
  from '@/lib/schemaIntegrationBridge';

async function deployWorkflow(userId) {
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_types, managers, suppliers, client_config')
    .eq('id', userId)
    .single();

  const businessInfo = {
    name: profile.client_config.business.name,
    phone: profile.client_config.contact.phone,
    emailDomain: profile.client_config.business.emailDomain
  };

  // ✨ GET ALL 3 LAYERS MERGED
  const unifiedConfig = getUnifiedMultiBusinessConfig(
    profile.business_types,    // ['Electrician', 'Plumber']
    profile.managers,           // [{ name: 'John' }]
    profile.suppliers,          // [{ name: 'Home Depot' }]
    businessInfo
  );

  // unifiedConfig contains:
  // {
  //   aiSchema: { keywords, intents, prompts },      ← Layer 1
  //   behaviorSchema: { tone, goals, upsell },       ← Layer 2
  //   labelSchema: { labels, hierarchy, colors }     ← Layer 3
  // }

  // ✨ GENERATE COMPLETE N8N CONFIG
  const n8nConfig = generateN8nConfigFromUnified(unifiedConfig, businessInfo);

  // n8nConfig contains ALL 3 layers ready for n8n:
  // {
  //   classification: {
  //     keywords: ["spark", "shock", "flood", "backup"],  ← Layer 1
  //     systemMessage: "...",
  //     intentMapping: { ... }
  //   },
  //   replyBehavior: {
  //     voiceTone: "Safety-focused, emergency-ready",    ← Layer 2
  //     upsellText: "Check panel + water pressure",
  //     categoryOverrides: { Urgent: { ... } }
  //   },
  //   labels: [                                           ← Layer 3
  //     { name: "URGENT", sub: [...] },
  //     { name: "PERMITS" },
  //     { name: "INSPECTIONS" }
  //   ]
  // }

  // ✨ INJECT INTO N8N TEMPLATE
  const workflowTemplate = injectCompleteConfig(n8nConfig);

  // Deploy to n8n
  await deployToN8n(workflowTemplate);
}
```

---

## 📋 **Current vs. Ideal Usage Table**

| Schema Layer | Current Usage | Ideal Usage | Gap |
|-------------|---------------|-------------|-----|
| **Layer 1 (AI)** | Loaded by `dynamicLabelProvisioningManager` for label extraction | Should inject keywords into AI Classifier node | ⚠️ Keywords not in workflow |
| **Layer 2 (Behavior)** | Only validated, not deployed | Should inject into AI Reply Agent node | ❌ Not used in deployment |
| **Layer 3 (Labels)** | Used by `labelProvisionService` for Gmail/Outlook | Continue current usage | ✅ Fully functional |

---

## 🎯 **Key Files That Use Schemas**

### **Label Provisioning (Layer 3):**
- ✅ `src/lib/labelProvisionService.js` - **PRIMARY USAGE**
- ✅ `src/lib/baseMasterSchema.js` - Base schema + extensions
- ✅ `src/lib/labelSchemaMerger.js` - Multi-business merging
- ✅ `src/pages/onboarding/StepTeamSetup.jsx` - Triggers provisioning

### **AI Schema Loading (Layer 1):**
- ✅ `src/lib/aiJsonSchemaLoader.js` - Loads AI schemas
- ✅ `src/lib/dynamicLabelProvisioningManager.js` - Uses AI schemas
- ✅ `src/lib/aiSchemaMerger.js` - Multi-business merging

### **Behavior Schema (Layer 2):**
- ✅ `src/lib/behaviorSchemaMerger.js` - Multi-business merging
- ✅ `src/lib/schemaIntegrationBridge.js` - Integration layer
- ⚠️ **NOT YET:** n8n workflow deployment (opportunity!)

### **n8n Deployment:**
- ✅ `src/lib/templateService.js` - Selects workflow template
- ✅ `src/lib/n8nConfigMapper.js` - Maps profile to n8n config
- ✅ `src/lib/deployment.js` - Deploys workflow
- ✅ `supabase/functions/deploy-n8n/index.ts` - Edge function deployment

---

## 🚀 **Recommended Next Steps**

### **1. Integrate Layer 1 (AI Keywords) into n8n Workflows**

Create new function in `src/lib/templateService.js`:

```javascript
import { mergeAIBusinessSchemas } from '@/lib/aiSchemaMerger';

export const injectAISchemaIntoTemplate = (template, businessTypes, businessInfo) => {
  const mergedAI = mergeAIBusinessSchemas(businessTypes);
  
  // Replace AI classification placeholders
  template = template.replace(
    '<<<AI_KEYWORDS>>>',
    JSON.stringify(mergedAI.keywords)
  );
  
  template = template.replace(
    '<<<AI_SYSTEM_MESSAGE>>>',
    mergedAI.aiPrompts.systemMessage
  );
  
  return template;
};
```

### **2. Integrate Layer 2 (Behavior) into n8n Workflows**

Update `src/lib/schemaIntegrationBridge.js` to inject behavior:

```javascript
// Already built! Just need to use it in deployment:
const behaviorConfig = extractBehaviorForN8n(behaviorSchema, businessInfo);

// Inject into AI Reply Agent node
replyNode.parameters.options.systemMessage = behaviorConfig.tone;
replyNode.parameters.options.behaviorGoals = behaviorConfig.behaviorGoals;
```

### **3. Update n8n Templates to Support Schema Placeholders**

Add to `src/lib/n8n-templates/electrician_template.json`:

```json
{
  "parameters": {
    "options": {
      "systemMessage": "<<<AI_SYSTEM_MESSAGE>>>",
      "keywords": "<<<AI_KEYWORDS>>>",
      "replyTone": "<<<BEHAVIOR_TONE>>>",
      "upsellGuidelines": "<<<BEHAVIOR_UPSELL>>>"
    }
  }
}
```

---

## 📊 **Usage Summary**

### **Files That Load Schemas:**
```
Layer 1 (AI):
├── src/lib/aiJsonSchemaLoader.js           ✅ Loads from businessSchemas/
├── src/lib/dynamicLabelProvisioningManager.js ✅ Uses AI schemas
└── src/lib/aiSchemaMerger.js               ✅ Merges AI schemas

Layer 2 (Behavior):
├── src/lib/behaviorSchemaMerger.js         ✅ Merges behavior schemas
├── src/lib/schemaIntegrationBridge.js      ✅ Extracts for n8n
└── ⚠️ NOT YET: Actual n8n deployment

Layer 3 (Labels):
├── src/lib/labelProvisionService.js        ✅ PRIMARY - Creates labels
├── src/lib/baseMasterSchema.js             ✅ Base template
├── src/lib/labelSchemaMerger.js            ✅ Multi-business merging
└── Gmail/Outlook APIs                      ✅ Final execution
```

### **Files That Merge Schemas:**
```
All 3 Layers:
├── src/lib/aiSchemaMerger.js               ✅ Layer 1 merger
├── src/lib/behaviorSchemaMerger.js         ✅ Layer 2 merger
├── src/lib/labelSchemaMerger.js            ✅ Layer 3 merger
└── src/lib/schemaIntegrationBridge.js      ✅ Unifies all 3
```

### **Files That Deploy to n8n:**
```
Deployment Flow:
├── src/lib/deployment.js                   ← Entry point
├── src/lib/n8nConfigMapper.js              ← Maps profile data
├── src/lib/templateService.js              ← Selects template
├── supabase/functions/deploy-n8n/index.ts  ← Edge function
└── src/lib/n8n-templates/*.json            ← Workflow templates
```

---

## ✅ **Currently Functional:**

✅ **Layer 3 (Labels)** - Fully integrated and working
- labelProvisionService loads schemas
- Creates Gmail/Outlook folders
- Multi-business merging works
- Dynamic variables replaced

⚠️ **Layer 1 (AI)** - Partially integrated
- Schemas exist and are loaded
- Merger built and working
- **BUT:** Keywords not directly injected into n8n workflows
- Templates use hardcoded systemMessage

⚠️ **Layer 2 (Behavior)** - Not yet integrated
- Schemas exist and validated
- Merger built and working
- **BUT:** Not used in n8n workflow deployment
- Opportunity to enhance AI reply quality

---

## 🎯 **Summary**

### **Current Reality:**

```
Layer 3 (Labels) → 100% Integrated ✅
   └── labelProvisionService → labelSchemas → Gmail API

Layer 1 (AI) → 50% Integrated ⚠️
   └── dynamicLabelProvisioningManager → businessSchemas
   └── ❌ NOT injected into n8n AI Classifier

Layer 2 (Behavior) → 0% Integrated ❌
   └── Schemas exist, merger built
   └── ❌ NOT used anywhere in deployment
```

### **What We Built:**

```
✅ All 3 schema layers complete (100% coverage)
✅ All 3 mergers built and working
✅ Integration bridge connects all 3
✅ Validation system complete
✅ Ready to fully integrate into n8n deployment
```

### **Next Integration Step:**

Update `src/lib/templateService.js` and `supabase/functions/deploy-n8n/index.ts` to use:
```javascript
import { getUnifiedMultiBusinessConfig } from '@/lib/schemaIntegrationBridge';

// Get all 3 merged layers
const config = getUnifiedMultiBusinessConfig(...);

// Inject ALL 3 layers into n8n template
// - Layer 1 keywords → AI Classifier node
// - Layer 2 behavior → AI Reply Agent node
// - Layer 3 labels → Label Router (already working)
```

---

**Current Status:** Layer 3 fully working, Layers 1 & 2 built but awaiting deployment integration  
**Next Step:** Integrate Layer 1 & 2 into n8n workflow deployment  
**Documentation:** ✅ Complete  
**Code:** ✅ Ready  
**Testing:** ⚠️ Needs integration testing

