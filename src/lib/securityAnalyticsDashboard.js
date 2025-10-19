/**
 * Security Analytics Dashboard Service
 * Comprehensive security metrics and analytics for FloWorx
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { securityManager } from './security.js';

export class SecurityAnalyticsDashboard {
  constructor() {
    this.metrics = {
      threatDetection: {
        totalThreats: 0,
        threatsByType: {},
        threatsBySeverity: {},
        threatsByTime: {}
      },
      securityEvents: {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        eventsByTime: {}
      },
      compliance: {
        complianceScore: 0,
        complianceByCategory: {},
        violations: [],
        recommendations: []
      },
      costTracking: {
        totalCost: 0,
        costByCategory: {},
        costByTime: {},
        costTrends: []
      }
    };
    
    this.dashboardData = null;
    this.lastUpdated = null;
  }

  /**
   * Get comprehensive security analytics dashboard data
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range (24h, 7d, 30d, 90d)
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData(userId, timeRange = '7d') {
    try {
      const dateFilter = this.getDateFilter(timeRange);
      
      // Fetch all security data in parallel
      const [
        threatData,
        eventData,
        complianceData,
        costData,
        securityStatus
      ] = await Promise.all([
        this.getThreatAnalytics(userId, dateFilter),
        this.getSecurityEventAnalytics(userId, dateFilter),
        this.getComplianceAnalytics(userId, dateFilter),
        this.getSecurityCostTracking(userId, dateFilter),
        this.getSecurityStatus(userId)
      ]);

      this.dashboardData = {
        overview: {
          totalThreats: threatData.totalThreats,
          totalEvents: eventData.totalEvents,
          complianceScore: complianceData.complianceScore,
          totalCost: costData.totalCost,
          securityStatus: securityStatus.overallStatus,
          lastUpdated: new Date().toISOString()
        },
        threatDetection: threatData,
        securityEvents: eventData,
        compliance: complianceData,
        costTracking: costData,
        securityStatus,
        timeRange,
        generatedAt: new Date().toISOString()
      };

      this.lastUpdated = new Date();
      
      logger.info('Security analytics dashboard data generated', {
        userId,
        timeRange,
        threats: threatData.totalThreats,
        events: eventData.totalEvents,
        complianceScore: complianceData.complianceScore
      });

      return this.dashboardData;
    } catch (error) {
      logger.error('Failed to generate security analytics dashboard', {
        userId,
        timeRange,
        error: error.message
      });
      
      return this.getDefaultDashboardData();
    }
  }

  /**
   * Get threat detection analytics
   * @param {string} userId - User ID
   * @param {Date} dateFilter - Date filter
   * @returns {Promise<Object>} Threat analytics
   */
  async getThreatAnalytics(userId, dateFilter) {
    try {
      // Get threat detection data from security logs
      const { data: threats, error } = await supabase
        .from('security_logs')
        .select('threat_type, severity, created_at, threat_data')
        .eq('user_id', userId)
        .eq('event_type', 'threat_detected')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalThreats = threats?.length || 0;
      
      // Group threats by type
      const threatsByType = threats?.reduce((acc, threat) => {
        const type = threat.threat_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) || {};

      // Group threats by severity
      const threatsBySeverity = threats?.reduce((acc, threat) => {
        const severity = threat.severity || 'medium';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {}) || {};

      // Group threats by time (daily)
      const threatsByTime = threats?.reduce((acc, threat) => {
        const date = new Date(threat.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get threat trends
      const threatTrends = this.calculateTrends(threatsByTime);

      return {
        totalThreats,
        threatsByType,
        threatsBySeverity,
        threatsByTime,
        threatTrends,
        recentThreats: threats?.slice(0, 10) || []
      };
    } catch (error) {
      logger.error('Failed to get threat analytics', { userId, error: error.message });
      return {
        totalThreats: 0,
        threatsByType: {},
        threatsBySeverity: {},
        threatsByTime: {},
        threatTrends: { trend: 'stable', percentage: 0 },
        recentThreats: []
      };
    }
  }

  /**
   * Get security event analytics
   * @param {string} userId - User ID
   * @param {Date} dateFilter - Date filter
   * @returns {Promise<Object>} Security event analytics
   */
  async getSecurityEventAnalytics(userId, dateFilter) {
    try {
      const { data: events, error } = await supabase
        .from('security_logs')
        .select('event_type, severity, created_at, event_data')
        .eq('user_id', userId)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalEvents = events?.length || 0;
      
      // Group events by type
      const eventsByType = events?.reduce((acc, event) => {
        const type = event.event_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) || {};

      // Group events by severity
      const eventsBySeverity = events?.reduce((acc, event) => {
        const severity = event.severity || 'medium';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {}) || {};

      // Group events by time (daily)
      const eventsByTime = events?.reduce((acc, event) => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}) || {};

      // Get event trends
      const eventTrends = this.calculateTrends(eventsByTime);

      return {
        totalEvents,
        eventsByType,
        eventsBySeverity,
        eventsByTime,
        eventTrends,
        recentEvents: events?.slice(0, 10) || []
      };
    } catch (error) {
      logger.error('Failed to get security event analytics', { userId, error: error.message });
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        eventsByTime: {},
        eventTrends: { trend: 'stable', percentage: 0 },
        recentEvents: []
      };
    }
  }

  /**
   * Get compliance analytics
   * @param {string} userId - User ID
   * @param {Date} dateFilter - Date filter
   * @returns {Promise<Object>} Compliance analytics
   */
  async getComplianceAnalytics(userId, dateFilter) {
    try {
      // Get compliance data from security logs
      const { data: complianceEvents, error } = await supabase
        .from('security_logs')
        .select('event_type, severity, created_at, event_data')
        .eq('user_id', userId)
        .eq('event_type', 'compliance_violation')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const violations = complianceEvents || [];
      
      // Calculate compliance score (100 - violations * penalty)
      const violationPenalty = 5; // 5 points per violation
      const complianceScore = Math.max(0, 100 - (violations.length * violationPenalty));

      // Group violations by category
      const complianceByCategory = violations.reduce((acc, violation) => {
        const category = violation.event_data?.category || 'general';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      // Generate compliance recommendations
      const recommendations = this.generateComplianceRecommendations(violations, complianceScore);

      return {
        complianceScore,
        complianceByCategory,
        violations: violations.slice(0, 20), // Last 20 violations
        recommendations,
        trend: this.calculateComplianceTrend(violations)
      };
    } catch (error) {
      logger.error('Failed to get compliance analytics', { userId, error: error.message });
      return {
        complianceScore: 100,
        complianceByCategory: {},
        violations: [],
        recommendations: [],
        trend: 'stable'
      };
    }
  }

  /**
   * Get security cost tracking data
   * @param {string} userId - User ID
   * @param {Date} dateFilter - Date filter
   * @returns {Promise<Object>} Cost tracking data
   */
  async getSecurityCostTracking(userId, dateFilter) {
    try {
      // Get security-related costs from various sources
      const { data: securityCosts, error } = await supabase
        .from('security_costs')
        .select('cost_category, amount, currency, created_at, description')
        .eq('user_id', userId)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const costs = securityCosts || [];
      const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

      // Group costs by category
      const costByCategory = costs.reduce((acc, cost) => {
        const category = cost.cost_category || 'general';
        acc[category] = (acc[category] || 0) + (cost.amount || 0);
        return acc;
      }, {});

      // Group costs by time (daily)
      const costByTime = costs.reduce((acc, cost) => {
        const date = new Date(cost.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (cost.amount || 0);
        return acc;
      }, {});

      // Calculate cost trends
      const costTrends = this.calculateCostTrends(costByTime);

      return {
        totalCost,
        costByCategory,
        costByTime,
        costTrends,
        recentCosts: costs.slice(0, 10),
        averageDailyCost: this.calculateAverageDailyCost(costByTime)
      };
    } catch (error) {
      logger.error('Failed to get security cost tracking', { userId, error: error.message });
      return {
        totalCost: 0,
        costByCategory: {},
        costByTime: {},
        costTrends: { trend: 'stable', percentage: 0 },
        recentCosts: [],
        averageDailyCost: 0
      };
    }
  }

  /**
   * Get security status overview
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Security status
   */
  async getSecurityStatus(userId) {
    try {
      const securityStatus = securityManager.getSecurityStatus();
      
      // Get additional status from database
      const { data: recentThreats, error } = await supabase
        .from('security_logs')
        .select('severity')
        .eq('user_id', userId)
        .eq('event_type', 'threat_detected')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (error) throw error;

      const hasRecentThreats = recentThreats && recentThreats.length > 0;
      const overallStatus = hasRecentThreats ? 'warning' : 'good';

      return {
        ...securityStatus,
        overallStatus,
        hasRecentThreats,
        lastThreatDetected: hasRecentThreats ? recentThreats[0].created_at : null
      };
    } catch (error) {
      logger.error('Failed to get security status', { userId, error: error.message });
      return {
        overallStatus: 'unknown',
        hasRecentThreats: false,
        lastThreatDetected: null,
        basicSecurity: { cspConfigured: false },
        advancedSecurity: { auditLogging: false }
      };
    }
  }

  /**
   * Generate compliance recommendations
   * @param {Array} violations - Compliance violations
   * @param {number} complianceScore - Current compliance score
   * @returns {Array} Recommendations
   */
  generateComplianceRecommendations(violations, complianceScore) {
    const recommendations = [];

    if (complianceScore < 80) {
      recommendations.push({
        type: 'critical',
        title: 'Low Compliance Score',
        description: `Current compliance score is ${complianceScore}%. Immediate action required.`,
        action: 'Review and address all compliance violations'
      });
    }

    if (violations.length > 10) {
      recommendations.push({
        type: 'warning',
        title: 'High Number of Violations',
        description: `${violations.length} compliance violations detected.`,
        action: 'Implement additional security controls'
      });
    }

    // Check for specific violation patterns
    const violationTypes = violations.reduce((acc, v) => {
      const type = v.event_data?.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(violationTypes).forEach(([type, count]) => {
      if (count > 3) {
        recommendations.push({
          type: 'info',
          title: `Frequent ${type} Violations`,
          description: `${count} violations of type ${type} detected.`,
          action: `Review and strengthen ${type} security controls`
        });
      }
    });

    return recommendations;
  }

  /**
   * Calculate trends from time series data
   * @param {Object} timeData - Time series data
   * @returns {Object} Trend analysis
   */
  calculateTrends(timeData) {
    const dates = Object.keys(timeData).sort();
    if (dates.length < 2) {
      return { trend: 'stable', percentage: 0 };
    }

    const firstHalf = dates.slice(0, Math.floor(dates.length / 2));
    const secondHalf = dates.slice(Math.floor(dates.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, date) => sum + (timeData[date] || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, date) => sum + (timeData[date] || 0), 0) / secondHalf.length;

    const percentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    let trend = 'stable';
    if (percentage > 10) trend = 'increasing';
    else if (percentage < -10) trend = 'decreasing';

    return { trend, percentage: Math.round(percentage) };
  }

  /**
   * Calculate compliance trend
   * @param {Array} violations - Compliance violations
   * @returns {string} Trend direction
   */
  calculateComplianceTrend(violations) {
    if (violations.length < 2) return 'stable';

    const recentViolations = violations.slice(0, Math.floor(violations.length / 2));
    const olderViolations = violations.slice(Math.floor(violations.length / 2));

    const recentCount = recentViolations.length;
    const olderCount = olderViolations.length;

    if (recentCount > olderCount * 1.2) return 'declining';
    if (recentCount < olderCount * 0.8) return 'improving';
    return 'stable';
  }

  /**
   * Calculate cost trends
   * @param {Object} costByTime - Cost data by time
   * @returns {Object} Cost trend analysis
   */
  calculateCostTrends(costByTime) {
    return this.calculateTrends(costByTime);
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
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    return filters[timeRange] || filters['7d'];
  }

  /**
   * Get default dashboard data
   * @returns {Object} Default dashboard data
   */
  getDefaultDashboardData() {
    return {
      overview: {
        totalThreats: 0,
        totalEvents: 0,
        complianceScore: 100,
        totalCost: 0,
        securityStatus: 'good',
        lastUpdated: new Date().toISOString()
      },
      threatDetection: {
        totalThreats: 0,
        threatsByType: {},
        threatsBySeverity: {},
        threatsByTime: {},
        threatTrends: { trend: 'stable', percentage: 0 },
        recentThreats: []
      },
      securityEvents: {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        eventsByTime: {},
        eventTrends: { trend: 'stable', percentage: 0 },
        recentEvents: []
      },
      compliance: {
        complianceScore: 100,
        complianceByCategory: {},
        violations: [],
        recommendations: [],
        trend: 'stable'
      },
      costTracking: {
        totalCost: 0,
        costByCategory: {},
        costByTime: {},
        costTrends: { trend: 'stable', percentage: 0 },
        recentCosts: [],
        averageDailyCost: 0
      },
      securityStatus: {
        overallStatus: 'good',
        hasRecentThreats: false,
        lastThreatDetected: null
      },
      timeRange: '7d',
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Export dashboard data
   * @param {string} format - Export format (json, csv)
   * @returns {Object} Exported data
   */
  exportDashboardData(format = 'json') {
    if (!this.dashboardData) {
      throw new Error('No dashboard data available. Call getDashboardData() first.');
    }

    if (format === 'csv') {
      return this.convertToCSV(this.dashboardData);
    }

    return this.dashboardData;
  }

  /**
   * Convert dashboard data to CSV format
   * @param {Object} data - Dashboard data
   * @returns {string} CSV data
   */
  convertToCSV(data) {
    const csvRows = [];
    
    // Add overview data
    csvRows.push('Metric,Value');
    csvRows.push(`Total Threats,${data.overview.totalThreats}`);
    csvRows.push(`Total Events,${data.overview.totalEvents}`);
    csvRows.push(`Compliance Score,${data.overview.complianceScore}`);
    csvRows.push(`Total Cost,${data.overview.totalCost}`);
    
    return csvRows.join('\n');
  }
}

// Export singleton instance
export const securityAnalyticsDashboard = new SecurityAnalyticsDashboard();

export default SecurityAnalyticsDashboard;
