// n8n Environment Generator - Deployment Helper
// This service generates environment variable mappings for n8n workflow deployment

/**
 * n8n Environment Generator Service
 * 
 * Generates environment variable mappings for n8n workflow deployment.
 * Handles dynamic environment variable creation, validation, and injection.
 */

/**
 * Environment Generation Result Interface
 */
export interface EnvironmentGenerationResult {
  success: boolean;
  environmentVariables: Record<string, string>;
  labelMapping: Record<string, string>;
  errors: string[];
  warnings: string[];
  statistics: {
    totalVariables: number;
    labelVariables: number;
    businessVariables: number;
    aiVariables: number;
    databaseVariables: number;
  };
}

/**
 * n8n Environment Generator Service Class
 */
export class N8nEnvironmentGeneratorService {
  private static instance: N8nEnvironmentGeneratorService;

  private constructor() {}

  public static getInstance(): N8nEnvironmentGeneratorService {
    if (!N8nEnvironmentGeneratorService.instance) {
      N8nEnvironmentGeneratorService.instance = new N8nEnvironmentGeneratorService();
    }
    return N8nEnvironmentGeneratorService.instance;
  }

  /**
   * Generate complete environment variables for n8n deployment
   * @param {any} schema - Label schema
   * @param {Record<string, string>} labelMap - Label ID mapping
   * @param {Record<string, any>} businessData - Business configuration data
   * @param {string} businessType - Business type name
   * @returns {EnvironmentGenerationResult} Generation result
   */
  generateEnvironmentVariables(
    schema: any,
    labelMap: Record<string, string>,
    businessData: Record<string, any>,
    businessType: string
  ): EnvironmentGenerationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const environmentVariables: Record<string, string> = {};
    const labelMapping: Record<string, string> = {};

    try {
      // Generate label environment variables
      const labelEnvVars = this.generateLabelEnvironmentVariables(schema, labelMap);
      Object.assign(environmentVariables, labelEnvVars.variables);
      Object.assign(labelMapping, labelEnvVars.mapping);

      if (labelEnvVars.errors.length > 0) {
        errors.push(...labelEnvVars.errors);
      }
      if (labelEnvVars.warnings.length > 0) {
        warnings.push(...labelEnvVars.warnings);
      }

      // Generate business environment variables
      const businessEnvVars = this.generateBusinessEnvironmentVariables(businessData, businessType);
      Object.assign(environmentVariables, businessEnvVars.variables);

      if (businessEnvVars.errors.length > 0) {
        errors.push(...businessEnvVars.errors);
      }
      if (businessEnvVars.warnings.length > 0) {
        warnings.push(...businessEnvVars.warnings);
      }

      // Generate AI environment variables
      const aiEnvVars = this.generateAIEnvironmentVariables(businessType);
      Object.assign(environmentVariables, aiEnvVars.variables);

      // Generate database environment variables
      const dbEnvVars = this.generateDatabaseEnvironmentVariables(businessData);
      Object.assign(environmentVariables, dbEnvVars.variables);

      // Calculate statistics
      const statistics = this.calculateStatistics(environmentVariables);

      return {
        success: errors.length === 0,
        environmentVariables,
        labelMapping,
        errors,
        warnings,
        statistics
      };

    } catch (error) {
      console.error('❌ Error generating environment variables:', error);
      return {
        success: false,
        environmentVariables: {},
        labelMapping: {},
        errors: [`Failed to generate environment variables: ${error.message}`],
        warnings: [],
        statistics: {
          totalVariables: 0,
          labelVariables: 0,
          businessVariables: 0,
          aiVariables: 0,
          databaseVariables: 0
        }
      };
    }
  }

  /**
   * Generate label environment variables
   * @param {any} schema - Label schema
   * @param {Record<string, string>} labelMap - Label ID mapping
   * @returns {Object} Label environment variables result
   */
  private generateLabelEnvironmentVariables(schema: any, labelMap: Record<string, string>): {
    variables: Record<string, string>;
    mapping: Record<string, string>;
    errors: string[];
    warnings: string[];
  } {
    const variables: Record<string, string> = {};
    const mapping: Record<string, string> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [labelName, config] of Object.entries(schema)) {
      const labelConfig = config as any;

      // Generate parent label environment variable
      if (labelConfig.n8nEnvVar) {
        const envVarName = labelConfig.n8nEnvVar.replace('{{$env.', '').replace('}}', '');
        const labelId = labelMap[labelName];

        if (labelId) {
          variables[envVarName] = labelId;
          mapping[labelName] = labelId;
        } else {
          errors.push(`Missing label ID for ${labelName}`);
        }
      }

      // Generate sub-label environment variables
      if (labelConfig.sub && Array.isArray(labelConfig.sub)) {
        for (const subLabelName of labelConfig.sub) {
          const subEnvVarName = `LABEL_${labelName}_${subLabelName.replace(/\s+/g, '_').toUpperCase()}`;
          const subLabelId = labelMap[`${labelName}/${subLabelName}`];

          if (subLabelId) {
            variables[subEnvVarName] = subLabelId;
            mapping[`${labelName}/${subLabelName}`] = subLabelId;
          } else {
            warnings.push(`Missing sub-label ID for ${labelName}/${subLabelName}`);
          }
        }
      }

      // Generate nested label environment variables
      if (labelConfig.nested && typeof labelConfig.nested === 'object') {
        for (const [subName, nestedLabels] of Object.entries(labelConfig.nested)) {
          if (Array.isArray(nestedLabels)) {
            for (const nestedLabelName of nestedLabels) {
              const nestedEnvVarName = `LABEL_${labelName}_${subName}_${nestedLabelName.replace(/\s+/g, '_').toUpperCase()}`;
              const nestedLabelId = labelMap[`${labelName}/${subName}/${nestedLabelName}`];

              if (nestedLabelId) {
                variables[nestedEnvVarName] = nestedLabelId;
                mapping[`${labelName}/${subName}/${nestedLabelName}`] = nestedLabelId;
              } else {
                warnings.push(`Missing nested label ID for ${labelName}/${subName}/${nestedLabelName}`);
              }
            }
          }
        }
      }
    }

    return { variables, mapping, errors, warnings };
  }

  /**
   * Generate business environment variables
   * @param {Record<string, any>} businessData - Business configuration data
   * @param {string} businessType - Business type name
   * @returns {Object} Business environment variables result
   */
  private generateBusinessEnvironmentVariables(businessData: Record<string, any>, businessType: string): {
    variables: Record<string, string>;
    errors: string[];
    warnings: string[];
  } {
    const variables: Record<string, string> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required business variables
    const requiredBusinessVars = {
      BUSINESS_NAME: businessData.businessName || businessData.name || '',
      BUSINESS_URL: businessData.businessUrl || businessData.website || '',
      BUSINESS_PHONE: businessData.businessPhone || businessData.phone || '',
      BUSINESS_EMAIL: businessData.businessEmail || businessData.email || '',
      BUSINESS_TIMEZONE: businessData.timezone || 'America/New_York',
      BUSINESS_HOURS_START: businessData.hoursStart || '08:00',
      BUSINESS_HOURS_END: businessData.hoursEnd || '18:00'
    };

    // Check for missing required variables
    for (const [key, value] of Object.entries(requiredBusinessVars)) {
      if (!value) {
        errors.push(`Missing required business variable: ${key}`);
      } else {
        variables[key] = value;
      }
    }

    // Service area variables
    if (businessData.serviceArea) {
      variables.SERVICE_AREA_PRIMARY = businessData.serviceArea.primary || '';
      if (businessData.serviceArea.secondary) {
        variables.SERVICE_AREA_SECONDARY = businessData.serviceArea.secondary;
      }
    }

    // Pricing variables
    const pricingDefaults = {
      SITE_INSPECTION_PRICE: '105',
      LABOUR_HOURLY_RATE: '125',
      MILEAGE_RATE: '1.50',
      DELIVERY_FEE: '5',
      HARMONY_TREATMENT_PRICE: '39'
    };

    if (businessData.pricing) {
      Object.assign(variables, businessData.pricing);
    } else {
      Object.assign(variables, pricingDefaults);
    }

    return { variables, errors, warnings };
  }

  /**
   * Generate AI environment variables
   * @param {string} businessType - Business type name
   * @returns {Object} AI environment variables result
   */
  private generateAIEnvironmentVariables(businessType: string): {
    variables: Record<string, string>;
    errors: string[];
    warnings: string[];
  } {
    const variables: Record<string, string> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // AI model configuration
    variables.AI_MODEL = 'gpt-4o-mini';
    variables.AI_MAX_TOKENS = '2000';
    variables.AI_TEMPERATURE = '0.7';

    // Business-specific AI configuration
    switch (businessType) {
      case 'Pools & Spas':
        variables.AI_TONE = 'Friendly';
        variables.AI_URGENT_KEYWORDS = 'urgent,emergency,leaking,pump not working,heater error,no power';
        break;
      case 'HVAC':
        variables.AI_TONE = 'Friendly';
        variables.AI_URGENT_KEYWORDS = 'urgent,emergency,no heat,no cooling,broken ac,furnace not working';
        break;
      case 'Electrician':
        variables.AI_TONE = 'Professional';
        variables.AI_URGENT_KEYWORDS = 'urgent,emergency,no power,tripping breaker,sparking,electrical hazard';
        break;
      default:
        variables.AI_TONE = 'Professional';
        variables.AI_URGENT_KEYWORDS = 'urgent,emergency';
    }

    return { variables, errors, warnings };
  }

  /**
   * Generate database environment variables
   * @param {Record<string, any>} businessData - Business configuration data
   * @returns {Object} Database environment variables result
   */
  private generateDatabaseEnvironmentVariables(businessData: Record<string, any>): {
    variables: Record<string, string>;
    errors: string[];
    warnings: string[];
  } {
    const variables: Record<string, string> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    // Database configuration
    if (businessData.database) {
      variables.DB_PREFIX = businessData.database.prefix || '';
      variables.DB_HOST = businessData.database.host || '';
      variables.DB_NAME = businessData.database.name || '';
    } else {
      // Generate default database prefix from business name
      const businessName = businessData.businessName || businessData.name || 'business';
      const prefix = businessName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      variables.DB_PREFIX = `${prefix}_`;
      variables.DB_HOST = '';
      variables.DB_NAME = '';
    }

    return { variables, errors, warnings };
  }

  /**
   * Calculate environment variable statistics
   * @param {Record<string, string>} envVars - Environment variables
   * @returns {Object} Statistics
   */
  private calculateStatistics(envVars: Record<string, string>): {
    totalVariables: number;
    labelVariables: number;
    businessVariables: number;
    aiVariables: number;
    databaseVariables: number;
  } {
    const totalVariables = Object.keys(envVars).length;
    const labelVariables = Object.keys(envVars).filter(key => key.startsWith('LABEL_')).length;
    const businessVariables = Object.keys(envVars).filter(key => key.startsWith('BUSINESS_')).length;
    const aiVariables = Object.keys(envVars).filter(key => key.startsWith('AI_')).length;
    const databaseVariables = Object.keys(envVars).filter(key => key.startsWith('DB_')).length;

    return {
      totalVariables,
      labelVariables,
      businessVariables,
      aiVariables,
      databaseVariables
    };
  }

  /**
   * Generate n8n environment template
   * @param {any} schema - Label schema
   * @returns {Record<string, string>} Environment template
   */
  generateEnvironmentTemplate(schema: any): Record<string, string> {
    const template: Record<string, string> = {};

    // Generate template for all schema labels
    for (const [labelName, config] of Object.entries(schema)) {
      const labelConfig = config as any;

      if (labelConfig.n8nEnvVar) {
        const envVarName = labelConfig.n8nEnvVar.replace('{{$env.', '').replace('}}', '');
        template[envVarName] = '';
      }

      // Add sub-label templates
      if (labelConfig.sub && Array.isArray(labelConfig.sub)) {
        for (const subLabelName of labelConfig.sub) {
          const subEnvVarName = `LABEL_${labelName}_${subLabelName.replace(/\s+/g, '_').toUpperCase()}`;
          template[subEnvVarName] = '';
        }
      }

      // Add nested label templates
      if (labelConfig.nested && typeof labelConfig.nested === 'object') {
        for (const [subName, nestedLabels] of Object.entries(labelConfig.nested)) {
          if (Array.isArray(nestedLabels)) {
            for (const nestedLabelName of nestedLabels) {
              const nestedEnvVarName = `LABEL_${labelName}_${subName}_${nestedLabelName.replace(/\s+/g, '_').toUpperCase()}`;
              template[nestedEnvVarName] = '';
            }
          }
        }
      }
    }

    // Add standard business variables
    const standardBusinessVars = [
      'BUSINESS_NAME', 'BUSINESS_URL', 'BUSINESS_PHONE', 'BUSINESS_EMAIL',
      'BUSINESS_TIMEZONE', 'BUSINESS_HOURS_START', 'BUSINESS_HOURS_END',
      'SERVICE_AREA_PRIMARY', 'SERVICE_AREA_SECONDARY',
      'SITE_INSPECTION_PRICE', 'LABOUR_HOURLY_RATE', 'MILEAGE_RATE',
      'DELIVERY_FEE', 'HARMONY_TREATMENT_PRICE',
      'AI_MODEL', 'AI_MAX_TOKENS', 'AI_TEMPERATURE', 'AI_TONE',
      'AI_URGENT_KEYWORDS', 'DB_PREFIX', 'DB_HOST', 'DB_NAME'
    ];

    for (const varName of standardBusinessVars) {
      template[varName] = '';
    }

    return template;
  }

  /**
   * Validate environment variables for n8n deployment
   * @param {Record<string, string>} envVars - Environment variables
   * @param {any} schema - Label schema
   * @returns {Object} Validation result
   */
  validateEnvironmentVariables(envVars: Record<string, string>, schema: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    missing: string[];
    extra: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missing: string[] = [];
    const extra: string[] = [];

    // Generate expected environment variables
    const template = this.generateEnvironmentTemplate(schema);
    const expectedVars = Object.keys(template);

    // Check for missing variables
    for (const expectedVar of expectedVars) {
      if (!envVars[expectedVar]) {
        missing.push(expectedVar);
      }
    }

    // Check for extra variables
    for (const envVar of Object.keys(envVars)) {
      if (!expectedVars.includes(envVar)) {
        extra.push(envVar);
      }
    }

    // Check for empty required variables
    const requiredVars = ['BUSINESS_NAME', 'BUSINESS_URL', 'BUSINESS_PHONE'];
    for (const requiredVar of requiredVars) {
      if (!envVars[requiredVar] || envVars[requiredVar].trim() === '') {
        errors.push(`Required variable ${requiredVar} is empty`);
      }
    }

    // Check label variables
    const labelVars = Object.keys(envVars).filter(key => key.startsWith('LABEL_'));
    for (const labelVar of labelVars) {
      if (!envVars[labelVar] || envVars[labelVar].trim() === '') {
        warnings.push(`Label variable ${labelVar} is empty`);
      }
    }

    if (missing.length > 0) {
      errors.push(`Missing environment variables: ${missing.join(', ')}`);
    }

    if (extra.length > 0) {
      warnings.push(`Extra environment variables: ${extra.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missing,
      extra
    };
  }
}

/**
 * Convenience functions for easy usage
 */

/**
 * Generate environment variables (convenience function)
 * @param {any} schema - Label schema
 * @param {Record<string, string>} labelMap - Label ID mapping
 * @param {Record<string, any>} businessData - Business configuration data
 * @param {string} businessType - Business type name
 * @returns {EnvironmentGenerationResult} Generation result
 */
export function generateEnvironmentVariables(
  schema: any,
  labelMap: Record<string, string>,
  businessData: Record<string, any>,
  businessType: string
): EnvironmentGenerationResult {
  const generator = N8nEnvironmentGeneratorService.getInstance();
  return generator.generateEnvironmentVariables(schema, labelMap, businessData, businessType);
}

/**
 * Generate environment template (convenience function)
 * @param {any} schema - Label schema
 * @returns {Record<string, string>} Environment template
 */
export function generateEnvironmentTemplate(schema) {
  const generator = N8nEnvironmentGeneratorService.getInstance();
  return generator.generateEnvironmentTemplate(schema);
}

/**
 * Validate environment variables (convenience function)
 * @param {Record<string, string>} envVars - Environment variables
 * @param {any} schema - Label schema
 * @returns {Object} Validation result
 */
export function validateEnvironmentVariables(envVars: Record<string, string>, schema: any) {
  const generator = N8nEnvironmentGeneratorService.getInstance();
  return generator.validateEnvironmentVariables(envVars, schema);
}

// Export default instance
export default N8nEnvironmentGeneratorService.getInstance();
