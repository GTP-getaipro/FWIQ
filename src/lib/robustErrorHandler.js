import { supabase } from '@/lib/customSupabaseClient';

/**
 * Robust Error Handler - Provides comprehensive error handling and fallback mechanisms
 * Handles profile data validation failures and implements graceful degradation
 */
export class RobustErrorHandler {
  constructor(userId) {
    this.userId = userId;
    this.errorLog = [];
    this.fallbackStrategies = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
  }

  /**
   * Error types and their handling strategies
   */
  static get ERROR_TYPES() {
    return {
      VALIDATION_ERROR: {
        severity: 'high',
        retryable: false,
        fallbackStrategy: 'useDefaultValues',
        userMessage: 'There was an issue with your profile data. Using default values.'
      },
      DATABASE_ERROR: {
        severity: 'high',
        retryable: true,
        fallbackStrategy: 'useCachedData',
        userMessage: 'Database connection issue. Using cached data.'
      },
      TEMPLATE_ERROR: {
        severity: 'medium',
        retryable: true,
        fallbackStrategy: 'useFallbackTemplate',
        userMessage: 'Template loading issue. Using fallback template.'
      },
      INTEGRATION_ERROR: {
        severity: 'medium',
        retryable: true,
        fallbackStrategy: 'skipIntegration',
        userMessage: 'Integration issue. Skipping this step.'
      },
      NETWORK_ERROR: {
        severity: 'medium',
        retryable: true,
        fallbackStrategy: 'retryWithBackoff',
        userMessage: 'Network issue. Retrying...'
      },
      PERMISSION_ERROR: {
        severity: 'high',
        retryable: false,
        fallbackStrategy: 'requestPermission',
        userMessage: 'Permission required. Please grant access.'
      },
      RATE_LIMIT_ERROR: {
        severity: 'low',
        retryable: true,
        fallbackStrategy: 'waitAndRetry',
        userMessage: 'Rate limit reached. Waiting before retry...'
      }
    };
  }

  /**
   * Handle error with appropriate strategy
   * @param {Error} error - The error to handle
   * @param {string} context - Context where error occurred
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Error handling result
   */
  async handleError(error, context, options = {}) {
    const errorType = this.classifyError(error);
    const errorInfo = this.constructor.ERROR_TYPES[errorType];
    
    // Log the error
    this.logError(error, context, errorType, options);
    
    // Check if we should retry
    if (errorInfo.retryable && this.shouldRetry(context)) {
      return await this.retryOperation(error, context, options);
    }
    
    // Apply fallback strategy
    return await this.applyFallbackStrategy(errorType, error, context, options);
  }

  /**
   * Classify error type based on error properties
   * @param {Error} error - The error to classify
   * @returns {string} - Error type
   */
  classifyError(error) {
    if (error.message.includes('validation')) return 'VALIDATION_ERROR';
    if (error.message.includes('database') || error.message.includes('supabase')) return 'DATABASE_ERROR';
    if (error.message.includes('template') || error.message.includes('import')) return 'TEMPLATE_ERROR';
    if (error.message.includes('integration') || error.message.includes('oauth')) return 'INTEGRATION_ERROR';
    if (error.message.includes('network') || error.message.includes('fetch')) return 'NETWORK_ERROR';
    if (error.message.includes('permission') || error.message.includes('unauthorized')) return 'PERMISSION_ERROR';
    if (error.message.includes('rate limit') || error.message.includes('429')) return 'RATE_LIMIT_ERROR';
    
    return 'VALIDATION_ERROR'; // Default fallback
  }

  /**
   * Log error with context
   * @param {Error} error - The error
   * @param {string} context - Context where error occurred
   * @param {string} errorType - Classified error type
   * @param {object} options - Additional options
   */
  logError(error, context, errorType, options) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      userId: this.userId,
      context,
      errorType,
      message: error.message,
      stack: error.stack,
      options,
      severity: this.constructor.ERROR_TYPES[errorType].severity
    };
    
    this.errorLog.push(errorLog);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
    
    // Send to external logging service if available
    this.sendToExternalLogger(errorLog);
  }

  /**
   * Send error to external logging service
   * @param {object} errorLog - Error log entry
   */
  async sendToExternalLogger(errorLog) {
    try {
      // Only send high severity errors to external logger
      if (errorLog.severity === 'high') {
        // FIXME: error_logs table doesn't exist, using email_logs or skip for now
        // await supabase
        //   .from('error_logs')
        //   .insert({
        //     user_id: this.userId,
        //     error_type: errorLog.errorType,
        //     context: errorLog.context,
        //     message: errorLog.message,
        //     severity: errorLog.severity,
        //     metadata: errorLog.options,
        //     created_at: errorLog.timestamp
        //   });
      }
    } catch (loggingError) {
      console.error('Failed to log error to external service:', loggingError);
    }
  }

  /**
   * Retry operation with exponential backoff
   * @param {Error} error - The original error
   * @param {string} context - Operation context
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Retry result
   */
  async retryOperation(error, context, options) {
    const attempts = this.retryAttempts.get(context) || 0;
    const delay = this.retryDelay * Math.pow(2, attempts); // Exponential backoff
    
    this.retryAttempts.set(context, attempts + 1);
    
    console.log(`Retrying ${context} operation (attempt ${attempts + 1}/${this.maxRetries}) after ${delay}ms`);
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Return retry instruction
    return {
      success: false,
      shouldRetry: true,
      attempt: attempts + 1,
      maxAttempts: this.maxRetries,
      delay,
      error: error.message
    };
  }

  /**
   * Apply fallback strategy based on error type
   * @param {string} errorType - Error type
   * @param {Error} error - Original error
   * @param {string} context - Operation context
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Fallback result
   */
  async applyFallbackStrategy(errorType, error, context, options) {
    const errorInfo = this.constructor.ERROR_TYPES[errorType];
    const strategy = errorInfo.fallbackStrategy;
    
    try {
      switch (strategy) {
        case 'useDefaultValues':
          return await this.useDefaultValues(context, options);
        
        case 'useCachedData':
          return await this.useCachedData(context, options);
        
        case 'useFallbackTemplate':
          return await this.useFallbackTemplate(context, options);
        
        case 'skipIntegration':
          return await this.skipIntegration(context, options);
        
        case 'requestPermission':
          return await this.requestPermission(context, options);
        
        case 'waitAndRetry':
          return await this.waitAndRetry(context, options);
        
        default:
          return await this.useDefaultValues(context, options);
      }
    } catch (fallbackError) {
      console.error(`Fallback strategy ${strategy} failed:`, fallbackError);
      return {
        success: false,
        error: `Fallback failed: ${fallbackError.message}`,
        originalError: error.message,
        context
      };
    }
  }

  /**
   * Use default values as fallback
   * @param {string} context - Operation context
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Default values result
   */
  async useDefaultValues(context, options) {
    const defaultValues = {
      profile: {
        business: {
          name: 'Your Business',
          types: ['General Construction'],
          primaryType: 'General Construction',
          timezone: 'America/New_York',
          currency: 'USD',
          emailDomain: 'yourbusiness.com',
          businessHours: {
            mon_fri: '09:00-18:00',
            sat: '10:00-16:00',
            sun: 'Closed'
          }
        },
        contact: {
          primaryContactName: 'Business Owner',
          primaryContactRole: 'Owner',
          primaryContactEmail: 'owner@yourbusiness.com',
          responseSLA: '24h'
        },
        team: {
          managers: [{ name: 'Business Owner', email: 'owner@yourbusiness.com', role: 'Owner' }],
          suppliers: []
        },
        rules: {
          defaultReplyTone: 'Friendly',
          language: 'en',
          allowPricing: false,
          includeSignature: true,
          signatureText: 'Best regards,\nThe Team'
        }
      },
      template: {
        type: 'fallback',
        businessTypes: ['General Construction'],
        template: {
          name: 'Default Automation Workflow',
          nodes: [],
          connections: {},
          settings: { executionOrder: 'v1' }
        }
      }
    };

    return {
      success: true,
      data: defaultValues[context] || defaultValues.profile,
      fallback: true,
      strategy: 'useDefaultValues',
      message: 'Using default values due to validation error'
    };
  }

  /**
   * Use cached data as fallback
   * @param {string} context - Operation context
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Cached data result
   */
  async useCachedData(context, options) {
    try {
      // Try to get cached data from localStorage or sessionStorage
      const cacheKey = `floworx_${context}_${this.userId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        
        // Use cache if it's less than 1 hour old
        if (cacheAge < 60 * 60 * 1000) {
          return {
            success: true,
            data: parsed.data,
            fallback: true,
            strategy: 'useCachedData',
            cacheAge: Math.round(cacheAge / 1000 / 60), // Age in minutes
            message: 'Using cached data due to database error'
          };
        }
      }
      
      // If no valid cache, fall back to default values
      return await this.useDefaultValues(context, options);
      
    } catch (error) {
      console.error('Failed to use cached data:', error);
      return await this.useDefaultValues(context, options);
    }
  }

  /**
   * Use fallback template
   * @param {string} context - Operation context
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Fallback template result
   */
  async useFallbackTemplate(context, options) {
    const fallbackTemplate = {
      name: 'Fallback Automation Workflow',
      nodes: [
        {
          id: 'webhook-trigger',
          name: 'Webhook Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [240, 300],
          parameters: {
            path: 'fallback-webhook',
            httpMethod: 'POST',
            responseMode: 'responseNode'
          }
        },
        {
          id: 'basic-processor',
          name: 'Basic Email Processor',
          type: 'n8n-nodes-base.function',
          typeVersion: 1,
          position: [460, 300],
          parameters: {
            functionCode: `
              // Basic email processing with fallback
              const email = $json;
              
              return [{
                json: {
                  processed: true,
                  fallback: true,
                  timestamp: new Date().toISOString(),
                  emailSubject: email.subject || 'No Subject',
                  emailFrom: email.from || 'Unknown Sender',
                  status: 'processed_with_fallback'
                }
              }];
            `
          }
        },
        {
          id: 'fallback-response',
          name: 'Fallback Response',
          type: 'n8n-nodes-base.respondToWebhook',
          typeVersion: 1,
          position: [680, 300],
          parameters: {
            respondWith: 'json',
            responseBody: '={{ { status: "processed", fallback: true, message: "Email processed using fallback template" } }}'
          }
        }
      ],
      connections: {
        'Webhook Trigger': {
          main: [[{ node: 'Basic Email Processor', type: 'main', index: 0 }]]
        },
        'Basic Email Processor': {
          main: [[{ node: 'Fallback Response', type: 'main', index: 0 }]]
        }
      },
      settings: { executionOrder: 'v1' },
      metadata: {
        isFallback: true,
        fallbackReason: 'Template loading failed',
        businessTypes: options.businessTypes || ['General Construction']
      }
    };

    return {
      success: true,
      data: fallbackTemplate,
      fallback: true,
      strategy: 'useFallbackTemplate',
      message: 'Using fallback template due to template loading error'
    };
  }

  /**
   * Skip integration step
   * @param {string} context - Operation context
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Skip integration result
   */
  async skipIntegration(context, options) {
    return {
      success: true,
      data: null,
      fallback: true,
      strategy: 'skipIntegration',
      skipped: true,
      message: 'Integration step skipped due to error',
      integration: options.integration || 'unknown'
    };
  }

  /**
   * Request permission from user
   * @param {string} context - Operation context
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Permission request result
   */
  async requestPermission(context, options) {
    return {
      success: false,
      requiresPermission: true,
      permission: options.permission || 'unknown',
      context,
      message: 'Permission required to continue',
      strategy: 'requestPermission'
    };
  }

  /**
   * Wait and retry operation
   * @param {string} context - Operation context
   * @param {object} options - Additional options
   * @returns {Promise<object>} - Wait and retry result
   */
  async waitAndRetry(context, options) {
    const waitTime = options.waitTime || 5000; // 5 seconds default
    
    return {
      success: false,
      shouldRetry: true,
      waitTime,
      strategy: 'waitAndRetry',
      message: `Waiting ${waitTime}ms before retry due to rate limit`
    };
  }

  /**
   * Get error statistics
   * @returns {object} - Error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByType: {},
      errorsByContext: {},
      errorsBySeverity: {},
      recentErrors: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(error => {
      // Count by type
      stats.errorsByType[error.errorType] = (stats.errorsByType[error.errorType] || 0) + 1;
      
      // Count by context
      stats.errorsByContext[error.context] = (stats.errorsByContext[error.context] || 0) + 1;
      
      // Count by severity
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    this.errorLog = [];
    this.retryAttempts.clear();
  }

  /**
   * Reset retry attempts for a context
   * @param {string} context - Context to reset
   */
  resetRetryAttempts(context) {
    this.retryAttempts.delete(context);
  }

  /**
   * Cache data for fallback use
   * @param {string} context - Context for caching
   * @param {object} data - Data to cache
   */
  cacheData(context, data) {
    try {
      const cacheKey = `floworx_${context}_${this.userId}`;
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * Check if operation should be retried
   * @param {string} context - Operation context
   * @returns {boolean} - Whether to retry
   */
  shouldRetry(context) {
    const attempts = this.retryAttempts.get(context) || 0;
    return attempts < this.maxRetries;
  }
}

/**
 * Convenience function to get robust error handler instance
 * @param {string} userId - The user ID
 * @returns {RobustErrorHandler} - Handler instance
 */
export const getRobustErrorHandler = (userId) => {
  return new RobustErrorHandler(userId);
};

/**
 * React hook for robust error handling
 * @param {string} userId - The user ID
 * @returns {object} - Error handler methods
 */
export const useRobustErrorHandler = (userId) => {
  const handler = new RobustErrorHandler(userId);
  
  return {
    handleError: handler.handleError.bind(handler),
    getErrorStats: handler.getErrorStats.bind(handler),
    clearErrorLogs: handler.clearErrorLogs.bind(handler),
    resetRetryAttempts: handler.resetRetryAttempts.bind(handler),
    cacheData: handler.cacheData.bind(handler)
  };
};
