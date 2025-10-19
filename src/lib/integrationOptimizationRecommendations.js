import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class IntegrationOptimizationRecommendations {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Generates optimization recommendations based on analytics and health data
   * @param {string} integrationId - The integration ID
   * @param {Object} analyticsData - Analytics data from IntegrationAnalytics
   * @param {Object} costData - Cost data from IntegrationCostTracking
   * @param {Object} healthData - Health data from IntegrationHealthScoring
   * @returns {Promise<Object>} Optimization recommendations
   */
  async generateOptimizationRecommendations(integrationId, analyticsData = {}, costData = {}, healthData = {}) {
    try {
      logger.info(`Generating optimization recommendations for ${integrationId}`, { userId: this.userId, integrationId });

      const recommendations = {
        integrationId,
        timestamp: new Date().toISOString(),
        priority: 'medium',
        categories: {
          performance: [],
          cost: [],
          reliability: [],
          scalability: []
        },
        overallScore: 0,
        estimatedImpact: 'medium',
        implementationEffort: 'medium'
      };

      // Performance recommendations
      if (analyticsData.averageDuration > 2000) {
        recommendations.categories.performance.push({
          type: 'response_time',
          priority: 'high',
          title: 'Optimize Response Time',
          description: `Average response time is ${analyticsData.averageDuration.toFixed(2)}ms. Consider implementing caching, query optimization, or batch processing.`,
          estimatedImprovement: '30-50%',
          effort: 'medium'
        });
      }

      if (analyticsData.successRate < 95) {
        recommendations.categories.reliability.push({
          type: 'success_rate',
          priority: 'high',
          title: 'Improve Success Rate',
          description: `Current success rate is ${analyticsData.successRate.toFixed(2)}%. Review error patterns and implement retry logic with exponential backoff.`,
          estimatedImprovement: '5-10%',
          effort: 'low'
        });
      }

      // Cost recommendations
      if (costData.averageCostPerApiCall > 0.001) {
        recommendations.categories.cost.push({
          type: 'api_efficiency',
          priority: 'medium',
          title: 'Optimize API Usage',
          description: `High cost per API call ($${costData.averageCostPerApiCall.toFixed(4)}). Consider batching requests or using bulk operations.`,
          estimatedSavings: '20-40%',
          effort: 'medium'
        });
      }

      if (costData.totalCost > 50) {
        recommendations.categories.cost.push({
          type: 'cost_reduction',
          priority: 'high',
          title: 'Reduce Integration Costs',
          description: `Total cost is $${costData.totalCost.toFixed(2)}. Review usage patterns and implement cost optimization strategies.`,
          estimatedSavings: '15-30%',
          effort: 'high'
        });
      }

      // Reliability recommendations
      if (healthData.currentHealthScore < 80) {
        recommendations.categories.reliability.push({
          type: 'health_improvement',
          priority: 'high',
          title: 'Improve Integration Health',
          description: `Health score is ${healthData.currentHealthScore.toFixed(2)}. Focus on improving uptime, error handling, and data quality.`,
          estimatedImprovement: '10-20%',
          effort: 'high'
        });
      }

      if (healthData.errorRate?.avg > 5) {
        recommendations.categories.reliability.push({
          type: 'error_reduction',
          priority: 'high',
          title: 'Reduce Error Rate',
          description: `Error rate is ${healthData.errorRate.avg.toFixed(2)}%. Implement better error handling and monitoring.`,
          estimatedImprovement: '50-70%',
          effort: 'medium'
        });
      }

      // Scalability recommendations
      if (analyticsData.throughput < 100) {
        recommendations.categories.scalability.push({
          type: 'throughput',
          priority: 'medium',
          title: 'Improve Throughput',
          description: `Current throughput is ${analyticsData.throughput.toFixed(2)} records/second. Consider parallel processing and connection pooling.`,
          estimatedImprovement: '100-200%',
          effort: 'high'
        });
      }

      // Calculate overall score and priority
      const totalRecommendations = Object.values(recommendations.categories).flat().length;
      const highPriorityCount = Object.values(recommendations.categories).flat().filter(r => r.priority === 'high').length;
      
      recommendations.overallScore = totalRecommendations > 0 ? (highPriorityCount / totalRecommendations) * 100 : 0;
      
      if (highPriorityCount >= 3) {
        recommendations.priority = 'high';
        recommendations.estimatedImpact = 'high';
      } else if (highPriorityCount >= 1) {
        recommendations.priority = 'medium';
        recommendations.estimatedImpact = 'medium';
      } else {
        recommendations.priority = 'low';
        recommendations.estimatedImpact = 'low';
      }

      // Record recommendations
      await this._recordRecommendations(integrationId, recommendations);

      logger.info(`Optimization recommendations generated for ${integrationId}`, { 
        userId: this.userId, 
        integrationId, 
        totalRecommendations,
        priority: recommendations.priority
      });

      return recommendations;
    } catch (error) {
      logger.error(`Error generating optimization recommendations for ${integrationId}:`, { error: error.message, userId: this.userId });
      return {
        integrationId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Gets optimization recommendations history
   * @param {string} integrationId - The integration ID
   * @param {string} timeFilter - Time period filter
   * @returns {Promise<Array>} Recommendations history
   */
  async getOptimizationHistory(integrationId, timeFilter = '30d') {
    try {
      const dateFilter = this._getDateFilter(timeFilter);
      const { data, error } = await supabase
        .from('integration_optimization_recommendations')
        .select('*')
        .eq('user_id', this.userId)
        .eq('integration_id', integrationId)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      logger.info(`Optimization history fetched for ${integrationId}`, { userId: this.userId, integrationId, count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logger.error(`Error fetching optimization history for ${integrationId}:`, { error: error.message, userId: this.userId });
      return [];
    }
  }

  /**
   * Records optimization recommendations
   * @param {string} integrationId - The integration ID
   * @param {Object} recommendations - Recommendations data
   * @returns {Promise<Object|null>} Recorded data or null if error
   */
  async _recordRecommendations(integrationId, recommendations) {
    try {
      const { data, error } = await supabase
        .from('integration_optimization_recommendations')
        .insert({
          user_id: this.userId,
          integration_id: integrationId,
          priority: recommendations.priority,
          overall_score: recommendations.overallScore,
          estimated_impact: recommendations.estimatedImpact,
          implementation_effort: recommendations.implementationEffort,
          recommendations: recommendations.categories,
          metadata: {
            totalRecommendations: Object.values(recommendations.categories).flat().length,
            highPriorityCount: Object.values(recommendations.categories).flat().filter(r => r.priority === 'high').length
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error recording optimization recommendations for ${integrationId}:`, { error: error.message, userId: this.userId });
      return null;
    }
  }

  /**
   * Gets actionable optimization insights
   * @param {string} integrationId - The integration ID
   * @returns {Promise<Object>} Actionable insights
   */
  async getActionableInsights(integrationId) {
    try {
      const insights = {
        integrationId,
        timestamp: new Date().toISOString(),
        quickWins: [],
        longTermGoals: [],
        riskFactors: [],
        opportunities: []
      };

      // Get recent recommendations
      const recentRecommendations = await this.getOptimizationHistory(integrationId, '7d');
      
      if (recentRecommendations.length > 0) {
        const latest = recentRecommendations[0];
        const allRecs = Object.values(latest.recommendations).flat();

        // Categorize recommendations
        insights.quickWins = allRecs.filter(r => r.effort === 'low' && r.priority === 'high');
        insights.longTermGoals = allRecs.filter(r => r.effort === 'high' && r.priority === 'high');
        insights.riskFactors = allRecs.filter(r => r.priority === 'high' && r.type.includes('error'));
        insights.opportunities = allRecs.filter(r => r.estimatedImprovement && r.estimatedImprovement.includes('100%'));
      }

      logger.info(`Actionable insights generated for ${integrationId}`, { 
        userId: this.userId, 
        integrationId,
        quickWins: insights.quickWins.length,
        longTermGoals: insights.longTermGoals.length
      });

      return insights;
    } catch (error) {
      logger.error(`Error generating actionable insights for ${integrationId}:`, { error: error.message, userId: this.userId });
      return {
        integrationId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
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

export const integrationOptimizationRecommendations = new IntegrationOptimizationRecommendations();
