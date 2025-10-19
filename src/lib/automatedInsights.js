/**
 * Automated Insights Generation System
 * 
 * Handles automated insights generation, pattern recognition,
 * and intelligent recommendations.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AutomatedInsights {
  constructor() {
    this.insightRules = new Map();
    this.insightPatterns = new Map();
    this.insightHistory = new Map();
    this.insightMetrics = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize automated insights system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Automated Insights', { userId });

      // Load insight rules and patterns
      await this.loadInsightRules(userId);
      await this.loadInsightPatterns(userId);
      await this.loadInsightHistory(userId);

      this.isInitialized = true;
      logger.info('Automated Insights initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Automated Insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate insights
   */
  async generateInsights(userId, insightData) {
    try {
      logger.info('Generating insights', { userId, insightType: insightData.type });

      // Analyze data for patterns
      const patterns = await this.analyzePatterns(userId, insightData);

      // Apply insight rules
      const ruleInsights = await this.applyInsightRules(userId, patterns);

      // Generate intelligent recommendations
      const recommendations = await this.generateRecommendations(userId, patterns, ruleInsights);

      // Calculate confidence score
      const confidence = await this.calculateConfidence(userId, patterns, ruleInsights);

      // Create insights object
      const insights = {
        id: this.generateInsightId(),
        user_id: userId,
        type: insightData.type,
        patterns: patterns,
        insights: ruleInsights,
        recommendations: recommendations,
        confidence: confidence,
        generated_at: new Date().toISOString()
      };

      // Store insights
      await this.storeInsights(userId, insights);

      logger.info('Insights generated successfully', { 
        userId, 
        insightType: insightData.type,
        insightCount: ruleInsights.length,
        confidence: confidence
      });

      return insights;
    } catch (error) {
      logger.error('Failed to generate insights', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Analyze patterns
   */
  async analyzePatterns(userId, insightData) {
    try {
      const patterns = [];

      // Trend analysis
      const trendPatterns = await this.analyzeTrends(userId, insightData);
      patterns.push(...trendPatterns);

      // Anomaly detection
      const anomalyPatterns = await this.detectAnomalies(userId, insightData);
      patterns.push(...anomalyPatterns);

      // Correlation analysis
      const correlationPatterns = await this.analyzeCorrelations(userId, insightData);
      patterns.push(...correlationPatterns);

      // Seasonal patterns
      const seasonalPatterns = await this.analyzeSeasonality(userId, insightData);
      patterns.push(...seasonalPatterns);

      return patterns;
    } catch (error) {
      logger.error('Failed to analyze patterns', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Analyze trends
   */
  async analyzeTrends(userId, insightData) {
    try {
      const trends = [];

      // Simulate trend analysis
      const dataPoints = insightData.dataPoints || 10;
      const values = Array.from({ length: dataPoints }, () => Math.random() * 100);

      // Calculate trend direction
      const firstHalf = values.slice(0, Math.floor(dataPoints / 2));
      const secondHalf = values.slice(Math.floor(dataPoints / 2));
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

      let trendDirection = 'stable';
      if (secondAvg > firstAvg * 1.1) {
        trendDirection = 'increasing';
      } else if (secondAvg < firstAvg * 0.9) {
        trendDirection = 'decreasing';
      }

      trends.push({
        type: 'trend',
        direction: trendDirection,
        strength: Math.abs(secondAvg - firstAvg) / firstAvg,
        confidence: 0.8,
        description: `${trendDirection} trend detected with ${Math.abs(secondAvg - firstAvg) / firstAvg * 100}% change`
      });

      return trends;
    } catch (error) {
      logger.error('Failed to analyze trends', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(userId, insightData) {
    try {
      const anomalies = [];

      // Simulate anomaly detection
      const dataPoints = insightData.dataPoints || 10;
      const values = Array.from({ length: dataPoints }, () => Math.random() * 100);

      // Calculate mean and standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Find outliers (values more than 2 standard deviations from mean)
      values.forEach((value, index) => {
        if (Math.abs(value - mean) > 2 * stdDev) {
          anomalies.push({
            type: 'anomaly',
            value: value,
            index: index,
            deviation: Math.abs(value - mean) / stdDev,
            confidence: 0.9,
            description: `Anomaly detected: value ${value} is ${Math.abs(value - mean) / stdDev} standard deviations from mean`
          });
        }
      });

      return anomalies;
    } catch (error) {
      logger.error('Failed to detect anomalies', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Analyze correlations
   */
  async analyzeCorrelations(userId, insightData) {
    try {
      const correlations = [];

      // Simulate correlation analysis
      const dataPoints = insightData.dataPoints || 10;
      const series1 = Array.from({ length: dataPoints }, () => Math.random() * 100);
      const series2 = Array.from({ length: dataPoints }, () => Math.random() * 100);

      // Calculate correlation coefficient
      const correlation = this.calculateCorrelation(series1, series2);

      if (Math.abs(correlation) > 0.7) {
        correlations.push({
          type: 'correlation',
          correlation: correlation,
          strength: Math.abs(correlation),
          confidence: 0.85,
          description: `${correlation > 0 ? 'Positive' : 'Negative'} correlation detected (${correlation.toFixed(2)})`
        });
      }

      return correlations;
    } catch (error) {
      logger.error('Failed to analyze correlations', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Analyze seasonality
   */
  async analyzeSeasonality(userId, insightData) {
    try {
      const seasonality = [];

      // Simulate seasonality analysis
      const dataPoints = insightData.dataPoints || 12;
      const values = Array.from({ length: dataPoints }, (_, i) => {
        const seasonalComponent = Math.sin((i / dataPoints) * 2 * Math.PI) * 20;
        const trendComponent = i * 2;
        const noiseComponent = (Math.random() - 0.5) * 10;
        return seasonalComponent + trendComponent + noiseComponent;
      });

      // Detect seasonal patterns
      const seasonalStrength = this.calculateSeasonalStrength(values);

      if (seasonalStrength > 0.5) {
        seasonality.push({
          type: 'seasonality',
          strength: seasonalStrength,
          period: 12, // Monthly seasonality
          confidence: 0.75,
          description: `Seasonal pattern detected with ${seasonalStrength * 100}% strength`
        });
      }

      return seasonality;
    } catch (error) {
      logger.error('Failed to analyze seasonality', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Apply insight rules
   */
  async applyInsightRules(userId, patterns) {
    try {
      const insights = [];
      const userRules = this.insightRules.get(userId) || [];

      for (const pattern of patterns) {
        for (const rule of userRules) {
          if (this.matchesRule(pattern, rule)) {
            const insight = await this.generateInsightFromRule(pattern, rule);
            insights.push(insight);
          }
        }
      }

      return insights;
    } catch (error) {
      logger.error('Failed to apply insight rules', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(userId, patterns, insights) {
    try {
      const recommendations = [];

      // Generate recommendations based on patterns
      for (const pattern of patterns) {
        switch (pattern.type) {
          case 'trend':
            if (pattern.direction === 'increasing') {
              recommendations.push({
                type: 'action',
                priority: 'medium',
                title: 'Capitalize on Growth Trend',
                description: 'Consider increasing resources to capitalize on the upward trend',
                action: 'Increase investment in this area'
              });
            } else if (pattern.direction === 'decreasing') {
              recommendations.push({
                type: 'action',
                priority: 'high',
                title: 'Address Declining Trend',
                description: 'Take immediate action to address the declining trend',
                action: 'Investigate root causes and implement corrective measures'
              });
            }
            break;

          case 'anomaly':
            recommendations.push({
              type: 'investigation',
              priority: 'high',
              title: 'Investigate Anomaly',
              description: 'Anomaly detected that requires investigation',
              action: 'Review data quality and investigate potential causes'
            });
            break;

          case 'correlation':
            if (Math.abs(pattern.correlation) > 0.8) {
              recommendations.push({
                type: 'insight',
                priority: 'medium',
                title: 'Strong Correlation Found',
                description: 'Strong correlation detected between variables',
                action: 'Consider this relationship in future analysis'
              });
            }
            break;

          case 'seasonality':
            recommendations.push({
              type: 'planning',
              priority: 'low',
              title: 'Seasonal Planning',
              description: 'Seasonal pattern detected for planning purposes',
              action: 'Adjust forecasts and planning to account for seasonality'
            });
            break;
        }
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate recommendations', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Calculate confidence
   */
  async calculateConfidence(userId, patterns, insights) {
    try {
      let totalConfidence = 0;
      let count = 0;

      // Calculate confidence from patterns
      for (const pattern of patterns) {
        totalConfidence += pattern.confidence || 0.5;
        count++;
      }

      // Calculate confidence from insights
      for (const insight of insights) {
        totalConfidence += insight.confidence || 0.5;
        count++;
      }

      return count > 0 ? totalConfidence / count : 0.5;
    } catch (error) {
      logger.error('Failed to calculate confidence', { error: error.message, userId });
      return 0.5;
    }
  }

  /**
   * Calculate correlation coefficient
   */
  calculateCorrelation(series1, series2) {
    try {
      const n = series1.length;
      const sum1 = series1.reduce((sum, val) => sum + val, 0);
      const sum2 = series2.reduce((sum, val) => sum + val, 0);
      const sum1Sq = series1.reduce((sum, val) => sum + val * val, 0);
      const sum2Sq = series2.reduce((sum, val) => sum + val * val, 0);
      const sum12 = series1.reduce((sum, val, i) => sum + val * series2[i], 0);

      const numerator = n * sum12 - sum1 * sum2;
      const denominator = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));

      return denominator === 0 ? 0 : numerator / denominator;
    } catch (error) {
      logger.error('Failed to calculate correlation', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate seasonal strength
   */
  calculateSeasonalStrength(values) {
    try {
      const n = values.length;
      const mean = values.reduce((sum, val) => sum + val, 0) / n;

      // Calculate seasonal component
      let seasonalSum = 0;
      for (let i = 0; i < n; i++) {
        const seasonalComponent = Math.sin((i / n) * 2 * Math.PI) * 20;
        seasonalSum += Math.abs(seasonalComponent);
      }

      const totalVariation = values.reduce((sum, val) => sum + Math.abs(val - mean), 0);

      return totalVariation > 0 ? seasonalSum / totalVariation : 0;
    } catch (error) {
      logger.error('Failed to calculate seasonal strength', { error: error.message });
      return 0;
    }
  }

  /**
   * Generate insight ID
   */
  generateInsightId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `INSIGHT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Store insights
   */
  async storeInsights(userId, insights) {
    try {
      const { error } = await supabase
        .from('bi_insights')
        .insert(insights);

      if (error) throw error;

      // Update in-memory history
      if (!this.insightHistory.has(userId)) {
        this.insightHistory.set(userId, []);
      }
      this.insightHistory.get(userId).unshift(insights);

      // Keep only recent insights
      const userInsights = this.insightHistory.get(userId);
      if (userInsights.length > 100) {
        userInsights.splice(100);
      }
    } catch (error) {
      logger.error('Failed to store insights', { error: error.message, userId });
    }
  }

  /**
   * Load insight rules
   */
  async loadInsightRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('bi_insight_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.insightRules.set(userId, rules || []);
      logger.info('Insight rules loaded', { userId, ruleCount: rules?.length || 0 });
    } catch (error) {
      logger.error('Failed to load insight rules', { error: error.message, userId });
    }
  }

  /**
   * Load insight patterns
   */
  async loadInsightPatterns(userId) {
    try {
      const { data: patterns, error } = await supabase
        .from('bi_insight_patterns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.insightPatterns.set(userId, patterns || []);
      logger.info('Insight patterns loaded', { userId, patternCount: patterns?.length || 0 });
    } catch (error) {
      logger.error('Failed to load insight patterns', { error: error.message, userId });
    }
  }

  /**
   * Load insight history
   */
  async loadInsightHistory(userId) {
    try {
      const { data: history, error } = await supabase
        .from('bi_insights')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.insightHistory.set(userId, history || []);
      logger.info('Insight history loaded', { userId, historyCount: history?.length || 0 });
    } catch (error) {
      logger.error('Failed to load insight history', { error: error.message, userId });
    }
  }

  /**
   * Get insights metrics
   */
  async getInsightsMetrics(userId) {
    try {
      const userInsights = this.insightHistory.get(userId) || [];
      const userRules = this.insightRules.get(userId) || [];

      const metrics = {
        totalInsights: userInsights.length,
        insightsByType: this.groupInsightsByType(userInsights),
        avgConfidence: this.calculateAvgConfidence(userInsights),
        totalRules: userRules.length,
        activeRules: userRules.filter(rule => rule.active).length,
        insightFrequency: this.analyzeInsightFrequency(userInsights)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get insights metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get insights insights
   */
  async getInsightsInsights(userId) {
    try {
      const userInsights = this.insightHistory.get(userId) || [];
      const userRules = this.insightRules.get(userId) || [];

      const insights = {
        insightTrends: this.analyzeInsightTrends(userInsights),
        patternAnalysis: this.analyzePatternAnalysis(userInsights),
        ruleEffectiveness: this.analyzeRuleEffectiveness(userRules, userInsights),
        recommendations: this.generateInsightRecommendations(userInsights, userRules)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get insights insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset insights system for user
   */
  async reset(userId) {
    try {
      this.insightRules.delete(userId);
      this.insightPatterns.delete(userId);
      this.insightHistory.delete(userId);
      this.insightMetrics.delete(userId);

      logger.info('Insights system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset insights system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
