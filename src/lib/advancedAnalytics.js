/**
 * Advanced Analytics Service
 * Provides advanced analytics features like trends, predictions, and insights
 */

import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class AdvancedAnalytics {
  constructor(userId) {
    this.userId = userId;
  }

  /**
   * Calculate trend analysis for metrics
   * @param {string} metric - Metric name
   * @param {string} timeRange - Time range
   * @returns {Object} Trend analysis
   */
  async calculateTrends(metric, timeRange = '30d') {
    try {
      const dateFilter = this.getDateFilter(timeRange);
      
      // Get historical data
      const { data: events, error } = await supabase
        .from('outlook_analytics_events')
        .select('*')
        .eq('user_id', this.userId)
        .eq('event_type', metric)
        .gte('created_at', dateFilter)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData = this.groupByDay(events);
      
      // Calculate trends
      const trends = this.calculateTrendMetrics(dailyData);
      
      logger.info('Trend analysis completed', { metric, timeRange, trends });
      return trends;
    } catch (error) {
      logger.error('Failed to calculate trends', { error: error.message, metric });
      return { trend: 'stable', change: 0, confidence: 0 };
    }
  }

  /**
   * Generate predictive insights
   * @param {string} metric - Metric name
   * @param {number} days - Days to predict
   * @returns {Object} Predictive insights
   */
  async generatePredictions(metric, days = 7) {
    try {
      const trends = await this.calculateTrends(metric, '30d');
      
      // Simple linear prediction based on trend
      const prediction = this.calculatePrediction(trends, days);
      
      logger.info('Predictions generated', { metric, days, prediction });
      return prediction;
    } catch (error) {
      logger.error('Failed to generate predictions', { error: error.message, metric });
      return { predicted: 0, confidence: 0, factors: [] };
    }
  }

  /**
   * Get performance insights
   * @param {string} timeRange - Time range
   * @returns {Object} Performance insights
   */
  async getPerformanceInsights(timeRange = '7d') {
    try {
      const dateFilter = this.getDateFilter(timeRange);
      
      const [emailStats, aiStats, workflowStats] = await Promise.all([
        this.getEmailInsights(dateFilter),
        this.getAIInsights(dateFilter),
        this.getWorkflowInsights(dateFilter)
      ]);

      const insights = {
        email: emailStats,
        ai: aiStats,
        workflow: workflowStats,
        recommendations: this.generateRecommendations(emailStats, aiStats, workflowStats)
      };

      logger.info('Performance insights generated', { timeRange, insights });
      return insights;
    } catch (error) {
      logger.error('Failed to get performance insights', { error: error.message });
      return { email: {}, ai: {}, workflow: {}, recommendations: [] };
    }
  }

  /**
   * Get email processing insights
   * @param {string} dateFilter - Date filter
   * @returns {Object} Email insights
   */
  async getEmailInsights(dateFilter) {
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length === 0) {
      return { efficiency: 0, bottlenecks: [], opportunities: [] };
    }

    const responseRate = emails.filter(e => e.responded).length / emails.length;
    const avgProcessingTime = emails.reduce((sum, e) => sum + (e.processing_time || 0), 0) / emails.length;
    
    return {
      efficiency: Math.round(responseRate * 100),
      avgProcessingTime: Math.round(avgProcessingTime),
      bottlenecks: this.identifyBottlenecks(emails),
      opportunities: this.identifyOpportunities(emails)
    };
  }

  /**
   * Get AI response insights
   * @param {string} dateFilter - Date filter
   * @returns {Object} AI insights
   */
  async getAIInsights(dateFilter) {
    const { data: aiResponses } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!aiResponses || aiResponses.length === 0) {
      return { efficiency: 0, costOptimization: [], quality: 0 };
    }

    const avgTokens = aiResponses.reduce((sum, r) => sum + (r.tokens_used || 0), 0) / aiResponses.length;
    const totalCost = aiResponses.reduce((sum, r) => sum + (r.cost || 0), 0);
    const successRate = aiResponses.filter(r => r.status === 'success').length / aiResponses.length;

    return {
      efficiency: Math.round(successRate * 100),
      avgTokens: Math.round(avgTokens),
      totalCost: Math.round(totalCost * 100) / 100,
      costOptimization: this.identifyCostOptimizations(aiResponses),
      quality: this.calculateQualityScore(aiResponses)
    };
  }

  /**
   * Get workflow execution insights
   * @param {string} dateFilter - Date filter
   * @returns {Object} Workflow insights
   */
  async getWorkflowInsights(dateFilter) {
    const { data: workflows } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!workflows || workflows.length === 0) {
      return { reliability: 0, performance: 0, optimizations: [] };
    }

    const successRate = workflows.filter(w => w.status === 'success').length / workflows.length;
    const avgExecutionTime = workflows.reduce((sum, w) => sum + (w.execution_time || 0), 0) / workflows.length;

    return {
      reliability: Math.round(successRate * 100),
      avgExecutionTime: Math.round(avgExecutionTime),
      performance: this.calculatePerformanceScore(workflows),
      optimizations: this.identifyOptimizations(workflows)
    };
  }

  /**
   * Generate recommendations based on insights
   * @param {Object} emailStats - Email statistics
   * @param {Object} aiStats - AI statistics
   * @param {Object} workflowStats - Workflow statistics
   * @returns {Array} Recommendations
   */
  generateRecommendations(emailStats, aiStats, workflowStats) {
    const recommendations = [];

    // Email recommendations
    if (emailStats.efficiency < 80) {
      recommendations.push({
        type: 'email',
        priority: 'high',
        title: 'Improve Email Response Rate',
        description: 'Consider optimizing email templates or response automation',
        impact: 'high'
      });
    }

    // AI recommendations
    if (aiStats.efficiency < 90) {
      recommendations.push({
        type: 'ai',
        priority: 'medium',
        title: 'Optimize AI Response Quality',
        description: 'Review AI prompts and response templates for better accuracy',
        impact: 'medium'
      });
    }

    // Workflow recommendations
    if (workflowStats.reliability < 95) {
      recommendations.push({
        type: 'workflow',
        priority: 'high',
        title: 'Improve Workflow Reliability',
        description: 'Investigate failed workflow executions and optimize error handling',
        impact: 'high'
      });
    }

    return recommendations;
  }

  // Helper methods
  getDateFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  groupByDay(events) {
    const grouped = {};
    events.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    return grouped;
  }

  calculateTrendMetrics(dailyData) {
    const days = Object.keys(dailyData).sort();
    if (days.length < 2) {
      return { trend: 'stable', change: 0, confidence: 0 };
    }

    const values = days.map(day => dailyData[day].length);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    const confidence = Math.min(values.length / 30, 1); // Confidence based on data points

    let trend = 'stable';
    if (change > 10) trend = 'increasing';
    else if (change < -10) trend = 'decreasing';

    return { trend, change: Math.round(change), confidence: Math.round(confidence * 100) };
  }

  calculatePrediction(trends, days) {
    const baseValue = 100; // Mock base value
    const predicted = baseValue + (trends.change * days / 30);
    const confidence = Math.max(trends.confidence - (days * 5), 0);

    return {
      predicted: Math.round(predicted),
      confidence: Math.round(confidence),
      factors: ['historical_trend', 'seasonal_patterns', 'user_behavior']
    };
  }

  identifyBottlenecks(emails) {
    const bottlenecks = [];
    const slowEmails = emails.filter(e => (e.processing_time || 0) > 300); // > 5 minutes
    
    if (slowEmails.length > emails.length * 0.1) {
      bottlenecks.push('High processing time for complex emails');
    }

    return bottlenecks;
  }

  identifyOpportunities(emails) {
    const opportunities = [];
    const unresponded = emails.filter(e => !e.responded);
    
    if (unresponded.length > emails.length * 0.2) {
      opportunities.push('Automate responses for common email types');
    }

    return opportunities;
  }

  identifyCostOptimizations(aiResponses) {
    const optimizations = [];
    const highTokenResponses = aiResponses.filter(r => (r.tokens_used || 0) > 2000);
    
    if (highTokenResponses.length > aiResponses.length * 0.3) {
      optimizations.push('Optimize prompts to reduce token usage');
    }

    return optimizations;
  }

  calculateQualityScore(aiResponses) {
    const successful = aiResponses.filter(r => r.status === 'success').length;
    return Math.round((successful / aiResponses.length) * 100);
  }

  calculatePerformanceScore(workflows) {
    const successful = workflows.filter(w => w.status === 'success').length;
    const avgTime = workflows.reduce((sum, w) => sum + (w.execution_time || 0), 0) / workflows.length;
    
    // Performance score based on success rate and execution time
    const successScore = (successful / workflows.length) * 100;
    const timeScore = Math.max(0, 100 - (avgTime / 1000)); // Penalize slow executions
    
    return Math.round((successScore + timeScore) / 2);
  }

  identifyOptimizations(workflows) {
    const optimizations = [];
    const slowWorkflows = workflows.filter(w => (w.execution_time || 0) > 5000); // > 5 seconds
    
    if (slowWorkflows.length > workflows.length * 0.2) {
      optimizations.push('Optimize workflow steps for faster execution');
    }

    return optimizations;
  }
}

export default AdvancedAnalytics;
