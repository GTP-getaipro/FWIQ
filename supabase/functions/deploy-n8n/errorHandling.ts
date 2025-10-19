/**
 * Error Handling and Retry Logic for Deploy-N8N Edge Function
 * 
 * Purpose: Handle transient failures gracefully with exponential backoff
 * Benefits:
 * - Handles network failures
 * - Reduces deployment failures
 * - Better reliability
 * - Automatic recovery from transient errors
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  monitoringPeriodMs?: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

// ============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    onRetry,
    shouldRetry = () => true
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (!shouldRetry(lastError)) {
        throw lastError;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        delayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      console.warn(
        `[Retry] Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}. ` +
        `Retrying in ${delay}ms...`
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

/**
 * Circuit Breaker implementation
 * Prevents cascading failures by failing fast when a service is down
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  
  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeoutMs: options.resetTimeoutMs || 60000, // 1 minute
      monitoringPeriodMs: options.monitoringPeriodMs || 10000 // 10 seconds
    };
  }
  
  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      const timeSinceLastFailure = now - this.lastFailureTime;
      
      // Check if we should try to reset
      if (timeSinceLastFailure >= this.options.resetTimeoutMs!) {
        console.log(`[CircuitBreaker:${this.name}] Attempting to reset (HALF_OPEN)`);
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        const waitTime = Math.ceil((this.options.resetTimeoutMs! - timeSinceLastFailure) / 1000);
        throw new Error(
          `Circuit breaker "${this.name}" is OPEN. ` +
          `Retry in ${waitTime} seconds.`
        );
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      // After 3 successful calls in HALF_OPEN, close the circuit
      if (this.successCount >= 3) {
        console.log(`[CircuitBreaker:${this.name}] Circuit CLOSED after successful recovery`);
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      // If we fail in HALF_OPEN, go back to OPEN
      console.error(`[CircuitBreaker:${this.name}] Circuit OPEN (failed during recovery)`);
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (this.failures >= this.options.failureThreshold!) {
      // If we exceed failure threshold, open the circuit
      console.error(
        `[CircuitBreaker:${this.name}] Circuit OPEN ` +
        `(${this.failures} failures exceeded threshold of ${this.options.failureThreshold})`
      );
      this.state = CircuitState.OPEN;
    }
  }
  
  /**
   * Get current circuit state
   */
  getState(): {
    name: string;
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
  } {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
  
  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual reset`);
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('etimedout')
  ) {
    return true;
  }
  
  // HTTP status codes that are retryable
  if (message.includes('status code')) {
    const statusMatch = message.match(/status code (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      // Retry on 5xx errors and 429 (rate limit)
      return status >= 500 || status === 429;
    }
  }
  
  // Supabase errors
  if (message.includes('connection') || message.includes('pool')) {
    return true;
  }
  
  return false;
}

/**
 * Check if an error is a validation error (not retryable)
 */
export function isValidationError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  return (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('must be')
  );
}

// ============================================================================
// CIRCUIT BREAKER INSTANCES
// ============================================================================

// Circuit breakers for external services
export const n8nCircuitBreaker = new CircuitBreaker('n8n', {
  failureThreshold: 5,
  resetTimeoutMs: 60000 // 1 minute
});

export const supabaseCircuitBreaker = new CircuitBreaker('supabase', {
  failureThreshold: 5,
  resetTimeoutMs: 30000 // 30 seconds
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Wrap a fetch call with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);
      
      // Throw on non-2xx responses
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }
      
      return response;
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
      shouldRetry: isRetryableError,
      ...retryOptions
    }
  );
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: Error,
  code?: string
): Response {
  const errorResponse = {
    success: false,
    error: error.message,
    code: code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  };
  
  const status = isValidationError(error) ? 400 : 500;
  
  return new Response(
    JSON.stringify(errorResponse),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  retryWithBackoff,
  CircuitBreaker,
  isRetryableError,
  isValidationError,
  fetchWithRetry,
  createErrorResponse,
  n8nCircuitBreaker,
  supabaseCircuitBreaker
};

