/**
 * Profile Data Validation Utility
 * 
 * This module provides validation functions for user profile data structures.
 * It ensures data consistency and prevents invalid profile updates.
 */

import { 
  ERROR_CODES, 
  createError, 
  isValidErrorCode 
} from '@/constants/errorCodes';

import {
  UserProfile,
  ClientConfig,
  BusinessInfo,
  ContactInfo,
  BusinessRules,
  Manager,
  Supplier,
  Service,
  BusinessType,
  EmailProvider,
  OnboardingStep,
  MAX_MANAGERS,
  MAX_SUPPLIERS,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LANGUAGES,
  COMMON_TIMEZONES
} from '@/types/profile';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Profile validator class
 */
export class ProfileValidator {
  /**
   * Validate complete user profile
   * @param {UserProfile} profile - Profile to validate
   * @returns {ValidationResult} Validation result
   */
  static validateProfile(profile) {
    const errors = [];
    const warnings = [];

    // Validate required fields
    if (!profile.id) {
      errors.push('Profile ID is required');
    }

    // Validate business type if provided
    if (profile.business_type && !this.isValidBusinessType(profile.business_type)) {
      errors.push(`Invalid business type: ${profile.business_type}`);
    }

    // Validate onboarding step if provided
    if (profile.onboarding_step && !this.isValidOnboardingStep(profile.onboarding_step)) {
      errors.push(`Invalid onboarding step: ${profile.onboarding_step}`);
    }

    // Validate email provider if provided
    if (profile.primary_provider && !this.isValidEmailProvider(profile.primary_provider)) {
      errors.push(`Invalid email provider: ${profile.primary_provider}`);
    }

    // Validate client config if provided
    if (profile.client_config) {
      const configValidation = this.validateClientConfig(profile.client_config);
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);
    }

    // Validate managers if provided
    if (profile.managers) {
      const managersValidation = this.validateManagers(profile.managers);
      errors.push(...managersValidation.errors);
      warnings.push(...managersValidation.warnings);
    }

    // Validate suppliers if provided
    if (profile.suppliers) {
      const suppliersValidation = this.validateSuppliers(profile.suppliers);
      errors.push(...suppliersValidation.errors);
      warnings.push(...suppliersValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate client configuration
   * @param {ClientConfig} config - Client config to validate
   * @returns {ValidationResult} Validation result
   */
  static validateClientConfig(config) {
    const errors = [];
    const warnings = [];

    // Validate required fields
    if (!config.version || typeof config.version !== 'number') {
      errors.push('Client config version must be a number');
    }

    if (!config.client_id || typeof config.client_id !== 'string') {
      errors.push('Client config client_id is required');
    }

    // Validate business info
    if (config.business) {
      const businessValidation = this.validateBusinessInfo(config.business);
      errors.push(...businessValidation.errors);
      warnings.push(...businessValidation.warnings);
    }

    // Validate contact info
    if (config.contact) {
      const contactValidation = this.validateContactInfo(config.contact);
      errors.push(...contactValidation.errors);
      warnings.push(...contactValidation.warnings);
    }

    // Validate business rules
    if (config.rules) {
      const rulesValidation = this.validateBusinessRules(config.rules);
      errors.push(...rulesValidation.errors);
      warnings.push(...rulesValidation.warnings);
    }

    // Validate services
    if (config.services) {
      const servicesValidation = this.validateServices(config.services);
      errors.push(...servicesValidation.errors);
      warnings.push(...servicesValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate business information
   * @param {BusinessInfo} business - Business info to validate
   * @returns {ValidationResult} Validation result
   */
  static validateBusinessInfo(business) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!business.name || typeof business.name !== 'string' || business.name.trim() === '') {
      errors.push('Business name is required');
    }

    // Validate email domain format
    if (business.emailDomain && !this.isValidEmailDomain(business.emailDomain)) {
      errors.push('Invalid email domain format');
    }

    // Validate website URL format
    if (business.website && !this.isValidUrl(business.website)) {
      errors.push('Invalid website URL format');
    }

    // Validate currency
    if (business.currency && !SUPPORTED_CURRENCIES.includes(business.currency)) {
      warnings.push(`Currency ${business.currency} may not be supported`);
    }

    // Validate timezone
    if (business.timezone && !COMMON_TIMEZONES.includes(business.timezone)) {
      warnings.push(`Timezone ${business.timezone} may not be supported`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate contact information
   * @param {ContactInfo} contact - Contact info to validate
   * @returns {ValidationResult} Validation result
   */
  static validateContactInfo(contact) {
    const errors = [];
    const warnings = [];

    // Validate primary contact email
    if (contact.primaryContactEmail && !this.isValidEmail(contact.primaryContactEmail)) {
      errors.push('Invalid primary contact email format');
    }

    // Validate phone number format
    if (contact.afterHoursPhone && !this.isValidPhoneNumber(contact.afterHoursPhone)) {
      warnings.push('Phone number format may be invalid');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate business rules
   * @param {BusinessRules} rules - Business rules to validate
   * @returns {ValidationResult} Validation result
   */
  static validateBusinessRules(rules) {
    const errors = [];
    const warnings = [];

    // Validate SLA format
    if (rules.sla && !this.isValidSLAFormat(rules.sla)) {
      errors.push('Invalid SLA format (expected: 24h, 48h, 4h, etc.)');
    }

    // Validate language
    if (rules.language && !SUPPORTED_LANGUAGES.includes(rules.language)) {
      warnings.push(`Language ${rules.language} may not be supported`);
    }

    // Validate business hours format
    if (rules.businessHours) {
      const hoursValidation = this.validateBusinessHours(rules.businessHours);
      errors.push(...hoursValidation.errors);
      warnings.push(...hoursValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate business hours
   * @param {BusinessHours} hours - Business hours to validate
   * @returns {ValidationResult} Validation result
   */
  static validateBusinessHours(hours) {
    const errors = [];
    const warnings = [];

    // Validate time format (HH:MM-HH:MM or 'Closed')
    const timeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$|^Closed$/;

    ['mon_fri', 'sat', 'sun'].forEach(day => {
      if (hours[day] && !timeFormat.test(hours[day])) {
        errors.push(`Invalid time format for ${day}: ${hours[day]}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate services array
   * @param {Service[]} services - Services to validate
   * @returns {ValidationResult} Validation result
   */
  static validateServices(services) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(services)) {
      errors.push('Services must be an array');
      return { isValid: false, errors, warnings };
    }

    services.forEach((service, index) => {
      if (!service.name || typeof service.name !== 'string' || service.name.trim() === '') {
        errors.push(`Service ${index + 1}: Name is required`);
      }

      if (service.pricingType && !['hourly', 'fixed', 'per_unit'].includes(service.pricingType)) {
        errors.push(`Service ${index + 1}: Invalid pricing type`);
      }

      if (service.price && !this.isValidPrice(service.price)) {
        warnings.push(`Service ${index + 1}: Price format may be invalid`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate managers array
   * @param {Manager[]} managers - Managers to validate
   * @returns {ValidationResult} Validation result
   */
  static validateManagers(managers) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(managers)) {
      errors.push('Managers must be an array');
      return { isValid: false, errors, warnings };
    }

    if (managers.length > MAX_MANAGERS) {
      errors.push(`Maximum ${MAX_MANAGERS} managers allowed`);
    }

    managers.forEach((manager, index) => {
      if (!manager.name || typeof manager.name !== 'string' || manager.name.trim() === '') {
        errors.push(`Manager ${index + 1}: Name is required`);
      }

      if (!manager.email || !this.isValidEmail(manager.email)) {
        errors.push(`Manager ${index + 1}: Valid email is required`);
      }

      if (manager.phone && !this.isValidPhoneNumber(manager.phone)) {
        warnings.push(`Manager ${index + 1}: Phone number format may be invalid`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate suppliers array
   * @param {Supplier[]} suppliers - Suppliers to validate
   * @returns {ValidationResult} Validation result
   */
  static validateSuppliers(suppliers) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(suppliers)) {
      errors.push('Suppliers must be an array');
      return { isValid: false, errors, warnings };
    }

    if (suppliers.length > MAX_SUPPLIERS) {
      errors.push(`Maximum ${MAX_SUPPLIERS} suppliers allowed`);
    }

    suppliers.forEach((supplier, index) => {
      if (!supplier.name || typeof supplier.name !== 'string' || supplier.name.trim() === '') {
        errors.push(`Supplier ${index + 1}: Name is required`);
      }

      if (supplier.email && !this.isValidEmail(supplier.email)) {
        errors.push(`Supplier ${index + 1}: Invalid email format`);
      }

      if (supplier.domains && Array.isArray(supplier.domains)) {
        supplier.domains.forEach((domain, domainIndex) => {
          if (!this.isValidEmailDomain(domain)) {
            errors.push(`Supplier ${index + 1}, Domain ${domainIndex + 1}: Invalid domain format`);
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // UTILITY VALIDATION METHODS
  // ============================================================================

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate email domain format
   * @param {string} domain - Domain to validate
   * @returns {boolean} Is valid domain
   */
  static isValidEmailDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Is valid URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Is valid phone number
   */
  static isValidPhoneNumber(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate SLA format
   * @param {string} sla - SLA to validate
   * @returns {boolean} Is valid SLA format
   */
  static isValidSLAFormat(sla) {
    const slaRegex = /^\d+[hHdD]$/;
    return slaRegex.test(sla);
  }

  /**
   * Validate price format
   * @param {string} price - Price to validate
   * @returns {boolean} Is valid price format
   */
  static isValidPrice(price) {
    const priceRegex = /^\$?[\d,]+(\.\d{2})?$/;
    return priceRegex.test(price);
  }

  /**
   * Validate business type
   * @param {string} type - Business type to validate
   * @returns {boolean} Is valid business type
   */
  static isValidBusinessType(type) {
    const validTypes = [
      'Electrician', 'Flooring Contractor', 'General Contractor', 'HVAC', 
      'Insulation & Foam Spray', 'Landscaping', 'Painting Contractor', 
      'Plumber', 'Pools & Spas', 'Roofing Contractor'
    ];
    return validTypes.includes(type);
  }

  /**
   * Validate onboarding step
   * @param {string} step - Onboarding step to validate
   * @returns {boolean} Is valid onboarding step
   */
  static isValidOnboardingStep(step) {
    const validSteps = [
      'email_integration', 'business_type', 'team_setup',
      'business_information', 'label_mapping', 'provision_labels', 'completed'
    ];
    return validSteps.includes(step);
  }

  /**
   * Validate email provider
   * @param {string} provider - Email provider to validate
   * @returns {boolean} Is valid email provider
   */
  static isValidEmailProvider(provider) {
    return ['gmail', 'outlook'].includes(provider);
  }

  /**
   * Sanitize profile data by removing invalid fields
   * @param {UserProfile} profile - Profile to sanitize
   * @returns {UserProfile} Sanitized profile
   */
  static sanitizeProfile(profile) {
    const sanitized = { ...profile };

    // Remove invalid business type
    if (sanitized.business_type && !this.isValidBusinessType(sanitized.business_type)) {
      delete sanitized.business_type;
    }

    // Remove invalid onboarding step
    if (sanitized.onboarding_step && !this.isValidOnboardingStep(sanitized.onboarding_step)) {
      delete sanitized.onboarding_step;
    }

    // Remove invalid email provider
    if (sanitized.primary_provider && !this.isValidEmailProvider(sanitized.primary_provider)) {
      delete sanitized.primary_provider;
    }

    // Sanitize managers
    if (sanitized.managers && Array.isArray(sanitized.managers)) {
      sanitized.managers = sanitized.managers.filter(manager => 
        manager.name && manager.email && this.isValidEmail(manager.email)
      );
    }

    // Sanitize suppliers
    if (sanitized.suppliers && Array.isArray(sanitized.suppliers)) {
      sanitized.suppliers = sanitized.suppliers.filter(supplier => 
        supplier.name && (!supplier.email || this.isValidEmail(supplier.email))
      );
    }

    return sanitized;
  }
}

/**
 * Validate profile and throw error if invalid
 * @param {UserProfile} profile - Profile to validate
 * @throws {Error} Validation error if profile is invalid
 */
export function validateProfileOrThrow(profile) {
  const validation = ProfileValidator.validateProfile(profile);
  
  if (!validation.isValid) {
    const error = createError('VALIDATION_FAILED', 'Profile validation failed', validation.errors);
    throw new Error(error.message);
  }
}

/**
 * Validate profile update request
 * @param {Partial<UserProfile>} update - Profile update to validate
 * @returns {ValidationResult} Validation result
 */
export function validateProfileUpdate(update) {
  // Only validate provided fields
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validate business type if provided
  if (update.business_type && !ProfileValidator.isValidBusinessType(update.business_type)) {
    validation.errors.push(`Invalid business type: ${update.business_type}`);
    validation.isValid = false;
  }

  // Validate onboarding step if provided
  if (update.onboarding_step && !ProfileValidator.isValidOnboardingStep(update.onboarding_step)) {
    validation.errors.push(`Invalid onboarding step: ${update.onboarding_step}`);
    validation.isValid = false;
  }

  // Validate email provider if provided
  if (update.primary_provider && !ProfileValidator.isValidEmailProvider(update.primary_provider)) {
    validation.errors.push(`Invalid email provider: ${update.primary_provider}`);
    validation.isValid = false;
  }

  // Validate client config if provided
  if (update.client_config) {
    const configValidation = ProfileValidator.validateClientConfig(update.client_config);
    validation.errors.push(...configValidation.errors);
    validation.warnings.push(...configValidation.warnings);
    if (configValidation.errors.length > 0) {
      validation.isValid = false;
    }
  }

  // Validate managers if provided
  if (update.managers) {
    const managersValidation = ProfileValidator.validateManagers(update.managers);
    validation.errors.push(...managersValidation.errors);
    validation.warnings.push(...managersValidation.warnings);
    if (managersValidation.errors.length > 0) {
      validation.isValid = false;
    }
  }

  // Validate suppliers if provided
  if (update.suppliers) {
    const suppliersValidation = ProfileValidator.validateSuppliers(update.suppliers);
    validation.errors.push(...suppliersValidation.errors);
    validation.warnings.push(...suppliersValidation.warnings);
    if (suppliersValidation.errors.length > 0) {
      validation.isValid = false;
    }
  }

  return validation;
}

export default ProfileValidator;
