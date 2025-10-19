# 🧩 Standardized Behavior JSON Schema System

## 🎯 Overview

This is a **standardized, future-proof JSON schema** for AI behavior configs that allows every new industry (HVAC, Roofing, Landscaping, etc.) to plug into the Floworx workflow with zero manual editing. The system provides a unified template, validation, and generation framework for industry-specific AI behavior configurations.

## 🏆 What This System Provides

✅ **Standardized Schema** - Universal template for all industry behavior JSONs
✅ **Industry-Specific Configurations** - Tailored behavior for each business type
✅ **Schema Validation** - Comprehensive validation system for all behavior JSONs
✅ **Auto-Generation** - Generate new behavior JSONs from template with customizations
✅ **Future-Proof Design** - Extensible schema that supports new industries
✅ **n8n Integration** - Seamless integration with n8n workflow provisioning
✅ **Comprehensive Testing** - Full test suite covering validation and generation

## 🧩 Architecture Overview

```
[Template Schema] 
   ↓ _template.json (universal structure)
[Industry Configurations]
   ↓ roofing.json, hvac.json, pools_spas.json, etc.
[Validation System]
   ↓ validate-behavior-json.ts
[Generation System]
   ↓ generateBehaviorJsonFromTemplate()
[n8n Integration]
   ↓ Injected into AI Draft nodes during provisioning
[Runtime Execution]
   ↓ AI uses industry-specific behavior for responses
```

## 🔧 Implementation Details

### **1. Template Schema: `_template.json`**

**Purpose:** Universal template defining the structure for all industry behavior JSONs
**Location:** `src/behaviorSchemas/_template.json`
**Structure:** Complete schema with all required and optional fields

```json
{
  "meta": {
    "schemaVersion": "v2.0",
    "industry": "Example Industry",
    "author": "AI System",
    "lastUpdated": "2025-10-05T00:00:00Z",
    "source": "auto-generated"
  },
  "voiceProfile": {
    "tone": "Friendly, professional, and concise",
    "formalityLevel": "medium",
    "allowPricingInReplies": true,
    "includeSignature": true
  },
  "signature": {
    "closingText": "Thanks so much for supporting our small business!",
    "signatureBlock": "Best regards,\n{{businessProfile.businessName}} Team\n{{contactInfo.afterHoursSupportLine}}"
  },
  "aiDraftRules": {
    "behaviorGoals": [...],
    "autoReplyPolicy": {...},
    "followUpGuidelines": {...},
    "replyFormat": {...},
    "upsellGuidelines": {...},
    "errorHandling": {...}
  },
  "categoryOverrides": {...},
  "validation": {...}
}
```

**Key Features:**
- ✅ **Complete Structure** - All required fields defined
- ✅ **Variable Substitution** - Template variables for dynamic content
- ✅ **Validation Rules** - Built-in validation requirements
- ✅ **Extensible Design** - Easy to add new fields

### **2. Industry-Specific Configurations**

**Purpose:** Tailored behavior JSONs for specific industries
**Location:** `src/behaviorSchemas/[industry].json`
**Examples:** `roofing.json`, `hvac.json`, `pools_spas.json`, `landscaping.json`

#### **Roofing Contractor Example:**
```json
{
  "meta": {
    "schemaVersion": "v2.0",
    "industry": "Roofing Contractor",
    "author": "AI Config Generator",
    "lastUpdated": "2025-10-05T00:00:00Z"
  },
  "voiceProfile": {
    "tone": "Reassuring, professional, and confident",
    "formalityLevel": "medium",
    "allowPricingInReplies": true,
    "includeSignature": true
  },
  "aiDraftRules": {
    "behaviorGoals": [
      "Quickly reassure customers during urgent leak or storm damage cases",
      "Use confident, action-first tone",
      "Provide realistic scheduling and timelines"
    ],
    "categoryOverrides": {
      "Urgent": {
        "priorityLevel": 1,
        "customLanguage": [
          "We understand how stressful roof leaks can be — we'll act fast to help.",
          "Our emergency crew is on standby for storm-related damage."
        ]
      }
    }
  }
}
```

**Key Features:**
- ✅ **Industry-Specific Tone** - Tailored voice profiles per industry
- ✅ **Custom Language** - Industry-specific phrases and terminology
- ✅ **Category Overrides** - Special handling for industry-relevant categories
- ✅ **Behavior Goals** - Industry-specific AI behavior objectives

### **3. Validation System: `validate-behavior-json.ts`**

**Purpose:** Comprehensive validation system for all behavior JSONs
**Location:** `src/scripts/validate-behavior-json.ts`
**Features:** Schema validation, error reporting, batch validation

```typescript
// Validate a single behavior JSON
const result = validateBehaviorJson('src/behaviorSchemas/roofing.json');

// Validate all behavior JSONs
const results = validateAllBehaviorJsonSchemas();

// Generate new behavior JSON from template
const newBehavior = generateBehaviorJsonFromTemplate('New Industry', customizations);
```

**Key Features:**
- ✅ **Schema Validation** - Ensures all JSONs follow the template structure
- ✅ **Error Reporting** - Detailed error messages for validation failures
- ✅ **Batch Validation** - Validate all behavior JSONs at once
- ✅ **Generation Support** - Create new behavior JSONs from template

### **4. n8n Integration**

**Purpose:** Seamless integration with n8n workflow provisioning
**Implementation:** Behavior JSONs are injected into AI Draft nodes during workflow creation

```typescript
// During workflow provisioning
const behaviorJson = await loadIndustryBehaviorConfig(businessType);
node.parameters.options.systemMessage = JSON.stringify(behaviorJson, null, 2);
```

**Key Features:**
- ✅ **Dynamic Injection** - Behavior JSONs loaded based on business type
- ✅ **Runtime Configuration** - AI nodes configured with industry-specific behavior
- ✅ **Template Variables** - Dynamic substitution of business-specific data
- ✅ **Seamless Integration** - No manual editing required

## 🚀 Production Deployment

### **Directory Structure**

```
src/
├── behaviorSchemas/
│   ├── _template.json          # Universal template
│   ├── roofing.json            # Roofing Contractor behavior
│   ├── hvac.json               # HVAC behavior
│   ├── pools_spas.json         # Pools & Spas behavior
│   ├── landscaping.json        # Landscaping behavior
│   └── [industry].json         # Additional industry configs
├── scripts/
│   └── validate-behavior-json.ts  # Validation system
└── lib/
    └── unifiedEmailProvisioning.ts # n8n integration
```

### **Environment Variables**

```bash
# Behavior Schema Configuration
BEHAVIOR_SCHEMAS_PATH=src/behaviorSchemas
BEHAVIOR_TEMPLATE_PATH=src/behaviorSchemas/_template.json
BEHAVIOR_VALIDATION_STRICT=true
```

### **Dependencies**

```json
{
  "dependencies": {
    "ajv": "^8.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 🧪 Testing

### **Test Coverage**

The system includes comprehensive testing with 10 test scenarios:

1. **Template Schema Validation** - Ensures template follows correct structure
2. **Roofing Behavior JSON Validation** - Validates roofing-specific configuration
3. **HVAC Behavior JSON Validation** - Validates HVAC-specific configuration
4. **Pools & Spas Behavior JSON Validation** - Validates pools/spas-specific configuration
5. **Landscaping Behavior JSON Validation** - Validates landscaping-specific configuration
6. **Invalid JSON Detection** - Ensures invalid JSONs are properly rejected
7. **Behavior JSON Generation** - Tests template-based generation
8. **All Behavior Schemas Validation** - Batch validation of all schemas
9. **Schema Structure Validation** - Ensures all required fields exist
10. **Customization Application** - Tests customization application logic

### **Running Tests**

```bash
# Install dependencies
npm install

# Run validation tests
npm run test:behavior-validation

# Validate all behavior schemas
npm run validate-behavior

# Generate new behavior JSON
npm run generate-behavior "Industry Name"
```

### **Test Results**

```
📊 Test Summary
================
Total Tests: 10
Passed: 10
Failed: 0
Success Rate: 100.0%

🎯 Behavior JSON Validation Test Complete!
```

## 🔒 Schema Validation Rules

### **Required Fields**

```typescript
const requiredFields = [
  'meta',
  'voiceProfile', 
  'aiDraftRules',
  'signature'
];

const requiredMetaFields = [
  'schemaVersion',
  'industry',
  'author',
  'lastUpdated'
];

const requiredVoiceFields = [
  'tone',
  'formalityLevel',
  'allowPricingInReplies',
  'includeSignature'
];
```

### **Validation Rules**

- **Schema Version** - Must be "v2.0"
- **Industry** - Must be a non-empty string
- **Formality Level** - Must be "casual", "medium", or "formal"
- **Confidence Threshold** - Must be between 0.0 and 1.0
- **Priority Levels** - Must be between 1 and 5
- **Required Arrays** - Must contain at least one item

## 🎯 Usage Examples

### **1. Validate Existing Behavior JSON**

```typescript
import { validateBehaviorJson } from './src/scripts/validate-behavior-json';

const result = validateBehaviorJson('src/behaviorSchemas/roofing.json');
if (result.valid) {
  console.log('✅ Roofing behavior JSON is valid');
} else {
  console.error('❌ Validation failed:', result.errors);
}
```

### **2. Generate New Behavior JSON**

```typescript
import { generateBehaviorJsonFromTemplate } from './src/scripts/validate-behavior-json';

const customizations = {
  voiceProfile: {
    tone: 'Technical and precise',
    formalityLevel: 'formal'
  },
  signature: {
    closingText: 'Thank you for choosing our services!'
  }
};

const newBehavior = generateBehaviorJsonFromTemplate('Electrical Services', customizations);
```

### **3. Validate All Behavior Schemas**

```typescript
import { validateAllBehaviorJsonSchemas } from './src/scripts/validate-behavior-json';

const results = validateAllBehaviorJsonSchemas();
console.log(`Validated ${results.total} schemas: ${results.passed} passed, ${results.failed} failed`);
```

### **4. n8n Integration**

```typescript
// During workflow provisioning
const behaviorJson = await loadIndustryBehaviorConfig(businessType);

// Inject into AI Draft node
const aiDraftNode = workflow.nodes.find(node => node.name === 'AI Draft Generator');
aiDraftNode.parameters.options.systemMessage = JSON.stringify(behaviorJson, null, 2);
```

## 🚀 Next Steps

### **1. Add New Industries**
- Create new behavior JSONs using the template
- Validate using the validation system
- Test with real business data

### **2. Extend Schema**
- Add new fields to the template
- Update validation rules
- Migrate existing behavior JSONs

### **3. Advanced Features**
- Dynamic behavior generation based on business data
- A/B testing for different behavior configurations
- Analytics on behavior effectiveness

### **4. Integration Enhancements**
- Real-time behavior updates
- Behavior versioning and rollback
- Multi-language support

## 🎉 Summary

This **standardized behavior JSON schema system** provides:

- **✅ Universal Template** - Single schema for all industries
- **✅ Industry-Specific Configurations** - Tailored behavior per business type
- **✅ Comprehensive Validation** - Ensures all JSONs follow correct structure
- **✅ Auto-Generation** - Create new behavior JSONs from template
- **✅ n8n Integration** - Seamless workflow provisioning
- **✅ Future-Proof Design** - Extensible for new industries
- **✅ Complete Testing** - Full test coverage for validation and generation

The system successfully enables **zero-manual-editing** industry onboarding, where any new business type can be added by simply creating a behavior JSON that follows the standardized schema. This makes Floworx truly **multi-industry adaptable** with consistent AI behavior across all verticals! 🚀

## 📊 Industry Support Matrix

| Industry | Behavior JSON | Tone Profile | Special Categories | Status |
|----------|---------------|--------------|-------------------|---------|
| **Roofing Contractor** | ✅ | Confident, Professional | Urgent (Storm Damage) | Production Ready |
| **HVAC** | ✅ | Technical, Reliable | Maintenance, Emergency | Production Ready |
| **Pools & Spas** | ✅ | Relaxed, Water-focused | Water Care, Equipment | Production Ready |
| **Landscaping** | ✅ | Natural, Seasonal | Design, Maintenance | Production Ready |
| **Painting Contractor** | 🔄 | Creative, Colorful | Color Consultation | In Development |
| **Flooring Contractor** | 🔄 | Material-focused | Installation, Repair | In Development |
| **General Contractor** | 🔄 | Project-focused | Permits, Subcontractors | In Development |
| **Plumber** | 🔄 | Emergency-focused | Burst Pipes, Leaks | In Development |
| **Electrician** | 🔄 | Safety-focused | Panel Upgrades, Wiring | In Development |
| **Insulation & Foam Spray** | 🔄 | Energy-focused | Efficiency, Sealing | In Development |

This standardized system ensures that every new industry can be added with minimal effort while maintaining consistent, high-quality AI behavior across all business types! 🎯
