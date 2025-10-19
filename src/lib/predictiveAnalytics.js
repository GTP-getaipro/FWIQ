/**
 * Predictive Analytics Engine
 * Machine learning and predictive analytics for FloWorx
 */

import { supabase } from './customSupabaseClient';
import { logger } from './logger';

export class PredictiveAnalytics {
  constructor(userId) {
    this.userId = userId;
    this.models = new Map();
    this.predictionsCache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Generate comprehensive predictive insights
   * @param {string} timeRange - Time range for analysis
   * @returns {Promise<Object>} Predictive insights
   */
  async getPredictiveInsights(timeRange = '30d') {
    try {
      const cacheKey = `predictions_${this.userId}_${timeRange}`;
      const cached = this.getCachedPredictions(cacheKey);
      if (cached) return cached;

      const [
        emailPredictions,
        customerPredictions,
        operationalPredictions,
        financialPredictions,
        riskPredictions,
        opportunityPredictions
      ] = await Promise.all([
        this.predictEmailTrends(timeRange),
        this.predictCustomerBehavior(timeRange),
        this.predictOperationalMetrics(timeRange),
        this.predictFinancialOutcomes(timeRange),
        this.predictRisks(timeRange),
        this.predictOpportunities(timeRange)
      ]);

      const predictions = {
        emailPredictions,
        customerPredictions,
        operationalPredictions,
        financialPredictions,
        riskPredictions,
        opportunityPredictions,
        generatedAt: new Date().toISOString(),
        timeRange,
        confidence: this.calculateOverallConfidence([
          emailPredictions,
          customerPredictions,
          operationalPredictions,
          financialPredictions
        ])
      };

      this.setCachedPredictions(cacheKey, predictions);
      logger.info('Predictive insights generated', { userId: this.userId, timeRange });
      return predictions;
    } catch (error) {
      logger.error('Failed to generate predictive insights', { error: error.message, userId: this.userId });
      throw error;
    }
  }

  /**
   * Predict email trends and patterns
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Email predictions
   */
  async predictEmailTrends(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: true });

    if (!emails || emails.length < 10) {
      return {
        volumeForecast: { trend: 'stable', confidence: 0 },
        responseTimeForecast: { trend: 'stable', confidence: 0 },
        categoryDistribution: {},
        seasonalPatterns: {},
        recommendations: ['Insufficient data for accurate predictions']
      };
    }

    const historicalData = this.prepareEmailHistoricalData(emails);
    const volumeModel = this.trainVolumeModel(historicalData);
    const responseTimeModel = this.trainResponseTimeModel(historicalData);

    return {
      volumeForecast: this.predictVolume(volumeModel, 7),
      responseTimeForecast: this.predictResponseTime(responseTimeModel, 7),
      categoryDistribution: this.predictCategoryDistribution(historicalData),
      seasonalPatterns: this.analyzeSeasonalPatterns(historicalData),
      recommendations: this.generateEmailRecommendations(volumeModel, responseTimeModel)
    };
  }

  /**
   * Predict customer behavior and patterns
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Customer predictions
   */
  async predictCustomerBehavior(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length < 5) {
      return {
        churnRisk: { score: 0, customers: [] },
        engagementForecast: { trend: 'stable', confidence: 0 },
        satisfactionPrediction: { score: 0, confidence: 0 },
        lifetimeValue: { average: 0, trend: 'stable' },
        recommendations: ['Insufficient customer data for predictions']
      };
    }

    const customerData = this.prepareCustomerData(emails);
    const churnModel = this.trainChurnModel(customerData);
    const engagementModel = this.trainEngagementModel(customerData);

    return {
      churnRisk: this.predictChurnRisk(churnModel, customerData),
      engagementForecast: this.predictEngagement(engagementModel, 7),
      satisfactionPrediction: this.predictSatisfaction(customerData),
      lifetimeValue: this.predictLifetimeValue(customerData),
      recommendations: this.generateCustomerRecommendations(churnModel, engagementModel)
    };
  }

  /**
   * Predict operational metrics and performance
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Operational predictions
   */
  async predictOperationalMetrics(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const [emailData, aiData, workflowData] = await Promise.all([
      supabase.from('email_logs').select('*').eq('user_id', this.userId).gte('created_at', dateFilter),
      supabase.from('ai_responses').select('*').eq('user_id', this.userId).gte('created_at', dateFilter),
      supabase.from('workflow_executions').select('*').eq('user_id', this.userId).gte('created_at', dateFilter)
    ]);

    const operationalData = {
      emails: emailData.data || [],
      aiResponses: aiData.data || [],
      workflows: workflowData.data || []
    };

    if (operationalData.emails.length < 5) {
      return {
        efficiencyForecast: { trend: 'stable', confidence: 0 },
        capacityPlanning: { recommendations: ['Insufficient data for capacity planning'] },
        bottleneckPrediction: { risks: [], confidence: 0 },
        automationOpportunities: [],
        recommendations: ['Insufficient operational data for predictions']
      };
    }

    const efficiencyModel = this.trainEfficiencyModel(operationalData);
    const capacityModel = this.trainCapacityModel(operationalData);

    return {
      efficiencyForecast: this.predictEfficiency(efficiencyModel, 7),
      capacityPlanning: this.predictCapacityNeeds(capacityModel, 30),
      bottleneckPrediction: this.predictBottlenecks(operationalData),
      automationOpportunities: this.identifyAutomationOpportunities(operationalData),
      recommendations: this.generateOperationalRecommendations(efficiencyModel, capacityModel)
    };
  }

  /**
   * Predict financial outcomes and costs
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Financial predictions
   */
  async predictFinancialOutcomes(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const { data: aiResponses } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    const { data: workflows } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!aiResponses || aiResponses.length < 5) {
      return {
        costForecast: { trend: 'stable', confidence: 0 },
        roiPrediction: { ratio: 0, confidence: 0 },
        budgetRecommendations: ['Insufficient financial data for predictions'],
        costOptimization: { opportunities: [], savings: 0 }
      };
    }

    const financialData = this.prepareFinancialData(aiResponses, workflows);
    const costModel = this.trainCostModel(financialData);
    const roiModel = this.trainROIModel(financialData);

    return {
      costForecast: this.predictCosts(costModel, 30),
      roiPrediction: this.predictROI(roiModel, 90),
      budgetRecommendations: this.generateBudgetRecommendations(costModel),
      costOptimization: this.identifyCostOptimizations(financialData)
    };
  }

  /**
   * Predict risks and potential issues
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Risk predictions
   */
  async predictRisks(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const [emailData, workflowData, errorData] = await Promise.all([
      supabase.from('email_logs').select('*').eq('user_id', this.userId).gte('created_at', dateFilter),
      supabase.from('workflow_executions').select('*').eq('user_id', this.userId).gte('created_at', dateFilter),
      supabase.from('outlook_analytics_events').select('*').eq('user_id', this.userId).eq('event_type', 'error').gte('created_at', dateFilter)
    ]);

    const riskData = {
      emails: emailData.data || [],
      workflows: workflowData.data || [],
      errors: errorData.data || []
    };

    return {
      systemRisks: this.predictSystemRisks(riskData),
      operationalRisks: this.predictOperationalRisks(riskData),
      customerRisks: this.predictCustomerRisks(riskData),
      financialRisks: this.predictFinancialRisks(riskData),
      mitigationStrategies: this.generateMitigationStrategies(riskData)
    };
  }

  /**
   * Predict opportunities and growth potential
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Opportunity predictions
   */
  async predictOpportunities(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length < 5) {
      return {
        growthOpportunities: [],
        marketOpportunities: [],
        efficiencyOpportunities: [],
        revenueOpportunities: [],
        recommendations: ['Insufficient data for opportunity analysis']
      };
    }

    const opportunityData = this.prepareOpportunityData(emails);

    return {
      growthOpportunities: this.identifyGrowthOpportunities(opportunityData),
      marketOpportunities: this.identifyMarketOpportunities(opportunityData),
      efficiencyOpportunities: this.identifyEfficiencyOpportunities(opportunityData),
      revenueOpportunities: this.identifyRevenueOpportunities(opportunityData),
      recommendations: this.generateOpportunityRecommendations(opportunityData)
    };
  }

  // Machine Learning Model Training Methods
  trainVolumeModel(historicalData) {
    // Simple linear regression for volume prediction
    const n = historicalData.length;
    if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

    const x = historicalData.map((_, i) => i);
    const y = historicalData.map(d => d.volume);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - (ssRes / ssTot);

    return { slope, intercept, r2 };
  }

  trainResponseTimeModel(historicalData) {
    // Simple moving average with trend for response time prediction
    const responseTimes = historicalData.map(d => d.avgResponseTime).filter(t => t > 0);
    if (responseTimes.length < 3) return { trend: 0, average: 0, confidence: 0 };

    const recent = responseTimes.slice(-7); // Last 7 data points
    const older = responseTimes.slice(0, -7); // Earlier data points

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;

    const trend = recentAvg - olderAvg;
    const confidence = Math.min(responseTimes.length / 30, 1);

    return { trend, average: recentAvg, confidence };
  }

  trainChurnModel(customerData) {
    // Simple churn prediction based on engagement patterns
    const customers = Object.keys(customerData);
    const churnFeatures = customers.map(customerId => {
      const data = customerData[customerId];
      return {
        customerId,
        emailFrequency: data.emailCount,
        responseRate: data.responseRate,
        avgResponseTime: data.avgResponseTime,
        lastActivity: data.lastActivity,
        churnRisk: this.calculateChurnRisk(data)
      };
    });

    return {
      features: churnFeatures,
      threshold: 0.3, // 30% churn risk threshold
      model: 'engagement_based'
    };
  }

  trainEngagementModel(customerData) {
    // Engagement prediction based on historical patterns
    const customers = Object.values(customerData);
    const avgEngagement = customers.reduce((sum, c) => sum + c.engagementScore, 0) / customers.length;
    
    return {
      averageEngagement: avgEngagement,
      trend: this.calculateEngagementTrend(customers),
      confidence: Math.min(customers.length / 20, 1)
    };
  }

  trainEfficiencyModel(operationalData) {
    // Efficiency prediction based on historical performance
    const efficiencyScores = operationalData.emails.map((_, i) => {
      const email = operationalData.emails[i];
      const aiResponse = operationalData.aiResponses[i];
      const workflow = operationalData.workflows[i];

      return this.calculateEfficiencyScore(email, aiResponse, workflow);
    });

    const avgEfficiency = efficiencyScores.reduce((a, b) => a + b, 0) / efficiencyScores.length;
    const trend = this.calculateTrend(efficiencyScores);

    return {
      averageEfficiency: avgEfficiency,
      trend,
      confidence: Math.min(efficiencyScores.length / 30, 1)
    };
  }

  trainCapacityModel(operationalData) {
    // Capacity planning based on resource utilization
    const capacityMetrics = {
      emailVolume: operationalData.emails.length,
      aiUsage: operationalData.aiResponses.length,
      workflowExecutions: operationalData.workflows.length,
      avgProcessingTime: this.calculateAvgProcessingTime(operationalData)
    };

    return {
      currentCapacity: capacityMetrics,
      utilizationRate: this.calculateUtilizationRate(capacityMetrics),
      growthRate: this.calculateGrowthRate(operationalData)
    };
  }

  trainCostModel(financialData) {
    // Cost prediction based on usage patterns
    const costs = financialData.map(d => d.totalCost);
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const trend = this.calculateTrend(costs);

    return {
      averageCost: avgCost,
      trend,
      confidence: Math.min(costs.length / 30, 1)
    };
  }

  trainROIModel(financialData) {
    // ROI prediction based on value generation
    const rois = financialData.map(d => d.roi);
    const avgROI = rois.reduce((a, b) => a + b, 0) / rois.length;
    const trend = this.calculateTrend(rois);

    return {
      averageROI: avgROI,
      trend,
      confidence: Math.min(rois.length / 30, 1)
    };
  }

  // Prediction Methods
  predictVolume(model, days) {
    const currentVolume = 100; // Mock current volume
    const predictedVolume = currentVolume + (model.slope * days);
    const confidence = Math.min(model.r2 * 100, 95);

    return {
      predicted: Math.round(predictedVolume),
      trend: model.slope > 0 ? 'increasing' : model.slope < 0 ? 'decreasing' : 'stable',
      confidence: Math.round(confidence),
      factors: ['historical_trend', 'seasonal_patterns']
    };
  }

  predictResponseTime(model, days) {
    const predictedTime = model.average + (model.trend * days);
    const confidence = Math.round(model.confidence * 100);

    return {
      predicted: Math.round(predictedTime),
      trend: model.trend > 0 ? 'increasing' : model.trend < 0 ? 'decreasing' : 'stable',
      confidence,
      factors: ['processing_efficiency', 'workload_patterns']
    };
  }

  predictChurnRisk(model, customerData) {
    const highRiskCustomers = model.features.filter(f => f.churnRisk > model.threshold);
    
    return {
      score: Math.round((highRiskCustomers.length / model.features.length) * 100),
      customers: highRiskCustomers.map(c => ({
        id: c.customerId,
        risk: Math.round(c.churnRisk * 100),
        factors: this.getChurnFactors(c)
      })),
      confidence: Math.round(model.features.length / 50 * 100)
    };
  }

  predictEngagement(model, days) {
    const predictedEngagement = model.averageEngagement + (model.trend * days);
    const confidence = Math.round(model.confidence * 100);

    return {
      predicted: Math.round(predictedEngagement),
      trend: model.trend > 0 ? 'increasing' : model.trend < 0 ? 'decreasing' : 'stable',
      confidence,
      factors: ['communication_frequency', 'response_quality']
    };
  }

  predictEfficiency(model, days) {
    const predictedEfficiency = model.averageEfficiency + (model.trend * days);
    const confidence = Math.round(model.confidence * 100);

    return {
      predicted: Math.round(predictedEfficiency),
      trend: model.trend > 0 ? 'improving' : model.trend < 0 ? 'declining' : 'stable',
      confidence,
      factors: ['automation_rate', 'process_optimization']
    };
  }

  predictCapacityNeeds(model, days) {
    const currentCapacity = model.currentCapacity.emailVolume;
    const growthRate = model.growthRate;
    const predictedCapacity = currentCapacity * Math.pow(1 + growthRate, days / 30);

    return {
      predictedCapacity: Math.round(predictedCapacity),
      currentUtilization: Math.round(model.utilizationRate * 100),
      recommendations: this.generateCapacityRecommendations(model, predictedCapacity)
    };
  }

  predictCosts(model, days) {
    const predictedCost = model.averageCost * (1 + model.trend * days / 30);
    const confidence = Math.round(model.confidence * 100);

    return {
      predicted: Math.round(predictedCost * 100) / 100,
      trend: model.trend > 0 ? 'increasing' : model.trend < 0 ? 'decreasing' : 'stable',
      confidence,
      factors: ['usage_patterns', 'efficiency_improvements']
    };
  }

  predictROI(model, days) {
    const predictedROI = model.averageROI + (model.trend * days / 30);
    const confidence = Math.round(model.confidence * 100);

    return {
      predicted: Math.round(predictedROI * 100) / 100,
      trend: model.trend > 0 ? 'improving' : model.trend < 0 ? 'declining' : 'stable',
      confidence,
      factors: ['value_generation', 'cost_optimization']
    };
  }

  // Data Preparation Methods
  prepareEmailHistoricalData(emails) {
    const dailyData = {};
    emails.forEach(email => {
      const date = new Date(email.created_at).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { volume: 0, avgResponseTime: 0, responseCount: 0 };
      }
      dailyData[date].volume++;
      if (email.response_time) {
        dailyData[date].avgResponseTime += email.response_time;
        dailyData[date].responseCount++;
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      volume: data.volume,
      avgResponseTime: data.responseCount > 0 ? data.avgResponseTime / data.responseCount : 0
    }));
  }

  prepareCustomerData(emails) {
    const customerData = {};
    emails.forEach(email => {
      const customerId = email.from_email;
      if (!customerData[customerId]) {
        customerData[customerId] = {
          emailCount: 0,
          responseCount: 0,
          totalResponseTime: 0,
          lastActivity: email.created_at,
          engagementScore: 0
        };
      }
      customerData[customerId].emailCount++;
      if (email.responded) {
        customerData[customerId].responseCount++;
        customerData[customerId].totalResponseTime += email.response_time || 0;
      }
    });

    // Calculate derived metrics
    Object.keys(customerData).forEach(customerId => {
      const data = customerData[customerId];
      data.responseRate = data.emailCount > 0 ? data.responseCount / data.emailCount : 0;
      data.avgResponseTime = data.responseCount > 0 ? data.totalResponseTime / data.responseCount : 0;
      data.engagementScore = this.calculateEngagementScore(data);
    });

    return customerData;
  }

  prepareFinancialData(aiResponses, workflows) {
    const dailyData = {};
    const processData = (items, type) => {
      items.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { aiCost: 0, workflowCost: 0, totalCost: 0, roi: 0 };
        }
        if (type === 'ai') {
          dailyData[date].aiCost += item.cost || 0;
        } else if (type === 'workflow') {
          dailyData[date].workflowCost += item.cost || 0;
        }
      });
    };

    processData(aiResponses, 'ai');
    processData(workflows, 'workflow');

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      totalCost: data.aiCost + data.workflowCost,
      aiCost: data.aiCost,
      workflowCost: data.workflowCost,
      roi: data.totalCost > 0 ? (data.totalCost * 5) / data.totalCost : 0 // Mock ROI calculation
    }));
  }

  prepareOpportunityData(emails) {
    return {
      totalEmails: emails.length,
      categories: this.groupByCategory(emails),
      responsePatterns: this.analyzeResponsePatterns(emails),
      customerSegments: this.analyzeCustomerSegments(emails),
      timePatterns: this.analyzeTimePatterns(emails)
    };
  }

  // Risk Prediction Methods
  predictSystemRisks(riskData) {
    const risks = [];
    
    if (riskData.errors.length > riskData.emails.length * 0.05) {
      risks.push({
        type: 'system',
        severity: 'high',
        description: 'High error rate detected',
        probability: 0.8,
        impact: 'high'
      });
    }

    return risks;
  }

  predictOperationalRisks(riskData) {
    const risks = [];
    
    const failedWorkflows = riskData.workflows.filter(w => w.status === 'failed').length;
    if (failedWorkflows > riskData.workflows.length * 0.1) {
      risks.push({
        type: 'operational',
        severity: 'medium',
        description: 'Workflow failure rate above threshold',
        probability: 0.6,
        impact: 'medium'
      });
    }

    return risks;
  }

  predictCustomerRisks(riskData) {
    const risks = [];
    
    const unrespondedEmails = riskData.emails.filter(e => !e.responded).length;
    if (unrespondedEmails > riskData.emails.length * 0.2) {
      risks.push({
        type: 'customer',
        severity: 'high',
        description: 'High number of unresponded emails',
        probability: 0.7,
        impact: 'high'
      });
    }

    return risks;
  }

  predictFinancialRisks(riskData) {
    const risks = [];
    
    // This would analyze cost trends and budget constraints
    risks.push({
      type: 'financial',
      severity: 'low',
      description: 'Cost optimization opportunities available',
      probability: 0.3,
      impact: 'low'
    });

    return risks;
  }

  // Opportunity Identification Methods
  identifyGrowthOpportunities(opportunityData) {
    const opportunities = [];
    
    if (opportunityData.totalEmails > 100) {
      opportunities.push({
        type: 'growth',
        title: 'Scale Email Automation',
        description: 'High email volume indicates potential for expanded automation',
        potential: 'high',
        effort: 'medium'
      });
    }

    return opportunities;
  }

  identifyMarketOpportunities(opportunityData) {
    const opportunities = [];
    
    const categories = Object.keys(opportunityData.categories);
    if (categories.length > 3) {
      opportunities.push({
        type: 'market',
        title: 'Diversify Service Offerings',
        description: 'Multiple email categories suggest diverse market opportunities',
        potential: 'medium',
        effort: 'high'
      });
    }

    return opportunities;
  }

  identifyEfficiencyOpportunities(opportunityData) {
    const opportunities = [];
    
    opportunities.push({
      type: 'efficiency',
      title: 'Optimize Response Times',
      description: 'Improve automation to reduce manual response times',
      potential: 'medium',
      effort: 'low'
    });

    return opportunities;
  }

  identifyRevenueOpportunities(opportunityData) {
    const opportunities = [];
    
    opportunities.push({
      type: 'revenue',
      title: 'Premium Service Tiers',
      description: 'High engagement suggests potential for premium service offerings',
      potential: 'high',
      effort: 'medium'
    });

    return opportunities;
  }

  // Utility Methods
  getDateFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  calculateChurnRisk(customerData) {
    const riskFactors = [];
    
    if (customerData.responseRate < 0.5) riskFactors.push(0.3);
    if (customerData.avgResponseTime > 60) riskFactors.push(0.2);
    if (customerData.emailCount < 2) riskFactors.push(0.4);
    
    return riskFactors.reduce((sum, risk) => sum + risk, 0) / Math.max(riskFactors.length, 1);
  }

  calculateEngagementScore(customerData) {
    const responseScore = customerData.responseRate * 50;
    const frequencyScore = Math.min(customerData.emailCount * 10, 50);
    
    return responseScore + frequencyScore;
  }

  calculateEngagementTrend(customers) {
    if (customers.length < 2) return 0;
    
    const recent = customers.slice(-5);
    const older = customers.slice(0, -5);
    
    const recentAvg = recent.reduce((sum, c) => sum + c.engagementScore, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, c) => sum + c.engagementScore, 0) / older.length : recentAvg;
    
    return recentAvg - olderAvg;
  }

  calculateEfficiencyScore(email, aiResponse, workflow) {
    let score = 0;
    
    if (email?.responded) score += 30;
    if (aiResponse?.status === 'success') score += 40;
    if (workflow?.status === 'success') score += 30;
    
    return score;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const recent = values.slice(-Math.floor(values.length / 2));
    const older = values.slice(0, -Math.floor(values.length / 2));
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  calculateAvgProcessingTime(operationalData) {
    const times = operationalData.emails.map(e => e.processing_time || 0).filter(t => t > 0);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  calculateUtilizationRate(capacityMetrics) {
    // Mock utilization calculation
    return Math.min(capacityMetrics.emailVolume / 1000, 1);
  }

  calculateGrowthRate(operationalData) {
    const volumes = operationalData.emails.map((_, i) => i + 1); // Mock growth
    return this.calculateTrend(volumes) / 100;
  }

  calculateOverallConfidence(predictions) {
    const confidences = predictions.map(p => p.confidence || 0);
    return confidences.length > 0 ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;
  }

  // Recommendation Generation Methods
  generateEmailRecommendations(volumeModel, responseTimeModel) {
    const recommendations = [];
    
    if (volumeModel.slope > 0) {
      recommendations.push('Prepare for increased email volume');
    }
    
    if (responseTimeModel.trend > 0) {
      recommendations.push('Optimize response time processing');
    }
    
    return recommendations;
  }

  generateCustomerRecommendations(churnModel, engagementModel) {
    const recommendations = [];
    
    if (churnModel.features.some(f => f.churnRisk > churnModel.threshold)) {
      recommendations.push('Implement customer retention strategies');
    }
    
    if (engagementModel.trend < 0) {
      recommendations.push('Improve customer engagement initiatives');
    }
    
    return recommendations;
  }

  generateOperationalRecommendations(efficiencyModel, capacityModel) {
    const recommendations = [];
    
    if (efficiencyModel.trend < 0) {
      recommendations.push('Review and optimize operational processes');
    }
    
    if (capacityModel.utilizationRate > 0.8) {
      recommendations.push('Consider capacity expansion');
    }
    
    return recommendations;
  }

  generateBudgetRecommendations(costModel) {
    const recommendations = [];
    
    if (costModel.trend > 0) {
      recommendations.push('Implement cost control measures');
    }
    
    recommendations.push('Review budget allocation for optimization');
    
    return recommendations;
  }

  generateMitigationStrategies(riskData) {
    return [
      'Implement automated error monitoring',
      'Enhance workflow error handling',
      'Improve customer response processes',
      'Regular cost and budget reviews'
    ];
  }

  generateOpportunityRecommendations(opportunityData) {
    return [
      'Focus on high-volume email categories',
      'Develop specialized automation workflows',
      'Create customer segmentation strategies',
      'Implement growth-oriented features'
    ];
  }

  generateCapacityRecommendations(model, predictedCapacity) {
    const recommendations = [];
    
    if (predictedCapacity > model.currentCapacity.emailVolume * 1.5) {
      recommendations.push('Plan for capacity scaling');
    }
    
    if (model.utilizationRate > 0.8) {
      recommendations.push('Optimize current resource utilization');
    }
    
    return recommendations;
  }

  identifyCostOptimizations(financialData) {
    return {
      opportunities: [
        'Optimize AI token usage',
        'Streamline workflow processes',
        'Implement cost monitoring'
      ],
      savings: Math.round(financialData.reduce((sum, d) => sum + d.totalCost, 0) * 0.1 * 100) / 100
    };
  }

  // Helper methods for data analysis
  groupByCategory(emails) {
    const categories = {};
    emails.forEach(email => {
      const category = email.category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  analyzeResponsePatterns(emails) {
    const responded = emails.filter(e => e.responded);
    return {
      responseRate: responded.length / emails.length,
      avgResponseTime: responded.reduce((sum, e) => sum + (e.response_time || 0), 0) / responded.length
    };
  }

  analyzeCustomerSegments(emails) {
    const segments = { high: 0, medium: 0, low: 0 };
    const emailCounts = {};
    
    emails.forEach(email => {
      emailCounts[email.from_email] = (emailCounts[email.from_email] || 0) + 1;
    });
    
    Object.values(emailCounts).forEach(count => {
      if (count >= 5) segments.high++;
      else if (count >= 2) segments.medium++;
      else segments.low++;
    });
    
    return segments;
  }

  analyzeTimePatterns(emails) {
    const hourCounts = {};
    emails.forEach(email => {
      const hour = new Date(email.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return hourCounts;
  }

  analyzeSeasonalPatterns(historicalData) {
    // Simple seasonal analysis
    return {
      trend: 'stable',
      seasonalFactors: ['weekday_patterns', 'monthly_cycles'],
      recommendations: ['Monitor seasonal variations']
    };
  }

  predictCategoryDistribution(historicalData) {
    // Mock category distribution prediction
    return {
      sales: 0.4,
      support: 0.3,
      billing: 0.2,
      other: 0.1
    };
  }

  predictSatisfaction(customerData) {
    const customers = Object.values(customerData);
    const avgResponseRate = customers.reduce((sum, c) => sum + c.responseRate, 0) / customers.length;
    
    return {
      score: Math.round(avgResponseRate * 100),
      confidence: Math.min(customers.length / 20, 1) * 100
    };
  }

  predictLifetimeValue(customerData) {
    const customers = Object.values(customerData);
    const avgEmails = customers.reduce((sum, c) => sum + c.emailCount, 0) / customers.length;
    
    return {
      average: Math.round(avgEmails * 10), // Mock LTV calculation
      trend: 'stable'
    };
  }

  predictBottlenecks(operationalData) {
    return {
      risks: ['High processing times', 'Workflow failures'],
      confidence: 0.7
    };
  }

  identifyAutomationOpportunities(operationalData) {
    return [
      'Automate repetitive email responses',
      'Implement smart routing',
      'Add automated follow-ups'
    ];
  }

  getChurnFactors(customer) {
    const factors = [];
    if (customer.emailFrequency < 2) factors.push('low_engagement');
    if (customer.responseRate < 0.5) factors.push('poor_response_rate');
    if (customer.avgResponseTime > 60) factors.push('slow_response');
    return factors;
  }

  // Caching methods
  getCachedPredictions(key) {
    const cached = this.predictionsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCachedPredictions(key, data) {
    this.predictionsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.predictionsCache.clear();
  }
}

export default PredictiveAnalytics;
