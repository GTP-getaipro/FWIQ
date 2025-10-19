/**
 * AI Business Schema Merger
 * Intelligently merges multiple business type AI schemas for multi-business operations
 * Handles keywords, prompts, intents, labels, escalation rules - the complete AI config
 */

import baseSchema from '@/businessSchemas/base.ai.schema.json';
import electricianSchema from '@/businessSchemas/electrician.ai.json';
import plumberSchema from '@/businessSchemas/plumber.ai.json';
import poolsSpasSchema from '@/businessSchemas/pools_spas.ai.json';
import hotTubSpaSchema from '@/businessSchemas/hot_tub_spa.ai.json';
import saunaIcebathSchema from '@/businessSchemas/sauna_icebath.ai.json';
import insulationFoamSpraySchema from '@/businessSchemas/insulation_foam_spray.ai.json';
import flooringSchema from '@/businessSchemas/flooring_contractor.ai.json';
import generalContractorSchema from '@/businessSchemas/general_contractor.ai.json';
import hvacSchema from '@/businessSchemas/hvac.ai.json';
import landscapingSchema from '@/businessSchemas/landscaping.ai.json';
import paintingSchema from '@/businessSchemas/painting_contractor.ai.json';
import roofingSchema from '@/businessSchemas/roofing_contractor.ai.json';

// AI Schema mapping by business type name
const AI_SCHEMA_MAP = {
  'Electrician': electricianSchema,
  'Plumber': plumberSchema,
  'Pools': poolsSpasSchema,
  'Pools & Spas': poolsSpasSchema,
  'Hot tub & Spa': hotTubSpaSchema,
  'Sauna & Icebath': saunaIcebathSchema,
  'Flooring': flooringSchema,
  'Flooring Contractor': flooringSchema,
  'General Construction': generalContractorSchema,
  'General Contractor': generalContractorSchema,
  'HVAC': hvacSchema,
  'Insulation & Foam Spray': insulationFoamSpraySchema,
  'Landscaping': landscapingSchema,
  'Painting': paintingSchema,
  'Painting Contractor': paintingSchema,
  'Roofing': roofingSchema,
  'Roofing Contractor': roofingSchema,
};

/**
 * Get AI schema for a single business type
 * @param {string} businessType - Business type name
 * @returns {object|null} - AI schema or null if not found
 */
export const getAISchemaForBusinessType = (businessType) => {
  return AI_SCHEMA_MAP[businessType] || null;
};

/**
 * Merge keywords from multiple AI schemas
 * Combines all keyword arrays, removes duplicates
 * @param {array} schemas - Array of AI schema objects
 * @returns {object} - Merged keywords object
 */
const mergeKeywords = (schemas) => {
  const merged = {
    primary: new Set(),
    secondary: new Set(),
    emergency: new Set(),
    service: new Set(),
    financial: new Set(),
    warranty: new Set(),
    negative: new Set()
  };

  for (const schema of schemas) {
    if (!schema.keywords) continue;

    for (const [category, keywords] of Object.entries(schema.keywords)) {
      if (merged[category] && Array.isArray(keywords)) {
        keywords.forEach(kw => merged[category].add(kw));
      }
    }
  }

  // Convert Sets back to arrays
  const result = {};
  for (const [category, kwSet] of Object.entries(merged)) {
    result[category] = Array.from(kwSet);
  }

  return result;
};

/**
 * Merge intent mappings from multiple schemas
 * Standard intents from base, industry-specific ones added
 * @param {array} schemas - Array of AI schema objects
 * @returns {object} - Merged intent mapping
 */
const mergeIntentMapping = (schemas) => {
  const merged = { ...baseSchema.intentRouting };

  for (const schema of schemas) {
    if (!schema.intentMapping) continue;

    // Add any new intent mappings not in base
    for (const [intent, label] of Object.entries(schema.intentMapping)) {
      if (!merged[intent]) {
        merged[intent] = label;
      }
    }
  }

  return merged;
};

/**
 * Merge tone profiles from multiple schemas
 * Uses primary business type's tone as base, blends others
 * @param {array} schemas - Array of AI schema objects
 * @returns {object} - Merged tone profile
 */
const mergeToneProfiles = (schemas) => {
  if (schemas.length === 0) return baseSchema.toneProfile;

  // Use first (primary) business type's tone as base
  const primaryTone = schemas[0].aiConfiguration?.toneProfile || {};
  
  // Blend in others for variety
  const allTones = schemas
    .map(s => s.aiConfiguration?.toneProfile?.primary)
    .filter(t => t);

  const blendedPrimary = allTones.length > 1 
    ? `${allTones.slice(0, 2).join(' and ')}${allTones.length > 2 ? ' with multi-service expertise' : ''}`
    : primaryTone.primary || baseSchema.toneProfile.default;

  return {
    default: blendedPrimary,
    urgent: primaryTone.urgent || baseSchema.toneProfile.urgent,
    sales: primaryTone.sales || baseSchema.toneProfile.sales,
    support: primaryTone.support || baseSchema.toneProfile.support,
    financial: baseSchema.toneProfile.financial
  };
};

/**
 * Merge label schemas from multiple AI schemas
 * @param {array} schemas - Array of AI schema objects
 * @returns {object} - Merged labelSchema object
 */
const mergeLabelSchemas = (schemas) => {
  const seenLabels = new Map(); // name -> label config
  const allColors = {};
  const categoryGroups = {};
  const provisioningOrder = [];

  for (const schema of schemas) {
    if (!schema.labelSchema) continue;

    // Merge colors
    if (schema.labelSchema.colors) {
      Object.assign(allColors, schema.labelSchema.colors);
    }

    // Merge labels
    if (schema.labelSchema.labels) {
      for (const [labelName, labelConfig] of Object.entries(schema.labelSchema.labels)) {
        if (seenLabels.has(labelName)) {
          // Label exists - merge subcategories
          const existing = seenLabels.get(labelName);
          if (labelConfig.sub && existing.sub) {
            // Merge sub arrays, remove duplicates
            const mergedSubs = [...new Set([...existing.sub, ...labelConfig.sub])];
            existing.sub = mergedSubs;
          }
          if (labelConfig.nested && existing.nested) {
            // Merge nested structures
            existing.nested = { ...existing.nested, ...labelConfig.nested };
          }
        } else {
          // New label - add it
          seenLabels.set(labelName, JSON.parse(JSON.stringify(labelConfig)));
        }
      }
    }

    // Collect category groups
    if (schema.labelSchema.categoryGroups) {
      Object.assign(categoryGroups, schema.labelSchema.categoryGroups);
    }
  }

  // Build provisioning order (standard + industry-specific)
  const standardOrder = ['BANKING', 'FORMSUB', 'GOOGLE_REVIEW', 'MANAGER', 'SERVICE', 'WARRANTY', 'SUPPORT', 'SALES', 'SUPPLIERS', 'URGENT'];
  const industryLabels = Array.from(seenLabels.keys()).filter(name => !standardOrder.includes(name));
  const finalOrder = [...standardOrder, ...industryLabels, 'PHONE', 'PROMO', 'RECRUITMENT', 'SOCIALMEDIA', 'MISC'];

  // Convert map to object
  const labelsObject = {};
  for (const [name, config] of seenLabels.entries()) {
    labelsObject[name] = config;
  }

  return {
    colors: allColors,
    labels: labelsObject,
    provisioningOrder: finalOrder,
    categoryGroups: categoryGroups
  };
};

/**
 * Merge escalation rules from multiple schemas
 * Uses most restrictive SLA for each rule type
 * @param {array} schemas - Array of AI schema objects
 * @returns {object} - Merged escalation rules
 */
const mergeEscalationRules = (schemas) => {
  const merged = {};

  // Standard escalation types
  const escalationTypes = ['urgent', 'warranty', 'service', 'sales'];

  for (const type of escalationTypes) {
    const rules = schemas
      .map(s => s.escalationRules?.[type])
      .filter(r => r);

    if (rules.length === 0) continue;

    // Use most restrictive (shortest) SLA
    const slaMinutes = rules.map(r => {
      const match = r.sla.match(/(\d+)\s*(minute|hour)/i);
      if (!match) return 999;
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit === 'hour' ? value * 60 : value;
    });

    const minSLA = Math.min(...slaMinutes);
    const bestRule = rules[slaMinutes.indexOf(minSLA)];

    // Combine notify arrays
    const allNotify = [...new Set(rules.flatMap(r => r.notify || []))];

    merged[type] = {
      ...bestRule,
      notify: allNotify,
      threshold: bestRule.threshold,
      sla: bestRule.sla,
      autoReply: bestRule.autoReply
    };
  }

  return merged;
};

/**
 * Merge AI prompts from multiple schemas
 * Combines classification rules, uses primary business type's prompts as base
 * @param {array} schemas - Array of AI schema objects
 * @param {array} businessTypes - Original business type names
 * @returns {object} - Merged AI prompts
 */
const mergeAIPrompts = (schemas, businessTypes) => {
  if (schemas.length === 0) return baseSchema.aiConfiguration;

  // Use primary (first) business type's prompts as base
  const primaryPrompts = schemas[0].aiPrompts || {};

  // Collect all classification rules
  const allRules = schemas
    .flatMap(s => s.aiPrompts?.classificationRules || [])
    .filter((rule, index, self) => self.indexOf(rule) === index); // Deduplicate

  // Enhance system message for multi-business
  let systemMessage = primaryPrompts.systemMessage || baseSchema.aiConfiguration.systemMessage;
  if (businessTypes.length > 1) {
    systemMessage = systemMessage.replace(
      '{{BUSINESS_NAME}}',
      `{{BUSINESS_NAME}} (${businessTypes.join(' + ')} services)`
    );
  }

  // Enhance reply prompt
  let replyPrompt = primaryPrompts.replyPrompt || baseSchema.aiConfiguration.replyPrompt;
  if (businessTypes.length > 1) {
    const servicesNote = `\n\nNote: We provide ${businessTypes.join(', ')} services. Tailor your response to the specific service area mentioned in the customer's email.`;
    replyPrompt += servicesNote;
  }

  return {
    systemMessage,
    replyPrompt,
    classificationRules: allRules
  };
};

/**
 * Merge dynamic variables from multiple schemas
 * Combines managers, suppliers, and technicians
 * @param {array} schemas - Array of AI schema objects
 * @returns {object} - Merged dynamic variables
 */
const mergeDynamicVariables = (schemas) => {
  const merged = {
    managers: [],
    suppliers: [],
    technicians: []
  };

  const seenManagers = new Set();
  const seenSuppliers = new Set();
  const seenTechnicians = new Set();

  for (const schema of schemas) {
    if (!schema.dynamicVariables) continue;

    // Merge managers
    if (schema.dynamicVariables.managers) {
      schema.dynamicVariables.managers.forEach(m => {
        const key = `${m.name}|${m.email}`;
        if (!seenManagers.has(key)) {
          merged.managers.push(m);
          seenManagers.add(key);
        }
      });
    }

    // Merge suppliers
    if (schema.dynamicVariables.suppliers) {
      schema.dynamicVariables.suppliers.forEach(s => {
        const key = `${s.name}|${s.email}`;
        if (!seenSuppliers.has(key)) {
          merged.suppliers.push(s);
          seenSuppliers.add(key);
        }
      });
    }

    // Merge technicians
    if (schema.dynamicVariables.technicians) {
      schema.dynamicVariables.technicians.forEach(t => {
        const key = `${t.name}|${t.email}`;
        if (!seenTechnicians.has(key)) {
          merged.technicians.push(t);
          seenTechnicians.add(key);
        }
      });
    }
  }

  return merged;
};

/**
 * Merge complete AI schemas for multiple business types
 * Combines all aspects: keywords, prompts, labels, escalation, etc.
 * @param {array} businessTypes - Array of business type names
 * @returns {object} - Merged AI schema
 */
export const mergeAIBusinessSchemas = (businessTypes) => {
  // Validate input
  if (!Array.isArray(businessTypes) || businessTypes.length === 0) {
    console.warn('No business types provided, using base schema');
    return baseSchema;
  }

  // If only one business type, return its schema directly
  if (businessTypes.length === 1) {
    const schema = getAISchemaForBusinessType(businessTypes[0]);
    return schema || baseSchema;
  }

  // Load all schemas for selected business types
  const schemas = businessTypes
    .map(type => getAISchemaForBusinessType(type))
    .filter(schema => schema !== null);

  if (schemas.length === 0) {
    console.warn('No valid AI schemas found for business types:', businessTypes);
    return baseSchema;
  }

  // Merge all components
  const mergedSchema = {
    schemaVersion: "1.3.0",
    businessType: businessTypes.join(' + '),
    displayName: businessTypes.join(' + ') + ' Business',
    description: `Merged AI schema for multi-business type: ${businessTypes.join(', ')}. Combines classification intelligence, keywords, and automation rules.`,
    updatedAt: new Date().toISOString(),
    author: "Floworx AI Schema Merger",

    metadata: {
      industry: businessTypes.join(' + '),
      primaryServices: schemas.flatMap(s => s.metadata?.primaryServices || []),
      targetCustomers: ["Residential", "Commercial"],
      seasonality: "Year-round (multi-service)",
      emergencyServices: schemas.some(s => s.metadata?.emergencyServices),
      warrantyServices: schemas.some(s => s.metadata?.warrantyServices),
      supplierDependent: schemas.some(s => s.metadata?.supplierDependent),
      sourceBusinessTypes: businessTypes
    },

    aiConfiguration: {
      toneProfile: mergeToneProfiles(schemas),
      responseStyle: schemas[0].aiConfiguration?.responseStyle || baseSchema.toneProfile,
      classificationModel: schemas[0].aiConfiguration?.classificationModel || "gpt-4o-mini",
      confidenceThreshold: Math.max(...schemas.map(s => s.aiConfiguration?.confidenceThreshold || 0.75)),
      fallbackLabel: "MISC"
    },

    intentMapping: mergeIntentMapping(schemas),
    keywords: mergeKeywords(schemas),
    labelSchema: mergeLabelSchemas(schemas),
    dynamicVariables: mergeDynamicVariables(schemas),
    escalationRules: mergeEscalationRules(schemas),
    aiPrompts: mergeAIPrompts(schemas, businessTypes),

    environmentVariables: {
      required: schemas[0].environmentVariables?.required || baseSchema.environmentVariables?.required || [],
      optional: schemas[0].environmentVariables?.optional || baseSchema.environmentVariables?.optional || [],
      pricing: schemas[0].environmentVariables?.pricing || baseSchema.environmentVariables?.pricing || []
    },

    validation: {
      requiredFields: ["businessType", "intentMapping", "labelSchema", "keywords"],
      colorValidation: "Must use Gmail API allowed colors",
      intentValidation: "All intents must map to valid labels",
      envVarValidation: "All n8nEnvVar values must be unique"
    }
  };

  console.log(`✅ Successfully merged ${schemas.length} AI schemas for:`, businessTypes);
  console.log(`📊 Merged schema contains:`);
  console.log(`   - ${Object.keys(mergedSchema.labelSchema.labels).length} label categories`);
  console.log(`   - ${mergedSchema.keywords.primary.length} primary keywords`);
  console.log(`   - ${mergedSchema.keywords.emergency.length} emergency keywords`);
  console.log(`   - ${Object.keys(mergedSchema.intentMapping).length} intent mappings`);

  return mergedSchema;
};

/**
 * Extract label schema structure for Gmail/Outlook provisioning
 * Converts AI schema's labelSchema to simple labelSchemas/*.json format
 * @param {object} aiSchema - Complete AI schema
 * @returns {object} - Label schema in labelSchemas/*.json format
 */
export const extractLabelSchemaFromAI = (aiSchema) => {
  if (!aiSchema.labelSchema) {
    console.warn('No labelSchema found in AI schema');
    return null;
  }

  const { labels, colors, provisioningOrder } = aiSchema.labelSchema;

  // Convert from object format to array format
  const labelsArray = [];
  for (const [name, config] of Object.entries(labels)) {
    const labelObj = {
      name: name,
      intent: config.intent,
      critical: config.critical || false,
      color: colors[name] || { backgroundColor: "#999999", textColor: "#ffffff" }
    };

    // Add subcategories if present
    if (config.sub && Array.isArray(config.sub)) {
      labelObj.sub = config.sub.map(subName => {
        const obj = { name: subName };
        // Check for nested subcategories
        if (config.nested && config.nested[subName]) {
          obj.sub = config.nested[subName].map(n => ({ name: n }));
        }
        return obj;
      });
    }

    labelsArray.push(labelObj);
  }

  return {
    meta: {
      schemaVersion: "v2.0",
      industry: aiSchema.metadata?.industry || aiSchema.businessType,
      author: "Extracted from AI Schema",
      lastUpdated: aiSchema.updatedAt || new Date().toISOString()
    },
    description: aiSchema.description,
    rootOrder: provisioningOrder || Object.keys(labels),
    labels: labelsArray,
    dynamicVariables: {
      managers: ["{{Manager1}}", "{{Manager2}}", "{{Manager3}}", "{{Manager4}}", "{{Manager5}}"],
      suppliers: ["{{Supplier1}}", "{{Supplier2}}", "{{Supplier3}}", "{{Supplier4}}", "{{Supplier5}}"]
    }
  };
};

/**
 * Get merged AI schema from user profile
 * @param {object} profile - User profile with business_types
 * @returns {object} - Merged AI schema
 */
export const getMergedAISchemaFromProfile = (profile) => {
  let businessTypes = [];

  if (profile.business_types && Array.isArray(profile.business_types)) {
    businessTypes = profile.business_types;
  } else if (profile.business_type) {
    businessTypes = [profile.business_type];
  }

  return mergeAIBusinessSchemas(businessTypes);
};

/**
 * Validate merged AI schema
 * @param {object} schema - AI schema to validate
 * @returns {object} - Validation result
 */
export const validateMergedAISchema = (schema) => {
  const issues = [];

  // Check required fields
  if (!schema.businessType) issues.push('Missing businessType');
  if (!schema.intentMapping) issues.push('Missing intentMapping');
  if (!schema.labelSchema) issues.push('Missing labelSchema');
  if (!schema.keywords) issues.push('Missing keywords');

  // Check label schema has labels
  if (schema.labelSchema && Object.keys(schema.labelSchema.labels || {}).length === 0) {
    issues.push('Label schema has no labels');
  }

  // Check for duplicate intent mappings
  if (schema.intentMapping) {
    const intentValues = Object.values(schema.intentMapping);
    const uniqueIntents = new Set(intentValues);
    if (intentValues.length !== uniqueIntents.size) {
      issues.push('Duplicate intent mappings detected');
    }
  }

  return {
    isValid: issues.length === 0,
    issues: issues
  };
};

export default {
  mergeAIBusinessSchemas,
  getMergedAISchemaFromProfile,
  getAISchemaForBusinessType,
  extractLabelSchemaFromAI,
  validateMergedAISchema
};

