/**
 * Security Optimization Recommendations Engine
 * Intelligent recommendations for security improvements and optimizations
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { securityManager } from './security.js';
import { securityAnalyticsDashboard } from './securityAnalyticsDashboard.js';
import { securityCostTracking } from './securityCostTracking.js';
import { securityComplianceReporting } from './securityComplianceReporting.js';

export class SecurityOptimizationRecommendations {
  constructor() {
    this.recommendationTypes = {
      'cost_optimization': 'Cost Optimization',
      'performance_improvement': 'Performance Improvement',
      'compliance_enhancement': 'Compliance Enhancement',
      'threat_prevention': 'Threat Prevention',
      'security_hardening': 'Security Hardening',
      'monitoring_improvement': 'Monitoring Improvement',
      'access_control': 'Access Control',
      'data_protection': 'Data Protection',
      'incident_response': 'Incident Response',
      'training_education': 'Training & Education'
    };
    
    this.priorityLevels = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    
    this.impactLevels = {
      'high': 'High Impact',
      'medium': 'Medium Impact',
      'low': 'Low Impact'
    };
    
    this.recommendations = null;
    this.lastGenerated = null;
  }

  /**
   * Generate comprehensive security optimization recommendations
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range for analysis
   * @returns {Promise<Object>} Optimization recommendations
   */
  async generateOptimizationRecommendations(userId, timeRange = '30d') {
    try {
      // Gather comprehensive security data
      const [
        analyticsData,
        costData,
        complianceData,
        securityStatus
      ] = await Promise.all([
        securityAnalyticsDashboard.getDashboardData(userId, timeRange),
        securityCostTracking.getSecurityCostAnalytics(userId, timeRange),
        securityComplianceReporting.generateComplianceReport(userId, ['gdpr', 'ccpa'], timeRange),
        securityManager.getSecurityStatus()
      ]);

      // Generate recommendations based on different aspects
      const recommendations = await Promise.all([
        this.generateCostOptimizationRecommendations(costData),
        this.generatePerformanceRecommendations(analyticsData),
        this.generateComplianceRecommendations(complianceData),
        this.generateThreatPreventionRecommendations(analyticsData),
        this.generateSecurityHardeningRecommendations(securityStatus),
        this.generateMonitoringRecommendations(analyticsData),
        this.generateAccessControlRecommendations(securityStatus),
        this.generateDataProtectionRecommendations(securityStatus),
        this.generateIncidentResponseRecommendations(analyticsData),
        this.generateTrainingRecommendations(analyticsData)
      ]);

      // Flatten and prioritize recommendations
      const allRecommendations = recommendations.flat();
      const prioritizedRecommendations = this.prioritizeRecommendations(allRecommendations);
      
      // Calculate optimization score
      const optimizationScore = this.calculateOptimizationScore(prioritizedRecommendations);
      
      // Generate implementation roadmap
      const roadmap = this.generateImplementationRoadmap(prioritizedRecommendations);

      const result = {
        userId,
        timeRange,
        optimizationScore,
        recommendations: prioritizedRecommendations,
        roadmap,
        summary: this.generateRecommendationSummary(prioritizedRecommendations),
        generatedAt: new Date().toISOString(),
        recommendationId: this.generateRecommendationId()
      };

      this.recommendations = result;
      this.lastGenerated = new Date();
      
      // Store recommendations
      await this.storeRecommendations(userId, result);
      
      logger.info('Security optimization recommendations generated', {
        userId,
        timeRange,
        recommendationCount: prioritizedRecommendations.length,
        optimizationScore,
        recommendationId: result.recommendationId
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate optimization recommendations', {
        userId,
        timeRange,
        error: error.message
      });
      
      return this.getDefaultRecommendations();
    }
  }

  /**
   * Generate cost optimization recommendations
   * @param {Object} costData - Cost analytics data
   * @returns {Promise<Array>} Cost optimization recommendations
   */
  async generateCostOptimizationRecommendations(costData) {
    const recommendations = [];

    // High cost categories
    if (costData.topCategories) {
      costData.topCategories.forEach(category => {
        if (category.percentage > 30) {
          recommendations.push({
            type: 'cost_optimization',
            priority: 'high',
            impact: 'high',
            title: `Optimize ${category.displayName} Costs`,
            description: `${category.displayName} accounts for ${category.percentage.toFixed(1)}% of security costs`,
            action: `Review and optimize ${category.displayName} spending`,
            potentialSavings: `Up to ${Math.round(category.amount * 0.2)} ${costData.currency || 'USD'}`,
            implementationEffort: 'medium',
            timeframe: '30-60 days',
            category: 'cost_optimization'
          });
        }
      });
    }

    // Rising cost trends
    if (costData.trends && costData.trends.trend === 'increasing' && costData.trends.percentage > 20) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'medium',
        impact: 'medium',
        title: 'Address Rising Security Costs',
        description: `Security costs have increased by ${costData.trends.percentage}%`,
        action: 'Implement cost controls and budget monitoring',
        potentialSavings: `Up to ${Math.round(costData.totalCost * 0.15)} ${costData.currency || 'USD'}`,
        implementationEffort: 'low',
        timeframe: '14-30 days',
        category: 'cost_optimization'
      });
    }

    // Low efficiency score
    if (costData.efficiencyMetrics && costData.efficiencyMetrics.efficiencyScore < 70) {
      recommendations.push({
        type: 'cost_optimization',
        priority: 'high',
        impact: 'high',
        title: 'Improve Cost Efficiency',
        description: `Cost efficiency score is ${costData.efficiencyMetrics.efficiencyScore}/100`,
        action: 'Optimize security spending and improve cost management processes',
        potentialSavings: `Up to ${Math.round(costData.totalCost * 0.25)} ${costData.currency || 'USD'}`,
        implementationEffort: 'high',
        timeframe: '60-90 days',
        category: 'cost_optimization'
      });
    }

    return recommendations;
  }

  /**
   * Generate performance recommendations
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<Array>} Performance recommendations
   */
  async generatePerformanceRecommendations(analyticsData) {
    const recommendations = [];

    // High threat detection rates
    if (analyticsData.threatDetection && analyticsData.threatDetection.totalThreats > 50) {
      recommendations.push({
        type: 'performance_improvement',
        priority: 'medium',
        impact: 'medium',
        title: 'Optimize Threat Detection Performance',
        description: `${analyticsData.threatDetection.totalThreats} threats detected - consider tuning detection rules`,
        action: 'Review and optimize threat detection rules and thresholds',
        potentialSavings: 'Improved detection accuracy and reduced false positives',
        implementationEffort: 'medium',
        timeframe: '30-45 days',
        category: 'performance_improvement'
      });
    }

    // High security event volume
    if (analyticsData.securityEvents && analyticsData.securityEvents.totalEvents > 100) {
      recommendations.push({
        type: 'performance_improvement',
        priority: 'medium',
        impact: 'medium',
        title: 'Optimize Security Event Processing',
        description: `${analyticsData.securityEvents.totalEvents} security events processed`,
        action: 'Implement event filtering and prioritization',
        potentialSavings: 'Reduced processing overhead and improved response times',
        implementationEffort: 'medium',
        timeframe: '30-60 days',
        category: 'performance_improvement'
      });
    }

    return recommendations;
  }

  /**
   * Generate compliance recommendations
   * @param {Object} complianceData - Compliance data
   * @returns {Promise<Array>} Compliance recommendations
   */
  async generateComplianceRecommendations(complianceData) {
    const recommendations = [];

    // Low compliance scores
    if (complianceData.overallScore < 80) {
      recommendations.push({
        type: 'compliance_enhancement',
        priority: 'high',
        impact: 'high',
        title: 'Improve Overall Compliance',
        description: `Overall compliance score is ${complianceData.overallScore}%`,
        action: 'Address compliance gaps and implement missing controls',
        potentialSavings: 'Reduced compliance risk and potential penalties',
        implementationEffort: 'high',
        timeframe: '90-120 days',
        category: 'compliance_enhancement'
      });
    }

    // Framework-specific recommendations
    if (complianceData.frameworks) {
      complianceData.frameworks.forEach(framework => {
        if (framework.status === 'non_compliant') {
          recommendations.push({
            type: 'compliance_enhancement',
            priority: 'critical',
            impact: 'high',
            title: `Address ${framework.name} Non-Compliance`,
            description: `${framework.name} compliance score is ${framework.score}%`,
            action: `Implement missing ${framework.name} controls`,
            potentialSavings: 'Compliance with regulatory requirements',
            implementationEffort: 'high',
            timeframe: '60-90 days',
            category: 'compliance_enhancement'
          });
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate threat prevention recommendations
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<Array>} Threat prevention recommendations
   */
  async generateThreatPreventionRecommendations(analyticsData) {
    const recommendations = [];

    // High threat volume
    if (analyticsData.threatDetection && analyticsData.threatDetection.totalThreats > 20) {
      recommendations.push({
        type: 'threat_prevention',
        priority: 'high',
        impact: 'high',
        title: 'Enhance Threat Prevention',
        description: `${analyticsData.threatDetection.totalThreats} threats detected`,
        action: 'Implement additional preventive security measures',
        potentialSavings: 'Reduced threat exposure and incident response costs',
        implementationEffort: 'high',
        timeframe: '60-90 days',
        category: 'threat_prevention'
      });
    }

    // Specific threat types
    if (analyticsData.threatDetection && analyticsData.threatDetection.threatsByType) {
      Object.entries(analyticsData.threatDetection.threatsByType).forEach(([type, count]) => {
        if (count > 5) {
          recommendations.push({
            type: 'threat_prevention',
            priority: 'medium',
            impact: 'medium',
            title: `Address ${type} Threats`,
            description: `${count} ${type} threats detected`,
            action: `Implement specific controls for ${type} threat prevention`,
            potentialSavings: 'Reduced specific threat exposure',
            implementationEffort: 'medium',
            timeframe: '30-60 days',
            category: 'threat_prevention'
          });
        }
      });
    }

    return recommendations;
  }

  /**
   * Generate security hardening recommendations
   * @param {Object} securityStatus - Security status
   * @returns {Promise<Array>} Security hardening recommendations
   */
  async generateSecurityHardeningRecommendations(securityStatus) {
    const recommendations = [];

    // Missing basic security controls
    if (!securityStatus.basicSecurity?.cspConfigured) {
      recommendations.push({
        type: 'security_hardening',
        priority: 'high',
        impact: 'high',
        title: 'Implement Content Security Policy',
        description: 'Content Security Policy not configured',
        action: 'Configure and implement CSP headers',
        potentialSavings: 'Protection against XSS attacks',
        implementationEffort: 'low',
        timeframe: '7-14 days',
        category: 'security_hardening'
      });
    }

    if (!securityStatus.basicSecurity?.rateLimitingConfigured) {
      recommendations.push({
        type: 'security_hardening',
        priority: 'high',
        impact: 'medium',
        title: 'Implement Rate Limiting',
        description: 'Rate limiting not configured',
        action: 'Configure rate limiting for API endpoints',
        potentialSavings: 'Protection against brute force attacks',
        implementationEffort: 'medium',
        timeframe: '14-30 days',
        category: 'security_hardening'
      });
    }

    // Missing advanced security features
    if (!securityStatus.advancedSecurity?.auditLogging) {
      recommendations.push({
        type: 'security_hardening',
        priority: 'medium',
        impact: 'medium',
        title: 'Enable Audit Logging',
        description: 'Audit logging not enabled',
        action: 'Implement comprehensive audit logging',
        potentialSavings: 'Better security visibility and compliance',
        implementationEffort: 'medium',
        timeframe: '30-45 days',
        category: 'security_hardening'
      });
    }

    return recommendations;
  }

  /**
   * Generate monitoring recommendations
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<Array>} Monitoring recommendations
   */
  async generateMonitoringRecommendations(analyticsData) {
    const recommendations = [];

    // High event volume without proper monitoring
    if (analyticsData.securityEvents && analyticsData.securityEvents.totalEvents > 50) {
      recommendations.push({
        type: 'monitoring_improvement',
        priority: 'medium',
        impact: 'medium',
        title: 'Enhance Security Monitoring',
        description: `${analyticsData.securityEvents.totalEvents} security events need monitoring`,
        action: 'Implement advanced security monitoring and alerting',
        potentialSavings: 'Faster incident detection and response',
        implementationEffort: 'high',
        timeframe: '60-90 days',
        category: 'monitoring_improvement'
      });
    }

    return recommendations;
  }

  /**
   * Generate access control recommendations
   * @param {Object} securityStatus - Security status
   * @returns {Promise<Array>} Access control recommendations
   */
  async generateAccessControlRecommendations(securityStatus) {
    const recommendations = [];

    // Missing access control features
    if (!securityStatus.advancedSecurity?.securityMonitoring) {
      recommendations.push({
        type: 'access_control',
        priority: 'medium',
        impact: 'medium',
        title: 'Implement Access Control Monitoring',
        description: 'Access control monitoring not active',
        action: 'Implement comprehensive access control monitoring',
        potentialSavings: 'Better access control visibility and compliance',
        implementationEffort: 'medium',
        timeframe: '30-60 days',
        category: 'access_control'
      });
    }

    return recommendations;
  }

  /**
   * Generate data protection recommendations
   * @param {Object} securityStatus - Security status
   * @returns {Promise<Array>} Data protection recommendations
   */
  async generateDataProtectionRecommendations(securityStatus) {
    const recommendations = [];

    // Missing data encryption
    if (!securityStatus.advancedSecurity?.dataEncryption) {
      recommendations.push({
        type: 'data_protection',
        priority: 'high',
        impact: 'high',
        title: 'Implement Data Encryption',
        description: 'Data encryption not implemented',
        action: 'Implement comprehensive data encryption at rest and in transit',
        potentialSavings: 'Protection against data breaches',
        implementationEffort: 'high',
        timeframe: '60-90 days',
        category: 'data_protection'
      });
    }

    return recommendations;
  }

  /**
   * Generate incident response recommendations
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<Array>} Incident response recommendations
   */
  async generateIncidentResponseRecommendations(analyticsData) {
    const recommendations = [];

    // High incident volume
    if (analyticsData.securityEvents && analyticsData.securityEvents.totalEvents > 30) {
      recommendations.push({
        type: 'incident_response',
        priority: 'medium',
        impact: 'medium',
        title: 'Improve Incident Response',
        description: `${analyticsData.securityEvents.totalEvents} security events require response`,
        action: 'Implement automated incident response workflows',
        potentialSavings: 'Faster incident resolution and reduced impact',
        implementationEffort: 'high',
        timeframe: '60-90 days',
        category: 'incident_response'
      });
    }

    return recommendations;
  }

  /**
   * Generate training recommendations
   * @param {Object} analyticsData - Analytics data
   * @returns {Promise<Array>} Training recommendations
   */
  async generateTrainingRecommendations(analyticsData) {
    const recommendations = [];

    // High threat or event volume suggests need for training
    const totalThreats = analyticsData.threatDetection?.totalThreats || 0;
    const totalEvents = analyticsData.securityEvents?.totalEvents || 0;

    if (totalThreats > 10 || totalEvents > 20) {
      recommendations.push({
        type: 'training_education',
        priority: 'low',
        impact: 'medium',
        title: 'Security Awareness Training',
        description: 'High security activity suggests need for user training',
        action: 'Implement security awareness training program',
        potentialSavings: 'Reduced human error and security incidents',
        implementationEffort: 'medium',
        timeframe: '30-60 days',
        category: 'training_education'
      });
    }

    return recommendations;
  }

  /**
   * Prioritize recommendations
   * @param {Array} recommendations - All recommendations
   * @returns {Array} Prioritized recommendations
   */
  prioritizeRecommendations(recommendations) {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const impactOrder = { 'high': 3, 'medium': 2, 'low': 1 };

    return recommendations.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by impact
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;

      // Finally by implementation effort (lower effort first)
      const effortOrder = { 'low': 1, 'medium': 2, 'high': 3 };
      return effortOrder[a.implementationEffort] - effortOrder[b.implementationEffort];
    });
  }

  /**
   * Calculate optimization score
   * @param {Array} recommendations - Prioritized recommendations
   * @returns {number} Optimization score
   */
  calculateOptimizationScore(recommendations) {
    if (recommendations.length === 0) return 100;

    const priorityWeights = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    const impactWeights = { 'high': 3, 'medium': 2, 'low': 1 };

    const totalWeight = recommendations.reduce((sum, rec) => {
      return sum + (priorityWeights[rec.priority] * impactWeights[rec.impact]);
    }, 0);

    const maxPossibleWeight = recommendations.length * 4 * 3; // Max priority * max impact
    const score = Math.round((totalWeight / maxPossibleWeight) * 100);

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate implementation roadmap
   * @param {Array} recommendations - Prioritized recommendations
   * @returns {Object} Implementation roadmap
   */
  generateImplementationRoadmap(recommendations) {
    const roadmap = {
      immediate: [], // 0-30 days
      shortTerm: [], // 30-60 days
      mediumTerm: [], // 60-90 days
      longTerm: [] // 90+ days
    };

    recommendations.forEach(rec => {
      const timeframe = rec.timeframe || '30-60 days';
      
      if (timeframe.includes('7-14') || timeframe.includes('14-30')) {
        roadmap.immediate.push(rec);
      } else if (timeframe.includes('30-45') || timeframe.includes('30-60')) {
        roadmap.shortTerm.push(rec);
      } else if (timeframe.includes('60-90')) {
        roadmap.mediumTerm.push(rec);
      } else {
        roadmap.longTerm.push(rec);
      }
    });

    return roadmap;
  }

  /**
   * Generate recommendation summary
   * @param {Array} recommendations - Prioritized recommendations
   * @returns {Object} Recommendation summary
   */
  generateRecommendationSummary(recommendations) {
    const summary = {
      total: recommendations.length,
      byPriority: {},
      byType: {},
      byImpact: {},
      estimatedSavings: 0,
      estimatedEffort: 'medium'
    };

    recommendations.forEach(rec => {
      // Count by priority
      summary.byPriority[rec.priority] = (summary.byPriority[rec.priority] || 0) + 1;
      
      // Count by type
      summary.byType[rec.type] = (summary.byType[rec.type] || 0) + 1;
      
      // Count by impact
      summary.byImpact[rec.impact] = (summary.byImpact[rec.impact] || 0) + 1;
      
      // Estimate savings (if available)
      if (rec.potentialSavings && typeof rec.potentialSavings === 'string' && rec.potentialSavings.includes('$')) {
        const savingsMatch = rec.potentialSavings.match(/\$(\d+)/);
        if (savingsMatch) {
          summary.estimatedSavings += parseInt(savingsMatch[1]);
        }
      }
    });

    // Estimate overall effort
    const effortCounts = recommendations.reduce((acc, rec) => {
      acc[rec.implementationEffort] = (acc[rec.implementationEffort] || 0) + 1;
      return acc;
    }, {});

    const maxEffort = Object.keys(effortCounts).reduce((a, b) => 
      effortCounts[a] > effortCounts[b] ? a : b
    );
    summary.estimatedEffort = maxEffort;

    return summary;
  }

  /**
   * Store recommendations
   * @param {string} userId - User ID
   * @param {Object} recommendations - Recommendations data
   */
  async storeRecommendations(userId, recommendations) {
    try {
      const { error } = await supabase
        .from('security_recommendations')
        .insert({
          user_id: userId,
          recommendation_id: recommendations.recommendationId,
          optimization_score: recommendations.optimizationScore,
          recommendation_data: recommendations,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to store recommendations', {
        userId,
        recommendationId: recommendations.recommendationId,
        error: error.message
      });
    }
  }

  /**
   * Generate unique recommendation ID
   * @returns {string} Recommendation ID
   */
  generateRecommendationId() {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default recommendations
   * @returns {Object} Default recommendations
   */
  getDefaultRecommendations() {
    return {
      userId: null,
      timeRange: '30d',
      optimizationScore: 0,
      recommendations: [],
      roadmap: {
        immediate: [],
        shortTerm: [],
        mediumTerm: [],
        longTerm: []
      },
      summary: {
        total: 0,
        byPriority: {},
        byType: {},
        byImpact: {},
        estimatedSavings: 0,
        estimatedEffort: 'medium'
      },
      generatedAt: new Date().toISOString(),
      recommendationId: this.generateRecommendationId()
    };
  }

  /**
   * Get recommendation types
   * @returns {Object} Recommendation types
   */
  getRecommendationTypes() {
    return this.recommendationTypes;
  }

  /**
   * Get priority levels
   * @returns {Object} Priority levels
   */
  getPriorityLevels() {
    return this.priorityLevels;
  }

  /**
   * Get impact levels
   * @returns {Object} Impact levels
   */
  getImpactLevels() {
    return this.impactLevels;
  }
}

// Export singleton instance
export const securityOptimizationRecommendations = new SecurityOptimizationRecommendations();

export default SecurityOptimizationRecommendations;
