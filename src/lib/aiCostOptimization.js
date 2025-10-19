/**
 * AI Cost Optimization
 * Intelligent cost optimization and budget management for AI models
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { aiModelPerformanceMonitoring } from './aiModelPerformanceMonitoring.js';

export class AICostOptimization {
  constructor() {
    this.costCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.costThresholds = this.initializeCostThresholds();
    this.modelCostRates = this.initializeModelCostRates();
    this.optimizationRules = this.initializeOptimizationRules();
  }

  /**
   * Track AI model costs
   * @param {string} modelId - Model identifier
   * @param {Object} costData - Cost data
   * @param {Object} context - Execution context
   */
  async trackModelCosts(modelId, costData, context = {}) {
    try {
      const timestamp = new Date().toISOString();
      
      const costRecord = {
        model_id: modelId,
        user_id: context.userId || null,
        execution_id: costData.executionId || null,
        input_tokens: costData.inputTokens || 0,
        output_tokens: costData.outputTokens || 0,
        total_tokens: costData.totalTokens || 0,
        cost_usd: costData.cost || 0,
        cost_per_input_token: costData.costPerInputToken || 0,
        cost_per_output_token: costData.costPerOutputToken || 0,
        timestamp,
        metadata: JSON.stringify(costData.metadata || {})
      };

      // Store in database
      const { error } = await supabase
        .from('ai_model_costs')
        .insert(costRecord);

      if (error) {
        logger.error('Failed to store AI model cost data', { error: error.message, modelId });
      }

      // Update cost tracking
      await this.updateCostTracking(modelId, costRecord);

      logger.debug('AI model cost tracked', { 
        modelId, 
        cost: costRecord.cost_usd,
        tokens: costRecord.total_tokens
      });
    } catch (error) {
      logger.error('Error tracking AI model costs', { error: error.message, modelId });
    }
  }

  /**
   * Get cost optimization recommendations
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Cost optimization recommendations
   */
  async getCostOptimizationRecommendations(userId, timeRange = '7d') {
    try {
      const cacheKey = `cost_optimization_${userId}_${timeRange}`;
      
      // Check cache first
      if (this.costCache.has(cacheKey)) {
        const cached = this.costCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      logger.info('Generating cost optimization recommendations', { userId, timeRange });

      // Gather cost data
      const [
        costAnalytics,
        usagePatterns,
        modelComparison,
        budgetStatus
      ] = await Promise.all([
        this.getCostAnalytics(userId, timeRange),
        this.getUsagePatterns(userId, timeRange),
        this.getModelCostComparison(userId, timeRange),
        this.getBudgetStatus(userId, timeRange)
      ]);

      // Generate recommendations
      const recommendations = await this.generateCostRecommendations({
        costAnalytics,
        usagePatterns,
        modelComparison,
        budgetStatus,
        timeRange
      });

      const result = {
        userId,
        timeRange,
        recommendations,
        summary: this.generateCostSummary(recommendations),
        estimatedSavings: this.calculateEstimatedSavings(recommendations),
        implementationPriority: this.calculateImplementationPriority(recommendations),
        lastAnalyzed: new Date().toISOString()
      };

      // Cache the result
      this.costCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      logger.info('Cost optimization recommendations generated', { 
        userId, 
        recommendationCount: recommendations.length,
        estimatedSavings: result.estimatedSavings.total
      });

      return result;
    } catch (error) {
      logger.error('Error generating cost optimization recommendations', { 
        error: error.message, 
        userId 
      });
      return this.getDefaultCostRecommendations(userId);
    }
  }

  /**
   * Get cost analytics
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Cost analytics
   */
  async getCostAnalytics(userId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: costData, error } = await supabase
        .from('ai_model_costs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return this.calculateCostAnalytics(costData || []);
    } catch (error) {
      logger.error('Error getting cost analytics', { error: error.message, userId });
      return this.getDefaultCostAnalytics();
    }
  }

  /**
   * Get usage patterns
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Usage patterns
   */
  async getUsagePatterns(userId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: usageData, error } = await supabase
        .from('ai_model_costs')
        .select('model_id, timestamp, total_tokens, cost_usd')
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return this.analyzeUsagePatterns(usageData || []);
    } catch (error) {
      logger.error('Error getting usage patterns', { error: error.message, userId });
      return this.getDefaultUsagePatterns();
    }
  }

  /**
   * Get model cost comparison
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Model cost comparison
   */
  async getModelCostComparison(userId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: modelData, error } = await supabase
        .from('ai_model_costs')
        .select('model_id, cost_usd, total_tokens, input_tokens, output_tokens')
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString());

      if (error) throw error;

      return this.compareModelCosts(modelData || []);
    } catch (error) {
      logger.error('Error getting model cost comparison', { error: error.message, userId });
      return this.getDefaultModelComparison();
    }
  }

  /**
   * Get budget status
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Budget status
   */
  async getBudgetStatus(userId, timeRange = '7d') {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      // Get current period costs
      const { data: currentCosts, error: currentError } = await supabase
        .from('ai_model_costs')
        .select('cost_usd')
        .eq('user_id', userId)
        .gte('timestamp', timeFilter.toISOString());

      if (currentError) throw currentError;

      // Get budget settings
      const { data: budgetSettings, error: budgetError } = await supabase
        .from('ai_budget_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (budgetError && budgetError.code !== 'PGRST116') {
        throw budgetError;
      }

      const totalSpent = currentCosts?.reduce((sum, c) => sum + (c.cost_usd || 0), 0) || 0;
      const budgetLimit = budgetSettings?.monthly_budget || 100; // Default $100
      const dailyBudget = budgetLimit / 30;
      const periodDays = this.getPeriodDays(timeRange);
      const periodBudget = dailyBudget * periodDays;

      return {
        totalSpent: Math.round(totalSpent * 100) / 100,
        budgetLimit: Math.round(budgetLimit * 100) / 100,
        periodBudget: Math.round(periodBudget * 100) / 100,
        remainingBudget: Math.round((budgetLimit - totalSpent) * 100) / 100,
        budgetUtilization: Math.round((totalSpent / budgetLimit) * 100),
        isOverBudget: totalSpent > budgetLimit,
        isNearBudget: totalSpent > (budgetLimit * 0.8),
        dailyAverage: Math.round((totalSpent / periodDays) * 100) / 100,
        projectedMonthlyCost: Math.round((totalSpent / periodDays) * 30 * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting budget status', { error: error.message, userId });
      return this.getDefaultBudgetStatus();
    }
  }

  /**
   * Set budget limits
   * @param {string} userId - User identifier
   * @param {Object} budgetSettings - Budget settings
   * @returns {Promise<Object>} Budget setting result
   */
  async setBudgetLimits(userId, budgetSettings) {
    try {
      logger.info('Setting budget limits', { userId, budgetSettings });

      const budgetData = {
        user_id: userId,
        monthly_budget: budgetSettings.monthlyBudget || 100,
        daily_budget: budgetSettings.dailyBudget || null,
        cost_alerts_enabled: budgetSettings.costAlertsEnabled !== false,
        alert_threshold_percentage: budgetSettings.alertThresholdPercentage || 80,
        auto_optimization_enabled: budgetSettings.autoOptimizationEnabled || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_budget_settings')
        .upsert(budgetData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      logger.info('Budget limits set successfully', { userId, budgetId: data.id });

      return {
        success: true,
        budgetSettings: data
      };
    } catch (error) {
      logger.error('Error setting budget limits', { error: error.message, userId });
      throw new Error(`Failed to set budget limits: ${error.message}`);
    }
  }

  /**
   * Get cost alerts
   * @param {string} userId - User identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Cost alerts
   */
  async getCostAlerts(userId, timeRange = '24h') {
    try {
      const budgetStatus = await this.getBudgetStatus(userId, timeRange);
      const alerts = [];

      // Budget alerts
      if (budgetStatus.isOverBudget) {
        alerts.push({
          type: 'budget',
          severity: 'critical',
          message: `AI costs have exceeded monthly budget ($${budgetStatus.totalSpent} > $${budgetStatus.budgetLimit})`,
          recommendation: 'Review usage patterns and consider implementing cost controls'
        });
      } else if (budgetStatus.isNearBudget) {
        alerts.push({
          type: 'budget',
          severity: 'warning',
          message: `AI costs are approaching monthly budget (${budgetStatus.budgetUtilization}% utilized)`,
          recommendation: 'Monitor usage closely and consider optimizing model usage'
        });
      }

      // Projection alerts
      if (budgetStatus.projectedMonthlyCost > budgetStatus.budgetLimit * 1.5) {
        alerts.push({
          type: 'projection',
          severity: 'warning',
          message: `Projected monthly cost ($${budgetStatus.projectedMonthlyCost}) significantly exceeds budget`,
          recommendation: 'Implement immediate cost optimization measures'
        });
      }

      // Daily average alerts
      if (budgetStatus.dailyAverage > (budgetStatus.budgetLimit / 30) * 1.2) {
        alerts.push({
          type: 'daily_average',
          severity: 'info',
          message: `Daily average cost ($${budgetStatus.dailyAverage}) is above recommended level`,
          recommendation: 'Consider optimizing daily usage patterns'
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Error getting cost alerts', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Generate cost recommendations
   * @param {Object} data - Analysis data
   * @returns {Promise<Array>} Generated recommendations
   */
  async generateCostRecommendations(data) {
    const recommendations = [];

    // Apply optimization rules
    for (const rule of this.optimizationRules) {
      const ruleRecommendations = await rule.evaluate(data);
      recommendations.push(...ruleRecommendations);
    }

    // Sort by potential savings
    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Calculate cost analytics
   * @param {Array} costData - Cost data
   * @returns {Object} Calculated analytics
   */
  calculateCostAnalytics(costData) {
    if (costData.length === 0) {
      return this.getDefaultCostAnalytics();
    }

    const totalCost = costData.reduce((sum, c) => sum + (c.cost_usd || 0), 0);
    const totalTokens = costData.reduce((sum, c) => sum + (c.total_tokens || 0), 0);
    const totalInputTokens = costData.reduce((sum, c) => sum + (c.input_tokens || 0), 0);
    const totalOutputTokens = costData.reduce((sum, c) => sum + (c.output_tokens || 0), 0);
    
    const averageCostPerExecution = totalCost / costData.length;
    const averageCostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;
    const averageCostPerInputToken = totalInputTokens > 0 ? totalCost / totalInputTokens : 0;
    const averageCostPerOutputToken = totalOutputTokens > 0 ? totalCost / totalOutputTokens : 0;

    const costs = costData.map(c => c.cost_usd || 0);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const medianCost = this.calculateMedian(costs);

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalExecutions: costData.length,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      averageCostPerExecution: Math.round(averageCostPerExecution * 100) / 100,
      averageCostPerToken: Math.round(averageCostPerToken * 1000000) / 1000000,
      averageCostPerInputToken: Math.round(averageCostPerInputToken * 1000000) / 1000000,
      averageCostPerOutputToken: Math.round(averageCostPerOutputToken * 1000000) / 1000000,
      minCost: Math.round(minCost * 100) / 100,
      maxCost: Math.round(maxCost * 100) / 100,
      medianCost: Math.round(medianCost * 100) / 100,
      firstExecution: costData[costData.length - 1]?.timestamp || null,
      lastExecution: costData[0]?.timestamp || null
    };
  }

  /**
   * Analyze usage patterns
   * @param {Array} usageData - Usage data
   * @returns {Object} Usage patterns
   */
  analyzeUsagePatterns(usageData) {
    if (usageData.length === 0) {
      return this.getDefaultUsagePatterns();
    }

    // Group by model
    const modelUsage = {};
    usageData.forEach(usage => {
      if (!modelUsage[usage.model_id]) {
        modelUsage[usage.model_id] = {
          executions: 0,
          totalCost: 0,
          totalTokens: 0,
          timestamps: []
        };
      }
      modelUsage[usage.model_id].executions++;
      modelUsage[usage.model_id].totalCost += usage.cost_usd || 0;
      modelUsage[usage.model_id].totalTokens += usage.total_tokens || 0;
      modelUsage[usage.model_id].timestamps.push(usage.timestamp);
    });

    // Calculate patterns
    const patterns = {
      modelUsage,
      peakUsageHours: this.calculatePeakUsageHours(usageData),
      usageTrends: this.calculateUsageTrends(usageData),
      costDistribution: this.calculateCostDistribution(usageData)
    };

    return patterns;
  }

  /**
   * Compare model costs
   * @param {Array} modelData - Model data
   * @returns {Object} Model comparison
   */
  compareModelCosts(modelData) {
    if (modelData.length === 0) {
      return this.getDefaultModelComparison();
    }

    const modelStats = {};
    modelData.forEach(data => {
      if (!modelStats[data.model_id]) {
        modelStats[data.model_id] = {
          executions: 0,
          totalCost: 0,
          totalTokens: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0
        };
      }
      modelStats[data.model_id].executions++;
      modelStats[data.model_id].totalCost += data.cost_usd || 0;
      modelStats[data.model_id].totalTokens += data.total_tokens || 0;
      modelStats[data.model_id].totalInputTokens += data.input_tokens || 0;
      modelStats[data.model_id].totalOutputTokens += data.output_tokens || 0;
    });

    // Calculate efficiency metrics
    const comparison = {};
    Object.entries(modelStats).forEach(([modelId, stats]) => {
      comparison[modelId] = {
        totalCost: Math.round(stats.totalCost * 100) / 100,
        totalExecutions: stats.executions,
        averageCostPerExecution: Math.round((stats.totalCost / stats.executions) * 100) / 100,
        averageCostPerToken: stats.totalTokens > 0 ? Math.round((stats.totalCost / stats.totalTokens) * 1000000) / 1000000 : 0,
        tokenEfficiency: stats.totalTokens / stats.executions,
        costEfficiency: stats.totalCost / stats.executions
      };
    });

    return comparison;
  }

  /**
   * Calculate peak usage hours
   * @param {Array} usageData - Usage data
   * @returns {Array} Peak usage hours
   */
  calculatePeakUsageHours(usageData) {
    const hourlyUsage = {};
    usageData.forEach(usage => {
      const hour = new Date(usage.timestamp).getHours();
      if (!hourlyUsage[hour]) {
        hourlyUsage[hour] = { count: 0, cost: 0 };
      }
      hourlyUsage[hour].count++;
      hourlyUsage[hour].cost += usage.cost_usd || 0;
    });

    return Object.entries(hourlyUsage)
      .map(([hour, data]) => ({ hour: parseInt(hour), count: data.count, cost: data.cost }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Calculate usage trends
   * @param {Array} usageData - Usage data
   * @returns {Object} Usage trends
   */
  calculateUsageTrends(usageData) {
    // Group by day
    const dailyUsage = {};
    usageData.forEach(usage => {
      const date = new Date(usage.timestamp).toISOString().split('T')[0];
      if (!dailyUsage[date]) {
        dailyUsage[date] = { count: 0, cost: 0, tokens: 0 };
      }
      dailyUsage[date].count++;
      dailyUsage[date].cost += usage.cost_usd || 0;
      dailyUsage[date].tokens += usage.total_tokens || 0;
    });

    const trends = {
      dailyExecutions: [],
      dailyCosts: [],
      dailyTokens: []
    };

    Object.keys(dailyUsage).sort().forEach(date => {
      const dayData = dailyUsage[date];
      trends.dailyExecutions.push({ date, value: dayData.count });
      trends.dailyCosts.push({ date, value: Math.round(dayData.cost * 100) / 100 });
      trends.dailyTokens.push({ date, value: dayData.tokens });
    });

    return trends;
  }

  /**
   * Calculate cost distribution
   * @param {Array} usageData - Usage data
   * @returns {Object} Cost distribution
   */
  calculateCostDistribution(usageData) {
    const totalCost = usageData.reduce((sum, u) => sum + (u.cost_usd || 0), 0);
    const modelDistribution = {};
    
    usageData.forEach(usage => {
      if (!modelDistribution[usage.model_id]) {
        modelDistribution[usage.model_id] = 0;
      }
      modelDistribution[usage.model_id] += usage.cost_usd || 0;
    });

    const distribution = {};
    Object.entries(modelDistribution).forEach(([modelId, cost]) => {
      distribution[modelId] = {
        cost: Math.round(cost * 100) / 100,
        percentage: Math.round((cost / totalCost) * 100)
      };
    });

    return distribution;
  }

  /**
   * Calculate estimated savings
   * @param {Array} recommendations - Recommendations
   * @returns {Object} Estimated savings
   */
  calculateEstimatedSavings(recommendations) {
    const totalSavings = recommendations.reduce((sum, rec) => sum + (rec.potentialSavings || 0), 0);
    const monthlySavings = totalSavings * 4; // Assume weekly recommendations
    const annualSavings = monthlySavings * 12;

    return {
      total: Math.round(totalSavings * 100) / 100,
      monthly: Math.round(monthlySavings * 100) / 100,
      annual: Math.round(annualSavings * 100) / 100,
      percentage: recommendations.length > 0 ? Math.round((totalSavings / recommendations.reduce((sum, rec) => sum + (rec.currentCost || 0), 0)) * 100) : 0
    };
  }

  /**
   * Calculate implementation priority
   * @param {Array} recommendations - Recommendations
   * @returns {Object} Implementation priority
   */
  calculateImplementationPriority(recommendations) {
    const highPriority = recommendations.filter(r => r.priority === 'high').length;
    const mediumPriority = recommendations.filter(r => r.priority === 'medium').length;
    const lowPriority = recommendations.filter(r => r.priority === 'low').length;

    return {
      high: highPriority,
      medium: mediumPriority,
      low: lowPriority,
      total: recommendations.length,
      overallPriority: highPriority > 0 ? 'high' : mediumPriority > 0 ? 'medium' : 'low'
    };
  }

  /**
   * Generate cost summary
   * @param {Array} recommendations - Recommendations
   * @returns {Object} Cost summary
   */
  generateCostSummary(recommendations) {
    const summary = {
      totalRecommendations: recommendations.length,
      byType: {},
      byPriority: {},
      byImpact: {}
    };

    recommendations.forEach(rec => {
      // By type
      summary.byType[rec.type] = (summary.byType[rec.type] || 0) + 1;
      
      // By priority
      summary.byPriority[rec.priority] = (summary.byPriority[rec.priority] || 0) + 1;
      
      // By impact
      summary.byImpact[rec.impact] = (summary.byImpact[rec.impact] || 0) + 1;
    });

    return summary;
  }

  /**
   * Update cost tracking
   * @param {string} modelId - Model identifier
   * @param {Object} costRecord - Cost record
   */
  async updateCostTracking(modelId, costRecord) {
    // Update user's total cost tracking
    const { error } = await supabase
      .from('ai_user_cost_tracking')
      .upsert({
        user_id: costRecord.user_id,
        model_id: modelId,
        total_cost: costRecord.cost_usd,
        total_tokens: costRecord.total_tokens,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id,model_id' });

    if (error) {
      logger.error('Failed to update cost tracking', { error: error.message, modelId });
    }
  }

  /**
   * Initialize cost thresholds
   * @returns {Object} Cost thresholds
   */
  initializeCostThresholds() {
    return {
      maxDailyCost: 10, // $10 per day
      maxMonthlyCost: 100, // $100 per month
      maxCostPerExecution: 0.01, // $0.01 per execution
      maxCostPerToken: 0.00001, // $0.00001 per token
      alertThresholdPercentage: 80 // Alert at 80% of budget
    };
  }

  /**
   * Initialize model cost rates
   * @returns {Object} Model cost rates
   */
  initializeModelCostRates() {
    return {
      'gpt-4': { input: 0.00003, output: 0.00006 },
      'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
      'gpt-3.5-turbo': { input: 0.0000015, output: 0.000002 },
      'claude-3-opus': { input: 0.000015, output: 0.000075 },
      'claude-3-sonnet': { input: 0.000003, output: 0.000015 },
      'claude-3-haiku': { input: 0.00000025, output: 0.00000125 }
    };
  }

  /**
   * Initialize optimization rules
   * @returns {Array} Optimization rules
   */
  initializeOptimizationRules() {
    return [
      {
        name: 'model_switching',
        evaluate: async (data) => {
          const recommendations = [];
          const { modelComparison } = data;
          
          Object.entries(modelComparison).forEach(([modelId, stats]) => {
            if (stats.averageCostPerExecution > 0.005) { // More than $0.005 per execution
              recommendations.push({
                type: 'model_optimization',
                priority: 'high',
                impact: 'high',
                title: `Switch to More Cost-Effective Model`,
                description: `Model ${modelId} has high cost per execution ($${stats.averageCostPerExecution})`,
                recommendation: `Consider switching to a more cost-effective model like gpt-3.5-turbo`,
                potentialSavings: stats.totalCost * 0.3, // 30% savings estimate
                currentCost: stats.totalCost,
                implementationEffort: 'low'
              });
            }
          });
          
          return recommendations;
        }
      },
      {
        name: 'token_optimization',
        evaluate: async (data) => {
          const recommendations = [];
          const { costAnalytics } = data;
          
          if (costAnalytics.averageCostPerToken > 0.000005) { // More than $0.000005 per token
            recommendations.push({
              type: 'prompt_optimization',
              priority: 'medium',
              impact: 'medium',
              title: 'Optimize Prompt Length',
              description: `High cost per token ($${costAnalytics.averageCostPerToken}) indicates inefficient prompts`,
              recommendation: 'Reduce prompt length and optimize token usage',
              potentialSavings: costAnalytics.totalCost * 0.2, // 20% savings estimate
              currentCost: costAnalytics.totalCost,
              implementationEffort: 'medium'
            });
          }
          
          return recommendations;
        }
      },
      {
        name: 'usage_pattern_optimization',
        evaluate: async (data) => {
          const recommendations = [];
          const { usagePatterns } = data;
          
          if (usagePatterns.peakUsageHours.length > 0) {
            const peakHour = usagePatterns.peakUsageHours[0];
            if (peakHour.cost > data.costAnalytics.totalCost * 0.3) { // Peak hour accounts for >30% of costs
              recommendations.push({
                type: 'usage_optimization',
                priority: 'medium',
                impact: 'medium',
                title: 'Optimize Peak Usage Hours',
                description: `Peak usage at hour ${peakHour.hour} accounts for significant costs`,
                recommendation: 'Consider load balancing or scheduling non-critical operations off-peak',
                potentialSavings: peakHour.cost * 0.15, // 15% savings estimate
                currentCost: peakHour.cost,
                implementationEffort: 'medium'
              });
            }
          }
          
          return recommendations;
        }
      }
    ];
  }

  /**
   * Calculate median value
   * @param {Array} values - Array of values
   * @returns {number} Median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
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

    return filters[timeRange] || filters['7d'];
  }

  /**
   * Get period days
   * @param {string} timeRange - Time range
   * @returns {number} Number of days
   */
  getPeriodDays(timeRange) {
    const days = {
      '1h': 1/24,
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    return days[timeRange] || 7;
  }

  /**
   * Clear cost cache
   */
  clearCache() {
    this.costCache.clear();
    logger.info('AI cost optimization cache cleared');
  }

  // Default methods
  getDefaultCostRecommendations(userId) {
    return {
      userId,
      timeRange: '7d',
      recommendations: [],
      summary: {
        totalRecommendations: 0,
        byType: {},
        byPriority: {},
        byImpact: {}
      },
      estimatedSavings: {
        total: 0,
        monthly: 0,
        annual: 0,
        percentage: 0
      },
      implementationPriority: {
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
        overallPriority: 'low'
      },
      lastAnalyzed: new Date().toISOString()
    };
  }

  getDefaultCostAnalytics() {
    return {
      totalCost: 0,
      totalExecutions: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      averageCostPerExecution: 0,
      averageCostPerToken: 0,
      averageCostPerInputToken: 0,
      averageCostPerOutputToken: 0,
      minCost: 0,
      maxCost: 0,
      medianCost: 0,
      firstExecution: null,
      lastExecution: null
    };
  }

  getDefaultUsagePatterns() {
    return {
      modelUsage: {},
      peakUsageHours: [],
      usageTrends: {
        dailyExecutions: [],
        dailyCosts: [],
        dailyTokens: []
      },
      costDistribution: {}
    };
  }

  getDefaultModelComparison() {
    return {};
  }

  getDefaultBudgetStatus() {
    return {
      totalSpent: 0,
      budgetLimit: 100,
      periodBudget: 0,
      remainingBudget: 100,
      budgetUtilization: 0,
      isOverBudget: false,
      isNearBudget: false,
      dailyAverage: 0,
      projectedMonthlyCost: 0
    };
  }
}

// Export singleton instance
export const aiCostOptimization = new AICostOptimization();
export default AICostOptimization;
