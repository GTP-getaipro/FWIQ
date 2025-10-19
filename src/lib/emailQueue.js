import { supabase } from './customSupabaseClient';

export class EmailQueue {
  constructor() {
    this.processingInterval = null;
    this.isProcessing = false;
    this.batchSize = 10;
    this.processingDelay = 5000; // 5 seconds between batches
  }

  async addToQueue(emailData, userId, priority = 50) {
    try {
      const queueItem = {
        user_id: userId,
        email_id: emailData.id || this.generateEmailId(),
        provider: emailData.provider || 'unknown',
        from_email: emailData.from,
        to_email: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        status: 'pending',
        priority: priority,
        retry_count: 0,
        max_retries: 3,
        scheduled_for: new Date().toISOString(),
        metadata: {
          classification: emailData.classification,
          routing: emailData.routing,
          original_received_at: emailData.received_at,
          message_id: emailData.message_id
        }
      };

      const { data, error } = await supabase
        .from('email_queue')
        .insert(queueItem)
        .select('id')
        .single();

      if (error) throw error;

      console.log(`Email added to queue: ${data.id}`);
      return data.id;

    } catch (error) {
      console.error('Failed to add email to queue:', error);
      throw error;
    }
  }

  async getNextBatch(userId = null, status = 'pending') {
    try {
      let query = supabase
        .from('email_queue')
        .select('*')
        .eq('status', status)
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(this.batchSize);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get next batch from queue:', error);
      return [];
    }
  }

  async updateQueueItem(queueId, updates) {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Failed to update queue item:', error);
      return false;
    }
  }

  async markAsProcessing(queueId) {
    return this.updateQueueItem(queueId, {
      status: 'processing',
      processing_started_at: new Date().toISOString()
    });
  }

  async markAsCompleted(queueId, result = null) {
    return this.updateQueueItem(queueId, {
      status: 'completed',
      processing_completed_at: new Date().toISOString(),
      result: result
    });
  }

  async markAsFailed(queueId, error, shouldRetry = true) {
    const queueItem = await this.getQueueItem(queueId);
    
    if (!queueItem) {
      console.error('Queue item not found for failure update:', queueId);
      return false;
    }

    const newRetryCount = (queueItem.retry_count || 0) + 1;
    const maxRetries = queueItem.max_retries || 3;

    if (shouldRetry && newRetryCount <= maxRetries) {
      // Schedule for retry with exponential backoff
      const retryDelay = Math.pow(2, newRetryCount) * 60 * 1000; // 2^n minutes
      const scheduledFor = new Date(Date.now() + retryDelay).toISOString();

      return this.updateQueueItem(queueId, {
        status: 'pending',
        retry_count: newRetryCount,
        scheduled_for: scheduledFor,
        last_error: error,
        last_failed_at: new Date().toISOString()
      });
    } else {
      // Mark as permanently failed
      return this.updateQueueItem(queueId, {
        status: 'failed',
        retry_count: newRetryCount,
        last_error: error,
        processing_completed_at: new Date().toISOString()
      });
    }
  }

  async getQueueItem(queueId) {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('id', queueId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Failed to get queue item:', error);
      return null;
    }
  }

  async getQueueStats(userId = null) {
    try {
      let query = supabase
        .from('email_queue')
        .select('status, priority, created_at');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        priorities: { high: 0, medium: 0, low: 0 },
        oldestPending: null,
        averageProcessingTime: 0
      };

      const now = new Date();
      let totalProcessingTime = 0;
      let completedCount = 0;

      data.forEach(item => {
        // Count by status
        stats[item.status] = (stats[item.status] || 0) + 1;

        // Count by priority
        if (item.priority >= 70) stats.priorities.high++;
        else if (item.priority >= 40) stats.priorities.medium++;
        else stats.priorities.low++;

        // Find oldest pending
        if (item.status === 'pending') {
          const createdAt = new Date(item.created_at);
          if (!stats.oldestPending || createdAt < stats.oldestPending) {
            stats.oldestPending = createdAt;
          }
        }

        // Calculate average processing time for completed items
        if (item.status === 'completed' && item.processing_started_at && item.processing_completed_at) {
          const processingTime = new Date(item.processing_completed_at) - new Date(item.processing_started_at);
          totalProcessingTime += processingTime;
          completedCount++;
        }
      });

      if (completedCount > 0) {
        stats.averageProcessingTime = totalProcessingTime / completedCount;
      }

      return stats;

    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }

  async cleanupOldItems(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('email_queue')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .in('status', ['completed', 'failed']);

      if (error) throw error;

      console.log(`Cleaned up email queue items older than ${daysOld} days`);
      return true;

    } catch (error) {
      console.error('Failed to cleanup old queue items:', error);
      return false;
    }
  }

  async reprocessFailedItems(userId = null, maxAge = 24) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - maxAge);

      let query = supabase
        .from('email_queue')
        .select('id')
        .eq('status', 'failed')
        .gte('last_failed_at', cutoffDate.toISOString())
        .lt('retry_count', 3);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const reprocessedCount = data.length;

      // Reset failed items to pending for reprocessing
      if (reprocessedCount > 0) {
        const ids = data.map(item => item.id);
        
        await supabase
          .from('email_queue')
          .update({
            status: 'pending',
            scheduled_for: new Date().toISOString(),
            last_error: null
          })
          .in('id', ids);

        console.log(`Reprocessed ${reprocessedCount} failed email queue items`);
      }

      return reprocessedCount;

    } catch (error) {
      console.error('Failed to reprocess failed items:', error);
      return 0;
    }
  }

  async pauseQueue(userId = null) {
    try {
      let query = supabase
        .from('email_queue')
        .update({ status: 'paused' })
        .eq('status', 'pending');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) throw error;

      console.log('Email queue paused');
      return true;

    } catch (error) {
      console.error('Failed to pause queue:', error);
      return false;
    }
  }

  async resumeQueue(userId = null) {
    try {
      let query = supabase
        .from('email_queue')
        .update({ 
          status: 'pending',
          scheduled_for: new Date().toISOString()
        })
        .eq('status', 'paused');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { error } = await query;

      if (error) throw error;

      console.log('Email queue resumed');
      return true;

    } catch (error) {
      console.error('Failed to resume queue:', error);
      return false;
    }
  }

  generateEmailId() {
    return 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Priority queue methods
  async addHighPriorityEmail(emailData, userId) {
    return this.addToQueue(emailData, userId, 90);
  }

  async addLowPriorityEmail(emailData, userId) {
    return this.addToQueue(emailData, userId, 20);
  }

  async scheduleEmailForLater(emailData, userId, scheduleDate, priority = 50) {
    const emailWithSchedule = {
      ...emailData,
      scheduled_for: scheduleDate.toISOString()
    };
    
    return this.addToQueue(emailWithSchedule, userId, priority);
  }

  // Batch operations
  async addBatchToQueue(emails, userId) {
    const results = [];
    
    for (const email of emails) {
      try {
        const queueId = await this.addToQueue(email, userId);
        results.push({ success: true, queueId, emailId: email.id });
      } catch (error) {
        results.push({ success: false, error: error.message, emailId: email.id });
      }
    }

    return results;
  }

  async processBatch(processor, userId = null) {
    if (this.isProcessing) {
      console.log('Queue processing already in progress');
      return false;
    }

    this.isProcessing = true;

    try {
      const batch = await this.getNextBatch(userId);
      
      if (batch.length === 0) {
        console.log('No items in queue to process');
        return true;
      }

      console.log(`Processing batch of ${batch.length} emails`);

      for (const queueItem of batch) {
        try {
          await this.markAsProcessing(queueItem.id);
          
          const result = await processor(queueItem);
          
          await this.markAsCompleted(queueItem.id, result);
          console.log(`Processed queue item ${queueItem.id} successfully`);

        } catch (error) {
          console.error(`Failed to process queue item ${queueItem.id}:`, error);
          await this.markAsFailed(queueItem.id, error.message);
        }
      }

      return true;

    } catch (error) {
      console.error('Batch processing failed:', error);
      return false;
    } finally {
      this.isProcessing = false;
    }
  }

  // Start automatic queue processing
  startProcessing(processor, userId = null, intervalMs = null) {
    if (this.processingInterval) {
      console.log('Queue processing already started');
      return;
    }

    const interval = intervalMs || this.processingDelay;

    this.processingInterval = setInterval(async () => {
      await this.processBatch(processor, userId);
    }, interval);

    console.log(`Started automatic queue processing with ${interval}ms interval`);
  }

  // Stop automatic queue processing
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Stopped automatic queue processing');
    }
  }
}
