/**
 * Security Cost Tracking Service
 * Comprehensive cost tracking and analysis for security operations
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';

export class SecurityCostTracking {
  constructor() {
    this.costCategories = {
      'threat_detection': 'Threat Detection & Monitoring',
      'incident_response': 'Incident Response & Recovery',
      'compliance_audit': 'Compliance & Auditing',
      'security_tools': 'Security Tools & Software',
      'training': 'Security Training & Education',
      'consulting': 'Security Consulting',
      'infrastructure': 'Security Infrastructure',
      'monitoring': 'Security Monitoring',
      'encryption': 'Data Encryption',
      'access_control': 'Access Control Systems',
      'general': 'General Security'
    };
    
    this.costTypes = {
      'fixed': 'Fixed Cost',
      'variable': 'Variable Cost',
      'one_time': 'One-time Cost',
      'recurring': 'Recurring Cost'
    };
    
    this.currency = 'USD';
    this.costData = null;
    this.lastUpdated = null;
  }

  /**
   * Track security cost
   * @param {string} userId - User ID
   * @param {Object} costData - Cost data
   * @returns {Promise<Object>} Tracking result
   */
  async trackSecurityCost(userId, costData) {
    try {
      const {
        category = 'general',
        type = 'variable',
        amount,
        currency = this.currency,
        description,
        metadata = {}
      } = costData;

      // Validate cost data
      const validation = this.validateCostData(costData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create cost record
      const { data, error } = await supabase
        .from('security_costs')
        .insert({
          user_id: userId,
          cost_category: category,
          cost_type: type,
          amount: parseFloat(amount),
          currency,
          description,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Log cost tracking
      logger.info('Security cost tracked', {
        userId,
        category,
        type,
        amount,
        currency,
        costId: data.id
      });

      // Update cached data
      await this.refreshCostData(userId);

      return {
        success: true,
        costId: data.id,
        message: 'Security cost tracked successfully'
      };
    } catch (error) {
      logger.error('Failed to track security cost', {
        userId,
        costData,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get security cost analytics
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range (24h, 7d, 30d, 90d, 1y)
   * @returns {Promise<Object>} Cost analytics
   */
  async getSecurityCostAnalytics(userId, timeRange = '30d') {
    try {
      const dateFilter = this.getDateFilter(timeRange);
      
      // Get cost data
      const { data: costs, error } = await supabase
        .from('security_costs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const costAnalytics = this.processCostAnalytics(costs || [], timeRange);
      
      logger.info('Security cost analytics generated', {
        userId,
        timeRange,
        totalCost: costAnalytics.totalCost,
        costCount: costs?.length || 0
      });

      return costAnalytics;
    } catch (error) {
      logger.error('Failed to get security cost analytics', {
        userId,
        timeRange,
        error: error.message
      });
      
      return this.getDefaultCostAnalytics();
    }
  }

  /**
   * Process cost analytics from raw data
   * @param {Array} costs - Cost records
   * @param {string} timeRange - Time range
   * @returns {Object} Processed analytics
   */
  processCostAnalytics(costs, timeRange) {
    const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    
    // Group by category
    const costByCategory = costs.reduce((acc, cost) => {
      const category = cost.cost_category || 'general';
      acc[category] = (acc[category] || 0) + (cost.amount || 0);
      return acc;
    }, {});

    // Group by type
    const costByType = costs.reduce((acc, cost) => {
      const type = cost.cost_type || 'variable';
      acc[type] = (acc[type] || 0) + (cost.amount || 0);
      return acc;
    }, {});

    // Group by time period
    const costByTime = this.groupCostsByTime(costs, timeRange);

    // Calculate trends
    const trends = this.calculateCostTrends(costByTime);

    // Get top categories
    const topCategories = Object.entries(costByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0,
        displayName: this.costCategories[category] || category
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Calculate cost efficiency metrics
    const efficiencyMetrics = this.calculateEfficiencyMetrics(costs);

    return {
      totalCost,
      costCount: costs.length,
      costByCategory,
      costByType,
      costByTime,
      trends,
      topCategories,
      efficiencyMetrics,
      averageDailyCost: this.calculateAverageDailyCost(costByTime),
      projectedMonthlyCost: this.calculateProjectedMonthlyCost(costByTime),
      timeRange,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Group costs by time period
   * @param {Array} costs - Cost records
   * @param {string} timeRange - Time range
   * @returns {Object} Costs grouped by time
   */
  groupCostsByTime(costs, timeRange) {
    const timeGroups = {};
    
    costs.forEach(cost => {
      const date = new Date(cost.created_at);
      let timeKey;
      
      switch (timeRange) {
        case '24h':
          timeKey = date.toISOString().split('T')[1].substring(0, 2) + ':00'; // Hour
          break;
        case '7d':
        case '30d':
        case '90d':
          timeKey = date.toISOString().split('T')[0]; // Day
          break;
        case '1y':
          timeKey = date.toISOString().substring(0, 7); // Month
          break;
        default:
          timeKey = date.toISOString().split('T')[0];
      }
      
      timeGroups[timeKey] = (timeGroups[timeKey] || 0) + (cost.amount || 0);
    });
    
    return timeGroups;
  }

  /**
   * Calculate cost trends
   * @param {Object} costByTime - Cost data by time
   * @returns {Object} Trend analysis
   */
  calculateCostTrends(costByTime) {
    const timeKeys = Object.keys(costByTime).sort();
    if (timeKeys.length < 2) {
      return { trend: 'stable', percentage: 0, direction: 'none' };
    }

    const firstHalf = timeKeys.slice(0, Math.floor(timeKeys.length / 2));
    const secondHalf = timeKeys.slice(Math.floor(timeKeys.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, key) => sum + (costByTime[key] || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, key) => sum + (costByTime[key] || 0), 0) / secondHalf.length;

    const percentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    let trend = 'stable';
    let direction = 'none';
    
    if (percentage > 10) {
      trend = 'increasing';
      direction = 'up';
    } else if (percentage < -10) {
      trend = 'decreasing';
      direction = 'down';
    }

    return {
      trend,
      percentage: Math.round(percentage),
      direction,
      firstHalfAvg: Math.round(firstHalfAvg * 100) / 100,
      secondHalfAvg: Math.round(secondHalfAvg * 100) / 100
    };
  }

  /**
   * Calculate efficiency metrics
   * @param {Array} costs - Cost records
   * @returns {Object} Efficiency metrics
   */
  calculateEfficiencyMetrics(costs) {
    const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const costCount = costs.length;
    
    // Calculate cost per incident (if incident data available)
    const incidentCosts = costs.filter(cost => 
      cost.cost_category === 'incident_response' || 
      cost.description?.toLowerCase().includes('incident')
    );
    
    const costPerIncident = incidentCosts.length > 0 
      ? incidentCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0) / incidentCosts.length
      : 0;

    // Calculate cost per day
    const days = this.getDaysInTimeRange('30d');
    const costPerDay = days > 0 ? totalCost / days : 0;

    // Calculate cost efficiency score (lower is better)
    const efficiencyScore = this.calculateEfficiencyScore(costs);

    return {
      totalCost,
      costCount,
      costPerIncident: Math.round(costPerIncident * 100) / 100,
      costPerDay: Math.round(costPerDay * 100) / 100,
      efficiencyScore,
      incidentResponseCosts: incidentCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0)
    };
  }

  /**
   * Calculate efficiency score
   * @param {Array} costs - Cost records
   * @returns {number} Efficiency score (0-100)
   */
  calculateEfficiencyScore(costs) {
    if (costs.length === 0) return 100;

    // Factors that affect efficiency
    const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const avgCost = totalCost / costs.length;
    
    // High average cost per item reduces efficiency
    const costFactor = Math.min(100, Math.max(0, 100 - (avgCost / 10)));
    
    // More incidents reduce efficiency
    const incidentCosts = costs.filter(cost => 
      cost.cost_category === 'incident_response'
    ).length;
    const incidentFactor = Math.min(100, Math.max(0, 100 - (incidentCosts * 5)));
    
    // Calculate weighted efficiency score
    const efficiencyScore = (costFactor * 0.7) + (incidentFactor * 0.3);
    
    return Math.round(efficiencyScore);
  }

  /**
   * Calculate average daily cost
   * @param {Object} costByTime - Cost data by time
   * @returns {number} Average daily cost
   */
  calculateAverageDailyCost(costByTime) {
    const days = Object.keys(costByTime).length;
    if (days === 0) return 0;
    
    const totalCost = Object.values(costByTime).reduce((sum, cost) => sum + cost, 0);
    return Math.round(totalCost / days * 100) / 100;
  }

  /**
   * Calculate projected monthly cost
   * @param {Object} costByTime - Cost data by time
   * @returns {number} Projected monthly cost
   */
  calculateProjectedMonthlyCost(costByTime) {
    const avgDailyCost = this.calculateAverageDailyCost(costByTime);
    return Math.round(avgDailyCost * 30 * 100) / 100;
  }

  /**
   * Get cost optimization recommendations
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Optimization recommendations
   */
  async getCostOptimizationRecommendations(userId, timeRange = '30d') {
    try {
      const analytics = await this.getSecurityCostAnalytics(userId, timeRange);
      const recommendations = [];

      // High cost categories
      analytics.topCategories.forEach(category => {
        if (category.percentage > 30) {
          recommendations.push({
            type: 'cost_reduction',
            priority: 'high',
            title: `High Cost in ${category.displayName}`,
            description: `${category.displayName} accounts for ${category.percentage.toFixed(1)}% of total security costs.`,
            action: `Review ${category.displayName} spending and identify optimization opportunities`,
            potentialSavings: `Up to ${Math.round(category.amount * 0.2)} ${this.currency}`
          });
        }
      });

      // Trend-based recommendations
      if (analytics.trends.trend === 'increasing' && analytics.trends.percentage > 20) {
        recommendations.push({
          type: 'trend_analysis',
          priority: 'medium',
          title: 'Rising Security Costs',
          description: `Security costs have increased by ${analytics.trends.percentage}% over the period.`,
          action: 'Investigate cost drivers and implement cost controls',
          potentialSavings: `Up to ${Math.round(analytics.totalCost * 0.15)} ${this.currency}`
        });
      }

      // Efficiency recommendations
      if (analytics.efficiencyMetrics.efficiencyScore < 70) {
        recommendations.push({
          type: 'efficiency',
          priority: 'high',
          title: 'Low Cost Efficiency',
          description: `Cost efficiency score is ${analytics.efficiencyMetrics.efficiencyScore}/100.`,
          action: 'Optimize security spending and improve cost management',
          potentialSavings: `Up to ${Math.round(analytics.totalCost * 0.25)} ${this.currency}`
        });
      }

      // Incident response cost recommendations
      if (analytics.efficiencyMetrics.incidentResponseCosts > analytics.totalCost * 0.4) {
        recommendations.push({
          type: 'prevention',
          priority: 'medium',
          title: 'High Incident Response Costs',
          description: 'Incident response costs are high relative to total security spending.',
          action: 'Invest in preventive security measures to reduce incident frequency',
          potentialSavings: `Up to ${Math.round(analytics.efficiencyMetrics.incidentResponseCosts * 0.3)} ${this.currency}`
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to get cost optimization recommendations', {
        userId,
        timeRange,
        error: error.message
      });
      
      return [];
    }
  }

  /**
   * Export cost data
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range
   * @param {string} format - Export format (json, csv)
   * @returns {Promise<Object>} Exported data
   */
  async exportCostData(userId, timeRange = '30d', format = 'json') {
    try {
      const analytics = await this.getSecurityCostAnalytics(userId, timeRange);
      
      if (format === 'csv') {
        return this.convertToCSV(analytics);
      }
      
      return analytics;
    } catch (error) {
      logger.error('Failed to export cost data', {
        userId,
        timeRange,
        format,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Convert analytics to CSV format
   * @param {Object} analytics - Cost analytics
   * @returns {string} CSV data
   */
  convertToCSV(analytics) {
    const csvRows = [];
    
    // Add summary data
    csvRows.push('Metric,Value');
    csvRows.push(`Total Cost,${analytics.totalCost}`);
    csvRows.push(`Cost Count,${analytics.costCount}`);
    csvRows.push(`Average Daily Cost,${analytics.averageDailyCost}`);
    csvRows.push(`Projected Monthly Cost,${analytics.projectedMonthlyCost}`);
    csvRows.push(`Efficiency Score,${analytics.efficiencyMetrics.efficiencyScore}`);
    
    // Add category breakdown
    csvRows.push('');
    csvRows.push('Category,Amount,Percentage');
    analytics.topCategories.forEach(category => {
      csvRows.push(`${category.displayName},${category.amount},${category.percentage.toFixed(1)}%`);
    });
    
    return csvRows.join('\n');
  }

  /**
   * Validate cost data
   * @param {Object} costData - Cost data to validate
   * @returns {Object} Validation result
   */
  validateCostData(costData) {
    const { category, type, amount, description } = costData;

    if (!amount || isNaN(amount) || amount <= 0) {
      return { valid: false, error: 'Amount must be a positive number' };
    }

    if (!category || !this.costCategories[category]) {
      return { valid: false, error: 'Invalid cost category' };
    }

    if (!type || !this.costTypes[type]) {
      return { valid: false, error: 'Invalid cost type' };
    }

    if (!description || description.trim().length < 3) {
      return { valid: false, error: 'Description must be at least 3 characters' };
    }

    return { valid: true };
  }

  /**
   * Refresh cached cost data
   * @param {string} userId - User ID
   */
  async refreshCostData(userId) {
    try {
      this.costData = await this.getSecurityCostAnalytics(userId, '30d');
      this.lastUpdated = new Date();
    } catch (error) {
      logger.error('Failed to refresh cost data', { userId, error: error.message });
    }
  }

  /**
   * Get date filter for time period
   * @param {string} timeRange - Time range
   * @returns {Date} Date filter
   */
  getDateFilter(timeRange) {
    const now = new Date();
    const filters = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };

    return filters[timeRange] || filters['30d'];
  }

  /**
   * Get days in time range
   * @param {string} timeRange - Time range
   * @returns {number} Number of days
   */
  getDaysInTimeRange(timeRange) {
    const days = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };

    return days[timeRange] || 30;
  }

  /**
   * Get default cost analytics
   * @returns {Object} Default analytics
   */
  getDefaultCostAnalytics() {
    return {
      totalCost: 0,
      costCount: 0,
      costByCategory: {},
      costByType: {},
      costByTime: {},
      trends: { trend: 'stable', percentage: 0, direction: 'none' },
      topCategories: [],
      efficiencyMetrics: {
        totalCost: 0,
        costCount: 0,
        costPerIncident: 0,
        costPerDay: 0,
        efficiencyScore: 100,
        incidentResponseCosts: 0
      },
      averageDailyCost: 0,
      projectedMonthlyCost: 0,
      timeRange: '30d',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get cost categories
   * @returns {Object} Cost categories
   */
  getCostCategories() {
    return this.costCategories;
  }

  /**
   * Get cost types
   * @returns {Object} Cost types
   */
  getCostTypes() {
    return this.costTypes;
  }
}

// Export singleton instance
export const securityCostTracking = new SecurityCostTracking();

export default SecurityCostTracking;
