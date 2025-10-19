/**
 * Security Audit Logger
 * Advanced security audit logging and monitoring for FloWorx
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class SecurityAuditLogger {
  constructor() {
    this.auditEvents = [];
    this.maxEvents = 1000;
    this.batchSize = 50;
    this.flushInterval = 30000; // 30 seconds
    this.isFlushing = false;
    this.initialize();
  }

  /**
   * Initialize the audit logger
   */
  initialize() {
    // Set up periodic flushing
    setInterval(() => {
      this.flushAuditEvents();
    }, this.flushInterval);

    // Set up error handling
    window.addEventListener('error', (event) => {
      this.logSecurityEvent('client_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Set up unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      this.logSecurityEvent('unhandled_promise_rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });

    logger.info('Security Audit Logger initialized');
  }

  /**
   * Log a security event
   * @param {string} eventType - Type of security event
   * @param {Object} eventData - Event data
   * @param {string} userId - User ID (optional)
   * @param {string} severity - Event severity (low, medium, high, critical)
   */
  logSecurityEvent(eventType, eventData = {}, userId = null, severity = 'medium') {
    const auditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      userId,
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      ip: this.getClientIP(),
      data: this.sanitizeEventData(eventData),
      riskScore: this.calculateRiskScore(eventType, eventData, severity)
    };

    this.auditEvents.push(auditEvent);

    // Keep only recent events in memory
    if (this.auditEvents.length > this.maxEvents) {
      this.auditEvents = this.auditEvents.slice(-this.maxEvents);
    }

    // Log to console for immediate visibility
    this.logToConsole(auditEvent);

    // Flush if batch size reached
    if (this.auditEvents.length >= this.batchSize) {
      this.flushAuditEvents();
    }
  }

  /**
   * Log authentication events
   * @param {string} action - Authentication action (login, logout, failed_login, etc.)
   * @param {Object} details - Additional details
   * @param {string} userId - User ID
   */
  logAuthEvent(action, details = {}, userId = null) {
    const severity = this.getAuthSeverity(action);
    this.logSecurityEvent(`auth_${action}`, {
      action,
      ...details
    }, userId, severity);
  }

  /**
   * Log data access events
   * @param {string} resource - Resource being accessed
   * @param {string} action - Action performed (read, write, delete)
   * @param {Object} details - Additional details
   * @param {string} userId - User ID
   */
  logDataAccessEvent(resource, action, details = {}, userId = null) {
    const severity = this.getDataAccessSeverity(action);
    this.logSecurityEvent('data_access', {
      resource,
      action,
      ...details
    }, userId, severity);
  }

  /**
   * Log suspicious activity
   * @param {string} activityType - Type of suspicious activity
   * @param {Object} details - Activity details
   * @param {string} userId - User ID
   */
  logSuspiciousActivity(activityType, details = {}, userId = null) {
    this.logSecurityEvent('suspicious_activity', {
      activityType,
      ...details
    }, userId, 'high');
  }

  /**
   * Log security policy violations
   * @param {string} policyType - Type of policy violated
   * @param {Object} details - Violation details
   * @param {string} userId - User ID
   */
  logPolicyViolation(policyType, details = {}, userId = null) {
    this.logSecurityEvent('policy_violation', {
      policyType,
      ...details
    }, userId, 'high');
  }

  /**
   * Flush audit events to backend
   */
  async flushAuditEvents() {
    if (this.isFlushing || this.auditEvents.length === 0) {
      return;
    }

    this.isFlushing = true;
    const eventsToFlush = [...this.auditEvents];
    this.auditEvents = [];

    try {
      const { error } = await supabase
        .from('outlook_analytics_events')
        .insert(eventsToFlush.map(event => ({
          event_type: event.eventType,
          data: event.data,
          user_id: event.userId,
          provider: 'security',
          timestamp: event.timestamp,
          created_at: event.timestamp
        })));

      if (error) {
        logger.error('Failed to flush security audit events:', error);
        // Re-add events to queue for retry
        this.auditEvents.unshift(...eventsToFlush);
      } else {
        logger.info(`Flushed ${eventsToFlush.length} security audit events`);
      }
    } catch (error) {
      logger.error('Error flushing security audit events:', error);
      // Re-add events to queue for retry
      this.auditEvents.unshift(...eventsToFlush);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get audit events for a specific time range
   * @param {string} startTime - Start time (ISO string)
   * @param {string} endTime - End time (ISO string)
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Audit events
   */
  async getAuditEvents(startTime, endTime, filters = {}) {
    try {
      let query = supabase
        .from('outlook_analytics_events')
        .select('*')
        .eq('provider', 'security')
        .gte('timestamp', startTime)
        .lte('timestamp', endTime)
        .order('timestamp', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch audit events:', error);
      return [];
    }
  }

  /**
   * Generate security report
   * @param {string} timeRange - Time range for report (24h, 7d, 30d)
   * @returns {Promise<Object>} Security report
   */
  async generateSecurityReport(timeRange = '24h') {
    const now = new Date();
    const startTime = this.getTimeRangeStart(now, timeRange);

    try {
      const events = await this.getAuditEvents(startTime.toISOString(), now.toISOString());

      const report = {
        timeRange,
        generatedAt: now.toISOString(),
        totalEvents: events.length,
        eventsByType: this.groupEventsByType(events),
        eventsBySeverity: this.groupEventsBySeverity(events),
        topUsers: this.getTopUsers(events),
        riskTrends: this.calculateRiskTrends(events),
        recommendations: this.generateRecommendations(events)
      };

      return report;
    } catch (error) {
      logger.error('Failed to generate security report:', error);
      return {
        timeRange,
        generatedAt: now.toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Generate event ID
   * @returns {string} Unique event ID
   */
  generateEventId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session ID (avoiding circular dependency with security monitoring)
   * @returns {string} Session ID
   */
  getSessionId() {
    // Use direct sessionStorage access to avoid triggering security monitoring
    let sessionId = window.sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      window.sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get client IP (simplified)
   * @returns {string} Client IP
   */
  getClientIP() {
    // In a real implementation, this would be provided by the backend
    return 'client_ip';
  }

  /**
   * Sanitize event data
   * @param {Object} data - Event data
   * @returns {Object} Sanitized data
   */
  sanitizeEventData(data) {
    if (!data || typeof data !== 'object') {
      return {};
    }

    const sanitized = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'string') {
        // Remove sensitive information
        sanitized[key] = value.replace(/password|token|key|secret/gi, '[REDACTED]');
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? item.replace(/password|token|key|secret/gi, '[REDACTED]') : item
        );
      }
    });

    return sanitized;
  }

  /**
   * Calculate risk score for an event
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @param {string} severity - Event severity
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(eventType, eventData, severity) {
    let score = 0;

    // Base score by severity
    const severityScores = {
      low: 10,
      medium: 30,
      high: 60,
      critical: 90
    };
    score += severityScores[severity] || 30;

    // Additional scoring based on event type
    if (eventType.includes('failed_login')) score += 20;
    if (eventType.includes('suspicious')) score += 30;
    if (eventType.includes('policy_violation')) score += 25;
    if (eventType.includes('data_access')) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Get authentication severity
   * @param {string} action - Auth action
   * @returns {string} Severity level
   */
  getAuthSeverity(action) {
    const severityMap = {
      login: 'low',
      logout: 'low',
      failed_login: 'medium',
      password_change: 'medium',
      account_locked: 'high',
      suspicious_login: 'high'
    };
    return severityMap[action] || 'medium';
  }

  /**
   * Get data access severity
   * @param {string} action - Data action
   * @returns {string} Severity level
   */
  getDataAccessSeverity(action) {
    const severityMap = {
      read: 'low',
      write: 'medium',
      delete: 'high',
      export: 'medium'
    };
    return severityMap[action] || 'medium';
  }

  /**
   * Log to console with appropriate level
   * @param {Object} event - Audit event
   */
  logToConsole(event) {
    const message = `Security Event: ${event.eventType} (${event.severity})`;
    const data = {
      id: event.id,
      userId: event.userId,
      riskScore: event.riskScore,
      data: event.data
    };

    // Reduce noise in development mode for low-severity events
    const isDevelopment = import.meta.env.MODE === 'development';
    const isLowSeverity = ['low'].includes(event.severity);
    
    if (isDevelopment && isLowSeverity) {
      // Only log low-severity events in development if they're important
      if (['suspicious_activity', 'policy_violation', 'auth_failed'].includes(event.eventType)) {
        console.debug(message, data);
      }
      return;
    }

    switch (event.severity) {
      case 'critical':
        console.error(message, data);
        break;
      case 'high':
        console.warn(message, data);
        break;
      case 'medium':
        console.info(message, data);
        break;
      default:
        console.log(message, data);
    }
  }

  /**
   * Get time range start
   * @param {Date} now - Current time
   * @param {string} timeRange - Time range
   * @returns {Date} Start time
   */
  getTimeRangeStart(now, timeRange) {
    const start = new Date(now);
    switch (timeRange) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      default:
        start.setHours(start.getHours() - 24);
    }
    return start;
  }

  /**
   * Group events by type
   * @param {Array} events - Events array
   * @returns {Object} Grouped events
   */
  groupEventsByType(events) {
    const grouped = {};
    events.forEach(event => {
      grouped[event.eventType] = (grouped[event.eventType] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Group events by severity
   * @param {Array} events - Events array
   * @returns {Object} Grouped events
   */
  groupEventsBySeverity(events) {
    const grouped = {};
    events.forEach(event => {
      grouped[event.severity] = (grouped[event.severity] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Get top users by event count
   * @param {Array} events - Events array
   * @returns {Array} Top users
   */
  getTopUsers(events) {
    const userCounts = {};
    events.forEach(event => {
      if (event.userId) {
        userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      }
    });

    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));
  }

  /**
   * Calculate risk trends
   * @param {Array} events - Events array
   * @returns {Object} Risk trends
   */
  calculateRiskTrends(events) {
    const hourlyRisks = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyRisks[hour] = (hourlyRisks[hour] || 0) + event.riskScore;
    });

    return {
      averageRisk: events.reduce((sum, event) => sum + event.riskScore, 0) / events.length,
      peakHour: Object.entries(hourlyRisks).sort(([,a], [,b]) => b - a)[0]?.[0],
      totalRiskScore: events.reduce((sum, event) => sum + event.riskScore, 0)
    };
  }

  /**
   * Generate security recommendations
   * @param {Array} events - Events array
   * @returns {Array} Recommendations
   */
  generateRecommendations(events) {
    const recommendations = [];

    // Check for high-risk events
    const highRiskEvents = events.filter(event => event.riskScore > 70);
    if (highRiskEvents.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${highRiskEvents.length} high-risk security events detected`,
        action: 'Review and investigate these events immediately'
      });
    }

    // Check for failed login attempts
    const failedLogins = events.filter(event => event.eventType === 'auth_failed_login');
    if (failedLogins.length > 10) {
      recommendations.push({
        type: 'warning',
        message: `${failedLogins.length} failed login attempts detected`,
        action: 'Consider implementing account lockout policies'
      });
    }

    // Check for suspicious activity
    const suspiciousEvents = events.filter(event => event.eventType === 'suspicious_activity');
    if (suspiciousEvents.length > 0) {
      recommendations.push({
        type: 'info',
        message: `${suspiciousEvents.length} suspicious activities detected`,
        action: 'Review user behavior patterns and implement additional monitoring'
      });
    }

    return recommendations;
  }
}

// Export singleton instance
export const securityAuditLogger = new SecurityAuditLogger();

export default SecurityAuditLogger;
