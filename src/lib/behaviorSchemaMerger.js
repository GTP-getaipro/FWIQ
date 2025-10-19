/**
 * Behavior Schema Merger
 * Intelligently merges multiple business type behavior schemas for multi-business operations
 * Handles voice profiles, AI draft rules, signatures, and category-specific language
 */

import baseTemplate from '@/behaviorSchemas/_template.json';
import electricianBehavior from '@/behaviorSchemas/electrician.json';
import plumberBehavior from '@/behaviorSchemas/plumber.json';
import poolsSpasBehavior from '@/behaviorSchemas/pools_spas.json';
import hotTubSpaBehavior from '@/behaviorSchemas/hot_tub_spa.json';
import saunaIcebathBehavior from '@/behaviorSchemas/sauna_icebath.json';
import flooringBehavior from '@/behaviorSchemas/flooring_contractor.json';
import generalContractorBehavior from '@/behaviorSchemas/general_contractor.json';
import hvacBehavior from '@/behaviorSchemas/hvac.json';
import insulationFoamSprayBehavior from '@/behaviorSchemas/insulation_foam_spray.json';
import landscapingBehavior from '@/behaviorSchemas/landscaping.json';
import paintingBehavior from '@/behaviorSchemas/painting_contractor.json';
import roofingBehavior from '@/behaviorSchemas/roofing.json';

// Behavior schema mapping by business type name
const BEHAVIOR_SCHEMA_MAP = {
  'Electrician': electricianBehavior,
  'Plumber': plumberBehavior,
  'Pools': poolsSpasBehavior,
  'Pools & Spas': poolsSpasBehavior,
  'Hot tub & Spa': hotTubSpaBehavior,
  'Sauna & Icebath': saunaIcebathBehavior,
  'Flooring': flooringBehavior,
  'Flooring Contractor': flooringBehavior,
  'General Construction': generalContractorBehavior,
  'General Contractor': generalContractorBehavior,
  'HVAC': hvacBehavior,
  'Insulation & Foam Spray': insulationFoamSprayBehavior,
  'Landscaping': landscapingBehavior,
  'Painting': paintingBehavior,
  'Painting Contractor': paintingBehavior,
  'Roofing': roofingBehavior,
  'Roofing Contractor': roofingBehavior,
};

/**
 * Get behavior schema for a single business type
 * @param {string} businessType - Business type name
 * @returns {object|null} - Behavior schema or null if not found
 */
export const getBehaviorSchemaForBusinessType = (businessType) => {
  return BEHAVIOR_SCHEMA_MAP[businessType] || null;
};

/**
 * Merge voice profiles from multiple behavior schemas
 * Creates a blended tone that reflects multi-service capabilities
 * @param {array} schemas - Array of behavior schema objects
 * @param {array} businessTypes - Original business type names
 * @returns {object} - Merged voice profile
 */
const mergeVoiceProfiles = (schemas, businessTypes) => {
  if (schemas.length === 0) return baseTemplate.voiceProfile;
  if (schemas.length === 1) return schemas[0].voiceProfile;

  // Collect all tones
  const tones = schemas.map(s => s.voiceProfile?.tone).filter(t => t);
  
  // Extract key characteristics
  const characteristics = new Set();
  tones.forEach(tone => {
    const parts = tone.toLowerCase().split(/,|\sand\s/);
    parts.forEach(part => {
      const cleaned = part.trim();
      if (cleaned) characteristics.add(cleaned);
    });
  });

  // Build blended tone
  const characteristicsList = Array.from(characteristics).slice(0, 4); // Limit to 4 key traits
  const blendedTone = characteristicsList.join(', ') + ` with multi-service expertise (${businessTypes.join(' + ')})`;

  // Use most professional formality level (higher = more formal)
  const formalityLevels = { 'casual': 1, 'medium': 2, 'professional': 3 };
  const formalityValues = schemas.map(s => formalityLevels[s.voiceProfile?.formalityLevel] || 2);
  const maxFormality = Math.max(...formalityValues);
  const formalityLevel = Object.keys(formalityLevels).find(k => formalityLevels[k] === maxFormality) || 'medium';

  // Use most permissive pricing policy (any true = true)
  const allowPricing = schemas.some(s => s.voiceProfile?.allowPricingInReplies);

  return {
    tone: blendedTone,
    formalityLevel: formalityLevel,
    allowPricingInReplies: allowPricing,
    includeSignature: true
  };
};

/**
 * Merge signatures from multiple schemas
 * Uses primary business type's signature with multi-service note
 * @param {array} schemas - Array of behavior schema objects
 * @param {array} businessTypes - Original business type names
 * @returns {object} - Merged signature
 */
const mergeSignatures = (schemas, businessTypes) => {
  if (schemas.length === 0) return baseTemplate.signature;
  if (schemas.length === 1) return schemas[0].signature;

  // Use primary (first) business type's signature as base
  const primarySignature = schemas[0].signature || baseTemplate.signature;

  // Add multi-service context if 2+ types
  const closingText = businessTypes.length > 1
    ? `Thanks for choosing us for your ${businessTypes.slice(0, 2).join(' and ')}${businessTypes.length > 2 ? ' and more' : ''} needs!`
    : primarySignature.closingText;

  return {
    closingText: closingText,
    signatureBlock: primarySignature.signatureBlock
  };
};

/**
 * Merge AI draft rules from multiple schemas
 * Combines behavior goals, guidelines, and policies
 * @param {array} schemas - Array of behavior schema objects
 * @param {array} businessTypes - Original business type names
 * @returns {object} - Merged AI draft rules
 */
const mergeAIDraftRules = (schemas, businessTypes) => {
  if (schemas.length === 0) return baseTemplate.aiDraftRules;
  if (schemas.length === 1) return schemas[0].aiDraftRules;

  // Merge behavior goals (combine unique goals)
  const allGoals = new Set();
  schemas.forEach(s => {
    (s.aiDraftRules?.behaviorGoals || []).forEach(goal => allGoals.add(goal));
  });

  // Add multi-service coordination goal
  if (businessTypes.length > 1) {
    allGoals.add(`Coordinate between ${businessTypes.join(', ')} services when customer needs span multiple areas`);
  }

  // Merge auto-reply policy (combine categories, use highest confidence)
  const allCategories = new Set();
  let minConfidence = 0.75;
  schemas.forEach(s => {
    (s.aiDraftRules?.autoReplyPolicy?.enableForCategories || []).forEach(cat => allCategories.add(cat));
    if (s.aiDraftRules?.autoReplyPolicy?.minConfidence) {
      minConfidence = Math.max(minConfidence, s.aiDraftRules.autoReplyPolicy.minConfidence);
    }
  });

  const primaryDomain = schemas[0].aiDraftRules?.autoReplyPolicy?.excludeInternalDomains?.[0] || "@businessdomain.com";

  // Merge follow-up guidelines (combine preferred phrasing)
  const allPhrasing = [];
  schemas.forEach(s => {
    (s.aiDraftRules?.followUpGuidelines?.preferredPhrasing || []).forEach(phrase => {
      if (!allPhrasing.includes(phrase)) {
        allPhrasing.push(phrase);
      }
    });
  });

  // Use primary schema's reply format as base
  const primaryFormat = schemas[0].aiDraftRules?.replyFormat || baseTemplate.aiDraftRules.replyFormat;

  // Merge upsell guidelines
  const upsellEnabled = schemas.some(s => s.aiDraftRules?.upsellGuidelines?.enabled);
  const allUpsellCategories = new Set();
  schemas.forEach(s => {
    (s.aiDraftRules?.upsellGuidelines?.triggerCategories || []).forEach(cat => allUpsellCategories.add(cat));
  });

  // Combine upsell text
  const upsellTexts = schemas
    .map(s => s.aiDraftRules?.upsellGuidelines?.text)
    .filter(t => t);
  const mergedUpsellText = businessTypes.length > 1
    ? `We offer ${businessTypes.join(', ')} services. While we're addressing your ${businessTypes[0].toLowerCase()} needs, we can also help with related services to save you time and money.`
    : upsellTexts[0];

  // Merge error handling
  const primaryErrorHandling = schemas[0].aiDraftRules?.errorHandling || baseTemplate.aiDraftRules.errorHandling;

  return {
    behaviorGoals: Array.from(allGoals),
    autoReplyPolicy: {
      enableForCategories: Array.from(allCategories),
      minConfidence: minConfidence,
      excludeInternalDomains: [primaryDomain]
    },
    followUpGuidelines: {
      acknowledgeDelay: true,
      requireNextStep: true,
      preferredPhrasing: allPhrasing.slice(0, 6) // Limit to 6 phrases
    },
    replyFormat: primaryFormat,
    upsellGuidelines: {
      enabled: upsellEnabled,
      triggerCategories: Array.from(allUpsellCategories),
      text: mergedUpsellText
    },
    errorHandling: primaryErrorHandling,
    specialInstructions: schemas[0].aiDraftRules?.specialInstructions || {}
  };
};

/**
 * Merge category overrides from multiple schemas
 * Combines custom language for each category across all schemas
 * @param {array} schemas - Array of behavior schema objects
 * @returns {object} - Merged category overrides
 */
const mergeCategoryOverrides = (schemas) => {
  const merged = {};

  schemas.forEach(schema => {
    if (!schema.categoryOverrides) return;

    for (const [category, override] of Object.entries(schema.categoryOverrides)) {
      if (!merged[category]) {
        merged[category] = {
          priorityLevel: override.priorityLevel,
          customLanguage: []
        };
      }

      // Merge custom language (deduplicate)
      if (override.customLanguage && Array.isArray(override.customLanguage)) {
        override.customLanguage.forEach(lang => {
          if (!merged[category].customLanguage.includes(lang)) {
            merged[category].customLanguage.push(lang);
          }
        });
      }

      // Use highest priority level (lower number = higher priority)
      if (override.priorityLevel < merged[category].priorityLevel) {
        merged[category].priorityLevel = override.priorityLevel;
      }
    }
  });

  return merged;
};

/**
 * Merge multiple business type behavior schemas
 * Combines voice profiles, AI rules, signatures, and category overrides
 * @param {array} businessTypes - Array of business type names
 * @returns {object} - Merged behavior schema
 */
export const mergeBusinessTypeBehaviors = (businessTypes) => {
  // Validate input
  if (!Array.isArray(businessTypes) || businessTypes.length === 0) {
    console.warn('No business types provided for behavior merge, using base template');
    return baseTemplate;
  }

  // If only one business type, return its schema directly
  if (businessTypes.length === 1) {
    const schema = getBehaviorSchemaForBusinessType(businessTypes[0]);
    return schema || baseTemplate;
  }

  // Load all schemas for selected business types
  const schemas = businessTypes
    .map(type => getBehaviorSchemaForBusinessType(type))
    .filter(schema => schema !== null);

  if (schemas.length === 0) {
    console.warn('No valid behavior schemas found for business types:', businessTypes);
    return baseTemplate;
  }

  // Merge all components
  const mergedBehavior = {
    meta: {
      schemaVersion: "v2.0",
      industry: businessTypes.join(' + '),
      author: "AI Behavior Merger - Multi-Business",
      lastUpdated: new Date().toISOString(),
      source: "merged",
      sourceBusinessTypes: businessTypes
    },

    voiceProfile: mergeVoiceProfiles(schemas, businessTypes),
    signature: mergeSignatures(schemas, businessTypes),
    aiDraftRules: mergeAIDraftRules(schemas, businessTypes),
    categoryOverrides: mergeCategoryOverrides(schemas),

    validation: {
      requiredFields: ["voiceProfile", "aiDraftRules", "signature"],
      optionalFields: ["categoryOverrides", "specialInstructions"],
      strictMode: true
    }
  };

  console.log(`✅ Successfully merged ${schemas.length} behavior schemas for:`, businessTypes);
  console.log(`📊 Merged behavior contains:`);
  console.log(`   - ${mergedBehavior.aiDraftRules.behaviorGoals.length} behavior goals`);
  console.log(`   - ${mergedBehavior.aiDraftRules.autoReplyPolicy.enableForCategories.length} auto-reply categories`);
  console.log(`   - ${Object.keys(mergedBehavior.categoryOverrides).length} category overrides`);

  return mergedBehavior;
};

/**
 * Get merged behavior schema from user profile
 * @param {object} profile - User profile with business_types
 * @returns {object} - Merged behavior schema
 */
export const getMergedBehaviorFromProfile = (profile) => {
  let businessTypes = [];

  if (profile.business_types && Array.isArray(profile.business_types)) {
    businessTypes = profile.business_types;
  } else if (profile.business_type) {
    businessTypes = [profile.business_type];
  }

  return mergeBusinessTypeBehaviors(businessTypes);
};

/**
 * Validate behavior schema structure
 * @param {object} schema - Behavior schema to validate
 * @returns {object} - { isValid: boolean, issues: array }
 */
export const validateBehaviorSchema = (schema) => {
  const issues = [];

  // Check required fields
  const requiredFields = schema.validation?.requiredFields || ['voiceProfile', 'aiDraftRules', 'signature'];
  for (const field of requiredFields) {
    if (!schema[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  }

  // Validate voiceProfile
  if (schema.voiceProfile) {
    if (!schema.voiceProfile.tone) issues.push('Missing voiceProfile.tone');
    if (!schema.voiceProfile.formalityLevel) issues.push('Missing voiceProfile.formalityLevel');
  }

  // Validate aiDraftRules
  if (schema.aiDraftRules) {
    if (!schema.aiDraftRules.behaviorGoals || schema.aiDraftRules.behaviorGoals.length === 0) {
      issues.push('Missing or empty aiDraftRules.behaviorGoals');
    }
    if (!schema.aiDraftRules.autoReplyPolicy) {
      issues.push('Missing aiDraftRules.autoReplyPolicy');
    }
  }

  // Validate signature
  if (schema.signature) {
    if (!schema.signature.signatureBlock) issues.push('Missing signature.signatureBlock');
  }

  return {
    isValid: issues.length === 0,
    issues: issues
  };
};

/**
 * Extract behavior configuration for n8n workflow injection
 * Converts behavior schema to n8n-ready format
 * @param {object} behaviorSchema - Behavior schema
 * @param {object} businessInfo - Business information (name, phone, etc.)
 * @returns {object} - n8n-ready behavior configuration
 */
export const extractBehaviorForN8n = (behaviorSchema, businessInfo) => {
  // Replace template variables in signature
  let signatureBlock = behaviorSchema.signature?.signatureBlock || '';
  signatureBlock = signatureBlock
    .replace(/\{\{businessProfile\.businessName\}\}/g, businessInfo.name || 'Business')
    .replace(/\{\{contactInfo\.afterHoursSupportLine\}\}/g, businessInfo.phone || '');

  // Build n8n configuration
  return {
    tone: behaviorSchema.voiceProfile?.tone,
    formalityLevel: behaviorSchema.voiceProfile?.formalityLevel,
    allowPricing: behaviorSchema.voiceProfile?.allowPricingInReplies,
    
    signature: {
      closingText: behaviorSchema.signature?.closingText,
      signatureBlock: signatureBlock
    },

    behaviorGoals: behaviorSchema.aiDraftRules?.behaviorGoals || [],
    
    autoReplyPolicy: {
      enabledCategories: behaviorSchema.aiDraftRules?.autoReplyPolicy?.enableForCategories || [],
      minConfidence: behaviorSchema.aiDraftRules?.autoReplyPolicy?.minConfidence || 0.75,
      excludeDomains: [businessInfo.emailDomain]
    },

    followUpGuidelines: behaviorSchema.aiDraftRules?.followUpGuidelines?.preferredPhrasing || [],
    
    upsellText: behaviorSchema.aiDraftRules?.upsellGuidelines?.text || '',
    upsellEnabled: behaviorSchema.aiDraftRules?.upsellGuidelines?.enabled || false,

    categoryOverrides: behaviorSchema.categoryOverrides || {},

    specialInstructions: behaviorSchema.aiDraftRules?.specialInstructions || {}
  };
};

export default {
  mergeBusinessTypeBehaviors,
  getMergedBehaviorFromProfile,
  getBehaviorSchemaForBusinessType,
  validateBehaviorSchema,
  extractBehaviorForN8n
};

