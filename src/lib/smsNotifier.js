/**
 * SMS Notifier for FloWorx
 * Handles SMS notification delivery
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class SMSNotifier {
  constructor() {
    this.smsConfig = {
      provider: import.meta.env.VITE_SMS_PROVIDER || 'twilio',
      twilio: {
        accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
        authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN,
        fromNumber: import.meta.env.VITE_TWILIO_FROM_NUMBER
      },
      aws: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
        region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
      }
    };
  }

  /**
   * Send SMS notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Send result
   */
  async send(userId, type, data) {
    try {
      logger.info('Sending SMS notification', { userId, type });

      // Get user phone number
      const phoneNumber = await this.getUserPhoneNumber(userId);
      if (!phoneNumber) {
        throw new Error('User phone number not found');
      }

      // Generate SMS content
      const smsContent = await this.generateSMSContent(type, data);
      
      // Send SMS
      const result = await this.sendSMS(phoneNumber, smsContent);

      // Track SMS sent
      analytics.trackBusinessEvent('sms_notification_sent', {
        userId,
        type,
        phoneNumber: this.maskPhoneNumber(phoneNumber)
      });

      logger.info('SMS notification sent successfully', { 
        userId, 
        type, 
        messageId: result.messageId 
      });

      return {
        channel: 'sms',
        success: true,
        messageId: result.messageId,
        phoneNumber: this.maskPhoneNumber(phoneNumber)
      };

    } catch (error) {
      logger.error('Failed to send SMS notification', error, { userId, type });
      
      analytics.trackError(error, {
        operation: 'send_sms_notification',
        userId,
        type
      });

      return {
        channel: 'sms',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user phone number
   * @param {string} userId - User ID
   * @returns {Promise<string>} User phone number
   */
  async getUserPhoneNumber(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Failed to get user phone number', error);
        return null;
      }

      return data?.phone_number;
    } catch (error) {
      logger.error('Error fetching user phone number', error);
      return null;
    }
  }

  /**
   * Generate SMS content from template
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<string>} SMS content
   */
  async generateSMSContent(type, data) {
    try {
      // Import SMS templates
      const { smsTemplates } = await import('../templates/sms-templates.js');
      const template = smsTemplates[type] || smsTemplates.DEFAULT;

      // Replace template variables
      const content = this.replaceVariables(template, data);

      // Ensure SMS length is within limits (160 characters for single SMS)
      if (content.length > 160) {
        return content.substring(0, 157) + '...';
      }

      return content;
    } catch (error) {
      logger.error('Failed to generate SMS content', error);
      
      // Fallback content
      return 'FloWorx: You have a new notification. Visit app.floworx-iq.com for details.';
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
   * Send SMS using configured provider
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(phoneNumber, message) {
    try {
      const provider = this.smsConfig.provider.toLowerCase();

      switch (provider) {
        case 'twilio':
          return await this.sendViaTwilio(phoneNumber, message);
        case 'aws':
          return await this.sendViaAWS(phoneNumber, message);
        default:
          throw new Error(`Unsupported SMS provider: ${provider}`);
      }
    } catch (error) {
      logger.error('SMS send failed', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send SMS via Twilio
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendViaTwilio(phoneNumber, message) {
    try {
      // In a real implementation, you would use the Twilio SDK
      // For now, we'll simulate the SMS sending
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate mock message ID
      const messageId = `SM${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      logger.info('SMS sent via Twilio', {
        to: this.maskPhoneNumber(phoneNumber),
        from: this.smsConfig.twilio.fromNumber,
        messageId
      });

      return {
        success: true,
        messageId,
        provider: 'twilio',
        status: 'sent',
        cost: 0.0075 // Twilio SMS cost estimate
      };

    } catch (error) {
      logger.error('Twilio SMS send failed', error);
      throw new Error(`Twilio send failed: ${error.message}`);
    }
  }

  /**
   * Send SMS via AWS SNS
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendViaAWS(phoneNumber, message) {
    try {
      // In a real implementation, you would use the AWS SDK
      // For now, we'll simulate the SMS sending
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Generate mock message ID
      const messageId = `aws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logger.info('SMS sent via AWS SNS', {
        to: this.maskPhoneNumber(phoneNumber),
        messageId
      });

      return {
        success: true,
        messageId,
        provider: 'aws',
        status: 'sent',
        cost: 0.00645 // AWS SNS SMS cost estimate
      };

    } catch (error) {
      logger.error('AWS SNS SMS send failed', error);
      throw new Error(`AWS SNS send failed: ${error.message}`);
    }
  }

  /**
   * Mask phone number for logging
   * @param {string} phoneNumber - Phone number
   * @returns {string} Masked phone number
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) {
      return '***';
    }
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 4) {
      return '***';
    }
    
    return cleaned.substring(0, 3) + '*'.repeat(cleaned.length - 6) + cleaned.substring(cleaned.length - 3);
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number
   * @returns {boolean} True if valid
   */
  validatePhoneNumber(phoneNumber) {
    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming US +1)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If already has country code, ensure it starts with +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  /**
   * Send bulk SMS notifications
   * @param {Array} notifications - Array of SMS notification objects
   * @returns {Promise<Object>} Bulk send results
   */
  async sendBulkSMS(notifications) {
    const results = await Promise.allSettled(
      notifications.map(notification => 
        this.sendSMS(notification.phoneNumber, notification.message)
      )
    );

    return {
      total: notifications.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  /**
   * Get SMS delivery status
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Delivery status
   */
  async getDeliveryStatus(messageId) {
    try {
      // In a real implementation, you would check with your SMS provider
      // For now, we'll return a mock status
      
      return {
        messageId,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        errorCode: null,
        errorMessage: null
      };
    } catch (error) {
      logger.error('Failed to get SMS delivery status', error);
      return {
        messageId,
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Update user phone number
   * @param {string} userId - User ID
   * @param {string} phoneNumber - New phone number
   * @returns {Promise<Object>} Update result
   */
  async updateUserPhoneNumber(userId, phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.validatePhoneNumber(formattedPhone)) {
        throw new Error('Invalid phone number format');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          phone_number: formattedPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw new Error(`Failed to update phone number: ${error.message}`);
      }

      logger.info('User phone number updated', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update phone number', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const smsNotifier = new SMSNotifier();

export default SMSNotifier;
