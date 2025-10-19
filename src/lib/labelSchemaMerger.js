/**
 * Label Schema Merger
 * Intelligently merges multiple business type label schemas into a unified schema
 * Handles deduplication, ordering, and dynamic variable management
 * 
 * NOW USES baseMasterSchema.js AS SOURCE OF TRUTH
 */

import { getCompleteSchemaForBusiness } from '@/lib/baseMasterSchema.js';

// Standard categories that appear in ALL schemas (base categories)
const STANDARD_CATEGORIES = new Set([
  'BANKING',
  'FORMSUB',
  'GOOGLE_REVIEW',
  'MANAGER',
  'SALES',
  'SUPPLIERS',
  'SUPPORT',
  'URGENT',
  'MISC',
  'PHONE',
  'PROMO',
  'RECRUITMENT',
  'SOCIALMEDIA'
]);

/**
 * Get label schema for a single business type from baseMasterSchema
 * @param {string} businessType - Business type name
 * @param {Array} managers - Manager objects for dynamic injection
 * @param {Array} suppliers - Supplier objects for dynamic injection
 * @returns {object|null} - Label schema or null if not found
 */
export const getSchemaForBusinessType = (businessType, managers = [], suppliers = []) => {
  try {
    return getCompleteSchemaForBusiness(businessType, managers, suppliers);
  } catch (error) {
    console.warn(`⚠️ Could not load schema for ${businessType}:`, error.message);
    return null;
  }
};

/**
 * Deep clone a label object (recursively)
 * @param {object} label - Label object to clone
 * @returns {object} - Cloned label
 */
const cloneLabel = (label) => {
  const cloned = { ...label };
  if (label.sub && Array.isArray(label.sub)) {
    cloned.sub = label.sub.map(subLabel => cloneLabel(subLabel));
  }
  return cloned;
};

/**
 * Merge subcategories from multiple schemas for the same parent category
 * Removes duplicates while preserving unique industry-specific subcategories
 * @param {array} subArrays - Array of sub-label arrays to merge
 * @returns {array} - Merged and deduplicated sub-labels
 */
const mergeSubcategories = (subArrays) => {
  const seen = new Map(); // name -> label object
  const merged = [];

  for (const subArray of subArrays) {
    if (!Array.isArray(subArray)) continue;

    for (const subLabel of subArray) {
      const name = subLabel.name;
      
      if (seen.has(name)) {
        // Label already exists - merge nested sub-labels if both have them
        const existing = seen.get(name);
        if (subLabel.sub && existing.sub) {
          existing.sub = mergeSubcategories([existing.sub, subLabel.sub]);
        } else if (subLabel.sub && !existing.sub) {
          existing.sub = cloneLabel(subLabel).sub;
        }
      } else {
        // New label - add it
        seen.set(name, cloneLabel(subLabel));
        merged.push(seen.get(name));
      }
    }
  }

  return merged;
};

/**
 * Merge labels from multiple schemas
 * Standard categories are deduplicated, industry-specific categories are combined
 * @param {array} schemas - Array of label schema objects
 * @returns {array} - Merged labels array
 */
const mergeLabels = (schemas) => {
  const standardLabels = new Map(); // name -> label object
  const industryLabels = []; // Unique industry-specific categories
  
  for (const schema of schemas) {
    if (!schema.labels || !Array.isArray(schema.labels)) continue;

    for (const label of schema.labels) {
      const name = label.name;

      if (STANDARD_CATEGORIES.has(name)) {
        // Standard category - merge subcategories
        if (standardLabels.has(name)) {
          const existing = standardLabels.get(name);
          if (label.sub && existing.sub) {
            existing.sub = mergeSubcategories([existing.sub, label.sub]);
          } else if (label.sub && !existing.sub) {
            existing.sub = cloneLabel(label).sub;
          }
        } else {
          standardLabels.set(name, cloneLabel(label));
        }
      } else {
        // Industry-specific category - check if already added
        const exists = industryLabels.some(l => l.name === name);
        if (!exists) {
          industryLabels.push(cloneLabel(label));
        }
      }
    }
  }

  // Convert map to array for standard labels
  const standardArray = Array.from(standardLabels.values());
  
  // Combine standard + industry labels
  return [...standardArray, ...industryLabels];
};

/**
 * Merge rootOrder from multiple schemas
 * Standard categories maintain base order, industry-specific categories are appended
 * @param {array} schemas - Array of label schema objects
 * @returns {array} - Merged rootOrder array
 */
const mergeRootOrder = (schemas) => {
  const baseOrder = baseTemplateSchema.rootOrder || [];
  const industryCategories = new Set();

  for (const schema of schemas) {
    if (!schema.rootOrder || !Array.isArray(schema.rootOrder)) continue;

    for (const category of schema.rootOrder) {
      if (!STANDARD_CATEGORIES.has(category) && !baseOrder.includes(category)) {
        industryCategories.add(category);
      }
    }
  }

  return [...baseOrder, ...Array.from(industryCategories)];
};

/**
 * Merge dynamic variables from multiple schemas
 * Combines all unique manager and supplier placeholders
 * @param {array} schemas - Array of label schema objects
 * @returns {object} - Merged dynamicVariables object
 */
const mergeDynamicVariables = (schemas) => {
  const managersSet = new Set();
  const suppliersSet = new Set();

  for (const schema of schemas) {
    if (!schema.dynamicVariables) continue;

    if (schema.dynamicVariables.managers) {
      schema.dynamicVariables.managers.forEach(m => managersSet.add(m));
    }
    if (schema.dynamicVariables.suppliers) {
      schema.dynamicVariables.suppliers.forEach(s => suppliersSet.add(s));
    }
  }

  return {
    managers: Array.from(managersSet).sort(),
    suppliers: Array.from(suppliersSet).sort()
  };
};

/**
 * Merge special rules from multiple schemas
 * Combines and deduplicates special rules, adjusting keywords for multi-business
 * @param {array} schemas - Array of label schema objects
 * @param {array} businessTypes - Business type names
 * @returns {array} - Merged special rules
 */
const mergeSpecialRules = (schemas, businessTypes) => {
  const ruleMap = new Map();
  
  schemas.forEach((schema, index) => {
    if (!schema.specialRules || !Array.isArray(schema.specialRules)) return;
    
    schema.specialRules.forEach(rule => {
      const ruleName = rule.name;
      
      if (ruleMap.has(ruleName)) {
        // Rule exists - merge trigger keywords
        const existing = ruleMap.get(ruleName);
        if (rule.trigger && rule.trigger.keywords_in_body) {
          existing.trigger.keywords_in_body = [
            ...new Set([
              ...(existing.trigger.keywords_in_body || []),
              ...(rule.trigger.keywords_in_body || [])
            ])
          ];
        }
      } else {
        // New rule - add it
        ruleMap.set(ruleName, JSON.parse(JSON.stringify(rule)));
      }
    });
  });
  
  return Array.from(ruleMap.values());
};

/**
 * Merge auto-reply rules from multiple schemas
 * Uses most restrictive settings for safety
 * @param {array} schemas - Array of label schema objects
 * @returns {object} - Merged auto-reply rules
 */
const mergeAutoReplyRules = (schemas) => {
  const merged = {
    enabled: true,
    minConfidence: 0.75,
    enabledCategories: new Set(['Support', 'Sales', 'Urgent']),
    conditions: []
  };
  
  schemas.forEach(schema => {
    if (!schema.autoReplyRules) return;
    
    // Use highest confidence threshold (most restrictive)
    if (schema.autoReplyRules.minConfidence > merged.minConfidence) {
      merged.minConfidence = schema.autoReplyRules.minConfidence;
    }
    
    // Combine enabled categories
    if (schema.autoReplyRules.enabledCategories) {
      schema.autoReplyRules.enabledCategories.forEach(cat => {
        merged.enabledCategories.add(cat);
      });
    }
    
    // Merge conditions (deduplicate)
    if (schema.autoReplyRules.conditions) {
      schema.autoReplyRules.conditions.forEach(condition => {
        if (!merged.conditions.find(c => c.rule === condition.rule)) {
          merged.conditions.push(condition);
        }
      });
    }
  });
  
  merged.enabledCategories = Array.from(merged.enabledCategories);
  
  return merged;
};

/**
 * Merge domain detection rules from multiple schemas
 * Combines suppliers, phone providers, and internal domains
 * @param {array} schemas - Array of label schema objects
 * @returns {object} - Merged domain detection
 */
const mergeDomainDetection = (schemas) => {
  const merged = {
    suppliers: [],
    phoneProviders: [],
    internalDomains: []
  };
  
  const seenSuppliers = new Set();
  const seenPhoneProviders = new Set();
  const seenInternalDomains = new Set();
  
  schemas.forEach(schema => {
    if (!schema.domainDetection) return;
    
    // Merge suppliers
    if (schema.domainDetection.suppliers) {
      schema.domainDetection.suppliers.forEach(supplier => {
        const key = supplier.name + (supplier.domains?.join(',') || '');
        if (!seenSuppliers.has(key)) {
          merged.suppliers.push(supplier);
          seenSuppliers.add(key);
        }
      });
    }
    
    // Merge phone providers
    if (schema.domainDetection.phoneProviders) {
      schema.domainDetection.phoneProviders.forEach(provider => {
        if (!seenPhoneProviders.has(provider.email)) {
          merged.phoneProviders.push(provider);
          seenPhoneProviders.add(provider.email);
        }
      });
    }
    
    // Merge internal domains
    if (schema.domainDetection.internalDomains) {
      schema.domainDetection.internalDomains.forEach(domain => {
        if (!seenInternalDomains.has(domain)) {
          merged.internalDomains.push(domain);
          seenInternalDomains.add(domain);
        }
      });
    }
  });
  
  return merged;
};

/**
 * Merge multiple business type label schemas into a unified schema
 * ENHANCED: Now supports special rules, auto-reply, domain detection, and tertiary categories
 * @param {array} businessTypes - Array of business type names (e.g., ['Electrician', 'Plumber'])
 * @returns {object} - Merged label schema with production features
 */
export const mergeBusinessTypeSchemas = (businessTypes, managers = [], suppliers = []) => {
  // Validate input
  if (!Array.isArray(businessTypes) || businessTypes.length === 0) {
    console.warn('No business types provided, using base schema');
    return getCompleteSchemaForBusiness('Pools & Spas', managers, suppliers); // Default fallback
  }

  // If only one business type, return its schema directly
  if (businessTypes.length === 1) {
    const schema = getSchemaForBusinessType(businessTypes[0], managers, suppliers);
    return schema || getCompleteSchemaForBusiness('Pools & Spas', managers, suppliers);
  }

  // Load all schemas for selected business types
  const schemas = businessTypes
    .map(type => getSchemaForBusinessType(type, managers, suppliers))
    .filter(schema => schema !== null);

  // If no valid schemas found, use base template
  if (schemas.length === 0) {
    console.warn('No valid schemas found for business types:', businessTypes);
    return getCompleteSchemaForBusiness('Pools & Spas', managers, suppliers);
  }

  console.log(`🔄 Merging ${schemas.length} label schemas for:`, businessTypes);

  // Merge all components
  const mergedSchema = {
    meta: {
      schemaVersion: "v3.0",
      industry: businessTypes.join(' + '),
      author: "AI Schema Merger - Multi-Business Production",
      lastUpdated: new Date().toISOString(),
      source: "merged",
      sourceBusinessTypes: businessTypes,
      enhancedClassification: true,
      productionStyle: true
    },
    description: `Merged label schema for ${businessTypes.join(' and ')} businesses with production features`,
    rootOrder: mergeRootOrder(schemas),
    labels: mergeLabels(schemas),
    dynamicVariables: mergeDynamicVariables(schemas)
  };

  // NEW: Merge production features
  mergedSchema.specialRules = mergeSpecialRules(schemas, businessTypes);
  mergedSchema.autoReplyRules = mergeAutoReplyRules(schemas);
  mergedSchema.domainDetection = mergeDomainDetection(schemas);

  console.log(`✅ Production-style schema merge complete:`, {
    businessTypes: businessTypes,
    totalLabels: mergedSchema.labels.length,
    specialRules: mergedSchema.specialRules.length,
    suppliers: mergedSchema.domainDetection.suppliers.length,
    autoReplyEnabled: mergedSchema.autoReplyRules.enabled,
    minConfidence: mergedSchema.autoReplyRules.minConfidence
  });
  
  return mergedSchema;
};

/**
 * Get merged label schema for user's business types from profile
 * @param {object} profile - User profile with business_types array or business_type string
 * @returns {object} - Merged label schema
 */
export const getMergedSchemaFromProfile = (profile) => {
  let businessTypes = [];

  // Handle both new (business_types array) and legacy (business_type string) formats
  if (profile.business_types && Array.isArray(profile.business_types)) {
    businessTypes = profile.business_types;
  } else if (profile.business_type) {
    businessTypes = [profile.business_type];
  }

  return mergeBusinessTypeSchemas(businessTypes);
};

/**
 * Validate that a merged schema has no duplicate category names
 * @param {object} schema - Label schema to validate
 * @returns {object} - { isValid: boolean, duplicates: array }
 */
export const validateMergedSchema = (schema) => {
  const topLevelNames = new Set();
  const duplicates = [];

  if (!schema.labels || !Array.isArray(schema.labels)) {
    return { isValid: false, duplicates: ['No labels array found'] };
  }

  for (const label of schema.labels) {
    if (topLevelNames.has(label.name)) {
      duplicates.push(label.name);
    } else {
      topLevelNames.add(label.name);
    }
  }

  return {
    isValid: duplicates.length === 0,
    duplicates: duplicates
  };
};

export default {
  mergeBusinessTypeSchemas,
  getMergedSchemaFromProfile,
  getSchemaForBusinessType,
  validateMergedSchema
};

