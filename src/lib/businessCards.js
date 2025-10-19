import { getPoolsSpasLabelSchema } from './poolsSpasLabelsDynamic'; // Import the dynamic schema

export const businessCards = {
  'Electrician': {
    name: 'Electrician',
    icon: 'Zap',
    description: 'Emergency electrical repairs, wiring, panel upgrades, lighting installation, safety inspections, code compliance.',
    urgentKeywords: ['urgent', 'emergency', 'no power', 'tripping breaker', 'sparking', 'electrical hazard'],
    aiTone: 'Professional',
    templateType: 'Electrician',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    // Dynamic Label Schema for Electrician
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Emergency Repairs", "Panel Upgrades", "Wiring", "Lighting Installation", "Safety Inspections"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "Code Compliance", "General"]
      },
      "SUPPLIERS": {
        sub: ["Electrical Suppliers", "Parts & Materials", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Installations", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  },

  'HVAC': {
    name: 'HVAC',
    icon: 'Building',
    description: 'Emergency heating/cooling, seasonal maintenance, new installations, indoor air quality, duct cleaning.',
    urgentKeywords: ['urgent', 'emergency', 'no heat', 'no cooling', 'broken ac', 'furnace not working'],
    aiTone: 'Friendly',
    templateType: 'HVAC',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Emergency Repairs", "Maintenance", "Installations", "Duct Cleaning", "Air Quality"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "General"]
      },
      "SUPPLIERS": {
        sub: ["HVAC Suppliers", "Parts & Filters", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Systems", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  },

  'Plumber': {
    name: 'Plumber',
    icon: 'Droplets',
    description: 'Water leaks, burst pipes, drain cleaning, water heater repair/installation, fixture installation, pipe inspection.',
    urgentKeywords: ['urgent', 'emergency', 'water leak', 'burst pipe', 'flooding', 'no water'],
    aiTone: 'Friendly',
    templateType: 'Plumber',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Emergency Repairs", "Drain Cleaning", "Water Heater", "Fixture Installation", "Pipe Inspection"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "General"]
      },
      "SUPPLIERS": {
        sub: ["Plumbing Suppliers", "Parts & Fixtures", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Installations", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  },

  'Pools & Spas': {
    name: 'Pools & Spas',
    icon: 'Briefcase',
    description: 'Sales, installation quotes, repair scheduling, maintenance plans, water care, winterization, sauna.',
    urgentKeywords: ['urgent', 'emergency', 'leaking', 'pump not working', 'heater error', 'no power'],
    aiTone: 'Friendly',
    templateType: 'Pools & Spas',
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    // Use the comprehensive Pools & Spas label schema
    labelSchema: getPoolsSpasLabelSchema()
  },

  'Flooring Contractor': {
    name: 'Flooring Contractor',
    icon: 'Shield',
    description: 'Hardwood, tile, carpet installation, refinishing, repair, commercial flooring, estimates.',
    urgentKeywords: ['urgent', 'emergency', 'water damage', 'flooding', 'immediate'],
    aiTone: 'Friendly',
    templateType: 'HVAC', // Using HVAC template as base
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Installation", "Repair", "Refinishing", "Commercial Flooring"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "General"]
      },
      "SUPPLIERS": {
        sub: ["Flooring Suppliers", "Materials", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Projects", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  },

  'General Contractor': {
    name: 'General Contractor',
    icon: 'Hammer',
    description: 'Home renovations, construction projects, permits, subcontractor coordination, project management.',
    urgentKeywords: ['urgent', 'emergency', 'structural damage', 'safety hazard', 'immediate'],
    aiTone: 'Professional',
    templateType: 'HVAC', // Using HVAC template as base
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Renovations", "Construction", "Permits", "Project Management"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "General"]
      },
      "SUPPLIERS": {
        sub: ["Construction Suppliers", "Materials", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Projects", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  },

  'Insulation & Foam Spray': {
    name: 'Insulation & Foam Spray',
    icon: 'Shield',
    description: 'Attic and wall insulation, spray foam application, air sealing, soundproofing, energy efficiency upgrades.',
    urgentKeywords: ['urgent', 'emergency', 'energy audit', 'immediate'],
    aiTone: 'Professional',
    templateType: 'HVAC', // Using HVAC template as base
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Spray Foam", "Insulation", "Air Sealing", "Energy Audits"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "General"]
      },
      "SUPPLIERS": {
        sub: ["Insulation Suppliers", "Materials", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Projects", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  },

  'Landscaping': {
    name: 'Landscaping',
    icon: 'TreePine',
    description: 'Lawn care, tree services, garden design, irrigation, seasonal maintenance, pest control.',
    urgentKeywords: ['urgent', 'emergency', 'storm damage', 'tree down', 'flooding', 'safety hazard'],
    aiTone: 'Friendly',
    templateType: 'HVAC', // Using HVAC template as base
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Lawn Care", "Tree Services", "Garden Design", "Irrigation", "Pest Control"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "General"]
      },
      "SUPPLIERS": {
        sub: ["Landscaping Suppliers", "Plants & Materials", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Projects", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  },

  'Painting Contractor': {
    name: 'Painting Contractor',
    icon: 'Paintbrush',
    description: 'Interior/exterior painting, color consultations, surface prep, commercial painting, pressure washing.',
    urgentKeywords: ['urgent', 'emergency', 'water damage', 'immediate'],
    aiTone: 'Friendly',
    templateType: 'HVAC', // Using HVAC template as base
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Interior Painting", "Exterior Painting", "Surface Prep", "Pressure Washing"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "General"]
      },
      "SUPPLIERS": {
        sub: ["Paint Suppliers", "Materials", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Projects", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  },

  'Roofing Contractor': {
    name: 'Roofing Contractor',
    icon: 'Home',
    description: 'Roof repairs, replacements, inspections, weather damage, gutter cleaning, ventilation systems.',
    urgentKeywords: ['urgent', 'emergency', 'roof leak', 'storm damage', 'water damage', 'immediate'],
    aiTone: 'Professional',
    templateType: 'HVAC', // Using HVAC template as base
    crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
    phoneProvider: 'RingCentral',
    
    labelSchema: {
      "BANKING": {
        sub: ["Invoice", "Receipts", "Refund", "Payment Confirmation"],
        nested: { "Receipts": ["Payment Sent", "Payment Received"] }
      },
      "SERVICE": {
        sub: ["Repairs", "Replacements", "Inspections", "Gutter Cleaning", "Ventilation"]
      },
      "SUPPORT": {
        sub: ["Technical Support", "Appointment Scheduling", "General"]
      },
      "SUPPLIERS": {
        sub: ["Roofing Suppliers", "Materials", "Equipment"]
      },
      "WARRANTY": {
        sub: ["Claims", "Pending Review", "Resolved"]
      },
      "SALES": {
        sub: ["New Projects", "Consultations", "Estimates"]
      },
      "URGENT": {},
      "MISC": {}
    }
  }
};

// Helper function to get business card by name
export function getBusinessCard(businessType) {
  return businessCards[businessType] || null;
}

// Helper function to get label schema for a business type
export function getLabelSchema(businessType) {
  const card = getBusinessCard(businessType);
  return card ? card.labelSchema : null;
}

// Helper function to get all available business types
export function getAllBusinessTypes() {
  return Object.keys(businessCards);
}
