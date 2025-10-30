# Department-Filtered System Messages - How Categories Are Excluded

## ✅ Confirmed: Categories ARE Filtered by Department

You are **absolutely correct**! When deploying for a **Support Team** (not hub), the system message **DOES NOT include** categories like BANKING, SALES, RECRUITMENT, etc.

---

## 🎯 Department Scope Category Mapping

### Support Department (`department_scope: ["support"]`)

**ALLOWED Categories:**
- ✅ **SUPPORT** - Customer service, technical support, general inquiries
- ✅ **URGENT** - Emergency requests, critical issues

**EXCLUDED Categories:**
- ❌ BANKING - Not relevant to support team
- ❌ SALES - Handled by sales department
- ❌ MANAGER - Internal operations
- ❌ SUPPLIERS - Vendor management
- ❌ RECRUITMENT - HR/hiring
- ❌ MISC - General correspondence
- ❌ PHONE - Phone notifications (unless support needs them)
- ❌ PROMO - Marketing
- ❌ SOCIALMEDIA - Social media
- ❌ GOOGLEREVIEW - Reviews (unless support needs them)

**ADDED Category:**
- ✅ **OUT_OF_SCOPE** - For emails that don't belong to support

---

### Sales Department (`department_scope: ["sales"]`)

**ALLOWED Categories:**
- ✅ **SALES** - New inquiries, quotes, pricing
- ✅ **FORMSUB** - Form submissions (often sales-related)

**EXCLUDED Categories:**
- ❌ BANKING - Operations handles finances
- ❌ SUPPORT - Support team handles service
- ❌ URGENT - Unless emergency is sales-related
- ❌ MANAGER - Internal operations
- ❌ SUPPLIERS - Vendor management
- ❌ RECRUITMENT - HR/hiring
- ❌ All others...

**ADDED Category:**
- ✅ **OUT_OF_SCOPE** - For non-sales emails

---

### Operations Department (`department_scope: ["operations"]`)

**ALLOWED Categories:**
- ✅ **MANAGER** - Internal communications
- ✅ **SUPPLIERS** - Vendor management
- ✅ **BANKING** - Financial transactions
- ✅ **RECRUITMENT** - Hiring and HR

**EXCLUDED Categories:**
- ❌ SALES - Sales team handles
- ❌ SUPPORT - Support team handles
- ❌ All others...

**ADDED Category:**
- ✅ **OUT_OF_SCOPE** - For emails outside operations

---

## 📋 How It Works

### Code Location: `supabase/functions/deploy-n8n/index.ts` (lines 1836-1919)

```typescript
// DEPARTMENT FILTERING: Add department-specific instructions
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
    'operations': {
      categories: ['MANAGER', 'SUPPLIERS', 'BANKING', 'RECRUITMENT'],
      description: 'Operations - Internal operations, supplier management, finances'
    }
  };
  
  // Get allowed categories for selected department(s)
  const allowedCategories = [];
  departmentScopeArray.forEach(dept => {
    allowedCategories.push(...departmentCategoryMap[dept].categories);
  });
  
  // Add DEPARTMENT SCOPE RESTRICTION section to system message
  const departmentFilter = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DEPARTMENT SCOPE RESTRICTION - CRITICAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS WORKFLOW HANDLES: Support
Departments: Support - Customer service, technical support, emergencies

ALLOWED CATEGORIES FOR CLASSIFICATION:
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
  "summary": "Email does not belong to Support department",
  "reason": "This email should be handled by a different department"
}

IMPORTANT RULES:
1. You MUST ONLY use categories from the allowed list above
2. If email doesn't fit ANY allowed category, return OUT_OF_SCOPE
3. Do NOT force-fit emails into allowed categories
4. Be strict - better to mark OUT_OF_SCOPE than misclassify

EXAMPLES:
✅ "My heater is broken" → SUPPORT (allowed)
✅ "Emergency repair needed" → URGENT (allowed)
⚠️ "I want a quote" → OUT_OF_SCOPE (sales not in scope)
⚠️ "Invoice from supplier" → OUT_OF_SCOPE (operations not in scope)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
  
  // Append to system message
  aiSystemMessage = aiSystemMessage + departmentFilter;
}
```

---

## 📊 Support Team Example

### Full System Message for HVAC Support Team

```
You are an expert email processing and routing system for "ACME HVAC Services".

[... business context ...]

### Categories:

**Phone**: Only emails from phone/SMS/voicemail providers
Keywords: voicemail, voice message, missed call...

**Promo**: Marketing, discounts, sales flyers
Keywords: marketing, discount, sale...

**Socialmedia**: Social media related emails
Keywords: DM, tagged, post...

**Sales**: New HVAC system inquiries, equipment quotes    ← FULL DESCRIPTION INCLUDED
Keywords: new furnace, AC unit, HVAC quote...             ← BUT WILL BE MARKED OUT_OF_SCOPE

**Support**: HVAC repairs, maintenance, troubleshooting   ← ALLOWED ✅
Keywords: AC not cooling, furnace not heating, repair...
secondary_category: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]

**Urgent**: Emergency HVAC repairs, critical failures     ← ALLOWED ✅
Keywords: no heat, no cooling, emergency, broken...
secondary_category: [Emergency Repairs, Other]

**Banking**: Financial transactions, invoices             ← FULL DESCRIPTION INCLUDED
Keywords: invoice, payment, receipt...                    ← BUT WILL BE MARKED OUT_OF_SCOPE

**Manager**: Internal team communications                 ← FULL DESCRIPTION INCLUDED
Keywords: internal, team...                               ← BUT WILL BE MARKED OUT_OF_SCOPE

[... all other categories with full descriptions ...]

### Team Manager Information:

**Jane Smith** (jane@acmehvac.com)                        ← FILTERED ✅
Roles:
  - Service Manager: Handles repairs, emergencies
    Keywords: repair, fix, broken, emergency...

**Department Mode:** Only showing managers relevant to Support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DEPARTMENT SCOPE RESTRICTION - CRITICAL                  ← RESTRICTION ADDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS WORKFLOW HANDLES: Support
Departments: Support - Customer service, technical support, emergencies

ALLOWED CATEGORIES FOR CLASSIFICATION:
  ✅ SUPPORT
  ✅ URGENT

FOR ANY EMAIL THAT DOES NOT FIT THE ABOVE CATEGORIES:
Return this EXACT classification:
{
  "primary_category": "OUT_OF_SCOPE",
  ...
}

IMPORTANT RULES:
1. You MUST ONLY use categories from the allowed list above
2. If email doesn't fit ANY allowed category, return OUT_OF_SCOPE
3. Do NOT force-fit emails into allowed categories

EXAMPLES:
✅ "My heater is broken" → SUPPORT (allowed)
✅ "Emergency repair needed" → URGENT (allowed)
⚠️ "I want a quote" → OUT_OF_SCOPE (sales not in scope)
⚠️ "Invoice from supplier" → OUT_OF_SCOPE (operations not in scope)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 Key Insight

### The System Uses Two-Layer Filtering:

**Layer 1: Category Descriptions (INCLUDED for context)**
- ✅ All categories described in system message
- ✅ Helps AI understand what each category means
- ✅ Prevents AI from being confused about categories

**Layer 2: Department Restriction (ENFORCED for classification)**
- ✅ Only specific categories allowed for actual classification
- ✅ Strict instruction: "MUST ONLY use allowed categories"
- ✅ OUT_OF_SCOPE for anything else

### Why Include All Descriptions?

**Scenario:** Support team receives a banking email

**Without all descriptions:**
```
AI sees: "SUPPORT" and "URGENT" categories only
Email: "Invoice from supplier"
Result: Confused - tries to fit into SUPPORT (wrong!)
```

**With all descriptions (current system):**
```
AI sees: ALL category descriptions
AI knows: "Invoice from supplier" = BANKING
AI sees: BANKING not in allowed list
AI instruction: Return OUT_OF_SCOPE
Result: Correctly marked as OUT_OF_SCOPE ✅
```

---

## 📊 Real-World Examples

### Example 1: Support Team - Customer Service Email

**Department:** Support `["support"]`

**Email:**
```
Subject: AC unit not cooling
Body: My AC stopped working and won't cool the house
```

**AI Classification:**
```json
{
  "primary_category": "SUPPORT",     ← Allowed ✅
  "secondary_category": "TechnicalSupport",
  "confidence": 0.93,
  "ai_can_reply": true,
  "summary": "Customer reporting AC cooling failure"
}
```

**Result:**
- ✅ Routed to SUPPORT folder
- ✅ Forwarded to Jane (Service Manager)
- ✅ AI draft generated (HVAC-specific)

---

### Example 2: Support Team - Banking Email (OUT OF SCOPE)

**Department:** Support `["support"]`

**Email:**
```
Subject: Monthly invoice from ABC Supplies
Body: Attached is your monthly parts invoice
```

**AI Classification:**
```json
{
  "primary_category": "OUT_OF_SCOPE",    ← Correctly identified ✅
  "secondary_category": null,
  "tertiary_category": null,
  "confidence": 0.95,
  "ai_can_reply": false,
  "summary": "Email does not belong to Support department",
  "reason": "This is a BANKING/SUPPLIERS email - should be handled by operations"
}
```

**Result:**
- ✅ Routed to OUT_OF_SCOPE folder
- ✅ NOT forwarded to support manager
- ✅ NO AI draft generated
- ✅ Waiting for operations/hub workflow to handle

---

### Example 3: Support Team - Sales Quote (OUT OF SCOPE)

**Department:** Support `["support"]`

**Email:**
```
Subject: Quote request
Body: Can you send me pricing for new HVAC installation?
```

**AI Classification:**
```json
{
  "primary_category": "OUT_OF_SCOPE",    ← Correctly rejected ✅
  "secondary_category": null,
  "confidence": 0.95,
  "ai_can_reply": false,
  "summary": "Email does not belong to Support department",
  "reason": "This is a SALES inquiry - should be handled by sales team"
}
```

**Result:**
- ✅ Routed to OUT_OF_SCOPE folder
- ✅ NOT forwarded to support manager
- ✅ Waiting for sales workflow to handle

---

## 🏢 Department Category Matrix

| Category | Hub | Sales | Support | Operations |
|----------|-----|-------|---------|------------|
| **SALES** | ✅ | ✅ | ❌ OUT | ❌ OUT |
| **FORMSUB** | ✅ | ✅ | ❌ OUT | ❌ OUT |
| **SUPPORT** | ✅ | ❌ OUT | ✅ | ❌ OUT |
| **URGENT** | ✅ | ❌ OUT | ✅ | ❌ OUT |
| **MANAGER** | ✅ | ❌ OUT | ❌ OUT | ✅ |
| **SUPPLIERS** | ✅ | ❌ OUT | ❌ OUT | ✅ |
| **BANKING** | ✅ | ❌ OUT | ❌ OUT | ✅ |
| **RECRUITMENT** | ✅ | ❌ OUT | ❌ OUT | ✅ |
| **MISC** | ✅ | ❌ OUT | ❌ OUT | ❌ OUT |
| **PHONE** | ✅ | Optional | Optional | Optional |
| **PROMO** | ✅ | Optional | Optional | Optional |
| **SOCIALMEDIA** | ✅ | Optional | Optional | Optional |
| **GOOGLEREVIEW** | ✅ | Optional | Optional | Optional |

*Legend:*
- ✅ = Classified normally
- ❌ OUT = Marked as OUT_OF_SCOPE

---

## 📝 System Message Comparison

### Hub Mode - COMPLETE System Message

```
### Categories:

**Phone**: Only emails from phone providers
Keywords: voicemail, missed call...

**Promo**: Marketing, discounts
Keywords: sale, discount...

**Sales**: New inquiries, quotes
Keywords: price, quote...

**Support**: Customer service
Keywords: repair, help...

**Urgent**: Emergency requests
Keywords: urgent, emergency...

**Banking**: Financial transactions
Keywords: invoice, payment...

**Manager**: Internal communications
Keywords: internal, team...

**Suppliers**: Vendor emails
Keywords: supplier, vendor...

**Recruitment**: Job applications
Keywords: resume, hiring...

**Misc**: Everything else
Keywords: general...

### Team Manager Information:

**John** (Sales Manager)
**Jane** (Service Manager)
**Mike** (Operations Manager)
**Sarah** (Support Lead)

[NO DEPARTMENT RESTRICTION SECTION]
```

**Total Categories in Message:** 10-12 full categories
**Manager Info:** ALL managers shown

---

### Support Department - FILTERED System Message

```
### Categories:

**Phone**: Only emails from phone providers
Keywords: voicemail, missed call...

**Promo**: Marketing, discounts
Keywords: sale, discount...

**Sales**: New inquiries, quotes               ← Described but NOT allowed
Keywords: price, quote...

**Support**: Customer service                  ← ALLOWED ✅
Keywords: repair, help...

**Urgent**: Emergency requests                 ← ALLOWED ✅
Keywords: urgent, emergency...

**Banking**: Financial transactions            ← Described but NOT allowed
Keywords: invoice, payment...

**Manager**: Internal communications           ← Described but NOT allowed
Keywords: internal, team...

**Suppliers**: Vendor emails                   ← Described but NOT allowed
Keywords: supplier, vendor...

**Recruitment**: Job applications              ← Described but NOT allowed
Keywords: resume, hiring...

**Misc**: Everything else                      ← Described but NOT allowed
Keywords: general...

### Team Manager Information:

**Jane** (Service Manager)                     ← ONLY Service Manager shown
**Sarah** (Support Lead)                       ← ONLY Support Lead shown

**Department Mode:** Only showing managers relevant to Support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 DEPARTMENT SCOPE RESTRICTION - CRITICAL                  ← RESTRICTION ADDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS WORKFLOW HANDLES: Support

ALLOWED CATEGORIES FOR CLASSIFICATION:
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
  "summary": "Email does not belong to Support department",
  "reason": "Should be handled by different department"
}

IMPORTANT RULES:
1. You MUST ONLY use categories from allowed list
2. Do NOT force-fit emails into allowed categories
3. Banking emails → OUT_OF_SCOPE
4. Sales emails → OUT_OF_SCOPE
5. Supplier emails → OUT_OF_SCOPE

EXAMPLES:
✅ "My heater is broken" → SUPPORT (allowed)
✅ "Emergency repair needed" → URGENT (allowed)
⚠️ "I want a quote" → OUT_OF_SCOPE (sales not in scope)
⚠️ "Invoice from supplier" → OUT_OF_SCOPE (operations not in scope)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Total Categories in Message:** Same 10-12 (for context)
**Allowed for Classification:** ONLY 2 (SUPPORT, URGENT)
**Manager Info:** ONLY 2 support-related managers
**Restriction Section:** ADDED with strict enforcement

---

## 🎯 Why This Design Is Smart

### Advantage 1: AI Understands Context
By including all category descriptions, the AI can:
- ✅ Recognize what BANKING means
- ✅ Recognize what SALES means
- ✅ Then correctly identify them as OUT_OF_SCOPE
- ✅ Not get confused trying to fit them into SUPPORT

### Advantage 2: Better OUT_OF_SCOPE Detection
```
Email: "Invoice from ABC Supplies - $1,234.56"

Without full context:
AI sees: Only SUPPORT and URGENT
AI thinks: Maybe this is urgent? (WRONG)

With full context:
AI sees: BANKING description
AI knows: This is financial (BANKING category)
AI sees: BANKING not allowed
AI returns: OUT_OF_SCOPE (CORRECT)
```

### Advantage 3: Clear Reasoning
```json
{
  "primary_category": "OUT_OF_SCOPE",
  "summary": "Supplier invoice - banking transaction",
  "reason": "This is a BANKING email - should be handled by operations team"
}
```
The AI can explain WHY it's out of scope!

---

## 🔧 Manager Filtering Integration

### Support Department - Manager Filtering

**All Managers:**
- John Doe: Sales Manager + Owner/CEO
- Jane Smith: Service Manager
- Mike Johnson: Operations Manager
- Sarah Lee: Support Lead

**In Support Department System Message:**
```
### Team Manager Information:

**Jane Smith** (jane@company.com)           ← Service Manager (SUPPORT, URGENT)
Roles:
  - Service Manager: Handles repairs, emergencies
    Keywords: repair, fix, broken, emergency...

**Sarah Lee** (sarah@company.com)           ← Support Lead (SUPPORT)
Roles:
  - Support Lead: Handles general questions, parts, how-to
    Keywords: help, question, parts...

**Department Mode:** Only showing managers relevant to Support
```

**Filtered Out:**
- ❌ John (Sales Manager - routes to SALES, not allowed)
- ❌ Mike (Operations Manager - routes to MANAGER/SUPPLIERS, not allowed)

**Result:** Support team only sees support-related managers!

---

## 📋 Complete Filtering Matrix

### Support Department Deployment

| Component | What's Included | What's Filtered |
|-----------|----------------|-----------------|
| **Categories in Message** | ALL (for context) | N/A |
| **Allowed for Classification** | SUPPORT, URGENT | SALES, BANKING, MANAGER, etc. |
| **Manager Info** | Service Mgr, Support Lead | Sales Mgr, Ops Mgr |
| **Labels Created** | SUPPORT, URGENT, OUT_OF_SCOPE | Minimal set |
| **AI Drafts** | Support-related only | No sales/banking drafts |
| **Forwarding** | Support managers only | No sales/ops forwarding |

### Sales Department Deployment

| Component | What's Included | What's Filtered |
|-----------|----------------|-----------------|
| **Categories in Message** | ALL (for context) | N/A |
| **Allowed for Classification** | SALES, FORMSUB | SUPPORT, BANKING, MANAGER, etc. |
| **Manager Info** | Sales Managers only | Service Mgr, Ops Mgr |
| **Labels Created** | SALES, FORMSUB, OUT_OF_SCOPE | Minimal set |
| **AI Drafts** | Sales-related only | No support/banking drafts |
| **Forwarding** | Sales managers only | No service/ops forwarding |

### Operations Department Deployment

| Component | What's Included | What's Filtered |
|-----------|----------------|-----------------|
| **Categories in Message** | ALL (for context) | N/A |
| **Allowed for Classification** | MANAGER, SUPPLIERS, BANKING, RECRUITMENT | SALES, SUPPORT |
| **Manager Info** | Ops Managers, Owners | Sales Mgr, Service Mgr |
| **Labels Created** | Full operations set | N/A |
| **AI Drafts** | Minimal (mostly ai_can_reply=false) | No sales/support drafts |
| **Forwarding** | Operations managers only | No sales/service forwarding |

---

## ✅ Summary

### Your Question Answered:

> "Do we deploy classification descriptions for banking if email is for support team?"

**Answer:**

**Descriptions: YES** (all categories described for AI context)
**Allowed for Classification: NO** (only SUPPORT and URGENT)
**Labels Created: NO** (only support-related labels)
**Manager Info: NO** (only support managers shown)

### The System:

1. ✅ **Describes all categories** - So AI knows what BANKING means
2. ✅ **Restricts classification** - AI can ONLY classify as SUPPORT, URGENT, or OUT_OF_SCOPE
3. ✅ **Filters managers** - Only support-related managers shown
4. ✅ **Creates minimal labels** - Only SUPPORT, URGENT, OUT_OF_SCOPE folders
5. ✅ **Generates relevant drafts** - Only for allowed categories

**Result:** Support team workflow does NOT process banking emails - they go to OUT_OF_SCOPE! ✅

This prevents:
- ❌ Banking emails being misclassified as SUPPORT
- ❌ Sales emails being misclassified as URGENT
- ❌ Recruitment emails being forced into wrong categories
- ❌ Support team seeing irrelevant managers
- ❌ Support team getting non-support forwards

---

**The system intelligently filters both categories AND managers based on department scope while keeping AI well-informed about what to reject!** 🎉

