/**
 * Redis Client Service
 * 
 * Provides Redis caching functionality with connection management,
 * error handling, and graceful degradation.
 */

import Redis from 'ioredis';
import logger from '../utils/logger.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      // Check if Redis is configured
      const redisUrl = process.env.REDIS_URL;
      const redisHost = process.env.REDIS_HOST;
      const redisPort = process.env.REDIS_PORT || 6379;
      const redisPassword = process.env.REDIS_PASSWORD;

      if (!redisUrl && !redisHost) {
        logger.warn('Redis not configured - caching will be disabled');
        this.isEnabled = false;
        return;
      }

      // Create Redis client
      if (redisUrl) {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > this.maxConnectionAttempts) {
              logger.error('Redis max connection attempts reached');
              return null;
            }
            return Math.min(times * 100, 3000);
          },
          reconnectOnError: (err) => {
            logger.warn('Redis reconnecting on error:', err.message);
            return true;
          }
        });
      } else {
        this.client = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > this.maxConnectionAttempts) {
              logger.error('Redis max connection attempts reached');
              return null;
            }
            return Math.min(times * 100, 3000);
          },
          reconnectOnError: (err) => {
            logger.warn('Redis reconnecting on error:', err.message);
            return true;
          }
        });
      }

      // Event handlers
      this.client.on('connect', () => {
        logger.info('✅ Redis client connected');
        this.isConnected = true;
        this.isEnabled = true;
        this.connectionAttempts = 0;
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis client ready');
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        this.connectionAttempts++;
        logger.info(`Redis reconnecting (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
      });

      // Test connection
      await this.client.ping();
      logger.info('Redis connection test successful');

    } catch (error) {
      logger.error('Failed to initialize Redis:', error.message);
      this.isEnabled = false;
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached value or null
   */
  async get(key) {
    if (!this.isEnabled || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      // Try to parse JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl = 3600) {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl > 0) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async del(key) {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} - Number of keys deleted
   */
  async delPattern(pattern) {
    if (!this.isEnabled || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Redis DEL pattern error for ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Exists status
   */
  async exists(key) {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Set expiration on a key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async expire(key, ttl) {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Increment a counter
   * @param {string} key - Cache key
   * @param {number} amount - Amount to increment (default: 1)
   * @returns {Promise<number>} - New value
   */
  async incr(key, amount = 1) {
    if (!this.isEnabled || !this.isConnected) {
      return 0;
    }

    try {
      if (amount === 1) {
        return await this.client.incr(key);
      } else {
        return await this.client.incrby(key, amount);
      }
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, error.message);
      return 0;
    }
  }

  /**
   * Flush all keys (use with caution!)
   * @returns {Promise<boolean>} - Success status
   */
  async flushAll() {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    try {
      await this.client.flushdb();
      logger.warn('Redis cache flushed');
      return true;
    } catch (error) {
      logger.error('Redis FLUSH error:', error.message);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
  }

  /**
   * Get connection status
   * @returns {object} - Connection status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      connected: this.isConnected,
      connectionAttempts: this.connectionAttempts
    };
  }
}

// Create singleton instance
const redisClient = new RedisClient();

export default redisClient;

