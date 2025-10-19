import {  createClient  } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class EmailService {
  constructor() {
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      // Initialize any required connections or configurations
      this.initialized = true;
      logger.info('EmailService initialized successfully');
    } catch (error) {
      logger.error('EmailService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process incoming email through complete pipeline
   */
  async processEmail(emailData, userId) {
    try {
      logger.info(`Processing email from ${emailData.from} for user ${userId}`);

      // Import AI pipeline dynamically to avoid circular dependencies
      // TODO: Create aiResponsePipeline.js file
      // import {  AIResponsePipeline  } from '../lib/aiResponsePipeline.js';
      // const aiPipeline = new AIResponsePipeline();

      // Get business context from user profile
      const businessContext = await this.getBusinessContext(userId);

      // Process email through AI pipeline
      // TODO: Implement AI pipeline processing
      const result = { success: true, message: 'Email processing placeholder' };

      // Store email in queue
      await this.storeEmailInQueue(emailData, userId, result);

      logger.info(`Email processed successfully for user ${userId}: ${result.success}`);

      return {
        success: result.success,
        emailId: result.processingId,
        classification: result.classification,
        response: result.finalResponse,
        confidence: result.confidence,
        styleApplied: result.styleApplied,
        triggeredRules: result.triggeredRules?.length || 0,
        escalated: result.escalationResult?.escalated || false,
        pipeline: result.pipeline
      };

    } catch (error) {
      logger.error('Email processing failed:', error);
      throw new Error(`Email processing failed: ${error.message}`);
    }
  }

  /**
   * Get business context for user
   */
  async getBusinessContext(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const clientConfig = profile?.client_config || {};
      
      return {
        businessName: clientConfig.business?.name || 'Business',
        businessType: clientConfig.business?.type || 'Service Business',
        phone: clientConfig.business?.phone || '',
        email: clientConfig.business?.email || '',
        services: clientConfig.business?.services || [],
        tone: clientConfig.business?.tone || 'professional'
      };

    } catch (error) {
      logger.error('Failed to get business context:', error);
      // Return default context if profile fetch fails
      return {
        businessName: 'Business',
        businessType: 'Service Business',
        phone: '',
        email: '',
        services: [],
        tone: 'professional'
      };
    }
  }

  /**
   * Store email in processing queue
   */
  async storeEmailInQueue(emailData, userId, processingResult) {
    try {
      const { error } = await supabase
        .from('email_queue')
        .insert({
          user_id: userId,
          from_email: emailData.from,
          to_email: emailData.to || '',
          subject: emailData.subject,
          body: emailData.body,
          provider: emailData.provider || 'unknown',
          message_id: emailData.messageId || `msg_${Date.now()}`,
          status: processingResult.success ? 'processed' : 'failed',
          priority: processingResult.classification?.urgency === 'critical' ? 'high' : 'normal',
          category: processingResult.classification?.category || 'general',
          processing_result: {
            classification: processingResult.classification,
            confidence: processingResult.confidence,
            styleApplied: processingResult.styleApplied,
            triggeredRules: processingResult.triggeredRules,
            escalated: processingResult.escalationResult?.escalated,
            pipeline: processingResult.pipeline
          },
          scheduled_for: new Date(),
          received_at: emailData.receivedAt || new Date()
        });

      if (error) {
        logger.error('Failed to store email in queue:', error);
        throw error;
      }

    } catch (error) {
      logger.error('Failed to store email in queue:', error);
      // Don't throw error here as email processing was successful
    }
  }

  /**
   * Get email queue status for user
   */
  async getQueueStatus(userId) {
    try {
      const { data: queueStats, error } = await supabase
        .from('email_queue')
        .select('status, priority, category, created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        throw error;
      }

      // Calculate statistics
      const stats = {
        total: queueStats?.length || 0,
        processed: queueStats?.filter(e => e.status === 'processed').length || 0,
        failed: queueStats?.filter(e => e.status === 'failed').length || 0,
        pending: queueStats?.filter(e => e.status === 'pending').length || 0,
        byPriority: {
          high: queueStats?.filter(e => e.priority === 'high').length || 0,
          normal: queueStats?.filter(e => e.priority === 'normal').length || 0,
          low: queueStats?.filter(e => e.priority === 'low').length || 0
        },
        byCategory: {},
        lastProcessed: null
      };

      // Calculate category stats
      queueStats?.forEach(email => {
        stats.byCategory[email.category] = (stats.byCategory[email.category] || 0) + 1;
      });

      // Find last processed email
      const processedEmails = queueStats?.filter(e => e.status === 'processed')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      if (processedEmails?.length > 0) {
        stats.lastProcessed = processedEmails[0].created_at;
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get queue status:', error);
      throw new Error(`Failed to get queue status: ${error.message}`);
    }
  }

  /**
   * Get recent emails for user
   */
  async getRecentEmails(userId, limit = 10, offset = 0) {
    try {
      const { data: emails, error, count } = await supabase
        .from('email_queue')
        .select(`
          id,
          from_addr,
          to_addrs,
          subject,
          status,
          direction,
          metadata,
          created_at,
          updated_at
        `, { count: 'exact' })
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        emails: emails || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: count > offset + limit
        }
      };

    } catch (error) {
      logger.error('Failed to get recent emails:', error);
      throw new Error(`Failed to get recent emails: ${error.message}`);
    }
  }

  /**
   * Retry failed email processing
   */
  async retryEmail(emailId, userId) {
    try {
      // Get the failed email
      const { data: email, error: fetchError } = await supabase
        .from('email_queue')
        .select('*')
        .eq('id', emailId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !email) {
        throw new Error('Email not found or access denied');
      }

      if (email.status !== 'failed') {
        throw new Error('Email is not in failed status');
      }

      // Reconstruct email data
      const emailData = {
        from: email.from_email,
        to: email.to_email,
        subject: email.subject,
        body: email.body,
        provider: email.provider,
        messageId: email.message_id,
        receivedAt: email.received_at
      };

      // Update status to pending
      await supabase
        .from('email_queue')
        .update({ 
          status: 'pending',
          retry_count: (email.retry_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId);

      // Reprocess the email
      const result = await this.processEmail(emailData, userId);

      // Update the email record with new result
      await supabase
        .from('email_queue')
        .update({
          status: result.success ? 'processed' : 'failed',
          processing_result: {
            classification: result.classification,
            confidence: result.confidence,
            styleApplied: result.styleApplied,
            triggeredRules: result.triggeredRules,
            escalated: result.escalated,
            pipeline: result.pipeline
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId);

      logger.info(`Email ${emailId} retried successfully for user ${userId}`);

      return result;

    } catch (error) {
      logger.error('Failed to retry email:', error);
      throw new Error(`Failed to retry email: ${error.message}`);
    }
  }

  /**
   * Get email by ID
   */
  async getEmailById(emailId, userId) {
    try {
      const { data: email, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('id', emailId)
        .eq('user_id', userId)
        .single();

      if (error || !email) {
        throw new Error('Email not found or access denied');
      }

      return email;

    } catch (error) {
      logger.error('Failed to get email by ID:', error);
      throw new Error(`Failed to get email: ${error.message}`);
    }
  }

  /**
   * Update email status
   */
  async updateEmailStatus(emailId, userId, status, metadata = {}) {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({
          status,
          processing_result: {
            ...metadata
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      logger.info(`Email ${emailId} status updated to ${status} for user ${userId}`);

    } catch (error) {
      logger.error('Failed to update email status:', error);
      throw new Error(`Failed to update email status: ${error.message}`);
    }
  }

  /**
   * Delete email from queue
   */
  async deleteEmail(emailId, userId) {
    try {
      const { error } = await supabase
        .from('email_queue')
        .delete()
        .eq('id', emailId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      logger.info(`Email ${emailId} deleted for user ${userId}`);

    } catch (error) {
      logger.error('Failed to delete email:', error);
      throw new Error(`Failed to delete email: ${error.message}`);
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(userId, timeframe = '7d') {
    try {
      // Calculate date range
      const now = new Date();
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const { data: emails, error } = await supabase
        .from('email_queue')
        .select('status, priority, category, created_at, processing_result')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw error;
      }

      // Calculate statistics
      const stats = {
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        total: emails?.length || 0,
        byStatus: {},
        byPriority: {},
        byCategory: {},
        averageConfidence: 0,
        styleAppliedCount: 0,
        escalatedCount: 0
      };

      let totalConfidence = 0;
      let confidenceCount = 0;

      emails?.forEach(email => {
        // Count by status
        stats.byStatus[email.status] = (stats.byStatus[email.status] || 0) + 1;
        
        // Count by priority
        stats.byPriority[email.priority] = (stats.byPriority[email.priority] || 0) + 1;
        
        // Count by category
        stats.byCategory[email.category] = (stats.byCategory[email.category] || 0) + 1;
        
        // Calculate confidence average
        if (email.processing_result?.confidence) {
          totalConfidence += email.processing_result.confidence;
          confidenceCount++;
        }
        
        // Count style applications
        if (email.processing_result?.styleApplied) {
          stats.styleAppliedCount++;
        }
        
        // Count escalations
        if (email.processing_result?.escalated) {
          stats.escalatedCount++;
        }
      });

      if (confidenceCount > 0) {
        stats.averageConfidence = totalConfidence / confidenceCount;
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get email statistics:', error);
      throw new Error(`Failed to get email statistics: ${error.message}`);
    }
  }

  /**
   * Search emails
   */
  async searchEmails(userId, searchParams) {
    try {
      const { 
        query, 
        status, 
        category, 
        priority, 
        startDate, 
        endDate, 
        limit = 20, 
        offset = 0 
      } = searchParams;

      let supabaseQuery = supabase
        .from('email_queue')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (status) supabaseQuery = supabaseQuery.eq('status', status);
      if (category) supabaseQuery = supabaseQuery.eq('category', category);
      if (priority) supabaseQuery = supabaseQuery.eq('priority', priority);
      if (startDate) supabaseQuery = supabaseQuery.gte('created_at', startDate);
      if (endDate) supabaseQuery = supabaseQuery.lte('created_at', endDate);
      
      // Text search in subject and body
      if (query) {
        supabaseQuery = supabaseQuery.or(`subject.ilike.%${query}%,body.ilike.%${query}%`);
      }

      const { data: emails, error, count } = await supabaseQuery;

      if (error) {
        throw error;
      }

      return {
        emails: emails || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: count > offset + limit
        }
      };

    } catch (error) {
      logger.error('Failed to search emails:', error);
      throw new Error(`Failed to search emails: ${error.message}`);
    }
  }
}

export default new EmailService();
