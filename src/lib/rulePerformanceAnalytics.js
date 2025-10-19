/**
 * Rule Performance Analytics
 * Comprehensive analytics and performance monitoring for business rules
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';

export class RulePerformanceAnalytics {
  constructor() {
    this.metrics = new Map();
    this.performanceHistory = [];
    this.analyticsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Track rule execution performance
   * @param {string} ruleId - Rule identifier
   * @param {Object} executionData - Execution data
   * @param {number} executionTime - Execution time in milliseconds
   * @param {Object} context - Execution context
   */
  async trackRuleExecution(ruleId, executionData, executionTime, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      const performanceData = {
        rule_id: ruleId,
        execution_time_ms: executionTime,
        timestamp,
        context: JSON.stringify(context),
        success: executionData.success || true,
        triggered: executionData.triggered || false,
        error_message: executionData.error || null,
        email_id: executionData.emailId || null,
        user_id: context.userId || null
      };

      // Store in database
      const { error } = await supabase
        .from('rule_performance_metrics')
        .insert(performanceData);

      if (error) {
        logger.error('Failed to store rule performance metrics', { error: error.message, ruleId });
      }

      // Update in-memory metrics
      this.updateMetrics(ruleId, performanceData);

      logger.debug('Rule execution tracked', { ruleId, executionTime, success: performanceData.success });
    } catch (error) {
      logger.error('Error tracking rule execution', { error: error.message, ruleId });
    }
  }

  /**
   * Update in-memory metrics
   * @param {string} ruleId - Rule identifier
   * @param {Object} performanceData - Performance data
   */
  updateMetrics(ruleId, performanceData) {
    if (!this.metrics.has(ruleId)) {
      this.metrics.set(ruleId, {
        totalExecutions: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        successCount: 0,
        failureCount: 0,
        triggerCount: 0,
        lastExecution: null,
        performanceHistory: []
      });
    }

    const metrics = this.metrics.get(ruleId);
    metrics.totalExecutions++;
    metrics.totalExecutionTime += performanceData.execution_time_ms;
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.totalExecutions;
    metrics.lastExecution = performanceData.timestamp;

    if (performanceData.success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }

    if (performanceData.triggered) {
      metrics.triggerCount++;
    }

    // Keep only last 100 executions in history
    metrics.performanceHistory.push({
      timestamp: performanceData.timestamp,
      executionTime: performanceData.execution_time_ms,
      success: performanceData.success,
      triggered: performanceData.triggered
    });

    if (metrics.performanceHistory.length > 100) {
      metrics.performanceHistory.shift();
    }

    this.metrics.set(ruleId, metrics);
  }

  /**
   * Get rule performance metrics
   * @param {string} ruleId - Rule identifier
   * @param {string} timeRange - Time range (24h, 7d, 30d)
   * @returns {Promise<Object>} Performance metrics
   */
  async getRuleMetrics(ruleId, timeRange = '24h') {
    try {
      const cacheKey = `${ruleId}_${timeRange}`;
      
      // Check cache first
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data, error } = await supabase
        .from('rule_performance_metrics')
        .select('*')
        .eq('rule_id', ruleId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const metrics = this.calculateMetrics(data || []);
      
      // Cache the result
      this.analyticsCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });

      return metrics;
    } catch (error) {
      logger.error('Error getting rule metrics', { error: error.message, ruleId });
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get performance metrics for all rules
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} All rules metrics
   */
  async getAllRulesMetrics(userId, timeRange = '24h') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data, error } = await supabase
        .from('rule_performance_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const groupedMetrics = this.groupMetricsByRule(data || []);
      const summary = this.calculateSummaryMetrics(groupedMetrics);

      return {
        summary,
        rules: groupedMetrics,
        timeRange,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting all rules metrics', { error: error.message, userId });
      return this.getDefaultAllRulesMetrics();
    }
  }

  /**
   * Get performance trends
   * @param {string} ruleId - Rule identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Performance trends
   */
  async getPerformanceTrends(ruleId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data, error } = await supabase
        .from('rule_performance_metrics')
        .select('timestamp, execution_time_ms, success, triggered')
        .eq('rule_id', ruleId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return this.calculateTrends(data || []);
    } catch (error) {
      logger.error('Error getting performance trends', { error: error.message, ruleId });
      return this.getDefaultTrends();
    }
  }

  /**
   * Get performance benchmarks
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Performance benchmarks
   */
  async getPerformanceBenchmarks(userId) {
    try {
      const { data, error } = await supabase
        .from('rule_performance_metrics')
        .select('rule_id, execution_time_ms, success, triggered')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      return this.calculateBenchmarks(data || []);
    } catch (error) {
      logger.error('Error getting performance benchmarks', { error: error.message, userId });
      return this.getDefaultBenchmarks();
    }
  }

  /**
   * Get slow performing rules
   * @param {string} userId - User identifier
   * @param {number} threshold - Performance threshold in milliseconds
   * @returns {Promise<Array>} Slow performing rules
   */
  async getSlowPerformingRules(userId, threshold = 1000) {
    try {
      const timeFilter = this.getTimeFilter('7d');
      
      const { data, error } = await supabase
        .from('rule_performance_metrics')
        .select('rule_id, execution_time_ms, timestamp')
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString())
        .gte('execution_time_ms', threshold)
        .order('execution_time_ms', { ascending: false });

      if (error) throw error;

      return this.groupSlowRules(data || []);
    } catch (error) {
      logger.error('Error getting slow performing rules', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get rule efficiency score
   * @param {string} ruleId - Rule identifier
   * @returns {Promise<number>} Efficiency score (0-100)
   */
  async getRuleEfficiencyScore(ruleId) {
    try {
      const metrics = await this.getRuleMetrics(ruleId, '30d');
      
      if (metrics.totalExecutions === 0) {
        return 0;
      }

      const successRate = (metrics.successCount / metrics.totalExecutions) * 100;
      const triggerRate = metrics.totalExecutions > 0 ? (metrics.triggerCount / metrics.totalExecutions) * 100 : 0;
      const avgExecutionTime = metrics.averageExecutionTime;
      
      // Calculate efficiency score based on multiple factors
      let efficiencyScore = 0;
      
      // Success rate weight: 40%
      efficiencyScore += (successRate * 0.4);
      
      // Trigger rate weight: 30% (rules should trigger appropriately)
      efficiencyScore += (Math.min(triggerRate, 50) * 0.3); // Cap at 50% for trigger rate
      
      // Performance weight: 30% (faster is better, max score for <100ms)
      const performanceScore = Math.max(0, 100 - (avgExecutionTime / 10));
      efficiencyScore += (performanceScore * 0.3);
      
      return Math.round(Math.min(efficiencyScore, 100));
    } catch (error) {
      logger.error('Error calculating rule efficiency score', { error: error.message, ruleId });
      return 0;
    }
  }

  /**
   * Calculate metrics from raw data
   * @param {Array} data - Raw performance data
   * @returns {Object} Calculated metrics
   */
  calculateMetrics(data) {
    if (data.length === 0) {
      return this.getDefaultMetrics();
    }

    const totalExecutions = data.length;
    const totalExecutionTime = data.reduce((sum, item) => sum + item.execution_time_ms, 0);
    const averageExecutionTime = totalExecutionTime / totalExecutions;
    const successCount = data.filter(item => item.success).length;
    const failureCount = totalExecutions - successCount;
    const triggerCount = data.filter(item => item.triggered).length;
    
    const successRate = (successCount / totalExecutions) * 100;
    const triggerRate = (triggerCount / totalExecutions) * 100;
    
    const executionTimes = data.map(item => item.execution_time_ms);
    const minExecutionTime = Math.min(...executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    const medianExecutionTime = this.calculateMedian(executionTimes);
    
    const p95ExecutionTime = this.calculatePercentile(executionTimes, 95);
    const p99ExecutionTime = this.calculatePercentile(executionTimes, 99);

    return {
      totalExecutions,
      totalExecutionTime,
      averageExecutionTime: Math.round(averageExecutionTime),
      minExecutionTime,
      maxExecutionTime,
      medianExecutionTime: Math.round(medianExecutionTime),
      p95ExecutionTime: Math.round(p95ExecutionTime),
      p99ExecutionTime: Math.round(p99ExecutionTime),
      successCount,
      failureCount,
      triggerCount,
      successRate: Math.round(successRate * 100) / 100,
      triggerRate: Math.round(triggerRate * 100) / 100,
      lastExecution: data[0]?.timestamp || null,
      firstExecution: data[data.length - 1]?.timestamp || null
    };
  }

  /**
   * Group metrics by rule
   * @param {Array} data - Raw performance data
   * @returns {Object} Grouped metrics by rule
   */
  groupMetricsByRule(data) {
    const grouped = {};
    
    data.forEach(item => {
      if (!grouped[item.rule_id]) {
        grouped[item.rule_id] = [];
      }
      grouped[item.rule_id].push(item);
    });

    const result = {};
    Object.keys(grouped).forEach(ruleId => {
      result[ruleId] = this.calculateMetrics(grouped[ruleId]);
    });

    return result;
  }

  /**
   * Calculate summary metrics
   * @param {Object} groupedMetrics - Grouped metrics by rule
   * @returns {Object} Summary metrics
   */
  calculateSummaryMetrics(groupedMetrics) {
    const ruleIds = Object.keys(groupedMetrics);
    const totalRules = ruleIds.length;
    
    if (totalRules === 0) {
      return this.getDefaultSummaryMetrics();
    }

    const totalExecutions = ruleIds.reduce((sum, ruleId) => sum + groupedMetrics[ruleId].totalExecutions, 0);
    const totalExecutionTime = ruleIds.reduce((sum, ruleId) => sum + groupedMetrics[ruleId].totalExecutionTime, 0);
    const totalSuccesses = ruleIds.reduce((sum, ruleId) => sum + groupedMetrics[ruleId].successCount, 0);
    const totalTriggers = ruleIds.reduce((sum, ruleId) => sum + groupedMetrics[ruleId].triggerCount, 0);
    
    const averageExecutionTime = totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0;
    const overallSuccessRate = totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 0;
    const overallTriggerRate = totalExecutions > 0 ? (totalTriggers / totalExecutions) * 100 : 0;

    // Find best and worst performing rules
    const executionTimes = ruleIds.map(ruleId => groupedMetrics[ruleId].averageExecutionTime);
    const successRates = ruleIds.map(ruleId => groupedMetrics[ruleId].successRate);
    
    const fastestRule = ruleIds.reduce((best, ruleId) => 
      groupedMetrics[ruleId].averageExecutionTime < groupedMetrics[best].averageExecutionTime ? ruleId : best
    );
    
    const slowestRule = ruleIds.reduce((worst, ruleId) => 
      groupedMetrics[ruleId].averageExecutionTime > groupedMetrics[worst].averageExecutionTime ? ruleId : worst
    );

    const mostReliableRule = ruleIds.reduce((best, ruleId) => 
      groupedMetrics[ruleId].successRate > groupedMetrics[best].successRate ? ruleId : best
    );

    return {
      totalRules,
      totalExecutions,
      averageExecutionTime: Math.round(averageExecutionTime),
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      overallTriggerRate: Math.round(overallTriggerRate * 100) / 100,
      fastestRule: {
        ruleId: fastestRule,
        averageExecutionTime: groupedMetrics[fastestRule].averageExecutionTime
      },
      slowestRule: {
        ruleId: slowestRule,
        averageExecutionTime: groupedMetrics[slowestRule].averageExecutionTime
      },
      mostReliableRule: {
        ruleId: mostReliableRule,
        successRate: groupedMetrics[mostReliableRule].successRate
      }
    };
  }

  /**
   * Calculate performance trends
   * @param {Array} data - Performance data over time
   * @returns {Object} Performance trends
   */
  calculateTrends(data) {
    if (data.length === 0) {
      return this.getDefaultTrends();
    }

    // Group by day
    const dailyData = {};
    data.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(item);
    });

    const trends = {
      executionTime: [],
      successRate: [],
      triggerRate: [],
      executionCount: []
    };

    Object.keys(dailyData).sort().forEach(date => {
      const dayData = dailyData[date];
      const avgExecutionTime = dayData.reduce((sum, item) => sum + item.execution_time_ms, 0) / dayData.length;
      const successRate = (dayData.filter(item => item.success).length / dayData.length) * 100;
      const triggerRate = (dayData.filter(item => item.triggered).length / dayData.length) * 100;

      trends.executionTime.push({ date, value: Math.round(avgExecutionTime) });
      trends.successRate.push({ date, value: Math.round(successRate * 100) / 100 });
      trends.triggerRate.push({ date, value: Math.round(triggerRate * 100) / 100 });
      trends.executionCount.push({ date, value: dayData.length });
    });

    return trends;
  }

  /**
   * Calculate performance benchmarks
   * @param {Array} data - Performance data
   * @returns {Object} Performance benchmarks
   */
  calculateBenchmarks(data) {
    if (data.length === 0) {
      return this.getDefaultBenchmarks();
    }

    const executionTimes = data.map(item => item.execution_time_ms);
    const successRates = data.reduce((acc, item) => {
      if (!acc[item.rule_id]) {
        acc[item.rule_id] = { total: 0, success: 0 };
      }
      acc[item.rule_id].total++;
      if (item.success) acc[item.rule_id].success++;
      return acc;
    }, {});

    return {
      averageExecutionTime: Math.round(executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length),
      medianExecutionTime: Math.round(this.calculateMedian(executionTimes)),
      p95ExecutionTime: Math.round(this.calculatePercentile(executionTimes, 95)),
      p99ExecutionTime: Math.round(this.calculatePercentile(executionTimes, 99)),
      minExecutionTime: Math.min(...executionTimes),
      maxExecutionTime: Math.max(...executionTimes),
      overallSuccessRate: Object.values(successRates).reduce((sum, rule) => 
        sum + (rule.success / rule.total), 0) / Object.keys(successRates).length * 100,
      industryBenchmarks: {
        excellent: 100, // < 100ms
        good: 500,     // < 500ms
        acceptable: 1000, // < 1s
        poor: 2000    // > 2s
      }
    };
  }

  /**
   * Group slow rules
   * @param {Array} data - Slow rule data
   * @returns {Array} Grouped slow rules
   */
  groupSlowRules(data) {
    const grouped = {};
    
    data.forEach(item => {
      if (!grouped[item.rule_id]) {
        grouped[item.rule_id] = {
          ruleId: item.rule_id,
          occurrences: 0,
          totalTime: 0,
          averageTime: 0,
          maxTime: 0,
          lastOccurrence: null
        };
      }
      
      grouped[item.rule_id].occurrences++;
      grouped[item.rule_id].totalTime += item.execution_time_ms;
      grouped[item.rule_id].averageTime = grouped[item.rule_id].totalTime / grouped[item.rule_id].occurrences;
      grouped[item.rule_id].maxTime = Math.max(grouped[item.rule_id].maxTime, item.execution_time_ms);
      grouped[item.rule_id].lastOccurrence = item.timestamp;
    });

    return Object.values(grouped).sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * Calculate median value
   * @param {Array} values - Array of values
   * @returns {number} Median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Calculate percentile
   * @param {Array} values - Array of values
   * @param {number} percentile - Percentile to calculate
   * @returns {number} Percentile value
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get time filter for date range
   * @param {string} timeRange - Time range
   * @returns {Date} Start date
   */
  getTimeFilter(timeRange) {
    const now = new Date();
    const filters = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    return filters[timeRange] || filters['24h'];
  }

  /**
   * Clear analytics cache
   */
  clearCache() {
    this.analyticsCache.clear();
    logger.info('Analytics cache cleared');
  }

  /**
   * Get default metrics
   * @returns {Object} Default metrics
   */
  getDefaultMetrics() {
    return {
      totalExecutions: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      minExecutionTime: 0,
      maxExecutionTime: 0,
      medianExecutionTime: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      successCount: 0,
      failureCount: 0,
      triggerCount: 0,
      successRate: 0,
      triggerRate: 0,
      lastExecution: null,
      firstExecution: null
    };
  }

  /**
   * Get default all rules metrics
   * @returns {Object} Default all rules metrics
   */
  getDefaultAllRulesMetrics() {
    return {
      summary: this.getDefaultSummaryMetrics(),
      rules: {},
      timeRange: '24h',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get default summary metrics
   * @returns {Object} Default summary metrics
   */
  getDefaultSummaryMetrics() {
    return {
      totalRules: 0,
      totalExecutions: 0,
      averageExecutionTime: 0,
      overallSuccessRate: 0,
      overallTriggerRate: 0,
      fastestRule: null,
      slowestRule: null,
      mostReliableRule: null
    };
  }

  /**
   * Get default trends
   * @returns {Object} Default trends
   */
  getDefaultTrends() {
    return {
      executionTime: [],
      successRate: [],
      triggerRate: [],
      executionCount: []
    };
  }

  /**
   * Get default benchmarks
   * @returns {Object} Default benchmarks
   */
  getDefaultBenchmarks() {
    return {
      averageExecutionTime: 0,
      medianExecutionTime: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      minExecutionTime: 0,
      maxExecutionTime: 0,
      overallSuccessRate: 0,
      industryBenchmarks: {
        excellent: 100,
        good: 500,
        acceptable: 1000,
        poor: 2000
      }
    };
  }
}

// Export singleton instance
export const rulePerformanceAnalytics = new RulePerformanceAnalytics();
export default RulePerformanceAnalytics;
