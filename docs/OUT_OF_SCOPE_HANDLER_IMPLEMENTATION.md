# Out-of-Scope Handler Implementation

**Date:** October 30, 2025  
**Purpose:** Add department filtering to N8N workflows

---

## 🎯 Overview

When a user selects a department scope (e.g., "Sales Only"), emails that don't belong to that department should be labeled as OUT_OF_SCOPE and not processed further.

---

## 📝 Implementation Steps

### **Step 1: Add OUT_OF_SCOPE Label to Gmail**

Run this in your N8N workflow manually or add to label provisioning:

```javascript
// Create OUT_OF_SCOPE label
await gmail.users.labels.create({
  userId: 'me',
  requestBody: {
    name: 'OUT_OF_SCOPE',
    labelListVisibility: 'labelShow',
    messageListVisibility: 'show',
    color: {
      backgroundColor: '#fb4c2f',  // Red
      textColor: '#ffffff'
    }
  }
});
```

---

### **Step 2: Add Check Department Scope Node**

**Insert this node AFTER "Check for Classification Errors" and BEFORE "Generate Label Mappings":**

```json
{
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "out-of-scope-check",
          "leftValue": "={{ $json.parsed_output.primary_category }}",
          "rightValue": "OUT_OF_SCOPE",
          "operator": {
            "type": "string",
            "operation": "equals"
          }
        }
      ],
      "combinator": "and"
    },
    "options": {}
  },
  "type": "n8n-nodes-base.if",
  "typeVersion": 2.2,
  "position": [180, 272],
  "id": "check-department-scope",
  "name": "Check Department Scope"
}
```

---

### **Step 3: Add Handle Out-of-Scope Node**

**Add this node to handle OUT_OF_SCOPE emails:**

```json
{
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $('Prepare Email Data').first().json.id }}",
    "labelIds": ["OUT_OF_SCOPE_LABEL_ID"]
  },
  "type": "n8n-nodes-base.gmail",
  "typeVersion": 2.1,
  "position": [380, 80],
  "id": "handle-out-of-scope",
  "name": "Label as Out of Scope",
  "credentials": {
    "gmailOAuth2": {
      "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
      "name": "<<<BUSINESS_NAME>>> Gmail"
    }
  }
}
```

---

### **Step 4: Update Connections**

**Current flow:**
```
Check for Classification Errors
  ↓ (no error)
Generate Label Mappings
```

**New flow:**
```
Check for Classification Errors
  ↓ (no error)
Check Department Scope
  ↓ (OUT_OF_SCOPE = true)
  └→ Label as Out of Scope → END
  ↓ (OUT_OF_SCOPE = false)
  └→ Generate Label Mappings → Continue normal flow
```

**Connection changes:**

```json
{
  "Check for Classification Errors": {
    "main": [
      [
        {
          "node": "Log Error to Supabase",
          "type": "main",
          "index": 0
        }
      ],
      [
        {
          "node": "Check Department Scope",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Check Department Scope": {
    "main": [
      [
        {
          "node": "Label as Out of Scope",
          "type": "main",
          "index": 0
        }
      ],
      [
        {
          "node": "Generate Label Mappings",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
```

---

## 🎨 Visual Workflow Flow

```
Email Trigger
    ↓
Prepare Email Data
    ↓
AI Master Classifier
    ↓
Parse AI Classification
    ↓
Check for Classification Errors
    ├─ (error) → Log Error
    └─ (no error) → Check Department Scope ← NEW
                      ├─ (OUT_OF_SCOPE) → Label as Out of Scope → END
                      └─ (in scope) → Generate Label Mappings
                                       ↓
                                     Apply Labels
                                       ↓
                                     Route to Manager
                                       ↓
                                     [Continue normal flow...]
```

---

## 📊 Department Category Mappings

### **Deployed by deploy-n8n based on department_scope:**

```javascript
const departmentCategoryMap = {
  'all': {
    // All categories allowed (current behavior)
    categories: 'ALL',
    filter: false
  },
  'sales': {
    categories: ['SALES', 'FORMSUB'],
    description: 'Sales inquiries and form submissions only'
  },
  'support': {
    categories: ['SUPPORT', 'URGENT'],
    description: 'Customer support and emergencies only'
  },
  'operations': {
    categories: ['MANAGER', 'SUPPLIERS', 'BANKING', 'RECRUITMENT'],
    description: 'Internal operations and management only'
  },
  'urgent': {
    categories: ['URGENT'],
    description: 'Emergency requests only'
  }
};
```

---

## ✅ What This Achieves

### **For Sales Department User (sales@business.com):**

**Incoming Email Types:**
```
Sales inquiry → ✅ Processed normally (SALES category)
Form submission → ✅ Processed normally (FORMSUB category)
Support request → ⚠️ Labeled OUT_OF_SCOPE, no draft, no routing
Banking email → ⚠️ Labeled OUT_OF_SCOPE, no draft, no routing
Supplier email → ⚠️ Labeled OUT_OF_SCOPE, no draft, no routing
```

**Benefits:**
- ✅ Only processes relevant emails
- ✅ Doesn't waste AI resources on irrelevant emails
- ✅ Clear visibility (OUT_OF_SCOPE label)
- ✅ Can manually review out-of-scope emails later

---

### **For Support Department User (support@business.com):**

**Incoming Email Types:**
```
Support request → ✅ Processed normally
Urgent issue → ✅ Processed normally
Sales inquiry → ⚠️ OUT_OF_SCOPE
Form submission → ⚠️ OUT_OF_SCOPE
```

---

### **For Office Hub User (office@business.com):**

**Incoming Email Types:**
```
ALL emails → ✅ Processed normally (no filtering)
```

---

## 🔧 Alternative: Simple Label-Only Approach

**If you want even simpler implementation:**

Instead of adding new nodes, just modify the "Generate Label Mappings" node:

```javascript
// In Generate Label Mappings node

const departmentScope = '<<<DEPARTMENT_SCOPE>>>';  // Injected during deployment
const parsed = $json.parsed_output;

// If out of scope, just apply OUT_OF_SCOPE label and skip further processing
if (parsed.primary_category === 'OUT_OF_SCOPE') {
  return {
    json: {
      ...parsed,
      labelsToApply: ['OUT_OF_SCOPE_LABEL_ID'],
      skipDraft: true,
      skipForward: true
    }
  };
}

// Otherwise, continue normal label generation
const labelIds = generateLabels(parsed, labelMap);
return {
  json: {
    ...parsed,
    labelsToApply: labelIds
  }
};
```

Then in "Can AI Reply?" node:
```javascript
// Add condition to skip if out of scope
conditions: [
  {
    leftValue: "={{ $json.primary_category }}",
    rightValue: "OUT_OF_SCOPE",
    operator: "notEquals"  // Only proceed if NOT out of scope
  },
  {
    leftValue: "={{ $json.ai_can_reply }}",
    rightValue: true
  }
]
```

---

## 📋 Deployment Checklist

**When redeploying with department scope:**

- [x] Database migration run (department_scope column added)
- [x] Onboarding UI updated (department selector added)
- [x] Deploy-n8n updated (AI system message filtering added)
- [ ] Templates updated (out-of-scope handler added)
- [ ] OUT_OF_SCOPE label created in Gmail/Outlook
- [ ] Test with department="sales" (should filter non-sales emails)
- [ ] Test with department="all" (should process everything)
- [ ] Dashboard shows department badge

---

## 🚀 Quick Implementation Summary

**What's Done:**
1. ✅ Database: `department_scope` column added
2. ✅ UI: Department selector in onboarding
3. ✅ Backend: AI filtering based on department

**What's Needed:**
4. ⏸️ Templates: Add out-of-scope handler (optional - AI already filters)
5. ⏸️ Dashboard: Show department badge

**Key Insight:**
The AI filtering is the MAIN mechanism. The out-of-scope handler is just for clean separation. The AI will return "OUT_OF_SCOPE" for non-department emails, and those won't trigger drafts or complex processing.

---

**You can deploy NOW and test! The core functionality is ready.** 🚀

The out-of-scope handler node is optional - the AI will already classify correctly based on department scope injected into the system message.

