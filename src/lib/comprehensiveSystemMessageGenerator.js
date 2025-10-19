/**
 * Comprehensive System Message Generator
 * 
 * Generates Hot Tub Man-style AI system messages using:
 * - Business type templates
 * - Onboarding data (business info, services, rules)
 * - Voice profile (from email analysis)
 * - Team data (managers, suppliers)
 * 
 * @module comprehensiveSystemMessageGenerator
 */

import { businessTypeTemplates } from './businessTypeTemplates.js';

/**
 * Generate comprehensive AI system message
 * @param {Object} profileData - Complete profile data
 * @param {Object} voiceProfile - Voice training results
 * @returns {string} - Comprehensive system message
 */
export function generateComprehensiveSystemMessage(profileData, voiceProfile = null) {
  const {
    business_type,
    business_types,
    client_config,
    managers = [],
    suppliers = []
  } = profileData;

  // Get primary business type
  const primaryType = Array.isArray(business_types) && business_types.length > 0 
    ? business_types[0] 
    : business_type || 'General';

  // Load business type template
  const template = businessTypeTemplates[primaryType] || businessTypeTemplates['General'];

  // Build system message sections
  const sections = [
    buildRoleSection(client_config, template, voiceProfile),
    buildInquiryClassification(client_config, template),
    buildResponseProtocols(client_config, template),
    buildTeamRouting(managers, suppliers, client_config),
    buildBusinessContext(client_config),
    buildVoiceGuidelines(voiceProfile, client_config),
    buildFewShotExamples(voiceProfile),
    buildSignatureSection(client_config, voiceProfile),
    buildRulesAndGuidelines(client_config, template)
  ];

  return sections.filter(Boolean).join('\n\n');
}

/**
 * Build role and tone section
 */
function buildRoleSection(config, template, voiceProfile) {
  const businessName = config?.business?.name || 'Your Business';
  const tone = voiceProfile?.voice?.tone || config?.rules?.tone || 'Professional';
  
  return `# AI Assistant Role for ${businessName}

Draft ${tone.toLowerCase()} email replies that:
- Reflect prior conversation context
- Clearly communicate next steps
- Resolve concerns without delays or vagueness
- Match the customer's tone, urgency, and message length
- Maintain a warm, human, and on-brand voice

Use the structured guidance and rules below to reply with confidence, clarity, and care.
Always prioritize accuracy, especially for dates and specific details. 
Strive for conciseness by omitting unnecessary requests or information that might be perceived as a burden to the customer.

## Intelligent Conversation Progression
- Assess conversation depth: If the customer is on their second or third message in a thread, avoid repeating earlier answers or re-asking for details they've already provided.
- When replying to follow-ups, do not summarize prior messages—instead, advance the resolution or confirm the next step.
- If the human reply is incomplete, ensure the AI reply fills in the gaps: confirm all necessary details, include next steps, express gratitude, and close with warmth.
- Always analyze the most recent customer input to understand the current context of their request.`;
}

/**
 * Build inquiry classification section
 */
function buildInquiryClassification(config, template) {
  const services = config?.services || [];
  
  let classification = `## Inquiry Classification

Classify each incoming email into one of these categories:\n`;

  // Add template-specific inquiry types
  if (template.inquiryTypes && template.inquiryTypes.length > 0) {
    template.inquiryTypes.forEach(type => {
      classification += `\n### ${type.name}\n`;
      classification += `${type.description}\n`;
      
      if (type.keywords && type.keywords.length > 0) {
        classification += `**Keywords**: ${type.keywords.join(', ')}\n`;
      }
      
      if (type.examples && type.examples.length > 0) {
        classification += `**Examples**: ${type.examples.join(', ')}\n`;
      }
    });
  }

  // Add service-based categorization
  if (services.length > 0) {
    classification += `\n### Available Services:\n`;
    services.forEach(service => {
      classification += `- **${service.name}**: ${service.description || 'Service details'}`;
      if (service.price && config?.rules?.aiGuardrails?.allowPricing) {
        classification += ` (${service.price})`;
      }
      classification += '\n';
    });
  }

  return classification;
}

/**
 * Build response protocols section
 */
function buildResponseProtocols(config, template) {
  let protocols = `## Response Protocols\n`;

  // Add template-specific protocols
  if (template.protocols && template.protocols.length > 0) {
    template.protocols.forEach(protocol => {
      protocols += `\n### ${protocol.name}\n`;
      protocols += `${protocol.instructions}\n`;
      
      if (protocol.pricing && config?.rules?.aiGuardrails?.allowPricing) {
        protocols += `**Pricing**: ${protocol.pricing}\n`;
      }
      
      if (protocol.responseTime) {
        protocols += `**Response Time**: ${protocol.responseTime}\n`;
      }
      
      if (protocol.requiredInfo && protocol.requiredInfo.length > 0) {
        protocols += `**Required Information**: ${protocol.requiredInfo.join(', ')}\n`;
      }
      
      if (protocol.nextSteps) {
        protocols += `**Next Steps**: ${protocol.nextSteps}\n`;
      }
    });
  }

  // Add SLA information
  if (config?.rules?.sla) {
    protocols += `\n### Response Time SLA\n`;
    protocols += `Respond to all inquiries within ${config.rules.sla}.\n`;
  }

  return protocols;
}

/**
 * Build team routing section
 */
function buildTeamRouting(managers, suppliers, config) {
  let routing = `## Team & Routing\n`;

  // Managers section
  if (managers && managers.length > 0) {
    routing += `\n### Team Members:\n`;
    managers.forEach(manager => {
      routing += `- **${manager.name}**`;
      if (manager.role) routing += ` (${manager.role})`;
      if (manager.email) routing += ` - ${manager.email}`;
      if (manager.phone) routing += ` - ${manager.phone}`;
      routing += '\n';
    });

    routing += `\n**Escalation**: Route critical issues to ${config?.rules?.defaultEscalationManager || managers[0]?.name || 'management'}.\n`;
  }

  // Suppliers section
  if (suppliers && suppliers.length > 0) {
    routing += `\n### Known Suppliers:\n`;
    suppliers.forEach(supplier => {
      routing += `- **${supplier.name}**`;
      if (supplier.category) routing += ` (${supplier.category})`;
      if (supplier.domains && supplier.domains.length > 0) {
        routing += ` - Domains: ${supplier.domains.join(', ')}`;
      }
      routing += '\n';
    });

    routing += `\nAutomatically categorize emails from these supplier domains.\n`;
  }

  return routing;
}

/**
 * Build business context section
 */
function buildBusinessContext(config) {
  const business = config?.business || {};
  const contact = config?.contact || {};
  const rules = config?.rules || {};

  let context = `## Business Context\n`;

  // Basic info
  if (business.name) context += `- **Business**: ${business.name}\n`;
  if (business.serviceArea) context += `- **Service Area**: ${business.serviceArea}\n`;
  if (business.address) context += `- **Location**: ${business.address}\n`;
  
  // Contact info
  if (contact.afterHoursPhone || business.phone) {
    context += `- **Phone**: ${contact.afterHoursPhone || business.phone}\n`;
  }
  if (business.website) context += `- **Website**: ${business.website}\n`;
  if (business.timezone) context += `- **Timezone**: ${business.timezone}\n`;
  if (business.currency) context += `- **Currency**: ${business.currency}\n`;

  // Business hours
  if (rules.businessHours) {
    context += `\n### Business Hours:\n`;
    if (rules.businessHours.mon_fri) context += `- Monday-Friday: ${rules.businessHours.mon_fri}\n`;
    if (rules.businessHours.sat) context += `- Saturday: ${rules.businessHours.sat}\n`;
    if (rules.businessHours.sun) context += `- Sunday: ${rules.businessHours.sun}\n`;
  }

  // Holidays
  if (rules.holidays && rules.holidays.length > 0) {
    context += `\n**Holidays**: ${rules.holidays.join(', ')}\n`;
  }

  // AI Guardrails
  if (rules.aiGuardrails) {
    context += `\n### AI Guidelines:\n`;
    context += `- **Pricing Discussion**: ${rules.aiGuardrails.allowPricing ? 'ALLOWED' : 'NOT ALLOWED - Direct to quote request'}\n`;
    context += `- **Signature Mode**: ${rules.aiGuardrails.signatureMode || 'custom'}\n`;
  }

  // Phone Provider (for SMS/voicemail recognition)
  if (rules.phoneProvider) {
    context += `\n### Phone Provider: ${rules.phoneProvider.name}\n`;
    if (rules.phoneProvider.senders && rules.phoneProvider.senders.length > 0) {
      context += `Recognize these as phone notifications: ${rules.phoneProvider.senders.join(', ')}\n`;
    }
  }

  // CRM Provider
  if (rules.crmProvider) {
    context += `\n### CRM: ${rules.crmProvider.name}\n`;
    if (rules.crmAlertEmails && rules.crmAlertEmails.length > 0) {
      context += `CRM alert emails: ${Array.isArray(rules.crmAlertEmails) ? rules.crmAlertEmails.join(', ') : rules.crmAlertEmails}\n`;
    }
  }

  // Urgent keywords
  if (rules.urgentKeywords && rules.urgentKeywords.length > 0) {
    context += `\n**Urgent Keywords**: ${rules.urgentKeywords.join(', ')}\n`;
  }

  return context;
}

/**
 * Build voice guidelines section
 */
function buildVoiceGuidelines(voiceProfile, config) {
  if (!voiceProfile || !voiceProfile.voice) {
    return `## Communication Style\n\nMaintain a ${config?.rules?.tone || 'professional'} tone throughout all communications.`;
  }

  const voice = voiceProfile.voice;
  const phrases = voiceProfile.signaturePhrases || [];

  let guidelines = `## Your Communication Style (Learned from Your Emails)\n`;

  guidelines += `\n### Voice Characteristics:\n`;
  if (voice.tone) guidelines += `- **Tone**: ${voice.tone}\n`;
  if (voice.empathyLevel) guidelines += `- **Empathy Level**: ${(voice.empathyLevel * 100).toFixed(0)}%\n`;
  if (voice.formalityLevel) guidelines += `- **Formality**: ${(voice.formalityLevel * 100).toFixed(0)}%\n`;
  if (voice.directnessLevel) guidelines += `- **Directness**: ${(voice.directnessLevel * 100).toFixed(0)}%\n`;

  // Common phrases
  if (phrases.length > 0) {
    guidelines += `\n### Your Preferred Phrases (Use These Frequently):\n`;
    phrases.slice(0, 10).forEach(phrase => {
      guidelines += `- "${phrase.phrase}"`;
      if (phrase.context) guidelines += ` (${phrase.context})`;
      guidelines += '\n';
    });
  }

  // Greeting/closing patterns
  if (voice.greetingPattern || voice.closingPattern) {
    guidelines += `\n### Your Patterns:\n`;
    if (voice.greetingPattern) guidelines += `- **Greeting**: ${voice.greetingPattern}\n`;
    if (voice.closingPattern) guidelines += `- **Closing**: ${voice.closingPattern}\n`;
  }

  guidelines += `\n**Important**: Match this style consistently. Use these phrases and patterns to sound like YOU.`;

  return guidelines;
}

/**
 * Build few-shot examples section
 */
function buildFewShotExamples(voiceProfile) {
  if (!voiceProfile || !voiceProfile.fewShotExamples) {
    return '';
  }

  const examples = voiceProfile.fewShotExamples;
  let section = `## Few-Shot Examples from Your Emails\n`;
  section += `These are real examples of how you communicate. Use them as reference:\n`;

  Object.entries(examples).forEach(([category, categoryExamples]) => {
    if (categoryExamples && categoryExamples.length > 0) {
      section += `\n### ${category.toUpperCase()} Examples:\n`;
      categoryExamples.slice(0, 2).forEach((example, idx) => {
        section += `\n**Example ${idx + 1}:**\n`;
        if (example.subject) section += `Subject: "${example.subject}"\n`;
        if (example.body) {
          const preview = example.body.substring(0, 300);
          section += `\`\`\`\n${preview}${example.body.length > 300 ? '...' : ''}\n\`\`\`\n`;
        }
      });
    }
  });

  return section;
}

/**
 * Build signature section
 */
function buildSignatureSection(config, voiceProfile) {
  let signature = `## Required Signature\n\n`;
  signature += `**CRITICAL**: ALWAYS end emails with this EXACT signature. Do NOT use individual staff names or personal sign-offs:\n\n`;

  // Use custom signature if provided
  if (config?.signature) {
    signature += `\`\`\`\n${config.signature}\n\`\`\``;
  }
  // Or use voice profile sign-off
  else if (voiceProfile?.voice?.signOff) {
    signature += `\`\`\`\n${voiceProfile.voice.signOff}\n\`\`\``;
  }
  // Or generate default
  else {
    const businessName = config?.business?.name || 'Our Team';
    const phone = config?.contact?.afterHoursPhone || config?.business?.phone || '';
    const email = config?.contact?.primaryContactEmail || '';
    const website = config?.business?.website || '';

    signature += `\`\`\`\nThanks for your business!\n\nBest regards,\n${businessName}\n`;
    if (phone) signature += `${phone}\n`;
    if (email) signature += `${email}\n`;
    if (website) signature += `${website}\n`;
    signature += `\`\`\``;
  }

  return signature;
}

/**
 * Build rules and guidelines section
 */
function buildRulesAndGuidelines(config, template) {
  let rules = `## Important Rules\n`;

  // Timezone
  if (config?.business?.timezone) {
    rules += `- Use ${config.business.timezone} timestamps if dates/times are mentioned\n`;
  }

  // Accuracy
  rules += `- Never invent facts or prices; use only data provided\n`;
  rules += `- Correct obvious spelling errors in customer emails when quoting them\n`;

  // Pricing
  if (config?.rules?.aiGuardrails?.allowPricing) {
    rules += `- You MAY discuss pricing as specified in the services section\n`;
  } else {
    rules += `- You may NOT discuss specific pricing - direct customers to request a quote\n`;
  }

  // Template-specific rules
  if (template.specialRules && template.specialRules.length > 0) {
    rules += `\n### Business-Specific Rules:\n`;
    template.specialRules.forEach(rule => {
      rules += `- ${rule}\n`;
    });
  }

  // Escalation
  if (config?.rules?.escalationRules) {
    rules += `\n### Escalation: ${config.rules.escalationRules}\n`;
  }

  // Upsell opportunities (if template provides)
  if (template.upsellPrompts && template.upsellPrompts.length > 0) {
    rules += `\n### Upsell Opportunities:\n`;
    template.upsellPrompts.forEach(prompt => {
      rules += `- ${prompt}\n`;
    });
  }

  return rules;
}

/**
 * Format business hours for display
 */
function formatBusinessHours(hours) {
  if (!hours) return 'Not specified';
  
  const parts = [];
  if (hours.mon_fri) parts.push(`Mon-Fri: ${hours.mon_fri}`);
  if (hours.sat) parts.push(`Sat: ${hours.sat}`);
  if (hours.sun) parts.push(`Sun: ${hours.sun}`);
  
  return parts.join(', ');
}

/**
 * Export for use in edge function
 */
export default generateComprehensiveSystemMessage;


