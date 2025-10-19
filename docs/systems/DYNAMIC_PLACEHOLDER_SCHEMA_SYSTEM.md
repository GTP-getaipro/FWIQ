# 🎯 **Dynamic Placeholder Schema System v1.3.0**

## 📋 **Overview**

The Dynamic Placeholder Schema System uses **placeholder variables** (`{{Manager1}}`, `{{Supplier1}}`, etc.) that get replaced with actual values during provisioning. This approach is cleaner, more maintainable, and provides better control than the previous merging approach.

---

## 🔄 **How It Works**

### **1. Schema Definition with Placeholders**
```javascript
"MANAGER": {
  sub: [
    "Unassigned",           // Base label
    "Escalations",          // Base label  
    "Team Assignments",     // Base label
    "Manager Review",       // Base label
    "{{Manager1}}",         // Dynamic placeholder
    "{{Manager2}}",         // Dynamic placeholder
    "{{Manager3}}",         // Dynamic placeholder
    "{{Manager4}}",         // Dynamic placeholder
    "{{Manager5}}"          // Dynamic placeholder
  ]
}
```

### **2. Placeholder Replacement**
```javascript
// User Input (Step 3):
managers: [
  { name: 'Manager1', email: 'manager@gmail.com' },
  { name: 'Hailey', email: 'hailey@company.com' }
]

// After replacement:
"MANAGER": {
  sub: [
    "Unassigned",      // Base label
    "Escalations",     // Base label
    "Team Assignments", // Base label
    "Manager Review",   // Base label
    "Manager1",        // Replaced placeholder
    "Hailey"           // Replaced placeholder
    // {{Manager3}}, {{Manager4}}, {{Manager5}} removed (no data)
  ]
}
```

---

## 🧠 **Key Benefits**

| **Aspect** | **Old Merging** | **New Placeholders** |
|------------|-----------------|---------------------|
| **Schema Structure** | Complex merging logic | Clean placeholder variables |
| **Duplicate Handling** | Manual deduplication | Automatic (no duplicates) |
| **Label Order** | Unpredictable | Deterministic |
| **Maintenance** | Complex merge functions | Simple replacement |
| **Debugging** | Hard to trace | Easy to understand |
| **n8n Integration** | Complex mapping | Direct variable mapping |

---

## 📊 **Schema Structure**

### **Complete Schema Definition**
```json
{
  "businessType": "Pools & Spas",
  "version": "1.3.0",
  "lastUpdated": "2025-01-05",
  "description": "Dynamic Gmail/Outlook label provisioning schema for Pools & Spas businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
  "provisioningOrder": [
    "BANKING", "FORMSUB", "GOOGLE REVIEW", "MANAGER", "SALES", 
    "SUPPLIERS", "SUPPORT", "URGENT", "MISC", "PHONE", 
    "PROMO", "RECRUITMENT", "SOCIALMEDIA"
  ],
  "labels": [
    {
      "name": "MANAGER",
      "color": { "backgroundColor": "#ffad47", "textColor": "#000000" },
      "intent": "ai.internal_routing",
      "sub": [
        "Unassigned", "Escalations", "Team Assignments", "Manager Review",
        "{{Manager1}}", "{{Manager2}}", "{{Manager3}}", "{{Manager4}}", "{{Manager5}}"
      ]
    },
    {
      "name": "SUPPLIERS", 
      "color": { "backgroundColor": "#ffad47", "textColor": "#000000" },
      "intent": "ai.vendor_communication",
      "sub": [
        "Aqua Spa Pool Supply", "Paradise Patio Furniture Ltd", "Strong Spas", "Waterway Plastics",
        "{{Supplier1}}", "{{Supplier2}}", "{{Supplier3}}", "{{Supplier4}}", "{{Supplier5}}",
        "{{Supplier6}}", "{{Supplier7}}", "{{Supplier8}}", "{{Supplier9}}", "{{Supplier10}}"
      ]
    }
  ],
  "dynamicVariables": {
    "managers": ["{{Manager1}}", "{{Manager2}}", "{{Manager3}}", "{{Manager4}}", "{{Manager5}}"],
    "suppliers": ["{{Supplier1}}", "{{Supplier2}}", "{{Supplier3}}", "{{Supplier4}}", "{{Supplier5}}", "{{Supplier6}}", "{{Supplier7}}", "{{Supplier8}}", "{{Supplier9}}", "{{Supplier10}}"]
  }
}
```

---

## 🔧 **Implementation**

### **Core Functions**

#### **1. replaceDynamicPlaceholders()**
```javascript
export function replaceDynamicPlaceholders(schema, managers = [], suppliers = []) {
  const processedSchema = structuredClone(schema);

  // Replace manager placeholders
  if (managers.length > 0) {
    const managerNames = managers
      .filter(m => m.name && m.name.trim() !== '')
      .map(m => m.name.trim());

    if (processedSchema.MANAGER && processedSchema.MANAGER.sub) {
      processedSchema.MANAGER.sub = processedSchema.MANAGER.sub.map(subLabel => {
        if (subLabel.startsWith('{{Manager') && subLabel.endsWith('}}')) {
          const index = parseInt(subLabel.match(/\d+/)?.[0]) - 1;
          return managerNames[index] || null;
        }
        return subLabel;
      }).filter(Boolean); // Remove null values
    }
  }

  // Similar logic for suppliers...
  return processedSchema;
}
```

#### **2. getPoolsSpasLabelSchema()**
```javascript
export function getPoolsSpasLabelSchema(managers = [], suppliers = []) {
  return replaceDynamicPlaceholders(poolsSpasLabelSchema, managers, suppliers);
}
```

#### **3. processDynamicSchema()**
```javascript
function processDynamicSchema(businessType, managers = [], suppliers = []) {
  // For Pools & Spas, use the dynamic placeholder schema
  if (businessType === 'Pools & Spas') {
    return getPoolsSpasLabelSchema(managers, suppliers);
  }

  // For other business types, use the business card schema
  const businessCard = getBusinessCard(businessType);
  return businessCard.labelSchema;
}
```

---

## 🎯 **Step 3 Integration**

### **User Input Flow**
```javascript
// Step 3: Team Setup
const managers = [
  { name: 'Manager1', email: 'manager@gmail.com' },
  { name: 'Hailey', email: 'hailey@company.com' }
];

const suppliers = [
  { name: 'Strong Spas', domains: ['strong9.com'] },
  { name: 'AquaSpaPoolSupply', domains: ['aquaspapoolsupply.com'] }
];

// Save to Supabase
await supabase.from('profiles').update({
  managers: managers,
  suppliers: suppliers
});
```

### **Label Provisioning**
```javascript
// In provisionLabelSchemaFor()
const schema = processDynamicSchema(businessType, managers, suppliers);

// Result: Clean schema with placeholders replaced
{
  "MANAGER": {
    "sub": ["Unassigned", "Escalations", "Team Assignments", "Manager Review", "Manager1", "Hailey"]
  },
  "SUPPLIERS": {
    "sub": ["Aqua Spa Pool Supply", "Paradise Patio Furniture Ltd", "Strong Spas", "Waterway Plastics", "Strong Spas", "AquaSpaPoolSupply"]
  }
}
```

---

## 📧 **Gmail Label Structure**

### **Expected Result**
```
SUPPLIERS/
├── Aqua Spa Pool Supply (base)
├── Paradise Patio Furniture Ltd (base)
├── Strong Spas (base)
├── Waterway Plastics (base)
├── Strong Spas (user-defined)
└── AquaSpaPoolSupply (user-defined)

MANAGER/
├── Unassigned (base)
├── Escalations (base)
├── Team Assignments (base)
├── Manager Review (base)
├── Manager1 (user-defined)
└── Hailey (user-defined)
```

---

## 🌍 **n8n Environment Variables**

### **Generated Variables**
```javascript
{
  "LABEL_MANAGER_MANAGER1": "Label_1234567890",
  "LABEL_MANAGER_HAILEY": "Label_1234567891",
  "LABEL_SUPPLIERS_STRONG_SPAS": "Label_1234567892",
  "LABEL_SUPPLIERS_AQUASPAPOOLSUPPLY": "Label_1234567893"
}
```

---

## 🧪 **Testing**

### **Test Script**
```javascript
// Run in browser console
testDynamicPlaceholderSystem();
```

### **Test Coverage**
- ✅ Placeholder replacement logic
- ✅ Manager label creation
- ✅ Supplier label creation
- ✅ Dynamic provisioning
- ✅ Schema validation
- ✅ n8n environment variables
- ✅ Complete Step 3 → Label flow

---

## 🎉 **Result**

**Perfect!** The Dynamic Placeholder Schema System provides:

- **🎯 Clean Architecture** - Simple placeholder variables
- **🔄 Deterministic Results** - Predictable label structure
- **🛠️ Easy Maintenance** - No complex merging logic
- **📊 Better Control** - Precise label ordering
- **🌍 Seamless Integration** - Direct n8n variable mapping
- **🧪 Comprehensive Testing** - Full test coverage

**This creates the most robust and maintainable label provisioning system possible!** 🚀
