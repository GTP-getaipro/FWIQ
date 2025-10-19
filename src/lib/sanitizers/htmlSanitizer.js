import DOMPurify from 'dompurify';

// HTML sanitization configuration
const DEFAULT_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

// Strict configuration for user input
const STRICT_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'link', 'meta', 'object', 'embed', 'iframe'],
  FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
  KEEP_CONTENT: true
};

// Email content configuration
const EMAIL_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'table', 'tr', 'td', 'th'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button', 'iframe'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
  KEEP_CONTENT: true
};

/**
 * Sanitize HTML content with default configuration
 * @param {string} html - HTML content to sanitize
 * @param {Object} config - Optional custom configuration
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html, config = DEFAULT_CONFIG) => {
  if (typeof html !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(html, config);
  } catch (error) {
    console.error('HTML sanitization error:', error);
    return '';
  }
};

/**
 * Sanitize HTML with strict rules for user input
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeUserInput = (html) => {
  return sanitizeHtml(html, STRICT_CONFIG);
};

/**
 * Sanitize HTML for email content
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeEmailContent = (html) => {
  return sanitizeHtml(html, EMAIL_CONFIG);
};

/**
 * Strip all HTML tags and return plain text
 * @param {string} html - HTML content
 * @returns {string} - Plain text
 */
export const stripHtml = (html) => {
  if (typeof html !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(html, { 
      ALLOWED_TAGS: [], 
      KEEP_CONTENT: true 
    });
  } catch (error) {
    console.error('HTML stripping error:', error);
    return '';
  }
};

/**
 * Sanitize and validate HTML content
 * @param {string} html - HTML content to sanitize
 * @param {Object} options - Validation options
 * @returns {Object} - Result with sanitized content and validation info
 */
export const sanitizeAndValidateHtml = (html, options = {}) => {
  const {
    maxLength = 10000,
    allowEmpty = false,
    config = DEFAULT_CONFIG
  } = options;

  if (typeof html !== 'string') {
    return {
      success: false,
      sanitized: '',
      errors: ['Input must be a string']
    };
  }

  if (!allowEmpty && html.trim().length === 0) {
    return {
      success: false,
      sanitized: '',
      errors: ['Content cannot be empty']
    };
  }

  if (html.length > maxLength) {
    return {
      success: false,
      sanitized: '',
      errors: [`Content exceeds maximum length of ${maxLength} characters`]
    };
  }

  try {
    const sanitized = DOMPurify.sanitize(html, config);
    const plainText = stripHtml(sanitized);

    return {
      success: true,
      sanitized,
      plainText,
      originalLength: html.length,
      sanitizedLength: sanitized.length,
      plainTextLength: plainText.length,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      sanitized: '',
      errors: [`Sanitization failed: ${error.message}`]
    };
  }
};

/**
 * Check if HTML content is safe (no dangerous elements)
 * @param {string} html - HTML content to check
 * @returns {Object} - Safety check result
 */
export const checkHtmlSafety = (html) => {
  if (typeof html !== 'string') {
    return { safe: false, issues: ['Input must be a string'] };
  }

  const issues = [];
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<form[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i
  ];

  dangerousPatterns.forEach((pattern, index) => {
    if (pattern.test(html)) {
      const patternNames = [
        'script tags', 'iframe tags', 'object tags', 'embed tags',
        'form tags', 'javascript URLs', 'event handlers', 'link tags', 'meta tags'
      ];
      issues.push(`Contains ${patternNames[index]}`);
    }
  });

  return {
    safe: issues.length === 0,
    issues,
    recommendation: issues.length > 0 ? 'Content should be sanitized before use' : 'Content appears safe'
  };
};
