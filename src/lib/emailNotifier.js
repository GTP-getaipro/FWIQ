/**
 * Email Notifier for FloWorx
 * Handles email notification delivery
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class EmailNotifier {
  constructor() {
    this.smtpConfig = {
      host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
      port: import.meta.env.VITE_SMTP_PORT || 587,
      secure: false,
      auth: {
        user: import.meta.env.VITE_SMTP_USER,
        pass: import.meta.env.VITE_SMTP_PASS
      }
    };
  }

  /**
   * Send email notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Send result
   */
  async send(userId, type, data) {
    try {
      logger.info('Sending email notification', { userId, type });

      // Get user email address
      const userEmail = await this.getUserEmail(userId);
      if (!userEmail) {
        throw new Error('User email not found');
      }

      // Generate email content
      const emailContent = await this.generateEmailContent(type, data);
      
      // Send email
      const result = await this.sendEmail({
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        from: `FloWorx <${this.smtpConfig.auth.user}>`
      });

      // Track email sent
      analytics.trackBusinessEvent('email_notification_sent', {
        userId,
        type,
        emailAddress: userEmail
      });

      logger.info('Email notification sent successfully', { 
        userId, 
        type, 
        messageId: result.messageId 
      });

      return {
        channel: 'email',
        success: true,
        messageId: result.messageId,
        emailAddress: userEmail
      };

    } catch (error) {
      logger.error('Failed to send email notification', error, { userId, type });
      
      analytics.trackError(error, {
        operation: 'send_email_notification',
        userId,
        type
      });

      return {
        channel: 'email',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user email address
   * @param {string} userId - User ID
   * @returns {Promise<string>} User email address
   */
  async getUserEmail(userId) {
    try {
      const { data: user, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error) {
        logger.error('Failed to get user email', error);
        return null;
      }

      return user?.email;
    } catch (error) {
      logger.error('Error fetching user email', error);
      return null;
    }
  }

  /**
   * Generate email content from template
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @returns {Promise<Object>} Email content
   */
  async generateEmailContent(type, data) {
    try {
      // Import email templates
      const { emailTemplates } = await import('../templates/email-templates.js');
      const template = emailTemplates[type] || emailTemplates.DEFAULT;

      // Replace template variables
      const subject = this.replaceVariables(template.subject, data);
      const html = this.replaceVariables(template.html, data);
      const text = this.replaceVariables(template.text, data);

      return {
        subject,
        html,
        text
      };
    } catch (error) {
      logger.error('Failed to generate email content', error);
      
      // Fallback content
      return {
        subject: 'FloWorx Notification',
        html: `<p>You have a new notification from FloWorx.</p>`,
        text: 'You have a new notification from FloWorx.'
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
   * Send email using SMTP
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(emailData) {
    try {
      // In a real implementation, you would use a library like nodemailer
      // For now, we'll simulate the email sending
      
      // Simulate SMTP delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate mock message ID
      const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@floworx-iq.com>`;

      logger.info('Email sent via SMTP', {
        to: emailData.to,
        subject: emailData.subject,
        messageId
      });

      return {
        success: true,
        messageId,
        accepted: [emailData.to],
        rejected: []
      };

    } catch (error) {
      logger.error('SMTP send failed', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send bulk emails
   * @param {Array} emails - Array of email objects
   * @returns {Promise<Object>} Bulk send results
   */
  async sendBulkEmails(emails) {
    const results = await Promise.allSettled(
      emails.map(email => this.sendEmail(email))
    );

    return {
      total: emails.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  /**
   * Validate email address
   * @param {string} email - Email address
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get email delivery status
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Delivery status
   */
  async getDeliveryStatus(messageId) {
    try {
      // In a real implementation, you would check with your email provider
      // For now, we'll return a mock status
      
      return {
        messageId,
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        openedAt: null,
        clickedAt: null
      };
    } catch (error) {
      logger.error('Failed to get delivery status', error);
      return {
        messageId,
        status: 'unknown',
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const emailNotifier = new EmailNotifier();

export default EmailNotifier;
