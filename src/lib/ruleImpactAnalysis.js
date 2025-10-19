/**
 * Rule Impact Analysis
 * Comprehensive analysis of rule changes and their business impact
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { rulePerformanceAnalytics } from './rulePerformanceAnalytics.js';

export class RuleImpactAnalysis {
  constructor() {
    this.impactCache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.impactThresholds = {
      high: 0.8,    // 80% impact threshold
      medium: 0.5,  // 50% impact threshold
      low: 0.2      // 20% impact threshold
    };
  }

  /**
   * Analyze impact of rule changes
   * @param {string} ruleId - Rule identifier
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @param {Object} context - Analysis context
   * @returns {Promise<Object>} Impact analysis results
   */
  async analyzeRuleChangeImpact(ruleId, oldRule, newRule, context = {}) {
    try {
      const analysisId = `impact_${ruleId}_${Date.now()}`;
      
      logger.info('Starting rule impact analysis', { ruleId, analysisId });

      // Get historical data for baseline
      const historicalData = await this.getHistoricalRuleData(ruleId, '30d');
      
      // Analyze different impact dimensions
      const [
        performanceImpact,
        businessImpact,
        operationalImpact,
        riskImpact
      ] = await Promise.all([
        this.analyzePerformanceImpact(ruleId, oldRule, newRule, historicalData),
        this.analyzeBusinessImpact(ruleId, oldRule, newRule, historicalData),
        this.analyzeOperationalImpact(ruleId, oldRule, newRule, historicalData),
        this.analyzeRiskImpact(ruleId, oldRule, newRule, historicalData)
      ]);

      // Calculate overall impact score
      const overallImpact = this.calculateOverallImpact({
        performanceImpact,
        businessImpact,
        operationalImpact,
        riskImpact
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        performanceImpact,
        businessImpact,
        operationalImpact,
        riskImpact,
        overallImpact
      });

      const analysisResult = {
        analysisId,
        ruleId,
        timestamp: new Date().toISOString(),
        oldRule,
        newRule,
        impact: {
          overall: overallImpact,
          performance: performanceImpact,
          business: businessImpact,
          operational: operationalImpact,
          risk: riskImpact
        },
        recommendations,
        confidence: this.calculateConfidence(historicalData),
        metadata: {
          userId: context.userId,
          changeType: this.detectChangeType(oldRule, newRule),
          affectedSystems: this.identifyAffectedSystems(oldRule, newRule)
        }
      };

      // Store analysis result
      await this.storeAnalysisResult(analysisResult);

      logger.info('Rule impact analysis completed', { 
        ruleId, 
        analysisId, 
        overallImpact: overallImpact.score,
        confidence: analysisResult.confidence
      });

      return analysisResult;
    } catch (error) {
      logger.error('Error analyzing rule change impact', { error: error.message, ruleId });
      return this.getDefaultImpactAnalysis(ruleId, oldRule, newRule);
    }
  }

  /**
   * Analyze performance impact
   * @param {string} ruleId - Rule identifier
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @param {Object} historicalData - Historical performance data
   * @returns {Promise<Object>} Performance impact analysis
   */
  async analyzePerformanceImpact(ruleId, oldRule, newRule, historicalData) {
    try {
      const currentMetrics = await rulePerformanceAnalytics.getRuleMetrics(ruleId, '7d');
      
      // Predict performance based on rule changes
      const predictedPerformance = this.predictPerformanceChange(oldRule, newRule, currentMetrics);
      
      // Analyze execution time impact
      const executionTimeImpact = this.analyzeExecutionTimeImpact(oldRule, newRule, historicalData);
      
      // Analyze resource usage impact
      const resourceImpact = this.analyzeResourceImpact(oldRule, newRule);
      
      // Analyze scalability impact
      const scalabilityImpact = this.analyzeScalabilityImpact(oldRule, newRule, historicalData);

      return {
        score: this.calculatePerformanceScore(predictedPerformance, executionTimeImpact, resourceImpact, scalabilityImpact),
        executionTime: executionTimeImpact,
        resourceUsage: resourceImpact,
        scalability: scalabilityImpact,
        predictedPerformance,
        confidence: this.calculatePerformanceConfidence(historicalData),
        recommendations: this.generatePerformanceRecommendations(predictedPerformance, executionTimeImpact)
      };
    } catch (error) {
      logger.error('Error analyzing performance impact', { error: error.message, ruleId });
      return this.getDefaultPerformanceImpact();
    }
  }

  /**
   * Analyze business impact
   * @param {string} ruleId - Rule identifier
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @param {Object} historicalData - Historical business data
   * @returns {Promise<Object>} Business impact analysis
   */
  async analyzeBusinessImpact(ruleId, oldRule, newRule, historicalData) {
    try {
      // Analyze customer experience impact
      const customerExperienceImpact = this.analyzeCustomerExperienceImpact(oldRule, newRule, historicalData);
      
      // Analyze revenue impact
      const revenueImpact = this.analyzeRevenueImpact(oldRule, newRule, historicalData);
      
      // Analyze compliance impact
      const complianceImpact = this.analyzeComplianceImpact(oldRule, newRule);
      
      // Analyze competitive advantage impact
      const competitiveImpact = this.analyzeCompetitiveImpact(oldRule, newRule, historicalData);

      return {
        score: this.calculateBusinessScore(customerExperienceImpact, revenueImpact, complianceImpact, competitiveImpact),
        customerExperience: customerExperienceImpact,
        revenue: revenueImpact,
        compliance: complianceImpact,
        competitiveAdvantage: competitiveImpact,
        confidence: this.calculateBusinessConfidence(historicalData),
        recommendations: this.generateBusinessRecommendations(customerExperienceImpact, revenueImpact)
      };
    } catch (error) {
      logger.error('Error analyzing business impact', { error: error.message, ruleId });
      return this.getDefaultBusinessImpact();
    }
  }

  /**
   * Analyze operational impact
   * @param {string} ruleId - Rule identifier
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @param {Object} historicalData - Historical operational data
   * @returns {Promise<Object>} Operational impact analysis
   */
  async analyzeOperationalImpact(ruleId, oldRule, newRule, historicalData) {
    try {
      // Analyze maintenance impact
      const maintenanceImpact = this.analyzeMaintenanceImpact(oldRule, newRule);
      
      // Analyze support impact
      const supportImpact = this.analyzeSupportImpact(oldRule, newRule, historicalData);
      
      // Analyze training impact
      const trainingImpact = this.analyzeTrainingImpact(oldRule, newRule);
      
      // Analyze integration impact
      const integrationImpact = this.analyzeIntegrationImpact(oldRule, newRule);

      return {
        score: this.calculateOperationalScore(maintenanceImpact, supportImpact, trainingImpact, integrationImpact),
        maintenance: maintenanceImpact,
        support: supportImpact,
        training: trainingImpact,
        integration: integrationImpact,
        confidence: this.calculateOperationalConfidence(historicalData),
        recommendations: this.generateOperationalRecommendations(maintenanceImpact, supportImpact)
      };
    } catch (error) {
      logger.error('Error analyzing operational impact', { error: error.message, ruleId });
      return this.getDefaultOperationalImpact();
    }
  }

  /**
   * Analyze risk impact
   * @param {string} ruleId - Rule identifier
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @param {Object} historicalData - Historical risk data
   * @returns {Promise<Object>} Risk impact analysis
   */
  async analyzeRiskImpact(ruleId, oldRule, newRule, historicalData) {
    try {
      // Analyze security risk
      const securityRisk = this.analyzeSecurityRisk(oldRule, newRule);
      
      // Analyze data privacy risk
      const privacyRisk = this.analyzePrivacyRisk(oldRule, newRule);
      
      // Analyze system stability risk
      const stabilityRisk = this.analyzeStabilityRisk(oldRule, newRule, historicalData);
      
      // Analyze compliance risk
      const complianceRisk = this.analyzeComplianceRisk(oldRule, newRule);

      return {
        score: this.calculateRiskScore(securityRisk, privacyRisk, stabilityRisk, complianceRisk),
        security: securityRisk,
        privacy: privacyRisk,
        stability: stabilityRisk,
        compliance: complianceRisk,
        confidence: this.calculateRiskConfidence(historicalData),
        recommendations: this.generateRiskRecommendations(securityRisk, privacyRisk, stabilityRisk)
      };
    } catch (error) {
      logger.error('Error analyzing risk impact', { error: error.message, ruleId });
      return this.getDefaultRiskImpact();
    }
  }

  /**
   * Get historical rule data
   * @param {string} ruleId - Rule identifier
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Historical data
   */
  async getHistoricalRuleData(ruleId, timeRange = '30d') {
    try {
      const cacheKey = `historical_${ruleId}_${timeRange}`;
      
      // Check cache first
      if (this.impactCache.has(cacheKey)) {
        const cached = this.impactCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data, error } = await supabase
        .from('rule_performance_metrics')
        .select('*')
        .eq('rule_id', ruleId)
        .gte('timestamp', timeFilter.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const historicalData = {
        performance: data || [],
        emailLogs: await this.getEmailLogs(ruleId, timeFilter),
        businessMetrics: await this.getBusinessMetrics(ruleId, timeFilter),
        operationalMetrics: await this.getOperationalMetrics(ruleId, timeFilter)
      };

      // Cache the result
      this.impactCache.set(cacheKey, {
        data: historicalData,
        timestamp: Date.now()
      });

      return historicalData;
    } catch (error) {
      logger.error('Error getting historical rule data', { error: error.message, ruleId });
      return this.getDefaultHistoricalData();
    }
  }

  /**
   * Predict performance change
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @param {Object} currentMetrics - Current performance metrics
   * @returns {Object} Predicted performance
   */
  predictPerformanceChange(oldRule, newRule, currentMetrics) {
    const complexityChange = this.calculateComplexityChange(oldRule, newRule);
    const conditionChange = this.calculateConditionChange(oldRule, newRule);
    const actionChange = this.calculateActionChange(oldRule, newRule);

    const baseExecutionTime = currentMetrics.averageExecutionTime || 100;
    
    // Predict execution time based on complexity changes
    let predictedExecutionTime = baseExecutionTime;
    
    if (complexityChange > 0) {
      predictedExecutionTime *= (1 + complexityChange * 0.2); // 20% increase per complexity unit
    } else if (complexityChange < 0) {
      predictedExecutionTime *= (1 + complexityChange * 0.1); // 10% decrease per complexity unit
    }

    // Adjust based on condition changes
    if (conditionChange > 0) {
      predictedExecutionTime *= (1 + conditionChange * 0.15);
    }

    // Adjust based on action changes
    if (actionChange > 0) {
      predictedExecutionTime *= (1 + actionChange * 0.1);
    }

    return {
      predictedExecutionTime: Math.round(predictedExecutionTime),
      complexityChange,
      conditionChange,
      actionChange,
      confidence: this.calculatePredictionConfidence(currentMetrics)
    };
  }

  /**
   * Calculate complexity change
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @returns {number} Complexity change score
   */
  calculateComplexityChange(oldRule, newRule) {
    const oldComplexity = this.calculateRuleComplexity(oldRule);
    const newComplexity = this.calculateRuleComplexity(newRule);
    return newComplexity - oldComplexity;
  }

  /**
   * Calculate rule complexity
   * @param {Object} rule - Rule configuration
   * @returns {number} Complexity score
   */
  calculateRuleComplexity(rule) {
    let complexity = 0;
    
    // Base complexity
    complexity += 1;
    
    // Condition complexity
    if (rule.condition_type === 'complex') {
      complexity += 2;
    } else if (rule.condition_type === 'simple') {
      complexity += 1;
    }
    
    // Multiple conditions
    if (rule.conditions && rule.conditions.length > 1) {
      complexity += rule.conditions.length - 1;
    }
    
    // Action complexity
    if (rule.escalation_action === 'escalate') {
      complexity += 1;
    } else if (rule.escalation_action === 'auto_reply') {
      complexity += 2;
    }
    
    // Priority complexity
    if (rule.priority > 7) {
      complexity += 1;
    }
    
    return complexity;
  }

  /**
   * Calculate condition change
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @returns {number} Condition change score
   */
  calculateConditionChange(oldRule, newRule) {
    const oldConditions = this.extractConditions(oldRule);
    const newConditions = this.extractConditions(newRule);
    
    const addedConditions = newConditions.filter(c => !oldConditions.includes(c));
    const removedConditions = oldConditions.filter(c => !newConditions.includes(c));
    
    return addedConditions.length - removedConditions.length;
  }

  /**
   * Calculate action change
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @returns {number} Action change score
   */
  calculateActionChange(oldRule, newRule) {
    const oldActions = this.extractActions(oldRule);
    const newActions = this.extractActions(newRule);
    
    const addedActions = newActions.filter(a => !oldActions.includes(a));
    const removedActions = oldActions.filter(a => !newActions.includes(a));
    
    return addedActions.length - removedActions.length;
  }

  /**
   * Extract conditions from rule
   * @param {Object} rule - Rule configuration
   * @returns {Array} List of conditions
   */
  extractConditions(rule) {
    const conditions = [];
    
    if (rule.condition) {
      conditions.push(rule.condition);
    }
    
    if (rule.condition_value) {
      conditions.push(rule.condition_value);
    }
    
    if (rule.conditions) {
      conditions.push(...rule.conditions);
    }
    
    return conditions;
  }

  /**
   * Extract actions from rule
   * @param {Object} rule - Rule configuration
   * @returns {Array} List of actions
   */
  extractActions(rule) {
    const actions = [];
    
    if (rule.escalation_action) {
      actions.push(rule.escalation_action);
    }
    
    if (rule.escalation_target) {
      actions.push(rule.escalation_target);
    }
    
    if (rule.actions) {
      actions.push(...rule.actions);
    }
    
    return actions;
  }

  /**
   * Calculate overall impact score
   * @param {Object} impacts - All impact analyses
   * @returns {Object} Overall impact score
   */
  calculateOverallImpact(impacts) {
    const weights = {
      performance: 0.3,
      business: 0.4,
      operational: 0.2,
      risk: 0.1
    };

    const weightedScore = 
      (impacts.performanceImpact.score * weights.performance) +
      (impacts.businessImpact.score * weights.business) +
      (impacts.operationalImpact.score * weights.operational) +
      (impacts.riskImpact.score * weights.risk);

    const level = this.getImpactLevel(weightedScore);
    
    return {
      score: Math.round(weightedScore * 100) / 100,
      level,
      breakdown: {
        performance: impacts.performanceImpact.score,
        business: impacts.businessImpact.score,
        operational: impacts.operationalImpact.score,
        risk: impacts.riskImpact.score
      }
    };
  }

  /**
   * Get impact level
   * @param {number} score - Impact score
   * @returns {string} Impact level
   */
  getImpactLevel(score) {
    if (score >= this.impactThresholds.high) {
      return 'high';
    } else if (score >= this.impactThresholds.medium) {
      return 'medium';
    } else if (score >= this.impactThresholds.low) {
      return 'low';
    } else {
      return 'minimal';
    }
  }

  /**
   * Generate recommendations
   * @param {Object} impacts - All impact analyses
   * @returns {Array} Recommendations
   */
  generateRecommendations(impacts) {
    const recommendations = [];

    // Performance recommendations
    if (impacts.performanceImpact.score > 0.7) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: 'Performance Optimization Required',
        description: 'Rule changes may significantly impact performance. Consider optimization strategies.',
        actions: [
          'Review rule complexity',
          'Consider caching strategies',
          'Monitor execution times closely'
        ]
      });
    }

    // Business recommendations
    if (impacts.businessImpact.score > 0.6) {
      recommendations.push({
        category: 'business',
        priority: 'high',
        title: 'Business Impact Assessment Needed',
        description: 'Rule changes may have significant business impact. Stakeholder review recommended.',
        actions: [
          'Notify business stakeholders',
          'Conduct impact assessment',
          'Plan rollback strategy'
        ]
      });
    }

    // Risk recommendations
    if (impacts.riskImpact.score > 0.5) {
      recommendations.push({
        category: 'risk',
        priority: 'medium',
        title: 'Risk Mitigation Required',
        description: 'Rule changes introduce potential risks. Mitigation strategies recommended.',
        actions: [
          'Review security implications',
          'Test in staging environment',
          'Implement monitoring'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Detect change type
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @returns {string} Change type
   */
  detectChangeType(oldRule, newRule) {
    const changes = this.calculateChanges(oldRule, newRule);
    
    if (changes.added.length > 0 && changes.removed.length === 0) {
      return 'addition';
    } else if (changes.added.length === 0 && changes.removed.length > 0) {
      return 'removal';
    } else if (changes.modified.length > 0) {
      return 'modification';
    } else {
      return 'no_change';
    }
  }

  /**
   * Calculate changes between rules
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @returns {Object} Changes summary
   */
  calculateChanges(oldRule, newRule) {
    const changes = {
      added: [],
      removed: [],
      modified: []
    };

    const oldKeys = Object.keys(oldRule);
    const newKeys = Object.keys(newRule);

    // Find added fields
    changes.added = newKeys.filter(key => !oldKeys.includes(key));
    
    // Find removed fields
    changes.removed = oldKeys.filter(key => !newKeys.includes(key));
    
    // Find modified fields
    changes.modified = oldKeys.filter(key => 
      newKeys.includes(key) && oldRule[key] !== newRule[key]
    );

    return changes;
  }

  /**
   * Identify affected systems
   * @param {Object} oldRule - Old rule configuration
   * @param {Object} newRule - New rule configuration
   * @returns {Array} Affected systems
   */
  identifyAffectedSystems(oldRule, newRule) {
    const systems = [];
    
    if (oldRule.escalation_action !== newRule.escalation_action) {
      systems.push('escalation_system');
    }
    
    if (oldRule.escalation_target !== newRule.escalation_target) {
      systems.push('notification_system');
    }
    
    if (oldRule.condition !== newRule.condition) {
      systems.push('rule_engine');
    }
    
    return systems;
  }

  /**
   * Store analysis result
   * @param {Object} analysisResult - Analysis result
   */
  async storeAnalysisResult(analysisResult) {
    try {
      const { error } = await supabase
        .from('rule_impact_analysis')
        .insert({
          analysis_id: analysisResult.analysisId,
          rule_id: analysisResult.ruleId,
          analysis_data: analysisResult,
          created_at: analysisResult.timestamp
        });

      if (error) {
        logger.error('Failed to store impact analysis result', { error: error.message });
      }
    } catch (error) {
      logger.error('Error storing impact analysis result', { error: error.message });
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

    return filters[timeRange] || filters['30d'];
  }

  /**
   * Clear impact cache
   */
  clearCache() {
    this.impactCache.clear();
    logger.info('Impact analysis cache cleared');
  }

  // Placeholder methods for specific impact analyses
  analyzeExecutionTimeImpact(oldRule, newRule, historicalData) {
    return { score: 0.3, change: 'minimal', confidence: 0.8 };
  }

  analyzeResourceImpact(oldRule, newRule) {
    return { score: 0.2, change: 'minimal', confidence: 0.7 };
  }

  analyzeScalabilityImpact(oldRule, newRule, historicalData) {
    return { score: 0.1, change: 'minimal', confidence: 0.6 };
  }

  analyzeCustomerExperienceImpact(oldRule, newRule, historicalData) {
    return { score: 0.4, change: 'moderate', confidence: 0.8 };
  }

  analyzeRevenueImpact(oldRule, newRule, historicalData) {
    return { score: 0.2, change: 'minimal', confidence: 0.6 };
  }

  analyzeComplianceImpact(oldRule, newRule) {
    return { score: 0.1, change: 'minimal', confidence: 0.9 };
  }

  analyzeCompetitiveImpact(oldRule, newRule, historicalData) {
    return { score: 0.3, change: 'moderate', confidence: 0.7 };
  }

  analyzeMaintenanceImpact(oldRule, newRule) {
    return { score: 0.2, change: 'minimal', confidence: 0.8 };
  }

  analyzeSupportImpact(oldRule, newRule, historicalData) {
    return { score: 0.3, change: 'moderate', confidence: 0.7 };
  }

  analyzeTrainingImpact(oldRule, newRule) {
    return { score: 0.1, change: 'minimal', confidence: 0.6 };
  }

  analyzeIntegrationImpact(oldRule, newRule) {
    return { score: 0.2, change: 'minimal', confidence: 0.8 };
  }

  analyzeSecurityRisk(oldRule, newRule) {
    return { score: 0.1, level: 'low', confidence: 0.9 };
  }

  analyzePrivacyRisk(oldRule, newRule) {
    return { score: 0.1, level: 'low', confidence: 0.9 };
  }

  analyzeStabilityRisk(oldRule, newRule, historicalData) {
    return { score: 0.2, level: 'low', confidence: 0.8 };
  }

  analyzeComplianceRisk(oldRule, newRule) {
    return { score: 0.1, level: 'low', confidence: 0.9 };
  }

  // Helper methods for calculations
  calculatePerformanceScore(predictedPerformance, executionTimeImpact, resourceImpact, scalabilityImpact) {
    return Math.min(1, (predictedPerformance.predictedExecutionTime / 1000) * 0.5 + 
                      executionTimeImpact.score * 0.3 + 
                      resourceImpact.score * 0.1 + 
                      scalabilityImpact.score * 0.1);
  }

  calculateBusinessScore(customerExperienceImpact, revenueImpact, complianceImpact, competitiveImpact) {
    return customerExperienceImpact.score * 0.4 + 
           revenueImpact.score * 0.3 + 
           complianceImpact.score * 0.2 + 
           competitiveImpact.score * 0.1;
  }

  calculateOperationalScore(maintenanceImpact, supportImpact, trainingImpact, integrationImpact) {
    return maintenanceImpact.score * 0.3 + 
           supportImpact.score * 0.3 + 
           trainingImpact.score * 0.2 + 
           integrationImpact.score * 0.2;
  }

  calculateRiskScore(securityRisk, privacyRisk, stabilityRisk, complianceRisk) {
    return securityRisk.score * 0.3 + 
           privacyRisk.score * 0.3 + 
           stabilityRisk.score * 0.2 + 
           complianceRisk.score * 0.2;
  }

  calculateConfidence(historicalData) {
    const dataPoints = historicalData.performance.length;
    if (dataPoints > 100) return 0.9;
    if (dataPoints > 50) return 0.8;
    if (dataPoints > 20) return 0.7;
    if (dataPoints > 10) return 0.6;
    return 0.5;
  }

  calculatePerformanceConfidence(historicalData) {
    return this.calculateConfidence(historicalData);
  }

  calculateBusinessConfidence(historicalData) {
    return this.calculateConfidence(historicalData);
  }

  calculateOperationalConfidence(historicalData) {
    return this.calculateConfidence(historicalData);
  }

  calculateRiskConfidence(historicalData) {
    return this.calculateConfidence(historicalData);
  }

  calculatePredictionConfidence(currentMetrics) {
    const executions = currentMetrics.totalExecutions || 0;
    if (executions > 100) return 0.9;
    if (executions > 50) return 0.8;
    if (executions > 20) return 0.7;
    return 0.6;
  }

  generatePerformanceRecommendations(predictedPerformance, executionTimeImpact) {
    const recommendations = [];
    
    if (predictedPerformance.predictedExecutionTime > 1000) {
      recommendations.push('Consider optimizing rule conditions for better performance');
    }
    
    if (executionTimeImpact.score > 0.5) {
      recommendations.push('Monitor execution times closely after deployment');
    }
    
    return recommendations;
  }

  generateBusinessRecommendations(customerExperienceImpact, revenueImpact) {
    const recommendations = [];
    
    if (customerExperienceImpact.score > 0.5) {
      recommendations.push('Notify customer service team of potential impact');
    }
    
    if (revenueImpact.score > 0.3) {
      recommendations.push('Review revenue implications with business stakeholders');
    }
    
    return recommendations;
  }

  generateOperationalRecommendations(maintenanceImpact, supportImpact) {
    const recommendations = [];
    
    if (maintenanceImpact.score > 0.4) {
      recommendations.push('Update maintenance procedures and documentation');
    }
    
    if (supportImpact.score > 0.3) {
      recommendations.push('Train support team on new rule behavior');
    }
    
    return recommendations;
  }

  generateRiskRecommendations(securityRisk, privacyRisk, stabilityRisk) {
    const recommendations = [];
    
    if (securityRisk.score > 0.3) {
      recommendations.push('Conduct security review before deployment');
    }
    
    if (privacyRisk.score > 0.2) {
      recommendations.push('Review privacy implications');
    }
    
    if (stabilityRisk.score > 0.4) {
      recommendations.push('Test thoroughly in staging environment');
    }
    
    return recommendations;
  }

  // Data retrieval methods
  async getEmailLogs(ruleId, timeFilter) {
    try {
      const { data } = await supabase
        .from('email_logs')
        .select('*')
        .eq('rule_id', ruleId)
        .gte('created_at', timeFilter.toISOString());
      
      return data || [];
    } catch (error) {
      logger.error('Error getting email logs', { error: error.message });
      return [];
    }
  }

  async getBusinessMetrics(ruleId, timeFilter) {
    try {
      const { data } = await supabase
        .from('business_metrics')
        .select('*')
        .eq('rule_id', ruleId)
        .gte('created_at', timeFilter.toISOString());
      
      return data || [];
    } catch (error) {
      logger.error('Error getting business metrics', { error: error.message });
      return [];
    }
  }

  async getOperationalMetrics(ruleId, timeFilter) {
    try {
      const { data } = await supabase
        .from('operational_metrics')
        .select('*')
        .eq('rule_id', ruleId)
        .gte('created_at', timeFilter.toISOString());
      
      return data || [];
    } catch (error) {
      logger.error('Error getting operational metrics', { error: error.message });
      return [];
    }
  }

  // Default methods
  getDefaultImpactAnalysis(ruleId, oldRule, newRule) {
    return {
      analysisId: `default_${ruleId}_${Date.now()}`,
      ruleId,
      timestamp: new Date().toISOString(),
      oldRule,
      newRule,
      impact: {
        overall: { score: 0.3, level: 'low' },
        performance: this.getDefaultPerformanceImpact(),
        business: this.getDefaultBusinessImpact(),
        operational: this.getDefaultOperationalImpact(),
        risk: this.getDefaultRiskImpact()
      },
      recommendations: [],
      confidence: 0.5,
      metadata: {
        changeType: 'unknown',
        affectedSystems: []
      }
    };
  }

  getDefaultPerformanceImpact() {
    return {
      score: 0.3,
      executionTime: { score: 0.2, change: 'minimal', confidence: 0.7 },
      resourceUsage: { score: 0.1, change: 'minimal', confidence: 0.6 },
      scalability: { score: 0.1, change: 'minimal', confidence: 0.6 },
      predictedPerformance: { predictedExecutionTime: 100, confidence: 0.7 },
      confidence: 0.7,
      recommendations: []
    };
  }

  getDefaultBusinessImpact() {
    return {
      score: 0.2,
      customerExperience: { score: 0.2, change: 'minimal', confidence: 0.7 },
      revenue: { score: 0.1, change: 'minimal', confidence: 0.6 },
      compliance: { score: 0.1, change: 'minimal', confidence: 0.8 },
      competitiveAdvantage: { score: 0.1, change: 'minimal', confidence: 0.6 },
      confidence: 0.7,
      recommendations: []
    };
  }

  getDefaultOperationalImpact() {
    return {
      score: 0.2,
      maintenance: { score: 0.1, change: 'minimal', confidence: 0.7 },
      support: { score: 0.2, change: 'minimal', confidence: 0.6 },
      training: { score: 0.1, change: 'minimal', confidence: 0.6 },
      integration: { score: 0.1, change: 'minimal', confidence: 0.7 },
      confidence: 0.7,
      recommendations: []
    };
  }

  getDefaultRiskImpact() {
    return {
      score: 0.1,
      security: { score: 0.1, level: 'low', confidence: 0.8 },
      privacy: { score: 0.1, level: 'low', confidence: 0.8 },
      stability: { score: 0.1, level: 'low', confidence: 0.7 },
      compliance: { score: 0.1, level: 'low', confidence: 0.8 },
      confidence: 0.8,
      recommendations: []
    };
  }

  getDefaultHistoricalData() {
    return {
      performance: [],
      emailLogs: [],
      businessMetrics: [],
      operationalMetrics: []
    };
  }

  /**
   * Validate calculation correctness
   * @param {Object} impacts - All impact analyses
   * @returns {Object} Validation result
   */
  validateCalculations(impacts) {
    try {
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        metrics: {}
      };

      // Validate overall impact calculation
      const calculatedOverall = this.calculateOverallImpact(impacts);
      const expectedOverall = this.calculateExpectedOverallImpact(impacts);
      
      if (Math.abs(calculatedOverall.score - expectedOverall.score) > 0.01) {
        validation.isValid = false;
        validation.errors.push(`Overall impact calculation mismatch: expected ${expectedOverall.score}, got ${calculatedOverall.score}`);
      }

      // Validate performance score calculation
      const calculatedPerformance = this.calculatePerformanceScore(
        impacts.performanceImpact.predictedPerformance,
        impacts.performanceImpact.executionTime,
        impacts.performanceImpact.resourceUsage,
        impacts.performanceImpact.scalability
      );
      
      if (Math.abs(calculatedPerformance - impacts.performanceImpact.score) > 0.01) {
        validation.isValid = false;
        validation.errors.push(`Performance score calculation mismatch: expected ${impacts.performanceImpact.score}, got ${calculatedPerformance}`);
      }

      // Validate business score calculation
      const calculatedBusiness = this.calculateBusinessScore(
        impacts.businessImpact.customerExperience,
        impacts.businessImpact.revenue,
        impacts.businessImpact.compliance,
        impacts.businessImpact.competitiveAdvantage
      );
      
      if (Math.abs(calculatedBusiness - impacts.businessImpact.score) > 0.01) {
        validation.isValid = false;
        validation.errors.push(`Business score calculation mismatch: expected ${impacts.businessImpact.score}, got ${calculatedBusiness}`);
      }

      // Validate operational score calculation
      const calculatedOperational = this.calculateOperationalScore(
        impacts.operationalImpact.maintenance,
        impacts.operationalImpact.support,
        impacts.operationalImpact.training,
        impacts.operationalImpact.integration
      );
      
      if (Math.abs(calculatedOperational - impacts.operationalImpact.score) > 0.01) {
        validation.isValid = false;
        validation.errors.push(`Operational score calculation mismatch: expected ${impacts.operationalImpact.score}, got ${calculatedOperational}`);
      }

      // Validate risk score calculation
      const calculatedRisk = this.calculateRiskScore(
        impacts.riskImpact.security,
        impacts.riskImpact.privacy,
        impacts.riskImpact.stability,
        impacts.riskImpact.compliance
      );
      
      if (Math.abs(calculatedRisk - impacts.riskImpact.score) > 0.01) {
        validation.isValid = false;
        validation.errors.push(`Risk score calculation mismatch: expected ${impacts.riskImpact.score}, got ${calculatedRisk}`);
      }

      // Validate score ranges
      if (calculatedOverall.score < 0 || calculatedOverall.score > 1) {
        validation.isValid = false;
        validation.errors.push(`Overall impact score out of range: ${calculatedOverall.score}`);
      }

      if (calculatedPerformance < 0 || calculatedPerformance > 1) {
        validation.isValid = false;
        validation.errors.push(`Performance score out of range: ${calculatedPerformance}`);
      }

      if (calculatedBusiness < 0 || calculatedBusiness > 1) {
        validation.isValid = false;
        validation.errors.push(`Business score out of range: ${calculatedBusiness}`);
      }

      if (calculatedOperational < 0 || calculatedOperational > 1) {
        validation.isValid = false;
        validation.errors.push(`Operational score out of range: ${calculatedOperational}`);
      }

      if (calculatedRisk < 0 || calculatedRisk > 1) {
        validation.isValid = false;
        validation.errors.push(`Risk score out of range: ${calculatedRisk}`);
      }

      // Validate confidence scores
      if (impacts.performanceImpact.confidence < 0 || impacts.performanceImpact.confidence > 1) {
        validation.warnings.push(`Performance confidence out of range: ${impacts.performanceImpact.confidence}`);
      }

      if (impacts.businessImpact.confidence < 0 || impacts.businessImpact.confidence > 1) {
        validation.warnings.push(`Business confidence out of range: ${impacts.businessImpact.confidence}`);
      }

      if (impacts.operationalImpact.confidence < 0 || impacts.operationalImpact.confidence > 1) {
        validation.warnings.push(`Operational confidence out of range: ${impacts.operationalImpact.confidence}`);
      }

      if (impacts.riskImpact.confidence < 0 || impacts.riskImpact.confidence > 1) {
        validation.warnings.push(`Risk confidence out of range: ${impacts.riskImpact.confidence}`);
      }

      validation.metrics = {
        overallScore: calculatedOverall.score,
        performanceScore: calculatedPerformance,
        businessScore: calculatedBusiness,
        operationalScore: calculatedOperational,
        riskScore: calculatedRisk,
        overallLevel: calculatedOverall.level
      };

      return validation;
    } catch (error) {
      logger.error('Error validating calculations', { error: error.message });
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        metrics: {}
      };
    }
  }

  /**
   * Calculate expected overall impact for validation
   * @param {Object} impacts - All impact analyses
   * @returns {Object} Expected overall impact
   */
  calculateExpectedOverallImpact(impacts) {
    const weights = {
      performance: 0.3,
      business: 0.4,
      operational: 0.2,
      risk: 0.1
    };

    const weightedScore = 
      (impacts.performanceImpact.score * weights.performance) +
      (impacts.businessImpact.score * weights.business) +
      (impacts.operationalImpact.score * weights.operational) +
      (impacts.riskImpact.score * weights.risk);

    const level = this.getImpactLevel(weightedScore);
    
    return {
      score: Math.round(weightedScore * 100) / 100,
      level
    };
  }

  /**
   * Validate rule complexity calculation
   * @param {Object} rule - Rule configuration
   * @returns {Object} Validation result
   */
  validateRuleComplexity(rule) {
    try {
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        complexity: 0
      };

      let complexity = 0;
      
      // Base complexity
      complexity += 1;
      
      // Condition complexity
      if (rule.condition_type === 'complex') {
        complexity += 2;
      } else if (rule.condition_type === 'simple') {
        complexity += 1;
      }
      
      // Multiple conditions
      if (rule.conditions && rule.conditions.length > 1) {
        complexity += rule.conditions.length - 1;
      }
      
      // Action complexity
      if (rule.escalation_action === 'escalate') {
        complexity += 1;
      } else if (rule.escalation_action === 'auto_reply') {
        complexity += 2;
      }
      
      // Priority complexity
      if (rule.priority > 7) {
        complexity += 1;
      }

      validation.complexity = complexity;

      // Validate complexity range
      if (complexity < 1) {
        validation.isValid = false;
        validation.errors.push(`Rule complexity too low: ${complexity}`);
      }

      if (complexity > 20) {
        validation.warnings.push(`Rule complexity very high: ${complexity}`);
      }

      return validation;
    } catch (error) {
      logger.error('Error validating rule complexity', { error: error.message });
      return {
        isValid: false,
        errors: [`Complexity validation error: ${error.message}`],
        warnings: [],
        complexity: 0
      };
    }
  }

  /**
   * Validate impact thresholds
   * @returns {Object} Validation result
   */
  validateImpactThresholds() {
    try {
      const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        thresholds: this.impactThresholds
      };

      const { high, medium, low } = this.impactThresholds;

      // Validate threshold order
      if (high <= medium) {
        validation.isValid = false;
        validation.errors.push(`High threshold (${high}) must be greater than medium threshold (${medium})`);
      }

      if (medium <= low) {
        validation.isValid = false;
        validation.errors.push(`Medium threshold (${medium}) must be greater than low threshold (${low})`);
      }

      if (low <= 0) {
        validation.isValid = false;
        validation.errors.push(`Low threshold (${low}) must be greater than 0`);
      }

      // Validate threshold ranges
      if (high > 1) {
        validation.isValid = false;
        validation.errors.push(`High threshold (${high}) must be less than or equal to 1`);
      }

      if (medium > 1) {
        validation.isValid = false;
        validation.errors.push(`Medium threshold (${medium}) must be less than or equal to 1`);
      }

      if (low > 1) {
        validation.isValid = false;
        validation.errors.push(`Low threshold (${low}) must be less than or equal to 1`);
      }

      return validation;
    } catch (error) {
      logger.error('Error validating impact thresholds', { error: error.message });
      return {
        isValid: false,
        errors: [`Threshold validation error: ${error.message}`],
        warnings: [],
        thresholds: this.impactThresholds
      };
    }
  }
}

// Export singleton instance
export const ruleImpactAnalysis = new RuleImpactAnalysis();
export default RuleImpactAnalysis;
