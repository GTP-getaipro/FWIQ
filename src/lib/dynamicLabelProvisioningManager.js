// Dynamic Label Provisioning System - AI JSON Schema Integration
// This system uses AI JSON schemas to dynamically provision labels for any business type
// Replaces the static pools_spas system with a flexible, schema-driven approach

import { AIJsonSchemaLoader, loadBusinessSchema } from './aiJsonSchemaLoader.js';

/**
 * Dynamic Label Provisioning Manager
 * 
 * This class handles label provisioning using AI JSON schemas for any business type.
 * It replaces the static pools_spas system with a flexible, schema-driven approach.
 */
export class DynamicLabelProvisioningManager {
  constructor(businessType, schemaLoader) {
    this.businessType = businessType;
    this.schemaLoader = schemaLoader || new AIJsonSchemaLoader();
  }

  /**
   * Initialize the provisioning manager with a business type schema
   * @returns Promise<void>
   */
  async initialize() {
    this.schema = await this.schemaLoader.loadSchema(this.businessType);
  }

  /**
   * Get label schema for the current business type
   * @returns object - Label schema
   */
  getLabelSchema() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    return this.schema.labelSchema;
  }

  /**
   * Get label colors for the current business type
   * @returns Record<string, { backgroundColor: string; textColor: string }> - Label colors
   */
  getLabelColors() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    return this.schema.labelSchema.colors;
  }

  /**
   * Get provisioning order for the current business type
   * @returns string[] - Provisioning order
   */
  getProvisioningOrder() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    return this.schema.labelSchema.provisioningOrder;
  }

  /**
   * Get category groups for the current business type
   * @returns Record<string, string[]> - Category groups
   */
  getCategoryGroups() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    return this.schema.labelSchema.categoryGroups;
  }

  /**
   * Get all labels for the current business type
   * @returns Record<string, object> - All labels
   */
  getAllLabels() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    return this.schema.labelSchema.labels;
  }

  /**
   * Get critical labels for the current business type
   * @returns string[] - Critical label names
   */
  getCriticalLabels() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    
    return Object.entries(this.schema.labelSchema.labels)
      .filter(([_, config]) => config.critical === true)
      .map(([name, _]) => name);
  }

  /**
   * Get labels by category group
   * @param groupName - Category group name
   * @returns string[] - Label names in the group
   */
  getLabelsByCategoryGroup(groupName) {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    
    const categoryGroups = this.schema.labelSchema.categoryGroups;
    return categoryGroups[groupName] || [];
  }

  /**
   * Get labels by AI intent
   * @param intent - AI intent string
   * @returns string[] - Label names matching the intent
   */
  getLabelsByIntent(intent) {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    
    return Object.entries(this.schema.labelSchema.labels)
      .filter(([_, config]) => config.intent === intent)
      .map(([name, _]) => name);
  }

  /**
   * Get sub-labels for a parent label
   * @param parentLabel - Parent label name
   * @returns string[] - Sub-label names
   */
  getSubLabels(parentLabel) {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    
    const config = this.schema.labelSchema.labels[parentLabel];
    return config?.sub || [];
  }

  /**
   * Get nested labels for a specific sub-label
   * @param parentLabel - Parent label name
   * @param subLabel - Sub-label name
   * @returns string[] - Nested label names
   */
  getNestedLabels(parentLabel, subLabel) {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    
    const config = this.schema.labelSchema.labels[parentLabel];
    return config?.nested?.[subLabel] || [];
  }

  /**
   * Get n8n environment variable for a label
   * @param labelName - Label name
   * @returns string | null - Environment variable or null if not found
   */
  getN8nEnvVar(labelName) {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }
    
    const config = this.schema.labelSchema.labels[labelName];
    return config?.n8nEnvVar || null;
  }

  /**
   * Convert schema to standard labels format for FolderIntegrationManager
   * @returns Array - Standard labels array compatible with existing system
   */
  convertToStandardLabels() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    const standardLabels = [];
    const labels = this.schema.labelSchema.labels;

    for (const [parentName, config] of Object.entries(labels)) {
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
   * @param labelMap - Label ID mapping from provisioning
   * @returns Record<string, string> - Environment variables object for n8n
   */
  generateN8nEnvironmentVariables(labelMap) {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    const envVars = {};
    const labels = this.schema.labelSchema.labels;

    // Map each label to its environment variable
    for (const [labelName, labelId] of Object.entries(labelMap)) {
      const config = labels[labelName];
      if (config && config.n8nEnvVar) {
        envVars[config.n8nEnvVar] = labelId;
      }
    }

    return envVars;
  }

  /**
   * Compare existing label map with schema to detect missing or extra labels
   * @param existingLabels - Array of existing label names
   * @returns object - Comparison result with missing and extra labels
   */
  diffLabelSchema(existingLabels) {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    const defined = Object.keys(this.schema.labelSchema.labels);
    const missing = defined.filter(label => !existingLabels.includes(label));
    const extras = existingLabels.filter(label => !defined.includes(label));
    
    // Check for critical missing labels
    const criticalMissing = missing.filter(label => {
      const config = this.schema.labelSchema.labels[label];
      return config?.critical === true;
    });

    return { missing, extras, criticalMissing };
  }

  /**
   * Get schema statistics
   * @returns object - Schema statistics
   */
  getSchemaStatistics() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    const labels = Object.values(this.schema.labelSchema.labels);
    const intents = new Set(labels.map(l => l.intent).filter(Boolean));
    
    return {
      totalLabels: Object.keys(this.schema.labelSchema.labels).length,
      criticalLabels: labels.filter(l => l.critical === true).length,
      labelsWithSub: labels.filter(l => l.sub && l.sub.length > 0).length,
      labelsWithNested: labels.filter(l => l.nested && Object.keys(l.nested).length > 0).length,
      categoryGroups: Object.keys(this.schema.labelSchema.categoryGroups).length,
      intents: intents.size
    };
  }

  /**
   * Validate schema integrity
   * @returns object - Validation result
   */
  validateSchemaIntegrity() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    const errors = [];
    const warnings = [];

    // Check provisioning order includes all labels
    const schemaLabels = Object.keys(this.schema.labelSchema.labels);
    const orderLabels = this.schema.labelSchema.provisioningOrder;
    
    const missingInOrder = schemaLabels.filter(label => !orderLabels.includes(label));
    const extraInOrder = orderLabels.filter(label => !schemaLabels.includes(label));
    
    if (missingInOrder.length > 0) {
      errors.push(`Labels missing from provisioning order: ${missingInOrder.join(', ')}`);
    }
    
    if (extraInOrder.length > 0) {
      warnings.push(`Extra labels in provisioning order: ${extraInOrder.join(', ')}`);
    }

    // Check category groups include valid labels
    for (const [groupName, labels] of Object.entries(this.schema.labelSchema.categoryGroups)) {
      const invalidLabels = labels.filter(label => !schemaLabels.includes(label));
      if (invalidLabels.length > 0) {
        errors.push(`Category group '${groupName}' contains invalid labels: ${invalidLabels.join(', ')}`);
      }
    }

    // Check for duplicate intents
    const intents = Object.values(this.schema.labelSchema.labels)
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
   * Get business type information
   * @returns object - Business type information
   */
  getBusinessTypeInfo() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    return {
      businessType: this.schema.businessType,
      displayName: this.schema.displayName,
      description: this.schema.description,
      industry: this.schema.metadata.industry,
      primaryServices: this.schema.metadata.primaryServices,
      targetCustomers: this.schema.metadata.targetCustomers,
      seasonality: this.schema.metadata.seasonality,
      emergencyServices: this.schema.metadata.emergencyServices,
      warrantyServices: this.schema.metadata.warrantyServices,
      supplierDependent: this.schema.metadata.supplierDependent
    };
  }

  /**
   * Get AI configuration
   * @returns object - AI configuration
   */
  getAIConfiguration() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    return this.schema.aiConfiguration;
  }

  /**
   * Get intent mapping
   * @returns Record<string, string> - Intent mapping
   */
  getIntentMapping() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    return this.schema.intentMapping;
  }

  /**
   * Get keywords
   * @returns object - Keywords object
   */
  getKeywords() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    return this.schema.keywords;
  }

  /**
   * Get dynamic variables
   * @returns object - Dynamic variables
   */
  getDynamicVariables() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    return this.schema.dynamicVariables;
  }

  /**
   * Get escalation rules
   * @returns object - Escalation rules
   */
  getEscalationRules() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    return this.schema.escalationRules;
  }

  /**
   * Get AI prompts
   * @returns object - AI prompts
   */
  getAIPrompts() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    return this.schema.aiPrompts;
  }

  /**
   * Get environment variables
   * @returns object - Environment variables
   */
  getEnvironmentVariables() {
    if (!this.schema) {
      throw new Error('Provisioning manager not initialized. Call initialize() first.');
    }

    return this.schema.environmentVariables;
  }
}

/**
 * Factory function to create a provisioning manager for a business type
 * @param businessType - Business type identifier
 * @returns Promise<DynamicLabelProvisioningManager> - Configured provisioning manager
 */
export async function createProvisioningManager(businessType) {
  const manager = new DynamicLabelProvisioningManager(businessType);
  await manager.initialize();
  return manager;
}

/**
 * Utility function to get all available business types
 * @returns string[] - Available business types
 */
export function getAvailableBusinessTypes() {
  return [
    'pools_spas',
    'roofing_contractor',
    'hvac',
    'electrician',
    'plumber',
    'painting_contractor',
    'flooring_contractor',
    'landscaping',
    'general_contractor'
  ];
}

/**
 * Utility function to check if a business type is supported
 * @param businessType - Business type identifier
 * @returns boolean - True if supported
 */
export function isBusinessTypeSupported(businessType) {
  return getAvailableBusinessTypes().includes(businessType);
}

/**
 * Utility function to get business type display name
 * @param businessType - Business type identifier
 * @returns Promise<string> - Display name
 */
export async function getBusinessTypeDisplayName(businessType) {
  const manager = await createProvisioningManager(businessType);
  const info = manager.getBusinessTypeInfo();
  return info.displayName;
}

/**
 * Export default class
 */
export default DynamicLabelProvisioningManager;
