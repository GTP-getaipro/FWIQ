// Central validation and sanitization utility
import { 
  validateEmail, 
  validateEmailQueue, 
  isValidEmail, 
  validateEmailList 
} from './validators/emailValidator.js';

import { 
  validateBusiness, 
  validateBusinessHours, 
  validateEscalationRule, 
  validateResponseTemplate 
} from './validators/businessValidator.js';

import { 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserProfile, 
  validatePasswordReset, 
  validatePasswordUpdate, 
  validateOAuthIntegration, 
  validateNotificationSettings 
} from './validators/userValidator.js';

import { 
  sanitizeHtml, 
  sanitizeUserInput, 
  sanitizeEmailContent, 
  stripHtml, 
  sanitizeAndValidateHtml, 
  checkHtmlSafety 
} from './sanitizers/htmlSanitizer.js';

import { 
  sanitizeEmail, 
  sanitizeEmailSubject, 
  sanitizeEmailBody, 
  sanitizeEmailObject, 
  extractEmailAddresses, 
  validateEmailHeaders, 
  sanitizeTemplateVariables 
} from './sanitizers/emailSanitizer.js';

import { 
  sanitizeInput, 
  sanitizeFormData, 
  sanitizeSearchQuery, 
  sanitizeFileName, 
  sanitizeUrl, 
  sanitizePhoneNumber, 
  sanitizeJsonString, 
  sanitizePassword 
} from './sanitizers/userInputSanitizer.js';

// Export all validators
export const validators = {
  // Email validators
  validateEmail,
  validateEmailQueue,
  isValidEmail,
  validateEmailList,
  
  // Business validators
  validateBusiness,
  validateBusinessHours,
  validateEscalationRule,
  validateResponseTemplate,
  
  // User validators
  validateUserRegistration,
  validateUserLogin,
  validateUserProfile,
  validatePasswordReset,
  validatePasswordUpdate,
  validateOAuthIntegration,
  validateNotificationSettings
};

// Export all sanitizers
export const sanitizers = {
  // HTML sanitizers
  sanitizeHtml,
  sanitizeUserInput,
  sanitizeEmailContent,
  stripHtml,
  sanitizeAndValidateHtml,
  checkHtmlSafety,
  
  // Email sanitizers
  sanitizeEmail,
  sanitizeEmailSubject,
  sanitizeEmailBody,
  sanitizeEmailObject,
  extractEmailAddresses,
  validateEmailHeaders,
  sanitizeTemplateVariables,
  
  // General input sanitizers
  sanitizeInput,
  sanitizeFormData,
  sanitizeSearchQuery,
  sanitizeFileName,
  sanitizeUrl,
  sanitizePhoneNumber,
  sanitizeJsonString,
  sanitizePassword
};

// Convenience functions for common operations
export const validateAndSanitize = {
  /**
   * Validate and sanitize user registration data
   */
  userRegistration: (data) => {
    const validation = validateUserRegistration(data);
    if (!validation.success) {
      return validation;
    }

    const sanitized = {
      ...validation.data,
      email: sanitizeEmail(validation.data.email),
      firstName: validation.data.firstName ? sanitizeInput(validation.data.firstName) : undefined,
      lastName: validation.data.lastName ? sanitizeInput(validation.data.lastName) : undefined,
      companyName: validation.data.companyName ? sanitizeInput(validation.data.companyName) : undefined,
      phone: validation.data.phone ? sanitizePhoneNumber(validation.data.phone) : undefined
    };

    return { success: true, data: sanitized };
  },

  /**
   * Validate and sanitize email data
   */
  email: (data) => {
    const validation = validateEmail(data);
    if (!validation.success) {
      return validation;
    }

    const emailSanitization = sanitizeEmailObject(validation.data);
    if (!emailSanitization.success) {
      return emailSanitization;
    }

    return { success: true, data: emailSanitization.sanitized };
  },

  /**
   * Validate and sanitize business profile data
   */
  business: (data) => {
    const validation = validateBusiness(data);
    if (!validation.success) {
      return validation;
    }

    const sanitized = {
      ...validation.data,
      name: sanitizeInput(validation.data.name),
      description: validation.data.description ? sanitizeInput(validation.data.description, { allowHtml: false, maxLength: 500 }) : undefined,
      email: validation.data.email ? sanitizeEmail(validation.data.email) : undefined,
      phone: validation.data.phone ? sanitizePhoneNumber(validation.data.phone) : undefined,
      website: validation.data.website ? sanitizeUrl(validation.data.website).sanitized : undefined
    };

    return { success: true, data: sanitized };
  },

  /**
   * Validate and sanitize form data with field configuration
   */
  form: (data, fieldConfig = {}) => {
    const sanitization = sanitizeFormData(data, fieldConfig);
    if (!sanitization.success) {
      return sanitization;
    }

    // Additional validation can be added here based on field types
    return sanitization;
  }
};

// Security utilities
export const security = {
  /**
   * Check if content is safe for display
   */
  isSafeContent: (content) => {
    const htmlCheck = checkHtmlSafety(content);
    return htmlCheck.safe;
  },

  /**
   * Sanitize content for safe display
   */
  makeSafeContent: (content, options = {}) => {
    return sanitizeAndValidateHtml(content, options);
  },

  /**
   * Extract and validate email addresses from text
   */
  extractSafeEmails: (text) => {
    const emails = extractEmailAddresses(text);
    const validation = validateEmailList(emails);
    return validation.validEmails;
  }
};

// Default export with all utilities
export default {
  validators,
  sanitizers,
  validateAndSanitize,
  security
};
