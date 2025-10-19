/**
 * Advanced Notifications System for FloWorx
 * Enhanced notification management with advanced features
 */

import { supabase } from './customSupabaseClient.js';
import { notificationService } from './notificationService.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class AdvancedNotifications {
  constructor() {
    this.notificationService = notificationService;
    this.notificationTypes = {
      // Email notifications
      EMAIL_RECEIVED: 'email_received',
      EMAIL_PROCESSED: 'email_processed',
      EMAIL_ESCALATED: 'email_escalated',
      EMAIL_CATEGORIZED: 'email_categorized',
      
      // Workflow notifications
      WORKFLOW_DEPLOYED: 'workflow_deployed',
      WORKFLOW_FAILED: 'workflow_failed',
      WORKFLOW_UPDATED: 'workflow_updated',
      WORKFLOW_EXECUTED: 'workflow_executed',
      
      // Integration notifications
      INTEGRATION_CONNECTED: 'integration_connected',
      INTEGRATION_DISCONNECTED: 'integration_disconnected',
      INTEGRATION_ERROR: 'integration_error',
      INTEGRATION_SYNC: 'integration_sync',
      
      // System notifications
      SYSTEM_ALERT: 'system_alert',
      SYSTEM_MAINTENANCE: 'system_maintenance',
      SYSTEM_UPDATE: 'system_update',
      PERFORMANCE_WARNING: 'performance_warning',
      
      // Security notifications
      SECURITY_ALERT: 'security_alert',
      SECURITY_BREACH: 'security_breach',
      LOGIN_ATTEMPT: 'login_attempt',
      PERMISSION_CHANGE: 'permission_change',
      
      // Business notifications
      BILLING_REMINDER: 'billing_reminder',
      BILLING_FAILED: 'billing_failed',
      QUOTA_EXCEEDED: 'quota_exceeded',
      FEATURE_AVAILABLE: 'feature_available',
      
      // User notifications
      ONBOARDING_REMINDER: 'onboarding_reminder',
      PROFILE_UPDATE: 'profile_update',
      PASSWORD_CHANGE: 'password_change',
      ACCOUNT_SUSPENDED: 'account_suspended',
      
      // Analytics notifications
      DAILY_SUMMARY: 'daily_summary',
      WEEKLY_REPORT: 'weekly_report',
      MONTHLY_REPORT: 'monthly_report',
      GOAL_ACHIEVED: 'goal_achieved',
      
      // Custom notifications
      CUSTOM_ALERT: 'custom_alert',
      CUSTOM_REMINDER: 'custom_reminder',
      CUSTOM_REPORT: 'custom_report'
    };
    
    this.notificationChannels = {
      EMAIL: 'email',
      PUSH: 'push',
      SMS: 'sms',
      SLACK: 'slack',
      WEBHOOK: 'webhook',
      IN_APP: 'in_app'
    };
    
    this.notificationPriorities = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    this.notificationCategories = {
      EMAIL: 'email',
      WORKFLOW: 'workflow',
      INTEGRATION: 'integration',
      SYSTEM: 'system',
      SECURITY: 'security',
      BILLING: 'billing',
      USER: 'user',
      ANALYTICS: 'analytics',
      CUSTOM: 'custom'
    };
  }

  /**
   * Send advanced notification with enhanced features
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} options - Advanced options
   * @returns {Promise<Object>} Notification result
   */
  async sendAdvancedNotification(userId, type, data = {}, options = {}) {
    try {
      logger.info('Sending advanced notification', { userId, type, data, options });

      // Validate notification type
      if (!this.notificationTypes[type]) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      // Get user notification preferences
      const preferences = await this.getUserNotificationPreferences(userId);
      
      // Check if notification is enabled for user
      if (!this.isNotificationEnabled(preferences, type)) {
        logger.info('Notification disabled for user', { userId, type });
        return { success: false, reason: 'Notification disabled' };
      }

      // Check notification frequency limits
      if (await this.isFrequencyLimited(userId, type, preferences)) {
        logger.info('Notification frequency limited', { userId, type });
        return { success: false, reason: 'Frequency limited' };
      }

      // Check quiet hours
      if (this.isQuietHours(preferences, options.priority)) {
        logger.info('Notification blocked by quiet hours', { userId, type });
        return { success: false, reason: 'Quiet hours' };
      }

      // Prepare enhanced notification data
      const enhancedData = await this.prepareEnhancedNotificationData(userId, type, data, options);
      
      // Determine notification channels
      const channels = this.getEnabledChannels(preferences, type, options);
      
      // Send notifications through enabled channels
      const results = await this.sendToChannels(userId, type, enhancedData, channels, options);
      
      // Log notification with enhanced metadata
      await this.logAdvancedNotification(userId, type, enhancedData, results, options);
      
      // Track analytics
      analytics.trackBusinessEvent('advanced_notification_sent', {
        userId,
        type,
        channels: channels.map(c => c.name),
        priority: options.priority || 'normal',
        category: this.getNotificationCategory(type)
      });

      logger.info('Advanced notification sent successfully', { 
        userId, 
        type, 
        channels: channels.map(c => c.name),
        results 
      });

      return {
        success: true,
        results,
        channels: channels.map(c => c.name),
        notificationId: enhancedData.notificationId
      };

    } catch (error) {
      logger.error('Failed to send advanced notification', error, { userId, type, data });
      
      analytics.trackError(error, {
        operation: 'send_advanced_notification',
        userId,
        type
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user notification preferences with advanced settings
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserNotificationPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.warn('Failed to fetch notification preferences, using defaults', error);
        return this.getDefaultPreferences();
      }

      return data || this.getDefaultPreferences();
    } catch (error) {
      logger.error('Error fetching notification preferences', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user notification preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - New preferences
   * @returns {Promise<Object>} Update result
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update notification preferences: ${error.message}`);
      }

      logger.info('Notification preferences updated', { userId, preferences });
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to update notification preferences', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prepare enhanced notification data
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Raw data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Enhanced data
   */
  async prepareEnhancedNotificationData(userId, type, data, options) {
    try {
      // Get user profile for personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, company_name, business_type, timezone')
        .eq('id', userId)
        .single();

      // Get notification template
      const template = await this.getNotificationTemplate(type);
      
      // Generate unique notification ID
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare enhanced data
      return {
        ...data,
        notificationId,
        user: {
          id: userId,
          firstName: profile?.first_name || 'User',
          lastName: profile?.lastName || '',
          companyName: profile?.company_name || 'Your Company',
          businessType: profile?.business_type || 'business',
          timezone: profile?.timezone || 'UTC'
        },
        template,
        timestamp: new Date().toISOString(),
        priority: options.priority || this.getNotificationPriority(type),
        category: this.getNotificationCategory(type),
        channels: options.channels || [],
        expiresAt: options.expiresAt || this.getExpirationTime(type),
        requiresAcknowledgment: options.requiresAcknowledgment || false,
        actionRequired: options.actionRequired || false,
        appUrl: import.meta.env.VITE_APP_URL || 'https://app.floworx-iq.com',
        metadata: {
          source: options.source || 'system',
          version: options.version || '1.0',
          tags: options.tags || [],
          customData: options.customData || {}
        }
      };
    } catch (error) {
      logger.error('Failed to prepare enhanced notification data', error);
      return data;
    }
  }

  /**
   * Get notification template with enhanced features
   * @param {string} type - Notification type
   * @returns {Promise<Object>} Template
   */
  async getNotificationTemplate(type) {
    try {
      // Import templates dynamically
      const { notificationTemplates } = await import('../templates/notification-templates.js');
      const template = notificationTemplates[type] || notificationTemplates.DEFAULT;
      
      // Enhance template with advanced features
      return {
        ...template,
        actions: template.actions || [],
        richContent: template.richContent || false,
        interactive: template.interactive || false,
        persistent: template.persistent || false,
        sound: template.sound || 'default',
        vibration: template.vibration || [200, 100, 200],
        badge: template.badge || '/icons/floworx-badge.png',
        image: template.image || null,
        video: template.video || null
      };
    } catch (error) {
      logger.error('Failed to get notification template', error);
      return {
        subject: 'FloWorx Notification',
        title: 'FloWorx Notification',
        body: 'You have a new notification from FloWorx.',
        icon: '/icons/floworx-192.png',
        url: '{{appUrl}}/notifications'
      };
    }
  }

  /**
   * Check if notification is enabled for user
   * @param {Object} preferences - User preferences
   * @param {string} type - Notification type
   * @returns {boolean} Is enabled
   */
  isNotificationEnabled(preferences, type) {
    if (!preferences || !preferences[type]) {
      return true; // Default to enabled
    }
    
    return preferences[type].enabled !== false;
  }

  /**
   * Check if notification frequency is limited
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} preferences - User preferences
   * @returns {Promise<boolean>} Is limited
   */
  async isFrequencyLimited(userId, type, preferences) {
    try {
      const frequencyLimit = preferences[type]?.frequencyLimit || 'unlimited';
      
      if (frequencyLimit === 'unlimited') {
        return false;
      }

      // Get recent notifications of this type
      const { data } = await supabase
        .from('notifications_log')
        .select('sent_at')
        .eq('user_id', userId)
        .eq('type', type)
        .gte('sent_at', this.getFrequencyLimitTime(frequencyLimit))
        .limit(1);

      return data && data.length > 0;
    } catch (error) {
      logger.error('Failed to check frequency limit', error);
      return false;
    }
  }

  /**
   * Check if current time is within quiet hours
   * @param {Object} preferences - User preferences
   * @param {string} priority - Notification priority
   * @returns {boolean} Is quiet hours
   */
  isQuietHours(preferences, priority) {
    if (priority === 'critical') {
      return false; // Critical notifications bypass quiet hours
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const quietStart = this.timeToMinutes(preferences.quiet_hours_start);
    const quietEnd = this.timeToMinutes(preferences.quiet_hours_end);

    if (quietStart <= quietEnd) {
      return currentTime >= quietStart && currentTime <= quietEnd;
    } else {
      // Quiet hours span midnight
      return currentTime >= quietStart || currentTime <= quietEnd;
    }
  }

  /**
   * Get enabled notification channels
   * @param {Object} preferences - User preferences
   * @param {string} type - Notification type
   * @param {Object} options - Options
   * @returns {Array} Enabled channels
   */
  getEnabledChannels(preferences, type, options) {
    const channels = [];
    const typePreferences = preferences[type] || {};
    
    // Check each channel
    if (typePreferences.email && this.notificationService.emailNotifier) {
      channels.push({
        name: 'email',
        priority: typePreferences.emailPriority || 'normal',
        template: typePreferences.emailTemplate || 'default'
      });
    }
    
    if (typePreferences.push && this.notificationService.pushNotifier) {
      channels.push({
        name: 'push',
        priority: typePreferences.pushPriority || 'normal',
        template: typePreferences.pushTemplate || 'default'
      });
    }
    
    if (typePreferences.sms && this.notificationService.smsNotifier) {
      channels.push({
        name: 'sms',
        priority: typePreferences.smsPriority || 'high',
        template: typePreferences.smsTemplate || 'default'
      });
    }
    
    if (typePreferences.slack && this.notificationService.slackNotifier) {
      channels.push({
        name: 'slack',
        priority: typePreferences.slackPriority || 'normal',
        template: typePreferences.slackTemplate || 'default'
      });
    }
    
    if (typePreferences.webhook && this.notificationService.webhookNotifier) {
      channels.push({
        name: 'webhook',
        priority: typePreferences.webhookPriority || 'normal',
        template: typePreferences.webhookTemplate || 'default'
      });
    }
    
    if (typePreferences.in_app !== false) {
      channels.push({
        name: 'in_app',
        priority: typePreferences.inAppPriority || 'normal',
        template: typePreferences.inAppTemplate || 'default'
      });
    }
    
    return channels;
  }

  /**
   * Send notifications to enabled channels
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Array} channels - Enabled channels
   * @param {Object} options - Options
   * @returns {Promise<Object>} Send results
   */
  async sendToChannels(userId, type, data, channels, options) {
    const results = {
      total: channels.length,
      successful: 0,
      failed: 0,
      channels: {}
    };

    // Send to each channel
    for (const channel of channels) {
      try {
        let result;
        
        switch (channel.name) {
          case 'email':
            result = await this.notificationService.emailNotifier.send(userId, type, data);
            break;
          case 'push':
            result = await this.notificationService.pushNotifier.send(userId, type, data);
            break;
          case 'sms':
            result = await this.notificationService.smsNotifier.send(userId, type, data);
            break;
          case 'slack':
            result = await this.sendSlackNotification(userId, type, data);
            break;
          case 'webhook':
            result = await this.sendWebhookNotification(userId, type, data);
            break;
          case 'in_app':
            result = await this.sendInAppNotification(userId, type, data);
            break;
          default:
            result = { success: false, error: 'Unknown channel' };
        }
        
        if (result.success) {
          results.successful++;
          results.channels[channel.name] = { success: true, messageId: result.messageId };
        } else {
          results.failed++;
          results.channels[channel.name] = { success: false, error: result.error };
        }
      } catch (error) {
        results.failed++;
        results.channels[channel.name] = { success: false, error: error.message };
      }
    }

    return results;
  }

  /**
   * Send Slack notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendSlackNotification(userId, type, data) {
    try {
      // Get user Slack configuration
      const { data: slackConfig } = await supabase
        .from('user_integrations')
        .select('config')
        .eq('user_id', userId)
        .eq('integration_type', 'slack')
        .single();

      if (!slackConfig) {
        return { success: false, error: 'Slack not configured' };
      }

      // Prepare Slack message
      const message = {
        channel: slackConfig.config.channel || '#notifications',
        text: data.template.title,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${data.template.title}*\n${data.template.body}`
            }
          }
        ],
        attachments: [
          {
            color: this.getSlackColor(data.priority),
            fields: [
              {
                title: 'Type',
                value: type,
                short: true
              },
              {
                title: 'Priority',
                value: data.priority,
                short: true
              }
            ],
            actions: [
              {
                type: 'button',
                text: 'View Details',
                url: data.template.url
              }
            ]
          }
        ]
      };

      // Send to Slack (simulated)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `slack_${Date.now()}`,
        channel: 'slack'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send webhook notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendWebhookNotification(userId, type, data) {
    try {
      // Get user webhook configuration
      const { data: webhookConfig } = await supabase
        .from('user_integrations')
        .select('config')
        .eq('user_id', userId)
        .eq('integration_type', 'webhook')
        .single();

      if (!webhookConfig) {
        return { success: false, error: 'Webhook not configured' };
      }

      // Prepare webhook payload
      const payload = {
        notificationId: data.notificationId,
        type,
        timestamp: data.timestamp,
        priority: data.priority,
        category: data.category,
        title: data.template.title,
        body: data.template.body,
        url: data.template.url,
        user: data.user,
        metadata: data.metadata
      };

      // Send webhook (simulated)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        success: true,
        messageId: `webhook_${Date.now()}`,
        channel: 'webhook'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send in-app notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Send result
   */
  async sendInAppNotification(userId, type, data) {
    try {
      // Store in-app notification
      const { data: notification, error } = await supabase
        .from('in_app_notifications')
        .insert({
          user_id: userId,
          type,
          title: data.template.title,
          body: data.template.body,
          url: data.template.url,
          priority: data.priority,
          category: data.category,
          data: data,
          read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to store in-app notification: ${error.message}`);
      }

      return {
        success: true,
        messageId: notification.id,
        channel: 'in_app'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Log advanced notification with enhanced metadata
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} results - Send results
   * @param {Object} options - Options
   * @returns {Promise<void>}
   */
  async logAdvancedNotification(userId, type, data, results, options) {
    try {
      await supabase
        .from('notifications_log')
        .insert({
          user_id: userId,
          type,
          notification_id: data.notificationId,
          priority: data.priority,
          category: data.category,
          data: data,
          results,
          channels: results.channels,
          metadata: data.metadata,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Failed to log advanced notification', error);
    }
  }

  /**
   * Get notification priority
   * @param {string} type - Notification type
   * @returns {string} Priority
   */
  getNotificationPriority(type) {
    const priorityMap = {
      [this.notificationTypes.SECURITY_ALERT]: 'critical',
      [this.notificationTypes.SECURITY_BREACH]: 'critical',
      [this.notificationTypes.SYSTEM_ALERT]: 'high',
      [this.notificationTypes.WORKFLOW_FAILED]: 'high',
      [this.notificationTypes.BILLING_FAILED]: 'high',
      [this.notificationTypes.ACCOUNT_SUSPENDED]: 'high',
      [this.notificationTypes.EMAIL_ESCALATED]: 'normal',
      [this.notificationTypes.WORKFLOW_DEPLOYED]: 'normal',
      [this.notificationTypes.INTEGRATION_CONNECTED]: 'normal',
      [this.notificationTypes.DAILY_SUMMARY]: 'low',
      [this.notificationTypes.WEEKLY_REPORT]: 'low',
      [this.notificationTypes.MONTHLY_REPORT]: 'low'
    };
    
    return priorityMap[type] || 'normal';
  }

  /**
   * Get notification category
   * @param {string} type - Notification type
   * @returns {string} Category
   */
  getNotificationCategory(type) {
    if (type.includes('EMAIL')) return 'email';
    if (type.includes('WORKFLOW')) return 'workflow';
    if (type.includes('INTEGRATION')) return 'integration';
    if (type.includes('SYSTEM')) return 'system';
    if (type.includes('SECURITY')) return 'security';
    if (type.includes('BILLING')) return 'billing';
    if (type.includes('USER') || type.includes('ONBOARDING')) return 'user';
    if (type.includes('SUMMARY') || type.includes('REPORT')) return 'analytics';
    return 'custom';
  }

  /**
   * Get expiration time for notification
   * @param {string} type - Notification type
   * @returns {string} Expiration time
   */
  getExpirationTime(type) {
    const expirationMap = {
      [this.notificationTypes.SECURITY_ALERT]: 24 * 60 * 60 * 1000, // 24 hours
      [this.notificationTypes.SYSTEM_ALERT]: 12 * 60 * 60 * 1000, // 12 hours
      [this.notificationTypes.WORKFLOW_FAILED]: 6 * 60 * 60 * 1000, // 6 hours
      [this.notificationTypes.EMAIL_ESCALATED]: 2 * 60 * 60 * 1000, // 2 hours
      [this.notificationTypes.DAILY_SUMMARY]: 7 * 24 * 60 * 60 * 1000, // 7 days
      [this.notificationTypes.WEEKLY_REPORT]: 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    
    const expirationMs = expirationMap[type] || 24 * 60 * 60 * 1000; // Default 24 hours
    return new Date(Date.now() + expirationMs).toISOString();
  }

  /**
   * Get frequency limit time
   * @param {string} frequencyLimit - Frequency limit
   * @returns {string} Time string
   */
  getFrequencyLimitTime(frequencyLimit) {
    const now = new Date();
    const limits = {
      '1min': 60 * 1000,
      '5min': 5 * 60 * 1000,
      '15min': 15 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
      '6hours': 6 * 60 * 60 * 1000,
      '1day': 24 * 60 * 60 * 1000
    };
    
    const limitMs = limits[frequencyLimit] || 60 * 60 * 1000; // Default 1 hour
    return new Date(now.getTime() - limitMs).toISOString();
  }

  /**
   * Get Slack color for priority
   * @param {string} priority - Priority level
   * @returns {string} Color
   */
  getSlackColor(priority) {
    const colors = {
      low: '#36a64f',
      normal: '#2eb886',
      high: '#ff9500',
      critical: '#ff0000'
    };
    
    return colors[priority] || colors.normal;
  }

  /**
   * Convert time string to minutes
   * @param {string} timeString - Time in HH:MM format
   * @returns {number} Minutes since midnight
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get default notification preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      slack_notifications: false,
      webhook_notifications: false,
      in_app_notifications: true,
      notification_frequency: 'immediate',
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      timezone: 'UTC',
      
      // Type-specific settings
      email_received: { 
        enabled: true, 
        email: true, 
        push: true, 
        sms: false,
        frequencyLimit: '5min'
      },
      email_processed: { 
        enabled: true, 
        email: true, 
        push: false, 
        sms: false,
        frequencyLimit: '15min'
      },
      workflow_deployed: { 
        enabled: true, 
        email: true, 
        push: true, 
        sms: false,
        frequencyLimit: '1hour'
      },
      workflow_failed: { 
        enabled: true, 
        email: true, 
        push: true, 
        sms: true,
        frequencyLimit: 'unlimited'
      },
      system_alert: { 
        enabled: true, 
        email: true, 
        push: true, 
        sms: true,
        frequencyLimit: 'unlimited'
      },
      security_alert: { 
        enabled: true, 
        email: true, 
        push: true, 
        sms: true,
        frequencyLimit: 'unlimited'
      },
      daily_summary: { 
        enabled: true, 
        email: true, 
        push: false, 
        sms: false,
        frequencyLimit: '1day'
      }
    };
  }

  /**
   * Send bulk advanced notifications
   * @param {Array} notifications - Array of notification objects
   * @returns {Promise<Object>} Bulk results
   */
  async sendBulkAdvancedNotifications(notifications) {
    const results = await Promise.allSettled(
      notifications.map(notification => 
        this.sendAdvancedNotification(
          notification.userId,
          notification.type,
          notification.data,
          notification.options
        )
      )
    );

    return {
      total: notifications.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
      results
    };
  }

  /**
   * Get notification history with advanced filtering
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Notification history
   */
  async getAdvancedNotificationHistory(userId, filters = {}) {
    try {
      let query = supabase
        .from('notifications_log')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.channel) {
        query = query.contains('channels', { [filters.channel]: {} });
      }

      if (filters.startDate) {
        query = query.gte('sent_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('sent_at', filters.endDate);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch notification history: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Failed to get advanced notification history', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const advancedNotifications = new AdvancedNotifications();

export default AdvancedNotifications;
