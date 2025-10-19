// Schema Validator Service - Integrity and Safety Layer
// This service validates schema integrity and provides safety checks

/**
 * Schema Validator Service
 * 
 * Provides comprehensive validation for label schemas including:
 * - Schema integrity checks
 * - Critical label protection
 * - Version compatibility validation
 * - Migration safety checks
 */

/**
 * Validation Result Interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  criticalIssues: string[];
  recommendations: string[];
}

/**
 * Schema Validator Service Class
 */
export class SchemaValidatorService {
  private static instance: SchemaValidatorService;

  private constructor() {}

  public static getInstance(): SchemaValidatorService {
    if (!SchemaValidatorService.instance) {
      SchemaValidatorService.instance = new SchemaValidatorService();
    }
    return SchemaValidatorService.instance;
  }

  /**
   * Validate schema integrity
   * @param {any} schema - Schema to validate
   * @param {string} businessType - Business type name
   * @returns {ValidationResult} Validation result
   */
  validateSchemaIntegrity(schema: any, businessType: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Check schema structure
    if (!schema || typeof schema !== 'object') {
      errors.push('Schema must be a valid object');
      return { isValid: false, errors, warnings, criticalIssues, recommendations };
    }

    const schemaLabels = Object.keys(schema);

    // Check for required critical labels
    const requiredCriticalLabels = ['BANKING', 'SERVICE', 'URGENT'];
    const missingCritical = requiredCriticalLabels.filter(label => !schemaLabels.includes(label));
    if (missingCritical.length > 0) {
      criticalIssues.push(`Missing required critical labels: ${missingCritical.join(', ')}`);
    }

    // Validate each label configuration
    for (const [labelName, config] of Object.entries(schema)) {
      this.validateLabelConfig(labelName, config as any, errors, warnings, criticalIssues);
    }

    // Check for duplicate intents
    const intents = Object.values(schema)
      .map((config: any) => config.intent)
      .filter(Boolean);
    const duplicateIntents = intents.filter((intent, index) => intents.indexOf(intent) !== index);
    if (duplicateIntents.length > 0) {
      warnings.push(`Duplicate intents found: ${[...new Set(duplicateIntents)].join(', ')}`);
    }

    // Check for missing n8n environment variables
    const missingEnvVars = schemaLabels.filter(labelName => {
      const config = schema[labelName];
      return !config.n8nEnvVar || !config.n8nEnvVar.startsWith('LABEL_');
    });
    if (missingEnvVars.length > 0) {
      warnings.push(`Labels missing proper n8n environment variables: ${missingEnvVars.join(', ')}`);
    }

    // Business-specific validations
    this.validateBusinessSpecificRules(schema, businessType, errors, warnings, criticalIssues);

    // Generate recommendations
    this.generateRecommendations(schema, businessType, recommendations);

    return {
      isValid: errors.length === 0 && criticalIssues.length === 0,
      errors,
      warnings,
      criticalIssues,
      recommendations
    };
  }

  /**
   * Validate individual label configuration
   * @param {string} labelName - Label name
   * @param {any} config - Label configuration
   * @param {string[]} errors - Error array
   * @param {string[]} warnings - Warning array
   * @param {string[]} criticalIssues - Critical issue array
   */
  private validateLabelConfig(
    labelName: string, 
    config: any, 
    errors: string[], 
    warnings: string[], 
    criticalIssues: string[]
  ): void {
    // Check required fields
    if (!config.description) {
      errors.push(`Label '${labelName}' missing description`);
    }

    if (!config.n8nEnvVar) {
      errors.push(`Label '${labelName}' missing n8nEnvVar`);
    }

    // Check color configuration
    if (config.color) {
      if (!config.color.backgroundColor || !config.color.textColor) {
        warnings.push(`Label '${labelName}' has incomplete color configuration`);
      }
    }

    // Check sub-labels
    if (config.sub && Array.isArray(config.sub)) {
      if (config.sub.length === 0) {
        warnings.push(`Label '${labelName}' has empty sub-labels array`);
      }

      // Check for duplicate sub-labels
      const duplicateSubs = config.sub.filter((sub: string, index: number) => 
        config.sub.indexOf(sub) !== index
      );
      if (duplicateSubs.length > 0) {
        errors.push(`Label '${labelName}' has duplicate sub-labels: ${duplicateSubs.join(', ')}`);
      }
    }

    // Check nested labels
    if (config.nested && typeof config.nested === 'object') {
      for (const [subName, nestedLabels] of Object.entries(config.nested)) {
        if (!Array.isArray(nestedLabels)) {
          errors.push(`Label '${labelName}' nested config for '${subName}' must be an array`);
        } else if (nestedLabels.length === 0) {
          warnings.push(`Label '${labelName}' has empty nested labels for '${subName}'`);
        }
      }
    }

    // Check critical label configuration
    if (config.critical === true) {
      if (!config.intent) {
        warnings.push(`Critical label '${labelName}' should have an intent for AI routing`);
      }
    }

    // Check intent format
    if (config.intent && !config.intent.startsWith('ai.')) {
      warnings.push(`Label '${labelName}' intent should start with 'ai.': ${config.intent}`);
    }
  }

  /**
   * Validate business-specific rules
   * @param {any} schema - Schema to validate
   * @param {string} businessType - Business type name
   * @param {string[]} errors - Error array
   * @param {string[]} warnings - Warning array
   * @param {string[]} criticalIssues - Critical issue array
   */
  private validateBusinessSpecificRules(
    schema: any, 
    businessType: string, 
    errors: string[], 
    warnings: string[], 
    criticalIssues: string[]
  ): void {
    switch (businessType) {
      case 'Pools & Spas':
        this.validatePoolsSpasRules(schema, errors, warnings, criticalIssues);
        break;
      case 'HVAC':
        this.validateHVACRules(schema, errors, warnings, criticalIssues);
        break;
      case 'Electrician':
        this.validateElectricianRules(schema, errors, warnings, criticalIssues);
        break;
      default:
        warnings.push(`No specific validation rules defined for business type: ${businessType}`);
    }
  }

  /**
   * Validate Pools & Spas specific rules
   * @param {any} schema - Schema to validate
   * @param {string[]} errors - Error array
   * @param {string[]} warnings - Warning array
   * @param {string[]} criticalIssues - Critical issue array
   */
  private validatePoolsSpasRules(schema: any, errors: string[], warnings: string[], criticalIssues: string[]): void {
    const requiredSuppliers = ['StrongSpas', 'WaterwayPlastics', 'AquaSpaPoolSupply'];
    const suppliersConfig = schema.SUPPLIERS;
    
    if (suppliersConfig && suppliersConfig.sub) {
      const missingSuppliers = requiredSuppliers.filter(supplier => 
        !suppliersConfig.sub.includes(supplier)
      );
      if (missingSuppliers.length > 0) {
        warnings.push(`Missing recommended suppliers: ${missingSuppliers.join(', ')}`);
      }
    }

    // Check for water care specific labels
    const serviceConfig = schema.SERVICE;
    if (serviceConfig && serviceConfig.sub) {
      if (!serviceConfig.sub.includes('Water Care Visits')) {
        warnings.push('Pools & Spas should include Water Care Visits in SERVICE sub-labels');
      }
    }
  }

  /**
   * Validate HVAC specific rules
   * @param {any} schema - Schema to validate
   * @param {string[]} errors - Error array
   * @param {string[]} warnings - Warning array
   * @param {string[]} criticalIssues - Critical issue array
   */
  private validateHVACRules(schema: any, errors: string[], warnings: string[], criticalIssues: string[]): void {
    const serviceConfig = schema.SERVICE;
    if (serviceConfig && serviceConfig.sub) {
      const requiredHVACServices = ['Heating', 'Cooling', 'Maintenance'];
      const missingServices = requiredHVACServices.filter(service => 
        !serviceConfig.sub.some((sub: string) => sub.toLowerCase().includes(service.toLowerCase()))
      );
      if (missingServices.length > 0) {
        warnings.push(`Missing recommended HVAC services: ${missingServices.join(', ')}`);
      }
    }
  }

  /**
   * Validate Electrician specific rules
   * @param {any} schema - Schema to validate
   * @param {string[]} errors - Error array
   * @param {string[]} warnings - Warning array
   * @param {string[]} criticalIssues - Critical issue array
   */
  private validateElectricianRules(schema: any, errors: string[], warnings: string[], criticalIssues: string[]): void {
    const serviceConfig = schema.SERVICE;
    if (serviceConfig && serviceConfig.sub) {
      const requiredElectricianServices = ['Emergency', 'Installation', 'Repair'];
      const missingServices = requiredElectricianServices.filter(service => 
        !serviceConfig.sub.some((sub: string) => sub.toLowerCase().includes(service.toLowerCase()))
      );
      if (missingServices.length > 0) {
        warnings.push(`Missing recommended Electrician services: ${missingServices.join(', ')}`);
      }
    }
  }

  /**
   * Generate recommendations based on schema analysis
   * @param {any} schema - Schema to analyze
   * @param {string} businessType - Business type name
   * @param {string[]} recommendations - Recommendations array
   */
  private generateRecommendations(schema: any, businessType: string, recommendations: string[]): void {
    const schemaLabels = Object.keys(schema);
    const criticalLabels = schemaLabels.filter(label => schema[label].critical === true);
    const labelsWithIntents = schemaLabels.filter(label => schema[label].intent);

    // Intent coverage recommendations
    const intentCoverage = (labelsWithIntents.length / schemaLabels.length) * 100;
    if (intentCoverage < 80) {
      recommendations.push(`Consider adding AI intents to more labels (current coverage: ${Math.round(intentCoverage)}%)`);
    }

    // Critical label recommendations
    if (criticalLabels.length < 3) {
      recommendations.push('Consider marking more labels as critical for better data protection');
    }

    // Sub-label recommendations
    const labelsWithoutSubs = schemaLabels.filter(label => !schema[label].sub || schema[label].sub.length === 0);
    if (labelsWithoutSubs.length > schemaLabels.length * 0.5) {
      recommendations.push('Consider adding sub-labels to improve organization');
    }

    // Business-specific recommendations
    if (businessType === 'Pools & Spas') {
      if (!schemaLabels.includes('COLD_PLUNGE') && !schemaLabels.includes('SAUNA')) {
        recommendations.push('Consider adding Cold Plunge and Sauna specific labels for Pools & Spas');
      }
    }
  }

  /**
   * Validate schema migration safety
   * @param {any} oldSchema - Old schema version
   * @param {any} newSchema - New schema version
   * @returns {ValidationResult} Migration validation result
   */
  validateMigrationSafety(oldSchema: any, newSchema: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    const oldLabels = Object.keys(oldSchema);
    const newLabels = Object.keys(newSchema);

    // Check for removed critical labels
    const oldCriticalLabels = oldLabels.filter(label => oldSchema[label].critical === true);
    const newCriticalLabels = newLabels.filter(label => newSchema[label].critical === true);
    const removedCritical = oldCriticalLabels.filter(label => !newLabels.includes(label));
    
    if (removedCritical.length > 0) {
      criticalIssues.push(`Critical labels removed in migration: ${removedCritical.join(', ')}`);
    }

    // Check for changed critical label configurations
    const changedCritical = oldCriticalLabels.filter(label => {
      if (!newLabels.includes(label)) return false;
      const oldConfig = oldSchema[label];
      const newConfig = newSchema[label];
      return oldConfig.critical !== newConfig.critical;
    });

    if (changedCritical.length > 0) {
      warnings.push(`Critical status changed for labels: ${changedCritical.join(', ')}`);
    }

    // Check for removed intents
    const oldIntents = oldLabels.map(label => oldSchema[label].intent).filter(Boolean);
    const newIntents = newLabels.map(label => newSchema[label].intent).filter(Boolean);
    const removedIntents = oldIntents.filter(intent => !newIntents.includes(intent));
    
    if (removedIntents.length > 0) {
      warnings.push(`AI intents removed: ${removedIntents.join(', ')}`);
    }

    // Check for breaking changes in n8n environment variables
    const changedEnvVars = oldLabels.filter(label => {
      if (!newLabels.includes(label)) return false;
      return oldSchema[label].n8nEnvVar !== newSchema[label].n8nEnvVar;
    });

    if (changedEnvVars.length > 0) {
      criticalIssues.push(`Breaking change: n8n environment variables changed for: ${changedEnvVars.join(', ')}`);
    }

    return {
      isValid: errors.length === 0 && criticalIssues.length === 0,
      errors,
      warnings,
      criticalIssues,
      recommendations
    };
  }

  /**
   * Protect critical labels during sync operations
   * @param {string[]} existingLabels - Existing label names
   * @param {any} schema - Schema to validate against
   * @returns {Object} Protection result
   */
  protectCriticalLabels(existingLabels: string[], schema: any): {
    protected: string[];
    missing: string[];
    safeToDelete: string[];
  } {
    const criticalLabels = Object.keys(schema).filter(label => schema[label].critical === true);
    const protectedLabels = existingLabels.filter(label => criticalLabels.includes(label));
    const missingCritical = criticalLabels.filter(label => !existingLabels.includes(label));
    const safeToDelete = existingLabels.filter(label => !criticalLabels.includes(label));

    return {
      protected: protectedLabels,
      missing: missingCritical,
      safeToDelete
    };
  }

  /**
   * Validate n8n environment variable mapping
   * @param {any} schema - Schema to validate
   * @param {Record<string, string>} envVars - Environment variables
   * @returns {ValidationResult} Validation result
   */
  validateN8nEnvironmentMapping(schema: any, envVars: Record<string, string>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    const schemaLabels = Object.keys(schema);

    // Check for missing environment variables
    const missingEnvVars = schemaLabels.filter(labelName => {
      const config = schema[labelName];
      const expectedVar = config.n8nEnvVar?.replace('{{$env.', '').replace('}}', '');
      return expectedVar && !envVars[expectedVar];
    });

    if (missingEnvVars.length > 0) {
      criticalIssues.push(`Missing n8n environment variables for labels: ${missingEnvVars.join(', ')}`);
    }

    // Check for extra environment variables
    const schemaEnvVars = schemaLabels.map(labelName => {
      const config = schema[labelName];
      return config.n8nEnvVar?.replace('{{$env.', '').replace('}}', '');
    }).filter(Boolean);

    const extraEnvVars = Object.keys(envVars).filter(envVar => 
      !schemaEnvVars.includes(envVar)
    );

    if (extraEnvVars.length > 0) {
      warnings.push(`Extra n8n environment variables found: ${extraEnvVars.join(', ')}`);
    }

    return {
      isValid: errors.length === 0 && criticalIssues.length === 0,
      errors,
      warnings,
      criticalIssues,
      recommendations
    };
  }
}

/**
 * Convenience functions for easy usage
 */

/**
 * Validate schema integrity (convenience function)
 * @param {any} schema - Schema to validate
 * @param {string} businessType - Business type name
 * @returns {ValidationResult} Validation result
 */
export function validateSchemaIntegrity(schema, businessType) {
  const validator = SchemaValidatorService.getInstance();
  return validator.validateSchemaIntegrity(schema, businessType);
}

/**
 * Validate migration safety (convenience function)
 * @param {any} oldSchema - Old schema version
 * @param {any} newSchema - New schema version
 * @returns {ValidationResult} Migration validation result
 */
export function validateMigrationSafety(oldSchema, newSchema) {
  const validator = SchemaValidatorService.getInstance();
  return validator.validateMigrationSafety(oldSchema, newSchema);
}

/**
 * Protect critical labels (convenience function)
 * @param {string[]} existingLabels - Existing label names
 * @param {any} schema - Schema to validate against
 * @returns {Object} Protection result
 */
export function protectCriticalLabels(existingLabels: string[], schema: any) {
  const validator = SchemaValidatorService.getInstance();
  return validator.protectCriticalLabels(existingLabels, schema);
}

// Export default instance
export default SchemaValidatorService.getInstance();
