import { supabase } from './customSupabaseClient';
import { EmailClassifier } from './emailClassifier';
import { EmailRouter } from './emailRouter';
import { EmailQueue } from './emailQueue';
import { StyleAwareAI } from './styleAwareAI';

export class EmailProcessor {
  constructor() {
    this.classifier = new EmailClassifier();
    this.router = new EmailRouter();
    this.queue = new EmailQueue();
    this.styleAI = new StyleAwareAI();
    this.isProcessing = false;
  }

  async processEmail(emailData, userId) {
    try {
      console.log(`Processing email from ${emailData.from}: ${emailData.subject}`);

      // 1. Add to email queue with initial priority
      const queueId = await this.addToQueue(emailData, userId);
      
      // 2. Classify email
      const classification = await this.classifier.classify(emailData);
      console.log('Email classified:', classification);
      
      // 3. Route email based on classification
      const routing = await this.router.route(classification, userId);
      console.log('Email routed:', routing);
      
      // 4. Update queue item with classification and routing
      await this.queue.updateQueueItem(queueId, {
        metadata: {
          ...emailData.metadata,
          classification,
          routing
        },
        priority: routing.priority
      });
      
      // 5. Process based on routing decision
      const processingResult = await this.handleRouting(routing, queueId, userId, emailData, classification);
      
      // 6. Log the complete processing result
      await this.logProcessingResult(userId, emailData, classification, routing, processingResult);
      
      return { 
        success: true, 
        queueId, 
        classification, 
        routing, 
        processingResult 
      };

    } catch (error) {
      console.error('Email processing failed:', error);
      
      // Log the error
      await this.logProcessingError(userId, emailData, error);
      
      throw error;
    }
  }

  async addToQueue(emailData, userId) {
    const queueItem = {
      id: emailData.id || this.generateEmailId(),
      provider: emailData.provider || 'unknown',
      from: emailData.from,
      to: emailData.to || 'unknown',
      subject: emailData.subject || 'No subject',
      body: emailData.body || '',
      received_at: emailData.received_at || new Date().toISOString(),
      message_id: emailData.message_id,
      metadata: emailData.metadata || {}
    };

    return await this.queue.addToQueue(queueItem, userId);
  }

  async handleRouting(routing, queueId, userId, emailData, classification) {
    const results = {};

    try {
      // Mark queue item as processing
      await this.queue.markAsProcessing(queueId);

      // Handle auto-reply
      if (routing.auto_reply) {
        console.log('Generating auto-reply...');
        results.autoReply = await this.generateAutoReply(queueId, userId, emailData, classification);
      }

      // Handle escalation
      if (routing.escalate) {
        console.log('Escalating email...');
        results.escalation = await this.escalateEmail(queueId, userId, emailData, classification, routing);
      }

      // Handle immediate notification
      if (routing.notify_immediately) {
        console.log('Sending immediate notification...');
        results.notification = await this.sendImmediateNotification(userId, emailData, classification, routing);
      }

      // Handle main action
      switch (routing.action) {
        case 'auto_reply':
          if (!results.autoReply) {
            results.autoReply = await this.generateAutoReply(queueId, userId, emailData, classification);
          }
          break;
          
        case 'escalate':
          if (!results.escalation) {
            results.escalation = await this.escalateEmail(queueId, userId, emailData, classification, routing);
          }
          break;
          
        case 'queue_for_review':
          results.queued = await this.queueForReview(queueId, userId, emailData, classification, routing);
          break;
          
        default:
          results.default = await this.defaultAction(queueId, userId, emailData, classification);
      }

      // Mark as completed
      await this.queue.markAsCompleted(queueId, results);
      
      return results;

    } catch (error) {
      console.error('Routing handling failed:', error);
      
      // Mark as failed
      await this.queue.markAsFailed(queueId, error.message);
      
      throw error;
    }
  }

  async generateAutoReply(queueId, userId, emailData, classification) {
    try {
      // Get business context
      const businessContext = await this.getBusinessContext(userId);
      
      // Generate personalized response using StyleAwareAI
      const responseResult = await this.styleAI.generateResponseWithCategory(
        userId,
        emailData,
        classification.category,
        businessContext
      );

      if (!responseResult.success) {
        throw new Error('Failed to generate AI response: ' + responseResult.error);
      }

      // Store the generated response
      const { data: responseData, error: responseError } = await supabase
        .from('ai_responses')
        .insert({
          user_id: userId,
          queue_id: queueId,
          email_id: emailData.id,
          category: classification.category,
          urgency: classification.urgency,
          ai_response: responseResult.response,
          style_applied: responseResult.styleApplied,
          confidence: responseResult.confidence,
          response_type: 'auto_reply',
          status: 'generated'
        })
        .select('id')
        .single();

      if (responseError) {
        console.error('Failed to store AI response:', responseError);
      }

      return {
        success: true,
        responseId: responseData?.id,
        response: responseResult.response,
        styleApplied: responseResult.styleApplied,
        confidence: responseResult.confidence,
        method: 'ai_generated'
      };

    } catch (error) {
      console.error('Auto-reply generation failed:', error);
      
      // Fallback to simple template response
      return this.generateFallbackResponse(emailData, classification);
    }
  }

  async escalateEmail(queueId, userId, emailData, classification, routing) {
    try {
      // Get escalation rules for this user
      const { data: escalationRules } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: true });

      // Find matching escalation rule
      const matchingRule = this.findMatchingEscalationRule(escalationRules, classification, routing);
      
      // Create escalation record
      const { data: escalationData, error: escalationError } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from,
          email_subject: emailData.subject,
          category: classification.category,
          urgency: classification.urgency,
          escalated: true,
          escalation_reason: routing.routing_reason,
          escalation_rule_id: matchingRule?.id
        })
        .select('id')
        .single();

      if (escalationError) {
        console.error('Failed to create escalation record:', escalationError);
      }

      return {
        success: true,
        escalationId: escalationData?.id,
        rule: matchingRule,
        reason: routing.routing_reason,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Email escalation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async queueForReview(queueId, userId, emailData, classification, routing) {
    try {
      // Update queue item status to indicate manual review needed
      await this.queue.updateQueueItem(queueId, {
        status: 'pending_review',
        review_required: true,
        review_reason: 'Requires manual review based on classification and routing rules'
      });

      return {
        success: true,
        action: 'queued_for_review',
        priority: routing.priority,
        estimatedResponseTime: routing.max_response_time
      };

    } catch (error) {
      console.error('Queue for review failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendImmediateNotification(userId, emailData, classification, routing) {
    try {
      // Get notification settings
      const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      const notifications = [];

      // Email notification
      if (notificationSettings?.email_notifications) {
        notifications.push({
          type: 'email',
          status: 'simulated', // In real implementation, would send actual email
          message: `Urgent email received from ${emailData.from}: ${emailData.subject}`
        });
      }

      // SMS notification (if configured)
      if (notificationSettings?.sms_notifications && notificationSettings.phone_number) {
        notifications.push({
          type: 'sms',
          status: 'simulated', // In real implementation, would send actual SMS
          message: `Urgent: Email from ${emailData.from}`
        });
      }

      return {
        success: true,
        notifications,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Immediate notification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async defaultAction(queueId, userId, emailData, classification) {
    // Default action is to queue for review with standard priority
    return this.queueForReview(queueId, userId, emailData, classification, {
      priority: 50,
      max_response_time: 1440 // 24 hours
    });
  }

  async getBusinessContext(userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', userId)
        .single();

      const clientConfig = profile?.client_config || {};
      
      return {
        businessName: clientConfig.business?.name || 'Business',
        businessType: clientConfig.business?.type || 'Service Business',
        industry: clientConfig.business?.industry || 'General',
        phone: clientConfig.business?.phone,
        email: clientConfig.business?.email
      };

    } catch (error) {
      console.error('Failed to get business context:', error);
      return {
        businessName: 'Business',
        businessType: 'Service Business',
        industry: 'General'
      };
    }
  }

  generateFallbackResponse(emailData, classification) {
    const templates = {
      urgent: `Thank you for your urgent message. We have received your email and will respond immediately. If this is an emergency, please call us directly.`,
      
      complaint: `Thank you for bringing this to our attention. We take all customer concerns seriously and will investigate this matter promptly. We will follow up with you within 24 hours.`,
      
      appointment: `Thank you for your interest in scheduling service with us. We will review your request and get back to you with available time slots within 24 hours.`,
      
      inquiry: `Thank you for your inquiry. We have received your message and will respond with the information you need within 24 hours.`,
      
      general: `Thank you for your email. We have received your message and will respond promptly.`
    };

    const template = templates[classification.category] || templates.general;

    return {
      success: true,
      response: template,
      styleApplied: false,
      confidence: 50,
      method: 'template_fallback'
    };
  }

  findMatchingEscalationRule(rules, classification, routing) {
    if (!rules || rules.length === 0) {
      return null;
    }

    // Find the first matching rule based on priority
    return rules.find(rule => {
      if (rule.condition === 'all_emails') return true;
      if (rule.condition === 'urgency' && rule.value === classification.urgency) return true;
      if (rule.condition === 'category' && rule.value === classification.category) return true;
      if (rule.condition === 'sentiment' && rule.value === classification.sentiment) return true;
      return false;
    });
  }

  async logProcessingResult(userId, emailData, classification, routing, processingResult) {
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from,
          email_subject: emailData.subject,
          category: classification.category,
          urgency: classification.urgency,
          routing_action: routing.action,
          auto_reply_sent: !!processingResult.autoReply?.success,
          escalated: !!processingResult.escalation?.success,
          processing_completed: true,
          processing_result: processingResult
        });

    } catch (error) {
      console.error('Failed to log processing result:', error);
    }
  }

  async logProcessingError(userId, emailData, error) {
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from || 'unknown',
          email_subject: emailData.subject || 'No subject',
          category: 'error',
          urgency: 'normal',
          processing_completed: false,
          error_message: error.message,
          processing_result: { error: error.message, success: false }
        });

    } catch (logError) {
      console.error('Failed to log processing error:', logError);
    }
  }

  generateEmailId() {
    return 'email_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Batch processing methods
  async processBatch(emails, userId) {
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await this.processEmail(email, userId);
        results.push({
          emailId: email.id,
          success: true,
          result
        });
      } catch (error) {
        console.error(`Failed to process email ${email.id}:`, error);
        results.push({
          emailId: email.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Start automated processing from queue
  async startQueueProcessing(userId = null, intervalMs = 30000) {
    if (this.isProcessing) {
      console.log('Email processing already running');
      return;
    }

    this.isProcessing = true;
    console.log('Starting automated email queue processing...');

    const processQueueBatch = async () => {
      try {
        const batch = await this.queue.getNextBatch(userId, 'pending');
        
        if (batch.length > 0) {
          console.log(`Processing ${batch.length} emails from queue`);
          
          for (const queueItem of batch) {
            try {
              // Reconstruct email data from queue item
              const emailData = {
                id: queueItem.email_id,
                provider: queueItem.provider,
                from: queueItem.from_email,
                to: queueItem.to_email,
                subject: queueItem.subject,
                body: queueItem.body,
                metadata: queueItem.metadata
              };

              // Process the email if it hasn't been processed yet
              if (queueItem.status === 'pending') {
                await this.processEmail(emailData, queueItem.user_id);
              }

            } catch (error) {
              console.error(`Failed to process queued email ${queueItem.id}:`, error);
              await this.queue.markAsFailed(queueItem.id, error.message);
            }
          }
        }

      } catch (error) {
        console.error('Queue processing batch failed:', error);
      }
    };

    // Process immediately, then set up interval
    await processQueueBatch();
    
    this.processingInterval = setInterval(processQueueBatch, intervalMs);
    
    console.log(`Email queue processing started with ${intervalMs}ms interval`);
  }

  stopQueueProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.isProcessing = false;
      console.log('Email queue processing stopped');
    }
  }

  // Get processing statistics
  async getProcessingStats(userId = null) {
    try {
      const queueStats = await this.queue.getQueueStats(userId);
      
      let query = supabase
        .from('email_logs')
        .select('category, urgency, auto_reply_sent, escalated, processing_completed, created_at');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: logs, error } = await query.limit(1000);

      if (error) throw error;

      const processingStats = {
        queue: queueStats,
        processed: {
          total: logs.length,
          successful: logs.filter(log => log.processing_completed).length,
          failed: logs.filter(log => !log.processing_completed).length,
          autoReplies: logs.filter(log => log.auto_reply_sent).length,
          escalations: logs.filter(log => log.escalated).length
        },
        categories: {},
        urgencyLevels: {}
      };

      // Count by category and urgency
      logs.forEach(log => {
        processingStats.categories[log.category] = (processingStats.categories[log.category] || 0) + 1;
        processingStats.urgencyLevels[log.urgency] = (processingStats.urgencyLevels[log.urgency] || 0) + 1;
      });

      return processingStats;

    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return null;
    }
  }
}
