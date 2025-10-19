/**
 * Real-time Analytics Service
 * Provides live updates for analytics dashboard
 */

import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class RealTimeAnalytics {
  constructor(userId) {
    this.userId = userId;
    this.subscriptions = new Map();
    this.callbacks = new Map();
    this.isConnected = false;
  }

  /**
   * Subscribe to real-time analytics updates
   * @param {string} channel - Channel name
   * @param {Function} callback - Callback function
   */
  async subscribe(channel, callback) {
    try {
      const subscription = supabase
        .channel(`analytics_${channel}_${this.userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'outlook_analytics_events',
          filter: `user_id=eq.${this.userId}`
        }, (payload) => {
          logger.info('Real-time analytics update received', { channel, payload });
          callback(payload);
        })
        .subscribe();

      this.subscriptions.set(channel, subscription);
      this.callbacks.set(channel, callback);
      this.isConnected = true;

      logger.info('Real-time analytics subscription created', { channel, userId: this.userId });
    } catch (error) {
      logger.error('Failed to subscribe to real-time analytics', { error: error.message, channel });
      throw error;
    }
  }

  /**
   * Subscribe to email processing updates
   * @param {Function} callback - Callback function
   */
  async subscribeToEmailUpdates(callback) {
    return this.subscribe('emails', callback);
  }

  /**
   * Subscribe to AI response updates
   * @param {Function} callback - Callback function
   */
  async subscribeToAIUpdates(callback) {
    return this.subscribe('ai', callback);
  }

  /**
   * Subscribe to workflow execution updates
   * @param {Function} callback - Callback function
   */
  async subscribeToWorkflowUpdates(callback) {
    return this.subscribe('workflows', callback);
  }

  /**
   * Unsubscribe from a channel
   * @param {string} channel - Channel name
   */
  unsubscribe(channel) {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(channel);
      this.callbacks.delete(channel);
      logger.info('Real-time analytics subscription removed', { channel });
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.subscriptions.forEach((subscription, channel) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
    this.callbacks.clear();
    this.isConnected = false;
    logger.info('All real-time analytics subscriptions removed');
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected && this.subscriptions.size > 0;
  }

  /**
   * Get active subscriptions
   * @returns {Array} List of active channels
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.unsubscribeAll();
  }
}

export default RealTimeAnalytics;
