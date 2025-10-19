/**
 * Workflow Error Recovery System
 * Handles error recovery strategies for workflow execution failures
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class WorkflowErrorRecovery {
  constructor() {
    this.recoveryStrategies = new Map();
    this.errorPatterns = new Map();
    this.retryPolicies = new Map();
    this.fallbackActions = new Map();
    
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default error recovery strategies
   */
  initializeDefaultStrategies() {
    // Retry strategies
    this.retryPolicies.set('network_error', {
      maxRetries: 3,
      backoffMultiplier: 2,
      baseDelay: 1000,
      maxDelay: 10000
    });

    this.retryPolicies.set('timeout_error', {
      maxRetries: 2,
      backoffMultiplier: 1.5,
      baseDelay: 2000,
      maxDelay: 8000
    });

    this.retryPolicies.set('rate_limit', {
      maxRetries: 5,
      backoffMultiplier: 2,
      baseDelay: 5000,
      maxDelay: 30000
    });

    // Fallback actions
    this.fallbackActions.set('email_send_failure', 'queue_for_retry');
    this.fallbackActions.set('api_call_failure', 'use_cached_data');
    this.fallbackActions.set('data_processing_failure', 'skip_step');
    this.fallbackActions.set('notification_failure', 'log_and_continue');

    // Error patterns for classification
    this.errorPatterns.set('network', /network|connection|timeout|unreachable/i);
    this.errorPatterns.set('authentication', /auth|token|permission|unauthorized/i);
    this.errorPatterns.set('validation', /validation|invalid|required|missing/i);
    this.errorPatterns.set('rate_limit', /rate.?limit|too.?many|quota|throttle/i);
    this.errorPatterns.set('server_error', /server|internal|service.?unavailable|bad.?gateway/i);
  }

  /**
   * Classify error type based on error message
   * @param {Error} error - The error to classify
   * @returns {string} Error classification
   */
  classifyError(error) {
    const errorMessage = error.message || error.toString();
    
    for (const [type, pattern] of this.errorPatterns) {
      if (pattern.test(errorMessage)) {
        return type;
      }
    }
    
    return 'unknown';
  }

  /**
   * Get recovery strategy for error type
   * @param {string} errorType - Type of error
   * @param {Object} context - Execution context
   * @returns {Object} Recovery strategy
   */
  getRecoveryStrategy(errorType, context = {}) {
    const strategy = {
      action: 'retry',
      maxRetries: 1,
      delay: 1000,
      fallback: null,
      escalate: false
    };

    // Get retry policy for error type
    const retryPolicy = this.retryPolicies.get(errorType);
    if (retryPolicy) {
      strategy.maxRetries = retryPolicy.maxRetries;
      strategy.delay = retryPolicy.baseDelay;
      strategy.backoffMultiplier = retryPolicy.backoffMultiplier;
      strategy.maxDelay = retryPolicy.maxDelay;
    }

    // Get fallback action
    const fallbackAction = this.fallbackActions.get(errorType);
    if (fallbackAction) {
      strategy.fallback = fallbackAction;
    }

    // Custom strategy based on context
    if (context.workflowType) {
      const customStrategy = this.recoveryStrategies.get(context.workflowType);
      if (customStrategy) {
        return { ...strategy, ...customStrategy };
      }
    }

    return strategy;
  }

  /**
   * Execute recovery strategy
   * @param {Error} error - The error that occurred
   * @param {Object} context - Execution context
   * @param {Function} retryFunction - Function to retry
   * @returns {Promise<Object>} Recovery result
   */
  async executeRecovery(error, context, retryFunction) {
    const errorType = this.classifyError(error);
    const strategy = this.getRecoveryStrategy(errorType, context);
    
    logger.info('Executing error recovery strategy', {
      errorType,
      strategy,
      context: {
        workflowId: context.workflowId,
        nodeId: context.nodeId,
        step: context.step
      }
    });

    // Try retry strategy first
    if (strategy.action === 'retry' && strategy.maxRetries > 0) {
      const retryResult = await this.executeRetryStrategy(
        error,
        context,
        retryFunction,
        strategy
      );
      
      if (retryResult.success) {
        return retryResult;
      }
    }

    // Execute fallback strategy
    if (strategy.fallback) {
      return await this.executeFallbackStrategy(
        error,
        context,
        strategy.fallback
      );
    }

    // Escalate if no recovery possible
    if (strategy.escalate) {
      return await this.escalateError(error, context);
    }

    // Default: return failure
    return {
      success: false,
      error: error.message,
      errorType,
      recoveryAttempted: true,
      finalAction: 'failed'
    };
  }

  /**
   * Execute retry strategy
   * @param {Error} error - Original error
   * @param {Object} context - Execution context
   * @param {Function} retryFunction - Function to retry
   * @param {Object} strategy - Retry strategy
   * @returns {Promise<Object>} Retry result
   */
  async executeRetryStrategy(error, context, retryFunction, strategy) {
    let delay = strategy.delay;
    let lastError = error;

    for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
      try {
        logger.info('Retry attempt', {
          attempt,
          maxRetries: strategy.maxRetries,
          delay,
          context: {
            workflowId: context.workflowId,
            nodeId: context.nodeId
          }
        });

        // Wait before retry
        if (attempt > 1) {
          await this.sleep(delay);
        }

        // Execute retry
        const result = await retryFunction();
        
        logger.info('Retry successful', {
          attempt,
          context: {
            workflowId: context.workflowId,
            nodeId: context.nodeId
          }
        });

        return {
          success: true,
          result,
          attempts: attempt,
          recoveryMethod: 'retry'
        };

      } catch (retryError) {
        lastError = retryError;
        
        logger.warn('Retry attempt failed', {
          attempt,
          error: retryError.message,
          context: {
            workflowId: context.workflowId,
            nodeId: context.nodeId
          }
        });

        // Calculate next delay with backoff
        if (strategy.backoffMultiplier) {
          delay = Math.min(
            delay * strategy.backoffMultiplier,
            strategy.maxDelay
          );
        }
      }
    }

    return {
      success: false,
      error: lastError.message,
      attempts: strategy.maxRetries,
      recoveryMethod: 'retry_failed'
    };
  }

  /**
   * Execute fallback strategy
   * @param {Error} error - Original error
   * @param {Object} context - Execution context
   * @param {string} fallbackAction - Fallback action to execute
   * @returns {Promise<Object>} Fallback result
   */
  async executeFallbackStrategy(error, context, fallbackAction) {
    logger.info('Executing fallback strategy', {
      fallbackAction,
      error: error.message,
      context: {
        workflowId: context.workflowId,
        nodeId: context.nodeId
      }
    });

    try {
      let result;

      switch (fallbackAction) {
        case 'queue_for_retry':
          result = await this.queueForRetry(context);
          break;
          
        case 'use_cached_data':
          result = await this.useCachedData(context);
          break;
          
        case 'skip_step':
          result = await this.skipStep(context);
          break;
          
        case 'log_and_continue':
          result = await this.logAndContinue(error, context);
          break;
          
        case 'use_alternative_provider':
          result = await this.useAlternativeProvider(context);
          break;
          
        default:
          result = {
            success: false,
            error: `Unknown fallback action: ${fallbackAction}`
          };
      }

      return {
        success: result.success,
        result: result.result,
        recoveryMethod: 'fallback',
        fallbackAction
      };

    } catch (fallbackError) {
      logger.error('Fallback strategy failed', {
        fallbackAction,
        error: fallbackError.message,
        context: {
          workflowId: context.workflowId,
          nodeId: context.nodeId
        }
      });

      return {
        success: false,
        error: fallbackError.message,
        recoveryMethod: 'fallback_failed',
        fallbackAction
      };
    }
  }

  /**
   * Queue workflow for retry
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Queue result
   */
  async queueForRetry(context) {
    try {
      const { error } = await supabase
        .from('workflow_retry_queue')
        .insert({
          workflow_id: context.workflowId,
          node_id: context.nodeId,
          retry_count: 0,
          max_retries: 3,
          scheduled_at: new Date(Date.now() + 60000).toISOString(), // Retry in 1 minute
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return {
        success: true,
        result: { queued: true, retryIn: 60000 }
      };

    } catch (error) {
      logger.error('Failed to queue workflow for retry', {
        error: error.message,
        context: {
          workflowId: context.workflowId,
          nodeId: context.nodeId
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Use cached data as fallback
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Cached data result
   */
  async useCachedData(context) {
    try {
      const { data, error } = await supabase
        .from('workflow_cache')
        .select('*')
        .eq('workflow_id', context.workflowId)
        .eq('node_id', context.nodeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

      if (data) {
        return {
          success: true,
          result: {
            cached: true,
            data: data.cached_data,
            cachedAt: data.created_at
          }
        };
      } else {
        return {
          success: false,
          error: 'No cached data available'
        };
      }

    } catch (error) {
      logger.error('Failed to retrieve cached data', {
        error: error.message,
        context: {
          workflowId: context.workflowId,
          nodeId: context.nodeId
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Skip current step
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Skip result
   */
  async skipStep(context) {
    logger.info('Skipping workflow step', {
      context: {
        workflowId: context.workflowId,
        nodeId: context.nodeId
      }
    });

    return {
      success: true,
      result: { skipped: true, reason: 'error_recovery' }
    };
  }

  /**
   * Log error and continue
   * @param {Error} error - Original error
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Log result
   */
  async logAndContinue(error, context) {
    try {
      // Log error to database
      const { error: logError } = await supabase
        .from('workflow_error_logs')
        .insert({
          workflow_id: context.workflowId,
          node_id: context.nodeId,
          error_message: error.message,
          error_stack: error.stack,
          recovery_action: 'log_and_continue',
          created_at: new Date().toISOString()
        });

      if (logError) {
        logger.error('Failed to log workflow error', {
          error: logError.message,
          context: {
            workflowId: context.workflowId,
            nodeId: context.nodeId
          }
        });
      }

      return {
        success: true,
        result: { logged: true, continued: true }
      };

    } catch (logError) {
      logger.error('Failed to log and continue', {
        error: logError.message,
        context: {
          workflowId: context.workflowId,
          nodeId: context.nodeId
        }
      });

      return {
        success: false,
        error: logError.message
      };
    }
  }

  /**
   * Use alternative provider
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Alternative provider result
   */
  async useAlternativeProvider(context) {
    // This would implement logic to switch to an alternative service provider
    // For now, return a placeholder implementation
    logger.info('Using alternative provider', {
      context: {
        workflowId: context.workflowId,
        nodeId: context.nodeId
      }
    });

    return {
      success: true,
      result: { 
        alternativeProvider: true,
        message: 'Switched to alternative provider'
      }
    };
  }

  /**
   * Escalate error to higher level
   * @param {Error} error - Original error
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Escalation result
   */
  async escalateError(error, context) {
    try {
      // Log escalation
      const { error: logError } = await supabase
        .from('workflow_escalations')
        .insert({
          workflow_id: context.workflowId,
          node_id: context.nodeId,
          error_message: error.message,
          error_stack: error.stack,
          escalated_at: new Date().toISOString(),
          status: 'pending'
        });

      if (logError) {
        logger.error('Failed to log escalation', {
          error: logError.message,
          context: {
            workflowId: context.workflowId,
            nodeId: context.nodeId
          }
        });
      }

      // Send notification (would implement actual notification logic)
      logger.warn('Workflow error escalated', {
        error: error.message,
        context: {
          workflowId: context.workflowId,
          nodeId: context.nodeId
        }
      });

      return {
        success: true,
        result: { escalated: true, requiresManualIntervention: true }
      };

    } catch (escalationError) {
      logger.error('Failed to escalate error', {
        error: escalationError.message,
        context: {
          workflowId: context.workflowId,
          nodeId: context.nodeId
        }
      });

      return {
        success: false,
        error: escalationError.message
      };
    }
  }

  /**
   * Add custom recovery strategy
   * @param {string} workflowType - Type of workflow
   * @param {Object} strategy - Recovery strategy
   */
  addCustomStrategy(workflowType, strategy) {
    this.recoveryStrategies.set(workflowType, strategy);
    
    logger.info('Added custom recovery strategy', {
      workflowType,
      strategy
    });
  }

  /**
   * Get recovery statistics
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Recovery statistics
   */
  async getRecoveryStats(workflowId) {
    try {
      const { data, error } = await supabase
        .from('workflow_error_logs')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const stats = {
        totalErrors: data.length,
        recoveryAttempts: data.filter(log => log.recovery_action).length,
        successfulRecoveries: data.filter(log => log.recovery_action && !log.error_message.includes('failed')).length,
        escalationCount: data.filter(log => log.recovery_action === 'escalate').length,
        recentErrors: data.slice(0, 10)
      };

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      logger.error('Failed to get recovery stats', {
        workflowId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Sleep promise
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const workflowErrorRecovery = new WorkflowErrorRecovery();

