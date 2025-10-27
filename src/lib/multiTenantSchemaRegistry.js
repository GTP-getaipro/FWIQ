// Multi-Tenant Label Schema Registry
// This registry manages business-specific label schemas while maintaining consistent structure

/**
 * Schema Registry for Multi-Tenant Label Management
 * Each business type has its own schema with shared structure but domain-specific content
 */

// Base schema structure that all business types inherit
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

// Universal color palette (consistent across all business types)
const UNIVERSAL_COLORS = {
  BANKING: { backgroundColor: "#16a766", textColor: "#ffffff" },      // Green
  FORMSUB: { backgroundColor: "#0b804b", textColor: "#ffffff" },       // Dark green
  GOOGLE_REVIEW: { backgroundColor: "#fad165", textColor: "#000000" }, // Yellow
  MANAGER: { backgroundColor: "#ffad47", textColor: "#000000" },       // Orange
  SALES: { backgroundColor: "#16a766", textColor: "#ffffff" },          // Green
  SUPPLIERS: { backgroundColor: "#ffad47", textColor: "#000000" },    // Orange
  SUPPORT: { backgroundColor: "#4a86e8", textColor: "#ffffff" },       // Blue
  URGENT: { backgroundColor: "#fb4c2f", textColor: "#ffffff" },       // Red
  MISC: { backgroundColor: "#999999", textColor: "#ffffff" },           // Grey
  PHONE: { backgroundColor: "#6d9eeb", textColor: "#ffffff" },        // Blue
  PROMO: { backgroundColor: "#43d692", textColor: "#000000" },         // Light green
  RECRUITMENT: { backgroundColor: "#e07798", textColor: "#ffffff" },   // Pink
  SOCIALMEDIA: { backgroundColor: "#ffad47", textColor: "#000000" }    // Orange
};

// Universal AI intents (consistent across all business types)
const UNIVERSAL_INTENTS = {
  BANKING: "ai.financial_transaction",
  FORMSUB: "ai.form_submission", 
  GOOGLE_REVIEW: "ai.customer_feedback",
  MANAGER: "ai.internal_routing",
  SALES: "ai.sales_inquiry",
  SUPPLIERS: "ai.vendor_communication",
  SUPPORT: "ai.support_ticket",
  URGENT: "ai.emergency_request",
  MISC: "ai.general",
  PHONE: "ai.call_log",
  PROMO: "ai.marketing",
  RECRUITMENT: "ai.hr",
  SOCIALMEDIA: "ai.social_engagement"
};

/**
 * Pools & Spas Business-Specific Schema
 */
export const poolsSpasSchema = {
  ...BASE_SCHEMA_STRUCTURE,
  businessType: "Pools & Spas",
  description: "Dynamic Gmail/Outlook label provisioning schema for Pools & Spas businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
  labels: {
    BANKING: {
      color: UNIVERSAL_COLORS.BANKING,
      intent: UNIVERSAL_INTENTS.BANKING,
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
    FORMSUB: {
      color: UNIVERSAL_COLORS.FORMSUB,
      intent: UNIVERSAL_INTENTS.FORMSUB,
      critical: false,
      sub: [
        "New Submission",
        "Work Order Forms"
      ],
      description: "Customer form submissions and work order processing",
      n8nEnvVar: "LABEL_FORMSUB"
    },
    GOOGLE_REVIEW: {
      color: UNIVERSAL_COLORS.GOOGLE_REVIEW,
      intent: UNIVERSAL_INTENTS.GOOGLE_REVIEW,
      critical: false,
      sub: [],  // ✅ NO SUBFOLDERS - Classifier can only handle GoogleReview as single category
      description: "Google reviews, reputation management, and customer feedback",
      n8nEnvVar: "LABEL_GOOGLE_REVIEW"
    },
    MANAGER: {
      color: UNIVERSAL_COLORS.MANAGER,
      intent: UNIVERSAL_INTENTS.MANAGER,
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
    SALES: {
      color: UNIVERSAL_COLORS.SALES,
      intent: UNIVERSAL_INTENTS.SALES,
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
    SUPPLIERS: {
      color: UNIVERSAL_COLORS.SUPPLIERS,
      intent: UNIVERSAL_INTENTS.SUPPLIERS,
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
    SUPPORT: {
      color: UNIVERSAL_COLORS.SUPPORT,
      intent: UNIVERSAL_INTENTS.SUPPORT,
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
    URGENT: {
      color: UNIVERSAL_COLORS.URGENT,
      intent: UNIVERSAL_INTENTS.URGENT,
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
    MISC: {
      color: UNIVERSAL_COLORS.MISC,
      intent: UNIVERSAL_INTENTS.MISC,
      critical: false,
      sub: [
        "General",
        "Archive",
        "Personal"
      ],
      description: "Miscellaneous communications and general items",
      n8nEnvVar: "LABEL_MISC"
    },
    PHONE: {
      color: UNIVERSAL_COLORS.PHONE,
      intent: UNIVERSAL_INTENTS.PHONE,
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
    PROMO: {
      color: UNIVERSAL_COLORS.PROMO,
      intent: UNIVERSAL_INTENTS.PROMO,
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
    RECRUITMENT: {
      color: UNIVERSAL_COLORS.RECRUITMENT,
      intent: UNIVERSAL_INTENTS.RECRUITMENT,
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
    SOCIALMEDIA: {
      color: UNIVERSAL_COLORS.SOCIALMEDIA,
      intent: UNIVERSAL_INTENTS.SOCIALMEDIA,
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
  }
};

/**
 * HVAC Business-Specific Schema
 */
export const hvacSchema = {
  ...BASE_SCHEMA_STRUCTURE,
  businessType: "HVAC",
  description: "Dynamic Gmail/Outlook label provisioning schema for HVAC businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
  labels: {
    BANKING: {
      color: UNIVERSAL_COLORS.BANKING,
      intent: UNIVERSAL_INTENTS.BANKING,
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
    FORMSUB: {
      color: UNIVERSAL_COLORS.FORMSUB,
      intent: UNIVERSAL_INTENTS.FORMSUB,
      critical: false,
      sub: [
        "New Submission",
        "Service Request Forms"
      ],
      description: "Customer form submissions and service request processing",
      n8nEnvVar: "LABEL_FORMSUB"
    },
    GOOGLE_REVIEW: {
      color: UNIVERSAL_COLORS.GOOGLE_REVIEW,
      intent: UNIVERSAL_INTENTS.GOOGLE_REVIEW,
      critical: false,
      sub: [],  // ✅ NO SUBFOLDERS - Classifier can only handle GoogleReview as single category
      description: "Google reviews, reputation management, and customer feedback",
      n8nEnvVar: "LABEL_GOOGLE_REVIEW"
    },
    MANAGER: {
      color: UNIVERSAL_COLORS.MANAGER,
      intent: UNIVERSAL_INTENTS.MANAGER,
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
    SALES: {
      color: UNIVERSAL_COLORS.SALES,
      intent: UNIVERSAL_INTENTS.SALES,
      critical: false,
      sub: [
        "New System Sales",
        "Consultations",
        "Replacement Systems",
        "Maintenance Plans",
        "Ductwork Sales"
      ],
      description: "Sales activities, consultations, and new business development",
      n8nEnvVar: "LABEL_SALES"
    },
    SUPPLIERS: {
      color: UNIVERSAL_COLORS.SUPPLIERS,
      intent: UNIVERSAL_INTENTS.SUPPLIERS,
      critical: false,
      sub: [
        "Lennox",
        "Trane",
        "Carrier",
        "Rheem",
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
    SUPPORT: {
      color: UNIVERSAL_COLORS.SUPPORT,
      intent: UNIVERSAL_INTENTS.SUPPORT,
      critical: false,
      sub: [
        "Appointment Scheduling",
        "Emergency Heat",
        "AC Repair",
        "Thermostat Issues",
        "Technical Support"
      ],
      description: "Customer support, technical assistance, and product inquiries",
      n8nEnvVar: "LABEL_SUPPORT"
    },
    URGENT: {
      color: UNIVERSAL_COLORS.URGENT,
      intent: UNIVERSAL_INTENTS.URGENT,
      critical: true,
      sub: [
        "Emergency Repairs",
        "Safety Issues",
        "No Heat",
        "System Down"
      ],
      description: "Urgent and emergency situations requiring immediate attention",
      n8nEnvVar: "LABEL_URGENT"
    },
    MISC: {
      color: UNIVERSAL_COLORS.MISC,
      intent: UNIVERSAL_INTENTS.MISC,
      critical: false,
      sub: [
        "General",
        "Archive",
        "Personal"
      ],
      description: "Miscellaneous communications and general items",
      n8nEnvVar: "LABEL_MISC"
    },
    PHONE: {
      color: UNIVERSAL_COLORS.PHONE,
      intent: UNIVERSAL_INTENTS.PHONE,
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
    PROMO: {
      color: UNIVERSAL_COLORS.PROMO,
      intent: UNIVERSAL_INTENTS.PROMO,
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
    RECRUITMENT: {
      color: UNIVERSAL_COLORS.RECRUITMENT,
      intent: UNIVERSAL_INTENTS.RECRUITMENT,
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
    SOCIALMEDIA: {
      color: UNIVERSAL_COLORS.SOCIALMEDIA,
      intent: UNIVERSAL_INTENTS.SOCIALMEDIA,
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
  }
};

/**
 * Electrician Business-Specific Schema
 */
export const electricianSchema = {
  ...BASE_SCHEMA_STRUCTURE,
  businessType: "Electrician",
  description: "Dynamic Gmail/Outlook label provisioning schema for Electrician businesses. Supports up to 5 managers and 10 suppliers defined in onboarding.",
  labels: {
    BANKING: {
      color: UNIVERSAL_COLORS.BANKING,
      intent: UNIVERSAL_INTENTS.BANKING,
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
    FORMSUB: {
      color: UNIVERSAL_COLORS.FORMSUB,
      intent: UNIVERSAL_INTENTS.FORMSUB,
      critical: false,
      sub: [
        "New Submission",
        "Electrical Permit Forms"
      ],
      description: "Customer form submissions and electrical permit processing",
      n8nEnvVar: "LABEL_FORMSUB"
    },
    GOOGLE_REVIEW: {
      color: UNIVERSAL_COLORS.GOOGLE_REVIEW,
      intent: UNIVERSAL_INTENTS.GOOGLE_REVIEW,
      critical: false,
      sub: [],  // ✅ NO SUBFOLDERS - Classifier can only handle GoogleReview as single category
      description: "Google reviews, reputation management, and customer feedback",
      n8nEnvVar: "LABEL_GOOGLE_REVIEW"
    },
    MANAGER: {
      color: UNIVERSAL_COLORS.MANAGER,
      intent: UNIVERSAL_INTENTS.MANAGER,
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
    SALES: {
      color: UNIVERSAL_COLORS.SALES,
      intent: UNIVERSAL_INTENTS.SALES,
      critical: false,
      sub: [
        "New Installation Sales",
        "Consultations",
        "Panel Upgrades",
        "Lighting Installation",
        "Generator Sales"
      ],
      description: "Sales activities, consultations, and new business development",
      n8nEnvVar: "LABEL_SALES"
    },
    SUPPLIERS: {
      color: UNIVERSAL_COLORS.SUPPLIERS,
      intent: UNIVERSAL_INTENTS.SUPPLIERS,
      critical: false,
      sub: [
        "Eaton",
        "Schneider Electric",
        "Square D",
        "Leviton",
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
    SUPPORT: {
      color: UNIVERSAL_COLORS.SUPPORT,
      intent: UNIVERSAL_INTENTS.SUPPORT,
      critical: false,
      sub: [
        "Appointment Scheduling",
        "Wiring Issues",
        "Breaker Panels",
        "Lighting Installation",
        "Technical Support"
      ],
      description: "Customer support, technical assistance, and product inquiries",
      n8nEnvVar: "LABEL_SUPPORT"
    },
    URGENT: {
      color: UNIVERSAL_COLORS.URGENT,
      intent: UNIVERSAL_INTENTS.URGENT,
      critical: true,
      sub: [
        "Emergency Repairs",
        "Safety Issues",
        "No Power",
        "Electrical Hazard"
      ],
      description: "Urgent and emergency situations requiring immediate attention",
      n8nEnvVar: "LABEL_URGENT"
    },
    MISC: {
      color: UNIVERSAL_COLORS.MISC,
      intent: UNIVERSAL_INTENTS.MISC,
      critical: false,
      sub: [
        "General",
        "Archive",
        "Personal"
      ],
      description: "Miscellaneous communications and general items",
      n8nEnvVar: "LABEL_MISC"
    },
    PHONE: {
      color: UNIVERSAL_COLORS.PHONE,
      intent: UNIVERSAL_INTENTS.PHONE,
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
    PROMO: {
      color: UNIVERSAL_COLORS.PROMO,
      intent: UNIVERSAL_INTENTS.PROMO,
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
    RECRUITMENT: {
      color: UNIVERSAL_COLORS.RECRUITMENT,
      intent: UNIVERSAL_INTENTS.RECRUITMENT,
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
    SOCIALMEDIA: {
      color: UNIVERSAL_COLORS.SOCIALMEDIA,
      intent: UNIVERSAL_INTENTS.SOCIALMEDIA,
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
  }
};

/**
 * Schema Registry - Maps business types to their schemas
 */
export const schemaRegistry = {
  "Pools & Spas": poolsSpasSchema,
  "HVAC": hvacSchema,
  "Electrician": electricianSchema,
  // Add more business types as needed
};

/**
 * Get schema for a specific business type
 * @param {string} businessType - Business type
 * @returns {Object} Business-specific schema
 */
export function getSchemaForBusinessType(businessType) {
  const schema = schemaRegistry[businessType];
  if (!schema) {
    throw new Error(`No schema found for business type: ${businessType}`);
  }
  return schema;
}

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
    if (processedSchema.labels.MANAGER && processedSchema.labels.MANAGER.sub) {
      processedSchema.labels.MANAGER.sub = processedSchema.labels.MANAGER.sub.map(subLabel => {
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
    if (processedSchema.labels.SUPPLIERS && processedSchema.labels.SUPPLIERS.sub) {
      processedSchema.labels.SUPPLIERS.sub = processedSchema.labels.SUPPLIERS.sub.map(subLabel => {
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
 * @param {string} businessType - Business type
 * @param {Array} managers - Array of manager objects
 * @param {Array} suppliers - Array of supplier objects
 * @returns {Object} Processed schema ready for provisioning
 */
export function getProcessedSchemaForBusiness(businessType, managers = [], suppliers = []) {
  const baseSchema = getSchemaForBusinessType(businessType);
  return replaceDynamicPlaceholders(baseSchema, managers, suppliers);
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
 * @param {string} businessType - Business type to validate
 * @returns {Object} Validation result with errors and warnings
 */
export function validateSchemaIntegrity(businessType) {
  const schema = getSchemaForBusinessType(businessType);
  const errors = [];
  const warnings = [];

  // Check provisioning order includes all labels
  const schemaLabels = Object.keys(schema.labels);
  const orderLabels = schema.provisioningOrder;

  const missingInOrder = schemaLabels.filter(label => !orderLabels.includes(label));
  const extraInOrder = orderLabels.filter(label => !schemaLabels.includes(label));

  if (missingInOrder.length > 0) {
    errors.push(`Labels missing from provisioning order: ${missingInOrder.join(', ')}`);
  }

  if (extraInOrder.length > 0) {
    warnings.push(`Extra labels in provisioning order: ${extraInOrder.join(', ')}`);
  }

  // Check for duplicate intents
  const intents = Object.values(schema.labels)
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
 * @param {string} businessType - Business type
 * @returns {Object} Statistics about the schema
 */
export function getSchemaStatistics(businessType) {
  const schema = getSchemaForBusinessType(businessType);
  const labels = Object.values(schema.labels);
  const intents = new Set(labels.map(l => l.intent).filter(Boolean));

  return {
    businessType: schema.businessType,
    totalLabels: Object.keys(schema.labels).length,
    criticalLabels: labels.filter(l => l.critical === true).length,
    labelsWithSub: labels.filter(l => l.sub && l.sub.length > 0).length,
    labelsWithNested: labels.filter(l => l.nested && Object.keys(l.nested).length > 0).length,
    dynamicPlaceholders: {
      managers: schema.dynamicVariables.managers.length,
      suppliers: schema.dynamicVariables.suppliers.length
    },
    intents: intents.size
  };
}

export default schemaRegistry;
