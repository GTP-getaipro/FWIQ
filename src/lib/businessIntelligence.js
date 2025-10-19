/**
 * Business Intelligence Engine
 * Strategic business intelligence and insights for FloWorx
 */

import { supabase } from './customSupabaseClient';
import { logger } from './logger';
import { AdvancedAnalytics } from './advancedAnalytics';

export class BusinessIntelligence {
  constructor(userId) {
    this.userId = userId;
    this.advancedAnalytics = new AdvancedAnalytics(userId);
    this.insightsCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get comprehensive business intelligence dashboard
   * @param {string} timeRange - Time range for analysis
   * @returns {Promise<Object>} Business intelligence data
   */
  async getBusinessIntelligence(timeRange = '30d') {
    try {
      const cacheKey = `bi_${this.userId}_${timeRange}`;
      const cached = this.getCachedInsights(cacheKey);
      if (cached) return cached;

      const [
        businessMetrics,
        customerInsights,
        operationalEfficiency,
        financialAnalysis,
        competitiveAnalysis
      ] = await Promise.all([
        this.getBusinessMetrics(timeRange),
        this.getCustomerInsights(timeRange),
        this.getOperationalEfficiency(timeRange),
        this.getFinancialAnalysis(timeRange),
        this.getCompetitiveAnalysis(timeRange)
      ]);

      // Create biData object for strategic recommendations
      const biData = {
        businessMetrics,
        customerInsights,
        operationalEfficiency,
        financialAnalysis
      };

      // Get strategic recommendations with biData to avoid recursion
      const strategicRecommendations = await this.getStrategicRecommendations(timeRange, biData);

      const finalBiData = {
        businessMetrics,
        customerInsights,
        operationalEfficiency,
        financialAnalysis,
        strategicRecommendations,
        competitiveAnalysis,
        generatedAt: new Date().toISOString(),
        timeRange
      };

      this.setCachedInsights(cacheKey, finalBiData);
      logger.info('Business intelligence generated', { userId: this.userId, timeRange });
      return finalBiData;
    } catch (error) {
      logger.error('Failed to generate business intelligence', { error: error.message, userId: this.userId });
      throw error;
    }
  }

  /**
   * Get business metrics and KPIs
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Business metrics
   */
  async getBusinessMetrics(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const [
      emailMetrics,
      aiMetrics,
      workflowMetrics,
      userMetrics
    ] = await Promise.all([
      this.getEmailBusinessMetrics(dateFilter),
      this.getAIBusinessMetrics(dateFilter),
      this.getWorkflowBusinessMetrics(dateFilter),
      this.getUserBusinessMetrics(dateFilter)
    ]);

    return {
      emailMetrics,
      aiMetrics,
      workflowMetrics,
      userMetrics,
      overallScore: this.calculateOverallBusinessScore(emailMetrics, aiMetrics, workflowMetrics, userMetrics)
    };
  }

  /**
   * Get customer insights and behavior analysis
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Customer insights
   */
  async getCustomerInsights(timeRange) {
    const dateFilter = this.getDateFilter(timeRange);
    
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length === 0) {
      return {
        totalCustomers: 0,
        customerSegments: {},
        communicationPatterns: {},
        satisfactionScore: 0,
        retentionRate: 0,
        insights: []
      };
    }

    return {
      totalCustomers: this.getUniqueCustomerCount(emails),
      customerSegments: this.analyzeCustomerSegments(emails),
      communicationPatterns: this.analyzeCommunicationPatterns(emails),
      satisfactionScore: this.calculateSatisfactionScore(emails),
      retentionRate: this.calculateRetentionRate(emails),
      insights: this.generateCustomerInsights(emails)
    };
  }

  /**
   * Get operational efficiency metrics
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Operational efficiency data
   */
  async getOperationalEfficiency(timeRange) {
    const performanceInsights = await this.advancedAnalytics.getPerformanceInsights(timeRange);
    
    return {
      emailProcessingEfficiency: performanceInsights.email.efficiency,
      aiResponseEfficiency: performanceInsights.ai.efficiency,
      workflowReliability: performanceInsights.workflow.reliability,
      automationRate: this.calculateAutomationRate(performanceInsights),
      bottlenecks: this.identifyOperationalBottlenecks(performanceInsights),
      optimizationOpportunities: this.identifyOptimizationOpportunities(performanceInsights),
      efficiencyScore: this.calculateEfficiencyScore(performanceInsights)
    };
  }

  /**
   * Get financial analysis and cost optimization
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Financial analysis
   */
  async getFinancialAnalysis(timeRange) {
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

    const totalAICost = aiResponses?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
    const totalWorkflowCost = workflows?.reduce((sum, w) => sum + (w.cost || 0), 0) || 0;
    const totalCost = totalAICost + totalWorkflowCost;

    return {
      totalCost,
      aiCost: totalAICost,
      workflowCost: totalWorkflowCost,
      costPerEmail: this.calculateCostPerEmail(totalCost, dateFilter),
      costTrends: await this.calculateCostTrends(timeRange),
      costOptimization: this.identifyCostOptimizations(aiResponses, workflows),
      roi: this.calculateROI(totalCost, dateFilter),
      budgetRecommendations: this.generateBudgetRecommendations(totalCost, timeRange)
    };
  }

  /**
   * Get strategic recommendations
   * @param {string} timeRange - Time range
   * @param {Object} biData - Business intelligence data (optional, to avoid recursion)
   * @returns {Promise<Array>} Strategic recommendations
   */
  async getStrategicRecommendations(timeRange, biData = null) {
    // If biData is not provided, fetch it, but avoid recursion by not calling getBusinessIntelligence
    if (!biData) {
      const [
        businessMetrics,
        customerInsights,
        operationalEfficiency,
        financialAnalysis
      ] = await Promise.all([
        this.getBusinessMetrics(timeRange),
        this.getCustomerInsights(timeRange),
        this.getOperationalEfficiency(timeRange),
        this.getFinancialAnalysis(timeRange)
      ]);
      
      biData = {
        businessMetrics,
        customerInsights,
        operationalEfficiency,
        financialAnalysis
      };
    }
    
    const recommendations = [];

    // Business growth recommendations
    if (biData.businessMetrics.overallScore < 70) {
      recommendations.push({
        category: 'growth',
        priority: 'high',
        title: 'Improve Overall Business Performance',
        description: 'Focus on optimizing email processing efficiency and AI response quality',
        impact: 'high',
        effort: 'medium',
        timeline: '30 days'
      });
    }

    // Customer satisfaction recommendations
    if (biData.customerInsights.satisfactionScore < 80) {
      recommendations.push({
        category: 'customer',
        priority: 'high',
        title: 'Enhance Customer Experience',
        description: 'Improve response times and communication quality',
        impact: 'high',
        effort: 'low',
        timeline: '14 days'
      });
    }

    // Cost optimization recommendations
    if (biData.financialAnalysis.totalCost > 100) {
      recommendations.push({
        category: 'cost',
        priority: 'medium',
        title: 'Optimize Operational Costs',
        description: 'Review AI usage patterns and workflow efficiency',
        impact: 'medium',
        effort: 'low',
        timeline: '21 days'
      });
    }

    // Operational efficiency recommendations
    if (biData.operationalEfficiency.efficiencyScore < 75) {
      recommendations.push({
        category: 'operations',
        priority: 'medium',
        title: 'Streamline Operations',
        description: 'Automate repetitive tasks and optimize workflow processes',
        impact: 'medium',
        effort: 'high',
        timeline: '45 days'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get competitive analysis
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Competitive analysis
   */
  async getCompetitiveAnalysis(timeRange) {
    // This would typically integrate with external competitive intelligence APIs
    // For now, we'll provide industry benchmarks based on business type
    
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('business_type')
      .eq('user_id', this.userId)
      .single();

    const businessType = businessProfile?.business_type || 'general';
    const industryBenchmarks = this.getIndustryBenchmarks(businessType);

    return {
      industryBenchmarks,
      competitivePosition: this.calculateCompetitivePosition(industryBenchmarks),
      marketOpportunities: this.identifyMarketOpportunities(businessType),
      threats: this.identifyThreats(businessType),
      recommendations: this.generateCompetitiveRecommendations(businessType)
    };
  }

  // Helper methods for business metrics
  async getEmailBusinessMetrics(dateFilter) {
    const { data: emails } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!emails || emails.length === 0) {
      return { volume: 0, responseRate: 0, avgResponseTime: 0, qualityScore: 0 };
    }

    const responseRate = emails.filter(e => e.responded).length / emails.length;
    const avgResponseTime = emails.reduce((sum, e) => sum + (e.response_time || 0), 0) / emails.length;
    const qualityScore = this.calculateEmailQualityScore(emails);

    return {
      volume: emails.length,
      responseRate: Math.round(responseRate * 100),
      avgResponseTime: Math.round(avgResponseTime),
      qualityScore,
      trend: await this.calculateTrend('email_volume', dateFilter)
    };
  }

  async getAIBusinessMetrics(dateFilter) {
    const { data: aiResponses } = await supabase
      .from('ai_responses')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!aiResponses || aiResponses.length === 0) {
      return { volume: 0, successRate: 0, avgTokens: 0, cost: 0 };
    }

    const successRate = aiResponses.filter(r => r.status === 'success').length / aiResponses.length;
    const avgTokens = aiResponses.reduce((sum, r) => sum + (r.tokens_used || 0), 0) / aiResponses.length;
    const totalCost = aiResponses.reduce((sum, r) => sum + (r.cost || 0), 0);

    return {
      volume: aiResponses.length,
      successRate: Math.round(successRate * 100),
      avgTokens: Math.round(avgTokens),
      cost: Math.round(totalCost * 100) / 100,
      trend: await this.calculateTrend('ai_usage', dateFilter)
    };
  }

  async getWorkflowBusinessMetrics(dateFilter) {
    const { data: workflows } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('user_id', this.userId)
      .gte('created_at', dateFilter);

    if (!workflows || workflows.length === 0) {
      return { executions: 0, successRate: 0, avgExecutionTime: 0, reliability: 0 };
    }

    const successRate = workflows.filter(w => w.status === 'success').length / workflows.length;
    const avgExecutionTime = workflows.reduce((sum, w) => sum + (w.execution_time || 0), 0) / workflows.length;

    return {
      executions: workflows.length,
      successRate: Math.round(successRate * 100),
      avgExecutionTime: Math.round(avgExecutionTime),
      reliability: Math.round(successRate * 100),
      trend: await this.calculateTrend('workflow_executions', dateFilter)
    };
  }

  async getUserBusinessMetrics(dateFilter) {
    const { data: userActions } = await supabase
      .from('outlook_analytics_events')
      .select('*')
      .eq('user_id', this.userId)
      .eq('event_type', 'user_action')
      .gte('created_at', dateFilter);

    return {
      totalActions: userActions?.length || 0,
      engagementScore: this.calculateEngagementScore(userActions),
      featureUsage: this.analyzeFeatureUsage(userActions),
      userSatisfaction: this.calculateUserSatisfaction(userActions)
    };
  }

  // Helper methods for customer insights
  getUniqueCustomerCount(emails) {
    const uniqueEmails = new Set(emails.map(e => e.from_email));
    return uniqueEmails.size;
  }

  analyzeCustomerSegments(emails) {
    const segments = {
      highVolume: 0,
      mediumVolume: 0,
      lowVolume: 0
    };

    const emailCounts = {};
    emails.forEach(email => {
      emailCounts[email.from_email] = (emailCounts[email.from_email] || 0) + 1;
    });

    Object.values(emailCounts).forEach(count => {
      if (count >= 10) segments.highVolume++;
      else if (count >= 3) segments.mediumVolume++;
      else segments.lowVolume++;
    });

    return segments;
  }

  analyzeCommunicationPatterns(emails) {
    const patterns = {
      peakHours: this.findPeakHours(emails),
      commonCategories: this.findCommonCategories(emails),
      responsePatterns: this.analyzeResponsePatterns(emails),
      seasonalTrends: this.analyzeSeasonalTrends(emails)
    };

    return patterns;
  }

  calculateSatisfactionScore(emails) {
    // This would typically use customer feedback data
    // For now, we'll use response rate as a proxy
    const respondedEmails = emails.filter(e => e.responded).length;
    return Math.round((respondedEmails / emails.length) * 100);
  }

  calculateRetentionRate(emails) {
    // This would typically analyze customer return patterns
    // For now, we'll use a simple calculation based on repeat emails
    const emailCounts = {};
    emails.forEach(email => {
      emailCounts[email.from_email] = (emailCounts[email.from_email] || 0) + 1;
    });

    const repeatCustomers = Object.values(emailCounts).filter(count => count > 1).length;
    const totalCustomers = Object.keys(emailCounts).length;

    return totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  }

  generateCustomerInsights(emails) {
    const insights = [];
    
    const responseRate = emails.filter(e => e.responded).length / emails.length;
    if (responseRate < 0.8) {
      insights.push('Consider improving response automation to increase customer satisfaction');
    }

    const avgResponseTime = emails.reduce((sum, e) => sum + (e.response_time || 0), 0) / emails.length;
    if (avgResponseTime > 60) {
      insights.push('Response times are above industry average - consider optimization');
    }

    return insights;
  }

  // Helper methods for operational efficiency
  calculateAutomationRate(performanceInsights) {
    const totalEmails = performanceInsights.email.efficiency || 0;
    const automatedResponses = performanceInsights.ai.efficiency || 0;
    
    return totalEmails > 0 ? Math.round((automatedResponses / totalEmails) * 100) : 0;
  }

  identifyOperationalBottlenecks(performanceInsights) {
    const bottlenecks = [];
    
    if (performanceInsights.email.efficiency < 70) {
      bottlenecks.push('Email processing efficiency below target');
    }
    
    if (performanceInsights.workflow.reliability < 90) {
      bottlenecks.push('Workflow reliability needs improvement');
    }
    
    return bottlenecks;
  }

  identifyOptimizationOpportunities(performanceInsights) {
    const opportunities = [];
    
    if (performanceInsights.ai.efficiency < 85) {
      opportunities.push('AI response optimization');
    }
    
    if (performanceInsights.workflow.avgExecutionTime > 5000) {
      opportunities.push('Workflow performance optimization');
    }
    
    return opportunities;
  }

  calculateEfficiencyScore(performanceInsights) {
    const emailScore = performanceInsights.email.efficiency || 0;
    const aiScore = performanceInsights.ai.efficiency || 0;
    const workflowScore = performanceInsights.workflow.reliability || 0;
    
    return Math.round((emailScore + aiScore + workflowScore) / 3);
  }

  // Helper methods for financial analysis
  calculateCostPerEmail(totalCost, dateFilter) {
    // This would typically get email count for the period
    // For now, we'll use a mock calculation
    return Math.round(totalCost / 100); // Mock: $0.01 per email
  }

  async calculateCostTrends(timeRange) {
    // This would analyze cost trends over time
    // For now, we'll return mock data
    return {
      trend: 'stable',
      change: 0,
      forecast: 'stable'
    };
  }

  identifyCostOptimizations(aiResponses, workflows) {
    const optimizations = [];
    
    if (aiResponses) {
      const avgTokens = aiResponses.reduce((sum, r) => sum + (r.tokens_used || 0), 0) / aiResponses.length;
      if (avgTokens > 1500) {
        optimizations.push('Optimize AI prompts to reduce token usage');
      }
    }
    
    if (workflows) {
      const slowWorkflows = workflows.filter(w => (w.execution_time || 0) > 5000);
      if (slowWorkflows.length > workflows.length * 0.2) {
        optimizations.push('Optimize workflow execution times');
      }
    }
    
    return optimizations;
  }

  calculateROI(totalCost, dateFilter) {
    // This would calculate actual ROI based on business value generated
    // For now, we'll use a mock calculation
    const estimatedValue = totalCost * 5; // Mock: 5x ROI
    return {
      ratio: 5,
      value: estimatedValue,
      paybackPeriod: '2 months'
    };
  }

  generateBudgetRecommendations(totalCost, timeRange) {
    const recommendations = [];
    
    if (totalCost > 200) {
      recommendations.push('Consider implementing cost controls for AI usage');
    }
    
    if (timeRange === '30d' && totalCost > 100) {
      recommendations.push('Monthly budget review recommended');
    }
    
    return recommendations;
  }

  // Helper methods for competitive analysis
  getIndustryBenchmarks(businessType) {
    const benchmarks = {
      'Electrician': {
        avgResponseTime: 1.5,
        responseRate: 92,
        automationRate: 70,
        customerSatisfaction: 94
      },
      'Flooring Contractor': {
        avgResponseTime: 2.2,
        responseRate: 85,
        automationRate: 60,
        customerSatisfaction: 89
      },
      'General Contractor': {
        avgResponseTime: 2.8,
        responseRate: 82,
        automationRate: 55,
        customerSatisfaction: 87
      },
      'HVAC': {
        avgResponseTime: 1.8,
        responseRate: 90,
        automationRate: 70,
        customerSatisfaction: 92
      },
      'Insulation & Foam Spray': {
        avgResponseTime: 2.5,
        responseRate: 88,
        automationRate: 65,
        customerSatisfaction: 91
      },
      'Landscaping': {
        avgResponseTime: 2.0,
        responseRate: 87,
        automationRate: 68,
        customerSatisfaction: 90
      },
      'Painting Contractor': {
        avgResponseTime: 2.3,
        responseRate: 86,
        automationRate: 62,
        customerSatisfaction: 88
      },
      'Plumber': {
        avgResponseTime: 1.6,
        responseRate: 91,
        automationRate: 72,
        customerSatisfaction: 93
      },
      'Pools & Spas': {
        avgResponseTime: 2.5,
        responseRate: 85,
        automationRate: 60,
        customerSatisfaction: 88
      },
      'Roofing Contractor': {
        avgResponseTime: 2.4,
        responseRate: 84,
        automationRate: 58,
        customerSatisfaction: 86
      },
      'general': {
        avgResponseTime: 3.0,
        responseRate: 80,
        automationRate: 50,
        customerSatisfaction: 85
      }
    };

    return benchmarks[businessType] || benchmarks['general'];
  }

  calculateCompetitivePosition(benchmarks) {
    // This would compare actual performance against benchmarks
    // For now, we'll return a mock position
    return {
      position: 'above_average',
      score: 75,
      strengths: ['Response time', 'Automation rate'],
      weaknesses: ['Customer satisfaction']
    };
  }

  identifyMarketOpportunities(businessType) {
    const opportunities = {
      'Electrician': ['Emergency response automation', 'Safety compliance tracking', 'Smart home integration'],
      'Flooring Contractor': ['Project estimation tools', 'Material cost tracking', 'Customer visualization'],
      'General Contractor': ['Project management automation', 'Subcontractor coordination', 'Permit tracking'],
      'HVAC': ['Emergency response', 'Preventive maintenance', 'Energy efficiency consulting'],
      'Insulation & Foam Spray': ['Energy audit integration', 'Weather-based scheduling', 'Efficiency reporting'],
      'Landscaping': ['Seasonal scheduling', 'Weather integration', 'Property maintenance plans'],
      'Painting Contractor': ['Color consultation tools', 'Surface prep tracking', 'Project timeline management'],
      'Plumber': ['Emergency dispatch', 'Preventive maintenance', 'Water efficiency consulting'],
      'Pools & Spas': ['Seasonal automation', 'Maintenance scheduling', 'Water chemistry monitoring'],
      'Roofing Contractor': ['Weather damage assessment', 'Insurance claim coordination', 'Maintenance scheduling'],
      'general': ['Process automation', 'Customer engagement']
    };

    return opportunities[businessType] || opportunities['general'];
  }

  identifyThreats(businessType) {
    const threats = {
      'Electrician': ['Safety regulations', 'Emergency response times', 'Code compliance changes'],
      'Flooring Contractor': ['Material cost fluctuations', 'Seasonal demand', 'Competition from big box stores'],
      'General Contractor': ['Permit delays', 'Subcontractor availability', 'Material shortages'],
      'HVAC': ['Seasonal peaks', 'Equipment failures', 'Energy efficiency regulations'],
      'Insulation & Foam Spray': ['Weather dependency', 'Material cost volatility', 'Installation complexity'],
      'Landscaping': ['Weather dependency', 'Seasonal fluctuations', 'Labor shortages'],
      'Painting Contractor': ['Weather delays', 'Surface preparation challenges', 'Material cost increases'],
      'Plumber': ['Emergency response pressure', 'Water damage urgency', 'Regulatory compliance'],
      'Pools & Spas': ['Seasonal demand fluctuations', 'Weather dependency', 'Maintenance complexity'],
      'Roofing Contractor': ['Weather dependency', 'Insurance claim complexity', 'Safety regulations'],
      'general': ['Market competition', 'Technology changes']
    };

    return threats[businessType] || threats['general'];
  }

  generateCompetitiveRecommendations(businessType) {
    const recommendations = {
      'Electrician': ['Enhance emergency response automation', 'Implement safety compliance tracking', 'Develop smart home integration services'],
      'Flooring Contractor': ['Improve project estimation accuracy', 'Implement material cost tracking', 'Add customer visualization tools'],
      'General Contractor': ['Streamline project management', 'Optimize subcontractor coordination', 'Automate permit tracking'],
      'HVAC': ['Optimize emergency response', 'Improve preventive maintenance', 'Add energy efficiency consulting'],
      'Insulation & Foam Spray': ['Integrate energy audit services', 'Implement weather-based scheduling', 'Develop efficiency reporting'],
      'Landscaping': ['Automate seasonal scheduling', 'Integrate weather data', 'Create property maintenance plans'],
      'Painting Contractor': ['Develop color consultation tools', 'Improve surface prep tracking', 'Optimize project timelines'],
      'Plumber': ['Enhance emergency dispatch', 'Improve preventive maintenance', 'Add water efficiency consulting'],
      'Pools & Spas': ['Implement seasonal automation', 'Focus on customer retention', 'Add water chemistry monitoring'],
      'Roofing Contractor': ['Improve weather damage assessment', 'Streamline insurance claims', 'Optimize maintenance scheduling'],
      'general': ['Increase automation', 'Improve customer engagement']
    };

    return recommendations[businessType] || recommendations['general'];
  }

  // Utility methods
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

  calculateOverallBusinessScore(emailMetrics, aiMetrics, workflowMetrics, userMetrics) {
    const scores = [
      emailMetrics.responseRate,
      aiMetrics.successRate,
      workflowMetrics.reliability,
      userMetrics.engagementScore
    ].filter(score => score !== undefined);

    return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  }

  calculateEmailQualityScore(emails) {
    const responded = emails.filter(e => e.responded).length;
    const avgResponseTime = emails.reduce((sum, e) => sum + (e.response_time || 0), 0) / emails.length;
    
    const responseScore = (responded / emails.length) * 100;
    const timeScore = Math.max(0, 100 - (avgResponseTime / 60)); // Penalize slow responses
    
    return Math.round((responseScore + timeScore) / 2);
  }

  calculateEngagementScore(userActions) {
    if (!userActions || userActions.length === 0) return 0;
    
    const uniqueActions = new Set(userActions.map(a => a.data?.action)).size;
    const totalActions = userActions.length;
    
    return Math.round((uniqueActions / Math.max(totalActions, 1)) * 100);
  }

  analyzeFeatureUsage(userActions) {
    if (!userActions) return {};
    
    const featureUsage = {};
    userActions.forEach(action => {
      const feature = action.data?.action || 'unknown';
      featureUsage[feature] = (featureUsage[feature] || 0) + 1;
    });
    
    return featureUsage;
  }

  calculateUserSatisfaction(userActions) {
    // This would typically use user feedback data
    // For now, we'll use engagement as a proxy
    return this.calculateEngagementScore(userActions);
  }

  async calculateTrend(metric, dateFilter) {
    // This would calculate actual trends from historical data
    // For now, we'll return mock data
    return {
      direction: 'up',
      change: 5,
      confidence: 80
    };
  }

  findPeakHours(emails) {
    const hourCounts = {};
    emails.forEach(email => {
      const hour = new Date(email.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b
    );
    
    return parseInt(peakHour);
  }

  findCommonCategories(emails) {
    const categoryCounts = {};
    emails.forEach(email => {
      const category = email.category || 'uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  analyzeResponsePatterns(emails) {
    const patterns = {
      avgResponseTime: emails.reduce((sum, e) => sum + (e.response_time || 0), 0) / emails.length,
      responseRate: emails.filter(e => e.responded).length / emails.length,
      peakResponseHours: this.findPeakHours(emails.filter(e => e.responded))
    };
    
    return patterns;
  }

  analyzeSeasonalTrends(emails) {
    // This would analyze seasonal patterns in email volume
    // For now, we'll return mock data
    return {
      trend: 'stable',
      seasonalFactors: ['weather', 'holidays'],
      recommendations: ['Plan for seasonal variations']
    };
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

export default BusinessIntelligence;
