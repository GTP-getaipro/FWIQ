/**
 * Outlook Email Service
 * Handles Outlook email operations using Microsoft Graph API
 */

import { supabase } from './customSupabaseClient.js';
import { getValidAccessToken } from './oauthTokenManager.js';

export class OutlookEmailService {
  constructor() {
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
    this.betaUrl = 'https://graph.microsoft.com/beta';
  }

  /**
   * Get user's Outlook emails
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Email list
   */
  async getEmails(userId, options = {}) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const {
        folder = 'inbox',
        top = 25,
        skip = 0,
        filter = '',
        orderBy = 'receivedDateTime desc'
      } = options;

      let url = `${this.baseUrl}/me/mailFolders/${folder}/messages`;
      const params = new URLSearchParams({
        $top: top.toString(),
        $skip: skip.toString(),
        $orderby: orderBy
      });

      if (filter) {
        params.append('$filter', filter);
      }

      url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        emails: data.value || [],
        nextLink: data['@odata.nextLink'],
        count: data['@odata.count']
      };
    } catch (error) {
      console.error('❌ Failed to get Outlook emails:', error);
      return {
        success: false,
        error: error.message,
        emails: []
      };
    }
  }

  /**
   * Get specific email by ID
   * @param {string} userId - User ID
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Email details
   */
  async getEmail(userId, messageId) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const email = await response.json();
      
      return {
        success: true,
        email: this.formatEmailData(email)
      };
    } catch (error) {
      console.error('❌ Failed to get Outlook email:', error);
      return {
        success: false,
        error: error.message,
        email: null
      };
    }
  }

  /**
   * Create email draft
   * @param {string} userId - User ID
   * @param {Object} draftData - Draft data
   * @returns {Promise<Object>} Created draft
   */
  async createDraft(userId, draftData) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const message = {
        subject: draftData.subject,
        body: {
          contentType: draftData.contentType || 'Text',
          content: draftData.body
        },
        toRecipients: draftData.toRecipients || [],
        ccRecipients: draftData.ccRecipients || [],
        bccRecipients: draftData.bccRecipients || [],
        attachments: draftData.attachments || []
      };

      const response = await fetch(`${this.baseUrl}/me/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const draft = await response.json();
      
      console.log('✅ Outlook draft created successfully');
      return {
        success: true,
        draft: {
          id: draft.id,
          subject: draft.subject,
          body: draft.body,
          toRecipients: draft.toRecipients,
          createdDateTime: draft.createdDateTime
        }
      };
    } catch (error) {
      console.error('❌ Failed to create Outlook draft:', error);
      return {
        success: false,
        error: error.message,
        draft: null
      };
    }
  }

  /**
   * Send email
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(userId, emailData) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const message = {
        subject: emailData.subject,
        body: {
          contentType: emailData.contentType || 'Text',
          content: emailData.body
        },
        toRecipients: emailData.toRecipients || [],
        ccRecipients: emailData.ccRecipients || [],
        bccRecipients: emailData.bccRecipients || [],
        attachments: emailData.attachments || []
      };

      const response = await fetch(`${this.baseUrl}/me/sendMail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          saveToSentItems: true
        })
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Outlook email sent successfully');
      return {
        success: true,
        messageId: emailData.messageId || 'sent'
      };
    } catch (error) {
      console.error('❌ Failed to send Outlook email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reply to email
   * @param {string} userId - User ID
   * @param {string} messageId - Original message ID
   * @param {Object} replyData - Reply data
   * @returns {Promise<Object>} Reply result
   */
  async replyToEmail(userId, messageId, replyData) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const replyMessage = {
        message: {
          body: {
            contentType: replyData.contentType || 'Text',
            content: replyData.body
          }
        }
      };

      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(replyMessage)
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Outlook reply sent successfully');
      return {
        success: true,
        messageId: messageId
      };
    } catch (error) {
      console.error('❌ Failed to reply to Outlook email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get email attachments
   * @param {string} userId - User ID
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Attachments
   */
  async getAttachments(userId, messageId) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}/attachments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        attachments: data.value || []
      };
    } catch (error) {
      console.error('❌ Failed to get Outlook attachments:', error);
      return {
        success: false,
        error: error.message,
        attachments: []
      };
    }
  }

  /**
   * Download attachment
   * @param {string} userId - User ID
   * @param {string} messageId - Message ID
   * @param {string} attachmentId - Attachment ID
   * @returns {Promise<Object>} Attachment data
   */
  async downloadAttachment(userId, messageId, attachmentId) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}/attachments/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const attachment = await response.json();
      
      return {
        success: true,
        attachment: {
          id: attachment.id,
          name: attachment.name,
          contentType: attachment.contentType,
          size: attachment.size,
          contentBytes: attachment.contentBytes
        }
      };
    } catch (error) {
      console.error('❌ Failed to download Outlook attachment:', error);
      return {
        success: false,
        error: error.message,
        attachment: null
      };
    }
  }

  /**
   * Get mail folders
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Folders list
   */
  async getFolders(userId) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const response = await fetch(`${this.baseUrl}/me/mailFolders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        folders: data.value || []
      };
    } catch (error) {
      console.error('❌ Failed to get Outlook folders:', error);
      return {
        success: false,
        error: error.message,
        folders: []
      };
    }
  }

  /**
   * Move email to folder
   * @param {string} userId - User ID
   * @param {string} messageId - Message ID
   * @param {string} folderId - Target folder ID
   * @returns {Promise<Object>} Move result
   */
  async moveEmail(userId, messageId, folderId) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}/move`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destinationId: folderId
        })
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Outlook email moved successfully');
      return {
        success: true,
        messageId: result.id
      };
    } catch (error) {
      console.error('❌ Failed to move Outlook email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark email as read/unread
   * @param {string} userId - User ID
   * @param {string} messageId - Message ID
   * @param {boolean} isRead - Read status
   * @returns {Promise<Object>} Update result
   */
  async markAsRead(userId, messageId, isRead = true) {
    try {
      const accessToken = await getValidAccessToken(userId, 'outlook');
      
      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isRead: isRead
        })
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ Outlook email marked as ${isRead ? 'read' : 'unread'}`);
      return {
        success: true,
        messageId: messageId
      };
    } catch (error) {
      console.error('❌ Failed to mark Outlook email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format email data for consistent structure
   * @param {Object} email - Raw email data from Microsoft Graph
   * @returns {Object} Formatted email data
   */
  formatEmailData(email) {
    return {
      id: email.id,
      subject: email.subject,
      body: email.body,
      from: email.from,
      toRecipients: email.toRecipients,
      ccRecipients: email.ccRecipients,
      bccRecipients: email.bccRecipients,
      receivedDateTime: email.receivedDateTime,
      sentDateTime: email.sentDateTime,
      isRead: email.isRead,
      hasAttachments: email.hasAttachments,
      importance: email.importance,
      categories: email.categories,
      internetMessageId: email.internetMessageId
    };
  }

  /**
   * Process incoming email for automation
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Processing result
   */
  async processIncomingEmail(userId, emailData) {
    try {
      console.log('🔄 Processing incoming Outlook email');
      
      // Store email log
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          provider: 'outlook',
          message_id: emailData.id,
          subject: emailData.subject,
          from_email: emailData.from?.emailAddress?.address,
          from_name: emailData.from?.emailAddress?.name,
          body_preview: emailData.bodyPreview,
          received_at: emailData.receivedDateTime,
          status: 'new',
          processed_at: new Date().toISOString()
        });

      if (logError) {
        console.error('❌ Failed to log Outlook email:', logError);
      }

      // Process email content for AI classification
      const emailContent = {
        subject: emailData.subject,
        body: emailData.body?.content || emailData.bodyPreview,
        from: emailData.from?.emailAddress?.address,
        to: emailData.toRecipients?.map(r => r.emailAddress?.address).join(', '),
        receivedDateTime: emailData.receivedDateTime,
        hasAttachments: emailData.hasAttachments
      };

      console.log('✅ Outlook email processed successfully');
      return {
        success: true,
        emailContent,
        messageId: emailData.id
      };
    } catch (error) {
      console.error('❌ Failed to process Outlook email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const outlookEmailService = new OutlookEmailService();
