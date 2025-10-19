/**
 * n8n Webhook Service
 * Centralized webhook management for n8n integration
 * Handles Voice Training and Auto-Profile Analysis webhooks
 */

import { supabase } from './customSupabaseClient.js';

export class N8nWebhookService {
  constructor() {
    this.baseUrl = import.meta.env?.VITE_N8N_BASE_URL || 'https://n8n.srv995290.hstgr.cloud';
    this.rateLimiter = new Map();
    this.maxRequestsPerMinute = 10;
  }

  /**
   * Check rate limit for user
   * @param {string} userId - User ID
   * @throws {Error} If rate limit exceeded
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const userRequests = this.rateLimiter.get(userId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= this.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded: Maximum 10 requests per minute');
    }
    
    recentRequests.push(now);
    this.rateLimiter.set(userId, recentRequests);
  }

  /**
   * Log webhook call
   * @param {string} userId - User ID
   * @param {string} type - Webhook type
   * @param {object} payload - Request payload
   * @param {object} response - Response data
   * @param {string} status - Status (success/error)
   */
  async logWebhookCall(userId, type, payload, response, status) {
    try {
      await supabase.from('webhook_logs').insert({
        user_id: userId,
        webhook_type: type,
        payload,
        response,
        status,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.warn('⚠️ Failed to log webhook call:', error.message);
    }
  }

  /**
   * Trigger voice refinement webhook
   * @param {string} userId - User ID
   * @param {string} trigger - Trigger type ('manual' or 'automatic')
   * @returns {Promise<object>} Webhook response
   */
  async triggerVoiceRefinement(userId, trigger = 'manual') {
    try {
      console.log('🎤 Triggering voice refinement webhook...', { userId, trigger });
      
      // Check rate limit
      this.checkRateLimit(userId);

      const payload = {
        userId,
        trigger,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.baseUrl}/webhook/voice-refinement`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Log successful call
      await this.logWebhookCall(userId, 'voice-refinement', payload, result, 'success');
      
      console.log('✅ Voice refinement webhook triggered successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Voice refinement webhook failed:', error);
      
      // Log failed call
      await this.logWebhookCall(userId, 'voice-refinement', { userId, trigger }, { error: error.message }, 'error');
      
      throw error;
    }
  }

  /**
   * Trigger auto-profile analysis webhook
   * @param {string} userId - User ID
   * @param {string} integrationId - Integration ID
   * @param {string} provider - Email provider ('gmail' or 'outlook')
   * @param {number} maxEmails - Maximum emails to analyze
   * @returns {Promise<object>} Webhook response with extracted profile
   */
  async triggerAutoProfile(userId, integrationId, provider, maxEmails = 50) {
    try {
      console.log('🤖 Triggering auto-profile analysis webhook...', { userId, provider, maxEmails });
      
      // Check rate limit
      this.checkRateLimit(userId);

      const payload = {
        userId,
        integrationId,
        provider,
        maxEmails
      };

      const response = await fetch(`${this.baseUrl}/webhook/auto-profile-analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Log successful call
      await this.logWebhookCall(userId, 'auto-profile-analyze', payload, result, 'success');
      
      console.log('✅ Auto-profile analysis webhook triggered successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Auto-profile analysis webhook failed:', error);
      
      // Log failed call
      await this.logWebhookCall(userId, 'auto-profile-analyze', { userId, integrationId, provider }, { error: error.message }, 'error');
      
      throw error;
    }
  }

  /**
   * Check if voice refinement is needed
   * @param {string} userId - User ID
   * @returns {Promise<object>} Refinement status
   */
  async checkRefinementThreshold(userId) {
    try {
      const { data: comparisons, error } = await supabase
        .from('ai_human_comparison')
        .select('id, created_at')
        .eq('user_id', userId)
        .is('analysis_results', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pendingCount = comparisons?.length || 0;
      const threshold = 10;
      const shouldRefine = pendingCount >= threshold;

      return {
        shouldRefine,
        pendingCount,
        threshold,
        nextRefinement: shouldRefine ? 'now' : `${threshold - pendingCount} more edits needed`
      };

    } catch (error) {
      console.error('❌ Failed to check refinement threshold:', error);
      throw error;
    }
  }

  /**
   * Get webhook statistics
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<object>} Webhook statistics
   */
  async getWebhookStats(userId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: logs, error } = await supabase
        .from('webhook_logs')
        .select('webhook_type, status, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const stats = {
        total: logs?.length || 0,
        success: logs?.filter(l => l.status === 'success').length || 0,
        error: logs?.filter(l => l.status === 'error').length || 0,
        byType: {},
        successRate: 0
      };

      // Calculate success rate
      if (stats.total > 0) {
        stats.successRate = ((stats.success / stats.total) * 100).toFixed(2);
      }

      // Group by type
      logs?.forEach(log => {
        if (!stats.byType[log.webhook_type]) {
          stats.byType[log.webhook_type] = { total: 0, success: 0, error: 0 };
        }
        stats.byType[log.webhook_type].total++;
        stats.byType[log.webhook_type][log.status]++;
      });

      return stats;

    } catch (error) {
      console.error('❌ Failed to get webhook stats:', error);
      return {
        total: 0,
        success: 0,
        error: 0,
        byType: {},
        successRate: 0
      };
    }
  }

  /**
   * Test webhook connectivity
   * @param {string} webhookType - Type of webhook to test
   * @returns {Promise<boolean>} True if webhook is reachable
   */
  async testWebhookConnectivity(webhookType = 'voice-refinement') {
    try {
      const testPayload = {
        userId: 'test-user',
        trigger: 'connectivity-test',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.baseUrl}/webhook/${webhookType}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify(testPayload)
      });

      // 200-299 or 404 (workflow not deployed yet) are acceptable
      return response.ok || response.status === 404;

    } catch (error) {
      console.error('❌ Webhook connectivity test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const n8nWebhookService = new N8nWebhookService();

export default n8nWebhookService;

