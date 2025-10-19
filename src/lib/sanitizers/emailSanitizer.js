import { sanitizeHtml, sanitizeEmailContent, stripHtml } from './htmlSanitizer.js';

/**
 * Sanitize email address
 * @param {string} email - Email address to sanitize
 * @returns {string} - Sanitized email address
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove whitespace and convert to lowercase
  return email.trim().toLowerCase();
};

/**
 * Sanitize email subject line
 * @param {string} subject - Email subject to sanitize
 * @returns {string} - Sanitized subject
 */
export const sanitizeEmailSubject = (subject) => {
  if (typeof subject !== 'string') {
    return '';
  }

  // Remove HTML tags and trim whitespace
  return stripHtml(subject).trim();
};

/**
 * Sanitize email body content
 * @param {string} body - Email body to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} - Sanitized email body with metadata
 */
export const sanitizeEmailBody = (body, options = {}) => {
  const {
    allowHtml = true,
    maxLength = 50000,
    preserveFormatting = true
  } = options;

  if (typeof body !== 'string') {
    return {
      success: false,
      sanitized: '',
      errors: ['Email body must be a string']
    };
  }

  if (body.length > maxLength) {
    return {
      success: false,
      sanitized: '',
      errors: [`Email body exceeds maximum length of ${maxLength} characters`]
    };
  }

  try {
    let sanitized;
    
    if (allowHtml) {
      // Sanitize HTML content for email
      sanitized = sanitizeEmailContent(body);
    } else {
      // Strip all HTML and return plain text
      sanitized = stripHtml(body);
    }

    // Additional email-specific sanitization
    if (preserveFormatting) {
      // Convert line breaks to <br> tags if HTML is allowed
      if (allowHtml && !body.includes('<')) {
        sanitized = sanitized.replace(/\n/g, '<br>');
      }
    }

    const plainText = stripHtml(sanitized);

    return {
      success: true,
      sanitized,
      plainText,
      originalLength: body.length,
      sanitizedLength: sanitized.length,
      plainTextLength: plainText.length,
      containsHtml: sanitized !== plainText,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      sanitized: '',
      errors: [`Email sanitization failed: ${error.message}`]
    };
  }
};

/**
 * Sanitize complete email object
 * @param {Object} email - Email object to sanitize
 * @returns {Object} - Sanitized email object with validation results
 */
export const sanitizeEmailObject = (email) => {
  if (!email || typeof email !== 'object') {
    return {
      success: false,
      sanitized: null,
      errors: ['Email must be an object']
    };
  }

  const errors = [];
  const sanitized = {};

  // Sanitize email addresses
  if (email.to) {
    sanitized.to = sanitizeEmail(email.to);
    if (!sanitized.to) {
      errors.push('Invalid "to" email address');
    }
  }

  if (email.from) {
    sanitized.from = sanitizeEmail(email.from);
    if (!sanitized.from) {
      errors.push('Invalid "from" email address');
    }
  }

  if (email.cc) {
    if (Array.isArray(email.cc)) {
      sanitized.cc = email.cc.map(sanitizeEmail).filter(Boolean);
    } else {
      sanitized.cc = sanitizeEmail(email.cc);
      if (!sanitized.cc) {
        errors.push('Invalid "cc" email address');
      }
    }
  }

  if (email.bcc) {
    if (Array.isArray(email.bcc)) {
      sanitized.bcc = email.bcc.map(sanitizeEmail).filter(Boolean);
    } else {
      sanitized.bcc = sanitizeEmail(email.bcc);
      if (!sanitized.bcc) {
        errors.push('Invalid "bcc" email address');
      }
    }
  }

  // Sanitize subject
  if (email.subject) {
    sanitized.subject = sanitizeEmailSubject(email.subject);
  }

  // Sanitize body
  if (email.body) {
    const bodyResult = sanitizeEmailBody(email.body);
    if (bodyResult.success) {
      sanitized.body = bodyResult.sanitized;
      sanitized.plainTextBody = bodyResult.plainText;
    } else {
      errors.push(...bodyResult.errors);
    }
  }

  // Preserve other safe properties
  const safeProperties = ['priority', 'category', 'messageId', 'inReplyTo', 'references'];
  safeProperties.forEach(prop => {
    if (email[prop] !== undefined) {
      sanitized[prop] = email[prop];
    }
  });

  return {
    success: errors.length === 0,
    sanitized: errors.length === 0 ? sanitized : null,
    errors
  };
};

/**
 * Extract and sanitize email addresses from a string
 * @param {string} text - Text containing email addresses
 * @returns {Array} - Array of sanitized email addresses
 */
export const extractEmailAddresses = (text) => {
  if (typeof text !== 'string') {
    return [];
  }

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  
  return matches
    .map(sanitizeEmail)
    .filter(Boolean)
    .filter((email, index, array) => array.indexOf(email) === index); // Remove duplicates
};

/**
 * Validate email headers for security
 * @param {Object} headers - Email headers object
 * @returns {Object} - Validation result
 */
export const validateEmailHeaders = (headers) => {
  if (!headers || typeof headers !== 'object') {
    return {
      valid: false,
      errors: ['Headers must be an object']
    };
  }

  const errors = [];
  const dangerousHeaders = [
    'x-php-script', 'x-php-originating-script', 'content-type',
    'mime-version', 'x-mailer'
  ];

  // Check for potentially dangerous headers
  Object.keys(headers).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    if (dangerousHeaders.includes(lowerKey)) {
      errors.push(`Potentially dangerous header: ${key}`);
    }

    // Check for injection attempts
    const value = headers[key];
    if (typeof value === 'string') {
      if (value.includes('\n') || value.includes('\r')) {
        errors.push(`Header injection attempt in: ${key}`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    recommendation: errors.length > 0 ? 'Headers should be reviewed and sanitized' : 'Headers appear safe'
  };
};

/**
 * Sanitize email template variables
 * @param {Object} variables - Template variables object
 * @returns {Object} - Sanitized variables
 */
export const sanitizeTemplateVariables = (variables) => {
  if (!variables || typeof variables !== 'object') {
    return {};
  }

  const sanitized = {};

  Object.keys(variables).forEach(key => {
    const value = variables[key];
    
    if (typeof value === 'string') {
      // Sanitize string values
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      // Keep safe primitive types
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      // Sanitize array values
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeHtml(item) : item
      );
    }
    // Skip objects and functions for security
  });

  return sanitized;
};
