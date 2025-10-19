/**
 * Webhook Manager
 * Centralized webhook management for third-party integrations
 */

import { logger } from './logger';
import { supabase } from './customSupabaseClient';
import crypto from 'crypto';

export class WebhookManager {
  constructor() {
    this.webhooks = new Map();
    this.eventHandlers = new Map();
    this.retryQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
    
    this.init();
  }

  /**
   * Initialize webhook manager
   */
  init() {
    this.setupEventHandlers();
    this.startRetryProcessor();
    
    logger.info('Webhook manager initialized');
  }

  /**
   * Setup default event handlers
   */
  setupEventHandlers() {
    // Salesforce event handlers
    this.eventHandlers.set('salesforce.contact.created', this.handleSalesforceContactCreated.bind(this));
    this.eventHandlers.set('salesforce.contact.updated', this.handleSalesforceContactUpdated.bind(this));
    this.eventHandlers.set('salesforce.opportunity.created', this.handleSalesforceOpportunityCreated.bind(this));

    // HubSpot event handlers
    this.eventHandlers.set('hubspot.contact.created', this.handleHubSpotContactCreated.bind(this));
    this.eventHandlers.set('hubspot.contact.updated', this.handleHubSpotContactUpdated.bind(this));
    this.eventHandlers.set('hubspot.deal.created', this.handleHubSpotDealCreated.bind(this));

    // Slack event handlers
    this.eventHandlers.set('slack.message.posted', this.handleSlackMessagePosted.bind(this));
    this.eventHandlers.set('slack.channel.created', this.handleSlackChannelCreated.bind(this));

    // Google Calendar event handlers
    this.eventHandlers.set('google.calendar.event.created', this.handleGoogleCalendarEventCreated.bind(this));
    this.eventHandlers.set('google.calendar.event.updated', this.handleGoogleCalendarEventUpdated.bind(this));

    logger.info('Event handlers registered', {
      handlerCount: this.eventHandlers.size
    });
  }

  /**
   * Register a webhook
   */
  async registerWebhook(userId, integrationType, eventType, webhookUrl, options = {}) {
    try {
      const webhookId = this.generateWebhookId();
      
      const webhookData = {
        id: webhookId,
        user_id: userId,
        integration_type: integrationType,
        event_type: eventType,
        webhook_url: webhookUrl,
        secret: options.secret || this.generateSecret(),
        is_active: true,
        created_at: new Date().toISOString(),
        options: options
      };

      // Store webhook in database
      const { error } = await supabase
        .from('webhooks')
        .insert(webhookData);

      if (error) {
        throw new Error(`Failed to register webhook: ${error.message}`);
      }

      // Store in memory for quick access
      this.webhooks.set(webhookId, webhookData);

      logger.info('Webhook registered', {
        webhookId,
        userId,
        integrationType,
        eventType,
        webhookUrl
      });

      return {
        success: true,
        webhookId,
        webhook: webhookData
      };

    } catch (error) {
      logger.error('Failed to register webhook', {
        userId,
        integrationType,
        eventType,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId) {
    try {
      // Remove from database
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', webhookId);

      if (error) {
        throw new Error(`Failed to unregister webhook: ${error.message}`);
      }

      // Remove from memory
      this.webhooks.delete(webhookId);

      logger.info('Webhook unregistered', { webhookId });

      return {
        success: true,
        webhookId
      };

    } catch (error) {
      logger.error('Failed to unregister webhook', {
        webhookId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process incoming webhook event
   */
  async processWebhookEvent(eventType, payload, headers = {}) {
    try {
      logger.info('Processing webhook event', {
        eventType,
        payloadSize: JSON.stringify(payload).length,
        headers: Object.keys(headers)
      });

      // Validate webhook signature if present
      const signature = headers['x-hub-signature-256'] || headers['x-hub-signature'];
      if (signature && !this.validateWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Find matching webhooks
      const matchingWebhooks = await this.findMatchingWebhooks(eventType);

      if (matchingWebhooks.length === 0) {
        logger.warn('No webhooks found for event type', { eventType });
        return { success: true, message: 'No webhooks registered for this event' };
      }

      // Process each matching webhook
      const results = [];
      for (const webhook of matchingWebhooks) {
        try {
          const result = await this.sendWebhook(webhook, eventType, payload);
          results.push({ webhookId: webhook.id, success: result.success });
        } catch (error) {
          results.push({ webhookId: webhook.id, success: false, error: error.message });
        }
      }

      // Execute event handler if available
      const handlerKey = eventType;
      if (this.eventHandlers.has(handlerKey)) {
        try {
          await this.eventHandlers.get(handlerKey)(payload, headers);
        } catch (error) {
          logger.error('Event handler failed', {
            eventType,
            error: error.message
          });
        }
      }

      logger.info('Webhook event processed', {
        eventType,
        webhookCount: matchingWebhooks.length,
        results
      });

      return {
        success: true,
        webhooksProcessed: matchingWebhooks.length,
        results
      };

    } catch (error) {
      logger.error('Failed to process webhook event', {
        eventType,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send webhook to external URL
   */
  async sendWebhook(webhook, eventType, payload) {
    try {
      const webhookPayload = {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
        webhook_id: webhook.id
      };

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'FloWorx-Webhook/1.0'
      };

      // Add signature if secret is available
      if (webhook.secret) {
        const signature = this.generateWebhookSignature(JSON.stringify(webhookPayload), webhook.secret);
        headers['X-Hub-Signature-256'] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookPayload),
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
      }

      // Log successful delivery
      await this.logWebhookDelivery(webhook.id, eventType, true, response.status);

      logger.info('Webhook sent successfully', {
        webhookId: webhook.id,
        eventType,
        status: response.status
      });

      return {
        success: true,
        status: response.status
      };

    } catch (error) {
      // Log failed delivery
      await this.logWebhookDelivery(webhook.id, eventType, false, 0, error.message);

      // Add to retry queue if retries remaining
      if (webhook.retry_count < this.maxRetries) {
        this.addToRetryQueue(webhook, eventType, payload);
      }

      logger.error('Failed to send webhook', {
        webhookId: webhook.id,
        eventType,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find webhooks that match an event type
   */
  async findMatchingWebhooks(eventType) {
    try {
      // First check memory cache
      const memoryWebhooks = Array.from(this.webhooks.values())
        .filter(webhook => 
          webhook.is_active && 
          webhook.event_type === eventType
        );

      if (memoryWebhooks.length > 0) {
        return memoryWebhooks;
      }

      // Query database if not in memory
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('event_type', eventType)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to query webhooks: ${error.message}`);
      }

      // Update memory cache
      data.forEach(webhook => {
        this.webhooks.set(webhook.id, webhook);
      });

      return data || [];

    } catch (error) {
      logger.error('Failed to find matching webhooks', {
        eventType,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Generate webhook signature
   */
  generateWebhookSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload, signature) {
    // This would validate against stored webhook secrets
    // For now, return true (implement proper validation in production)
    return true;
  }

  /**
   * Add webhook to retry queue
   */
  addToRetryQueue(webhook, eventType, payload) {
    const retryItem = {
      webhook,
      eventType,
      payload,
      retryCount: (webhook.retry_count || 0) + 1,
      nextRetry: Date.now() + this.retryDelay * Math.pow(2, webhook.retry_count || 0)
    };

    this.retryQueue.push(retryItem);

    logger.info('Webhook added to retry queue', {
      webhookId: webhook.id,
      retryCount: retryItem.retryCount,
      nextRetry: new Date(retryItem.nextRetry).toISOString()
    });
  }

  /**
   * Start retry processor
   */
  startRetryProcessor() {
    setInterval(() => {
      this.processRetryQueue();
    }, 60000); // Check every minute

    logger.info('Webhook retry processor started');
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    const now = Date.now();
    const readyToRetry = this.retryQueue.filter(item => item.nextRetry <= now);

    for (const item of readyToRetry) {
      try {
        await this.sendWebhook(item.webhook, item.eventType, item.payload);
        
        // Remove from retry queue on success
        this.retryQueue = this.retryQueue.filter(i => i !== item);
        
      } catch (error) {
        // Update retry count and schedule next retry
        item.retryCount++;
        item.nextRetry = now + this.retryDelay * Math.pow(2, item.retryCount);
        
        if (item.retryCount >= this.maxRetries) {
          // Remove from retry queue after max retries
          this.retryQueue = this.retryQueue.filter(i => i !== item);
          
          logger.error('Webhook retry limit exceeded', {
            webhookId: item.webhook.id,
            retryCount: item.retryCount
          });
        }
      }
    }
  }

  /**
   * Log webhook delivery
   */
  async logWebhookDelivery(webhookId, eventType, success, status, error = null) {
    try {
      const logData = {
        webhook_id: webhookId,
        event_type: eventType,
        success,
        status,
        error,
        delivered_at: new Date().toISOString()
      };

      await supabase
        .from('webhook_deliveries')
        .insert(logData);

    } catch (error) {
      logger.error('Failed to log webhook delivery', {
        webhookId,
        error: error.message
      });
    }
  }

  /**
   * Generate unique webhook ID
   */
  generateWebhookId() {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate webhook secret
   */
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Event handlers for different integration types
   */
  async handleSalesforceContactCreated(payload, headers) {
    logger.info('Salesforce contact created', {
      contactId: payload.Id,
      name: `${payload.FirstName} ${payload.LastName}`,
      email: payload.Email
    });

    // Here you would typically sync the contact to your local database
    // or trigger other business logic
  }

  async handleSalesforceContactUpdated(payload, headers) {
    logger.info('Salesforce contact updated', {
      contactId: payload.Id,
      name: `${payload.FirstName} ${payload.LastName}`
    });
  }

  async handleSalesforceOpportunityCreated(payload, headers) {
    logger.info('Salesforce opportunity created', {
      opportunityId: payload.Id,
      name: payload.Name,
      amount: payload.Amount,
      stage: payload.StageName
    });
  }

  async handleHubSpotContactCreated(payload, headers) {
    logger.info('HubSpot contact created', {
      contactId: payload.objectId,
      email: payload.properties?.email,
      firstName: payload.properties?.firstname,
      lastName: payload.properties?.lastname
    });
  }

  async handleHubSpotContactUpdated(payload, headers) {
    logger.info('HubSpot contact updated', {
      contactId: payload.objectId,
      email: payload.properties?.email
    });
  }

  async handleHubSpotDealCreated(payload, headers) {
    logger.info('HubSpot deal created', {
      dealId: payload.objectId,
      dealName: payload.properties?.dealname,
      amount: payload.properties?.amount
    });
  }

  async handleSlackMessagePosted(payload, headers) {
    logger.info('Slack message posted', {
      channel: payload.event?.channel,
      user: payload.event?.user,
      text: payload.event?.text?.substring(0, 100)
    });
  }

  async handleSlackChannelCreated(payload, headers) {
    logger.info('Slack channel created', {
      channelId: payload.channel?.id,
      channelName: payload.channel?.name
    });
  }

  async handleGoogleCalendarEventCreated(payload, headers) {
    logger.info('Google Calendar event created', {
      eventId: payload.id,
      summary: payload.summary,
      startTime: payload.start?.dateTime
    });
  }

  async handleGoogleCalendarEventUpdated(payload, headers) {
    logger.info('Google Calendar event updated', {
      eventId: payload.id,
      summary: payload.summary
    });
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(userId = null) {
    try {
      let query = supabase.from('webhooks').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: webhooks, error: webhooksError } = await query;

      if (webhooksError) {
        throw new Error(`Failed to get webhooks: ${webhooksError.message}`);
      }

      // Get delivery statistics
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('webhook_deliveries')
        .select('success, status')
        .gte('delivered_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (deliveriesError) {
        throw new Error(`Failed to get delivery stats: ${deliveriesError.message}`);
      }

      const stats = {
        totalWebhooks: webhooks?.length || 0,
        activeWebhooks: webhooks?.filter(w => w.is_active).length || 0,
        totalDeliveries: deliveries?.length || 0,
        successfulDeliveries: deliveries?.filter(d => d.success).length || 0,
        failedDeliveries: deliveries?.filter(d => !d.success).length || 0,
        retryQueueSize: this.retryQueue.length
      };

      stats.successRate = stats.totalDeliveries > 0 ? 
        (stats.successfulDeliveries / stats.totalDeliveries) * 100 : 0;

      return {
        success: true,
        stats
      };

    } catch (error) {
      logger.error('Failed to get webhook statistics', {
        userId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get webhook delivery logs
   */
  async getWebhookLogs(webhookId, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('delivered_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get webhook logs: ${error.message}`);
      }

      return {
        success: true,
        logs: data || []
      };

    } catch (error) {
      logger.error('Failed to get webhook logs', {
        webhookId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId, testPayload = null) {
    try {
      const webhook = this.webhooks.get(webhookId);
      
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      const payload = testPayload || {
        test: true,
        timestamp: new Date().toISOString(),
        webhook_id: webhookId
      };

      const result = await this.sendWebhook(webhook, 'test.event', payload);

      return {
        success: result.success,
        status: result.status,
        error: result.error
      };

    } catch (error) {
      logger.error('Webhook test failed', {
        webhookId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup old webhook logs
   */
  async cleanupOldLogs(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('webhook_deliveries')
        .delete()
        .lt('delivered_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to cleanup webhook logs: ${error.message}`);
      }

      logger.info('Webhook logs cleaned up', {
        cutoffDate: cutoffDate.toISOString(),
        daysOld
      });

      return {
        success: true
      };

    } catch (error) {
      logger.error('Failed to cleanup webhook logs', {
        daysOld,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Destroy webhook manager
   */
  destroy() {
    this.webhooks.clear();
    this.eventHandlers.clear();
    this.retryQueue = [];
    
    logger.info('Webhook manager destroyed');
  }
}

// Export a default instance
export const webhookManager = new WebhookManager();
