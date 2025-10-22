// Personalized prompt generation utilities
export class PersonalizedPrompts {
  constructor() {
    this.promptTemplates = {
      formal: {
        system: "You are a formal, professional business representative.",
        greeting: "Dear [NAME],",
        closing: "Sincerely,\n[BUSINESS_NAME]",
        tone: "formal and respectful"
      },
      casual: {
        system: "You are a friendly, approachable business owner.",
        greeting: "Hi [NAME],",
        closing: "Thanks!\n[BUSINESS_NAME]",
        tone: "casual and friendly"
      },
      professional: {
        system: "You are a professional service provider.",
        greeting: "Hello [NAME],",
        closing: "Best regards,\n[BUSINESS_NAME]",
        tone: "professional and courteous"
      }
    };

    this.industryContexts = {
      'HVAC': {
        expertise: 'heating, ventilation, and air conditioning systems',
        commonTerms: ['system', 'maintenance', 'repair', 'installation', 'efficiency'],
        serviceApproach: 'technical expertise with customer education'
      },
      'Plumbing': {
        expertise: 'plumbing systems and water-related services',
        commonTerms: ['pipes', 'leak', 'repair', 'installation', 'maintenance'],
        serviceApproach: 'problem-solving with preventive advice'
      },
      'Electrical': {
        expertise: 'electrical systems and installations',
        commonTerms: ['wiring', 'circuit', 'installation', 'safety', 'upgrade'],
        serviceApproach: 'safety-focused with technical precision'
      },
      'Auto Repair': {
        expertise: 'automotive repair and maintenance',
        commonTerms: ['vehicle', 'repair', 'maintenance', 'diagnostic', 'service'],
        serviceApproach: 'diagnostic expertise with transparent communication'
      },
      'Appliance Repair': {
        expertise: 'home appliance repair and maintenance',
        commonTerms: ['appliance', 'repair', 'parts', 'warranty', 'service'],
        serviceApproach: 'efficient repair with cost-effective solutions'
      }
    };
  }

  generateSystemPrompt(styleProfile, businessContext) {
    const profile = styleProfile.style_profile || {};
    const toneAnalysis = { 
      tone: profile.tone, 
      formality: profile.formality, 
      personality: profile.personality 
    } || {};
    const businessType = businessContext.businessType || 'General';
    const industryContext = this.industryContexts[businessType] || this.industryContexts['General'];

    return `You are responding as ${businessContext.businessName || 'the business owner'}, a ${businessType.toLowerCase()} professional.

PERSONALITY & STYLE:
- Communication tone: ${toneAnalysis.tone || 'professional'}
- Formality level: ${toneAnalysis.formality || 'balanced'}
- Key traits: ${Array.isArray(toneAnalysis.personality) ? toneAnalysis.personality.join(', ') : 'helpful, reliable'}

BUSINESS EXPERTISE:
- Specialization: ${industryContext?.expertise || 'professional services'}
- Service approach: ${industryContext?.serviceApproach || 'customer-focused solutions'}

COMMUNICATION PATTERNS:
- Preferred greeting: "${profile.greetingPattern || 'Hello'}"
- Preferred closing: "${profile.closingPattern || 'Best regards'}"
- Response style: ${profile.averageEmailLength > 400 ? 'detailed and thorough' : 'concise and direct'}

GUIDELINES:
1. Match the established tone and personality exactly
2. Use industry-appropriate terminology naturally
3. Maintain the preferred greeting and closing style
4. Be authentic - sound like a real person, not a template
5. Address the customer's specific needs and concerns
6. Offer helpful next steps when appropriate

Respond as this business owner would personally respond to their customer.`;
  }

  generateResponsePrompt(incomingEmail, responseContext) {
    const context = responseContext || {};
    const urgency = context.urgent ? 'URGENT: ' : '';
    const category = context.category || 'general';

    let categoryGuidance = '';
    switch (category) {
      case 'complaint':
        categoryGuidance = 'This is a customer complaint. Show empathy, acknowledge the issue, and provide a clear resolution path.';
        break;
      case 'inquiry':
        categoryGuidance = 'This is a service inquiry. Provide helpful information and guide them toward next steps.';
        break;
      case 'appointment':
        categoryGuidance = 'This is about scheduling. Be accommodating and provide clear availability or next steps.';
        break;
      case 'followup':
        categoryGuidance = 'This is a follow-up. Acknowledge previous interaction and provide status or next steps.';
        break;
      case 'emergency':
        categoryGuidance = 'This is an emergency situation. Respond with urgency while maintaining professionalism.';
        break;
      default:
        categoryGuidance = 'Respond professionally and helpfully to address their needs.';
    }

    return `${urgency}Customer Email:
From: ${incomingEmail.from || 'Customer'}
Subject: ${incomingEmail.subject || 'No subject'}

${incomingEmail.body || incomingEmail.content || 'No content provided'}

RESPONSE CONTEXT: ${categoryGuidance}

Please respond in your authentic communication style, addressing their specific needs and maintaining your established tone and approach.`;
  }

  createPromptVariations(basePrompt, variationType = 'tone') {
    const variations = [];

    switch (variationType) {
      case 'tone':
        variations.push({
          type: 'formal',
          prompt: basePrompt + '\n\nUse a more formal and professional tone in your response.'
        });
        variations.push({
          type: 'friendly',
          prompt: basePrompt + '\n\nUse a warm and friendly tone while maintaining professionalism.'
        });
        variations.push({
          type: 'direct',
          prompt: basePrompt + '\n\nBe direct and concise while remaining courteous.'
        });
        break;

      case 'length':
        variations.push({
          type: 'brief',
          prompt: basePrompt + '\n\nKeep your response brief and to the point.'
        });
        variations.push({
          type: 'detailed',
          prompt: basePrompt + '\n\nProvide a detailed and comprehensive response.'
        });
        variations.push({
          type: 'balanced',
          prompt: basePrompt + '\n\nProvide a balanced response with appropriate detail.'
        });
        break;

      case 'approach':
        variations.push({
          type: 'solution-focused',
          prompt: basePrompt + '\n\nFocus on providing clear solutions and next steps.'
        });
        variations.push({
          type: 'relationship-building',
          prompt: basePrompt + '\n\nEmphasize relationship building and customer care.'
        });
        variations.push({
          type: 'educational',
          prompt: basePrompt + '\n\nInclude helpful educational information relevant to their situation.'
        });
        break;
    }

    return variations;
  }

  generateContextualPrompt(styleProfile, incomingEmail, businessContext, options = {}) {
    const {
      category = 'general',
      urgency = 'normal',
      customerHistory = null,
      businessHours = null,
      specialInstructions = null
    } = options;

    let contextualElements = [];

    // Add urgency context
    if (urgency === 'high' || urgency === 'urgent') {
      contextualElements.push('This requires immediate attention and a prompt response.');
    }

    // Add customer history context
    if (customerHistory) {
      contextualElements.push(`Customer history: ${customerHistory}`);
    }

    // Add business hours context
    if (businessHours) {
      contextualElements.push(`Current business status: ${businessHours}`);
    }

    // Add special instructions
    if (specialInstructions) {
      contextualElements.push(`Special instructions: ${specialInstructions}`);
    }

    const basePrompt = this.generateSystemPrompt(styleProfile, businessContext);
    const responsePrompt = this.generateResponsePrompt(incomingEmail, { category, urgent: urgency === 'urgent' });

    const contextualAdditions = contextualElements.length > 0 
      ? '\n\nADDITIONAL CONTEXT:\n' + contextualElements.join('\n')
      : '';

    return basePrompt + contextualAdditions + '\n\n' + responsePrompt;
  }

  // Template for different response scenarios
  getScenarioTemplate(scenario) {
    const templates = {
      appointment_confirmation: {
        structure: 'greeting + confirmation + details + next_steps + closing',
        keyElements: ['appointment time', 'location/access', 'what to expect', 'contact info']
      },
      service_completion: {
        structure: 'greeting + work_summary + follow_up + satisfaction_check + closing',
        keyElements: ['work completed', 'any issues found', 'maintenance tips', 'warranty info']
      },
      emergency_response: {
        structure: 'urgent_greeting + immediate_action + timeline + safety + closing',
        keyElements: ['acknowledgment of urgency', 'response time', 'safety instructions', 'contact info']
      },
      quote_request: {
        structure: 'greeting + acknowledgment + next_steps + timeline + closing',
        keyElements: ['received request', 'assessment process', 'quote timeline', 'contact method']
      },
      complaint_resolution: {
        structure: 'greeting + empathy + acknowledgment + action_plan + follow_up + closing',
        keyElements: ['acknowledge concern', 'take responsibility', 'resolution steps', 'prevention measures']
      }
    };

    return templates[scenario] || templates.appointment_confirmation;
  }

  // Generate industry-specific vocabulary suggestions
  getIndustryVocabulary(businessType, context = 'general') {
    const industryVocab = this.industryContexts[businessType];
    if (!industryVocab) return [];

    const contextualTerms = {
      technical: industryVocab.commonTerms,
      customer_facing: ['service', 'quality', 'satisfaction', 'reliable', 'professional'],
      problem_solving: ['solution', 'resolve', 'fix', 'repair', 'improve'],
      scheduling: ['appointment', 'available', 'schedule', 'convenient', 'flexible']
    };

    return contextualTerms[context] || industryVocab.commonTerms;
  }
}
