/**
 * Workflow Analytics
 * Comprehensive analytics and performance monitoring for workflow automation
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';

export class WorkflowAnalytics {
  constructor() {
    this.metrics = new Map();
    this.analyticsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.executionHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Track workflow execution
   * @param {string} workflowId - Workflow identifier
   * @param {Object} executionData - Execution data
   * @param {Object} context - Execution context
   */
  async trackWorkflowExecution(workflowId, executionData, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      const executionId = `exec_${workflowId}_${Date.now()}`;
      
      const analyticsData = {
        execution_id: executionId,
        workflow_id: workflowId,
        user_id: context.userId || null,
        execution_time_ms: executionData.executionTime || 0,
        success: executionData.success || false,
        error_message: executionData.error || null,
        nodes_executed: executionData.nodesExecuted || 0,
        total_nodes: executionData.totalNodes || 0,
        emails_processed: executionData.emailsProcessed || 0,
        responses_generated: executionData.responsesGenerated || 0,
        timestamp,
        metadata: JSON.stringify(executionData.metadata || {})
      };

      // Store in database
      const { error } = await supabase
        .from('workflow_execution_metrics')
        .insert(analyticsData);

      if (error) {
        logger.error('Failed to store workflow execution metrics', { error: error.message, workflowId });
      }

      // Update in-memory metrics
      this.updateMetrics(workflowId, analyticsData);

      // Add to execution history
      this.addToHistory(analyticsData);

      logger.debug('Workflow execution tracked', { 
        workflowId, 
        executionId, 
        success: analyticsData.success,
        executionTime: analyticsData.execution_time_ms
      });
    } catch (error) {
      logger.error('Error tracking workflow execution', { error: error.message, workflowId });
    }
  }

  /**
   * Track workflow node execution
   * @param {string} workflowId - Workflow identifier
   * @param {string} nodeId - Node identifier
   * @param {Object} nodeData - Node execution data
   * @param {Object} context - Execution context
   */
  async trackNodeExecution(workflowId, nodeId, nodeData, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      
      const nodeMetrics = {
        workflow_id: workflowId,
        node_id: nodeId,
        user_id: context.userId || null,
        execution_time_ms: nodeData.executionTime || 0,
        success: nodeData.success || false,
        error_message: nodeData.error || null,
        input_items: nodeData.inputItems || 0,
        output_items: nodeData.outputItems || 0,
        timestamp,
        node_type: nodeData.nodeType || 'unknown',
        metadata: JSON.stringify(nodeData.metadata || {})
      };

      // Store in database
      const { error } = await supabase
        .from('workflow_node_metrics')
        .insert(nodeMetrics);

      if (error) {
        logger.error('Failed to store node execution metrics', { error: error.message, workflowId, nodeId });
      }

      logger.debug('Node execution tracked', { 
        workflowId, 
        nodeId, 
        success: nodeMetrics.success,
        executionTime: nodeMetrics.execution_time_ms
      });
    } catch (error) {
      logger.error('Error tracking node execution', { error: error.message, workflowId, nodeId });
    }
  }

  /**
   * Get workflow analytics
   * @param {string} workflowId - Workflow identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Workflow analytics
   */
  async getWorkflowAnalytics(workflowId, timeRange = '24h') {
    try {
      const cacheKey = `workflow_${workflowId}_${timeRange}`;
      
      // Check cache first
      if (this.analyticsCache.has(cacheKey)) {
        const cached = this.analyticsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: executions, error } = await supabase
        .from('workflow_execution_metrics')
        .select('*')
        .eq('workflow_id', workflowId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const analytics = this.calculateWorkflowAnalytics(executions || []);
      
      // Cache the result
      this.analyticsCache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting workflow analytics', { error: error.message, workflowId });
      return this.getDefaultWorkflowAnalytics();
    }
  }

  /**
   * Get workflow performance trends
   * @param {string} workflowId - Workflow identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Performance trends
   */
  async getWorkflowTrends(workflowId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: executions, error } = await supabase
        .from('workflow_execution_metrics')
        .select('timestamp, execution_time_ms, success, emails_processed, responses_generated')
        .eq('workflow_id', workflowId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return this.calculateTrends(executions || []);
    } catch (error) {
      logger.error('Error getting workflow trends', { error: error.message, workflowId });
      return this.getDefaultTrends();
    }
  }

  /**
   * Get workflow efficiency score
   * @param {string} workflowId - Workflow identifier
   * @returns {Promise<number>} Efficiency score (0-100)
   */
  async getWorkflowEfficiencyScore(workflowId) {
    try {
      const analytics = await this.getWorkflowAnalytics(workflowId, '30d');
      
      if (analytics.totalExecutions === 0) {
        return 0;
      }

      const successRate = (analytics.successfulExecutions / analytics.totalExecutions) * 100;
      const avgExecutionTime = analytics.averageExecutionTime;
      const throughput = analytics.averageThroughput;
      
      // Calculate efficiency score based on multiple factors
      let efficiencyScore = 0;
      
      // Success rate weight: 40%
      efficiencyScore += (successRate * 0.4);
      
      // Performance weight: 30% (faster is better, max score for <500ms)
      const performanceScore = Math.max(0, 100 - (avgExecutionTime / 5));
      efficiencyScore += (performanceScore * 0.3);
      
      // Throughput weight: 30% (higher throughput is better)
      const throughputScore = Math.min(throughput * 2, 100); // Scale throughput
      efficiencyScore += (throughputScore * 0.3);
      
      return Math.round(Math.min(efficiencyScore, 100));
    } catch (error) {
      logger.error('Error calculating workflow efficiency score', { error: error.message, workflowId });
      return 0;
    }
  }

  /**
   * Get workflow bottlenecks
   * @param {string} workflowId - Workflow identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Bottleneck analysis
   */
  async getWorkflowBottlenecks(workflowId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: nodeMetrics, error } = await supabase
        .from('workflow_node_metrics')
        .select('node_id, node_type, execution_time_ms, success, timestamp')
        .eq('workflow_id', workflowId)
        .gte('timestamp', timeFilter.toISOString());

      if (error) throw error;

      return this.analyzeBottlenecks(nodeMetrics || []);
    } catch (error) {
      logger.error('Error getting workflow bottlenecks', { error: error.message, workflowId });
      return [];
    }
  }

  /**
   * Get workflow utilization metrics
   * @param {string} workflowId - Workflow identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Utilization metrics
   */
  async getWorkflowUtilization(workflowId, timeRange = '24h') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: executions, error } = await supabase
        .from('workflow_execution_metrics')
        .select('timestamp, execution_time_ms, success')
        .eq('workflow_id', workflowId)
        .gte('timestamp', timeFilter.toISOString());

      if (error) throw error;

      return this.calculateUtilization(executions || []);
    } catch (error) {
      logger.error('Error getting workflow utilization', { error: error.message, workflowId });
      return this.getDefaultUtilization();
    }
  }

  /**
   * Get workflow error analysis
   * @param {string} workflowId - Workflow identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Error analysis
   */
  async getWorkflowErrorAnalysis(workflowId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: executions, error } = await supabase
        .from('workflow_execution_metrics')
        .select('timestamp, error_message, success')
        .eq('workflow_id', workflowId)
        .gte('timestamp', timeFilter.toISOString());

      if (error) throw error;

      return this.analyzeErrors(executions || []);
    } catch (error) {
      logger.error('Error getting workflow error analysis', { error: error.message, workflowId });
      return this.getDefaultErrorAnalysis();
    }
  }

  /**
   * Get workflow throughput metrics
   * @param {string} workflowId - Workflow identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Throughput metrics
   */
  async getWorkflowThroughput(workflowId, timeRange = '24h') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: executions, error } = await supabase
        .from('workflow_execution_metrics')
        .select('timestamp, emails_processed, responses_generated, execution_time_ms')
        .eq('workflow_id', workflowId)
        .gte('timestamp', timeFilter.toISOString());

      if (error) throw error;

      return this.calculateThroughput(executions || []);
    } catch (error) {
      logger.error('Error getting workflow throughput', { error: error.message, workflowId });
      return this.getDefaultThroughput();
    }
  }

  /**
   * Update in-memory metrics
   * @param {string} workflowId - Workflow identifier
   * @param {Object} analyticsData - Analytics data
   */
  updateMetrics(workflowId, analyticsData) {
    if (!this.metrics.has(workflowId)) {
      this.metrics.set(workflowId, {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalExecutionTime: 0,
        totalEmailsProcessed: 0,
        totalResponsesGenerated: 0,
        lastExecution: null,
        executionHistory: []
      });
    }

    const metrics = this.metrics.get(workflowId);
    metrics.totalExecutions++;
    metrics.totalExecutionTime += analyticsData.execution_time_ms;
    metrics.totalEmailsProcessed += analyticsData.emails_processed;
    metrics.totalResponsesGenerated += analyticsData.responses_generated;
    metrics.lastExecution = analyticsData.timestamp;

    if (analyticsData.success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    // Keep only last 100 executions in history
    metrics.executionHistory.push({
      timestamp: analyticsData.timestamp,
      executionTime: analyticsData.execution_time_ms,
      success: analyticsData.success,
      emailsProcessed: analyticsData.emails_processed,
      responsesGenerated: analyticsData.responses_generated
    });

    if (metrics.executionHistory.length > 100) {
      metrics.executionHistory.shift();
    }

    this.metrics.set(workflowId, metrics);
  }

  /**
   * Add execution to history
   * @param {Object} analyticsData - Analytics data
   */
  addToHistory(analyticsData) {
    this.executionHistory.push(analyticsData);
    
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * Calculate workflow analytics from execution data
   * @param {Array} executions - Execution data
   * @returns {Object} Calculated analytics
   */
  calculateWorkflowAnalytics(executions) {
    if (executions.length === 0) {
      return this.getDefaultWorkflowAnalytics();
    }

    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    
    const totalExecutionTime = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0);
    const averageExecutionTime = totalExecutionTime / totalExecutions;
    
    const totalEmailsProcessed = executions.reduce((sum, e) => sum + (e.emails_processed || 0), 0);
    const totalResponsesGenerated = executions.reduce((sum, e) => sum + (e.responses_generated || 0), 0);
    
    const successRate = (successfulExecutions / totalExecutions) * 100;
    const averageThroughput = totalEmailsProcessed / totalExecutions;
    
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
      totalEmailsProcessed,
      totalResponsesGenerated,
      averageThroughput: Math.round(averageThroughput * 100) / 100,
      lastExecution: executions[0]?.timestamp || null,
      firstExecution: executions[executions.length - 1]?.timestamp || null
    };
  }

  /**
   * Calculate trends from execution data
   * @param {Array} executions - Execution data
   * @returns {Object} Calculated trends
   */
  calculateTrends(executions) {
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
      throughput: [],
      executionCount: []
    };

    Object.keys(dailyData).sort().forEach(date => {
      const dayData = dailyData[date];
      const avgExecutionTime = dayData.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / dayData.length;
      const successRate = (dayData.filter(e => e.success).length / dayData.length) * 100;
      const avgThroughput = dayData.reduce((sum, e) => sum + (e.emails_processed || 0), 0) / dayData.length;

      trends.executionTime.push({ date, value: Math.round(avgExecutionTime) });
      trends.successRate.push({ date, value: Math.round(successRate * 100) / 100 });
      trends.throughput.push({ date, value: Math.round(avgThroughput * 100) / 100 });
      trends.executionCount.push({ date, value: dayData.length });
    });

    return trends;
  }

  /**
   * Analyze bottlenecks from node metrics
   * @param {Array} nodeMetrics - Node metrics data
   * @returns {Array} Bottleneck analysis
   */
  analyzeBottlenecks(nodeMetrics) {
    const nodeGroups = {};
    
    nodeMetrics.forEach(node => {
      if (!nodeGroups[node.node_id]) {
        nodeGroups[node.node_id] = [];
      }
      nodeGroups[node.node_id].push(node);
    });

    const bottlenecks = [];
    
    Object.entries(nodeGroups).forEach(([nodeId, nodes]) => {
      const avgExecutionTime = nodes.reduce((sum, n) => sum + (n.execution_time_ms || 0), 0) / nodes.length;
      const successRate = (nodes.filter(n => n.success).length / nodes.length) * 100;
      const nodeType = nodes[0]?.node_type || 'unknown';
      
      if (avgExecutionTime > 1000 || successRate < 90) { // Thresholds for bottlenecks
        bottlenecks.push({
          nodeId,
          nodeType,
          averageExecutionTime: Math.round(avgExecutionTime),
          successRate: Math.round(successRate * 100) / 100,
          executionCount: nodes.length,
          severity: avgExecutionTime > 5000 ? 'high' : avgExecutionTime > 2000 ? 'medium' : 'low'
        });
      }
    });

    return bottlenecks.sort((a, b) => b.averageExecutionTime - a.averageExecutionTime);
  }

  /**
   * Calculate utilization metrics
   * @param {Array} executions - Execution data
   * @returns {Object} Utilization metrics
   */
  calculateUtilization(executions) {
    if (executions.length === 0) {
      return this.getDefaultUtilization();
    }

    const totalTime = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0);
    const successfulTime = executions.filter(e => e.success).reduce((sum, e) => sum + (e.execution_time_ms || 0), 0);
    
    const utilizationRate = totalTime > 0 ? (successfulTime / totalTime) * 100 : 0;
    const averageUtilization = executions.length > 0 ? utilizationRate / executions.length : 0;

    return {
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
      totalExecutionTime: totalTime,
      successfulExecutionTime: successfulTime,
      utilizationTrend: this.calculateUtilizationTrend(executions)
    };
  }

  /**
   * Analyze errors from execution data
   * @param {Array} executions - Execution data
   * @returns {Object} Error analysis
   */
  analyzeErrors(executions) {
    const failedExecutions = executions.filter(e => !e.success);
    const errorMessages = failedExecutions.map(e => e.error_message).filter(Boolean);
    
    const errorFrequency = {};
    errorMessages.forEach(error => {
      errorFrequency[error] = (errorFrequency[error] || 0) + 1;
    });

    const topErrors = Object.entries(errorFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    return {
      totalErrors: failedExecutions.length,
      errorRate: executions.length > 0 ? (failedExecutions.length / executions.length) * 100 : 0,
      topErrors,
      errorTrend: this.calculateErrorTrend(executions),
      recentErrors: failedExecutions.slice(0, 10).map(e => ({
        timestamp: e.timestamp,
        error: e.error_message
      }))
    };
  }

  /**
   * Calculate throughput metrics
   * @param {Array} executions - Execution data
   * @returns {Object} Throughput metrics
   */
  calculateThroughput(executions) {
    if (executions.length === 0) {
      return this.getDefaultThroughput();
    }

    const totalEmailsProcessed = executions.reduce((sum, e) => sum + (e.emails_processed || 0), 0);
    const totalResponsesGenerated = executions.reduce((sum, e) => sum + (e.responses_generated || 0), 0);
    const totalExecutionTime = executions.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0);
    
    const emailsPerSecond = totalExecutionTime > 0 ? (totalEmailsProcessed / totalExecutionTime) * 1000 : 0;
    const responsesPerSecond = totalExecutionTime > 0 ? (totalResponsesGenerated / totalExecutionTime) * 1000 : 0;
    
    const averageEmailsPerExecution = totalEmailsProcessed / executions.length;
    const averageResponsesPerExecution = totalResponsesGenerated / executions.length;

    return {
      totalEmailsProcessed,
      totalResponsesGenerated,
      emailsPerSecond: Math.round(emailsPerSecond * 100) / 100,
      responsesPerSecond: Math.round(responsesPerSecond * 100) / 100,
      averageEmailsPerExecution: Math.round(averageEmailsPerExecution * 100) / 100,
      averageResponsesPerExecution: Math.round(averageResponsesPerExecution * 100) / 100,
      throughputTrend: this.calculateThroughputTrend(executions)
    };
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
   * Calculate utilization trend
   * @param {Array} executions - Execution data
   * @returns {string} Trend direction
   */
  calculateUtilizationTrend(executions) {
    if (executions.length < 2) return 'stable';
    
    const recent = executions.slice(0, Math.floor(executions.length / 2));
    const older = executions.slice(Math.floor(executions.length / 2));
    
    const recentUtilization = recent.filter(e => e.success).length / recent.length;
    const olderUtilization = older.filter(e => e.success).length / older.length;
    
    const change = recentUtilization - olderUtilization;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  /**
   * Calculate error trend
   * @param {Array} executions - Execution data
   * @returns {string} Trend direction
   */
  calculateErrorTrend(executions) {
    if (executions.length < 2) return 'stable';
    
    const recent = executions.slice(0, Math.floor(executions.length / 2));
    const older = executions.slice(Math.floor(executions.length / 2));
    
    const recentErrorRate = recent.filter(e => !e.success).length / recent.length;
    const olderErrorRate = older.filter(e => !e.success).length / older.length;
    
    const change = recentErrorRate - olderErrorRate;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  /**
   * Calculate throughput trend
   * @param {Array} executions - Execution data
   * @returns {string} Trend direction
   */
  calculateThroughputTrend(executions) {
    if (executions.length < 2) return 'stable';
    
    const recent = executions.slice(0, Math.floor(executions.length / 2));
    const older = executions.slice(Math.floor(executions.length / 2));
    
    const recentThroughput = recent.reduce((sum, e) => sum + (e.emails_processed || 0), 0) / recent.length;
    const olderThroughput = older.reduce((sum, e) => sum + (e.emails_processed || 0), 0) / older.length;
    
    const change = recentThroughput - olderThroughput;
    
    if (change > 1) return 'increasing';
    if (change < -1) return 'decreasing';
    return 'stable';
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
    logger.info('Workflow analytics cache cleared');
  }

  /**
   * Get execution history
   * @returns {Array} Execution history
   */
  getExecutionHistory() {
    return this.executionHistory.slice(-100); // Return last 100 executions
  }

  // Default methods
  getDefaultWorkflowAnalytics() {
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
      totalEmailsProcessed: 0,
      totalResponsesGenerated: 0,
      averageThroughput: 0,
      lastExecution: null,
      firstExecution: null
    };
  }

  getDefaultTrends() {
    return {
      executionTime: [],
      successRate: [],
      throughput: [],
      executionCount: []
    };
  }

  getDefaultUtilization() {
    return {
      utilizationRate: 0,
      averageUtilization: 0,
      totalExecutionTime: 0,
      successfulExecutionTime: 0,
      utilizationTrend: 'stable'
    };
  }

  getDefaultErrorAnalysis() {
    return {
      totalErrors: 0,
      errorRate: 0,
      topErrors: [],
      errorTrend: 'stable',
      recentErrors: []
    };
  }

  getDefaultThroughput() {
    return {
      totalEmailsProcessed: 0,
      totalResponsesGenerated: 0,
      emailsPerSecond: 0,
      responsesPerSecond: 0,
      averageEmailsPerExecution: 0,
      averageResponsesPerExecution: 0,
      throughputTrend: 'stable'
    };
  }
}

// Export singleton instance
export const workflowAnalytics = new WorkflowAnalytics();
export default WorkflowAnalytics;
