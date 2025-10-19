/**
 * Template Analytics System
 * 
 * Handles template analytics, performance tracking,
 * and insights generation for email templates.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class TemplateAnalytics {
  constructor() {
    this.templateMetrics = new Map();
    this.templateEvents = new Map();
    this.templateInsights = new Map();
    this.templateReports = new Map();
    this.templateTrends = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize template analytics system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Template Analytics', { userId });

      // Load analytics data
      await this.loadTemplateMetrics(userId);
      await this.loadTemplateEvents(userId);
      await this.loadTemplateInsights(userId);
      await this.loadTemplateReports(userId);
      await this.loadTemplateTrends(userId);

      this.isInitialized = true;
      logger.info('Template Analytics initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Template Analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize template analytics
   */
  async initializeTemplateAnalytics(userId, templateId) {
    try {
      logger.info('Initializing template analytics', { userId, templateId });

      // Create initial analytics record
      const analytics = {
        id: this.generateAnalyticsId(),
        user_id: userId,
        template_id: templateId,
        created_at: new Date().toISOString(),
        metrics: {
          total_sends: 0,
          total_opens: 0,
          total_clicks: 0,
          total_conversions: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0,
          bounce_rate: 0,
          unsubscribe_rate: 0
        },
        performance_score: 0,
        last_updated: new Date().toISOString()
      };

      // Store analytics
      await this.storeTemplateAnalytics(userId, analytics);

      logger.info('Template analytics initialized successfully', { 
        userId, 
        templateId,
        analyticsId: analytics.id
      });

      return {
        success: true,
        analytics
      };
    } catch (error) {
      logger.error('Failed to initialize template analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Track template event
   */
  async trackTemplateEvent(userId, templateId, eventData) {
    try {
      logger.info('Tracking template event', { userId, templateId, eventType: eventData.eventType });

      // Validate event data
      const validationResult = await this.validateEventData(eventData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create event record
      const event = await this.createEventRecord(userId, templateId, eventData);

      // Store event
      await this.storeTemplateEvent(userId, event);

      // Update template metrics
      await this.updateTemplateMetrics(userId, templateId, eventData);

      // Generate insights if needed
      await this.generateInsightsIfNeeded(userId, templateId);

      logger.info('Template event tracked successfully', { 
        userId, 
        templateId,
        eventType: eventData.eventType
      });

      return {
        success: true,
        event
      };
    } catch (error) {
      logger.error('Failed to track template event', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(userId, templateId, analyticsFilters = {}) {
    try {
      logger.info('Getting template analytics', { userId, templateId });

      // Get template metrics
      const metrics = await this.getTemplateMetrics(userId, templateId, analyticsFilters);

      // Get template insights
      const insights = await this.getTemplateInsights(userId, templateId);

      // Get template trends
      const trends = await this.getTemplateTrends(userId, templateId, analyticsFilters);

      // Get template performance
      const performance = await this.getTemplatePerformance(userId, templateId, analyticsFilters);

      // Get template comparison
      const comparison = await this.getTemplateComparison(userId, templateId, analyticsFilters);

      const analytics = {
        template_id: templateId,
        user_id: userId,
        metrics: metrics,
        insights: insights,
        trends: trends,
        performance: performance,
        comparison: comparison,
        generated_at: new Date().toISOString()
      };

      logger.info('Template analytics retrieved successfully', { 
        userId, 
        templateId
      });

      return {
        success: true,
        analytics
      };
    } catch (error) {
      logger.error('Failed to get template analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Track template change
   */
  async trackTemplateChange(userId, templateId, changes) {
    try {
      logger.info('Tracking template change', { userId, templateId });

      // Create change event
      const changeEvent = {
        id: this.generateEventId(),
        user_id: userId,
        template_id: templateId,
        event_type: 'template_changed',
        event_data: {
          changes: changes,
          change_count: Object.keys(changes).length,
          change_types: Object.keys(changes)
        },
        timestamp: new Date().toISOString()
      };

      // Store change event
      await this.storeTemplateEvent(userId, changeEvent);

      // Update template metrics
      await this.updateTemplateMetrics(userId, templateId, {
        eventType: 'template_changed',
        changes: changes
      });

      logger.info('Template change tracked successfully', { 
        userId, 
        templateId
      });

      return {
        success: true,
        changeEvent
      };
    } catch (error) {
      logger.error('Failed to track template change', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate template report
   */
  async generateTemplateReport(userId, templateId, reportConfig = {}) {
    try {
      logger.info('Generating template report', { userId, templateId });

      // Get template analytics
      const analytics = await this.getTemplateAnalytics(userId, templateId, reportConfig.filters || {});

      // Generate report
      const report = await this.createTemplateReport(userId, templateId, analytics, reportConfig);

      // Store report
      await this.storeTemplateReport(userId, report);

      logger.info('Template report generated successfully', { 
        userId, 
        templateId,
        reportId: report.id
      });

      return {
        success: true,
        report
      };
    } catch (error) {
      logger.error('Failed to generate template report', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get template metrics
   */
  async getTemplateMetrics(userId, templateId, filters = {}) {
    try {
      // Get base metrics
      const baseMetrics = await this.getBaseTemplateMetrics(userId, templateId);

      // Apply filters
      const filteredMetrics = await this.applyMetricsFilters(baseMetrics, filters);

      // Calculate derived metrics
      const derivedMetrics = await this.calculateDerivedMetrics(filteredMetrics);

      // Calculate performance score
      const performanceScore = await this.calculatePerformanceScore(derivedMetrics);

      return {
        ...derivedMetrics,
        performance_score: performanceScore,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get template metrics', { error: error.message, userId });
      return {};
    }
  }

  /**
   * Get template insights
   */
  async getTemplateInsights(userId, templateId) {
    try {
      const insights = {
        template_id: templateId,
        user_id: userId,
        generated_at: new Date().toISOString(),
        key_insights: [],
        performance_insights: [],
        trend_insights: [],
        recommendations: []
      };

      // Get key insights
      insights.key_insights = await this.generateKeyInsights(userId, templateId);

      // Get performance insights
      insights.performance_insights = await this.generatePerformanceInsights(userId, templateId);

      // Get trend insights
      insights.trend_insights = await this.generateTrendInsights(userId, templateId);

      // Get recommendations
      insights.recommendations = await this.generateRecommendations(userId, templateId);

      return insights;
    } catch (error) {
      logger.error('Failed to get template insights', { error: error.message, userId });
      return {};
    }
  }

  /**
   * Get template trends
   */
  async getTemplateTrends(userId, templateId, filters = {}) {
    try {
      const trends = {
        template_id: templateId,
        user_id: userId,
        generated_at: new Date().toISOString(),
        time_series: [],
        trend_analysis: {},
        seasonal_patterns: [],
        growth_metrics: {}
      };

      // Get time series data
      trends.time_series = await this.getTimeSeriesData(userId, templateId, filters);

      // Analyze trends
      trends.trend_analysis = await this.analyzeTrends(trends.time_series);

      // Detect seasonal patterns
      trends.seasonal_patterns = await this.detectSeasonalPatterns(trends.time_series);

      // Calculate growth metrics
      trends.growth_metrics = await this.calculateGrowthMetrics(trends.time_series);

      return trends;
    } catch (error) {
      logger.error('Failed to get template trends', { error: error.message, userId });
      return {};
    }
  }

  /**
   * Get template performance
   */
  async getTemplatePerformance(userId, templateId, filters = {}) {
    try {
      const performance = {
        template_id: templateId,
        user_id: userId,
        generated_at: new Date().toISOString(),
        performance_score: 0,
        performance_grade: 'F',
        performance_metrics: {},
        performance_comparison: {},
        performance_trends: {}
      };

      // Get performance metrics
      performance.performance_metrics = await this.getPerformanceMetrics(userId, templateId, filters);

      // Calculate performance score
      performance.performance_score = await this.calculatePerformanceScore(performance.performance_metrics);

      // Calculate performance grade
      performance.performance_grade = await this.calculatePerformanceGrade(performance.performance_score);

      // Compare performance
      performance.performance_comparison = await this.comparePerformance(userId, templateId, filters);

      // Analyze performance trends
      performance.performance_trends = await this.analyzePerformanceTrends(userId, templateId, filters);

      return performance;
    } catch (error) {
      logger.error('Failed to get template performance', { error: error.message, userId });
      return {};
    }
  }

  /**
   * Get template comparison
   */
  async getTemplateComparison(userId, templateId, filters = {}) {
    try {
      const comparison = {
        template_id: templateId,
        user_id: userId,
        generated_at: new Date().toISOString(),
        vs_average: {},
        vs_best: {},
        vs_worst: {},
        ranking: 0,
        percentile: 0
      };

      // Compare against average
      comparison.vs_average = await this.compareAgainstAverage(userId, templateId, filters);

      // Compare against best
      comparison.vs_best = await this.compareAgainstBest(userId, templateId, filters);

      // Compare against worst
      comparison.vs_worst = await this.compareAgainstWorst(userId, templateId, filters);

      // Calculate ranking
      comparison.ranking = await this.calculateTemplateRanking(userId, templateId, filters);

      // Calculate percentile
      comparison.percentile = await this.calculateTemplatePercentile(userId, templateId, filters);

      return comparison;
    } catch (error) {
      logger.error('Failed to get template comparison', { error: error.message, userId });
      return {};
    }
  }

  /**
   * Create event record
   */
  async createEventRecord(userId, templateId, eventData) {
    try {
      const event = {
        id: this.generateEventId(),
        user_id: userId,
        template_id: templateId,
        event_type: eventData.eventType,
        event_data: eventData,
        timestamp: new Date().toISOString(),
        metadata: {
          user_agent: eventData.userAgent || 'unknown',
          ip_address: eventData.ipAddress || 'unknown',
          session_id: eventData.sessionId || 'unknown'
        }
      };

      return event;
    } catch (error) {
      logger.error('Failed to create event record', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update template metrics
   */
  async updateTemplateMetrics(userId, templateId, eventData) {
    try {
      // Get current metrics
      const currentMetrics = await this.getBaseTemplateMetrics(userId, templateId);

      // Update metrics based on event type
      const updatedMetrics = await this.updateMetricsByEventType(currentMetrics, eventData);

      // Store updated metrics
      await this.storeTemplateMetrics(userId, templateId, updatedMetrics);

      return updatedMetrics;
    } catch (error) {
      logger.error('Failed to update template metrics', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Update metrics by event type
   */
  async updateMetricsByEventType(currentMetrics, eventData) {
    try {
      const updatedMetrics = { ...currentMetrics };

      switch (eventData.eventType) {
        case 'email_sent':
          updatedMetrics.total_sends = (updatedMetrics.total_sends || 0) + 1;
          break;
        case 'email_opened':
          updatedMetrics.total_opens = (updatedMetrics.total_opens || 0) + 1;
          break;
        case 'email_clicked':
          updatedMetrics.total_clicks = (updatedMetrics.total_clicks || 0) + 1;
          break;
        case 'email_converted':
          updatedMetrics.total_conversions = (updatedMetrics.total_conversions || 0) + 1;
          break;
        case 'email_bounced':
          updatedMetrics.total_bounces = (updatedMetrics.total_bounces || 0) + 1;
          break;
        case 'email_unsubscribed':
          updatedMetrics.total_unsubscribes = (updatedMetrics.total_unsubscribes || 0) + 1;
          break;
      }

      // Recalculate rates
      updatedMetrics.open_rate = updatedMetrics.total_sends > 0 ? 
        (updatedMetrics.total_opens / updatedMetrics.total_sends) * 100 : 0;
      updatedMetrics.click_rate = updatedMetrics.total_sends > 0 ? 
        (updatedMetrics.total_clicks / updatedMetrics.total_sends) * 100 : 0;
      updatedMetrics.conversion_rate = updatedMetrics.total_sends > 0 ? 
        (updatedMetrics.total_conversions / updatedMetrics.total_sends) * 100 : 0;
      updatedMetrics.bounce_rate = updatedMetrics.total_sends > 0 ? 
        (updatedMetrics.total_bounces / updatedMetrics.total_sends) * 100 : 0;
      updatedMetrics.unsubscribe_rate = updatedMetrics.total_sends > 0 ? 
        (updatedMetrics.total_unsubscribes / updatedMetrics.total_sends) * 100 : 0;

      updatedMetrics.last_updated = new Date().toISOString();

      return updatedMetrics;
    } catch (error) {
      logger.error('Failed to update metrics by event type', { error: error.message });
      return currentMetrics;
    }
  }

  /**
   * Calculate derived metrics
   */
  async calculateDerivedMetrics(baseMetrics) {
    try {
      const derivedMetrics = { ...baseMetrics };

      // Calculate engagement rate
      derivedMetrics.engagement_rate = derivedMetrics.open_rate + derivedMetrics.click_rate;

      // Calculate click-to-open rate
      derivedMetrics.click_to_open_rate = derivedMetrics.total_opens > 0 ? 
        (derivedMetrics.total_clicks / derivedMetrics.total_opens) * 100 : 0;

      // Calculate conversion-to-click rate
      derivedMetrics.conversion_to_click_rate = derivedMetrics.total_clicks > 0 ? 
        (derivedMetrics.total_conversions / derivedMetrics.total_clicks) * 100 : 0;

      // Calculate revenue per email
      derivedMetrics.revenue_per_email = derivedMetrics.total_sends > 0 ? 
        (derivedMetrics.total_revenue || 0) / derivedMetrics.total_sends : 0;

      // Calculate cost per acquisition
      derivedMetrics.cost_per_acquisition = derivedMetrics.total_conversions > 0 ? 
        (derivedMetrics.total_cost || 0) / derivedMetrics.total_conversions : 0;

      return derivedMetrics;
    } catch (error) {
      logger.error('Failed to calculate derived metrics', { error: error.message });
      return baseMetrics;
    }
  }

  /**
   * Calculate performance score
   */
  async calculatePerformanceScore(metrics) {
    try {
      const weights = {
        open_rate: 0.25,
        click_rate: 0.30,
        conversion_rate: 0.25,
        engagement_rate: 0.20
      };

      let score = 0;
      let totalWeight = 0;

      for (const [metric, value] of Object.entries(metrics)) {
        if (weights[metric] && value !== undefined) {
          score += value * weights[metric];
          totalWeight += weights[metric];
        }
      }

      return totalWeight > 0 ? Math.round(score / totalWeight * 100) / 100 : 0;
    } catch (error) {
      logger.error('Failed to calculate performance score', { error: error.message });
      return 0;
    }
  }

  /**
   * Calculate performance grade
   */
  async calculatePerformanceScore(score) {
    try {
      if (score >= 90) return 'A+';
      if (score >= 80) return 'A';
      if (score >= 70) return 'B';
      if (score >= 60) return 'C';
      if (score >= 50) return 'D';
      return 'F';
    } catch (error) {
      logger.error('Failed to calculate performance grade', { error: error.message });
      return 'F';
    }
  }

  /**
   * Generate key insights
   */
  async generateKeyInsights(userId, templateId) {
    try {
      const insights = [];

      // Get template metrics
      const metrics = await this.getBaseTemplateMetrics(userId, templateId);

      // Generate insights based on metrics
      if (metrics.open_rate > 25) {
        insights.push({
          type: 'positive',
          title: 'High Open Rate',
          description: `Template has a ${metrics.open_rate.toFixed(1)}% open rate, which is above average`,
          impact: 'high',
          confidence: 0.9
        });
      }

      if (metrics.click_rate > 5) {
        insights.push({
          type: 'positive',
          title: 'Good Click Rate',
          description: `Template has a ${metrics.click_rate.toFixed(1)}% click rate, indicating good engagement`,
          impact: 'medium',
          confidence: 0.8
        });
      }

      if (metrics.bounce_rate > 5) {
        insights.push({
          type: 'warning',
          title: 'High Bounce Rate',
          description: `Template has a ${metrics.bounce_rate.toFixed(1)}% bounce rate, which may indicate deliverability issues`,
          impact: 'high',
          confidence: 0.85
        });
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate key insights', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Generate performance insights
   */
  async generatePerformanceInsights(userId, templateId) {
    try {
      const insights = [];

      // Get performance data
      const performance = await this.getTemplatePerformance(userId, templateId);

      // Generate performance insights
      if (performance.performance_score > 80) {
        insights.push({
          type: 'positive',
          title: 'Excellent Performance',
          description: `Template has a performance score of ${performance.performance_score.toFixed(1)}/100`,
          impact: 'high',
          confidence: 0.9
        });
      } else if (performance.performance_score < 50) {
        insights.push({
          type: 'warning',
          title: 'Poor Performance',
          description: `Template has a performance score of ${performance.performance_score.toFixed(1)}/100 and needs improvement`,
          impact: 'high',
          confidence: 0.85
        });
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate performance insights', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Generate trend insights
   */
  async generateTrendInsights(userId, templateId) {
    try {
      const insights = [];

      // Get trend data
      const trends = await this.getTemplateTrends(userId, templateId);

      // Generate trend insights
      if (trends.trend_analysis.trend === 'increasing') {
        insights.push({
          type: 'positive',
          title: 'Improving Performance',
          description: 'Template performance is trending upward',
          impact: 'medium',
          confidence: 0.8
        });
      } else if (trends.trend_analysis.trend === 'decreasing') {
        insights.push({
          type: 'warning',
          title: 'Declining Performance',
          description: 'Template performance is trending downward',
          impact: 'medium',
          confidence: 0.8
        });
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate trend insights', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(userId, templateId) {
    try {
      const recommendations = [];

      // Get template metrics
      const metrics = await this.getBaseTemplateMetrics(userId, templateId);

      // Generate recommendations based on metrics
      if (metrics.open_rate < 20) {
        recommendations.push({
          type: 'optimization',
          priority: 'high',
          title: 'Improve Subject Line',
          description: 'Low open rate suggests the subject line needs improvement',
          action: 'Test different subject lines to improve open rates'
        });
      }

      if (metrics.click_rate < 3) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          title: 'Improve Call-to-Action',
          description: 'Low click rate suggests the call-to-action needs improvement',
          action: 'Make the call-to-action more prominent and compelling'
        });
      }

      if (metrics.bounce_rate > 5) {
        recommendations.push({
          type: 'deliverability',
          priority: 'high',
          title: 'Improve Deliverability',
          description: 'High bounce rate suggests deliverability issues',
          action: 'Review email list quality and sender reputation'
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to generate recommendations', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Store template analytics
   */
  async storeTemplateAnalytics(userId, analytics) {
    try {
      const { error } = await supabase
        .from('template_analytics')
        .upsert(analytics, { onConflict: 'id' });

      if (error) throw error;

      // Update in-memory analytics
      this.templateMetrics.set(analytics.template_id, analytics);
    } catch (error) {
      logger.error('Failed to store template analytics', { error: error.message, userId });
    }
  }

  /**
   * Store template event
   */
  async storeTemplateEvent(userId, event) {
    try {
      const { error } = await supabase
        .from('template_events')
        .insert(event);

      if (error) throw error;

      // Update in-memory events
      if (!this.templateEvents.has(event.template_id)) {
        this.templateEvents.set(event.template_id, []);
      }
      this.templateEvents.get(event.template_id).push(event);
    } catch (error) {
      logger.error('Failed to store template event', { error: error.message, userId });
    }
  }

  /**
   * Store template metrics
   */
  async storeTemplateMetrics(userId, templateId, metrics) {
    try {
      const { error } = await supabase
        .from('template_analytics')
        .upsert({
          template_id: templateId,
          user_id: userId,
          metrics: metrics,
          last_updated: new Date().toISOString()
        }, { onConflict: 'template_id' });

      if (error) throw error;

      // Update in-memory metrics
      this.templateMetrics.set(templateId, metrics);
    } catch (error) {
      logger.error('Failed to store template metrics', { error: error.message, userId });
    }
  }

  /**
   * Store template report
   */
  async storeTemplateReport(userId, report) {
    try {
      const { error } = await supabase
        .from('template_reports')
        .insert(report);

      if (error) throw error;

      // Update in-memory reports
      if (!this.templateReports.has(report.template_id)) {
        this.templateReports.set(report.template_id, []);
      }
      this.templateReports.get(report.template_id).push(report);
    } catch (error) {
      logger.error('Failed to store template report', { error: error.message, userId });
    }
  }

  /**
   * Get base template metrics
   */
  async getBaseTemplateMetrics(userId, templateId) {
    try {
      // Check in-memory first
      if (this.templateMetrics.has(templateId)) {
        return this.templateMetrics.get(templateId);
      }

      // Fetch from database
      const { data: analytics, error } = await supabase
        .from('template_analytics')
        .select('*')
        .eq('template_id', templateId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (analytics) {
        this.templateMetrics.set(templateId, analytics.metrics || {});
        return analytics.metrics || {};
      }

      return {};
    } catch (error) {
      logger.error('Failed to get base template metrics', { error: error.message, userId });
      return {};
    }
  }

  /**
   * Generate analytics ID
   */
  generateAnalyticsId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ANALYTICS-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate event ID
   */
  generateEventId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `EVENT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Load template metrics
   */
  async loadTemplateMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('template_analytics')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      metrics.forEach(metric => {
        this.templateMetrics.set(metric.template_id, metric.metrics || {});
      });

      logger.info('Template metrics loaded', { userId, metricCount: metrics.length });
    } catch (error) {
      logger.error('Failed to load template metrics', { error: error.message, userId });
    }
  }

  /**
   * Load template events
   */
  async loadTemplateEvents(userId) {
    try {
      const { data: events, error } = await supabase
        .from('template_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      events.forEach(event => {
        if (!this.templateEvents.has(event.template_id)) {
          this.templateEvents.set(event.template_id, []);
        }
        this.templateEvents.get(event.template_id).push(event);
      });

      logger.info('Template events loaded', { userId, eventCount: events.length });
    } catch (error) {
      logger.error('Failed to load template events', { error: error.message, userId });
    }
  }

  /**
   * Load template insights
   */
  async loadTemplateInsights(userId) {
    try {
      const { data: insights, error } = await supabase
        .from('template_insights')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      insights.forEach(insight => {
        this.templateInsights.set(insight.template_id, insight);
      });

      logger.info('Template insights loaded', { userId, insightCount: insights.length });
    } catch (error) {
      logger.error('Failed to load template insights', { error: error.message, userId });
    }
  }

  /**
   * Load template reports
   */
  async loadTemplateReports(userId) {
    try {
      const { data: reports, error } = await supabase
        .from('template_reports')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      reports.forEach(report => {
        if (!this.templateReports.has(report.template_id)) {
          this.templateReports.set(report.template_id, []);
        }
        this.templateReports.get(report.template_id).push(report);
      });

      logger.info('Template reports loaded', { userId, reportCount: reports.length });
    } catch (error) {
      logger.error('Failed to load template reports', { error: error.message, userId });
    }
  }

  /**
   * Load template trends
   */
  async loadTemplateTrends(userId) {
    try {
      const { data: trends, error } = await supabase
        .from('template_trends')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      trends.forEach(trend => {
        this.templateTrends.set(trend.template_id, trend);
      });

      logger.info('Template trends loaded', { userId, trendCount: trends.length });
    } catch (error) {
      logger.error('Failed to load template trends', { error: error.message, userId });
    }
  }

  /**
   * Reset analytics system for user
   */
  async reset(userId) {
    try {
      this.templateMetrics.clear();
      this.templateEvents.clear();
      this.templateInsights.clear();
      this.templateReports.clear();
      this.templateTrends.clear();

      logger.info('Analytics system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset analytics system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
