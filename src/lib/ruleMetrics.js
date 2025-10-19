/**
 * Rule Metrics Dashboard
 * Comprehensive metrics aggregation and dashboard data for business rules
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { rulePerformanceAnalytics } from './rulePerformanceAnalytics.js';
import { ruleImpactAnalysis } from './ruleImpactAnalysis.js';
import { ruleTestingAutomation } from './ruleTestingAutomation.js';

export class RuleMetricsDashboard {
  constructor() {
    this.metricsCache = new Map();
    this.dashboardCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.refreshInterval = 60 * 1000; // 1 minute
    this.realTimeMetrics = new Map();
    this.metricThresholds = {
      performance: {
        excellent: 100,  // < 100ms
        good: 500,      // < 500ms
        acceptable: 1000, // < 1s
        poor: 2000      // > 2s
      },
      successRate: {
        excellent: 99,   // > 99%
        good: 95,       // > 95%
        acceptable: 90,  // > 90%
        poor: 80        // < 80%
      },
      triggerRate: {
        excellent: 80,   // > 80%
        good: 60,       // > 60%
        acceptable: 40,  // > 40%
        poor: 20        // < 20%
      }
    };
  }

  /**
   * Get comprehensive dashboard metrics
   * @param {string} userId - User identifier
   * @param {Object} options - Dashboard options
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboardMetrics(userId, options = {}) {
    try {
      const {
        timeRange = '24h',
        includePerformance = true,
        includeImpact = true,
        includeTesting = true,
        includeTrends = true,
        realTime = false
      } = options;

      const cacheKey = `dashboard_${userId}_${timeRange}_${JSON.stringify(options)}`;
      
      // Check cache first
      if (!realTime && this.dashboardCache.has(cacheKey)) {
        const cached = this.dashboardCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      logger.info('Generating dashboard metrics', { userId, timeRange });

      // Get all metrics in parallel
      const [
        ruleMetrics,
        performanceMetrics,
        impactMetrics,
        testingMetrics,
        trendMetrics,
        systemHealth
      ] = await Promise.all([
        this.getRuleMetrics(userId, timeRange),
        includePerformance ? this.getPerformanceMetrics(userId, timeRange) : null,
        includeImpact ? this.getImpactMetrics(userId, timeRange) : null,
        includeTesting ? this.getTestingMetrics(userId, timeRange) : null,
        includeTrends ? this.getTrendMetrics(userId, timeRange) : null,
        this.getSystemHealthMetrics(userId)
      ]);

      const dashboardData = {
        userId,
        generatedAt: new Date().toISOString(),
        timeRange,
        realTime,
        summary: this.generateSummaryMetrics(ruleMetrics, performanceMetrics, impactMetrics, testingMetrics),
        rules: ruleMetrics,
        performance: performanceMetrics,
        impact: impactMetrics,
        testing: testingMetrics,
        trends: trendMetrics,
        systemHealth,
        alerts: await this.generateAlerts(userId, ruleMetrics, performanceMetrics),
        recommendations: await this.generateRecommendations(userId, ruleMetrics, performanceMetrics, impactMetrics)
      };

      // Cache the result
      if (!realTime) {
        this.dashboardCache.set(cacheKey, {
          data: dashboardData,
          timestamp: Date.now()
        });
      }

      logger.info('Dashboard metrics generated successfully', { 
        userId, 
        rulesCount: ruleMetrics.length,
        alertsCount: dashboardData.alerts.length
      });

      return dashboardData;
    } catch (error) {
      logger.error('Error generating dashboard metrics', { error: error.message, userId });
      return this.getDefaultDashboardMetrics(userId);
    }
  }

  /**
   * Get rule metrics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Rule metrics
   */
  async getRuleMetrics(userId, timeRange) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ruleMetrics = await Promise.all(
        rules.map(async (rule) => {
          const performance = await rulePerformanceAnalytics.getRuleMetrics(rule.id, timeRange);
          const efficiency = await rulePerformanceAnalytics.getRuleEfficiencyScore(rule.id);
          
          return {
            id: rule.id,
            name: rule.name,
            enabled: rule.enabled,
            priority: rule.priority,
            category: rule.category || 'General',
            createdAt: rule.created_at,
            updatedAt: rule.updated_at,
            performance,
            efficiency,
            status: this.calculateRuleStatus(rule, performance),
            health: this.calculateRuleHealth(rule, performance, efficiency)
          };
        })
      );

      return ruleMetrics;
    } catch (error) {
      logger.error('Error getting rule metrics', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Get performance metrics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceMetrics(userId, timeRange) {
    try {
      const allRulesMetrics = await rulePerformanceAnalytics.getAllRulesMetrics(userId, timeRange);
      const benchmarks = await rulePerformanceAnalytics.getPerformanceBenchmarks(userId);
      const slowRules = await rulePerformanceAnalytics.getSlowPerformingRules(userId);

      return {
        summary: allRulesMetrics.summary,
        benchmarks,
        slowRules,
        performanceDistribution: this.calculatePerformanceDistribution(allRulesMetrics.rules),
        topPerformers: this.getTopPerformers(allRulesMetrics.rules),
        performanceAlerts: this.generatePerformanceAlerts(allRulesMetrics.rules, benchmarks)
      };
    } catch (error) {
      logger.error('Error getting performance metrics', { error: error.message, userId });
      return this.getDefaultPerformanceMetrics();
    }
  }

  /**
   * Get impact metrics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Impact metrics
   */
  async getImpactMetrics(userId, timeRange) {
    try {
      const { data: impactAnalyses, error } = await supabase
        .from('rule_impact_analysis')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', this.getTimeFilter(timeRange).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const impactMetrics = {
        totalAnalyses: impactAnalyses.length,
        impactDistribution: this.calculateImpactDistribution(impactAnalyses),
        recentChanges: impactAnalyses.slice(0, 10).map(analysis => ({
          ruleId: analysis.rule_id,
          analysisId: analysis.analysis_id,
          impactLevel: analysis.analysis_data?.impact?.overall?.level || 'unknown',
          impactScore: analysis.analysis_data?.impact?.overall?.score || 0,
          timestamp: analysis.created_at,
          recommendations: analysis.analysis_data?.recommendations || []
        })),
        highImpactChanges: impactAnalyses.filter(analysis => 
          analysis.analysis_data?.impact?.overall?.level === 'high'
        ).length,
        riskAssessment: this.calculateRiskAssessment(impactAnalyses)
      };

      return impactMetrics;
    } catch (error) {
      logger.error('Error getting impact metrics', { error: error.message, userId });
      return this.getDefaultImpactMetrics();
    }
  }

  /**
   * Get testing metrics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Testing metrics
   */
  async getTestingMetrics(userId, timeRange) {
    try {
      const { data: testSuites, error } = await supabase
        .from('test_suites')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', this.getTimeFilter(timeRange).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: testResults, error: resultsError } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', this.getTimeFilter(timeRange).toISOString());

      if (resultsError) throw resultsError;

      const testingMetrics = {
        totalTestSuites: testSuites.length,
        totalTests: testResults.length,
        testCoverage: this.calculateTestCoverage(testSuites, testResults),
        testResults: this.aggregateTestResults(testResults),
        recentTestSuites: testSuites.slice(0, 5).map(suite => ({
          id: suite.id,
          ruleId: suite.rule_id,
          status: suite.status,
          createdAt: suite.created_at,
          lastExecuted: suite.last_executed,
          totalTests: suite.test_suite_data?.metadata?.totalTestCases || 0
        })),
        testTrends: this.calculateTestTrends(testResults)
      };

      return testingMetrics;
    } catch (error) {
      logger.error('Error getting testing metrics', { error: error.message, userId });
      return this.getDefaultTestingMetrics();
    }
  }

  /**
   * Get trend metrics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Trend metrics
   */
  async getTrendMetrics(userId, timeRange) {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: performanceData, error } = await supabase
        .from('rule_performance_metrics')
        .select('timestamp, execution_time_ms, success, triggered')
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return {
        executionTrends: this.calculateExecutionTrends(performanceData),
        performanceTrends: this.calculatePerformanceTrends(performanceData),
        successTrends: this.calculateSuccessTrends(performanceData),
        triggerTrends: this.calculateTriggerTrends(performanceData)
      };
    } catch (error) {
      logger.error('Error getting trend metrics', { error: error.message, userId });
      return this.getDefaultTrendMetrics();
    }
  }

  /**
   * Get system health metrics
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} System health metrics
   */
  async getSystemHealthMetrics(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('id, enabled, created_at, updated_at')
        .eq('user_id', userId);

      if (error) throw error;

      const { data: recentActivity, error: activityError } = await supabase
        .from('rule_performance_metrics')
        .select('timestamp, success')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (activityError) throw activityError;

      return {
        totalRules: rules.length,
        activeRules: rules.filter(rule => rule.enabled).length,
        inactiveRules: rules.filter(rule => !rule.enabled).length,
        recentActivity: recentActivity.length,
        systemStatus: this.calculateSystemStatus(rules, recentActivity),
        healthScore: this.calculateSystemHealthScore(rules, recentActivity),
        uptime: this.calculateUptime(recentActivity),
        lastActivity: recentActivity[0]?.timestamp || null
      };
    } catch (error) {
      logger.error('Error getting system health metrics', { error: error.message, userId });
      return this.getDefaultSystemHealthMetrics();
    }
  }

  /**
   * Generate summary metrics
   * @param {Array} ruleMetrics - Rule metrics
   * @param {Object} performanceMetrics - Performance metrics
   * @param {Object} impactMetrics - Impact metrics
   * @param {Object} testingMetrics - Testing metrics
   * @returns {Object} Summary metrics
   */
  generateSummaryMetrics(ruleMetrics, performanceMetrics, impactMetrics, testingMetrics) {
    const totalRules = ruleMetrics.length;
    const activeRules = ruleMetrics.filter(rule => rule.enabled).length;
    const healthyRules = ruleMetrics.filter(rule => rule.health === 'healthy').length;
    
    const avgEfficiency = ruleMetrics.length > 0 
      ? ruleMetrics.reduce((sum, rule) => sum + (rule.efficiency || 0), 0) / ruleMetrics.length
      : 0;

    const avgPerformance = performanceMetrics?.summary?.averageExecutionTime || 0;
    const overallSuccessRate = performanceMetrics?.summary?.overallSuccessRate || 0;

    return {
      totalRules,
      activeRules,
      inactiveRules: totalRules - activeRules,
      healthyRules,
      unhealthyRules: totalRules - healthyRules,
      averageEfficiency: Math.round(avgEfficiency),
      averagePerformance: avgPerformance,
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      totalTests: testingMetrics?.totalTests || 0,
      testCoverage: testingMetrics?.testCoverage?.overall || 0,
      highImpactChanges: impactMetrics?.highImpactChanges || 0,
      systemHealth: this.calculateOverallSystemHealth(ruleMetrics, performanceMetrics)
    };
  }

  /**
   * Generate alerts
   * @param {string} userId - User identifier
   * @param {Array} ruleMetrics - Rule metrics
   * @param {Object} performanceMetrics - Performance metrics
   * @returns {Promise<Array>} Generated alerts
   */
  async generateAlerts(userId, ruleMetrics, performanceMetrics) {
    const alerts = [];

    // Performance alerts
    if (performanceMetrics?.slowRules?.length > 0) {
      alerts.push({
        id: `perf_${Date.now()}`,
        type: 'performance',
        severity: 'warning',
        title: 'Slow Performing Rules Detected',
        message: `${performanceMetrics.slowRules.length} rules are performing below acceptable thresholds`,
        rules: performanceMetrics.slowRules.map(rule => rule.ruleId),
        timestamp: new Date().toISOString(),
        actionable: true
      });
    }

    // Health alerts
    const unhealthyRules = ruleMetrics.filter(rule => rule.health === 'unhealthy');
    if (unhealthyRules.length > 0) {
      alerts.push({
        id: `health_${Date.now()}`,
        type: 'health',
        severity: 'error',
        title: 'Unhealthy Rules Detected',
        message: `${unhealthyRules.length} rules are in unhealthy state`,
        rules: unhealthyRules.map(rule => rule.id),
        timestamp: new Date().toISOString(),
        actionable: true
      });
    }

    // Inactive rules alert
    const inactiveRules = ruleMetrics.filter(rule => !rule.enabled);
    if (inactiveRules.length > ruleMetrics.length * 0.5) {
      alerts.push({
        id: `inactive_${Date.now()}`,
        type: 'configuration',
        severity: 'info',
        title: 'High Number of Inactive Rules',
        message: `${inactiveRules.length} out of ${ruleMetrics.length} rules are inactive`,
        rules: inactiveRules.map(rule => rule.id),
        timestamp: new Date().toISOString(),
        actionable: true
      });
    }

    return alerts;
  }

  /**
   * Generate recommendations
   * @param {string} userId - User identifier
   * @param {Array} ruleMetrics - Rule metrics
   * @param {Object} performanceMetrics - Performance metrics
   * @param {Object} impactMetrics - Impact metrics
   * @returns {Promise<Array>} Generated recommendations
   */
  async generateRecommendations(userId, ruleMetrics, performanceMetrics, impactMetrics) {
    const recommendations = [];

    // Performance recommendations
    const slowRules = performanceMetrics?.slowRules || [];
    if (slowRules.length > 0) {
      recommendations.push({
        id: `rec_perf_${Date.now()}`,
        category: 'performance',
        priority: 'high',
        title: 'Optimize Slow Rules',
        description: 'Consider optimizing rules with poor performance',
        actions: [
          'Review rule conditions for complexity',
          'Implement caching strategies',
          'Consider rule consolidation'
        ],
        affectedRules: slowRules.map(rule => rule.ruleId)
      });
    }

    // Efficiency recommendations
    const lowEfficiencyRules = ruleMetrics.filter(rule => rule.efficiency < 70);
    if (lowEfficiencyRules.length > 0) {
      recommendations.push({
        id: `rec_efficiency_${Date.now()}`,
        category: 'efficiency',
        priority: 'medium',
        title: 'Improve Rule Efficiency',
        description: 'Some rules have low efficiency scores',
        actions: [
          'Review rule logic and conditions',
          'Optimize trigger conditions',
          'Improve error handling'
        ],
        affectedRules: lowEfficiencyRules.map(rule => rule.id)
      });
    }

    // Testing recommendations
    const untestedRules = ruleMetrics.filter(rule => !rule.testing?.hasTests);
    if (untestedRules.length > 0) {
      recommendations.push({
        id: `rec_testing_${Date.now()}`,
        category: 'testing',
        priority: 'medium',
        title: 'Add Test Coverage',
        description: 'Some rules lack adequate test coverage',
        actions: [
          'Create unit tests for rules',
          'Add integration tests',
          'Implement automated testing'
        ],
        affectedRules: untestedRules.map(rule => rule.id)
      });
    }

    return recommendations;
  }

  /**
   * Calculate rule status
   * @param {Object} rule - Rule data
   * @param {Object} performance - Performance data
   * @returns {string} Rule status
   */
  calculateRuleStatus(rule, performance) {
    if (!rule.enabled) return 'inactive';
    if (performance.totalExecutions === 0) return 'untested';
    if (performance.successRate < 80) return 'failing';
    if (performance.averageExecutionTime > 2000) return 'slow';
    return 'active';
  }

  /**
   * Calculate rule health
   * @param {Object} rule - Rule data
   * @param {Object} performance - Performance data
   * @param {number} efficiency - Efficiency score
   * @returns {string} Rule health
   */
  calculateRuleHealth(rule, performance, efficiency) {
    if (!rule.enabled) return 'inactive';
    if (efficiency < 50) return 'critical';
    if (efficiency < 70) return 'unhealthy';
    if (performance.successRate < 90) return 'warning';
    return 'healthy';
  }

  /**
   * Calculate performance distribution
   * @param {Object} rulesMetrics - Rules metrics
   * @returns {Object} Performance distribution
   */
  calculatePerformanceDistribution(rulesMetrics) {
    const distribution = {
      excellent: 0,
      good: 0,
      acceptable: 0,
      poor: 0
    };

    Object.values(rulesMetrics).forEach(rule => {
      const avgTime = rule.averageExecutionTime || 0;
      if (avgTime < this.metricThresholds.performance.excellent) {
        distribution.excellent++;
      } else if (avgTime < this.metricThresholds.performance.good) {
        distribution.good++;
      } else if (avgTime < this.metricThresholds.performance.acceptable) {
        distribution.acceptable++;
      } else {
        distribution.poor++;
      }
    });

    return distribution;
  }

  /**
   * Get top performers
   * @param {Object} rulesMetrics - Rules metrics
   * @returns {Array} Top performing rules
   */
  getTopPerformers(rulesMetrics) {
    return Object.entries(rulesMetrics)
      .map(([ruleId, metrics]) => ({
        ruleId,
        ...metrics
      }))
      .sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))
      .slice(0, 5);
  }

  /**
   * Generate performance alerts
   * @param {Object} rulesMetrics - Rules metrics
   * @param {Object} benchmarks - Performance benchmarks
   * @returns {Array} Performance alerts
   */
  generatePerformanceAlerts(rulesMetrics, benchmarks) {
    const alerts = [];

    Object.entries(rulesMetrics).forEach(([ruleId, metrics]) => {
      if (metrics.averageExecutionTime > benchmarks.p95ExecutionTime) {
        alerts.push({
          ruleId,
          type: 'slow_performance',
          severity: 'warning',
          message: `Rule execution time (${metrics.averageExecutionTime}ms) exceeds 95th percentile`
        });
      }

      if (metrics.successRate < this.metricThresholds.successRate.acceptable) {
        alerts.push({
          ruleId,
          type: 'low_success_rate',
          severity: 'error',
          message: `Rule success rate (${metrics.successRate}%) is below acceptable threshold`
        });
      }
    });

    return alerts;
  }

  /**
   * Calculate impact distribution
   * @param {Array} impactAnalyses - Impact analyses
   * @returns {Object} Impact distribution
   */
  calculateImpactDistribution(impactAnalyses) {
    const distribution = {
      high: 0,
      medium: 0,
      low: 0,
      minimal: 0
    };

    impactAnalyses.forEach(analysis => {
      const level = analysis.analysis_data?.impact?.overall?.level || 'minimal';
      distribution[level]++;
    });

    return distribution;
  }

  /**
   * Calculate risk assessment
   * @param {Array} impactAnalyses - Impact analyses
   * @returns {Object} Risk assessment
   */
  calculateRiskAssessment(impactAnalyses) {
    const highRiskChanges = impactAnalyses.filter(analysis => 
      analysis.analysis_data?.impact?.overall?.level === 'high'
    ).length;

    const totalChanges = impactAnalyses.length;
    const riskLevel = totalChanges > 0 ? (highRiskChanges / totalChanges) * 100 : 0;

    return {
      riskLevel: Math.round(riskLevel),
      highRiskChanges,
      totalChanges,
      riskTrend: riskLevel > 20 ? 'increasing' : riskLevel < 5 ? 'decreasing' : 'stable'
    };
  }

  /**
   * Calculate test coverage
   * @param {Array} testSuites - Test suites
   * @param {Array} testResults - Test results
   * @returns {Object} Test coverage
   */
  calculateTestCoverage(testSuites, testResults) {
    const totalRules = testSuites.length;
    const testedRules = new Set(testResults.map(result => result.rule_id)).size;
    
    return {
      overall: totalRules > 0 ? Math.round((testedRules / totalRules) * 100) : 0,
      totalRules,
      testedRules,
      untestedRules: totalRules - testedRules
    };
  }

  /**
   * Aggregate test results
   * @param {Array} testResults - Test results
   * @returns {Object} Aggregated test results
   */
  aggregateTestResults(testResults) {
    const total = testResults.length;
    const passed = testResults.filter(result => result.status === 'passed').length;
    const failed = testResults.filter(result => result.status === 'failed').length;
    const avgExecutionTime = testResults.reduce((sum, result) => sum + (result.execution_time || 0), 0) / total;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      averageExecutionTime: Math.round(avgExecutionTime)
    };
  }

  /**
   * Calculate test trends
   * @param {Array} testResults - Test results
   * @returns {Object} Test trends
   */
  calculateTestTrends(testResults) {
    // Group by day and calculate trends
    const dailyResults = {};
    
    testResults.forEach(result => {
      const date = new Date(result.created_at).toISOString().split('T')[0];
      if (!dailyResults[date]) {
        dailyResults[date] = { total: 0, passed: 0, failed: 0 };
      }
      dailyResults[date].total++;
      if (result.status === 'passed') {
        dailyResults[date].passed++;
      } else {
        dailyResults[date].failed++;
      }
    });

    return {
      dailyResults,
      trend: 'stable' // Would calculate actual trend
    };
  }

  /**
   * Calculate execution trends
   * @param {Array} performanceData - Performance data
   * @returns {Object} Execution trends
   */
  calculateExecutionTrends(performanceData) {
    // Group by day and calculate trends
    const dailyExecutions = {};
    
    performanceData.forEach(data => {
      const date = new Date(data.timestamp).toISOString().split('T')[0];
      dailyExecutions[date] = (dailyExecutions[date] || 0) + 1;
    });

    return {
      dailyExecutions,
      trend: 'stable' // Would calculate actual trend
    };
  }

  /**
   * Calculate performance trends
   * @param {Array} performanceData - Performance data
   * @returns {Object} Performance trends
   */
  calculatePerformanceTrends(performanceData) {
    // Group by day and calculate average execution time
    const dailyPerformance = {};
    
    performanceData.forEach(data => {
      const date = new Date(data.timestamp).toISOString().split('T')[0];
      if (!dailyPerformance[date]) {
        dailyPerformance[date] = { total: 0, count: 0 };
      }
      dailyPerformance[date].total += data.execution_time_ms;
      dailyPerformance[date].count++;
    });

    // Calculate averages
    Object.keys(dailyPerformance).forEach(date => {
      dailyPerformance[date] = Math.round(dailyPerformance[date].total / dailyPerformance[date].count);
    });

    return {
      dailyPerformance,
      trend: 'stable' // Would calculate actual trend
    };
  }

  /**
   * Calculate success trends
   * @param {Array} performanceData - Performance data
   * @returns {Object} Success trends
   */
  calculateSuccessTrends(performanceData) {
    // Group by day and calculate success rate
    const dailySuccess = {};
    
    performanceData.forEach(data => {
      const date = new Date(data.timestamp).toISOString().split('T')[0];
      if (!dailySuccess[date]) {
        dailySuccess[date] = { total: 0, success: 0 };
      }
      dailySuccess[date].total++;
      if (data.success) {
        dailySuccess[date].success++;
      }
    });

    // Calculate success rates
    Object.keys(dailySuccess).forEach(date => {
      const rate = dailySuccess[date].total > 0 
        ? (dailySuccess[date].success / dailySuccess[date].total) * 100
        : 0;
      dailySuccess[date] = Math.round(rate * 100) / 100;
    });

    return {
      dailySuccess,
      trend: 'stable' // Would calculate actual trend
    };
  }

  /**
   * Calculate trigger trends
   * @param {Array} performanceData - Performance data
   * @returns {Object} Trigger trends
   */
  calculateTriggerTrends(performanceData) {
    // Group by day and calculate trigger rate
    const dailyTriggers = {};
    
    performanceData.forEach(data => {
      const date = new Date(data.timestamp).toISOString().split('T')[0];
      if (!dailyTriggers[date]) {
        dailyTriggers[date] = { total: 0, triggered: 0 };
      }
      dailyTriggers[date].total++;
      if (data.triggered) {
        dailyTriggers[date].triggered++;
      }
    });

    // Calculate trigger rates
    Object.keys(dailyTriggers).forEach(date => {
      const rate = dailyTriggers[date].total > 0 
        ? (dailyTriggers[date].triggered / dailyTriggers[date].total) * 100
        : 0;
      dailyTriggers[date] = Math.round(rate * 100) / 100;
    });

    return {
      dailyTriggers,
      trend: 'stable' // Would calculate actual trend
    };
  }

  /**
   * Calculate system status
   * @param {Array} rules - Rules data
   * @param {Array} recentActivity - Recent activity data
   * @returns {string} System status
   */
  calculateSystemStatus(rules, recentActivity) {
    const activeRules = rules.filter(rule => rule.enabled).length;
    const totalRules = rules.length;
    const activityRate = recentActivity.length > 0 ? 
      recentActivity.filter(activity => activity.success).length / recentActivity.length : 0;

    if (activeRules === 0) return 'inactive';
    if (activityRate < 0.8) return 'degraded';
    if (activeRules < totalRules * 0.5) return 'partial';
    return 'operational';
  }

  /**
   * Calculate system health score
   * @param {Array} rules - Rules data
   * @param {Array} recentActivity - Recent activity data
   * @returns {number} Health score (0-100)
   */
  calculateSystemHealthScore(rules, recentActivity) {
    const activeRules = rules.filter(rule => rule.enabled).length;
    const totalRules = rules.length;
    const activityRate = recentActivity.length > 0 ? 
      recentActivity.filter(activity => activity.success).length / recentActivity.length : 0;

    const ruleHealthScore = totalRules > 0 ? (activeRules / totalRules) * 100 : 0;
    const activityHealthScore = activityRate * 100;

    return Math.round((ruleHealthScore + activityHealthScore) / 2);
  }

  /**
   * Calculate uptime
   * @param {Array} recentActivity - Recent activity data
   * @returns {number} Uptime percentage
   */
  calculateUptime(recentActivity) {
    if (recentActivity.length === 0) return 0;
    
    const successfulActivities = recentActivity.filter(activity => activity.success).length;
    return Math.round((successfulActivities / recentActivity.length) * 100);
  }

  /**
   * Calculate overall system health
   * @param {Array} ruleMetrics - Rule metrics
   * @param {Object} performanceMetrics - Performance metrics
   * @returns {string} Overall system health
   */
  calculateOverallSystemHealth(ruleMetrics, performanceMetrics) {
    const healthyRules = ruleMetrics.filter(rule => rule.health === 'healthy').length;
    const totalRules = ruleMetrics.length;
    const healthRatio = totalRules > 0 ? healthyRules / totalRules : 0;

    if (healthRatio >= 0.9) return 'excellent';
    if (healthRatio >= 0.7) return 'good';
    if (healthRatio >= 0.5) return 'fair';
    return 'poor';
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
    this.dashboardCache.clear();
    logger.info('Metrics cache cleared');
  }

  /**
   * Get real-time metrics
   * @param {string} userId - User identifier
   * @returns {Object} Real-time metrics
   */
  getRealTimeMetrics(userId) {
    return this.realTimeMetrics.get(userId) || this.getDefaultRealTimeMetrics();
  }

  /**
   * Update real-time metrics
   * @param {string} userId - User identifier
   * @param {Object} metrics - Real-time metrics
   */
  updateRealTimeMetrics(userId, metrics) {
    this.realTimeMetrics.set(userId, {
      ...metrics,
      lastUpdated: new Date().toISOString()
    });
  }

  // Default methods
  getDefaultDashboardMetrics(userId) {
    return {
      userId,
      generatedAt: new Date().toISOString(),
      timeRange: '24h',
      realTime: false,
      summary: this.getDefaultSummaryMetrics(),
      rules: [],
      performance: this.getDefaultPerformanceMetrics(),
      impact: this.getDefaultImpactMetrics(),
      testing: this.getDefaultTestingMetrics(),
      trends: this.getDefaultTrendMetrics(),
      systemHealth: this.getDefaultSystemHealthMetrics(),
      alerts: [],
      recommendations: []
    };
  }

  getDefaultSummaryMetrics() {
    return {
      totalRules: 0,
      activeRules: 0,
      inactiveRules: 0,
      healthyRules: 0,
      unhealthyRules: 0,
      averageEfficiency: 0,
      averagePerformance: 0,
      overallSuccessRate: 0,
      totalTests: 0,
      testCoverage: 0,
      highImpactChanges: 0,
      systemHealth: 'unknown'
    };
  }

  getDefaultPerformanceMetrics() {
    return {
      summary: {
        totalRules: 0,
        totalExecutions: 0,
        averageExecutionTime: 0,
        overallSuccessRate: 0,
        overallTriggerRate: 0
      },
      benchmarks: {
        averageExecutionTime: 0,
        medianExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
        minExecutionTime: 0,
        maxExecutionTime: 0,
        overallSuccessRate: 0
      },
      slowRules: [],
      performanceDistribution: { excellent: 0, good: 0, acceptable: 0, poor: 0 },
      topPerformers: [],
      performanceAlerts: []
    };
  }

  getDefaultImpactMetrics() {
    return {
      totalAnalyses: 0,
      impactDistribution: { high: 0, medium: 0, low: 0, minimal: 0 },
      recentChanges: [],
      highImpactChanges: 0,
      riskAssessment: {
        riskLevel: 0,
        highRiskChanges: 0,
        totalChanges: 0,
        riskTrend: 'stable'
      }
    };
  }

  getDefaultTestingMetrics() {
    return {
      totalTestSuites: 0,
      totalTests: 0,
      testCoverage: { overall: 0, totalRules: 0, testedRules: 0, untestedRules: 0 },
      testResults: { total: 0, passed: 0, failed: 0, passRate: 0, averageExecutionTime: 0 },
      recentTestSuites: [],
      testTrends: { dailyResults: {}, trend: 'stable' }
    };
  }

  getDefaultTrendMetrics() {
    return {
      executionTrends: { dailyExecutions: {}, trend: 'stable' },
      performanceTrends: { dailyPerformance: {}, trend: 'stable' },
      successTrends: { dailySuccess: {}, trend: 'stable' },
      triggerTrends: { dailyTriggers: {}, trend: 'stable' }
    };
  }

  getDefaultSystemHealthMetrics() {
    return {
      totalRules: 0,
      activeRules: 0,
      inactiveRules: 0,
      recentActivity: 0,
      systemStatus: 'unknown',
      healthScore: 0,
      uptime: 0,
      lastActivity: null
    };
  }

  getDefaultRealTimeMetrics() {
    return {
      activeExecutions: 0,
      recentExecutions: 0,
      errorRate: 0,
      averageResponseTime: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const ruleMetricsDashboard = new RuleMetricsDashboard();
export default RuleMetricsDashboard;
