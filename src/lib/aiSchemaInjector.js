import { mergeAIBusinessSchemas } from './aiSchemaMerger.js';
import { goldStandardSystemPrompt } from './goldStandardSystemPrompt.js';
import { goldStandardReplyPrompt } from './goldStandardReplyPrompt.js';
import { labelLibrary, getLabelDescription, generateSystemMessageWithLabels } from './labelLibrary.js';
import { EnhancedDynamicClassifierGenerator } from './enhancedDynamicClassifierGenerator.js';

/**
 * Extracts AI configuration from merged AI schemas for n8n deployment
 * @param {string[]} businessTypes - Array of business types (e.g., ['Electrician', 'Plumber'])
 * @param {object} businessInfo - Business metadata (name, phone, emailDomain)
 * @returns {object} - AI config ready for n8n injection
 */
export const extractAIConfigForN8n = (businessTypes, businessInfo = {}) => {
  // Ensure businessTypes is an array
  const types = Array.isArray(businessTypes) ? businessTypes : [businessTypes];
  
  // Merge AI schemas for all business types
  const mergedAI = mergeAIBusinessSchemas(types);
  
  // Extract keywords from all categories
  const allKeywords = [];
  if (mergedAI.keywords?.primary) {
    allKeywords.push(...mergedAI.keywords.primary);
  }
  if (mergedAI.keywords?.emergency) {
    allKeywords.push(...mergedAI.keywords.emergency);
  }
  if (mergedAI.keywords?.service) {
    allKeywords.push(...mergedAI.keywords.service);
  }
  if (mergedAI.keywords?.billing) {
    allKeywords.push(...mergedAI.keywords.billing);
  }
  
  // Build comprehensive system message using gold standard template
  let systemMessage;
  
  // Check if we have a custom system message from the schema
  if (mergedAI.aiPrompts?.systemMessage && mergedAI.aiPrompts.systemMessage !== 'You are an email classifier for {{BUSINESS_NAME}}. Categorize incoming emails accurately.') {
    // Use custom system message and replace basic placeholders
    systemMessage = mergedAI.aiPrompts.systemMessage
      .replace(/\{\{BUSINESS_NAME\}\}/g, businessInfo.name || 'the business')
      .replace(/<<<BUSINESS_NAME>>>/g, businessInfo.name || 'the business')
      .replace(/\{\{PHONE\}\}/g, businessInfo.phone || '')
      .replace(/\{\{EMAIL_DOMAIN\}\}/g, businessInfo.emailDomain || '');
  } else {
    // Use gold standard system prompt with full business context
    const businessData = {
      businessName: businessInfo.name || 'Business',
      businessTypes: types,
      businessDomain: businessInfo.emailDomain || 'example.com',
      primaryServices: mergedAI.primaryServices || 'General services',
      primaryProductService: mergedAI.primaryProductService || 'products/services',
      managers: businessInfo.managers || [],
      suppliers: businessInfo.suppliers || [],
      urgentKeywords: mergedAI.urgentKeywords || ['broken', 'urgent', 'emergency', 'asap'],
      urgentFormKeywords: mergedAI.urgentFormKeywords || ['broken', 'not working', 'leaking', 'won\'t start', 'no power', 'error code', 'tripping breaker', 'won\'t heat']
    };
    
    systemMessage = goldStandardSystemPrompt.generateSystemPrompt(businessData);
  }
  
  // Extract intent mapping
  const intentMapping = mergedAI.intentMapping || {};
  
  // Build classification rules text from merged schemas
  const classificationRules = mergedAI.classificationRules?.map(rule => {
    const keywords = (rule.keywords || []).join(', ');
    return `- ${rule.category}: ${rule.description || 'No description'} (Keywords: ${keywords})`;
  }).join('\n') || '';
  
  // Extract escalation rules
  const escalationRules = Array.isArray(mergedAI.escalationRules) ? mergedAI.escalationRules : [];
  const escalationText = escalationRules.length > 0 
    ? escalationRules.map(rule => `- ${rule.condition}: ${rule.action}`).join('\n')
    : 'Escalate all URGENT emails immediately';
  
  // Build categories list
  const categories = Array.isArray(mergedAI.categories) ? mergedAI.categories : [];
  const categoriesText = categories.length > 0
    ? categories.map(cat => `- ${cat.name}: ${cat.description || ''}`).join('\n')
    : 'URGENT, SALES, SUPPORT, MANAGER, RECRUITMENT, BANKING, MISC';
  
  // Generate reply prompt using gold standard template (if not custom)
  let replyPrompt;
  
  if (mergedAI.aiPrompts?.replyPrompt && mergedAI.aiPrompts.replyPrompt.length > 100) {
    // Use custom reply prompt if available
    replyPrompt = mergedAI.aiPrompts.replyPrompt
      .replace(/\{\{BUSINESS_NAME\}\}/g, businessInfo.name || 'the business')
      .replace(/<<<BUSINESS_NAME>>>/g, businessInfo.name || 'the business')
      .replace(/\{\{PHONE\}\}/g, businessInfo.phone || '')
      .replace(/\{\{EMAIL_DOMAIN\}\}/g, businessInfo.emailDomain || '');
  } else {
    // Use gold standard reply prompt with full business context
    const replyPromptData = {
      businessName: businessInfo.name || 'Business',
      businessPhone: businessInfo.phone || '(555) 555-5555',
      websiteUrl: businessInfo.websiteUrl || 'https://example.com',
      primaryProductService: mergedAI.primaryProductService || 'products/services',
      primaryProductCategory: mergedAI.primaryProductCategory || 'products',
      managers: businessInfo.managers || [],
      serviceAreas: businessInfo.serviceAreas || ['Main service area'],
      timezone: businessInfo.timezone || 'UTC/GMT -6',
      currentDateTime: new Date().toISOString(),
      paymentOptions: mergedAI.paymentOptions || businessInfo.paymentOptions,
      pricingInfo: mergedAI.pricingInfo || businessInfo.pricingInfo,
      upsellLanguage: mergedAI.upsellLanguage || businessInfo.upsellLanguage
    };
    
    replyPrompt = goldStandardReplyPrompt.generateReplyPrompt(replyPromptData);
  }
  
  return {
    keywords: allKeywords,
    keywordsJSON: JSON.stringify(allKeywords),
    systemMessage,
    replyPrompt,
    intentMapping,
    intentMappingJSON: JSON.stringify(intentMapping),
    classificationRules,
    escalationRules,
    escalationText,
    categories,
    categoriesText,
    businessTypes: types.join(' + '),
    mergedSchema: mergedAI // Include full schema for advanced usage
  };
};

/**
 * Generate AI-specific placeholders for n8n template injection
 * @param {object} aiConfig - Output from extractAIConfigForN8n
 * @returns {object} - Placeholder replacements
 */
export const generateAIPlaceholders = (aiConfig) => {
  return {
    '<<<AI_KEYWORDS>>>': aiConfig.keywordsJSON,
    '<<<AI_SYSTEM_MESSAGE>>>': aiConfig.systemMessage,
    '<<<AI_INTENT_MAPPING>>>': aiConfig.intentMappingJSON,
    '<<<AI_CLASSIFICATION_RULES>>>': aiConfig.classificationRules,
    '<<<AI_ESCALATION_RULES>>>': aiConfig.escalationText,
    '<<<AI_CATEGORIES>>>': aiConfig.categoriesText,
    '<<<AI_BUSINESS_TYPES>>>': aiConfig.businessTypes
  };
};

/**
 * Enhanced system message builder that includes all merged AI intelligence
 * @param {object} aiConfig - Output from extractAIConfigForN8n
 * @param {object} additionalContext - Additional context to include
 * @returns {string} - Complete system message for AI Classifier
 */
export const buildEnhancedSystemMessage = (aiConfig, additionalContext = {}) => {
  let message = aiConfig.systemMessage;
  
  // Add categories if not already in system message
  if (aiConfig.categoriesText && !message.includes('CATEGORIES:')) {
    message += '\n\nCATEGORIES:\n' + aiConfig.categoriesText;
  }
  
  // Add classification rules
  if (aiConfig.classificationRules && !message.includes('CLASSIFICATION RULES:')) {
    message += '\n\nCLASSIFICATION RULES:\n' + aiConfig.classificationRules;
  }
  
  // Add escalation rules
  if (aiConfig.escalationText && !message.includes('ESCALATION:')) {
    message += '\n\nESCALATION RULES:\n' + aiConfig.escalationText;
  }
  
  // Add keywords for reference
  if (aiConfig.keywords.length > 0 && !message.includes('KEY TERMS:')) {
    message += '\n\nKEY TERMS TO RECOGNIZE:\n' + aiConfig.keywords.join(', ');
  }
  
  // Add additional context if provided
  if (additionalContext.managers && additionalContext.managers.length > 0) {
    const managerNames = additionalContext.managers.map(m => m.name).join(', ');
    message += `\n\nTEAM MANAGERS: ${managerNames}`;
  }
  
  if (additionalContext.suppliers && additionalContext.suppliers.length > 0) {
    const supplierNames = additionalContext.suppliers.map(s => s.name).join(', ');
    message += `\n\nKNOWN SUPPLIERS: ${supplierNames}`;
  }
  
  return message;
};

/**
 * Build label-aware AI system message with classification keywords from label schemas
 * This function combines Layer 1 (AI schemas) with Layer 3 (Label schemas) for precise routing
 * @param {object} aiConfig - Output from extractAIConfigForN8n
 * @param {object} labelConfig - Label schema with classificationRules
 * @param {object} businessInfo - Business metadata
 * @returns {string} - Complete label-aware system message
 */
export const buildLabelAwareSystemMessage = (aiConfig, labelConfig, businessInfo = {}) => {
  let message = aiConfig.systemMessage || `You are an expert email classifier for ${businessInfo.name || 'the business'}.`;
  
  // Add business context
  message += `\n\nBUSINESS CONTEXT:\n`;
  message += `- Business: ${businessInfo.name || 'Business'}\n`;
  message += `- Types: ${aiConfig.businessTypes || 'General Services'}\n`;
  
  // Add comprehensive label classification rules
  message += `\n\n=== LABELS AND CLASSIFICATION RULES ===\n`;
  message += `Use these labels and their specific keywords to route emails accurately:\n\n`;
  
  if (labelConfig && labelConfig.labels) {
    for (const label of labelConfig.labels) {
      // Skip labels without classification rules
      if (!label.classificationRules || !label.classificationRules.keywords) continue;
      
      const rules = label.classificationRules;
      const isCritical = label.critical ? ' [CRITICAL]' : '';
      
      message += `📁 ${label.name}${isCritical} (${label.intent || 'general'}):\n`;
      
      if (label.description) {
        message += `   Description: ${label.description}\n`;
      }
      
      // Add keywords organized by category
      if (rules.keywords) {
        message += `   Keywords:\n`;
        for (const [category, keywords] of Object.entries(rules.keywords)) {
          if (Array.isArray(keywords) && keywords.length > 0) {
            message += `   • ${category}: ${keywords.slice(0, 8).join(', ')}${keywords.length > 8 ? '...' : ''}\n`;
          }
        }
      }
      
      // Add pattern examples
      if (rules.patterns && rules.patterns.length > 0) {
        message += `   Patterns: ${rules.patterns.slice(0, 3).join(' | ')}\n`;
      }
      
      // Add classification examples
      if (rules.examples && rules.examples.length > 0) {
        message += `   Examples:\n`;
        rules.examples.slice(0, 3).forEach(ex => {
          message += `   - "${ex}"\n`;
        });
      }
      
      // Add subfolder information if available
      if (label.sub && label.sub.length > 0) {
        const subWithKeywords = label.sub.filter(s => s.keywords && s.keywords.length > 0);
        if (subWithKeywords.length > 0) {
          message += `   Subfolders:\n`;
          subWithKeywords.slice(0, 4).forEach(sub => {
            message += `   └─ ${sub.name}: ${sub.keywords.slice(0, 5).join(', ')}\n`;
          });
        }
      }
      
      message += '\n';
    }
  }
  
  // Add classification instructions
  message += `\n=== CLASSIFICATION INSTRUCTIONS ===\n`;
  message += `1. Match email content against label keywords and patterns above\n`;
  message += `2. Consider urgency: CRITICAL labels take priority for safety/emergencies\n`;
  message += `3. Use most specific subfolder when keywords match\n`;
  message += `4. Return JSON with:\n`;
  message += `   - primary_category: Main label name (e.g., "URGENT", "SALES")\n`;
  message += `   - secondary_category: Subfolder name if applicable (e.g., "No Power")\n`;
  message += `   - confidence: 0.0 to 1.0 (how confident you are)\n`;
  message += `   - matched_keywords: Array of keywords that triggered classification\n`;
  message += `   - reasoning: Brief explanation of why this classification\n`;
  
  // Add additional context from AI config
  if (aiConfig.categories && aiConfig.categories.length > 0) {
    message += `\n=== AVAILABLE CATEGORIES ===\n`;
    aiConfig.categories.forEach(cat => {
      message += `- ${cat.name}: ${cat.description || 'No description'}\n`;
    });
  }
  
  message += `\n=== OUTPUT FORMAT ===\n`;
  message += `Return valid JSON only:\n`;
  message += `{\n`;
  message += `  "primary_category": "LABEL_NAME",\n`;
  message += `  "secondary_category": "Subfolder Name" or null,\n`;
  message += `  "confidence": 0.95,\n`;
  message += `  "matched_keywords": ["keyword1", "keyword2"],\n`;
  message += `  "reasoning": "Brief explanation"\n`;
  message += `}\n`;
  
  return message;
};

/**
 * Load label schema for business types with intelligent merging
 * ENHANCED: Now uses labelSchemaMerger for multi-business support
 * @param {string[]} businessTypes - Array of business types
 * @returns {object} - Merged label schema with production features
 */
export const loadLabelSchemaForBusinessTypes = async (businessTypes, managers = [], suppliers = []) => {
  try {
    const types = Array.isArray(businessTypes) ? businessTypes : [businessTypes];
    
    // Import the label schema merger
    const { mergeBusinessTypeSchemas } = await import('@/lib/labelSchemaMerger.js');
    
    // Use the merger to get appropriate schema with dynamic team data
    // - If 1 business type: returns that schema
    // - If 2+ business types: merges them intelligently
    const mergedSchema = mergeBusinessTypeSchemas(types, managers, suppliers);
    
    console.log(`✅ Label schema loaded for ${types.length} business type(s):`, types);
    console.log(`📊 Merged schema stats:`, {
      labels: mergedSchema.labels?.length || 0,
      specialRules: mergedSchema.specialRules?.length || 0,
      suppliers: mergedSchema.domainDetection?.suppliers?.length || 0,
      autoReplyEnabled: mergedSchema.autoReplyRules?.enabled || false,
      dynamicManagers: managers.length,
      dynamicSuppliers: suppliers.length
    });
    
    return mergedSchema;
  } catch (error) {
    console.warn('⚠️ Could not load label schema:', error.message);
    return { labels: [] };
  }
};

/**
 * Build production-style classifier (Hot Tub Man style) with full keyword integration
 * ENHANCED: Now uses EnhancedDynamicClassifierGenerator for comprehensive business-specific classification
 * @param {object} aiConfig - AI configuration from Layer 1
 * @param {object} labelConfig - Label schema from Layer 3
 * @param {object} businessInfo - Business details
 * @param {object} managers - Array of manager objects
 * @param {object} suppliers - Array of supplier objects
 * @param {object} actualLabels - Actual labels created in email system (optional)
 * @returns {string} - Production-ready classifier prompt
 */
export const buildProductionClassifier = (aiConfig, labelConfig, businessInfo, managers = [], suppliers = [], actualLabels = null) => {
  // Debug: Log what we're receiving
  console.log('🔍 DEBUG: buildProductionClassifier received:', {
    businessInfo: {
      name: businessInfo.name,
      phone: businessInfo.phone,
      websiteUrl: businessInfo.websiteUrl,
      emailDomain: businessInfo.emailDomain,
      businessTypes: businessInfo.businessTypes,
      address: businessInfo.address,
      city: businessInfo.city,
      state: businessInfo.state,
      zipCode: businessInfo.zipCode,
      country: businessInfo.country,
      currency: businessInfo.currency,
      timezone: businessInfo.timezone,
      businessCategory: businessInfo.businessCategory
    },
    managers: managers?.length || 0,
    suppliers: suppliers?.length || 0,
    actualLabels: actualLabels?.length || 0,
    hasLabelConfig: !!labelConfig,
    labelConfigLabels: labelConfig?.labels?.length || 0
  });
  
  // ARCHITECTURAL DECISION: Use EnhancedDynamicClassifierGenerator as primary
  // The label schemas (labelConfig) now focus on folder structure only
  // The classifier uses generic, business-agnostic categories that work across all business types
  // This ensures consistency and maintainability as we scale to hundreds of clients
  
  try {
    const primaryBusinessType = businessInfo.businessTypes?.[0] || businessInfo.businessType || 'General Services';
    
    console.log('🚀 Using EnhancedDynamicClassifierGenerator for:', primaryBusinessType);
    console.log('📋 Classifier strategy: Generic categories + Business-specific tertiary customizations');
    console.log('🔍 DEBUG: Business info passed to generator:', {
      name: businessInfo.name,
      businessTypes: businessInfo.businessTypes,
      managers: managers?.length || 0,
      suppliers: suppliers?.length || 0
    });
    
    // Ensure EnhancedDynamicClassifierGenerator is properly instantiated
    const classifierGenerator = new EnhancedDynamicClassifierGenerator(
      primaryBusinessType,
      businessInfo,
      managers || [],
      suppliers || [],
      actualLabels || null  // Pass actual label IDs for debugging documentation
    );
    
    console.log('✅ EnhancedDynamicClassifierGenerator instantiated successfully');
    
    const enhancedSystemMessage = classifierGenerator.generateClassifierSystemMessage();
    
    console.log('✅ Enhanced classifier system message generated:', {
      messageLength: enhancedSystemMessage?.length || 0,
      hasBusinessName: enhancedSystemMessage?.includes(businessInfo.name || 'the business') || false,
      hasCategories: enhancedSystemMessage?.includes('Categories:') || false,
      hasJSONFormat: enhancedSystemMessage?.includes('JSON Output Format') || false,
      hasTertiaryCategories: enhancedSystemMessage?.includes('FromBusiness') && enhancedSystemMessage?.includes('ToBusiness') || false,
      messagePreview: enhancedSystemMessage?.substring(0, 200) + '...' || 'No message generated'
    });
    
    // Validate the generated message
    if (!enhancedSystemMessage || enhancedSystemMessage.length < 100) {
      throw new Error('Generated system message is too short or empty');
    }
    
    return enhancedSystemMessage;
    
  } catch (error) {
    console.error('❌ Error generating enhanced classifier:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      businessType: businessInfo.businessTypes?.[0] || businessInfo.businessType,
      businessName: businessInfo.name
    });
    
    // FALLBACK: Use labelConfig if EnhancedDynamicClassifierGenerator fails
    // This is only used if there's an error with the dynamic generator
    if (labelConfig?.labels && labelConfig.labels.length > 0) {
      console.log('⚠️ Falling back to labelConfig-based classifier');
      return buildOriginalProductionClassifier(aiConfig, labelConfig, businessInfo, managers, suppliers, actualLabels);
    }
    
    // FINAL FALLBACK: Return a minimal classifier
    console.error('❌ All classifier generation methods failed, returning minimal classifier');
    return `You are an email classifier for ${businessInfo.name || 'the business'}. 
Categorize emails and return JSON with summary, primary_category, confidence, and ai_can_reply fields.

Business Context:
- Business Name: ${businessInfo.name || 'Business'}
- Business Type: ${businessInfo.businessTypes?.[0] || businessInfo.businessType || 'General Services'}
- Email Domain: ${businessInfo.emailDomain || 'example.com'}

Categories:
- BANKING: Financial transactions and banking-related emails
- SALES: Sales inquiries and new business opportunities  
- SUPPORT: Customer support and service requests
- URGENT: Emergency and urgent requests

Return JSON format:
{
  "summary": "Brief email summary",
  "primary_category": "BANKING|SALES|SUPPORT|URGENT",
  "secondary_category": "Specific subcategory or null",
  "tertiary_category": "Specific tertiary category or null", 
  "confidence": 0.9,
  "ai_can_reply": true,
  "entities": {
    "contact_name": "Name if found",
    "email_address": "Email if found",
    "phone_number": "Phone if found"
  }
}`;
  }
};

/**
 * Original buildProductionClassifier implementation (fallback)
 * @param {object} aiConfig - AI configuration from Layer 1
 * @param {object} labelConfig - Label schema from Layer 3
 * @param {object} businessInfo - Business details
 * @param {object} managers - Array of manager objects
 * @param {object} suppliers - Array of supplier objects
 * @param {object} actualLabels - Actual labels created in email system (optional)
 * @returns {string} - Production-ready classifier prompt
 */
const buildOriginalProductionClassifier = (aiConfig, labelConfig, businessInfo, managers = [], suppliers = [], actualLabels = null) => {
  let message = `You are an expert email processing and routing system for "${businessInfo.name || 'the business'}".

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Rules:
If the email is from an external sender, and primary_category is Support or Sales, and confidence is at least 0.75, always set "ai_can_reply": true—including for Support > General complaints, unless the sender is internal or the message is abusive/illegal.
If the sender's email address ends with "@${businessInfo.emailDomain || 'yourdomain.com'}", always set:
"ai_can_reply": false

1.  Analyze the entire email context (sender, subject, body).
2.  Choose **ONE** \`primary_category\` from the list provided.
3.  If the chosen category has sub-categories, select the most appropriate \`secondary_category\`.
4.  For specific Banking categories, determine the \`tertiary_category\`.
5.  Provide a concise \`summary\` of the email's core request.
6.  Extract all available \`entities\`.
7.  Provide a confidence score (0.0 to 1.0) and a brief reasoning for your classification.
8.  \`"ai_can_reply": true\` **only if**:
- \`primary_category\` is **Support** *or* **Sales** *or* **Urgent**, **and**
- \`confidence\` ≥ 0.75.
Support > General: ai_can_reply: true (if confidence ≥ 0.75)
Support > TechnicalSupport, PartsAndChemicals, AppointmentScheduling: ai_can_reply: true (if confidence ≥ 0.75)
Sales: ai_can_reply: true (if confidence ≥ 0.75)
In **all other cases** set \`"ai_can_reply": false\` (the email will be routed to a human).
Return **only** the JSON object—no extra text.

### Business Context:
- Business Name: ${businessInfo.name || 'Business'}
- Business Type(s): ${businessInfo.businessTypes?.join(', ') || aiConfig.businessTypes || 'General Services'}
- Email Domain: ${businessInfo.emailDomain || 'example.com'}
- Phone: ${businessInfo.phone || 'Not provided'}
- Website: ${businessInfo.websiteUrl || 'Not provided'}
- Address: ${businessInfo.address ? `${businessInfo.address}, ${businessInfo.city || ''}, ${businessInfo.state || ''} ${businessInfo.zipCode || ''}`.replace(/,\s*,/g, ',').replace(/,\s*$/, '') : 'Not provided'}
- Currency: ${businessInfo.currency || 'USD'}
- Timezone: ${businessInfo.timezone || 'UTC'}
- Business Category: ${businessInfo.businessCategory || 'General Services'}
- Service Areas: ${businessInfo.serviceAreas ? businessInfo.serviceAreas.join(', ') : 'Main service area'}
- Primary Services: ${getPrimaryProductService(businessInfo.businessTypes || aiConfig.businessTypes)}
- Operating Hours: ${businessInfo.operatingHours || 'Monday-Friday 8AM-5PM'}
- Response Time: ${businessInfo.responseTime || '24 hours'}
- Managers: ${managers.length > 0 ? managers.map(m => m.name).join(', ') : 'Not specified'}
- Suppliers: ${suppliers.length > 0 ? suppliers.map(s => s.name).join(', ') : 'Not specified'}
`;

  if (managers && managers.length > 0) {
    message += `- Managers: ${managers.map(m => m.name).join(', ')}\n`;
  }
  
  if (suppliers && suppliers.length > 0) {
    message += `- Suppliers: ${suppliers.map(s => s.name).join(', ')}\n`;
  }

  // Add services information if available
  if (businessInfo.services && businessInfo.services.length > 0) {
    message += `- Services: ${businessInfo.services.map(s => `${s.name} (${s.pricingType} ${s.price} ${businessInfo.currency || 'USD'})`).join(', ')}\n`;
  }

  message += `\n### Category Structure:\n\n`;

  // ADD INDUSTRY-SPECIFIC LABELS WITH KEYWORDS
  // ENHANCED: Use actual provisioned labels when available, fallback to schema
  // Use comprehensive label library to generate system message with ALL provisioned labels
  if (labelConfig?.labels) {
    console.log('🎯 Using COMPREHENSIVE label library for system message generation');
    
    // Extract all provisioned labels from the schema
    const provisionedLabels = [];
    labelConfig.labels.forEach(label => {
      provisionedLabels.push(label.name);
      if (label.sub && label.sub.length > 0) {
        label.sub.forEach(subLabel => {
          provisionedLabels.push(`${label.name}/${subLabel.name}`);
          if (subLabel.sub && subLabel.sub.length > 0) {
            subLabel.sub.forEach(tertiaryLabel => {
              provisionedLabels.push(`${label.name}/${subLabel.name}/${tertiaryLabel.name}`);
            });
          }
        });
      }
    });
    
    console.log('📋 Provisioned labels:', provisionedLabels);
    
    // Generate system message using the comprehensive label library
    message += generateSystemMessageWithLabels(provisionedLabels, businessInfo, managers, suppliers);
    
    // Replace dynamic placeholders with actual business data
    const crmAlertEmails = businessInfo.integrations?.crm?.alertEmails || ['alerts@servicetitan.com'];
    const phoneProviderEmails = businessInfo.integrations?.phone?.emails || ['service@ringcentral.com'];
    const phoneProviderName = businessInfo.integrations?.phone?.provider || 'RingCentral';
    const formProviderEmails = businessInfo.integrations?.forms?.emails || ['noreply@reports.connecteam.com'];
    
    message = message.replace(/\{\{CRM_ALERT_EMAILS\}\}/g, crmAlertEmails.join(', '));
    message = message.replace(/\{\{PHONE_PROVIDER_EMAILS\}\}/g, phoneProviderEmails.join(', '));
    message = message.replace(/\{\{PHONE_PROVIDER_NAME\}\}/g, phoneProviderName);
    message = message.replace(/\{\{FORM_PROVIDER_EMAILS\}\}/g, formProviderEmails.join(', '));
    
    // Add special rules section matching the exact format from the example
    message += `\nIf secondary_category is 'e-transfer', set tertiary_category: [FromBusiness, ToBusiness]\n`;
    message += `From business - Emails confirming that ${businessInfo.name || 'The Hot Tub Man Ltd.'} has sent a payment or successfully transferred funds to a vendor, contractor, or external service provider. These are typically receipts, payment confirmations, or e-Transfer acknowledgments indicating money was sent from the business account.  Examples include: "Transfer from: ${(businessInfo.name || 'THE HOT TUB MAN LTD.').toUpperCase()}" Confirmation of outgoing Interac e-Transfers  Subject lines like: "Funds sent", "Your e-Transfer was successful", "Payment completed"  Body text with phrases like:  "You sent an Interac e-Transfer"  "Funds deposited to the recipient"  "Your payment has been processed"  Keywords: you sent, payment completed, funds deposited to, interac e-transfer sent, transaction receipt, payment confirmation, amount paid, transfer successful, Your transfer to, to recipient  Classification Tip: ✅ Classify as To Business only if the email confirms that ${businessInfo.name || 'The Hot Tub Man Ltd.'} has sent funds. 🚫 Do not use for notifications of incoming transfers (those go under To Business).\n`;
    message += `To business - Emails confirming that a payment has been deposited into ${businessInfo.name || 'The Hot Tub Man Ltd.'}'s account. These typically come from banks, payment platforms, or customers and indicate successful incoming transfers.  Examples include:  Interac e-Transfer deposit confirmations  Subject lines like: "Funds have been deposited", "You've received money", "Deposit successful"  Body text mentioning:  "You received an Interac e-Transfer"  "Funds have been deposited into your account"  "The payment has been successfully deposited"  Keywords: e-transfer received, funds deposited, you've received, payment received, money has been sent to you, You've received,  deposit completed, interac transfer to ${businessInfo.name || 'The Hot Tub Man Ltd.'}  Classification Tip: ✅ Only classify as From Business if the message confirms a completed deposit into your account. 🚫 Do not include messages about pending transfers or sent by your business — those should go under from Business.\n`;
    message += `\nIf the email confirms a purchase or payment by ${businessInfo.name || 'The Hot Tub Man Ltd.'} (or relevant business/person), classify as:\n`;
    message += `"primary_category": "Banking",\n`;
    message += `"secondary_category": "receipts",\n`;
    message += `"tertiary_category": "PaymentSent"\n`;
    message += `\nIf the email confirms the business received money (e.g., from a customer):\n`;
    message += `"primary_category": "Banking",\n`;
    message += `"secondary_category": "receipts",\n`;
    message += `"tertiary_category": "PaymentReceived"\n`;
    message += `\nIf secondary_category is 'receipts', set tertiary_category: [PaymentSent, PaymentReceived]\n`;
    message += `PaymentSent -  Email confirming you sent a payment \n`;
    message += `Payment Received - Email confirming you've received a payment \n\n`;
  } else {
    console.log('⚠️ No label configuration available - using fallback');
    message += `\n### Category Structure:\n`;
    message += `No specific label configuration available. Please ensure proper label schema is loaded.\n\n`;
  }
  
  // Add JSON output format
  message += `\n### JSON Output Format:\n`;
  message += `Return ONLY the following JSON structure. Do not add any other text or explanations.\n\n`;
  message += `\`\`\`json\n`;
  message += `{\n`;
  message += `  "summary": "A concise, one-sentence summary of the email's purpose.",\n`;
  message += `  "reasoning": "A brief explanation for the chosen categories.",\n`;
  message += `  "confidence": 0.9,\n`;
  message += `  "primary_category": "The chosen primary category",\n`;
  message += `  "secondary_category": "The chosen secondary category, or null if not applicable.",\n`;
  message += `  "tertiary_category": "The chosen tertiary category, or null if not applicable.",\n`;
  message += `  "entities": {\n`;
  message += `    "contact_name": "Extracted contact name, or null.",\n`;
  message += `    "email_address": "Extracted email address, or null.",\n`;
  message += `    "phone_number": "Extracted phone number, or null.",\n`;
  message += `    "order_number": "Extracted order/invoice number, or null."\n`;
  message += `  },\n`;
  message += `  "ai_can_reply": true\n`;
  message += `}\n`;
  message += `\`\`\`\n`;
  
  console.log('🔍 DEBUG: buildOriginalProductionClassifier generated system message:', {
    messageLength: message.length,
    hasBusinessName: message.includes(businessInfo.name || 'the business'),
    hasCategories: message.includes('Category Structure'),
    hasJSONFormat: message.includes('JSON Output Format'),
    messagePreview: message.substring(0, 200) + '...'
  });
  
  return message;
};

/**
 * Generate business-specific category descriptions
 * @param {string} category - Category name
 * @param {object} businessInfo - Business information
 * @param {array} managers - Array of managers
 * @param {array} suppliers - Array of suppliers
 * @returns {string} - Business-specific description
 */
function generateBusinessSpecificDescription(category, businessInfo, managers = [], suppliers = []) {
  const businessName = businessInfo.name || 'the business';
  const businessType = businessInfo.businessTypes || 'general services';
  
  const descriptions = {
    'SUPPORT': `Emails from existing customers related to post-sales support for ${businessName}. This includes technical troubleshooting, questions about parts/chemicals, appointment scheduling, and general inquiries about products they already own. These emails will be routed to a specific support queue (Technical, Parts, etc.) in a subsequent step.`,
    
    'SALES': `Emails from leads or customers expressing interest in purchasing from ${businessName}, requesting pricing, or discussing specific products or service packages.
This includes:
New inquiries about products or installation services
Replies to promotions where the sender shows purchase intent
Requests for quotes, estimates, or follow-up on prior communication
Conversations about available models, features, or packages
Referral notifications from networking groups (e.g., BNI), business partners, or third parties introducing a new potential customer or business opportunity`,
    
    'URGENT': `E-mails from {{CRM_ALERT_EMAILS}} or other urgent sources. 
Requests a response by a specific date/time (even without using "urgent")
Uses phrases like "as soon as possible", "ASAP", "immediately", "today", "noon". Emails emergency-related, or requiring immediate action. These often include escalated service issues, last-minute cancellations, equipment failures, or anything flagged with urgency or strong emotional tone.  Keywords may include: urgent, emergency, ASAP, as soon as possible, immediately, critical, need help now, high priority, right away, problem, broken, not working, serious issue, can't wait, urgent matter, please respond quickly. All the emails containing "Please find your estimate(s) from ${businessName} attached below  Click here to view your estimate(s)"`,
    
    'BANKING': `Financial transactions, invoices, payments, bank alerts, receipts, and money-related communications. This includes all financial activities related to ${businessName} operations, vendor payments, customer payments, and banking notifications.`,
    
    'SUPPLIERS': `Emails from ${suppliers.length > 0 ? suppliers.map(s => s.name).join(', ') : 'suppliers'} and other vendors providing products and services to ${businessName}.`,
    
    'MANAGER': `Emails that require leadership oversight, involve internal company operations, or are directed at a specific manager (${managers.length > 0 ? managers.map(m => m.name).join(', ') : 'managers'}). This includes escalations, strategic decisions, high-level vendor comms, and internal alerts. This category will be further sorted into a specific manager or 'Unassigned' in a subsequent step.`,
    
    'RECRUITMENT': `Job applications, resumes, interviews.
Emails related to the recruitment and hiring process at ${businessName}. Includes job applications, resumes, cover letters, interview scheduling, candidate inquiries, job offers, and hiring updates. Also covers communications from recruitment platforms, hiring managers, and candidates following up on their applications.  Examples:  "Application for Customer Service Position"  "Resume and cover letter for Service Technician role"  "Interview schedule confirmation"  "Inquiry about open positions"  Keywords: job application, resume, cover letter, interview, hiring, candidate, recruitment, job opportunity, position available, apply, job posting, applicant, interview schedule, candidate inquiry, job offer`,
    
    'SOCIALMEDIA': `Emails related to social media platforms like Facebook, Instagram, TikTok, YouTube, or Google. These messages typically include:  Engagement alerts (DMs, tags, mentions)  Collaboration or sponsorship requests  Content inquiries (reels, stories, posts)  Influencer or partnership outreach  These emails originate from social platforms or brands/agencies interacting via social channels. This does not include general social media notifications like password resets (those go under Security or System Alerts if applicable).  Keywords: DM, tagged, post, reel, story, influencer, collab, partnership, Facebook, Instagram, TikTok, YouTube, social media`,
    
    'PROMO': `Marketing, discounts, sales flyers.
Emails promoting marketing campaigns, discount announcements, referral programs, or seasonal events. These include vendor offers, sales flyers, promotional codes, limited-time deals, or partnership pitches. They do NOT include direct customer inquiries or leads about purchasing a product or service.|Examples:"Save 25% this weekend only!""Refer a friend and earn rewards""Bundle deal on spa accessories""Exclusive vendor promotion for your business"`,
    
    'PHONE': `Only emails from phone/SMS/voicemail providers (e.g., {{PHONE_PROVIDER_EMAILS}}) should be tagged PHONE.
If the subject or body includes 'New Text Message' and the sender includes '{{PHONE_PROVIDER_NAME}}', classify as Phone.
This category includes all emails originating specifically from {{PHONE_PROVIDER_EMAILS}}. These notifications typically contain:  Voicemail notifications (voice message transcripts or audio attachments).  Missed call alerts (with caller ID and callback numbers).  SMS/text message alerts (text message transcripts or content).  These messages indicate customer or vendor attempts to communicate via the business phone number managed by {{PHONE_PROVIDER_NAME}}.  Examples:  "You have a new voice message from (403) 123-4567."  "New SMS received from customer."  "Missed call alert."  Keywords: voicemail, voice message, missed call, SMS, text message, {{PHONE_PROVIDER_NAME}}, caller ID, message transcript, new message, call recording, callback number, you have a new text, you have a new voicemail  Classifier Rule: ✅ Always classify as {{PHONE_PROVIDER_NAME}} Communications if the sender is exactly {{PHONE_PROVIDER_EMAILS}}`,
    
    'FORMSUB': `This category is for automated submissions from your website forms or field service apps. Crucially, the content of a form submission determines its final classification.
1. URGENT Form Submission Override:
An email that is a form submission MUST BE CLASSIFIED AS URGENT if the "How can we help?" section contains keywords indicating a critical service issue. This rule takes precedence over a standard FormSub classification.
Keywords: broken, not working, leaking, won't start, no power, error code, tripping breaker, won't heat.
Example of an URGENT Form Submission:
Subject: Schedule a Service got a new submission
Body: "...Submission summary: ... How can we help?: I have a strong spa... it worked great. ...now it will not start. First I thought it was an air lock... now the control panel won't light up."
Correct Classification: primary_category: Urgent
2. Standard Form Submission:
If an email is a form submission but DOES NOT contain urgent keywords (e.g., it is a simple request for information or to purchase non-service items), classify it as FormSub.`,
    
    'GOOGLE REVIEW': `Notifications about new Google Reviews.
When an email fits the GoogleReview category, extract and return the following JSON object:


{
  "type": "google_review",
  "reviewerName": "<Name of the reviewer, e.g., Brenda>",
  "rating": <Numeric rating from 1 to 5>,
  "reviewText": "<The review text left by the customer>",
  "reviewId": "<The unique review ID, e.g., g123abc456>",
  "locationName": "${businessName}",
  "platform": "Google",
  "isPositive": <true if rating >= 4, false if <= 2, null if 3 or missing>
}
Extraction Rules:
reviewerName: From line like "Brenda left a review…"

rating: From "Rating: ★★★★☆" or "Rating: 4"

reviewText: Usually inside quotation marks "...", or between Rating and "Manage review"

reviewId: From line like Review ID: g123abc456

isPositive: Use rating to infer sentiment

If any field is not found, return null instead of omitting it.`,
    
    'MISC': `Use as a last resort for unclassifiable emails.
Only return MISC as a last resort if, after exhaustive evaluation of all other categories and sub-categories, the email's content remains fundamentally unclassifiable or irrelevant to any specific business process. Do NOT use MISC for content that could belong to a specific category but lacks strong signals; instead, aim to provide the strongest possible primary label.`
  };
  
  return descriptions[category] || `${category.toLowerCase()} related communications and requests for ${businessName}`;
}

/**
 * Generate business-specific subcategory descriptions
 * @param {string} category - Parent category name
 * @param {string} subcategory - Subcategory name
 * @param {object} businessInfo - Business information
 * @returns {string} - Business-specific subcategory description
 */
function generateBusinessSpecificSubDescription(category, subcategory, businessInfo) {
  const businessName = businessInfo.name || 'the business';
  
  const subDescriptions = {
    'SUPPORT': {
      'TechnicalSupport': 'Emails from customers seeking assistance with troubleshooting, diagnosing issues, or requesting guidance on the functionality and operation of their hot tubs. These are typically for problems that might require instruction, a remote solution, or a technician visit if not resolved virtually.\\n\\nExamples:\\n• \'My jets aren\'t working, what should I check?\'\\n• \'How do I fix the error code on my display?\'\\n• \'The water isn\'t heating, can you help me troubleshoot?\'\\n\\nKeywords: troubleshoot, repair, issue, problem, error, functional, broken, diagnostic, help, technical, guide, manual.',
      'PartsAndChemicals': 'Emails related to ordering, inquiring about, or discussing specific hot tub parts, filters, covers, or water treatment chemicals. This includes questions about availability, pricing, usage, or recommendations for these items.\\n\\nExamples:\\n• \'Do you stock replacement filters for my hot tub model?\'\\n• \'I need to reorder my usual supply of chlorine tablets.\'\\n• \'What chemicals should I use for balancing my water?\'\\n\\nKeywords: parts, chemicals, filter, cover, accessories, order, purchase, stock, supply, inquire, availability, price, product, recommend.',
      'AppointmentScheduling': 'Emails specifically for booking, rescheduling, or canceling service appointments, maintenance visits, or consultations. These messages focus on coordinating timings and logistics for a visit, assuming the request is not initiated via a ServiceTitan form.\\n\\nExamples:\\n• \'I\'d like to book my annual hot tub cleaning.\'\\n• \'Can I reschedule my service appointment for next week?\'\\n• \'I need to cancel my technician visit for tomorrow.\'\\n\\nKeywords: schedule, book, appointment, reschedule, cancel, visit, maintenance, time, date, confirm, availability, service.',
      'General': 'Any customer support email that does not fit into the specific categories of Technical Support, Parts & Chemicals, or Appointment Scheduling. This includes general inquiries, non-urgent follow-ups, or miscellaneous questions from existing customers.\\n\\nExamples:\\n• \'Can you send me a copy of my last invoice?\'\\n• \'What are your updated operating hours?\'\\n• \'Just checking in on the status of my order.\'\\n\\nKeywords: general, inquiry, miscellaneous, follow-up, question, status, invoice, hours, contact.'
    },
    'BANKING': {
      'e-transfer': 'Interac e-Transfers confirming completed payments either sent or received, typically involving banks or payment platforms. These messages are commonly used to track:  Vendor payments  Reimbursements  Fast business-related fund transfers  Message types may include:  "You received an Interac e-Transfer"  "You sent an e-Transfer"  "Funds have been deposited"  "Transfer completed successfully"  Keywords: interac, e-transfer, you received, you sent, payment received, funds deposited, transfer completed, money sent  Classification Guidance:  ✅ Include only if the email confirms that the transfer has been successfully processed  🚫 Exclude pending, failed, or canceled transfers (those may go under bank-alert)',
      'invoice': 'Emails that include sent or received invoices, typically as part of billing, accounting, or financial tracking. These messages often contain:  Attached invoice PDFs  Payment due notices  Invoice confirmations  Billing summaries or reminders  They are key for financial reconciliation, vendor management, and customer billing.  Common elements:  Invoice number (e.g., INV-12345)  Total amount due  Due date or payment terms  Vendor or customer info  Line items or service descriptions  Keywords: invoice, payment due, invoice attached, bill, amount owing, statement, billing, past due, balance, total due, due date  Classification Guidance:  ✅ Include if the email references or attaches a formal invoice document or clearly outlines payment terms  🚫 Exclude if the email simply mentions a payment has been made or received — use payment-confirmation or e-transfer instead Exclude all  invoices with "Re: Your Invoice from ${businessName}"',
      'bank-alert': 'Automated security-related messages sent by a bank or financial platform. They flag events that could affect account safety or require fast action.  Typical alerts  Balance or daily-limit updates  Suspicious-activity or fraud warnings  Password or PIN reset confirmations  New login / new-device sign-ins  2-factor or one-time passcodes (OTP/2FA)  Account-detail changes (e-mail, phone, address)  Trigger keywords (examples) bank alert, suspicious activity, login attempt, password changed, reset your password, security alert, account update, new sign-in, verification code, unauthorized access, device login, fraud detection  Classification rules ✅ Label as BankAlert when the email is an automated, security-focused notification from a bank or financial system. 🚫 Do not use this label for transactional receipts, invoices, or e-transfer notices—those belong in Payment-Confirmation, Invoice, or e-Transfer.',
      'refund': 'Emails indicating that a refund has been issued or received, usually in response to a returned product, canceled service, or failed payment. These messages confirm that funds have been reversed and returned to the sender or original payment method.  Common refund scenarios include:  Canceled orders or subscriptions  Payment failures followed by refund  Returned merchandise or parts  Duplicate charge corrections  Service billing adjustments  Typical content includes:  "Your refund has been processed"  "We\'ve issued a refund to your card/account"  "Refund confirmation"  Reference or transaction ID  Amount refunded  Payment method used for the refund  Keywords: refund issued, refund processed, your refund, money returned, credit to your account, refunded, return processed, reversed payment, transaction failed and refunded, you\'ll see the funds in',
      'receipts': 'Emails that prove a payment has already cleared—whether ${businessName} paid a vendor or a customer paid us. They\'re usually auto-generated by banks, payment platforms, or e-commerce systems and include full transaction details.  Typical contents "Thank you for your purchase / payment"  Order, receipt, or confirmation number (e.g., #452319)  Amount paid and date settled  Payment method (Visa, Interac, PayPal, Stripe, ACH, POS, etc.)  Links or attachments (PDF / HTML receipts)  Common subject-line cues Payment completed · Transaction successful · Order summary · Your payment has been confirmed · Here\'s your receipt  Keywords receipt, order confirmation, payment summary, transaction details, amount paid, paid with, you\'ve been charged, view receipt  Classification guidance ✅ Include when the email confirms a finalized transaction and provides proof of payment. 🚫 Exclude:  Invoices requesting payment (use Invoice category).  Pending, failed, or canceled transfers (use Bank-Alert if security-related).  Interac e-Transfer notices (use E-Transfer sub-labels).'
    },
    'MANAGER': {
      'Unassigned': 'Internal alerts or platform notices that must be reviewed by some manager but don\'t name one specifically. Examples: security alerts, account verification codes, payroll or attendance reports, "autobatching failed" errors, Housecall Pro employee-invite notifications. Keywords / cues: no-reply@accounts.google.com, donotreply@auth.atb.com, "verification code", "daily attendance report", "You\'ve invited a new employee", "autobatching failed payments".'
    },
    'FORMSUB': {
      'NewSubmission': 'This applies to all standard website form submissions from ServiceTitan that are not urgent.\\nExample of a standard FormSub:\\nSubject: Contact us got a new submission\\nBody: "...How can we help?: I would like to purchase 1.5 kg container of Bromating tabs... I can come pay and pick it up..."\\nCorrect Classification: primary_category: FormSub, secondary_category: NewSubmission',
      'WorkOrderForms': 'This applies only to emails from {{FORM_PROVIDER_EMAILS}} containing completed work forms.\\nExample: Subject: Steve Derksen completed Hot Tub Treatment Form-Penhold\\nCorrect Classification: primary_category: FormSub, secondary_category: WorkOrderForms'
    }
  };
  
  if (subDescriptions[category] && subDescriptions[category][subcategory]) {
    return subDescriptions[category][subcategory];
  }
  
  // Fallback description
  return `${subcategory.toLowerCase().replace(/_/g, ' ')} related communications for ${businessName}`;
}

// Helper function for business-specific product services
function getPrimaryProductService(businessTypes) {
  const typeMapping = {
    'pools_spas': 'hot tubs and spas',
    'hvac': 'HVAC systems',
    'plumbing': 'plumbing services',
    'electrical': 'electrical services',
    'general_contractor': 'construction and renovation services',
    'landscaping': 'landscaping and outdoor services'
  };
  
  const primaryType = Array.isArray(businessTypes) ? businessTypes[0] : businessTypes;
  return typeMapping[primaryType] || 'products and services';
}

export default {
  extractAIConfigForN8n,
  generateAIPlaceholders,
  buildEnhancedSystemMessage,
  buildLabelAwareSystemMessage,
  loadLabelSchemaForBusinessTypes,
  buildProductionClassifier
};

