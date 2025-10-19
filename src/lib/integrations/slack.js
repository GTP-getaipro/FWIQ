/**
 * Slack Integration
 * Comprehensive Slack team communication integration
 */

import { logger } from './logger';

export class SlackIntegration {
  constructor() {
    this.baseUrl = 'https://slack.com/api';
    this.botToken = null;
    this.userToken = null;
    this.teamId = null;
    this.teamName = null;
  }

  /**
   * Initialize Slack connection
   */
  initialize(credentials) {
    this.botToken = credentials.bot_token;
    this.userToken = credentials.user_token;
    this.teamId = credentials.team_id;
    this.teamName = credentials.team_name;
    
    logger.info('Slack integration initialized', {
      teamId: this.teamId,
      teamName: this.teamName,
      hasBotToken: !!this.botToken,
      hasUserToken: !!this.userToken
    });
  }

  /**
   * Test Slack connection
   */
  async testConnection(credentials) {
    try {
      this.initialize(credentials);

      // Test bot token by getting team info
      const response = await fetch(`${this.baseUrl}/team.info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Slack connection test successful', {
        teamId: data.team.id,
        teamName: data.team.name,
        domain: data.team.domain
      });

      return {
        success: true,
        teamId: data.team.id,
        teamName: data.team.name,
        domain: data.team.domain
      };

    } catch (error) {
      logger.error('Slack connection test failed', {
        error: error.message,
        teamId: credentials.team_id
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send message to Slack channel
   */
  async sendMessage(channel, text, options = {}) {
    try {
      const payload = {
        channel: channel,
        text: text,
        ...options
      };

      const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to send Slack message: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Slack message sent', {
        channel,
        messageTs: data.ts,
        hasAttachments: !!options.attachments
      });

      return {
        success: true,
        messageTs: data.ts,
        channel: data.channel,
        data: data
      };

    } catch (error) {
      logger.error('Failed to send Slack message', {
        channel,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send message with attachments
   */
  async sendMessageWithAttachments(channel, text, attachments) {
    return this.sendMessage(channel, text, { attachments });
  }

  /**
   * Send message to user via DM
   */
  async sendDirectMessage(userId, text, options = {}) {
    try {
      // First, open a DM channel with the user
      const dmResponse = await fetch(`${this.baseUrl}/conversations.open`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          users: userId
        })
      });

      if (!dmResponse.ok) {
        throw new Error(`Failed to open DM channel: ${dmResponse.status}`);
      }

      const dmData = await dmResponse.json();

      if (!dmData.ok) {
        throw new Error(`Slack API error: ${dmData.error}`);
      }

      // Send message to the DM channel
      return this.sendMessage(dmData.channel.id, text, options);

    } catch (error) {
      logger.error('Failed to send direct message', {
        userId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Slack channels
   */
  async getChannels(options = {}) {
    try {
      const excludeArchived = options.excludeArchived !== false;
      
      const response = await fetch(`${this.baseUrl}/conversations.list?exclude_archived=${excludeArchived}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get Slack channels: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Slack channels retrieved', {
        channelCount: data.channels?.length || 0
      });

      return {
        success: true,
        channels: data.channels || []
      };

    } catch (error) {
      logger.error('Failed to get Slack channels', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Slack users
   */
  async getUsers() {
    try {
      const response = await fetch(`${this.baseUrl}/users.list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get Slack users: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Slack users retrieved', {
        userCount: data.members?.length || 0
      });

      return {
        success: true,
        users: data.members || []
      };

    } catch (error) {
      logger.error('Failed to get Slack users', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get channel history
   */
  async getChannelHistory(channelId, options = {}) {
    try {
      const limit = options.limit || 100;
      const oldest = options.oldest || null;
      
      let url = `${this.baseUrl}/conversations.history?channel=${channelId}&limit=${limit}`;
      
      if (oldest) {
        url += `&oldest=${oldest}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get channel history: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Slack channel history retrieved', {
        channelId,
        messageCount: data.messages?.length || 0
      });

      return {
        success: true,
        messages: data.messages || [],
        hasMore: data.has_more
      };

    } catch (error) {
      logger.error('Failed to get channel history', {
        channelId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Slack channel
   */
  async createChannel(name, isPrivate = false) {
    try {
      const response = await fetch(`${this.baseUrl}/conversations.create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          is_private: isPrivate
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create Slack channel: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Slack channel created', {
        channelId: data.channel.id,
        channelName: data.channel.name,
        isPrivate
      });

      return {
        success: true,
        channel: data.channel
      };

    } catch (error) {
      logger.error('Failed to create Slack channel', {
        name,
        isPrivate,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Invite users to channel
   */
  async inviteUsersToChannel(channelId, userIds) {
    try {
      const response = await fetch(`${this.baseUrl}/conversations.invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: channelId,
          users: userIds.join(',')
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to invite users to channel: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Users invited to Slack channel', {
        channelId,
        userIdCount: userIds.length
      });

      return {
        success: true,
        channel: data.channel
      };

    } catch (error) {
      logger.error('Failed to invite users to channel', {
        channelId,
        userIds,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload file to Slack
   */
  async uploadFile(channel, file, title = null, initialComment = null) {
    try {
      const formData = new FormData();
      formData.append('token', this.botToken);
      formData.append('channels', channel);
      formData.append('file', file);
      
      if (title) {
        formData.append('title', title);
      }
      
      if (initialComment) {
        formData.append('initial_comment', initialComment);
      }

      const response = await fetch(`${this.baseUrl}/files.upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file to Slack: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('File uploaded to Slack', {
        channel,
        fileId: data.file.id,
        fileName: data.file.name
      });

      return {
        success: true,
        file: data.file
      };

    } catch (error) {
      logger.error('Failed to upload file to Slack', {
        channel,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user info
   */
  async getUserInfo(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/users.info?user=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      return {
        success: true,
        user: data.user
      };

    } catch (error) {
      logger.error('Failed to get user info', {
        userId,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set channel topic
   */
  async setChannelTopic(channelId, topic) {
    try {
      const response = await fetch(`${this.baseUrl}/conversations.setTopic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: channelId,
          topic: topic
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to set channel topic: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Slack channel topic set', {
        channelId,
        topic
      });

      return {
        success: true,
        channel: data.channel
      };

    } catch (error) {
      logger.error('Failed to set channel topic', {
        channelId,
        topic,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Slack reminder
   */
  async createReminder(text, time, user = null) {
    try {
      const payload = {
        text: text,
        time: time
      };

      if (user) {
        payload.user = user;
      }

      const response = await fetch(`${this.baseUrl}/reminders.add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken || this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create Slack reminder: ${response.status}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      logger.info('Slack reminder created', {
        reminderId: data.reminder.id,
        text,
        time
      });

      return {
        success: true,
        reminder: data.reminder
      };

    } catch (error) {
      logger.error('Failed to create Slack reminder', {
        text,
        time,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync data from Slack
   */
  async syncData(credentials, options = {}) {
    try {
      this.initialize(credentials);
      
      const syncResults = {
        channels: 0,
        users: 0,
        messages: 0,
        errors: []
      };

      // Sync channels
      if (options.syncChannels !== false) {
        try {
          const channelsResult = await this.getChannels();
          if (channelsResult.success) {
            syncResults.channels = channelsResult.channels.length;
            // Here you would typically store the channels in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'channels', error: error.message });
        }
      }

      // Sync users
      if (options.syncUsers !== false) {
        try {
          const usersResult = await this.getUsers();
          if (usersResult.success) {
            syncResults.users = usersResult.users.length;
            // Here you would typically store the users in your local database
          }
        } catch (error) {
          syncResults.errors.push({ type: 'users', error: error.message });
        }
      }

      // Sync recent messages (if specified)
      if (options.syncMessages && options.channelIds) {
        for (const channelId of options.channelIds) {
          try {
            const messagesResult = await this.getChannelHistory(channelId, { limit: 100 });
            if (messagesResult.success) {
              syncResults.messages += messagesResult.messages.length;
              // Here you would typically store the messages in your local database
            }
          } catch (error) {
            syncResults.errors.push({ type: 'messages', channelId, error: error.message });
          }
        }
      }

      const totalRecords = syncResults.channels + syncResults.users + syncResults.messages;
      
      logger.info('Slack sync completed', {
        totalRecords,
        syncResults,
        errors: syncResults.errors.length
      });

      return {
        success: true,
        recordsSynced: totalRecords,
        details: syncResults
      };

    } catch (error) {
      logger.error('Slack sync failed', {
        error: error.message,
        options
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create webhook for Slack events
   */
  async createWebhook(webhookUrl, events = []) {
    try {
      // Note: This is a simplified webhook creation
      // In practice, you'd need to configure this through Slack's app management interface
      
      logger.info('Slack webhook configuration', {
        webhookUrl,
        events
      });

      return {
        success: true,
        message: 'Webhook configuration requires Slack app setup',
        webhookUrl,
        events
      };

    } catch (error) {
      logger.error('Failed to create Slack webhook', {
        webhookUrl,
        events,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}
