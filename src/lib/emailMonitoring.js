/**
 * Email Monitoring System
 * Detects new emails in real-time using polling and webhooks
 */

import { supabase } from './customSupabaseClient.js';
import { getValidAccessToken } from './oauthTokenManager.js';

export class EmailMonitoring {
  constructor() {
    this.isMonitoring = false;
    this.pollInterval = 30000; // 30 seconds
    this.pollTimer = null;
    this.lastChecked = {};
  }

  /**
   * Start monitoring emails for a user
   * @param {string} userId - User ID
   */
  async startMonitoring(userId) {
    if (this.isMonitoring) {
      console.log('📧 Email monitoring already active');
      return;
    }

    console.log('🚀 Starting email monitoring for user:', userId);
    this.isMonitoring = true;

    try {
      // Set up webhooks for real-time monitoring
      await this.setupWebhooks(userId);
      
      // Start polling as fallback
      this.startPolling(userId);
      
      console.log('✅ Email monitoring started successfully');
    } catch (error) {
      console.error('❌ Failed to start email monitoring:', error);
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * Stop email monitoring
   */
  stopMonitoring() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Email monitoring stopped');
  }

  /**
   * Set up webhooks for real-time monitoring
   * @param {string} userId - User ID
   */
  async setupWebhooks(userId) {
    try {
      // Get user's email integrations
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('provider, id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      for (const integration of integrations) {
        if (integration.provider === 'gmail') {
          await this.setupGmailWebhook(userId, integration.id);
        } else if (integration.provider === 'outlook') {
          await this.setupOutlookWebhook(userId, integration.id);
        }
      }
    } catch (error) {
      console.error('❌ Failed to setup webhooks:', error);
      // Don't throw - continue with polling fallback
    }
  }

  /**
   * Set up Gmail webhook
   * @param {string} userId - User ID
   * @param {string} integrationId - Integration ID
   */
  async setupGmailWebhook(userId, integrationId) {
    try {
      const webhookUrl = `${import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL}/functions/v1/gmail-webhook`;
      
      // For now, we'll use polling as Gmail webhooks require Pub/Sub setup
      console.log('📧 Gmail webhook setup simulated (using polling)');
    } catch (error) {
      console.error('❌ Gmail webhook setup failed:', error);
    }
  }

  /**
   * Set up Outlook webhook
   * @param {string} userId - User ID
   * @param {string} integrationId - Integration ID
   */
  async setupOutlookWebhook(userId, integrationId) {
    try {
      const webhookUrl = `${import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL}/functions/v1/outlook-webhook`;
      
      // For now, we'll use polling as Outlook webhooks require app registration
      console.log('📧 Outlook webhook setup simulated (using polling)');
    } catch (error) {
      console.error('❌ Outlook webhook setup failed:', error);
    }
  }

  /**
   * Start polling for new emails
   * @param {string} userId - User ID
   */
  startPolling(userId) {
    console.log(`⏰ Starting email polling every ${this.pollInterval / 1000} seconds`);
    
    this.pollTimer = setInterval(async () => {
      try {
        await this.checkForNewEmails(userId);
      } catch (error) {
        console.error('❌ Email polling error:', error);
      }
    }, this.pollInterval);

    // Check immediately
    this.checkForNewEmails(userId);
  }

  /**
   * Check for new emails across all integrations
   * @param {string} userId - User ID
   */
  async checkForNewEmails(userId) {
    try {
      // Get user's active integrations
      const { data: integrations, error } = await supabase
        .from('integrations')
        .select('provider, id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      for (const integration of integrations) {
        await this.checkProviderEmails(userId, integration.provider);
      }
    } catch (error) {
      console.error('❌ Failed to check for new emails:', error);
    }
  }

  /**
   * Check for new emails from a specific provider
   * @param {string} userId - User ID
   * @param {string} provider - Email provider (gmail/outlook)
   */
  async checkProviderEmails(userId, provider) {
    try {
      const accessToken = await getValidAccessToken(userId, provider);
      
      if (provider === 'gmail') {
        await this.checkGmailEmails(userId, accessToken);
      } else if (provider === 'outlook') {
        await this.checkOutlookEmails(userId, accessToken);
      }
    } catch (error) {
      console.error(`❌ Failed to check ${provider} emails:`, error);
      
      // Check if this is a token-related error that requires re-authentication
      if (error.message.includes('Token expired and no refresh token available') ||
          error.message.includes('InvalidAuthenticationToken') ||
          error.message.includes('JWT is not well formed')) {
        
        console.log(`🔄 ${provider} requires re-authentication`);
        
        // Dispatch a custom event to notify the dashboard
        window.dispatchEvent(new CustomEvent('email-provider-reauth-needed', {
          detail: { provider, userId, error: error.message }
        }));
      }
    }
  }

  /**
   * Check for new Gmail emails
   * @param {string} userId - User ID
   * @param {string} accessToken - Gmail access token
   */
  async checkGmailEmails(userId, accessToken) {
    try {
      // Get messages from the last 5 minutes
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages?q=after:${Math.floor(Date.now() / 1000 - 300)}&maxResults=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        console.log(`📧 Found ${data.messages.length} new Gmail messages`);
        await this.processNewEmails(userId, 'gmail', data.messages);
      }
    } catch (error) {
      console.error('❌ Gmail email check failed:', error);
    }
  }

  /**
   * Check for new Outlook emails
   * @param {string} userId - User ID
   * @param {string} accessToken - Outlook access token
   */
  async checkOutlookEmails(userId, accessToken) {
    try {
      // Get messages from the last 5 minutes
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${since}&$top=10&$select=id,subject,from,bodyPreview,receivedDateTime,hasAttachments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.value && data.value.length > 0) {
        console.log(`📧 Found ${data.value.length} new Outlook messages`);
        await this.processNewOutlookEmails(userId, data.value);
      }
    } catch (error) {
      console.error('❌ Outlook email check failed:', error);
    }
  }

  /**
   * Process new Outlook emails and store them in the database
   * @param {string} userId - User ID
   * @param {Array} messages - Array of Outlook email messages
   */
  async processNewOutlookEmails(userId, messages) {
    try {
      for (const message of messages) {
        // Check if we've already processed this email
        const { data: existing } = await supabase
          .from('email_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('message_id', message.id)
          .eq('provider', 'outlook')
          .single();

        if (existing) {
          continue; // Already processed
        }

        // Store new email with Outlook-specific data
        const { error } = await supabase
          .from('email_logs')
          .insert({
            user_id: userId,
            provider: 'outlook',
            message_id: message.id,
            subject: message.subject,
            from_email: message.from?.emailAddress?.address,
            from_name: message.from?.emailAddress?.name,
            body_preview: message.bodyPreview,
            received_at: message.receivedDateTime,
            has_attachments: message.hasAttachments,
            status: 'new',
            processed_at: new Date().toISOString(),
          });

        if (error) {
          console.error('❌ Failed to store Outlook email log:', error);
        } else {
          console.log(`✅ New Outlook email logged: ${message.id}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to process new Outlook emails:', error);
    }
  }

  /**
   * Process new emails and store them in the database
   * @param {string} userId - User ID
   * @param {string} provider - Email provider
   * @param {Array} messages - Array of email messages
   */
  async processNewEmails(userId, provider, messages) {
    try {
      for (const message of messages) {
        const messageId = provider === 'gmail' ? message.id : message.id;
        
        // Try to check if we've already processed this email
        let existing = null;
        try {
          const { data, error } = await supabase
            .from('email_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('message_id', messageId)
            .eq('provider', provider)
            .limit(1);
          
          if (error) {
            console.log('📋 Error checking for existing email:', error.message);
          } else if (data && data.length > 0) {
            existing = data[0];
          }
        } catch (checkError) {
          // If the column doesn't exist, we'll skip the duplicate check
          if (checkError.message.includes('message_id')) {
            console.log('📋 email_logs table missing message_id column, skipping duplicate check');
          } else {
            console.log('📋 Error checking for existing email:', checkError.message);
          }
        }

        if (existing) {
          continue; // Already processed
        }

            // Try to store new email with all available fields
            try {
              const emailLogData = {
                user_id: userId,
                provider: provider,
                status: 'new',
                processed_at: new Date().toISOString(),
                email_from: message.from || message.sender || 'unknown@example.com', // Required field
                email_subject: message.subject || 'No Subject',
                message_id: messageId,
              };

              // Try to insert using backend API first (which has service role permissions)
              try {
                const response = await fetch('/api/email-logs', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(emailLogData),
                });

                if (response.ok) {
                  console.log(`✅ New ${provider} email logged via API: ${messageId}`);
                } else {
                  throw new Error(`API error: ${response.status}`);
                }
              } catch (apiError) {
                console.log('📋 API not available, trying direct Supabase insert...');
                
                // Fallback to direct Supabase insert (might fail due to RLS)
                const { error } = await supabase
                  .from('email_logs')
                  .insert(emailLogData);

                if (error) {
                  if (error.message.includes('message_id')) {
                    // If message_id column doesn't exist, try without it
                    console.log('📋 message_id column not available, storing without it');
                    const { message_id, ...emailLogDataWithoutMessageId } = emailLogData;
                    const { error: fallbackError } = await supabase
                      .from('email_logs')
                      .insert(emailLogDataWithoutMessageId);

                    if (fallbackError) {
                      console.error('❌ Failed to store email log (fallback):', fallbackError);
                    } else {
                      console.log(`✅ New ${provider} email logged (without message_id): ${messageId}`);
                    }
                  } else {
                    console.error('❌ Failed to store email log:', error);
                    // Log the email locally for debugging
                    console.log('📧 Email data that failed to store:', emailLogData);
                  }
                } else {
                  console.log(`✅ New ${provider} email logged: ${messageId}`);
                }
              }
            } catch (insertError) {
              console.error('❌ Failed to insert email log:', insertError);
            }
      }
    } catch (error) {
      console.error('❌ Failed to process new emails:', error);
    }
  }
}

// Export singleton instance
export const emailMonitoring = new EmailMonitoring();
