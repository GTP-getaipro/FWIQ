/**
 * Integration Performance Optimizer
 * 
 * Handles integration performance optimization, parameter tuning,
 * and resource management for third-party integrations.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class IntegrationOptimizer {
  constructor() {
    this.performanceData = new Map();
    this.optimizationRules = new Map();
    this.resourceUsage = new Map();
    this.optimizationHistory = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize optimization system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Integration Optimizer', { userId });

      // Load performance data and optimization rules
      await this.loadPerformanceData(userId);
      await this.loadOptimizationRules(userId);
      await this.loadResourceUsage(userId);
      await this.loadOptimizationHistory(userId);

      this.isInitialized = true;
      logger.info('Integration Optimizer initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Integration Optimizer', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Optimize integration parameters
   */
  async optimizeIntegrationParams(userId, integrationType, operation, data) {
    try {
      logger.info('Optimizing integration parameters', { userId, integrationType, operation });

      const optimizationRules = this.optimizationRules.get(userId) || [];
      const relevantRules = optimizationRules.filter(rule => 
        rule.integration_type === integrationType && rule.active
      );

      if (relevantRules.length === 0) {
        return {}; // No optimization rules available
      }

      const optimizedParams = { ...data };

      for (const rule of relevantRules) {
        const optimization = await this.applyOptimizationRule(rule, optimizedParams);
        Object.assign(optimizedParams, optimization);
      }

      // Record optimization
      await this.recordOptimization(userId, integrationType, operation, optimizedParams);

      logger.info('Integration parameters optimized', { userId, integrationType });

      return optimizedParams;
    } catch (error) {
      logger.error('Failed to optimize integration parameters', { error: error.message, userId });
      return data; // Return original data on error
    }
  }

  /**
   * Optimize integration performance
   */
  async optimizeIntegrationPerformance(userId, integrationType = null) {
    try {
      logger.info('Optimizing integration performance', { userId, integrationType });

      const performanceData = this.performanceData.get(userId) || [];
      const relevantData = integrationType ? 
        performanceData.filter(data => data.integration_type === integrationType) :
        performanceData;

      if (relevantData.length === 0) {
        return { success: false, message: 'No performance data available' };
      }

      // Analyze performance patterns
      const performanceAnalysis = this.analyzePerformancePatterns(relevantData);

      // Identify optimization opportunities
      const opportunities = this.identifyOptimizationOpportunities(performanceAnalysis);

      // Apply optimizations
      const optimizationResults = await this.applyOptimizations(userId, opportunities);

      // Calculate performance gain
      const performanceGain = this.calculatePerformanceGain(optimizationResults);

      logger.info('Integration performance optimized', { 
        userId, 
        integrationType,
        performanceGain,
        optimizationsApplied: optimizationResults.length
      });

      return {
        success: true,
        performanceGain,
        optimizationResults,
        opportunities
      };
    } catch (error) {
      logger.error('Failed to optimize integration performance', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update performance data
   */
  async updatePerformanceData(userId, integrationType, result) {
    try {
      const performanceData = {
        user_id: userId,
        integration_type: integrationType,
        success: result.success,
        response_time: result.performance?.responseTime || 0,
        throughput: result.performance?.throughput || 0,
        error_rate: result.error ? 1 : 0,
        timestamp: new Date().toISOString()
      };

      // Store performance data
      const { error } = await supabase
        .from('integration_performance_data')
        .insert(performanceData);

      if (error) throw error;

      // Update in-memory performance data
      if (!this.performanceData.has(userId)) {
        this.performanceData.set(userId, []);
      }
      
      this.performanceData.get(userId).push(performanceData);

      // Keep only recent data
      const userData = this.performanceData.get(userId);
      if (userData.length > 1000) {
        userData.splice(1000);
      }

      logger.info('Performance data updated', { userId, integrationType });
    } catch (error) {
      logger.error('Failed to update performance data', { error: error.message, userId });
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(userId) {
    try {
      const performanceData = this.performanceData.get(userId) || [];
      const resourceUsage = this.resourceUsage.get(userId) || [];

      const metrics = {
        totalRequests: performanceData.length,
        avgResponseTime: this.calculateAvgResponseTime(performanceData),
        avgThroughput: this.calculateAvgThroughput(performanceData),
        errorRate: this.calculateErrorRate(performanceData),
        performanceTrends: this.analyzePerformanceTrends(performanceData),
        resourceUtilization: this.calculateResourceUtilization(resourceUsage),
        optimizationHistory: this.getOptimizationHistory(userId)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get performance metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get performance insights
   */
  async getPerformanceInsights(userId) {
    try {
      const performanceData = this.performanceData.get(userId) || [];
      const optimizationHistory = this.optimizationHistory.get(userId) || [];

      const insights = {
        performancePatterns: this.identifyPerformancePatterns(performanceData),
        optimizationEffectiveness: this.analyzeOptimizationEffectiveness(optimizationHistory),
        bottlenecks: this.identifyBottlenecks(performanceData),
        recommendations: this.generatePerformanceRecommendations(performanceData, optimizationHistory)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get performance insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply optimization rule
   */
  async applyOptimizationRule(rule, params) {
    try {
      const optimizedParams = {};

      switch (rule.optimization_type) {
        case 'timeout_optimization':
          optimizedParams.timeout = this.optimizeTimeout(rule, params);
          break;
        case 'batch_size_optimization':
          optimizedParams.batchSize = this.optimizeBatchSize(rule, params);
          break;
        case 'concurrency_optimization':
          optimizedParams.concurrency = this.optimizeConcurrency(rule, params);
          break;
        case 'caching_optimization':
          optimizedParams.cache = this.optimizeCaching(rule, params);
          break;
        case 'retry_optimization':
          optimizedParams.retry = this.optimizeRetry(rule, params);
          break;
        default:
          logger.warn('Unknown optimization type', { type: rule.optimization_type });
      }

      return optimizedParams;
    } catch (error) {
      logger.error('Failed to apply optimization rule', { error: error.message, ruleId: rule.id });
      return {};
    }
  }

  /**
   * Optimize timeout
   */
  optimizeTimeout(rule, params) {
    const currentTimeout = params.timeout || rule.parameters?.default_timeout || 5000;
    const performanceData = this.getPerformanceDataForRule(rule);
    
    if (!performanceData || performanceData.length < 5) {
      return currentTimeout;
    }

    const avgResponseTime = this.calculateAvgResponseTime(performanceData);
    const optimizedTimeout = Math.max(avgResponseTime * 2, currentTimeout * 0.8);

    return Math.min(optimizedTimeout, rule.parameters?.max_timeout || 30000);
  }

  /**
   * Optimize batch size
   */
  optimizeBatchSize(rule, params) {
    const currentBatchSize = params.batchSize || rule.parameters?.default_batch_size || 10;
    const performanceData = this.getPerformanceDataForRule(rule);
    
    if (!performanceData || performanceData.length < 5) {
      return currentBatchSize;
    }

    const avgThroughput = this.calculateAvgThroughput(performanceData);
    const optimizedBatchSize = Math.round(avgThroughput / 10); // Adjust based on throughput

    return Math.max(1, Math.min(optimizedBatchSize, rule.parameters?.max_batch_size || 100));
  }

  /**
   * Optimize concurrency
   */
  optimizeConcurrency(rule, params) {
    const currentConcurrency = params.concurrency || rule.parameters?.default_concurrency || 1;
    const performanceData = this.getPerformanceDataForRule(rule);
    
    if (!performanceData || performanceData.length < 5) {
      return currentConcurrency;
    }

    const errorRate = this.calculateErrorRate(performanceData);
    
    // Reduce concurrency if error rate is high
    if (errorRate > 0.1) {
      return Math.max(1, Math.round(currentConcurrency * 0.5));
    }

    // Increase concurrency if performance is good
    const avgResponseTime = this.calculateAvgResponseTime(performanceData);
    if (avgResponseTime < 1000) {
      return Math.min(currentConcurrency * 2, rule.parameters?.max_concurrency || 10);
    }

    return currentConcurrency;
  }

  /**
   * Optimize caching
   */
  optimizeCaching(rule, params) {
    const currentCache = params.cache || rule.parameters?.default_cache || false;
    const performanceData = this.getPerformanceDataForRule(rule);
    
    if (!performanceData || performanceData.length < 5) {
      return currentCache;
    }

    const avgResponseTime = this.calculateAvgResponseTime(performanceData);
    
    // Enable caching if response times are high
    if (avgResponseTime > 2000) {
      return true;
    }

    // Disable caching if response times are low
    if (avgResponseTime < 500) {
      return false;
    }

    return currentCache;
  }

  /**
   * Optimize retry
   */
  optimizeRetry(rule, params) {
    const currentRetry = params.retry || rule.parameters?.default_retry || { maxRetries: 3, delay: 1000 };
    const performanceData = this.getPerformanceDataForRule(rule);
    
    if (!performanceData || performanceData.length < 5) {
      return currentRetry;
    }

    const errorRate = this.calculateErrorRate(performanceData);
    
    // Increase retry attempts if error rate is high
    if (errorRate > 0.2) {
      return {
        maxRetries: Math.min(currentRetry.maxRetries * 2, rule.parameters?.max_retries || 10),
        delay: currentRetry.delay
      };
    }

    // Decrease retry attempts if error rate is low
    if (errorRate < 0.05) {
      return {
        maxRetries: Math.max(1, Math.round(currentRetry.maxRetries * 0.5)),
        delay: currentRetry.delay
      };
    }

    return currentRetry;
  }

  /**
   * Analyze performance patterns
   */
  analyzePerformancePatterns(performanceData) {
    if (performanceData.length < 5) {
      return { trend: 'insufficient_data' };
    }

    const recentData = performanceData.slice(0, 10);
    const olderData = performanceData.slice(10, 20);

    const recentAvgResponseTime = this.calculateAvgResponseTime(recentData);
    const olderAvgResponseTime = this.calculateAvgResponseTime(olderData);

    const recentAvgThroughput = this.calculateAvgThroughput(recentData);
    const olderAvgThroughput = this.calculateAvgThroughput(olderData);

    const recentErrorRate = this.calculateErrorRate(recentData);
    const olderErrorRate = this.calculateErrorRate(olderData);

    return {
      responseTimeTrend: recentAvgResponseTime < olderAvgResponseTime ? 'improving' : 'declining',
      throughputTrend: recentAvgThroughput > olderAvgThroughput ? 'improving' : 'declining',
      errorRateTrend: recentErrorRate < olderErrorRate ? 'improving' : 'declining',
      overallTrend: this.calculateOverallTrend(recentAvgResponseTime, olderAvgResponseTime, recentErrorRate, olderErrorRate)
    };
  }

  /**
   * Identify optimization opportunities
   */
  identifyOptimizationOpportunities(performanceAnalysis) {
    const opportunities = [];

    // Response time opportunities
    if (performanceAnalysis.responseTimeTrend === 'declining') {
      opportunities.push({
        type: 'response_time',
        priority: 'high',
        description: 'Response times are increasing',
        potentialImprovement: '20-30%'
      });
    }

    // Throughput opportunities
    if (performanceAnalysis.throughputTrend === 'declining') {
      opportunities.push({
        type: 'throughput',
        priority: 'medium',
        description: 'Throughput is decreasing',
        potentialImprovement: '15-25%'
      });
    }

    // Error rate opportunities
    if (performanceAnalysis.errorRateTrend === 'declining') {
      opportunities.push({
        type: 'error_rate',
        priority: 'high',
        description: 'Error rate is increasing',
        potentialImprovement: '10-20%'
      });
    }

    return opportunities;
  }

  /**
   * Apply optimizations
   */
  async applyOptimizations(userId, opportunities) {
    const results = [];

    for (const opportunity of opportunities) {
      try {
        let result;
        
        switch (opportunity.type) {
          case 'response_time':
            result = await this.optimizeResponseTime(userId);
            break;
          case 'throughput':
            result = await this.optimizeThroughput(userId);
            break;
          case 'error_rate':
            result = await this.optimizeErrorRate(userId);
            break;
          default:
            continue;
        }

        results.push({
          type: opportunity.type,
          success: result.success,
          improvement: result.improvement || 0,
          description: opportunity.description
        });
      } catch (error) {
        logger.error('Failed to apply optimization', { error: error.message, type: opportunity.type });
        results.push({
          type: opportunity.type,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Calculate performance gain
   */
  calculatePerformanceGain(optimizationResults) {
    const successfulOptimizations = optimizationResults.filter(r => r.success);
    if (successfulOptimizations.length === 0) return 0;

    const totalImprovement = successfulOptimizations.reduce((sum, r) => sum + (r.improvement || 0), 0);
    return totalImprovement / successfulOptimizations.length;
  }

  /**
   * Record optimization
   */
  async recordOptimization(userId, integrationType, operation, optimizedParams) {
    try {
      const optimizationData = {
        user_id: userId,
        integration_type: integrationType,
        operation,
        optimized_params: optimizedParams,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('integration_optimizations')
        .insert(optimizationData);

      if (error) throw error;

      // Update in-memory optimization history
      if (!this.optimizationHistory.has(userId)) {
        this.optimizationHistory.set(userId, []);
      }
      
      this.optimizationHistory.get(userId).push(optimizationData);
    } catch (error) {
      logger.error('Failed to record optimization', { error: error.message, userId });
    }
  }

  /**
   * Load performance data
   */
  async loadPerformanceData(userId) {
    try {
      const { data: performanceData, error } = await supabase
        .from('integration_performance_data')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.performanceData.set(userId, performanceData || []);
      logger.info('Performance data loaded', { userId, dataCount: performanceData?.length || 0 });
    } catch (error) {
      logger.error('Failed to load performance data', { error: error.message, userId });
    }
  }

  /**
   * Load optimization rules
   */
  async loadOptimizationRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('integration_optimization_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.optimizationRules.set(userId, rules || []);
      logger.info('Optimization rules loaded', { userId, ruleCount: rules?.length || 0 });
    } catch (error) {
      logger.error('Failed to load optimization rules', { error: error.message, userId });
    }
  }

  /**
   * Load resource usage
   */
  async loadResourceUsage(userId) {
    try {
      const { data: usage, error } = await supabase
        .from('integration_resource_usage')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.resourceUsage.set(userId, usage || []);
      logger.info('Resource usage loaded', { userId, usageCount: usage?.length || 0 });
    } catch (error) {
      logger.error('Failed to load resource usage', { error: error.message, userId });
    }
  }

  /**
   * Load optimization history
   */
  async loadOptimizationHistory(userId) {
    try {
      const { data: history, error } = await supabase
        .from('integration_optimizations')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.optimizationHistory.set(userId, history || []);
      logger.info('Optimization history loaded', { userId, historyCount: history?.length || 0 });
    } catch (error) {
      logger.error('Failed to load optimization history', { error: error.message, userId });
    }
  }

  /**
   * Reset optimizer for user
   */
  async reset(userId) {
    try {
      this.performanceData.delete(userId);
      this.optimizationRules.delete(userId);
      this.resourceUsage.delete(userId);
      this.optimizationHistory.delete(userId);

      logger.info('Optimizer reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset optimizer', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
