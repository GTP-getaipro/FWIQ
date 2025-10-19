import logger from '../utils/logger.js';
import {  fromError  } from '../utils/response.js';
import {  ERROR_CODES, createError  } from '../constants/errorCodes.js';

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Validation error class
 */
class ValidationError extends APIError {
  constructor(message, details = null) {
    const errorInfo = ERROR_CODES.VALIDATION_FAILED;
    super(message, errorInfo.statusCode, errorInfo.code, details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
class AuthenticationError extends APIError {
  constructor(message = null) {
    const errorInfo = ERROR_CODES.AUTHENTICATION_REQUIRED;
    super(message || errorInfo.message, errorInfo.statusCode, errorInfo.code);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
class AuthorizationError extends APIError {
  constructor(message = null) {
    const errorInfo = ERROR_CODES.AUTHORIZATION_INSUFFICIENT;
    super(message || errorInfo.message, errorInfo.statusCode, errorInfo.code);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
class NotFoundError extends APIError {
  constructor(message = null) {
    const errorInfo = ERROR_CODES.RESOURCE_NOT_FOUND;
    super(message || errorInfo.message, errorInfo.statusCode, errorInfo.code);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class
 */
class ConflictError extends APIError {
  constructor(message = null) {
    const errorInfo = ERROR_CODES.RESOURCE_CONFLICT;
    super(message || errorInfo.message, errorInfo.statusCode, errorInfo.code);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error class
 */
class RateLimitError extends APIError {
  constructor(message = null, retryAfter = 900) {
    const errorInfo = ERROR_CODES.RATE_LIMIT_EXCEEDED;
    super(message || errorInfo.message, errorInfo.statusCode, errorInfo.code, { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details = null;

  // Handle different error types
  if (err instanceof APIError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError' || err.name === 'CastError') {
    const errorInfo = ERROR_CODES.VALIDATION_FAILED;
    statusCode = errorInfo.statusCode;
    errorCode = errorInfo.code;
    message = errorInfo.message;
    details = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    const errorInfo = ERROR_CODES.AUTHENTICATION_INVALID;
    statusCode = errorInfo.statusCode;
    errorCode = errorInfo.code;
    message = errorInfo.message;
  } else if (err.name === 'TokenExpiredError') {
    const errorInfo = ERROR_CODES.AUTHENTICATION_EXPIRED;
    statusCode = errorInfo.statusCode;
    errorCode = errorInfo.code;
    message = errorInfo.message;
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    const errorInfo = ERROR_CODES.FILE_TOO_LARGE;
    statusCode = errorInfo.statusCode;
    errorCode = errorInfo.code;
    message = errorInfo.message;
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    const errorInfo = ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE;
    statusCode = errorInfo.statusCode;
    errorCode = errorInfo.code;
    message = errorInfo.message;
  } else if (err.code === '23505') { // PostgreSQL unique violation
    const errorInfo = ERROR_CODES.RESOURCE_CONFLICT;
    statusCode = errorInfo.statusCode;
    errorCode = errorInfo.code;
    message = errorInfo.message;
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    const errorInfo = ERROR_CODES.DATABASE_CONSTRAINT_VIOLATION;
    statusCode = errorInfo.statusCode;
    errorCode = errorInfo.code;
    message = errorInfo.message;
  } else if (err.code === '42P01') { // PostgreSQL table does not exist
    const errorInfo = ERROR_CODES.DATABASE_CONNECTION_ERROR;
    statusCode = errorInfo.statusCode;
    errorCode = errorInfo.code;
    message = errorInfo.message;
  }

  // Create standardized error response
  const errorResponse = fromError(err);
  
  // Add additional debugging info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.path = req.path;
    errorResponse.method = req.method;
    errorResponse.stack = err.stack;
  }

  // Add details in development mode or for specific error types
  if (process.env.NODE_ENV === 'development' || details) {
    errorResponse.details = details || err.message;
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Add retry information for rate limit errors
  if (err instanceof RateLimitError && err.details?.retryAfter) {
    res.set('Retry-After', err.details.retryAfter);
    errorResponse.retryAfter = err.details.retryAfter;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
};

/**
 * Validation middleware using Joi
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return next(new ValidationError('Validation failed', details));
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

/**
 * Request timeout middleware
 */
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn(`Request timeout: ${req.method} ${req.path}`);
        res.status(408).json({
          error: 'Request timeout',
          code: 'REQUEST_TIMEOUT',
          timeout: timeoutMs
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Health check for error handling
 */
const healthCheck = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
};

export {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  validate,
  requestTimeout,
  healthCheck,
  // Error classes
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
};

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  validate,
  requestTimeout,
  healthCheck,
  // Error classes
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
};
