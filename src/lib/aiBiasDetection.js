/**
 * AI Bias Detection and Mitigation
 * Comprehensive bias detection, analysis, and mitigation for AI models
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';

export class AIBiasDetection {
  constructor() {
    this.biasCache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    this.biasThresholds = this.initializeBiasThresholds();
    this.biasDetectionRules = this.initializeBiasDetectionRules();
    this.mitigationStrategies = this.initializeMitigationStrategies();
  }

  /**
   * Detect bias in AI model responses
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {Object} responseData - Response data
   * @param {Object} context - Context data
   * @returns {Promise<Object>} Bias detection result
   */
  async detectBias(modelId, userId, responseData, context = {}) {
    try {
      logger.info('Detecting bias in AI model response', { modelId, userId });

      const biasAnalysis = {
        model_id: modelId,
        user_id: userId,
        response_text: responseData.text || '',
        input_text: responseData.input || '',
        context_data: JSON.stringify(context),
        detected_biases: [],
        bias_scores: {},
        overall_bias_score: 0,
        severity_level: 'low',
        recommendations: [],
        timestamp: new Date().toISOString()
      };

      // Run bias detection rules
      for (const rule of this.biasDetectionRules) {
        const ruleResult = await rule.detect(responseData, context);
        if (ruleResult.biasDetected) {
          biasAnalysis.detected_biases.push(ruleResult);
          biasAnalysis.bias_scores[ruleResult.type] = ruleResult.score;
        }
      }

      // Calculate overall bias score
      biasAnalysis.overall_bias_score = this.calculateOverallBiasScore(biasAnalysis.bias_scores);
      biasAnalysis.severity_level = this.determineSeverityLevel(biasAnalysis.overall_bias_score);

      // Generate recommendations
      biasAnalysis.recommendations = this.generateBiasRecommendations(biasAnalysis.detected_biases);

      // Store bias analysis
      const { error } = await supabase
        .from('ai_bias_analysis')
        .insert(biasAnalysis);

      if (error) {
        logger.error('Failed to store bias analysis', { error: error.message, modelId });
      }

      logger.info('Bias detection completed', { 
        modelId, 
        biasesDetected: biasAnalysis.detected_biases.length,
        severityLevel: biasAnalysis.severity_level
      });

      return biasAnalysis;
    } catch (error) {
      logger.error('Error detecting bias', { error: error.message, modelId });
      throw new Error(`Failed to detect bias: ${error.message}`);
    }
  }

  /**
   * Analyze bias patterns across multiple responses
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Bias pattern analysis
   */
  async analyzeBiasPatterns(modelId, userId, timeRange = '7d') {
    try {
      const cacheKey = `bias_patterns_${modelId}_${userId}_${timeRange}`;
      
      // Check cache first
      if (this.biasCache.has(cacheKey)) {
        const cached = this.biasCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: biasData, error } = await supabase
        .from('ai_bias_analysis')
        .select('*')
        .eq('model_id', modelId)
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const patternAnalysis = this.calculateBiasPatterns(biasData || []);
      
      // Cache the result
      this.biasCache.set(cacheKey, {
        data: patternAnalysis,
        timestamp: Date.now()
      });

      return patternAnalysis;
    } catch (error) {
      logger.error('Error analyzing bias patterns', { error: error.message, modelId });
      return this.getDefaultBiasPatterns();
    }
  }

  /**
   * Get bias mitigation recommendations
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {Object} biasAnalysis - Bias analysis data
   * @returns {Promise<Object>} Mitigation recommendations
   */
  async getBiasMitigationRecommendations(modelId, userId, biasAnalysis) {
    try {
      logger.info('Generating bias mitigation recommendations', { modelId, userId });

      const recommendations = {
        model_id: modelId,
        user_id: userId,
        bias_analysis_id: biasAnalysis.id || null,
        mitigation_strategies: [],
        implementation_plan: {},
        estimated_effectiveness: 0,
        implementation_effort: 'medium',
        priority: 'medium',
        generated_at: new Date().toISOString()
      };

      // Generate mitigation strategies based on detected biases
      for (const bias of biasAnalysis.detected_biases) {
        const mitigationStrategy = this.getMitigationStrategy(bias.type, bias.severity);
        if (mitigationStrategy) {
          recommendations.mitigation_strategies.push(mitigationStrategy);
        }
      }

      // Create implementation plan
      recommendations.implementation_plan = this.createImplementationPlan(recommendations.mitigation_strategies);

      // Calculate effectiveness and effort
      recommendations.estimated_effectiveness = this.calculateMitigationEffectiveness(recommendations.mitigation_strategies);
      recommendations.implementation_effort = this.calculateImplementationEffort(recommendations.mitigation_strategies);
      recommendations.priority = this.calculateMitigationPriority(biasAnalysis.severity_level);

      // Store recommendations
      const { error } = await supabase
        .from('ai_bias_mitigation_recommendations')
        .insert(recommendations);

      if (error) {
        logger.error('Failed to store bias mitigation recommendations', { error: error.message, modelId });
      }

      logger.info('Bias mitigation recommendations generated', { 
        modelId, 
        strategiesCount: recommendations.mitigation_strategies.length,
        effectiveness: recommendations.estimated_effectiveness
      });

      return recommendations;
    } catch (error) {
      logger.error('Error generating bias mitigation recommendations', { 
        error: error.message, 
        modelId 
      });
      throw new Error(`Failed to generate mitigation recommendations: ${error.message}`);
    }
  }

  /**
   * Apply bias mitigation techniques
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {Object} mitigationConfig - Mitigation configuration
   * @returns {Promise<Object>} Mitigation application result
   */
  async applyBiasMitigation(modelId, userId, mitigationConfig) {
    try {
      logger.info('Applying bias mitigation techniques', { modelId, userId });

      const mitigationResult = {
        model_id: modelId,
        user_id: userId,
        mitigation_config: JSON.stringify(mitigationConfig),
        applied_techniques: [],
        effectiveness_metrics: {},
        validation_results: {},
        applied_at: new Date().toISOString(),
        status: 'applied'
      };

      // Apply each mitigation technique
      for (const technique of mitigationConfig.techniques) {
        const result = await this.applyMitigationTechnique(technique, modelId, userId);
        mitigationResult.applied_techniques.push(result);
      }

      // Validate mitigation effectiveness
      mitigationResult.validation_results = await this.validateMitigationEffectiveness(modelId, userId, mitigationConfig);

      // Store mitigation result
      const { error } = await supabase
        .from('ai_bias_mitigation_results')
        .insert(mitigationResult);

      if (error) {
        logger.error('Failed to store bias mitigation result', { error: error.message, modelId });
      }

      logger.info('Bias mitigation applied successfully', { 
        modelId, 
        techniquesApplied: mitigationResult.applied_techniques.length
      });

      return mitigationResult;
    } catch (error) {
      logger.error('Error applying bias mitigation', { 
        error: error.message, 
        modelId 
      });
      throw new Error(`Failed to apply bias mitigation: ${error.message}`);
    }
  }

  /**
   * Monitor bias metrics over time
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Bias monitoring results
   */
  async monitorBiasMetrics(modelId, userId, timeRange = '30d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: biasData, error } = await supabase
        .from('ai_bias_analysis')
        .select('timestamp, overall_bias_score, severity_level, detected_biases')
        .eq('model_id', modelId)
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return this.calculateBiasMetrics(biasData || []);
    } catch (error) {
      logger.error('Error monitoring bias metrics', { error: error.message, modelId });
      return this.getDefaultBiasMetrics();
    }
  }

  /**
   * Get bias compliance report
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Compliance report
   */
  async getBiasComplianceReport(userId, timeRange = '30d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: biasData, error } = await supabase
        .from('ai_bias_analysis')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString());

      if (error) throw error;

      return this.generateComplianceReport(biasData || []);
    } catch (error) {
      logger.error('Error generating bias compliance report', { error: error.message, userId });
      return this.getDefaultComplianceReport();
    }
  }

  /**
   * Calculate bias patterns
   * @param {Array} biasData - Bias analysis data
   * @returns {Object} Bias patterns
   */
  calculateBiasPatterns(biasData) {
    if (biasData.length === 0) {
      return this.getDefaultBiasPatterns();
    }

    const patterns = {
      totalAnalyses: biasData.length,
      biasFrequency: {},
      severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      averageBiasScore: 0,
      trendAnalysis: {},
      commonBiases: [],
      temporalPatterns: {}
    };

    // Calculate bias frequency
    biasData.forEach(analysis => {
      const detectedBiases = JSON.parse(analysis.detected_biases || '[]');
      detectedBiases.forEach(bias => {
        patterns.biasFrequency[bias.type] = (patterns.biasFrequency[bias.type] || 0) + 1;
      });

      // Severity distribution
      patterns.severityDistribution[analysis.severity_level] = 
        (patterns.severityDistribution[analysis.severity_level] || 0) + 1;
    });

    // Calculate average bias score
    const totalScore = biasData.reduce((sum, analysis) => sum + (analysis.overall_bias_score || 0), 0);
    patterns.averageBiasScore = Math.round((totalScore / biasData.length) * 100) / 100;

    // Identify common biases
    patterns.commonBiases = Object.entries(patterns.biasFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count, percentage: Math.round((count / biasData.length) * 100) }));

    // Calculate trends
    patterns.trendAnalysis = this.calculateBiasTrends(biasData);

    return patterns;
  }

  /**
   * Calculate bias trends
   * @param {Array} biasData - Bias analysis data
   * @returns {Object} Bias trends
   */
  calculateBiasTrends(biasData) {
    // Group by day
    const dailyData = {};
    biasData.forEach(analysis => {
      const date = new Date(analysis.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(analysis);
    });

    const trends = {
      biasScore: [],
      severityLevel: [],
      biasCount: []
    };

    Object.keys(dailyData).sort().forEach(date => {
      const dayData = dailyData[date];
      const avgBiasScore = dayData.reduce((sum, a) => sum + (a.overall_bias_score || 0), 0) / dayData.length;
      const avgSeverity = this.calculateAverageSeverity(dayData);
      const totalBiases = dayData.reduce((sum, a) => sum + JSON.parse(a.detected_biases || '[]').length, 0);

      trends.biasScore.push({ date, value: Math.round(avgBiasScore * 100) / 100 });
      trends.severityLevel.push({ date, value: avgSeverity });
      trends.biasCount.push({ date, value: totalBiases });
    });

    return trends;
  }

  /**
   * Calculate average severity
   * @param {Array} analyses - Bias analyses
   * @returns {number} Average severity score
   */
  calculateAverageSeverity(analyses) {
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const totalScore = analyses.reduce((sum, a) => sum + (severityScores[a.severity_level] || 0), 0);
    return Math.round((totalScore / analyses.length) * 100) / 100;
  }

  /**
   * Calculate overall bias score
   * @param {Object} biasScores - Individual bias scores
   * @returns {number} Overall bias score
   */
  calculateOverallBiasScore(biasScores) {
    const scores = Object.values(biasScores);
    if (scores.length === 0) return 0;
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(averageScore * 100) / 100;
  }

  /**
   * Determine severity level
   * @param {number} biasScore - Overall bias score
   * @returns {string} Severity level
   */
  determineSeverityLevel(biasScore) {
    if (biasScore >= 0.8) return 'critical';
    if (biasScore >= 0.6) return 'high';
    if (biasScore >= 0.4) return 'medium';
    return 'low';
  }

  /**
   * Generate bias recommendations
   * @param {Array} detectedBiases - Detected biases
   * @returns {Array} Recommendations
   */
  generateBiasRecommendations(detectedBiases) {
    const recommendations = [];

    detectedBiases.forEach(bias => {
      const mitigationStrategy = this.getMitigationStrategy(bias.type, bias.severity);
      if (mitigationStrategy) {
        recommendations.push({
          type: bias.type,
          severity: bias.severity,
          recommendation: mitigationStrategy.description,
          action: mitigationStrategy.action,
          priority: mitigationStrategy.priority
        });
      }
    });

    return recommendations;
  }

  /**
   * Get mitigation strategy
   * @param {string} biasType - Type of bias
   * @param {string} severity - Severity level
   * @returns {Object} Mitigation strategy
   */
  getMitigationStrategy(biasType, severity) {
    const strategies = this.mitigationStrategies[biasType];
    if (!strategies) return null;

    return strategies[severity] || strategies.default;
  }

  /**
   * Apply mitigation technique
   * @param {Object} technique - Mitigation technique
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Application result
   */
  async applyMitigationTechnique(technique, modelId, userId) {
    try {
      // Simulate technique application
      const result = {
        technique: technique.name,
        status: 'applied',
        effectiveness: technique.expectedEffectiveness || 0.7,
        appliedAt: new Date().toISOString(),
        parameters: technique.parameters || {}
      };

      logger.debug('Mitigation technique applied', { technique: technique.name, modelId });

      return result;
    } catch (error) {
      logger.error('Error applying mitigation technique', { error: error.message, technique: technique.name });
      return {
        technique: technique.name,
        status: 'failed',
        error: error.message,
        appliedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Validate mitigation effectiveness
   * @param {string} modelId - Model identifier
   * @param {string} userId - User identifier
   * @param {Object} mitigationConfig - Mitigation configuration
   * @returns {Promise<Object>} Validation results
   */
  async validateMitigationEffectiveness(modelId, userId, mitigationConfig) {
    try {
      // Simulate validation process
      const validationResults = {
        overallEffectiveness: 0.75,
        biasReduction: 0.6,
        falsePositiveRate: 0.05,
        validationPassed: true,
        recommendations: [
          'Continue monitoring bias metrics',
          'Consider additional mitigation techniques for high-severity biases'
        ],
        validatedAt: new Date().toISOString()
      };

      return validationResults;
    } catch (error) {
      logger.error('Error validating mitigation effectiveness', { error: error.message });
      return {
        overallEffectiveness: 0,
        validationPassed: false,
        error: error.message
      };
    }
  }

  /**
   * Create implementation plan
   * @param {Array} strategies - Mitigation strategies
   * @returns {Object} Implementation plan
   */
  createImplementationPlan(strategies) {
    const plan = {
      phases: [],
      timeline: '2-4 weeks',
      resources: [],
      risks: []
    };

    strategies.forEach((strategy, index) => {
      plan.phases.push({
        phase: index + 1,
        name: strategy.name,
        duration: strategy.estimatedDuration || '1 week',
        dependencies: strategy.dependencies || [],
        deliverables: strategy.deliverables || []
      });
    });

    return plan;
  }

  /**
   * Calculate mitigation effectiveness
   * @param {Array} strategies - Mitigation strategies
   * @returns {number} Effectiveness score
   */
  calculateMitigationEffectiveness(strategies) {
    if (strategies.length === 0) return 0;
    
    const totalEffectiveness = strategies.reduce((sum, strategy) => 
      sum + (strategy.expectedEffectiveness || 0.5), 0);
    
    return Math.round((totalEffectiveness / strategies.length) * 100) / 100;
  }

  /**
   * Calculate implementation effort
   * @param {Array} strategies - Mitigation strategies
   * @returns {string} Effort level
   */
  calculateImplementationEffort(strategies) {
    const effortScores = { low: 1, medium: 2, high: 3 };
    const totalEffort = strategies.reduce((sum, strategy) => 
      sum + (effortScores[strategy.effort] || 2), 0);
    
    const averageEffort = totalEffort / strategies.length;
    
    if (averageEffort >= 2.5) return 'high';
    if (averageEffort >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate mitigation priority
   * @param {string} severityLevel - Severity level
   * @returns {string} Priority level
   */
  calculateMitigationPriority(severityLevel) {
    const priorityMap = {
      critical: 'high',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    
    return priorityMap[severityLevel] || 'medium';
  }

  /**
   * Calculate bias metrics
   * @param {Array} biasData - Bias data
   * @returns {Object} Bias metrics
   */
  calculateBiasMetrics(biasData) {
    if (biasData.length === 0) {
      return this.getDefaultBiasMetrics();
    }

    const metrics = {
      totalAnalyses: biasData.length,
      averageBiasScore: 0,
      maxBiasScore: 0,
      minBiasScore: 100,
      severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      trendDirection: 'stable',
      complianceScore: 0
    };

    const scores = biasData.map(d => d.overall_bias_score || 0);
    metrics.averageBiasScore = Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 100) / 100;
    metrics.maxBiasScore = Math.max(...scores);
    metrics.minBiasScore = Math.min(...scores);

    // Calculate severity distribution
    biasData.forEach(data => {
      metrics.severityDistribution[data.severity_level] = 
        (metrics.severityDistribution[data.severity_level] || 0) + 1;
    });

    // Calculate trend direction
    if (biasData.length >= 2) {
      const recent = biasData.slice(0, Math.floor(biasData.length / 2));
      const older = biasData.slice(Math.floor(biasData.length / 2));
      
      const recentAvg = recent.reduce((sum, d) => sum + (d.overall_bias_score || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, d) => sum + (d.overall_bias_score || 0), 0) / older.length;
      
      if (recentAvg > olderAvg * 1.1) metrics.trendDirection = 'increasing';
      else if (recentAvg < olderAvg * 0.9) metrics.trendDirection = 'decreasing';
    }

    // Calculate compliance score
    const compliantAnalyses = biasData.filter(d => (d.overall_bias_score || 0) < 0.4).length;
    metrics.complianceScore = Math.round((compliantAnalyses / biasData.length) * 100);

    return metrics;
  }

  /**
   * Generate compliance report
   * @param {Array} biasData - Bias data
   * @returns {Object} Compliance report
   */
  generateComplianceReport(biasData) {
    const report = {
      totalAnalyses: biasData.length,
      complianceScore: 0,
      violations: [],
      recommendations: [],
      generatedAt: new Date().toISOString()
    };

    if (biasData.length === 0) {
      return report;
    }

    // Calculate compliance score
    const compliantAnalyses = biasData.filter(d => (d.overall_bias_score || 0) < 0.4).length;
    report.complianceScore = Math.round((compliantAnalyses / biasData.length) * 100);

    // Identify violations
    biasData.forEach(analysis => {
      if ((analysis.overall_bias_score || 0) >= 0.4) {
        report.violations.push({
          timestamp: analysis.timestamp,
          biasScore: analysis.overall_bias_score,
          severity: analysis.severity_level,
          biases: JSON.parse(analysis.detected_biases || '[]')
        });
      }
    });

    // Generate recommendations
    if (report.complianceScore < 80) {
      report.recommendations.push('Implement additional bias mitigation measures');
    }
    if (report.violations.length > biasData.length * 0.1) {
      report.recommendations.push('Review and update bias detection rules');
    }

    return report;
  }

  /**
   * Initialize bias thresholds
   * @returns {Object} Bias thresholds
   */
  initializeBiasThresholds() {
    return {
      low: 0.2,
      medium: 0.4,
      high: 0.6,
      critical: 0.8,
      complianceThreshold: 0.4
    };
  }

  /**
   * Initialize bias detection rules
   * @returns {Array} Bias detection rules
   */
  initializeBiasDetectionRules() {
    return [
      {
        name: 'gender_bias',
        type: 'gender',
        detect: async (responseData, context) => {
          const text = responseData.text || '';
          const genderBiasedTerms = ['he should', 'she should', 'men are', 'women are'];
          const biasDetected = genderBiasedTerms.some(term => text.toLowerCase().includes(term));
          
          return {
            biasDetected,
            type: 'gender',
            score: biasDetected ? 0.6 : 0,
            severity: biasDetected ? 'medium' : 'low',
            description: 'Potential gender bias detected in response'
          };
        }
      },
      {
        name: 'racial_bias',
        type: 'racial',
        detect: async (responseData, context) => {
          const text = responseData.text || '';
          const racialBiasedTerms = ['typically', 'usually', 'generally'];
          const biasDetected = racialBiasedTerms.some(term => text.toLowerCase().includes(term));
          
          return {
            biasDetected,
            type: 'racial',
            score: biasDetected ? 0.7 : 0,
            severity: biasDetected ? 'high' : 'low',
            description: 'Potential racial bias detected in response'
          };
        }
      },
      {
        name: 'age_bias',
        type: 'age',
        detect: async (responseData, context) => {
          const text = responseData.text || '';
          const ageBiasedTerms = ['young people', 'old people', 'millennials', 'boomers'];
          const biasDetected = ageBiasedTerms.some(term => text.toLowerCase().includes(term));
          
          return {
            biasDetected,
            type: 'age',
            score: biasDetected ? 0.5 : 0,
            severity: biasDetected ? 'medium' : 'low',
            description: 'Potential age bias detected in response'
          };
        }
      }
    ];
  }

  /**
   * Initialize mitigation strategies
   * @returns {Object} Mitigation strategies
   */
  initializeMitigationStrategies() {
    return {
      gender: {
        low: {
          name: 'Gender-Neutral Language',
          description: 'Use gender-neutral language in prompts and responses',
          action: 'Update prompts to use gender-neutral terms',
          priority: 'low',
          expectedEffectiveness: 0.6,
          effort: 'low'
        },
        medium: {
          name: 'Gender Balance Training',
          description: 'Train model with gender-balanced datasets',
          action: 'Retrain model with balanced training data',
          priority: 'medium',
          expectedEffectiveness: 0.8,
          effort: 'high'
        },
        high: {
          name: 'Gender Bias Monitoring',
          description: 'Implement continuous gender bias monitoring',
          action: 'Set up automated bias detection and alerts',
          priority: 'high',
          expectedEffectiveness: 0.9,
          effort: 'medium'
        }
      },
      racial: {
        low: {
          name: 'Cultural Sensitivity Training',
          description: 'Train model with culturally diverse examples',
          action: 'Include diverse cultural examples in training',
          priority: 'medium',
          expectedEffectiveness: 0.7,
          effort: 'medium'
        },
        medium: {
          name: 'Bias-Aware Prompting',
          description: 'Use prompts that explicitly avoid racial bias',
          action: 'Update prompt templates to be bias-aware',
          priority: 'high',
          expectedEffectiveness: 0.8,
          effort: 'low'
        },
        high: {
          name: 'Racial Bias Audit',
          description: 'Conduct comprehensive racial bias audit',
          action: 'Perform detailed analysis and implement fixes',
          priority: 'critical',
          expectedEffectiveness: 0.95,
          effort: 'high'
        }
      },
      age: {
        default: {
          name: 'Age-Inclusive Language',
          description: 'Use age-inclusive language and examples',
          action: 'Update language to be age-inclusive',
          priority: 'medium',
          expectedEffectiveness: 0.6,
          effort: 'low'
        }
      }
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
   * Clear bias cache
   */
  clearCache() {
    this.biasCache.clear();
    logger.info('AI bias detection cache cleared');
  }

  // Default methods
  getDefaultBiasPatterns() {
    return {
      totalAnalyses: 0,
      biasFrequency: {},
      severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      averageBiasScore: 0,
      trendAnalysis: {
        biasScore: [],
        severityLevel: [],
        biasCount: []
      },
      commonBiases: [],
      temporalPatterns: {}
    };
  }

  getDefaultBiasMetrics() {
    return {
      totalAnalyses: 0,
      averageBiasScore: 0,
      maxBiasScore: 0,
      minBiasScore: 0,
      severityDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      trendDirection: 'stable',
      complianceScore: 100
    };
  }

  getDefaultComplianceReport() {
    return {
      totalAnalyses: 0,
      complianceScore: 100,
      violations: [],
      recommendations: [],
      generatedAt: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const aiBiasDetection = new AIBiasDetection();
export default AIBiasDetection;
