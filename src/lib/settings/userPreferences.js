import { supabase } from '@/lib/customSupabaseClient';
import { logger } from '@/lib/logger';

/**
 * UserPreferences - Manages user-specific settings and preferences
 * Leverages existing profiles table and client_config structure
 */
export class UserPreferences {
  constructor(userId) {
    this.userId = userId;
    this.logger = logger;
  }

  /**
   * Get all user preferences
   */
  async getPreferences() {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch preferences: ${error.message}`);
      }

      if (!profile) {
        throw new Error('User profile not found');
      }

      return this.parsePreferences(profile);
    } catch (error) {
      this.logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences) {
    try {
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current profile: ${fetchError.message}`);
      }

      const updatedProfile = this.mergePreferences(currentProfile, preferences);

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', this.userId);

      if (error) {
        throw new Error(`Failed to update preferences: ${error.message}`);
      }

      this.logger.info('User preferences updated successfully');
      return { success: true, data: updatedProfile };
    } catch (error) {
      this.logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Get account settings
   */
  async getAccountSettings() {
    try {
      const preferences = await this.getPreferences();
      return {
        profile: preferences.profile,
        business: preferences.business,
        contact: preferences.contact
      };
    } catch (error) {
      this.logger.error('Error getting account settings:', error);
      throw error;
    }
  }

  /**
   * Update account settings
   */
  async updateAccountSettings(accountData) {
    try {
      const preferences = await this.getPreferences();
      
      const updatedPreferences = {
        ...preferences,
        business: { ...preferences.business, ...accountData.business },
        contact: { ...preferences.contact, ...accountData.contact },
        profile: { ...preferences.profile, ...accountData.profile }
      };

      return await this.updatePreferences(updatedPreferences);
    } catch (error) {
      this.logger.error('Error updating account settings:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    try {
      const preferences = await this.getPreferences();
      return preferences.notifications || this.getDefaultNotificationPreferences();
    } catch (error) {
      this.logger.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(notificationData) {
    try {
      const preferences = await this.getPreferences();
      
      const updatedPreferences = {
        ...preferences,
        notifications: { ...preferences.notifications, ...notificationData }
      };

      return await this.updatePreferences(updatedPreferences);
    } catch (error) {
      this.logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get integration settings
   */
  async getIntegrationSettings() {
    try {
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('status', 'active');

      if (error) {
        throw new Error(`Failed to fetch integrations: ${error.message}`);
      }

      return integrations || [];
    } catch (error) {
      this.logger.error('Error getting integration settings:', error);
      throw error;
    }
  }

  /**
   * Update integration settings
   */
  async updateIntegrationSettings(integrationId, settings) {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)
        .eq('user_id', this.userId);

      if (error) {
        throw new Error(`Failed to update integration: ${error.message}`);
      }

      this.logger.info(`Integration ${integrationId} updated successfully`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error updating integration settings:', error);
      throw error;
    }
  }

  /**
   * Get billing preferences
   */
  async getBillingPreferences() {
    try {
      const preferences = await this.getPreferences();
      return preferences.billing || this.getDefaultBillingPreferences();
    } catch (error) {
      this.logger.error('Error getting billing preferences:', error);
      throw error;
    }
  }

  /**
   * Update billing preferences
   */
  async updateBillingPreferences(billingData) {
    try {
      const preferences = await this.getPreferences();
      
      const updatedPreferences = {
        ...preferences,
        billing: { ...preferences.billing, ...billingData }
      };

      return await this.updatePreferences(updatedPreferences);
    } catch (error) {
      this.logger.error('Error updating billing preferences:', error);
      throw error;
    }
  }

  /**
   * Parse preferences from profile data
   */
  parsePreferences(profile) {
    const clientConfig = profile.client_config || {};
    
    return {
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        business_type: profile.business_type,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      business: clientConfig.business || {},
      contact: clientConfig.contact || {},
      rules: clientConfig.rules || {},
      notifications: clientConfig.notifications || this.getDefaultNotificationPreferences(),
      billing: clientConfig.billing || this.getDefaultBillingPreferences(),
      preferences: clientConfig.preferences || this.getDefaultUserPreferences()
    };
  }

  /**
   * Merge new preferences with existing profile data
   */
  mergePreferences(currentProfile, newPreferences) {
    const currentConfig = currentProfile.client_config || {};
    
    const updatedConfig = {
      ...currentConfig,
      business: { ...currentConfig.business, ...newPreferences.business },
      contact: { ...currentConfig.contact, ...newPreferences.contact },
      rules: { ...currentConfig.rules, ...newPreferences.rules },
      notifications: { ...currentConfig.notifications, ...newPreferences.notifications },
      billing: { ...currentConfig.billing, ...newPreferences.billing },
      preferences: { ...currentConfig.preferences, ...newPreferences.preferences },
      version: (currentConfig.version || 0) + 1,
      client_id: this.userId
    };

    return {
      ...currentProfile,
      client_config: updatedConfig,
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Get default notification preferences
   */
  getDefaultNotificationPreferences() {
    return {
      email: {
        enabled: true,
        newEmails: true,
        escalations: true,
        systemAlerts: true,
        weeklyReports: true,
        digest: 'daily'
      },
      push: {
        enabled: true,
        newEmails: false,
        escalations: true,
        systemAlerts: true
      },
      sms: {
        enabled: false,
        escalations: false,
        systemAlerts: false
      },
      slack: {
        enabled: false,
        channel: '',
        escalations: true,
        systemAlerts: true
      }
    };
  }

  /**
   * Get default billing preferences
   */
  getDefaultBillingPreferences() {
    return {
      currency: 'USD',
      billingCycle: 'monthly',
      autoRenew: true,
      notifications: {
        invoiceGenerated: true,
        paymentFailed: true,
        subscriptionExpiring: true
      },
      taxSettings: {
        collectTax: false,
        taxRate: 0,
        taxId: ''
      }
    };
  }

  /**
   * Get default user preferences
   */
  getDefaultUserPreferences() {
    return {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      dashboard: {
        defaultView: 'overview',
        refreshInterval: 30,
        showMetrics: true,
        showCharts: true
      },
      email: {
        signature: '',
        autoReply: false,
        autoReplyMessage: '',
        markAsRead: false
      }
    };
  }

  /**
   * Export user preferences to JSON
   */
  async exportPreferences() {
    try {
      const preferences = await this.getPreferences();
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        preferences: preferences
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      this.logger.error('Error exporting preferences:', error);
      throw error;
    }
  }

  /**
   * Import user preferences from JSON
   */
  async importPreferences(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.preferences) {
        throw new Error('Invalid import data format');
      }

      return await this.updatePreferences(importData.preferences);
    } catch (error) {
      this.logger.error('Error importing preferences:', error);
      throw error;
    }
  }
}
