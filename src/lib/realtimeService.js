/**
 * Realtime Service
 * Handles real-time updates and WebSocket connections
 */

import { supabase } from './customSupabaseClient.js';

export class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Initialize realtime service
   * @param {string} userId - User ID
   */
  async initialize(userId) {
    try {
      console.log('🔄 Initializing realtime service for user:', userId);
      
      // Set up Supabase realtime subscriptions
      await this.setupSupabaseSubscriptions(userId);
      
      this.isConnected = true;
      console.log('✅ Realtime service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize realtime service:', error);
      this.handleReconnection();
    }
  }

  /**
   * Set up Supabase realtime subscriptions
   * @param {string} userId - User ID
   */
  async setupSupabaseSubscriptions(userId) {
    // Email logs subscription
    const emailSubscription = supabase
      .channel('email-logs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'email_logs',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('📧 Email log update:', payload);
        this.handleEmailUpdate(payload);
      })
      .subscribe();

    this.subscriptions.set('email-logs', emailSubscription);

    // Workflow executions subscription
    const workflowSubscription = supabase
      .channel('workflow-executions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workflow_executions',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('⚙️ Workflow execution update:', payload);
        this.handleWorkflowUpdate(payload);
      })
      .subscribe();

    this.subscriptions.set('workflow-executions', workflowSubscription);

    // Performance metrics subscription
    const metricsSubscription = supabase
      .channel('performance-metrics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'performance_metrics',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('📊 Performance metrics update:', payload);
        this.handleMetricsUpdate(payload);
      })
      .subscribe();

    this.subscriptions.set('performance-metrics', metricsSubscription);

    // AI usage logs subscription
    const aiUsageSubscription = supabase
      .channel('ai-usage-logs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_usage_logs',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('🤖 AI usage update:', payload);
        this.handleAIUsageUpdate(payload);
      })
      .subscribe();

    this.subscriptions.set('ai-usage-logs', aiUsageSubscription);
  }

  /**
   * Handle email updates
   * @param {Object} payload - Supabase payload
   */
  handleEmailUpdate(payload) {
    const event = new CustomEvent('emailUpdate', {
      detail: {
        type: payload.eventType,
        data: payload.new || payload.old,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Handle workflow updates
   * @param {Object} payload - Supabase payload
   */
  handleWorkflowUpdate(payload) {
    const event = new CustomEvent('workflowUpdate', {
      detail: {
        type: payload.eventType,
        data: payload.new || payload.old,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Handle metrics updates
   * @param {Object} payload - Supabase payload
   */
  handleMetricsUpdate(payload) {
    const event = new CustomEvent('metricsUpdate', {
      detail: {
        type: payload.eventType,
        data: payload.new || payload.old,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Handle AI usage updates
   * @param {Object} payload - Supabase payload
   */
  handleAIUsageUpdate(payload) {
    const event = new CustomEvent('aiUsageUpdate', {
      detail: {
        type: payload.eventType,
        data: payload.new || payload.old,
        timestamp: new Date().toISOString()
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Subscribe to custom events
   * @param {string} eventName - Event name
   * @param {Function} callback - Event callback
   */
  subscribe(eventName, callback) {
    window.addEventListener(eventName, callback);
    
    // Store subscription for cleanup
    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, []);
    }
    this.subscriptions.get(eventName).push(callback);
  }

  /**
   * Unsubscribe from custom events
   * @param {string} eventName - Event name
   * @param {Function} callback - Event callback
   */
  unsubscribe(eventName, callback) {
    window.removeEventListener(eventName, callback);
    
    if (this.subscriptions.has(eventName)) {
      const callbacks = this.subscriptions.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Send realtime message to other clients
   * @param {string} channel - Channel name
   * @param {Object} message - Message data
   */
  async sendMessage(channel, message) {
    try {
      const realtimeChannel = supabase.channel(`broadcast-${channel}`);
      
      await realtimeChannel.subscribe();
      
      const response = await realtimeChannel.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          ...message,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('📤 Realtime message sent:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send realtime message:', error);
      throw error;
    }
  }

  /**
   * Join a realtime channel
   * @param {string} channelName - Channel name
   * @param {Function} onMessage - Message handler
   */
  async joinChannel(channelName, onMessage) {
    try {
      const channel = supabase.channel(`room-${channelName}`);
      
      channel.on('broadcast', { event: 'message' }, (payload) => {
        console.log('📨 Received realtime message:', payload);
        onMessage(payload);
      });
      
      await channel.subscribe();
      
      this.subscriptions.set(`room-${channelName}`, channel);
      
      console.log(`✅ Joined realtime channel: ${channelName}`);
      return channel;
    } catch (error) {
      console.error(`❌ Failed to join channel ${channelName}:`, error);
      throw error;
    }
  }

  /**
   * Leave a realtime channel
   * @param {string} channelName - Channel name
   */
  async leaveChannel(channelName) {
    try {
      const channel = this.subscriptions.get(`room-${channelName}`);
      if (channel) {
        await channel.unsubscribe();
        this.subscriptions.delete(`room-${channelName}`);
        console.log(`✅ Left realtime channel: ${channelName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to leave channel ${channelName}:`, error);
    }
  }

  /**
   * Handle reconnection logic
   */
  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await this.reconnect();
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.handleReconnection();
      }
    }, delay);
  }

  /**
   * Reconnect to realtime services
   */
  async reconnect() {
    try {
      console.log('🔄 Reconnecting to realtime services...');
      
      // Clean up existing subscriptions
      await this.cleanup();
      
      // Reinitialize
      const userId = (await supabase.auth.getUser()).data?.user?.id;
      if (userId) {
        await this.initialize(userId);
        this.reconnectAttempts = 0;
        console.log('✅ Reconnection successful');
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      subscriptions: this.subscriptions.size,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Clean up all subscriptions
   */
  async cleanup() {
    try {
      console.log('🧹 Cleaning up realtime subscriptions...');
      
      for (const [name, subscription] of this.subscriptions) {
        if (typeof subscription.unsubscribe === 'function') {
          await subscription.unsubscribe();
        }
      }
      
      this.subscriptions.clear();
      this.isConnected = false;
      
      console.log('✅ Realtime subscriptions cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup subscriptions:', error);
    }
  }

  /**
   * Shutdown realtime service
   */
  async shutdown() {
    try {
      console.log('🛑 Shutting down realtime service...');
      await this.cleanup();
      console.log('✅ Realtime service shutdown complete');
    } catch (error) {
      console.error('❌ Failed to shutdown realtime service:', error);
    }
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
