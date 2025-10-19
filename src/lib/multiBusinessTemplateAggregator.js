/**
 * Universal Template Manager
 * Uses the same base template for ALL business types
 * Customization happens via dynamic prompt injection (3-Layer Schema System)
 */

export class UniversalTemplateManager {
  constructor() {
    // Single universal template for ALL business types
    this.universalTemplate = () => import('./n8n-templates/hot_tub_base_template.json');
  }

  /**
   * Get universal template for any business type(s)
   * @param {Array} businessTypes - Array of business type names
   * @param {Object} onboardingData - Complete onboarding data
   * @returns {Promise<Object>} Universal template
   */
  async getUniversalTemplate(businessTypes, onboardingData) {
    try {
      console.log('🔄 Loading universal template for business types:', businessTypes);

      // Load the universal template
      const templateModule = await this.universalTemplate();
      const template = templateModule.default || templateModule;

      // Add metadata for tracking
      const universalTemplate = {
        ...template,
        _templateMetadata: {
          businessTypes: businessTypes,
          primaryBusinessType: businessTypes[0],
          secondaryBusinessTypes: businessTypes.slice(1),
          loadedAt: new Date().toISOString(),
          templateType: 'universal'
        }
      };

      console.log('✅ Universal template loaded:', {
        businessTypes: businessTypes,
        totalNodes: universalTemplate.nodes.length,
        customizationMethod: '3-Layer Schema System (AI + Behavior + Labels)'
      });

      return universalTemplate;

    } catch (error) {
      console.error('❌ Universal template loading failed:', error);
      throw new Error(`Universal template loading failed: ${error.message}`);
    }
  }

  /**
   * Get business-specific customization data
   * This is used by the 3-Layer Schema System for dynamic injection
   * @param {Array} businessTypes - Business type names
   * @returns {Object} Business customization data
   */
  getBusinessCustomization(businessTypes) {
    return {
      businessTypes: businessTypes,
      primaryType: businessTypes[0],
      secondaryTypes: businessTypes.slice(1),
      customizationMethod: '3-Layer Schema System',
      layers: {
        layer1: 'AI_SYSTEM_MESSAGE - Business-specific keywords & rules',
        layer2: 'BEHAVIOR_REPLY_PROMPT - Voice profile + few-shot examples', 
        layer3: 'Dynamic label IDs - Business-specific routing'
      }
    };
  }

  /**
   * NOTE: This method is no longer needed with universal template approach
   * The 3-Layer Schema System handles all customization via:
   * - Layer 1: AI Schema Injector (business-specific keywords)
   * - Layer 2: Behavior Schema Injector (voice profile + few-shot examples)
   * - Layer 3: Dynamic label injection (business-specific routing)
   * 
   * All customization happens in templateService.js during injection phase
   */
  getCustomizationInfo(businessTypes) {
    return {
      message: 'Universal template customization handled by 3-Layer Schema System',
      customizationLayers: [
        'Layer 1: AI Schema Injector - Business keywords & rules',
        'Layer 2: Behavior Schema Injector - Voice profile + examples', 
        'Layer 3: Label Schema Injector - Dynamic routing'
      ],
      businessTypes: businessTypes,
      templateFile: 'hot_tub_base_template.json (universal)'
    };
  }

  /**
   * Create comprehensive AI prompt for multiple business types
   * @param {Array} businessTypes - All business types
   * @param {Object} onboardingData - Onboarding data
   * @returns {string} Comprehensive system message
   */
  createComprehensivePrompt(businessTypes, onboardingData) {
    const businessName = onboardingData.business?.info?.name || 'Business';
    const primaryType = businessTypes[0];
    const secondaryTypes = businessTypes.slice(1);

    // Get business-specific data
    const businessData = this.getBusinessData(businessTypes);
    
    return `You are an email classifier for ${businessName}, a multi-service business specializing in ${businessTypes.join(', ')}.

BUSINESS CONTEXT:
- Business Name: ${businessName}
- Primary Service: ${primaryType}
- Additional Services: ${secondaryTypes.join(', ')}
- Service Areas: ${businessData.serviceAreas.join(', ')}

COMPREHENSIVE CATEGORIES:
${this.formatCategories(businessData.categories)}

ESCALATION RULES:
- URGENT OVERRIDE: If the email contains keywords like '${businessData.urgentKeywords.join("', '")}', immediately classify it as 'Support' with urgency: 'high'
- MANAGER ESCALATION: If the email mentions specific manager names or requires management attention, add escalation: 'manager'
- SERVICE-SPECIFIC ESCALATION: Route to appropriate service specialist based on content

SERVICE-SPECIFIC ROUTING:
${this.formatServiceRouting(businessTypes)}

OUTPUT FORMAT:
Your response must be a valid JSON object with:
{
  "primary_category": "CategoryName",
  "service_type": "PrimaryService|SecondaryService",
  "urgency": "low|medium|high",
  "escalation": "none|manager|urgent|specialist",
  "confidence": 0.85,
  "reasoning": "Brief explanation of classification decision"
}`;
  }

  /**
   * Get business data for multiple business types
   * @param {Array} businessTypes - Business types
   * @returns {Object} Combined business data
   */
  getBusinessData(businessTypes) {
    const businessTypeData = {
      'Hot tub & Spa': {
        serviceAreas: ['Water Chemistry', 'Equipment Service', 'Installation', 'Maintenance'],
        categories: [
          { name: 'Water Chemistry', description: 'Water testing, chemical balance, maintenance questions' },
          { name: 'Equipment Service', description: 'Pump repairs, heater issues, equipment maintenance' },
          { name: 'Installation', description: 'New hot tub/spa installation requests' },
          { name: 'Maintenance', description: 'Regular maintenance, cleaning, winterization' }
        ],
        urgentKeywords: ['leaking', 'pump not working', 'heater error', 'no power', 'urgent', 'emergency']
      },
      'HVAC': {
        serviceAreas: ['Heating', 'Cooling', 'Maintenance', 'Installation', 'Repair'],
        categories: [
          { name: 'Emergency Service', description: 'No heat/cooling, system failures, urgent repairs' },
          { name: 'Maintenance', description: 'Scheduled maintenance, tune-ups, filter changes' },
          { name: 'Installation', description: 'New HVAC system installation' },
          { name: 'Repair', description: 'System repairs and troubleshooting' }
        ],
        urgentKeywords: ['no heat', 'no cooling', 'broken ac', 'furnace not working', 'urgent', 'emergency']
      },
      'Electrician': {
        serviceAreas: ['Emergency Service', 'Installation', 'Repair', 'Safety Inspection'],
        categories: [
          { name: 'Emergency Electrical', description: 'Power outages, electrical hazards, urgent repairs' },
          { name: 'Installation', description: 'New electrical work, upgrades, installations' },
          { name: 'Repair', description: 'Electrical repairs and troubleshooting' },
          { name: 'Safety Inspection', description: 'Code compliance, safety checks' }
        ],
        urgentKeywords: ['no power', 'sparking', 'electrical fire', 'urgent', 'emergency']
      },
      'Plumber': {
        serviceAreas: ['Emergency Service', 'Repair', 'Installation', 'Maintenance'],
        categories: [
          { name: 'Emergency Service', description: 'Water leaks, burst pipes, flooding' },
          { name: 'Repair', description: 'Fixture repairs, pipe repairs' },
          { name: 'Installation', description: 'New fixtures, water heater installation' },
          { name: 'Maintenance', description: 'Drain cleaning, preventive maintenance' }
        ],
        urgentKeywords: ['water leak', 'burst pipe', 'flooding', 'no water', 'urgent', 'emergency']
      }
    };

    // Combine data from all business types
    const combinedData = {
      serviceAreas: [],
      categories: [],
      urgentKeywords: []
    };

    businessTypes.forEach(type => {
      const data = businessTypeData[type];
      if (data) {
        combinedData.serviceAreas.push(...data.serviceAreas);
        combinedData.categories.push(...data.categories);
        combinedData.urgentKeywords.push(...data.urgentKeywords);
      }
    });

    // Remove duplicates
    combinedData.serviceAreas = [...new Set(combinedData.serviceAreas)];
    combinedData.urgentKeywords = [...new Set(combinedData.urgentKeywords)];
    
    // Remove duplicate categories by name
    const uniqueCategories = [];
    const seenNames = new Set();
    combinedData.categories.forEach(cat => {
      if (!seenNames.has(cat.name)) {
        seenNames.add(cat.name);
        uniqueCategories.push(cat);
      }
    });
    combinedData.categories = uniqueCategories;

    return combinedData;
  }

  /**
   * Format categories for AI prompt
   * @param {Array} categories - Category definitions
   * @returns {string} Formatted categories
   */
  formatCategories(categories) {
    return categories.map(cat => `- ${cat.name}: ${cat.description}`).join('\n');
  }

  /**
   * Format service routing for AI prompt
   * @param {Array} businessTypes - Business types
   * @returns {string} Formatted service routing
   */
  formatServiceRouting(businessTypes) {
    return businessTypes.map((type, index) => {
      const isPrimary = index === 0;
      return `- ${type}${isPrimary ? ' (Primary)' : ''}: Route ${type.toLowerCase()} related inquiries to ${type} specialist`;
    }).join('\n');
  }

  /**
   * Merge business rules from multiple templates
   * @param {Array} businessTypes - Business types
   * @returns {Object} Merged business rules
   */
  mergeBusinessRules(businessTypes) {
    const rules = {
      escalationRules: [],
      responseRules: [],
      pricingRules: [],
      serviceRules: []
    };

    businessTypes.forEach(type => {
      // Add type-specific rules
      rules.escalationRules.push(`${type}: Escalate urgent ${type.toLowerCase()} issues immediately`);
      rules.responseRules.push(`${type}: Use ${type.toLowerCase()}-specific terminology`);
      rules.pricingRules.push(`${type}: Provide ${type.toLowerCase()} service pricing upon request`);
      rules.serviceRules.push(`${type}: Route to ${type.toLowerCase()} specialist when needed`);
    });

    return rules;
  }

  /**
   * Merge categories from multiple templates
   * @param {Array} businessTypes - Business types
   * @returns {Array} Merged categories
   */
  mergeCategories(businessTypes) {
    const baseCategories = [
      { name: 'Sales', description: 'New inquiries, quotes, product questions' },
      { name: 'Support', description: 'Existing customer issues, technical problems, warranty claims' },
      { name: 'Billing', description: 'Invoices, payments, account questions' },
      { name: 'Recruitment', description: 'Job applications, resumes' },
      { name: 'Spam', description: 'Unsolicited marketing or irrelevant messages' }
    ];

    const businessData = this.getBusinessData(businessTypes);
    
    return [...baseCategories, ...businessData.categories];
  }

  /**
   * Merge urgent keywords from multiple templates
   * @param {Array} businessTypes - Business types
   * @returns {Array} Merged urgent keywords
   */
  mergeUrgentKeywords(businessTypes) {
    const businessData = this.getBusinessData(businessTypes);
    return businessData.urgentKeywords;
  }
}

export const universalTemplateManager = new UniversalTemplateManager();


