# 🧪 FloworxV2 Validation Scripts

This directory contains validation scripts for the three-layer schema system.

---

## 📋 **Available Scripts**

### **1. Validate AI Schemas** (`validate-ai-schema.ts`)

Validates all AI classification schemas in `businessSchemas/`.

```bash
# Validate all AI schemas
npm run validate-ai-schemas

# Validate specific AI schema
tsx src/scripts/validate-ai-schema.ts src/businessSchemas/electrician.ai.json

# Check cross-schema consistency
tsx src/scripts/validate-ai-schema.ts consistency

# Extract AI config for n8n
tsx src/scripts/validate-ai-schema.ts extract src/businessSchemas/electrician.ai.json
```

**Validates:**
- ✅ Required fields (businessType, keywords, intentMapping, etc.)
- ✅ Intent mapping consistency (all intents map to valid labels)
- ✅ Unique n8n environment variables
- ✅ Keyword arrays have content
- ✅ Escalation rules have valid SLA format

---

### **2. Validate Behavior Schemas** (`validate-behavior-json.ts`)

Validates all reply behavior schemas in `behaviorSchemas/`.

```bash
# Validate all behavior schemas
npm run validate-behaviors

# Validate specific behavior schema
tsx src/scripts/validate-behavior-json.ts src/behaviorSchemas/electrician.json

# Generate new behavior schema
tsx src/scripts/validate-behavior-json.ts generate "New Industry"
```

**Validates:**
- ✅ Required fields (voiceProfile, aiDraftRules, signature)
- ✅ Voice profile has tone and formality level
- ✅ AI draft rules structure
- ✅ Auto-reply policy configuration
- ✅ Follow-up guidelines
- ✅ Category overrides

---

### **3. Validate Label Schemas** (`validate-label-schema.ts`)

Validates all label/folder schemas in `labelSchemas/`.

```bash
# Validate all label schemas
npm run validate-labels

# Validate specific label schema
tsx src/scripts/validate-label-schema.ts src/labelSchemas/electrician.json

# Extract label mapping for n8n
tsx src/scripts/validate-label-schema.ts extract src/labelSchemas/electrician.json

# Generate n8n environment variables
tsx src/scripts/validate-label-schema.ts env src/labelSchemas/electrician.json

# Generate new label schema
tsx src/scripts/validate-label-schema.ts generate "New Industry"
```

**Validates:**
- ✅ Required fields (meta, rootOrder, labels, dynamicVariables)
- ✅ Label hierarchy structure
- ✅ Color definitions (backgroundColor, textColor)
- ✅ Nested subcategory structure
- ✅ Dynamic variable placeholders

---

### **4. Validate All Schemas** (`validate-all-schemas.ts`) ⭐ MASTER

Validates all 3 layers and checks cross-layer consistency.

```bash
# Run complete validation (all 3 layers + consistency)
npm run validate-schemas

# Generate detailed validation report
npm run validate-schemas:report

# Check only cross-layer consistency
npm run validate-schemas:consistency
```

**Validates:**
- ✅ **Layer 1:** All AI schemas (businessSchemas/)
- ✅ **Layer 2:** All behavior schemas (behaviorSchemas/)
- ✅ **Layer 3:** All label schemas (labelSchemas/)
- ✅ **Consistency:** AI labels match label schema structure
- ✅ **Generates report:** Detailed JSON validation report

---

## 📊 **Validation Output Examples**

### **All Passing:**
```
╔════════════════════════════════════════════════════════════╗
║  FLOWORX V2 - COMPLETE SCHEMA SYSTEM VALIDATION            ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 LAYER 1: AI Classification Schemas (businessSchemas/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ electrician.ai.json passed all validations
✅ plumber.ai.json passed all validations
✅ pools_spas.ai.json passed all validations
... (14 total)

📊 Validation Summary
====================
Total Files: 14
Passed: 14
Failed: 0
Success Rate: 100.0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 LAYER 2: Reply Behavior Schemas (behaviorSchemas/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ electrician.json passed schema validation
✅ plumber.json passed schema validation
... (13 total)

📊 Validation Summary
====================
Total Files: 13
Passed: 13
Failed: 0
Success Rate: 100.0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 LAYER 3: Label/Folder Schemas (labelSchemas/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ electrician.json passed schema validation
✅ plumber.json passed schema validation
... (12 total)

📊 Validation Summary
====================
Total Files: 12
Passed: 12
Failed: 0
Success Rate: 100.0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 CROSS-LAYER CONSISTENCY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ electrician: AI and label schemas are consistent
✅ plumber: AI and label schemas are consistent
...

✅ All schemas are consistent!

╔════════════════════════════════════════════════════════════╗
║  VALIDATION SUMMARY                                        ║
╚════════════════════════════════════════════════════════════╝

✅ AI Schemas (businessSchemas/)
   Files: 14/14 passed

✅ Behavior Schemas (behaviorSchemas/)
   Files: 13/13 passed

✅ Label Schemas (labelSchemas/)
   Files: 12/12 passed

🔗 Cross-Layer Consistency: ✅ Consistent

════════════════════════════════════════════════════════════
🎉 ALL VALIDATIONS PASSED!
   ✅ All 3 schema layers are valid
   ✅ Cross-layer consistency verified
   ✅ System is production-ready
════════════════════════════════════════════════════════════
```

---

## 🔧 **Common Use Cases**

### **Before Committing Changes:**
```bash
npm run validate-schemas
```

### **Before Production Deployment:**
```bash
npm run validate-schemas:report
# Review validation-report.json
```

### **Debugging Schema Issues:**
```bash
# Check specific layer
npm run validate-ai-schemas
npm run validate-behaviors
npm run validate-labels

# Check cross-layer consistency
npm run validate-schemas:consistency
```

### **Adding New Business Type:**
```bash
# 1. Create schemas manually or use generators
tsx src/scripts/validate-behavior-json.ts generate "New Industry"
tsx src/scripts/validate-label-schema.ts generate "New Industry"

# 2. Validate new schemas
npm run validate-schemas

# 3. Check consistency
npm run validate-schemas:consistency
```

---

## 📝 **Validation Report Format**

When you run `npm run validate-schemas:report`, it generates `validation-report.json`:

```json
{
  "generatedAt": "2025-10-08T00:00:00.000Z",
  "overallStatus": "PASS",
  "layers": [
    {
      "layer": "AI Schemas (businessSchemas/)",
      "total": 14,
      "passed": 14,
      "failed": 0,
      "warnings": 0,
      "status": "pass"
    },
    {
      "layer": "Behavior Schemas (behaviorSchemas/)",
      "total": 13,
      "passed": 13,
      "failed": 0,
      "status": "pass"
    },
    {
      "layer": "Label Schemas (labelSchemas/)",
      "total": 12,
      "passed": 12,
      "failed": 0,
      "status": "pass"
    }
  ],
  "crossLayerConsistency": {
    "consistent": true,
    "issues": []
  },
  "recommendations": [
    "All validations passed - system ready for production"
  ]
}
```

---

## ⚠️ **What Each Validator Catches**

### **AI Schema Validator:**
- ❌ Missing keywords (primary, emergency)
- ❌ Intent mapping to non-existent labels
- ❌ Duplicate n8n environment variables
- ❌ Invalid SLA format in escalation rules
- ❌ Missing required fields

### **Behavior Validator:**
- ❌ Invalid formality level (must be: casual, medium, formal)
- ❌ Missing behavior goals
- ❌ Invalid confidence threshold (must be 0-1)
- ❌ Missing signature components
- ❌ Missing required CTA examples

### **Label Validator:**
- ❌ Invalid color format (must have backgroundColor + textColor)
- ❌ Missing label hierarchy
- ❌ Invalid dynamic variable format
- ❌ Orphaned nested categories
- ❌ Duplicate label names

### **Cross-Layer Consistency:**
- ❌ AI schema has label not in label schema
- ❌ Label schema has label not in AI schema
- ❌ Intent maps to label that doesn't exist

---

## 🚀 **CI/CD Integration**

Add to your GitHub Actions workflow:

```yaml
name: Validate Schemas

on:
  pull_request:
    paths:
      - 'src/businessSchemas/**'
      - 'src/behaviorSchemas/**'
      - 'src/labelSchemas/**'
  
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run validate-schemas
      - name: Upload validation report
        if: always()
        run: npm run validate-schemas:report
      - uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation-report.json
```

---

## 🎯 **Best Practices**

### **DO:**
✅ Run `npm run validate-schemas` before committing schema changes  
✅ Check validation report in CI/CD pipeline  
✅ Fix all errors before merging to main  
✅ Review warnings (may indicate design issues)  
✅ Validate cross-layer consistency regularly  

### **DON'T:**
❌ Skip validation after creating new schemas  
❌ Ignore warnings (they often reveal real issues)  
❌ Modify one layer without checking consistency  
❌ Deploy without running full validation  

---

## 📚 **Related Documentation**

- [Schema System Architecture](../../docs/SCHEMA_SYSTEM_ARCHITECTURE.md)
- [Multi-Business Schema Merging](../../docs/MULTI_BUSINESS_SCHEMA_MERGING.md)
- [Three-Layer System Guide](../../THREE_LAYER_SCHEMA_SYSTEM_COMPLETE.md)

---

## 🔧 **Script Maintenance**

### **Adding New Validation Rules:**

Edit the appropriate validator:
- AI rules → `validate-ai-schema.ts`
- Behavior rules → `validate-behavior-json.ts`
- Label rules → `validate-label-schema.ts`

### **Updating Validation Schema:**

Each validator has a `validationSchema` object following JSON Schema spec:
```typescript
const validationSchema = {
  type: "object",
  required: ["field1", "field2"],
  properties: {
    field1: { type: "string" },
    field2: { type: "number", minimum: 0 }
  }
};
```

---

**Last Updated:** October 8, 2025  
**Scripts:** 4 validation tools  
**Coverage:** 3 schema layers + cross-layer consistency  
**Status:** ✅ Production Ready

