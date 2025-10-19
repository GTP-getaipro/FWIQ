/**
 * Retry Service
 * Advanced retry logic with circuit breaker pattern and rate limiting
 */

import { logger } from './logger';

export class RetryService {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.jitter = options.jitter !== false; // Enable jitter by default
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5;
    this.circuitBreakerTimeout = options.circuitBreakerTimeout || 60000; // 1 minute
    this.rateLimitDelay = options.rateLimitDelay || 1000;
    
    this.circuitBreakers = new Map();
    this.logger = logger;
  }

  async executeWithRetry(operation, context = {}) {
    const operationKey = context.operation || 'unknown';
    
    // Check circuit breaker
    if (this.isCircuitOpen(operationKey)) {
      throw new Error(`Circuit breaker is open for operation: ${operationKey}`);
    }

    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.executeOperation(operation, context);
        
        // Reset circuit breaker on success
        this.resetCircuitBreaker(operationKey);
        
        if (attempt > 0) {
          this.logger.info(`Operation succeeded on attempt ${attempt + 1}`, {
            operation: operationKey,
            attempt: attempt + 1
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryable(error)) {
          this.logger.error('Non-retryable error encountered', {
            operation: operationKey,
            error: error.message
          });
          throw error;
        }

        // Check if we've reached max retries
        if (attempt === this.maxRetries) {
          this.recordCircuitBreakerFailure(operationKey);
          this.logger.error('Max retries exceeded', {
            operation: operationKey,
            maxRetries: this.maxRetries,
            error: error.message
          });
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, error);
        
        this.logger.warn(`Operation failed, retrying in ${delay}ms`, {
          operation: operationKey,
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          error: error.message,
          delay
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  async executeOperation(operation, context) {
    // Handle rate limiting
    if (context.rateLimit) {
      await this.handleRateLimit(context.rateLimit);
    }

    // Execute the actual operation
    if (typeof operation === 'function') {
      return await operation();
    } else if (typeof operation === 'object' && operation.execute) {
      return await operation.execute();
    } else {
      throw new Error('Invalid operation provided');
    }
  }

  isRetryable(error) {
    // Network errors
    const networkErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'TIMEOUT'
    ];

    // HTTP status codes
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

    // Check error message
    const errorMessage = error.message?.toUpperCase() || '';
    const isNetworkError = networkErrors.some(pattern => 
      errorMessage.includes(pattern)
    );

    // Check error code
    const isNetworkCode = networkErrors.includes(error.code);

    // Check HTTP status
    const isRetryableStatus = error.status && retryableStatusCodes.includes(error.status);

    // Check for rate limiting
    const isRateLimited = error.status === 429 || errorMessage.includes('RATE_LIMITED');

    return isNetworkError || isNetworkCode || isRetryableStatus || isRateLimited;
  }

  calculateDelay(attempt, error) {
    // Base exponential backoff
    let delay = Math.min(
      this.baseDelay * Math.pow(2, attempt),
      this.maxDelay
    );

    // Add jitter to prevent thundering herd
    if (this.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    // Special handling for rate limiting
    if (error.status === 429) {
      const retryAfter = error.headers?.['retry-after'] || error.headers?.['Retry-After'];
      if (retryAfter) {
        delay = parseInt(retryAfter) * 1000;
      } else {
        delay = Math.max(delay, this.rateLimitDelay);
      }
    }

    return Math.max(delay, 100); // Minimum 100ms delay
  }

  async handleRateLimit(rateLimitConfig) {
    const { requestsPerMinute = 60, requestsPerHour = 1000 } = rateLimitConfig;
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const hour = Math.floor(now / 3600000);

    // Simple in-memory rate limiting (in production, use Redis or similar)
    if (!this.rateLimitTracker) {
      this.rateLimitTracker = new Map();
    }

    const minuteKey = `minute_${minute}`;
    const hourKey = `hour_${hour}`;

    const minuteCount = this.rateLimitTracker.get(minuteKey) || 0;
    const hourCount = this.rateLimitTracker.get(hourKey) || 0;

    if (minuteCount >= requestsPerMinute) {
      const delay = 60000 - (now % 60000); // Wait until next minute
      this.logger.warn(`Rate limit exceeded (per minute), waiting ${delay}ms`);
      await this.sleep(delay);
    }

    if (hourCount >= requestsPerHour) {
      const delay = 3600000 - (now % 3600000); // Wait until next hour
      this.logger.warn(`Rate limit exceeded (per hour), waiting ${delay}ms`);
      await this.sleep(delay);
    }

    // Update counters
    this.rateLimitTracker.set(minuteKey, minuteCount + 1);
    this.rateLimitTracker.set(hourKey, hourCount + 1);

    // Clean up old entries
    this.cleanupRateLimitTracker();
  }

  cleanupRateLimitTracker() {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const currentHour = Math.floor(now / 3600000);

    for (const [key] of this.rateLimitTracker) {
      if (key.startsWith('minute_')) {
        const minute = parseInt(key.split('_')[1]);
        if (minute < currentMinute - 1) {
          this.rateLimitTracker.delete(key);
        }
      } else if (key.startsWith('hour_')) {
        const hour = parseInt(key.split('_')[1]);
        if (hour < currentHour - 1) {
          this.rateLimitTracker.delete(key);
        }
      }
    }
  }

  // Circuit breaker implementation
  isCircuitOpen(operationKey) {
    const circuit = this.circuitBreakers.get(operationKey);
    if (!circuit) return false;

    if (circuit.state === 'OPEN') {
      const now = Date.now();
      if (now - circuit.lastFailureTime > this.circuitBreakerTimeout) {
        circuit.state = 'HALF_OPEN';
        this.logger.info(`Circuit breaker moved to HALF_OPEN for ${operationKey}`);
      }
    }

    return circuit.state === 'OPEN';
  }

  recordCircuitBreakerFailure(operationKey) {
    let circuit = this.circuitBreakers.get(operationKey);
    
    if (!circuit) {
      circuit = {
        failures: 0,
        state: 'CLOSED',
        lastFailureTime: null
      };
      this.circuitBreakers.set(operationKey, circuit);
    }

    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.failures >= this.circuitBreakerThreshold) {
      circuit.state = 'OPEN';
      this.logger.error(`Circuit breaker opened for ${operationKey}`, {
        failures: circuit.failures,
        threshold: this.circuitBreakerThreshold
      });
    }
  }

  resetCircuitBreaker(operationKey) {
    const circuit = this.circuitBreakers.get(operationKey);
    if (circuit) {
      circuit.failures = 0;
      circuit.state = 'CLOSED';
      this.logger.info(`Circuit breaker reset for ${operationKey}`);
    }
  }

  // Utility methods
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get circuit breaker status
  getCircuitBreakerStatus(operationKey) {
    const circuit = this.circuitBreakers.get(operationKey);
    return circuit ? {
      state: circuit.state,
      failures: circuit.failures,
      lastFailureTime: circuit.lastFailureTime
    } : null;
  }

  // Get all circuit breaker statuses
  getAllCircuitBreakerStatuses() {
    const statuses = {};
    for (const [key, circuit] of this.circuitBreakers) {
      statuses[key] = {
        state: circuit.state,
        failures: circuit.failures,
        lastFailureTime: circuit.lastFailureTime
      };
    }
    return statuses;
  }

  // Reset all circuit breakers
  resetAllCircuitBreakers() {
    for (const [key] of this.circuitBreakers) {
      this.resetCircuitBreaker(key);
    }
    this.logger.info('All circuit breakers reset');
  }

  // Create a retry decorator for functions
  createRetryDecorator(options = {}) {
    const retryService = new RetryService(options);
    
    return (operation, context = {}) => {
      return retryService.executeWithRetry(operation, context);
    };
  }
}

// Export a default instance
export const retryService = new RetryService();

// Export utility functions
export const withRetry = (operation, options = {}) => {
  const service = new RetryService(options);
  return service.executeWithRetry(operation);
};

export const createRetryWrapper = (options = {}) => {
  const service = new RetryService(options);
  return service.createRetryDecorator(options);
};
