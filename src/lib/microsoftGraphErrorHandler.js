/**
 * Microsoft Graph API Error Handler
 * Comprehensive error handling for Microsoft Graph API operations
 */

// Mock logger for testing environment
const createLogger = async () => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  }
  
  // In production, use the actual logger
  try {
    const { logger } = await import('./logger.js');
    return logger;
  } catch (error) {
    // Fallback logger
    return {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
  }
};

export class MicrosoftGraphErrorHandler {
  constructor() {
    this.logger = null; // Will be initialized lazily
    this.retryService = null; // Will be initialized lazily
    
    // Microsoft Graph API specific error codes
    this.errorCodes = {
      // Authentication errors
      'InvalidAuthenticationToken': {
        status: 401,
        retryable: true,
        description: 'The access token is invalid or expired',
        action: 'refresh_token'
      },
      'AuthenticationFailed': {
        status: 401,
        retryable: true,
        description: 'Authentication failed',
        action: 'refresh_token'
      },
      'InvalidRequest': {
        status: 400,
        retryable: false,
        description: 'The request is invalid',
        action: 'fix_request'
      },
      'ErrorInvalidRequest': {
        status: 400,
        retryable: false,
        description: 'The request is invalid or malformed',
        action: 'fix_request'
      },
      'ErrorInvalidIdMalformed': {
        status: 400,
        retryable: false,
        description: 'The ID format is invalid or malformed',
        action: 'fix_request'
      },
      'ErrorInvalidParameter': {
        status: 400,
        retryable: false,
        description: 'One or more parameters are invalid',
        action: 'fix_request'
      },
      'ErrorPropertyValidationFailure': {
        status: 400,
        retryable: false,
        description: 'Property validation failed',
        action: 'fix_request'
      },
      
      // Permission errors
      'Forbidden': {
        status: 403,
        retryable: false,
        description: 'Insufficient permissions to perform the operation',
        action: 'check_permissions'
      },
      'InsufficientPrivileges': {
        status: 403,
        retryable: false,
        description: 'Insufficient privileges to perform the operation',
        action: 'check_permissions'
      },
      
      // Resource errors
      'ItemNotFound': {
        status: 404,
        retryable: false,
        description: 'The requested resource was not found',
        action: 'check_resource'
      },
      'ErrorFolderExists': {
        status: 409,
        retryable: false,
        description: 'The folder already exists',
        action: 'skip_or_update'
      },
      'ErrorFolderNameConflict': {
        status: 409,
        retryable: false,
        description: 'A folder with this name already exists',
        action: 'skip_or_update'
      },
      'ErrorFolderHierarchyConflict': {
        status: 409,
        retryable: false,
        description: 'Folder hierarchy conflict',
        action: 'skip_or_update'
      },
      'Conflict': {
        status: 409,
        retryable: false,
        description: 'A conflict occurred with the current state',
        action: 'resolve_conflict'
      },
      
      // Rate limiting
      'TooManyRequests': {
        status: 429,
        retryable: true,
        description: 'Too many requests - rate limited',
        action: 'retry_with_backoff'
      },
      'QuotaExceeded': {
        status: 429,
        retryable: true,
        description: 'Quota exceeded',
        action: 'retry_with_backoff'
      },
      
      // Server errors
      'InternalServerError': {
        status: 500,
        retryable: true,
        description: 'Internal server error',
        action: 'retry_with_backoff'
      },
      'ServiceUnavailable': {
        status: 503,
        retryable: true,
        description: 'Service temporarily unavailable',
        action: 'retry_with_backoff'
      },
      'GatewayTimeout': {
        status: 504,
        retryable: true,
        description: 'Gateway timeout',
        action: 'retry_with_backoff'
      },
      
      // Throttling
      'ThrottledRequest': {
        status: 429,
        retryable: true,
        description: 'Request was throttled',
        action: 'retry_with_backoff'
      },
      'ThrottledRequestException': {
        status: 429,
        retryable: true,
        description: 'Request was throttled due to high load',
        action: 'retry_with_backoff'
      }
    };
    
    // Microsoft Graph API rate limits
    this.rateLimits = {
      // Per-application limits
      application: {
        requestsPerMinute: 10000,
        requestsPerHour: 100000,
        requestsPerDay: 1000000
      },
      // Per-user limits
      user: {
        requestsPerMinute: 1000,
        requestsPerHour: 10000,
        requestsPerDay: 100000
      },
      // Per-tenant limits
      tenant: {
        requestsPerMinute: 50000,
        requestsPerHour: 500000,
        requestsPerDay: 5000000
      }
    };
  }

  /**
   * Initialize logger lazily
   */
  async getLogger() {
    if (!this.logger) {
      this.logger = await createLogger();
    }
    return this.logger;
  }

  /**
   * Initialize retry service lazily
   */
  async getRetryService() {
    if (!this.retryService) {
      try {
        const { retryService } = await import('./retryService.js');
        this.retryService = retryService;
      } catch (error) {
        // Fallback retry service
        this.retryService = {
          executeWithRetry: async (operation, context) => {
            return await operation();
          }
        };
      }
    }
    return this.retryService;
  }

  /**
   * Handle Microsoft Graph API error
   * @param {Error|Response} error - The error to handle
   * @param {Object} context - Additional context
   * @returns {Object} Error handling result
   */
  async handleError(error, context = {}) {
    const errorInfo = this.analyzeError(error);
    
    // Add original error for debugging
    errorInfo.originalError = error;
    
    const handlingResult = {
      error: errorInfo,
      context,
      timestamp: new Date().toISOString(),
      retryable: errorInfo.retryable,
      action: errorInfo.action
    };

    // Log the error with Microsoft Graph specific information
    const logger = await this.getLogger();
    await this.logError(errorInfo, context, logger);

    // Handle specific error types
    switch (errorInfo.action) {
      case 'refresh_token':
        await this.handleTokenRefresh(errorInfo, context);
        break;
      case 'retry_with_backoff':
        await this.handleRetryableError(errorInfo, context);
        break;
      case 'check_permissions':
        await this.handlePermissionError(errorInfo, context);
        break;
      case 'skip_or_update':
        await this.handleConflictError(errorInfo, context);
        break;
    }
    
    // Always return consistent structure
    return handlingResult;
  }

  /**
   * Analyze error and extract Microsoft Graph specific information
   * @param {Error|Response} error - The error to analyze
   * @returns {Object} Error analysis result
   */
  analyzeError(error) {
    let status, code, message, details;

    // Handle Response objects
    if (error && typeof error.status === 'number') {
      status = error.status;
      // For Response objects, use statusText by default
      // In production, the caller should parse JSON before passing the error here
      message = error.statusText || 'Unknown error';
      
      // Try to extract error data if it's already available (not a promise)
      if (error.body && typeof error.body === 'object') {
        const errorData = error.body;
        code = errorData.error?.code || errorData.code;
        message = errorData.error?.message || errorData.message;
        details = errorData.error?.details || errorData.details;
      }
    } else if (error && error.message) {
      // Handle Error objects
      message = error.message;
      status = error.status || this.extractStatusFromMessage(message);
      code = error.code || this.extractCodeFromMessage(message);
    }

    // Get error definition
    const errorDef = this.errorCodes[code] || this.getGenericErrorDef(status);
    
    return {
      status,
      code,
      message,
      details,
      retryable: errorDef.retryable,
      action: errorDef.action,
      description: errorDef.description,
      originalError: error
    };
  }

  /**
   * Get generic error definition based on status code
   * @param {number} status - HTTP status code
   * @returns {Object} Generic error definition
   */
  getGenericErrorDef(status) {
    const genericErrors = {
      400: { retryable: false, action: 'fix_request', description: 'Bad Request' },
      401: { retryable: true, action: 'refresh_token', description: 'Unauthorized' },
      403: { retryable: false, action: 'check_permissions', description: 'Forbidden' },
      404: { retryable: false, action: 'check_resource', description: 'Not Found' },
      409: { retryable: false, action: 'skip_or_update', description: 'Conflict' },
      429: { retryable: true, action: 'retry_with_backoff', description: 'Too Many Requests' },
      500: { retryable: true, action: 'retry_with_backoff', description: 'Internal Server Error' },
      502: { retryable: true, action: 'retry_with_backoff', description: 'Bad Gateway' },
      503: { retryable: true, action: 'retry_with_backoff', description: 'Service Unavailable' },
      504: { retryable: true, action: 'retry_with_backoff', description: 'Gateway Timeout' }
    };

    return genericErrors[status] || { 
      retryable: false, 
      action: 'unknown', 
      description: 'Unknown Error' 
    };
  }

  /**
   * Extract status code from error message
   * @param {string} message - Error message
   * @returns {number|null} Status code
   */
  extractStatusFromMessage(message) {
    const statusMatch = message.match(/Status:\s*(\d+)/);
    return statusMatch ? parseInt(statusMatch[1]) : null;
  }

  /**
   * Extract error code from error message
   * @param {string} message - Error message
   * @returns {string|null} Error code
   */
  extractCodeFromMessage(message) {
    const codeMatch = message.match(/code[:\s]+([A-Za-z]+)/i);
    return codeMatch ? codeMatch[1] : null;
  }

  /**
   * Handle token refresh errors
   * @param {Object} errorInfo - Error information
   * @param {Object} context - Context information
   * @returns {Object} Handling result
   */
  async handleTokenRefresh(errorInfo, context) {
    const logger = await this.getLogger();
    logger.warn('Microsoft Graph token refresh required', {
      error: errorInfo,
      context,
      action: 'token_refresh'
    });

    return {
      ...errorInfo,
      handled: true,
      action: 'refresh_token',
      retryable: true,
      nextAction: 'retry_after_refresh'
    };
  }

  /**
   * Handle retryable errors with exponential backoff
   * @param {Object} errorInfo - Error information
   * @param {Object} context - Context information
   * @returns {Object} Handling result
   */
  async handleRetryableError(errorInfo, context) {
    const retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      jitter: true
    };

    const logger = await this.getLogger();
    logger.warn('Microsoft Graph retryable error detected', {
      error: errorInfo,
      context,
      retryConfig
    });

    return {
      ...errorInfo,
      handled: true,
      action: 'retry_with_backoff',
      retryable: true,
      retryConfig
    };
  }

  /**
   * Handle permission errors
   * @param {Object} errorInfo - Error information
   * @param {Object} context - Context information
   * @returns {Object} Handling result
   */
  async handlePermissionError(errorInfo, context) {
    const logger = await this.getLogger();
    logger.error('Microsoft Graph permission error', {
      error: errorInfo,
      context,
      action: 'check_permissions'
    });

    return {
      ...errorInfo,
      handled: true,
      action: 'check_permissions',
      retryable: false,
      nextAction: 'request_permissions'
    };
  }

  /**
   * Handle conflict errors (e.g., folder already exists)
   * @param {Object} errorInfo - Error information
   * @param {Object} context - Context information
   * @returns {Object} Handling result
   */
  async handleConflictError(errorInfo, context) {
    const logger = await this.getLogger();
    logger.warn('Microsoft Graph conflict error', {
      error: errorInfo,
      context,
      action: 'skip_or_update'
    });

    return {
      ...errorInfo,
      handled: true,
      action: 'skip_or_update',
      retryable: false,
      nextAction: 'skip_creation'
    };
  }

  /**
   * Log error with Microsoft Graph specific information
   * @param {Object} errorInfo - Error information
   * @param {Object} context - Context information
   * @param {Object} logger - Logger instance
   */
  async logError(errorInfo, context, logger) {
    const logData = {
      provider: 'microsoft_graph',
      error: {
        status: errorInfo.status,
        code: errorInfo.code,
        message: errorInfo.message,
        description: errorInfo.description
      },
      context: {
        operation: context.operation || 'unknown',
        userId: context.userId,
        folderName: context.folderName,
        endpoint: context.endpoint
      },
      retryable: errorInfo.retryable,
      action: errorInfo.action,
      timestamp: new Date().toISOString()
    };

    // Don't log skip_or_update actions as errors - they're expected behavior
    if (errorInfo.action === 'skip_or_update') {
      logger.info('Microsoft Graph folder already exists - treating as success', logData);
    } else if (errorInfo.retryable) {
      logger.warn('Microsoft Graph retryable error', logData);
    } else {
      logger.error('Microsoft Graph error', logData);
    }
  }

  /**
   * Check if error is retryable for Microsoft Graph API
   * @param {Error|Response} error - The error to check
   * @returns {boolean} Whether the error is retryable
   */
  isRetryable(error) {
    const errorInfo = this.analyzeError(error);
    return errorInfo.retryable;
  }

  /**
   * Get Microsoft Graph API rate limit configuration
   * @param {string} limitType - Type of rate limit (application, user, tenant)
   * @returns {Object} Rate limit configuration
   */
  getRateLimitConfig(limitType = 'user') {
    return this.rateLimits[limitType] || this.rateLimits.user;
  }

  /**
   * Create a retry wrapper for Microsoft Graph API operations
   * @param {Function} operation - The operation to wrap
   * @param {Object} options - Retry options
   * @returns {Function} Wrapped operation with retry logic
   */
  createRetryWrapper(operation, options = {}) {
    const retryOptions = {
      maxRetries: options.maxRetries || 3,
      baseDelay: options.baseDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      jitter: options.jitter !== false,
      ...options
    };

    return async (context = {}) => {
      const wrappedOperation = async () => {
        try {
          return await operation(context);
        } catch (error) {
          const errorInfo = await this.handleError(error, context);
          
          if (!errorInfo.retryable) {
            throw error;
          }
          
          throw error; // Let retry service handle the retry logic
        }
      };

      const retryService = await this.getRetryService();
      return await retryService.executeWithRetry(wrappedOperation, {
        operation: context.operation || 'microsoft_graph_operation',
        rateLimit: this.getRateLimitConfig(context.limitType),
        ...retryOptions
      });
    };
  }
}

// Export singleton instance
export const microsoftGraphErrorHandler = new MicrosoftGraphErrorHandler();

// Export utility functions
export const handleMicrosoftGraphError = (error, context) => {
  return microsoftGraphErrorHandler.handleError(error, context);
};

export const isMicrosoftGraphRetryable = (error) => {
  return microsoftGraphErrorHandler.isRetryable(error);
};

export const createMicrosoftGraphRetryWrapper = (operation, options) => {
  return microsoftGraphErrorHandler.createRetryWrapper(operation, options);
};
