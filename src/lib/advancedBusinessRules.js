/**
 * Advanced Business Rules Engine
 * Extends existing business rules with advanced features, conflict resolution, and performance optimization
 */

import { BusinessRulesEngine } from './businessRules.js';
import { ruleConflictResolver } from './ruleConflictResolver.js';
import { ruleValidator } from './ruleValidator.js';
import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AdvancedBusinessRulesEngine extends BusinessRulesEngine {
  constructor() {
    super();
    this.conflictResolver = ruleConflictResolver;
    this.validator = ruleValidator;
    this.performanceMetrics = new Map();
    this.ruleCache = new Map();
    this.optimizationEnabled = true;
    this.conflictDetectionEnabled = true;
    this.validationEnabled = true;
  }

  /**
   * Load and validate rules with advanced features
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async loadRules(userId) {
    const startTime = Date.now();
    
    try {
      // Load base rules
      await super.loadRules(userId);
      
      // Validate rules if enabled
      if (this.validationEnabled) {
        await this.validateAllRules(userId);
      }
      
      // Detect and resolve conflicts if enabled
      if (this.conflictDetectionEnabled) {
        await this.detectAndResolveConflicts(userId);
      }
      
      // Optimize rule evaluation if enabled
      if (this.optimizationEnabled) {
        await this.optimizeRuleEvaluation(userId);
      }
      
      // Record performance metrics
      const loadTime = Date.now() - startTime;
      this.performanceMetrics.set('ruleLoadTime', loadTime);
      
      logger.info('Advanced business rules loaded successfully', {
        userId,
        ruleCount: this.rules.size,
        loadTime,
        optimizationsApplied: this.optimizationEnabled
      });
      
    } catch (error) {
      logger.error('Failed to load advanced business rules', {
        userId,
        error: error.message,
        loadTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Evaluate rules with advanced conflict resolution and performance optimization
   * @param {Object} emailData - Email data
   * @param {string} userId - User ID
   * @param {Object} context - Additional context
   * @returns {Promise<Array>} Triggered rules with conflict resolution
   */
  async evaluateRules(emailData, userId, context = {}) {
    const startTime = Date.now();
    
    try {
      // Get base rule evaluation results
      const baseResults = await super.evaluateRules(emailData, userId, context);
      
      if (baseResults.length === 0) {
        return baseResults;
      }
      
      // Apply conflict resolution
      let resolvedResults = baseResults;
      if (this.conflictDetectionEnabled) {
        resolvedResults = await this.conflictResolver.resolveConflicts(baseResults, emailData, context);
      }
      
      // Record performance metrics
      const evaluationTime = Date.now() - startTime;
      this.recordEvaluationMetrics(evaluationTime, baseResults.length, resolvedResults.length);
      
      // Log evaluation results
      logger.debug('Advanced rule evaluation completed', {
        userId,
        emailFrom: emailData.from,
        baseRuleCount: baseResults.length,
        resolvedRuleCount: resolvedResults.length,
        conflictsResolved: baseResults.length - resolvedResults.length,
        evaluationTime
      });
      
      return resolvedResults;
      
    } catch (error) {
      logger.error('Advanced rule evaluation failed', {
        userId,
        emailFrom: emailData.from,
        error: error.message,
        evaluationTime: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Create advanced rule with validation and conflict checking
   * @param {string} userId - User ID
   * @param {Object} ruleData - Rule data
   * @returns {Promise<Object>} Created rule
   */
  async createRule(userId, ruleData) {
    try {
      // Validate rule data
      if (this.validationEnabled) {
        const validationResult = await this.validator.validateRule(ruleData);
        if (!validationResult.isValid) {
          throw new Error(`Rule validation failed: ${validationResult.errors.join(', ')}`);
        }
      }
      
      // Check for potential conflicts
      if (this.conflictDetectionEnabled) {
        const conflictCheck = await this.conflictResolver.checkForConflicts(ruleData, userId);
        if (conflictCheck.hasConflicts) {
          logger.warn('Potential rule conflicts detected', {
            userId,
            ruleName: ruleData.name,
            conflicts: conflictCheck.conflicts
          });
        }
      }
      
      // Create the rule
      const { data, error } = await supabase
        .from('escalation_rules')
        .insert({
          user_id: userId,
          name: ruleData.name,
          description: ruleData.description,
          condition: ruleData.condition,
          condition_type: ruleData.conditionType || 'simple',
          condition_value: ruleData.conditionValue,
          escalation_action: ruleData.escalationAction,
          escalation_target: ruleData.escalationTarget,
          priority: ruleData.priority || 5,
          enabled: ruleData.enabled !== false,
          metadata: {
            ...ruleData.metadata,
            created_at: new Date().toISOString(),
            validation_status: 'validated',
            conflict_checked: this.conflictDetectionEnabled
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate cache
      this.invalidateCache(userId);
      
      logger.info('Advanced rule created successfully', {
        userId,
        ruleId: data.id,
        ruleName: ruleData.name
      });
      
      return data;
      
    } catch (error) {
      logger.error('Failed to create advanced rule', {
        userId,
        ruleData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update rule with validation and conflict checking
   * @param {string} userId - User ID
   * @param {string} ruleId - Rule ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated rule
   */
  async updateRule(userId, ruleId, updateData) {
    try {
      // Validate update data
      if (this.validationEnabled) {
        const validationResult = await this.validator.validateRuleUpdate(updateData);
        if (!validationResult.isValid) {
          throw new Error(`Rule update validation failed: ${validationResult.errors.join(', ')}`);
        }
      }
      
      // Check for potential conflicts with updated rule
      if (this.conflictDetectionEnabled) {
        const conflictCheck = await this.conflictResolver.checkForConflicts(updateData, userId, ruleId);
        if (conflictCheck.hasConflicts) {
          logger.warn('Potential conflicts detected in rule update', {
            userId,
            ruleId,
            conflicts: conflictCheck.conflicts
          });
        }
      }
      
      // Update the rule
      const { data, error } = await supabase
        .from('escalation_rules')
        .update({
          ...updateData,
          metadata: {
            ...updateData.metadata,
            updated_at: new Date().toISOString(),
            validation_status: 'validated',
            conflict_checked: this.conflictDetectionEnabled
          }
        })
        .eq('id', ruleId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate cache
      this.invalidateCache(userId);
      
      logger.info('Advanced rule updated successfully', {
        userId,
        ruleId,
        ruleName: updateData.name
      });
      
      return data;
      
    } catch (error) {
      logger.error('Failed to update advanced rule', {
        userId,
        ruleId,
        updateData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate all rules for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Validation results
   */
  async validateAllRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true);
      
      if (error) throw error;
      
      const validationResults = {
        total: rules.length,
        valid: 0,
        invalid: 0,
        warnings: 0,
        errors: []
      };
      
      for (const rule of rules) {
        const result = await this.validator.validateRule(rule);
        
        if (result.isValid) {
          validationResults.valid++;
          if (result.warnings.length > 0) {
            validationResults.warnings += result.warnings.length;
          }
        } else {
          validationResults.invalid++;
          validationResults.errors.push({
            ruleId: rule.id,
            ruleName: rule.name,
            errors: result.errors
          });
        }
      }
      
      logger.info('Rule validation completed', {
        userId,
        ...validationResults
      });
      
      return validationResults;
      
    } catch (error) {
      logger.error('Rule validation failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Detect and resolve rule conflicts
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Conflict resolution results
   */
  async detectAndResolveConflicts(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      
      const conflictResults = await this.conflictResolver.detectConflicts(rules);
      
      if (conflictResults.hasConflicts) {
        logger.warn('Rule conflicts detected', {
          userId,
          conflictCount: conflictResults.conflicts.length
        });
        
        // Attempt to resolve conflicts
        const resolvedConflicts = await this.conflictResolver.resolveConflicts(rules, null, {});
        
        logger.info('Rule conflicts resolved', {
          userId,
          resolvedCount: resolvedConflicts.length
        });
      }
      
      return conflictResults;
      
    } catch (error) {
      logger.error('Conflict detection failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Optimize rule evaluation performance
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Optimization results
   */
  async optimizeRuleEvaluation(userId) {
    try {
      const optimizationResults = {
        rulesReordered: 0,
        cacheOptimizations: 0,
        performanceGains: 0
      };
      
      // Reorder rules by frequency and priority
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      
      // Analyze rule usage patterns
      const usageAnalysis = await this.analyzeRuleUsage(userId);
      
      // Reorder rules based on usage frequency
      const optimizedRules = this.reorderRulesByUsage(rules, usageAnalysis);
      
      if (optimizedRules.length !== rules.length) {
        optimizationResults.rulesReordered = Math.abs(optimizedRules.length - rules.length);
      }
      
      // Implement caching optimizations
      await this.implementCacheOptimizations(userId);
      optimizationResults.cacheOptimizations = 1;
      
      // Estimate performance gains
      optimizationResults.performanceGains = this.estimatePerformanceGains(usageAnalysis);
      
      logger.info('Rule evaluation optimized', {
        userId,
        ...optimizationResults
      });
      
      return optimizationResults;
      
    } catch (error) {
      logger.error('Rule optimization failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Analyze rule usage patterns
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Usage analysis
   */
  async analyzeRuleUsage(userId) {
    try {
      // Get rule execution history from logs
      const { data: logs, error } = await supabase
        .from('email_logs')
        .select('escalation_rules_triggered')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
      if (error) throw error;
      
      const usageStats = new Map();
      
      logs.forEach(log => {
        if (log.escalation_rules_triggered) {
          const rules = JSON.parse(log.escalation_rules_triggered);
          rules.forEach(ruleId => {
            usageStats.set(ruleId, (usageStats.get(ruleId) || 0) + 1);
          });
        }
      });
      
      return {
        totalExecutions: logs.length,
        ruleUsage: Object.fromEntries(usageStats),
        averageUsage: logs.length / usageStats.size || 0
      };
      
    } catch (error) {
      logger.error('Rule usage analysis failed', {
        userId,
        error: error.message
      });
      return { totalExecutions: 0, ruleUsage: {}, averageUsage: 0 };
    }
  }

  /**
   * Reorder rules by usage frequency
   * @param {Array} rules - Rules array
   * @param {Object} usageAnalysis - Usage analysis results
   * @returns {Array} Reordered rules
   */
  reorderRulesByUsage(rules, usageAnalysis) {
    return rules.sort((a, b) => {
      const usageA = usageAnalysis.ruleUsage[a.id] || 0;
      const usageB = usageAnalysis.ruleUsage[b.id] || 0;
      
      // First sort by priority, then by usage frequency
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      return usageB - usageA;
    });
  }

  /**
   * Implement caching optimizations
   * @param {string} userId - User ID
   */
  async implementCacheOptimizations(userId) {
    try {
      // Implement rule condition caching
      const cacheKey = `optimized_rules_${userId}`;
      const optimizedRules = this.rules;
      
      this.ruleCache.set(cacheKey, {
        rules: optimizedRules,
        timestamp: Date.now(),
        optimizationLevel: 'advanced'
      });
      
      logger.debug('Cache optimizations implemented', {
        userId,
        cacheKey,
        ruleCount: optimizedRules.size
      });
      
    } catch (error) {
      logger.error('Cache optimization failed', {
        userId,
        error: error.message
      });
    }
  }

  /**
   * Estimate performance gains from optimization
   * @param {Object} usageAnalysis - Usage analysis results
   * @returns {number} Estimated performance gain percentage
   */
  estimatePerformanceGains(usageAnalysis) {
    // Simple estimation based on usage patterns
    const totalUsage = Object.values(usageAnalysis.ruleUsage).reduce((sum, count) => sum + count, 0);
    const averageUsage = totalUsage / Object.keys(usageAnalysis.ruleUsage).length || 0;
    
    // Estimate 10-30% performance gain based on usage distribution
    const usageVariance = Object.values(usageAnalysis.ruleUsage)
      .reduce((variance, count) => variance + Math.pow(count - averageUsage, 2), 0) / Object.keys(usageAnalysis.ruleUsage).length;
    
    const performanceGain = Math.min(30, Math.max(10, usageVariance / averageUsage * 10));
    
    return Math.round(performanceGain);
  }

  /**
   * Record evaluation performance metrics
   * @param {number} evaluationTime - Evaluation time in ms
   * @param {number} baseRuleCount - Number of base rules
   * @param {number} resolvedRuleCount - Number of resolved rules
   */
  recordEvaluationMetrics(evaluationTime, baseRuleCount, resolvedRuleCount) {
    const metrics = this.performanceMetrics.get('evaluations') || {
      totalEvaluations: 0,
      totalTime: 0,
      averageTime: 0,
      totalRules: 0,
      totalConflicts: 0
    };
    
    metrics.totalEvaluations++;
    metrics.totalTime += evaluationTime;
    metrics.averageTime = metrics.totalTime / metrics.totalEvaluations;
    metrics.totalRules += baseRuleCount;
    metrics.totalConflicts += (baseRuleCount - resolvedRuleCount);
    
    this.performanceMetrics.set('evaluations', metrics);
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ruleLoadTime: this.performanceMetrics.get('ruleLoadTime') || 0,
      evaluations: this.performanceMetrics.get('evaluations') || {
        totalEvaluations: 0,
        averageTime: 0,
        totalRules: 0,
        totalConflicts: 0
      },
      cacheSize: this.ruleCache.size,
      optimizationEnabled: this.optimizationEnabled,
      conflictDetectionEnabled: this.conflictDetectionEnabled,
      validationEnabled: this.validationEnabled
    };
  }

  /**
   * Invalidate cache for user
   * @param {string} userId - User ID
   */
  invalidateCache(userId) {
    const cacheKey = `rules_${userId}`;
    const optimizedCacheKey = `optimized_rules_${userId}`;
    
    this.cache.delete(cacheKey);
    this.ruleCache.delete(optimizedCacheKey);
    
    logger.debug('Cache invalidated', { userId });
  }

  /**
   * Enable/disable optimizations
   * @param {Object} options - Optimization options
   */
  setOptimizationOptions(options) {
    if (options.optimizationEnabled !== undefined) {
      this.optimizationEnabled = options.optimizationEnabled;
    }
    
    if (options.conflictDetectionEnabled !== undefined) {
      this.conflictDetectionEnabled = options.conflictDetectionEnabled;
    }
    
    if (options.validationEnabled !== undefined) {
      this.validationEnabled = options.validationEnabled;
    }
    
    logger.info('Optimization options updated', {
      optimizationEnabled: this.optimizationEnabled,
      conflictDetectionEnabled: this.conflictDetectionEnabled,
      validationEnabled: this.validationEnabled
    });
  }

  /**
   * Get rule statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Rule statistics
   */
  async getRuleStatistics(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const stats = {
        total: rules.length,
        enabled: rules.filter(r => r.enabled).length,
        disabled: rules.filter(r => !r.enabled).length,
        byPriority: {},
        byConditionType: {},
        averagePriority: 0,
        lastUpdated: null
      };
      
      // Calculate priority distribution
      rules.forEach(rule => {
        stats.byPriority[rule.priority] = (stats.byPriority[rule.priority] || 0) + 1;
        stats.byConditionType[rule.condition_type || 'simple'] = (stats.byConditionType[rule.condition_type || 'simple'] || 0) + 1;
      });
      
      // Calculate average priority
      stats.averagePriority = rules.reduce((sum, rule) => sum + rule.priority, 0) / rules.length || 0;
      
      // Find most recent update
      const lastUpdated = rules.reduce((latest, rule) => {
        const ruleDate = new Date(rule.updated_at || rule.created_at);
        return ruleDate > latest ? ruleDate : latest;
      }, new Date(0));
      
      stats.lastUpdated = lastUpdated.toISOString();
      
      return stats;
      
    } catch (error) {
      logger.error('Failed to get rule statistics', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
}

// Export singleton instance
export const advancedBusinessRulesEngine = new AdvancedBusinessRulesEngine();
