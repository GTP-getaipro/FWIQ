import { supabase } from '@/lib/customSupabaseClient';

/**
 * Enhanced Template Manager - Provides granular template management for multi-business scenarios
 * Supports composite templates and dynamic template composition
 */
export class EnhancedTemplateManager {
  constructor() {
    this.templateCache = new Map();
    this.compositeCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Business type hierarchy and relationships
   */
  static get BUSINESS_TYPE_HIERARCHY() {
    return {
      'Construction': {
        primary: ['General Construction', 'General Contractor'],
        secondary: ['Flooring', 'Painting', 'Roofing', 'Insulation & Foam Spray'],
        templates: ['general_construction_template.json', 'composite_construction_template.json']
      },
      'Home Services': {
        primary: ['HVAC', 'Plumber', 'Electrician'],
        secondary: ['Landscaping', 'Painting'],
        templates: ['home_services_template.json', 'composite_home_services_template.json']
      },
      'Specialized': {
        primary: ['Pools & Spas', 'Auto Repair', 'Appliance Repair'],
        secondary: [],
        templates: ['specialized_template.json']
      }
    };
  }

  /**
   * Template compatibility matrix
   */
  static get TEMPLATE_COMPATIBILITY() {
    return {
      'Electrician': ['HVAC', 'Plumber', 'General Construction'],
      'HVAC': ['Electrician', 'Plumber', 'General Construction'],
      'Plumber': ['Electrician', 'HVAC', 'General Construction'],
      'General Construction': ['Flooring', 'Painting', 'Roofing', 'Insulation & Foam Spray'],
      'Flooring': ['General Construction', 'Painting'],
      'Painting': ['General Construction', 'Flooring'],
      'Roofing': ['General Construction', 'Insulation & Foam Spray'],
      'Landscaping': ['General Construction'],
      'Pools & Spas': ['General Construction'],
      'Auto Repair': [],
      'Appliance Repair': []
    };
  }

  /**
   * Get template for business type(s) with enhanced logic
   * @param {string|array} businessTypes - Single business type or array of types
   * @param {object} options - Template selection options
   * @returns {Promise<object>} - Selected template configuration
   */
  async getTemplateForBusinessTypes(businessTypes, options = {}) {
    try {
      const types = Array.isArray(businessTypes) ? businessTypes : [businessTypes];
      const primaryType = types[0];
      
      // Check cache first
      const cacheKey = `template_${types.sort().join('_')}`;
      if (this.templateCache.has(cacheKey)) {
        const cached = this.templateCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      let templateConfig;

      if (types.length === 1) {
        // Single business type - use standard template
        templateConfig = await this.getSingleBusinessTemplate(primaryType, options);
      } else {
        // Multiple business types - use composite template
        templateConfig = await this.getCompositeTemplate(types, options);
      }

      // Cache the result
      this.templateCache.set(cacheKey, {
        data: templateConfig,
        timestamp: Date.now()
      });

      return templateConfig;

    } catch (error) {
      console.error('Error getting template for business types:', error);
      return this.getFallbackTemplate(businessTypes);
    }
  }

  /**
   * Get template for single business type
   * @param {string} businessType - The business type
   * @param {object} options - Options for template selection
   * @returns {Promise<object>} - Template configuration
   */
  async getSingleBusinessTemplate(businessType, options = {}) {
    const templateMap = {
      'Electrician': 'electrician_template.json',
      'Flooring': 'flooring_template.json',
      'General Construction': 'construction_template.json',
      'General Contractor': 'construction_template.json',
      'HVAC': 'hvac_template.json',
      'Insulation & Foam Spray': 'hvac_template.json',
      'Landscaping': 'landscaping_template.json',
      'Painting': 'painting_template.json',
      'Painting Contractor': 'painting_template.json',
      'Plumber': 'plumber_template.json',
      'Pools': 'pools_spas_generic_template.json',
      'Pools & Spas': 'pools_spas_generic_template.json',
      'Hot tub & Spa': 'hot_tub_base_template.json',
      'Sauna & Icebath': 'pools_spas_generic_template.json',
      'Roofing': 'roofing_template.json',
      'Roofing Contractor': 'roofing_template.json',
      'Auto Repair': 'pools_spas_generic_template.json',
      'Appliance Repair': 'pools_spas_generic_template.json'
    };

    const templateFile = templateMap[businessType] || templateMap['default'] || 'pools_spas_generic_template.json';
    
    return {
      type: 'single',
      businessType,
      templateFile,
      template: await this.loadTemplate(templateFile),
      metadata: {
        source: 'single_business',
        compatibility: this.constructor.TEMPLATE_COMPATIBILITY[businessType] || [],
        hierarchy: this.getBusinessTypeHierarchy(businessType)
      }
    };
  }

  /**
   * Get composite template for multiple business types
   * @param {array} businessTypes - Array of business types
   * @param {object} options - Options for template composition
   * @returns {Promise<object>} - Composite template configuration
   */
  async getCompositeTemplate(businessTypes, options = {}) {
    const primaryType = businessTypes[0];
    const secondaryTypes = businessTypes.slice(1);
    
    // Check if we have a pre-built composite template
    const compositeKey = businessTypes.sort().join('_');
    if (this.compositeCache.has(compositeKey)) {
      const cached = this.compositeCache.get(compositeKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // Determine the best base template
    const baseTemplate = await this.selectBaseTemplateForComposite(businessTypes);
    
    // Load the base template
    const baseTemplateData = await this.loadTemplate(baseTemplate);
    
    // Create composite template by merging business-specific configurations
    const compositeTemplate = await this.createCompositeTemplate(
      baseTemplateData, 
      businessTypes, 
      options
    );

    const result = {
      type: 'composite',
      businessTypes,
      primaryType,
      secondaryTypes,
      baseTemplate,
      template: compositeTemplate,
      metadata: {
        source: 'composite_business',
        compatibility: this.getCompositeCompatibility(businessTypes),
        hierarchy: businessTypes.map(type => this.getBusinessTypeHierarchy(type)),
        compositionStrategy: this.getCompositionStrategy(businessTypes)
      }
    };

    // Cache the composite template
    this.compositeCache.set(compositeKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Select the best base template for composite business types
   * @param {array} businessTypes - Array of business types
   * @returns {Promise<string>} - Base template filename
   */
  async selectBaseTemplateForComposite(businessTypes) {
    // Find the most compatible base template
    const compatibilityScores = {};
    
    for (const type of businessTypes) {
      const compatible = this.constructor.TEMPLATE_COMPATIBILITY[type] || [];
      for (const compatibleType of compatible) {
        compatibilityScores[compatibleType] = (compatibilityScores[compatibleType] || 0) + 1;
      }
    }

    // Find the type with highest compatibility score
    const scoreKeys = Object.keys(compatibilityScores);
    
    // Handle empty compatibility scores - use default template
    if (scoreKeys.length === 0) {
      console.warn('⚠️ No compatible business types found, using default template');
      return 'pools_spas_generic_template.json'; // Default fallback
    }
    
    const bestBaseType = scoreKeys.reduce((a, b) => 
      compatibilityScores[a] > compatibilityScores[b] ? a : b
    );

    if (bestBaseType) {
      const templateMap = {
        'Electrician': 'electrician_template.json',
        'HVAC': 'hvac_template.json',
        'Plumber': 'plumber_template.json',
        'General Construction': 'construction_template.json',
        'Flooring': 'flooring_template.json',
        'Painting': 'painting_template.json',
        'Pools': 'pools_spas_generic_template.json',
        'Pools & Spas': 'pools_spas_generic_template.json',
        'Hot tub & Spa': 'hot_tub_base_template.json'
      };
      return templateMap[bestBaseType] || 'hot_tub_base_template.json';
    }

    // Fallback to generic template
    return 'hot_tub_base_template.json';
  }

  /**
   * Create composite template by merging configurations
   * @param {object} baseTemplate - Base template data
   * @param {array} businessTypes - Array of business types
   * @param {object} options - Composition options
   * @returns {Promise<object>} - Composite template
   */
  async createCompositeTemplate(baseTemplate, businessTypes, options = {}) {
    const composite = JSON.parse(JSON.stringify(baseTemplate)); // Deep clone
    
    // Merge business-specific configurations
    for (const businessType of businessTypes) {
      const typeConfig = await this.getBusinessTypeConfiguration(businessType);
      this.mergeBusinessTypeConfiguration(composite, typeConfig, businessType);
    }

    // Update template metadata
    composite.name = `${businessTypes.join(' + ')} Multi-Service Automation Workflow`;
    composite.metadata = {
      ...composite.metadata,
      businessTypes,
      isComposite: true,
      compositionDate: new Date().toISOString(),
      version: '2.0'
    };

    return composite;
  }

  /**
   * Get business type specific configuration
   * @param {string} businessType - The business type
   * @returns {Promise<object>} - Business type configuration
   */
  async getBusinessTypeConfiguration(businessType) {
    const configurations = {
      'Electrician': {
        urgentKeywords: ['urgent', 'emergency', 'no power', 'tripping breaker', 'sparking', 'electrical hazard'],
        aiTone: 'Professional',
        crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
        phoneProvider: 'RingCentral',
        serviceCategories: ['Emergency', 'Installation', 'Repair', 'Maintenance', 'Inspection'],
        responseTemplates: {
          emergency: 'We understand this is an electrical emergency. Our emergency team will contact you within 30 minutes.',
          quote: 'Thank you for your interest in our electrical services. We will provide a detailed quote within 24 hours.'
        }
      },
      'HVAC': {
        urgentKeywords: ['urgent', 'emergency', 'no heat', 'no cooling', 'broken ac', 'furnace not working'],
        aiTone: 'Friendly',
        crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
        phoneProvider: 'RingCentral',
        serviceCategories: ['Emergency', 'Installation', 'Repair', 'Maintenance', 'Duct Cleaning'],
        responseTemplates: {
          emergency: 'We understand your HVAC system is not working. Our emergency team will contact you within 1 hour.',
          quote: 'Thank you for your interest in our HVAC services. We will provide a detailed quote within 24 hours.'
        }
      },
      'Plumber': {
        urgentKeywords: ['urgent', 'emergency', 'water leak', 'flooding', 'no water', 'clogged drain'],
        aiTone: 'Professional',
        crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
        phoneProvider: 'RingCentral',
        serviceCategories: ['Emergency', 'Installation', 'Repair', 'Maintenance', 'Drain Cleaning'],
        responseTemplates: {
          emergency: 'We understand this is a plumbing emergency. Our emergency team will contact you within 30 minutes.',
          quote: 'Thank you for your interest in our plumbing services. We will provide a detailed quote within 24 hours.'
        }
      },
      'General Construction': {
        urgentKeywords: ['urgent', 'emergency', 'structural damage', 'safety hazard', 'immediate'],
        aiTone: 'Professional',
        crmIntegrations: ['ServiceTitan', 'HouseCallPro', 'Jobber'],
        phoneProvider: 'RingCentral',
        serviceCategories: ['Emergency', 'Renovation', 'Construction', 'Repair', 'Consultation'],
        responseTemplates: {
          emergency: 'We understand this is a construction emergency. Our emergency team will contact you within 1 hour.',
          quote: 'Thank you for your interest in our construction services. We will provide a detailed quote within 48 hours.'
        }
      }
    };

    return configurations[businessType] || configurations['General Construction'];
  }

  /**
   * Merge business type configuration into template
   * @param {object} template - Template to merge into
   * @param {object} config - Configuration to merge
   * @param {string} businessType - Business type name
   */
  mergeBusinessTypeConfiguration(template, config, businessType) {
    // Merge urgent keywords
    if (template.nodes) {
      template.nodes.forEach(node => {
        if (node.parameters && node.parameters.systemMessage) {
          // Add business-specific urgent keywords to system message
          const urgentKeywordsText = config.urgentKeywords.join(', ');
          node.parameters.systemMessage = node.parameters.systemMessage.replace(
            'Urgent keywords for this business:',
            `Urgent keywords for ${businessType}: ${urgentKeywordsText}\nUrgent keywords for this business:`
          );
        }
      });
    }

    // Merge service categories
    if (template.metadata) {
      template.metadata.serviceCategories = template.metadata.serviceCategories || [];
      template.metadata.serviceCategories.push(...config.serviceCategories);
      template.metadata.serviceCategories = [...new Set(template.metadata.serviceCategories)]; // Remove duplicates
    }

    // Merge response templates
    if (template.metadata) {
      template.metadata.responseTemplates = {
        ...template.metadata.responseTemplates,
        ...config.responseTemplates
      };
    }
  }

  /**
   * Get business type hierarchy information
   * @param {string} businessType - The business type
   * @returns {object} - Hierarchy information
   */
  getBusinessTypeHierarchy(businessType) {
    for (const [category, info] of Object.entries(this.constructor.BUSINESS_TYPE_HIERARCHY)) {
      if (info.primary.includes(businessType)) {
        return {
          category,
          level: 'primary',
          related: info.secondary
        };
      }
      if (info.secondary.includes(businessType)) {
        return {
          category,
          level: 'secondary',
          related: info.primary
        };
      }
    }
    return {
      category: 'Specialized',
      level: 'standalone',
      related: []
    };
  }

  /**
   * Get composite compatibility information
   * @param {array} businessTypes - Array of business types
   * @returns {object} - Compatibility information
   */
  getCompositeCompatibility(businessTypes) {
    const compatibility = {
      score: 0,
      conflicts: [],
      synergies: []
    };

    for (let i = 0; i < businessTypes.length; i++) {
      for (let j = i + 1; j < businessTypes.length; j++) {
        const type1 = businessTypes[i];
        const type2 = businessTypes[j];
        
        const compatibleTypes = this.constructor.TEMPLATE_COMPATIBILITY[type1] || [];
        
        if (compatibleTypes.includes(type2)) {
          compatibility.score += 10;
          compatibility.synergies.push(`${type1} + ${type2}`);
        } else {
          compatibility.conflicts.push(`${type1} + ${type2}`);
        }
      }
    }

    return compatibility;
  }

  /**
   * Get composition strategy for business types
   * @param {array} businessTypes - Array of business types
   * @returns {string} - Composition strategy
   */
  getCompositionStrategy(businessTypes) {
    const compatibility = this.getCompositeCompatibility(businessTypes);
    
    if (compatibility.score >= 20) {
      return 'unified'; // High compatibility - use unified approach
    } else if (compatibility.score >= 10) {
      return 'hybrid'; // Medium compatibility - use hybrid approach
    } else {
      return 'modular'; // Low compatibility - use modular approach
    }
  }

  /**
   * Load template from file or cache
   * @param {string} templateFile - Template filename
   * @returns {Promise<object>} - Template data
   */
  async loadTemplate(templateFile) {
    try {
      // Static import map (dynamic imports with variables don't work reliably)
      const templateImports = {
        'hot_tub_base_template.json': () => import('./n8n-templates/hot_tub_base_template.json'),
        'pools_spas_generic_template.json': () => import('./n8n-templates/pools_spas_generic_template.json'),
        'electrician_template.json': () => import('./n8n-templates/electrician_template.json'),
        'hvac_template.json': () => import('./n8n-templates/hvac_template.json'),
        'plumber_template.json': () => import('./n8n-templates/plumber_template.json'),
        'construction_template.json': () => import('./n8n-templates/construction_template.json'),
        'flooring_template.json': () => import('./n8n-templates/flooring_template.json'),
        'painting_template.json': () => import('./n8n-templates/painting_template.json'),
        'roofing_template.json': () => import('./n8n-templates/roofing_template.json'),
        'landscaping_template.json': () => import('./n8n-templates/landscaping_template.json')
      };

      const templateLoader = templateImports[templateFile];
      if (!templateLoader) {
        throw new Error(`No loader found for template: ${templateFile}`);
      }

      const template = await templateLoader();
      return template.default || template;
    } catch (error) {
      console.warn(`Could not load template ${templateFile}, using fallback:`, error.message);
      return this.getFallbackTemplate();
    }
  }

  /**
   * Get fallback template
   * @param {string|array} businessTypes - Business types for fallback
   * @returns {object} - Fallback template
   */
  getFallbackTemplate(businessTypes = 'General Construction') {
    return {
      type: 'fallback',
      businessTypes: Array.isArray(businessTypes) ? businessTypes : [businessTypes],
      template: {
        name: 'Fallback Automation Workflow',
        nodes: [
          {
            id: 'webhook-trigger',
            name: 'Webhook Trigger',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [240, 300],
            parameters: {
              path: 'fallback-webhook',
              httpMethod: 'POST'
            }
          },
          {
            id: 'email-processor',
            name: 'Email Processor',
            type: 'n8n-nodes-base.function',
            typeVersion: 1,
            position: [460, 300],
            parameters: {
              functionCode: '// Basic email processing\nreturn [{ json: { processed: true, fallback: true } }];'
            }
          }
        ],
        connections: {
          'Webhook Trigger': {
            main: [[{ node: 'Email Processor', type: 'main', index: 0 }]]
          }
        },
        settings: { executionOrder: 'v1' },
        metadata: {
          isFallback: true,
          businessTypes: Array.isArray(businessTypes) ? businessTypes : [businessTypes]
        }
      },
      metadata: {
        source: 'fallback',
        reason: 'Template loading failed'
      }
    };
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
    this.compositeCache.clear();
  }

  /**
   * Get template statistics
   * @returns {object} - Template cache statistics
   */
  getCacheStats() {
    return {
      templateCache: {
        size: this.templateCache.size,
        keys: Array.from(this.templateCache.keys())
      },
      compositeCache: {
        size: this.compositeCache.size,
        keys: Array.from(this.compositeCache.keys())
      }
    };
  }
}

/**
 * Convenience function to get enhanced template manager instance
 * @returns {EnhancedTemplateManager} - Manager instance
 */
export const getEnhancedTemplateManager = () => {
  return new EnhancedTemplateManager();
};

/**
 * React hook for enhanced template management
 * @returns {object} - Template manager methods
 */
export const useEnhancedTemplateManager = () => {
  const manager = new EnhancedTemplateManager();
  
  return {
    getTemplateForBusinessTypes: manager.getTemplateForBusinessTypes.bind(manager),
    getSingleBusinessTemplate: manager.getSingleBusinessTemplate.bind(manager),
    getCompositeTemplate: manager.getCompositeTemplate.bind(manager),
    clearCache: manager.clearCache.bind(manager),
    getCacheStats: manager.getCacheStats.bind(manager)
  };
};
