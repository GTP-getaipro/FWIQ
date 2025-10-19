/**
 * Error Recovery System
 * Comprehensive error handling and recovery with retry logic and dead letter queue
 */

import { logger } from './logger';
import { supabase } from './customSupabaseClient';

export class ErrorRecovery {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelays = [1000, 2000, 4000]; // Exponential backoff delays
    this.logger = logger;
  }

  async handleError(error, context) {
    this.logger.error('Error occurred', { 
      error: error.message, 
      stack: error.stack,
      context 
    });
    
    // Log error to monitoring system
    await this.logError(error, context);
    
    // Determine recovery strategy
    if (this.isRetryable(error)) {
      return this.retryOperation(error, context);
    } else {
      return this.sendToDeadLetterQueue(error, context);
    }
  }

  isRetryable(error) {
    const retryableErrors = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'TEMPORARY_FAILURE',
      'RATE_LIMITED',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];
    
    // Check error message for retryable patterns
    const errorMessage = error.message?.toUpperCase() || '';
    const hasRetryablePattern = retryableErrors.some(pattern => 
      errorMessage.includes(pattern)
    );
    
    // Check error code
    const hasRetryableCode = retryableErrors.includes(error.code);
    
    // Check HTTP status codes for retries
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const hasRetryableStatus = error.status && retryableStatusCodes.includes(error.status);
    
    return hasRetryablePattern || hasRetryableCode || hasRetryableStatus;
  }

  async retryOperation(error, context) {
    const retryKey = `${context.operation}_${context.id || 'unknown'}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;
    
    if (attempts >= this.maxRetries) {
      this.logger.warn('Max retries exceeded', { retryKey, attempts });
      return this.sendToDeadLetterQueue(error, context);
    }
    
    this.retryAttempts.set(retryKey, attempts + 1);
    
    // Calculate delay with exponential backoff
    const delay = this.retryDelays[Math.min(attempts, this.retryDelays.length - 1)];
    this.logger.info(`Retrying operation in ${delay}ms`, { 
      retryKey, 
      attempt: attempts + 1,
      maxRetries: this.maxRetries 
    });
    
    await this.sleep(delay);
    
    try {
      return await this.executeOperation(context);
    } catch (retryError) {
      return this.handleError(retryError, context);
    }
  }

  async executeOperation(context) {
    // This should be overridden by the calling service
    // or passed as a function in the context
    if (context.executeFunction && typeof context.executeFunction === 'function') {
      return await context.executeFunction();
    }
    
    throw new Error('No execution function provided in context');
  }

  async sendToDeadLetterQueue(error, context) {
    const deadLetterEntry = {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        status: error.status
      },
      context: {
        operation: context.operation,
        id: context.id,
        userId: context.userId,
        timestamp: context.timestamp || new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      retryCount: this.retryAttempts.get(`${context.operation}_${context.id || 'unknown'}`) || 0
    };
    
    try {
      // Store in database for manual review
      await this.storeDeadLetterEntry(deadLetterEntry);
      
      // Notify administrators
      await this.notifyAdministrators(deadLetterEntry);
      
      this.logger.error('Error sent to dead letter queue', deadLetterEntry);
      
      return { success: false, sentToDeadLetter: true };
    } catch (dlqError) {
      this.logger.error('Failed to send to dead letter queue', {
        originalError: error.message,
        dlqError: dlqError.message
      });
      throw dlqError;
    }
  }

  async logError(error, context) {
    try {
      const errorLog = {
        user_id: context.userId,
        operation: context.operation,
        error_message: error.message,
        error_stack: error.stack,
        error_code: error.code,
        error_status: error.status,
        context_data: JSON.stringify(context),
        severity: this.getErrorSeverity(error),
        created_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('error_logs')
        .insert(errorLog);

      if (dbError) {
        this.logger.error('Failed to log error to database', { dbError });
      }
    } catch (logError) {
      this.logger.error('Failed to log error', { logError: logError.message });
    }
  }

  async storeDeadLetterEntry(deadLetterEntry) {
    try {
      const { error } = await supabase
        .from('dead_letter_queue')
        .insert({
          error_data: deadLetterEntry.error,
          context_data: deadLetterEntry.context,
          retry_count: deadLetterEntry.retryCount,
          created_at: deadLetterEntry.timestamp,
          status: 'pending_review'
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Failed to store dead letter entry', { error: error.message });
      throw error;
    }
  }

  async notifyAdministrators(deadLetterEntry) {
    try {
      // Send notification to administrators
      const notification = {
        type: 'error_recovery',
        severity: 'high',
        message: `Error sent to dead letter queue: ${deadLetterEntry.error.message}`,
        data: {
          operation: deadLetterEntry.context.operation,
          retryCount: deadLetterEntry.retryCount,
          timestamp: deadLetterEntry.timestamp
        }
      };

      // This would integrate with your notification system
      // For now, just log it
      this.logger.error('Administrator notification', notification);
      
    } catch (error) {
      this.logger.error('Failed to notify administrators', { error: error.message });
    }
  }

  getErrorSeverity(error) {
    if (error.status >= 500) return 'high';
    if (error.status >= 400) return 'medium';
    if (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') return 'medium';
    return 'low';
  }

  // Utility methods
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearRetryAttempts() {
    this.retryAttempts.clear();
  }

  getRetryStats() {
    return {
      totalRetryAttempts: this.retryAttempts.size,
      retryAttempts: Object.fromEntries(this.retryAttempts)
    };
  }

  // Method to manually retry from dead letter queue
  async retryFromDeadLetterQueue(deadLetterId) {
    try {
      // Get the dead letter entry
      const { data: deadLetterEntry, error: fetchError } = await supabase
        .from('dead_letter_queue')
        .select('*')
        .eq('id', deadLetterId)
        .single();

      if (fetchError) throw fetchError;

      // Clear retry attempts for this operation
      const retryKey = `${deadLetterEntry.context_data.operation}_${deadLetterEntry.context_data.id}`;
      this.retryAttempts.delete(retryKey);

      // Update status
      await supabase
        .from('dead_letter_queue')
        .update({ status: 'retrying', updated_at: new Date().toISOString() })
        .eq('id', deadLetterId);

      // Attempt to retry the operation
      const result = await this.executeOperation(deadLetterEntry.context_data);

      // Mark as resolved if successful
      await supabase
        .from('dead_letter_queue')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', deadLetterId);

      return { success: true, result };

    } catch (error) {
      // Mark as failed
      await supabase
        .from('dead_letter_queue')
        .update({ 
          status: 'failed', 
          error_message: error.message,
          updated_at: new Date().toISOString() 
        })
        .eq('id', deadLetterId);

      throw error;
    }
  }

  // Get dead letter queue entries for review
  async getDeadLetterQueueEntries(limit = 50, status = null) {
    try {
      let query = supabase
        .from('dead_letter_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      this.logger.error('Failed to get dead letter queue entries', { error: error.message });
      throw error;
    }
  }
}
