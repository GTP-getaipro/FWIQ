/**
 * Cache Manager for Deploy-N8N Edge Function
 * 
 * Purpose: In-memory caching for AI system messages and business templates
 * Benefits:
 * - Reduces database queries
 * - Faster deployment times
 * - Lower Supabase costs
 * - Better performance
 * 
 * Note: This is an in-memory cache that persists for the lifetime of the
 * Edge Function instance. Deno Deploy may spin up/down instances, so
 * cache may be cold on first request.
 */

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  size: number;
}

// ============================================================================
// CACHE MANAGER CLASS
// ============================================================================

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    size: 0
  };
  
  /**
   * Set a value in the cache with TTL
   * 
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds (default: 1 hour)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + (ttlSeconds * 1000),
      createdAt: now
    });
    
    this.stats.sets++;
    this.stats.size = this.cache.size;
    
    console.log(`[Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      console.log(`[Cache] MISS: ${key}`);
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      console.log(`[Cache] EXPIRED: ${key}`);
      return null;
    }
    
    this.stats.hits++;
    const age = Math.floor((now - entry.createdAt) / 1000);
    console.log(`[Cache] HIT: ${key} (age: ${age}s)`);
    
    return entry.data as T;
  }
  
  /**
   * Check if a key exists and is not expired
   * 
   * @param key - Cache key
   * @returns True if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }
    
    return true;
  }
  
  /**
   * Invalidate (delete) a specific cache key
   * 
   * @param key - Cache key to invalidate
   * @returns True if key was found and deleted
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.stats.invalidations++;
      this.stats.size = this.cache.size;
      console.log(`[Cache] INVALIDATE: ${key}`);
    }
    
    return deleted;
  }
  
  /**
   * Invalidate all keys matching a pattern
   * 
   * @param pattern - Regex pattern to match keys
   * @returns Number of keys invalidated
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      this.stats.invalidations += count;
      this.stats.size = this.cache.size;
      console.log(`[Cache] INVALIDATE_PATTERN: ${pattern} (${count} keys)`);
    }
    
    return count;
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.invalidations += size;
    this.stats.size = 0;
    console.log(`[Cache] CLEAR: ${size} keys removed`);
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Cache stats object
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.cache.size
    };
  }
  
  /**
   * Get cache hit rate
   * 
   * @returns Hit rate as percentage (0-100)
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total) * 100;
  }
  
  /**
   * Clean up expired entries
   * 
   * @returns Number of entries removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      this.stats.size = this.cache.size;
      console.log(`[Cache] CLEANUP: ${removed} expired entries removed`);
    }
    
    return removed;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const cache = new CacheManager();

// ============================================================================
// CACHE KEY BUILDERS
// ============================================================================

/**
 * Build cache key for AI system message
 */
export function buildAISystemMessageKey(userId: string): string {
  return `ai-system-message:${userId}`;
}

/**
 * Build cache key for reply prompt
 */
export function buildReplyPromptKey(userId: string): string {
  return `reply-prompt:${userId}`;
}

/**
 * Build cache key for business type template
 */
export function buildBusinessTypeTemplateKey(businessType: string): string {
  return `business-template:${businessType}`;
}

/**
 * Build cache key for user profile
 */
export function buildUserProfileKey(userId: string): string {
  return `user-profile:${userId}`;
}

/**
 * Build cache key for workflow template
 */
export function buildWorkflowTemplateKey(businessType: string, provider: string): string {
  return `workflow-template:${businessType}:${provider}`;
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * Invalidate all cache entries for a specific user
 * 
 * @param userId - User ID
 * @returns Number of entries invalidated
 */
export function invalidateUserCache(userId: string): number {
  return cache.invalidatePattern(`^(ai-system-message|reply-prompt|user-profile):${userId}$`);
}

/**
 * Invalidate all business type template cache entries
 * 
 * @returns Number of entries invalidated
 */
export function invalidateBusinessTemplateCache(): number {
  return cache.invalidatePattern(`^business-template:`);
}

/**
 * Invalidate all workflow template cache entries
 * 
 * @returns Number of entries invalidated
 */
export function invalidateWorkflowTemplateCache(): number {
  return cache.invalidatePattern(`^workflow-template:`);
}

// ============================================================================
// PERIODIC CLEANUP
// ============================================================================

/**
 * Start periodic cleanup of expired cache entries
 * Runs every 5 minutes
 */
export function startPeriodicCleanup(): void {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('[Cache] Periodic cleanup started (every 5 minutes)');
}

// ============================================================================
// CACHE WARMING (OPTIONAL)
// ============================================================================

/**
 * Warm up cache with commonly used data
 * This can be called on Edge Function startup
 */
export async function warmCache(supabaseClient: any): Promise<void> {
  console.log('[Cache] Warming cache...');
  
  try {
    // Fetch all active business type templates
    const { data: templates, error } = await supabaseClient
      .from('business_type_templates')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('[Cache] Failed to warm business templates:', error);
      return;
    }
    
    // Cache each template
    for (const template of templates || []) {
      const key = buildBusinessTypeTemplateKey(template.business_type);
      cache.set(key, template, 3600); // 1 hour TTL
    }
    
    console.log(`[Cache] Warmed ${templates?.length || 0} business type templates`);
  } catch (error) {
    console.error('[Cache] Cache warming failed:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  cache,
  buildAISystemMessageKey,
  buildReplyPromptKey,
  buildBusinessTypeTemplateKey,
  buildUserProfileKey,
  buildWorkflowTemplateKey,
  invalidateUserCache,
  invalidateBusinessTemplateCache,
  invalidateWorkflowTemplateCache,
  startPeriodicCleanup,
  warmCache
};

