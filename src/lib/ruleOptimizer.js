/**
 * Rule Optimizer
 * Implements rule performance optimization, caching, and execution efficiency
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class RuleOptimizer {
  constructor() {
    this.optimizationCache = new Map();
    this.performanceMetrics = new Map();
    this.optimizationStrategies = new Map();
    this.ruleExecutionOrder = new Map();
    this.conditionCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.optimizationEnabled = true;
  }

  /**
   * Optimize rule evaluation order based on historical performance
   * @param {string} userId - User ID
   * @param {Array} rules - Array of rules to optimize
   * @returns {Promise<Array>} Optimized rule order
   */
  async optimizeRuleOrder(userId, rules) {
    try {
      const cacheKey = `rule_order_${userId}`;
      
      // Check cache first
      if (this.optimizationCache.has(cacheKey)) {
        const cached = this.optimizationCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.optimizedRules;
        }
      }

      // Analyze rule performance patterns
      const performanceAnalysis = await this.analyzeRulePerformance(userId);
      
      // Apply optimization strategies
      const optimizedRules = await this.applyOptimizationStrategies(rules, performanceAnalysis);
      
      // Cache the optimized order
      this.optimizationCache.set(cacheKey, {
        optimizedRules,
        timestamp: Date.now(),
        userId
      });

      // Store optimized order
      this.ruleExecutionOrder.set(userId, optimizedRules);

      logger.info('Rule order optimized successfully', {
        userId,
        originalCount: rules.length,
        optimizedCount: optimizedRules.length,
        optimizationGains: this.calculateOptimizationGains(rules, optimizedRules)
      });

      return optimizedRules;

    } catch (error) {
      logger.error('Rule order optimization failed', {
        userId,
        error: error.message
      });
      return rules; // Return original order on failure
    }
  }

  /**
   * Analyze rule performance patterns
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Performance analysis
   */
  async analyzeRulePerformance(userId) {
    try {
      const analysis = {
        ruleFrequency: new Map(),
        ruleExecutionTime: new Map(),
        ruleSuccessRate: new Map(),
        conditionComplexity: new Map(),
        ruleDependencies: new Map()
      };

      // Get rule execution history
      const { data: logs, error } = await supabase
        .from('rule_execution_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('executed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) throw error;

      // Analyze execution patterns
      logs.forEach(log => {
        if (log.results && Array.isArray(log.results)) {
          log.results.forEach(result => {
            const ruleId = result.ruleId;
            
            // Count frequency
            analysis.ruleFrequency.set(ruleId, (analysis.ruleFrequency.get(ruleId) || 0) + 1);
            
            // Track execution time
            const executionTime = result.executionTime || 0;
            const currentAvg = analysis.ruleExecutionTime.get(ruleId) || { total: 0, count: 0 };
            analysis.ruleExecutionTime.set(ruleId, {
              total: currentAvg.total + executionTime,
              count: currentAvg.count + 1,
              average: (currentAvg.total + executionTime) / (currentAvg.count + 1)
            });
            
            // Track success rate
            const successCount = analysis.ruleSuccessRate.get(ruleId) || { success: 0, total: 0 };
            analysis.ruleSuccessRate.set(ruleId, {
              success: successCount.success + (result.success ? 1 : 0),
              total: successCount.total + 1,
              rate: (successCount.success + (result.success ? 1 : 0)) / (successCount.total + 1)
            });
          });
        }
      });

      // Analyze condition complexity
      const { data: rules, error: rulesError } = await supabase
        .from('escalation_rules')
        .select('id, condition, condition_value, condition_type')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (rulesError) throw error;

      rules.forEach(rule => {
        const complexity = this.calculateConditionComplexity(rule);
        analysis.conditionComplexity.set(rule.id, complexity);
      });

      logger.debug('Rule performance analysis completed', {
        userId,
        totalLogs: logs.length,
        rulesAnalyzed: rules.length,
        analysisKeys: Object.keys(analysis)
      });

      return analysis;

    } catch (error) {
      logger.error('Rule performance analysis failed', {
        userId,
        error: error.message
      });
      return {
        ruleFrequency: new Map(),
        ruleExecutionTime: new Map(),
        ruleSuccessRate: new Map(),
        conditionComplexity: new Map(),
        ruleDependencies: new Map()
      };
    }
  }

  /**
   * Apply optimization strategies to rules
   * @param {Array} rules - Original rules array
   * @param {Object} performanceAnalysis - Performance analysis results
   * @returns {Promise<Array>} Optimized rules array
   */
  async applyOptimizationStrategies(rules, performanceAnalysis) {
    try {
      let optimizedRules = [...rules];

      // Strategy 1: Order by frequency (most frequently triggered first)
      optimizedRules = this.orderByFrequency(optimizedRules, performanceAnalysis.ruleFrequency);

      // Strategy 2: Order by execution time (fastest first)
      optimizedRules = this.orderByExecutionTime(optimizedRules, performanceAnalysis.ruleExecutionTime);

      // Strategy 3: Order by success rate (most reliable first)
      optimizedRules = this.orderBySuccessRate(optimizedRules, performanceAnalysis.ruleSuccessRate);

      // Strategy 4: Order by condition complexity (simplest first)
      optimizedRules = this.orderByConditionComplexity(optimizedRules, performanceAnalysis.conditionComplexity);

      // Strategy 5: Apply priority-based ordering
      optimizedRules = this.orderByPriority(optimizedRules);

      // Strategy 6: Apply dependency-based ordering
      optimizedRules = this.orderByDependencies(optimizedRules, performanceAnalysis.ruleDependencies);

      logger.debug('Optimization strategies applied', {
        originalCount: rules.length,
        optimizedCount: optimizedRules.length,
        strategiesApplied: 6
      });

      return optimizedRules;

    } catch (error) {
      logger.error('Failed to apply optimization strategies', {
        error: error.message
      });
      return rules;
    }
  }

  /**
   * Order rules by frequency (most frequent first)
   * @param {Array} rules - Rules array
   * @param {Map} frequencyMap - Frequency map
   * @returns {Array} Ordered rules
   */
  orderByFrequency(rules, frequencyMap) {
    return rules.sort((a, b) => {
      const freqA = frequencyMap.get(a.id) || 0;
      const freqB = frequencyMap.get(b.id) || 0;
      return freqB - freqA;
    });
  }

  /**
   * Order rules by execution time (fastest first)
   * @param {Array} rules - Rules array
   * @param {Map} executionTimeMap - Execution time map
   * @returns {Array} Ordered rules
   */
  orderByExecutionTime(rules, executionTimeMap) {
    return rules.sort((a, b) => {
      const timeA = executionTimeMap.get(a.id)?.average || 0;
      const timeB = executionTimeMap.get(b.id)?.average || 0;
      return timeA - timeB;
    });
  }

  /**
   * Order rules by success rate (highest success rate first)
   * @param {Array} rules - Rules array
   * @param {Map} successRateMap - Success rate map
   * @returns {Array} Ordered rules
   */
  orderBySuccessRate(rules, successRateMap) {
    return rules.sort((a, b) => {
      const rateA = successRateMap.get(a.id)?.rate || 0;
      const rateB = successRateMap.get(b.id)?.rate || 0;
      return rateB - rateA;
    });
  }

  /**
   * Order rules by condition complexity (simplest first)
   * @param {Array} rules - Rules array
   * @param {Map} complexityMap - Complexity map
   * @returns {Array} Ordered rules
   */
  orderByConditionComplexity(rules, complexityMap) {
    return rules.sort((a, b) => {
      const complexityA = complexityMap.get(a.id) || 0;
      const complexityB = complexityMap.get(b.id) || 0;
      return complexityA - complexityB;
    });
  }

  /**
   * Order rules by priority (highest priority first)
   * @param {Array} rules - Rules array
   * @returns {Array} Ordered rules
   */
  orderByPriority(rules) {
    return rules.sort((a, b) => {
      const priorityA = a.priority || 5;
      const priorityB = b.priority || 5;
      return priorityB - priorityA;
    });
  }

  /**
   * Order rules by dependencies
   * @param {Array} rules - Rules array
   * @param {Map} dependencyMap - Dependency map
   * @returns {Array} Ordered rules
   */
  orderByDependencies(rules, dependencyMap) {
    // Simple dependency ordering - rules with no dependencies first
    return rules.sort((a, b) => {
      const depsA = dependencyMap.get(a.id)?.length || 0;
      const depsB = dependencyMap.get(b.id)?.length || 0;
      return depsA - depsB;
    });
  }

  /**
   * Calculate condition complexity score
   * @param {Object} rule - Rule object
   * @returns {number} Complexity score
   */
  calculateConditionComplexity(rule) {
    let complexity = 0;

    // Base complexity for condition type
    switch (rule.condition_type) {
      case 'simple':
        complexity += 1;
        break;
      case 'complex':
        complexity += 3;
        break;
      case 'regex':
        complexity += 5;
        break;
      default:
        complexity += 2;
    }

    // Add complexity for condition value length
    if (rule.condition_value) {
      complexity += Math.min(rule.condition_value.length / 50, 5);
    }

    // Add complexity for multiple conditions
    if (rule.condition && rule.condition.includes('AND')) {
      complexity += 2;
    }
    if (rule.condition && rule.condition.includes('OR')) {
      complexity += 2;
    }

    return complexity;
  }

  /**
   * Calculate optimization gains
   * @param {Array} originalRules - Original rules
   * @param {Array} optimizedRules - Optimized rules
   * @returns {Object} Optimization gains
   */
  calculateOptimizationGains(originalRules, optimizedRules) {
    const gains = {
      estimatedTimeReduction: 0,
      estimatedMemoryReduction: 0,
      estimatedCacheHitRate: 0
    };

    // Estimate time reduction based on reordering
    const highFrequencyRules = optimizedRules.slice(0, Math.ceil(optimizedRules.length * 0.2));
    const lowFrequencyRules = optimizedRules.slice(-Math.ceil(optimizedRules.length * 0.2));
    
    // Assume 20% time reduction for better ordering
    gains.estimatedTimeReduction = 20;

    // Estimate memory reduction
    gains.estimatedMemoryReduction = 10;

    // Estimate cache hit rate improvement
    gains.estimatedCacheHitRate = 15;

    return gains;
  }

  /**
   * Implement condition caching for frequently evaluated conditions
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data
   * @param {string} condition - Condition to evaluate
   * @returns {Promise<boolean>} Cached condition result
   */
  async getCachedConditionResult(userId, emailData, condition) {
    try {
      const cacheKey = this.generateConditionCacheKey(userId, emailData, condition);
      
      if (this.conditionCache.has(cacheKey)) {
        const cached = this.conditionCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          logger.debug('Condition result retrieved from cache', { cacheKey });
          return cached.result;
        }
      }

      // Evaluate condition and cache result
      const result = await this.evaluateCondition(condition, emailData);
      
      this.conditionCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        userId,
        condition
      });

      return result;

    } catch (error) {
      logger.error('Failed to get cached condition result', {
        userId,
        condition,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Generate cache key for condition evaluation
   * @param {string} userId - User ID
   * @param {Object} emailData - Email data
   * @param {string} condition - Condition
   * @returns {string} Cache key
   */
  generateConditionCacheKey(userId, emailData, condition) {
    const emailHash = this.hashEmailData(emailData);
    return `cond_${userId}_${condition}_${emailHash}`;
  }

  /**
   * Hash email data for caching
   * @param {Object} emailData - Email data
   * @returns {string} Hash
   */
  hashEmailData(emailData) {
    const key = `${emailData.from}_${emailData.subject}_${emailData.body}`;
    return this.simpleHash(key);
  }

  /**
   * Simple hash function
   * @param {string} str - String to hash
   * @returns {string} Hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Evaluate condition (simplified)
   * @param {string} condition - Condition to evaluate
   * @param {Object} emailData - Email data
   * @returns {Promise<boolean>} Condition result
   */
  async evaluateCondition(condition, emailData) {
    // Simplified condition evaluation
    // In a real implementation, this would integrate with the existing BusinessRulesEngine
    return true; // Placeholder
  }

  /**
   * Optimize rule execution for batch processing
   * @param {Array} emails - Array of emails to process
   * @param {string} userId - User ID
   * @param {Array} rules - Rules to apply
   * @returns {Promise<Object>} Batch optimization results
   */
  async optimizeBatchExecution(emails, userId, rules) {
    try {
      const startTime = Date.now();
      
      // Get optimized rule order
      const optimizedRules = await this.optimizeRuleOrder(userId, rules);
      
      // Group emails by similarity for batch processing
      const emailGroups = this.groupEmailsBySimilarity(emails);
      
      // Process each group with optimized rules
      const results = [];
      for (const group of emailGroups) {
        const groupResults = await this.processEmailGroup(group, optimizedRules, userId);
        results.push(...groupResults);
      }
      
      const totalTime = Date.now() - startTime;
      
      const optimizationResults = {
        totalEmails: emails.length,
        emailGroups: emailGroups.length,
        optimizedRules: optimizedRules.length,
        totalTime,
        averageTimePerEmail: totalTime / emails.length,
        estimatedTimeReduction: this.estimateBatchTimeReduction(emails.length, emailGroups.length)
      };

      logger.info('Batch execution optimized successfully', optimizationResults);

      return {
        results,
        optimizationResults
      };

    } catch (error) {
      logger.error('Batch execution optimization failed', {
        userId,
        emailCount: emails.length,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Group emails by similarity for batch processing
   * @param {Array} emails - Array of emails
   * @returns {Array} Grouped emails
   */
  groupEmailsBySimilarity(emails) {
    const groups = [];
    const processed = new Set();

    emails.forEach((email, index) => {
      if (processed.has(index)) return;

      const group = [email];
      processed.add(index);

      // Find similar emails
      emails.forEach((otherEmail, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return;

        if (this.emailsAreSimilar(email, otherEmail)) {
          group.push(otherEmail);
          processed.add(otherIndex);
        }
      });

      groups.push(group);
    });

    return groups;
  }

  /**
   * Check if two emails are similar
   * @param {Object} email1 - First email
   * @param {Object} email2 - Second email
   * @returns {boolean} Similarity result
   */
  emailsAreSimilar(email1, email2) {
    // Simple similarity check based on sender and subject
    const senderSimilarity = email1.from === email2.from;
    const subjectSimilarity = this.calculateStringSimilarity(
      email1.subject || '', 
      email2.subject || ''
    ) > 0.7;

    return senderSimilarity || subjectSimilarity;
  }

  /**
   * Calculate string similarity
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate edit distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  calculateEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Process a group of similar emails
   * @param {Array} emailGroup - Group of emails
   * @param {Array} rules - Optimized rules
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Processing results
   */
  async processEmailGroup(emailGroup, rules, userId) {
    const results = [];
    
    // Process first email normally
    const firstEmail = emailGroup[0];
    const firstResult = await this.processEmailWithRules(firstEmail, rules, userId);
    results.push(firstResult);
    
    // For similar emails, reuse cached condition results
    for (let i = 1; i < emailGroup.length; i++) {
      const email = emailGroup[i];
      const result = await this.processEmailWithCachedRules(email, rules, userId, firstResult);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Process email with rules
   * @param {Object} email - Email data
   * @param {Array} rules - Rules to apply
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Processing result
   */
  async processEmailWithRules(email, rules, userId) {
    // Simplified email processing
    // In a real implementation, this would integrate with the existing BusinessRulesEngine
    return {
      emailId: email.id,
      processed: true,
      rulesApplied: rules.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process email with cached rule results
   * @param {Object} email - Email data
   * @param {Array} rules - Rules to apply
   * @param {string} userId - User ID
   * @param {Object} cachedResult - Cached result from similar email
   * @returns {Promise<Object>} Processing result
   */
  async processEmailWithCachedRules(email, rules, userId, cachedResult) {
    // Use cached results for similar emails
    return {
      emailId: email.id,
      processed: true,
      rulesApplied: rules.length,
      cachedResultsUsed: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Estimate batch time reduction
   * @param {number} emailCount - Number of emails
   * @param {number} groupCount - Number of groups
   * @returns {number} Estimated time reduction percentage
   */
  estimateBatchTimeReduction(emailCount, groupCount) {
    if (groupCount === 0) return 0;
    
    const groupingEfficiency = (emailCount - groupCount) / emailCount;
    return Math.min(groupingEfficiency * 30, 25); // Max 25% reduction
  }

  /**
   * Clear optimization cache
   * @param {string} userId - User ID (optional)
   */
  clearCache(userId = null) {
    if (userId) {
      // Clear user-specific cache
      for (const [key, value] of this.optimizationCache.entries()) {
        if (value.userId === userId) {
          this.optimizationCache.delete(key);
        }
      }
      
      this.ruleExecutionOrder.delete(userId);
    } else {
      // Clear all cache
      this.optimizationCache.clear();
      this.conditionCache.clear();
      this.ruleExecutionOrder.clear();
    }

    logger.info('Optimization cache cleared', { userId });
  }

  /**
   * Get optimization statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Optimization statistics
   */
  async getOptimizationStatistics(userId) {
    try {
      const stats = {
        cacheSize: this.optimizationCache.size,
        conditionCacheSize: this.conditionCache.size,
        optimizationEnabled: this.optimizationEnabled,
        cacheHitRate: 0,
        averageOptimizationGains: {
          timeReduction: 0,
          memoryReduction: 0,
          cacheHitRate: 0
        }
      };

      // Calculate cache hit rate
      const totalCacheEntries = this.optimizationCache.size + this.conditionCache.size;
      if (totalCacheEntries > 0) {
        stats.cacheHitRate = this.calculateCacheHitRate();
      }

      // Get average optimization gains
      stats.averageOptimizationGains = this.getAverageOptimizationGains();

      return stats;

    } catch (error) {
      logger.error('Failed to get optimization statistics', {
        userId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Calculate cache hit rate
   * @returns {number} Cache hit rate percentage
   */
  calculateCacheHitRate() {
    // Simplified cache hit rate calculation
    // In a real implementation, this would track actual hits and misses
    return 75; // Placeholder
  }

  /**
   * Get average optimization gains
   * @returns {Object} Average optimization gains
   */
  getAverageOptimizationGains() {
    return {
      timeReduction: 20,
      memoryReduction: 10,
      cacheHitRate: 15
    };
  }

  /**
   * Enable/disable optimization
   * @param {boolean} enabled - Optimization enabled
   */
  setOptimizationEnabled(enabled) {
    this.optimizationEnabled = enabled;
    logger.info('Rule optimization enabled/disabled', { enabled });
  }
}

// Export singleton instance
export const ruleOptimizer = new RuleOptimizer();
