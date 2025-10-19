# ⚡ **Electrician Extension - Complete Business Schema**

## 📋 **Electrician Business Extension Overview**

The Electrician Extension demonstrates the power of the **Floworx Base Master Schema** by providing comprehensive electrical trade-specific customization while maintaining universal consistency. This extension showcases how electrical domain knowledge creates superior AI classification and automation for electrical contractors.

---

## 🏗 **Electrician Extension Architecture**

### **✅ Extends Base Master Schema**
- **Inherits** universal structure, colors, and AI intent framework
- **Maintains** dynamic placeholder patterns for managers/suppliers
- **Adds** Electrician-specific SERVICE label with electrical categories
- **Customizes** all base labels with electrical trade vocabulary

### **🔁 Electrician-Specific Customizations**

| **Base Label** | **Electrician Customization** | **Domain Knowledge** |
|----------------|--------------------------------|---------------------|
| **SERVICE** | Emergency Repairs, Wiring, Lighting, Safety Inspections, Installations | Electrical service categories |
| **SUPPORT** | Appointment Scheduling, Estimate Follow-up, Technical Support, General | Electrical support needs |
| **SALES** | New Project Quotes, Residential Estimates, Commercial Bids, Lighting Upgrades | Electrical sales categories |
| **URGENT** | Power Loss, Burning Smell, Sparking Outlet, Tripped Breaker | Electrical emergency types |
| **SUPPLIERS** | Home Depot Pro, Graybar, Wesco, Rexel, Ideal Industries + Dynamic placeholders | Major electrical suppliers |
| **RECRUITMENT** | Job Applications, Interview Scheduling, Electrician Hiring, Apprentice Programs | Electrical hiring needs |

---

## ⚡ **Electrician Service Categories**

### **🚨 Emergency Repairs**
```json
{
  "name": "Emergency Repairs",
  "sub": [
    { "name": "Power Outage" },
    { "name": "Circuit Failure" },
    { "name": "Breaker Trip" },
    { "name": "Burning Smell" }
  ]
}
```

### **🔌 Wiring**
```json
{
  "name": "Wiring",
  "sub": [
    { "name": "New Construction" },
    { "name": "Rewiring Projects" },
    { "name": "Panel Upgrades" },
    { "name": "Subpanel Installs" }
  ]
}
```

### **💡 Lighting**
```json
{
  "name": "Lighting",
  "sub": [
    { "name": "Interior Lighting" },
    { "name": "Exterior Lighting" },
    { "name": "LED Upgrades" },
    { "name": "Landscape Lighting" }
  ]
}
```

### **🛡️ Safety Inspections**
```json
{
  "name": "Safety Inspections",
  "sub": [
    { "name": "Code Compliance" },
    { "name": "Insurance Inspections" },
    { "name": "Fire Risk Checks" }
  ]
}
```

### **🏗️ Installations**
```json
{
  "name": "Installations",
  "sub": [
    { "name": "Ceiling Fans" },
    { "name": "EV Chargers" },
    { "name": "Smart Home Systems" },
    { "name": "Generators" }
  ]
}
```

---

## 🧠 **AI Classification Integration**

### **Electrician-Specific Intent Dictionary**
```javascript
const electricianIntentDictionary = {
  "ai.service_request": [
    "wiring", "panel", "breaker", "circuit", "outlet", "switch",
    "lighting", "installation", "repair", "upgrade", "inspection",
    "code", "electrical", "power", "generator", "charger"
  ],
  "ai.vendor_communication": [
    "graybar", "wesco", "rexel", "home depot", "ideal industries",
    "parts", "supplies", "equipment", "warranty", "order"
  ],
  "ai.emergency_request": [
    "power outage", "no power", "emergency", "urgent", "broken",
    "burning smell", "sparking", "electrical hazard", "fire risk"
  ],
  "ai.sales_inquiry": [
    "quote", "estimate", "project", "bid", "commercial", "residential",
    "lighting upgrade", "panel upgrade", "rewiring", "installation"
  ]
};
```

### **Dynamic AI Routing Examples**

#### **Example 1: Emergency Power Outage**
```
Email: "We have a complete power outage in our building, need emergency service!"

AI Classification:
→ Intent: ai.emergency_request
→ Confidence: 98%
→ Route to: URGENT/Power Loss
→ Assign to: Hailey (Emergency Manager)
→ Priority: Critical
```

#### **Example 2: Panel Upgrade Quote**
```
Email: "I need a quote for upgrading my electrical panel from 100A to 200A."

AI Classification:
→ Intent: ai.sales_inquiry
→ Confidence: 95%
→ Route to: SALES/New Project Quotes
→ Assign to: Aaron (Sales Specialist)
→ Priority: Normal
```

#### **Example 3: Supplier Communication**
```
Email: "Graybar order #7890 has shipped, tracking number included."

AI Classification:
→ Intent: ai.vendor_communication
→ Confidence: 99%
→ Route to: SUPPLIERS/Graybar
→ Assign to: Jillian (Parts Manager)
→ Priority: Normal
```

#### **Example 4: LED Lighting Installation**
```
Email: "Can you install LED lighting in our office conference room?"

AI Classification:
→ Intent: ai.service_request
→ Confidence: 92%
→ Route to: SERVICE/Lighting/Interior Lighting
→ Assign to: Aaron (Lighting Specialist)
→ Priority: Normal
```

---

## 🔄 **Dynamic Value Injection**

### **Manager Placeholder Replacement**
```javascript
// Input managers
const managers = [
  { name: 'Hailey', email: 'hailey@electriccompany.com' },
  { name: 'Aaron', email: 'aaron@electriccompany.com' },
  { name: 'Jillian', email: 'jillian@electriccompany.com' }
];

// Result in MANAGER label
{
  "name": "MANAGER",
  "sub": [
    { "name": "Unassigned" },
    { "name": "Dispatch" },
    { "name": "Escalations" },
    { "name": "Hailey" },
    { "name": "Aaron" },
    { "name": "Jillian" }
  ]
}
```

### **Supplier Placeholder Replacement**
```javascript
// Input suppliers
const suppliers = [
  { name: 'Graybar', domains: ['graybar.com'] },
  { name: 'Wesco', domains: ['wesco.com'] },
  { name: 'Rexel', domains: ['rexel.com'] }
];

// Result in SUPPLIERS label
{
  "name": "SUPPLIERS",
  "sub": [
    { "name": "Home Depot Pro" },
    { "name": "Graybar" },
    { "name": "Wesco" },
    { "name": "Rexel" },
    { "name": "Ideal Industries" },
    { "name": "Graybar" },      // Dynamic
    { "name": "Wesco" },        // Dynamic
    { "name": "Rexel" }         // Dynamic
  ]
}
```

---

## 🌍 **n8n Environment Variables**

### **Electrician-Specific Environment Variables**
```javascript
// Generated for Electrician business
{
  // Service Categories
  "LABEL_SERVICE": "Label_1234567898",
  "LABEL_SERVICE_EMERGENCY_REPAIRS": "Label_1234567899",
  "LABEL_SERVICE_WIRING": "Label_1234567800",
  "LABEL_SERVICE_LIGHTING": "Label_1234567801",
  "LABEL_SERVICE_SAFETY_INSPECTIONS": "Label_1234567802",
  "LABEL_SERVICE_INSTALLATIONS": "Label_1234567803",
  
  // Emergency Repairs Sub-categories
  "LABEL_SERVICE_EMERGENCY_REPAIRS_POWER_OUTAGE": "Label_1234567804",
  "LABEL_SERVICE_EMERGENCY_REPAIRS_CIRCUIT_FAILURE": "Label_1234567805",
  "LABEL_SERVICE_EMERGENCY_REPAIRS_BREAKER_TRIP": "Label_1234567806",
  "LABEL_SERVICE_EMERGENCY_REPAIRS_BURNING_SMELL": "Label_1234567807",
  
  // Wiring Sub-categories
  "LABEL_SERVICE_WIRING_NEW_CONSTRUCTION": "Label_1234567808",
  "LABEL_SERVICE_WIRING_REWIRING_PROJECTS": "Label_1234567809",
  "LABEL_SERVICE_WIRING_PANEL_UPGRADES": "Label_1234567810",
  "LABEL_SERVICE_WIRING_SUBPANEL_INSTALLS": "Label_1234567811",
  
  // Lighting Sub-categories
  "LABEL_SERVICE_LIGHTING_INTERIOR_LIGHTING": "Label_1234567812",
  "LABEL_SERVICE_LIGHTING_EXTERIOR_LIGHTING": "Label_1234567813",
  "LABEL_SERVICE_LIGHTING_LED_UPGRADES": "Label_1234567814",
  "LABEL_SERVICE_LIGHTING_LANDSCAPE_LIGHTING": "Label_1234567815",
  
  // Safety Inspections Sub-categories
  "LABEL_SERVICE_SAFETY_INSPECTIONS_CODE_COMPLIANCE": "Label_1234567816",
  "LABEL_SERVICE_SAFETY_INSPECTIONS_INSURANCE_INSPECTIONS": "Label_1234567817",
  "LABEL_SERVICE_SAFETY_INSPECTIONS_FIRE_RISK_CHECKS": "Label_1234567818",
  
  // Installations Sub-categories
  "LABEL_SERVICE_INSTALLATIONS_CEILING_FANS": "Label_1234567819",
  "LABEL_SERVICE_INSTALLATIONS_EV_CHARGERS": "Label_1234567820",
  "LABEL_SERVICE_INSTALLATIONS_SMART_HOME_SYSTEMS": "Label_1234567821",
  "LABEL_SERVICE_INSTALLATIONS_GENERATORS": "Label_1234567822",
  
  // Manager Routes
  "LABEL_MANAGER": "Label_1234567823",
  "LABEL_MANAGER_HAILEY": "Label_1234567824",
  "LABEL_MANAGER_AARON": "Label_1234567825",
  "LABEL_MANAGER_JILLIAN": "Label_1234567826",
  
  // Supplier Routes
  "LABEL_SUPPLIERS": "Label_1234567827",
  "LABEL_SUPPLIERS_HOME_DEPOT_PRO": "Label_1234567828",
  "LABEL_SUPPLIERS_GRAYBAR": "Label_1234567829",
  "LABEL_SUPPLIERS_WESCO": "Label_1234567830",
  "LABEL_SUPPLIERS_REXEL": "Label_1234567831",
  "LABEL_SUPPLIERS_IDEAL_INDUSTRIES": "Label_1234567832"
}
```

---

## 🧪 **Testing Framework**

### **Comprehensive Electrician Testing**
```javascript
// Test Electrician extension
const electricianSchema = applyBusinessExtension('Electrician');

// Test dynamic injection
const completeSchema = getCompleteSchemaForBusiness('Electrician', managers, suppliers);

// Test validation
const validation = validateSchemaIntegrity('Electrician');

// Test n8n environment variables
const envVars = generateN8nEnvironmentVariables(completeSchema, labelMap);

// Test provisioning
const result = await provisionLabelSchemaFor(userId, 'Electrician');
```

---

## 🎯 **Electrician Extension Benefits**

### **✅ For Electrician Businesses**
- **Domain-Specific Vocabulary** - Labels match electrical trade terminology
- **Emergency Classification** - Proper routing for electrical emergencies
- **Service Categorization** - Comprehensive electrical service categories
- **Supplier Integration** - Major electrical supplier labels
- **Safety Focus** - Code compliance and inspection categories

### **✅ For AI Classification**
- **Context-Aware Routing** - Uses electrical-specific vocabulary
- **Emergency Detection** - Recognizes electrical hazards and power issues
- **Service Categorization** - Proper classification of electrical services
- **Supplier Recognition** - Identifies major electrical suppliers

### **✅ For Automation**
- **Emergency Escalation** - Automatic routing of urgent electrical issues
- **Service Workflows** - Automated electrical service categorization
- **Supplier Management** - Vendor communication automation
- **Safety Compliance** - Automated inspection and code compliance tracking

---

## ⚡ **Electrician Service Intelligence**

### **Emergency Repairs**
- **Power Outage** - Complete loss of electrical power
- **Circuit Failure** - Individual circuit malfunctions
- **Breaker Trip** - Circuit breaker issues
- **Burning Smell** - Potential electrical fire hazards

### **Wiring Projects**
- **New Construction** - Electrical wiring for new buildings
- **Rewiring Projects** - Updating existing electrical systems
- **Panel Upgrades** - Electrical panel capacity increases
- **Subpanel Installs** - Additional electrical distribution panels

### **Lighting Services**
- **Interior Lighting** - Indoor lighting installations and repairs
- **Exterior Lighting** - Outdoor lighting systems
- **LED Upgrades** - Energy-efficient lighting conversions
- **Landscape Lighting** - Outdoor decorative and security lighting

### **Safety Inspections**
- **Code Compliance** - Electrical code adherence verification
- **Insurance Inspections** - Insurance-required electrical inspections
- **Fire Risk Checks** - Electrical fire hazard assessments

### **Modern Installations**
- **Ceiling Fans** - Ceiling fan installation and repair
- **EV Chargers** - Electric vehicle charging station installation
- **Smart Home Systems** - Home automation electrical integration
- **Generators** - Backup power system installation

---

## 🎉 **Result**

**Perfect Electrician Extension!** The Electrician Extension demonstrates:

- **🎯 Universal Consistency** - Same structure as all business types
- **🔁 Electrician-Specific Customization** - Electrical trade vocabulary and categories
- **🔄 Dynamic Adaptation** - Placeholders adapt to any electrical team
- **🧠 AI Intelligence** - Context-aware electrical classification
- **🛠️ Developer Friendly** - Easy to extend and maintain
- **📊 Scalable Architecture** - Grows with electrical business needs
- **✅ Production-Grade** - Versioned, validated, and reliable

**This creates the most sophisticated electrical contractor email automation framework possible!** 🚀

The Electrician Extension perfectly balances **universal consistency** with **electrical trade-specific customization**, creating a truly enterprise-grade automation platform that understands the unique needs of electrical contractors while maintaining the same high-quality automation logic as all other trade verticals.

**The Base Master Schema System now supports Pools & Spas, HVAC, and Electrician businesses with complete domain-specific intelligence!** ⚡
