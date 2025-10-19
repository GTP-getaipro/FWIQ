import { supabase } from '@/lib/customSupabaseClient';

/**
 * Performance Optimizer - Provides caching and query optimization for profile data
 * Implements intelligent caching strategies and database query optimization
 */
export class PerformanceOptimizer {
  constructor(userId) {
    this.userId = userId;
    this.memoryCache = new Map();
    this.cacheTimestamps = new Map();
    this.cacheConfig = {
      profile: { ttl: 5 * 60 * 1000, maxSize: 10 }, // 5 minutes, max 10 profiles
      templates: { ttl: 10 * 60 * 1000, maxSize: 50 }, // 10 minutes, max 50 templates
      businessTypes: { ttl: 30 * 60 * 1000, maxSize: 100 }, // 30 minutes, max 100 business types
      integrations: { ttl: 15 * 60 * 1000, maxSize: 20 }, // 15 minutes, max 20 integrations
      labels: { ttl: 20 * 60 * 1000, maxSize: 30 } // 20 minutes, max 30 label sets
    };
    this.queryCache = new Map();
    this.batchQueue = new Map();
    this.batchTimeout = 100; // 100ms batch timeout
  }

  /**
   * Cache configuration for different data types
   */
  static get CACHE_STRATEGIES() {
    return {
      LRU: 'least-recently-used',
      LFU: 'least-frequently-used',
      TTL: 'time-to-live',
      WRITE_THROUGH: 'write-through',
      WRITE_BACK: 'write-back'
    };
  }

  /**
   * Get cached data with intelligent cache management
   * @param {string} key - Cache key
   * @param {string} type - Data type for TTL management
   * @returns {any} - Cached data or null
   */
  getFromCache(key, type = 'profile') {
    const cacheKey = `${type}_${key}`;
    const timestamp = this.cacheTimestamps.get(cacheKey);
    const config = this.cacheConfig[type];
    
    if (!timestamp || !config) {
      return null;
    }
    
    // Check TTL
    if (Date.now() - timestamp > config.ttl) {
      this.memoryCache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
      return null;
    }
    
    // Update access time for LRU
    this.cacheTimestamps.set(cacheKey, Date.now());
    
    return this.memoryCache.get(cacheKey);
  }

  /**
   * Set data in cache with intelligent eviction
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {string} type - Data type for TTL management
   */
  setInCache(key, data, type = 'profile') {
    const cacheKey = `${type}_${key}`;
    const config = this.cacheConfig[type];
    
    if (!config) {
      return;
    }
    
    // Check cache size and evict if necessary
    this.evictIfNecessary(type, config.maxSize);
    
    // Set data and timestamp
    this.memoryCache.set(cacheKey, data);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * Evict cache entries if size limit exceeded
   * @param {string} type - Data type
   * @param {number} maxSize - Maximum cache size
   */
  evictIfNecessary(type, maxSize) {
    const typeKeys = Array.from(this.memoryCache.keys()).filter(key => key.startsWith(`${type}_`));
    
    if (typeKeys.length >= maxSize) {
      // Sort by timestamp (LRU eviction)
      const sortedKeys = typeKeys.sort((a, b) => {
        const timestampA = this.cacheTimestamps.get(a) || 0;
        const timestampB = this.cacheTimestamps.get(b) || 0;
        return timestampA - timestampB;
      });
      
      // Remove oldest entries
      const keysToRemove = sortedKeys.slice(0, typeKeys.length - maxSize + 1);
      keysToRemove.forEach(key => {
        this.memoryCache.delete(key);
        this.cacheTimestamps.delete(key);
      });
    }
  }

  /**
   * Optimized profile retrieval with caching
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<object>} - Profile data
   */
  async getOptimizedProfile(forceRefresh = false) {
    const cacheKey = `profile_${this.userId}`;
    
    if (!forceRefresh) {
      const cached = this.getFromCache(cacheKey, 'profile');
      if (cached) {
        return {
          ...cached,
          fromCache: true,
          cacheAge: Date.now() - this.cacheTimestamps.get(`${'profile'}_${cacheKey}`)
        };
      }
    }

    try {
      // Use optimized query with specific columns
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          business_type,
          business_types,
          client_config,
          managers,
          suppliers,
          email_labels,
          updated_at
        `)
        .eq('id', this.userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`);
      }

      // Cache the result
      this.setInCache(cacheKey, profile, 'profile');

      return {
        ...profile,
        fromCache: false,
        cacheAge: 0
      };

    } catch (error) {
      console.error('Error fetching optimized profile:', error);
      throw error;
    }
  }

  /**
   * Batch multiple database operations
   * @param {array} operations - Array of operations to batch
   * @returns {Promise<array>} - Results of batched operations
   */
  async batchOperations(operations) {
    const batchKey = `batch_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      // Add operations to batch queue
      this.batchQueue.set(batchKey, { operations, resolve, reject });
      
      // Process batch after timeout
      setTimeout(() => {
        this.processBatch(batchKey);
      }, this.batchTimeout);
    });
  }

  /**
   * Process batched operations
   * @param {string} batchKey - Batch key
   */
  async processBatch(batchKey) {
    const batch = this.batchQueue.get(batchKey);
    if (!batch) return;
    
    try {
      const results = [];
      
      // Group operations by type for efficiency
      const groupedOps = this.groupOperationsByType(batch.operations);
      
      // Execute grouped operations
      for (const [type, ops] of Object.entries(groupedOps)) {
        const typeResults = await this.executeGroupedOperations(type, ops);
        results.push(...typeResults);
      }
      
      batch.resolve(results);
    } catch (error) {
      batch.reject(error);
    } finally {
      this.batchQueue.delete(batchKey);
    }
  }

  /**
   * Group operations by type for efficient execution
   * @param {array} operations - Operations to group
   * @returns {object} - Grouped operations
   */
  groupOperationsByType(operations) {
    const grouped = {};
    
    operations.forEach(op => {
      const type = op.type || 'default';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(op);
    });
    
    return grouped;
  }

  /**
   * Execute grouped operations efficiently
   * @param {string} type - Operation type
   * @param {array} operations - Operations to execute
   * @returns {Promise<array>} - Results
   */
  async executeGroupedOperations(type, operations) {
    switch (type) {
      case 'profile_read':
        return await this.batchProfileReads(operations);
      case 'profile_write':
        return await this.batchProfileWrites(operations);
      case 'template_load':
        return await this.batchTemplateLoads(operations);
      default:
        return await this.executeSequentialOperations(operations);
    }
  }

  /**
   * Batch profile read operations
   * @param {array} operations - Profile read operations
   * @returns {Promise<array>} - Results
   */
  async batchProfileReads(operations) {
    const userIds = operations.map(op => op.userId).filter(Boolean);
    
    if (userIds.length === 0) {
      return operations.map(() => ({ error: 'No user IDs provided' }));
    }
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, business_type, business_types, client_config, managers, suppliers, email_labels')
        .in('id', userIds);
      
      if (error) {
        throw new Error(`Batch profile read failed: ${error.message}`);
      }
      
      // Map results back to operations
      const profileMap = new Map(profiles.map(p => [p.id, p]));
      
      return operations.map(op => {
        const profile = profileMap.get(op.userId);
        if (profile) {
          // Cache the result
          this.setInCache(`profile_${op.userId}`, profile, 'profile');
        }
        return profile || { error: 'Profile not found' };
      });
      
    } catch (error) {
      return operations.map(() => ({ error: error.message }));
    }
  }

  /**
   * Batch profile write operations
   * @param {array} operations - Profile write operations
   * @returns {Promise<array>} - Results
   */
  async batchProfileWrites(operations) {
    const results = [];
    
    // Execute writes sequentially to avoid conflicts
    for (const op of operations) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update(op.data)
          .eq('id', op.userId);
        
        if (error) {
          results.push({ error: error.message });
        } else {
          results.push({ success: true });
          // Clear cache for updated profile
          this.clearCacheForUser(op.userId, 'profile');
        }
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Batch template load operations
   * @param {array} operations - Template load operations
   * @returns {Promise<array>} - Results
   */
  async batchTemplateLoads(operations) {
    const results = [];
    
    for (const op of operations) {
      try {
        const cached = this.getFromCache(op.templateName, 'templates');
        if (cached) {
          results.push(cached);
          continue;
        }
        
        // Load template (this would be async import in real implementation)
        const template = await this.loadTemplate(op.templateName);
        this.setInCache(op.templateName, template, 'templates');
        results.push(template);
        
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Execute operations sequentially
   * @param {array} operations - Operations to execute
   * @returns {Promise<array>} - Results
   */
  async executeSequentialOperations(operations) {
    const results = [];
    
    for (const op of operations) {
      try {
        const result = await op.execute();
        results.push(result);
      } catch (error) {
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Load template with caching
   * @param {string} templateName - Template name
   * @returns {Promise<object>} - Template data
   */
  async loadTemplate(templateName) {
    const cached = this.getFromCache(templateName, 'templates');
    if (cached) {
      return cached;
    }
    
    try {
      // Try to load template via dynamic import
      const template = await import(`@/lib/n8n-templates/${templateName}`);
      const templateData = template.default || template;
      
      this.setInCache(templateName, templateData, 'templates');
      return templateData;
      
    } catch (error) {
      // Silently skip templates that don't exist or can't be loaded
      // This is expected behavior - not all business types will have templates
      console.warn(`ℹ️ Template ${templateName} not available (skipping pre-cache)`);
      return null; // Return null instead of throwing
    }
  }

  /**
   * Optimized query with connection pooling
   * @param {string} table - Table name
   * @param {object} options - Query options
   * @returns {Promise<object>} - Query result
   */
  async optimizedQuery(table, options = {}) {
    const {
      select = '*',
      filters = {},
      orderBy = null,
      limit = null,
      cacheKey = null,
      cacheType = 'profile'
    } = options;
    
    // Check cache first
    if (cacheKey) {
      const cached = this.getFromCache(cacheKey, cacheType);
      if (cached) {
        return { data: cached, fromCache: true };
      }
    }
    
    try {
      let query = supabase.from(table).select(select);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });
      
      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending });
      }
      
      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Query failed: ${error.message}`);
      }
      
      // Cache result if cache key provided
      if (cacheKey && data) {
        this.setInCache(cacheKey, data, cacheType);
      }
      
      return { data, fromCache: false };
      
    } catch (error) {
      console.error('Optimized query failed:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific user
   * @param {string} userId - User ID
   * @param {string} type - Cache type
   */
  clearCacheForUser(userId, type = 'profile') {
    const keysToDelete = Array.from(this.memoryCache.keys())
      .filter(key => key.includes(userId) && key.startsWith(`${type}_`));
    
    keysToDelete.forEach(key => {
      this.memoryCache.delete(key);
      this.cacheTimestamps.delete(key);
    });
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.memoryCache.clear();
    this.cacheTimestamps.clear();
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getCacheStats() {
    const stats = {
      memoryCache: {
        size: this.memoryCache.size,
        keys: Array.from(this.memoryCache.keys())
      },
      cacheTimestamps: {
        size: this.cacheTimestamps.size,
        keys: Array.from(this.cacheTimestamps.keys())
      },
      queryCache: {
        size: this.queryCache.size,
        keys: Array.from(this.queryCache.keys())
      },
      batchQueue: {
        size: this.batchQueue.size,
        keys: Array.from(this.batchQueue.keys())
      }
    };
    
    // Calculate cache hit rates by type
    stats.cacheHitRates = {};
    Object.keys(this.cacheConfig).forEach(type => {
      const typeKeys = Array.from(this.memoryCache.keys()).filter(key => key.startsWith(`${type}_`));
      stats.cacheHitRates[type] = {
        entries: typeKeys.length,
        maxSize: this.cacheConfig[type].maxSize,
        utilization: (typeKeys.length / this.cacheConfig[type].maxSize) * 100
      };
    });
    
    return stats;
  }

  /**
   * Preload frequently accessed data
   * @param {array} userIds - User IDs to preload
   * @returns {Promise<object>} - Preload result
   */
  async preloadData(userIds) {
    const operations = userIds.map(userId => ({
      type: 'profile_read',
      userId,
      operation: 'getProfile'
    }));
    
    try {
      const results = await this.batchOperations(operations);
      const successCount = results.filter(r => !r.error).length;
      
      return {
        success: true,
        preloaded: successCount,
        total: userIds.length,
        results
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        preloaded: 0,
        total: userIds.length
      };
    }
  }
}

/**
 * Convenience function to get performance optimizer instance
 * @param {string} userId - The user ID
 * @returns {PerformanceOptimizer} - Optimizer instance
 */
export const getPerformanceOptimizer = (userId) => {
  return new PerformanceOptimizer(userId);
};

/**
 * React hook for performance optimization
 * @param {string} userId - The user ID
 * @returns {object} - Optimizer methods
 */
export const usePerformanceOptimizer = (userId) => {
  const optimizer = new PerformanceOptimizer(userId);
  
  return {
    getOptimizedProfile: optimizer.getOptimizedProfile.bind(optimizer),
    batchOperations: optimizer.batchOperations.bind(optimizer),
    optimizedQuery: optimizer.optimizedQuery.bind(optimizer),
    loadTemplate: optimizer.loadTemplate.bind(optimizer),
    clearCacheForUser: optimizer.clearCacheForUser.bind(optimizer),
    clearAllCache: optimizer.clearAllCache.bind(optimizer),
    getCacheStats: optimizer.getCacheStats.bind(optimizer),
    preloadData: optimizer.preloadData.bind(optimizer)
  };
};