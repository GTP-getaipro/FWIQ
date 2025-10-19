import { sanitizeUserInput, stripHtml } from './htmlSanitizer.js';

/**
 * Sanitize general user input
 * @param {string} input - User input to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input, options = {}) => {
  const {
    allowHtml = false,
    maxLength = 1000,
    trim = true
  } = options;

  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Handle HTML content
  if (allowHtml) {
    sanitized = sanitizeUserInput(sanitized);
  } else {
    sanitized = stripHtml(sanitized);
  }

  return sanitized;
};

/**
 * Sanitize form data object
 * @param {Object} formData - Form data to sanitize
 * @param {Object} fieldConfig - Configuration for each field
 * @returns {Object} - Sanitized form data with validation results
 */
export const sanitizeFormData = (formData, fieldConfig = {}) => {
  if (!formData || typeof formData !== 'object') {
    return {
      success: false,
      sanitized: {},
      errors: ['Form data must be an object']
    };
  }

  const sanitized = {};
  const errors = [];

  Object.keys(formData).forEach(field => {
    const value = formData[field];
    const config = fieldConfig[field] || {};

    try {
      if (typeof value === 'string') {
        sanitized[field] = sanitizeInput(value, config);
      } else if (Array.isArray(value)) {
        sanitized[field] = value.map(item => 
          typeof item === 'string' ? sanitizeInput(item, config) : item
        );
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[field] = value;
      } else if (value === null || value === undefined) {
        sanitized[field] = value;
      } else {
        // Skip complex objects for security
        errors.push(`Unsupported data type for field: ${field}`);
      }
    } catch (error) {
      errors.push(`Sanitization failed for field ${field}: ${error.message}`);
    }
  });

  return {
    success: errors.length === 0,
    sanitized,
    errors
  };
};

/**
 * Sanitize search query
 * @param {string} query - Search query to sanitize
 * @returns {string} - Sanitized search query
 */
export const sanitizeSearchQuery = (query) => {
  if (typeof query !== 'string') {
    return '';
  }

  // Remove HTML and dangerous characters
  let sanitized = stripHtml(query);
  
  // Remove SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|\/\*|\*\/|;)/g,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi
  ];

  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove script injection patterns
  const scriptPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];

  scriptPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Limit length and trim
  return sanitized.trim().substring(0, 200);
};

/**
 * Sanitize file name
 * @param {string} fileName - File name to sanitize
 * @returns {string} - Sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (typeof fileName !== 'string') {
    return '';
  }

  // Remove path traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\.\s]+|[\.\s]+$/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = name.substring(0, 255 - extension.length) + extension;
  }

  return sanitized || 'unnamed_file';
};

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {Object} - Sanitization result
 */
export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return {
      success: false,
      sanitized: '',
      errors: ['URL must be a string']
    };
  }

  try {
    // Remove HTML encoding and trim
    let sanitized = decodeURIComponent(url.trim());
    
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = sanitized.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return {
          success: false,
          sanitized: '',
          errors: [`Dangerous protocol detected: ${protocol}`]
        };
      }
    }

    // Ensure URL starts with http:// or https://
    if (!sanitized.match(/^https?:\/\//i)) {
      if (sanitized.includes('.') && !sanitized.includes(' ')) {
        sanitized = 'https://' + sanitized;
      } else {
        return {
          success: false,
          sanitized: '',
          errors: ['Invalid URL format']
        };
      }
    }

    // Validate URL structure
    const urlObject = new URL(sanitized);
    
    return {
      success: true,
      sanitized: urlObject.toString(),
      protocol: urlObject.protocol,
      hostname: urlObject.hostname,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      sanitized: '',
      errors: [`URL validation failed: ${error.message}`]
    };
  }
};

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} - Sanitized phone number
 */
export const sanitizePhoneNumber = (phone) => {
  if (typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters except + at the beginning
  let sanitized = phone.replace(/[^\d+]/g, '');
  
  // Ensure + is only at the beginning
  if (sanitized.includes('+')) {
    const parts = sanitized.split('+');
    sanitized = '+' + parts.join('');
  }

  // Limit length (international format is max 15 digits + country code)
  return sanitized.substring(0, 20);
};

/**
 * Sanitize JSON string
 * @param {string} jsonString - JSON string to sanitize
 * @returns {Object} - Sanitization result
 */
export const sanitizeJsonString = (jsonString) => {
  if (typeof jsonString !== 'string') {
    return {
      success: false,
      sanitized: null,
      errors: ['Input must be a string']
    };
  }

  try {
    // Parse JSON to validate structure
    const parsed = JSON.parse(jsonString);
    
    // Re-stringify to ensure clean format
    const sanitized = JSON.stringify(parsed);
    
    return {
      success: true,
      sanitized,
      parsed,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      sanitized: null,
      errors: [`Invalid JSON: ${error.message}`]
    };
  }
};

/**
 * Sanitize and validate password
 * @param {string} password - Password to sanitize
 * @returns {Object} - Sanitization and validation result
 */
export const sanitizePassword = (password) => {
  if (typeof password !== 'string') {
    return {
      success: false,
      sanitized: '',
      errors: ['Password must be a string']
    };
  }

  const errors = [];
  
  // Check length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  // Check complexity
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password', '123456', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];
  
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and weak');
  }

  return {
    success: errors.length === 0,
    sanitized: password, // Don't modify the actual password
    strength: calculatePasswordStrength(password),
    errors
  };
};

/**
 * Calculate password strength score
 * @param {string} password - Password to analyze
 * @returns {Object} - Password strength analysis
 */
const calculatePasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;

  // Pattern checking
  if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
  if (!/012|123|234|345|456|567|678|789|890/.test(password)) score += 1; // No sequences

  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const level = Math.min(Math.floor(score / 2), levels.length - 1);

  return {
    score,
    level: levels[level],
    feedback
  };
};
