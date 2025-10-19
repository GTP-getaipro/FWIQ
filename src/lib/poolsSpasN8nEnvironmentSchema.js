// n8n Environment Variables Schema for Pools & Spas
// This file defines all environment variables needed for n8n workflow deployment

/**
 * n8n Environment Variables Schema for Pools & Spas Business
 * 
 * This schema defines all the environment variables that will be injected
 * into the n8n workflow template during deployment. Each variable maps
 * to a specific Gmail label ID created during the provisioning process.
 */

export const poolsSpasN8nEnvironmentSchema = {
  // Business Identity Variables
  BUSINESS_NAME: {
    description: "Company name for Pools & Spas business",
    example: "BlueWave Pools Ltd.",
    required: true,
    type: "string"
  },
  BUSINESS_URL: {
    description: "Company website URL",
    example: "https://bluewavepools.com",
    required: true,
    type: "string"
  },
  BUSINESS_PHONE: {
    description: "Primary business phone number",
    example: "+1 (555) 555-1212",
    required: true,
    type: "string"
  },
  BUSINESS_EMAIL: {
    description: "Primary business email address",
    example: "info@bluewavepools.com",
    required: true,
    type: "string"
  },

  // Gmail Label Variables - Parent Labels
  LABEL_BANKING: {
    description: "Gmail label ID for Banking category",
    example: "Label_6905772575485371098",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_FORMSUB: {
    description: "Gmail label ID for Form Submissions",
    example: "Label_7981083321603674402",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_GOOGLE_REVIEW: {
    description: "Gmail label ID for Google Reviews",
    example: "Label_6681005821284082345",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_MANAGER: {
    description: "Gmail label ID for Manager category",
    example: "Label_6965707290248133071",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SERVICE: {
    description: "Gmail label ID for Service category",
    example: "Label_101765734924",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_WARRANTY: {
    description: "Gmail label ID for Warranty category",
    example: "Label_5207154876416998617",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SUPPORT: {
    description: "Gmail label ID for Support category",
    example: "Label_4911328466776678765",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SALES: {
    description: "Gmail label ID for Sales category",
    example: "Label_1381962670795847883",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SUPPLIERS: {
    description: "Gmail label ID for Suppliers category",
    example: "Label_5910952788693218903",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_URGENT: {
    description: "Gmail label ID for Urgent category",
    example: "Label_4682687869701858437",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_PHONE: {
    description: "Gmail label ID for Phone category",
    example: "Label_3271844147547550208",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_PROMO: {
    description: "Gmail label ID for Promo category",
    example: "Label_5194757020768107348",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_RECRUITMENT: {
    description: "Gmail label ID for Recruitment category",
    example: "Label_3970665389479569628",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SOCIALMEDIA: {
    description: "Gmail label ID for Social Media category",
    example: "Label_2672320601196095158",
    required: true,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_MISC: {
    description: "Gmail label ID for Miscellaneous category",
    example: "Label_6896136905128060519",
    required: true,
    type: "string",
    category: "gmail_labels"
  },

  // Gmail Label Variables - Banking Sub-labels
  LABEL_BANKING_INVOICE: {
    description: "Gmail label ID for Banking/Invoice",
    example: "Label_1097875258825754279",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_BANKING_RECEIPTS: {
    description: "Gmail label ID for Banking/Receipts",
    example: "Label_4043986230994929479",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_BANKING_REFUND: {
    description: "Gmail label ID for Banking/Refund",
    example: "Label_1577215682212766299",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_BANKING_PAYMENT_CONFIRMATION: {
    description: "Gmail label ID for Banking/Payment Confirmation",
    example: "Label_6185303115826930212",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_BANKING_BANK_ALERT: {
    description: "Gmail label ID for Banking/Bank Alert",
    example: "Label_3597829195270583283",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_BANKING_E_TRANSFER: {
    description: "Gmail label ID for Banking/e-Transfer",
    example: "Label_8879565119088926061",
    required: false,
    type: "string",
    category: "gmail_labels"
  },

  // Gmail Label Variables - Service Sub-labels
  LABEL_SERVICE_REPAIRS: {
    description: "Gmail label ID for Service/Repairs",
    example: "Label_1818763003348762840",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SERVICE_INSTALLATIONS: {
    description: "Gmail label ID for Service/Installations",
    example: "Label_9208263245784859855",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SERVICE_MAINTENANCE: {
    description: "Gmail label ID for Service/Maintenance",
    example: "Label_6414832157911581695",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SERVICE_WATER_CARE_VISITS: {
    description: "Gmail label ID for Service/Water Care Visits",
    example: "Label_6414832157911581695",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SERVICE_WARRANTY_SERVICE: {
    description: "Gmail label ID for Service/Warranty Service",
    example: "Label_5207154876416998617",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SERVICE_EMERGENCY_SERVICE: {
    description: "Gmail label ID for Service/Emergency Service",
    example: "Label_4682687869701858437",
    required: false,
    type: "string",
    category: "gmail_labels"
  },

  // Gmail Label Variables - Supplier Sub-labels
  LABEL_SUPPLIERS_AQUASPAPOOLSUPPLY: {
    description: "Gmail label ID for Suppliers/AquaSpaPoolSupply",
    example: "Label_1754819594410264536",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SUPPLIERS_PARADISEPATIOFURNITURELTD: {
    description: "Gmail label ID for Suppliers/ParadisePatioFurnitureLtd",
    example: "Label_9221639982004118374",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SUPPLIERS_STRONGSPAS: {
    description: "Gmail label ID for Suppliers/StrongSpas",
    example: "Label_529082710264521909",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SUPPLIERS_WATERWAYPLASTICS: {
    description: "Gmail label ID for Suppliers/WaterwayPlastics",
    example: "Label_3142429667638460093",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SUPPLIERS_COLD_PLUNGE_CO: {
    description: "Gmail label ID for Suppliers/Cold Plunge Co",
    example: "Label_1234567890123456789",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SUPPLIERS_SAUNA_SUPPLIERS: {
    description: "Gmail label ID for Suppliers/Sauna Suppliers",
    example: "Label_9876543210987654321",
    required: false,
    type: "string",
    category: "gmail_labels"
  },

  // Gmail Label Variables - Warranty Sub-labels
  LABEL_WARRANTY_CLAIMS: {
    description: "Gmail label ID for Warranty/Claims",
    example: "Label_111222333444555666",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_WARRANTY_PENDING_REVIEW: {
    description: "Gmail label ID for Warranty/Pending Review",
    example: "Label_222333444555666777",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_WARRANTY_RESOLVED: {
    description: "Gmail label ID for Warranty/Resolved",
    example: "Label_333444555666777888",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_WARRANTY_DENIED: {
    description: "Gmail label ID for Warranty/Denied",
    example: "Label_444555666777888999",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_WARRANTY_WARRANTY_PARTS: {
    description: "Gmail label ID for Warranty/Warranty Parts",
    example: "Label_555666777888999000",
    required: false,
    type: "string",
    category: "gmail_labels"
  },

  // Gmail Label Variables - Sales Sub-labels
  LABEL_SALES_NEW_SPA_SALES: {
    description: "Gmail label ID for Sales/New Spa Sales",
    example: "Label_666777888999000111",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SALES_CONSULTATIONS: {
    description: "Gmail label ID for Sales/Consultations",
    example: "Label_777888999000111222",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SALES_COLD_PLUNGE_SALES: {
    description: "Gmail label ID for Sales/Cold Plunge Sales",
    example: "Label_888999000111222333",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SALES_SAUNA_SALES: {
    description: "Gmail label ID for Sales/Sauna Sales",
    example: "Label_999000111222333444",
    required: false,
    type: "string",
    category: "gmail_labels"
  },
  LABEL_SALES_ACCESSORY_SALES: {
    description: "Gmail label ID for Sales/Accessory Sales",
    example: "Label_000111222333444555",
    required: false,
    type: "string",
    category: "gmail_labels"
  },

  // Database Configuration
  DB_PREFIX: {
    description: "Database table prefix for this business",
    example: "bluewave_",
    required: true,
    type: "string",
    category: "database"
  },
  DB_HOST: {
    description: "Database host URL",
    example: "mysql.bluewavepools.com",
    required: true,
    type: "string",
    category: "database"
  },
  DB_NAME: {
    description: "Database name",
    example: "bluewave_pools",
    required: true,
    type: "string",
    category: "database"
  },

  // AI Configuration
  AI_MODEL: {
    description: "AI model to use for email processing",
    example: "gpt-4o-mini",
    required: true,
    type: "string",
    category: "ai"
  },
  AI_MAX_TOKENS: {
    description: "Maximum tokens for AI responses",
    example: "2000",
    required: true,
    type: "number",
    category: "ai"
  },
  AI_TEMPERATURE: {
    description: "AI temperature setting",
    example: "0.7",
    required: true,
    type: "number",
    category: "ai"
  },

  // Business Configuration
  BUSINESS_TIMEZONE: {
    description: "Business timezone",
    example: "America/New_York",
    required: true,
    type: "string",
    category: "business"
  },
  BUSINESS_HOURS_START: {
    description: "Business hours start time",
    example: "08:00",
    required: true,
    type: "string",
    category: "business"
  },
  BUSINESS_HOURS_END: {
    description: "Business hours end time",
    example: "18:00",
    required: true,
    type: "string",
    category: "business"
  },

  // Service Areas
  SERVICE_AREA_PRIMARY: {
    description: "Primary service area",
    example: "Red Deer, Alberta",
    required: true,
    type: "string",
    category: "service"
  },
  SERVICE_AREA_SECONDARY: {
    description: "Secondary service areas",
    example: "Sylvan Lake, Leduc, Lacombe",
    required: false,
    type: "string",
    category: "service"
  },

  // Pricing Configuration
  SITE_INSPECTION_PRICE: {
    description: "Site inspection price",
    example: "105",
    required: true,
    type: "number",
    category: "pricing"
  },
  LABOUR_HOURLY_RATE: {
    description: "Labour hourly rate",
    example: "125",
    required: true,
    type: "number",
    category: "pricing"
  },
  MILEAGE_RATE: {
    description: "Mileage rate per km",
    example: "1.50",
    required: true,
    type: "number",
    category: "pricing"
  },
  DELIVERY_FEE: {
    description: "Delivery fee",
    example: "5",
    required: true,
    type: "number",
    category: "pricing"
  },
  HARMONY_TREATMENT_PRICE: {
    description: "Harmony treatment price",
    example: "39",
    required: true,
    type: "number",
    category: "pricing"
  }
};

/**
 * Helper Functions for n8n Environment Variables
 */

/**
 * Get all required environment variables
 * @returns {Array} Array of required variable names
 */
export function getRequiredEnvironmentVariables() {
  return Object.entries(poolsSpasN8nEnvironmentSchema)
    .filter(([_, config]) => config.required)
    .map(([name, _]) => name);
}

/**
 * Get environment variables by category
 * @param {string} category - Category name
 * @returns {Object} Environment variables in that category
 */
export function getEnvironmentVariablesByCategory(category) {
  return Object.fromEntries(
    Object.entries(poolsSpasN8nEnvironmentSchema)
      .filter(([_, config]) => config.category === category)
  );
}

/**
 * Get all Gmail label environment variables
 * @returns {Object} Gmail label environment variables
 */
export function getGmailLabelEnvironmentVariables() {
  return getEnvironmentVariablesByCategory('gmail_labels');
}

/**
 * Generate environment variables JSON for n8n deployment
 * @param {Object} labelMap - Label ID mapping from provisioning
 * @param {Object} businessData - Business configuration data
 * @returns {Object} Complete environment variables object
 */
export function generateCompleteEnvironmentVariables(
  labelMap: Record<string, string>,
  businessData: Record<string, any>
): Record<string, any> {
  const envVars = {};

  // Add Gmail label variables
  for (const [labelName, labelId] of Object.entries(labelMap)) {
    const envVarName = `LABEL_${labelName.replace(/\s+/g, '_').toUpperCase()}`;
    envVars[envVarName] = labelId;
  }

  // Add business data
  Object.assign(envVars, businessData);

  // Add default values for missing required variables
  const defaults = {
    AI_MODEL: "gpt-4o-mini",
    AI_MAX_TOKENS: 2000,
    AI_TEMPERATURE: 0.7,
    BUSINESS_TIMEZONE: "America/New_York",
    BUSINESS_HOURS_START: "08:00",
    BUSINESS_HOURS_END: "18:00",
    SITE_INSPECTION_PRICE: 105,
    LABOUR_HOURLY_RATE: 125,
    MILEAGE_RATE: 1.50,
    DELIVERY_FEE: 5,
    HARMONY_TREATMENT_PRICE: 39
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (!envVars[key]) {
      envVars[key] = value;
    }
  }

  return envVars;
}

/**
 * Validate environment variables for n8n deployment
 * @param {Object} envVars - Environment variables to validate
 * @returns {Object} Validation result with errors and warnings
 */
export function validateEnvironmentVariables(envVars: Record<string, any>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  const requiredVars = getRequiredEnvironmentVariables();
  for (const varName of requiredVars) {
    if (!envVars[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Check Gmail label variables
  const gmailLabels = getGmailLabelEnvironmentVariables();
  for (const [varName, config] of Object.entries(gmailLabels)) {
    if (config.required && !envVars[varName]) {
      errors.push(`Missing required Gmail label: ${varName}`);
    }
  }

  // Check data types
  for (const [varName, value] of Object.entries(envVars)) {
    const config = poolsSpasN8nEnvironmentSchema[varName];
    if (config) {
      if (config.type === 'number' && typeof value !== 'number') {
        warnings.push(`${varName} should be a number, got ${typeof value}`);
      }
      if (config.type === 'string' && typeof value !== 'string') {
        warnings.push(`${varName} should be a string, got ${typeof value}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Export default schema
export default poolsSpasN8nEnvironmentSchema;
