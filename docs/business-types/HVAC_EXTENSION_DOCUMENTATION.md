# ❄️ **HVAC Extension - Complete Business Schema**

## 📋 **HVAC Business Extension Overview**

The HVAC Extension demonstrates the power of the **Floworx Base Master Schema** by providing comprehensive HVAC-specific customization while maintaining universal consistency. This extension showcases how domain-specific vocabulary and industry knowledge create superior AI classification and automation.

---

## 🏗 **HVAC Extension Architecture**

### **✅ Extends Base Master Schema**
- **Inherits** universal structure, colors, and AI intent framework
- **Maintains** dynamic placeholder patterns for managers/suppliers
- **Adds** HVAC-specific labels (`SERVICE`, `WARRANTY`)
- **Customizes** all base labels with HVAC domain vocabulary

### **🔁 HVAC-Specific Customizations**

| **Base Label** | **HVAC Customization** | **Domain Knowledge** |
|----------------|-------------------------|---------------------|
| **SERVICE** | Emergency Heating/Cooling, Seasonal Maintenance, New Installations, Indoor Air Quality, Duct Cleaning | HVAC service categories |
| **WARRANTY** | Claims, Pending Review, Approved, Denied, Parts Replacement | Warranty workflow |
| **SUPPORT** | Technical Support, Parts & Filters, Appointment Scheduling, General Inquiries | HVAC support needs |
| **SALES** | New System Quotes, Consultations, Maintenance Plans, Ductless Quotes | HVAC sales categories |
| **URGENT** | No Heat, No Cooling, Carbon Monoxide Alert, Water Leak | HVAC emergency types |
| **SUPPLIERS** | Lennox, Carrier, Trane, Goodman, Honeywell + Dynamic placeholders | Major HVAC manufacturers |

---

## 🧠 **HVAC Service Categories**

### **🔥 Emergency Heating**
```json
{
  "name": "Emergency Heating",
  "sub": [
    { "name": "Furnace No Heat" },
    { "name": "Boiler Failure" },
    { "name": "Gas Leak Concern" }
  ]
}
```

### **❄️ Emergency Cooling**
```json
{
  "name": "Emergency Cooling",
  "sub": [
    { "name": "AC Not Cooling" },
    { "name": "Compressor Failure" },
    { "name": "Thermostat Malfunction" }
  ]
}
```

### **🌱 Seasonal Maintenance**
```json
{
  "name": "Seasonal Maintenance",
  "sub": [
    { "name": "Spring Tune-up" },
    { "name": "Fall Inspection" }
  ]
}
```

### **🏗️ New Installations**
```json
{
  "name": "New Installations",
  "sub": [
    { "name": "HVAC System Install" },
    { "name": "Ductless Mini Split" },
    { "name": "Heat Pump" }
  ]
}
```

### **🌬️ Indoor Air Quality**
```json
{
  "name": "Indoor Air Quality",
  "sub": [
    { "name": "Filter Replacement" },
    { "name": "Air Purifier Install" },
    { "name": "Humidity Control" }
  ]
}
```

### **🧹 Duct Cleaning**
```json
{
  "name": "Duct Cleaning",
  "sub": [
    { "name": "Residential" },
    { "name": "Commercial" }
  ]
}
```

---

## 🧠 **AI Classification Integration**

### **HVAC-Specific Intent Dictionary**
```javascript
const hvacIntentDictionary = {
  "ai.service_request": [
    "furnace", "boiler", "AC", "air conditioning", "heat pump", 
    "ductless", "mini split", "thermostat", "filter", "ductwork",
    "tune-up", "maintenance", "installation", "repair"
  ],
  "ai.vendor_communication": [
    "lennox", "carrier", "trane", "goodman", "honeywell",
    "parts", "filters", "equipment", "warranty"
  ],
  "ai.emergency_request": [
    "no heat", "no cooling", "emergency", "urgent", "broken",
    "carbon monoxide", "gas leak", "water leak", "system down"
  ],
  "ai.warranty_claim": [
    "warranty", "claim", "replacement", "defective", "parts",
    "manufacturer", "coverage", "repair"
  ]
};
```

### **Dynamic AI Routing Examples**

#### **Example 1: Emergency Heating**
```
Email: "My furnace stopped working and it's freezing in here!"

AI Classification:
→ Intent: ai.emergency_request
→ Confidence: 95%
→ Route to: URGENT/No Heat
→ Assign to: Hailey (Emergency Manager)
→ Priority: High
```

#### **Example 2: Seasonal Maintenance**
```
Email: "I'd like to schedule my spring tune-up for my AC unit."

AI Classification:
→ Intent: ai.service_request
→ Confidence: 90%
→ Route to: SERVICE/Seasonal Maintenance/Spring Tune-up
→ Assign to: Aaron (Maintenance Specialist)
→ Priority: Normal
```

#### **Example 3: Supplier Communication**
```
Email: "Lennox parts order #12345 has shipped, tracking included."

AI Classification:
→ Intent: ai.vendor_communication
→ Confidence: 98%
→ Route to: SUPPLIERS/Lennox
→ Assign to: Stacie (Parts Manager)
→ Priority: Normal
```

---

## 🔄 **Dynamic Value Injection**

### **Manager Placeholder Replacement**
```javascript
// Input managers
const managers = [
  { name: 'Hailey', email: 'hailey@hvaccompany.com' },
  { name: 'Aaron', email: 'aaron@hvaccompany.com' },
  { name: 'Stacie', email: 'stacie@hvaccompany.com' }
];

// Result in MANAGER label
{
  "name": "MANAGER",
  "sub": [
    { "name": "Unassigned" },
    { "name": "Escalations" },
    { "name": "Dispatch" },
    { "name": "Hailey" },
    { "name": "Aaron" },
    { "name": "Stacie" }
  ]
}
```

### **Supplier Placeholder Replacement**
```javascript
// Input suppliers
const suppliers = [
  { name: 'Lennox', domains: ['lennox.com'] },
  { name: 'Trane', domains: ['trane.com'] },
  { name: 'Carrier', domains: ['carrier.com'] }
];

// Result in SUPPLIERS label
{
  "name": "SUPPLIERS",
  "sub": [
    { "name": "Lennox" },
    { "name": "Carrier" },
    { "name": "Trane" },
    { "name": "Goodman" },
    { "name": "Honeywell" },
    { "name": "Lennox" },      // Dynamic
    { "name": "Trane" },       // Dynamic
    { "name": "Carrier" }      // Dynamic
  ]
}
```

---

## 🌍 **n8n Environment Variables**

### **HVAC-Specific Environment Variables**
```javascript
// Generated for HVAC business
{
  // Service Categories
  "LABEL_SERVICE": "Label_1234567898",
  "LABEL_SERVICE_EMERGENCY_HEATING": "Label_1234567899",
  "LABEL_SERVICE_EMERGENCY_COOLING": "Label_1234567800",
  "LABEL_SERVICE_SEASONAL_MAINTENANCE": "Label_1234567801",
  "LABEL_SERVICE_NEW_INSTALLATIONS": "Label_1234567802",
  "LABEL_SERVICE_INDOOR_AIR_QUALITY": "Label_1234567803",
  "LABEL_SERVICE_DUCT_CLEANING": "Label_1234567804",
  
  // Emergency Heating Sub-categories
  "LABEL_SERVICE_EMERGENCY_HEATING_FURNACE_NO_HEAT": "Label_1234567805",
  "LABEL_SERVICE_EMERGENCY_HEATING_BOILER_FAILURE": "Label_1234567806",
  "LABEL_SERVICE_EMERGENCY_HEATING_GAS_LEAK_CONCERN": "Label_1234567807",
  
  // Emergency Cooling Sub-categories
  "LABEL_SERVICE_EMERGENCY_COOLING_AC_NOT_COOLING": "Label_1234567808",
  "LABEL_SERVICE_EMERGENCY_COOLING_COMPRESSOR_FAILURE": "Label_1234567809",
  "LABEL_SERVICE_EMERGENCY_COOLING_THERMOSTAT_MALFUNCTION": "Label_1234567810",
  
  // Warranty Categories
  "LABEL_WARRANTY": "Label_1234567811",
  "LABEL_WARRANTY_CLAIMS": "Label_1234567812",
  "LABEL_WARRANTY_PENDING_REVIEW": "Label_1234567813",
  "LABEL_WARRANTY_APPROVED": "Label_1234567814",
  "LABEL_WARRANTY_DENIED": "Label_1234567815",
  "LABEL_WARRANTY_PARTS_REPLACEMENT": "Label_1234567816",
  
  // Manager Routes
  "LABEL_MANAGER": "Label_1234567817",
  "LABEL_MANAGER_HAILEY": "Label_1234567818",
  "LABEL_MANAGER_AARON": "Label_1234567819",
  "LABEL_MANAGER_STACIE": "Label_1234567820",
  
  // Supplier Routes
  "LABEL_SUPPLIERS": "Label_1234567821",
  "LABEL_SUPPLIERS_LENNOX": "Label_1234567822",
  "LABEL_SUPPLIERS_CARRIER": "Label_1234567823",
  "LABEL_SUPPLIERS_TRANE": "Label_1234567824"
}
```

---

## 🧪 **Testing Framework**

### **Comprehensive HVAC Testing**
```javascript
// Test HVAC extension
const hvacSchema = applyBusinessExtension('HVAC');

// Test dynamic injection
const completeSchema = getCompleteSchemaForBusiness('HVAC', managers, suppliers);

// Test validation
const validation = validateSchemaIntegrity('HVAC');

// Test n8n environment variables
const envVars = generateN8nEnvironmentVariables(completeSchema, labelMap);

// Test provisioning
const result = await provisionLabelSchemaFor(userId, 'HVAC');
```

---

## 🎯 **HVAC Extension Benefits**

### **✅ For HVAC Businesses**
- **Domain-Specific Vocabulary** - Labels match HVAC industry terminology
- **Emergency Classification** - Proper routing for heating/cooling emergencies
- **Seasonal Awareness** - Spring/fall maintenance categories
- **Supplier Integration** - Major HVAC manufacturer labels
- **Warranty Management** - Complete warranty workflow support

### **✅ For AI Classification**
- **Context-Aware Routing** - Uses HVAC-specific vocabulary
- **Emergency Detection** - Recognizes heating/cooling emergencies
- **Service Categorization** - Proper classification of HVAC services
- **Supplier Recognition** - Identifies major HVAC manufacturers

### **✅ For Automation**
- **Emergency Escalation** - Automatic routing of urgent HVAC issues
- **Seasonal Workflows** - Spring/fall maintenance automation
- **Warranty Processing** - Automated warranty claim handling
- **Supplier Management** - Vendor communication automation

---

## 🎉 **Result**

**Perfect HVAC Extension!** The HVAC Extension demonstrates:

- **🎯 Universal Consistency** - Same structure as all business types
- **🔁 HVAC-Specific Customization** - Domain vocabulary and categories
- **🔄 Dynamic Adaptation** - Placeholders adapt to any HVAC team
- **🧠 AI Intelligence** - Context-aware HVAC classification
- **🛠️ Developer Friendly** - Easy to extend and maintain
- **📊 Scalable Architecture** - Grows with HVAC business needs
- **✅ Production-Grade** - Versioned, validated, and reliable

**This creates the most sophisticated HVAC email automation framework possible!** 🚀

The HVAC Extension perfectly balances **universal consistency** with **HVAC-specific customization**, creating a truly enterprise-grade automation platform that understands the unique needs of HVAC businesses while maintaining the same high-quality automation logic as all other trade verticals.
