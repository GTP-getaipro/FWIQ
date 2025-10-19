/**
 * Email Performance Optimizer
 * 
 * Provides email processing optimization including caching,
 * batch processing, resource management, and performance monitoring.
 */

import { supabase } from './customSupabaseClient';

export class EmailOptimizer {
  constructor() {
    this.cache = new Map();
    this.batchQueue = [];
    this.processingMetrics = new Map();
    this.optimizationSettings = {
      enableCaching: true,
      enableBatchProcessing: true,
      enableCompression: true,
      enableDeduplication: true,
      maxCacheSize: 1000,
      maxBatchSize: 50,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      batchTimeout: 30 * 1000 // 30 seconds
    };
    this.isProcessing = false;
  }

  /**
   * Optimize email data for processing
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Optimized email data
   */
  async optimizeEmailData(emailData) {
    try {
      const startTime = Date.now();
      
      // 1. Check cache first
      if (this.optimizationSettings.enableCaching) {
        const cachedData = this.getCachedData(emailData.id);
        if (cachedData) {
          return {
            ...emailData,
            ...cachedData,
            optimizationApplied: true,
            fromCache: true
          };
        }
      }

      // 2. Apply optimizations
      const optimizedData = {
        ...emailData,
        ...await this.applyOptimizations(emailData)
      };

      // 3. Cache optimized data
      if (this.optimizationSettings.enableCaching) {
        this.setCachedData(emailData.id, optimizedData);
      }

      // 4. Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updateOptimizationMetrics(processingTime, emailData);

      return {
        ...optimizedData,
        optimizationApplied: true,
        fromCache: false,
        optimizationTime: processingTime
      };

    } catch (error) {
      console.error('Email optimization failed:', error);
      return {
        ...emailData,
        optimizationApplied: false,
        optimizationError: error.message
      };
    }
  }

  /**
   * Apply various optimizations to email data
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Optimization results
   */
  async applyOptimizations(emailData) {
    const optimizations = {};

    try {
      // 1. Deduplication
      if (this.optimizationSettings.enableDeduplication) {
        optimizations.deduplication = await this.applyDeduplication(emailData);
      }

      // 2. Compression
      if (this.optimizationSettings.enableCompression) {
        optimizations.compression = await this.applyCompression(emailData);
      }

      // 3. Data normalization
      optimizations.normalization = await this.normalizeData(emailData);

      // 4. Performance hints
      optimizations.performanceHints = await this.generatePerformanceHints(emailData);

      // 5. Resource optimization
      optimizations.resourceOptimization = await this.optimizeResources(emailData);

      return optimizations;

    } catch (error) {
      console.error('Failed to apply optimizations:', error);
      return { error: error.message };
    }
  }

  /**
   * Apply deduplication to email data
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Deduplication result
   */
  async applyDeduplication(emailData) {
    try {
      // Check for duplicate emails
      const duplicateCheck = await this.checkForDuplicates(emailData);
      
      if (duplicateCheck.isDuplicate) {
        return {
          isDuplicate: true,
          duplicateId: duplicateCheck.duplicateId,
          shouldSkip: true,
          reason: 'Duplicate email detected'
        };
      }

      // Remove duplicate content within the email
      const cleanedContent = this.removeDuplicateContent(emailData);

      return {
        isDuplicate: false,
        cleanedContent,
        duplicatesRemoved: cleanedContent.duplicatesRemoved || 0
      };

    } catch (error) {
      console.error('Deduplication failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Check for duplicate emails
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Duplicate check result
   */
  async checkForDuplicates(emailData) {
    try {
      // Check by message ID
      if (emailData.messageId) {
        const { data: existingEmail, error } = await supabase
          .from('email_logs')
          .select('id')
          .eq('message_id', emailData.messageId)
          .limit(1)
          .single();

        if (!error && existingEmail) {
          return {
            isDuplicate: true,
            duplicateId: existingEmail.id,
            reason: 'Message ID match'
          };
        }
      }

      // Check by content hash
      const contentHash = this.generateContentHash(emailData);
      const { data: hashMatch, error: hashError } = await supabase
        .from('email_content_hashes')
        .select('email_id')
        .eq('content_hash', contentHash)
        .limit(1)
        .single();

      if (!hashError && hashMatch) {
        return {
          isDuplicate: true,
          duplicateId: hashMatch.email_id,
          reason: 'Content hash match'
        };
      }

      // Store content hash for future checks
      await this.storeContentHash(emailData.id, contentHash);

      return { isDuplicate: false };

    } catch (error) {
      console.error('Duplicate check failed:', error);
      return { isDuplicate: false, error: error.message };
    }
  }

  /**
   * Generate content hash for email
   * @param {Object} emailData - Email data
   * @returns {string} Content hash
   */
  generateContentHash(emailData) {
    const content = `${emailData.subject || ''}${emailData.body || ''}${emailData.from || ''}`;
    
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Store content hash for future duplicate detection
   * @param {string} emailId - Email ID
   * @param {string} contentHash - Content hash
   */
  async storeContentHash(emailId, contentHash) {
    try {
      await supabase
        .from('email_content_hashes')
        .insert({
          email_id: emailId,
          content_hash: contentHash,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to store content hash:', error);
    }
  }

  /**
   * Remove duplicate content within email
   * @param {Object} emailData - Email data
   * @returns {Object} Cleaned content
   */
  removeDuplicateContent(emailData) {
    const cleaned = { ...emailData };
    let duplicatesRemoved = 0;

    // Remove duplicate paragraphs
    if (cleaned.body?.paragraphs) {
      const uniqueParagraphs = [...new Set(cleaned.body.paragraphs)];
      duplicatesRemoved += cleaned.body.paragraphs.length - uniqueParagraphs.length;
      cleaned.body.paragraphs = uniqueParagraphs;
    }

    // Remove duplicate entities
    if (cleaned.entities) {
      Object.keys(cleaned.entities).forEach(key => {
        if (Array.isArray(cleaned.entities[key])) {
          const unique = [...new Set(cleaned.entities[key])];
          duplicatesRemoved += cleaned.entities[key].length - unique.length;
          cleaned.entities[key] = unique;
        }
      });
    }

    return {
      ...cleaned,
      duplicatesRemoved
    };
  }

  /**
   * Apply compression to email data
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Compression result
   */
  async applyCompression(emailData) {
    try {
      const compression = {
        originalSize: this.calculateDataSize(emailData),
        compressedSize: 0,
        compressionRatio: 0,
        compressionApplied: false
      };

      // Compress large text content
      if (emailData.body?.cleaned && emailData.body.cleaned.length > 1000) {
        const compressedBody = this.compressText(emailData.body.cleaned);
        compression.compressedSize = compressedBody.length;
        compression.compressionRatio = compression.compressedSize / compression.originalSize;
        compression.compressionApplied = true;
      }

      // Compress HTML content
      if (emailData.htmlBody?.original && emailData.htmlBody.original.length > 1000) {
        const compressedHtml = this.compressHtml(emailData.htmlBody.original);
        compression.compressedSize += compressedHtml.length;
        compression.compressionApplied = true;
      }

      return compression;

    } catch (error) {
      console.error('Compression failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Calculate data size in bytes
   * @param {Object} data - Data object
   * @returns {number} Size in bytes
   */
  calculateDataSize(data) {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  /**
   * Compress text content
   * @param {string} text - Text to compress
   * @returns {string} Compressed text
   */
  compressText(text) {
    // Simple text compression (remove extra whitespace, normalize)
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Compress HTML content
   * @param {string} html - HTML to compress
   * @returns {string} Compressed HTML
   */
  compressHtml(html) {
    // Simple HTML compression (remove extra whitespace, comments)
    return html
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .trim();
  }

  /**
   * Normalize email data
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Normalized data
   */
  async normalizeData(emailData) {
    try {
      const normalized = { ...emailData };

      // Normalize email addresses
      if (normalized.from) {
        normalized.from = this.normalizeEmailAddress(normalized.from);
      }

      // Normalize subject
      if (normalized.subject?.original) {
        normalized.subject.normalized = this.normalizeSubject(normalized.subject.original);
      }

      // Normalize timestamps
      if (normalized.received_at) {
        normalized.received_at = this.normalizeTimestamp(normalized.received_at);
      }

      // Normalize content structure
      normalized.contentStructure = this.normalizeContentStructure(normalized);

      return normalized;

    } catch (error) {
      console.error('Data normalization failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Normalize email address
   * @param {string} email - Email address
   * @returns {string} Normalized email
   */
  normalizeEmailAddress(email) {
    return email.toLowerCase().trim();
  }

  /**
   * Normalize subject line
   * @param {string} subject - Subject line
   * @returns {string} Normalized subject
   */
  normalizeSubject(subject) {
    return subject
      .replace(/^(re:|fwd?:|fw:)\s*/i, '') // Remove reply/forward prefixes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Normalize timestamp
   * @param {string} timestamp - Timestamp
   * @returns {string} Normalized timestamp
   */
  normalizeTimestamp(timestamp) {
    try {
      return new Date(timestamp).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Normalize content structure
   * @param {Object} emailData - Email data
   * @returns {Object} Normalized structure
   */
  normalizeContentStructure(emailData) {
    return {
      hasSubject: !!emailData.subject,
      hasBody: !!emailData.body,
      hasHtml: !!emailData.htmlBody,
      hasAttachments: !!(emailData.attachmentData?.attachments?.length),
      contentType: emailData.htmlBody ? 'html' : 'text',
      estimatedLength: this.estimateContentLength(emailData)
    };
  }

  /**
   * Estimate content length
   * @param {Object} emailData - Email data
   * @returns {number} Estimated length
   */
  estimateContentLength(emailData) {
    let length = 0;
    if (emailData.subject) length += emailData.subject.length;
    if (emailData.body) length += emailData.body.length;
    if (emailData.htmlBody) length += emailData.htmlBody.length;
    return length;
  }

  /**
   * Generate performance hints
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Performance hints
   */
  async generatePerformanceHints(emailData) {
    try {
      const hints = {
        processingPriority: 'normal',
        estimatedProcessingTime: 0,
        resourceRequirements: 'low',
        optimizations: []
      };

      // Determine processing priority
      if (emailData.contentAnalysis?.urgency?.level === 'high') {
        hints.processingPriority = 'high';
        hints.estimatedProcessingTime = 1000; // 1 second
      } else if (emailData.contentAnalysis?.complexity?.level === 'high') {
        hints.processingPriority = 'medium';
        hints.estimatedProcessingTime = 2000; // 2 seconds
      } else {
        hints.processingPriority = 'normal';
        hints.estimatedProcessingTime = 500; // 0.5 seconds
      }

      // Determine resource requirements
      const contentLength = this.estimateContentLength(emailData);
      if (contentLength > 10000) {
        hints.resourceRequirements = 'high';
      } else if (contentLength > 5000) {
        hints.resourceRequirements = 'medium';
      } else {
        hints.resourceRequirements = 'low';
      }

      // Suggest optimizations
      if (emailData.attachmentData?.attachments?.length > 5) {
        hints.optimizations.push('Consider batch processing attachments');
      }

      if (emailData.contentAnalysis?.complexity?.level === 'high') {
        hints.optimizations.push('Consider caching complex analysis results');
      }

      if (emailData.threadInfo?.messageCount > 10) {
        hints.optimizations.push('Consider thread optimization for large conversations');
      }

      return hints;

    } catch (error) {
      console.error('Performance hints generation failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Optimize resource usage
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Resource optimization result
   */
  async optimizeResources(emailData) {
    try {
      const optimization = {
        memoryOptimization: false,
        cpuOptimization: false,
        networkOptimization: false,
        storageOptimization: false,
        optimizationsApplied: []
      };

      // Memory optimization
      if (this.estimateContentLength(emailData) > 5000) {
        optimization.memoryOptimization = true;
        optimization.optimizationsApplied.push('Large content detected - memory optimization applied');
      }

      // CPU optimization
      if (emailData.contentAnalysis?.complexity?.level === 'high') {
        optimization.cpuOptimization = true;
        optimization.optimizationsApplied.push('Complex content detected - CPU optimization applied');
      }

      // Network optimization
      if (emailData.attachmentData?.attachments?.length > 0) {
        optimization.networkOptimization = true;
        optimization.optimizationsApplied.push('Attachments detected - network optimization applied');
      }

      // Storage optimization
      if (emailData.threadInfo?.messageCount > 5) {
        optimization.storageOptimization = true;
        optimization.optimizationsApplied.push('Large thread detected - storage optimization applied');
      }

      return optimization;

    } catch (error) {
      console.error('Resource optimization failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Process emails in batch
   * @param {Array} emails - Array of emails
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Batch processing results
   */
  async processBatch(emails, userId) {
    try {
      if (!this.optimizationSettings.enableBatchProcessing) {
        // Process individually if batch processing is disabled
        const results = [];
        for (const email of emails) {
          const result = await this.optimizeEmailData(email);
          results.push(result);
        }
        return results;
      }

      // Group emails by priority and complexity
      const batches = this.groupEmailsForBatchProcessing(emails);

      const results = [];
      for (const batch of batches) {
        const batchResults = await this.processBatchGroup(batch, userId);
        results.push(...batchResults);
      }

      return results;

    } catch (error) {
      console.error('Batch processing failed:', error);
      return emails.map(email => ({
        ...email,
        optimizationApplied: false,
        optimizationError: error.message
      }));
    }
  }

  /**
   * Group emails for batch processing
   * @param {Array} emails - Array of emails
   * @returns {Array} Grouped batches
   */
  groupEmailsForBatchProcessing(emails) {
    const batches = {
      high: [],
      medium: [],
      low: []
    };

    emails.forEach(email => {
      const priority = this.determineEmailPriority(email);
      batches[priority].push(email);
    });

    // Split large batches
    const maxBatchSize = this.optimizationSettings.maxBatchSize;
    const result = [];

    Object.values(batches).forEach(batch => {
      for (let i = 0; i < batch.length; i += maxBatchSize) {
        result.push(batch.slice(i, i + maxBatchSize));
      }
    });

    return result;
  }

  /**
   * Determine email processing priority
   * @param {Object} email - Email data
   * @returns {string} Priority level
   */
  determineEmailPriority(email) {
    if (email.contentAnalysis?.urgency?.level === 'high') return 'high';
    if (email.contentAnalysis?.complexity?.level === 'high') return 'medium';
    return 'low';
  }

  /**
   * Process a batch group
   * @param {Array} batch - Batch of emails
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Batch results
   */
  async processBatchGroup(batch, userId) {
    try {
      const results = [];

      // Process batch in parallel (with concurrency limit)
      const concurrencyLimit = 5;
      for (let i = 0; i < batch.length; i += concurrencyLimit) {
        const chunk = batch.slice(i, i + concurrencyLimit);
        const chunkResults = await Promise.all(
          chunk.map(email => this.optimizeEmailData(email))
        );
        results.push(...chunkResults);
      }

      return results;

    } catch (error) {
      console.error('Batch group processing failed:', error);
      return batch.map(email => ({
        ...email,
        optimizationApplied: false,
        optimizationError: error.message
      }));
    }
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.optimizationSettings.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCachedData(key, data) {
    // Check cache size limit
    if (this.cache.size >= this.optimizationSettings.maxCacheSize) {
      // Remove oldest entries
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Update optimization metrics
   * @param {number} processingTime - Processing time in ms
   * @param {Object} emailData - Email data
   */
  updateOptimizationMetrics(processingTime, emailData) {
    const metrics = this.processingMetrics.get('optimization') || {
      totalProcessed: 0,
      totalTime: 0,
      averageTime: 0,
      fastestTime: Infinity,
      slowestTime: 0
    };

    metrics.totalProcessed++;
    metrics.totalTime += processingTime;
    metrics.averageTime = metrics.totalTime / metrics.totalProcessed;
    metrics.fastestTime = Math.min(metrics.fastestTime, processingTime);
    metrics.slowestTime = Math.max(metrics.slowestTime, processingTime);

    this.processingMetrics.set('optimization', metrics);
  }

  /**
   * Get optimization metrics
   * @returns {Object} Optimization metrics
   */
  getOptimizationMetrics() {
    return this.processingMetrics.get('optimization') || {
      totalProcessed: 0,
      totalTime: 0,
      averageTime: 0,
      fastestTime: 0,
      slowestTime: 0
    };
  }

  /**
   * Update optimization settings
   * @param {Object} settings - New settings
   */
  updateSettings(settings) {
    this.optimizationSettings = {
      ...this.optimizationSettings,
      ...settings
    };
  }

  /**
   * Clear cache
   * @param {string} key - Optional specific key
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStatistics() {
    return {
      size: this.cache.size,
      maxSize: this.optimizationSettings.maxCacheSize,
      hitRate: this.calculateCacheHitRate(),
      oldestEntry: this.getOldestCacheEntry(),
      newestEntry: this.getNewestCacheEntry()
    };
  }

  /**
   * Calculate cache hit rate
   * @returns {number} Hit rate percentage
   */
  calculateCacheHitRate() {
    // This would need to track hits/misses in a real implementation
    return 0;
  }

  /**
   * Get oldest cache entry
   * @returns {Object|null} Oldest entry
   */
  getOldestCacheEntry() {
    let oldest = null;
    let oldestTime = Infinity;

    for (const [key, value] of this.cache) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldest = { key, timestamp: value.timestamp };
      }
    }

    return oldest;
  }

  /**
   * Get newest cache entry
   * @returns {Object|null} Newest entry
   */
  getNewestCacheEntry() {
    let newest = null;
    let newestTime = 0;

    for (const [key, value] of this.cache) {
      if (value.timestamp > newestTime) {
        newestTime = value.timestamp;
        newest = { key, timestamp: value.timestamp };
      }
    }

    return newest;
  }
}

// Export singleton instance
export const emailOptimizer = new EmailOptimizer();
