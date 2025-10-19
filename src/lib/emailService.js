/**
 * Email Service
 * Handles email-related API operations for both Gmail and Outlook
 */

import { apiClient } from './apiClient.js';
import { supabase } from './customSupabaseClient.js';
import { outlookEmailService } from './outlookEmailService.js';

export class EmailService {
  constructor() {
    this.apiClient = apiClient;
  }

  /**
   * Send email through backend API or direct provider API
   * @param {Object} emailData - Email data
   * @param {string} provider - Email provider (gmail/outlook)
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(emailData, provider = 'gmail') {
    try {
      console.log(`📧 Sending email via ${provider} API`);
      
      if (provider === 'outlook') {
        // Use Outlook service directly
        return await outlookEmailService.sendEmail(emailData.userId, {
          subject: emailData.subject,
          body: emailData.body,
          contentType: emailData.contentType || 'Text',
          toRecipients: emailData.toRecipients || [{ emailAddress: { address: emailData.to } }],
          ccRecipients: emailData.ccRecipients || [],
          bccRecipients: emailData.bccRecipients || [],
          attachments: emailData.attachments || []
        });
      } else {
        // Use backend API for Gmail
        const response = await this.apiClient.post('/emails/send', {
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          html: emailData.html,
          attachments: emailData.attachments,
          priority: emailData.priority || 'normal'
        });

        console.log('✅ Email sent successfully');
        return response;
      }
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  /**
   * Get email templates
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Email templates
   */
  async getEmailTemplates(userId) {
    try {
      const response = await this.apiClient.get(`/emails/templates/${userId}`);
      return response.templates || [];
    } catch (error) {
      console.error('❌ Failed to get email templates:', error);
      // Fallback to local storage or default templates
      return this.getDefaultTemplates();
    }
  }

  /**
   * Create email template
   * @param {string} userId - User ID
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createEmailTemplate(userId, templateData) {
    try {
      const response = await this.apiClient.post('/emails/templates', {
        userId,
        name: templateData.name,
        subject: templateData.subject,
        body: templateData.body,
        category: templateData.category || 'general',
        variables: templateData.variables || []
      });

      console.log('✅ Email template created');
      return response.template;
    } catch (error) {
      console.error('❌ Failed to create email template:', error);
      throw new Error(`Template creation failed: ${error.message}`);
    }
  }

  /**
   * Process incoming email
   * @param {Object} emailData - Email data
   * @param {string} provider - Email provider (gmail/outlook)
   * @returns {Promise<Object>} Processing result
   */
  async processIncomingEmail(emailData, provider = 'gmail') {
    try {
      console.log(`🔄 Processing incoming ${provider} email`);
      
      if (provider === 'outlook') {
        // Use Outlook service for processing
        return await outlookEmailService.processIncomingEmail(emailData.userId, emailData);
      } else {
        // Use backend API for Gmail
        const response = await this.apiClient.post('/emails/process', {
          messageId: emailData.messageId,
          subject: emailData.subject,
          from: emailData.from,
          body: emailData.body,
          timestamp: emailData.timestamp,
          attachments: emailData.attachments
        });

        console.log('✅ Email processed successfully');
        return response;
      }
    } catch (error) {
      console.error('❌ Failed to process email:', error);
      throw new Error(`Email processing failed: ${error.message}`);
    }
  }

  /**
   * Get email analytics
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range (24h, 7d, 30d)
   * @returns {Promise<Object>} Analytics data
   */
  async getEmailAnalytics(userId, timeRange = '24h') {
    try {
      const response = await this.apiClient.get(`/emails/analytics/${userId}`, {
        timeRange
      });

      return response.analytics || {
        totalEmails: 0,
        sentEmails: 0,
        receivedEmails: 0,
        responseTime: 0,
        categories: {}
      };
    } catch (error) {
      console.error('❌ Failed to get email analytics:', error);
      // Fallback to Supabase query
      return this.getEmailAnalyticsFromSupabase(userId, timeRange);
    }
  }

  /**
   * Fallback: Get email analytics from Supabase
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Analytics data
   */
  async getEmailAnalyticsFromSupabase(userId, timeRange) {
    try {
      const timeRangeStart = this.getTimeRangeStart(timeRange);
      
      const { data: emailLogs, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('received_at', timeRangeStart);

      if (error) throw error;

      const analytics = {
        totalEmails: emailLogs.length,
        sentEmails: emailLogs.filter(e => e.direction === 'outbound').length,
        receivedEmails: emailLogs.filter(e => e.direction === 'inbound').length,
        responseTime: this.calculateAverageResponseTime(emailLogs),
        categories: this.categorizeEmails(emailLogs)
      };

      return analytics;
    } catch (error) {
      console.error('❌ Failed to get analytics from Supabase:', error);
      return {
        totalEmails: 0,
        sentEmails: 0,
        receivedEmails: 0,
        responseTime: 0,
        categories: {}
      };
    }
  }

  /**
   * Get email queue status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Queue status
   */
  async getEmailQueueStatus(userId) {
    try {
      const response = await this.apiClient.get(`/emails/queue/${userId}`);
      return response.queue || {
        pending: 0,
        processing: 0,
        failed: 0,
        completed: 0
      };
    } catch (error) {
      console.error('❌ Failed to get email queue status:', error);
      return { pending: 0, processing: 0, failed: 0, completed: 0 };
    }
  }

  /**
   * Retry failed email
   * @param {string} emailId - Email ID
   * @returns {Promise<Object>} Retry result
   */
  async retryFailedEmail(emailId) {
    try {
      const response = await this.apiClient.post(`/emails/retry/${emailId}`);
      console.log('✅ Email retry initiated');
      return response;
    } catch (error) {
      console.error('❌ Failed to retry email:', error);
      throw new Error(`Email retry failed: ${error.message}`);
    }
  }

  /**
   * Get default email templates
   * @returns {Array} Default templates
   */
  getDefaultTemplates() {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to {{business_name}}',
        body: 'Thank you for contacting {{business_name}}. We will respond to your inquiry shortly.',
        category: 'welcome'
      },
      {
        id: 'support',
        name: 'Support Response',
        subject: 'Re: {{original_subject}}',
        body: 'Thank you for contacting our support team. We are looking into your request and will provide an update soon.',
        category: 'support'
      },
      {
        id: 'quote',
        name: 'Quote Request',
        subject: 'Quote Request - {{service_type}}',
        body: 'Thank you for your interest in our services. We will prepare a detailed quote for your {{service_type}} needs.',
        category: 'quotes'
      }
    ];
  }

  /**
   * Get time range start date
   * @param {string} timeRange - Time range
   * @returns {string} ISO date string
   */
  getTimeRangeStart(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Calculate average response time
   * @param {Array} emailLogs - Email logs
   * @returns {number} Average response time in minutes
   */
  calculateAverageResponseTime(emailLogs) {
    const responseTimes = emailLogs
      .filter(log => log.response_time)
      .map(log => log.response_time);
    
    if (responseTimes.length === 0) return 0;
    
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  /**
   * Categorize emails
   * @param {Array} emailLogs - Email logs
   * @returns {Object} Email categories
   */
  categorizeEmails(emailLogs) {
    const categories = {};
    
    emailLogs.forEach(log => {
      const category = log.category || 'general';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  }

  /**
   * Create email draft
   * @param {string} userId - User ID
   * @param {Object} draftData - Draft data
   * @param {string} provider - Email provider (gmail/outlook)
   * @returns {Promise<Object>} Created draft
   */
  async createDraft(userId, draftData, provider = 'gmail') {
    try {
      console.log(`📝 Creating ${provider} draft`);
      
      if (provider === 'outlook') {
        return await outlookEmailService.createDraft(userId, draftData);
      } else {
        // Use backend API for Gmail drafts
        const response = await this.apiClient.post('/emails/drafts', {
          userId,
          subject: draftData.subject,
          body: draftData.body,
          to: draftData.to,
          cc: draftData.cc,
          bcc: draftData.bcc,
          attachments: draftData.attachments
        });

        console.log('✅ Draft created successfully');
        return response;
      }
    } catch (error) {
      console.error('❌ Failed to create draft:', error);
      throw new Error(`Draft creation failed: ${error.message}`);
    }
  }

  /**
   * Reply to email
   * @param {string} userId - User ID
   * @param {string} messageId - Original message ID
   * @param {Object} replyData - Reply data
   * @param {string} provider - Email provider (gmail/outlook)
   * @returns {Promise<Object>} Reply result
   */
  async replyToEmail(userId, messageId, replyData, provider = 'gmail') {
    try {
      console.log(`↩️ Replying to ${provider} email`);
      
      if (provider === 'outlook') {
        return await outlookEmailService.replyToEmail(userId, messageId, replyData);
      } else {
        // Use backend API for Gmail replies
        const response = await this.apiClient.post(`/emails/reply/${messageId}`, {
          userId,
          body: replyData.body,
          contentType: replyData.contentType || 'Text'
        });

        console.log('✅ Reply sent successfully');
        return response;
      }
    } catch (error) {
      console.error('❌ Failed to reply to email:', error);
      throw new Error(`Reply failed: ${error.message}`);
    }
  }

  /**
   * Get emails from provider
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {string} provider - Email provider (gmail/outlook)
   * @returns {Promise<Object>} Email list
   */
  async getEmails(userId, options = {}, provider = 'gmail') {
    try {
      console.log(`📧 Getting ${provider} emails`);
      
      if (provider === 'outlook') {
        return await outlookEmailService.getEmails(userId, options);
      } else {
        // Use backend API for Gmail
        const response = await this.apiClient.get(`/emails/${userId}`, options);
        return response;
      }
    } catch (error) {
      console.error('❌ Failed to get emails:', error);
      throw new Error(`Get emails failed: ${error.message}`);
    }
  }

  /**
   * Get email attachments
   * @param {string} userId - User ID
   * @param {string} messageId - Message ID
   * @param {string} provider - Email provider (gmail/outlook)
   * @returns {Promise<Object>} Attachments
   */
  async getAttachments(userId, messageId, provider = 'gmail') {
    try {
      console.log(`📎 Getting ${provider} attachments`);
      
      if (provider === 'outlook') {
        return await outlookEmailService.getAttachments(userId, messageId);
      } else {
        // Use backend API for Gmail attachments
        const response = await this.apiClient.get(`/emails/${messageId}/attachments`);
        return response;
      }
    } catch (error) {
      console.error('❌ Failed to get attachments:', error);
      throw new Error(`Get attachments failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
