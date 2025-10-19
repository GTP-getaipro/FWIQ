/**
 * Cache Manager Service
 * 
 * Provides high-level caching functions for common data types:
 * - User profiles
 * - Business configurations
 * - AI responses
 * - Email labels
 */

import redisClient from './redisClient.js';
import logger from '../utils/logger.js';

class CacheManager {
  constructor() {
    // Cache TTL configurations (in seconds)
    this.ttl = {
      profile: 3600,        // 1 hour
      businessConfig: 1800, // 30 minutes
      aiResponse: 7200,     // 2 hours
      emailLabels: 3600,    // 1 hour
      userSettings: 1800,   // 30 minutes
      subscription: 600,    // 10 minutes
      workflow: 1800        // 30 minutes
    };

    // Cache key prefixes
    this.prefixes = {
      profile: 'profile',
      businessConfig: 'business_config',
      aiResponse: 'ai_response',
      emailLabels: 'email_labels',
      userSettings: 'user_settings',
      subscription: 'subscription',
      workflow: 'workflow'
    };
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param {string} identifier - Unique identifier
   * @returns {string} - Cache key
   */
  generateKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }

  // ============================================================================
  // USER PROFILE CACHING
  // ============================================================================

  /**
   * Get user profile from cache
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} - User profile or null
   */
  async getUserProfile(userId) {
    const key = this.generateKey(this.prefixes.profile, userId);
    const cached = await redisClient.get(key);
    
    if (cached) {
      logger.debug(`Cache HIT: User profile ${userId}`);
    } else {
      logger.debug(`Cache MISS: User profile ${userId}`);
    }
    
    return cached;
  }

  /**
   * Set user profile in cache
   * @param {string} userId - User ID
   * @param {object} profile - User profile data
   * @returns {Promise<boolean>} - Success status
   */
  async setUserProfile(userId, profile) {
    const key = this.generateKey(this.prefixes.profile, userId);
    const success = await redisClient.set(key, profile, this.ttl.profile);
    
    if (success) {
      logger.debug(`Cache SET: User profile ${userId}`);
    }
    
    return success;
  }

  /**
   * Invalidate user profile cache
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateUserProfile(userId) {
    const key = this.generateKey(this.prefixes.profile, userId);
    const success = await redisClient.del(key);
    
    if (success) {
      logger.debug(`Cache INVALIDATE: User profile ${userId}`);
    }
    
    return success;
  }

  // ============================================================================
  // BUSINESS CONFIGURATION CACHING
  // ============================================================================

  /**
   * Get business configuration from cache
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} - Business config or null
   */
  async getBusinessConfig(userId) {
    const key = this.generateKey(this.prefixes.businessConfig, userId);
    const cached = await redisClient.get(key);
    
    if (cached) {
      logger.debug(`Cache HIT: Business config ${userId}`);
    } else {
      logger.debug(`Cache MISS: Business config ${userId}`);
    }
    
    return cached;
  }

  /**
   * Set business configuration in cache
   * @param {string} userId - User ID
   * @param {object} config - Business configuration data
   * @returns {Promise<boolean>} - Success status
   */
  async setBusinessConfig(userId, config) {
    const key = this.generateKey(this.prefixes.businessConfig, userId);
    const success = await redisClient.set(key, config, this.ttl.businessConfig);
    
    if (success) {
      logger.debug(`Cache SET: Business config ${userId}`);
    }
    
    return success;
  }

  /**
   * Invalidate business configuration cache
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateBusinessConfig(userId) {
    const key = this.generateKey(this.prefixes.businessConfig, userId);
    const success = await redisClient.del(key);
    
    if (success) {
      logger.debug(`Cache INVALIDATE: Business config ${userId}`);
    }
    
    return success;
  }

  // ============================================================================
  // AI RESPONSE CACHING
  // ============================================================================

  /**
   * Get AI response from cache
   * @param {string} promptHash - Hash of the prompt
   * @returns {Promise<object|null>} - AI response or null
   */
  async getAIResponse(promptHash) {
    const key = this.generateKey(this.prefixes.aiResponse, promptHash);
    const cached = await redisClient.get(key);
    
    if (cached) {
      logger.debug(`Cache HIT: AI response ${promptHash.substring(0, 8)}...`);
    } else {
      logger.debug(`Cache MISS: AI response ${promptHash.substring(0, 8)}...`);
    }
    
    return cached;
  }

  /**
   * Set AI response in cache
   * @param {string} promptHash - Hash of the prompt
   * @param {object} response - AI response data
   * @returns {Promise<boolean>} - Success status
   */
  async setAIResponse(promptHash, response) {
    const key = this.generateKey(this.prefixes.aiResponse, promptHash);
    const success = await redisClient.set(key, response, this.ttl.aiResponse);
    
    if (success) {
      logger.debug(`Cache SET: AI response ${promptHash.substring(0, 8)}...`);
    }
    
    return success;
  }

  /**
   * Invalidate AI response cache for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of keys deleted
   */
  async invalidateAIResponses(userId) {
    const pattern = `${this.prefixes.aiResponse}:${userId}:*`;
    const count = await redisClient.delPattern(pattern);
    
    if (count > 0) {
      logger.debug(`Cache INVALIDATE: ${count} AI responses for user ${userId}`);
    }
    
    return count;
  }

  // ============================================================================
  // EMAIL LABELS CACHING
  // ============================================================================

  /**
   * Get email labels from cache
   * @param {string} userId - User ID
   * @returns {Promise<array|null>} - Email labels or null
   */
  async getEmailLabels(userId) {
    const key = this.generateKey(this.prefixes.emailLabels, userId);
    const cached = await redisClient.get(key);
    
    if (cached) {
      logger.debug(`Cache HIT: Email labels ${userId}`);
    } else {
      logger.debug(`Cache MISS: Email labels ${userId}`);
    }
    
    return cached;
  }

  /**
   * Set email labels in cache
   * @param {string} userId - User ID
   * @param {array} labels - Email labels data
   * @returns {Promise<boolean>} - Success status
   */
  async setEmailLabels(userId, labels) {
    const key = this.generateKey(this.prefixes.emailLabels, userId);
    const success = await redisClient.set(key, labels, this.ttl.emailLabels);
    
    if (success) {
      logger.debug(`Cache SET: Email labels ${userId}`);
    }
    
    return success;
  }

  /**
   * Invalidate email labels cache
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateEmailLabels(userId) {
    const key = this.generateKey(this.prefixes.emailLabels, userId);
    const success = await redisClient.del(key);
    
    if (success) {
      logger.debug(`Cache INVALIDATE: Email labels ${userId}`);
    }
    
    return success;
  }

  // ============================================================================
  // USER SETTINGS CACHING
  // ============================================================================

  /**
   * Get user settings from cache
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} - User settings or null
   */
  async getUserSettings(userId) {
    const key = this.generateKey(this.prefixes.userSettings, userId);
    return await redisClient.get(key);
  }

  /**
   * Set user settings in cache
   * @param {string} userId - User ID
   * @param {object} settings - User settings data
   * @returns {Promise<boolean>} - Success status
   */
  async setUserSettings(userId, settings) {
    const key = this.generateKey(this.prefixes.userSettings, userId);
    return await redisClient.set(key, settings, this.ttl.userSettings);
  }

  /**
   * Invalidate user settings cache
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async invalidateUserSettings(userId) {
    const key = this.generateKey(this.prefixes.userSettings, userId);
    return await redisClient.del(key);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Invalidate all cache for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of keys deleted
   */
  async invalidateUserCache(userId) {
    const patterns = [
      `${this.prefixes.profile}:${userId}`,
      `${this.prefixes.businessConfig}:${userId}`,
      `${this.prefixes.emailLabels}:${userId}`,
      `${this.prefixes.userSettings}:${userId}`,
      `${this.prefixes.subscription}:${userId}`,
      `${this.prefixes.workflow}:${userId}:*`,
      `${this.prefixes.aiResponse}:${userId}:*`
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        totalDeleted += await redisClient.delPattern(pattern);
      } else {
        const deleted = await redisClient.del(pattern);
        if (deleted) totalDeleted++;
      }
    }

    logger.info(`Cache INVALIDATE: ${totalDeleted} keys for user ${userId}`);
    return totalDeleted;
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} - Cache statistics
   */
  async getStats() {
    return {
      redisStatus: redisClient.getStatus(),
      ttlConfig: this.ttl
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

export default cacheManager;

