/**
 * AI Model Performance Monitoring
 * Comprehensive monitoring and analytics for AI model performance
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';

export class AIModelPerformanceMonitoring {
  constructor() {
    this.metricsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.performanceThresholds = this.initializePerformanceThresholds();
    this.modelStandards = this.initializeModelStandards();
  }

  /**
   * Track AI model execution
   * @param {string} modelId - Model identifier
   * @param {Object} executionData - Execution data
   * @param {Object} context - Execution context
   */
  async trackModelExecution(modelId, executionData, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      const executionId = `ai_exec_${modelId}_${Date.now()}`;
      
      const monitoringData = {
        execution_id: executionId,
        model_id: modelId,
        user_id: context.userId || null,
        execution_time_ms: executionData.executionTime || 0,
        success: executionData.success || false,
        error_message: executionData.error || null,
        input_tokens: executionData.inputTokens || 0,
        output_tokens: executionData.outputTokens || 0,
        total_tokens: executionData.totalTokens || 0,
        cost_usd: executionData.cost || 0,
        response_quality_score: executionData.qualityScore || null,
        latency_ms: executionData.latency || 0,
        throughput_tokens_per_second: executionData.throughput || 0,
        timestamp,
        metadata: JSON.stringify(executionData.metadata || {})
      };

      // Store in database
      const { error } = await supabase
        .from('ai_model_execution_metrics')
        .insert(monitoringData);

      if (error) {
        logger.error('Failed to store AI model execution metrics', { error: error.message, modelId });
      }

      // Update in-memory metrics
      this.updateMetrics(modelId, monitoringData);

      logger.debug('AI model execution tracked', { 
        modelId, 
        executionId, 
        success: monitoringData.success,
        executionTime: monitoringData.execution_time_ms,
        cost: monitoringData.cost_usd
      });
    } catch (error) {
      logger.error('Error tracking AI model execution', { error: error.message, modelId });
    }
  }

  /**
   * Track AI model response quality
   * @param {string} modelId - Model identifier
   * @param {string} executionId - Execution identifier
   * @param {Object} qualityData - Quality assessment data
   */
  async trackResponseQuality(modelId, executionId, qualityData) {
    try {
      const qualityMetrics = {
        execution_id: executionId,
        model_id: modelId,
        relevance_score: qualityData.relevanceScore || 0,
        accuracy_score: qualityData.accuracyScore || 0,
        completeness_score: qualityData.completenessScore || 0,
        coherence_score: qualityData.coherenceScore || 0,
        overall_quality_score: qualityData.overallScore || 0,
        human_feedback: qualityData.humanFeedback || null,
        feedback_rating: qualityData.feedbackRating || null,
        timestamp: new Date().toISOString(),
        quality_metadata: JSON.stringify(qualityData.metadata || {})
      };

      const { error } = await supabase
        .from('ai_model_quality_metrics')
        .insert(qualityMetrics);

      if (error) {
        logger.error('Failed to store AI model quality metrics', { error: error.message, modelId, executionId });
      }

      logger.debug('AI model response quality tracked', { 
        modelId, 
        executionId, 
        overallScore: qualityMetrics.overall_quality_score
      });
    } catch (error) {
      logger.error('Error tracking AI model response quality', { error: error.message, modelId, executionId });
    }
  }

  /**
   * Get model performance analytics
   * @param {string} modelId - Model identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Performance analytics
   */
  async getModelPerformanceAnalytics(modelId, timeRange = '24h') {
    try {
      const cacheKey = `model_performance_${modelId}_${timeRange}`;
      
      // Check cache first
      if (this.metricsCache.has(cacheKey)) {
        const cached = this.metricsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: executions, error } = await supabase
        .from('ai_model_execution_metrics')
        .select('*')
        .eq('model_id', modelId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const analytics = this.calculatePerformanceAnalytics(executions || []);
      
      // Cache the result
      this.metricsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting model performance analytics', { error: error.message, modelId });
      return this.getDefaultPerformanceAnalytics();
    }
  }

  /**
   * Get model quality metrics
   * @param {string} modelId - Model identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Quality metrics
   */
  async getModelQualityMetrics(modelId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: qualityData, error } = await supabase
        .from('ai_model_quality_metrics')
        .select('*')
        .eq('model_id', modelId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return this.calculateQualityMetrics(qualityData || []);
    } catch (error) {
      logger.error('Error getting model quality metrics', { error: error.message, modelId });
      return this.getDefaultQualityMetrics();
    }
  }

  /**
   * Get model cost analytics
   * @param {string} modelId - Model identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Cost analytics
   */
  async getModelCostAnalytics(modelId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: executions, error } = await supabase
        .from('ai_model_execution_metrics')
        .select('cost_usd, input_tokens, output_tokens, total_tokens, timestamp')
        .eq('model_id', modelId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return this.calculateCostAnalytics(executions || []);
    } catch (error) {
      logger.error('Error getting model cost analytics', { error: error.message, modelId });
      return this.getDefaultCostAnalytics();
    }
  }

  /**
   * Get model performance trends
   * @param {string} modelId - Model identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Performance trends
   */
  async getModelPerformanceTrends(modelId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: executions, error } = await supabase
        .from('ai_model_execution_metrics')
        .select('timestamp, execution_time_ms, success, cost_usd, response_quality_score')
        .eq('model_id', modelId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return this.calculatePerformanceTrends(executions || []);
    } catch (error) {
      logger.error('Error getting model performance trends', { error: error.message, modelId });
      return this.getDefaultTrends();
    }
  }

  /**
   * Get model performance comparison
   * @param {Array} modelIds - Array of model identifiers
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Performance comparison
   */
  async getModelPerformanceComparison(modelIds, timeRange = '7d') {
    try {
      const comparison = {};
      
      for (const modelId of modelIds) {
        const analytics = await this.getModelPerformanceAnalytics(modelId, timeRange);
        const qualityMetrics = await this.getModelQualityMetrics(modelId, timeRange);
        const costAnalytics = await this.getModelCostAnalytics(modelId, timeRange);
        
        comparison[modelId] = {
          performance: analytics,
          quality: qualityMetrics,
          cost: costAnalytics,
          overallScore: this.calculateOverallModelScore(analytics, qualityMetrics, costAnalytics)
        };
      }

      return comparison;
    } catch (error) {
      logger.error('Error getting model performance comparison', { error: error.message, modelIds });
      return {};
    }
  }

  /**
   * Get model performance alerts
   * @param {string} modelId - Model identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Performance alerts
   */
  async getModelPerformanceAlerts(modelId, timeRange = '24h') {
    try {
      const analytics = await this.getModelPerformanceAnalytics(modelId, timeRange);
      const qualityMetrics = await this.getModelQualityMetrics(modelId, timeRange);
      const costAnalytics = await this.getModelCostAnalytics(modelId, timeRange);
      
      const alerts = [];

      // Performance alerts
      if (analytics.averageExecutionTime > this.performanceThresholds.maxExecutionTime) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `Average execution time (${analytics.averageExecutionTime}ms) exceeds threshold`,
          recommendation: 'Consider optimizing model configuration or switching to a faster model'
        });
      }

      if (analytics.successRate < this.performanceThresholds.minSuccessRate) {
        alerts.push({
          type: 'reliability',
          severity: 'critical',
          message: `Success rate (${analytics.successRate}%) is below threshold`,
          recommendation: 'Investigate error patterns and improve error handling'
        });
      }

      // Quality alerts
      if (qualityMetrics.averageQualityScore < this.performanceThresholds.minQualityScore) {
        alerts.push({
          type: 'quality',
          severity: 'warning',
          message: `Average quality score (${qualityMetrics.averageQualityScore}) is below threshold`,
          recommendation: 'Review model prompts and consider fine-tuning'
        });
      }

      // Cost alerts
      if (costAnalytics.averageCostPerExecution > this.performanceThresholds.maxCostPerExecution) {
        alerts.push({
          type: 'cost',
          severity: 'warning',
          message: `Average cost per execution ($${costAnalytics.averageCostPerExecution}) exceeds threshold`,
          recommendation: 'Consider optimizing prompts or switching to a more cost-effective model'
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Error getting model performance alerts', { error: error.message, modelId });
      return [];
    }
  }

  /**
   * Calculate performance analytics
   * @param {Array} executions - Execution data
   * @returns {Object} Calculated analytics
   */
  calculatePerformanceAnalytics(executions) {
    if (executions.length === 0) {
      return this.getDefaultPerformanceAnalytics();
    }

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    
    const totalExecutionTime = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0);
    const averageExecutionTime = totalExecutionTime / totalExecutions;
    
    const totalCost = executions.reduce((sum, e) => sum + (e.cost_usd || 0), 0);
    const averageCost = totalCost / totalExecutions;
    
    const totalTokens = executions.reduce((sum, e) => sum + (e.total_tokens || 0), 0);
    const averageTokens = totalTokens / totalExecutions;
    
    const totalThroughput = executions.reduce((sum, e) => sum + (e.throughput_tokens_per_second || 0), 0);
    const averageThroughput = totalThroughput / totalExecutions;
    
    const successRate = (successfulExecutions / totalExecutions) * 100;
    
    const executionTimes = executions.map(e => e.execution_time_ms || 0);
    const minExecutionTime = Math.min(...executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    const medianExecutionTime = this.calculateMedian(executionTimes);
    
    const p95ExecutionTime = this.calculatePercentile(executionTimes, 95);
    const p99ExecutionTime = this.calculatePercentile(executionTimes, 99);

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: Math.round(successRate * 100) / 100,
      averageExecutionTime: Math.round(averageExecutionTime),
      minExecutionTime,
      maxExecutionTime,
      medianExecutionTime: Math.round(medianExecutionTime),
      p95ExecutionTime: Math.round(p95ExecutionTime),
      p99ExecutionTime: Math.round(p99ExecutionTime),
      totalCost: Math.round(totalCost * 100) / 100,
      averageCost: Math.round(averageCost * 100) / 100,
      totalTokens,
      averageTokens: Math.round(averageTokens),
      averageThroughput: Math.round(averageThroughput * 100) / 100,
      lastExecution: executions[0]?.timestamp || null,
      firstExecution: executions[executions.length - 1]?.timestamp || null
    };
  }

  /**
   * Calculate quality metrics
   * @param {Array} qualityData - Quality data
   * @returns {Object} Calculated quality metrics
   */
  calculateQualityMetrics(qualityData) {
    if (qualityData.length === 0) {
      return this.getDefaultQualityMetrics();
    }

    const totalAssessments = qualityData.length;
    
    const averageRelevanceScore = qualityData.reduce((sum, q) => sum + (q.relevance_score || 0), 0) / totalAssessments;
    const averageAccuracyScore = qualityData.reduce((sum, q) => sum + (q.accuracy_score || 0), 0) / totalAssessments;
    const averageCompletenessScore = qualityData.reduce((sum, q) => sum + (q.completeness_score || 0), 0) / totalAssessments;
    const averageCoherenceScore = qualityData.reduce((sum, q) => sum + (q.coherence_score || 0), 0) / totalAssessments;
    const averageOverallScore = qualityData.reduce((sum, q) => sum + (q.overall_quality_score || 0), 0) / totalAssessments;
    
    const humanFeedbackCount = qualityData.filter(q => q.human_feedback).length;
    const positiveFeedbackCount = qualityData.filter(q => q.feedback_rating && q.feedback_rating > 3).length;
    const feedbackRate = (humanFeedbackCount / totalAssessments) * 100;
    const positiveFeedbackRate = humanFeedbackCount > 0 ? (positiveFeedbackCount / humanFeedbackCount) * 100 : 0;

    return {
      totalAssessments,
      averageRelevanceScore: Math.round(averageRelevanceScore * 100) / 100,
      averageAccuracyScore: Math.round(averageAccuracyScore * 100) / 100,
      averageCompletenessScore: Math.round(averageCompletenessScore * 100) / 100,
      averageCoherenceScore: Math.round(averageCoherenceScore * 100) / 100,
      averageOverallScore: Math.round(averageOverallScore * 100) / 100,
      humanFeedbackCount,
      feedbackRate: Math.round(feedbackRate * 100) / 100,
      positiveFeedbackRate: Math.round(positiveFeedbackRate * 100) / 100,
      lastAssessment: qualityData[0]?.timestamp || null
    };
  }

  /**
   * Calculate cost analytics
   * @param {Array} executions - Execution data
   * @returns {Object} Calculated cost analytics
   */
  calculateCostAnalytics(executions) {
    if (executions.length === 0) {
      return this.getDefaultCostAnalytics();
    }

    const totalCost = executions.reduce((sum, e) => sum + (e.cost_usd || 0), 0);
    const averageCostPerExecution = totalCost / executions.length;
    
    const totalInputTokens = executions.reduce((sum, e) => sum + (e.input_tokens || 0), 0);
    const totalOutputTokens = executions.reduce((sum, e) => sum + (e.output_tokens || 0), 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    
    const costPerInputToken = totalInputTokens > 0 ? totalCost / totalInputTokens : 0;
    const costPerOutputToken = totalOutputTokens > 0 ? totalCost / totalOutputTokens : 0;
    const costPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;
    
    const costs = executions.map(e => e.cost_usd || 0);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const medianCost = this.calculateMedian(costs);

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      averageCostPerExecution: Math.round(averageCostPerExecution * 100) / 100,
      minCost: Math.round(minCost * 100) / 100,
      maxCost: Math.round(maxCost * 100) / 100,
      medianCost: Math.round(medianCost * 100) / 100,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      costPerInputToken: Math.round(costPerInputToken * 1000000) / 1000000, // Micro-dollars per token
      costPerOutputToken: Math.round(costPerOutputToken * 1000000) / 1000000,
      costPerToken: Math.round(costPerToken * 1000000) / 1000000
    };
  }

  /**
   * Calculate performance trends
   * @param {Array} executions - Execution data
   * @returns {Object} Calculated trends
   */
  calculatePerformanceTrends(executions) {
    if (executions.length === 0) {
      return this.getDefaultTrends();
    }

    // Group by day
    const dailyData = {};
    executions.forEach(execution => {
      const date = new Date(execution.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(execution);
    });

    const trends = {
      executionTime: [],
      successRate: [],
      cost: [],
      quality: [],
      throughput: []
    };

    Object.keys(dailyData).sort().forEach(date => {
      const dayData = dailyData[date];
      const avgExecutionTime = dayData.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / dayData.length;
      const successRate = (dayData.filter(e => e.success).length / dayData.length) * 100;
      const avgCost = dayData.reduce((sum, e) => sum + (e.cost_usd || 0), 0) / dayData.length;
      const avgQuality = dayData.reduce((sum, e) => sum + (e.response_quality_score || 0), 0) / dayData.length;
      const avgThroughput = dayData.reduce((sum, e) => sum + (e.throughput_tokens_per_second || 0), 0) / dayData.length;

      trends.executionTime.push({ date, value: Math.round(avgExecutionTime) });
      trends.successRate.push({ date, value: Math.round(successRate * 100) / 100 });
      trends.cost.push({ date, value: Math.round(avgCost * 100) / 100 });
      trends.quality.push({ date, value: Math.round(avgQuality * 100) / 100 });
      trends.throughput.push({ date, value: Math.round(avgThroughput * 100) / 100 });
    });

    return trends;
  }

  /**
   * Calculate overall model score
   * @param {Object} analytics - Performance analytics
   * @param {Object} qualityMetrics - Quality metrics
   * @param {Object} costAnalytics - Cost analytics
   * @returns {number} Overall score (0-100)
   */
  calculateOverallModelScore(analytics, qualityMetrics, costAnalytics) {
    const performanceScore = Math.min(analytics.successRate, 100);
    const qualityScore = qualityMetrics.averageOverallScore || 0;
    const costScore = Math.max(0, 100 - (costAnalytics.averageCostPerExecution * 1000)); // Normalize cost
    
    return Math.round((performanceScore * 0.4 + qualityScore * 0.4 + costScore * 0.2));
  }

  /**
   * Update in-memory metrics
   * @param {string} modelId - Model identifier
   * @param {Object} monitoringData - Monitoring data
   */
  updateMetrics(modelId, monitoringData) {
    if (!this.metricsCache.has(modelId)) {
      this.metricsCache.set(modelId, {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalExecutionTime: 0,
        totalCost: 0,
        totalTokens: 0,
        lastExecution: null
      });
    }

    const metrics = this.metricsCache.get(modelId);
    metrics.totalExecutions++;
    metrics.totalExecutionTime += monitoringData.execution_time_ms;
    metrics.totalCost += monitoringData.cost_usd;
    metrics.totalTokens += monitoringData.total_tokens;
    metrics.lastExecution = monitoringData.timestamp;

    if (monitoringData.success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    this.metricsCache.set(modelId, metrics);
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
   * Initialize performance thresholds
   * @returns {Object} Performance thresholds
   */
  initializePerformanceThresholds() {
    return {
      maxExecutionTime: 5000, // 5 seconds
      minSuccessRate: 95, // 95%
      minQualityScore: 80, // 80/100
      maxCostPerExecution: 0.01, // $0.01
      minThroughput: 10 // 10 tokens per second
    };
  }

  /**
   * Initialize model standards
   * @returns {Object} Model standards
   */
  initializeModelStandards() {
    return {
      gpt4: {
        expectedExecutionTime: 2000,
        expectedSuccessRate: 98,
        expectedQualityScore: 90,
        expectedCostPerExecution: 0.005
      },
      gpt35turbo: {
        expectedExecutionTime: 1500,
        expectedSuccessRate: 95,
        expectedQualityScore: 85,
        expectedCostPerExecution: 0.002
      },
      claude: {
        expectedExecutionTime: 2500,
        expectedSuccessRate: 97,
        expectedQualityScore: 88,
        expectedCostPerExecution: 0.004
      }
    };
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
   * Clear metrics cache
   */
  clearCache() {
    this.metricsCache.clear();
    logger.info('AI model performance monitoring cache cleared');
  }

  // Default methods
  getDefaultPerformanceAnalytics() {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      minExecutionTime: 0,
      maxExecutionTime: 0,
      medianExecutionTime: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      totalCost: 0,
      averageCost: 0,
      totalTokens: 0,
      averageTokens: 0,
      averageThroughput: 0,
      lastExecution: null,
      firstExecution: null
    };
  }

  getDefaultQualityMetrics() {
    return {
      totalAssessments: 0,
      averageRelevanceScore: 0,
      averageAccuracyScore: 0,
      averageCompletenessScore: 0,
      averageCoherenceScore: 0,
      averageOverallScore: 0,
      humanFeedbackCount: 0,
      feedbackRate: 0,
      positiveFeedbackRate: 0,
      lastAssessment: null
    };
  }

  getDefaultCostAnalytics() {
    return {
      totalCost: 0,
      averageCostPerExecution: 0,
      minCost: 0,
      maxCost: 0,
      medianCost: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      costPerInputToken: 0,
      costPerOutputToken: 0,
      costPerToken: 0
    };
  }

  getDefaultTrends() {
    return {
      executionTime: [],
      successRate: [],
      cost: [],
      quality: [],
      throughput: []
    };
  }
}

// Export singleton instance
export const aiModelPerformanceMonitoring = new AIModelPerformanceMonitoring();
export default AIModelPerformanceMonitoring;
