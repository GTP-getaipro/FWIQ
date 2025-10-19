# 🧠 Industry Behavior JSON System

## Overview

The **Industry Behavior JSON System** provides the "brains" that tell Floworx AI how to think, classify, and respond per industry. Each industry gets its own behavior JSON that defines AI prompt logic, routing rules, keyword vocabulary, and classification categories.

## 🧩 Purpose & Architecture

### Core Purpose
Each **industry behavior JSON** defines:
1. **AI prompt logic** (routing + reasoning)
2. **Primary / secondary categories**
3. **Reply permissions (ai_can_reply)**
4. **Keyword / intent cues**
5. **Schema version + metadata**

### Integration Flow
```
Business Type Selection → Load Industry Behavior JSON → Configure AI Classification → Deploy n8n Workflow
```

## 📊 Standardized Structure

Every industry JSON follows this base structure:

```json
{
  "industry": "HVAC",
  "version": "v2.0.0",
  "lastUpdated": "2025-01-05",
  "author": "Floworx AI Core",
  "description": "AI classification and routing behavior for HVAC service companies.",
  "behaviorProfile": {
    "ai_model": "gpt-4o-mini",
    "prompt_type": "define",
    "system_message": "You are an expert email classification and routing agent...",
    "rules": {
      "ai_can_reply_conditions": {
        "allowed_primary_categories": ["Support", "Sales", "Urgent"],
        "minimum_confidence": 0.75,
        "internal_domain_blocklist": ["@{{businessProfile.emailDomain}}"]
      },
      "urgent_keywords": ["urgent", "emergency", "asap", "immediately", "broken", "no heat", "leak"],
      "form_submission_sources": ["noreply@reports.connecteam.com", "alerts@servicetitan.com"]
    }
  },
  "categories": {
    "Banking": ["e-Transfer", "Invoice", "Refund", "Receipts", "Bank Alert"],
    "Support": ["Technical Support", "Appointment Scheduling", "General", "Parts & Supplies"],
    "Sales": ["New Installations", "Consultations", "Service Agreements", "Equipment Quotes"],
    "Warranty": ["Claims", "Resolved", "Pending"],
    "Urgent": ["Emergency Repair", "Safety Issue", "Power Outage"],
    "FormSub": ["New Submission", "Work Order Form"],
    "Suppliers": ["HVAC Parts Co", "ThermoFlow", "CoolAir Supply"],
    "Manager": ["Unassigned", "Escalations", "Team Assignments"],
    "Promo": ["Email Campaigns", "Seasonal Offers"],
    "Recruitment": ["Applications", "Interviews", "New Hires"],
    "Google Review": ["New Review", "Responses", "Requests"],
    "Misc": ["General", "Archive", "Personal"]
  },
  "outputFormat": {
    "summary": "One-line summary of email purpose",
    "primary_category": "string",
    "secondary_category": "string or null",
    "tertiary_category": "string or null",
    "confidence": "float 0.0–1.0",
    "ai_can_reply": "boolean",
    "entities": {
      "contact_name": "string or null",
      "email_address": "string or null",
      "phone_number": "string or null",
      "order_number": "string or null",
      "equipment_model": "string or null",
      "service_address": "string or null"
    }
  },
  "meta": {
    "integration": "n8n",
    "usecase": "email_classification",
    "validated": true
  }
}
```

## 🏭 Industry-Specific Implementations

### 1️⃣ HVAC
**Focus**: Heating/cooling units, seasonal maintenance, thermostat issues
**Urgent Keywords**: "no heat", "no cooling", "gas leak", "carbon monoxide", "furnace not working", "ac not working"
**Suppliers**: Carrier, Trane, Lennox, Rheem, Goodman
**Entities**: equipment_model, service_address

### 2️⃣ Pools & Spas
**Focus**: Water care, spas, installations, equipment maintenance
**Urgent Keywords**: "pump not working", "filter broken", "chemical imbalance", "green water", "cloudy water"
**Suppliers**: Strong Spas, Pentair, Hayward, Jandy, Zodiac
**Entities**: pool_type, equipment_model, service_address

### 3️⃣ Roofing Contractor
**Focus**: Leak repairs, inspections, shingles, insurance claims
**Urgent Keywords**: "storm damage", "hail damage", "wind damage", "water damage", "roof collapse"
**Suppliers**: GAF, CertainTeed, Owens Corning, IKO, TAMKO
**Entities**: roof_type, damage_type, service_address

### 4️⃣ Landscaping
**Focus**: Lawn care, irrigation, tree trimming, pest control
**Urgent Keywords**: "irrigation broken", "tree down", "storm damage", "pest infestation", "disease"
**Suppliers**: John Deere, Husqvarna, Stihl, Toro, Rain Bird
**Entities**: property_type, service_type, service_address

### 5️⃣ Flooring Contractor
**Focus**: Tile, hardwood, carpet installs, refinishing, estimates
**Urgent Keywords**: "water damage", "floor damage", "trip hazard", "loose tile", "cracked floor"
**Suppliers**: Mohawk, Shaw, Armstrong, Mannington, Tarkett
**Entities**: flooring_type, room_type, service_address

### 6️⃣ Painting Contractor
**Focus**: Interior/exterior, color consultation, prep, quotes
**Urgent Keywords**: "paint damage", "lead paint", "peeling paint", "cracked paint"
**Suppliers**: Sherwin Williams, Benjamin Moore, Behr, PPG, Valspar
**Entities**: paint_type, room_type, service_address

### 7️⃣ General Contractor
**Focus**: Permits, sub-contractors, project management
**Urgent Keywords**: "structural damage", "building collapse", "fire damage", "permit issue"
**Suppliers**: Home Depot, Lowe's, Menards, 84 Lumber
**Entities**: project_type, permit_number, service_address

### 8️⃣ Plumber
**Focus**: Burst pipes, drain cleaning, fixture installation, leaks
**Urgent Keywords**: "burst pipe", "flooding", "no water", "backup", "sewer", "gas leak"
**Suppliers**: Ferguson, Wolseley, HD Supply, White Cap
**Entities**: fixture_type, problem_type, service_address

### 9️⃣ Electrician
**Focus**: Wiring, panel upgrades, safety inspections, lighting
**Urgent Keywords**: "no power", "electrical fire", "sparking", "shock", "power outage", "electrical hazard"
**Suppliers**: Graybar, Rexel, WESCO, Anixter
**Entities**: equipment_type, voltage_type, service_address

### 🔟 Insulation & Foam Spray
**Focus**: Energy efficiency, spray foam, sealing, insulation removal
**Urgent Keywords**: "energy loss", "draft", "cold", "hot", "asbestos", "mold"
**Suppliers**: Owens Corning, Johns Manville, CertainTeed, Knauf
**Entities**: insulation_type, r_value, service_address

## 🧠 AI Behavior Profile Components

### System Message
Each industry has a tailored system message that defines the AI's role and expertise:
```json
"system_message": "You are an expert email classification and routing agent for an HVAC company. Your sole task is to analyze incoming emails and output a structured JSON with category, summary, and extracted entities. Focus on heating, cooling, ventilation, and air quality issues."
```

### AI Reply Conditions
Defines when the AI can automatically reply:
```json
"ai_can_reply_conditions": {
  "allowed_primary_categories": ["Support", "Sales", "Urgent"],
  "minimum_confidence": 0.75,
  "internal_domain_blocklist": ["@{{businessProfile.emailDomain}}"]
}
```

### Urgent Keywords
Industry-specific vocabulary for emergency detection:
```json
"urgent_keywords": ["urgent", "emergency", "asap", "immediately", "broken", "no heat", "leak"]
```

### Form Submission Sources
CRM and form submission email patterns:
```json
"form_submission_sources": ["noreply@reports.connecteam.com", "alerts@servicetitan.com"]
```

## 📊 Category Structure

Each industry has 12 standard categories with industry-specific subcategories:

| Category | Purpose | Industry Examples |
|----------|---------|------------------|
| **Banking** | Financial transactions | e-Transfer, Invoice, Refund, Receipts |
| **Support** | Customer service | Technical Support, Appointment Scheduling |
| **Sales** | Sales inquiries | New Installations, Consultations, Quotes |
| **Warranty** | Warranty claims | Claims, Resolved, Pending |
| **Urgent** | Emergency situations | Emergency Repair, Safety Issue |
| **FormSub** | Form submissions | New Submission, Work Order Form |
| **Suppliers** | Vendor communications | Industry-specific suppliers |
| **Manager** | Internal management | Unassigned, Escalations, Team Assignments |
| **Promo** | Marketing communications | Email Campaigns, Seasonal Offers |
| **Recruitment** | HR communications | Applications, Interviews, New Hires |
| **Google Review** | Review management | New Review, Responses, Requests |
| **Misc** | General communications | General, Archive, Personal |

## 🔧 Output Format

Each behavior JSON defines a standardized output format:

```json
{
  "summary": "One-line summary of email purpose",
  "primary_category": "string",
  "secondary_category": "string or null",
  "tertiary_category": "string or null",
  "confidence": "float 0.0–1.0",
  "ai_can_reply": "boolean",
  "entities": {
    "contact_name": "string or null",
    "email_address": "string or null",
    "phone_number": "string or null",
    "order_number": "string or null",
    "industry_specific_field": "string or null",
    "service_address": "string or null"
  }
}
```

## 🚀 Integration with n8n

### Workflow Integration
1. **Load Behavior JSON** - Based on business type selection
2. **Configure AI Node** - Use system message and rules
3. **Set Classification Logic** - Use categories and keywords
4. **Deploy Workflow** - With industry-specific configuration

### Environment Variables
```json
{
  "INDUSTRY_BEHAVIOR": "hvac.behavior.json",
  "AI_MODEL": "gpt-4o-mini",
  "MINIMUM_CONFIDENCE": "0.75",
  "ALLOWED_CATEGORIES": "Support,Sales,Urgent"
}
```

## 📈 Benefits

### For AI Classification
- **Industry-Specific Vocabulary** - Tailored keywords and terminology
- **Contextual Understanding** - Industry-specific system messages
- **Accurate Routing** - Industry-relevant categories and subcategories
- **Emergency Detection** - Industry-specific urgent keywords

### For Business Operations
- **Consistent Classification** - Standardized output format across industries
- **Automated Routing** - AI can reply to appropriate categories
- **Emergency Handling** - Urgent situations detected and routed correctly
- **CRM Integration** - Form submissions and alerts properly classified

### For Development
- **Modular Architecture** - Easy to add new industries
- **Standardized Structure** - Consistent format across all industries
- **Easy Maintenance** - Update industry-specific behavior independently
- **Scalable Design** - Support unlimited industries

## 🎯 Next Steps

1. **Test Industry Behaviors** - Validate classification accuracy
2. **Integrate with n8n** - Deploy workflows with behavior JSONs
3. **Monitor Performance** - Track classification accuracy and user satisfaction
4. **Iterate and Improve** - Refine keywords and categories based on real usage

The Industry Behavior JSON System provides the intelligent foundation that makes Floworx truly **multi-vertical AI-ready**! 🚀
