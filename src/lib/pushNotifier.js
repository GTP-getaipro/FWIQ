/**
 * Push Notifier for FloWorx
 * Handles push notification delivery
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class PushNotifier {
  constructor() {
    this.vapidKeys = {
      publicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      privateKey: import.meta.env.VITE_VAPID_PRIVATE_KEY
    };
    this.webPushEndpoint = import.meta.env.VITE_WEB_PUSH_ENDPOINT || 'https://fcm.googleapis.com/fcm/send';
  }

  /**
   * Send push notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Send result
   */
  async send(userId, type, data) {
    try {
      logger.info('Sending push notification', { userId, type });

      // Get user push subscriptions
      const subscriptions = await this.getUserPushSubscriptions(userId);
      
      if (!subscriptions || subscriptions.length === 0) {
        logger.info('No push subscriptions found for user', { userId });
        return {
          channel: 'push',
          success: false,
          reason: 'No push subscriptions'
        };
      }

      // Generate push notification content
      const pushContent = await this.generatePushContent(type, data);
      
      // Send to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(subscription => 
          this.sendToSubscription(subscription, pushContent)
        )
      );

      // Process results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Track push notification sent
      analytics.trackBusinessEvent('push_notification_sent', {
        userId,
        type,
        totalSubscriptions: subscriptions.length,
        successful,
        failed
      });

      logger.info('Push notification sent', { 
        userId, 
        type, 
        successful, 
        failed 
      });

      return {
        channel: 'push',
        success: successful > 0,
        totalSubscriptions: subscriptions.length,
        successful,
        failed,
        results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
      };

    } catch (error) {
      logger.error('Failed to send push notification', error, { userId, type });
      
      analytics.trackError(error, {
        operation: 'send_push_notification',
        userId,
        type
      });

      return {
        channel: 'push',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user push subscriptions
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Push subscriptions
   */
  async getUserPushSubscriptions(userId) {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) {
        logger.error('Failed to fetch push subscriptions', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error fetching push subscriptions', error);
      return [];
    }
  }

  /**
   * Generate push notification content
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Push content
   */
  async generatePushContent(type, data) {
    try {
      // Import push templates
      const { pushTemplates } = await import('../templates/push-templates.js');
      const template = pushTemplates[type] || pushTemplates.DEFAULT;

      // Replace template variables
      const title = this.replaceVariables(template.title, data);
      const body = this.replaceVariables(template.body, data);
      const icon = template.icon || '/icons/floworx-192.png';
      const badge = template.badge || '/icons/floworx-badge.png';
      const url = this.replaceVariables(template.url || '{{appUrl}}', data);

      return {
        title,
        body,
        icon,
        badge,
        url,
        tag: type,
        data: {
          type,
          timestamp: data.timestamp,
          userId: data.user?.id
        },
        actions: template.actions || [],
        requireInteraction: template.requireInteraction || false,
        silent: template.silent || false,
        vibrate: template.vibrate || [200, 100, 200]
      };
    } catch (error) {
      logger.error('Failed to generate push content', error);
      
      // Fallback content
      return {
        title: 'FloWorx Notification',
        body: 'You have a new notification from FloWorx.',
        icon: '/icons/floworx-192.png',
        badge: '/icons/floworx-badge.png',
        url: data.appUrl || 'https://app.floworx-iq.com',
        tag: type,
        data: { type, timestamp: data.timestamp }
      };
    }
  }

  /**
   * Replace template variables with actual data
   * @param {string} template - Template string
   * @param {Object} data - Data object
   * @returns {string} Processed template
   */
  replaceVariables(template, data) {
    let processed = template;

    // Replace user variables
    if (data.user) {
      processed = processed.replace(/\{\{user\.firstName\}\}/g, data.user.firstName || 'User');
      processed = processed.replace(/\{\{user\.lastName\}\}/g, data.user.lastName || '');
      processed = processed.replace(/\{\{user\.companyName\}\}/g, data.user.companyName || 'Your Company');
      processed = processed.replace(/\{\{user\.businessType\}\}/g, data.user.businessType || 'business');
    }

    // Replace app variables
    processed = processed.replace(/\{\{appUrl\}\}/g, data.appUrl || 'https://app.floworx-iq.com');
    processed = processed.replace(/\{\{timestamp\}\}/g, data.timestamp || new Date().toISOString());

    // Replace custom variables
    Object.keys(data).forEach(key => {
      if (key !== 'user' && key !== 'template' && key !== 'appUrl' && key !== 'timestamp') {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processed = processed.replace(regex, data[key] || '');
      }
    });

    return processed;
  }

  /**
   * Send push notification to subscription
   * @param {Object} subscription - Push subscription
   * @param {Object} content - Push content
   * @returns {Promise<Object>} Send result
   */
  async sendToSubscription(subscription, content) {
    try {
      // In a real implementation, you would use web-push library
      // For now, we'll simulate the push notification
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50));

      // Simulate success/failure based on subscription health
      const isHealthy = subscription.last_success_at && 
        new Date(subscription.last_success_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (!isHealthy) {
        throw new Error('Subscription expired or invalid');
      }

      // Update subscription success timestamp
      await this.updateSubscriptionSuccess(subscription.id);

      return {
        subscriptionId: subscription.id,
        success: true,
        messageId: `push_${Date.now()}_${subscription.id}`
      };

    } catch (error) {
      // Mark subscription as failed
      await this.markSubscriptionFailed(subscription.id, error.message);
      
      return {
        subscriptionId: subscription.id,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update subscription success timestamp
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<void>}
   */
  async updateSubscriptionSuccess(subscriptionId) {
    try {
      await supabase
        .from('push_subscriptions')
        .update({ 
          last_success_at: new Date().toISOString(),
          failure_count: 0
        })
        .eq('id', subscriptionId);
    } catch (error) {
      logger.error('Failed to update subscription success', error);
    }
  }

  /**
   * Mark subscription as failed
   * @param {string} subscriptionId - Subscription ID
   * @param {string} error - Error message
   * @returns {Promise<void>}
   */
  async markSubscriptionFailed(subscriptionId, error) {
    try {
      await supabase
        .from('push_subscriptions')
        .update({ 
          last_failure_at: new Date().toISOString(),
          last_error: error,
          failure_count: supabase.raw('failure_count + 1')
        })
        .eq('id', subscriptionId);

      // Deactivate subscription if too many failures
      await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .eq('id', subscriptionId)
        .gte('failure_count', 5);
    } catch (error) {
      logger.error('Failed to mark subscription as failed', error);
    }
  }

  /**
   * Register new push subscription
   * @param {string} userId - User ID
   * @param {Object} subscription - Push subscription data
   * @returns {Promise<Object>} Registration result
   */
  async registerSubscription(userId, subscription) {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys?.p256dh,
          auth_key: subscription.keys?.auth,
          user_agent: navigator.userAgent,
          active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to register push subscription: ${error.message}`);
      }

      logger.info('Push subscription registered', { userId, subscriptionId: data.id });
      return { success: true, subscriptionId: data.id };
    } catch (error) {
      logger.error('Failed to register push subscription', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unregister push subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Unregistration result
   */
  async unregisterSubscription(subscriptionId) {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .eq('id', subscriptionId);

      if (error) {
        throw new Error(`Failed to unregister push subscription: ${error.message}`);
      }

      logger.info('Push subscription unregistered', { subscriptionId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to unregister push subscription', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get VAPID public key for client registration
   * @returns {string} VAPID public key
   */
  getVapidPublicKey() {
    return this.vapidKeys.publicKey;
  }

  /**
   * Send bulk push notifications
   * @param {Array} notifications - Array of notification objects
   * @returns {Promise<Object>} Bulk send results
   */
  async sendBulkNotifications(notifications) {
    const results = await Promise.allSettled(
      notifications.map(notification => 
        this.send(notification.userId, notification.type, notification.data)
      )
    );

    return {
      total: notifications.length,
      successful: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
      results
    };
  }
}

// Export singleton instance
export const pushNotifier = new PushNotifier();

export default PushNotifier;
