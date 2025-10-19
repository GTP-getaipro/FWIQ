// Pools & Spas Labels - Dynamic Placeholder Schema v1.3.0
// This schema uses placeholder variables that get replaced during provisioning

/**
 * Schema Metadata for Version Control and Auditing
 */
export const poolsSpasMeta = {
  version: "1.3.0",
  businessType: "Pools & Spas",
  lastUpdated: "2025-01-05",
  author: "Floworx Automation Core",
  description: "Dynamic Gmail/Outlook label provisioning schema for Pools & Spas businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
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
  }
};

/**
 * Provisioning Order for Deterministic Label Creation
 * Ensures parent labels are created before children to avoid Gmail API errors
 */
export const provisioningOrder = [
  "BANKING",
  "FORMSUB", 
  "GOOGLE REVIEW",
  "MANAGER",
  "SALES",
  "SUPPLIERS",
  "SUPPORT",
  "URGENT",
  "MISC",
  "PHONE",
  "PROMO",
  "RECRUITMENT",
  "SOCIALMEDIA"
];

/**
 * Dynamic Placeholder Schema for Pools & Spas
 * Uses {{ManagerX}} and {{SupplierX}} placeholders that get replaced during provisioning
 */
export const poolsSpasLabelSchema = {
  "BANKING": {
    color: { backgroundColor: "#16a766", textColor: "#ffffff" },
    intent: "ai.financial_transaction",
    critical: true,
    sub: [
      "BankAlert",
      "e-Transfer",
      "Invoice", 
      "Payment Confirmation",
      "Receipts",
      "Refund"
    ],
    nested: {
      "e-Transfer": ["From Business", "To Business"],
      "Receipts": ["Payment Received", "Payment Sent"]
    },
    description: "Financial transactions, invoices, payments, and banking alerts",
    n8nEnvVar: "LABEL_BANKING"
  },
  "FORMSUB": {
    color: { backgroundColor: "#0b804b", textColor: "#ffffff" },
    intent: "ai.form_submission",
    critical: false,
    sub: [
      "New Submission",
      "Work Order Forms"
    ],
    description: "Customer form submissions and work order processing",
    n8nEnvVar: "LABEL_FORMSUB"
  },
  "GOOGLE REVIEW": {
    color: { backgroundColor: "#fad165", textColor: "#000000" },
    intent: "ai.customer_feedback",
    critical: false,
    sub: [
      "New Reviews",
      "Review Responses", 
      "Review Requests"
    ],
    description: "Google reviews, reputation management, and customer feedback",
    n8nEnvVar: "LABEL_GOOGLE_REVIEW"
  },
  "MANAGER": {
    color: { backgroundColor: "#ffad47", textColor: "#000000" },
    intent: "ai.internal_routing",
    critical: false,
    sub: [
      "Unassigned",
      "Escalations",
      "Team Assignments",
      "Manager Review",
      "{{Manager1}}",
      "{{Manager2}}",
      "{{Manager3}}",
      "{{Manager4}}",
      "{{Manager5}}"
    ],
    description: "Management oversight, team assignments, and escalations",
    n8nEnvVar: "LABEL_MANAGER"
  },
  "SALES": {
    color: { backgroundColor: "#16a766", textColor: "#ffffff" },
    intent: "ai.sales_inquiry",
    critical: false,
    sub: [
      "New Spa Sales",
      "Consultations",
      "Cold Plunge Sales",
      "Sauna Sales",
      "Accessory Sales"
    ],
    description: "Sales activities, consultations, and new business development",
    n8nEnvVar: "LABEL_SALES"
  },
  "SUPPLIERS": {
    color: { backgroundColor: "#ffad47", textColor: "#000000" },
    intent: "ai.vendor_communication",
    critical: false,
    sub: [
      "Aqua Spa Pool Supply",
      "Paradise Patio Furniture Ltd",
      "Strong Spas",
      "Waterway Plastics",
      "{{Supplier1}}",
      "{{Supplier2}}",
      "{{Supplier3}}",
      "{{Supplier4}}",
      "{{Supplier5}}",
      "{{Supplier6}}",
      "{{Supplier7}}",
      "{{Supplier8}}",
      "{{Supplier9}}",
      "{{Supplier10}}"
    ],
    description: "Supplier communications, orders, and vendor management",
    n8nEnvVar: "LABEL_SUPPLIERS"
  },
  "SUPPORT": {
    color: { backgroundColor: "#4a86e8", textColor: "#ffffff" },
    intent: "ai.support_ticket",
    critical: false,
    sub: [
      "Appointment Scheduling",
      "General",
      "Parts And Chemicals",
      "Technical Support"
    ],
    description: "Customer support, technical assistance, and product inquiries",
    n8nEnvVar: "LABEL_SUPPORT"
  },
  "URGENT": {
    color: { backgroundColor: "#fb4c2f", textColor: "#ffffff" },
    intent: "ai.emergency_request",
    critical: true,
    sub: [
      "Emergency Repairs",
      "Safety Issues",
      "Leak Emergencies",
      "Power Outages"
    ],
    description: "Urgent and emergency situations requiring immediate attention",
    n8nEnvVar: "LABEL_URGENT"
  },
  "MISC": {
    color: { backgroundColor: "#999999", textColor: "#ffffff" },
    intent: "ai.general",
    critical: false,
    sub: [
      "General",
      "Archive",
      "Personal"
    ],
    description: "Miscellaneous communications and general items",
    n8nEnvVar: "LABEL_MISC"
  },
  "PHONE": {
    color: { backgroundColor: "#6d9eeb", textColor: "#ffffff" },
    intent: "ai.call_log",
    critical: false,
    sub: [
      "Incoming Calls",
      "Outgoing Calls",
      "Voicemails",
      "Call Logs"
    ],
    description: "Phone communications and call management",
    n8nEnvVar: "LABEL_PHONE"
  },
  "PROMO": {
    color: { backgroundColor: "#43d692", textColor: "#000000" },
    intent: "ai.marketing",
    critical: false,
    sub: [
      "Email Campaigns",
      "Social Media",
      "Newsletters",
      "Special Offers"
    ],
    description: "Promotional materials, marketing campaigns, and special offers",
    n8nEnvVar: "LABEL_PROMO"
  },
  "RECRUITMENT": {
    color: { backgroundColor: "#e07798", textColor: "#ffffff" },
    intent: "ai.hr",
    critical: false,
    sub: [
      "Job Applications",
      "Interview Scheduling",
      "New Hires",
      "HR Communications"
    ],
    description: "Recruitment, hiring, and human resources communications",
    n8nEnvVar: "LABEL_RECRUITMENT"
  },
  "SOCIALMEDIA": {
    color: { backgroundColor: "#ffad47", textColor: "#000000" },
    intent: "ai.social_engagement",
    critical: false,
    sub: [
      "Facebook",
      "Instagram",
      "Google My Business",
      "LinkedIn"
    ],
    description: "Social media communications and platform management",
    n8nEnvVar: "LABEL_SOCIALMEDIA"
  }
};

/**
 * Dynamic Variables Configuration
 * Defines the placeholder patterns for managers and suppliers
 */
export const dynamicVariables = {
  managers: [
    "{{Manager1}}",
    "{{Manager2}}",
    "{{Manager3}}",
    "{{Manager4}}",
    "{{Manager5}}"
  ],
  suppliers: [
    "{{Supplier1}}",
    "{{Supplier2}}",
    "{{Supplier3}}",
    "{{Supplier4}}",
    "{{Supplier5}}",
    "{{Supplier6}}",
    "{{Supplier7}}",
    "{{Supplier8}}",
    "{{Supplier9}}",
    "{{Supplier10}}"
  ]
};

/**
 * Replace dynamic placeholders with actual values
 * @param {Object} schema - Label schema with placeholders
 * @param {Array} managers - Array of manager objects {name, email}
 * @param {Array} suppliers - Array of supplier objects {name, domains}
 * @returns {Object} Schema with placeholders replaced
 */
export function replaceDynamicPlaceholders(schema, managers = [], suppliers = []) {
  const processedSchema = structuredClone(schema);

  // Replace manager placeholders
  if (managers.length > 0) {
    const managerNames = managers
      .filter(m => m.name && m.name.trim() !== '')
      .map(m => m.name.trim());

    // Replace {{ManagerX}} placeholders with actual names
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

  // Replace supplier placeholders
  if (suppliers.length > 0) {
    const supplierNames = suppliers
      .filter(s => s.name && s.name.trim() !== '')
      .map(s => s.name.trim());

    // Replace {{SupplierX}} placeholders with actual names
    if (processedSchema.SUPPLIERS && processedSchema.SUPPLIERS.sub) {
      processedSchema.SUPPLIERS.sub = processedSchema.SUPPLIERS.sub.map(subLabel => {
        if (subLabel.startsWith('{{Supplier') && subLabel.endsWith('}}')) {
          const index = parseInt(subLabel.match(/\d+/)?.[0]) - 1;
          return supplierNames[index] || null;
        }
        return subLabel;
      }).filter(Boolean); // Remove null values
    }
  }

  return processedSchema;
}

/**
 * Get the processed schema with placeholders replaced
 * @param {Array} managers - Array of manager objects
 * @param {Array} suppliers - Array of supplier objects
 * @returns {Object} Processed schema ready for provisioning
 */
export function getPoolsSpasLabelSchema(managers = [], suppliers = []) {
  return replaceDynamicPlaceholders(poolsSpasLabelSchema, managers, suppliers);
}

/**
 * Generate n8n environment variables from label map
 * @param {Object} labelMap - Map of label names to Gmail label IDs
 * @returns {Object} Environment variables for n8n
 */
export function generateN8nEnvironmentVariables(labelMap) {
  const envVars = {};
  
  // Generate environment variables for each label
  for (const [labelName, labelId] of Object.entries(labelMap)) {
    const envVarName = `LABEL_${labelName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    envVars[envVarName] = labelId;
  }
  
  return envVars;
}

/**
 * Validate schema integrity
 * @returns {Object} Validation result with errors and warnings
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

/**
 * Get schema statistics
 * @returns {Object} Statistics about the schema
 */
export function getSchemaStatistics() {
  const labels = Object.values(poolsSpasLabelSchema);
  const intents = new Set(labels.map(l => l.intent).filter(Boolean));

  return {
    totalLabels: Object.keys(poolsSpasLabelSchema).length,
    criticalLabels: labels.filter(l => l.critical === true).length,
    labelsWithSub: labels.filter(l => l.sub && l.sub.length > 0).length,
    labelsWithNested: labels.filter(l => l.nested && Object.keys(l.nested).length > 0).length,
    dynamicPlaceholders: {
      managers: dynamicVariables.managers.length,
      suppliers: dynamicVariables.suppliers.length
    },
    intents: intents.size
  };
}

export default poolsSpasLabelSchema;
