/**
 * Standardized Error Codes
 * 
 * This module defines consistent error codes used across the application.
 * These codes provide a standardized way to identify and handle errors
 * in both frontend and backend components.
 */

/**
 * Error code categories and their HTTP status codes
 */
const ERROR_CODES = {
  // Authentication & Authorization (4xx)
  AUTHENTICATION_REQUIRED: {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Authentication required',
    statusCode: 401,
    userMessage: 'Please log in to continue'
  },
  AUTHENTICATION_INVALID: {
    code: 'AUTHENTICATION_INVALID',
    message: 'Invalid authentication credentials',
    statusCode: 401,
    userMessage: 'Invalid email or password'
  },
  AUTHENTICATION_EXPIRED: {
    code: 'AUTHENTICATION_EXPIRED',
    message: 'Authentication token has expired',
    statusCode: 401,
    userMessage: 'Your session has expired. Please log in again.'
  },
  AUTHORIZATION_INSUFFICIENT: {
    code: 'AUTHORIZATION_INSUFFICIENT',
    message: 'Insufficient permissions',
    statusCode: 403,
    userMessage: 'You do not have permission to perform this action'
  },
  
  // Validation Errors (4xx)
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    message: 'Validation failed',
    statusCode: 400,
    userMessage: 'Please check your input and try again'
  },
  VALIDATION_EMAIL_INVALID: {
    code: 'VALIDATION_EMAIL_INVALID',
    message: 'Invalid email format',
    statusCode: 400,
    userMessage: 'Please enter a valid email address'
  },
  VALIDATION_PASSWORD_WEAK: {
    code: 'VALIDATION_PASSWORD_WEAK',
    message: 'Password does not meet requirements',
    statusCode: 400,
    userMessage: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  },
  VALIDATION_REQUIRED_FIELD: {
    code: 'VALIDATION_REQUIRED_FIELD',
    message: 'Required field is missing',
    statusCode: 400,
    userMessage: 'Please fill in all required fields'
  },
  
  // Resource Errors (4xx)
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
    statusCode: 404,
    userMessage: 'The requested resource was not found'
  },
  RESOURCE_CONFLICT: {
    code: 'RESOURCE_CONFLICT',
    message: 'Resource already exists',
    statusCode: 409,
    userMessage: 'This resource already exists'
  },
  RESOURCE_UNAVAILABLE: {
    code: 'RESOURCE_UNAVAILABLE',
    message: 'Resource is currently unavailable',
    statusCode: 503,
    userMessage: 'This service is temporarily unavailable'
  },
  
  // Rate Limiting (4xx)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded',
    statusCode: 429,
    userMessage: 'Too many requests. Please try again later.'
  },
  
  // External Service Errors (5xx)
  EXTERNAL_SERVICE_UNAVAILABLE: {
    code: 'EXTERNAL_SERVICE_UNAVAILABLE',
    message: 'External service is unavailable',
    statusCode: 503,
    userMessage: 'A required service is temporarily unavailable'
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'External service error',
    statusCode: 502,
    userMessage: 'There was an error with an external service'
  },
  EXTERNAL_API_LIMIT: {
    code: 'EXTERNAL_API_LIMIT',
    message: 'External API rate limit exceeded',
    statusCode: 429,
    userMessage: 'Service is temporarily rate limited. Please try again later.'
  },
  
  // Database Errors (5xx)
  DATABASE_CONNECTION_ERROR: {
    code: 'DATABASE_CONNECTION_ERROR',
    message: 'Database connection error',
    statusCode: 503,
    userMessage: 'Database is temporarily unavailable'
  },
  DATABASE_QUERY_ERROR: {
    code: 'DATABASE_QUERY_ERROR',
    message: 'Database query error',
    statusCode: 500,
    userMessage: 'There was an error processing your request'
  },
  DATABASE_CONSTRAINT_VIOLATION: {
    code: 'DATABASE_CONSTRAINT_VIOLATION',
    message: 'Database constraint violation',
    statusCode: 409,
    userMessage: 'This action violates a data constraint'
  },
  
  // File & Upload Errors (4xx)
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'File size exceeds limit',
    statusCode: 413,
    userMessage: 'File is too large. Please choose a smaller file.'
  },
  FILE_TYPE_INVALID: {
    code: 'FILE_TYPE_INVALID',
    message: 'Invalid file type',
    statusCode: 400,
    userMessage: 'File type not supported. Please choose a different file.'
  },
  FILE_UPLOAD_FAILED: {
    code: 'FILE_UPLOAD_FAILED',
    message: 'File upload failed',
    statusCode: 500,
    userMessage: 'Failed to upload file. Please try again.'
  },
  
  // Business Logic Errors (4xx)
  BUSINESS_RULE_VIOLATION: {
    code: 'BUSINESS_RULE_VIOLATION',
    message: 'Business rule violation',
    statusCode: 400,
    userMessage: 'This action is not allowed'
  },
  WORKFLOW_STATE_INVALID: {
    code: 'WORKFLOW_STATE_INVALID',
    message: 'Invalid workflow state',
    statusCode: 400,
    userMessage: 'Cannot perform this action in current workflow state'
  },
  INTEGRATION_NOT_CONFIGURED: {
    code: 'INTEGRATION_NOT_CONFIGURED',
    message: 'Integration not configured',
    statusCode: 400,
    userMessage: 'Please configure the required integration first'
  },
  
  // Internal Server Errors (5xx)
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    statusCode: 500,
    userMessage: 'An unexpected error occurred. Please try again.'
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service unavailable',
    statusCode: 503,
    userMessage: 'Service is temporarily unavailable. Please try again later.'
  },
  CONFIGURATION_ERROR: {
    code: 'CONFIGURATION_ERROR',
    message: 'Configuration error',
    statusCode: 500,
    userMessage: 'There is a configuration issue. Please contact support.'
  },
  
  // Analytics & Monitoring Errors (5xx)
  ANALYTICS_TRACKING_FAILED: {
    code: 'ANALYTICS_TRACKING_FAILED',
    message: 'Analytics tracking failed',
    statusCode: 500,
    userMessage: 'Analytics data could not be recorded'
  },
  METRICS_COLLECTION_FAILED: {
    code: 'METRICS_COLLECTION_FAILED',
    message: 'Metrics collection failed',
    statusCode: 500,
    userMessage: 'Performance metrics could not be collected'
  },
  
  // Security Errors (4xx)
  SECURITY_VIOLATION: {
    code: 'SECURITY_VIOLATION',
    message: 'Security policy violation',
    statusCode: 403,
    userMessage: 'This action violates security policies'
  },
  CSP_VIOLATION: {
    code: 'CSP_VIOLATION',
    message: 'Content Security Policy violation',
    statusCode: 403,
    userMessage: 'This action violates security policies'
  }
};

/**
 * Get error information by code
 * @param {string} code - Error code
 * @returns {Object} Error information
 */
const getErrorInfo = (code) => {
  return ERROR_CODES[code] || ERROR_CODES.INTERNAL_SERVER_ERROR;
};

/**
 * Create error object from code
 * @param {string} code - Error code
 * @param {string} customMessage - Custom error message (optional)
 * @param {Object} details - Additional error details (optional)
 * @returns {Object} Error object
 */
const createError = (code, customMessage = null, details = null) => {
  const errorInfo = getErrorInfo(code);
  return {
    code: errorInfo.code,
    message: customMessage || errorInfo.message,
    statusCode: errorInfo.statusCode,
    userMessage: errorInfo.userMessage,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Check if error code exists
 * @param {string} code - Error code to check
 * @returns {boolean} True if code exists
 */
const isValidErrorCode = (code) => {
  return ERROR_CODES.hasOwnProperty(code);
};

/**
 * Get all error codes for a specific HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {Array} Array of error codes with matching status code
 */
const getErrorsByStatusCode = (statusCode) => {
  return Object.values(ERROR_CODES).filter(error => error.statusCode === statusCode);
};

/**
 * Error code categories for grouping
 */
const ERROR_CATEGORIES = {
  AUTHENTICATION: [
    'AUTHENTICATION_REQUIRED',
    'AUTHENTICATION_INVALID',
    'AUTHENTICATION_EXPIRED'
  ],
  AUTHORIZATION: [
    'AUTHORIZATION_INSUFFICIENT'
  ],
  VALIDATION: [
    'VALIDATION_FAILED',
    'VALIDATION_EMAIL_INVALID',
    'VALIDATION_PASSWORD_WEAK',
    'VALIDATION_REQUIRED_FIELD'
  ],
  RESOURCE: [
    'RESOURCE_NOT_FOUND',
    'RESOURCE_CONFLICT',
    'RESOURCE_UNAVAILABLE'
  ],
  RATE_LIMITING: [
    'RATE_LIMIT_EXCEEDED',
    'EXTERNAL_API_LIMIT'
  ],
  EXTERNAL_SERVICES: [
    'EXTERNAL_SERVICE_UNAVAILABLE',
    'EXTERNAL_SERVICE_ERROR'
  ],
  DATABASE: [
    'DATABASE_CONNECTION_ERROR',
    'DATABASE_QUERY_ERROR',
    'DATABASE_CONSTRAINT_VIOLATION'
  ],
  FILES: [
    'FILE_TOO_LARGE',
    'FILE_TYPE_INVALID',
    'FILE_UPLOAD_FAILED'
  ],
  BUSINESS_LOGIC: [
    'BUSINESS_RULE_VIOLATION',
    'WORKFLOW_STATE_INVALID',
    'INTEGRATION_NOT_CONFIGURED'
  ],
  INTERNAL: [
    'INTERNAL_SERVER_ERROR',
    'SERVICE_UNAVAILABLE',
    'CONFIGURATION_ERROR'
  ],
  MONITORING: [
    'ANALYTICS_TRACKING_FAILED',
    'METRICS_COLLECTION_FAILED'
  ],
  SECURITY: [
    'SECURITY_VIOLATION',
    'CSP_VIOLATION'
  ]
};

export {
  ERROR_CODES,
  ERROR_CATEGORIES,
  getErrorInfo,
  createError,
  isValidErrorCode,
  getErrorsByStatusCode
};

export default {
  ERROR_CODES,
  ERROR_CATEGORIES,
  getErrorInfo,
  createError,
  isValidErrorCode,
  getErrorsByStatusCode
};
