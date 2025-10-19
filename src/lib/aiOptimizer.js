/**
 * AI Performance Optimization System
 * 
 * Handles AI performance optimization, model selection,
 * resource management, and performance monitoring.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AIOptimizer {
  constructor() {
    this.performanceMetrics = new Map();
    this.modelPerformance = new Map();
    this.optimizationRules = new Map();
    this.resourceUsage = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize optimization system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing AI Optimizer', { userId });

      // Load performance metrics
      await this.loadPerformanceMetrics(userId);
      await this.loadModelPerformance(userId);
      await this.loadOptimizationRules(userId);
      await this.loadResourceUsage(userId);

      this.isInitialized = true;
      logger.info('AI Optimizer initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize AI Optimizer', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Select optimal model for request
   */
  async selectOptimalModel(userId, prompt, context = {}) {
    try {
      const availableModels = await this.getAvailableModels(userId);
      const performanceData = this.modelPerformance.get(userId) || {};
      const resourceConstraints = await this.getResourceConstraints(userId);

      // Score each model based on multiple factors
      const modelScores = availableModels.map(model => {
        const score = this.calculateModelScore(model, prompt, context, performanceData, resourceConstraints);
        return { ...model, score };
      });

      // Sort by score and select best
      const optimalModel = modelScores.sort((a, b) => b.score - a.score)[0];

      logger.info('Optimal model selected', { 
        userId, 
        modelName: optimalModel.name, 
        score: optimalModel.score 
      });

      return optimalModel;
    } catch (error) {
      logger.error('Failed to select optimal model', { error: error.message, userId });
      return this.getDefaultModel();
    }
  }

  /**
   * Optimize AI performance
   */
  async optimizePerformance(userId) {
    try {
      const performanceMetrics = this.performanceMetrics.get(userId) || [];
      const modelPerformance = this.modelPerformance.get(userId) || {};
      const resourceUsage = this.resourceUsage.get(userId) || {};

      // Analyze performance trends
      const performanceAnalysis = this.analyzePerformanceTrends(performanceMetrics);
      
      // Identify optimization opportunities
      const optimizationOpportunities = this.identifyOptimizationOpportunities(
        performanceAnalysis, 
        modelPerformance, 
        resourceUsage
      );

      // Apply optimizations
      const optimizationResults = await this.applyOptimizations(userId, optimizationOpportunities);

      // Calculate performance gain
      const performanceGain = this.calculatePerformanceGain(optimizationResults);

      logger.info('Performance optimization completed', { 
        userId, 
        performanceGain,
        optimizationsApplied: optimizationResults.length
      });

      return {
        success: true,
        performanceGain,
        optimizationResults,
        opportunities: optimizationOpportunities
      };
    } catch (error) {
      logger.error('Failed to optimize performance', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(userId) {
    try {
      const metrics = this.performanceMetrics.get(userId) || [];
      const modelMetrics = this.modelPerformance.get(userId) || {};
      const resourceMetrics = this.resourceUsage.get(userId) || {};

      const performanceData = {
        totalRequests: metrics.length,
        avgResponseTime: this.calculateAvgResponseTime(metrics),
        avgTokenUsage: this.calculateAvgTokenUsage(metrics),
        successRate: this.calculateSuccessRate(metrics),
        modelPerformance: this.calculateModelPerformanceMetrics(modelMetrics),
        resourceUsage: this.calculateResourceUsageMetrics(resourceMetrics),
        trends: this.analyzePerformanceTrends(metrics)
      };

      return {
        success: true,
        metrics: performanceData
      };
    } catch (error) {
      logger.error('Failed to get performance metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get optimization recommendations
   */
  async getRecommendations(userId) {
    try {
      const performanceMetrics = this.performanceMetrics.get(userId) || [];
      const modelPerformance = this.modelPerformance.get(userId) || {};
      const resourceUsage = this.resourceUsage.get(userId) || {};

      const recommendations = [];

      // Response time recommendations
      const avgResponseTime = this.calculateAvgResponseTime(performanceMetrics);
      if (avgResponseTime > 5000) {
        recommendations.push({
          type: 'response_time',
          priority: 'high',
          message: 'Consider using faster models or optimizing prompts',
          impact: 'high'
        });
      }

      // Token usage recommendations
      const avgTokenUsage = this.calculateAvgTokenUsage(performanceMetrics);
      if (avgTokenUsage > 1000) {
        recommendations.push({
          type: 'token_usage',
          priority: 'medium',
          message: 'Optimize prompts to reduce token consumption',
          impact: 'medium'
        });
      }

      // Model performance recommendations
      const modelRecommendations = this.getModelRecommendations(modelPerformance);
      recommendations.push(...modelRecommendations);

      // Resource usage recommendations
      const resourceRecommendations = this.getResourceRecommendations(resourceUsage);
      recommendations.push(...resourceRecommendations);

      return {
        success: true,
        recommendations
      };
    } catch (error) {
      logger.error('Failed to get recommendations', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor performance in real-time
   */
  async monitorPerformance(userId, request) {
    try {
      const startTime = Date.now();
      
      // Track request start
      const performanceData = {
        user_id: userId,
        request_id: request.id,
        start_time: startTime,
        model: request.model,
        prompt_length: request.prompt?.length || 0,
        context_type: request.context?.type || 'general'
      };

      // Store performance data
      this.performanceMetrics.set(userId, [
        ...(this.performanceMetrics.get(userId) || []),
        performanceData
      ]);

      return performanceData;
    } catch (error) {
      logger.error('Failed to monitor performance', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Update performance metrics
   */
  async updatePerformanceMetrics(userId, requestId, response) {
    try {
      const metrics = this.performanceMetrics.get(userId) || [];
      const performanceData = metrics.find(m => m.request_id === requestId);

      if (performanceData) {
        performanceData.end_time = Date.now();
        performanceData.response_time = performanceData.end_time - performanceData.start_time;
        performanceData.token_count = response.tokenCount || 0;
        performanceData.success = response.success || false;
        performanceData.error = response.error || null;

        // Update model performance
        await this.updateModelPerformance(userId, performanceData);

        // Update resource usage
        await this.updateResourceUsage(userId, performanceData);
      }
    } catch (error) {
      logger.error('Failed to update performance metrics', { error: error.message, userId });
    }
  }

  /**
   * Load performance metrics
   */
  async loadPerformanceMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('ai_performance_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.performanceMetrics.set(userId, metrics || []);
      logger.info('Performance metrics loaded', { userId, metricCount: metrics?.length || 0 });
    } catch (error) {
      logger.error('Failed to load performance metrics', { error: error.message, userId });
    }
  }

  /**
   * Load model performance data
   */
  async loadModelPerformance(userId) {
    try {
      const { data: modelData, error } = await supabase
        .from('ai_model_performance')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      const modelMap = {};
      modelData.forEach(model => {
        modelMap[model.model_name] = model;
      });

      this.modelPerformance.set(userId, modelMap);
      logger.info('Model performance loaded', { userId, modelCount: modelData.length });
    } catch (error) {
      logger.error('Failed to load model performance', { error: error.message, userId });
    }
  }

  /**
   * Load optimization rules
   */
  async loadOptimizationRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('ai_optimization_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      const ruleMap = {};
      rules.forEach(rule => {
        ruleMap[rule.rule_type] = rule;
      });

      this.optimizationRules.set(userId, ruleMap);
      logger.info('Optimization rules loaded', { userId, ruleCount: rules.length });
    } catch (error) {
      logger.error('Failed to load optimization rules', { error: error.message, userId });
    }
  }

  /**
   * Load resource usage data
   */
  async loadResourceUsage(userId) {
    try {
      const { data: usage, error } = await supabase
        .from('ai_resource_usage')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.resourceUsage.set(userId, usage || []);
      logger.info('Resource usage loaded', { userId, usageCount: usage?.length || 0 });
    } catch (error) {
      logger.error('Failed to load resource usage', { error: error.message, userId });
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(userId) {
    try {
      const { data: models, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      return models || [];
    } catch (error) {
      logger.error('Failed to get available models', { error: error.message, userId });
      return [this.getDefaultModel()];
    }
  }

  /**
   * Get resource constraints
   */
  async getResourceConstraints(userId) {
    try {
      const { data: constraints, error } = await supabase
        .from('ai_resource_constraints')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return constraints || {
        max_response_time: 10000,
        max_token_usage: 2000,
        max_concurrent_requests: 5,
        budget_limit: 100
      };
    } catch (error) {
      logger.error('Failed to get resource constraints', { error: error.message, userId });
      return {
        max_response_time: 10000,
        max_token_usage: 2000,
        max_concurrent_requests: 5,
        budget_limit: 100
      };
    }
  }

  /**
   * Calculate model score
   */
  calculateModelScore(model, prompt, context, performanceData, resourceConstraints) {
    let score = 0;

    // Performance score (0-40 points)
    const modelPerf = performanceData[model.name] || {};
    const avgResponseTime = modelPerf.avg_response_time || model.default_response_time || 3000;
    const avgTokenUsage = modelPerf.avg_token_usage || model.default_token_usage || 500;
    const successRate = modelPerf.success_rate || 0.95;

    score += Math.max(0, 40 - (avgResponseTime / 1000)) * 0.4; // Response time factor
    score += Math.max(0, 40 - (avgTokenUsage / 50)) * 0.3; // Token usage factor
    score += successRate * 40 * 0.3; // Success rate factor

    // Context suitability (0-30 points)
    const contextScore = this.calculateContextSuitability(model, context);
    score += contextScore * 30;

    // Resource constraints (0-30 points)
    const constraintScore = this.calculateConstraintScore(model, resourceConstraints);
    score += constraintScore * 30;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate context suitability
   */
  calculateContextSuitability(model, context) {
    const contextType = context.type || 'general';
    const modelContexts = model.supported_contexts || ['general'];

    if (modelContexts.includes(contextType)) {
      return 1.0;
    } else if (modelContexts.includes('general')) {
      return 0.7;
    } else {
      return 0.3;
    }
  }

  /**
   * Calculate constraint score
   */
  calculateConstraintScore(model, constraints) {
    let score = 1.0;

    // Check response time constraint
    if (model.avg_response_time > constraints.max_response_time) {
      score *= 0.5;
    }

    // Check token usage constraint
    if (model.avg_token_usage > constraints.max_token_usage) {
      score *= 0.7;
    }

    // Check cost constraint
    if (model.cost_per_request > constraints.budget_limit / 100) {
      score *= 0.3;
    }

    return score;
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends(metrics) {
    if (metrics.length < 5) return { trend: 'insufficient_data' };

    const recentMetrics = metrics.slice(0, 5);
    const olderMetrics = metrics.slice(5, 10);

    const recentAvgResponseTime = this.calculateAvgResponseTime(recentMetrics);
    const olderAvgResponseTime = this.calculateAvgResponseTime(olderMetrics);

    const recentAvgTokenUsage = this.calculateAvgTokenUsage(recentMetrics);
    const olderAvgTokenUsage = this.calculateAvgTokenUsage(olderMetrics);

    const recentSuccessRate = this.calculateSuccessRate(recentMetrics);
    const olderSuccessRate = this.calculateSuccessRate(olderMetrics);

    return {
      responseTimeTrend: recentAvgResponseTime < olderAvgResponseTime ? 'improving' : 'declining',
      tokenUsageTrend: recentAvgTokenUsage < olderAvgTokenUsage ? 'improving' : 'declining',
      successRateTrend: recentSuccessRate > olderSuccessRate ? 'improving' : 'declining',
      overallTrend: this.calculateOverallTrend(recentAvgResponseTime, olderAvgResponseTime, recentSuccessRate, olderSuccessRate)
    };
  }

  /**
   * Identify optimization opportunities
   */
  identifyOptimizationOpportunities(performanceAnalysis, modelPerformance, resourceUsage) {
    const opportunities = [];

    // Response time opportunities
    if (performanceAnalysis.responseTimeTrend === 'declining') {
      opportunities.push({
        type: 'response_time',
        priority: 'high',
        description: 'Response times are increasing',
        potentialImprovement: '20-30%'
      });
    }

    // Token usage opportunities
    if (performanceAnalysis.tokenUsageTrend === 'declining') {
      opportunities.push({
        type: 'token_usage',
        priority: 'medium',
        description: 'Token usage is increasing',
        potentialImprovement: '15-25%'
      });
    }

    // Success rate opportunities
    if (performanceAnalysis.successRateTrend === 'declining') {
      opportunities.push({
        type: 'success_rate',
        priority: 'high',
        description: 'Success rate is decreasing',
        potentialImprovement: '10-20%'
      });
    }

    return opportunities;
  }

  /**
   * Apply optimizations
   */
  async applyOptimizations(userId, opportunities) {
    const results = [];

    for (const opportunity of opportunities) {
      try {
        let result;
        
        switch (opportunity.type) {
          case 'response_time':
            result = await this.optimizeResponseTime(userId);
            break;
          case 'token_usage':
            result = await this.optimizeTokenUsage(userId);
            break;
          case 'success_rate':
            result = await this.optimizeSuccessRate(userId);
            break;
          default:
            continue;
        }

        results.push({
          type: opportunity.type,
          success: result.success,
          improvement: result.improvement || 0,
          description: opportunity.description
        });
      } catch (error) {
        logger.error('Failed to apply optimization', { error: error.message, type: opportunity.type });
        results.push({
          type: opportunity.type,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Calculate performance gain
   */
  calculatePerformanceGain(optimizationResults) {
    const successfulOptimizations = optimizationResults.filter(r => r.success);
    if (successfulOptimizations.length === 0) return 0;

    const totalImprovement = successfulOptimizations.reduce((sum, r) => sum + (r.improvement || 0), 0);
    return totalImprovement / successfulOptimizations.length;
  }

  /**
   * Calculate average response time
   */
  calculateAvgResponseTime(metrics) {
    const responseTimes = metrics
      .filter(m => m.response_time)
      .map(m => m.response_time);

    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  /**
   * Calculate average token usage
   */
  calculateAvgTokenUsage(metrics) {
    const tokenUsages = metrics
      .filter(m => m.token_count)
      .map(m => m.token_count);

    if (tokenUsages.length === 0) return 0;
    return tokenUsages.reduce((sum, tokens) => sum + tokens, 0) / tokenUsages.length;
  }

  /**
   * Calculate success rate
   */
  calculateSuccessRate(metrics) {
    if (metrics.length === 0) return 0;
    const successfulRequests = metrics.filter(m => m.success).length;
    return successfulRequests / metrics.length;
  }

  /**
   * Get default model
   */
  getDefaultModel() {
    return {
      name: 'default',
      type: 'text-generation',
      default_response_time: 3000,
      default_token_usage: 500,
      supported_contexts: ['general'],
      cost_per_request: 0.01
    };
  }

  /**
   * Reset optimizer for user
   */
  async reset(userId) {
    try {
      this.performanceMetrics.delete(userId);
      this.modelPerformance.delete(userId);
      this.optimizationRules.delete(userId);
      this.resourceUsage.delete(userId);

      logger.info('Optimizer reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset optimizer', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
