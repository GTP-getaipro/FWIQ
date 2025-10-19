/**
 * Enhanced Classifier System Message Generator
 * 
 * Generates dynamic, business-specific classifier system messages with:
 * - Historical email data integration
 * - Business-specific context and categories
 * - Industry-specific keywords and examples
 * - Dynamic team routing
 * - Advanced AI reply logic
 * 
 * @module enhancedClassifierSystemMessage
 */

import { businessTypeTemplates } from './businessTypeTemplates.js';
import { labelLibrary } from './labelLibrary.js';

/**
 * Generate enhanced classifier system message
 * @param {Object} businessInfo - Complete business information
 * @param {Array} managers - Array of managers
 * @param {Array} suppliers - Array of suppliers
 * @param {Object} historicalData - Historical email data for voice enhancement
 * @param {Object} labelConfig - Label configuration
 * @returns {string} - Enhanced classifier system message
 */
export const generateEnhancedClassifierSystemMessage = async (
  businessInfo, 
  managers = [], 
  suppliers = [], 
  historicalData = null,
  labelConfig = null
) => {
  console.log('🚀 Generating enhanced classifier system message...');
  
  // Build enhanced system message sections
  const sections = [
    buildRoleSection(businessInfo),
    buildBusinessContext(businessInfo, managers, suppliers),
    buildIndustrySpecificCategories(businessInfo),
    buildHistoricalDataEnhancement(historicalData),
    buildDynamicTeamRouting(businessInfo, managers, suppliers),
    buildAdvancedAIReplyLogic(businessInfo),
    buildCategoryStructure(businessInfo, labelConfig),
    buildSpecialRules(businessInfo),
    buildJSONOutputFormat()
  ];

  return sections.filter(section => section).join('\n\n');
};

/**
 * Build role and task definition section
 */
function buildRoleSection(businessInfo) {
  const businessName = businessInfo.name || 'the business';
  const businessType = businessInfo.businessTypes?.[0] || 'general services';
  
  return `You are an expert email processing and routing system for "${businessName}".

Your SOLE task is to analyze the provided email and return a single, structured JSON object containing a summary, precise classifications, and extracted entities. Follow all rules precisely.

### Core Rules:
1. Analyze the entire email context (sender, subject, body)
2. Choose **ONE** \`primary_category\` from the list provided
3. If the chosen category has sub-categories, select the most appropriate \`secondary_category\`
4. For specific Banking categories, determine the \`tertiary_category\`
5. Provide a concise \`summary\` of the email's core request
6. Extract all available \`entities\`
7. Provide a confidence score (0.0 to 1.0) and a brief reasoning for your classification
8. Determine if AI can reply based on business-specific rules

### AI Reply Rules:
If the email is from an external sender, and primary_category is Support or Sales, and confidence is at least 0.75, always set "ai_can_reply": true—including for Support > General complaints, unless the sender is internal or the message is abusive/illegal.
If the sender's email address ends with "@${businessInfo.emailDomain || 'yourdomain.com'}", always set:
"ai_can_reply": false

Return **only** the JSON object—no extra text.`;
}

/**
 * Build comprehensive business context section
 */
function buildBusinessContext(businessInfo, managers, suppliers) {
  const businessName = businessInfo.name || 'Business';
  const businessTypes = businessInfo.businessTypes?.join(', ') || 'General Services';
  const emailDomain = businessInfo.emailDomain || 'example.com';
  
  let context = `### Business Context:
- Business Name: ${businessName}
- Business Type(s): ${businessTypes}
- Email Domain: ${emailDomain}
- Phone: ${businessInfo.phone || 'Not provided'}
- Website: ${businessInfo.websiteUrl || 'Not provided'}`;

  // Add address information
  if (businessInfo.address) {
    const addressParts = [businessInfo.address, businessInfo.city, businessInfo.state, businessInfo.zipCode]
      .filter(part => part).join(', ');
    context += `\n- Address: ${addressParts}`;
  } else {
    context += `\n- Address: Not provided`;
  }

  // Add business details
  context += `\n- Currency: ${businessInfo.currency || 'USD'}`;
  context += `\n- Timezone: ${businessInfo.timezone || 'UTC'}`;
  context += `\n- Business Category: ${businessInfo.businessCategory || 'General Services'}`;
  context += `\n- Service Areas: ${businessInfo.serviceAreas?.join(', ') || 'Main service area'}`;
  context += `\n- Operating Hours: ${businessInfo.operatingHours || 'Monday-Friday 8AM-5PM'}`;
  context += `\n- Response Time: ${businessInfo.responseTime || '24 hours'}`;

  // Add team information
  if (managers && managers.length > 0) {
    context += `\n- Managers: ${managers.map(m => m.name).join(', ')}`;
  }
  
  if (suppliers && suppliers.length > 0) {
    context += `\n- Suppliers: ${suppliers.map(s => s.name).join(', ')}`;
  }

  // Add services information
  if (businessInfo.services && businessInfo.services.length > 0) {
    context += `\n- Services: ${businessInfo.services.map(s => 
      `${s.name} (${s.pricingType} ${s.price} ${businessInfo.currency || 'USD'})`
    ).join(', ')}`;
  }

  return context;
}

/**
 * Build industry-specific categories section
 */
function buildIndustrySpecificCategories(businessInfo) {
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  const businessName = businessInfo.name || 'the business';
  
  // Get business type template
  const template = businessTypeTemplates[businessType] || businessTypeTemplates['General'];
  
  if (!template) {
    return null;
  }

  let categories = `### Industry-Specific Categories for ${businessType.toUpperCase()}:`;

  // Add business-specific inquiry types
  if (template.inquiryTypes) {
    categories += `\n\n#### Primary Inquiry Types:`;
    template.inquiryTypes.forEach((inquiry, index) => {
      categories += `\n\n**${index + 1}. ${inquiry.name}**`;
      categories += `\n- Description: ${inquiry.description}`;
      categories += `\n- Keywords: ${inquiry.keywords.join(', ')}`;
      categories += `\n- Examples: ${inquiry.examples.join(', ')}`;
      if (inquiry.pricing) {
        categories += `\n- Pricing: ${inquiry.pricing}`;
      }
    });
  }

  // Add business-specific response protocols
  if (template.responseProtocols) {
    categories += `\n\n#### Response Protocols:`;
    template.responseProtocols.forEach((protocol, index) => {
      categories += `\n\n**${index + 1}. ${protocol.name}**`;
      categories += `\n- Description: ${protocol.description}`;
      if (protocol.examples) {
        categories += `\n- Examples: ${protocol.examples.join(', ')}`;
      }
    });
  }

  // Add business-specific special rules
  if (template.specialRules) {
    categories += `\n\n#### Special Rules for ${businessName}:`;
    template.specialRules.forEach((rule, index) => {
      categories += `\n\n**${index + 1}. ${rule.name}**`;
      categories += `\n- Rule: ${rule.description}`;
      if (rule.examples) {
        categories += `\n- Examples: ${rule.examples.join(', ')}`;
      }
    });
  }

  return categories;
}

/**
 * Build historical data enhancement section
 */
function buildHistoricalDataEnhancement(historicalData) {
  if (!historicalData || !historicalData.examples || historicalData.examples.length === 0) {
    return null;
  }

  const voiceAnalysis = analyzeHistoricalVoicePatterns(historicalData.examples);
  
  let enhancement = `### Historical Email Analysis (Voice Learning):`;
  enhancement += `\n- **Detected Tone**: ${voiceAnalysis.tone}`;
  enhancement += `\n- **Formality Level**: ${voiceAnalysis.formality}`;
  enhancement += `\n- **Response Length**: ${voiceAnalysis.averageLength}`;
  enhancement += `\n- **Common Phrases**: ${voiceAnalysis.commonPhrases.join(', ')}`;
  
  if (voiceAnalysis.writingPatterns.length > 0) {
    enhancement += `\n- **Writing Patterns**: ${voiceAnalysis.writingPatterns.join(', ')}`;
  }

  // Add examples from historical data
  if (historicalData.examples.length > 0) {
    enhancement += `\n\n#### Examples from Previous Emails:`;
    historicalData.examples.slice(0, 3).forEach((example, index) => {
      const preview = example.human_reply.substring(0, 150) + '...';
      enhancement += `\n\n**Example ${index + 1} (${example.category}):** "${preview}"`;
    });
  }

  enhancement += `\n\n#### Classification Guidance:`;
  enhancement += `\n- Use the detected tone and style patterns when classifying emails`;
  enhancement += `\n- Consider the common phrases and writing patterns in your analysis`;
  enhancement += `\n- Apply the voice characteristics to improve classification accuracy`;

  return enhancement;
}

/**
 * Build dynamic team routing section
 */
function buildDynamicTeamRouting(businessInfo, managers, suppliers) {
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  const businessName = businessInfo.name || 'the business';
  
  let routing = `### Dynamic Team Routing:`;

  // Add manager routing
  if (managers && managers.length > 0) {
    routing += `\n\n#### Manager Routing:`;
    managers.forEach(manager => {
      routing += `\n- **${manager.name}**: ${manager.role || 'Manager'} - ${manager.specialties?.join(', ') || 'General management'}`;
    });
    routing += `\n- **Unassigned**: Internal alerts or platform notices requiring manager review without a specific person`;
  }

  // Add supplier routing
  if (suppliers && suppliers.length > 0) {
    routing += `\n\n#### Supplier Routing:`;
    suppliers.forEach(supplier => {
      routing += `\n- **${supplier.name}**: ${supplier.category || 'Supplier'} - ${supplier.specialties?.join(', ') || 'General supplies'}`;
    });
  }

  // Add business-specific routing rules
  const template = businessTypeTemplates[businessType];
  if (template && template.routingRules) {
    routing += `\n\n#### Business-Specific Routing Rules:`;
    template.routingRules.forEach((rule, index) => {
      routing += `\n\n**${index + 1}. ${rule.name}**`;
      routing += `\n- Route to: ${rule.routeTo}`;
      routing += `\n- Condition: ${rule.condition}`;
      if (rule.examples) {
        routing += `\n- Examples: ${rule.examples.join(', ')}`;
      }
    });
  }

  return routing;
}

/**
 * Build advanced AI reply logic section
 */
function buildAdvancedAIReplyLogic(businessInfo) {
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  const businessName = businessInfo.name || 'the business';
  
  let logic = `### Advanced AI Reply Logic:`;

  // Add business-specific AI reply rules
  const template = businessTypeTemplates[businessType];
  if (template && template.aiReplyRules) {
    logic += `\n\n#### Business-Specific AI Reply Rules:`;
    template.aiReplyRules.forEach((rule, index) => {
      logic += `\n\n**${index + 1}. ${rule.category}**`;
      logic += `\n- AI Can Reply: ${rule.aiCanReply ? 'Yes' : 'No'}`;
      logic += `\n- Confidence Threshold: ${rule.confidenceThreshold || 0.75}`;
      logic += `\n- Escalate To: ${rule.escalateTo || 'Human'}`;
      if (rule.conditions) {
        logic += `\n- Conditions: ${rule.conditions.join(', ')}`;
      }
    });
  }

  // Add general AI reply rules
  logic += `\n\n#### General AI Reply Rules:`;
  logic += `\n- **Support > General**: ai_can_reply: true (if confidence ≥ 0.75)`;
  logic += `\n- **Support > TechnicalSupport**: ai_can_reply: true (if confidence ≥ 0.75)`;
  logic += `\n- **Support > PartsAndChemicals**: ai_can_reply: true (if confidence ≥ 0.75)`;
  logic += `\n- **Support > AppointmentScheduling**: ai_can_reply: true (if confidence ≥ 0.75)`;
  logic += `\n- **Sales**: ai_can_reply: true (if confidence ≥ 0.75)`;
  logic += `\n- **Urgent**: ai_can_reply: false (always escalate to human)`;
  logic += `\n- **All other categories**: ai_can_reply: false (route to human)`;

  return logic;
}

/**
 * Build category structure section
 */
function buildCategoryStructure(businessInfo, labelConfig) {
  if (!labelConfig || !labelConfig.labels) {
    return `### Category Structure:
No specific label configuration available. Please ensure proper label schema is loaded.`;
  }

  let structure = `### Category Structure:`;

  // Generate category structure from label configuration
  labelConfig.labels.forEach(label => {
    structure += `\n\n#### ${label.name.toUpperCase()}:`;
    
    if (label.description) {
      structure += `\n${label.description}`;
    }

    if (label.sub && label.sub.length > 0) {
      structure += `\nsecondary_category: [${label.sub.map(sub => sub.name).join(', ')}]`;
      
      label.sub.forEach(subLabel => {
        structure += `\n${subLabel.name} - ${subLabel.description || 'No description available'}`;
        
        if (subLabel.sub && subLabel.sub.length > 0) {
          structure += `\nTertiary categories: [${subLabel.sub.map(tertiary => tertiary.name).join(', ')}]`;
        }
      });
    }
  });

  return structure;
}

/**
 * Build special rules section
 */
function buildSpecialRules(businessInfo) {
  const businessName = businessInfo.name || 'The Hot Tub Man Ltd.';
  
  let rules = `### Special Rules:`;

  // Add e-transfer rules
  rules += `\n\n#### E-Transfer Classification:`;
  rules += `\nIf secondary_category is 'e-transfer', set tertiary_category: [FromBusiness, ToBusiness]`;
  rules += `\n\n**From Business**: Emails confirming that ${businessName} has sent a payment or successfully transferred funds to a vendor, contractor, or external service provider.`;
  rules += `\n\n**To Business**: Emails confirming that a payment has been deposited into ${businessName}'s account.`;

  // Add receipts rules
  rules += `\n\n#### Receipts Classification:`;
  rules += `\nIf secondary_category is 'receipts', set tertiary_category: [PaymentSent, PaymentReceived]`;
  rules += `\n\n**PaymentSent**: Email confirming you sent a payment`;
  rules += `\n**PaymentReceived**: Email confirming you've received a payment`;

  // Add business-specific special rules
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  const template = businessTypeTemplates[businessType];
  if (template && template.specialRules) {
    rules += `\n\n#### Business-Specific Special Rules:`;
    template.specialRules.forEach((rule, index) => {
      rules += `\n\n**${index + 1}. ${rule.name}**`;
      rules += `\n${rule.description}`;
      if (rule.examples) {
        rules += `\nExamples: ${rule.examples.join(', ')}`;
      }
    });
  }

  return rules;
}

/**
 * Build JSON output format section
 */
function buildJSONOutputFormat() {
  return `### JSON Output Format:
Return ONLY the following JSON structure. Do not add any other text or explanations.

\`\`\`json
{
  "summary": "A concise, one-sentence summary of the email's purpose.",
  "reasoning": "A brief explanation for the chosen categories.",
  "confidence": 0.9,
  "primary_category": "The chosen primary category",
  "secondary_category": "The chosen secondary category, or null if not applicable.",
  "tertiary_category": "The chosen tertiary category, or null if not applicable.",
  "entities": {
    "contact_name": "Extracted contact name, or null.",
    "email_address": "Extracted email address, or null.",
    "phone_number": "Extracted phone number, or null.",
    "order_number": "Extracted order/invoice number, or null."
  },
  "ai_can_reply": true
}
\`\`\``;
}

/**
 * Analyze historical voice patterns
 */
function analyzeHistoricalVoicePatterns(examples) {
  if (!examples || examples.length === 0) {
    return {
      tone: 'Professional and friendly',
      formality: 'Professional',
      averageLength: 'Medium',
      commonPhrases: [],
      writingPatterns: []
    };
  }

  const analysis = {
    tone: 'Professional and friendly',
    formality: 'Professional',
    averageLength: 'Medium',
    commonPhrases: [],
    writingPatterns: []
  };

  const allText = examples.map(e => e.human_reply).join(' ').toLowerCase();
  
  // Analyze tone and formality
  if (allText.includes('hi there') || allText.includes('hey') || allText.includes('thanks!')) {
    analysis.tone = 'Friendly and approachable';
    analysis.formality = 'Semi-professional';
  } else if (allText.includes('dear') || allText.includes('sincerely')) {
    analysis.tone = 'Formal and professional';
    analysis.formality = 'Formal';
  }

  // Analyze response length
  const avgLength = examples.reduce((sum, e) => sum + e.human_reply.length, 0) / examples.length;
  if (avgLength < 200) {
    analysis.averageLength = 'Short and concise';
  } else if (avgLength > 500) {
    analysis.averageLength = 'Detailed and comprehensive';
  }

  // Extract common phrases
  const commonBusinessPhrases = [
    'thank you for reaching out',
    'i\'d be happy to help',
    'let me know if you have any questions',
    'i\'ll get back to you',
    'please let me know',
    'i appreciate your business',
    'looking forward to hearing from you'
  ];

  commonBusinessPhrases.forEach(phrase => {
    if (allText.includes(phrase)) {
      analysis.commonPhrases.push(phrase);
    }
  });

  // Extract writing patterns
  if (allText.includes('i\'m') || allText.includes('i am')) {
    analysis.writingPatterns.push('Uses contractions');
  }
  if (allText.includes('!')) {
    analysis.writingPatterns.push('Uses exclamation points');
  }
  if (allText.includes('?')) {
    analysis.writingPatterns.push('Asks questions');
  }
  if (allText.includes('please')) {
    analysis.writingPatterns.push('Uses polite language');
  }

  return analysis;
}

export default {
  generateEnhancedClassifierSystemMessage
};
