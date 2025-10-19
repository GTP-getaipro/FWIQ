/**
 * Queue Processor
 * Advanced queue processing with worker pools and load balancing
 */

import { EmailQueue } from './emailQueue';
import { logger } from './logger';
import { retryService } from './retryService';
import { deadLetterQueue } from './deadLetterQueue';

export class QueueProcessor {
  constructor(options = {}) {
    this.emailQueue = new EmailQueue();
    this.logger = logger;
    this.retryService = retryService;
    this.deadLetterQueue = deadLetterQueue;
    
    // Configuration
    this.maxWorkers = options.maxWorkers || 5;
    this.batchSize = options.batchSize || 10;
    this.processingInterval = options.processingInterval || 5000; // 5 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 60000; // 1 minute
    
    // State management
    this.workers = new Map();
    this.isProcessing = false;
    this.processingIntervalId = null;
    this.stats = {
      processed: 0,
      failed: 0,
      retried: 0,
      deadLetterQueue: 0,
      startTime: null
    };
    
    // Processor registry
    this.processors = new Map();
    this.registerDefaultProcessors();
  }

  registerDefaultProcessors() {
    // Email processing
    this.processors.set('email_send', this.processEmailSend.bind(this));
    this.processors.set('email_reply', this.processEmailReply.bind(this));
    this.processors.set('email_forward', this.processEmailForward.bind(this));
    
    // AI processing
    this.processors.set('ai_classify', this.processAIClassification.bind(this));
    this.processors.set('ai_generate_reply', this.processAIGenerateReply.bind(this));
    
    // Workflow processing
    this.processors.set('workflow_trigger', this.processWorkflowTrigger.bind(this));
    this.processors.set('notification_send', this.processNotificationSend.bind(this));
  }

  registerProcessor(type, processor) {
    this.processors.set(type, processor);
    this.logger.info(`Registered processor for type: ${type}`);
  }

  async startProcessing() {
    if (this.isProcessing) {
      this.logger.warn('Queue processor is already running');
      return;
    }

    this.isProcessing = true;
    this.stats.startTime = new Date();
    
    this.logger.info('Starting queue processor', {
      maxWorkers: this.maxWorkers,
      batchSize: this.batchSize,
      processingInterval: this.processingInterval
    });

    // Start processing interval
    this.processingIntervalId = setInterval(() => {
      this.processQueueBatch();
    }, this.processingInterval);

    // Process initial batch
    await this.processQueueBatch();
  }

  async stopProcessing() {
    if (!this.isProcessing) {
      this.logger.warn('Queue processor is not running');
      return;
    }

    this.isProcessing = false;
    
    if (this.processingIntervalId) {
      clearInterval(this.processingIntervalId);
      this.processingIntervalId = null;
    }

    // Wait for active workers to complete
    await this.waitForWorkersToComplete();

    this.logger.info('Queue processor stopped', {
      stats: this.getStats()
    });
  }

  async processQueueBatch() {
    if (!this.isProcessing) return;

    try {
      // Get next batch of items to process
      const batch = await this.emailQueue.getNextBatch(null, 'pending');
      
      if (batch.length === 0) {
        return; // No items to process
      }

      this.logger.debug(`Processing batch of ${batch.length} items`);

      // Process items in parallel with worker limit
      const workerPromises = [];
      for (let i = 0; i < Math.min(batch.length, this.maxWorkers); i++) {
        const workerPromise = this.createWorker(batch[i]);
        workerPromises.push(workerPromise);
      }

      await Promise.allSettled(workerPromises);

    } catch (error) {
      this.logger.error('Failed to process queue batch', { error: error.message });
    }
  }

  async createWorker(queueItem) {
    const workerId = `worker_${Date.now()}_${Math.random()}`;
    
    try {
      this.workers.set(workerId, {
        id: workerId,
        queueItem,
        startTime: new Date(),
        status: 'processing'
      });

      await this.processQueueItem(queueItem);

      this.workers.delete(workerId);
      this.stats.processed++;

    } catch (error) {
      this.logger.error(`Worker ${workerId} failed`, {
        queueItemId: queueItem.id,
        error: error.message
      });
      
      this.workers.delete(workerId);
      this.stats.failed++;
      
      // Handle failure
      await this.handleProcessingFailure(queueItem, error);
    }
  }

  async processQueueItem(queueItem) {
    const startTime = new Date();
    
    try {
      // Mark as processing
      await this.emailQueue.markAsProcessing(queueItem.id);

      // Get processor for this item type
      const processor = this.processors.get(queueItem.type || 'email_send');
      
      if (!processor) {
        throw new Error(`No processor found for type: ${queueItem.type}`);
      }

      // Process with retry logic
      const result = await this.retryService.executeWithRetry(
        () => processor(queueItem),
        {
          operation: queueItem.type || 'email_send',
          id: queueItem.id,
          rateLimit: {
            requestsPerMinute: 60,
            requestsPerHour: 1000
          }
        }
      );

      // Mark as completed
      await this.emailQueue.markAsCompleted(queueItem.id, result);

      const processingTime = new Date() - startTime;
      this.logger.info(`Queue item processed successfully`, {
        id: queueItem.id,
        type: queueItem.type,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = new Date() - startTime;
      
      this.logger.error(`Queue item processing failed`, {
        id: queueItem.id,
        type: queueItem.type,
        processingTime,
        error: error.message
      });

      throw error;
    }
  }

  async handleProcessingFailure(queueItem, error) {
    try {
      // Check if we should retry
      const shouldRetry = this.shouldRetryItem(queueItem, error);
      
      if (shouldRetry) {
        await this.emailQueue.markAsFailed(queueItem.id, error.message, true);
        this.stats.retried++;
        this.logger.info(`Queue item scheduled for retry`, {
          id: queueItem.id,
          retryCount: queueItem.retry_count + 1
        });
      } else {
        // Send to dead letter queue
        await this.emailQueue.markAsFailed(queueItem.id, error.message, false);
        
        await this.deadLetterQueue.addToDeadLetterQueue({
          operationType: queueItem.type || 'email_send',
          error,
          context: {
            userId: queueItem.user_id,
            operation: queueItem.type || 'email_send',
            queueItemId: queueItem.id
          },
          originalData: queueItem,
          retryCount: queueItem.retry_count || 0
        });
        
        this.stats.deadLetterQueue++;
        this.logger.error(`Queue item sent to dead letter queue`, {
          id: queueItem.id,
          error: error.message
        });
      }

    } catch (handlingError) {
      this.logger.error('Failed to handle processing failure', {
        queueItemId: queueItem.id,
        originalError: error.message,
        handlingError: handlingError.message
      });
    }
  }

  shouldRetryItem(queueItem, error) {
    // Check retry count
    if ((queueItem.retry_count || 0) >= this.maxRetries) {
      return false;
    }

    // Check if error is retryable
    const retryableErrors = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'RATE_LIMITED',
      'TEMPORARY_FAILURE',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    const errorMessage = error.message?.toUpperCase() || '';
    const isRetryableError = retryableErrors.some(pattern =>
      errorMessage.includes(pattern)
    );

    return isRetryableError;
  }

  // Default processors
  async processEmailSend(queueItem) {
    this.logger.info(`Processing email send`, { id: queueItem.id });
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      messageId: `msg_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  async processEmailReply(queueItem) {
    this.logger.info(`Processing email reply`, { id: queueItem.id });
    
    // Simulate email reply processing
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      messageId: `reply_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  async processEmailForward(queueItem) {
    this.logger.info(`Processing email forward`, { id: queueItem.id });
    
    // Simulate email forwarding
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      messageId: `forward_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  async processAIClassification(queueItem) {
    this.logger.info(`Processing AI classification`, { id: queueItem.id });
    
    // Simulate AI classification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      classification: 'support',
      confidence: 0.95,
      timestamp: new Date().toISOString()
    };
  }

  async processAIGenerateReply(queueItem) {
    this.logger.info(`Processing AI reply generation`, { id: queueItem.id });
    
    // Simulate AI reply generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      reply: 'Thank you for your email. We will get back to you shortly.',
      timestamp: new Date().toISOString()
    };
  }

  async processWorkflowTrigger(queueItem) {
    this.logger.info(`Processing workflow trigger`, { id: queueItem.id });
    
    // Simulate workflow processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      workflowId: `wf_${Date.now()}`,
      status: 'triggered',
      timestamp: new Date().toISOString()
    };
  }

  async processNotificationSend(queueItem) {
    this.logger.info(`Processing notification send`, { id: queueItem.id });
    
    // Simulate notification sending
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      notificationId: `notif_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  async waitForWorkersToComplete(timeout = 30000) {
    const startTime = Date.now();
    
    while (this.workers.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.workers.size > 0) {
      this.logger.warn(`Timeout waiting for ${this.workers.size} workers to complete`);
    }
  }

  getStats() {
    const uptime = this.stats.startTime ? 
      new Date() - this.stats.startTime : 0;

    return {
      ...this.stats,
      uptime,
      activeWorkers: this.workers.size,
      isProcessing: this.isProcessing,
      processors: Array.from(this.processors.keys())
    };
  }

  getWorkerStats() {
    const workers = Array.from(this.workers.values());
    return workers.map(worker => ({
      id: worker.id,
      queueItemId: worker.queueItem.id,
      status: worker.status,
      duration: new Date() - worker.startTime
    }));
  }

  async pauseProcessing() {
    await this.stopProcessing();
    this.logger.info('Queue processing paused');
  }

  async resumeProcessing() {
    await this.startProcessing();
    this.logger.info('Queue processing resumed');
  }

  async restartProcessing() {
    this.logger.info('Restarting queue processing');
    await this.stopProcessing();
    await this.startProcessing();
  }

  // Health check
  async healthCheck() {
    try {
      const queueStats = await this.emailQueue.getQueueStats();
      const processorStats = this.getStats();
      
      return {
        status: 'healthy',
        queue: queueStats,
        processor: processorStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export a default instance
export const queueProcessor = new QueueProcessor();
