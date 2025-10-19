# 🎯 **Multi-Tenant Dynamic Automation Framework**

## 📋 **Framework Overview**

Floworx is a **true multi-tenant dynamic automation framework** that provides business-specific label schemas while maintaining universal consistency. Each business type gets its own customized schema with domain-specific vocabulary, but shares the same underlying structure and automation logic.

---

## 🧩 **Architecture Principles**

### **✅ Universal Elements (Same Across All Businesses)**
| **Element** | **Description** | **Example** |
|-------------|-----------------|-------------|
| **JSON Structure** | Consistent hierarchy and keys | `BANKING`, `SUPPORT`, `MANAGER` |
| **Color Palette** | Universal branding colors | `#16a766` (Green), `#ffad47` (Orange) |
| **AI Intent Tags** | Universal classification framework | `ai.financial_transaction`, `ai.support_ticket` |
| **Dynamic Placeholders** | Consistent variable patterns | `{{Manager1}}`, `{{Supplier1}}` |
| **Critical Protection** | Same safety logic | `critical: true` for financial/urgent |
| **Provisioning Order** | Deterministic creation sequence | `BANKING` → `MANAGER` → `SUPPLIERS` |
| **n8n Integration** | Universal environment variable mapping | `LABEL_MANAGER_MANAGER1` |

### **🔁 Business-Specific Elements (Customized Per Trade)**
| **Element** | **Description** | **Pools & Spas** | **HVAC** | **Electrician** |
|-------------|-----------------|------------------|----------|----------------|
| **Support Categories** | Domain-specific sub-labels | `Parts And Chemicals` | `Emergency Heat` | `Wiring Issues` |
| **Supplier Names** | Industry-specific vendors | `Strong Spas` | `Lennox` | `Eaton` |
| **Sales Categories** | Service-specific offerings | `New Spa Sales` | `New System Sales` | `Panel Upgrades` |
| **Urgent Keywords** | Hazard-specific emergencies | `Leak Emergencies` | `No Heat` | `Electrical Hazard` |
| **Form Types** | Trade-specific submissions | `Work Order Forms` | `Service Request Forms` | `Electrical Permit Forms` |

---

## 🏗 **Schema Registry Structure**

### **Base Schema Template**
```javascript
const BASE_SCHEMA_STRUCTURE = {
  version: "1.3.0",
  lastUpdated: "2025-01-05",
  description: "Dynamic Gmail/Outlook label provisioning schema",
  features: [
    "Dynamic placeholder replacement",
    "Manager-specific routing (up to 5)",
    "Supplier-specific classification (up to 10)",
    "Gmail API color compatibility",
    "n8n environment variable ready",
    "AI intent classification",
    "Critical label protection"
  ],
  compatibility: {
    gmail: "✅ Full support",
    outlook: "✅ Full support", 
    n8n: "✅ Environment variable ready"
  },
  provisioningOrder: [
    "BANKING", "FORMSUB", "GOOGLE REVIEW", "MANAGER", "SALES", 
    "SUPPLIERS", "SUPPORT", "URGENT", "MISC", "PHONE", 
    "PROMO", "RECRUITMENT", "SOCIALMEDIA"
  ],
  dynamicVariables: {
    managers: ["{{Manager1}}", "{{Manager2}}", "{{Manager3}}", "{{Manager4}}", "{{Manager5}}"],
    suppliers: ["{{Supplier1}}", "{{Supplier2}}", "{{Supplier3}}", "{{Supplier4}}", "{{Supplier5}}", 
                "{{Supplier6}}", "{{Supplier7}}", "{{Supplier8}}", "{{Supplier9}}", "{{Supplier10}}"]
  }
};
```

### **Business-Specific Implementations**

#### **Pools & Spas Schema**
```javascript
export const poolsSpasSchema = {
  ...BASE_SCHEMA_STRUCTURE,
  businessType: "Pools & Spas",
  labels: {
    SUPPORT: {
      sub: [
        "Appointment Scheduling",
        "General", 
        "Parts And Chemicals",      // Domain-specific
        "Technical Support"
      ]
    },
    SUPPLIERS: {
      sub: [
        "Aqua Spa Pool Supply",     // Industry-specific
        "Paradise Patio Furniture Ltd",
        "Strong Spas",
        "Waterway Plastics",
        "{{Supplier1}}",            // Dynamic placeholders
        "{{Supplier2}}"
      ]
    },
    URGENT: {
      sub: [
        "Emergency Repairs",
        "Safety Issues",
        "Leak Emergencies",         // Trade-specific
        "Power Outages"
      ]
    }
  }
};
```

#### **HVAC Schema**
```javascript
export const hvacSchema = {
  ...BASE_SCHEMA_STRUCTURE,
  businessType: "HVAC",
  labels: {
    SUPPORT: {
      sub: [
        "Appointment Scheduling",
        "Emergency Heat",           // Domain-specific
        "AC Repair",
        "Thermostat Issues",
        "Technical Support"
      ]
    },
    SUPPLIERS: {
      sub: [
        "Lennox",                   // Industry-specific
        "Trane",
        "Carrier",
        "Rheem",
        "{{Supplier1}}",            // Dynamic placeholders
        "{{Supplier2}}"
      ]
    },
    URGENT: {
      sub: [
        "Emergency Repairs",
        "Safety Issues",
        "No Heat",                  // Trade-specific
        "System Down"
      ]
    }
  }
};
```

#### **Electrician Schema**
```javascript
export const electricianSchema = {
  ...BASE_SCHEMA_STRUCTURE,
  businessType: "Electrician",
  labels: {
    SUPPORT: {
      sub: [
        "Appointment Scheduling",
        "Wiring Issues",            // Domain-specific
        "Breaker Panels",
        "Lighting Installation",
        "Technical Support"
      ]
    },
    SUPPLIERS: {
      sub: [
        "Eaton",                    // Industry-specific
        "Schneider Electric",
        "Square D",
        "Leviton",
        "{{Supplier1}}",            // Dynamic placeholders
        "{{Supplier2}}"
      ]
    },
    URGENT: {
      sub: [
        "Emergency Repairs",
        "Safety Issues",
        "No Power",                 // Trade-specific
        "Electrical Hazard"
      ]
    }
  }
};
```

---

## 🔄 **Dynamic Processing Flow**

### **1. Schema Selection**
```javascript
// User selects business type in Step 3
const businessType = "Pools & Spas";

// System loads business-specific schema
const schema = getSchemaForBusinessType(businessType);
```

### **2. Placeholder Replacement**
```javascript
// User defines managers and suppliers in Step 3
const managers = [
  { name: 'Manager1', email: 'manager@gmail.com' },
  { name: 'Hailey', email: 'hailey@company.com' }
];

const suppliers = [
  { name: 'Strong Spas', domains: ['strong9.com'] },
  { name: 'AquaSpaPoolSupply', domains: ['aquaspapoolsupply.com'] }
];

// System replaces placeholders with actual values
const processedSchema = getProcessedSchemaForBusiness(businessType, managers, suppliers);
```

### **3. Label Creation**
```javascript
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

## 🧠 **AI Classification Integration**

### **Business-Specific Intent Dictionaries**
```javascript
const intentDictionaries = {
  "Pools & Spas": {
    "ai.support_ticket": ["spa", "pump", "heater", "filter", "chemical", "water care"],
    "ai.vendor_communication": ["strong spas", "waterway", "aqua spa", "paradise patio"],
    "ai.emergency_request": ["leak", "no heat", "electrical issue", "pump failure"]
  },
  "HVAC": {
    "ai.support_ticket": ["furnace", "AC", "thermostat", "heat pump", "ductwork"],
    "ai.vendor_communication": ["trane", "carrier", "lennox", "rheem"],
    "ai.emergency_request": ["no heat", "system down", "emergency repair"]
  },
  "Electrician": {
    "ai.support_ticket": ["wiring", "breaker", "panel", "lighting", "outlet"],
    "ai.vendor_communication": ["eaton", "schneider", "square d", "leviton"],
    "ai.emergency_request": ["no power", "electrical hazard", "sparking", "tripping breaker"]
  }
};
```

### **Dynamic AI Routing**
```javascript
// Email classification uses business-specific vocabulary
const emailContent = "My spa heater isn't working and there's a leak";

// For Pools & Spas business:
// → Classified as: ai.emergency_request
// → Routed to: URGENT/Leak Emergencies
// → Assigned to: Manager1 (based on manager routing rules)

// For HVAC business:
// → Classified as: ai.support_ticket  
// → Routed to: SUPPORT/Emergency Heat
// → Assigned to: Hailey (based on manager routing rules)
```

---

## 🌍 **n8n Environment Variable Generation**

### **Dynamic Variable Mapping**
```javascript
// Each business type generates its own environment variables
const envVars = generateN8nEnvironmentVariables(labelMap);

// Pools & Spas example:
{
  "LABEL_MANAGER_MANAGER1": "Label_1234567890",
  "LABEL_MANAGER_HAILEY": "Label_1234567891",
  "LABEL_SUPPLIERS_STRONG_SPAS": "Label_1234567892",
  "LABEL_SUPPLIERS_AQUASPAPOOLSUPPLY": "Label_1234567893",
  "LABEL_SUPPORT_PARTS_AND_CHEMICALS": "Label_1234567894"
}

// HVAC example:
{
  "LABEL_MANAGER_MANAGER1": "Label_1234567890",
  "LABEL_MANAGER_HAILEY": "Label_1234567891", 
  "LABEL_SUPPLIERS_LENNOX": "Label_1234567892",
  "LABEL_SUPPLIERS_TRANE": "Label_1234567893",
  "LABEL_SUPPORT_EMERGENCY_HEAT": "Label_1234567894"
}
```

---

## 🧪 **Testing Framework**

### **Multi-Tenant Test Coverage**
```javascript
// Test all business types
const businessTypes = ['Pools & Spas', 'HVAC', 'Electrician'];

for (const businessType of businessTypes) {
  // Test schema loading
  const schema = getSchemaForBusinessType(businessType);
  
  // Test placeholder replacement
  const processedSchema = getProcessedSchemaForBusiness(businessType, managers, suppliers);
  
  // Test validation
  const validation = validateSchemaIntegrity(businessType);
  
  // Test provisioning
  const result = await provisionLabelSchemaFor(userId, businessType);
}
```

---

## 🎯 **Framework Benefits**

### **✅ For Developers**
- **Consistent API** - Same functions work across all business types
- **Easy Extension** - Add new business types by extending the registry
- **Type Safety** - Universal structure prevents schema inconsistencies
- **Maintainable** - Changes to universal elements apply everywhere

### **✅ For Businesses**
- **Domain-Specific** - Labels match their industry vocabulary
- **Scalable** - Framework grows with their business
- **Consistent** - Same automation logic across all trades
- **Customizable** - Dynamic placeholders adapt to their team

### **✅ For AI Classification**
- **Context-Aware** - Uses business-specific vocabulary
- **Accurate Routing** - Domain knowledge improves classification
- **Consistent Intents** - Universal framework ensures reliability
- **Scalable Training** - Easy to add new business types

---

## 🎉 **Result**

**Perfect Multi-Tenant Framework!** Floworx now provides:

- **🎯 Business-Specific Schemas** - Each trade gets its own vocabulary
- **🌍 Universal Consistency** - Same structure and logic everywhere  
- **🔄 Dynamic Adaptation** - Placeholders adapt to any team size
- **🧠 AI Intelligence** - Context-aware classification per business type
- **🛠️ Developer Friendly** - Easy to extend and maintain
- **📊 Scalable Architecture** - Grows with any business vertical

**This creates the most sophisticated and flexible email automation framework possible!** 🚀
