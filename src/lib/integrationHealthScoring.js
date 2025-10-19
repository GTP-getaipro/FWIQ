import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class IntegrationHealthScoring {
  constructor(userId) {
    this.userId = userId;
    // Health scoring weights
    this.healthWeights = {
      successRate: 0.3,
      responseTime: 0.25,
      errorRate: 0.2,
      uptime: 0.15,
      dataQuality: 0.1
    };
  }

  /**
   * Records integration health metrics
   * @param {string} integrationId - The ID of the integration
   * @param {Object} healthMetrics - Health metrics (successRate, responseTime, etc.)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object|null>} The inserted data or null if error
   */
  async recordIntegrationHealth(integrationId, healthMetrics = {}, metadata = {}) {
    try {
      const healthScore = this._calculateHealthScore(healthMetrics);
      
      const { data, error } = await supabase
        .from('integration_health_logs')
        .insert({
          user_id: this.userId,
          integration_id: integrationId,
          success_rate: healthMetrics.successRate || 0,
          average_response_time_ms: healthMetrics.responseTime || 0,
          error_rate: healthMetrics.errorRate || 0,
          uptime_percentage: healthMetrics.uptime || 100,
          data_quality_score: healthMetrics.dataQuality || 100,
          overall_health_score: healthScore,
          health_status: this._getHealthStatus(healthScore),
          metadata: metadata,
        })
        .select()
        .single();

      if (error) throw error;
      logger.info(`Integration health recorded for ${integrationId}: ${healthScore.toFixed(2)}`, { 
        userId: this.userId, 
        integrationId, 
        healthScore,
        status: this._getHealthStatus(healthScore)
      });
      return data;
    } catch (error) {
      logger.error(`Error recording integration health for ${integrationId}:`, { error: error.message, userId: this.userId });
      return null;
    }
  }

  /**
   * Gets integration health summary
   * @param {string} timeFilter - '24h', '7d', '30d', '90d'
   * @param {string} [integrationId] - Optional: Filter by specific integration
   * @returns {Promise<Object>} Health summary
   */
  async getIntegrationHealthSummary(timeFilter = '7d', integrationId = null) {
    try {
      const dateFilter = this._getDateFilter(timeFilter);
      let query = supabase
        .from('integration_health_logs')
        .select('integration_id, success_rate, average_response_time_ms, error_rate, uptime_percentage, data_quality_score, overall_health_score, health_status, created_at')
        .eq('user_id', this.userId)
        .gte('created_at', dateFilter.toISOString());

      if (integrationId) {
        query = query.eq('integration_id', integrationId);
      }

      const { data: healthLogs, error } = await query;

      if (error) throw error;

      const summary = healthLogs.reduce((acc, log) => {
        if (!acc[log.integration_id]) {
          acc[log.integration_id] = {
            totalRecords: 0,
            averageHealthScore: 0,
            currentHealthScore: 0,
            currentStatus: 'unknown',
            successRate: { sum: 0, count: 0, avg: 0 },
            responseTime: { sum: 0, count: 0, avg: 0 },
            errorRate: { sum: 0, count: 0, avg: 0 },
            uptime: { sum: 0, count: 0, avg: 0 },
            dataQuality: { sum: 0, count: 0, avg: 0 },
            healthTrend: 'stable',
            statusHistory: []
          };
        }

        const integration = acc[log.integration_id];
        integration.totalRecords++;
        integration.currentHealthScore = log.overall_health_score;
        integration.currentStatus = log.health_status;

        // Aggregate metrics
        integration.successRate.sum += log.success_rate;
        integration.successRate.count++;
        integration.responseTime.sum += log.average_response_time_ms;
        integration.responseTime.count++;
        integration.errorRate.sum += log.error_rate;
        integration.errorRate.count++;
        integration.uptime.sum += log.uptime_percentage;
        integration.uptime.count++;
        integration.dataQuality.sum += log.data_quality_score;
        integration.dataQuality.count++;

        // Track status history
        integration.statusHistory.push({
          status: log.health_status,
          score: log.overall_health_score,
          timestamp: log.created_at
        });

        return acc;
      }, {});

      // Calculate averages and trends
      Object.keys(summary).forEach(id => {
        const integration = summary[id];
        integration.successRate.avg = integration.successRate.count > 0 
          ? integration.successRate.sum / integration.successRate.count 
          : 0;
        integration.responseTime.avg = integration.responseTime.count > 0 
          ? integration.responseTime.sum / integration.responseTime.count 
          : 0;
        integration.errorRate.avg = integration.errorRate.count > 0 
          ? integration.errorRate.sum / integration.errorRate.count 
          : 0;
        integration.uptime.avg = integration.uptime.count > 0 
          ? integration.uptime.sum / integration.uptime.count 
          : 0;
        integration.dataQuality.avg = integration.dataQuality.count > 0 
          ? integration.dataQuality.sum / integration.dataQuality.count 
          : 0;

        integration.averageHealthScore = integration.totalRecords > 0 
          ? integration.statusHistory.reduce((sum, record) => sum + record.score, 0) / integration.totalRecords 
          : 0;

        // Determine health trend
        if (integration.statusHistory.length >= 2) {
          const recent = integration.statusHistory.slice(-3);
          const older = integration.statusHistory.slice(-6, -3);
          const recentAvg = recent.reduce((sum, r) => sum + r.score, 0) / recent.length;
          const olderAvg = older.length > 0 ? older.reduce((sum, r) => sum + r.score, 0) / older.length : recentAvg;
          
          if (recentAvg > olderAvg + 5) {
            integration.healthTrend = 'improving';
          } else if (recentAvg < olderAvg - 5) {
            integration.healthTrend = 'declining';
          } else {
            integration.healthTrend = 'stable';
          }
        }
      });

      logger.info('Integration health summary fetched', { userId: this.userId, timeFilter, integrationId });
      return summary;
    } catch (error) {
      logger.error('Error fetching integration health summary:', { error: error.message, userId: this.userId });
      return {};
    }
  }

  /**
   * Performs automated health check for an integration
   * @param {string} integrationId - The integration ID
   * @param {Object} checkParams - Parameters for the health check
   * @returns {Promise<Object>} Health check results
   */
  async performHealthCheck(integrationId, checkParams = {}) {
    try {
      logger.info(`Performing health check for integration ${integrationId}`, { userId: this.userId, integrationId });

      // Simulate health check (in real implementation, this would test actual integration)
      const healthMetrics = {
        successRate: Math.random() * 100, // Simulated success rate
        responseTime: Math.random() * 2000 + 100, // Simulated response time
        errorRate: Math.random() * 10, // Simulated error rate
        uptime: Math.random() * 20 + 80, // Simulated uptime
        dataQuality: Math.random() * 20 + 80 // Simulated data quality
      };

      const healthScore = this._calculateHealthScore(healthMetrics);
      const status = this._getHealthStatus(healthScore);

      const result = {
        integrationId,
        healthScore,
        status,
        metrics: healthMetrics,
        timestamp: new Date().toISOString(),
        recommendations: this._getHealthRecommendations(healthMetrics, healthScore)
      };

      // Record the health check
      await this.recordIntegrationHealth(integrationId, healthMetrics, { 
        checkType: 'automated',
        checkParams 
      });

      logger.info(`Health check completed for ${integrationId}`, { 
        userId: this.userId, 
        integrationId, 
        healthScore, 
        status 
      });
      return result;
    } catch (error) {
      logger.error(`Error performing health check for ${integrationId}:`, { error: error.message, userId: this.userId });
      return {
        integrationId,
        healthScore: 0,
        status: 'critical',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculates overall health score based on metrics
   * @param {Object} metrics - Health metrics
   * @returns {number} Health score (0-100)
   */
  _calculateHealthScore(metrics) {
    const successRateScore = Math.min(metrics.successRate || 0, 100);
    const responseTimeScore = Math.max(0, 100 - ((metrics.responseTime || 0) / 50)); // Penalty for slow responses
    const errorRateScore = Math.max(0, 100 - ((metrics.errorRate || 0) * 10)); // Penalty for errors
    const uptimeScore = metrics.uptime || 100;
    const dataQualityScore = metrics.dataQuality || 100;

    const weightedScore = 
      (successRateScore * this.healthWeights.successRate) +
      (responseTimeScore * this.healthWeights.responseTime) +
      (errorRateScore * this.healthWeights.errorRate) +
      (uptimeScore * this.healthWeights.uptime) +
      (dataQualityScore * this.healthWeights.dataQuality);

    return Math.round(weightedScore * 100) / 100;
  }

  /**
   * Gets health status based on score
   * @param {number} score - Health score
   * @returns {string} Health status
   */
  _getHealthStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'critical';
  }

  /**
   * Gets health recommendations based on metrics
   * @param {Object} metrics - Health metrics
   * @param {number} healthScore - Overall health score
   * @returns {Array<string>} Recommendations
   */
  _getHealthRecommendations(metrics, healthScore) {
    const recommendations = [];

    if (metrics.successRate < 90) {
      recommendations.push('Consider reviewing integration configuration and API limits to improve success rate');
    }
    if (metrics.responseTime > 1000) {
      recommendations.push('Optimize integration queries and consider caching to reduce response time');
    }
    if (metrics.errorRate > 5) {
      recommendations.push('Investigate error patterns and implement better error handling');
    }
    if (metrics.uptime < 95) {
      recommendations.push('Review integration reliability and implement failover mechanisms');
    }
    if (metrics.dataQuality < 90) {
      recommendations.push('Improve data validation and cleaning processes');
    }
    if (healthScore < 70) {
      recommendations.push('Overall integration health is below optimal. Consider comprehensive review and optimization');
    }

    return recommendations;
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

export const integrationHealthScoring = new IntegrationHealthScoring();
