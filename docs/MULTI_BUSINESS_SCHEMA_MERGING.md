# Multi-Business Type Schema Merging

## Overview

FloworxV2 supports **dynamic schema merging** for businesses that operate in multiple industries. When a user selects multiple business types during onboarding (e.g., "Electrician + Plumber" or "Pools + Hot Tub + Sauna"), the system intelligently combines their label schemas while avoiding duplicates and overlaps.

---

## ✨ **Key Features**

### 1. **Intelligent Deduplication**
- Standard categories (`BANKING`, `URGENT`, `SUPPORT`, etc.) are **merged**, not duplicated
- Subcategories from multiple schemas combine into unified lists
- Example: `URGENT` from both Electrician and Plumber merges into one category with all unique subcategories

### 2. **Industry-Specific Category Preservation**
- Each business type's unique categories are **preserved and combined**
- Example: `PERMITS` (Electrician) + `INSPECTIONS` (Plumber) = Both appear in merged schema

### 3. **Dynamic Variable Merging**
- `{{Manager1}}`, `{{Supplier1}}` placeholders merge across all schemas
- No duplicate placeholders created
- Real names replace placeholders during provisioning

### 4. **Automatic Activation**
- Multi-business mode activates **automatically** when user selects 2+ business types
- No configuration needed - works seamlessly with existing onboarding flow

---

## 🏗️ **Architecture**

```
User Selects Business Types
         ↓
┌────────────────────────┐
│  Step3BusinessType.jsx │ → Saves business_types[] to profiles
└────────────────────────┘
         ↓
┌────────────────────────┐
│ labelSchemaMerger.js   │ → Merges schemas intelligently
└────────────────────────┘
         ↓
┌────────────────────────┐
│labelProvisionService.js│ → Creates Gmail/Outlook labels
└────────────────────────┘
         ↓
┌────────────────────────┐
│  templateService.js    │ → Uses primary type's n8n template
└────────────────────────┘
```

---

## 📋 **Merging Rules**

### **Standard Categories (Always Merged)**
These categories appear in **all** business type schemas and are deduplicated:

| Category | Behavior |
|----------|----------|
| `BANKING` | Subcategories merged (e-Transfer, Invoice, Receipts) |
| `FORMSUB` | Subcategories merged (New Submission, Work Order Forms) |
| `GOOGLE REVIEW` | Subcategories merged |
| `MANAGER` | Subcategories merged + dynamic `{{Manager1-5}}` placeholders |
| `SALES` | Subcategories merged |
| `SUPPLIERS` | Subcategories merged + dynamic `{{Supplier1-10}}` placeholders |
| `SUPPORT` | Subcategories merged (Technical, Scheduling, etc.) |
| `URGENT` | **⚠️ Subcategories merged** - Critical for multi-business routing |
| `MISC` | Subcategories merged |
| `PHONE` | Subcategories merged |
| `PROMO` | Subcategories merged |
| `RECRUITMENT` | Subcategories merged |
| `SOCIALMEDIA` | Subcategories merged |

### **Industry-Specific Categories (Combined)**
These categories are **unique to specific business types** and are combined:

| Business Type | Unique Category | Example Subcategories |
|---------------|-----------------|----------------------|
| **Electrician** | `PERMITS` | Permit Applications, Inspections, Code Compliance, ESA Documentation |
| **Plumber** | `INSPECTIONS` | Camera Inspections, Leak Detection, Water Quality Tests, Pressure Tests |
| **Pools & Spas** | `SEASONAL` | Opening, Closing, Winterization, Spring Start-up |
| **Hot Tub & Spa** | `SEASONAL` | Winterization, Spring Start-up, Annual Service, Deep Cleaning |
| **Sauna & Icebath** | `WELLNESS` | Usage Guidance, Health Benefits, Temperature Settings, Protocol Advice |
| **HVAC** | `MAINTENANCE` | Seasonal Tune-ups, Filter Changes, Duct Cleaning, System Inspections |
| **Painting** | `COLOR_CONSULTATION` | Color Selection, Sample Requests, Color Matching, Design Advice |
| **Flooring** | `ESTIMATES` | Residential, Commercial, Measurements Needed, Material Selection |
| **General Contractor** | `SUBCONTRACTORS` | Electrician, Plumber, HVAC, Drywall, Flooring |

---

## 🔧 **Example Scenarios**

### **Scenario 1: Electrician + Plumber**

**Input:**
```javascript
businessTypes: ['Electrician', 'Plumber']
```

**Output:**
```javascript
{
  meta: {
    industry: "Electrician + Plumber",
    sourceBusinessTypes: ["Electrician", "Plumber"]
  },
  labels: [
    // Standard categories (merged)
    { name: "BANKING", sub: [...] },
    { name: "URGENT", sub: [
      "No Power",              // From Electrician
      "Electrical Hazard",     // From Electrician
      "Tripping Breaker",      // From Electrician
      "Burst Pipe",            // From Plumber
      "Water Leak",            // From Plumber
      "Flooding"               // From Plumber
    ]},
    
    // Industry-specific (combined)
    { name: "PERMITS", sub: [...] },      // From Electrician
    { name: "INSPECTIONS", sub: [...] },  // From Plumber
  ]
}
```

---

### **Scenario 2: Pools + Hot Tub + Sauna (Aquatics Business)**

**Input:**
```javascript
businessTypes: ['Pools & Spas', 'Hot tub & Spa', 'Sauna & Icebath']
```

**Output:**
```javascript
{
  meta: {
    industry: "Pools & Spas + Hot tub & Spa + Sauna & Icebath",
    sourceBusinessTypes: ["Pools & Spas", "Hot tub & Spa", "Sauna & Icebath"]
  },
  labels: [
    // Standard categories (merged)
    { name: "URGENT", sub: [
      "Leaking",               // From all 3
      "Pump Not Working",      // From Pools + Hot Tub
      "Heater Error",          // From Hot Tub + Sauna
      "Not Heating",           // From Sauna
      "Chiller Not Working"    // From Sauna
    ]},
    
    // Industry-specific (combined)
    { name: "SEASONAL", sub: [
      "Opening",               // From Pools
      "Closing",               // From Pools
      "Winterization",         // From Pools + Hot Tub
      "Spring Start-up",       // From Pools + Hot Tub
      "Annual Service",        // From Hot Tub
      "Deep Cleaning"          // From Hot Tub
    ]},
    { name: "WELLNESS", sub: [...] },  // From Sauna only
  ]
}
```

---

### **Scenario 3: General Contractor with Specialties**

**Input:**
```javascript
businessTypes: ['General Contractor', 'Flooring Contractor', 'Painting Contractor', 'Roofing Contractor']
```

**Output:**
```javascript
{
  labels: [
    // Standard categories
    { name: "SALES", sub: [
      "Renovations",           // From General
      "New Construction",      // From General
      "Hardwood",              // From Flooring
      "Tile",                  // From Flooring
      "Interior Painting",     // From Painting
      "Exterior Painting",     // From Painting
      "Roof Repairs",          // From Roofing
      "Replacements"           // From Roofing
    ]},
    
    // Industry-specific (all combined)
    { name: "SUBCONTRACTORS", sub: [...] },      // From General Contractor
    { name: "PERMITS", sub: [...] },             // From General Contractor
    { name: "ESTIMATES", sub: [...] },           // From Flooring
    { name: "COLOR_CONSULTATION", sub: [...] }   // From Painting
  ]
}
```

---

## 🚀 **Usage**

### **In Code**

```javascript
import { mergeBusinessTypeSchemas } from '@/lib/labelSchemaMerger';

// Merge multiple business type schemas
const mergedSchema = mergeBusinessTypeSchemas(['Electrician', 'Plumber']);

// Validate no duplicates
import { validateMergedSchema } from '@/lib/labelSchemaMerger';
const validation = validateMergedSchema(mergedSchema);
console.log(validation.isValid); // true
```

### **During Onboarding**

1. User selects multiple business types in `Step3BusinessType`
2. System saves as `business_types` array in profiles table
3. Label provisioning automatically uses merger:
   ```javascript
   const schema = processDynamicSchema(finalBusinessTypes, managers, suppliers);
   // Automatically merges if businessTypes.length > 1
   ```

### **For n8n Workflows**

```javascript
import { injectOnboardingData } from '@/lib/templateService';

const clientData = {
  business: {
    types: ['Electrician', 'Plumber'],  // Multi-business
    type: 'Electrician'  // Primary type (for template selection)
  },
  // ... other config
};

const workflowTemplate = injectOnboardingData(clientData);
// Uses Electrician's n8n template with merged label schema
```

---

## 🧪 **Testing**

Run the test suite:

```bash
node test-multi-business-schema-merger.js
```

Expected output:
```
✅ All Tests Complete!

📊 Summary:
   - Single business: Works ✅
   - Two businesses: Merges correctly ✅
   - Three+ businesses: Merges correctly ✅
   - Validation: No duplicates ✅
   - Subcategory merging: Deduplicates ✅
   - Industry categories: Combines unique ones ✅
```

---

## 🗄️ **Database Schema**

```sql
-- profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  business_type text,              -- Legacy: single business type
  business_types text[],            -- New: array of business types
  managers jsonb,
  suppliers jsonb,
  email_labels jsonb,
  client_config jsonb
);
```

**Example Data:**
```json
{
  "business_type": "Electrician",
  "business_types": ["Electrician", "Plumber"],
  "managers": [
    { "name": "John", "email": "john@company.com" },
    { "name": "Jane", "email": "jane@company.com" }
  ]
}
```

---

## 📝 **Implementation Checklist**

- [x] Create `labelSchemaMerger.js` with merge logic
- [x] Update `templateService.js` to support array of business types
- [x] Update `labelProvisionService.js` to use merger for multi-business
- [x] Add `replaceDynamicVariables()` function for placeholder replacement
- [x] Create all 7 missing label schemas (Electrician, Plumber, etc.)
- [x] Add test suite for multi-business merging
- [x] Document merge rules and behavior
- [x] Support legacy `business_type` (string) and new `business_types` (array)

---

## 🎯 **Benefits**

1. **No Duplicate Labels** - Gmail/Outlook won't have redundant `URGENT` or `BANKING` folders
2. **Industry-Specific Routing** - Electrician emails go to `PERMITS`, Plumber emails to `INSPECTIONS`
3. **Unified Management** - One `MANAGER` category with all team members
4. **Scalable** - Supports 2, 3, 4+ business types without code changes
5. **Backward Compatible** - Single business type mode still works perfectly

---

## ⚠️ **Limitations**

1. **n8n Template**: Uses **primary business type's template** (first in array)
   - For `['Electrician', 'Plumber']`, uses Electrician's workflow template
   - Future: Could create composite templates

2. **Max Recommended**: **4-5 business types**
   - More than 5 may create too many categories
   - Schema merger has no hard limit though

3. **Supplier Overlap**: If two schemas have same supplier name (e.g., "Home Depot"), only one appears
   - By design - deduplication prevents confusion

---

## 🔮 **Future Enhancements**

- [ ] AI-powered schema optimization for 5+ business types
- [ ] Composite n8n workflow templates for multi-business
- [ ] Business type weighting (primary vs. secondary services)
- [ ] Dynamic category visibility based on email volume
- [ ] Cross-industry AI classification training

---

## 📚 **Related Documentation**

- [Label Schema Format](./LABEL_SCHEMA_FORMAT.md)
- [Label Provisioning System](./systems/LABEL_SYNC_SYSTEM.md)
- [Onboarding Flow](./ONBOARDING_FLOW.md)
- [Multi-Business Profiles](./guides/MULTI_BUSINESS_OPERATIONAL_GUIDE.md)

---

**Last Updated:** 2025-10-08  
**Version:** 2.0  
**Author:** FloworxV2 Development Team

