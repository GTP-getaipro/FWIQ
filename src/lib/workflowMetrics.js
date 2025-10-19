/**
 * Workflow Metrics Dashboard
 * Comprehensive metrics aggregation and dashboard data management
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { workflowAnalytics } from './workflowAnalytics.js';
import { workflowOptimizationRecommendations } from './workflowOptimizationRecommendations.js';
import { workflowCollaboration } from './workflowCollaboration.js';
import { workflowBenchmarking } from './workflowBenchmarking.js';

export class WorkflowMetrics {
  constructor() {
    this.metricsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.dashboardCache = new Map();
    this.dashboardCacheTimeout = 2 * 60 * 1000; // 2 minutes
  }

  /**
   * Get comprehensive workflow metrics dashboard
   * @param {string} userId - User identifier
   * @param {Object} options - Dashboard options
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getWorkflowMetricsDashboard(userId, options = {}) {
    try {
      const {
        timeRange = '7d',
        includeRecommendations = true,
        includeBenchmarks = true,
        includeCollaboration = true,
        includeTrends = true
      } = options;

      const cacheKey = `dashboard_${userId}_${timeRange}_${JSON.stringify(options)}`;
      
      // Check cache first
      if (this.dashboardCache.has(cacheKey)) {
        const cached = this.dashboardCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.dashboardCacheTimeout) {
          return cached.data;
        }
      }

      logger.info('Generating workflow metrics dashboard', { userId, timeRange });

      // Get user's workflows
      const workflows = await this.getUserWorkflows(userId);
      
      if (workflows.length === 0) {
        return this.getEmptyDashboard();
      }

      // Gather comprehensive metrics for all workflows
      const dashboardData = await this.gatherDashboardData(workflows, {
        timeRange,
        includeRecommendations,
        includeBenchmarks,
        includeCollaboration,
        includeTrends
      });

      const dashboard = {
        userId,
        timeRange,
        generatedAt: new Date().toISOString(),
        summary: this.generateDashboardSummary(dashboardData),
        workflows: dashboardData.workflows,
        overallMetrics: dashboardData.overallMetrics,
        trends: includeTrends ? dashboardData.trends : null,
        recommendations: includeRecommendations ? dashboardData.recommendations : null,
        benchmarks: includeBenchmarks ? dashboardData.benchmarks : null,
        collaboration: includeCollaboration ? dashboardData.collaboration : null,
        alerts: this.generateAlerts(dashboardData),
        insights: this.generateInsights(dashboardData)
      };

      // Cache the result
      this.dashboardCache.set(cacheKey, {
        data: dashboard,
        timestamp: Date.now()
      });

      logger.info('Workflow metrics dashboard generated', { 
        userId, 
        workflowCount: workflows.length,
        alertCount: dashboard.alerts.length,
        insightCount: dashboard.insights.length
      });

      return dashboard;
    } catch (error) {
      logger.error('Error generating workflow metrics dashboard', { 
        error: error.message, 
        userId 
      });
      return this.getEmptyDashboard();
    }
  }

  /**
   * Get workflow performance summary
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Performance summary
   */
  async getWorkflowPerformanceSummary(userId, timeRange = '7d') {
    try {
      const workflows = await this.getUserWorkflows(userId);
      
      if (workflows.length === 0) {
        return this.getDefaultPerformanceSummary();
      }

      const performanceData = await Promise.all(
        workflows.map(async (workflow) => {
          const analytics = await workflowAnalytics.getWorkflowAnalytics(workflow.id, timeRange);
          const efficiencyScore = await workflowAnalytics.getWorkflowEfficiencyScore(workflow.id);
          
          return {
            workflowId: workflow.id,
            workflowName: workflow.name,
            ...analytics,
            efficiencyScore
          };
        })
      );

      const summary = this.calculatePerformanceSummary(performanceData);
      
      return {
        userId,
        timeRange,
        generatedAt: new Date().toISOString(),
        ...summary,
        workflows: performanceData
      };
    } catch (error) {
      logger.error('Error getting workflow performance summary', { 
        error: error.message, 
        userId 
      });
      return this.getDefaultPerformanceSummary();
    }
  }

  /**
   * Get workflow health metrics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Health metrics
   */
  async getWorkflowHealthMetrics(userId, timeRange = '7d') {
    try {
      const workflows = await this.getUserWorkflows(userId);
      
      if (workflows.length === 0) {
        return this.getDefaultHealthMetrics();
      }

      const healthData = await Promise.all(
        workflows.map(async (workflow) => {
          const [
            analytics,
            errorAnalysis,
            bottlenecks,
            utilization
          ] = await Promise.all([
            workflowAnalytics.getWorkflowAnalytics(workflow.id, timeRange),
            workflowAnalytics.getWorkflowErrorAnalysis(workflow.id, timeRange),
            workflowAnalytics.getWorkflowBottlenecks(workflow.id, timeRange),
            workflowAnalytics.getWorkflowUtilization(workflow.id, timeRange)
          ]);

          const healthScore = this.calculateHealthScore({
            analytics,
            errorAnalysis,
            bottlenecks,
            utilization
          });

          return {
            workflowId: workflow.id,
            workflowName: workflow.name,
            healthScore,
            status: this.determineHealthStatus(healthScore),
            analytics,
            errorAnalysis,
            bottlenecks,
            utilization
          };
        })
      );

      const overallHealth = this.calculateOverallHealth(healthData);

      return {
        userId,
        timeRange,
        generatedAt: new Date().toISOString(),
        overallHealth,
        workflows: healthData,
        healthDistribution: this.calculateHealthDistribution(healthData),
        criticalIssues: this.identifyCriticalIssues(healthData)
      };
    } catch (error) {
      logger.error('Error getting workflow health metrics', { 
        error: error.message, 
        userId 
      });
      return this.getDefaultHealthMetrics();
    }
  }

  /**
   * Get workflow utilization metrics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Utilization metrics
   */
  async getWorkflowUtilizationMetrics(userId, timeRange = '7d') {
    try {
      const workflows = await this.getUserWorkflows(userId);
      
      if (workflows.length === 0) {
        return this.getDefaultUtilizationMetrics();
      }

      const utilizationData = await Promise.all(
        workflows.map(async (workflow) => {
          const [
            analytics,
            utilization,
            throughput
          ] = await Promise.all([
            workflowAnalytics.getWorkflowAnalytics(workflow.id, timeRange),
            workflowAnalytics.getWorkflowUtilization(workflow.id, timeRange),
            workflowAnalytics.getWorkflowThroughput(workflow.id, timeRange)
          ]);

          return {
            workflowId: workflow.id,
            workflowName: workflow.name,
            utilization: utilization.utilizationRate,
            throughput: throughput.emailsPerSecond,
            executionCount: analytics.totalExecutions,
            averageExecutionTime: analytics.averageExecutionTime,
            efficiency: this.calculateEfficiency(utilization.utilizationRate, throughput.emailsPerSecond)
          };
        })
      );

      const overallUtilization = this.calculateOverallUtilization(utilizationData);

      return {
        userId,
        timeRange,
        generatedAt: new Date().toISOString(),
        overallUtilization,
        workflows: utilizationData,
        utilizationTrends: this.calculateUtilizationTrends(utilizationData),
        optimizationOpportunities: this.identifyOptimizationOpportunities(utilizationData)
      };
    } catch (error) {
      logger.error('Error getting workflow utilization metrics', { 
        error: error.message, 
        userId 
      });
      return this.getDefaultUtilizationMetrics();
    }
  }

  /**
   * Get workflow cost metrics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Cost metrics
   */
  async getWorkflowCostMetrics(userId, timeRange = '7d') {
    try {
      const workflows = await this.getUserWorkflows(userId);
      
      if (workflows.length === 0) {
        return this.getDefaultCostMetrics();
      }

      const costData = await Promise.all(
        workflows.map(async (workflow) => {
          const [
            analytics,
            errorAnalysis,
            utilization
          ] = await Promise.all([
            workflowAnalytics.getWorkflowAnalytics(workflow.id, timeRange),
            workflowAnalytics.getWorkflowErrorAnalysis(workflow.id, timeRange),
            workflowAnalytics.getWorkflowUtilization(workflow.id, timeRange)
          ]);

          const costMetrics = this.calculateWorkflowCosts({
            analytics,
            errorAnalysis,
            utilization
          });

          return {
            workflowId: workflow.id,
            workflowName: workflow.name,
            ...costMetrics
          };
        })
      );

      const overallCosts = this.calculateOverallCosts(costData);

      return {
        userId,
        timeRange,
        generatedAt: new Date().toISOString(),
        overallCosts,
        workflows: costData,
        costTrends: this.calculateCostTrends(costData),
        costOptimization: this.identifyCostOptimization(costData)
      };
    } catch (error) {
      logger.error('Error getting workflow cost metrics', { 
        error: error.message, 
        userId 
      });
      return this.getDefaultCostMetrics();
    }
  }

  /**
   * Get user workflows
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} User workflows
   */
  async getUserWorkflows(userId) {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('id, name, description, status, created_at, updated_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting user workflows', { 
        error: error.message, 
        userId 
      });
      return [];
    }
  }

  /**
   * Gather comprehensive dashboard data
   * @param {Array} workflows - Workflow list
   * @param {Object} options - Options
   * @returns {Promise<Object>} Dashboard data
   */
  async gatherDashboardData(workflows, options) {
    const { timeRange, includeRecommendations, includeBenchmarks, includeCollaboration, includeTrends } = options;

    const workflowData = await Promise.all(
      workflows.map(async (workflow) => {
        const [
          analytics,
          trends,
          bottlenecks,
          errorAnalysis,
          utilization,
          throughput
        ] = await Promise.all([
          workflowAnalytics.getWorkflowAnalytics(workflow.id, timeRange),
          includeTrends ? workflowAnalytics.getWorkflowTrends(workflow.id, timeRange) : null,
          workflowAnalytics.getWorkflowBottlenecks(workflow.id, timeRange),
          workflowAnalytics.getWorkflowErrorAnalysis(workflow.id, timeRange),
          workflowAnalytics.getWorkflowUtilization(workflow.id, timeRange),
          workflowAnalytics.getWorkflowThroughput(workflow.id, timeRange)
        ]);

        const workflowMetrics = {
          workflowId: workflow.id,
          workflowName: workflow.name,
          analytics,
          trends,
          bottlenecks,
          errorAnalysis,
          utilization,
          throughput,
          healthScore: this.calculateHealthScore({ analytics, errorAnalysis, bottlenecks, utilization }),
          efficiencyScore: await workflowAnalytics.getWorkflowEfficiencyScore(workflow.id)
        };

        // Add optional data
        if (includeRecommendations) {
          workflowMetrics.recommendations = await workflowOptimizationRecommendations.getOptimizationRecommendations(workflow.id, timeRange);
        }

        if (includeBenchmarks) {
          workflowMetrics.benchmark = await workflowBenchmarking.runWorkflowBenchmark(workflow.id, { timeRange, includeComparison: false });
        }

        if (includeCollaboration) {
          workflowMetrics.collaboration = await workflowCollaboration.getCollaborationStats(workflow.id);
        }

        return workflowMetrics;
      })
    );

    return {
      workflows: workflowData,
      overallMetrics: this.calculateOverallMetrics(workflowData),
      trends: includeTrends ? this.calculateOverallTrends(workflowData) : null,
      recommendations: includeRecommendations ? this.aggregateRecommendations(workflowData) : null,
      benchmarks: includeBenchmarks ? this.aggregateBenchmarks(workflowData) : null,
      collaboration: includeCollaboration ? this.aggregateCollaboration(workflowData) : null
    };
  }

  /**
   * Generate dashboard summary
   * @param {Object} dashboardData - Dashboard data
   * @returns {Object} Summary
   */
  generateDashboardSummary(dashboardData) {
    const { workflows, overallMetrics } = dashboardData;
    
    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.analytics.totalExecutions > 0).length,
      totalExecutions: overallMetrics.totalExecutions,
      averageSuccessRate: overallMetrics.averageSuccessRate,
      averageExecutionTime: overallMetrics.averageExecutionTime,
      totalEmailsProcessed: overallMetrics.totalEmailsProcessed,
      totalResponsesGenerated: overallMetrics.totalResponsesGenerated,
      averageEfficiencyScore: overallMetrics.averageEfficiencyScore,
      averageHealthScore: overallMetrics.averageHealthScore,
      criticalIssues: workflows.filter(w => w.healthScore < 70).length,
      optimizationOpportunities: workflows.filter(w => w.efficiencyScore < 80).length
    };
  }

  /**
   * Calculate overall metrics
   * @param {Array} workflowData - Workflow data
   * @returns {Object} Overall metrics
   */
  calculateOverallMetrics(workflowData) {
    if (workflowData.length === 0) {
      return this.getDefaultOverallMetrics();
    }

    const totalExecutions = workflowData.reduce((sum, w) => sum + w.analytics.totalExecutions, 0);
    const totalSuccessfulExecutions = workflowData.reduce((sum, w) => sum + w.analytics.successfulExecutions, 0);
    const totalExecutionTime = workflowData.reduce((sum, w) => sum + w.analytics.totalExecutionTime, 0);
    const totalEmailsProcessed = workflowData.reduce((sum, w) => sum + w.analytics.totalEmailsProcessed, 0);
    const totalResponsesGenerated = workflowData.reduce((sum, w) => sum + w.analytics.totalResponsesGenerated, 0);

    return {
      totalExecutions,
      totalSuccessfulExecutions,
      totalFailedExecutions: totalExecutions - totalSuccessfulExecutions,
      averageSuccessRate: totalExecutions > 0 ? (totalSuccessfulExecutions / totalExecutions) * 100 : 0,
      averageExecutionTime: totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0,
      totalEmailsProcessed,
      totalResponsesGenerated,
      averageEfficiencyScore: workflowData.reduce((sum, w) => sum + w.efficiencyScore, 0) / workflowData.length,
      averageHealthScore: workflowData.reduce((sum, w) => sum + w.healthScore, 0) / workflowData.length
    };
  }

  /**
   * Calculate health score
   * @param {Object} data - Health data
   * @returns {number} Health score (0-100)
   */
  calculateHealthScore(data) {
    const { analytics, errorAnalysis, bottlenecks, utilization } = data;
    
    let score = 100;
    
    // Deduct points for errors
    score -= errorAnalysis.errorRate * 2; // -2 points per 1% error rate
    
    // Deduct points for bottlenecks
    const highSeverityBottlenecks = bottlenecks.filter(b => b.severity === 'high').length;
    score -= highSeverityBottlenecks * 10; // -10 points per high severity bottleneck
    
    // Deduct points for low utilization
    if (utilization.utilizationRate < 70) {
      score -= (70 - utilization.utilizationRate) * 0.5; // -0.5 points per 1% below 70%
    }
    
    // Deduct points for low success rate
    if (analytics.successRate < 95) {
      score -= (95 - analytics.successRate) * 0.5; // -0.5 points per 1% below 95%
    }
    
    return Math.max(Math.round(score), 0);
  }

  /**
   * Determine health status
   * @param {number} healthScore - Health score
   * @returns {string} Health status
   */
  determineHealthStatus(healthScore) {
    if (healthScore >= 90) return 'excellent';
    if (healthScore >= 80) return 'good';
    if (healthScore >= 70) return 'fair';
    if (healthScore >= 60) return 'poor';
    return 'critical';
  }

  /**
   * Calculate efficiency
   * @param {number} utilization - Utilization rate
   * @param {number} throughput - Throughput rate
   * @returns {number} Efficiency score
   */
  calculateEfficiency(utilization, throughput) {
    return Math.round((utilization + throughput * 10) / 2); // Normalize throughput
  }

  /**
   * Generate alerts
   * @param {Object} dashboardData - Dashboard data
   * @returns {Array} Alerts
   */
  generateAlerts(dashboardData) {
    const alerts = [];
    const { workflows } = dashboardData;

    workflows.forEach(workflow => {
      // Health alerts
      if (workflow.healthScore < 70) {
        alerts.push({
          type: 'health',
          severity: workflow.healthScore < 50 ? 'critical' : 'warning',
          workflowId: workflow.workflowId,
          workflowName: workflow.workflowName,
          message: `Workflow health score is ${workflow.healthScore}%`,
          recommendation: 'Review workflow performance and address critical issues'
        });
      }

      // Error rate alerts
      if (workflow.errorAnalysis.errorRate > 10) {
        alerts.push({
          type: 'error_rate',
          severity: workflow.errorAnalysis.errorRate > 20 ? 'critical' : 'warning',
          workflowId: workflow.workflowId,
          workflowName: workflow.workflowName,
          message: `Error rate is ${workflow.errorAnalysis.errorRate}%`,
          recommendation: 'Implement better error handling and retry mechanisms'
        });
      }

      // Bottleneck alerts
      const highSeverityBottlenecks = workflow.bottlenecks.filter(b => b.severity === 'high');
      if (highSeverityBottlenecks.length > 0) {
        alerts.push({
          type: 'bottleneck',
          severity: 'warning',
          workflowId: workflow.workflowId,
          workflowName: workflow.workflowName,
          message: `${highSeverityBottlenecks.length} high severity bottlenecks detected`,
          recommendation: 'Optimize slow-performing nodes and operations'
        });
      }

      // Efficiency alerts
      if (workflow.efficiencyScore < 70) {
        alerts.push({
          type: 'efficiency',
          severity: workflow.efficiencyScore < 50 ? 'critical' : 'warning',
          workflowId: workflow.workflowId,
          workflowName: workflow.workflowName,
          message: `Efficiency score is ${workflow.efficiencyScore}%`,
          recommendation: 'Optimize workflow execution time and success rate'
        });
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Generate insights
   * @param {Object} dashboardData - Dashboard data
   * @returns {Array} Insights
   */
  generateInsights(dashboardData) {
    const insights = [];
    const { workflows, overallMetrics } = dashboardData;

    // Performance insights
    if (overallMetrics.averageSuccessRate > 95) {
      insights.push({
        type: 'performance',
        category: 'success_rate',
        message: `Excellent overall success rate of ${overallMetrics.averageSuccessRate.toFixed(1)}%`,
        impact: 'positive',
        recommendation: 'Maintain current practices and consider sharing best practices'
      });
    }

    // Throughput insights
    if (overallMetrics.totalEmailsProcessed > 1000) {
      insights.push({
        type: 'throughput',
        category: 'volume',
        message: `High volume processing: ${overallMetrics.totalEmailsProcessed} emails processed`,
        impact: 'positive',
        recommendation: 'Consider implementing additional monitoring for high-volume workflows'
      });
    }

    // Efficiency insights
    const efficientWorkflows = workflows.filter(w => w.efficiencyScore > 90);
    if (efficientWorkflows.length > workflows.length / 2) {
      insights.push({
        type: 'efficiency',
        category: 'optimization',
        message: `${efficientWorkflows.length} workflows are highly efficient`,
        impact: 'positive',
        recommendation: 'Use efficient workflows as templates for optimization'
      });
    }

    // Health insights
    const healthyWorkflows = workflows.filter(w => w.healthScore > 85);
    if (healthyWorkflows.length === workflows.length) {
      insights.push({
        type: 'health',
        category: 'overall',
        message: 'All workflows are in excellent health',
        impact: 'positive',
        recommendation: 'Continue monitoring and maintain current practices'
      });
    }

    return insights;
  }

  /**
   * Clear metrics cache
   */
  clearCache() {
    this.metricsCache.clear();
    this.dashboardCache.clear();
    logger.info('Workflow metrics cache cleared');
  }

  // Default methods
  getEmptyDashboard() {
    return {
      userId: null,
      timeRange: '7d',
      generatedAt: new Date().toISOString(),
      summary: {
        totalWorkflows: 0,
        activeWorkflows: 0,
        totalExecutions: 0,
        averageSuccessRate: 0,
        averageExecutionTime: 0,
        totalEmailsProcessed: 0,
        totalResponsesGenerated: 0,
        averageEfficiencyScore: 0,
        averageHealthScore: 0,
        criticalIssues: 0,
        optimizationOpportunities: 0
      },
      workflows: [],
      overallMetrics: this.getDefaultOverallMetrics(),
      trends: null,
      recommendations: null,
      benchmarks: null,
      collaboration: null,
      alerts: [],
      insights: []
    };
  }

  getDefaultOverallMetrics() {
    return {
      totalExecutions: 0,
      totalSuccessfulExecutions: 0,
      totalFailedExecutions: 0,
      averageSuccessRate: 0,
      averageExecutionTime: 0,
      totalEmailsProcessed: 0,
      totalResponsesGenerated: 0,
      averageEfficiencyScore: 0,
      averageHealthScore: 0
    };
  }

  getDefaultPerformanceSummary() {
    return {
      userId: null,
      timeRange: '7d',
      generatedAt: new Date().toISOString(),
      totalWorkflows: 0,
      activeWorkflows: 0,
      totalExecutions: 0,
      averageSuccessRate: 0,
      averageExecutionTime: 0,
      averageEfficiencyScore: 0,
      workflows: []
    };
  }

  getDefaultHealthMetrics() {
    return {
      userId: null,
      timeRange: '7d',
      generatedAt: new Date().toISOString(),
      overallHealth: {
        score: 0,
        status: 'unknown',
        distribution: { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 }
      },
      workflows: [],
      healthDistribution: { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 },
      criticalIssues: []
    };
  }

  getDefaultUtilizationMetrics() {
    return {
      userId: null,
      timeRange: '7d',
      generatedAt: new Date().toISOString(),
      overallUtilization: {
        averageUtilization: 0,
        averageThroughput: 0,
        averageEfficiency: 0
      },
      workflows: [],
      utilizationTrends: [],
      optimizationOpportunities: []
    };
  }

  getDefaultCostMetrics() {
    return {
      userId: null,
      timeRange: '7d',
      generatedAt: new Date().toISOString(),
      overallCosts: {
        totalCost: 0,
        averageCostPerExecution: 0,
        costPerEmail: 0,
        costPerResponse: 0
      },
      workflows: [],
      costTrends: [],
      costOptimization: []
    };
  }
}

// Export singleton instance
export const workflowMetrics = new WorkflowMetrics();
export default WorkflowMetrics;
