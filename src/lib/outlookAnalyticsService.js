import { supabase } from '@/lib/customSupabaseClient';
import { analytics } from '@/lib/analytics';

/**
 * Outlook Analytics Service
 * Tracks Microsoft Graph API usage, performance, and error rates for Outlook integration
 */
export class OutlookAnalyticsService {
  constructor(userId) {
    this.userId = userId;
    this.apiCallMetrics = {
      total: 0,
      successful: 0,
      failed: 0,
      byEndpoint: {},
      byMethod: {},
      responseTimes: [],
      errorRates: []
    };
    this.performanceMetrics = {
      calendarOperations: [],
      emailOperations: [],
      authenticationOperations: []
    };
    this.errorMetrics = {
      total: 0,
      byType: {},
      byEndpoint: {},
      bySeverity: {}
    };
  }

  /**
   * Track Microsoft Graph API call
   */
  async trackApiCall(endpoint, method, status, duration, metadata = {}) {
    const apiCall = {
      userId: this.userId,
      endpoint,
      method,
      status,
      duration,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: 'outlook',
        ...metadata
      }
    };

    // Update local metrics
    this.apiCallMetrics.total++;
    if (status >= 200 && status < 300) {
      this.apiCallMetrics.successful++;
    } else {
      this.apiCallMetrics.failed++;
    }

    // Track by endpoint
    this.apiCallMetrics.byEndpoint[endpoint] = (this.apiCallMetrics.byEndpoint[endpoint] || 0) + 1;
    
    // Track by method
    this.apiCallMetrics.byMethod[method] = (this.apiCallMetrics.byMethod[method] || 0) + 1;
    
    // Track response times
    this.apiCallMetrics.responseTimes.push(duration);
    
    // Track error rates
    const errorRate = this.apiCallMetrics.failed / this.apiCallMetrics.total;
    this.apiCallMetrics.errorRates.push({
      timestamp: apiCall.timestamp,
      errorRate: errorRate * 100
    });

    // Send to analytics system
    analytics.trackApiCall(endpoint, method, status, duration, {
      provider: 'outlook',
      ...metadata
    });

    // Store in database
    try {
      await supabase
        .from('outlook_api_metrics')
        .insert(apiCall);
    } catch (error) {
      console.error('Failed to store Outlook API metrics:', error);
    }

    return apiCall;
  }

  /**
   * Track calendar operation performance
   */
  async trackCalendarOperation(operation, duration, success, metadata = {}) {
    const calendarMetric = {
      userId: this.userId,
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: 'outlook',
        service: 'calendar',
        ...metadata
      }
    };

    this.performanceMetrics.calendarOperations.push(calendarMetric);

    // Track in analytics
    analytics.trackPerformance(`outlook_calendar_${operation}`, duration, {
      success,
      provider: 'outlook',
      ...metadata
    });

    // Store in database
    try {
      await supabase
        .from('outlook_performance_metrics')
        .insert(calendarMetric);
    } catch (error) {
      console.error('Failed to store Outlook performance metrics:', error);
    }

    return calendarMetric;
  }

  /**
   * Track email operation performance
   */
  async trackEmailOperation(operation, duration, success, metadata = {}) {
    const emailMetric = {
      userId: this.userId,
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: 'outlook',
        service: 'email',
        ...metadata
      }
    };

    this.performanceMetrics.emailOperations.push(emailMetric);

    // Track in analytics
    analytics.trackPerformance(`outlook_email_${operation}`, duration, {
      success,
      provider: 'outlook',
      ...metadata
    });

    // Store in database
    try {
      await supabase
        .from('outlook_performance_metrics')
        .insert(emailMetric);
    } catch (error) {
      console.error('Failed to store Outlook email metrics:', error);
    }

    return emailMetric;
  }

  /**
   * Track authentication operation
   */
  async trackAuthOperation(operation, duration, success, metadata = {}) {
    const authMetric = {
      userId: this.userId,
      operation,
      duration,
      success,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: 'outlook',
        service: 'authentication',
        ...metadata
      }
    };

    this.performanceMetrics.authenticationOperations.push(authMetric);

    // Track in analytics
    analytics.trackPerformance(`outlook_auth_${operation}`, duration, {
      success,
      provider: 'outlook',
      ...metadata
    });

    // Store in database
    try {
      await supabase
        .from('outlook_performance_metrics')
        .insert(authMetric);
    } catch (error) {
      console.error('Failed to store Outlook auth metrics:', error);
    }

    return authMetric;
  }

  /**
   * Track Outlook-specific error
   */
  async trackError(error, context = {}, metadata = {}) {
    const errorData = {
      userId: this.userId,
      errorType: error.name || 'Unknown',
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: 'outlook',
        ...metadata
      }
    };

    // Update local metrics
    this.errorMetrics.total++;
    this.errorMetrics.byType[errorData.errorType] = (this.errorMetrics.byType[errorData.errorType] || 0) + 1;
    
    if (context.endpoint) {
      this.errorMetrics.byEndpoint[context.endpoint] = (this.errorMetrics.byEndpoint[context.endpoint] || 0) + 1;
    }

    // Determine severity
    const severity = this.determineErrorSeverity(error, context);
    this.errorMetrics.bySeverity[severity] = (this.errorMetrics.bySeverity[severity] || 0) + 1;

    // Track in analytics
    analytics.trackError(error, {
      provider: 'outlook',
      ...context
    }, metadata);

    // Store in database
    try {
      await supabase
        .from('outlook_error_logs')
        .insert({
          ...errorData,
          severity
        });
    } catch (dbError) {
      console.error('Failed to store Outlook error log:', dbError);
    }

    return errorData;
  }

  /**
   * Determine error severity
   */
  determineErrorSeverity(error, context) {
    // Authentication errors are critical
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return 'critical';
    }
    
    // Rate limiting errors are high severity
    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return 'high';
    }
    
    // Network errors are medium severity
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'medium';
    }
    
    // Other errors are low severity
    return 'low';
  }

  /**
   * Track business event (appointments, emails processed, etc.)
   */
  async trackBusinessEvent(event, data = {}, metadata = {}) {
    const businessEvent = {
      userId: this.userId,
      event,
      data,
      timestamp: new Date().toISOString(),
      metadata: {
        provider: 'outlook',
        ...metadata
      }
    };

    // Track in analytics
    analytics.trackBusinessEvent(`outlook_${event}`, data, {
      provider: 'outlook',
      ...metadata
    });

    // Store in database
    try {
      await supabase
        .from('outlook_business_events')
        .insert(businessEvent);
    } catch (error) {
      console.error('Failed to store Outlook business event:', error);
    }

    return businessEvent;
  }

  /**
   * Get Outlook analytics dashboard data
   */
  async getDashboardData(timeRange = '24h') {
    try {
      const timeRangeStart = this.getTimeRangeStart(timeRange);
      
      const [apiMetrics, performanceMetrics, errorMetrics, businessEvents] = await Promise.all([
        this.getApiMetrics(timeRangeStart),
        this.getPerformanceMetrics(timeRangeStart),
        this.getErrorMetrics(timeRangeStart),
        this.getBusinessEvents(timeRangeStart)
      ]);

      return {
        api: apiMetrics,
        performance: performanceMetrics,
        errors: errorMetrics,
        business: businessEvents,
        summary: this.calculateSummary(apiMetrics, performanceMetrics, errorMetrics, businessEvents)
      };
    } catch (error) {
      console.error('Failed to get Outlook dashboard data:', error);
      return this.getEmptyDashboardData();
    }
  }

  /**
   * Get API metrics for time range
   */
  async getApiMetrics(timeRangeStart) {
    try {
      const { data, error } = await supabase
        .from('outlook_api_metrics')
        .select('*')
        .eq('user_id', this.userId)
        .gte('timestamp', timeRangeStart);

      if (error) throw error;

      const total = data.length;
      const successful = data.filter(m => m.status >= 200 && m.status < 300).length;
      const failed = total - successful;
      const avgResponseTime = data.reduce((sum, m) => sum + m.duration, 0) / total || 0;

      return {
        total,
        successful,
        failed,
        successRate: total > 0 ? (successful / total) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        byEndpoint: this.groupByField(data, 'endpoint'),
        byMethod: this.groupByField(data, 'method'),
        byStatus: this.groupByField(data, 'status')
      };
    } catch (error) {
      console.error('Failed to get API metrics:', error);
      return { total: 0, successful: 0, failed: 0, successRate: 0, avgResponseTime: 0 };
    }
  }

  /**
   * Get performance metrics for time range
   */
  async getPerformanceMetrics(timeRangeStart) {
    try {
      const { data, error } = await supabase
        .from('outlook_performance_metrics')
        .select('*')
        .eq('user_id', this.userId)
        .gte('timestamp', timeRangeStart);

      if (error) throw error;

      const calendarOps = data.filter(m => m.metadata?.service === 'calendar');
      const emailOps = data.filter(m => m.metadata?.service === 'email');
      const authOps = data.filter(m => m.metadata?.service === 'authentication');

      return {
        calendar: {
          total: calendarOps.length,
          avgDuration: this.calculateAverageDuration(calendarOps),
          successRate: this.calculateSuccessRate(calendarOps),
          byOperation: this.groupByField(calendarOps, 'operation')
        },
        email: {
          total: emailOps.length,
          avgDuration: this.calculateAverageDuration(emailOps),
          successRate: this.calculateSuccessRate(emailOps),
          byOperation: this.groupByField(emailOps, 'operation')
        },
        authentication: {
          total: authOps.length,
          avgDuration: this.calculateAverageDuration(authOps),
          successRate: this.calculateSuccessRate(authOps),
          byOperation: this.groupByField(authOps, 'operation')
        }
      };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return { calendar: {}, email: {}, authentication: {} };
    }
  }

  /**
   * Get error metrics for time range
   */
  async getErrorMetrics(timeRangeStart) {
    try {
      const { data, error } = await supabase
        .from('outlook_error_logs')
        .select('*')
        .eq('user_id', this.userId)
        .gte('timestamp', timeRangeStart);

      if (error) throw error;

      return {
        total: data.length,
        byType: this.groupByField(data, 'errorType'),
        bySeverity: this.groupByField(data, 'severity'),
        byEndpoint: this.groupByField(data, 'context->endpoint'),
        recent: data.slice(-10) // Last 10 errors
      };
    } catch (error) {
      console.error('Failed to get error metrics:', error);
      return { total: 0, byType: {}, bySeverity: {}, byEndpoint: {}, recent: [] };
    }
  }

  /**
   * Get business events for time range
   */
  async getBusinessEvents(timeRangeStart) {
    try {
      const { data, error } = await supabase
        .from('outlook_business_events')
        .select('*')
        .eq('user_id', this.userId)
        .gte('timestamp', timeRangeStart);

      if (error) throw error;

      return {
        total: data.length,
        byEvent: this.groupByField(data, 'event'),
        recent: data.slice(-20) // Last 20 events
      };
    } catch (error) {
      console.error('Failed to get business events:', error);
      return { total: 0, byEvent: {}, recent: [] };
    }
  }

  /**
   * Calculate summary metrics
   */
  calculateSummary(apiMetrics, performanceMetrics, errorMetrics, businessEvents) {
    return {
      overallHealth: this.calculateOverallHealth(apiMetrics, errorMetrics),
      totalOperations: apiMetrics.total + performanceMetrics.calendar.total + performanceMetrics.email.total,
      avgResponseTime: apiMetrics.avgResponseTime,
      errorRate: apiMetrics.total > 0 ? (apiMetrics.failed / apiMetrics.total) * 100 : 0,
      businessEventsCount: businessEvents.total,
      recommendations: this.generateRecommendations(apiMetrics, performanceMetrics, errorMetrics)
    };
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth(apiMetrics, errorMetrics) {
    if (apiMetrics.total === 0) return 100;
    
    const successRate = apiMetrics.successRate;
    const errorRate = (errorMetrics.total / apiMetrics.total) * 100;
    
    // Health score based on success rate and error rate
    const healthScore = Math.max(0, successRate - (errorRate * 2));
    return Math.round(healthScore);
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(apiMetrics, performanceMetrics, errorMetrics) {
    const recommendations = [];

    // API performance recommendations
    if (apiMetrics.avgResponseTime > 2000) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: 'API response times are slow. Consider implementing caching or optimizing queries.',
        action: 'Review API call patterns and implement caching strategies'
      });
    }

    // Error rate recommendations
    if (apiMetrics.successRate < 95) {
      recommendations.push({
        type: 'reliability',
        severity: 'high',
        message: 'API success rate is below 95%. Review error logs for patterns.',
        action: 'Investigate and fix recurring API errors'
      });
    }

    // Authentication error recommendations
    if (errorMetrics.byType['Unauthorized'] > 0) {
      recommendations.push({
        type: 'authentication',
        severity: 'critical',
        message: 'Authentication errors detected. Check token validity and refresh logic.',
        action: 'Review and fix authentication token management'
      });
    }

    // Rate limiting recommendations
    if (errorMetrics.byType['RateLimitError'] > 0) {
      recommendations.push({
        type: 'rate_limiting',
        severity: 'medium',
        message: 'Rate limiting errors detected. Consider implementing exponential backoff.',
        action: 'Implement rate limiting and retry logic'
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  getTimeRangeStart(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  groupByField(data, field) {
    if (!data || data.length === 0) return {};
    return data.reduce((acc, item) => {
      const value = this.getNestedValue(item, field);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  getNestedValue(obj, path) {
    return path.split('->').reduce((o, p) => o && o[p], obj) || 'unknown';
  }

  calculateAverageDuration(operations) {
    if (!operations || operations.length === 0) return 0;
    const sum = operations.reduce((acc, op) => acc + (op.duration || 0), 0);
    return Math.round(sum / operations.length);
  }

  calculateSuccessRate(operations) {
    if (!operations || operations.length === 0) return 0;
    const successful = operations.filter(op => op.success).length;
    return Math.round((successful / operations.length) * 100);
  }

  getEmptyDashboardData() {
    return {
      api: { total: 0, successful: 0, failed: 0, successRate: 0, avgResponseTime: 0 },
      performance: { calendar: {}, email: {}, authentication: {} },
      errors: { total: 0, byType: {}, bySeverity: {}, byEndpoint: {}, recent: [] },
      business: { total: 0, byEvent: {}, recent: [] },
      summary: { overallHealth: 100, totalOperations: 0, avgResponseTime: 0, errorRate: 0, businessEventsCount: 0, recommendations: [] }
    };
  }
}

export default OutlookAnalyticsService;
