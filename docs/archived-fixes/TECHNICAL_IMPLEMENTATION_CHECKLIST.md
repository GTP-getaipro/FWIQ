# 🔧 Technical Implementation Checklist: Integrate Layers 1 & 2 into n8n Deployment

## 🎯 **Answer to Critical Question:**

### **Are label IDs hard-coded or dynamic?**

**Current State: HYBRID (INCOMPLETE) ❌**

| Component | Current Implementation | Issue |
|-----------|----------------------|-------|
| **`n8nLiveExample.json`** | ❌ Hard-coded IDs (`"Label_1381962670795847883"`) | This is a LIVE workflow, not a template |
| **`n8n-templates/*.json`** | ⚠️ NO label routing nodes exist! | Templates are missing label routing logic entirely |
| **`deploy-n8n/index.ts` (Line 79)** | ✅ Injects `<<<LABEL_MAP>>>` as JSON | Placeholder exists but **NOT USED in templates** |
| **Runtime n8n workflows** | ❌ Currently use hard-coded IDs | Breaks when labels are recreated |

---

### **The Problem:**

```javascript
// What's CURRENTLY happening:
// File: supabase/functions/deploy-n8n/index.ts (Line 79)
'<<<LABEL_MAP>>>': JSON.stringify(clientData.email_labels || {})
// Injects: {"URGENT":"Label_5531268829132825695", "SALES":"Label_1381..."}

// But in n8n templates:
// File: src/lib/n8n-templates/electrician_template.json
// ❌ NO NODES USE THIS MAPPING!
// Templates don't have label routing nodes at all
```

**The live example (`n8nLiveExample.json`) has hard-coded IDs**, which means someone manually built a workflow with specific Gmail label IDs. This is **NOT scalable or reusable**.

---

### **The Solution:**

We need to:
1. **Add label routing nodes to templates** with placeholders like `<<<LABEL_URGENT_ID>>>`
2. **Expand injection logic** to replace individual label ID placeholders
3. **Make it dynamic** so it works for any client's Gmail/Outlook account

---

## 📋 **Implementation Checklist**

### **PHASE 1: Fix Label ID Injection (Critical Path)**

#### **Task 1.1: Update n8n Templates with Label Routing Nodes**
**File:** `src/lib/n8n-templates/electrician_template.json`  
**Owner:** Backend Team  
**Priority:** 🔥 Critical  
**Estimated Time:** 2-3 hours per template

**Changes Required:**

Add label routing nodes to each template after the AI Classifier:

```json
{
  "name": "Route to URGENT",
  "type": "n8n-nodes-base.gmail",
  "typeVersion": 2.1,
  "position": [-1500, 900],
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $json.parsed_output.id }}",
    "labelIds": [
      "<<<LABEL_URGENT_ID>>>"
    ]
  },
  "credentials": {
    "gmailOAuth2": {
      "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
      "name": "<<<BUSINESS_NAME>>> Gmail"
    }
  }
},
{
  "name": "Route to SALES",
  "type": "n8n-nodes-base.gmail",
  "typeVersion": 2.1,
  "position": [-1500, 1100],
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $json.parsed_output.id }}",
    "labelIds": [
      "<<<LABEL_SALES_ID>>>"
    ]
  },
  "credentials": {
    "gmailOAuth2": {
      "id": "<<<CLIENT_GMAIL_CRED_ID>>>",
      "name": "<<<BUSINESS_NAME>>> Gmail"
    }
  }
},
{
  "name": "Route to SUPPORT",
  "type": "n8n-nodes-base.gmail",
  "parameters": {
    "operation": "addLabels",
    "messageId": "={{ $json.parsed_output.id }}",
    "labelIds": [
      "<<<LABEL_SUPPORT_ID>>>"
    ]
  }
}
```

**Files to Update:**
- ✅ `src/lib/n8n-templates/electrician_template.json`
- ✅ `src/lib/n8n-templates/plumber_template.json`
- ✅ `src/lib/n8n-templates/hvac_template.json`
- ✅ `src/lib/n8n-templates/pools_spas_generic_template.json`
- ✅ `src/lib/n8n-templates/hot_tub_base_template.json`

**Acceptance Criteria:**
- [ ] Each template has label routing nodes for all standard categories (URGENT, SALES, SUPPORT, etc.)
- [ ] Placeholders use format: `<<<LABEL_{CATEGORY}_ID>>>`
- [ ] Nodes are connected to the AI Classifier via Switch/If nodes

---

#### **Task 1.2: Expand Label ID Injection Logic**
**File:** `supabase/functions/deploy-n8n/index.ts`  
**Lines:** 68-85  
**Owner:** Backend Team  
**Priority:** 🔥 Critical  
**Estimated Time:** 1 hour

**Current Code (Line 79):**
```typescript
'<<<LABEL_MAP>>>': JSON.stringify(clientData.email_labels || {})
```

**New Code (Replace lines 68-85):**
```typescript
const replacements: Record<string, string> = {
  '<<<BUSINESS_NAME>>>': business.name || 'Your Business',
  '<<<CONFIG_VERSION>>>': String(version || 1),
  '<<<CLIENT_ID>>>': clientId,
  '<<<EMAIL_DOMAIN>>>': business.emailDomain || '',
  '<<<CURRENCY>>>': business.currency || 'USD',
  '<<<CLIENT_GMAIL_CRED_ID>>>': integrations.gmail?.credentialId || '',
  '<<<CLIENT_POSTGRES_CRED_ID>>>': integrations.postgres?.credentialId || 'supabase-metrics',
  '<<<CLIENT_OPENAI_CRED_ID>>>': integrations.openai?.credentialId || 'openai-shared',
  '<<<MANAGERS_TEXT>>>': managersText,
  '<<<SUPPLIERS>>>': JSON.stringify((clientData.suppliers || []).map((s: any) => s.name)),
  
  // LABEL MAP (entire object for reference)
  '<<<LABEL_MAP>>>': JSON.stringify(clientData.email_labels || {}),
  
  // INDIVIDUAL LABEL IDS (for routing nodes)
  '<<<LABEL_URGENT_ID>>>': clientData.email_labels?.URGENT || '',
  '<<<LABEL_SALES_ID>>>': clientData.email_labels?.SALES || '',
  '<<<LABEL_SUPPORT_ID>>>': clientData.email_labels?.SUPPORT || '',
  '<<<LABEL_BANKING_ID>>>': clientData.email_labels?.BANKING || '',
  '<<<LABEL_RECRUITMENT_ID>>>': clientData.email_labels?.RECRUITMENT || '',
  '<<<LABEL_MISC_ID>>>': clientData.email_labels?.MISC || '',
  '<<<LABEL_MANAGER_ID>>>': clientData.email_labels?.MANAGER || '',
  '<<<LABEL_SUPPLIERS_ID>>>': clientData.email_labels?.SUPPLIERS || '',
  '<<<LABEL_PROMO_ID>>>': clientData.email_labels?.PROMO || '',
  '<<<LABEL_PHONE_ID>>>': clientData.email_labels?.PHONE || '',
  '<<<LABEL_FORMSUB_ID>>>': clientData.email_labels?.FORMSUB || '',
  '<<<LABEL_GOOGLE_REVIEW_ID>>>': clientData.email_labels?.['GOOGLE REVIEW'] || '',
  '<<<LABEL_SOCIALMEDIA_ID>>>': clientData.email_labels?.SOCIALMEDIA || '',
  
  '<<<SIGNATURE_BLOCK>>>': signatureBlock,
  '<<<SERVICE_CATALOG_TEXT>>>': serviceCatalogText
};
```

**Better Approach (Dynamic):**
```typescript
const replacements: Record<string, string> = {
  // ... existing replacements ...
};

// Dynamically add all label IDs from email_labels
if (clientData.email_labels) {
  Object.keys(clientData.email_labels).forEach((labelName) => {
    const placeholderKey = `<<<LABEL_${labelName.toUpperCase().replace(/\s+/g, '_')}_ID>>>`;
    replacements[placeholderKey] = clientData.email_labels[labelName];
  });
}

// Also add subcategories if they exist
// Example: URGENT/No Power → <<<LABEL_URGENT_NO_POWER_ID>>>
if (clientData.email_labels) {
  Object.keys(clientData.email_labels).forEach((labelName) => {
    if (labelName.includes('/')) {
      const safeName = labelName.toUpperCase().replace(/\s+/g, '_').replace(/\//g, '_');
      const placeholderKey = `<<<LABEL_${safeName}_ID>>>`;
      replacements[placeholderKey] = clientData.email_labels[labelName];
    }
  });
}
```

**Acceptance Criteria:**
- [ ] All standard label categories have dedicated placeholders
- [ ] Dynamic injection supports custom/industry-specific labels
- [ ] Subcategories (e.g., `URGENT/No Power`) are supported
- [ ] Missing labels default to empty string (no workflow breakage)

---

### **PHASE 2: Integrate Layer 1 (AI Keywords & Prompts)**

#### **Task 2.1: Create AI Schema Injection Function**
**File:** `src/lib/aiSchemaInjector.js` (NEW FILE)  
**Owner:** Backend Team  
**Priority:** 🔥 High  
**Estimated Time:** 2 hours

**Create New File:**
```javascript
import { mergeAIBusinessSchemas } from '@/lib/aiSchemaMerger';

/**
 * Extracts AI configuration from merged AI schemas for n8n deployment
 * @param {string[]} businessTypes - Array of business types (e.g., ['Electrician', 'Plumber'])
 * @param {object} businessInfo - Business metadata (name, phone, etc.)
 * @returns {object} - AI config ready for n8n injection
 */
export const extractAIConfigForN8n = (businessTypes, businessInfo = {}) => {
  // Merge AI schemas for all business types
  const mergedAI = mergeAIBusinessSchemas(businessTypes);
  
  // Extract keywords
  const allKeywords = [];
  if (mergedAI.keywords?.primary) allKeywords.push(...mergedAI.keywords.primary);
  if (mergedAI.keywords?.emergency) allKeywords.push(...mergedAI.keywords.emergency);
  if (mergedAI.keywords?.service) allKeywords.push(...mergedAI.keywords.service);
  
  // Build system message
  let systemMessage = mergedAI.aiPrompts?.systemMessage || 
    'You are an email classifier for {{BUSINESS_NAME}}.';
  
  // Replace business info placeholders
  systemMessage = systemMessage
    .replace(/{{BUSINESS_NAME}}/g, businessInfo.name || 'the business')
    .replace(/{{PHONE}}/g, businessInfo.phone || '')
    .replace(/{{EMAIL_DOMAIN}}/g, businessInfo.emailDomain || '');
  
  // Extract intent mapping
  const intentMapping = mergedAI.intentMapping || {};
  
  // Build classification rules text
  const classificationRules = mergedAI.classificationRules?.map(rule => 
    `- ${rule.category}: ${rule.description || ''} (Keywords: ${(rule.keywords || []).join(', ')})`
  ).join('\n') || '';
  
  return {
    keywords: allKeywords,
    keywordsJSON: JSON.stringify(allKeywords),
    systemMessage,
    intentMapping,
    intentMappingJSON: JSON.stringify(intentMapping),
    classificationRules,
    escalationRules: mergedAI.escalationRules || [],
    businessTypes: businessTypes.join(' + ')
  };
};

/**
 * Generate AI-specific placeholders for n8n template injection
 * @param {object} aiConfig - Output from extractAIConfigForN8n
 * @returns {object} - Placeholder replacements
 */
export const generateAIPlaceholders = (aiConfig) => {
  return {
    '<<<AI_KEYWORDS>>>': aiConfig.keywordsJSON,
    '<<<AI_SYSTEM_MESSAGE>>>': aiConfig.systemMessage,
    '<<<AI_INTENT_MAPPING>>>': aiConfig.intentMappingJSON,
    '<<<AI_CLASSIFICATION_RULES>>>': aiConfig.classificationRules,
    '<<<AI_BUSINESS_TYPES>>>': aiConfig.businessTypes
  };
};
```

**Acceptance Criteria:**
- [ ] Function successfully merges AI schemas for multiple business types
- [ ] System message includes all merged keywords and rules
- [ ] Intent mapping is properly formatted for n8n
- [ ] Placeholders are generated in correct format

---

#### **Task 2.2: Update n8n Templates with AI Placeholders**
**File:** `src/lib/n8n-templates/electrician_template.json`  
**Lines:** 42-43 (systemMessage)  
**Owner:** Backend Team  
**Priority:** 🔥 High  
**Estimated Time:** 30 min per template

**Current Code:**
```json
{
  "parameters": {
    "options": {
      "systemMessage": "You are an electrical services email classifier for <<<BUSINESS_NAME>>>. Your primary goal is to categorize incoming emails. Use the following categories and rules:\n\nCATEGORIES:\n- Emergency: No power, electrical fires...\n..."
    }
  }
}
```

**New Code:**
```json
{
  "parameters": {
    "options": {
      "systemMessage": "<<<AI_SYSTEM_MESSAGE>>>",
      "additionalData": {
        "keywords": "<<<AI_KEYWORDS>>>",
        "intentMapping": "<<<AI_INTENT_MAPPING>>>",
        "businessTypes": "<<<AI_BUSINESS_TYPES>>>"
      }
    }
  }
}
```

**Files to Update:**
- ✅ All templates in `src/lib/n8n-templates/*.json`

**Acceptance Criteria:**
- [ ] AI Classifier node uses `<<<AI_SYSTEM_MESSAGE>>>` placeholder
- [ ] Keywords are injected via `<<<AI_KEYWORDS>>>`
- [ ] Templates are backward compatible (fallback to defaults if placeholders missing)

---

#### **Task 2.3: Wire AI Config into Deployment Flow**
**File:** `supabase/functions/deploy-n8n/index.ts`  
**Lines:** 49-91 (injectOnboardingData function)  
**Owner:** Backend Team  
**Priority:** 🔥 High  
**Estimated Time:** 1 hour

**Add Import:**
```typescript
import { extractAIConfigForN8n, generateAIPlaceholders } from '@/lib/aiSchemaInjector';
```

**Update `injectOnboardingData` Function (Line 49):**
```typescript
function injectOnboardingData(clientData: any): Json {
  // ... existing code ...
  
  const { business, contact, services, rules, integrations, id: clientId, version } = clientData;
  
  // EXISTING: Business info extraction
  const signatureBlock = `\n\nBest regards,\nThe ${business.name} Team\n${contact.phone || ''}`;
  const serviceCatalogText = (services || []).map((s: any) => `- ${s.name} ...`).join('\n');
  const managersText = (clientData.managers || []).map((m: any) => m.name).join(', ');
  
  // NEW: Extract AI configuration
  const businessTypes = clientData.business?.types || [clientData.business?.type || 'Pools & Spas'];
  const businessInfo = {
    name: business.name,
    phone: contact.phone,
    emailDomain: business.emailDomain
  };
  
  const aiConfig = extractAIConfigForN8n(businessTypes, businessInfo);
  const aiPlaceholders = generateAIPlaceholders(aiConfig);
  
  // Build replacements
  const replacements: Record<string, string> = {
    // Existing placeholders
    '<<<BUSINESS_NAME>>>': business.name || 'Your Business',
    '<<<CONFIG_VERSION>>>': String(version || 1),
    '<<<CLIENT_ID>>>': clientId,
    '<<<EMAIL_DOMAIN>>>': business.emailDomain || '',
    '<<<CURRENCY>>>': business.currency || 'USD',
    '<<<CLIENT_GMAIL_CRED_ID>>>': integrations.gmail?.credentialId || '',
    '<<<CLIENT_POSTGRES_CRED_ID>>>': integrations.postgres?.credentialId || 'supabase-metrics',
    '<<<CLIENT_OPENAI_CRED_ID>>>': integrations.openai?.credentialId || 'openai-shared',
    '<<<MANAGERS_TEXT>>>': managersText,
    '<<<SUPPLIERS>>>': JSON.stringify((clientData.suppliers || []).map((s: any) => s.name)),
    '<<<LABEL_MAP>>>': JSON.stringify(clientData.email_labels || {}),
    '<<<SIGNATURE_BLOCK>>>': signatureBlock,
    '<<<SERVICE_CATALOG_TEXT>>>': serviceCatalogText,
    
    // NEW: AI configuration placeholders
    ...aiPlaceholders
  };
  
  // Dynamic label ID injection (from Phase 1)
  if (clientData.email_labels) {
    Object.keys(clientData.email_labels).forEach((labelName) => {
      const placeholderKey = `<<<LABEL_${labelName.toUpperCase().replace(/\s+/g, '_').replace(/\//g, '_')}_ID>>>`;
      replacements[placeholderKey] = clientData.email_labels[labelName];
    });
  }
  
  // Replace all placeholders in template
  let templateString = JSON.stringify(baseTemplate);
  Object.entries(replacements).forEach(([placeholder, value]) => {
    templateString = templateString.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return JSON.parse(templateString);
}
```

**Acceptance Criteria:**
- [ ] AI config is extracted from merged schemas
- [ ] Placeholders are properly injected into template
- [ ] Deployment works for single and multi-business types
- [ ] System message reflects merged AI intelligence

---

### **PHASE 3: Integrate Layer 2 (Behavior & Reply Tone)**

#### **Task 3.1: Create Behavior Schema Injection Function**
**File:** `src/lib/behaviorSchemaInjector.js` (NEW FILE)  
**Owner:** Backend Team  
**Priority:** 🔥 High  
**Estimated Time:** 1.5 hours

**Create New File:**
```javascript
import { mergeBusinessTypeBehaviors } from '@/lib/behaviorSchemaMerger';

/**
 * Extracts behavior configuration from merged behavior schemas for n8n deployment
 * @param {string[]} businessTypes - Array of business types
 * @param {object} businessInfo - Business metadata
 * @returns {object} - Behavior config ready for n8n injection
 */
export const extractBehaviorConfigForN8n = (businessTypes, businessInfo = {}) => {
  // Merge behavior schemas for all business types
  const mergedBehavior = mergeBusinessTypeBehaviors(businessTypes);
  
  // Extract voice profile
  const voiceTone = mergedBehavior.voiceProfile?.tone || 'Professional and friendly';
  const formalityLevel = mergedBehavior.voiceProfile?.formalityLevel || 'professional';
  const allowPricing = mergedBehavior.voiceProfile?.allowPricingInReplies !== false;
  
  // Extract AI draft rules
  const upsellEnabled = mergedBehavior.aiDraftRules?.upsellGuidelines?.enabled !== false;
  const upsellText = mergedBehavior.aiDraftRules?.upsellGuidelines?.text || '';
  
  const followUpEnabled = mergedBehavior.aiDraftRules?.followUpGuidelines?.enabled !== false;
  const followUpText = mergedBehavior.aiDraftRules?.followUpGuidelines?.text || '';
  
  // Extract category overrides
  const categoryOverrides = mergedBehavior.categoryOverrides || {};
  
  // Build behavior goals text
  const behaviorGoals = (mergedBehavior.behaviorGoals || []).map((goal, i) => 
    `${i + 1}. ${goal}`
  ).join('\n');
  
  // Build reply prompt
  let replyPrompt = `Draft a reply email using the following voice and behavior:\n\n`;
  replyPrompt += `VOICE TONE: ${voiceTone}\n`;
  replyPrompt += `FORMALITY: ${formalityLevel}\n`;
  replyPrompt += `ALLOW PRICING: ${allowPricing ? 'Yes' : 'No'}\n\n`;
  replyPrompt += `BEHAVIOR GOALS:\n${behaviorGoals}\n\n`;
  
  if (upsellEnabled && upsellText) {
    replyPrompt += `UPSELL GUIDELINES:\n${upsellText}\n\n`;
  }
  
  if (followUpEnabled && followUpText) {
    replyPrompt += `FOLLOW-UP GUIDELINES:\n${followUpText}\n\n`;
  }
  
  // Add category-specific overrides
  if (Object.keys(categoryOverrides).length > 0) {
    replyPrompt += `CATEGORY-SPECIFIC LANGUAGE:\n`;
    Object.entries(categoryOverrides).forEach(([category, config]) => {
      if (config.customLanguage && config.customLanguage.length > 0) {
        replyPrompt += `- ${category}: ${config.customLanguage.join(', ')}\n`;
      }
    });
  }
  
  return {
    voiceTone,
    formalityLevel,
    allowPricing,
    upsellEnabled,
    upsellText,
    followUpEnabled,
    followUpText,
    behaviorGoals,
    categoryOverrides,
    replyPrompt,
    signatureTemplate: mergedBehavior.signatureTemplate || null
  };
};

/**
 * Generate behavior-specific placeholders for n8n template injection
 * @param {object} behaviorConfig - Output from extractBehaviorConfigForN8n
 * @returns {object} - Placeholder replacements
 */
export const generateBehaviorPlaceholders = (behaviorConfig) => {
  return {
    '<<<BEHAVIOR_VOICE_TONE>>>': behaviorConfig.voiceTone,
    '<<<BEHAVIOR_FORMALITY>>>': behaviorConfig.formalityLevel,
    '<<<BEHAVIOR_ALLOW_PRICING>>>': String(behaviorConfig.allowPricing),
    '<<<BEHAVIOR_UPSELL_TEXT>>>': behaviorConfig.upsellText,
    '<<<BEHAVIOR_FOLLOWUP_TEXT>>>': behaviorConfig.followUpText,
    '<<<BEHAVIOR_GOALS>>>': behaviorConfig.behaviorGoals,
    '<<<BEHAVIOR_REPLY_PROMPT>>>': behaviorConfig.replyPrompt,
    '<<<BEHAVIOR_CATEGORY_OVERRIDES>>>': JSON.stringify(behaviorConfig.categoryOverrides)
  };
};
```

**Acceptance Criteria:**
- [ ] Function successfully merges behavior schemas
- [ ] Voice tone is properly blended for multi-business
- [ ] Upsell and follow-up guidelines are combined
- [ ] Category overrides are preserved
- [ ] Reply prompt includes all behavior elements

---

#### **Task 3.2: Update n8n Templates with Behavior Placeholders**
**File:** `src/lib/n8n-templates/electrician_template.json`  
**Location:** AI Reply Agent node (currently missing in templates)  
**Owner:** Backend Team  
**Priority:** 🔥 High  
**Estimated Time:** 2 hours per template

**Add New AI Reply Agent Node:**
```json
{
  "name": "AI Reply Agent",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "typeVersion": 1.8,
  "position": [-1000, 3800],
  "parameters": {
    "promptType": "define",
    "text": "=Original Email:\nSubject: {{ $json.subject }}\nFrom: {{ $json.from }}\nBody: {{ $json.body }}\n\nClassification: {{ $json.primary_category }}\n\nDraft a professional reply.",
    "options": {
      "systemMessage": "<<<BEHAVIOR_REPLY_PROMPT>>>",
      "temperature": 0.7,
      "maxTokens": 500,
      "additionalData": {
        "voiceTone": "<<<BEHAVIOR_VOICE_TONE>>>",
        "formality": "<<<BEHAVIOR_FORMALITY>>>",
        "allowPricing": "<<<BEHAVIOR_ALLOW_PRICING>>>",
        "upsellText": "<<<BEHAVIOR_UPSELL_TEXT>>>",
        "categoryOverrides": "<<<BEHAVIOR_CATEGORY_OVERRIDES>>>"
      }
    }
  },
  "credentials": {
    "openAiApi": {
      "id": "<<<CLIENT_OPENAI_CRED_ID>>>",
      "name": "OpenAI Credentials"
    }
  }
}
```

**Files to Update:**
- ✅ All templates in `src/lib/n8n-templates/*.json`

**Acceptance Criteria:**
- [ ] AI Reply Agent node uses behavior placeholders
- [ ] Reply prompt reflects merged behavior schemas
- [ ] Category-specific language is injected
- [ ] Upsell/follow-up guidelines are included

---

#### **Task 3.3: Wire Behavior Config into Deployment Flow**
**File:** `supabase/functions/deploy-n8n/index.ts`  
**Lines:** 49-91 (injectOnboardingData function)  
**Owner:** Backend Team  
**Priority:** 🔥 High  
**Estimated Time:** 45 minutes

**Add Import:**
```typescript
import { extractBehaviorConfigForN8n, generateBehaviorPlaceholders } from '@/lib/behaviorSchemaInjector';
```

**Update `injectOnboardingData` Function:**
```typescript
function injectOnboardingData(clientData: any): Json {
  // ... existing code from Phase 2 ...
  
  // Extract AI configuration (from Phase 2)
  const aiConfig = extractAIConfigForN8n(businessTypes, businessInfo);
  const aiPlaceholders = generateAIPlaceholders(aiConfig);
  
  // NEW: Extract behavior configuration
  const behaviorConfig = extractBehaviorConfigForN8n(businessTypes, businessInfo);
  const behaviorPlaceholders = generateBehaviorPlaceholders(behaviorConfig);
  
  // Build replacements
  const replacements: Record<string, string> = {
    // Existing + AI placeholders
    ...existingPlaceholders,
    ...aiPlaceholders,
    
    // NEW: Behavior placeholders
    ...behaviorPlaceholders
  };
  
  // ... rest of function ...
}
```

**Acceptance Criteria:**
- [ ] Behavior config is extracted from merged schemas
- [ ] Placeholders are properly injected into template
- [ ] Reply agent reflects correct tone and behavior
- [ ] Category overrides are applied

---

### **PHASE 4: Testing & Validation**

#### **Task 4.1: Unit Tests for Schema Injectors**
**Files:** 
- `src/lib/aiSchemaInjector.test.js` (NEW)
- `src/lib/behaviorSchemaInjector.test.js` (NEW)

**Owner:** QA Team  
**Priority:** 🟡 Medium  
**Estimated Time:** 3 hours

**Test Cases:**
```javascript
// Test AI Schema Injector
describe('extractAIConfigForN8n', () => {
  it('should merge AI schemas for multiple business types', () => {
    const config = extractAIConfigForN8n(['Electrician', 'Plumber'], { name: 'ABC Services' });
    expect(config.keywords).toContain('spark');
    expect(config.keywords).toContain('leak');
    expect(config.systemMessage).toContain('ABC Services');
  });
  
  it('should handle single business type', () => {
    const config = extractAIConfigForN8n(['HVAC'], { name: 'Cool Air' });
    expect(config.keywords).toContain('hvac');
    expect(config.systemMessage).toContain('Cool Air');
  });
});

// Test Behavior Schema Injector
describe('extractBehaviorConfigForN8n', () => {
  it('should merge behavior schemas for multiple business types', () => {
    const config = extractBehaviorConfigForN8n(['Electrician', 'Plumber']);
    expect(config.voiceTone).toContain('Safety-focused');
    expect(config.voiceTone).toContain('emergency-ready');
  });
  
  it('should combine upsell guidelines', () => {
    const config = extractBehaviorConfigForN8n(['Electrician', 'Plumber']);
    expect(config.upsellText).toContain('panel');
    expect(config.upsellText).toContain('water pressure');
  });
});
```

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Edge cases covered (empty arrays, missing data)
- [ ] Multi-business merging validated
- [ ] Placeholder generation verified

---

#### **Task 4.2: Integration Test - Complete Deployment Flow**
**File:** `tests/integration/complete-deployment-flow.test.js` (NEW)  
**Owner:** QA Team  
**Priority:** 🔥 High  
**Estimated Time:** 4 hours

**Test Scenario:**
```javascript
describe('Complete n8n Deployment Flow', () => {
  it('should deploy workflow with all 3 schema layers for multi-business user', async () => {
    // Setup: Create test user profile
    const testProfile = {
      business_types: ['Electrician', 'Plumber'],
      managers: [{ name: 'John' }, { name: 'Jane' }],
      suppliers: [{ name: 'Home Depot' }],
      email_labels: {
        'URGENT': 'Label_TEST_123',
        'SALES': 'Label_TEST_456',
        'SUPPORT': 'Label_TEST_789'
      },
      client_config: {
        business: { name: 'ABC Services', emailDomain: 'abc.com' },
        contact: { phone: '555-1234' }
      }
    };
    
    // Act: Deploy workflow
    const result = await deployN8nWorkflow(testProfile);
    
    // Assert: Verify all layers injected
    expect(result.workflow).toBeDefined();
    
    // Layer 1 (AI): Keywords and system message
    const aiNode = result.workflow.nodes.find(n => n.name.includes('Classifier'));
    expect(aiNode.parameters.options.systemMessage).toContain('ABC Services');
    expect(aiNode.parameters.options.systemMessage).toContain('electrician');
    expect(aiNode.parameters.options.systemMessage).toContain('plumber');
    
    // Layer 2 (Behavior): Reply tone and behavior
    const replyNode = result.workflow.nodes.find(n => n.name.includes('Reply Agent'));
    expect(replyNode.parameters.options.systemMessage).toContain('Safety-focused');
    expect(replyNode.parameters.options.systemMessage).toContain('emergency-ready');
    
    // Layer 3 (Labels): Label IDs in routing nodes
    const urgentNode = result.workflow.nodes.find(n => n.name === 'Route to URGENT');
    expect(urgentNode.parameters.labelIds).toContain('Label_TEST_123');
    
    const salesNode = result.workflow.nodes.find(n => n.name === 'Route to SALES');
    expect(salesNode.parameters.labelIds).toContain('Label_TEST_456');
  });
  
  it('should handle missing email_labels gracefully', async () => {
    const testProfile = { ...baseProfile, email_labels: null };
    const result = await deployN8nWorkflow(testProfile);
    
    // Should not throw error
    expect(result.success).toBe(true);
    
    // Label routing nodes should have empty IDs
    const urgentNode = result.workflow.nodes.find(n => n.name === 'Route to URGENT');
    expect(urgentNode.parameters.labelIds).toEqual(['']);
  });
});
```

**Acceptance Criteria:**
- [ ] Multi-business deployment works correctly
- [ ] All 3 schema layers are injected
- [ ] Label IDs are properly mapped
- [ ] AI keywords reflect merged schemas
- [ ] Behavior tone is blended correctly
- [ ] Edge cases handled (missing data, single business)

---

#### **Task 4.3: End-to-End Test - Email Processing**
**File:** `tests/e2e/email-processing-flow.test.js` (NEW)  
**Owner:** QA Team  
**Priority:** 🔥 High  
**Estimated Time:** 5 hours

**Test Scenario:**
```javascript
describe('End-to-End Email Processing', () => {
  it('should process email through complete workflow with all 3 layers', async () => {
    // Setup: Deploy workflow for test user (Electrician + Plumber)
    const testUser = await createTestUser({
      businessTypes: ['Electrician', 'Plumber'],
      managers: [{ name: 'John' }]
    });
    
    await deployWorkflowForUser(testUser.id);
    await provisionLabelsForUser(testUser.id); // Creates Gmail labels
    
    // Act: Send test email to trigger workflow
    const testEmail = {
      subject: 'Emergency! Panel sparking and water leak!',
      from: 'customer@example.com',
      body: 'We have a major issue - our electrical panel is sparking and there\'s water leaking from the pipes!'
    };
    
    await sendTestEmailToGmail(testUser.email, testEmail);
    
    // Wait for n8n to process
    await waitForWorkflowExecution(10000);
    
    // Assert: Check workflow execution results
    const execution = await getLatestWorkflowExecution(testUser.workflowId);
    
    // Layer 1 (AI Classification): Should classify as URGENT
    expect(execution.data.aiClassifier.primary_category).toBe('URGENT');
    expect(execution.data.aiClassifier.keywords_matched).toContain('sparking');
    expect(execution.data.aiClassifier.keywords_matched).toContain('leak');
    
    // Layer 2 (Behavior): Should use safety-focused tone
    expect(execution.data.aiReply.draft).toContain('safety');
    expect(execution.data.aiReply.tone).toMatch(/safety-focused|emergency-ready/i);
    
    // Layer 3 (Labels): Should route to URGENT label
    const gmailLabels = await getGmailLabelsForEmail(testUser.email, testEmail.subject);
    expect(gmailLabels).toContain('URGENT');
    
    // Verify email in correct folder
    const emailInFolder = await checkEmailInGmailFolder(testUser.email, 'URGENT', testEmail.subject);
    expect(emailInFolder).toBe(true);
  });
  
  it('should handle multi-business classification correctly', async () => {
    const testEmail = {
      subject: 'Need panel inspection and water pressure check',
      body: 'Can you inspect our electrical panel and also check water pressure?'
    };
    
    await sendTestEmailToGmail(testUser.email, testEmail);
    await waitForWorkflowExecution(10000);
    
    const execution = await getLatestWorkflowExecution(testUser.workflowId);
    
    // Should classify as SERVICE (not emergency)
    expect(execution.data.aiClassifier.primary_category).toBe('SERVICE');
    
    // Should recognize both business types in keywords
    expect(execution.data.aiClassifier.keywords_matched).toContain('panel');
    expect(execution.data.aiClassifier.keywords_matched).toContain('water pressure');
  });
});
```

**Acceptance Criteria:**
- [ ] Email classified correctly using merged AI schemas
- [ ] Reply tone reflects merged behavior schemas
- [ ] Email routed to correct Gmail label
- [ ] Multi-business keywords recognized
- [ ] Category-specific language applied

---

### **PHASE 5: Documentation & Handoff**

#### **Task 5.1: Update Developer Documentation**
**File:** `docs/N8N_DEPLOYMENT_GUIDE.md` (UPDATE)  
**Owner:** Tech Lead  
**Priority:** 🟡 Medium  
**Estimated Time:** 2 hours

**Add Sections:**
1. **Label ID Injection System**
   - How label IDs are stored in `profiles.email_labels`
   - How placeholders work (`<<<LABEL_URGENT_ID>>>`)
   - Dynamic vs. static label ID injection

2. **AI Schema Integration**
   - How AI keywords are merged
   - System message construction
   - Intent mapping for classification

3. **Behavior Schema Integration**
   - How behavior schemas affect reply tone
   - Upsell and follow-up guidelines
   - Category-specific language overrides

**Acceptance Criteria:**
- [ ] All 3 schema layers documented
- [ ] Code examples provided
- [ ] Troubleshooting section added
- [ ] Diagrams showing data flow

---

#### **Task 5.2: Create Runbook for Label ID Management**
**File:** `docs/LABEL_ID_MANAGEMENT_RUNBOOK.md` (NEW)  
**Owner:** DevOps  
**Priority:** 🟡 Medium  
**Estimated Time:** 1.5 hours

**Include:**
1. **What are label IDs and why they matter**
2. **How to view current label mappings** (database query)
3. **How to regenerate labels if deleted** (re-provisioning process)
4. **How to update workflows if label IDs change** (redeployment)
5. **Troubleshooting: Workflow not routing emails** (check label IDs)

**Acceptance Criteria:**
- [ ] Step-by-step instructions for common scenarios
- [ ] Database queries documented
- [ ] Redeployment process explained
- [ ] Troubleshooting flowchart included

---

## 📊 **Implementation Summary**

### **Timeline Estimate:**

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|---------------|----------|
| **Phase 1: Label IDs** | 2 tasks | 4-5 hours | 🔥 Critical |
| **Phase 2: AI Layer** | 3 tasks | 4.5 hours | 🔥 High |
| **Phase 3: Behavior Layer** | 3 tasks | 4.25 hours | 🔥 High |
| **Phase 4: Testing** | 3 tasks | 12 hours | 🔥 High |
| **Phase 5: Docs** | 2 tasks | 3.5 hours | 🟡 Medium |
| **TOTAL** | **13 tasks** | **~28 hours** | **~3.5 days** |

### **Team Allocation:**

- **Backend Developer:** 13 hours (Phases 1-3)
- **QA Engineer:** 12 hours (Phase 4)
- **Tech Lead/DevOps:** 3.5 hours (Phase 5)

---

## ✅ **Definition of Done**

### **For Each Phase:**

- [ ] All code changes committed and pushed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Deployment tested on staging

### **For Complete Implementation:**

- [ ] All 13 tasks completed
- [ ] All test suites passing (unit + integration + e2e)
- [ ] Multi-business workflow deployed successfully
- [ ] Email routing verified with real Gmail account
- [ ] AI classification using merged keywords
- [ ] AI reply using merged behavior tone
- [ ] Documentation complete and reviewed
- [ ] Production deployment plan approved

---

## 🎯 **Success Criteria**

### **Technical:**
1. ✅ n8n workflows use dynamic label IDs (not hard-coded)
2. ✅ AI Classifier uses merged keywords from businessSchemas
3. ✅ AI Reply Agent uses merged tone from behaviorSchemas
4. ✅ Multi-business users get unified configuration
5. ✅ Label routing works for all standard categories
6. ✅ Workflows are reusable across all clients

### **Business:**
1. ✅ Any new client can onboard without manual workflow creation
2. ✅ Multi-business clients get intelligent email classification
3. ✅ AI replies reflect correct business voice and behavior
4. ✅ Emails routed to correct folders automatically
5. ✅ System scales to support 100+ concurrent clients

---

## 🔗 **Related Files**

### **Files to Create:**
- `src/lib/aiSchemaInjector.js`
- `src/lib/behaviorSchemaInjector.js`
- `src/lib/aiSchemaInjector.test.js`
- `src/lib/behaviorSchemaInjector.test.js`
- `tests/integration/complete-deployment-flow.test.js`
- `tests/e2e/email-processing-flow.test.js`
- `docs/LABEL_ID_MANAGEMENT_RUNBOOK.md`

### **Files to Update:**
- `supabase/functions/deploy-n8n/index.ts` (Lines 49-91)
- `src/lib/n8n-templates/electrician_template.json`
- `src/lib/n8n-templates/plumber_template.json`
- `src/lib/n8n-templates/hvac_template.json`
- `src/lib/n8n-templates/pools_spas_generic_template.json`
- `src/lib/n8n-templates/hot_tub_base_template.json`
- `docs/N8N_DEPLOYMENT_GUIDE.md`

### **Files Already Complete:**
- ✅ `src/lib/aiSchemaMerger.js`
- ✅ `src/lib/behaviorSchemaMerger.js`
- ✅ `src/lib/labelSchemaMerger.js`
- ✅ `src/lib/schemaIntegrationBridge.js`
- ✅ All schemas in `src/businessSchemas/*.ai.json`
- ✅ All schemas in `src/behaviorSchemas/*.json`
- ✅ All schemas in `src/labelSchemas/*.json`

---

## 🚀 **Sprint Ticket Template**

```markdown
## 🎫 Ticket: Integrate 3-Layer Schema System into n8n Deployment

### **Story:**
As a FloworxV2 system, I need to inject all 3 schema layers (AI, Behavior, Labels) into n8n workflows during deployment, so that multi-business clients get intelligent email classification, behavior-appropriate replies, and correct email routing.

### **Acceptance Criteria:**
- [ ] n8n templates use dynamic label ID placeholders
- [ ] AI Classifier node uses merged AI keywords
- [ ] AI Reply Agent node uses merged behavior tone
- [ ] Label routing nodes use actual Gmail label IDs
- [ ] Multi-business users get unified configuration
- [ ] All tests passing (unit + integration + e2e)

### **Technical Tasks:**
See `TECHNICAL_IMPLEMENTATION_CHECKLIST.md` for complete task breakdown (13 tasks, ~28 hours)

### **Priority:** P0 (Critical)
### **Estimated Effort:** 28 hours (~3.5 days)
### **Team:** Backend (13h) + QA (12h) + Tech Lead (3.5h)

### **Dependencies:**
- Schema systems already complete ✅
- Label provisioning working ✅
- n8n API access configured ✅

### **Testing Strategy:**
- Unit tests for injector functions
- Integration tests for deployment flow
- E2e tests for email processing
- Manual testing with real Gmail account

### **Documentation:**
- Update N8N_DEPLOYMENT_GUIDE.md
- Create LABEL_ID_MANAGEMENT_RUNBOOK.md
- Add inline code comments
```

---

## 📞 **Support & Questions**

**For Technical Questions:**
- Reference: `HOW_3_LAYERS_ARE_USED.md`
- Reference: `LABEL_ID_FLOW_COMPLETE.md`
- Reference: `SCHEMA_SYSTEM_ARCHITECTURE.md`

**For Implementation Help:**
- Check: `src/lib/schemaIntegrationBridge.js` (example integration)
- Check: `src/lib/labelProvisionService.js` (label creation flow)
- Check: `supabase/functions/deploy-n8n/index.ts` (current deployment logic)

---

**Implementation Checklist Complete!** 🎯

This checklist provides **line-by-line code changes**, **exact file paths**, and **acceptance criteria** for integrating all 3 schema layers into the n8n deployment pipeline.
