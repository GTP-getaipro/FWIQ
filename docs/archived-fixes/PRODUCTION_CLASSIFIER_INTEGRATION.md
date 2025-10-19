# 🎯 Production Classifier Integration with Label Keywords

## 📊 **Analysis of Real Production Classifier**

This document analyzes "The Hot Tub Man Ltd." production classifier and shows how to integrate it with our enhanced label keyword system.

---

## 🔍 **Key Elements in Production Classifier**

### **1. Business Context**
```
"The Hot Tub Man Ltd."
Manager routing: Hailey, Jillian, Stacie, Aaron
Suppliers: Aqua Spa Pool Supply, Paradise Patio Furniture, Strong Spas
```

### **2. Critical Rules**
- ✅ Auto-reply if: (Support OR Sales OR Urgent) AND confidence ≥ 0.75
- ❌ Never auto-reply if sender is @thehottubman.ca (internal)
- ✅ FormSub with urgent keywords → Route to URGENT (override)
- ✅ Phone category only for service@ringcentral.com
- ✅ Banking has 3-level hierarchy (primary → secondary → tertiary)

### **3. Complex Logic**
- **FormSub Override:** Form submissions with "broken", "not working", "leaking" → URGENT
- **Banking Tertiary:** Receipts split into PaymentSent vs PaymentReceived
- **E-Transfer Tertiary:** FromBusiness vs ToBusiness
- **Supplier Detection:** Email domain matching (@asp-supply.com, @strong9.com)

---

## 🎯 **How Our Enhanced Keywords Fit**

### **Current Production System:**
```javascript
// Hardcoded keywords in system message:
"Keywords: urgent, emergency, ASAP, broken, not working, leaking"
```

### **Our Enhanced System:**
```javascript
// Keywords from label schema (electrician.json):
{
  "URGENT": {
    "classificationRules": {
      "keywords": {
        "primary": ["urgent", "emergency", "ASAP", "immediately"],
        "electrical": ["spark", "shock", "fire", "smoke"],
        "equipment": ["breaker", "tripping", "not working", "broken"]
      }
    }
  }
}
```

**Advantage:** Keywords are **business-specific** and **dynamically loaded** from schemas!

---

## 🔄 **Integration Strategy**

### **Option 1: Merge Production Rules + Label Keywords**

**Build hybrid system message that includes:**

```javascript
export const buildProductionLabelAwareSystemMessage = (
  aiConfig, 
  labelConfig, 
  businessInfo,
  productionRules = {}
) => {
  let message = `You are an expert email processing and routing system for "${businessInfo.name}".

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Business Context:
- Business Name: ${businessInfo.name}
- Business Type(s): ${aiConfig.businessTypes}
- Email Domain: ${businessInfo.emailDomain}
${productionRules.managers ? `- Managers: ${productionRules.managers.join(', ')}` : ''}
${productionRules.suppliers ? `- Suppliers: ${productionRules.suppliers.map(s => s.name).join(', ')}` : ''}

### Auto-Reply Rules:
If the email is from an external sender, and primary_category is Support or Sales or Urgent, and confidence is at least 0.75, always set "ai_can_reply": true.
If the sender's email address ends with "@${businessInfo.emailDomain}", always set "ai_can_reply": false (internal email).

`;

  // ADD LABEL-SPECIFIC KEYWORDS FROM SCHEMAS
  message += `\n### Category Structure with Classification Keywords:\n\n`;
  
  if (labelConfig && labelConfig.labels) {
    for (const label of labelConfig.labels) {
      if (!label.classificationRules) continue;
      
      const rules = label.classificationRules;
      const isCritical = label.critical ? ' [CRITICAL]' : '';
      
      message += `**${label.name}${isCritical}** (${label.intent}):\n`;
      message += `${label.description || 'No description'}\n`;
      
      // Add keywords
      if (rules.keywords) {
        message += `Keywords: `;
        const allKeywords = Object.values(rules.keywords).flat();
        message += allKeywords.slice(0, 15).join(', ');
        if (allKeywords.length > 15) message += '...';
        message += `\n`;
      }
      
      // Add specific patterns
      if (rules.patterns && rules.patterns.length > 0) {
        message += `Patterns: ${rules.patterns.slice(0, 2).join(' | ')}\n`;
      }
      
      // Add secondary categories (subfolders)
      if (label.sub && label.sub.length > 0) {
        message += `secondary_category: [${label.sub.map(s => s.name).join(', ')}]\n`;
        
        // Add subfolder descriptions with keywords
        label.sub.forEach(sub => {
          if (sub.keywords && sub.keywords.length > 0) {
            message += `  • ${sub.name}: ${sub.keywords.slice(0, 5).join(', ')}\n`;
          } else if (sub.description) {
            message += `  • ${sub.name}: ${sub.description}\n`;
          }
        });
      }
      
      message += `\n`;
    }
  }
  
  // ADD PRODUCTION-SPECIFIC RULES
  if (productionRules.specialRules) {
    message += `\n### Special Classification Rules:\n`;
    productionRules.specialRules.forEach(rule => {
      message += `${rule}\n`;
    });
  }
  
  // ADD OUTPUT FORMAT
  message += `\n### JSON Output Format:
Return ONLY the following JSON structure. Do not add any other text or explanations.

\`\`\`json
{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "tertiary_category": "The chosen tertiary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
\`\`\`
`;

  return message;
};
```

---

## 🎯 **Enhanced Hot Tub Man Classifier**

### **Example Output:**

```
You are an expert email processing and routing system for "The Hot Tub Man Ltd."

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Business Context:
- Business Name: The Hot Tub Man Ltd.
- Business Type(s): Hot tub & Spa
- Email Domain: thehottubman.ca
- Managers: Hailey, Jillian, Stacie, Aaron
- Suppliers: Aqua Spa Pool Supply, Paradise Patio Furniture, Strong Spas

### Auto-Reply Rules:
If the email is from an external sender, and primary_category is Support or Sales or Urgent, and confidence is at least 0.75, always set "ai_can_reply": true.
If the sender's email address ends with "@thehottubman.ca", always set "ai_can_reply": false (internal email).

### Category Structure with Classification Keywords:

**URGENT [CRITICAL]** (ai.emergency_request):
Hotub and spa emergencies requiring immediate attention
Keywords: urgent, emergency, ASAP, immediately, help, broken, heater, not heating, cold water, pump, circulation, jets, leak, leaking, water loss, no power, electrical, GFCI, tripped
Patterns: (heater|heating) + (not working|broken|error) | (pump|jets) + (not working|broken)
secondary_category: [Leaking, Pump Not Working, Heater Error, No Power, Control Panel Issue]
  • Leaking: leak, leaking, water loss, losing water, draining
  • Pump Not Working: pump, circulation, jets, pump failure
  • Heater Error: heater, not heating, cold water, heater error
  • No Power: no power, won't turn on, electrical, GFCI tripped
  • Control Panel Issue: control panel, display, buttons, controls not working

**SEASONAL** (ai.seasonal_service):
Seasonal hot tub and spa services
Keywords: seasonal, winterize, spring, annual, deep clean, opening, start-up, closing, winter prep
Patterns: (winterize|winterization) + (spa|hot tub) | (spring|seasonal) + (start-up|opening)
secondary_category: [Winterization, Spring Start-up, Annual Service, Deep Cleaning]
  • Winterization: winterize, winterization, winter prep
  • Spring Start-up: spring start, start-up, de-winterize
  • Annual Service: annual, yearly, service, maintenance
  • Deep Cleaning: deep clean, deep cleaning, thorough clean

**SALES** (ai.sales_inquiry):
Sales inquiries, quotes, and estimates
Keywords: quote, estimate, price, cost, how much, interested in, looking for, new hot tub, purchase
secondary_category: [New Hot Tubs, Spa Covers, Chemicals, Accessories, Quotes, Follow-ups]

**SUPPORT** (ai.support_ticket):
Customer support and service requests
Keywords: support, help, question, issue, problem, troubleshoot
secondary_category: [TechnicalSupport, PartsAndChemicals, AppointmentScheduling, General]
  • TechnicalSupport: troubleshoot, repair, issue, error, diagnostic, help
  • PartsAndChemicals: parts, chemicals, filter, order, price, stock
  • AppointmentScheduling: schedule, book, appointment, reschedule, cancel
  • General: inquiry, question, status, follow-up

**BANKING** (ai.financial_transaction):
Financial transactions, invoices, and payments
Keywords: invoice, payment, paid, receipt, refund, e-transfer, bank alert
secondary_category: [e-transfer, invoice, bank-alert, refund, receipts]
  • e-transfer: Tertiary: [FromBusiness, ToBusiness]
    - FromBusiness: you sent, payment completed, transfer to
    - ToBusiness: you received, funds deposited, payment received
  • receipts: Tertiary: [PaymentSent, PaymentReceived]
    - PaymentSent: confirming business sent payment
    - PaymentReceived: confirming business received payment

**FORMSUB** (ai.form_submission):
Website form submissions
secondary_category: [NewSubmission, WorkOrderForms]
IMPORTANT: If form submission contains urgent keywords (broken, not working, leaking, won't start), classify as URGENT instead!

**PHONE** (ai.phone_communication):
Phone/voicemail/SMS notifications from service@ringcentral.com ONLY
Keywords: voicemail, missed call, SMS, text message, RingCentral

**MANAGER** (ai.internal_routing):
Requires manager oversight or internal routing
secondary_category: [Hailey, Jillian, Stacie, Aaron, Unassigned]
  • Unassigned: security alerts, verification codes, payroll reports, platform notices

**GOOGLE REVIEW** (ai.customer_feedback):
Google Review notifications
Extract: reviewerName, rating, reviewText, reviewId

**PROMO** (ai.marketing):
Marketing campaigns, discounts, sales flyers

**RECRUITMENT** (ai.hr):
Job applications, resumes, interviews

**SOCIALMEDIA** (ai.social_engagement):
Social media DMs, tags, mentions, influencer outreach

**MISC** (ai.general):
Use as last resort for unclassifiable emails

### Special Classification Rules:
1. FormSub Override: Form with urgent keywords → classify as URGENT
2. Phone: ONLY if sender is service@ringcentral.com
3. Banking tertiary: Always determine PaymentSent vs PaymentReceived
4. E-Transfer tertiary: Always determine FromBusiness vs ToBusiness
5. Supplier detection: Match email domain (@asp-supply.com, etc.)
6. Manager routing: Match manager names or route to Unassigned

### JSON Output Format:
Return ONLY the following JSON structure. Do not add any other text or explanations.

{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "tertiary_category": "The chosen tertiary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
```

---

## 🎯 **Key Differences: Production vs Our Enhanced System**

| Feature | Production (Hot Tub Man) | Our Enhanced System | Integration |
|---------|-------------------------|---------------------|-------------|
| **Keywords** | Hardcoded in prompt | Dynamic from schemas | ✅ Merge both |
| **Business-Specific** | Hot tub specific | 12 business types | ✅ Template per type |
| **Subfolder Keywords** | Listed in text | Structured in schema | ✅ Use schema structure |
| **Manager Routing** | Named managers | {{Manager1}}, {{Manager2}} | ✅ Dynamic replacement |
| **Supplier Detection** | Domain matching | {{Supplier1}} + domains | ✅ Combine approaches |
| **Special Rules** | FormSub override, etc. | Generic | ✅ Add special rules to schemas |
| **Output Format** | 3-level hierarchy | 2-level hierarchy | ✅ Support tertiary |
| **Auto-Reply Logic** | Confidence-based | Not implemented | ✅ Add to behavior schemas |

---

## 🚀 **Enhanced Integration Approach**

### **New Function: Build Production-Style Classifier**

**File:** `src/lib/aiSchemaInjector.js`

Add new function:

```javascript
/**
 * Build production-style classifier with enhanced label keywords
 * Combines real production patterns with business-specific keyword schemas
 * @param {object} aiConfig - AI configuration from Layer 1
 * @param {object} labelConfig - Label schema from Layer 3
 * @param {object} businessInfo - Business details
 * @param {object} productionRules - Production-specific rules
 * @returns {string} - Production-ready classifier prompt
 */
export const buildProductionClassifier = (aiConfig, labelConfig, businessInfo, productionRules = {}) => {
  const {
    managers = [],
    suppliers = [],
    specialRules = [],
    autoReplyRules = {},
    formSubOverride = true,
    bankinTertiary = true
  } = productionRules;
  
  let message = `You are an expert email processing and routing system for "${businessInfo.name}".

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Business Context:
- Business Name: ${businessInfo.name}
- Business Type(s): ${aiConfig.businessTypes}
- Email Domain: ${businessInfo.emailDomain}
${managers.length > 0 ? `- Managers: ${managers.map(m => m.name).join(', ')}` : ''}
${suppliers.length > 0 ? `- Suppliers: ${suppliers.map(s => s.name).join(', ')}` : ''}

### Auto-Reply Rules:
${autoReplyRules.enabled !== false ? `If the email is from an external sender, and primary_category is Support or Sales or Urgent, and confidence is at least ${autoReplyRules.minConfidence || 0.75}, always set "ai_can_reply": true.` : ''}
If the sender's email address ends with "@${businessInfo.emailDomain}", always set "ai_can_reply": false (internal email).

### Category Structure with Classification Keywords:\n\n`;

  // ADD LABELS WITH KEYWORDS FROM SCHEMAS
  if (labelConfig && labelConfig.labels) {
    for (const label of labelConfig.labels) {
      const rules = label.classificationRules;
      const isCritical = label.critical ? ' [CRITICAL]' : '';
      
      message += `**${label.name}${isCritical}** (${label.intent}):\n`;
      message += `${label.description || 'No description'}\n`;
      
      // Add keywords from schema
      if (rules && rules.keywords) {
        const allKeywords = Object.values(rules.keywords).flat();
        message += `Keywords: ${allKeywords.slice(0, 20).join(', ')}\n`;
      }
      
      // Add patterns
      if (rules && rules.patterns && rules.patterns.length > 0) {
        message += `Patterns: ${rules.patterns.slice(0, 2).join(' | ')}\n`;
      }
      
      // Add secondary categories (subfolders) with their keywords
      if (label.sub && label.sub.length > 0) {
        message += `secondary_category: [${label.sub.map(s => s.name).join(', ')}]\n`;
        
        label.sub.forEach(sub => {
          if (sub.keywords && sub.keywords.length > 0) {
            message += `  • ${sub.name}: ${sub.keywords.slice(0, 6).join(', ')}\n`;
          } else if (sub.description) {
            message += `  • ${sub.name}: ${sub.description}\n`;
          }
          
          // Add tertiary categories if they exist
          if (sub.tertiary && sub.tertiary.length > 0) {
            message += `    Tertiary: [${sub.tertiary.join(', ')}]\n`;
          }
        });
      }
      
      message += `\n`;
    }
  }
  
  // ADD SPECIAL RULES
  if (specialRules.length > 0) {
    message += `\n### Special Classification Rules:\n`;
    specialRules.forEach((rule, i) => {
      message += `${i + 1}. ${rule}\n`;
    });
    message += `\n`;
  }
  
  // ADD OUTPUT FORMAT
  message += `### JSON Output Format:
Return ONLY the following JSON structure. Do not add any other text or explanations.

\`\`\`json
{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "tertiary_category": "The chosen tertiary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
\`\`\`
`;

  return message;
};
```

---

## 📋 **Enhanced Label Schema Structure**

### **Add Production Features to Label Schemas:**

```json
{
  "name": "BANKING",
  "intent": "ai.financial_transaction",
  "critical": true,
  
  "classificationRules": {
    "keywords": {
      "primary": ["invoice", "payment", "receipt", "e-transfer", "bank"],
      "etransfer": ["interac", "e-transfer", "you received", "you sent"],
      "invoice": ["invoice", "bill", "payment due", "amount owing"],
      "alert": ["security alert", "fraud", "suspicious", "verification code"]
    },
    
    "specialDetection": {
      "internalEmail": "@${businessInfo.emailDomain}",
      "suppliers": [
        { "domain": "@asp-supply.com", "name": "Aqua Spa Pool Supply" },
        { "domain": "@strong9.com", "name": "Strong Spas" }
      ],
      "phoneProvider": "service@ringcentral.com"
    }
  },
  
  "sub": [
    {
      "name": "e-transfer",
      "keywords": ["interac", "e-transfer", "you received", "you sent", "funds deposited"],
      "description": "Interac e-Transfers sent or received",
      
      "tertiary": [
        {
          "name": "FromBusiness",
          "keywords": ["you sent", "payment completed", "transfer to", "funds sent"],
          "description": "Payments sent by The Hot Tub Man Ltd."
        },
        {
          "name": "ToBusiness",
          "keywords": ["you received", "funds deposited", "payment received", "deposit completed"],
          "description": "Payments received by The Hot Tub Man Ltd."
        }
      ]
    },
    {
      "name": "receipts",
      "keywords": ["receipt", "order confirmation", "payment summary", "you've been charged"],
      "description": "Payment receipts and confirmations",
      
      "tertiary": [
        {
          "name": "PaymentSent",
          "keywords": ["you paid", "payment completed", "amount paid", "charged your"],
          "description": "Business sent payment to vendor"
        },
        {
          "name": "PaymentReceived",
          "keywords": ["payment received", "customer paid", "order confirmed", "thank you for your payment"],
          "description": "Business received payment from customer"
        }
      ]
    }
  ]
}
```

---

## 🎯 **Special Rules Integration**

### **Add to Label Schemas:**

```json
{
  "specialRules": [
    {
      "name": "FormSub Urgent Override",
      "description": "Form submissions with urgent keywords should be classified as URGENT",
      "trigger": {
        "primary_category": "FORMSUB",
        "keywords_in_body": ["broken", "not working", "leaking", "won't start", "no power", "error code"]
      },
      "action": {
        "override_primary": "URGENT",
        "reason": "Form contains emergency service request"
      }
    },
    {
      "name": "Phone Provider Detection",
      "description": "Only classify as PHONE if from RingCentral",
      "trigger": {
        "sender_email": "service@ringcentral.com"
      },
      "action": {
        "force_primary": "PHONE"
      }
    },
    {
      "name": "Internal Email Detection",
      "description": "Never auto-reply to internal emails",
      "trigger": {
        "sender_domain": "@${businessInfo.emailDomain}"
      },
      "action": {
        "force_ai_can_reply": false
      }
    },
    {
      "name": "Supplier Domain Detection",
      "description": "Auto-detect suppliers by email domain",
      "trigger": {
        "sender_matches": ["@asp-supply.com", "@strong9.com", "@paradisepatiofurnitureltd"]
      },
      "action": {
        "force_primary": "SUPPLIERS",
        "map_secondary": {
          "@asp-supply.com": "AquaSpaPoolSupply",
          "@strong9.com": "StrongSpas",
          "paradisepatiofurnitureltd": "ParadisePatioFurnitureLtd"
        }
      }
    }
  ]
}
```

---

## 🔄 **Implementation Recommendations**

### **1. Update Label Schemas with Tertiary Categories**

Add tertiary level to BANKING labels:

```json
"sub": [
  {
    "name": "e-transfer",
    "tertiary": ["FromBusiness", "ToBusiness"]
  },
  {
    "name": "receipts",
    "tertiary": ["PaymentSent", "PaymentReceived"]
  }
]
```

### **2. Add Special Rules to Schemas**

Create `specialRules` section in each label schema with business-specific logic.

### **3. Enhance buildLabelAwareSystemMessage**

Update function to support:
- Tertiary categories
- Special rules
- Auto-reply logic
- Supplier/manager detection

### **4. Update N8N Template**

Ensure template supports tertiary_category routing:

```json
{
  "name": "Banking Router",
  "parameters": {
    "switch": {
      "rules": [
        {
          "condition": "{{ $json.secondary_category === 'e-transfer' && $json.tertiary_category === 'ToBusiness' }}",
          "output": "Route to BANKING/e-Transfer/To Business folder"
        }
      ]
    }
  }
}
```

---

## 🎯 **Summary**

### **What We Have:**
✅ Enhanced label schemas with keywords (12 business types)  
✅ Label-aware system message generator  
✅ Integration into template service  

### **What Production Example Shows:**
✅ 3-level classification hierarchy (primary → secondary → tertiary)  
✅ Special rules (FormSub override, Phone detection, Internal email)  
✅ Auto-reply confidence logic  
✅ Supplier domain detection  
✅ Manager name matching  
✅ Complex Banking logic (sent vs received)  

### **Next Steps:**
1. Add tertiary category support to label schemas
2. Add specialRules section to schemas
3. Enhance buildLabelAwareSystemMessage to include production patterns
4. Update N8N templates to handle tertiary routing

**Your production example is excellent and shows we need to add tertiary categories and special rules to our enhanced schemas!** 🎯


