/**
 * AI-Assisted Prompt Context Builder
 * Automatically generates consistent, business-specific prompts for LangChain/OpenAI nodes
 */

export class PromptComposer {
  constructor() {
    this.promptTemplates = {
      classifier: this.getClassifierTemplate(),
      responder: this.getResponderTemplate(),
      escalator: this.getEscalatorTemplate()
    };
  }

  /**
   * Compose a complete system prompt for AI nodes
   * @param {Object} context - Business context and configuration
   * @returns {Object} Composed prompts for different AI nodes
   */
  composePrompt(context) {
    const {
      businessName,
      businessTypes = [], // Now supports multiple business types
      businessType, // Legacy single business type
      tone = 'professional',
      primaryServices = [],
      escalationRules = {},
      managers = [],
      suppliers = [],
      customRules = []
    } = context;

    // Handle both single business type (legacy) and multiple business types (new)
    const allBusinessTypes = businessTypes.length > 0 ? businessTypes : (businessType ? [businessType] : []);
    const primaryBusinessType = allBusinessTypes[0] || 'Pools & Spas';

    return {
      classifier: this.buildClassifierPrompt({
        businessName,
        businessTypes: allBusinessTypes,
        primaryBusinessType,
        primaryServices,
        escalationRules,
        customRules
      }),
      
      responder: this.buildResponderPrompt({
        businessName,
        businessTypes: allBusinessTypes,
        primaryBusinessType,
        tone,
        primaryServices,
        managers,
        suppliers
      }),
      
      escalator: this.buildEscalatorPrompt({
        businessName,
        managers,
        escalationRules
      })
    };
  }

  /**
   * Build classifier prompt
   * @param {Object} params - Classification parameters
   * @returns {string} Classifier system message
   */
  buildClassifierPrompt({ businessName, businessTypes, primaryBusinessType, primaryServices, escalationRules, customRules }) {
    const serviceList = primaryServices.length > 0 
      ? primaryServices.map(s => s.name || s).join(', ')
      : this.getDefaultServices(primaryBusinessType);

    const urgentKeywords = escalationRules.urgentKeywords || this.getDefaultUrgentKeywords(primaryBusinessType);
    const categories = this.getBusinessCategories(primaryBusinessType);

    // Create multi-business context
    const businessContext = businessTypes.length > 1 
      ? `Multi-service business specializing in ${businessTypes.join(', ')}`
      : `${primaryBusinessType} business`;

    return `You are an email classifier for ${businessName}. Your primary goal is to categorize incoming emails accurately and efficiently.

BUSINESS CONTEXT:
- Business Name: ${businessName}
- Business Type: ${businessContext}
- Primary Service: ${primaryBusinessType}
${businessTypes.length > 1 ? `- Additional Services: ${businessTypes.slice(1).join(', ')}` : ''}
- Primary Services: ${serviceList}

CATEGORIES:
${categories.map(cat => `- ${cat.name}: ${cat.description}`).join('\n')}

ESCALATION RULES:
- URGENT OVERRIDE: If the email contains keywords like '${urgentKeywords.join("', '")}', immediately classify it as 'Support' with urgency: 'high'
- MANAGER ESCALATION: If the email mentions specific manager names or requires management attention, add escalation: 'manager'
${businessTypes.length > 1 ? `- SERVICE-SPECIFIC ESCALATION: Route to appropriate service specialist based on content (${businessTypes.join(', ')})` : ''}

${customRules.length > 0 ? `CUSTOM RULES:\n${customRules.map(rule => `- ${rule}`).join('\n')}\n` : ''}

OUTPUT FORMAT:
Your response must be a valid JSON object with:
{
  "primary_category": "CategoryName",
  "service_type": "${businessTypes.length > 1 ? 'PrimaryService|SecondaryService' : primaryBusinessType}",
  "urgency": "low|medium|high",
  "escalation": "none|manager|urgent${businessTypes.length > 1 ? '|specialist' : ''}",
  "confidence": 0.85,
  "reasoning": "Brief explanation of classification decision"
}`;
  }

  /**
   * Build responder prompt
   * @param {Object} params - Response parameters
   * @returns {string} Responder system message
   */
  buildResponderPrompt({ businessName, businessType, tone, primaryServices, managers, suppliers }) {
    const toneInstructions = this.getToneInstructions(tone);
    const serviceCatalog = this.buildServiceCatalog(primaryServices);
    const managerList = managers.length > 0 
      ? managers.map(m => `${m.name} (${m.email})`).join(', ')
      : 'our team';

    return `You are a helpful AI assistant for ${businessName}. Your goal is to draft clear, professional, and helpful email replies.

BUSINESS CONTEXT:
- Business Name: ${businessName}
- Business Type: ${businessType}
- Tone: ${tone} ${toneInstructions}

SERVICE CATALOG:
${serviceCatalog}

TEAM STRUCTURE:
- Available Managers: ${managerList}
- Suppliers: ${suppliers.length} active suppliers

RESPONSE GUIDELINES:
1. Always maintain a ${tone} tone
2. Be helpful and solution-oriented
3. If pricing is requested, mention that detailed quotes are available upon request
4. If escalation is needed, mention the appropriate manager
5. Keep responses concise but complete
6. Always end with the official signature block

SIGNATURE BLOCK:
Best regards,
${businessName} Team`;
  }

  /**
   * Build escalator prompt
   * @param {Object} params - Escalation parameters
   * @returns {string} Escalator system message
   */
  buildEscalatorPrompt({ businessName, managers, escalationRules }) {
    const managerList = managers.map(m => 
      `- ${m.name} (${m.email}): ${m.specialization || 'General management'}`
    ).join('\n');

    return `You are an escalation assistant for ${businessName}. Your role is to determine when and how to escalate emails to the appropriate team members.

MANAGEMENT TEAM:
${managerList}

ESCALATION CRITERIA:
- URGENT: Technical emergencies, safety issues, customer complaints
- MANAGER: Complex inquiries, pricing requests, contract discussions
- SPECIALIST: Technical questions requiring specific expertise

ESCALATION FORMAT:
When escalation is needed, format your response as:
{
  "escalate": true,
  "escalation_level": "urgent|manager|specialist",
  "assigned_to": "Manager Name",
  "reason": "Brief explanation of why escalation is needed",
  "priority": "high|medium|low",
  "response_draft": "Suggested response to customer"
}`;
  }

  /**
   * Get default services for business type
   * @param {string} businessType - Business type
   * @returns {string} Default services
   */
  getDefaultServices(businessType) {
    const serviceMap = {
      'Hot tub & Spa': 'Hot tub installation, repair, maintenance, water care, winterization',
      'HVAC': 'Heating, cooling, maintenance, repairs, installations',
      'Electrician': 'Electrical repairs, installations, inspections, emergency service',
      'Plumber': 'Plumbing repairs, installations, drain cleaning, water heater service',
      'General Contractor': 'Home renovations, construction, project management',
      'Landscaping': 'Lawn care, tree services, garden design, irrigation'
    };
    
    return serviceMap[businessType] || 'General services and support';
  }

  /**
   * Get default urgent keywords for business type
   * @param {string} businessType - Business type
   * @returns {Array} Urgent keywords
   */
  getDefaultUrgentKeywords(businessType) {
    const keywordMap = {
      'Hot tub & Spa': ['broken', 'leaking', 'not heating', 'urgent', 'emergency', 'asap'],
      'HVAC': ['no heat', 'no cooling', 'broken', 'urgent', 'emergency', 'asap'],
      'Electrician': ['no power', 'sparking', 'electrical fire', 'urgent', 'emergency', 'asap'],
      'Plumber': ['flooding', 'burst pipe', 'no water', 'urgent', 'emergency', 'asap']
    };
    
    return keywordMap[businessType] || ['urgent', 'emergency', 'asap', 'broken'];
  }

  /**
   * Get business-specific categories
   * @param {string} businessType - Business type
   * @returns {Array} Category definitions
   */
  getBusinessCategories(businessType) {
    const baseCategories = [
      { name: 'Sales', description: 'New inquiries, quotes, product questions' },
      { name: 'Support', description: 'Existing customer issues, technical problems, warranty claims' },
      { name: 'Billing', description: 'Invoices, payments, account questions' },
      { name: 'Recruitment', description: 'Job applications, resumes' },
      { name: 'Spam', description: 'Unsolicited marketing or irrelevant messages' }
    ];

    // Add business-specific categories
    const specificCategories = {
      'Hot tub & Spa': [
        { name: 'Water Chemistry', description: 'Water testing, chemical balance, maintenance questions' },
        { name: 'Equipment Service', description: 'Pump repairs, heater issues, equipment maintenance' }
      ],
      'HVAC': [
        { name: 'Emergency Service', description: 'No heat/cooling, system failures, urgent repairs' },
        { name: 'Maintenance', description: 'Scheduled maintenance, tune-ups, filter changes' }
      ],
      'Electrician': [
        { name: 'Emergency Electrical', description: 'Power outages, electrical hazards, urgent repairs' },
        { name: 'Installation', description: 'New electrical work, upgrades, installations' }
      ]
    };

    return [...baseCategories, ...(specificCategories[businessType] || [])];
  }

  /**
   * Get tone instructions
   * @param {string} tone - Tone preference
   * @returns {string} Tone instructions
   */
  getToneInstructions(tone) {
    const toneMap = {
      'professional': '- Use formal language and proper business etiquette',
      'friendly': '- Be warm and approachable while maintaining professionalism',
      'casual': '- Use conversational language but remain respectful',
      'technical': '- Focus on accuracy and technical detail',
      'empathetic': '- Show understanding and care for customer concerns'
    };
    
    return toneMap[tone] || toneMap['professional'];
  }

  /**
   * Build service catalog text
   * @param {Array} services - Service array
   * @returns {string} Service catalog text
   */
  buildServiceCatalog(services) {
    if (!services || services.length === 0) {
      return 'General services and support available';
    }

    return services.map(service => {
      const name = service.name || service;
      const description = service.description || 'Professional service';
      const price = service.price ? ` (Starting at $${service.price})` : '';
      return `- ${name}: ${description}${price}`;
    }).join('\n');
  }

  /**
   * Get classifier template
   * @returns {string} Classifier template
   */
  getClassifierTemplate() {
    return `You are an email classifier for {{BUSINESS_NAME}}. Your primary goal is to categorize incoming emails accurately.

BUSINESS CONTEXT:
- Business Name: {{BUSINESS_NAME}}
- Business Type: {{BUSINESS_TYPE}}
- Primary Services: {{SERVICES}}

CATEGORIES:
{{CATEGORIES}}

ESCALATION RULES:
{{ESCALATION_RULES}}

OUTPUT FORMAT:
{{OUTPUT_FORMAT}}`;
  }

  /**
   * Get responder template
   * @returns {string} Responder template
   */
  getResponderTemplate() {
    return `You are a helpful AI assistant for {{BUSINESS_NAME}}. Your goal is to draft clear, professional, and helpful email replies.

BUSINESS CONTEXT:
- Business Name: {{BUSINESS_NAME}}
- Business Type: {{BUSINESS_TYPE}}
- Tone: {{TONE}}

SERVICE CATALOG:
{{SERVICE_CATALOG}}

TEAM STRUCTURE:
{{TEAM_STRUCTURE}}

RESPONSE GUIDELINES:
{{RESPONSE_GUIDELINES}}`;
  }

  /**
   * Get escalator template
   * @returns {string} Escalator template
   */
  getEscalatorTemplate() {
    return `You are an escalation assistant for {{BUSINESS_NAME}}. Your role is to determine when and how to escalate emails to the appropriate team members.

MANAGEMENT TEAM:
{{MANAGEMENT_TEAM}}

ESCALATION CRITERIA:
{{ESCALATION_CRITERIA}}

ESCALATION FORMAT:
{{ESCALATION_FORMAT}}`;
  }
}

export const promptComposer = new PromptComposer();
