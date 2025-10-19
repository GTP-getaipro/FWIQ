/**
 * Enhanced AI Draft Agent System Message Generator
 * 
 * Generates dynamic, personalized AI draft agent system messages with:
 * - Historical email data integration for voice learning
 * - Business-specific context and response protocols
 * - Industry-specific examples and templates
 * - Dynamic team routing and escalation rules
 * - Advanced response generation logic
 * 
 * @module enhancedAIDraftAgentSystemMessage
 */

import { businessTypeTemplates } from './businessTypeTemplates.js';
import { GoldStandardReplyPrompt } from './goldStandardReplyPrompt.js';

/**
 * Generate enhanced AI draft agent system message
 * @param {Object} businessInfo - Complete business information
 * @param {Array} managers - Array of managers
 * @param {Array} suppliers - Array of suppliers
 * @param {Object} historicalData - Historical email data for voice enhancement
 * @param {Object} behaviorConfig - Behavior configuration
 * @param {string} category - Email category for context-specific enhancement
 * @returns {string} - Enhanced AI draft agent system message
 */
export const generateEnhancedAIDraftAgentSystemMessage = async (
  businessInfo, 
  managers = [], 
  suppliers = [], 
  historicalData = null,
  behaviorConfig = null,
  category = 'General'
) => {
  console.log('🚀 Generating enhanced AI draft agent system message...');
  
  // Build enhanced system message sections
  const sections = [
    buildRoleSection(businessInfo),
    buildBusinessContext(businessInfo, managers, suppliers),
    buildHistoricalVoiceLearning(historicalData, category),
    buildIndustrySpecificResponseProtocols(businessInfo, category),
    buildDynamicTeamRouting(businessInfo, managers, suppliers),
    buildAdvancedResponseLogic(businessInfo, behaviorConfig, managers),
    buildCategorySpecificGuidelines(businessInfo, category),
    buildResponseTemplates(businessInfo, historicalData),
    buildQualityAssurance(businessInfo)
  ];

  return sections.filter(section => section).join('\n\n');
};

/**
 * Build role and assistant definition section
 */
function buildRoleSection(businessInfo) {
  const businessName = businessInfo.name || 'the business';
  const businessType = businessInfo.businessTypes?.[0] || 'general services';
  
  return `**Assistant role:** Draft friendly, professional, and helpful replies for ${businessName} that:

- Reflect prior conversation context and customer history
- Clearly communicate next steps with specific timelines
- Resolve concerns without delays or vagueness
- Match the customer's tone, urgency, and message length
- Maintain a warm, human, and on-brand voice
- Use your learned writing style and preferred phrases

Use the structured guidance and rules below to reply with confidence, clarity, and care.
Always prioritize accuracy, especially for dates and specific details. Strive for conciseness by omitting unnecessary requests or information that might be perceived as a burden to the customer.`;
}

/**
 * Build comprehensive business context section
 */
function buildBusinessContext(businessInfo, managers, suppliers) {
  const businessName = businessInfo.name || 'Business';
  const businessType = businessInfo.businessTypes?.[0] || 'General Services';
  
  let context = `## Business-Specific Context
- Business: ${businessName}
- Industry: ${businessType}
- Service Areas: ${businessInfo.serviceAreas?.join(', ') || 'Main service area'}
- Primary Products/Services: ${businessInfo.services?.map(s => s.name).join(', ') || 'General services'}
- Operating Hours: ${businessInfo.operatingHours || 'Monday-Friday 8AM-5PM'}
- Response Time: ${businessInfo.responseTime || '24 hours'}
- Contact: ${businessInfo.phone || 'Not provided'} | ${businessInfo.websiteUrl || 'Not provided'}`;

  // Add address information
  if (businessInfo.address) {
    const addressParts = [businessInfo.address, businessInfo.city, businessInfo.state, businessInfo.zipCode]
      .filter(part => part).join(', ');
    context += `\n- Address: ${addressParts}`;
  }

  // Add business details
  context += `\n- Currency: ${businessInfo.currency || 'USD'}`;
  context += `\n- Timezone: ${businessInfo.timezone || 'UTC'}`;

  // Add team information
  if (managers && managers.length > 0) {
    context += `\n- Managers: ${managers.map(m => `${m.name} (${m.role || 'Manager'})`).join(', ')}`;
  }
  
  if (suppliers && suppliers.length > 0) {
    context += `\n- Suppliers: ${suppliers.map(s => `${s.name} (${s.category || 'Supplier'})`).join(', ')}`;
  }

  return context;
}

/**
 * Build historical voice learning section
 */
function buildHistoricalVoiceLearning(historicalData, category) {
  if (!historicalData || !historicalData.examples || historicalData.examples.length === 0) {
    return `## Voice Learning (Default)
- **Tone**: Professional and friendly
- **Formality**: Professional
- **Response Length**: Medium
- **Style**: Clear and helpful

*Note: Voice learning will be enhanced as you use the system and provide feedback on AI drafts.*`;
  }

  const voiceAnalysis = analyzeHistoricalVoicePatterns(historicalData.examples);
  const categoryExamples = filterExamplesByCategory(historicalData.examples, category);
  
  let voiceLearning = `## 🎤 Voice Learning (From Your Previous Emails)

### Your Writing Style:
- **Tone**: ${voiceAnalysis.tone}
- **Formality**: ${voiceAnalysis.formality}
- **Response Length**: ${voiceAnalysis.averageLength}
- **Common Phrases**: ${voiceAnalysis.commonPhrases.join(', ')}
- **Writing Patterns**: ${voiceAnalysis.writingPatterns.join(', ')}

### Voice Guidelines:
- **Match your natural writing style** from the examples below
- **Use your common phrases** when appropriate
- **Maintain consistency** with your previous email tone
- **Be authentic** to your voice, not generic AI responses`;

  // Add category-specific examples
  if (categoryExamples.length > 0) {
    voiceLearning += `\n\n### Examples from Your Previous ${category} Emails:`;
    categoryExamples.slice(0, 3).forEach((example, index) => {
      const preview = example.human_reply.substring(0, 200) + '...';
      voiceLearning += `\n\n**Example ${index + 1}:** "${preview}"`;
    });
  }

  // Add general examples if no category-specific examples
  if (categoryExamples.length === 0 && historicalData.examples.length > 0) {
    voiceLearning += `\n\n### Examples from Your Previous Emails:`;
    historicalData.examples.slice(0, 2).forEach((example, index) => {
      const preview = example.human_reply.substring(0, 200) + '...';
      voiceLearning += `\n\n**Example ${index + 1} (${example.category}):** "${preview}"`;
    });
  }

  return voiceLearning;
}

/**
 * Build industry-specific response protocols section
 */
function buildIndustrySpecificResponseProtocols(businessInfo, category) {
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  const businessName = businessInfo.name || 'the business';
  
  // Get business type template
  const template = businessTypeTemplates[businessType] || businessTypeTemplates['General'];
  
  if (!template) {
    return null;
  }

  let protocols = `## Industry-Specific Response Protocols for ${businessType.toUpperCase()}:`;

  // Add business-specific response protocols
  if (template.responseProtocols) {
    protocols += `\n\n### Response Guidelines:`;
    template.responseProtocols.forEach((protocol, index) => {
      protocols += `\n\n**${index + 1}. ${protocol.name}**`;
      protocols += `\n- Description: ${protocol.description}`;
      if (protocol.examples) {
        protocols += `\n- Examples: ${protocol.examples.join(', ')}`;
      }
      if (protocol.pricing) {
        protocols += `\n- Pricing: ${protocol.pricing}`;
      }
    });
  }

  // Add business-specific special rules
  if (template.specialRules) {
    protocols += `\n\n### Special Rules for ${businessName}:`;
    template.specialRules.forEach((rule, index) => {
      protocols += `\n\n**${index + 1}. ${rule.name}**`;
      protocols += `\n- Rule: ${rule.description}`;
      if (rule.examples) {
        protocols += `\n- Examples: ${rule.examples.join(', ')}`;
      }
    });
  }

  return protocols;
}

/**
 * Build dynamic team routing section
 */
function buildDynamicTeamRouting(businessInfo, managers, suppliers) {
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  const businessName = businessInfo.name || 'the business';
  
  let routing = `## Dynamic Team Routing & Escalation:`;

  // Add manager routing
  if (managers && managers.length > 0) {
    routing += `\n\n### Manager Routing:`;
    managers.forEach(manager => {
      routing += `\n- **${manager.name}**: ${manager.role || 'Manager'} - ${manager.specialties?.join(', ') || 'General management'}`;
    });
  }

  // Add supplier routing
  if (suppliers && suppliers.length > 0) {
    routing += `\n\n### Supplier Routing:`;
    suppliers.forEach(supplier => {
      routing += `\n- **${supplier.name}**: ${supplier.category || 'Supplier'} - ${supplier.specialties?.join(', ') || 'General supplies'}`;
    });
  }

  // Add business-specific routing rules
  const template = businessTypeTemplates[businessType];
  if (template && template.routingRules) {
    routing += `\n\n### Business-Specific Routing Rules:`;
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
 * Build advanced response logic section
 */
function buildAdvancedResponseLogic(businessInfo, behaviorConfig, managers = []) {
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  const businessName = businessInfo.name || 'the business';
  
  let logic = `## Advanced Response Logic:`;

  // Add business-specific response rules
  const template = businessTypeTemplates[businessType];
  if (template && template.responseRules) {
    logic += `\n\n### Business-Specific Response Rules:`;
    template.responseRules.forEach((rule, index) => {
      logic += `\n\n**${index + 1}. ${rule.name}**`;
      logic += `\n- Rule: ${rule.description}`;
      if (rule.examples) {
        logic += `\n- Examples: ${rule.examples.join(', ')}`;
      }
    });
  }

  // Add general response guidelines
  logic += `\n\n### General Response Guidelines:`;
  logic += `\n- **Assess conversation depth**: If the customer is on their second or third message in a thread, avoid repeating earlier answers or re-asking for details they've already provided.`;
  logic += `\n- **Advance the resolution**: When replying to follow-ups, do not summarize prior messages — instead, advance the resolution or confirm the next step.`;
  logic += `\n- **Fill in the gaps**: If the human reply is incomplete, ensure the AI reply fills in the gaps: confirm all necessary details, include next steps, express gratitude, and close with warmth.`;
  logic += `\n- **Analyze recent input**: Always analyze the most recent customer input (e.g., specific attachments, details provided) to understand the current context of their request.`;

  // Add follow-up ownership guidelines
  logic += `\n\n### Follow-up Ownership & Clarity:`;
  logic += `\nAlways state who will follow up and by when. Use concrete phrasing like:`;
  if (managers && managers.length > 0) {
    const managerName = managers[0].name;
    logic += `\n- "You'll hear back from ${managerName} on Thursday with the quote."`;
    logic += `\n- "${managerName} will call you tomorrow to schedule the service visit."`;
    logic += `\n- "I'll have ${managerName} review your request and get back to you by end of day."`;
  } else {
    logic += `\n- "You'll hear back from our team on Thursday with the quote."`;
    logic += `\n- "We'll call you tomorrow to schedule the service visit."`;
    logic += `\n- "I'll have our team review your request and get back to you by end of day."`;
  }

  return logic;
}

/**
 * Build category-specific guidelines section
 */
function buildCategorySpecificGuidelines(businessInfo, category) {
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  const businessName = businessInfo.name || 'the business';
  
  let guidelines = `## Category-Specific Guidelines for ${category.toUpperCase()}:`;

  // Add category-specific guidelines based on business type
  const template = businessTypeTemplates[businessType];
  if (template && template.categoryGuidelines) {
    const categoryGuidelines = template.categoryGuidelines[category];
    if (categoryGuidelines) {
      guidelines += `\n\n### ${category} Response Guidelines:`;
      guidelines += `\n- ${categoryGuidelines.description}`;
      if (categoryGuidelines.examples) {
        guidelines += `\n- Examples: ${categoryGuidelines.examples.join(', ')}`;
      }
      if (categoryGuidelines.pricing) {
        guidelines += `\n- Pricing: ${categoryGuidelines.pricing}`;
      }
    }
  }

  // Add general category guidelines
  const generalGuidelines = getGeneralCategoryGuidelines(category, businessName);
  if (generalGuidelines) {
    guidelines += `\n\n### General ${category} Guidelines:`;
    guidelines += `\n${generalGuidelines}`;
  }

  return guidelines;
}

/**
 * Build response templates section
 */
function buildResponseTemplates(businessInfo, historicalData) {
  const businessName = businessInfo.name || 'the business';
  const businessType = businessInfo.businessTypes?.[0] || 'general';
  
  let templates = `## Response Templates & Examples:`;

  // Add business-specific response templates
  const template = businessTypeTemplates[businessType];
  if (template && template.responseTemplates) {
    templates += `\n\n### Business-Specific Templates:`;
    template.responseTemplates.forEach((responseTemplate, index) => {
      templates += `\n\n**${index + 1}. ${responseTemplate.name}**`;
      templates += `\n- Template: ${responseTemplate.template}`;
      if (responseTemplate.examples) {
        templates += `\n- Examples: ${responseTemplate.examples.join(', ')}`;
      }
    });
  }

  // Add general response templates
  templates += `\n\n### General Response Templates:`;
  templates += `\n\n**1. Acknowledgment Template:**`;
  templates += `\n"Thank you for reaching out to ${businessName}. I understand [customer's concern/request] and I'm here to help."`;
  
  templates += `\n\n**2. Information Request Template:**`;
  templates += `\n"To better assist you, I'll need a few details: [specific information needed]. Once I have this information, I can [next step]."`;
  
  templates += `\n\n**3. Next Steps Template:**`;
  templates += `\n"Here's what happens next: [specific next steps]. You'll hear back from us by [specific timeline] with [specific outcome]."`;
  
  templates += `\n\n**4. Closing Template:**`;
  templates += `\n"Please don't hesitate to reach out if you have any questions. We're here to help!"`;

  return templates;
}

/**
 * Build quality assurance section
 */
function buildQualityAssurance(businessInfo) {
  const businessName = businessInfo.name || 'the business';
  
  return `## Quality Assurance & Best Practices:

### Response Quality Checklist:
- ✅ **Accuracy**: Verify all dates, times, and specific details
- ✅ **Clarity**: Use clear, concise language
- ✅ **Completeness**: Address all customer concerns
- ✅ **Tone**: Match customer's tone and urgency
- ✅ **Next Steps**: Clearly state what happens next
- ✅ **Timeline**: Provide specific timeframes
- ✅ **Contact**: Include relevant contact information
- ✅ **Gratitude**: Express appreciation for their business

### Common Mistakes to Avoid:
- ❌ Don't repeat information the customer already provided
- ❌ Don't ask for information that's not necessary
- ❌ Don't use generic, robotic language
- ❌ Don't leave the customer hanging without next steps
- ❌ Don't make promises you can't keep
- ❌ Don't ignore the customer's emotional state
- ❌ Don't use jargon the customer won't understand

### Success Metrics:
- **Customer Satisfaction**: Responses that resolve concerns quickly
- **Efficiency**: Fewer back-and-forth exchanges
- **Accuracy**: Correct information and timelines
- **Personalization**: Responses that feel human and authentic`;
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
    'looking forward to hearing from you',
    'i understand your concern',
    'i\'m here to help',
    'feel free to contact me'
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

/**
 * Filter examples by category
 */
function filterExamplesByCategory(examples, category) {
  if (!category || category === 'General') {
    return examples;
  }
  
  return examples.filter(example => 
    example.category && example.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get general category guidelines
 */
function getGeneralCategoryGuidelines(category, businessName) {
  const guidelines = {
    'Support': `Focus on resolving the customer's issue quickly and efficiently. Provide clear next steps and timelines. If you can't resolve the issue immediately, explain what you're doing to help and when they'll hear back.`,
    
    'Sales': `Be helpful and informative without being pushy. Provide relevant information about products/services. If the customer is ready to buy, guide them through the next steps. If they need more information, provide it clearly.`,
    
    'Urgent': `Prioritize immediate response and clear communication. Acknowledge the urgency and provide specific timelines for resolution. If immediate action is needed, explain what's happening right now.`,
    
    'General': `Be friendly, professional, and helpful. Address all aspects of the customer's inquiry. Provide clear next steps and contact information if needed.`
  };

  return guidelines[category] || guidelines['General'];
}

export default {
  generateEnhancedAIDraftAgentSystemMessage
};
