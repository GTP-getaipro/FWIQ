/**
 * Schema Integration Bridge
 * Connects all 3 schema layers: businessSchemas (AI), behaviorSchemas (Reply), labelSchemas (Provisioning)
 * Ensures consistency across AI classification, reply behavior, and label structure
 */

import { mergeAIBusinessSchemas, extractLabelSchemaFromAI } from './aiSchemaMerger.js';
import { mergeBusinessTypeSchemas as mergeLabelSchemas } from './labelSchemaMerger.js';
import { mergeBusinessTypeBehaviors, extractBehaviorForN8n } from './behaviorSchemaMerger.js';

/**
 * Get unified configuration for multi-business setup
 * Returns all 3 schema layers: AI (classification), Behavior (reply), Label (provisioning)
 * 
 * @param {array} businessTypes - Array of business type names
 * @param {array} managers - Manager objects from profile
 * @param {array} suppliers - Supplier objects from profile
 * @param {object} businessInfo - Business information (name, phone, emailDomain, etc.)
 * @returns {object} - { aiSchema, behaviorSchema, labelSchema, metadata }
 */
export const getUnifiedMultiBusinessConfig = (businessTypes, managers = [], suppliers = [], businessInfo = {}) => {
  console.log(`🔗 Building unified 3-layer config for ${businessTypes.length} business type(s):`, businessTypes);

  // Step 1: Merge AI schemas (for n8n workflow intelligence/classification)
  const mergedAISchema = mergeAIBusinessSchemas(businessTypes);

  // Step 2: Merge behavior schemas (for n8n AI reply generation)
  const mergedBehaviorSchema = mergeBusinessTypeBehaviors(businessTypes);

  // Step 3: Extract or merge label schemas (for Gmail/Outlook provisioning)
  // Option A: Extract from AI schema (ensures perfect consistency)
  const extractedLabelSchema = extractLabelSchemaFromAI(mergedAISchema);
  
  // Option B: Use standalone label schema merger (more flexible)
  const standaloneLabelSchema = mergeLabelSchemas(businessTypes);

  // Replace dynamic variables in all three schemas
  const finalAISchema = replaceDynamicVariablesInAISchema(mergedAISchema, managers, suppliers);
  const finalBehaviorSchema = mergedBehaviorSchema; // Behavior schemas don't have dynamic vars in same format
  const finalLabelSchema = replaceDynamicVariablesInLabelSchema(
    extractedLabelSchema || standaloneLabelSchema,
    managers,
    suppliers
  );

  return {
    aiSchema: finalAISchema,               // For n8n AI classification
    behaviorSchema: finalBehaviorSchema,   // For n8n AI reply generation
    labelSchema: finalLabelSchema,         // For Gmail/Outlook provisioning
    metadata: {
      businessTypes: businessTypes,
      primaryBusinessType: businessTypes[0],
      totalCategories: Object.keys(finalAISchema.labelSchema?.labels || {}).length,
      hasIndustryCategories: businessTypes.length > 1,
      mergedAt: new Date().toISOString(),
      managersCount: managers.length,
      suppliersCount: suppliers.length,
      layersMerged: 3
    }
  };
};

/**
 * Replace dynamic variables in AI schema
 * @param {object} aiSchema - AI schema with placeholders
 * @param {array} managers - Manager objects
 * @param {array} suppliers - Supplier objects
 * @returns {object} - AI schema with replaced variables
 */
const replaceDynamicVariablesInAISchema = (aiSchema, managers = [], suppliers = []) => {
  const cloned = JSON.parse(JSON.stringify(aiSchema));

  // Replace in labelSchema.labels
  if (cloned.labelSchema?.labels) {
    for (const [labelName, labelConfig] of Object.entries(cloned.labelSchema.labels)) {
      if (labelConfig.sub && Array.isArray(labelConfig.sub)) {
        labelConfig.sub = labelConfig.sub
          .map(subName => {
            // Replace manager placeholders
            const managerMatch = subName.match(/\{\{Manager(\d+)\}\}/);
            if (managerMatch) {
              const idx = parseInt(managerMatch[1]) - 1;
              return managers[idx]?.name || null;
            }

            // Replace supplier placeholders
            const supplierMatch = subName.match(/\{\{Supplier(\d+)\}\}/);
            if (supplierMatch) {
              const idx = parseInt(supplierMatch[1]) - 1;
              return suppliers[idx]?.name || null;
            }

            return subName;
          })
          .filter(name => name !== null);
      }
    }
  }

  // Replace actual dynamic variables
  cloned.dynamicVariables = {
    managers: managers,
    suppliers: suppliers,
    technicians: cloned.dynamicVariables?.technicians || []
  };

  return cloned;
};

/**
 * Replace dynamic variables in label schema
 * @param {object} labelSchema - Label schema with placeholders
 * @param {array} managers - Manager objects
 * @param {array} suppliers - Supplier objects
 * @returns {object} - Label schema with replaced variables
 */
const replaceDynamicVariablesInLabelSchema = (labelSchema, managers = [], suppliers = []) => {
  if (!labelSchema) return null;
  
  const cloned = JSON.parse(JSON.stringify(labelSchema));

  if (cloned.labels && Array.isArray(cloned.labels)) {
    cloned.labels.forEach(label => {
      if (label.sub && Array.isArray(label.sub)) {
        label.sub = label.sub
          .map(subLabel => {
            // Handle string format
            if (typeof subLabel === 'string') {
              const managerMatch = subLabel.match(/\{\{Manager(\d+)\}\}/);
              if (managerMatch) {
                const idx = parseInt(managerMatch[1]) - 1;
                return managers[idx]?.name ? { name: managers[idx].name } : null;
              }

              const supplierMatch = subLabel.match(/\{\{Supplier(\d+)\}\}/);
              if (supplierMatch) {
                const idx = parseInt(supplierMatch[1]) - 1;
                return suppliers[idx]?.name ? { name: suppliers[idx].name } : null;
              }

              return subLabel;
            }

            // Handle object format
            if (subLabel.name) {
              const managerMatch = subLabel.name.match(/\{\{Manager(\d+)\}\}/);
              if (managerMatch) {
                const idx = parseInt(managerMatch[1]) - 1;
                if (managers[idx]) {
                  return { ...subLabel, name: managers[idx].name };
                }
                return null;
              }

              const supplierMatch = subLabel.name.match(/\{\{Supplier(\d+)\}\}/);
              if (supplierMatch) {
                const idx = parseInt(supplierMatch[1]) - 1;
                if (suppliers[idx]) {
                  return { ...subLabel, name: suppliers[idx].name };
                }
                return null;
              }
            }

            return subLabel;
          })
          .filter(s => s !== null);
      }
    });
  }

  return cloned;
};

/**
 * Generate n8n workflow configuration from unified multi-business config
 * Includes all 3 layers: AI classification, behavior/reply, and label routing
 * @param {object} unifiedConfig - Result from getUnifiedMultiBusinessConfig
 * @param {object} businessInfo - Business information (name, contact, etc.)
 * @returns {object} - Complete n8n workflow configuration
 */
export const generateN8nConfigFromUnified = (unifiedConfig, businessInfo) => {
  const { aiSchema, behaviorSchema, labelSchema, metadata } = unifiedConfig;

  // Extract behavior config for n8n
  const behaviorConfig = extractBehaviorForN8n(behaviorSchema, businessInfo);

  // Build complete n8n-ready configuration
  return {
    businessTypes: metadata.businessTypes,
    primaryBusinessType: metadata.primaryBusinessType,
    
    // Layer 1: AI classification config
    classification: {
      keywords: aiSchema.keywords,
      intentMapping: aiSchema.intentMapping,
      systemMessage: aiSchema.aiPrompts.systemMessage,
      classificationRules: aiSchema.aiPrompts.classificationRules,
      confidenceThreshold: aiSchema.aiConfiguration.confidenceThreshold,
      fallbackLabel: aiSchema.aiConfiguration.fallbackLabel
    },

    // Layer 2: AI reply behavior config
    replyBehavior: {
      voiceTone: behaviorConfig.tone,
      formalityLevel: behaviorConfig.formalityLevel,
      allowPricing: behaviorConfig.allowPricing,
      replyPrompt: aiSchema.aiPrompts.replyPrompt,
      behaviorGoals: behaviorConfig.behaviorGoals,
      followUpGuidelines: behaviorConfig.followUpGuidelines,
      upsellText: behaviorConfig.upsellText,
      upsellEnabled: behaviorConfig.upsellEnabled,
      categoryOverrides: behaviorConfig.categoryOverrides,
      specialInstructions: behaviorConfig.specialInstructions
    },

    // Signature config (from behavior schema)
    signature: {
      closingText: behaviorConfig.signature.closingText,
      signatureBlock: behaviorConfig.signature.signatureBlock
    },

    // Layer 3: Label routing config
    labels: labelSchema.labels,
    labelOrder: labelSchema.rootOrder,

    // Escalation config (from AI schema)
    escalation: aiSchema.escalationRules,

    // Team config
    team: {
      managers: aiSchema.dynamicVariables.managers,
      suppliers: aiSchema.dynamicVariables.suppliers,
      technicians: aiSchema.dynamicVariables.technicians
    },

    // Metadata
    metadata: {
      ...metadata,
      totalKeywords: aiSchema.keywords.primary.length + aiSchema.keywords.secondary.length,
      hasEmergencyServices: aiSchema.metadata.emergencyServices,
      hasWarrantyServices: aiSchema.metadata.warrantyServices,
      layersMerged: 3
    }
  };
};

/**
 * Validate consistency between AI schema and label schema
 * Ensures all labels in AI schema match label schema structure
 * @param {object} aiSchema - AI schema
 * @param {object} labelSchema - Label schema
 * @returns {object} - { consistent: boolean, mismatches: array }
 */
export const validateSchemaConsistency = (aiSchema, labelSchema) => {
  const mismatches = [];

  const aiLabels = new Set(Object.keys(aiSchema.labelSchema?.labels || {}));
  const labelNames = new Set(labelSchema.labels?.map(l => l.name) || []);

  // Check if all AI labels exist in label schema
  for (const aiLabel of aiLabels) {
    if (!labelNames.has(aiLabel)) {
      mismatches.push(`AI schema has label "${aiLabel}" not in label schema`);
    }
  }

  // Check if all label schema labels exist in AI schema
  for (const labelName of labelNames) {
    if (!aiLabels.has(labelName)) {
      mismatches.push(`Label schema has label "${labelName}" not in AI schema`);
    }
  }

  return {
    consistent: mismatches.length === 0,
    mismatches: mismatches,
    aiLabelCount: aiLabels.size,
    labelSchemaCount: labelNames.size
  };
};

export default {
  getUnifiedMultiBusinessConfig,
  generateN8nConfigFromUnified,
  extractLabelSchemaFromAI,
  validateSchemaConsistency
};

