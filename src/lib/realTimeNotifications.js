/**
 * Real-time Notifications System for FloWorx
 * WebSocket-based real-time notification delivery
 */

import { supabase } from './customSupabaseClient.js';
import { advancedNotifications } from './advancedNotifications.js';
import { logger } from './logger.js';
import { analytics } from './analytics.js';

export class RealTimeNotifications {
  constructor() {
    this.advancedNotifications = advancedNotifications;
    this.connections = new Map(); // userId -> WebSocket connections
    this.subscriptions = new Map(); // userId -> Supabase subscriptions
    this.heartbeatInterval = null;
    this.reconnectAttempts = new Map(); // userId -> attempt count
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    
    this.initializeHeartbeat();
  }

  /**
   * Initialize real-time notifications for user
   * @param {string} userId - User ID
   * @param {Object} options - Connection options
   * @returns {Promise<Object>} Initialization result
   */
  async initializeRealTimeNotifications(userId, options = {}) {
    try {
      logger.info('Initializing real-time notifications', { userId, options });

      // Check if user already has active connection
      if (this.connections.has(userId)) {
        logger.info('User already has active real-time connection', { userId });
        return { success: true, message: 'Connection already active' };
      }

      // Set up Supabase real-time subscription
      await this.setupSupabaseSubscription(userId, options);
      
      // Set up WebSocket connection (simulated)
      await this.setupWebSocketConnection(userId, options);
      
      // Initialize user preferences
      await this.initializeUserPreferences(userId);
      
      // Track analytics
      analytics.trackBusinessEvent('realtime_notifications_initialized', {
        userId,
        timestamp: new Date().toISOString()
      });

      logger.info('Real-time notifications initialized successfully', { userId });
      return { success: true, message: 'Real-time notifications initialized' };

    } catch (error) {
      logger.error('Failed to initialize real-time notifications', error, { userId });
      
      analytics.trackError(error, {
        operation: 'initialize_realtime_notifications',
        userId
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Set up Supabase real-time subscription
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<void>}
   */
  async setupSupabaseSubscription(userId, options) {
    try {
      // Subscribe to notifications_log table changes
      const subscription = supabase
        .channel(`notifications_${userId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications_log',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          this.handleNewNotification(userId, payload.new);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications_log',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          this.handleNotificationUpdate(userId, payload.new);
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          this.handleInAppNotification(userId, payload.new);
        })
        .subscribe();

      this.subscriptions.set(userId, subscription);
      
      logger.info('Supabase subscription established', { userId });
    } catch (error) {
      logger.error('Failed to set up Supabase subscription', error, { userId });
      throw error;
    }
  }

  /**
   * Set up WebSocket connection (simulated)
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<void>}
   */
  async setupWebSocketConnection(userId, options) {
    try {
      // In a real implementation, you would establish a WebSocket connection
      // For now, we'll simulate the connection
      const connection = {
        userId,
        connected: true,
        lastPing: Date.now(),
        options,
        send: (message) => {
          // Simulate sending message to client
          logger.debug('Sending real-time message', { userId, message });
          return true;
        },
        close: () => {
          this.connections.delete(userId);
          logger.info('WebSocket connection closed', { userId });
        }
      };

      this.connections.set(userId, connection);
      
      logger.info('WebSocket connection established', { userId });
    } catch (error) {
      logger.error('Failed to set up WebSocket connection', error, { userId });
      throw error;
    }
  }

  /**
   * Initialize user preferences for real-time notifications
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async initializeUserPreferences(userId) {
    try {
      // Get user preferences
      const preferences = await this.advancedNotifications.getUserNotificationPreferences(userId);
      
      // Store preferences for real-time processing
      const realtimePreferences = {
        userId,
        enabled: preferences.realtime_notifications !== false,
        channels: preferences.realtime_channels || ['in_app', 'push'],
        filters: preferences.realtime_filters || {},
        lastUpdated: new Date().toISOString()
      };

      // Store in memory for quick access
      this.connections.get(userId).preferences = realtimePreferences;
      
      logger.info('User preferences initialized for real-time', { userId, preferences: realtimePreferences });
    } catch (error) {
      logger.error('Failed to initialize user preferences', error, { userId });
    }
  }

  /**
   * Handle new notification from Supabase
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   * @returns {Promise<void>}
   */
  async handleNewNotification(userId, notification) {
    try {
      logger.info('Handling new real-time notification', { userId, notificationId: notification.id });

      const connection = this.connections.get(userId);
      if (!connection || !connection.connected) {
        logger.warn('No active connection for user', { userId });
        return;
      }

      // Check if notification should be sent in real-time
      if (!this.shouldSendRealtime(connection.preferences, notification)) {
        logger.info('Notification filtered out for real-time', { userId, notificationId: notification.id });
        return;
      }

      // Prepare real-time message
      const realtimeMessage = await this.prepareRealtimeMessage(notification);
      
      // Send to client
      const sent = connection.send(realtimeMessage);
      
      if (sent) {
        // Update notification as delivered
        await this.markNotificationDelivered(notification.id, 'realtime');
        
        // Track analytics
        analytics.trackBusinessEvent('realtime_notification_delivered', {
          userId,
          notificationId: notification.id,
          type: notification.type,
          priority: notification.priority
        });
        
        logger.info('Real-time notification delivered', { userId, notificationId: notification.id });
      } else {
        logger.warn('Failed to send real-time notification', { userId, notificationId: notification.id });
      }

    } catch (error) {
      logger.error('Failed to handle new notification', error, { userId, notificationId: notification.id });
    }
  }

  /**
   * Handle notification update
   * @param {string} userId - User ID
   * @param {Object} notification - Updated notification data
   * @returns {Promise<void>}
   */
  async handleNotificationUpdate(userId, notification) {
    try {
      logger.info('Handling notification update', { userId, notificationId: notification.id });

      const connection = this.connections.get(userId);
      if (!connection || !connection.connected) {
        return;
      }

      // Prepare update message
      const updateMessage = {
        type: 'notification_update',
        notificationId: notification.id,
        data: notification,
        timestamp: new Date().toISOString()
      };

      // Send update to client
      connection.send(updateMessage);
      
      logger.info('Notification update sent', { userId, notificationId: notification.id });
    } catch (error) {
      logger.error('Failed to handle notification update', error, { userId, notificationId: notification.id });
    }
  }

  /**
   * Handle in-app notification
   * @param {string} userId - User ID
   * @param {Object} notification - In-app notification data
   * @returns {Promise<void>}
   */
  async handleInAppNotification(userId, notification) {
    try {
      logger.info('Handling in-app notification', { userId, notificationId: notification.id });

      const connection = this.connections.get(userId);
      if (!connection || !connection.connected) {
        return;
      }

      // Prepare in-app message
      const inAppMessage = {
        type: 'in_app_notification',
        notificationId: notification.id,
        title: notification.title,
        body: notification.body,
        url: notification.url,
        priority: notification.priority,
        category: notification.category,
        timestamp: new Date().toISOString()
      };

      // Send to client
      connection.send(inAppMessage);
      
      logger.info('In-app notification sent', { userId, notificationId: notification.id });
    } catch (error) {
      logger.error('Failed to handle in-app notification', error, { userId, notificationId: notification.id });
    }
  }

  /**
   * Check if notification should be sent in real-time
   * @param {Object} preferences - User preferences
   * @param {Object} notification - Notification data
   * @returns {boolean} Should send
   */
  shouldSendRealtime(preferences, notification) {
    if (!preferences.enabled) {
      return false;
    }

    // Check if notification type is enabled for real-time
    const typePreferences = preferences.filters[notification.type];
    if (typePreferences && typePreferences.realtime === false) {
      return false;
    }

    // Check priority filters
    if (preferences.filters.minPriority) {
      const priorityLevels = { low: 1, normal: 2, high: 3, critical: 4 };
      const notificationPriority = priorityLevels[notification.priority] || 2;
      const minPriority = priorityLevels[preferences.filters.minPriority] || 1;
      
      if (notificationPriority < minPriority) {
        return false;
      }
    }

    // Check category filters
    if (preferences.filters.categories && preferences.filters.categories.length > 0) {
      if (!preferences.filters.categories.includes(notification.category)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Prepare real-time message
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Real-time message
   */
  async prepareRealtimeMessage(notification) {
    try {
      return {
        type: 'notification',
        notificationId: notification.notification_id || notification.id,
        type: notification.type,
        priority: notification.priority,
        category: notification.category,
        title: notification.data?.template?.title || 'FloWorx Notification',
        body: notification.data?.template?.body || 'You have a new notification',
        url: notification.data?.template?.url || '/notifications',
        icon: notification.data?.template?.icon || '/icons/floworx-192.png',
        timestamp: notification.sent_at,
        channels: notification.channels || {},
        metadata: notification.metadata || {},
        requiresAcknowledgment: notification.data?.requiresAcknowledgment || false,
        actionRequired: notification.data?.actionRequired || false
      };
    } catch (error) {
      logger.error('Failed to prepare real-time message', error);
      return {
        type: 'notification',
        title: 'FloWorx Notification',
        body: 'You have a new notification',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Mark notification as delivered
   * @param {string} notificationId - Notification ID
   * @param {string} channel - Delivery channel
   * @returns {Promise<void>}
   */
  async markNotificationDelivered(notificationId, channel) {
    try {
      await supabase
        .from('notifications_log')
        .update({
          delivered_at: new Date().toISOString(),
          delivery_channels: supabase.raw(`delivery_channels || '{"${channel}": true}'::jsonb`)
        })
        .eq('id', notificationId);
    } catch (error) {
      logger.error('Failed to mark notification as delivered', error, { notificationId, channel });
    }
  }

  /**
   * Send real-time notification manually
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   * @param {Object} options - Options
   * @returns {Promise<Object>} Send result
   */
  async sendRealtimeNotification(userId, type, data = {}, options = {}) {
    try {
      logger.info('Sending real-time notification', { userId, type, data });

      const connection = this.connections.get(userId);
      if (!connection || !connection.connected) {
        return { success: false, error: 'No active connection' };
      }

      // Prepare real-time message
      const realtimeMessage = {
        type: 'manual_notification',
        notificationType: type,
        data,
        options,
        timestamp: new Date().toISOString()
      };

      // Send to client
      const sent = connection.send(realtimeMessage);
      
      if (sent) {
        // Track analytics
        analytics.trackBusinessEvent('manual_realtime_notification_sent', {
          userId,
          type,
          timestamp: new Date().toISOString()
        });
        
        logger.info('Real-time notification sent manually', { userId, type });
        return { success: true };
      } else {
        return { success: false, error: 'Failed to send message' };
      }

    } catch (error) {
      logger.error('Failed to send real-time notification', error, { userId, type });
      return { success: false, error: error.message };
    }
  }

  /**
   * Acknowledge notification
   * @param {string} userId - User ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Acknowledgment result
   */
  async acknowledgeNotification(userId, notificationId) {
    try {
      logger.info('Acknowledging notification', { userId, notificationId });

      // Update notification in database
      const { error } = await supabase
        .from('notifications_log')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to acknowledge notification: ${error.message}`);
      }

      // Send acknowledgment to client
      const connection = this.connections.get(userId);
      if (connection && connection.connected) {
        connection.send({
          type: 'notification_acknowledged',
          notificationId,
          timestamp: new Date().toISOString()
        });
      }

      // Track analytics
      analytics.trackBusinessEvent('notification_acknowledged', {
        userId,
        notificationId,
        timestamp: new Date().toISOString()
      });

      logger.info('Notification acknowledged', { userId, notificationId });
      return { success: true };

    } catch (error) {
      logger.error('Failed to acknowledge notification', error, { userId, notificationId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active connections count
   * @returns {number} Active connections count
   */
  getActiveConnectionsCount() {
    return this.connections.size;
  }

  /**
   * Get connection status for user
   * @param {string} userId - User ID
   * @returns {Object} Connection status
   */
  getConnectionStatus(userId) {
    const connection = this.connections.get(userId);
    const subscription = this.subscriptions.get(userId);
    
    return {
      connected: connection ? connection.connected : false,
      lastPing: connection ? connection.lastPing : null,
      subscriptionActive: subscription ? subscription.state === 'SUBSCRIBED' : false,
      preferences: connection ? connection.preferences : null
    };
  }

  /**
   * Disconnect user from real-time notifications
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Disconnect result
   */
  async disconnectUser(userId) {
    try {
      logger.info('Disconnecting user from real-time notifications', { userId });

      // Close WebSocket connection
      const connection = this.connections.get(userId);
      if (connection) {
        connection.close();
      }

      // Unsubscribe from Supabase
      const subscription = this.subscriptions.get(userId);
      if (subscription) {
        await supabase.removeChannel(subscription);
        this.subscriptions.delete(userId);
      }

      // Clear reconnect attempts
      this.reconnectAttempts.delete(userId);

      // Track analytics
      analytics.trackBusinessEvent('realtime_notifications_disconnected', {
        userId,
        timestamp: new Date().toISOString()
      });

      logger.info('User disconnected from real-time notifications', { userId });
      return { success: true };

    } catch (error) {
      logger.error('Failed to disconnect user', error, { userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize heartbeat for connection monitoring
   * @returns {void}
   */
  initializeHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform heartbeat check
   * @returns {void}
   */
  performHeartbeat() {
    const now = Date.now();
    const timeout = 60000; // 1 minute timeout

    for (const [userId, connection] of this.connections) {
      if (now - connection.lastPing > timeout) {
        logger.warn('Connection timeout detected', { userId, lastPing: connection.lastPing });
        this.handleConnectionTimeout(userId);
      } else {
        // Update last ping
        connection.lastPing = now;
      }
    }
  }

  /**
   * Handle connection timeout
   * @param {string} userId - User ID
   * @returns {void}
   */
  handleConnectionTimeout(userId) {
    logger.info('Handling connection timeout', { userId });
    
    // Attempt to reconnect
    this.attemptReconnect(userId);
  }

  /**
   * Attempt to reconnect user
   * @param {string} userId - User ID
   * @returns {void}
   */
  async attemptReconnect(userId) {
    const attempts = this.reconnectAttempts.get(userId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached', { userId, attempts });
      await this.disconnectUser(userId);
      return;
    }

    this.reconnectAttempts.set(userId, attempts + 1);
    
    const delay = Math.min(this.reconnectDelay * Math.pow(2, attempts), this.maxReconnectDelay);
    
    logger.info('Attempting to reconnect', { userId, attempt: attempts + 1, delay });
    
    setTimeout(async () => {
      try {
        await this.initializeRealTimeNotifications(userId);
        this.reconnectAttempts.delete(userId);
        logger.info('Reconnection successful', { userId });
      } catch (error) {
        logger.error('Reconnection failed', error, { userId });
        this.attemptReconnect(userId);
      }
    }, delay);
  }

  /**
   * Get real-time notification statistics
   * @returns {Object} Statistics
   */
  getRealtimeStatistics() {
    const connections = Array.from(this.connections.values());
    const subscriptions = Array.from(this.subscriptions.values());
    
    return {
      activeConnections: connections.length,
      activeSubscriptions: subscriptions.filter(s => s.state === 'SUBSCRIBED').length,
      totalReconnectAttempts: Array.from(this.reconnectAttempts.values()).reduce((sum, attempts) => sum + attempts, 0),
      averageConnectionAge: connections.length > 0 ? 
        connections.reduce((sum, conn) => sum + (Date.now() - conn.lastPing), 0) / connections.length : 0
    };
  }

  /**
   * Cleanup resources
   * @returns {void}
   */
  cleanup() {
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Disconnect all users
    for (const userId of this.connections.keys()) {
      this.disconnectUser(userId);
    }

    logger.info('Real-time notifications system cleaned up');
  }
}

// Export singleton instance
export const realTimeNotifications = new RealTimeNotifications();

export default RealTimeNotifications;
