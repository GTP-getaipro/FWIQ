/**
 * AI Cost Monitor
 * Monitors and tracks AI usage costs and performance metrics
 */

import { supabase } from './customSupabaseClient.js';

export class AICostMonitor {
  constructor() {
    this.costRates = {
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };
    
    this.dailyLimits = {
      default: 10.00, // $10 per day default
      warning: 8.00,  // $8 warning threshold
      critical: 9.50  // $9.50 critical threshold
    };
  }

  /**
   * Track AI usage and calculate cost
   * @param {Object} usage - Usage data
   * @returns {Promise<Object>} Tracking result
   */
  async trackUsage(usage) {
    const {
      userId,
      model,
      inputTokens,
      outputTokens,
      operation,
      responseTime,
      success = true
    } = usage;

    try {
      const cost = this.calculateCost(model, inputTokens, outputTokens);
      const totalTokens = inputTokens + outputTokens;

      // Store usage in database
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: userId,
          model: model,
          operation: operation || 'unknown',
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
          total_tokens: totalTokens,
          estimated_cost: cost,
          response_time_ms: responseTime,
          success: success,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to track AI usage:', error);
        return { success: false, error: error.message };
      }

      // Check daily limits
      const dailyUsage = await this.getDailyUsage(userId);
      const alerts = await this.checkLimits(userId, dailyUsage.totalCost);

      return {
        success: true,
        cost,
        totalTokens,
        dailyUsage,
        alerts
      };

    } catch (error) {
      console.error('Error tracking AI usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get daily usage for a user
   * @param {string} userId - User ID
   * @param {string} date - Date (YYYY-MM-DD), defaults to today
   * @returns {Promise<Object>} Daily usage data
   */
  async getDailyUsage(userId, date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const startOfDay = `${targetDate}T00:00:00.000Z`;
      const endOfDay = `${targetDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (error) throw error;

      const usage = this.aggregateUsage(data || []);
      
      return {
        date: targetDate,
        totalCost: usage.totalCost,
        totalTokens: usage.totalTokens,
        operationCount: usage.operationCount,
        averageResponseTime: usage.averageResponseTime,
        successRate: usage.successRate,
        modelBreakdown: usage.modelBreakdown,
        operationBreakdown: usage.operationBreakdown
      };

    } catch (error) {
      console.error('Error getting daily usage:', error);
      return {
        date: date || new Date().toISOString().split('T')[0],
        totalCost: 0,
        totalTokens: 0,
        operationCount: 0,
        averageResponseTime: 0,
        successRate: 0,
        modelBreakdown: {},
        operationBreakdown: {}
      };
    }
  }

  /**
   * Get usage statistics for a date range
   * @param {string} userId - User ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStatistics(userId, startDate, endDate) {
    try {
      const start = `${startDate}T00:00:00.000Z`;
      const end = `${endDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const statistics = this.calculateStatistics(data || [], startDate, endDate);
      return statistics;

    } catch (error) {
      console.error('Error getting usage statistics:', error);
      return {
        period: { startDate, endDate },
        totalCost: 0,
        totalTokens: 0,
        averageDailyCost: 0,
        peakUsage: null,
        trends: {},
        recommendations: []
      };
    }
  }

  /**
   * Check if user is approaching or exceeding limits
   * @param {string} userId - User ID
   * @param {number} currentCost - Current daily cost
   * @returns {Promise<Object>} Alert information
   */
  async checkLimits(userId, currentCost) {
    try {
      // Get user's daily limit (could be from user settings)
      const userLimit = await this.getUserDailyLimit(userId);
      const limit = userLimit || this.dailyLimits.default;

      const alerts = {
        warning: currentCost >= limit * 0.8 && currentCost < limit * 0.95,
        critical: currentCost >= limit * 0.95 && currentCost < limit,
        exceeded: currentCost >= limit,
        canContinue: currentCost < limit
      };

      // Store alert if needed
      if (alerts.warning || alerts.critical || alerts.exceeded) {
        await this.createAlert(userId, currentCost, limit, alerts);
      }

      return {
        currentCost,
        limit,
        remaining: limit - currentCost,
        percentageUsed: (currentCost / limit) * 100,
        alerts
      };

    } catch (error) {
      console.error('Error checking limits:', error);
      return {
        currentCost,
        limit: this.dailyLimits.default,
        remaining: this.dailyLimits.default - currentCost,
        percentageUsed: (currentCost / this.dailyLimits.default) * 100,
        alerts: { canContinue: true }
      };
    }
  }

  /**
   * Get cost optimization recommendations
   * @param {string} userId - User ID
   * @param {string} period - Time period (7d, 30d)
   * @returns {Promise<Object>} Optimization recommendations
   */
  async getOptimizationRecommendations(userId, period = '7d') {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (period === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const statistics = await this.getUsageStatistics(userId, startDate, endDate);
      const recommendations = [];

      // Analyze usage patterns
      if (statistics.totalCost > 0) {
        // Model usage analysis
        const modelBreakdown = this.analyzeModelUsage(statistics);
        if (modelBreakdown.expensiveModelUsage > 0.5) {
          recommendations.push({
            type: 'model_optimization',
            priority: 'high',
            message: 'High usage of expensive models detected. Consider using gpt-4o-mini for non-critical tasks.',
            potentialSavings: modelBreakdown.potentialSavings
          });
        }

        // Time-based analysis
        const timeAnalysis = this.analyzeTimeUsage(statistics);
        if (timeAnalysis.peakHourUsage > 0.7) {
          recommendations.push({
            type: 'time_optimization',
            priority: 'medium',
            message: 'High usage during peak hours. Consider rate limiting or queuing.',
            potentialSavings: timeAnalysis.potentialSavings
          });
        }

        // Operation analysis
        const operationAnalysis = this.analyzeOperationUsage(statistics);
        if (operationAnalysis.inefficientOperations.length > 0) {
          recommendations.push({
            type: 'operation_optimization',
            priority: 'medium',
            message: 'Inefficient operations detected. Review and optimize prompts.',
            potentialSavings: operationAnalysis.potentialSavings
          });
        }
      }

      return {
        period,
        totalCost: statistics.totalCost,
        recommendations,
        potentialMonthlySavings: recommendations.reduce((sum, rec) => sum + (rec.potentialSavings || 0), 0)
      };

    } catch (error) {
      console.error('Error getting optimization recommendations:', error);
      return {
        period,
        totalCost: 0,
        recommendations: [],
        potentialMonthlySavings: 0
      };
    }
  }

  /**
   * Create usage alert
   * @param {string} userId - User ID
   * @param {number} currentCost - Current cost
   * @param {number} limit - Daily limit
   * @param {Object} alerts - Alert status
   */
  async createAlert(userId, currentCost, limit, alerts) {
    try {
      let alertType = 'info';
      let message = '';

      if (alerts.exceeded) {
        alertType = 'error';
        message = `Daily AI usage limit exceeded. Cost: $${currentCost.toFixed(2)} / $${limit.toFixed(2)}`;
      } else if (alerts.critical) {
        alertType = 'warning';
        message = `Critical: Approaching daily AI usage limit. Cost: $${currentCost.toFixed(2)} / $${limit.toFixed(2)}`;
      } else if (alerts.warning) {
        alertType = 'warning';
        message = `Warning: High AI usage detected. Cost: $${currentCost.toFixed(2)} / $${limit.toFixed(2)}`;
      }

      await supabase
        .from('error_logs')
        .insert({
          client_id: userId,
          error_type: 'ai_usage_alert',
          error_message: message,
          severity: alertType,
          context: {
            currentCost,
            limit,
            percentageUsed: (currentCost / limit) * 100
          }
        });

    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }

  /**
   * Calculate cost for tokens
   * @param {string} model - AI model
   * @param {number} inputTokens - Input tokens
   * @param {number} outputTokens - Output tokens
   * @returns {number} Cost in USD
   */
  calculateCost(model, inputTokens, outputTokens) {
    const rates = this.costRates[model];
    if (!rates) return 0;
    
    return (inputTokens / 1000 * rates.input) + (outputTokens / 1000 * rates.output);
  }

  /**
   * Aggregate usage data
   * @param {Array} usageData - Raw usage data
   * @returns {Object} Aggregated usage
   */
  aggregateUsage(usageData) {
    const aggregated = {
      totalCost: 0,
      totalTokens: 0,
      operationCount: usageData.length,
      totalResponseTime: 0,
      successfulOperations: 0,
      modelBreakdown: {},
      operationBreakdown: {}
    };

    usageData.forEach(usage => {
      aggregated.totalCost += usage.estimated_cost || 0;
      aggregated.totalTokens += usage.total_tokens || 0;
      aggregated.totalResponseTime += usage.response_time_ms || 0;
      
      if (usage.success) {
        aggregated.successfulOperations++;
      }

      // Model breakdown
      const model = usage.model || 'unknown';
      if (!aggregated.modelBreakdown[model]) {
        aggregated.modelBreakdown[model] = { count: 0, cost: 0, tokens: 0 };
      }
      aggregated.modelBreakdown[model].count++;
      aggregated.modelBreakdown[model].cost += usage.estimated_cost || 0;
      aggregated.modelBreakdown[model].tokens += usage.total_tokens || 0;

      // Operation breakdown
      const operation = usage.operation || 'unknown';
      if (!aggregated.operationBreakdown[operation]) {
        aggregated.operationBreakdown[operation] = { count: 0, cost: 0, tokens: 0 };
      }
      aggregated.operationBreakdown[operation].count++;
      aggregated.operationBreakdown[operation].cost += usage.estimated_cost || 0;
      aggregated.operationBreakdown[operation].tokens += usage.total_tokens || 0;
    });

    aggregated.averageResponseTime = aggregated.operationCount > 0 ? 
      aggregated.totalResponseTime / aggregated.operationCount : 0;
    aggregated.successRate = aggregated.operationCount > 0 ? 
      aggregated.successfulOperations / aggregated.operationCount : 0;

    return aggregated;
  }

  /**
   * Calculate usage statistics
   * @param {Array} usageData - Usage data
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Object} Statistics
   */
  calculateStatistics(usageData, startDate, endDate) {
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    
    const statistics = {
      period: { startDate, endDate },
      totalCost: 0,
      totalTokens: 0,
      operationCount: usageData.length,
      averageDailyCost: 0,
      peakUsage: null,
      trends: {
        daily: {},
        hourly: {},
        modelUsage: {},
        operationUsage: {}
      },
      recommendations: []
    };

    // Calculate totals
    usageData.forEach(usage => {
      statistics.totalCost += usage.estimated_cost || 0;
      statistics.totalTokens += usage.total_tokens || 0;

      // Daily trends
      const date = usage.created_at.split('T')[0];
      if (!statistics.trends.daily[date]) {
        statistics.trends.daily[date] = { cost: 0, tokens: 0, operations: 0 };
      }
      statistics.trends.daily[date].cost += usage.estimated_cost || 0;
      statistics.trends.daily[date].tokens += usage.total_tokens || 0;
      statistics.trends.daily[date].operations++;

      // Hourly trends
      const hour = new Date(usage.created_at).getHours();
      if (!statistics.trends.hourly[hour]) {
        statistics.trends.hourly[hour] = { cost: 0, tokens: 0, operations: 0 };
      }
      statistics.trends.hourly[hour].cost += usage.estimated_cost || 0;
      statistics.trends.hourly[hour].tokens += usage.total_tokens || 0;
      statistics.trends.hourly[hour].operations++;

      // Model usage
      const model = usage.model || 'unknown';
      if (!statistics.trends.modelUsage[model]) {
        statistics.trends.modelUsage[model] = { cost: 0, tokens: 0, operations: 0 };
      }
      statistics.trends.modelUsage[model].cost += usage.estimated_cost || 0;
      statistics.trends.modelUsage[model].tokens += usage.total_tokens || 0;
      statistics.trends.modelUsage[model].operations++;

      // Operation usage
      const operation = usage.operation || 'unknown';
      if (!statistics.trends.operationUsage[operation]) {
        statistics.trends.operationUsage[operation] = { cost: 0, tokens: 0, operations: 0 };
      }
      statistics.trends.operationUsage[operation].cost += usage.estimated_cost || 0;
      statistics.trends.operationUsage[operation].tokens += usage.total_tokens || 0;
      statistics.trends.operationUsage[operation].operations++;
    });

    statistics.averageDailyCost = days > 0 ? statistics.totalCost / days : 0;

    // Find peak usage day
    const peakDay = Object.entries(statistics.trends.daily)
      .reduce((max, [date, data]) => 
        data.cost > max.cost ? { date, ...data } : max, 
        { date: null, cost: 0 }
      );
    
    if (peakDay.date) {
      statistics.peakUsage = peakDay;
    }

    return statistics;
  }

  /**
   * Analyze model usage for optimization
   * @param {Object} statistics - Usage statistics
   * @returns {Object} Model analysis
   */
  analyzeModelUsage(statistics) {
    const expensiveModels = ['gpt-4', 'gpt-4-turbo-preview'];
    const cheapModels = ['gpt-4o-mini', 'gpt-3.5-turbo'];
    
    let expensiveModelUsage = 0;
    let cheapModelUsage = 0;
    let totalExpensiveCost = 0;
    let potentialSavings = 0;

    Object.entries(statistics.trends.modelUsage).forEach(([model, usage]) => {
      if (expensiveModels.includes(model)) {
        expensiveModelUsage += usage.operations;
        totalExpensiveCost += usage.cost;
        // Estimate savings by switching to cheapest model
        potentialSavings += usage.cost * 0.5; // Assume 50% savings
      } else if (cheapModels.includes(model)) {
        cheapModelUsage += usage.operations;
      }
    });

    const totalUsage = expensiveModelUsage + cheapModelUsage;
    
    return {
      expensiveModelUsage: totalUsage > 0 ? expensiveModelUsage / totalUsage : 0,
      cheapModelUsage: totalUsage > 0 ? cheapModelUsage / totalUsage : 0,
      totalExpensiveCost,
      potentialSavings
    };
  }

  /**
   * Analyze time-based usage patterns
   * @param {Object} statistics - Usage statistics
   * @returns {Object} Time analysis
   */
  analyzeTimeUsage(statistics) {
    const peakHours = [9, 10, 11, 14, 15, 16]; // Business hours
    let peakHourUsage = 0;
    let offPeakUsage = 0;
    let potentialSavings = 0;

    Object.entries(statistics.trends.hourly).forEach(([hour, usage]) => {
      if (peakHours.includes(parseInt(hour))) {
        peakHourUsage += usage.operations;
      } else {
        offPeakUsage += usage.operations;
        // Assume some operations could be delayed to off-peak
        potentialSavings += usage.cost * 0.1; // 10% savings through optimization
      }
    });

    const totalUsage = peakHourUsage + offPeakUsage;
    
    return {
      peakHourUsage: totalUsage > 0 ? peakHourUsage / totalUsage : 0,
      offPeakUsage: totalUsage > 0 ? offPeakUsage / totalUsage : 0,
      potentialSavings
    };
  }

  /**
   * Analyze operation efficiency
   * @param {Object} statistics - Usage statistics
   * @returns {Object} Operation analysis
   */
  analyzeOperationUsage(statistics) {
    const inefficientOperations = [];
    let potentialSavings = 0;

    Object.entries(statistics.trends.operationUsage).forEach(([operation, usage]) => {
      // Flag operations with high token usage per operation
      const avgTokensPerOp = usage.tokens / usage.operations;
      if (avgTokensPerOp > 1000) { // High token usage
        inefficientOperations.push({
          operation,
          avgTokensPerOp,
          totalCost: usage.cost,
          operations: usage.operations
        });
        potentialSavings += usage.cost * 0.2; // Assume 20% savings through optimization
      }
    });

    return {
      inefficientOperations,
      potentialSavings
    };
  }

  /**
   * Get user's daily limit
   * @param {string} userId - User ID
   * @returns {Promise<number>} Daily limit
   */
  async getUserDailyLimit(userId) {
    try {
      // This could be stored in user settings or subscription data
      // For now, return default limit
      return this.dailyLimits.default;
    } catch (error) {
      console.error('Error getting user daily limit:', error);
      return this.dailyLimits.default;
    }
  }
}

// Export singleton instance
export const aiCostMonitor = new AICostMonitor();
