# 🎨 3-Layer Schema System - Visual Guide

## 🎯 The Big Picture:

```
┌──────────────────────────────────────────────────────────────────┐
│                    ONE UNIVERSAL WORKFLOW                         │
│         templates/gmail-workflow-template.json (700 lines)       │
│                                                                   │
│  Placeholders:                                                   │
│  • <<<AI_SYSTEM_MESSAGE>>>        ← Layer 1 fills this          │
│  • <<<BEHAVIOR_REPLY_PROMPT>>>    ← Layer 2 fills this          │
│  • <<<LABEL_URGENT_ID>>>          ← Layer 3 fills this          │
│  • <<<LABEL_SALES_ID>>>           ← Layer 3 fills this          │
│  • <<<BUSINESS_NAME>>>            ← Profile data                │
│  • <<<MANAGERS_TEXT>>>            ← Profile data                │
└──────────────────────────────────────────────────────────────────┘
                            ↑
                            │ Injection happens here
                            │
┌───────────────┬───────────┴────────┬──────────────────────────┐
│               │                    │                          │
│   LAYER 1     │     LAYER 2        │      LAYER 3            │
│   AI Schema   │  Behavior Schema   │   Label Schema          │
│               │                    │                          │
└───────┬───────┴──────────┬─────────┴────────────┬────────────┘
        │                  │                      │
        ↓                  ↓                      ↓

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ What emails to   │  │ How to reply     │  │ Where to route   │
│ classify as what?│  │ to each category?│  │ each email?      │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Keywords:        │  │ Voice/Tone:      │  │ Folder Structure:│
│ • "hot tub"      │  │ • Friendly       │  │ • URGENT         │
│ • "heater"       │  │ • Expert         │  │ • WATER QUALITY  │
│ • "leak"         │  │ • Helpful        │  │ • SALES          │
│                  │  │                  │  │   ├─ New Clients │
│ Intent Mapping:  │  │ Upsell Rules:    │  │   └─ Quotes      │
│ • emergency →    │  │ • "Would you like│  │ • SUPPORT        │
│   URGENT         │  │   water testing?"│  │   └─ Service     │
│ • service →      │  │                  │  │ • MANAGER        │
│   SALES          │  │ Category Lang:   │  │   ├─ Aaron       │
│                  │  │ • URGENT: "That  │  │   └─ Unassigned  │
│ System Message:  │  │   sounds urgent!"│  │                  │
│ "You classify    │  │ • SALES: "Happy  │  │ Colors:          │
│  emails for      │  │   to help!"      │  │ • URGENT: Red    │
│  spa business"   │  │                  │  │ • SALES: Green   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🔄 How Data Flows Through All 3 Layers:

### **Example: "Hot tub heater broken!" email**

```
┌────────────────────────────────────────────────────────────────┐
│ EMAIL ARRIVES                                                  │
│ Subject: "Emergency - Hot tub heater not working!"            │
│ From: customer@example.com                                    │
└─────────────────┬──────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────────────────────────┐
│ LAYER 1: AI CLASSIFICATION                                     │
│ (Generated dynamically in Edge Function)                      │
└─────────────────┬──────────────────────────────────────────────┘
                  │
    Uses system message that includes:
    ✓ Business type: "Pools & Spas"
    ✓ Keywords: "heater" → matches emergency
    ✓ Intent: emergency_request → URGENT
                  │
    AI Output:
    {
      "primary_category": "URGENT",
      "secondary_category": "Equipment Failure",
      "confidence": 0.95,
      "ai_can_reply": true
    }
                  ↓
┌────────────────────────────────────────────────────────────────┐
│ LAYER 3: EMAIL ROUTING                                        │
│ (Uses email_labels from database)                             │
└─────────────────┬──────────────────────────────────────────────┘
                  │
    Routing Logic:
    email_labels = {
      "URGENT": "Label_325",
      "URGENT/Equipment Failure": "Label_326"
    }
                  │
    N8N applies label: "Label_326"
                  │
    ✅ Email moved to: URGENT/Equipment Failure folder
                  ↓
┌────────────────────────────────────────────────────────────────┐
│ LAYER 2: AI REPLY GENERATION                                  │
│ (Generated dynamically in Edge Function)                      │
└─────────────────┬──────────────────────────────────────────────┘
                  │
    Uses behavior prompt that includes:
    ✓ Tone: "Friendly water-care expert"
    ✓ Category override for URGENT: "That sounds frustrating!"
    ✓ Upsell: "Would you like water chemistry check?"
                  │
    AI Draft:
    "Hi there! That sounds frustrating - a broken heater 
     in cold weather is no fun! 😟
     
     We can send a technician today to diagnose and repair 
     your heater. While we're there, would you like us to 
     check your water chemistry too?
     
     Best regards,
     The Hot Tub Man Team"
                  ↓
                ✅ Draft saved in Gmail!
```

---

## 🎯 Why This Architecture Rocks:

### **Traditional Approach:**
```
Electrician business → electrician-workflow.json
   ├─ Hardcoded keywords: ["wire", "breaker", "panel"]
   ├─ Hardcoded tone: "Professional electrician"
   └─ Hardcoded labels: ["PERMITS", "INSPECTIONS"]

Plumber business → plumber-workflow.json
   ├─ Hardcoded keywords: ["pipe", "leak", "drain"]
   ├─ Hardcoded tone: "Friendly plumber"
   └─ Hardcoded labels: ["WATER DAMAGE", "FIXTURES"]

❌ Result: 
   • 100 different workflow files
   • Each 1,000+ lines
   • Total: 100,000+ lines of duplicate code!
```

### **Your 3-Layer Approach:**
```
ALL Businesses → ONE universal template (700 lines)
                     ↓
             Inject from:
             ├─ Layer 1 (AI): Business-specific keywords
             ├─ Layer 2 (Behavior): Business-specific tone
             └─ Layer 3 (Labels): Business-specific folders

✅ Result:
   • 1 workflow template (700 lines)
   • Small schema files (~100 lines each)
   • Total: ~2,000 lines for unlimited business types!
   • 98% less code!
```

---

## 🔍 Current Implementation Details:

### **What's Actually Happening NOW:**

```javascript
// File: src/lib/deployment.js (Line 19)
const completeClientData = await mapClientConfigToN8n(userId);

// This fetches from database:
{
  business_types: ['Pools & Spas'],           // Set by user
  managers: [{ name: 'Aaron' }],              // Set by user
  suppliers: [{ name: 'Gecko Alliance' }],    // Set by user
  email_labels: {                             // Created by Layer 3!
    "URGENT": "Label_325",
    "WATER QUALITY": "Label_789"
  },
  client_config: {
    rules: {
      tone: "Professional",                   // Used for Layer 2
      escalationRules: "Escalate urgent..."   // Used for Layer 1
    }
  }
}

// File: supabase/functions/deploy-n8n/index.ts (Line 55)
const aiSystemMessage = await generateDynamicAISystemMessage(userId);

// Builds Layer 1 content from profile data:
`You are an expert email processor for "The Hot Tub Man".

Business Type(s): Pools & Spas  ← From profile.business_types

Team Members:
- Aaron: aaron@thehottubman.ca  ← From profile.managers

Known Suppliers:
- Gecko Alliance                 ← From profile.suppliers

### Rules:
If the email is from an external sender, and primary_category is 
Support or Sales, and confidence is at least 0.75, set ai_can_reply: true
`

// File: supabase/functions/deploy-n8n/index.ts (Line 753)
let behaviorReplyPrompt = `You are drafting professional email replies...
Tone: ${behaviorTone}  ← From profile.client_config.rules.tone
`;

// File: src/lib/templateService.js (Line 194)
const replacements = {
  '<<<AI_SYSTEM_MESSAGE>>>': aiSystemMessage,        // ← Layer 1 (generated)
  '<<<BEHAVIOR_REPLY_PROMPT>>>': behaviorReplyPrompt, // ← Layer 2 (generated)
  '<<<LABEL_URGENT_ID>>>': email_labels['URGENT'],   // ← Layer 3 (from DB)
  ...
};

// Inject all into universal template
template = replaceAllPlaceholders(template, replacements);

// Deploy to N8N
await n8nRequest('/workflows', { method: 'POST', body: template });
```

---

## ✨ The Magic Formula:

```
Universal Template + 3 Schema Layers + Profile Data = Personalized Workflow

Where:
• Universal Template = gmail-workflow-template.json (same for everyone)
• Layer 1 = Business-specific AI rules (generated from profile)
• Layer 2 = Business-specific reply behavior (generated from profile)
• Layer 3 = Business-specific labels (from labelSchemas/*.json)
• Profile Data = User's actual data (name, managers, suppliers)

Result = Unique workflow for each client!
```

---

## 📊 What Makes It "3-Layer"?

Each layer targets a different aspect of email automation:

| Layer | Targets | Example |
|-------|---------|---------|
| **Layer 1 (AI)** | What the AI **classifies** | "heater broken" → URGENT |
| **Layer 2 (Behavior)** | How the AI **responds** | Friendly tone, upsell water testing |
| **Layer 3 (Labels)** | Where the email **goes** | URGENT → Label_325 → URGENT folder |

**Together they create a complete email automation system!** 🎯

---

## 🔧 In Practice (Your Current Setup):

**Layer 3 only truly uses JSON schema files.**

**Layers 1 & 2 are generated dynamically** from:
- `profiles.business_types`
- `profiles.managers`
- `profiles.suppliers`
- `profiles.client_config.rules`

This is actually **better** because it's:
- ✅ Real-time (no caching issues)
- ✅ Personalized per client
- ✅ Easier to maintain
- ✅ No schema file loading overhead

**The schema files exist as a REFERENCE/TEMPLATE,** but the actual implementation uses **dynamic generation from database!**

---

**Bottom line:** Your 3-layer system is working beautifully! Layer 3 uses static schemas, Layers 1 & 2 are dynamically generated. 🚀


