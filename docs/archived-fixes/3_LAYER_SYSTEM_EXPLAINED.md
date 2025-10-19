# 🎯 Your 3-Layer Schema System - How It Works

## 📚 Quick Answer:

Your app uses **3 separate JSON schema layers** to make ONE workflow template work for ALL business types:

1. **Layer 1 (AI Schemas):** Business-specific keywords & classification rules
2. **Layer 2 (Behavior Schemas):** Voice/tone & reply guidelines
3. **Layer 3 (Label Schemas):** Email folder structure

Instead of creating 100 different workflow templates (one per business type), you have:
- ✅ **1 universal workflow template** (`gmail-workflow-template.json`)
- ✅ **3 schema layers** that inject business-specific data into it

---

## 🔄 The Flow (Real Example):

### **Scenario: Hot Tub & Spa Business**

```
┌──────────────────────────────────────────────────────────────┐
│ USER ONBOARDING                                              │
└─────────────────┬────────────────────────────────────────────┘
                  ↓
         Selects: "Pools & Spas"
                  ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: Load Business-Specific Schemas                      │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ├─→ Layer 1: businessSchemas/pools_spas.ai.json
                  │   {
                  │     keywords: ["hot tub", "spa", "pool", "heater"],
                  │     aiPrompts: "You classify emails for pool/spa business..."
                  │   }
                  │
                  ├─→ Layer 2: behaviorSchemas/pools_spas.json
                  │   {
                  │     voiceProfile: { tone: "Friendly, water-care expert" },
                  │     upsellGuidelines: "Mention water testing services..."
                  │   }
                  │
                  └─→ Layer 3: labelSchemas/pools_spas.json
                      {
                        labels: [
                          { name: "URGENT", sub: ["Equipment Failure", "Leak"] },
                          { name: "WATER QUALITY" } // Industry-specific!
                        ]
                      }
                  ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: Create Gmail/Outlook Folders (Layer 3)              │
└─────────────────┬────────────────────────────────────────────┘
                  │
File: src/lib/labelProvisionService.js
                  │
                  ├─→ Reads Layer 3 schema
                  ├─→ Creates Gmail labels:
                  │     • URGENT (red)
                  │     • URGENT/Equipment Failure
                  │     • URGENT/Leak
                  │     • WATER QUALITY (blue) ← Industry-specific!
                  │
                  └─→ Saves to database:
                      email_labels: {
                        "URGENT": "Label_325",
                        "WATER QUALITY": "Label_789"
                      }
                  ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: Deploy N8N Workflow (Layers 1 + 2)                  │
└─────────────────┬────────────────────────────────────────────┘
                  │
File: src/lib/templateService.js
                  │
                  ├─→ Loads UNIVERSAL template:
                  │   templates/gmail-workflow-template.json
                  │
                  ├─→ Injects Layer 1 data:
                  │   <<<AI_KEYWORDS>>> → ["hot tub", "spa", "pool", "heater"]
                  │   <<<AI_SYSTEM_MESSAGE>>> → "Classify emails for spa business..."
                  │
                  ├─→ Injects Layer 2 data:
                  │   <<<BEHAVIOR_REPLY_PROMPT>>> → "Friendly, water-care expert..."
                  │   <<<BEHAVIOR_UPSELL_TEXT>>> → "Mention water testing..."
                  │
                  └─→ Injects Layer 3 label IDs:
                      <<<LABEL_URGENT_ID>>> → "Label_325"
                      <<<LABEL_WATER_QUALITY_ID>>> → "Label_789"
                  ↓
                Sends to N8N
                  ↓
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: Email Processing (Runtime - All 3 Layers Work!)     │
└─────────────────┬────────────────────────────────────────────┘

📧 Email arrives: "HELP! Hot tub heater not working!"

                  ↓
        ┌─────────────────────┐
        │  AI Classifier Node │
        │  (Uses Layer 1)     │
        └─────────┬───────────┘
                  │
    Checks keywords from Layer 1:
    "heater" → matches spa emergency keywords ✅
    "not working" → matches urgent keywords ✅
                  │
         Classification Result:
         { primary_category: "URGENT",
           ai_can_reply: true }
                  ↓
        ┌─────────────────────┐
        │  Label Router       │
        │  (Uses Layer 3)     │
        └─────────┬───────────┘
                  │
    Applies label using Layer 3 mapping:
    "URGENT" → Label_325
                  │
         Email moved to URGENT folder ✅
                  ↓
        ┌─────────────────────┐
        │  AI Reply Agent     │
        │  (Uses Layer 2)     │
        └─────────┬───────────┘
                  │
    Uses behavior from Layer 2:
    Tone: "Friendly, water-care expert"
    Upsell: "I can help! While we fix the heater,
             would you like a water quality check?"
                  │
         Draft created ✅
```

---

## 🎯 Why This Architecture is Brilliant:

### **Without 3-Layer System:**
```
Electrician → electrician-workflow.json (1,000+ lines)
Plumber → plumber-workflow.json (1,000+ lines)
HVAC → hvac-workflow.json (1,000+ lines)
...50 more business types...

❌ 50,000+ lines of duplicate workflow JSON
❌ Nightmare to maintain
❌ Changes require updating 50+ files
```

### **With 3-Layer System:**
```
ALL Business Types → gmail-workflow-template.json (700 lines)
                  ↓
            Inject from:
            ├── Layer 1: pools_spas.ai.json (keywords)
            ├── Layer 2: pools_spas.json (behavior)
            └── Layer 3: pools_spas.json (labels)

✅ 700 lines + small schema files
✅ Easy to maintain
✅ Changes in ONE place
✅ Add new business type = just add 3 small JSON files
```

---

## 📊 Current Implementation Status:

### **✅ Layer 3 (Labels) - FULLY WORKING**

**What it does:**
- Creates Gmail/Outlook folders based on business type
- Merges folders for multi-business users
- Replaces dynamic variables ({{Manager1}} → "Aaron")

**Files:**
```javascript
// 1. Schema files (one per business type)
labelSchemas/
  ├── pools_spas.json         ← Defines folder structure
  ├── electrician.json
  └── plumber.json

// 2. Merger (combines multiple business types)
src/lib/labelSchemaMerger.js  ← Merges schemas

// 3. Provisioner (creates actual folders)
src/lib/labelProvisionService.js ← Uses merged schema to create Gmail labels
```

**Example:**
```javascript
// User is: Electrician + Plumber

// labelSchemaMerger.js combines:
electrician.json → URGENT/No Power
plumber.json → URGENT/Burst Pipe

// Result:
URGENT/
  ├── No Power       (from Electrician)
  └── Burst Pipe     (from Plumber)
```

---

### **⚠️ Layer 1 (AI) - PARTIALLY WORKING**

**What it should do:**
- Inject business-specific keywords into AI Classifier
- Provide custom system messages for classification
- Map intents to categories

**Current status:**
- ✅ Schemas exist (`businessSchemas/*.ai.json`)
- ✅ Merger built (`aiSchemaMerger.js`)
- ⚠️ **BUT:** Not actively injected into N8N workflows
- ⚠️ Templates use hardcoded system messages instead

**Files:**
```javascript
// 1. Schema files
businessSchemas/
  ├── pools_spas.ai.json      ← AI config for spas
  ├── electrician.ai.json
  └── plumber.ai.json

// 2. Merger
src/lib/aiSchemaMerger.js     ← Combines AI configs

// 3. Injector (WE CREATED BUT NOT FULLY INTEGRATED)
src/lib/aiSchemaInjector.js   ← Should inject into templates
```

**How it SHOULD work:**
```javascript
// Load schema
const aiConfig = mergeAIBusinessSchemas(['Pools & Spas']);

// Inject into template
template.nodes.find(n => n.name === 'AI Master Classifier')
  .parameters.options.systemMessage = aiConfig.systemMessage;
  
// Keywords would help AI recognize:
// "hot tub" → URGENT (from pools_spas.ai.json)
// "heater" → SERVICE REQUEST
```

---

### **❌ Layer 2 (Behavior) - NOT YET WORKING**

**What it should do:**
- Control AI reply tone and style
- Provide category-specific language
- Include upsell/followup guidelines

**Current status:**
- ✅ Schemas exist (`behaviorSchemas/*.json`)
- ✅ Merger built (`behaviorSchemaMerger.js`)
- ❌ **NOT integrated into N8N deployment**

**Files:**
```javascript
// 1. Schema files
behaviorSchemas/
  ├── pools_spas.json         ← Reply behavior for spas
  ├── electrician.json
  └── plumber.json

// 2. Merger
src/lib/behaviorSchemaMerger.js ← Combines behaviors

// 3. Injector (WE CREATED BUT NOT INTEGRATED)
src/lib/behaviorSchemaInjector.js ← Should inject into templates
```

**How it SHOULD work:**
```javascript
// Load schema
const behaviorConfig = mergeBehaviorSchemas(['Pools & Spas']);

// Inject into AI Reply Agent
template.nodes.find(n => n.name === 'AI Reply Agent')
  .parameters.options.systemMessage = `
    ${behaviorConfig.voiceProfile.tone}
    ${behaviorConfig.aiDraftRules.upsellGuidelines.text}
  `;

// Result: AI drafts replies with spa-specific language:
// "I'd be happy to help with your hot tub! While we're there, 
//  would you like us to check your water chemistry?"
```

---

## 🔧 How It Works in Practice (Current State):

### **Your Current Deployment Flow:**

```javascript
// File: src/lib/deployment.js

async function deployAutomation(userId) {
  // 1. Get user profile (includes business_types)
  const profile = await getProfile(userId);
  // profile.business_types = ['Pools & Spas']
  
  // 2. Get complete config (THIS IS KEY!)
  const clientData = await mapClientConfigToN8n(userId);
  // clientData includes:
  // - business_types: ['Pools & Spas']
  // - managers: [...]
  // - suppliers: [...]
  // - email_labels: { URGENT: "Label_325", ... } ← From Layer 3!
  
  // 3. Load UNIVERSAL template
  const template = await getTemplateForBusinessType(businessType);
  // Returns: templates/gmail-workflow-template.json
  // Same template for ALL business types!
  
  // 4. Inject client data
  const injectedWorkflow = injectOnboardingData(clientData, template);
  // Replaces placeholders:
  // <<<BUSINESS_NAME>>> → "The Hot Tub Man"
  // <<<LABEL_URGENT_ID>>> → "Label_325" ← Layer 3 data!
  // <<<AI_SYSTEM_MESSAGE>>> → Generated dynamically
  // <<<BEHAVIOR_REPLY_PROMPT>>> → Generated dynamically
  
  // 5. Deploy to N8N
  await deployToN8n(injectedWorkflow);
}
```

---

## 🎨 The Magic: Dynamic System Message Generation

**File:** `supabase/functions/deploy-n8n/index.ts` (Lines 55-322)

```typescript
async function generateDynamicAISystemMessage(userId) {
  // Fetches EVERYTHING from database
  const profile = await supabase
    .from('profiles')
    .select('client_config, managers, suppliers, business_types, email_labels')
    .eq('id', userId)
    .single();
  
  // Extracts business configuration
  const businessTypes = profile.business_types; // ['Pools & Spas']
  const managers = profile.managers; // [{ name: 'Aaron' }]
  const suppliers = profile.suppliers; // [{ name: 'Gecko Alliance' }]
  
  // BUILDS COMPREHENSIVE SYSTEM MESSAGE
  const systemMessage = `
    You are an expert email processor for "${businessName}".
    
    Business Type(s): ${businessTypes.join(', ')}  ← Uses profile data!
    
    Team Members:
    ${managers.map(m => `- ${m.name}: ${m.email}`).join('\n')}
    
    Known Suppliers:
    ${suppliers.map(s => `- ${s.name}`).join('\n')}
    
    ### Category Structure:
    
    **URGENT:** ${urgentKeywords.join(', ')}
    ← Keywords could come from Layer 1 schema (pools_spas.ai.json)
    
    **WATER QUALITY:** Water chemistry, testing, chemicals
    ← Industry-specific category from Layer 1!
  `;
  
  return systemMessage;
}
```

**This function generates Layer 1 content dynamically from database!**

---

## 🎯 Where Each Layer Lives:

### **Layer 1: AI Schemas**
```
📁 businessSchemas/
   ├── pools_spas.ai.json
   ├── electrician.ai.json
   ├── plumber.ai.json
   ├── hvac.ai.json
   └── ... (one per business type)

📝 Contains:
{
  "businessType": "Pools & Spas",
  "keywords": {
    "primary": ["hot tub", "spa", "pool"],
    "emergency": ["leak", "not heating"]
  },
  "aiPrompts": {
    "systemMessage": "Classify emails for pool/spa business..."
  }
}
```

### **Layer 2: Behavior Schemas**
```
📁 behaviorSchemas/
   ├── pools_spas.json
   ├── electrician.json
   ├── plumber.json
   └── ...

📝 Contains:
{
  "voiceProfile": {
    "tone": "Friendly water-care expert",
    "formalityLevel": "casual"
  },
  "aiDraftRules": {
    "upsellGuidelines": {
      "text": "Mention water testing services..."
    }
  }
}
```

### **Layer 3: Label Schemas**
```
📁 labelSchemas/
   ├── pools_spas.json
   ├── electrician.json
   ├── plumber.json
   └── ...

📝 Contains:
{
  "labels": [
    {
      "name": "URGENT",
      "color": { "backgroundColor": "#fb4c2f" },
      "sub": [
        { "name": "Equipment Failure" },
        { "name": "Leak" }
      ]
    },
    {
      "name": "WATER QUALITY",  ← Industry-specific!
      "color": { "backgroundColor": "#0b5fa5" }
    }
  ]
}
```

---

## 🔄 Complete Data Flow:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SELECTS BUSINESS TYPE                              │
│    "Pools & Spas" → Saved to profiles.business_types       │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. LAYER 3 PROVISIONING                                    │
│    labelProvisionService.js                                 │
│    ↓                                                        │
│    Reads: labelSchemas/pools_spas.json                     │
│    Creates: Gmail labels (URGENT, WATER QUALITY, etc.)     │
│    Saves: email_labels = { URGENT: "Label_325" }           │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. WORKFLOW DEPLOYMENT                                     │
│    deployment.js → templateService.js                      │
│    ↓                                                        │
│    Loads: templates/gmail-workflow-template.json (UNIVERSAL)│
│    ↓                                                        │
│    Generates AI System Message:                            │
│    - Uses business_types from profile                      │
│    - Includes managers, suppliers                          │
│    - COULD use Layer 1 keywords (not yet implemented)      │
│    ↓                                                        │
│    Generates Behavior Prompt:                              │
│    - Uses rules.tone from profile                          │
│    - COULD use Layer 2 behavior schema (not yet)           │
│    ↓                                                        │
│    Injects Label IDs (Layer 3 - WORKING!):                 │
│    - <<<LABEL_URGENT_ID>>> → "Label_325"                   │
│    - <<<LABEL_WATER_QUALITY_ID>>> → "Label_789"            │
│    ↓                                                        │
│    Sends complete workflow to N8N                          │
└─────────────────┬───────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. EMAIL PROCESSING (N8N Runtime)                          │
│                                                             │
│    📧 Email: "Hot tub heater not working!"                 │
│    ↓                                                        │
│    AI Classifier (uses generated system message)           │
│    ↓                                                        │
│    Category: "URGENT"                                       │
│    ↓                                                        │
│    Router: Applies Label_325 (URGENT)                      │
│    ↓                                                        │
│    AI Reply: Generates friendly response                   │
│    ↓                                                        │
│    ✅ Email processed!                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Key Files in the Flow:

| File | Purpose | Which Layer |
|------|---------|-------------|
| `src/lib/labelProvisionService.js` | **Creates Gmail/Outlook folders** | Layer 3 ✅ |
| `src/lib/labelSchemaMerger.js` | Merges label schemas | Layer 3 ✅ |
| `supabase/functions/deploy-n8n/index.ts` | **Generates AI system message** | Layer 1 (dynamic) ✅ |
| `src/lib/templateService.js` | Injects all data into template | All 3 layers ✅ |
| `templates/gmail-workflow-template.json` | **Universal workflow** | Receives all 3 layers ✅ |
| `src/lib/aiSchemaMerger.js` | Merges AI schemas | Layer 1 (not yet used) ⚠️ |
| `src/lib/behaviorSchemaMerger.js` | Merges behavior schemas | Layer 2 (not yet used) ⚠️ |

---

## 🎯 The Brilliant Part:

### **Your Edge Function (deploy-n8n/index.ts) generates Layer 1 & 2 DYNAMICALLY!**

Instead of reading from JSON schema files, it:

1. **Fetches profile from database** (has business_types, managers, suppliers)
2. **Generates comprehensive AI system message** on-the-fly
3. **Builds behavior prompt** from profile rules
4. **Uses Label IDs** from email_labels (created by Layer 3)

**This is actually MORE powerful than static schemas because:**
- ✅ Real-time data (managers change? Immediately reflected)
- ✅ No schema file loading overhead
- ✅ Personalized per client (not just per business type)

---

## 🚀 Summary:

Your 3-Layer System:

1. **Layer 1 (AI Classification):**
   - **Generated dynamically** from profile data (business_types, managers, suppliers)
   - Injected as `<<<AI_SYSTEM_MESSAGE>>>`
   - Could be enhanced with static schemas for keywords

2. **Layer 2 (Reply Behavior):**
   - **Generated dynamically** from profile.client_config.rules
   - Injected as `<<<BEHAVIOR_REPLY_PROMPT>>>`
   - Could be enhanced with behavior schemas for richer tone

3. **Layer 3 (Email Labels):**
   - **Fully integrated!** ✅
   - Reads from `labelSchemas/*.json`
   - Creates actual Gmail/Outlook folders
   - Injects label IDs: `<<<LABEL_URGENT_ID>>>` → `"Label_325"`

**Your implementation is actually HYBRID:**
- **Static schemas** (JSON files) for Layer 3
- **Dynamic generation** (from database) for Layers 1 & 2

**This is the best of both worlds!** 🎉

---

**Need more details on a specific layer? Just ask!** 😊


