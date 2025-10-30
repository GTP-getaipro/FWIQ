# 🏢 Department Scope Deployment Flow

## Complete Deployment Process: HUB vs DEPARTMENT Mode

This document explains how `department_scope` affects labels, folders, system messages, classification, and email drafts during workflow deployment.

---

## 📊 **Quick Comparison**

| Aspect | HUB Mode `["all"]` | DEPARTMENT Mode `["sales"]` |
|--------|-------------------|---------------------------|
| **Labels/Folders** | ALL categories created | ONLY selected dept categories |
| **AI Categories** | ALL categories allowed | ONLY allowed categories |
| **Classification** | Any email type | OUT_OF_SCOPE for others |
| **System Message** | Generic (all categories) | Restricted (filtered) |
| **Email Drafts** | Can reply to all | Only replies to allowed |

---

## 🔄 **Deployment Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 1: USER SELECTION                        │
│                  (Department Scope Page)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    User selects scope:
            ┌──────────────────┴──────────────────┐
            ↓                                     ↓
    ["all"] - HUB MODE              ["sales", "support"] - DEPT MODE
            ↓                                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 2: SAVE TO DATABASE                      │
│          business_profiles.department_scope = [...]             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   STEP 3: WORKFLOW DEPLOYMENT                   │
│            (deploy-n8n Edge Function triggered)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
   LAYER 1:            LAYER 2:             LAYER 3:
   FOLDERS/            AI SYSTEM            LABELS
   LABELS              MESSAGE              MAPPING
```

---

## 🗂️ **LAYER 1: Folders & Labels Provisioning**

### **HUB Mode: `["all"]`**

```javascript
// ALL categories provisioned
Categories Created:
✅ URGENT/
✅ SALES/
   └─ FORMSUB/
✅ SUPPORT/
   └─ General/
   └─ Complaints/
✅ MANAGER/
   └─ [Manager Names]/
✅ SUPPLIERS/
✅ BANKING/
   └─ e-Transfer/
   └─ Credit Card/
✅ RECRUITMENT/
✅ MISC/

Total: ~15-25 folders/labels
```

**Code:**
```typescript
// No filtering - create ALL folders
const businessTypes = ['Hot tub & Spa', 'Pools'];
await provisionEmailFolders(userId, businessTypes, 'gmail', token, managers, suppliers);
// Creates COMPLETE folder structure
```

---

### **DEPARTMENT Mode: `["sales"]` Example**

```javascript
// ONLY Sales categories provisioned
Categories Created:
✅ SALES/
   └─ FORMSUB/
✅ OUT_OF_SCOPE/  // For non-sales emails

Total: 2-3 folders/labels
```

**Code:**
```typescript
// Filtered folder creation based on department scope
const departmentScopeArray = ['sales'];
const allowedCategories = ['SALES', 'FORMSUB', 'OUT_OF_SCOPE'];

// RPC call still provisions ALL, but workflow only uses allowed categories
await provisionEmailFolders(userId, businessTypes, 'gmail', token, managers, suppliers);
// Workflow ignores categories not in allowed list
```

---

## 🤖 **LAYER 2: AI System Message Generation**

### **HUB Mode: `["all"]`**

```javascript
// Full system message with ALL categories
AI System Message:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are an email classifier for [Business Name].

Categories:
1. URGENT - Emergency requests requiring immediate action
2. SALES - New inquiries, quotes, pricing, form submissions
   Secondary: FORMSUB
3. SUPPORT - Customer service, technical issues, complaints
   Secondary: General, Complaints
4. MANAGER - Internal team emails, strategic matters
   Secondary: [Manager Names], Unassigned
5. SUPPLIERS - Vendor communications, orders
6. BANKING - Financial transactions
   Tertiary: e-Transfer, Credit Card, Wire
7. RECRUITMENT - Job applications, hiring
8. MISC - Everything else

Return JSON with primary_category, secondary_category, ai_can_reply...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Code Location:** `lines 1833-1834`
```typescript
let aiSystemMessage = clientData.aiSystemMessage || 'You are an email classifier...';

if (!departmentScopeArray.includes('all')) {
  // Skip department filtering - use full message
}
```

---

### **DEPARTMENT Mode: `["sales", "support"]` Example**

```javascript
// Restricted system message with ONLY allowed categories
AI System Message:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Base Message...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DEPARTMENT SCOPE RESTRICTION - CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS WORKFLOW HANDLES: Sales + Support
Departments: Sales - New inquiries, quotes | Support - Customer service, emergencies

ALLOWED CATEGORIES FOR CLASSIFICATION:
  ✅ SALES
  ✅ FORMSUB
  ✅ SUPPORT
  ✅ URGENT

FOR ANY EMAIL THAT DOES NOT FIT THE ABOVE CATEGORIES:
Return this EXACT classification:
{
  "primary_category": "OUT_OF_SCOPE",
  "secondary_category": null,
  "tertiary_category": null,
  "confidence": 0.95,
  "ai_can_reply": false,
  "summary": "Email does not belong to selected departments (Sales + Support)",
  "reason": "This email should be handled by a different department"
}

IMPORTANT RULES:
1. You MUST ONLY use categories from the allowed list above
2. If email fits multiple categories, choose most specific
3. If email doesn't fit ANY allowed category, return OUT_OF_SCOPE
4. Do NOT force-fit emails into allowed categories
5. Be strict - better to mark OUT_OF_SCOPE than misclassify

EXAMPLES:
✅ "I want a quote" → SALES (allowed)
✅ "My heater is broken" → SUPPORT (allowed)
⚠️ "Invoice from supplier" → OUT_OF_SCOPE (operations not in scope)
⚠️ "Job application" → OUT_OF_SCOPE (recruitment not in scope)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Code Location:** `lines 1836-1913`
```typescript
if (!departmentScopeArray.includes('all')) {
  const departmentCategoryMap = {
    'sales': {
      categories: ['SALES', 'FORMSUB'],
      description: 'Sales - New inquiries, quotes, form submissions'
    },
    'support': {
      categories: ['SUPPORT', 'URGENT'],
      description: 'Support - Customer service, technical support, emergencies'
    },
    // ... more departments
  };
  
  // Combine categories from selected departments
  const allowedCategories = [];
  departmentScopeArray.forEach(dept => {
    allowedCategories.push(...departmentCategoryMap[dept].categories);
  });
  
  // Build restriction message
  const departmentFilter = `🎯 DEPARTMENT SCOPE RESTRICTION...`;
  
  aiSystemMessage = aiSystemMessage + departmentFilter;
}
```

---

## 📋 **LAYER 3: Classification Behavior**

### **HUB Mode Example**

```javascript
// Email: "I need a quote for a hot tub"
AI Classification:
{
  "primary_category": "SALES",
  "secondary_category": "FORMSUB",
  "confidence": 0.92,
  "ai_can_reply": true,
  "summary": "Customer requesting hot tub quote"
}

Result: ✅ Routed to SALES/ folder, AI generates reply
```

### **DEPARTMENT Mode: Sales Only**

```javascript
// Email: "I need a quote for a hot tub"
AI Classification:
{
  "primary_category": "SALES",
  "secondary_category": "FORMSUB",
  "confidence": 0.92,
  "ai_can_reply": true,
  "summary": "Customer requesting hot tub quote"
}

Result: ✅ Routed to SALES/ folder, AI generates reply

// Email: "Invoice from ABC Supplies"
AI Classification:
{
  "primary_category": "OUT_OF_SCOPE",
  "secondary_category": null,
  "confidence": 0.95,
  "ai_can_reply": false,
  "summary": "Email does not belong to selected departments (Sales)",
  "reason": "This email should be handled by operations department"
}

Result: ⚠️ Routed to OUT_OF_SCOPE/ folder, NO AI reply
```

---

## ✍️ **LAYER 4: Email Draft Generation**

### **HUB Mode**

```javascript
// AI can reply to ANY category
if (parsed.ai_can_reply === true) {
  generateReply(); // Works for all categories
}

Categories AI replies to:
✅ SALES - "Thank you for your interest..."
✅ SUPPORT - "We're sorry to hear about..."
✅ URGENT - "We're treating this as priority..."
✅ RECRUITMENT - "Thank you for your application..."
```

### **DEPARTMENT Mode: Sales Only**

```javascript
// AI can ONLY reply to allowed categories
if (parsed.ai_can_reply === true && allowedCategories.includes(parsed.primary_category)) {
  generateReply(); // Only for allowed categories
}

Categories AI replies to:
✅ SALES - "Thank you for your interest..."
❌ SUPPORT - OUT_OF_SCOPE (no reply)
❌ MANAGER - OUT_OF_SCOPE (no reply)
❌ RECRUITMENT - OUT_OF_SCOPE (no reply)
```

---

## 🎯 **Category Mapping by Department**

```typescript
const departmentCategoryMap = {
  'sales': {
    categories: ['SALES', 'FORMSUB'],
    description: 'Sales - New inquiries, quotes, form submissions'
  },
  'support': {
    categories: ['SUPPORT', 'URGENT'],
    description: 'Support - Customer service, technical support, emergencies'
  },
  'operations': {
    categories: ['MANAGER', 'SUPPLIERS', 'BANKING', 'RECRUITMENT'],
    description: 'Operations - Internal operations, supplier management, finances'
  },
  'urgent': {
    categories: ['URGENT'],
    description: 'Emergency - Urgent and emergency requests only'
  },
  'custom': {
    categories: customCategories || ['MISC'],
    description: 'Custom - Specified categories only'
  }
};
```

---

## 🔀 **Multi-Select Department Example**

### **Selection: `["sales", "support"]`**

```typescript
// Combined categories
allowedCategories = ['SALES', 'FORMSUB', 'SUPPORT', 'URGENT']

// Duplicates removed automatically
uniqueCategories = [...new Set(allowedCategories)]
// Result: ['SALES', 'FORMSUB', 'SUPPORT', 'URGENT']
```

**AI will:**
- ✅ Process SALES emails
- ✅ Process SUPPORT emails
- ✅ Process URGENT emails (overlap from support)
- ✅ Process FORMSUB emails
- ❌ Return OUT_OF_SCOPE for MANAGER, SUPPLIERS, BANKING, etc.

---

## 📁 **Database Storage**

```sql
-- HUB Mode
business_profiles.department_scope = '["all"]'::jsonb

-- Single Department
business_profiles.department_scope = '["sales"]'::jsonb

-- Multiple Departments
business_profiles.department_scope = '["sales", "support"]'::jsonb

-- Custom Categories
business_profiles.department_scope = '["custom"]'::jsonb
business_profiles.department_categories = '["SALES", "CUSTOM_CAT"]'::jsonb
```

---

## 🚀 **Deployment Trigger Points**

### **Where Department Scope is Read:**

1. **`deploy-n8n` Edge Function** (Line 1817-1826)
   ```typescript
   const { data: businessProfile } = await supabaseAdmin
     .from('business_profiles')
     .select('department_scope, department_categories')
     .eq('user_id', userId)
     .single();
   
   const departmentScopeArray = businessProfile?.department_scope || ['all'];
   ```

2. **AI System Message Generation** (Line 1836-1913)
   ```typescript
   if (!departmentScopeArray.includes('all')) {
     // Add department filtering to AI
   }
   ```

3. **Workflow JSON Injection** (Line 1915+)
   ```typescript
   const aiSystemMessage = baseMessage + departmentFilter;
   // Injected into n8n workflow template
   ```

---

## 🧪 **Testing Different Modes**

### **Test HUB Mode:**
```javascript
// Set in database
department_scope = ["all"]

// Expected behavior:
// ✅ All folders created
// ✅ AI classifies into any category
// ✅ AI replies to all appropriate emails
```

### **Test SALES Department:**
```javascript
// Set in database
department_scope = ["sales"]

// Test emails:
1. "I want a quote" → SALES ✅
2. "My heater is broken" → OUT_OF_SCOPE ⚠️
3. "Invoice from supplier" → OUT_OF_SCOPE ⚠️
```

### **Test MULTI-DEPARTMENT:**
```javascript
// Set in database
department_scope = ["sales", "support"]

// Test emails:
1. "I want a quote" → SALES ✅
2. "My heater is broken" → SUPPORT ✅
3. "Invoice from supplier" → OUT_OF_SCOPE ⚠️
4. "Job application" → OUT_OF_SCOPE ⚠️
```

---

## 📊 **Complete Data Flow**

```
USER SELECTS SCOPE
       ↓
SAVES TO business_profiles
       ↓
TRIGGERS DEPLOYMENT
       ↓
┌─────────────────────────────────────┐
│  deploy-n8n Edge Function Reads:   │
│  - department_scope                 │
│  - department_categories (optional) │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│  Maps Departments → Categories:     │
│  'sales' → ['SALES', 'FORMSUB']     │
│  'support' → ['SUPPORT', 'URGENT']  │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│  Injects into AI System Message:    │
│  ALLOWED CATEGORIES: [...]          │
│  OUT_OF_SCOPE handler added         │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│  Deploys to n8n:                    │
│  - Workflow with filtered message   │
│  - Label mapping for allowed cats   │
│  - OUT_OF_SCOPE routing             │
└─────────────────────────────────────┘
       ↓
┌─────────────────────────────────────┐
│  Runtime Behavior:                  │
│  - Emails classified                │
│  - Allowed → Process normally       │
│  - Not allowed → OUT_OF_SCOPE       │
└─────────────────────────────────────┘
```

---

## 🎓 **Key Takeaways**

1. **HUB Mode (`["all"]`):**
   - Best for small businesses handling everything
   - All categories active
   - AI processes all email types
   - Complete folder structure

2. **DEPARTMENT Mode (specific):**
   - Best for large businesses with dedicated departments
   - Only selected categories active
   - OUT_OF_SCOPE for non-matching emails
   - Minimal folder structure

3. **Multi-Select:**
   - Combines categories from multiple departments
   - Removes duplicates (e.g., URGENT in both sales & support)
   - Flexible for businesses with overlapping roles

4. **OUT_OF_SCOPE:**
   - Special category for emails outside department scope
   - Prevents AI from replying to wrong department emails
   - Routes to separate folder for manual handling

---

## 🔗 **Related Files**

- **Frontend:** `src/pages/onboarding/StepDepartmentScope.jsx`
- **Backend:** `supabase/functions/deploy-n8n/index.ts` (lines 1817-1913)
- **Migration:** `supabase/migrations/20251030_add_department_scope.sql`
- **Database:** `business_profiles.department_scope` (JSONB array)

---

**Last Updated:** October 30, 2025  
**Version:** 1.0  
**Author:** FloWorx AI System

