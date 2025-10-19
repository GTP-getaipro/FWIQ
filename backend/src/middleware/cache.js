/**
 * Cache Middleware
 * 
 * Provides caching middleware for Express routes
 */

import cacheManager from '../services/cacheManager.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Generate cache key from request
 * @param {object} req - Express request object
 * @param {string} prefix - Cache key prefix
 * @returns {string} - Cache key
 */
function generateCacheKey(req, prefix = 'route') {
  const userId = req.user?.id || 'anonymous';
  const path = req.path;
  const query = JSON.stringify(req.query);
  const hash = crypto.createHash('md5').update(`${path}${query}`).digest('hex');
  return `${prefix}:${userId}:${hash}`;
}

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {string} prefix - Cache key prefix
 * @returns {function} - Express middleware
 */
function cacheMiddleware(ttl = 300, prefix = 'route') {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = generateCacheKey(req, prefix);
      const cached = await cacheManager.redisClient.get(cacheKey);

      if (cached) {
        logger.debug(`Cache HIT: ${cacheKey}`);
        return res.json(cached);
      }

      logger.debug(`Cache MISS: ${cacheKey}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache the response
        cacheManager.redisClient.set(cacheKey, data, ttl).catch(err => {
          logger.error('Failed to cache response:', err);
        });

        // Send the response
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Invalidate cache for a specific pattern
 * @param {string} pattern - Cache key pattern
 * @returns {Promise<number>} - Number of keys deleted
 */
async function invalidateCache(pattern) {
  try {
    const count = await cacheManager.redisClient.delPattern(pattern);
    logger.info(`Cache invalidated: ${count} keys matching ${pattern}`);
    return count;
  } catch (error) {
    logger.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Invalidate cache for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of keys deleted
 */
async function invalidateUserCache(userId) {
  return await cacheManager.invalidateUserCache(userId);
}

export default {
  cacheMiddleware,
  invalidateCache,
  invalidateUserCache,
  generateCacheKey
};

