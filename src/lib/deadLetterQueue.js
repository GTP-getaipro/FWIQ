/**
 * Dead Letter Queue Service
 * Manages failed operations that require manual intervention
 */

import { logger } from './logger';
import { supabase } from './customSupabaseClient';

export class DeadLetterQueue {
  constructor() {
    this.logger = logger;
    this.processingInterval = null;
    this.isProcessing = false;
    this.maxProcessingAttempts = 3;
  }

  async addToDeadLetterQueue(entry) {
    try {
      const deadLetterEntry = {
        operation_type: entry.operationType || 'unknown',
        original_data: entry.originalData || {},
        error_data: {
          message: entry.error?.message || 'Unknown error',
          stack: entry.error?.stack,
          code: entry.error?.code,
          status: entry.error?.status
        },
        context: {
          userId: entry.context?.userId,
          operation: entry.context?.operation,
          timestamp: entry.context?.timestamp || new Date().toISOString(),
          retryCount: entry.retryCount || 0
        },
        priority: entry.priority || 'normal',
        status: 'pending_review',
        created_at: new Date().toISOString(),
        metadata: entry.metadata || {}
      };

      const { data, error } = await supabase
        .from('dead_letter_queue')
        .insert(deadLetterEntry)
        .select('id')
        .single();

      if (error) throw error;

      this.logger.error('Entry added to dead letter queue', {
        id: data.id,
        operation: entry.operationType,
        error: entry.error?.message
      });

      return data.id;

    } catch (error) {
      this.logger.error('Failed to add entry to dead letter queue', {
        error: error.message,
        entry: entry
      });
      throw error;
    }
  }

  async getDeadLetterQueueEntries(options = {}) {
    try {
      const {
        limit = 50,
        status = null,
        operationType = null,
        priority = null,
        userId = null
      } = options;

      let query = supabase
        .from('dead_letter_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (operationType) {
        query = query.eq('operation_type', operationType);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      if (userId) {
        query = query.eq('context->userId', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;

    } catch (error) {
      this.logger.error('Failed to get dead letter queue entries', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  async getDeadLetterQueueEntry(id) {
    try {
      const { data, error } = await supabase
        .from('dead_letter_queue')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      this.logger.error('Failed to get dead letter queue entry', {
        error: error.message,
        id
      });
      throw error;
    }
  }

  async updateDeadLetterQueueEntry(id, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('dead_letter_queue')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.logger.info('Dead letter queue entry updated', {
        id,
        updates: Object.keys(updates)
      });

      return data;

    } catch (error) {
      this.logger.error('Failed to update dead letter queue entry', {
        error: error.message,
        id,
        updates
      });
      throw error;
    }
  }

  async retryDeadLetterEntry(id, retryFunction) {
    try {
      const entry = await this.getDeadLetterQueueEntry(id);
      
      if (!entry) {
        throw new Error(`Dead letter queue entry not found: ${id}`);
      }

      if (entry.status === 'resolved') {
        throw new Error(`Entry ${id} is already resolved`);
      }

      // Update status to retrying
      await this.updateDeadLetterQueueEntry(id, {
        status: 'retrying',
        last_retry_at: new Date().toISOString()
      });

      this.logger.info('Retrying dead letter queue entry', {
        id,
        operation: entry.operation_type
      });

      try {
        // Execute the retry function
        const result = await retryFunction(entry.original_data, entry.context);

        // Mark as resolved if successful
        await this.updateDeadLetterQueueEntry(id, {
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          result_data: result
        });

        this.logger.info('Dead letter queue entry resolved', {
          id,
          operation: entry.operation_type
        });

        return { success: true, result };

      } catch (retryError) {
        // Update with retry error
        await this.updateDeadLetterQueueEntry(id, {
          status: 'failed',
          retry_error: {
            message: retryError.message,
            stack: retryError.stack,
            code: retryError.code
          },
          retry_count: (entry.retry_count || 0) + 1
        });

        this.logger.error('Dead letter queue entry retry failed', {
          id,
          operation: entry.operation_type,
          error: retryError.message
        });

        throw retryError;
      }

    } catch (error) {
      this.logger.error('Failed to retry dead letter queue entry', {
        error: error.message,
        id
      });
      throw error;
    }
  }

  async resolveDeadLetterEntry(id, resolution = {}) {
    try {
      const updates = {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolution.notes || '',
        resolved_by: resolution.resolvedBy || 'system',
        resolution_data: resolution.data || {}
      };

      const result = await this.updateDeadLetterQueueEntry(id, updates);

      this.logger.info('Dead letter queue entry resolved manually', {
        id,
        resolvedBy: resolution.resolvedBy
      });

      return result;

    } catch (error) {
      this.logger.error('Failed to resolve dead letter queue entry', {
        error: error.message,
        id,
        resolution
      });
      throw error;
    }
  }

  async deleteDeadLetterEntry(id) {
    try {
      const { error } = await supabase
        .from('dead_letter_queue')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.logger.info('Dead letter queue entry deleted', { id });

      return true;

    } catch (error) {
      this.logger.error('Failed to delete dead letter queue entry', {
        error: error.message,
        id
      });
      throw error;
    }
  }

  async getDeadLetterQueueStats() {
    try {
      const { data, error } = await supabase
        .from('dead_letter_queue')
        .select('status, priority, operation_type, created_at');

      if (error) throw error;

      const stats = {
        total: data.length,
        byStatus: {},
        byPriority: {},
        byOperationType: {},
        byDay: {},
        oldestEntry: null,
        newestEntry: null
      };

      // Process stats
      data.forEach(entry => {
        // Status stats
        stats.byStatus[entry.status] = (stats.byStatus[entry.status] || 0) + 1;
        
        // Priority stats
        stats.byPriority[entry.priority] = (stats.byPriority[entry.priority] || 0) + 1;
        
        // Operation type stats
        stats.byOperationType[entry.operation_type] = (stats.byOperationType[entry.operation_type] || 0) + 1;
        
        // Daily stats
        const day = new Date(entry.created_at).toISOString().split('T')[0];
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      });

      // Find oldest and newest entries
      if (data.length > 0) {
        const sortedByDate = data.sort((a, b) => 
          new Date(a.created_at) - new Date(b.created_at)
        );
        stats.oldestEntry = sortedByDate[0].created_at;
        stats.newestEntry = sortedByDate[sortedByDate.length - 1].created_at;
      }

      return stats;

    } catch (error) {
      this.logger.error('Failed to get dead letter queue stats', {
        error: error.message
      });
      throw error;
    }
  }

  async startAutomaticProcessing(processorFunction, interval = 300000) { // 5 minutes
    if (this.processingInterval) {
      this.logger.warn('Automatic processing is already running');
      return;
    }

    this.logger.info('Starting automatic dead letter queue processing', {
      interval
    });

    this.processingInterval = setInterval(async () => {
      if (this.isProcessing) {
        this.logger.debug('Processing already in progress, skipping');
        return;
      }

      await this.processDeadLetterQueue(processorFunction);
    }, interval);
  }

  async stopAutomaticProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.logger.info('Stopped automatic dead letter queue processing');
    }
  }

  async processDeadLetterQueue(processorFunction) {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get entries that can be automatically retried
      const entries = await this.getDeadLetterQueueEntries({
        status: 'pending_review',
        limit: 10
      });

      if (entries.length === 0) {
        this.logger.debug('No dead letter queue entries to process');
        return;
      }

      this.logger.info('Processing dead letter queue entries', {
        count: entries.length
      });

      for (const entry of entries) {
        try {
          // Check if entry can be automatically retried
          if (this.canAutoRetry(entry)) {
            await this.retryDeadLetterEntry(entry.id, processorFunction);
          } else {
            this.logger.debug('Entry requires manual intervention', {
              id: entry.id,
              operation: entry.operation_type
            });
          }
        } catch (error) {
          this.logger.error('Failed to process dead letter queue entry', {
            id: entry.id,
            error: error.message
          });
        }
      }

    } catch (error) {
      this.logger.error('Failed to process dead letter queue', {
        error: error.message
      });
    } finally {
      this.isProcessing = false;
    }
  }

  canAutoRetry(entry) {
    // Define rules for automatic retry
    const autoRetryableOperations = [
      'email_send',
      'api_call',
      'data_sync'
    ];

    const autoRetryableErrors = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'RATE_LIMITED'
    ];

    const maxAutoRetries = 3;

    // Check if operation is auto-retryable
    if (!autoRetryableOperations.includes(entry.operation_type)) {
      return false;
    }

    // Check if error is auto-retryable
    const errorMessage = entry.error_data?.message?.toUpperCase() || '';
    const isAutoRetryableError = autoRetryableErrors.some(pattern =>
      errorMessage.includes(pattern)
    );

    if (!isAutoRetryableError) {
      return false;
    }

    // Check retry count
    if ((entry.retry_count || 0) >= maxAutoRetries) {
      return false;
    }

    return true;
  }

  // Utility methods
  formatDeadLetterEntry(entry) {
    return {
      id: entry.id,
      operation: entry.operation_type,
      status: entry.status,
      priority: entry.priority,
      error: entry.error_data?.message,
      createdAt: entry.created_at,
      retryCount: entry.retry_count || 0,
      context: entry.context
    };
  }

  getEntryAge(entry) {
    const created = new Date(entry.created_at);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24)); // days
  }
}

// Export a default instance
export const deadLetterQueue = new DeadLetterQueue();
