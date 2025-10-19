/**
 * Logger Service
 * Centralized logging with structured output and multiple destinations
 */

export class Logger {
  constructor() {
    this.logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
    this.environment = import.meta.env.MODE || 'development';
    this.service = 'floworx-frontend';
    this.version = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    // Log levels hierarchy
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
  }

  /**
   * Check if log level should be output
   * @param {string} level - Log level
   * @returns {boolean} Should log
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  /**
   * Create structured log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {Object} context - Context information
   * @returns {Object} Structured log entry
   */
  createLogEntry(level, message, data = {}, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      service: this.service,
      version: this.version,
      environment: this.environment,
      message,
      data: {
        ...data,
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      }
    };
  }

  /**
   * Output log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {Object} context - Context information
   */
  log(level, message, data = {}, context = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.createLogEntry(level, message, data, context);
    
    // Console output with appropriate method
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 'log';
    
    if (this.environment === 'development') {
      // Pretty print for development
      console[consoleMethod](`[${logEntry.timestamp}] ${logEntry.level}: ${message}`, data);
    } else {
      // JSON output for production
      console[consoleMethod](JSON.stringify(logEntry));
    }

    // Send to external logging service in production
    if (this.environment === 'production') {
      this.sendToLogService(logEntry).catch(error => {
        console.error('Failed to send log to external service:', error);
      });
    }
  }

  /**
   * Send log to external logging service
   * @param {Object} logEntry - Log entry
   */
  async sendToLogService(logEntry) {
    try {
      // Send to backend logging endpoint
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        throw new Error(`Log service responded with ${response.status}`);
      }
    } catch (error) {
      // Don't log logging errors to avoid infinite loops
      console.error('Logging service error:', error);
    }
  }

  /**
   * Log error with stack trace
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or data
   * @param {Object} context - Additional context
   */
  error(message, error = {}, context = {}) {
    const errorData = {
      ...error,
      stack: error.stack || null,
      name: error.name || 'Error'
    };

    this.log('error', message, errorData, context);
  }

  /**
   * Log warning
   * @param {string} message - Warning message
   * @param {Object} data - Additional data
   * @param {Object} context - Additional context
   */
  warn(message, data = {}, context = {}) {
    this.log('warn', message, data, context);
  }

  /**
   * Log informational message
   * @param {string} message - Info message
   * @param {Object} data - Additional data
   * @param {Object} context - Additional context
   */
  info(message, data = {}, context = {}) {
    this.log('info', message, data, context);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} data - Additional data
   * @param {Object} context - Additional context
   */
  debug(message, data = {}, context = {}) {
    this.log('debug', message, data, context);
  }

  /**
   * Log trace message
   * @param {string} message - Trace message
   * @param {Object} data - Additional data
   * @param {Object} context - Additional context
   */
  trace(message, data = {}, context = {}) {
    this.log('trace', message, data, context);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  performance(operation, duration, metadata = {}) {
    this.info('Performance metric', {
      operation,
      duration,
      ...metadata
    }, { type: 'performance' });
  }

  /**
   * Log user action
   * @param {string} action - User action
   * @param {Object} data - Action data
   * @param {Object} context - User context
   */
  userAction(action, data = {}, context = {}) {
    this.info('User action', {
      action,
      ...data
    }, { type: 'user_action', ...context });
  }

  /**
   * Log API request
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} status - Response status
   * @param {number} duration - Request duration
   * @param {Object} metadata - Additional metadata
   */
  apiRequest(method, url, status, duration, metadata = {}) {
    const level = status >= 400 ? 'warn' : 'info';
    
    this.log(level, 'API request', {
      method,
      url,
      status,
      duration,
      ...metadata
    }, { type: 'api_request' });
  }

  /**
   * Log business event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @param {Object} context - Business context
   */
  businessEvent(event, data = {}, context = {}) {
    this.info('Business event', {
      event,
      ...data
    }, { type: 'business_event', ...context });
  }

  /**
   * Create child logger with additional context
   * @param {Object} context - Additional context
   * @returns {Logger} Child logger
   */
  child(context) {
    const childLogger = new Logger();
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  /**
   * Set log level dynamically
   * @param {string} level - New log level
   */
  setLogLevel(level) {
    if (this.levels.hasOwnProperty(level)) {
      this.logLevel = level;
      this.info('Log level changed', { newLevel: level });
    } else {
      this.warn('Invalid log level', { attemptedLevel: level });
    }
  }

  /**
   * Get current log level
   * @returns {string} Current log level
   */
  getLogLevel() {
    return this.logLevel;
  }

  /**
   * Log system health check
   * @param {Object} healthData - Health check data
   */
  healthCheck(healthData = {}) {
    this.info('Health check', {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ...healthData
    }, { type: 'health_check' });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export default Logger;
