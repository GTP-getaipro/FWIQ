/**
 * Workflow Performance Benchmarking
 * Comprehensive performance benchmarking and comparison tools
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { workflowAnalytics } from './workflowAnalytics.js';

export class WorkflowBenchmarking {
  constructor() {
    this.benchmarkCache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    this.benchmarkStandards = this.initializeBenchmarkStandards();
    this.performanceThresholds = this.initializePerformanceThresholds();
  }

  /**
   * Run comprehensive workflow benchmark
   * @param {string} workflowId - Workflow identifier
   * @param {Object} options - Benchmark options
   * @returns {Promise<Object>} Benchmark results
   */
  async runWorkflowBenchmark(workflowId, options = {}) {
    try {
      logger.info('Running workflow benchmark', { workflowId, options });

      const {
        timeRange = '7d',
        includeComparison = true,
        includeTrends = true,
        includeRecommendations = true
      } = options;

      // Gather benchmark data
      const [
        analytics,
        trends,
        bottlenecks,
        errorAnalysis,
        utilization,
        throughput
      ] = await Promise.all([
        workflowAnalytics.getWorkflowAnalytics(workflowId, timeRange),
        workflowAnalytics.getWorkflowTrends(workflowId, timeRange),
        workflowAnalytics.getWorkflowBottlenecks(workflowId, timeRange),
        workflowAnalytics.getWorkflowErrorAnalysis(workflowId, timeRange),
        workflowAnalytics.getWorkflowUtilization(workflowId, timeRange),
        workflowAnalytics.getWorkflowThroughput(workflowId, timeRange)
      ]);

      // Calculate benchmark scores
      const benchmarkScores = this.calculateBenchmarkScores({
        analytics,
        trends,
        bottlenecks,
        errorAnalysis,
        utilization,
        throughput
      });

      // Generate benchmark report
      const benchmarkReport = {
        workflowId,
        timeRange,
        timestamp: new Date().toISOString(),
        scores: benchmarkScores,
        analytics,
        trends: includeTrends ? trends : null,
        bottlenecks,
        errorAnalysis,
        utilization,
        throughput,
        comparison: includeComparison ? await this.getBenchmarkComparison(workflowId, benchmarkScores) : null,
        recommendations: includeRecommendations ? this.generateBenchmarkRecommendations(benchmarkScores) : null,
        overallGrade: this.calculateOverallGrade(benchmarkScores),
        performanceLevel: this.determinePerformanceLevel(benchmarkScores)
      };

      // Store benchmark results
      await this.storeBenchmarkResults(workflowId, benchmarkReport);

      logger.info('Workflow benchmark completed', { 
        workflowId, 
        overallGrade: benchmarkReport.overallGrade,
        performanceLevel: benchmarkReport.performanceLevel
      });

      return benchmarkReport;
    } catch (error) {
      logger.error('Error running workflow benchmark', { 
        error: error.message, 
        workflowId 
      });
      throw new Error(`Failed to run benchmark: ${error.message}`);
    }
  }

  /**
   * Compare workflow against industry standards
   * @param {string} workflowId - Workflow identifier
   * @param {Object} benchmarkScores - Benchmark scores
   * @returns {Promise<Object>} Comparison results
   */
  async getBenchmarkComparison(workflowId, benchmarkScores) {
    try {
      const industryStandards = this.benchmarkStandards;
      const comparison = {};

      // Compare each metric against industry standards
      Object.keys(benchmarkScores).forEach(metric => {
        const currentScore = benchmarkScores[metric];
        const industryStandard = industryStandards[metric];
        
        if (industryStandard) {
          const deviation = currentScore - industryStandard;
          const deviationPercentage = (deviation / industryStandard) * 100;
          
          comparison[metric] = {
            current: currentScore,
            industryStandard: industryStandard,
            deviation: Math.round(deviation * 100) / 100,
            deviationPercentage: Math.round(deviationPercentage * 100) / 100,
            performance: this.getPerformanceLevel(deviationPercentage),
            recommendation: this.getComparisonRecommendation(metric, deviationPercentage)
          };
        }
      });

      // Calculate overall comparison score
      const comparisonScores = Object.values(comparison).map(c => c.performance);
      const averagePerformance = comparisonScores.reduce((sum, score) => sum + score, 0) / comparisonScores.length;
      
      comparison.overall = {
        averagePerformance: Math.round(averagePerformance * 100) / 100,
        grade: this.getPerformanceGrade(averagePerformance),
        summary: this.generateComparisonSummary(comparison)
      };

      return comparison;
    } catch (error) {
      logger.error('Error getting benchmark comparison', { 
        error: error.message, 
        workflowId 
      });
      return null;
    }
  }

  /**
   * Get historical benchmark trends
   * @param {string} workflowId - Workflow identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Historical trends
   */
  async getHistoricalBenchmarkTrends(workflowId, timeRange = '30d') {
    try {
      const { data, error } = await supabase
        .from('workflow_benchmark_results')
        .select('*')
        .eq('workflow_id', workflowId)
        .gte('timestamp', this.getTimeFilter(timeRange).toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return this.getDefaultTrends();
      }

      // Process historical data
      const trends = {
        overallGrade: [],
        performanceLevel: [],
        executionTime: [],
        successRate: [],
        throughput: [],
        efficiency: []
      };

      data.forEach(result => {
        const scores = result.benchmark_scores;
        const timestamp = result.timestamp;
        
        trends.overallGrade.push({
          timestamp,
          value: result.overall_grade
        });
        
        trends.performanceLevel.push({
          timestamp,
          value: result.performance_level
        });
        
        trends.executionTime.push({
          timestamp,
          value: scores.executionTime || 0
        });
        
        trends.successRate.push({
          timestamp,
          value: scores.successRate || 0
        });
        
        trends.throughput.push({
          timestamp,
          value: scores.throughput || 0
        });
        
        trends.efficiency.push({
          timestamp,
          value: scores.efficiency || 0
        });
      });

      return trends;
    } catch (error) {
      logger.error('Error getting historical benchmark trends', { 
        error: error.message, 
        workflowId 
      });
      return this.getDefaultTrends();
    }
  }

  /**
   * Get workflow performance ranking
   * @param {string} userId - User identifier
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Performance ranking
   */
  async getWorkflowPerformanceRanking(userId, filters = {}) {
    try {
      const { data, error } = await supabase
        .from('workflow_benchmark_results')
        .select(`
          *,
          workflows:workflow_id (
            id,
            name,
            description
          )
        `)
        .eq('workflows.user_id', userId)
        .order('overall_grade', { ascending: false })
        .order('timestamp', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Group by workflow and get latest benchmark
      const workflowRankings = {};
      data.forEach(result => {
        const workflowId = result.workflow_id;
        if (!workflowRankings[workflowId] || 
            new Date(result.timestamp) > new Date(workflowRankings[workflowId].timestamp)) {
          workflowRankings[workflowId] = result;
        }
      });

      // Convert to array and sort by overall grade
      const rankings = Object.values(workflowRankings)
        .sort((a, b) => b.overall_grade - a.overall_grade)
        .map((result, index) => ({
          rank: index + 1,
          workflowId: result.workflow_id,
          workflow: result.workflows,
          overallGrade: result.overall_grade,
          performanceLevel: result.performance_level,
          benchmarkScores: result.benchmark_scores,
          lastBenchmark: result.timestamp
        }));

      return rankings;
    } catch (error) {
      logger.error('Error getting workflow performance ranking', { 
        error: error.message, 
        userId 
      });
      return [];
    }
  }

  /**
   * Calculate benchmark scores
   * @param {Object} data - Workflow data
   * @returns {Object} Benchmark scores
   */
  calculateBenchmarkScores(data) {
    const { analytics, trends, bottlenecks, errorAnalysis, utilization, throughput } = data;

    return {
      executionTime: this.scoreExecutionTime(analytics.averageExecutionTime),
      successRate: this.scoreSuccessRate(analytics.successRate),
      throughput: this.scoreThroughput(throughput.emailsPerSecond),
      efficiency: this.scoreEfficiency(analytics.averageExecutionTime, analytics.successRate),
      reliability: this.scoreReliability(errorAnalysis.errorRate),
      utilization: this.scoreUtilization(utilization.utilizationRate),
      scalability: this.scoreScalability(analytics.totalExecutions, throughput.emailsPerSecond),
      consistency: this.scoreConsistency(trends.executionTime),
      bottleneckImpact: this.scoreBottleneckImpact(bottlenecks)
    };
  }

  /**
   * Score execution time performance
   * @param {number} executionTime - Average execution time in ms
   * @returns {number} Score (0-100)
   */
  scoreExecutionTime(executionTime) {
    if (executionTime <= 1000) return 100;
    if (executionTime <= 3000) return 90;
    if (executionTime <= 5000) return 75;
    if (executionTime <= 10000) return 60;
    if (executionTime <= 20000) return 40;
    return 20;
  }

  /**
   * Score success rate performance
   * @param {number} successRate - Success rate percentage
   * @returns {number} Score (0-100)
   */
  scoreSuccessRate(successRate) {
    if (successRate >= 99) return 100;
    if (successRate >= 95) return 90;
    if (successRate >= 90) return 75;
    if (successRate >= 80) return 60;
    if (successRate >= 70) return 40;
    return 20;
  }

  /**
   * Score throughput performance
   * @param {number} throughput - Emails per second
   * @returns {number} Score (0-100)
   */
  scoreThroughput(throughput) {
    if (throughput >= 10) return 100;
    if (throughput >= 5) return 90;
    if (throughput >= 2) return 75;
    if (throughput >= 1) return 60;
    if (throughput >= 0.5) return 40;
    return 20;
  }

  /**
   * Score efficiency performance
   * @param {number} executionTime - Average execution time
   * @param {number} successRate - Success rate
   * @returns {number} Score (0-100)
   */
  scoreEfficiency(executionTime, successRate) {
    const timeScore = this.scoreExecutionTime(executionTime);
    const successScore = this.scoreSuccessRate(successRate);
    return Math.round((timeScore + successScore) / 2);
  }

  /**
   * Score reliability performance
   * @param {number} errorRate - Error rate percentage
   * @returns {number} Score (0-100)
   */
  scoreReliability(errorRate) {
    if (errorRate <= 1) return 100;
    if (errorRate <= 3) return 90;
    if (errorRate <= 5) return 75;
    if (errorRate <= 10) return 60;
    if (errorRate <= 20) return 40;
    return 20;
  }

  /**
   * Score utilization performance
   * @param {number} utilizationRate - Utilization rate percentage
   * @returns {number} Score (0-100)
   */
  scoreUtilization(utilizationRate) {
    if (utilizationRate >= 90) return 100;
    if (utilizationRate >= 80) return 90;
    if (utilizationRate >= 70) return 75;
    if (utilizationRate >= 60) return 60;
    if (utilizationRate >= 50) return 40;
    return 20;
  }

  /**
   * Score scalability performance
   * @param {number} totalExecutions - Total executions
   * @param {number} throughput - Emails per second
   * @returns {number} Score (0-100)
   */
  scoreScalability(totalExecutions, throughput) {
    const volumeScore = Math.min(totalExecutions / 100, 1) * 50; // Max 50 points for volume
    const throughputScore = Math.min(throughput / 5, 1) * 50; // Max 50 points for throughput
    return Math.round(volumeScore + throughputScore);
  }

  /**
   * Score consistency performance
   * @param {Array} executionTimeTrend - Execution time trend data
   * @returns {number} Score (0-100)
   */
  scoreConsistency(executionTimeTrend) {
    if (!executionTimeTrend || executionTimeTrend.length < 2) return 50;
    
    const values = executionTimeTrend.map(point => point.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    // Lower coefficient of variation = higher consistency score
    if (coefficientOfVariation <= 0.1) return 100;
    if (coefficientOfVariation <= 0.2) return 90;
    if (coefficientOfVariation <= 0.3) return 75;
    if (coefficientOfVariation <= 0.5) return 60;
    if (coefficientOfVariation <= 0.7) return 40;
    return 20;
  }

  /**
   * Score bottleneck impact
   * @param {Array} bottlenecks - Bottleneck data
   * @returns {number} Score (0-100)
   */
  scoreBottleneckImpact(bottlenecks) {
    if (!bottlenecks || bottlenecks.length === 0) return 100;
    
    const highSeverityCount = bottlenecks.filter(b => b.severity === 'high').length;
    const mediumSeverityCount = bottlenecks.filter(b => b.severity === 'medium').length;
    
    let score = 100;
    score -= highSeverityCount * 30; // -30 points per high severity bottleneck
    score -= mediumSeverityCount * 15; // -15 points per medium severity bottleneck
    
    return Math.max(score, 0);
  }

  /**
   * Calculate overall grade
   * @param {Object} scores - Benchmark scores
   * @returns {string} Overall grade (A+, A, B+, B, C+, C, D, F)
   */
  calculateOverallGrade(scores) {
    const scoreValues = Object.values(scores);
    const averageScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
    
    if (averageScore >= 95) return 'A+';
    if (averageScore >= 90) return 'A';
    if (averageScore >= 85) return 'B+';
    if (averageScore >= 80) return 'B';
    if (averageScore >= 75) return 'C+';
    if (averageScore >= 70) return 'C';
    if (averageScore >= 60) return 'D';
    return 'F';
  }

  /**
   * Determine performance level
   * @param {Object} scores - Benchmark scores
   * @returns {string} Performance level
   */
  determinePerformanceLevel(scores) {
    const scoreValues = Object.values(scores);
    const averageScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
    
    if (averageScore >= 90) return 'excellent';
    if (averageScore >= 80) return 'good';
    if (averageScore >= 70) return 'average';
    if (averageScore >= 60) return 'below_average';
    return 'poor';
  }

  /**
   * Get performance level from deviation
   * @param {number} deviationPercentage - Deviation percentage
   * @returns {number} Performance level (1-5)
   */
  getPerformanceLevel(deviationPercentage) {
    if (deviationPercentage >= 20) return 5; // Excellent
    if (deviationPercentage >= 10) return 4; // Good
    if (deviationPercentage >= -10) return 3; // Average
    if (deviationPercentage >= -20) return 2; // Below average
    return 1; // Poor
  }

  /**
   * Get performance grade
   * @param {number} performanceLevel - Performance level
   * @returns {string} Performance grade
   */
  getPerformanceGrade(performanceLevel) {
    if (performanceLevel >= 4.5) return 'A+';
    if (performanceLevel >= 4) return 'A';
    if (performanceLevel >= 3.5) return 'B+';
    if (performanceLevel >= 3) return 'B';
    if (performanceLevel >= 2.5) return 'C+';
    if (performanceLevel >= 2) return 'C';
    if (performanceLevel >= 1.5) return 'D';
    return 'F';
  }

  /**
   * Get comparison recommendation
   * @param {string} metric - Metric name
   * @param {number} deviationPercentage - Deviation percentage
   * @returns {string} Recommendation
   */
  getComparisonRecommendation(metric, deviationPercentage) {
    if (deviationPercentage > 20) {
      return `Excellent performance in ${metric}. Consider sharing best practices.`;
    } else if (deviationPercentage > 10) {
      return `Good performance in ${metric}. Maintain current practices.`;
    } else if (deviationPercentage > -10) {
      return `Average performance in ${metric}. Room for improvement.`;
    } else if (deviationPercentage > -20) {
      return `Below average performance in ${metric}. Immediate attention needed.`;
    } else {
      return `Poor performance in ${metric}. Critical improvement required.`;
    }
  }

  /**
   * Generate comparison summary
   * @param {Object} comparison - Comparison data
   * @returns {string} Summary
   */
  generateComparisonSummary(comparison) {
    const metrics = Object.keys(comparison).filter(key => key !== 'overall');
    const excellentCount = metrics.filter(metric => comparison[metric].performance >= 4).length;
    const poorCount = metrics.filter(metric => comparison[metric].performance <= 2).length;
    
    if (excellentCount > metrics.length / 2) {
      return `Workflow performs excellently in most metrics, exceeding industry standards.`;
    } else if (poorCount > metrics.length / 2) {
      return `Workflow performance is below industry standards in most metrics.`;
    } else {
      return `Workflow performance is mixed, with some metrics above and others below industry standards.`;
    }
  }

  /**
   * Generate benchmark recommendations
   * @param {Object} scores - Benchmark scores
   * @returns {Array} Recommendations
   */
  generateBenchmarkRecommendations(scores) {
    const recommendations = [];
    
    Object.entries(scores).forEach(([metric, score]) => {
      if (score < 70) {
        recommendations.push({
          metric,
          score,
          priority: score < 50 ? 'high' : 'medium',
          recommendation: this.getMetricRecommendation(metric, score)
        });
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get metric-specific recommendation
   * @param {string} metric - Metric name
   * @param {number} score - Metric score
   * @returns {string} Recommendation
   */
  getMetricRecommendation(metric, score) {
    const recommendations = {
      executionTime: 'Optimize workflow execution time by reviewing slow-performing nodes and implementing parallel processing.',
      successRate: 'Improve workflow reliability by implementing comprehensive error handling and retry mechanisms.',
      throughput: 'Increase workflow throughput by optimizing email processing and implementing batch operations.',
      efficiency: 'Improve overall efficiency by optimizing both execution time and success rate.',
      reliability: 'Reduce error rate by implementing better error handling and input validation.',
      utilization: 'Improve resource utilization by optimizing workflow scheduling and resource allocation.',
      scalability: 'Enhance scalability by implementing distributed processing and load balancing.',
      consistency: 'Improve consistency by standardizing workflow execution patterns and reducing variability.',
      bottleneckImpact: 'Address performance bottlenecks by optimizing slow-performing nodes and operations.'
    };

    return recommendations[metric] || `Improve ${metric} performance through optimization and best practices.`;
  }

  /**
   * Store benchmark results
   * @param {string} workflowId - Workflow identifier
   * @param {Object} benchmarkReport - Benchmark report
   */
  async storeBenchmarkResults(workflowId, benchmarkReport) {
    try {
      const benchmarkRecord = {
        workflow_id: workflowId,
        timestamp: benchmarkReport.timestamp,
        time_range: benchmarkReport.timeRange,
        benchmark_scores: JSON.stringify(benchmarkReport.scores),
        overall_grade: benchmarkReport.overallGrade,
        performance_level: benchmarkReport.performanceLevel,
        comparison_data: JSON.stringify(benchmarkReport.comparison),
        recommendations: JSON.stringify(benchmarkReport.recommendations)
      };

      await supabase
        .from('workflow_benchmark_results')
        .insert(benchmarkRecord);

      logger.debug('Benchmark results stored', { workflowId });
    } catch (error) {
      logger.error('Error storing benchmark results', { 
        error: error.message, 
        workflowId 
      });
    }
  }

  /**
   * Initialize benchmark standards
   * @returns {Object} Industry standards
   */
  initializeBenchmarkStandards() {
    return {
      executionTime: 3000, // 3 seconds
      successRate: 95, // 95%
      throughput: 2, // 2 emails per second
      efficiency: 85, // 85%
      reliability: 97, // 97% (3% error rate)
      utilization: 80, // 80%
      scalability: 70, // 70%
      consistency: 80, // 80%
      bottleneckImpact: 90 // 90%
    };
  }

  /**
   * Initialize performance thresholds
   * @returns {Object} Performance thresholds
   */
  initializePerformanceThresholds() {
    return {
      excellent: 90,
      good: 80,
      average: 70,
      belowAverage: 60,
      poor: 50
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
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    return filters[timeRange] || filters['7d'];
  }

  /**
   * Clear benchmark cache
   */
  clearCache() {
    this.benchmarkCache.clear();
    logger.info('Workflow benchmarking cache cleared');
  }

  /**
   * Get default trends
   * @returns {Object} Default trends
   */
  getDefaultTrends() {
    return {
      overallGrade: [],
      performanceLevel: [],
      executionTime: [],
      successRate: [],
      throughput: [],
      efficiency: []
    };
  }
}

// Export singleton instance
export const workflowBenchmarking = new WorkflowBenchmarking();
export default WorkflowBenchmarking;
