/**
 * Notification Service for FloWorx
 * Centralized notification management system
 */

import { supabase } from './customSupabaseClient.js';
import { emailNotifier } from './emailNotifier.js';
import { pushNotifier } from './pushNotifier.js';
import { smsNotifier } from './smsNotifier.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class NotificationService {
  constructor() {
    this.emailNotifier = emailNotifier;
    this.pushNotifier = pushNotifier;
    this.smsNotifier = smsNotifier;
    this.notificationTypes = {
      EMAIL_RECEIVED: 'email_received',
      EMAIL_PROCESSED: 'email_processed',
      WORKFLOW_DEPLOYED: 'workflow_deployed',
      WORKFLOW_FAILED: 'workflow_failed',
      INTEGRATION_CONNECTED: 'integration_connected',
      INTEGRATION_DISCONNECTED: 'integration_disconnected',
      SYSTEM_ALERT: 'system_alert',
      PERFORMANCE_WARNING: 'performance_warning',
      SECURITY_ALERT: 'security_alert',
      BILLING_REMINDER: 'billing_reminder',
      ONBOARDING_REMINDER: 'onboarding_reminder',
      DAILY_SUMMARY: 'daily_summary',
      WEEKLY_REPORT: 'weekly_report'
    };
  }

  /**
   * Send notification to user through all enabled channels
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} options - Notification options
   * @returns {Promise<Object>} Notification result
   */
  async sendNotification(userId, type, data = {}, options = {}) {
    try {
      logger.info('Sending notification', { userId, type, data });

      // Get user notification settings
      const userSettings = await this.getUserNotificationSettings(userId);
      
      if (!userSettings || !userSettings[type]?.enabled) {
        logger.info('Notification type disabled', { userId, type });
        return { success: false, reason: 'Notification type disabled' };
      }

      // Check quiet hours
      if (this.isQuietHours(userSettings, options.force)) {
        logger.info('Notification blocked by quiet hours', { userId, type });
        return { success: false, reason: 'Quiet hours' };
      }

      // Prepare notification data
      const notificationData = await this.prepareNotificationData(userId, type, data);
      
      // Track notification attempt
      analytics.trackBusinessEvent('notification_sent', {
        userId,
        type,
        channels: this.getEnabledChannels(userSettings[type])
      });

      // Send notifications through all enabled channels
      const notifications = [];
      
      if (userSettings[type].email && this.emailNotifier) {
        notifications.push(
          this.emailNotifier.send(userId, type, notificationData)
            .catch(error => ({ channel: 'email', error: error.message }))
        );
      }
      
      if (userSettings[type].push && this.pushNotifier) {
        notifications.push(
          this.pushNotifier.send(userId, type, notificationData)
            .catch(error => ({ channel: 'push', error: error.message }))
        );
      }
      
      if (userSettings[type].sms && this.smsNotifier) {
        notifications.push(
          this.smsNotifier.send(userId, type, notificationData)
            .catch(error => ({ channel: 'sms', error: error.message }))
        );
      }

      // Wait for all notifications to complete
      const results = await Promise.allSettled(notifications);
      const processedResults = this.processResults(results, type);

      // Log notification in database
      await this.logNotification(userId, type, notificationData, processedResults);

      logger.info('Notification sent successfully', { 
        userId, 
        type, 
        results: processedResults 
      });

      return {
        success: true,
        results: processedResults,
        channels: this.getEnabledChannels(userSettings[type])
      };

    } catch (error) {
      logger.error('Failed to send notification', error, { userId, type, data });
      
      analytics.trackError(error, {
        operation: 'send_notification',
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
   * Get user notification settings
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User notification settings
   */
  async getUserNotificationSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.warn('Failed to fetch notification settings, using defaults', error);
        return this.getDefaultNotificationSettings();
      }

      return data || this.getDefaultNotificationSettings();
    } catch (error) {
      logger.error('Error fetching notification settings', error);
      return this.getDefaultNotificationSettings();
    }
  }

  /**
   * Update user notification settings
   * @param {string} userId - User ID
   * @param {Object} settings - New settings
   * @returns {Promise<Object>} Update result
   */
  async updateNotificationSettings(userId, settings) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update notification settings: ${error.message}`);
      }

      logger.info('Notification settings updated', { userId, settings });
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to update notification settings', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prepare notification data with templates
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Raw data
   * @returns {Promise<Object>} Prepared notification data
   */
  async prepareNotificationData(userId, type, data) {
    try {
      // Get user profile for personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, company_name, business_type')
        .eq('id', userId)
        .single();

      // Get notification template
      const template = await this.getNotificationTemplate(type);
      
      // Prepare personalized data
      return {
        ...data,
        user: {
          id: userId,
          firstName: profile?.first_name || 'User',
          lastName: profile?.last_name || '',
          companyName: profile?.company_name || 'Your Company',
          businessType: profile?.business_type || 'business'
        },
        template,
        timestamp: new Date().toISOString(),
        appUrl: import.meta.env.VITE_APP_URL || 'https://app.floworx-iq.com'
      };
    } catch (error) {
      logger.error('Failed to prepare notification data', error);
      return data;
    }
  }

  /**
   * Get notification template
   * @param {string} type - Notification type
   * @returns {Promise<Object>} Notification template
   */
  async getNotificationTemplate(type) {
    // Import templates dynamically to avoid circular dependencies
    const { notificationTemplates } = await import('../templates/notification-templates.js');
    return notificationTemplates[type] || notificationTemplates.DEFAULT;
  }

  /**
   * Check if current time is within quiet hours
   * @param {Object} settings - User notification settings
   * @param {boolean} force - Force notification regardless of quiet hours
   * @returns {boolean} True if in quiet hours
   */
  isQuietHours(settings, force = false) {
    if (force) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    if (!settings.quiet_hours_start || !settings.quiet_hours_end) {
      return false;
    }

    const quietStart = this.timeToMinutes(settings.quiet_hours_start);
    const quietEnd = this.timeToMinutes(settings.quiet_hours_end);

    if (quietStart <= quietEnd) {
      return currentTime >= quietStart && currentTime <= quietEnd;
    } else {
      // Quiet hours span midnight
      return currentTime >= quietStart || currentTime <= quietEnd;
    }
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
   * Get enabled notification channels
   * @param {Object} typeSettings - Type-specific settings
   * @returns {Array} Enabled channels
   */
  getEnabledChannels(typeSettings) {
    const channels = [];
    if (typeSettings.email) channels.push('email');
    if (typeSettings.push) channels.push('push');
    if (typeSettings.sms) channels.push('sms');
    return channels;
  }

  /**
   * Process notification results
   * @param {Array} results - Promise results
   * @param {string} type - Notification type
   * @returns {Object} Processed results
   */
  processResults(results, type) {
    const processed = {
      total: results.length,
      successful: 0,
      failed: 0,
      channels: {}
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        processed.successful++;
        processed.channels[result.value.channel] = {
          success: true,
          messageId: result.value.messageId || null
        };
      } else {
        processed.failed++;
        processed.channels[result.reason.channel] = {
          success: false,
          error: result.reason.error
        };
      }
    });

    return processed;
  }

  /**
   * Log notification in database
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} results - Notification results
   * @returns {Promise<void>}
   */
  async logNotification(userId, type, data, results) {
    try {
      await supabase
        .from('notifications_log')
        .insert({
          user_id: userId,
          type,
          data,
          results,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Failed to log notification', error);
    }
  }

  /**
   * Get default notification settings
   * @returns {Object} Default settings
   */
  getDefaultNotificationSettings() {
    return {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      notification_frequency: 'immediate',
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      
      // Type-specific settings
      email_received: { enabled: true, email: true, push: true, sms: false },
      email_processed: { enabled: true, email: true, push: false, sms: false },
      workflow_deployed: { enabled: true, email: true, push: true, sms: false },
      workflow_failed: { enabled: true, email: true, push: true, sms: true },
      integration_connected: { enabled: true, email: true, push: true, sms: false },
      integration_disconnected: { enabled: true, email: true, push: true, sms: false },
      system_alert: { enabled: true, email: true, push: true, sms: true },
      performance_warning: { enabled: true, email: true, push: false, sms: false },
      security_alert: { enabled: true, email: true, push: true, sms: true },
      billing_reminder: { enabled: true, email: true, push: false, sms: false },
      onboarding_reminder: { enabled: true, email: true, push: true, sms: false },
      daily_summary: { enabled: true, email: true, push: false, sms: false },
      weekly_report: { enabled: true, email: true, push: false, sms: false }
    };
  }

  /**
   * Send bulk notifications
   * @param {Array} notifications - Array of notification objects
   * @returns {Promise<Object>} Bulk notification results
   */
  async sendBulkNotifications(notifications) {
    const results = await Promise.allSettled(
      notifications.map(notification => 
        this.sendNotification(
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
   * Get notification history for user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Notification history
   */
  async getNotificationHistory(userId, filters = {}) {
    try {
      let query = supabase
        .from('notifications_log')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false });

      if (filters.type) {
        query = query.eq('type', filters.type);
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
      logger.error('Failed to get notification history', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default NotificationService;
