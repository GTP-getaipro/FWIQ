import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class IntegrationMetrics {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Records integration metrics
   * @param {string} integrationId - The ID of the integration
   * @param {Object} metrics - Metrics data
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object|null>} The inserted data or null if error
   */
  async recordIntegrationMetrics(integrationId, metrics = {}, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('integration_metrics')
        .insert({
          user_id: this.userId,
          integration_id: integrationId,
          total_operations: metrics.totalOperations || 0,
          successful_operations: metrics.successfulOperations || 0,
          failed_operations: metrics.failedOperations || 0,
          total_duration_ms: metrics.totalDuration || 0,
          average_duration_ms: metrics.averageDuration || 0,
          total_data_size_bytes: metrics.totalDataSize || 0,
          total_records_processed: metrics.totalRecordsProcessed || 0,
          total_api_calls: metrics.totalApiCalls || 0,
          total_cost: metrics.totalCost || 0,
          health_score: metrics.healthScore || 0,
          error_rate: metrics.errorRate || 0,
          success_rate: metrics.successRate || 0,
          throughput: metrics.throughput || 0,
          metadata: metadata,
        })
        .select()
        .single();

      if (error) throw error;
      logger.info(`Integration metrics recorded for ${integrationId}`, { userId: this.userId, integrationId });
      return data;
    } catch (error) {
      logger.error(`Error recording integration metrics for ${integrationId}:`, { error: error.message, userId: this.userId });
      return null;
    }
  }

  /**
   * Gets comprehensive integration metrics dashboard data
   * @param {string} timeFilter - '24h', '7d', '30d', '90d'
   * @param {string} [integrationId] - Optional: Filter by specific integration
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getIntegrationDashboardMetrics(timeFilter = '7d', integrationId = null) {
    try {
      const dateFilter = this._getDateFilter(timeFilter);
      let query = supabase
        .from('integration_metrics')
        .select('*')
        .eq('user_id', this.userId)
        .gte('created_at', dateFilter.toISOString());

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data: metrics, error } = await query;

      if (error) throw error;

      const dashboard = {
        summary: {
          totalIntegrations: 0,
          totalOperations: 0,
          totalCost: 0,
          averageHealthScore: 0,
          averageSuccessRate: 0,
          totalDataProcessed: 0
        },
        integrations: {},
        trends: {
          operations: [],
          costs: [],
          health: [],
          successRate: []
        },
        alerts: [],
        recommendations: []
      };

      // Process metrics data
      const integrationData = {};
      metrics.forEach(metric => {
        if (!integrationData[metric.integration_id]) {
          integrationData[metric.integration_id] = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            totalDuration: 0,
            totalDataSize: 0,
            totalCost: 0,
            healthScores: [],
            successRates: [],
            errorRates: [],
            throughputs: [],
            lastUpdated: metric.created_at
          };
        }

        const integration = integrationData[metric.integration_id];
        integration.totalOperations += metric.total_operations;
        integration.successfulOperations += metric.successful_operations;
        integration.failedOperations += metric.failed_operations;
        integration.totalDuration += metric.total_duration_ms;
        integration.totalDataSize += metric.total_data_size_bytes;
        integration.totalCost += metric.total_cost;
        integration.healthScores.push(metric.health_score);
        integration.successRates.push(metric.success_rate);
        integration.errorRates.push(metric.error_rate);
        integration.throughputs.push(metric.throughput);
        integration.lastUpdated = metric.created_at;
      });

      // Calculate summary metrics
      dashboard.summary.totalIntegrations = Object.keys(integrationData).length;
      dashboard.summary.totalOperations = Object.values(integrationData).reduce((sum, i) => sum + i.totalOperations, 0);
      dashboard.summary.totalCost = Object.values(integrationData).reduce((sum, i) => sum + i.totalCost, 0);
      dashboard.summary.totalDataProcessed = Object.values(integrationData).reduce((sum, i) => sum + i.totalDataSize, 0);

      const allHealthScores = Object.values(integrationData).flatMap(i => i.healthScores);
      const allSuccessRates = Object.values(integrationData).flatMap(i => i.successRates);

      dashboard.summary.averageHealthScore = allHealthScores.length > 0 
        ? allHealthScores.reduce((sum, score) => sum + score, 0) / allHealthScores.length 
        : 0;
      dashboard.summary.averageSuccessRate = allSuccessRates.length > 0 
        ? allSuccessRates.reduce((sum, rate) => sum + rate, 0) / allSuccessRates.length 
        : 0;

      // Process individual integration metrics
      Object.keys(integrationData).forEach(id => {
        const integration = integrationData[id];
        dashboard.integrations[id] = {
          totalOperations: integration.totalOperations,
          successRate: integration.successfulOperations > 0 
            ? (integration.successfulOperations / integration.totalOperations) * 100 
            : 0,
          averageHealthScore: integration.healthScores.length > 0 
            ? integration.healthScores.reduce((sum, score) => sum + score, 0) / integration.healthScores.length 
            : 0,
          averageSuccessRate: integration.successRates.length > 0 
            ? integration.successRates.reduce((sum, rate) => sum + rate, 0) / integration.successRates.length 
            : 0,
          averageErrorRate: integration.errorRates.length > 0 
            ? integration.errorRates.reduce((sum, rate) => sum + rate, 0) / integration.errorRates.length 
            : 0,
          averageThroughput: integration.throughputs.length > 0 
            ? integration.throughputs.reduce((sum, t) => sum + t, 0) / integration.throughputs.length 
            : 0,
          totalCost: integration.totalCost,
          totalDataSize: integration.totalDataSize,
          lastUpdated: integration.lastUpdated,
          status: this._getIntegrationStatus(integration)
        };
      });

      // Generate alerts
      dashboard.alerts = this._generateAlerts(dashboard.integrations);

      // Generate recommendations
      dashboard.recommendations = this._generateRecommendations(dashboard.integrations);

      logger.info('Integration dashboard metrics fetched', { userId: this.userId, timeFilter, integrationId });
      return dashboard;
    } catch (error) {
      logger.error('Error fetching integration dashboard metrics:', { error: error.message, userId: this.userId });
      return {
        summary: {},
        integrations: {},
        trends: { operations: [], costs: [], health: [], successRate: [] },
        alerts: [],
        recommendations: []
      };
    }
  }

  /**
   * Gets integration performance comparison
   * @param {Array<string>} integrationIds - Array of integration IDs to compare
   * @param {string} timeFilter - Time period for comparison
   * @returns {Promise<Object>} Performance comparison data
   */
  async getIntegrationPerformanceComparison(integrationIds, timeFilter = '7d') {
    try {
      const comparison = {
        integrations: {},
        metrics: {
          performance: {},
          cost: {},
          reliability: {},
          efficiency: {}
        },
        rankings: {},
        insights: []
      };

      for (const integrationId of integrationIds) {
        const dashboard = await this.getIntegrationDashboardMetrics(timeFilter, integrationId);
        if (dashboard.integrations[integrationId]) {
          comparison.integrations[integrationId] = dashboard.integrations[integrationId];
        }
      }

      // Calculate comparative metrics
      const integrations = Object.keys(comparison.integrations);
      if (integrations.length > 0) {
        // Performance metrics
        comparison.metrics.performance.averageSuccessRate = integrations.reduce((sum, id) => 
          sum + comparison.integrations[id].averageSuccessRate, 0) / integrations.length;
        comparison.metrics.performance.averageThroughput = integrations.reduce((sum, id) => 
          sum + comparison.integrations[id].averageThroughput, 0) / integrations.length;

        // Cost metrics
        comparison.metrics.cost.averageCost = integrations.reduce((sum, id) => 
          sum + comparison.integrations[id].totalCost, 0) / integrations.length;
        comparison.metrics.cost.totalCost = integrations.reduce((sum, id) => 
          sum + comparison.integrations[id].totalCost, 0);

        // Reliability metrics
        comparison.metrics.reliability.averageHealthScore = integrations.reduce((sum, id) => 
          sum + comparison.integrations[id].averageHealthScore, 0) / integrations.length;
        comparison.metrics.reliability.averageErrorRate = integrations.reduce((sum, id) => 
          sum + comparison.integrations[id].averageErrorRate, 0) / integrations.length;

        // Generate rankings
        comparison.rankings.bySuccessRate = integrations.sort((a, b) => 
          comparison.integrations[b].averageSuccessRate - comparison.integrations[a].averageSuccessRate);
        comparison.rankings.byHealthScore = integrations.sort((a, b) => 
          comparison.integrations[b].averageHealthScore - comparison.integrations[a].averageHealthScore);
        comparison.rankings.byCost = integrations.sort((a, b) => 
          comparison.integrations[a].totalCost - comparison.integrations[b].totalCost);

        // Generate insights
        comparison.insights = this._generateComparisonInsights(comparison);
      }

      logger.info('Integration performance comparison generated', { 
        userId: this.userId, 
        integrationCount: integrations.length,
        timeFilter 
      });
      return comparison;
    } catch (error) {
      logger.error('Error generating integration performance comparison:', { error: error.message, userId: this.userId });
      return {
        integrations: {},
        metrics: { performance: {}, cost: {}, reliability: {}, efficiency: {} },
        rankings: {},
        insights: []
      };
    }
  }

  /**
   * Gets integration status based on metrics
   * @param {Object} integration - Integration data
   * @returns {string} Status
   */
  _getIntegrationStatus(integration) {
    if (integration.averageHealthScore >= 90 && integration.averageSuccessRate >= 95) {
      return 'excellent';
    } else if (integration.averageHealthScore >= 80 && integration.averageSuccessRate >= 90) {
      return 'good';
    } else if (integration.averageHealthScore >= 70 && integration.averageSuccessRate >= 80) {
      return 'fair';
    } else if (integration.averageHealthScore >= 60 && integration.averageSuccessRate >= 70) {
      return 'poor';
    } else {
      return 'critical';
    }
  }

  /**
   * Generates alerts based on integration metrics
   * @param {Object} integrations - Integration data
   * @returns {Array} Alerts
   */
  _generateAlerts(integrations) {
    const alerts = [];
    
    Object.keys(integrations).forEach(id => {
      const integration = integrations[id];
      
      if (integration.averageSuccessRate < 90) {
        alerts.push({
          type: 'warning',
          integrationId: id,
          message: `Low success rate: ${integration.averageSuccessRate.toFixed(2)}%`,
          priority: 'high'
        });
      }
      
      if (integration.averageHealthScore < 70) {
        alerts.push({
          type: 'critical',
          integrationId: id,
          message: `Poor health score: ${integration.averageHealthScore.toFixed(2)}`,
          priority: 'critical'
        });
      }
      
      if (integration.averageErrorRate > 10) {
        alerts.push({
          type: 'error',
          integrationId: id,
          message: `High error rate: ${integration.averageErrorRate.toFixed(2)}%`,
          priority: 'high'
        });
      }
    });
    
    return alerts;
  }

  /**
   * Generates recommendations based on integration metrics
   * @param {Object} integrations - Integration data
   * @returns {Array} Recommendations
   */
  _generateRecommendations(integrations) {
    const recommendations = [];
    
    Object.keys(integrations).forEach(id => {
      const integration = integrations[id];
      
      if (integration.averageThroughput < 50) {
        recommendations.push({
          integrationId: id,
          type: 'performance',
          title: 'Improve Throughput',
          description: 'Consider optimizing data processing and implementing parallel operations',
          priority: 'medium'
        });
      }
      
      if (integration.totalCost > 100) {
        recommendations.push({
          integrationId: id,
          type: 'cost',
          title: 'Optimize Costs',
          description: 'Review usage patterns and implement cost optimization strategies',
          priority: 'high'
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Generates comparison insights
   * @param {Object} comparison - Comparison data
   * @returns {Array} Insights
   */
  _generateComparisonInsights(comparison) {
    const insights = [];
    const integrations = Object.keys(comparison.integrations);
    
    if (integrations.length > 1) {
      const bestPerformer = comparison.rankings.bySuccessRate[0];
      const worstPerformer = comparison.rankings.bySuccessRate[integrations.length - 1];
      
      insights.push({
        type: 'performance',
        message: `${bestPerformer} has the highest success rate (${comparison.integrations[bestPerformer].averageSuccessRate.toFixed(2)}%)`,
        priority: 'info'
      });
      
      insights.push({
        type: 'cost',
        message: `${comparison.rankings.byCost[0]} has the lowest cost ($${comparison.integrations[comparison.rankings.byCost[0]].totalCost.toFixed(2)})`,
        priority: 'info'
      });
    }
    
    return insights;
  }

  /**
   * Gets the date filter based on timeFilter string
   * @param {string} timeFilter - '24h', '7d', '30d', '90d'
   * @returns {Date} The calculated Date object
   */
  _getDateFilter(timeFilter) {
    const now = new Date();
    const filters = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    return filters[timeFilter] || filters['7d'];
  }
}

export const integrationMetrics = new IntegrationMetrics();
