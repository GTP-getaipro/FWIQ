// Pools & Spas Labels - Complete Schema Definition
// This file defines the complete label structure for Pools & Spas businesses
// Includes color-coded hierarchy, supplier-specific sublabels, and n8n environment variable mapping

/**
 * Pools & Spas Label Schema Definition
 * 
 * This schema defines the complete label structure for Pools & Spas businesses,
 * including color-coded hierarchy, supplier-specific sublabels, warranty branches,
 * and environment variable mapping for n8n workflow integration.
 */

/**
 * Schema Metadata for Version Control and Auditing
 */
export const poolsSpasMeta = {
  version: "v1.2.0",
  businessType: "Pools & Spas",
  updatedAt: "2025-01-05",
  author: "Floworx Automation Core",
  description: "Industry-specific Gmail/Outlook label schema for Pools & Spas, including warranty, supplier, and water care automation.",
  features: [
    "Color-coded hierarchy",
    "Supplier-specific sublabels", 
    "Service type branches",
    "Warranty management",
    "n8n environment variable mapping",
    "AI intent classification",
    "Critical label protection"
  ],
  compatibility: {
    gmail: "✅ Full support",
    outlook: "✅ Full support", 
    n8n: "✅ Environment variable ready"
  }
};

// Color definitions using Gmail API allowed colors
const POOLS_SPAS_COLORS = {
  BANKING: { backgroundColor: "#16a766", textColor: "#ffffff" },      // Green
  FORMSUB: { backgroundColor: "#0b804b", textColor: "#ffffff" },     // Dark green
  GOOGLE_REVIEW: { backgroundColor: "#fad165", textColor: "#000000" }, // Yellow
  MANAGER: { backgroundColor: "#ffad47", textColor: "#000000" },     // Orange
  SERVICE: { backgroundColor: "#4a86e8", textColor: "#ffffff" },     // Blue
  WARRANTY: { backgroundColor: "#a479e2", textColor: "#ffffff" },    // Purple
  SUPPORT: { backgroundColor: "#4a86e8", textColor: "#ffffff" },      // Blue
  SALES: { backgroundColor: "#149e60", textColor: "#ffffff" },        // Green
  SUPPLIERS: { backgroundColor: "#ffad47", textColor: "#000000" },    // Orange
  URGENT: { backgroundColor: "#fb4c2f", textColor: "#ffffff" },       // Red
  MISC: { backgroundColor: "#999999", textColor: "#ffffff" },         // Grey
  PROMO: { backgroundColor: "#43d692", textColor: "#000000" },        // Light green
  RECRUITMENT: { backgroundColor: "#e07798", textColor: "#ffffff" },  // Pink
  PHONE: { backgroundColor: "#6d9eeb", textColor: "#ffffff" },        // Blue
  SOCIALMEDIA: { backgroundColor: "#ffad47", textColor: "#000000" }   // Orange
};

/**
 * Category Groups for Logical Organization and UI Grouping
 */
export const categoryGroups = {
  Operations: ["SUPPORT"],
  Sales: ["SALES", "PROMO"],
  Administration: ["BANKING", "MANAGER", "RECRUITMENT"],
  Communications: ["PHONE", "SOCIALMEDIA"],
  Suppliers: ["SUPPLIERS"],
  CustomerExperience: ["GOOGLE REVIEW", "FORMSUB"],
  Critical: ["URGENT"],
  General: ["MISC"]
};

/**
 * Provisioning Order for Deterministic Label Creation
 * Ensures parent labels are created before children to avoid Gmail API errors
 */
export const provisioningOrder = [
  "BANKING",
  "SALES",
  "SUPPORT",
  "MANAGER",
  "SUPPLIERS",
  "PHONE",
  "URGENT",
  "SOCIALMEDIA",
  "GOOGLE_REVIEW",
  "FORMSUB",
  "RECRUITMENT",
  "PROMO",
  "MISC"
];

/**
 * Complete Pools & Spas Label Schema
 * 
 * Structure:
 * - Parent labels with colors
 * - Sub-labels for organization
 * - Nested labels for detailed categorization
 * - Supplier-specific labels
 * - Service type branches
 * - Warranty management
 */
export const poolsSpasLabelSchema = {
  // 💰 Banking & Financial
  "BANKING": {
    color: POOLS_SPAS_COLORS.BANKING,
    sub: [
      "Invoice",
      "Receipts", 
      "Refund",
      "Payment Confirmation",
      "Bank Alert",
      "e-Transfer"
    ],
    nested: {
      "Receipts": [
        "Payment Sent",
        "Payment Received"
      ]
    },
    intent: "ai.financial_transaction",
    critical: true,
    description: "Financial transactions, invoices, payments, and banking alerts",
    n8nEnvVar: "LABEL_BANKING"
  },

  // 📋 Form Submissions & Work Orders
  "FORMSUB": {
    color: POOLS_SPAS_COLORS.FORMSUB,
    sub: [
      "New Submission",
      "Work Order Forms",
      "Service Requests",
      "Quote Requests"
    ],
    intent: "ai.form_submission",
    critical: false,
    description: "Customer form submissions and work order processing",
    n8nEnvVar: "LABEL_FORMSUB"
  },

  // ⭐ Google Reviews & Reputation
  "GOOGLE REVIEW": {
    color: POOLS_SPAS_COLORS.GOOGLE_REVIEW,
    sub: [
      "New Reviews",
      "Review Responses",
      "Review Requests"
    ],
    intent: "ai.review_management",
    critical: false,
    description: "Google reviews, reputation management, and customer feedback",
    n8nEnvVar: "LABEL_GOOGLE_REVIEW"
  },

  // 👥 Management & Team (Dynamic - populated from onboarding)
  "MANAGER": {
    color: POOLS_SPAS_COLORS.MANAGER,
    sub: [
      "Manager Review",
      "Escalations",
      "Team Assignments",
      "Unassigned"
    ],
    intent: "ai.management_oversight",
    critical: false,
    description: "Management oversight, team assignments, and escalations",
    n8nEnvVar: "LABEL_MANAGER",
    dynamic: true
  },

  // 🔧 Support Operations (simplified)
  "SUPPORT": {
    color: POOLS_SPAS_COLORS.SUPPORT,
    sub: [
      "Appointment Scheduling",
      "General",
      "Technical Support",
      "Parts And Chemicals"
    ],
    intent: "ai.support_request",
    critical: false,
    description: "Customer support and general inquiries",
    n8nEnvVar: "LABEL_SUPPORT"
  },


  // 💼 Sales & New Business
  "SALES": {
    color: POOLS_SPAS_COLORS.SALES,
    sub: [
      "New Spa Sales",
      "Cold Plunge Sales",
      "Accessory Sales",
      "Consultations",
      "Quote Requests"
    ],
    intent: "ai.sales_inquiry",
    critical: false,
    description: "Sales inquiries, consultations, and new business opportunities",
    n8nEnvVar: "LABEL_SALES"
  },

  // 📦 Supplier Management (Dynamic - populated from onboarding)
  "SUPPLIERS": {
    color: POOLS_SPAS_COLORS.SUPPLIERS,
    sub: [
      "Aqua Spa Pool Supply",
      "Paradise Patio Furniture",
      "Strong Spas",
      "Waterway Plastics"
    ],
    intent: "ai.supplier_communication",
    critical: false,
    description: "Supplier communications, orders, and vendor management",
    n8nEnvVar: "LABEL_SUPPLIERS",
    dynamic: true
  },

  // 🚨 Urgent & Emergency
  "URGENT": {
    color: POOLS_SPAS_COLORS.URGENT,
    sub: [
      "Emergency Repairs",
      "Safety Issues",
      "Leak Emergencies",
      "Power Outages"
    ],
    intent: "ai.emergency_request",
    critical: true,
    description: "Urgent and emergency situations requiring immediate attention",
    n8nEnvVar: "LABEL_URGENT"
  },

  // 📞 Phone Communications
  "PHONE": {
    color: POOLS_SPAS_COLORS.PHONE,
    sub: [
      "Incoming Calls",
      "Outgoing Calls",
      "Voicemails",
      "Call Logs"
    ],
    intent: "ai.phone_communication",
    critical: false,
    description: "Phone communications and call management",
    n8nEnvVar: "LABEL_PHONE"
  },

  // 📢 Promotional & Marketing
  "PROMO": {
    color: POOLS_SPAS_COLORS.PROMO,
    sub: [
      "Email Campaigns",
      "Social Media",
      "Newsletters",
      "Special Offers"
    ],
    intent: "ai.marketing_communication",
    critical: false,
    description: "Promotional materials, marketing campaigns, and special offers",
    n8nEnvVar: "LABEL_PROMO"
  },

  // 👥 Recruitment & HR
  "RECRUITMENT": {
    color: POOLS_SPAS_COLORS.RECRUITMENT,
    sub: [
      "Job Applications",
      "Interview Scheduling",
      "New Hires",
      "HR Communications"
    ],
    intent: "ai.hr_communication",
    critical: false,
    description: "Recruitment, hiring, and human resources communications",
    n8nEnvVar: "LABEL_RECRUITMENT"
  },

  // 📱 Social Media
  "SOCIALMEDIA": {
    color: POOLS_SPAS_COLORS.SOCIALMEDIA,
    sub: [
      "Facebook",
      "Instagram", 
      "Google My Business",
      "LinkedIn"
    ],
    intent: "ai.social_media",
    critical: false,
    description: "Social media communications and platform management",
    n8nEnvVar: "LABEL_SOCIALMEDIA"
  },

  // 📁 Miscellaneous
  "MISC": {
    color: POOLS_SPAS_COLORS.MISC,
    sub: [
      "General",
      "Archive",
      "Personal"
    ],
    intent: "ai.general_communication",
    critical: false,
    description: "Miscellaneous communications and general items",
    n8nEnvVar: "LABEL_MISC"
  }
};

/**
 * Label Color and Schema Definitions
 * (TypeScript interfaces removed for JavaScript compatibility)
 */

// Schema metadata removed for JavaScript compatibility

/**
 * Environment Variable Mapping for n8n
 * Maps each label to its corresponding n8n environment variable
 */
export const n8nEnvironmentMapping = {
  // Parent Labels
  "BANKING": "{{$env.LABEL_BANKING}}",
  "FORMSUB": "{{$env.LABEL_FORMSUB}}",
  "GOOGLE REVIEW": "{{$env.LABEL_GOOGLE_REVIEW}}",
  "MANAGER": "{{$env.LABEL_MANAGER}}",
  "SERVICE": "{{$env.LABEL_SERVICE}}",
  "WARRANTY": "{{$env.LABEL_WARRANTY}}",
  "SUPPORT": "{{$env.LABEL_SUPPORT}}",
  "SALES": "{{$env.LABEL_SALES}}",
  "SUPPLIERS": "{{$env.LABEL_SUPPLIERS}}",
  "URGENT": "{{$env.LABEL_URGENT}}",
  "PHONE": "{{$env.LABEL_PHONE}}",
  "PROMO": "{{$env.LABEL_PROMO}}",
  "RECRUITMENT": "{{$env.LABEL_RECRUITMENT}}",
  "SOCIALMEDIA": "{{$env.LABEL_SOCIALMEDIA}}",
  "MISC": "{{$env.LABEL_MISC}}",

  // Sub-labels (using underscore notation for n8n)
  "BANKING_INVOICE": "{{$env.LABEL_BANKING_INVOICE}}",
  "BANKING_RECEIPTS": "{{$env.LABEL_BANKING_RECEIPTS}}",
  "BANKING_REFUND": "{{$env.LABEL_BANKING_REFUND}}",
  "BANKING_PAYMENT_CONFIRMATION": "{{$env.LABEL_BANKING_PAYMENT_CONFIRMATION}}",
  "BANKING_BANK_ALERT": "{{$env.LABEL_BANKING_BANK_ALERT}}",
  "BANKING_E_TRANSFER": "{{$env.LABEL_BANKING_E_TRANSFER}}",

  "SERVICE_REPAIRS": "{{$env.LABEL_SERVICE_REPAIRS}}",
  "SERVICE_INSTALLATIONS": "{{$env.LABEL_SERVICE_INSTALLATIONS}}",
  "SERVICE_MAINTENANCE": "{{$env.LABEL_SERVICE_MAINTENANCE}}",
  "SERVICE_WATER_CARE_VISITS": "{{$env.LABEL_SERVICE_WATER_CARE_VISITS}}",
  "SERVICE_WARRANTY_SERVICE": "{{$env.LABEL_SERVICE_WARRANTY_SERVICE}}",
  "SERVICE_EMERGENCY_SERVICE": "{{$env.LABEL_SERVICE_EMERGENCY_SERVICE}}",

  "SUPPLIERS_AQUASPAPOOLSUPPLY": "{{$env.LABEL_SUPPLIERS_AQUASPAPOOLSUPPLY}}",
  "SUPPLIERS_PARADISEPATIOFURNITURELTD": "{{$env.LABEL_SUPPLIERS_PARADISEPATIOFURNITURELTD}}",
  "SUPPLIERS_STRONGSPAS": "{{$env.LABEL_SUPPLIERS_STRONGSPAS}}",
  "SUPPLIERS_WATERWAYPLASTICS": "{{$env.LABEL_SUPPLIERS_WATERWAYPLASTICS}}",
  "SUPPLIERS_COLD_PLUNGE_CO": "{{$env.LABEL_SUPPLIERS_COLD_PLUNGE_CO}}",
  "SUPPLIERS_SAUNA_SUPPLIERS": "{{$env.LABEL_SUPPLIERS_SAUNA_SUPPLIERS}}",

  "WARRANTY_CLAIMS": "{{$env.LABEL_WARRANTY_CLAIMS}}",
  "WARRANTY_PENDING_REVIEW": "{{$env.LABEL_WARRANTY_PENDING_REVIEW}}",
  "WARRANTY_RESOLVED": "{{$env.LABEL_WARRANTY_RESOLVED}}",
  "WARRANTY_DENIED": "{{$env.LABEL_WARRANTY_DENIED}}",
  "WARRANTY_WARRANTY_PARTS": "{{$env.LABEL_WARRANTY_WARRANTY_PARTS}}",

  "SALES_NEW_SPA_SALES": "{{$env.LABEL_SALES_NEW_SPA_SALES}}",
  "SALES_CONSULTATIONS": "{{$env.LABEL_SALES_CONSULTATIONS}}",
  "SALES_COLD_PLUNGE_SALES": "{{$env.LABEL_SALES_COLD_PLUNGE_SALES}}",
  "SALES_SAUNA_SALES": "{{$env.LABEL_SALES_SAUNA_SALES}}",
  "SALES_ACCESSORY_SALES": "{{$env.LABEL_SALES_ACCESSORY_SALES}}"
};

/**
 * Helper Functions
 */

/**
 * Get label schema for Pools & Spas business
 * @returns {PoolsSpasLabelSchema} Complete label schema
 */
export function getPoolsSpasLabelSchema() {
  return poolsSpasLabelSchema;
}

/**
 * Get color for a specific label
 * @param {string} labelName - Name of the label
 * @returns {LabelColor | null} Color configuration or null if not found
 */
export function getLabelColor(labelName) {
  const config = poolsSpasLabelSchema[labelName];
  return config?.color || null;
}

/**
 * Get n8n environment variable for a label
 * @param {string} labelName - Name of the label
 * @returns {string | null} Environment variable or null if not found
 */
export function getN8nEnvVar(labelName) {
  return n8nEnvironmentMapping[labelName] || null;
}

/**
 * Get all sub-labels for a parent label
 * @param {string} parentLabel - Parent label name
 * @returns {string[]} Array of sub-label names
 */
export function getSubLabels(parentLabel) {
  const config = poolsSpasLabelSchema[parentLabel];
  return config?.sub || [];
}

/**
 * Get nested labels for a specific sub-label
 * @param {string} parentLabel - Parent label name
 * @param {string} subLabel - Sub-label name
 * @returns {string[]} Array of nested label names
 */
export function getNestedLabels(parentLabel, subLabel) {
  const config = poolsSpasLabelSchema[parentLabel];
  return config?.nested?.[subLabel] || [];
}

/**
 * Convert schema to standard labels format for FolderIntegrationManager
 * @returns {Array} Standard labels array compatible with existing system
 */
export function convertToStandardLabels() {
  const standardLabels = [];

  for (const [parentName, config] of Object.entries(poolsSpasLabelSchema)) {
    const parentLabel = {
      name: parentName,
      sub: []
    };

    // Add sub-labels
    if (config.sub && Array.isArray(config.sub)) {
      parentLabel.sub = config.sub.map(subName => ({
        name: subName,
        sub: []
      }));

      // Add nested labels
      if (config.nested) {
        for (const [subName, nestedLabels] of Object.entries(config.nested)) {
          const subLabel = parentLabel.sub.find(s => s.name === subName);
          if (subLabel && Array.isArray(nestedLabels)) {
            subLabel.sub = nestedLabels.map(nestedName => ({
              name: nestedName,
              sub: []
            }));
          }
        }
      }
    }

    standardLabels.push(parentLabel);
  }

  return standardLabels;
}

/**
 * Generate environment variables JSON for n8n deployment
 * @param {Object} labelMap - Label ID mapping from provisioning
 * @returns {Object} Environment variables object for n8n
 */
export function generateN8nEnvironmentVariables(labelMap) {
  const envVars = {};

  // Map each label to its environment variable
  for (const [labelName, labelId] of Object.entries(labelMap)) {
    const envVar = n8nEnvironmentMapping[labelName];
    if (envVar) {
      // Extract the variable name from {{$env.VARIABLE_NAME}}
      const varName = envVar.replace('{{$env.', '').replace('}}', '');
      envVars[varName] = labelId;
    }
  }

  return envVars;
}

/**
 * Get supplier-specific labels
 * @returns {string[]} Array of supplier label names
 */
export function getSupplierLabels() {
  return [
    "AquaSpaPoolSupply",
    "ParadisePatioFurnitureLtd",
    "StrongSpas", 
    "WaterwayPlastics",
    "Cold Plunge Co",
    "Sauna Suppliers"
  ];
}

/**
 * Get service type labels
 * @returns {string[]} Array of service type label names
 */
export function getServiceTypeLabels() {
  return [
    "Repairs",
    "Installations",
    "Maintenance", 
    "Water Care Visits",
    "Warranty Service",
    "Emergency Service"
  ];
}

/**
 * Get warranty-related labels
 * @returns {string[]} Array of warranty label names
 */
export function getWarrantyLabels() {
  return [
    "Claims",
    "Pending Review",
    "Resolved",
    "Denied",
    "Warranty Parts"
  ];
}

/**
 * Compare existing label map with schema to detect missing or extra labels
 * @param {string[]} existingLabels - Array of existing label names
 * @returns {{missing: string[], extras: string[], criticalMissing: string[]}} Comparison result with missing and extra labels
 */
export function diffLabelSchema(existingLabels) {
  const defined = Object.keys(poolsSpasLabelSchema);
  const missing = defined.filter(label => !existingLabels.includes(label));
  const extras = existingLabels.filter(label => !defined.includes(label));
  
  // Check for critical missing labels
  const criticalMissing = missing.filter(label => {
    const config = poolsSpasLabelSchema[label];
    return config?.critical === true;
  });

  return { missing, extras, criticalMissing };
}

/**
 * Get labels by category group
 * @param {string} groupName - Name of the category group
 * @returns {string[]} Array of label names in the group
 */
export function getLabelsByCategoryGroup(groupName) {
  return categoryGroups[groupName] || [];
}

/**
 * Get all critical labels that should be protected from deletion
 * @returns {string[]} Array of critical label names
 */
export function getCriticalLabels() {
  return Object.entries(poolsSpasLabelSchema)
    .filter(([_, config]) => config.critical === true)
    .map(([name, _]) => name);
}

/**
 * Get labels by AI intent
 * @param {string} intent - AI intent string
 * @returns {string[]} Array of label names matching the intent
 */
export function getLabelsByIntent(intent) {
  return Object.entries(poolsSpasLabelSchema)
    .filter(([_, config]) => config.intent === intent)
    .map(([name, _]) => name);
}

/**
 * Get schema statistics
 * @returns {Object} Schema statistics
 */
export function getSchemaStatistics() {
  const labels = Object.values(poolsSpasLabelSchema);
  const intents = new Set(labels.map(l => l.intent).filter(Boolean));
  
  return {
    totalLabels: Object.keys(poolsSpasLabelSchema).length,
    criticalLabels: labels.filter(l => l.critical === true).length,
    labelsWithSub: labels.filter(l => l.sub && l.sub.length > 0).length,
    labelsWithNested: labels.filter(l => l.nested && Object.keys(l.nested).length > 0).length,
    categoryGroups: Object.keys(categoryGroups).length,
    intents: intents.size
  };
}

/**
 * Generate n8n environment template for Supabase deployment injection
 * @returns {Object} Environment template with empty values
 */
export const n8nEnvTemplate = Object.keys(n8nEnvironmentMapping).reduce((acc, key) => {
  const varName = n8nEnvironmentMapping[key].replace("{{$env.", "").replace("}}", "");
  acc[varName] = "";
  return acc;
}, {});

/**
 * Validate schema integrity
 * @returns {Object} Validation result with { isValid, errors, warnings }
 */
export function validateSchemaIntegrity() {
  const errors = [];
  const warnings = [];

  // Check provisioning order includes all labels
  const schemaLabels = Object.keys(poolsSpasLabelSchema);
  const orderLabels = provisioningOrder;
  
  const missingInOrder = schemaLabels.filter(label => !orderLabels.includes(label));
  const extraInOrder = orderLabels.filter(label => !schemaLabels.includes(label));
  
  if (missingInOrder.length > 0) {
    errors.push(`Labels missing from provisioning order: ${missingInOrder.join(', ')}`);
  }
  
  if (extraInOrder.length > 0) {
    warnings.push(`Extra labels in provisioning order: ${extraInOrder.join(', ')}`);
  }

  // Check category groups include valid labels
  for (const [groupName, labels] of Object.entries(categoryGroups)) {
    const invalidLabels = labels.filter(label => !schemaLabels.includes(label));
    if (invalidLabels.length > 0) {
      errors.push(`Category group '${groupName}' contains invalid labels: ${invalidLabels.join(', ')}`);
    }
  }

  // Check for duplicate intents
  const intents = Object.values(poolsSpasLabelSchema)
    .map(config => config.intent)
    .filter(Boolean);
  const duplicateIntents = intents.filter((intent, index) => intents.indexOf(intent) !== index);
  
  if (duplicateIntents.length > 0) {
    warnings.push(`Duplicate intents found: ${[...new Set(duplicateIntents)].join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Export default schema for easy importing
