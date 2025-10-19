/**
 * Standardized API Response Utilities
 * 
 * This module provides consistent response formatting across all API endpoints.
 * All responses follow the standard format:
 * {
 *   success: boolean,
 *   message: string,
 *   data?: any,
 *   error?: string,
 *   timestamp: string
 * }
 */

/**
 * Create a standardized success response
 * @param {any} data - The response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Standardized response object
 */
const success = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {string} error - Error code or details
 * @param {any} data - Additional error data (optional)
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {Object} Standardized error response object
 */
const error = (message = 'An error occurred', error = 'UNKNOWN_ERROR', data = null, statusCode = 400) => {
  return {
    success: false,
    message,
    error,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Create a standardized validation error response
 * @param {string} message - Validation error message
 * @param {any} validationErrors - Validation error details
 * @returns {Object} Standardized validation error response
 */
const validationError = (message = 'Validation failed', validationErrors = null) => {
  return error(message, 'VALIDATION_ERROR', validationErrors, 400);
};

/**
 * Create a standardized authentication error response
 * @param {string} message - Authentication error message
 * @returns {Object} Standardized authentication error response
 */
const authError = (message = 'Authentication required') => {
  return error(message, 'AUTHENTICATION_ERROR', null, 401);
};

/**
 * Create a standardized authorization error response
 * @param {string} message - Authorization error message
 * @returns {Object} Standardized authorization error response
 */
const forbiddenError = (message = 'Insufficient permissions') => {
  return error(message, 'AUTHORIZATION_ERROR', null, 403);
};

/**
 * Create a standardized not found error response
 * @param {string} message - Not found error message
 * @returns {Object} Standardized not found error response
 */
const notFoundError = (message = 'Resource not found') => {
  return error(message, 'NOT_FOUND_ERROR', null, 404);
};

/**
 * Create a standardized conflict error response
 * @param {string} message - Conflict error message
 * @returns {Object} Standardized conflict error response
 */
const conflictError = (message = 'Resource conflict') => {
  return error(message, 'CONFLICT_ERROR', null, 409);
};

/**
 * Create a standardized rate limit error response
 * @param {string} message - Rate limit error message
 * @param {number} retryAfter - Seconds to wait before retrying
 * @returns {Object} Standardized rate limit error response
 */
const rateLimitError = (message = 'Rate limit exceeded', retryAfter = 900) => {
  return error(message, 'RATE_LIMIT_ERROR', { retryAfter }, 429);
};

/**
 * Create a standardized internal server error response
 * @param {string} message - Internal server error message
 * @param {string} errorCode - Error code for logging
 * @returns {Object} Standardized internal server error response
 */
const serverError = (message = 'Internal server error', errorCode = 'INTERNAL_ERROR') => {
  return error(message, errorCode, null, 500);
};

/**
 * Send a standardized success response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json(success(data, message, statusCode));
};

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} error - Error code
 * @param {any} data - Additional error data
 * @param {number} statusCode - HTTP status code
 */
const sendError = (res, message = 'An error occurred', error = 'UNKNOWN_ERROR', data = null, statusCode = 400) => {
  return res.status(statusCode).json(error(message, error, data, statusCode));
};

/**
 * Send a standardized validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {any} validationErrors - Validation error details
 */
const sendValidationError = (res, message = 'Validation failed', validationErrors = null) => {
  return res.status(400).json(validationError(message, validationErrors));
};

/**
 * Send a standardized authentication error response
 * @param {Object} res - Express response object
 * @param {string} message - Authentication error message
 */
const sendAuthError = (res, message = 'Authentication required') => {
  return res.status(401).json(authError(message));
};

/**
 * Send a standardized authorization error response
 * @param {Object} res - Express response object
 * @param {string} message - Authorization error message
 */
const sendForbiddenError = (res, message = 'Insufficient permissions') => {
  return res.status(403).json(forbiddenError(message));
};

/**
 * Send a standardized not found error response
 * @param {Object} res - Express response object
 * @param {string} message - Not found error message
 */
const sendNotFoundError = (res, message = 'Resource not found') => {
  return res.status(404).json(notFoundError(message));
};

/**
 * Send a standardized conflict error response
 * @param {Object} res - Express response object
 * @param {string} message - Conflict error message
 */
const sendConflictError = (res, message = 'Resource conflict') => {
  return res.status(409).json(conflictError(message));
};

/**
 * Send a standardized rate limit error response
 * @param {Object} res - Express response object
 * @param {string} message - Rate limit error message
 * @param {number} retryAfter - Seconds to wait before retrying
 */
const sendRateLimitError = (res, message = 'Rate limit exceeded', retryAfter = 900) => {
  return res.status(429).json(rateLimitError(message, retryAfter));
};

/**
 * Send a standardized internal server error response
 * @param {Object} res - Express response object
 * @param {string} message - Internal server error message
 * @param {string} errorCode - Error code for logging
 */
const sendServerError = (res, message = 'Internal server error', errorCode = 'INTERNAL_ERROR') => {
  return res.status(500).json(serverError(message, errorCode));
};

/**
 * Convert existing API error to standardized format
 * @param {Error} err - Error object
 * @returns {Object} Standardized error response
 */
const fromError = (err) => {
  if (err.isOperational && err.statusCode) {
    return error(err.message, err.code || 'API_ERROR', err.details, err.statusCode);
  }
  
  // Handle validation errors from Joi
  if (err.details && Array.isArray(err.details)) {
    const validationErrors = err.details.map(detail => ({
      field: detail.path?.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    return validationError('Validation failed', validationErrors);
  }
  
  // Handle generic errors
  return serverError(err.message || 'Internal server error', 'INTERNAL_ERROR');
};

export {
  // Response object creators
  success,
  error,
  validationError,
  authError,
  forbiddenError,
  notFoundError,
  conflictError,
  rateLimitError,
  serverError,
  
  // Response senders
  sendSuccess,
  sendError,
  sendValidationError,
  sendAuthError,
  sendForbiddenError,
  sendNotFoundError,
  sendConflictError,
  sendRateLimitError,
  sendServerError,
  
  // Utility functions
  fromError
};

export default {
  // Response object creators
  success,
  error,
  validationError,
  authError,
  forbiddenError,
  notFoundError,
  conflictError,
  rateLimitError,
  serverError,
  
  // Response senders
  sendSuccess,
  sendError,
  sendValidationError,
  sendAuthError,
  sendForbiddenError,
  sendNotFoundError,
  sendConflictError,
  sendRateLimitError,
  sendServerError,
  
  // Utility functions
  fromError
};
