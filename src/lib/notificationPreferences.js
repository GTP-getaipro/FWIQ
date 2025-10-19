/**
 * Notification Preferences Manager for FloWorx
 * Advanced notification preferences and settings management
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class NotificationPreferencesManager {
  constructor() {
    this.preferenceCategories = {
      EMAIL: 'email',
      PUSH: 'push',
      SMS: 'sms',
      SLACK: 'slack',
      WEBHOOK: 'webhook',
      IN_APP: 'in_app',
      REALTIME: 'realtime'
    };
    
    this.notificationTypes = {
      EMAIL_RECEIVED: 'email_received',
      EMAIL_PROCESSED: 'email_processed',
      EMAIL_ESCALATED: 'email_escalated',
      WORKFLOW_DEPLOYED: 'workflow_deployed',
      WORKFLOW_FAILED: 'workflow_failed',
      INTEGRATION_CONNECTED: 'integration_connected',
      INTEGRATION_DISCONNECTED: 'integration_disconnected',
      SYSTEM_ALERT: 'system_alert',
      SECURITY_ALERT: 'security_alert',
      BILLING_REMINDER: 'billing_reminder',
      DAILY_SUMMARY: 'daily_summary',
      WEEKLY_REPORT: 'weekly_report'
    };
    
    this.frequencyOptions = {
      IMMEDIATE: 'immediate',
      HOURLY: 'hourly',
      DAILY: 'daily',
      WEEKLY: 'weekly',
      CUSTOM: 'custom'
    };
    
    this.priorityLevels = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
  }

  /**
   * Get comprehensive notification preferences for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getNotificationPreferences(userId) {
    try {
      logger.info('Fetching notification preferences', { userId });

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.warn('Failed to fetch notification preferences, using defaults', error);
        return this.getDefaultPreferences();
      }

      const preferences = data || this.getDefaultPreferences();
      
      // Validate and sanitize preferences
      const validatedPreferences = this.validatePreferences(preferences);
      
      logger.info('Notification preferences fetched successfully', { userId });
      return validatedPreferences;

    } catch (error) {
      logger.error('Error fetching notification preferences', error, { userId });
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update notification preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - New preferences
   * @returns {Promise<Object>} Update result
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      logger.info('Updating notification preferences', { userId, preferences });

      // Validate preferences before saving
      const validatedPreferences = this.validatePreferences(preferences);
      
      // Merge with existing preferences to preserve unsaved fields
      const existingPreferences = await this.getNotificationPreferences(userId);
      const mergedPreferences = this.mergePreferences(existingPreferences, validatedPreferences);

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...mergedPreferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update notification preferences: ${error.message}`);
      }

      // Track analytics
      analytics.trackBusinessEvent('notification_preferences_updated', {
        userId,
        preferences: mergedPreferences,
        timestamp: new Date().toISOString()
      });

      logger.info('Notification preferences updated successfully', { userId });
      return { success: true, data };

    } catch (error) {
      logger.error('Failed to update notification preferences', error, { userId, preferences });
      
      analytics.trackError(error, {
        operation: 'update_notification_preferences',
        userId
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Update specific preference category
   * @param {string} userId - User ID
   * @param {string} category - Preference category
   * @param {Object} categoryPreferences - Category preferences
   * @returns {Promise<Object>} Update result
   */
  async updatePreferenceCategory(userId, category, categoryPreferences) {
    try {
      logger.info('Updating preference category', { userId, category, categoryPreferences });

      const existingPreferences = await this.getNotificationPreferences(userId);
      
      // Update specific category
      const updatedPreferences = {
        ...existingPreferences,
        [category]: {
          ...existingPreferences[category],
          ...categoryPreferences
        }
      };

      return await this.updateNotificationPreferences(userId, updatedPreferences);

    } catch (error) {
      logger.error('Failed to update preference category', error, { userId, category });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update notification type preferences
   * @param {string} userId - User ID
   * @param {string} notificationType - Notification type
   * @param {Object} typePreferences - Type-specific preferences
   * @returns {Promise<Object>} Update result
   */
  async updateNotificationTypePreferences(userId, notificationType, typePreferences) {
    try {
      logger.info('Updating notification type preferences', { userId, notificationType, typePreferences });

      const existingPreferences = await this.getNotificationPreferences(userId);
      
      // Update specific notification type
      const updatedPreferences = {
        ...existingPreferences,
        [notificationType]: {
          ...existingPreferences[notificationType],
          ...typePreferences
        }
      };

      return await this.updateNotificationPreferences(userId, updatedPreferences);

    } catch (error) {
      logger.error('Failed to update notification type preferences', error, { userId, notificationType });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset preferences to defaults
   * @param {string} userId - User ID
   * @param {string} category - Optional category to reset
   * @returns {Promise<Object>} Reset result
   */
  async resetPreferences(userId, category = null) {
    try {
      logger.info('Resetting notification preferences', { userId, category });

      if (category) {
        // Reset specific category
        const defaultPreferences = this.getDefaultPreferences();
        const existingPreferences = await this.getNotificationPreferences(userId);
        
        const updatedPreferences = {
          ...existingPreferences,
          [category]: defaultPreferences[category]
        };

        return await this.updateNotificationPreferences(userId, updatedPreferences);
      } else {
        // Reset all preferences
        const defaultPreferences = this.getDefaultPreferences();
        return await this.updateNotificationPreferences(userId, defaultPreferences);
      }

    } catch (error) {
      logger.error('Failed to reset preferences', error, { userId, category });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get preference recommendations based on user behavior
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Recommendations
   */
  async getPreferenceRecommendations(userId) {
    try {
      logger.info('Generating preference recommendations', { userId });

      // Get user notification history
      const { data: history } = await supabase
        .from('notifications_log')
        .select('type, priority, category, sent_at, acknowledged_at')
        .eq('user_id', userId)
        .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('sent_at', { ascending: false });

      // Analyze user behavior
      const analysis = this.analyzeUserBehavior(history || []);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(analysis);
      
      logger.info('Preference recommendations generated', { userId, recommendations });
      return { success: true, recommendations };

    } catch (error) {
      logger.error('Failed to generate preference recommendations', error, { userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate notification preferences
   * @param {Object} preferences - Preferences to validate
   * @returns {Object} Validated preferences
   */
  validatePreferences(preferences) {
    const validated = { ...preferences };

    // Validate global settings
    if (typeof validated.email_notifications !== 'boolean') {
      validated.email_notifications = true;
    }
    if (typeof validated.push_notifications !== 'boolean') {
      validated.push_notifications = true;
    }
    if (typeof validated.sms_notifications !== 'boolean') {
      validated.sms_notifications = false;
    }
    if (typeof validated.slack_notifications !== 'boolean') {
      validated.slack_notifications = false;
    }
    if (typeof validated.webhook_notifications !== 'boolean') {
      validated.webhook_notifications = false;
    }
    if (typeof validated.in_app_notifications !== 'boolean') {
      validated.in_app_notifications = true;
    }

    // Validate frequency
    if (!Object.values(this.frequencyOptions).includes(validated.notification_frequency)) {
      validated.notification_frequency = 'immediate';
    }

    // Validate quiet hours
    if (!this.isValidTimeFormat(validated.quiet_hours_start)) {
      validated.quiet_hours_start = '22:00';
    }
    if (!this.isValidTimeFormat(validated.quiet_hours_end)) {
      validated.quiet_hours_end = '08:00';
    }

    // Validate timezone
    if (!validated.timezone || typeof validated.timezone !== 'string') {
      validated.timezone = 'UTC';
    }

    // Validate notification type preferences
    Object.values(this.notificationTypes).forEach(type => {
      if (!validated[type]) {
        validated[type] = this.getDefaultTypePreferences(type);
      } else {
        validated[type] = this.validateTypePreferences(validated[type], type);
      }
    });

    return validated;
  }

  /**
   * Validate type-specific preferences
   * @param {Object} typePreferences - Type preferences
   * @param {string} type - Notification type
   * @returns {Object} Validated type preferences
   */
  validateTypePreferences(typePreferences, type) {
    const validated = { ...typePreferences };

    // Validate enabled status
    if (typeof validated.enabled !== 'boolean') {
      validated.enabled = true;
    }

    // Validate channel preferences
    const channels = ['email', 'push', 'sms', 'slack', 'webhook', 'in_app'];
    channels.forEach(channel => {
      if (typeof validated[channel] !== 'boolean') {
        validated[channel] = this.getDefaultChannelPreference(type, channel);
      }
    });

    // Validate priority
    if (!Object.values(this.priorityLevels).includes(validated.priority)) {
      validated.priority = this.getDefaultPriority(type);
    }

    // Validate frequency limit
    if (!validated.frequencyLimit || typeof validated.frequencyLimit !== 'string') {
      validated.frequencyLimit = 'unlimited';
    }

    return validated;
  }

  /**
   * Merge preferences with existing ones
   * @param {Object} existing - Existing preferences
   * @param {Object} newPreferences - New preferences
   * @returns {Object} Merged preferences
   */
  mergePreferences(existing, newPreferences) {
    const merged = { ...existing };

    // Merge global settings
    Object.keys(newPreferences).forEach(key => {
      if (typeof newPreferences[key] === 'object' && newPreferences[key] !== null && !Array.isArray(newPreferences[key])) {
        merged[key] = {
          ...merged[key],
          ...newPreferences[key]
        };
      } else {
        merged[key] = newPreferences[key];
      }
    });

    return merged;
  }

  /**
   * Analyze user behavior from notification history
   * @param {Array} history - Notification history
   * @returns {Object} Analysis results
   */
  analyzeUserBehavior(history) {
    const analysis = {
      totalNotifications: history.length,
      acknowledgedNotifications: history.filter(n => n.acknowledged_at).length,
      acknowledgmentRate: 0,
      typeFrequency: {},
      priorityDistribution: {},
      categoryDistribution: {},
      timePatterns: {},
      recommendations: []
    };

    if (history.length === 0) {
      return analysis;
    }

    // Calculate acknowledgment rate
    analysis.acknowledgmentRate = analysis.acknowledgedNotifications / analysis.totalNotifications;

    // Analyze by type
    history.forEach(notification => {
      const type = notification.type;
      const priority = notification.priority;
      const category = notification.category;
      const hour = new Date(notification.sent_at).getHours();

      // Type frequency
      analysis.typeFrequency[type] = (analysis.typeFrequency[type] || 0) + 1;

      // Priority distribution
      analysis.priorityDistribution[priority] = (analysis.priorityDistribution[priority] || 0) + 1;

      // Category distribution
      analysis.categoryDistribution[category] = (analysis.categoryDistribution[category] || 0) + 1;

      // Time patterns
      analysis.timePatterns[hour] = (analysis.timePatterns[hour] || 0) + 1;
    });

    return analysis;
  }

  /**
   * Generate recommendations based on analysis
   * @param {Object} analysis - User behavior analysis
   * @returns {Array} Recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Low acknowledgment rate recommendation
    if (analysis.acknowledgmentRate < 0.3) {
      recommendations.push({
        type: 'frequency',
        priority: 'high',
        message: 'Consider reducing notification frequency for better engagement',
        action: 'Reduce frequency for low-priority notifications'
      });
    }

    // High volume of certain types
    Object.entries(analysis.typeFrequency).forEach(([type, count]) => {
      if (count > analysis.totalNotifications * 0.3) {
        recommendations.push({
          type: 'volume',
          priority: 'medium',
          message: `High volume of ${type} notifications detected`,
          action: `Consider adjusting frequency limits for ${type}`
        });
      }
    });

    // Time pattern recommendations
    const peakHours = Object.entries(analysis.timePatterns)
      .filter(([hour, count]) => count > analysis.totalNotifications * 0.1)
      .map(([hour]) => parseInt(hour));

    if (peakHours.length > 0) {
      recommendations.push({
        type: 'timing',
        priority: 'low',
        message: 'Notifications are concentrated during certain hours',
        action: 'Consider adjusting quiet hours based on usage patterns'
      });
    }

    return recommendations;
  }

  /**
   * Check if time format is valid
   * @param {string} time - Time string
   * @returns {boolean} Is valid
   */
  isValidTimeFormat(time) {
    if (!time || typeof time !== 'string') return false;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Get default channel preference for notification type
   * @param {string} type - Notification type
   * @param {string} channel - Channel name
   * @returns {boolean} Default preference
   */
  getDefaultChannelPreference(type, channel) {
    const defaults = {
      email_received: { email: true, push: true, sms: false, slack: false, webhook: false, in_app: true },
      email_processed: { email: true, push: false, sms: false, slack: false, webhook: false, in_app: true },
      workflow_deployed: { email: true, push: true, sms: false, slack: false, webhook: false, in_app: true },
      workflow_failed: { email: true, push: true, sms: true, slack: false, webhook: false, in_app: true },
      system_alert: { email: true, push: true, sms: true, slack: false, webhook: false, in_app: true },
      security_alert: { email: true, push: true, sms: true, slack: false, webhook: false, in_app: true },
      daily_summary: { email: true, push: false, sms: false, slack: false, webhook: false, in_app: true }
    };

    return defaults[type]?.[channel] || false;
  }

  /**
   * Get default priority for notification type
   * @param {string} type - Notification type
   * @returns {string} Default priority
   */
  getDefaultPriority(type) {
    const priorityMap = {
      security_alert: 'critical',
      system_alert: 'high',
      workflow_failed: 'high',
      email_escalated: 'normal',
      workflow_deployed: 'normal',
      daily_summary: 'low',
      weekly_report: 'low'
    };

    return priorityMap[type] || 'normal';
  }

  /**
   * Get default type preferences
   * @param {string} type - Notification type
   * @returns {Object} Default preferences
   */
  getDefaultTypePreferences(type) {
    return {
      enabled: true,
      email: this.getDefaultChannelPreference(type, 'email'),
      push: this.getDefaultChannelPreference(type, 'push'),
      sms: this.getDefaultChannelPreference(type, 'sms'),
      slack: this.getDefaultChannelPreference(type, 'slack'),
      webhook: this.getDefaultChannelPreference(type, 'webhook'),
      in_app: this.getDefaultChannelPreference(type, 'in_app'),
      priority: this.getDefaultPriority(type),
      frequencyLimit: 'unlimited'
    };
  }

  /**
   * Get default notification preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    const preferences = {
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
      realtime_notifications: true,
      realtime_channels: ['in_app', 'push'],
      realtime_filters: {
        minPriority: 'normal',
        categories: []
      }
    };

    // Add default preferences for each notification type
    Object.values(this.notificationTypes).forEach(type => {
      preferences[type] = this.getDefaultTypePreferences(type);
    });

    return preferences;
  }

  /**
   * Export preferences for backup
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Export result
   */
  async exportPreferences(userId) {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      
      const exportData = {
        userId,
        preferences,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      logger.info('Preferences exported', { userId });
      return { success: true, data: exportData };

    } catch (error) {
      logger.error('Failed to export preferences', error, { userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Import preferences from backup
   * @param {string} userId - User ID
   * @param {Object} importData - Import data
   * @returns {Promise<Object>} Import result
   */
  async importPreferences(userId, importData) {
    try {
      logger.info('Importing preferences', { userId });

      // Validate import data
      if (!importData.preferences || !importData.version) {
        throw new Error('Invalid import data format');
      }

      // Validate preferences before importing
      const validatedPreferences = this.validatePreferences(importData.preferences);

      // Update preferences
      const result = await this.updateNotificationPreferences(userId, validatedPreferences);

      if (result.success) {
        logger.info('Preferences imported successfully', { userId });
      }

      return result;

    } catch (error) {
      logger.error('Failed to import preferences', error, { userId });
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const notificationPreferencesManager = new NotificationPreferencesManager();

export default NotificationPreferencesManager;
