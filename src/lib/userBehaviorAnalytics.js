/**
 * User Behavior Analytics System
 * 
 * Handles user behavior tracking, pattern analysis,
 * and behavioral insights generation.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class UserBehaviorAnalytics {
  constructor() {
    this.behaviorPatterns = new Map();
    this.behaviorMetrics = new Map();
    this.behaviorHistory = new Map();
    this.behaviorInsights = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize user behavior analytics system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing User Behavior Analytics', { userId });

      // Load behavior patterns and history
      await this.loadBehaviorPatterns(userId);
      await this.loadBehaviorHistory(userId);
      await this.loadBehaviorMetrics(userId);

      this.isInitialized = true;
      logger.info('User Behavior Analytics initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize User Behavior Analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyze behavior
   */
  async analyzeBehavior(userId, behaviorData) {
    try {
      logger.info('Analyzing user behavior', { userId, behaviorType: behaviorData.type });

      // Validate behavior data
      const validationResult = await this.validateBehaviorData(behaviorData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Analyze behavior patterns
      const patterns = await this.analyzeBehaviorPatterns(userId, behaviorData);

      // Generate behavioral insights
      const insights = await this.generateBehavioralInsights(userId, patterns);

      // Generate recommendations
      const recommendations = await this.generateBehaviorRecommendations(userId, patterns, insights);

      // Create analysis result
      const analysis = {
        id: this.generateAnalysisId(),
        user_id: userId,
        type: behaviorData.type,
        patterns: patterns,
        insights: insights,
        recommendations: recommendations,
        analyzed_at: new Date().toISOString()
      };

      // Store analysis
      await this.storeBehaviorAnalysis(userId, analysis);

      logger.info('User behavior analyzed successfully', { 
        userId, 
        behaviorType: behaviorData.type,
        patternCount: patterns.length
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze user behavior', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Analyze behavior patterns
   */
  async analyzeBehaviorPatterns(userId, behaviorData) {
    try {
      const patterns = [];

      // Session patterns
      const sessionPatterns = await this.analyzeSessionPatterns(userId, behaviorData);
      patterns.push(...sessionPatterns);

      // Activity patterns
      const activityPatterns = await this.analyzeActivityPatterns(userId, behaviorData);
      patterns.push(...activityPatterns);

      // Usage patterns
      const usagePatterns = await this.analyzeUsagePatterns(userId, behaviorData);
      patterns.push(...usagePatterns);

      // Engagement patterns
      const engagementPatterns = await this.analyzeEngagementPatterns(userId, behaviorData);
      patterns.push(...engagementPatterns);

      return patterns;
    } catch (error) {
      logger.error('Failed to analyze behavior patterns', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Analyze session patterns
   */
  async analyzeSessionPatterns(userId, behaviorData) {
    try {
      const patterns = [];

      // Simulate session pattern analysis
      const sessionData = behaviorData.sessionData || [];
      const avgSessionDuration = this.calculateAvgSessionDuration(sessionData);
      const sessionFrequency = this.calculateSessionFrequency(sessionData);
      const peakUsageHours = this.calculatePeakUsageHours(sessionData);

      patterns.push({
        type: 'session_duration',
        value: avgSessionDuration,
        trend: avgSessionDuration > 30 ? 'increasing' : 'decreasing',
        confidence: 0.85,
        description: `Average session duration: ${avgSessionDuration} minutes`
      });

      patterns.push({
        type: 'session_frequency',
        value: sessionFrequency,
        trend: sessionFrequency > 5 ? 'increasing' : 'decreasing',
        confidence: 0.80,
        description: `Sessions per week: ${sessionFrequency}`
      });

      patterns.push({
        type: 'peak_usage',
        value: peakUsageHours,
        trend: 'stable',
        confidence: 0.75,
        description: `Peak usage hours: ${peakUsageHours.join(', ')}`
      });

      return patterns;
    } catch (error) {
      logger.error('Failed to analyze session patterns', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Analyze activity patterns
   */
  async analyzeActivityPatterns(userId, behaviorData) {
    try {
      const patterns = [];

      // Simulate activity pattern analysis
      const activityData = behaviorData.activityData || [];
      const mostUsedFeatures = this.calculateMostUsedFeatures(activityData);
      const activityTrends = this.calculateActivityTrends(activityData);
      const errorRate = this.calculateErrorRate(activityData);

      patterns.push({
        type: 'feature_usage',
        value: mostUsedFeatures,
        trend: 'stable',
        confidence: 0.90,
        description: `Most used features: ${mostUsedFeatures.join(', ')}`
      });

      patterns.push({
        type: 'activity_trend',
        value: activityTrends,
        trend: activityTrends > 0 ? 'increasing' : 'decreasing',
        confidence: 0.85,
        description: `Activity trend: ${activityTrends > 0 ? 'increasing' : 'decreasing'}`
      });

      patterns.push({
        type: 'error_rate',
        value: errorRate,
        trend: errorRate < 0.05 ? 'improving' : 'concerning',
        confidence: 0.80,
        description: `Error rate: ${(errorRate * 100).toFixed(1)}%`
      });

      return patterns;
    } catch (error) {
      logger.error('Failed to analyze activity patterns', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Analyze usage patterns
   */
  async analyzeUsagePatterns(userId, behaviorData) {
    try {
      const patterns = [];

      // Simulate usage pattern analysis
      const usageData = behaviorData.usageData || [];
      const usageConsistency = this.calculateUsageConsistency(usageData);
      const featureAdoption = this.calculateFeatureAdoption(usageData);
      const workflowEfficiency = this.calculateWorkflowEfficiency(usageData);

      patterns.push({
        type: 'usage_consistency',
        value: usageConsistency,
        trend: usageConsistency > 0.8 ? 'consistent' : 'variable',
        confidence: 0.85,
        description: `Usage consistency: ${(usageConsistency * 100).toFixed(1)}%`
      });

      patterns.push({
        type: 'feature_adoption',
        value: featureAdoption,
        trend: featureAdoption > 0.7 ? 'high' : 'low',
        confidence: 0.80,
        description: `Feature adoption rate: ${(featureAdoption * 100).toFixed(1)}%`
      });

      patterns.push({
        type: 'workflow_efficiency',
        value: workflowEfficiency,
        trend: workflowEfficiency > 0.8 ? 'efficient' : 'needs_improvement',
        confidence: 0.75,
        description: `Workflow efficiency: ${(workflowEfficiency * 100).toFixed(1)}%`
      });

      return patterns;
    } catch (error) {
      logger.error('Failed to analyze usage patterns', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Analyze engagement patterns
   */
  async analyzeEngagementPatterns(userId, behaviorData) {
    try {
      const patterns = [];

      // Simulate engagement pattern analysis
      const engagementData = behaviorData.engagementData || [];
      const engagementScore = this.calculateEngagementScore(engagementData);
      const retentionRate = this.calculateRetentionRate(engagementData);
      const satisfactionLevel = this.calculateSatisfactionLevel(engagementData);

      patterns.push({
        type: 'engagement_score',
        value: engagementScore,
        trend: engagementScore > 0.7 ? 'high' : 'low',
        confidence: 0.85,
        description: `Engagement score: ${(engagementScore * 100).toFixed(1)}%`
      });

      patterns.push({
        type: 'retention_rate',
        value: retentionRate,
        trend: retentionRate > 0.8 ? 'good' : 'needs_attention',
        confidence: 0.80,
        description: `Retention rate: ${(retentionRate * 100).toFixed(1)}%`
      });

      patterns.push({
        type: 'satisfaction_level',
        value: satisfactionLevel,
        trend: satisfactionLevel > 0.8 ? 'satisfied' : 'needs_improvement',
        confidence: 0.75,
        description: `Satisfaction level: ${(satisfactionLevel * 100).toFixed(1)}%`
      });

      return patterns;
    } catch (error) {
      logger.error('Failed to analyze engagement patterns', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Generate behavioral insights
   */
  async generateBehavioralInsights(userId, patterns) {
    try {
      const insights = [];

      // Generate insights based on patterns
      for (const pattern of patterns) {
        switch (pattern.type) {
          case 'session_duration':
            if (pattern.trend === 'increasing') {
              insights.push({
                type: 'positive',
                title: 'Increasing Engagement',
                description: 'User session duration is increasing, indicating higher engagement',
                impact: 'high',
                confidence: pattern.confidence
              });
            }
            break;

          case 'error_rate':
            if (pattern.value > 0.1) {
              insights.push({
                type: 'concern',
                title: 'High Error Rate',
                description: 'User is experiencing a high error rate, may need additional training',
                impact: 'high',
                confidence: pattern.confidence
              });
            }
            break;

          case 'engagement_score':
            if (pattern.value < 0.5) {
              insights.push({
                type: 'warning',
                title: 'Low Engagement',
                description: 'User engagement is below average, consider intervention',
                impact: 'medium',
                confidence: pattern.confidence
              });
            }
            break;
        }
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate behavioral insights', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Generate behavior recommendations
   */
  async generateBehaviorRecommendations(userId, patterns, insights) {
    try {
      const recommendations = [];

      // Generate recommendations based on patterns and insights
      for (const insight of insights) {
        switch (insight.type) {
          case 'positive':
            recommendations.push({
              type: 'reinforcement',
              priority: 'low',
              title: 'Maintain Current Practices',
              description: 'Continue current practices that are working well',
              action: 'Provide positive feedback and recognition'
            });
            break;

          case 'concern':
            recommendations.push({
              type: 'intervention',
              priority: 'high',
              title: 'Provide Additional Training',
              description: 'User may benefit from additional training or support',
              action: 'Schedule training session or provide documentation'
            });
            break;

          case 'warning':
            recommendations.push({
              type: 'support',
              priority: 'medium',
              title: 'Increase User Support',
              description: 'Provide additional support to improve engagement',
              action: 'Assign mentor or provide additional resources'
            });
            break;
        }
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate behavior recommendations', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Calculate average session duration
   */
  calculateAvgSessionDuration(sessionData) {
    try {
      if (sessionData.length === 0) return 0;
      const totalDuration = sessionData.reduce((sum, session) => sum + (session.duration || 0), 0);
      return Math.round(totalDuration / sessionData.length);
    } catch (error) {
      logger.error('Failed to calculate average session duration', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate session frequency
   */
  calculateSessionFrequency(sessionData) {
    try {
      if (sessionData.length === 0) return 0;
      const uniqueDays = new Set(sessionData.map(session => 
        new Date(session.timestamp).toDateString()
      )).size;
      return Math.round(sessionData.length / Math.max(uniqueDays, 1));
    } catch (error) {
      logger.error('Failed to calculate session frequency', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate peak usage hours
   */
  calculatePeakUsageHours(sessionData) {
    try {
      if (sessionData.length === 0) return [];
      const hourCounts = {};
      sessionData.forEach(session => {
        const hour = new Date(session.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      return Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);
    } catch (error) {
      logger.error('Failed to calculate peak usage hours', { error: error.message });
      return [];
    }
  }

  /**
   * Calculate most used features
   */
  calculateMostUsedFeatures(activityData) {
    try {
      if (activityData.length === 0) return [];
      const featureCounts = {};
      activityData.forEach(activity => {
        const feature = activity.feature || 'unknown';
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      });
      return Object.entries(featureCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([feature]) => feature);
    } catch (error) {
      logger.error('Failed to calculate most used features', { error: error.message });
      return [];
    }
  }

  /**
   * Calculate activity trends
   */
  calculateActivityTrends(activityData) {
    try {
      if (activityData.length < 2) return 0;
      const sortedData = activityData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
      const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
      const firstAvg = firstHalf.length;
      const secondAvg = secondHalf.length;
      return secondAvg - firstAvg;
    } catch (error) {
      logger.error('Failed to calculate activity trends', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate(activityData) {
    try {
      if (activityData.length === 0) return 0;
      const errorCount = activityData.filter(activity => activity.type === 'error').length;
      return errorCount / activityData.length;
    } catch (error) {
      logger.error('Failed to calculate error rate', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate usage consistency
   */
  calculateUsageConsistency(usageData) {
    try {
      if (usageData.length === 0) return 0;
      const dailyUsage = {};
      usageData.forEach(usage => {
        const date = new Date(usage.timestamp).toDateString();
        dailyUsage[date] = (dailyUsage[date] || 0) + 1;
      });
      const usageValues = Object.values(dailyUsage);
      const avgUsage = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
      const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - avgUsage, 2), 0) / usageValues.length;
      const stdDev = Math.sqrt(variance);
      return Math.max(0, 1 - (stdDev / avgUsage));
    } catch (error) {
      logger.error('Failed to calculate usage consistency', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate feature adoption
   */
  calculateFeatureAdoption(usageData) {
    try {
      if (usageData.length === 0) return 0;
      const totalFeatures = new Set(usageData.map(usage => usage.feature)).size;
      const usedFeatures = new Set(usageData.filter(usage => usage.count > 0).map(usage => usage.feature)).size;
      return usedFeatures / Math.max(totalFeatures, 1);
    } catch (error) {
      logger.error('Failed to calculate feature adoption', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate workflow efficiency
   */
  calculateWorkflowEfficiency(usageData) {
    try {
      if (usageData.length === 0) return 0;
      const completedWorkflows = usageData.filter(usage => usage.status === 'completed').length;
      return completedWorkflows / usageData.length;
    } catch (error) {
      logger.error('Failed to calculate workflow efficiency', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate engagement score
   */
  calculateEngagementScore(engagementData) {
    try {
      if (engagementData.length === 0) return 0;
      const totalScore = engagementData.reduce((sum, data) => sum + (data.score || 0), 0);
      return totalScore / engagementData.length;
    } catch (error) {
      logger.error('Failed to calculate engagement score', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate retention rate
   */
  calculateRetentionRate(engagementData) {
    try {
      if (engagementData.length === 0) return 0;
      const activeUsers = engagementData.filter(data => data.status === 'active').length;
      return activeUsers / engagementData.length;
    } catch (error) {
      logger.error('Failed to calculate retention rate', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate satisfaction level
   */
  calculateSatisfactionLevel(engagementData) {
    try {
      if (engagementData.length === 0) return 0;
      const satisfactionScores = engagementData.filter(data => data.satisfaction !== undefined);
      if (satisfactionScores.length === 0) return 0;
      const totalSatisfaction = satisfactionScores.reduce((sum, data) => sum + data.satisfaction, 0);
      return totalSatisfaction / satisfactionScores.length;
    } catch (error) {
      logger.error('Failed to calculate satisfaction level', { error: error.message });
      return 0;
    }
  }

  /**
   * Generate analysis ID
   */
  generateAnalysisId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ANALYSIS-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Store behavior analysis
   */
  async storeBehaviorAnalysis(userId, analysis) {
    try {
      const { error } = await supabase
        .from('user_behavior_analysis')
        .insert(analysis);

      if (error) throw error;

      // Update in-memory patterns
      if (!this.behaviorPatterns.has(userId)) {
        this.behaviorPatterns.set(userId, []);
      }
      this.behaviorPatterns.get(userId).push(analysis);
    } catch (error) {
      logger.error('Failed to store behavior analysis', { error: error.message, userId });
    }
  }

  /**
   * Load behavior patterns
   */
  async loadBehaviorPatterns(userId) {
    try {
      const { data: patterns, error } = await supabase
        .from('user_behavior_patterns')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.behaviorPatterns.set(userId, patterns || []);
      logger.info('Behavior patterns loaded', { userId, patternCount: patterns?.length || 0 });
    } catch (error) {
      logger.error('Failed to load behavior patterns', { error: error.message, userId });
    }
  }

  /**
   * Load behavior history
   */
  async loadBehaviorHistory(userId) {
    try {
      const { data: history, error } = await supabase
        .from('user_behavior_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.behaviorHistory.set(userId, history || []);
      logger.info('Behavior history loaded', { userId, historyCount: history?.length || 0 });
    } catch (error) {
      logger.error('Failed to load behavior history', { error: error.message, userId });
    }
  }

  /**
   * Load behavior metrics
   */
  async loadBehaviorMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('user_behavior_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.behaviorMetrics.set(userId, metrics || []);
      logger.info('Behavior metrics loaded', { userId, metricCount: metrics?.length || 0 });
    } catch (error) {
      logger.error('Failed to load behavior metrics', { error: error.message, userId });
    }
  }

  /**
   * Get behavior metrics
   */
  async getBehaviorMetrics(userId) {
    try {
      const userPatterns = this.behaviorPatterns.get(userId) || [];
      const userHistory = this.behaviorHistory.get(userId) || [];

      const metrics = {
        totalPatterns: userPatterns.length,
        patternsByType: this.groupPatternsByType(userPatterns),
        avgEngagementScore: this.calculateAvgEngagementScore(userPatterns),
        totalAnalyses: userHistory.length,
        recentAnalyses: userHistory.slice(0, 10).length,
        behaviorTrends: this.analyzeBehaviorTrends(userPatterns)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get behavior metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get behavior insights
   */
  async getBehaviorInsights(userId) {
    try {
      const userPatterns = this.behaviorPatterns.get(userId) || [];
      const userHistory = this.behaviorHistory.get(userId) || [];

      const insights = {
        behaviorTrends: this.analyzeBehaviorTrends(userPatterns),
        patternAnalysis: this.analyzePatternAnalysis(userPatterns),
        engagementAnalysis: this.analyzeEngagementAnalysis(userPatterns),
        recommendations: this.generateBehaviorRecommendations(userId, userPatterns, [])
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get behavior insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset behavior analytics system for user
   */
  async reset(userId) {
    try {
      this.behaviorPatterns.delete(userId);
      this.behaviorMetrics.delete(userId);
      this.behaviorHistory.delete(userId);
      this.behaviorInsights.delete(userId);

      logger.info('Behavior analytics system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset behavior analytics system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
