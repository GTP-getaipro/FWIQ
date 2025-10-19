import { supabase } from '@/lib/customSupabaseClient';

/**
 * Unified Profile Manager - Standardizes profile structure between single and multiple business modes
 * Provides consistent validation and data handling across all business scenarios
 */
export class UnifiedProfileManager {
  constructor(userId) {
    this.userId = userId;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Standardized profile structure schema
   */
  static get PROFILE_SCHEMA() {
    return {
      // Core business information
      business: {
        name: { required: true, type: 'string', maxLength: 100 },
        legalEntityName: { required: false, type: 'string', maxLength: 100 },
        taxNumber: { required: false, type: 'string', maxLength: 50 },
        address: { required: true, type: 'string', maxLength: 500 },
        serviceArea: { required: true, type: 'string', maxLength: 200 },
        timezone: { required: true, type: 'string', pattern: /^[A-Za-z_]+\/[A-Za-z_]+$/ },
        currency: { required: true, type: 'string', enum: ['USD', 'CAD', 'EUR', 'GBP', 'AUD'] },
        emailDomain: { required: true, type: 'string', pattern: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ },
        website: { required: false, type: 'string', pattern: /^https?:\/\/.+/ },
        phone: { required: false, type: 'string', pattern: /^[\+]?[1-9][\d]{0,15}$/ },
        
        // Business types (supports both single and multiple)
        types: { 
          required: true, 
          type: 'array', 
          minItems: 1, 
          maxItems: 10,
          items: { 
            type: 'string', 
            enum: [
              'Electrician', 'Flooring', 'General Construction', 'HVAC', 
              'Insulation & Foam Spray', 'Landscaping', 'Painting', 'Plumber',
              'Pools & Spas', 'Roofing', 'Auto Repair', 'Appliance Repair'
            ]
          }
        },
        primaryType: { required: true, type: 'string' },
        
        // Business hours
        businessHours: {
          mon_fri: { required: true, type: 'string', pattern: /^\d{2}:\d{2}-\d{2}:\d{2}$/ },
          sat: { required: false, type: 'string', pattern: /^\d{2}:\d{2}-\d{2}:\d{2}$/ },
          sun: { required: false, type: 'string', pattern: /^(Closed|\d{2}:\d{2}-\d{2}:\d{2})$/ }
        }
      },

      // Contact information
      contact: {
        primaryContactName: { required: true, type: 'string', maxLength: 100 },
        primaryContactRole: { required: true, type: 'string', maxLength: 100 },
        primaryContactEmail: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        afterHoursPhone: { required: false, type: 'string', pattern: /^[\+]?[1-9][\d]{0,15}$/ },
        responseSLA: { required: true, type: 'string', enum: ['1h', '4h', '24h', '48h', '72h'] }
      },

      // Team structure
      team: {
        managers: {
          required: true,
          type: 'array',
          minItems: 1,
          maxItems: 10,
          items: {
            name: { required: true, type: 'string', maxLength: 100 },
            email: { required: true, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
            role: { required: false, type: 'string', maxLength: 100 },
            phone: { required: false, type: 'string', pattern: /^[\+]?[1-9][\d]{0,15}$/ }
          }
        },
        suppliers: {
          required: false,
          type: 'array',
          maxItems: 20,
          items: {
            name: { required: true, type: 'string', maxLength: 100 },
            email: { required: false, type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
            domains: { required: false, type: 'array', items: { type: 'string' } },
            category: { required: false, type: 'string', maxLength: 50 }
          }
        }
      },

      // Services offered
      services: {
        required: false,
        type: 'array',
        maxItems: 50,
        items: {
          name: { required: true, type: 'string', maxLength: 100 },
          description: { required: false, type: 'string', maxLength: 500 },
          pricingType: { required: false, type: 'string', enum: ['hourly', 'fixed', 'per_sqft', 'per_unit'] },
          price: { required: false, type: 'number', min: 0 },
          businessType: { required: false, type: 'string' }
        }
      },

      // Business rules and AI configuration
      rules: {
        defaultEscalationManager: { required: false, type: 'string', maxLength: 100 },
        escalationRules: { required: false, type: 'string', maxLength: 1000 },
        defaultReplyTone: { required: true, type: 'string', enum: ['Professional', 'Friendly', 'Casual', 'Formal'] },
        language: { required: true, type: 'string', enum: ['en', 'es', 'fr', 'de'] },
        allowPricing: { required: true, type: 'boolean' },
        includeSignature: { required: true, type: 'boolean' },
        signatureText: { required: false, type: 'string', maxLength: 500 },
        crmProviderName: { required: false, type: 'string', maxLength: 100 },
        crmAlertEmails: { required: false, type: 'string', maxLength: 500 }
      },

      // Email labels and integrations
      emailLabels: {
        required: false,
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            color: { type: 'object' },
            sub: { type: 'array' }
          }
        }
      },

      // Integration credentials
      integrations: {
        required: false,
        type: 'object',
        properties: {
          gmail: { type: 'object' },
          postgres: { type: 'object' },
          openai: { type: 'object' }
        }
      }
    };
  }

  /**
   * Validate profile data against the unified schema
   * @param {object} profileData - The profile data to validate
   * @returns {object} - Validation result with errors and warnings
   */
  validateProfile(profileData) {
    const errors = [];
    const warnings = [];
    const validatedData = {};

    try {
      // Validate business information
      const businessValidation = this.validateSection(profileData.business, this.constructor.PROFILE_SCHEMA.business, 'business');
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);
      validatedData.business = businessValidation.data;

      // Validate contact information
      const contactValidation = this.validateSection(profileData.contact, this.constructor.PROFILE_SCHEMA.contact, 'contact');
      errors.push(...contactValidation.errors);
      warnings.push(...contactValidation.warnings);
      validatedData.contact = contactValidation.data;

      // Validate team structure
      const teamValidation = this.validateSection(profileData.team, this.constructor.PROFILE_SCHEMA.team, 'team');
      errors.push(...teamValidation.errors);
      warnings.push(...teamValidation.warnings);
      validatedData.team = teamValidation.data;

      // Validate services
      if (profileData.services) {
        const servicesValidation = this.validateSection(profileData.services, this.constructor.PROFILE_SCHEMA.services, 'services');
        errors.push(...servicesValidation.errors);
        warnings.push(...servicesValidation.warnings);
        validatedData.services = servicesValidation.data;
      }

      // Validate rules
      const rulesValidation = this.validateSection(profileData.rules, this.constructor.PROFILE_SCHEMA.rules, 'rules');
      errors.push(...rulesValidation.errors);
      warnings.push(...rulesValidation.warnings);
      validatedData.rules = rulesValidation.data;

      // Validate email labels
      if (profileData.emailLabels) {
        const labelsValidation = this.validateSection(profileData.emailLabels, this.constructor.PROFILE_SCHEMA.emailLabels, 'emailLabels');
        errors.push(...labelsValidation.errors);
        warnings.push(...labelsValidation.warnings);
        validatedData.emailLabels = labelsValidation.data;
      }

      // Validate integrations
      if (profileData.integrations) {
        const integrationsValidation = this.validateSection(profileData.integrations, this.constructor.PROFILE_SCHEMA.integrations, 'integrations');
        errors.push(...integrationsValidation.errors);
        warnings.push(...integrationsValidation.warnings);
        validatedData.integrations = integrationsValidation.data;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        data: validatedData,
        score: this.calculateValidationScore(errors, warnings)
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        data: {},
        score: 0
      };
    }
  }

  /**
   * Validate a specific section of the profile
   * @param {object} data - The data to validate
   * @param {object} schema - The schema to validate against
   * @param {string} sectionName - The name of the section being validated
   * @returns {object} - Validation result for the section
   */
  validateSection(data, schema, sectionName) {
    const errors = [];
    const warnings = [];
    const validatedData = {};

    if (!data) {
      return { errors: [`Missing ${sectionName} section`], warnings: [], data: {} };
    }

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      // Check if required field is missing
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${sectionName}.${field} is required`);
        continue;
      }

      // Skip validation if field is not required and not present
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (rules.type && !this.validateType(value, rules.type)) {
        errors.push(`${sectionName}.${field} must be of type ${rules.type}`);
        continue;
      }

      // Additional validations
      const fieldValidation = this.validateField(value, rules, `${sectionName}.${field}`);
      errors.push(...fieldValidation.errors);
      warnings.push(...fieldValidation.warnings);
      
      if (fieldValidation.errors.length === 0) {
        validatedData[field] = value;
      }
    }

    return { errors, warnings, data: validatedData };
  }

  /**
   * Validate field value against specific rules
   * @param {any} value - The value to validate
   * @param {object} rules - The validation rules
   * @param {string} fieldPath - The field path for error messages
   * @returns {object} - Validation result for the field
   */
  validateField(value, rules, fieldPath) {
    const errors = [];
    const warnings = [];

    // String length validation
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${fieldPath} exceeds maximum length of ${rules.maxLength}`);
      }
      if (rules.minLength && value.length < rules.minLength) {
        warnings.push(`${fieldPath} is shorter than recommended minimum of ${rules.minLength}`);
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        errors.push(`${fieldPath} does not match required pattern`);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${fieldPath} must be one of: ${rules.enum.join(', ')}`);
    }

    // Array validation
    if (rules.type === 'array' && Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        errors.push(`${fieldPath} must have at least ${rules.minItems} items`);
      }
      if (rules.maxItems && value.length > rules.maxItems) {
        errors.push(`${fieldPath} cannot have more than ${rules.maxItems} items`);
      }
    }

    // Number validation
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${fieldPath} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${fieldPath} must be at most ${rules.max}`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate data type
   * @param {any} value - The value to check
   * @param {string} expectedType - The expected type
   * @returns {boolean} - Whether the type matches
   */
  validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Calculate validation score (0-100)
   * @param {array} errors - List of errors
   * @param {array} warnings - List of warnings
   * @returns {number} - Validation score
   */
  calculateValidationScore(errors, warnings) {
    const totalIssues = errors.length + warnings.length;
    if (totalIssues === 0) return 100;
    
    const errorWeight = 3;
    const warningWeight = 1;
    const totalWeight = errors.length * errorWeight + warnings.length * warningWeight;
    
    return Math.max(0, 100 - (totalWeight * 5));
  }

  /**
   * Normalize profile data to unified structure
   * @param {object} rawData - Raw profile data from various sources
   * @returns {object} - Normalized profile data
   */
  normalizeProfile(rawData) {
    // Extract client_config data if available
    const clientConfig = rawData.client_config || {};
    
    // Debug: Log the client_config structure
    console.log('🔍 DEBUG: UnifiedProfileManager - client_config structure:', {
      hasClientConfig: !!rawData.client_config,
      clientConfigKeys: Object.keys(clientConfig),
      businessKeys: clientConfig.business ? Object.keys(clientConfig.business) : [],
      contactKeys: clientConfig.contact ? Object.keys(clientConfig.contact) : [],
      businessName: clientConfig.business?.name,
      businessEmailDomain: clientConfig.business?.emailDomain,
      contactPhone: clientConfig.contact?.phone,
      contactWebsite: clientConfig.contact?.website
    });
    
    const normalized = {
      business: {
        name: rawData.businessName || rawData.business?.name || clientConfig.business?.name || clientConfig.business_name || '',
        legalEntityName: rawData.legalEntityName || rawData.business?.legalEntityName || clientConfig.business?.legalEntity || clientConfig.legalEntityName || '',
        taxNumber: rawData.taxNumber || rawData.business?.taxNumber || clientConfig.business?.taxId || clientConfig.taxNumber || '',
        address: rawData.address || rawData.business?.address || clientConfig.business?.address || clientConfig.address || '',
        serviceArea: rawData.serviceArea || rawData.business?.serviceArea || clientConfig.business?.serviceArea || clientConfig.service_area || '',
        timezone: rawData.timezone || rawData.business?.timezone || clientConfig.business?.timezone || clientConfig.timezone || '',
        currency: rawData.currency || rawData.business?.currency || clientConfig.business?.currency || clientConfig.currency || 'USD',
        emailDomain: rawData.emailDomain || rawData.business?.emailDomain || clientConfig.business?.emailDomain || clientConfig.email_domain || '',
        website: rawData.website || rawData.business?.website || clientConfig.contact?.website || clientConfig.website || '',
        phone: rawData.afterHoursPhone || rawData.business?.phone || clientConfig.contact?.phone || clientConfig.phone || '',
        
        // Handle both single and multiple business types
        types: this.normalizeBusinessTypes(rawData),
        primaryType: rawData.business_type || rawData.businessType || rawData.business?.primaryType || rawData.business?.type || clientConfig.business?.category || clientConfig.business_type || '',
        
        businessHours: rawData.businessHours || rawData.business?.businessHours || clientConfig.rules?.businessHours || clientConfig.business_hours || {
          mon_fri: '09:00-18:00',
          sat: '10:00-16:00',
          sun: 'Closed'
        }
      },
      
      contact: {
        primaryContactName: rawData.primaryContactName || rawData.contact?.primaryContactName || clientConfig.contact?.primary?.name || clientConfig.primaryContactName || '',
        primaryContactRole: rawData.primaryContactRole || rawData.contact?.primaryContactRole || clientConfig.contact?.primary?.role || clientConfig.primaryContactRole || '',
        primaryContactEmail: rawData.primaryContactEmail || rawData.contact?.primaryContactEmail || clientConfig.contact?.primary?.email || clientConfig.primaryContactEmail || '',
        afterHoursPhone: rawData.afterHoursPhone || rawData.contact?.afterHoursPhone || clientConfig.contact?.phone || clientConfig.afterHoursPhone || '',
        responseSLA: rawData.responseSLA || rawData.contact?.responseSLA || clientConfig.rules?.sla || clientConfig.responseSLA || '24h',
        phone: rawData.phone || rawData.contact?.phone || clientConfig.contact?.phone || clientConfig.phone || '',
        email: rawData.email || rawData.contact?.email || clientConfig.contact?.supportEmail || clientConfig.email || '',
        website: rawData.website || rawData.contact?.website || clientConfig.contact?.website || clientConfig.website || ''
      },
      
      team: {
        managers: rawData.managers || rawData.team?.managers || [],
        suppliers: rawData.suppliers || rawData.team?.suppliers || []
      },
      
      services: rawData.services || [],
      
      rules: {
        defaultEscalationManager: rawData.defaultEscalationManager || rawData.rules?.defaultEscalationManager || '',
        escalationRules: rawData.escalationRules || rawData.rules?.escalationRules || '',
        defaultReplyTone: rawData.defaultReplyTone || rawData.rules?.defaultReplyTone || 'Friendly',
        language: rawData.language || rawData.rules?.language || 'en',
        allowPricing: rawData.allowPricing || rawData.rules?.allowPricing || false,
        includeSignature: rawData.includeSignature || rawData.rules?.includeSignature || false,
        signatureText: rawData.signatureText || rawData.rules?.signatureText || '',
        crmProviderName: rawData.crmProviderName || rawData.rules?.crmProviderName || '',
        crmAlertEmails: rawData.crmAlertEmails || rawData.rules?.crmAlertEmails || ''
      },
      
      emailLabels: rawData.emailLabels || rawData.email_labels || {},
      integrations: rawData.integrations || {}
    };

    // Extract CRM provider information from client_config
    if (clientConfig.integrations?.crm) {
      normalized.integrations.crm = {
        provider: clientConfig.integrations.crm.provider || '',
        alertEmails: clientConfig.integrations.crm.alertEmails || []
      };
    }

    // Extract phone provider information from client_config
    if (clientConfig.integrations?.phone) {
      normalized.integrations.phone = {
        provider: clientConfig.integrations.phone.provider || '',
        emails: clientConfig.integrations.phone.emails || []
      };
    }

    // Debug: Log the final normalized result
    console.log('🔍 DEBUG: UnifiedProfileManager - final normalized result:', {
      businessName: normalized.business.name,
      businessEmailDomain: normalized.business.emailDomain,
      businessPhone: normalized.business.phone,
      businessWebsite: normalized.business.website,
      contactPhone: normalized.contact.phone,
      contactWebsite: normalized.contact.website,
      managersCount: normalized.team.managers.length,
      suppliersCount: normalized.team.suppliers.length,
      crmProvider: normalized.integrations.crm?.provider,
      crmAlertEmails: normalized.integrations.crm?.alertEmails?.length || 0,
      phoneProvider: normalized.integrations.phone?.provider,
      phoneProviderEmails: normalized.integrations.phone?.emails?.length || 0
    });

    return normalized;
  }

  /**
   * Normalize business types from various formats
   * @param {object} rawData - Raw data containing business type information
   * @returns {array} - Normalized array of business types
   */
  normalizeBusinessTypes(rawData) {
    // Handle multiple business types array (database field: business_types)
    if (rawData.business_types && Array.isArray(rawData.business_types)) {
      return rawData.business_types;
    }
    
    // Handle multiple business types array (camelCase)
    if (rawData.businessTypes && Array.isArray(rawData.businessTypes)) {
      return rawData.businessTypes;
    }
    
    // Handle single business type (database field: business_type)
    if (rawData.business_type) {
      return [rawData.business_type];
    }
    
    // Handle single business type (camelCase)
    if (rawData.businessType) {
      return [rawData.businessType];
    }
    
    // Handle business.types
    if (rawData.business?.types && Array.isArray(rawData.business.types)) {
      return rawData.business.types;
    }
    
    // Handle business.type
    if (rawData.business?.type) {
      return [rawData.business.type];
    }
    
    return [];
  }

  /**
   * Get profile with caching
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<object>} - Profile data
   */
  async getProfile(forceRefresh = false) {
    const cacheKey = `profile_${this.userId}`;
    
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      const normalizedProfile = this.normalizeProfile(profile);
      const validation = this.validateProfile(normalizedProfile);
      
      const result = {
        ...normalizedProfile,
        validation,
        lastUpdated: profile.updated_at,
        version: profile.version || 1
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  /**
   * Save profile with validation
   * @param {object} profileData - Profile data to save
   * @returns {Promise<object>} - Save result
   */
  async saveProfile(profileData) {
    try {
      const normalizedData = this.normalizeProfile(profileData);
      const validation = this.validateProfile(normalizedData);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
          score: validation.score
        };
      }

      // Prepare data for database
      const dbData = {
        business_type: normalizedData.business.primaryType,
        business_types: normalizedData.business.types,
        client_config: {
          business_name: normalizedData.business.name,
          business_type: normalizedData.business.primaryType,
          business_types: normalizedData.business.types,
          email_domain: normalizedData.business.emailDomain,
          timezone: normalizedData.business.timezone,
          currency: normalizedData.business.currency,
          address: normalizedData.business.address,
          service_area: normalizedData.business.serviceArea,
          website: normalizedData.business.website,
          phone: normalizedData.business.phone,
          business_hours: normalizedData.business.businessHours
        },
        managers: normalizedData.team.managers,
        suppliers: normalizedData.team.suppliers,
        email_labels: normalizedData.emailLabels,
        updated_at: new Date().toISOString(),
        version: (profileData.version || 1) + 1
      };

      const { error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', this.userId);

      if (error) {
        throw new Error(`Failed to save profile: ${error.message}`);
      }

      // Clear cache
      this.cache.delete(`profile_${this.userId}`);

      return {
        success: true,
        validation,
        version: dbData.version
      };

    } catch (error) {
      console.error('Error saving profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear profile cache
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Convenience function to get unified profile manager instance
 * @param {string} userId - The user ID
 * @returns {UnifiedProfileManager} - Manager instance
 */
export const getUnifiedProfileManager = (userId) => {
  return new UnifiedProfileManager(userId);
};

/**
 * React hook for unified profile management
 * @param {string} userId - The user ID
 * @returns {object} - Profile manager methods
 */
export const useUnifiedProfile = (userId) => {
  const manager = new UnifiedProfileManager(userId);
  
  return {
    getProfile: manager.getProfile.bind(manager),
    saveProfile: manager.saveProfile.bind(manager),
    validateProfile: manager.validateProfile.bind(manager),
    normalizeProfile: manager.normalizeProfile.bind(manager),
    clearCache: manager.clearCache.bind(manager)
  };
};
