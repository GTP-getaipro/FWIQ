/**
 * Insight Engine
 * Automated business insights and recommendations for FloWorx
 */

import { supabase } from './customSupabaseClient';
import { logger } from './logger';
import { BusinessIntelligence } from './businessIntelligence';
import { PredictiveAnalytics } from './predictiveAnalytics';

export class InsightEngine {
  constructor(userId) {
    this.userId = userId;
    this.businessIntelligence = new BusinessIntelligence(userId);
    this.predictiveAnalytics = new PredictiveAnalytics(userId);
    this.insightsCache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes
    this.insightRules = this.initializeInsightRules();
  }

  /**
   * Generate comprehensive business insights
   * @param {string} timeRange - Time range for analysis
   * @returns {Promise<Object>} Business insights
   */
  async generateInsights(timeRange = '30d') {
    try {
      const cacheKey = `insights_${this.userId}_${timeRange}`;
      const cached = this.getCachedInsights(cacheKey);
      if (cached) return cached;

      const [
        businessIntelligence,
        predictiveInsights,
        automatedInsights,
        actionableRecommendations,
        priorityInsights
      ] = await Promise.all([
        this.businessIntelligence.getBusinessIntelligence(timeRange),
        this.predictiveAnalytics.getPredictiveInsights(timeRange),
        this.generateAutomatedInsights(timeRange),
        this.generateActionableRecommendations(timeRange),
        this.generatePriorityInsights(timeRange)
      ]);

      const insights = {
        businessIntelligence,
        predictiveInsights,
        automatedInsights,
        actionableRecommendations,
        priorityInsights,
        generatedAt: new Date().toISOString(),
        timeRange,
        summary: this.generateInsightSummary(automatedInsights, actionableRecommendations)
      };

      this.setCachedInsights(cacheKey, insights);
      logger.info('Business insights generated', { userId: this.userId, timeRange });
      return insights;
    } catch (error) {
      logger.error('Failed to generate business insights', { error: error.message, userId: this.userId });
      throw error;
    }
  }

  /**
   * Generate automated insights based on data patterns
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Automated insights
   */
  async generateAutomatedInsights(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const [
      emailInsights,
      customerInsights,
      operationalInsights,
      financialInsights,
      performanceInsights
    ] = await Promise.all([
      this.analyzeEmailPatterns(dateFilter),
      this.analyzeCustomerBehavior(dateFilter),
      this.analyzeOperationalEfficiency(dateFilter),
      this.analyzeFinancialPatterns(dateFilter),
      this.analyzePerformanceMetrics(dateFilter)
    ]);

    return [
      ...emailInsights,
      ...customerInsights,
      ...operationalInsights,
      ...financialInsights,
      ...performanceInsights
    ].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate actionable recommendations
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Actionable recommendations
   */
  async generateActionableRecommendations(timeRange) {
    const insights = await this.generateAutomatedInsights(timeRange);
    const recommendations = [];

    insights.forEach(insight => {
      const recommendation = this.convertInsightToRecommendation(insight);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    return recommendations.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Generate priority insights requiring immediate attention
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Priority insights
   */
  async generatePriorityInsights(timeRange) {
    const insights = await this.generateAutomatedInsights(timeRange);
    return insights.filter(insight => insight.priority >= 8).slice(0, 5);
  }

  /**
   * Get insights for specific business area
   * @param {string} area - Business area (email, customer, operations, financial)
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Area-specific insights
   */
  async getAreaInsights(area, timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    switch (area) {
      case 'email':
        return await this.getEmailInsights(dateFilter);
      case 'customer':
        return await this.getCustomerInsights(dateFilter);
      case 'operations':
        return await this.getOperationsInsights(dateFilter);
      case 'financial':
        return await this.getFinancialInsights(dateFilter);
      default:
        throw new Error(`Unknown business area: ${area}`);
    }
  }

  /**
   * Get trend analysis for specific metrics
   * @param {string} metric - Metric name
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Trend analysis
   */
  async getTrendAnalysis(metric, timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    const { data: events } = await supabase
      .from('outlook_analytics_events')
      .select('*')
      .eq('user_id', this.userId)
      .eq('type', metric)
      .gte('created_at', dateFilter)
      .order('created_at', { ascending: true });

    if (!events || events.length < 5) {
      return {
        trend: 'insufficient_data',
        change: 0,
        confidence: 0,
        insights: ['Insufficient data for trend analysis']
      };
    }

    const trendData = this.calculateTrendData(events);
    const insights = this.generateTrendInsights(trendData, metric);

    return {
      ...trendData,
      insights,
      recommendations: this.generateTrendRecommendations(trendData, metric)
    };
  }

  /**
   * Get anomaly detection results
   * @param {string} timeRange - Time range
   * @returns {Promise<Array>} Detected anomalies
   */
  async detectAnomalies(timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    const [
      emailAnomalies,
      performanceAnomalies,
      costAnomalies,
      customerAnomalies
    ] = await Promise.all([
      this.detectEmailAnomalies(dateFilter),
      this.detectPerformanceAnomalies(dateFilter),
      this.detectCostAnomalies(dateFilter),
      this.detectCustomerAnomalies(dateFilter)
    ]);

    return [
      ...emailAnomalies,
      ...performanceAnomalies,
      ...costAnomalies,
      ...customerAnomalies
    ].sort((a, b) => b.severity - a.severity);
  }

  /**
   * Get benchmarking insights
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Benchmarking insights
   */
  async getBenchmarkingInsights(timeRange = '30d') {
    const businessIntelligence = await this.businessIntelligence.getBusinessIntelligence(timeRange);
    const competitiveAnalysis = businessIntelligence.competitiveAnalysis;
    
    return {
      industryBenchmarks: competitiveAnalysis.industryBenchmarks,
      competitivePosition: competitiveAnalysis.competitivePosition,
      performanceGaps: this.identifyPerformanceGaps(businessIntelligence, competitiveAnalysis),
      improvementOpportunities: this.identifyImprovementOpportunities(businessIntelligence, competitiveAnalysis),
      recommendations: this.generateBenchmarkingRecommendations(businessIntelligence, competitiveAnalysis)
    };
  }

  // Email Analysis Methods
  async analyzeEmailPatterns(dateFilter) {
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length === 0) {
      return [{
        type: 'email',
        category: 'data',
        title: 'No Email Data Available',
        description: 'No email data found for the selected time period',
        priority: 1,
        impact: 'low',
        actionable: false
      }];
    }

    const insights = [];
    
    // Response rate analysis
    const responseRate = emails.filter(e => e.responded).length / emails.length;
    if (responseRate < 0.8) {
      insights.push({
        type: 'email',
        category: 'performance',
        title: 'Low Email Response Rate',
        description: `Response rate is ${Math.round(responseRate * 100)}%, below recommended 80%`,
        priority: 8,
        impact: 'high',
        actionable: true,
        metrics: { responseRate: Math.round(responseRate * 100) }
      });
    }

    // Response time analysis
    const respondedEmails = emails.filter(e => e.responded && e.response_time);
    if (respondedEmails.length > 0) {
      const avgResponseTime = respondedEmails.reduce((sum, e) => sum + e.response_time, 0) / respondedEmails.length;
      if (avgResponseTime > 60) {
        insights.push({
          type: 'email',
          category: 'performance',
          title: 'Slow Response Times',
          description: `Average response time is ${Math.round(avgResponseTime)} minutes, above recommended 60 minutes`,
          priority: 7,
          impact: 'medium',
          actionable: true,
          metrics: { avgResponseTime: Math.round(avgResponseTime) }
        });
      }
    }

    // Volume analysis
    const dailyVolume = emails.length / this.getDaysInRange(dateFilter);
    if (dailyVolume > 50) {
      insights.push({
        type: 'email',
        category: 'volume',
        title: 'High Email Volume',
        description: `Processing ${Math.round(dailyVolume)} emails per day, consider automation`,
        priority: 6,
        impact: 'medium',
        actionable: true,
        metrics: { dailyVolume: Math.round(dailyVolume) }
      });
    }

    return insights;
  }

  async getEmailInsights(dateFilter) {
    const emailInsights = await this.analyzeEmailPatterns(dateFilter);
    
    return {
      insights: emailInsights,
      summary: this.generateEmailSummary(emailInsights),
      recommendations: this.generateEmailRecommendations(emailInsights)
    };
  }

  // Customer Analysis Methods
  async analyzeCustomerBehavior(dateFilter) {
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length === 0) {
      return [];
    }

    const insights = [];
    const customerData = this.groupEmailsByCustomer(emails);
    
    // Customer engagement analysis
    const lowEngagementCustomers = Object.entries(customerData)
      .filter(([_, data]) => data.emailCount < 2)
      .length;
    
    if (lowEngagementCustomers > Object.keys(customerData).length * 0.3) {
      insights.push({
        type: 'customer',
        category: 'engagement',
        title: 'Low Customer Engagement',
        description: `${lowEngagementCustomers} customers have low engagement levels`,
        priority: 7,
        impact: 'high',
        actionable: true,
        metrics: { lowEngagementCustomers }
      });
    }

    // Customer satisfaction analysis
    const satisfactionScore = this.calculateCustomerSatisfaction(emails);
    if (satisfactionScore < 80) {
      insights.push({
        type: 'customer',
        category: 'satisfaction',
        title: 'Customer Satisfaction Below Target',
        description: `Customer satisfaction score is ${satisfactionScore}%, below target of 80%`,
        priority: 8,
        impact: 'high',
        actionable: true,
        metrics: { satisfactionScore }
      });
    }

    return insights;
  }

  async getCustomerInsights(dateFilter) {
    const customerInsights = await this.analyzeCustomerBehavior(dateFilter);
    
    return {
      insights: customerInsights,
      summary: this.generateCustomerSummary(customerInsights),
      recommendations: this.generateCustomerRecommendations(customerInsights)
    };
  }

  // Operations Analysis Methods
  async analyzeOperationalEfficiency(dateFilter) {
    const [
      emailData,
      aiData,
      workflowData
    ] = await Promise.all([
      supabase.from('email_logs').select('*').eq('user_id', this.userId).gte('created_at', dateFilter),
      supabase.from('ai_responses').select('*').eq('user_id', this.userId).gte('created_at', dateFilter),
      supabase.from('workflow_executions').select('*').eq('user_id', this.userId).gte('created_at', dateFilter)
    ]);

    const insights = [];
    
    // AI efficiency analysis
    if (aiData.data && aiData.data.length > 0) {
      const aiSuccessRate = aiData.data.filter(r => r.status === 'success').length / aiData.data.length;
      if (aiSuccessRate < 0.9) {
        insights.push({
          type: 'operations',
          category: 'ai',
          title: 'AI Response Quality Issues',
          description: `AI success rate is ${Math.round(aiSuccessRate * 100)}%, below target of 90%`,
          priority: 8,
          impact: 'high',
          actionable: true,
          metrics: { aiSuccessRate: Math.round(aiSuccessRate * 100) }
        });
      }
    }

    // Workflow reliability analysis
    if (workflowData.data && workflowData.data.length > 0) {
      const workflowSuccessRate = workflowData.data.filter(w => w.status === 'success').length / workflowData.data.length;
      if (workflowSuccessRate < 0.95) {
        insights.push({
          type: 'operations',
          category: 'workflow',
          title: 'Workflow Reliability Issues',
          description: `Workflow success rate is ${Math.round(workflowSuccessRate * 100)}%, below target of 95%`,
          priority: 9,
          impact: 'high',
          actionable: true,
          metrics: { workflowSuccessRate: Math.round(workflowSuccessRate * 100) }
        });
      }
    }

    return insights;
  }

  async getOperationsInsights(dateFilter) {
    const operationsInsights = await this.analyzeOperationalEfficiency(dateFilter);
    
    return {
      insights: operationsInsights,
      summary: this.generateOperationsSummary(operationsInsights),
      recommendations: this.generateOperationsRecommendations(operationsInsights)
    };
  }

  // Financial Analysis Methods
  async analyzeFinancialPatterns(dateFilter) {
    const { data: aiResponses } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!aiResponses || aiResponses.length === 0) {
      return [];
    }

    const insights = [];
    const totalCost = aiResponses.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgCostPerResponse = totalCost / aiResponses.length;
    
    // Cost analysis
    if (avgCostPerResponse > 0.05) {
      insights.push({
        type: 'financial',
        category: 'cost',
        title: 'High AI Response Costs',
        description: `Average cost per AI response is $${avgCostPerResponse.toFixed(3)}, consider optimization`,
        priority: 6,
        impact: 'medium',
        actionable: true,
        metrics: { avgCostPerResponse: Math.round(avgCostPerResponse * 1000) / 1000 }
      });
    }

    // Token usage analysis
    const avgTokens = aiResponses.reduce((sum, r) => sum + (r.tokens_used || 0), 0) / aiResponses.length;
    if (avgTokens > 1500) {
      insights.push({
        type: 'financial',
        category: 'efficiency',
        title: 'High Token Usage',
        description: `Average token usage is ${Math.round(avgTokens)}, consider prompt optimization`,
        priority: 5,
        impact: 'medium',
        actionable: true,
        metrics: { avgTokens: Math.round(avgTokens) }
      });
    }

    return insights;
  }

  async getFinancialInsights(dateFilter) {
    const financialInsights = await this.analyzeFinancialPatterns(dateFilter);
    
    return {
      insights: financialInsights,
      summary: this.generateFinancialSummary(financialInsights),
      recommendations: this.generateFinancialRecommendations(financialInsights)
    };
  }

  // Performance Analysis Methods
  async analyzePerformanceMetrics(dateFilter) {
    const { data: performanceEvents } = await supabase
      .from('outlook_analytics_events')
      .select('*')
      .eq('user_id', this.userId)
      .eq('type', 'performance')
      .gte('created_at', dateFilter);

    if (!performanceEvents || performanceEvents.length === 0) {
      return [];
    }

    const insights = [];
    
    // Performance analysis
    const slowEvents = performanceEvents.filter(e => e.data?.value > 3000); // > 3 seconds
    if (slowEvents.length > performanceEvents.length * 0.1) {
      insights.push({
        type: 'performance',
        category: 'speed',
        title: 'Performance Issues Detected',
        description: `${slowEvents.length} slow performance events detected`,
        priority: 7,
        impact: 'medium',
        actionable: true,
        metrics: { slowEvents: slowEvents.length }
      });
    }

    return insights;
  }

  // Anomaly Detection Methods
  async detectEmailAnomalies(dateFilter) {
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length < 10) return [];

    const anomalies = [];
    const dailyVolumes = this.calculateDailyVolumes(emails);
    const avgVolume = dailyVolumes.reduce((a, b) => a + b, 0) / dailyVolumes.length;
    const threshold = avgVolume * 2; // 2x average volume

    dailyVolumes.forEach((volume, index) => {
      if (volume > threshold) {
        anomalies.push({
          type: 'email_volume',
          severity: 8,
          description: `Unusual email volume spike: ${volume} emails (${Math.round(avgVolume)} average)`,
          date: this.getDateFromIndex(index, dateFilter),
          impact: 'medium'
        });
      }
    });

    return anomalies;
  }

  async detectPerformanceAnomalies(dateFilter) {
    const { data: performanceEvents } = await supabase
      .from('outlook_analytics_events')
      .select('*')
      .eq('user_id', this.userId)
      .eq('type', 'performance')
      .gte('created_at', dateFilter);

    if (!performanceEvents || performanceEvents.length < 5) return [];

    const anomalies = [];
    const responseTimes = performanceEvents.map(e => e.data?.value || 0);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const threshold = avgResponseTime * 3; // 3x average response time

    responseTimes.forEach((time, index) => {
      if (time > threshold) {
        anomalies.push({
          type: 'performance',
          severity: 7,
          description: `Performance anomaly: ${Math.round(time)}ms response time (${Math.round(avgResponseTime)}ms average)`,
          date: performanceEvents[index].created_at,
          impact: 'high'
        });
      }
    });

    return anomalies;
  }

  async detectCostAnomalies(dateFilter) {
    const { data: aiResponses } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!aiResponses || aiResponses.length < 5) return [];

    const anomalies = [];
    const costs = aiResponses.map(r => r.cost || 0);
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const threshold = avgCost * 5; // 5x average cost

    costs.forEach((cost, index) => {
      if (cost > threshold) {
        anomalies.push({
          type: 'cost',
          severity: 6,
          description: `Cost anomaly: $${cost.toFixed(3)} ($${avgCost.toFixed(3)} average)`,
          date: aiResponses[index].created_at,
          impact: 'medium'
        });
      }
    });

    return anomalies;
  }

  async detectCustomerAnomalies(dateFilter) {
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length < 10) return [];

    const anomalies = [];
    const customerData = this.groupEmailsByCustomer(emails);
    
    // Detect customers with unusual behavior
    Object.entries(customerData).forEach(([customerId, data]) => {
      if (data.emailCount > 20) { // Unusually high email count
        anomalies.push({
          type: 'customer_behavior',
          severity: 5,
          description: `Unusual customer activity: ${customerId} sent ${data.emailCount} emails`,
          date: data.lastEmail,
          impact: 'low'
        });
      }
    });

    return anomalies;
  }

  // Helper Methods
  initializeInsightRules() {
    return {
      email: {
        responseRate: { threshold: 0.8, priority: 8 },
        responseTime: { threshold: 60, priority: 7 },
        volume: { threshold: 50, priority: 6 }
      },
      customer: {
        engagement: { threshold: 0.3, priority: 7 },
        satisfaction: { threshold: 80, priority: 8 }
      },
      operations: {
        aiSuccessRate: { threshold: 0.9, priority: 8 },
        workflowSuccessRate: { threshold: 0.95, priority: 9 }
      },
      financial: {
        costPerResponse: { threshold: 0.05, priority: 6 },
        tokenUsage: { threshold: 1500, priority: 5 }
      }
    };
  }

  convertInsightToRecommendation(insight) {
    const recommendationMap = {
      'Low Email Response Rate': {
        title: 'Improve Email Response Automation',
        description: 'Implement automated responses for common email types',
        effort: 'medium',
        impact: 'high',
        timeline: '2 weeks'
      },
      'Slow Response Times': {
        title: 'Optimize Response Processing',
        description: 'Review and optimize email processing workflows',
        effort: 'low',
        impact: 'medium',
        timeline: '1 week'
      },
      'High Email Volume': {
        title: 'Scale Email Automation',
        description: 'Implement additional automation workflows',
        effort: 'high',
        impact: 'high',
        timeline: '1 month'
      },
      'Low Customer Engagement': {
        title: 'Enhance Customer Engagement',
        description: 'Implement proactive customer communication strategies',
        effort: 'medium',
        impact: 'high',
        timeline: '3 weeks'
      },
      'Customer Satisfaction Below Target': {
        title: 'Improve Customer Experience',
        description: 'Focus on response quality and customer service',
        effort: 'medium',
        impact: 'high',
        timeline: '2 weeks'
      },
      'AI Response Quality Issues': {
        title: 'Optimize AI Response Quality',
        description: 'Review and improve AI prompts and response templates',
        effort: 'low',
        impact: 'high',
        timeline: '1 week'
      },
      'Workflow Reliability Issues': {
        title: 'Fix Workflow Reliability',
        description: 'Investigate and resolve workflow execution failures',
        effort: 'high',
        impact: 'high',
        timeline: '1 week'
      },
      'High AI Response Costs': {
        title: 'Optimize AI Cost Efficiency',
        description: 'Implement cost controls and optimize AI usage',
        effort: 'low',
        impact: 'medium',
        timeline: '1 week'
      },
      'High Token Usage': {
        title: 'Optimize AI Token Usage',
        description: 'Refine prompts to reduce token consumption',
        effort: 'low',
        impact: 'medium',
        timeline: '1 week'
      }
    };

    const recommendation = recommendationMap[insight.title];
    if (!recommendation) return null;

    return {
      ...recommendation,
      category: insight.type,
      priority: insight.priority,
      metrics: insight.metrics,
      actionable: insight.actionable
    };
  }

  generateInsightSummary(automatedInsights, recommendations) {
    const highPriorityInsights = automatedInsights.filter(i => i.priority >= 8).length;
    const actionableInsights = recommendations.filter(r => r.actionable).length;
    
    return {
      totalInsights: automatedInsights.length,
      highPriorityInsights,
      actionableInsights,
      categories: this.groupInsightsByCategory(automatedInsights),
      overallHealth: this.calculateOverallHealth(automatedInsights)
    };
  }

  groupInsightsByCategory(insights) {
    const categories = {};
    insights.forEach(insight => {
      if (!categories[insight.type]) {
        categories[insight.type] = 0;
      }
      categories[insight.type]++;
    });
    return categories;
  }

  calculateOverallHealth(insights) {
    const highPriorityCount = insights.filter(i => i.priority >= 8).length;
    const totalInsights = insights.length;
    
    if (totalInsights === 0) return 'excellent';
    if (highPriorityCount === 0) return 'excellent';
    if (highPriorityCount <= totalInsights * 0.2) return 'good';
    if (highPriorityCount <= totalInsights * 0.4) return 'fair';
    return 'needs_attention';
  }

  // Data Processing Methods
  groupEmailsByCustomer(emails) {
    const customerData = {};
    emails.forEach(email => {
      const customerId = email.from_email;
      if (!customerData[customerId]) {
        customerData[customerId] = {
          emailCount: 0,
          respondedCount: 0,
          totalResponseTime: 0,
          lastEmail: email.created_at
        };
      }
      customerData[customerId].emailCount++;
      if (email.responded) {
        customerData[customerId].respondedCount++;
        customerData[customerId].totalResponseTime += email.response_time || 0;
      }
    });
    return customerData;
  }

  calculateCustomerSatisfaction(emails) {
    const responded = emails.filter(e => e.responded).length;
    const responseRate = responded / emails.length;
    
    // Use response rate as a proxy for satisfaction
    return Math.round(responseRate * 100);
  }

  calculateDailyVolumes(emails) {
    const dailyVolumes = {};
    emails.forEach(email => {
      const date = new Date(email.created_at).toISOString().split('T')[0];
      dailyVolumes[date] = (dailyVolumes[date] || 0) + 1;
    });
    
    return Object.values(dailyVolumes);
  }

  calculateTrendData(events) {
    const values = events.map(e => e.data?.value || 1);
    const n = values.length;
    
    if (n < 2) {
      return { trend: 'stable', change: 0, confidence: 0 };
    }

    const firstHalf = values.slice(0, Math.floor(n / 2));
    const secondHalf = values.slice(Math.floor(n / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    const confidence = Math.min(n / 30, 1);

    let trend = 'stable';
    if (change > 10) trend = 'increasing';
    else if (change < -10) trend = 'decreasing';

    return {
      trend,
      change: Math.round(change),
      confidence: Math.round(confidence * 100)
    };
  }

  generateTrendInsights(trendData, metric) {
    const insights = [];
    
    if (trendData.trend === 'increasing' && trendData.change > 20) {
      insights.push(`${metric} showing significant upward trend (+${trendData.change}%)`);
    } else if (trendData.trend === 'decreasing' && trendData.change < -20) {
      insights.push(`${metric} showing significant downward trend (${trendData.change}%)`);
    } else if (trendData.trend === 'stable') {
      insights.push(`${metric} showing stable performance`);
    }

    return insights;
  }

  generateTrendRecommendations(trendData, metric) {
    const recommendations = [];
    
    if (trendData.trend === 'increasing' && trendData.change > 20) {
      recommendations.push(`Monitor ${metric} growth and prepare for scaling`);
    } else if (trendData.trend === 'decreasing' && trendData.change < -20) {
      recommendations.push(`Investigate ${metric} decline and implement corrective measures`);
    }

    return recommendations;
  }

  identifyPerformanceGaps(businessIntelligence, competitiveAnalysis) {
    const gaps = [];
    const benchmarks = competitiveAnalysis.industryBenchmarks;
    
    if (businessIntelligence.businessMetrics.emailMetrics.responseRate < benchmarks.responseRate) {
      gaps.push({
        metric: 'response_rate',
        current: businessIntelligence.businessMetrics.emailMetrics.responseRate,
        benchmark: benchmarks.responseRate,
        gap: benchmarks.responseRate - businessIntelligence.businessMetrics.emailMetrics.responseRate
      });
    }

    return gaps;
  }

  identifyImprovementOpportunities(businessIntelligence, competitiveAnalysis) {
    const opportunities = [];
    const gaps = this.identifyPerformanceGaps(businessIntelligence, competitiveAnalysis);
    
    gaps.forEach(gap => {
      opportunities.push({
        area: gap.metric,
        potential: 'high',
        effort: 'medium',
        description: `Improve ${gap.metric} to meet industry standards`
      });
    });

    return opportunities;
  }

  generateBenchmarkingRecommendations(businessIntelligence, competitiveAnalysis) {
    const recommendations = [];
    const gaps = this.identifyPerformanceGaps(businessIntelligence, competitiveAnalysis);
    
    gaps.forEach(gap => {
      recommendations.push({
        title: `Improve ${gap.metric.replace('_', ' ')}`,
        description: `Focus on ${gap.metric} to reach industry benchmark of ${gap.benchmark}%`,
        priority: gap.gap > 10 ? 'high' : 'medium',
        impact: 'high'
      });
    });

    return recommendations;
  }

  // Summary Generation Methods
  generateEmailSummary(insights) {
    const highPriority = insights.filter(i => i.priority >= 8).length;
    return {
      totalInsights: insights.length,
      highPriorityIssues: highPriority,
      mainConcerns: insights.slice(0, 3).map(i => i.title),
      overallStatus: highPriority > 0 ? 'needs_attention' : 'good'
    };
  }

  generateCustomerSummary(insights) {
    const highPriority = insights.filter(i => i.priority >= 8).length;
    return {
      totalInsights: insights.length,
      highPriorityIssues: highPriority,
      mainConcerns: insights.slice(0, 3).map(i => i.title),
      overallStatus: highPriority > 0 ? 'needs_attention' : 'good'
    };
  }

  generateOperationsSummary(insights) {
    const highPriority = insights.filter(i => i.priority >= 8).length;
    return {
      totalInsights: insights.length,
      highPriorityIssues: highPriority,
      mainConcerns: insights.slice(0, 3).map(i => i.title),
      overallStatus: highPriority > 0 ? 'needs_attention' : 'good'
    };
  }

  generateFinancialSummary(insights) {
    const highPriority = insights.filter(i => i.priority >= 8).length;
    return {
      totalInsights: insights.length,
      highPriorityIssues: highPriority,
      mainConcerns: insights.slice(0, 3).map(i => i.title),
      overallStatus: highPriority > 0 ? 'needs_attention' : 'good'
    };
  }

  // Recommendation Generation Methods
  generateEmailRecommendations(insights) {
    return insights.filter(i => i.actionable).map(insight => ({
      title: this.convertInsightToRecommendation(insight)?.title || 'Review email processes',
      priority: insight.priority,
      category: 'email'
    }));
  }

  generateCustomerRecommendations(insights) {
    return insights.filter(i => i.actionable).map(insight => ({
      title: this.convertInsightToRecommendation(insight)?.title || 'Improve customer experience',
      priority: insight.priority,
      category: 'customer'
    }));
  }

  generateOperationsRecommendations(insights) {
    return insights.filter(i => i.actionable).map(insight => ({
      title: this.convertInsightToRecommendation(insight)?.title || 'Optimize operations',
      priority: insight.priority,
      category: 'operations'
    }));
  }

  generateFinancialRecommendations(insights) {
    return insights.filter(i => i.actionable).map(insight => ({
      title: this.convertInsightToRecommendation(insight)?.title || 'Optimize costs',
      priority: insight.priority,
      category: 'financial'
    }));
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

  getDaysInRange(dateFilter) {
    const now = new Date();
    const start = new Date(dateFilter);
    return Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  }

  getDateFromIndex(index, dateFilter) {
    const start = new Date(dateFilter);
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  }

  // Caching methods
  getCachedInsights(key) {
    const cached = this.insightsCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCachedInsights(key, data) {
    this.insightsCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.insightsCache.clear();
  }
}

export default InsightEngine;
