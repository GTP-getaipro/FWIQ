# 🔄 Complete Label ID Flow: Schema → Gmail API → Database → n8n

## 🎯 **You're Correct!**

The **label schemas** define the STRUCTURE, but the **actual Gmail/Outlook IDs** are what get used in n8n for routing.

---

## 📊 **Complete Flow Diagram**

```
STEP 1: Label Schema (Template)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: src/labelSchemas/electrician.json

{
  "labels": [
    {
      "name": "URGENT",
      "color": { "backgroundColor": "#fb4c2f", "textColor": "#ffffff" },
      "sub": [
        { "name": "No Power" },
        { "name": "Electrical Hazard" }
      ]
    },
    {
      "name": "PERMITS",
      "sub": [
        { "name": "Permit Applications" },
        { "name": "Inspections" }
      ]
    }
  ]
}

This defines WHAT to create, NOT the IDs


STEP 2: Label Creation (Gmail/Outlook API Call)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: src/lib/labelProvisionService.js

Code executes:
├── POST https://www.googleapis.com/gmail/v1/users/me/labels
├── Body: {
│     "name": "URGENT",
│     "color": { "backgroundColor": "#fb4c2f", "textColor": "#ffffff" }
│   }
└── Gmail API Response:
    {
      "id": "Label_5531268829132825695",  ← ACTUAL LABEL ID!
      "name": "URGENT",
      "type": "user",
      "color": { ... }
    }

Then creates subcategories:
├── POST for "URGENT/No Power"
│   Response: { "id": "Label_1234567890123456789", ... }
├── POST for "URGENT/Electrical Hazard"
│   Response: { "id": "Label_9876543210987654321", ... }
├── POST for "PERMITS"
│   Response: { "id": "Label_5555555555555555555", ... }
└── etc.


STEP 3: Save Label IDs to Database
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: src/lib/labelProvisionService.js (somewhere near end)

Builds mapping object:
const labelMapping = {
  "URGENT": "Label_5531268829132825695",
  "URGENT/No Power": "Label_1234567890123456789",
  "URGENT/Electrical Hazard": "Label_9876543210987654321",
  "PERMITS": "Label_5555555555555555555",
  "PERMITS/Permit Applications": "Label_6666666666666666666",
  "PERMITS/Inspections": "Label_7777777777777777777",
  "MANAGER": "Label_8888888888888888888",
  "MANAGER/John": "Label_9999999999999999999",
  // ... etc for all labels created
};

Saves to database:
await supabase
  .from('profiles')
  .update({ 
    email_labels: labelMapping  ← SAVED HERE!
  })
  .eq('id', userId);


STEP 4: Inject Label IDs into n8n Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: src/lib/templateService.js OR supabase/functions/deploy-n8n/index.ts

// Fetch label IDs from database
const { data: profile } = await supabase
  .from('profiles')
  .select('email_labels')
  .eq('id', userId)
  .single();

// profile.email_labels = {
//   "URGENT": "Label_5531268829132825695",
//   "PERMITS": "Label_5555555555555555555",
//   // ...
// }

// Inject into n8n template
const replacements = {
  '<<<LABEL_MAP>>>': JSON.stringify(profile.email_labels),
  // This injects: {"URGENT":"Label_5531268829132825695", ...}
};

// Replace in template
let workflowTemplate = JSON.stringify(n8nTemplate);
workflowTemplate = workflowTemplate.replace(
  '<<<LABEL_MAP>>>',
  JSON.stringify(profile.email_labels)
);


STEP 5: n8n Workflow Uses Label IDs for Routing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File: Deployed n8n workflow (in n8n instance)

Example Node: "Route to URGENT"
{
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $json.parsed_output.id }}",
    "labelIds": [
      "Label_5531268829132825695"  ← ACTUAL GMAIL LABEL ID!
    ]
  },
  "type": "n8n-nodes-base.gmail",
  "name": "Apply URGENT Label"
}

When email classified as URGENT:
├── n8n calls Gmail API
├── POST /gmail/v1/users/me/messages/{messageId}/modify
├── Body: {
│     "addLabelIds": ["Label_5531268829132825695"]
│   }
└── Gmail applies the label → Email moved to URGENT folder ✅


STEP 6: Email Routing in Action
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Runtime: Email arrives: "Emergency! Panel sparking!"

n8n Workflow Processing:
├── AI Classifier determines: primary_category = "URGENT"
├── Switch/If node routes to URGENT branch
├── Gmail node executes with labelIds: ["Label_5531268829132825695"]
├── Gmail API applies label to email
└── Email appears in URGENT folder in Gmail ✅
```

---

## 🔑 **Key Understanding**

### **Schema Role vs. Label ID Role:**

| Stage | Schema Purpose | Label ID Purpose |
|-------|---------------|------------------|
| **Design Time** | Defines WHAT labels to create | N/A - IDs don't exist yet |
| **Provisioning** | Structure for API calls | Returned by Gmail/Outlook API |
| **Storage** | N/A - structure not stored | Saved to `profiles.email_labels` |
| **n8n Deployment** | N/A - not used directly | Injected as `<<<LABEL_MAP>>>` |
| **Runtime** | N/A - not used | Used in `addLabels` operations |

---

## 📋 **The Label Mapping Object**

### **Stored in:** `profiles.email_labels` (JSONB column)

```json
{
  "BANKING": "Label_8675309",
  "BANKING/e-Transfer": "Label_1234567",
  "BANKING/e-Transfer/From Business": "Label_7890123",
  "BANKING/e-Transfer/To Business": "Label_4567890",
  "URGENT": "Label_5531268829132825695",
  "URGENT/No Power": "Label_1381962670795847883",
  "URGENT/Electrical Hazard": "Label_3970665389479569628",
  "PERMITS": "Label_6896136905128060519",
  "PERMITS/Permit Applications": "Label_2203765197792162701",
  "MANAGER": "Label_9876543",
  "MANAGER/John": "Label_1357924",
  "MANAGER/Jane": "Label_2468013",
  "SUPPLIERS": "Label_5551212",
  "SUPPLIERS/Home Depot": "Label_9998888",
  "SUPPORT": "Label_7776666",
  "SALES": "Label_3332222"
}
```

**This is THE critical mapping that n8n needs!**

---

## 🔄 **Complete Code Trace**

### **1. Label Creation** (`src/lib/labelProvisionService.js`)

```javascript
// Around line 150-200
const createdLabels = [];

for (const label of schema.labels) {
  // Create parent label
  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/labels', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({
      name: label.name,  // "URGENT"
      color: label.color // From schema
    })
  });
  
  const labelData = await response.json();
  const labelId = labelData.id;  // "Label_5531268829132825695"
  
  createdLabels.push({
    name: label.name,
    id: labelId  // ← THE ACTUAL ID FROM GMAIL
  });
  
  // Create subcategories
  if (label.sub) {
    for (const subLabel of label.sub) {
      const subResponse = await fetch(...);
      const subData = await subResponse.json();
      
      createdLabels.push({
        name: `${label.name}/${subLabel.name}`,
        id: subData.id  // ← SUBCATEGORY ID FROM GMAIL
      });
    }
  }
}

// Build mapping object
const labelMapping = {};
createdLabels.forEach(label => {
  labelMapping[label.name] = label.id;
});

// Save to database
await supabase
  .from('profiles')
  .update({ email_labels: labelMapping })
  .eq('id', userId);
```

---

### **2. Label ID Injection** (`supabase/functions/deploy-n8n/index.ts`)

```typescript
// Line 236-240
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('client_config, managers, suppliers, email_labels')
  .eq('id', userId)
  .single();

// profile.email_labels = {
//   "URGENT": "Label_5531268829132825695",
//   "PERMITS": "Label_5555555555555555555",
//   ...
// }

// Line 358-369 - Build client data for template injection
const clientData = {
  id: userId,
  ...profile.client_config,
  managers: profile.managers || [],
  suppliers: profile.suppliers || [],
  email_labels: profile.email_labels || {},  // ← LABEL IDS INCLUDED
  integrations: { ... }
};

// Line 371 - Inject into workflow template
const workflowJson = injectOnboardingData(clientData);

// Inside injectOnboardingData (line 79):
'<<<LABEL_MAP>>>': JSON.stringify(clientData.email_labels || {})
// This becomes: {"URGENT":"Label_5531268829132825695",...}
```

---

### **3. n8n Workflow Uses IDs** (Deployed workflow)

```json
{
  "nodes": [
    {
      "name": "Route to URGENT",
      "type": "n8n-nodes-base.gmail",
      "parameters": {
        "operation": "addLabels",
        "messageId": "={{ $json.id }}",
        "labelIds": [
          "<<<LABEL_URGENT_ID>>>"
        ]
      }
    }
  ]
}
```

After placeholder replacement:

```json
{
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $json.id }}",
    "labelIds": [
      "Label_5531268829132825695"  ← ACTUAL GMAIL ID!
    ]
  }
}
```

---

## 🎯 **The Complete Relationship**

```
┌─────────────────────────────────────────────────────┐
│  LAYER 3: labelSchemas/*.json                       │
│  Role: TEMPLATE (defines structure)                 │
│  Contains:                                          │
│  ├── Label names ("URGENT", "PERMITS")             │
│  ├── Hierarchy (parent/child relationships)         │
│  ├── Colors (for visual organization)               │
│  └── Dynamic variables ({{Manager1}})               │
│                                                     │
│  Does NOT contain: Actual Gmail/Outlook IDs         │
└─────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  labelProvisionService.js │
        │  Reads schema structure   │
        └───────────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Gmail/Outlook API        │
        │  POST /labels             │
        │  Creates label in email   │
        └───────────────────────────┘
                    ↓
        Gmail API Returns:
        {
          "id": "Label_5531268829132825695",  ← THE ID!
          "name": "URGENT",
          ...
        }
                    ↓
        ┌───────────────────────────┐
        │  profiles.email_labels    │
        │  (Database JSONB column)  │
        └───────────────────────────┘
        
        Saved as:
        {
          "URGENT": "Label_5531268829132825695",
          "URGENT/No Power": "Label_1234567...",
          "PERMITS": "Label_5555555...",
          ...
        }
                    ↓
        ┌───────────────────────────┐
        │  n8n Workflow Deployment  │
        │  Reads email_labels       │
        └───────────────────────────┘
                    ↓
        Injects into template:
        '<<<LABEL_MAP>>>': '{"URGENT":"Label_5531..."}'
                    ↓
        ┌───────────────────────────┐
        │  n8n Workflow (deployed)  │
        │  Uses actual label IDs    │
        └───────────────────────────┘
        
        Node configuration:
        {
          "labelIds": ["Label_5531268829132825695"]
        }
                    ↓
        ┌───────────────────────────┐
        │  Runtime: Email arrives   │
        │  n8n applies label by ID  │
        └───────────────────────────┘
        
        Gmail API Call:
        POST /messages/{messageId}/modify
        Body: {
          "addLabelIds": ["Label_5531268829132825695"]
        }
                    ↓
        Email routed to URGENT folder ✅
```

---

## 📝 **Real Example from Your Codebase**

### **Example: n8nLiveExample.json (Line 6-9)**

```json
{
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $json.parsed_output.id }}",
    "labelIds": [
      "Label_1381962670795847883"  ← ACTUAL GMAIL LABEL ID
    ]
  },
  "name": "SALES1"
}
```

**This is THE ACTUAL ID from Gmail!**

### **How It Got There:**

1. **Label Schema** defined: `SALES` label with structure
2. **Gmail API** created label, returned: `"id": "Label_1381962670795847883"`
3. **Database** saved: `email_labels.SALES = "Label_1381962670795847883"`
4. **n8n Deployment** injected: `labelIds: ["Label_1381962670795847883"]`
5. **Runtime** n8n uses this ID to route emails

---

## 🔍 **Where Label IDs Are Stored**

### **Database Table: `profiles`**

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email_labels jsonb,  ← LABEL ID MAPPING STORED HERE!
  -- ...
);
```

### **Example Data:**

```json
{
  "id": "user-123-abc",
  "email_labels": {
    "BANKING": "Label_8675309",
    "BANKING/e-Transfer": "Label_1234567",
    "BANKING/e-Transfer/From Business": "Label_7890123",
    "BANKING/e-Transfer/To Business": "Label_4567890",
    "URGENT": "Label_5531268829132825695",
    "MANAGER/John": "Label_9999999999999999999",
    "SUPPLIERS/Strong Spas": "Label_3142429667638460093"
  }
}
```

**This mapping is THE KEY to n8n routing!**

---

## 🔄 **How n8n Workflow Uses the IDs**

### **Template Placeholder:**

**File:** `src/lib/n8n-templates/electrician_template.json`

```json
{
  "nodes": [
    {
      "name": "Route to URGENT",
      "type": "n8n-nodes-base.gmail",
      "parameters": {
        "operation": "addLabels",
        "messageId": "={{ $json.id }}",
        "labelIds": [
          "<<<LABEL_URGENT>>>"  ← PLACEHOLDER
        ]
      }
    },
    {
      "name": "Route to PERMITS",
      "parameters": {
        "operation": "addLabels",
        "labelIds": [
          "<<<LABEL_PERMITS>>>"  ← PLACEHOLDER
        ]
      }
    }
  ]
}
```

### **After Injection:**

```json
{
  "nodes": [
    {
      "name": "Route to URGENT",
      "parameters": {
        "operation": "addLabels",
        "messageId": "={{ $json.id }}",
        "labelIds": [
          "Label_5531268829132825695"  ← REAL GMAIL ID!
        ]
      }
    },
    {
      "name": "Route to PERMITS",
      "parameters": {
        "operation": "addLabels",
        "labelIds": [
          "Label_5555555555555555555"  ← REAL GMAIL ID!
        ]
      }
    }
  ]
}
```

---

## 🎯 **The 3 Layers in Context of Label IDs**

### **LAYER 3: labelSchemas/*.json**
**Purpose:** Define WHAT labels to create  
**Contains:** Label names, hierarchy, colors  
**Does NOT contain:** Gmail/Outlook IDs  
**Output:** Structure template

### **Label Creation Process:**
**Input:** Label schema structure  
**Process:** Gmail/Outlook API calls  
**Output:** Label IDs from email provider  

### **Database: profiles.email_labels**
**Purpose:** Store label name → ID mapping  
**Contains:** `{"URGENT": "Label_5531..."}`  
**Used by:** n8n workflow deployment

### **n8n Workflow:**
**Input:** email_labels mapping from database  
**Process:** Replace `<<<LABEL_MAP>>>` placeholder  
**Output:** Workflow with real Gmail label IDs  
**Runtime:** Uses IDs to route emails

---

## 💡 **Why This Flow Matters**

### **The Label Schema (Layer 3) defines:**
- ✅ Label hierarchy (URGENT > No Power)
- ✅ Colors for visual organization
- ✅ Order of creation
- ✅ Dynamic variables for team members

### **The Gmail/Outlook API provides:**
- ✅ **Actual label IDs** (Label_123456...)
- ✅ Confirmation labels exist
- ✅ Label metadata

### **The email_labels mapping enables:**
- ✅ **n8n routing by ID** (critical!)
- ✅ Reconnection if workflow redeployed
- ✅ Sync validation
- ✅ Label management

### **The n8n workflow uses:**
- ✅ **Label IDs for addLabels operation**
- ✅ Category name for classification logic
- ✅ Both work together for routing

---

## 🔧 **How to Access Label IDs in n8n**

### **Option 1: Direct Label ID (Current - Hardcoded)**

```javascript
// n8n workflow node
{
  "labelIds": ["Label_5531268829132825695"]  // Hardcoded ID
}
```

**Problem:** If label deleted and recreated, ID changes, workflow breaks ❌

---

### **Option 2: Label Mapping (Better - Dynamic)**

```javascript
// Inject label mapping into workflow as variable
const labelMap = {
  "URGENT": "Label_5531268829132825695",
  "PERMITS": "Label_5555555555555555555"
};

// n8n workflow node uses expression
{
  "labelIds": ["={{ $vars.LABEL_MAP['URGENT'] }}"]  // Dynamic lookup
}
```

**Benefit:** If label recreated, just update mapping, workflow still works ✅

---

### **Option 3: Environment Variables (Best - Flexible)**

```javascript
// In n8n workflow settings
{
  "settings": {
    "executionData": {
      "variables": {
        "LABEL_URGENT": "Label_5531268829132825695",
        "LABEL_PERMITS": "Label_5555555555555555555",
        "LABEL_MANAGER_JOHN": "Label_9999999999999999999"
      }
    }
  }
}

// n8n node uses environment variable
{
  "labelIds": ["={{ $vars.LABEL_URGENT }}"]
}
```

**Benefit:** Centralized, easy to update, reusable ✅

---

## 📊 **Current Implementation in Your Workflow**

**File:** `src/lib/n8nLiveExample.json` (Lines 6-9, 31-33, etc.)

```json
{
  "labelIds": [
    "Label_1381962670795847883"  ← Hardcoded Gmail ID
  ]
}
```

**This is how it's currently done** - each routing node has hardcoded label ID.

---

## 🎯 **Recommended: Dynamic Label ID Injection**

### **Update n8n Template to Use Label Map:**

```javascript
// In template placeholder
{
  "parameters": {
    "labelIds": ["<<<LABEL_URGENT_ID>>>"]  // Placeholder
  }
}

// During deployment, replace with actual ID
const replacements = {
  '<<<LABEL_URGENT_ID>>>': profile.email_labels['URGENT'],
  '<<<LABEL_PERMITS_ID>>>': profile.email_labels['PERMITS'],
  '<<<LABEL_MANAGER_JOHN_ID>>>': profile.email_labels['MANAGER/John'],
  // ... for each label
};
```

### **Or inject entire mapping as workflow variable:**

```javascript
// Inject label mapping into n8n workflow settings
workflowTemplate.settings = {
  ...workflowTemplate.settings,
  executionData: {
    variables: profile.email_labels  // Entire mapping!
  }
};

// Nodes can then reference dynamically
{
  "labelIds": ["={{ $vars['URGENT'] }}"]  // Dynamic!
}
```

---

## ✅ **Summary: Label ID Complete Flow**

```
1. SCHEMA DEFINES STRUCTURE
   labelSchemas/electrician.json
   └── { name: "URGENT", sub: ["No Power"] }

2. API CREATES & RETURNS IDS
   Gmail API POST /labels
   └── Response: { id: "Label_5531268829132825695" }

3. DATABASE STORES MAPPING
   profiles.email_labels
   └── { "URGENT": "Label_5531268829132825695" }

4. N8N WORKFLOW INJECTED WITH IDS
   Template: "<<<LABEL_MAP>>>"
   Replaced with: {"URGENT":"Label_5531..."}

5. RUNTIME ROUTING BY ID
   n8n node: { labelIds: ["Label_5531..."] }
   Gmail API applies label by ID
   Email routed to URGENT folder ✅
```

**The schemas provide the blueprint, the API provides the IDs, the database stores the mapping, and n8n uses the IDs for routing!** 🎯

---

📁 **Complete label ID flow documented in:** `LABEL_ID_FLOW_COMPLETE.md`

**Key Takeaway:** Label schemas = structure template. email_labels = actual Gmail/Outlook IDs used by n8n for routing. They work together!
