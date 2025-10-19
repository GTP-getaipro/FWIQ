/**
 * Email Poller - Fallback polling mechanism for email monitoring
 * Used when webhooks are not available or fail
 */

import { emailMonitoring } from './emailMonitoring.js';

export class EmailPoller {
  constructor() {
    this.activePolls = new Map(); // userId -> pollInterval
    this.defaultInterval = 30000; // 30 seconds
  }

  /**
   * Start polling for a specific user
   * @param {string} userId - User ID
   * @param {number} interval - Polling interval in milliseconds
   */
  startPolling(userId, interval = this.defaultInterval) {
    if (this.activePolls.has(userId)) {
      console.log(`📧 Polling already active for user ${userId}`);
      return;
    }

    console.log(`🚀 Starting email polling for user ${userId} (${interval / 1000}s interval)`);
    
    const pollInterval = setInterval(async () => {
      try {
        await emailMonitoring.checkForNewEmails(userId);
      } catch (error) {
        console.error(`❌ Polling error for user ${userId}:`, error);
      }
    }, interval);

    this.activePolls.set(userId, pollInterval);
  }

  /**
   * Stop polling for a specific user
   * @param {string} userId - User ID
   */
  stopPolling(userId) {
    const pollInterval = this.activePolls.get(userId);
    if (pollInterval) {
      clearInterval(pollInterval);
      this.activePolls.delete(userId);
      console.log(`🛑 Stopped email polling for user ${userId}`);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling() {
    for (const [userId, pollInterval] of this.activePolls) {
      clearInterval(pollInterval);
      console.log(`🛑 Stopped email polling for user ${userId}`);
    }
    this.activePolls.clear();
  }

  /**
   * Check if polling is active for a user
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  isPollingActive(userId) {
    return this.activePolls.has(userId);
  }

  /**
   * Get all active polls
   * @returns {Array<string>} Array of user IDs with active polls
   */
  getActivePolls() {
    return Array.from(this.activePolls.keys());
  }
}

// Export singleton instance
export const emailPoller = new EmailPoller();
