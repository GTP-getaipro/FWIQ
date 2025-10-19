// AI JSON Schema Loader - Business Type Intelligence System
// This utility loads and manages AI JSON schemas for different business types
// Each schema contains complete intelligence for AI classification, label provisioning, and automation

/**
 * AI JSON Schema Loader
 * 
 * This module provides a centralized way to load and manage AI JSON schemas
 * for different business types. Each schema contains:
 * - AI intent mapping and classification rules
 * - Label schema with colors and hierarchy
 * - Dynamic variables for managers/suppliers
 * - Escalation rules and SLA targets
 * - AI prompts and response templates
 * - Environment variable mappings
 */

import fs from 'fs';
import path from 'path';

/**
 * Business Type Schema Registry
 * Maps business type identifiers to their schema files
 */
export const BUSINESS_TYPE_REGISTRY = {
  'pools_spas': 'pools_spas.ai.json',
  'roofing_contractor': 'roofing_contractor.ai.json',
  'hvac': 'hvac.ai.json',
  'electrician': 'electrician.ai.json',
  'plumber': 'plumber.ai.json',
  'painting_contractor': 'painting_contractor.ai.json',
  'flooring_contractor': 'flooring_contractor.ai.json',
  'landscaping': 'landscaping.ai.json',
  'general_contractor': 'general_contractor.ai.json'
};

/**
 * Schema Cache for Performance
 * Prevents repeated file system reads
 */
const schemaCache = new Map();

/**
 * AI JSON Schema Interface
 * Defines the structure of an AI JSON schema
 */
// AIJsonSchema interface definition (commented out for JavaScript compatibility)
/*
export interface AIJsonSchema {
  schemaVersion: string;
  businessType: string;
  displayName: string;
  description: string;
  updatedAt: string;
  author: string;
  
  metadata: {
    industry: string;
    primaryServices: string[];
    targetCustomers: string[];
    seasonality: string;
    emergencyServices: boolean;
    warrantyServices: boolean;
    supplierDependent: boolean;
  };

  aiConfiguration: {
    toneProfile: {
      primary: string;
      secondary: string;
      emergency: string;
      sales: string;
    };
    responseStyle: {
      length: string;
      formality: string;
      urgency: string;
      personalization: string;
    };
    classificationModel: string;
    confidenceThreshold: number;
    fallbackLabel: string;
  };

  intentMapping: Record<string, string>;
  keywords: {
    primary: string[];
    secondary: string[];
    emergency: string[];
    service: string[];
    financial: string[];
    warranty: string[];
    negative: string[];
  };

  labelSchema: {
    colors: Record<string, { backgroundColor: string; textColor: string }>;
    labels: Record<string, {
      color: string;
      sub?: string[];
      nested?: Record<string, string[]>;
      intent: string;
      critical: boolean;
      description: string;
      n8nEnvVar: string;
    }>;
    provisioningOrder: string[];
    categoryGroups: Record<string, string[]>;
  };

  dynamicVariables: {
    managers: Array<{
      name: string;
      email: string;
      role: string;
    }>;
    suppliers: Array<{
      name: string;
      email: string;
      category: string;
    }>;
    technicians: Array<{
      name: string;
      email: string;
      specialties: string[];
    }>;
  };

  escalationRules: Record<string, {
    threshold: string;
    notify: string[];
    sla: string;
    autoReply: boolean;
  }>;

  aiPrompts: {
    systemMessage: string;
    replyPrompt: string;
    classificationRules: string[];
  };

  environmentVariables: {
    required: string[];
    optional: string[];
    pricing: string[];
  };

  validation: {
    requiredFields: string[];
    colorValidation: string;
    intentValidation: string;
    envVarValidation: string;
  };
}
*/

/**
 * Schema Loader Class
 * Handles loading, caching, and validation of AI JSON schemas with inheritance support
 */
export class AIJsonSchemaLoader {
  constructor(schemasPath = './src/businessSchemas') {
    this.schemasPath = schemasPath;
    this.baseSchema = null; // Cache for base schema
  }

  /**
   * Load base schema for inheritance
   * @returns Promise<object> - Base schema
   */
  async loadBaseSchema() {
    if (this.baseSchema) {
      return this.baseSchema;
    }

    const baseSchemaPath = path.join(this.schemasPath, 'base.ai.schema.json');
    try {
      const baseSchemaData = await fs.promises.readFile(baseSchemaPath, 'utf-8');
      this.baseSchema = JSON.parse(baseSchemaData);
      return this.baseSchema;
    } catch (error) {
      console.error(`Error loading base schema from ${baseSchemaPath}:`, error);
      throw new Error('Failed to load base schema.');
    }
  }

  /**
   * Merge schema with base schema (inheritance)
   * @param childSchema - Child schema to merge
   * @param baseSchema - Base schema to inherit from
   * @returns object - Merged schema
   */
  mergeWithBaseSchema(childSchema, baseSchema) {
    const merged = JSON.parse(JSON.stringify(baseSchema)); // Deep clone base

    // Override allowed fields from child schema
    const allowedOverrides = childSchema.inheritance?.allowOverride || baseSchema.inheritance?.allowOverride || [];
    
    for (const field of allowedOverrides) {
      if (childSchema[field] !== undefined) {
        if (typeof childSchema[field] === 'object' && !Array.isArray(childSchema[field])) {
          // Deep merge for objects
          merged[field] = { ...merged[field], ...childSchema[field] };
        } else {
          // Replace for arrays and primitives
          merged[field] = childSchema[field];
        }
      }
    }

    // Always override these fields
    const alwaysOverride = ['businessType', 'schemaVersion', 'lastUpdated', 'author', 'description'];
    for (const field of alwaysOverride) {
      if (childSchema[field] !== undefined) {
        merged[field] = childSchema[field];
      }
    }

    // Merge labels if both exist
    if (childSchema.labels && baseSchema.systemLabels) {
      merged.labels = [...baseSchema.systemLabels, ...childSchema.labels];
    } else if (childSchema.labels) {
      merged.labels = childSchema.labels;
    } else if (baseSchema.systemLabels) {
      merged.labels = baseSchema.systemLabels;
    }

    // Merge escalation rules if both exist
    if (childSchema.escalationRules && baseSchema.escalationRules) {
      merged.escalationRules = { ...baseSchema.escalationRules, ...childSchema.escalationRules };
    } else if (childSchema.escalationRules) {
      merged.escalationRules = childSchema.escalationRules;
    } else if (baseSchema.escalationRules) {
      merged.escalationRules = baseSchema.escalationRules;
    }

    return merged;
  }

  /**
   * Load AI JSON schema for a specific business type with inheritance
   * @param businessType - Business type identifier
   * @returns Promise<object> - Loaded schema with inheritance applied
   */
  async loadSchema(businessType) {
    // Check cache first
    if (schemaCache.has(businessType)) {
      return schemaCache.get(businessType);
    }

    // Validate business type
    if (!BUSINESS_TYPE_REGISTRY[businessType]) {
      throw new Error(`Unknown business type: ${businessType}`);
    }

    // Load schema file
    const schemaFile = BUSINESS_TYPE_REGISTRY[businessType];
    const schemaPath = path.join(this.schemasPath, schemaFile);

    try {
      const schemaData = await fs.promises.readFile(schemaPath, 'utf-8');
      const childSchema = JSON.parse(schemaData);

      // Load base schema for inheritance
      const baseSchema = await this.loadBaseSchema();

      // Merge child schema with base schema
      const mergedSchema = this.mergeWithBaseSchema(childSchema, baseSchema);

      // Validate merged schema
      this.validateSchema(mergedSchema);

      // Cache the merged schema
      schemaCache.set(businessType, mergedSchema);

      return mergedSchema;
    } catch (error) {
      throw new Error(`Failed to load schema for ${businessType}: ${error.message}`);
    }
  }

  /**
   * Load all available schemas
   * @returns Promise<Record<string, AIJsonSchema>> - All loaded schemas
   */
  async loadAllSchemas() {
    const schemas = {};

    for (const [businessType, schemaFile] of Object.entries(BUSINESS_TYPE_REGISTRY)) {
      try {
        schemas[businessType] = await this.loadSchema(businessType);
      } catch (error) {
        console.warn(`Failed to load schema for ${businessType}: ${error.message}`);
      }
    }

    return schemas;
  }

  /**
   * Get available business types
   * @returns string[] - Array of available business types
   */
  getAvailableBusinessTypes() {
    return Object.keys(BUSINESS_TYPE_REGISTRY);
  }

  /**
   * Get business type metadata
   * @param businessType - Business type identifier
   * @returns Promise<object> - Business type metadata
   */
  async getBusinessTypeMetadata(businessType) {
    const schema = await this.loadSchema(businessType);
    return {
      businessType: schema.businessType,
      displayName: schema.displayName,
      description: schema.description,
      industry: schema.metadata.industry,
      primaryServices: schema.metadata.primaryServices,
      targetCustomers: schema.metadata.targetCustomers,
      seasonality: schema.metadata.seasonality,
      emergencyServices: schema.metadata.emergencyServices,
      warrantyServices: schema.metadata.warrantyServices,
      supplierDependent: schema.metadata.supplierDependent
    };
  }

  /**
   * Get AI configuration for a business type
   * @param businessType - Business type identifier
   * @returns Promise<object> - AI configuration
   */
  async getAIConfiguration(businessType) {
    const schema = await this.loadSchema(businessType);
    return schema.aiConfiguration;
  }

  /**
   * Get intent mapping for a business type
   * @param businessType - Business type identifier
   * @returns Promise<Record<string, string>> - Intent mapping
   */
  async getIntentMapping(businessType) {
    const schema = await this.loadSchema(businessType);
    return schema.intentMapping;
  }

  /**
   * Get keywords for a business type
   * @param businessType - Business type identifier
   * @returns Promise<object> - Keywords object
   */
  async getKeywords(businessType) {
    const schema = await this.loadSchema(businessType);
    return schema.keywords;
  }

  /**
   * Get label schema for a business type
   * @param businessType - Business type identifier
   * @returns Promise<object> - Label schema
   */
  async getLabelSchema(businessType) {
    const schema = await this.loadSchema(businessType);
    return schema.labelSchema;
  }

  /**
   * Get dynamic variables for a business type
   * @param businessType - Business type identifier
   * @returns Promise<object> - Dynamic variables
   */
  async getDynamicVariables(businessType) {
    const schema = await this.loadSchema(businessType);
    return schema.dynamicVariables;
  }

  /**
   * Get escalation rules for a business type
   * @param businessType - Business type identifier
   * @returns Promise<object> - Escalation rules
   */
  async getEscalationRules(businessType) {
    const schema = await this.loadSchema(businessType);
    return schema.escalationRules;
  }

  /**
   * Get AI prompts for a business type
   * @param businessType - Business type identifier
   * @returns Promise<object> - AI prompts
   */
  async getAIPrompts(businessType) {
    const schema = await this.loadSchema(businessType);
    return schema.aiPrompts;
  }

  /**
   * Get environment variables for a business type
   * @param businessType - Business type identifier
   * @returns Promise<object> - Environment variables
   */
  async getEnvironmentVariables(businessType) {
    const schema = await this.loadSchema(businessType);
    return schema.environmentVariables;
  }

  /**
   * Generate n8n environment variables from schema
   * @param businessType - Business type identifier
   * @param labelMap - Label ID mapping from provisioning
   * @returns Promise<Record<string, string>> - Environment variables
   */
  async generateN8nEnvironmentVariables(
    businessType, 
    labelMap
  ) {
    const schema = await this.loadSchema(businessType);
    const envVars = {};

    // Generate environment variables from label schema
    for (const [labelName, labelConfig] of Object.entries(schema.labelSchema.labels)) {
      const labelId = labelMap[labelName];
      if (labelId && labelConfig.n8nEnvVar) {
        envVars[labelConfig.n8nEnvVar] = labelId;
      }
    }

    return envVars;
  }

  /**
   * Validate AI JSON schema structure
   * @param schema - Schema to validate
   * @throws Error if schema is invalid
   */
  validateSchema(schema) {
    // Check if validation.requiredFields exists and is iterable
    const requiredFields = schema.validation?.requiredFields;
    if (requiredFields && Array.isArray(requiredFields)) {
      for (const field of requiredFields) {
        if (!schema[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
    }

    // Validate intent mapping
    if (schema.intentRouting && schema.labels) {
      const labelNames = schema.labels.map(label => label.name);
      for (const [intent, label] of Object.entries(schema.intentRouting)) {
        if (!labelNames.includes(label)) {
          throw new Error(`Intent ${intent} maps to non-existent label: ${label}`);
        }
      }
    }

    // Validate n8n environment variables are unique
    if (schema.labels) {
      const envVars = new Set();
      for (const labelConfig of schema.labels) {
        if (labelConfig.n8nEnvVar) {
          if (envVars.has(labelConfig.n8nEnvVar)) {
            throw new Error(`Duplicate n8n environment variable: ${labelConfig.n8nEnvVar}`);
          }
          envVars.add(labelConfig.n8nEnvVar);
        }
      }
    }
  }

  /**
   * Clear schema cache
   */
  clearCache() {
    schemaCache.clear();
  }

  /**
   * Get cache statistics
   * @returns object - Cache statistics
   */
  getCacheStats() {
    return {
      cachedSchemas: schemaCache.size,
      availableSchemas: Object.keys(BUSINESS_TYPE_REGISTRY).length,
      cacheHitRate: schemaCache.size / Object.keys(BUSINESS_TYPE_REGISTRY).length
    };
  }
}

/**
 * Default schema loader instance
 */
export const defaultSchemaLoader = new AIJsonSchemaLoader();

/**
 * Utility functions for common operations
 */

/**
 * Load schema for a business type (convenience function)
 * @param businessType - Business type identifier
 * @returns Promise<AIJsonSchema> - Loaded schema
 */
export async function loadBusinessSchema(businessType) {
  return defaultSchemaLoader.loadSchema(businessType);
}

/**
 * Get all available business types (convenience function)
 * @returns string[] - Array of available business types
 */
export function getAvailableBusinessTypes() {
  return defaultSchemaLoader.getAvailableBusinessTypes();
}

/**
 * Check if a business type is supported
 * @param businessType - Business type identifier
 * @returns boolean - True if supported
 */
export function isBusinessTypeSupported(businessType) {
  return BUSINESS_TYPE_REGISTRY.hasOwnProperty(businessType);
}

/**
 * Get business type display name
 * @param businessType - Business type identifier
 * @returns Promise<string> - Display name
 */
export async function getBusinessTypeDisplayName(businessType) {
  const schema = await defaultSchemaLoader.loadSchema(businessType);
  return schema.displayName;
}

/**
 * Get business type industry
 * @param businessType - Business type identifier
 * @returns Promise<string> - Industry
 */
export async function getBusinessTypeIndustry(businessType) {
  const schema = await defaultSchemaLoader.loadSchema(businessType);
  return schema.metadata.industry;
}

/**
 * Get business type primary services
 * @param businessType - Business type identifier
 * @returns Promise<string[]> - Primary services
 */
export async function getBusinessTypePrimaryServices(businessType) {
  const schema = await defaultSchemaLoader.loadSchema(businessType);
  return schema.metadata.primaryServices;
}

/**
 * Export default instance
 */
export default defaultSchemaLoader;
