/**
 * Standardized Error Codes - Frontend
 * 
 * This module defines consistent error codes used across the frontend.
 * These codes match the backend error codes and provide a standardized
 * way to identify and handle errors in the frontend components.
 */

/**
 * Error code categories and their user-friendly messages
 */
export const ERROR_CODES = {
  // Authentication & Authorization (4xx)
  AUTHENTICATION_REQUIRED: {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Authentication required',
    userMessage: 'Please log in to continue',
    action: 'redirectToLogin'
  },
  AUTHENTICATION_INVALID: {
    code: 'AUTHENTICATION_INVALID',
    message: 'Invalid authentication credentials',
    userMessage: 'Invalid email or password',
    action: 'showFormError'
  },
  AUTHENTICATION_EXPIRED: {
    code: 'AUTHENTICATION_EXPIRED',
    message: 'Authentication token has expired',
    userMessage: 'Your session has expired. Please log in again.',
    action: 'redirectToLogin'
  },
  AUTHORIZATION_INSUFFICIENT: {
    code: 'AUTHORIZATION_INSUFFICIENT',
    message: 'Insufficient permissions',
    userMessage: 'You do not have permission to perform this action',
    action: 'showError'
  },
  
  // Validation Errors (4xx)
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    message: 'Validation failed',
    userMessage: 'Please check your input and try again',
    action: 'showFormError'
  },
  VALIDATION_EMAIL_INVALID: {
    code: 'VALIDATION_EMAIL_INVALID',
    message: 'Invalid email format',
    userMessage: 'Please enter a valid email address',
    action: 'showFieldError'
  },
  VALIDATION_PASSWORD_WEAK: {
    code: 'VALIDATION_PASSWORD_WEAK',
    message: 'Password does not meet requirements',
    userMessage: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    action: 'showFieldError'
  },
  VALIDATION_REQUIRED_FIELD: {
    code: 'VALIDATION_REQUIRED_FIELD',
    message: 'Required field is missing',
    userMessage: 'Please fill in all required fields',
    action: 'showFieldError'
  },
  
  // Resource Errors (4xx)
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
    userMessage: 'The requested resource was not found',
    action: 'showError'
  },
  RESOURCE_CONFLICT: {
    code: 'RESOURCE_CONFLICT',
    message: 'Resource already exists',
    userMessage: 'This resource already exists',
    action: 'showError'
  },
  RESOURCE_UNAVAILABLE: {
    code: 'RESOURCE_UNAVAILABLE',
    message: 'Resource is currently unavailable',
    userMessage: 'This service is temporarily unavailable',
    action: 'showError'
  },
  
  // Rate Limiting (4xx)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded',
    userMessage: 'Too many requests. Please try again later.',
    action: 'showError'
  },
  
  // External Service Errors (5xx)
  EXTERNAL_SERVICE_UNAVAILABLE: {
    code: 'EXTERNAL_SERVICE_UNAVAILABLE',
    message: 'External service is unavailable',
    userMessage: 'A required service is temporarily unavailable',
    action: 'showError'
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'External service error',
    userMessage: 'There was an error with an external service',
    action: 'showError'
  },
  EXTERNAL_API_LIMIT: {
    code: 'EXTERNAL_API_LIMIT',
    message: 'External API rate limit exceeded',
    userMessage: 'Service is temporarily rate limited. Please try again later.',
    action: 'showError'
  },
  
  // Database Errors (5xx)
  DATABASE_CONNECTION_ERROR: {
    code: 'DATABASE_CONNECTION_ERROR',
    message: 'Database connection error',
    userMessage: 'Database is temporarily unavailable',
    action: 'showError'
  },
  DATABASE_QUERY_ERROR: {
    code: 'DATABASE_QUERY_ERROR',
    message: 'Database query error',
    userMessage: 'There was an error processing your request',
    action: 'showError'
  },
  DATABASE_CONSTRAINT_VIOLATION: {
    code: 'DATABASE_CONSTRAINT_VIOLATION',
    message: 'Database constraint violation',
    userMessage: 'This action violates a data constraint',
    action: 'showError'
  },
  
  // File & Upload Errors (4xx)
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'File size exceeds limit',
    userMessage: 'File is too large. Please choose a smaller file.',
    action: 'showError'
  },
  FILE_TYPE_INVALID: {
    code: 'FILE_TYPE_INVALID',
    message: 'Invalid file type',
    userMessage: 'File type not supported. Please choose a different file.',
    action: 'showError'
  },
  FILE_UPLOAD_FAILED: {
    code: 'FILE_UPLOAD_FAILED',
    message: 'File upload failed',
    userMessage: 'Failed to upload file. Please try again.',
    action: 'showError'
  },
  
  // Business Logic Errors (4xx)
  BUSINESS_RULE_VIOLATION: {
    code: 'BUSINESS_RULE_VIOLATION',
    message: 'Business rule violation',
    userMessage: 'This action is not allowed',
    action: 'showError'
  },
  WORKFLOW_STATE_INVALID: {
    code: 'WORKFLOW_STATE_INVALID',
    message: 'Invalid workflow state',
    userMessage: 'Cannot perform this action in current workflow state',
    action: 'showError'
  },
  INTEGRATION_NOT_CONFIGURED: {
    code: 'INTEGRATION_NOT_CONFIGURED',
    message: 'Integration not configured',
    userMessage: 'Please configure the required integration first',
    action: 'redirectToSetup'
  },
  
  // Internal Server Errors (5xx)
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    userMessage: 'An unexpected error occurred. Please try again.',
    action: 'showError'
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service unavailable',
    userMessage: 'Service is temporarily unavailable. Please try again later.',
    action: 'showError'
  },
  CONFIGURATION_ERROR: {
    code: 'CONFIGURATION_ERROR',
    message: 'Configuration error',
    userMessage: 'There is a configuration issue. Please contact support.',
    action: 'showError'
  },
  
  // Analytics & Monitoring Errors (5xx)
  ANALYTICS_TRACKING_FAILED: {
    code: 'ANALYTICS_TRACKING_FAILED',
    message: 'Analytics tracking failed',
    userMessage: 'Analytics data could not be recorded',
    action: 'logError'
  },
  METRICS_COLLECTION_FAILED: {
    code: 'METRICS_COLLECTION_FAILED',
    message: 'Metrics collection failed',
    userMessage: 'Performance metrics could not be collected',
    action: 'logError'
  },
  
  // Security Errors (4xx)
  SECURITY_VIOLATION: {
    code: 'SECURITY_VIOLATION',
    message: 'Security policy violation',
    userMessage: 'This action violates security policies',
    action: 'showError'
  },
  CSP_VIOLATION: {
    code: 'CSP_VIOLATION',
    message: 'Content Security Policy violation',
    userMessage: 'This action violates security policies',
    action: 'logError'
  }
};

/**
 * Error action types for handling errors
 */
export const ERROR_ACTIONS = {
  SHOW_ERROR: 'showError',
  SHOW_FORM_ERROR: 'showFormError',
  SHOW_FIELD_ERROR: 'showFieldError',
  REDIRECT_TO_LOGIN: 'redirectToLogin',
  REDIRECT_TO_SETUP: 'redirectToSetup',
  LOG_ERROR: 'logError'
};

/**
 * Get error information by code
 * @param {string} code - Error code
 * @returns {Object} Error information
 */
export const getErrorInfo = (code) => {
  return ERROR_CODES[code] || ERROR_CODES.INTERNAL_SERVER_ERROR;
};

/**
 * Create error object from code
 * @param {string} code - Error code
 * @param {string} customMessage - Custom error message (optional)
 * @param {Object} details - Additional error details (optional)
 * @returns {Object} Error object
 */
export const createError = (code, customMessage = null, details = null) => {
  const errorInfo = getErrorInfo(code);
  return {
    code: errorInfo.code,
    message: customMessage || errorInfo.message,
    userMessage: errorInfo.userMessage,
    action: errorInfo.action,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Check if error code exists
 * @param {string} code - Error code to check
 * @returns {boolean} True if code exists
 */
export const isValidErrorCode = (code) => {
  return ERROR_CODES.hasOwnProperty(code);
};

/**
 * Get user-friendly error message
 * @param {string|Object} error - Error code string or error object
 * @returns {string} User-friendly error message
 */
export const getUserErrorMessage = (error) => {
  if (typeof error === 'string') {
    return getErrorInfo(error).userMessage;
  }
  
  if (error?.userMessage) {
    return error.userMessage;
  }
  
  if (error?.code && ERROR_CODES[error.code]) {
    return ERROR_CODES[error.code].userMessage;
  }
  
  return error?.message || 'An unexpected error occurred';
};

/**
 * Get error action for handling
 * @param {string|Object} error - Error code string or error object
 * @returns {string} Error action type
 */
export const getErrorAction = (error) => {
  if (typeof error === 'string') {
    return getErrorInfo(error).action;
  }
  
  if (error?.action) {
    return error.action;
  }
  
  if (error?.code && ERROR_CODES[error.code]) {
    return ERROR_CODES[error.code].action;
  }
  
  return ERROR_ACTIONS.SHOW_ERROR;
};

/**
 * Error code categories for grouping
 */
export const ERROR_CATEGORIES = {
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

export default {
  ERROR_CODES,
  ERROR_ACTIONS,
  ERROR_CATEGORIES,
  getErrorInfo,
  createError,
  isValidErrorCode,
  getUserErrorMessage,
  getErrorAction
};
