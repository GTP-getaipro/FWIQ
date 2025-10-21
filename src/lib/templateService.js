import { extractAIConfigForN8n, generateAIPlaceholders, buildLabelAwareSystemMessage, loadLabelSchemaForBusinessTypes, buildProductionClassifier } from '@/lib/aiSchemaInjector.js';
import { extractBehaviorConfigForN8n, generateBehaviorPlaceholders } from '@/lib/behaviorSchemaInjector.js';

// Production-ready N8N workflow template (loaded dynamically to avoid build issues)
let cachedUniversalTemplate = null;

/**
 * Clear the cached template to force reload of updated template
 */
export function clearTemplateCache() {
  cachedUniversalTemplate = null;
  console.log('🗑️ Template cache cleared - next load will fetch fresh template');
}

/**
 * Load the production workflow template based on provider (Gmail or Outlook)
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Promise<object>} - Template object
 */
async function loadTemplateForProvider(provider = 'gmail') {
  try {
    // Get backend URL from runtime config or environment
    const runtimeConfig = typeof window !== 'undefined' && window.__RUNTIME_CONFIG__;
    const backendUrl = runtimeConfig?.BACKEND_URL || 
                      import.meta.env.BACKEND_URL || 
                      'http://localhost:3001';
    
    // Load template from backend API
    const response = await fetch(`${backendUrl}/api/templates/${provider}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${provider} template: ${response.statusText}`);
    }
    const template = await response.json();
    console.log(`✅ Production ${provider} template loaded via backend API:`, {
      nodes: template.nodes?.length,
      version: template.meta?.templateVersion
    });
    return template;
  } catch (error) {
    console.error(`❌ Failed to load ${provider} template:`, error);
    // Return a minimal fallback
    return {
      name: 'Fallback Workflow',
      nodes: [],
      connections: {}
    };
  }
}

/**
 * Load the universal template (DEPRECATED - use loadTemplateForProvider instead)
 * @returns {Promise<object>} - Template object
 */
async function loadUniversalTemplate() {
  if (cachedUniversalTemplate) {
    return cachedUniversalTemplate;
  }
  
  // Default to Gmail template for backward compatibility
  cachedUniversalTemplate = await loadTemplateForProvider('gmail');
  return cachedUniversalTemplate;
}

/**
 * Get n8n template for business type(s) and email provider
 * Now uses production-ready template for ALL business types
 * @param {string|array} businessType - Single type or array of types  
 * @param {string} provider - 'gmail' or 'outlook' (defaults to 'gmail')
 * @returns {Promise<object>} - n8n workflow template
 */
export const getTemplateForBusinessType = async (businessType, provider = 'gmail') => {
  // Load the provider-specific production template
  // Works for ALL business types via 3-Layer Schema System:
  // - Layer 1: AI_SYSTEM_MESSAGE (business-specific keywords & rules)
  // - Layer 2: BEHAVIOR_REPLY_PROMPT (voice profile + few-shot examples)
  // - Layer 3: Dynamic label IDs for routing
  console.log(`📂 Loading ${provider} template for business type: ${businessType}`);
  return await loadTemplateForProvider(provider);
};

/**
 * Safely escape a string for JSON string literal context
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for JSON
 */
const escapeForJson = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')   // Escape backslashes first
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t')    // Escape tabs
    .replace(/[\x08]/g, '\\b')    // Escape actual backspace character (0x08) only
    .replace(/\f/g, '\\f')    // Escape form feeds
    .replace(/[\x00-\x07\x0B\x0E-\x1F\x7F-\x9F]/g, ''); // Remove other control characters (excluding \b)
};

// Clean up business names for titles and placeholders
const sanitizeBusinessName = (name) => {
  const raw = name == null ? '' : String(name);
  return raw
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Enhanced workflow name sanitization for consistent formatting
const sanitizeWorkflowName = (name) => {
  if (!name) return 'Untitled Workflow';
  return name
    .replace(/[|]/g, '') // Remove specific problematic characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove ALL control characters including \b
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim(); // Trim leading/trailing whitespace
};

// Special sanitization for workflow names (removes control chars, doesn't escape)
const sanitizeForWorkflowName = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove ALL control characters
    .replace(/[|]/g, '') // Remove specific problematic characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim(); // Trim leading/trailing whitespace
};

// Helper function to format business hours from onboarding data
const formatBusinessHours = (businessHours) => {
  if (!businessHours || typeof businessHours !== 'object') {
    return 'Monday-Friday 8AM-5PM';
  }
  
  const { mon_fri, sat, sun } = businessHours;
  
  let hours = '';
  if (mon_fri) {
    hours += `Monday-Friday ${mon_fri}`;
  }
  if (sat && sat !== 'Closed') {
    hours += hours ? `, Saturday ${sat}` : `Saturday ${sat}`;
  }
  if (sun && sun !== 'Closed') {
    hours += hours ? `, Sunday ${sun}` : `Sunday ${sun}`;
  }
  
  return hours || 'Monday-Friday 8AM-5PM';
};

export const injectOnboardingData = async (clientData) => {
  // Get the appropriate template based on business type(s)
  // Support both single type (string) and multiple types (array)
  let businessType = clientData.business?.type || 'Pools & Spas';
  
  // Handle business_types array (multi-business mode)
  if (clientData.business?.types && Array.isArray(clientData.business.types) && clientData.business.types.length > 0) {
    businessType = clientData.business.types;
  }
  
  // Normalize to array for schema processing
  const businessTypes = Array.isArray(businessType) ? businessType : [businessType];
  
  // Detect provider from clientData
  const provider = clientData.provider || 'gmail';
  console.log(`📧 Using ${provider} template for workflow injection`);
  
  const selectedTemplate = await getTemplateForBusinessType(businessType, provider);
  
  let templateString = JSON.stringify(selectedTemplate);

  const { business, contact, services, rules, integrations, id: clientId, version } = clientData;

  // Sanitize all business data to remove control characters
  const sanitizedBusinessName = sanitizeBusinessName(business.name);
  const sanitizedEmailDomain = sanitizeForWorkflowName(business.emailDomain);
  const sanitizedCurrency = sanitizeForWorkflowName(business.currency);
  const sanitizedPhone = sanitizeForWorkflowName(contact.phone);
  
  const signatureBlock = `\\n\\nBest regards,\\nThe ${sanitizedBusinessName} Team\\n${sanitizedPhone}`;

  const serviceCatalogText = (services || []).map(s => 
    `- ${escapeForJson(sanitizeForWorkflowName(s.name))} (${escapeForJson(sanitizeForWorkflowName(s.pricingType))} ${escapeForJson(sanitizeForWorkflowName(s.price))} ${sanitizedCurrency}): ${escapeForJson(sanitizeForWorkflowName(s.description))}`
  ).join('\\n');
  
  const managersText = (clientData.managers || []).map(m => escapeForJson(sanitizeForWorkflowName(m.name))).join(', ');

  // ENHANCED: Extract AI configuration from Layer 1 (businessSchemas)
  // Include ALL business information from onboarding wizard
  const businessInfo = {
    name: sanitizedBusinessName, // Use sanitized name for consistency
    phone: sanitizedPhone,
    emailDomain: sanitizedEmailDomain,
    businessTypes: businessTypes, // Include business types for better categorization
    address: business.address,
    city: business.city,
    state: business.state,
    zipCode: business.zipCode,
    country: business.country,
    websiteUrl: contact.website, // Website is stored in contact object
    currency: sanitizedCurrency,
    timezone: business.timezone,
    businessCategory: business.category, // Category is stored as 'category' not 'businessCategory'
    // Include service areas - construct from address components
    serviceAreas: business.serviceArea ? [business.serviceArea] : [business.city || business.state || 'Main service area'],
    // Include operating hours and response time
    operatingHours: rules.businessHours ? formatBusinessHours(rules.businessHours) : 'Monday-Friday 8AM-5PM',
    responseTime: rules.sla || '24 hours',
    // Include contact information
    contactEmail: contact.primary?.email,
    contactPhone: sanitizedPhone,
    // Include services information
    services: services || [],
    // Include rules and integrations
    rules: rules || {},
    integrations: integrations || {},
    // Include managers and suppliers from clientData
    managers: clientData.managers || [],
    suppliers: clientData.suppliers || []
  };
  
  // Debug: Log business info to see what's being passed
  console.log('🔍 DEBUG: Business info being passed to behavior config:', {
    name: businessInfo.name,
    phone: businessInfo.phone,
    websiteUrl: businessInfo.websiteUrl,
    emailDomain: businessInfo.emailDomain,
    businessTypes: businessInfo.businessTypes,
    managers: businessInfo.managers?.length || 0,
    suppliers: businessInfo.suppliers?.length || 0
  });
  
  // Debug: Log raw client data to see what we're working with
  console.log('🔍 DEBUG: Raw client data:', {
    businessName: business.name,
    sanitizedBusinessName: sanitizedBusinessName,
    businessEmailDomain: business.emailDomain,
    sanitizedEmailDomain: sanitizedEmailDomain,
    businessPhone: contact.phone,
    sanitizedPhone: sanitizedPhone,
    businessWebsite: business.websiteUrl,
    businessTypes: businessTypes,
    managersCount: clientData.managers?.length || 0,
    suppliersCount: clientData.suppliers?.length || 0
  });
  
  // Debug: Log the businessInfo being passed to buildProductionClassifier
  console.log('🔍 DEBUG: BusinessInfo being passed to buildProductionClassifier:', {
    name: businessInfo.name,
    phone: businessInfo.phone,
    emailDomain: businessInfo.emailDomain,
    businessTypes: businessInfo.businessTypes,
    address: businessInfo.address,
    city: businessInfo.city,
    state: businessInfo.state,
    zipCode: businessInfo.zipCode,
    country: businessInfo.country,
    websiteUrl: businessInfo.websiteUrl,
    currency: businessInfo.currency,
    timezone: businessInfo.timezone,
    businessCategory: businessInfo.businessCategory
  });
  
  let aiConfig = null;
  let labelConfig = null;
  let aiPlaceholders = {};
  
  try {
    // Step 1: Extract AI config from Layer 1
    aiConfig = extractAIConfigForN8n(businessTypes, businessInfo);
    
    // Step 2: Load Label config from Layer 3 with dynamic team data (ENHANCED!)
    try {
      labelConfig = await loadLabelSchemaForBusinessTypes(
        businessTypes, 
        clientData.managers || [], 
        clientData.suppliers || []
      );
      console.log('✅ Label schema loaded from Layer 3 with dynamic team data');
      
      // Debug: Check if SUPPLIERS label has processed subcategories
      const suppliersLabel = labelConfig?.labels?.find(label => label.name === 'SUPPLIERS');
      if (suppliersLabel) {
        console.log('🔍 DEBUG: SUPPLIERS label subcategories:', suppliersLabel.sub);
        const hasPlaceholders = suppliersLabel.sub?.some(sub => 
          typeof sub === 'object' && sub.name && sub.name.includes('{{Supplier')
        );
        if (hasPlaceholders) {
          console.warn('⚠️ SUPPLIERS label still contains placeholders - dynamic replacement may have failed');
        } else {
          console.log('✅ SUPPLIERS label placeholders successfully replaced');
        }
      }
    } catch (labelError) {
      console.warn('⚠️ Could not load label schema:', labelError.message);
      labelConfig = { labels: [] };
    }
    
    // Step 3: Build PRODUCTION-STYLE classifier with tertiary categories (ENHANCED!)
    if (labelConfig && labelConfig.labels && labelConfig.labels.length > 0) {
      // Use production-style classifier (Hot Tub Man style) with full features
      // ENHANCED: Pass actual provisioned labels for business-specific system message
      const productionClassifier = buildProductionClassifier(
        aiConfig, 
        labelConfig, 
        businessInfo,
        clientData.managers || [],
        clientData.suppliers || [],
        clientData.email_labels || null  // Pass actual labels created in email system
      );
      aiPlaceholders['<<<AI_SYSTEM_MESSAGE>>>'] = productionClassifier;
      console.log('✅ Production-style classifier generated with tertiary categories, special rules, and auto-reply logic');
      console.log('🔍 DEBUG: AI System Message placeholder set:', {
        hasClassifier: !!productionClassifier,
        classifierLength: productionClassifier?.length || 0,
        placeholderKey: '<<<AI_SYSTEM_MESSAGE>>>'
      });
    } else {
      // Fallback to label-aware system message
      const labelAwareSystemMessage = buildLabelAwareSystemMessage(aiConfig, labelConfig, businessInfo);
      aiPlaceholders['<<<AI_SYSTEM_MESSAGE>>>'] = labelAwareSystemMessage;
      console.log('✅ Label-aware AI system message generated');
    }
    
    // Generate other AI placeholders
    aiPlaceholders['<<<AI_KEYWORDS>>>'] = aiConfig.keywordsJSON || JSON.stringify(['urgent', 'emergency', 'ASAP']);
    aiPlaceholders['<<<AI_INTENT_MAPPING>>>'] = aiConfig.intentMappingJSON || JSON.stringify({});
    aiPlaceholders['<<<AI_CLASSIFICATION_RULES>>>'] = aiConfig.classificationRules || '';
    aiPlaceholders['<<<AI_BUSINESS_TYPES>>>'] = aiConfig.businessTypes || businessTypes.join(' + ');
    
    console.log('✅ AI config extracted from Layer 1 + Layer 3 (businessSchemas + labelSchemas)');
  } catch (error) {
    console.warn('⚠️ Could not extract AI config, using defaults:', error.message);
    aiPlaceholders = {
      '<<<AI_KEYWORDS>>>': JSON.stringify(['urgent', 'emergency', 'ASAP', 'service', 'quote']),
      '<<<AI_SYSTEM_MESSAGE>>>': `You are an email classifier for ${business.name}. Categorize emails accurately.`,
      '<<<AI_INTENT_MAPPING>>>': JSON.stringify({}),
      '<<<AI_CLASSIFICATION_RULES>>>': '',
      '<<<AI_BUSINESS_TYPES>>>': businessTypes.join(' + ')
    };
  }
  
  // ENHANCED: Extract Behavior configuration from Layer 2 (behaviorSchemas) + Voice Training
  let behaviorConfig = null;
  let behaviorPlaceholders = {};
  try {
    behaviorConfig = extractBehaviorConfigForN8n(businessTypes, businessInfo, clientData.voiceProfile);
    behaviorPlaceholders = generateBehaviorPlaceholders(behaviorConfig);
    console.log('✅ Behavior config extracted from Layer 2 (behaviorSchemas + voice training)');
    if (clientData.voiceProfile?.learning_count > 0) {
      console.log(`🎤 Voice profile included: ${clientData.voiceProfile.learning_count} edits analyzed`);
    }
  } catch (error) {
    console.warn('⚠️ Could not extract behavior config, using defaults:', error.message);
    behaviorPlaceholders = {
      '<<<BEHAVIOR_VOICE_TONE>>>': rules?.tone || 'Professional and friendly',
      '<<<BEHAVIOR_FORMALITY>>>': 'professional',
      '<<<BEHAVIOR_ALLOW_PRICING>>>': String(rules?.aiGuardrails?.allowPricing || false),
      '<<<BEHAVIOR_REPLY_PROMPT>>>': `Draft professional replies for ${business.name}.`,
      '<<<BEHAVIOR_GOALS>>>': '1. Be helpful\n2. Be professional',
      '<<<BEHAVIOR_UPSELL_TEXT>>>': '',
      '<<<BEHAVIOR_FOLLOWUP_TEXT>>>': ''
    };
  }

  // BASE REPLACEMENTS
  const replacements = {
    // Business info
    "<<<BUSINESS_NAME>>>": sanitizeForWorkflowName(sanitizedBusinessName) || 'Your Business',
    "<<<CONFIG_VERSION>>>": version || 1,
    "<<<CLIENT_ID>>>": clientId,
    "<<<USER_ID>>>": clientId,
    "<<<EMAIL_DOMAIN>>>": sanitizedEmailDomain || 'example.com',
    "<<<CURRENCY>>>": sanitizedCurrency || 'USD',
    
    // Credentials - only inject valid credentials, not placeholders that cause activation failures
    "<<<CLIENT_GMAIL_CRED_ID>>>": integrations?.gmail?.credentialId || '',
    "<<<CLIENT_POSTGRES_CRED_ID>>>": integrations?.postgres?.credentialId || '',
    "<<<CLIENT_OPENAI_CRED_ID>>>": integrations?.openai?.credentialId || 'openAi',
    "<<<CLIENT_SUPABASE_CRED_ID>>>": integrations?.supabase?.credentialId || '',
    
    // Supabase configuration
    "<<<SUPABASE_URL>>>": import.meta.env.VITE_SUPABASE_URL || '',
    "<<<SUPABASE_ANON_KEY>>>": import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    
    // Team data
    "<<<MANAGERS_TEXT>>>": managersText,
    "<<<SUPPLIERS>>>": JSON.stringify((clientData.suppliers || []).map(s => ({ name: s.name, email: s.email, category: s.category }))),
    
    // Layer 3: Email labels (already handled dynamically)
    "<<<LABEL_MAP>>>": JSON.stringify(clientData.email_labels || {}),
    "<<<LABEL_MAPPINGS>>>": JSON.stringify(clientData.email_labels || {}),
    
    // Content
    "<<<SIGNATURE_BLOCK>>>": signatureBlock,
    "<<<SERVICE_CATALOG_TEXT>>>": serviceCatalogText,
    
    // Legacy fields
    "<<<ESCALATION_RULE>>>": escapeForJson(rules?.escalationRules),
    "<<<REPLY_TONE>>>": escapeForJson(rules?.tone),
    "<<<ALLOW_PRICING>>>": String(rules?.aiGuardrails?.allowPricing || false),
    
    // Layer 1: AI Configuration (NEW)
    ...aiPlaceholders,
    
    // Layer 2: Behavior Configuration (NEW)
    ...behaviorPlaceholders
  };
  
  // Layer 3: Dynamic Label ID injection (for routing nodes)
  if (clientData.email_labels) {
    Object.keys(clientData.email_labels).forEach((labelName) => {
      const placeholderKey = `<<<LABEL_${labelName.toUpperCase().replace(/\s+/g, '_').replace(/\//g, '_')}_ID>>>`;
      replacements[placeholderKey] = clientData.email_labels[labelName];
    });
  }

  // Debug: Check if AI_SYSTEM_MESSAGE placeholder exists in replacements
  if (replacements['<<<AI_SYSTEM_MESSAGE>>>']) {
    console.log('🔍 DEBUG: AI_SYSTEM_MESSAGE found in replacements:', {
      hasValue: !!replacements['<<<AI_SYSTEM_MESSAGE>>>'],
      valueLength: replacements['<<<AI_SYSTEM_MESSAGE>>>']?.length || 0,
      valuePreview: replacements['<<<AI_SYSTEM_MESSAGE>>>']?.substring(0, 100) + '...'
    });
  } else {
    console.warn('⚠️ AI_SYSTEM_MESSAGE placeholder not found in replacements!');
  }
  
  // Apply all replacements
  for (const [placeholder, value] of Object.entries(replacements)) {
    // Ensure value is a string and sanitize it for workflow use
    let replacementValue = (value === null || value === undefined) ? '' : String(value);
    
    // For workflow names and other display values, use sanitizeForWorkflowName
    if (placeholder === '<<<BUSINESS_NAME>>>') {
      replacementValue = sanitizeForWorkflowName(replacementValue);
    } else {
      // For other values, escape for JSON but also remove control characters
      replacementValue = escapeForJson(replacementValue);
    }
    
    templateString = templateString.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replacementValue);
  }

  let injectedWorkflow;
  try {
    injectedWorkflow = JSON.parse(templateString);
  } catch (parseError) {
    console.error('❌ JSON parse error in template injection:', parseError.message);
    console.error('❌ Error position:', parseError.message.match(/position (\d+)/)?.[1]);
    console.error('❌ Template string length:', templateString.length);
    
    // Log the problematic area around the error position
    const position = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
    const start = Math.max(0, position - 100);
    const end = Math.min(templateString.length, position + 100);
    console.error('❌ Problematic area:', templateString.substring(start, end));
    
    throw new Error(`Template JSON parsing failed: ${parseError.message}`);
  }
  
  // Apply workflow name sanitization for consistent formatting
  if (injectedWorkflow.name) {
    injectedWorkflow.name = sanitizeForWorkflowName(injectedWorkflow.name);
  }
  
  // Final validation - ensure the workflow is valid JSON
  try {
    JSON.stringify(injectedWorkflow);
  } catch (stringifyError) {
    console.error('❌ Final JSON validation failed:', stringifyError.message);
    throw new Error(`Generated workflow contains invalid JSON: ${stringifyError.message}`);
  }
  
  console.log('✅ Template injection complete with all 3 layers + voice training');
  console.log('📝 Workflow name sanitized:', injectedWorkflow.name);
  
  // CRITICAL: Inject credentials into workflow nodes
  injectedWorkflow = injectCredentialsIntoNodes(injectedWorkflow, clientData);
  
  return injectedWorkflow;
};

/**
 * Inject credentials into workflow nodes
 * @param {object} workflow - Workflow with placeholders replaced
 * @param {object} clientData - Client data with credential IDs
 * @returns {object} - Workflow with credentials injected
 */
function injectCredentialsIntoNodes(workflow, clientData) {
  console.log('🔐 Injecting credentials into workflow nodes...');
  
  // Get credential IDs from integrations
  const gmailCredId = clientData.integrations?.gmail?.credentialId || clientData.n8nCredentialId;
  const outlookCredId = clientData.integrations?.outlook?.credentialId;
  const openaiCredId = clientData.integrations?.openai?.credentialId || 'NxYVsH1eQ1mfzoW6';
  
  // Get provider information to handle cases where credentials are missing but provider is known
  const provider = clientData.provider || 'gmail';
  
  console.log('📋 Credential IDs:', {
    gmail: gmailCredId,
    outlook: outlookCredId,
    openai: openaiCredId,
    provider: provider,
    hasGmail: !!gmailCredId,
    hasOutlook: !!outlookCredId,
    hasOpenAI: !!openaiCredId
  });
  
  // Determine the user's primary email provider
  const hasGmailCred = gmailCredId && gmailCredId !== 'gmail-cred-placeholder';
  const hasOutlookCred = outlookCredId && outlookCredId !== 'outlook-cred-placeholder';
  
  // If credentials are missing but we know the provider, we can still do node conversion
  // The Edge Function will handle credential injection later
  const isGmailProvider = provider === 'gmail';
  const isOutlookProvider = provider === 'outlook';
  
  // Inject credentials into each node that needs them
  // NO CONVERSION: We now load the correct template for each provider (Gmail or Outlook)
  workflow.nodes.forEach(node => {
    // Gmail nodes - inject Gmail credentials (only for Gmail templates)
    if (node.type === 'n8n-nodes-base.gmailTrigger' || node.type === 'n8n-nodes-base.gmail') {
      if (hasGmailCred) {
        node.credentials = {
          gmailOAuth2: {
            id: gmailCredId,
            name: `Gmail OAuth2 account`
          }
        };
        console.log(`✅ Injected Gmail credentials into node: ${node.name}`);
      } else {
        // No Gmail credentials - Edge Function will handle this
        console.log(`⚠️ No Gmail credentials available for node: ${node.name} - Edge Function will inject`);
      }
    }
    
    // Outlook nodes - inject Outlook credentials (only for Outlook templates)
    else if (node.type === 'n8n-nodes-base.microsoftOutlookTrigger' || 
        node.type === 'n8n-nodes-base.microsoftOutlook') {
      if (hasOutlookCred) {
        node.credentials = {
          microsoftOutlookOAuth2Api: {
            id: outlookCredId,
            name: `Microsoft Outlook OAuth2 account`
          }
        };
        console.log(`✅ Injected Outlook credentials into node: ${node.name}`);
      } else {
        // No Outlook credentials - Edge Function will handle this
        console.log(`⚠️ No Outlook credentials available for node: ${node.name} - Edge Function will inject`);
      }
    }
    
    // OpenAI nodes (language models)
    if (node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
      if (openaiCredId && openaiCredId !== 'openai-cred-placeholder') {
        node.credentials = {
          openAiApi: {
            id: openaiCredId,
            name: `OpenAI API Key`
          }
        };
        console.log(`✅ Injected OpenAI credentials into node: ${node.name} with ID: ${openaiCredId}`);
      } else {
        console.warn(`⚠️ No valid OpenAI credential ID for node: ${node.name}`);
      }
    }
  });
  
  // Update workflow name to reflect the provider being used
  if ((hasOutlookCred && !hasGmailCred) || isOutlookProvider) {
    // User has Outlook credentials or is identified as Outlook provider, update workflow name
    if (workflow.name) {
      workflow.name = workflow.name.replace(/Gmail/gi, 'Outlook').replace(/Gmail AI/gi, 'Outlook AI');
    }
    console.log(`📝 Workflow name updated for Outlook provider: ${workflow.name}`);
  } else if ((hasGmailCred && !hasOutlookCred) || isGmailProvider) {
    // User has Gmail credentials or is identified as Gmail provider, update workflow name
    if (workflow.name) {
      workflow.name = workflow.name.replace(/Outlook/gi, 'Gmail').replace(/Outlook AI/gi, 'Gmail AI');
    }
    console.log(`📝 Workflow name updated for Gmail provider: ${workflow.name}`);
  }
  
  console.log('✅ Credential injection complete');
  return workflow;
}