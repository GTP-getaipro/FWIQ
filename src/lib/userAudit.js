/**
 * User Audit System
 * 
 * Handles user audit logging, compliance tracking,
 * and audit trail management.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class UserAudit {
  constructor() {
    this.auditLogs = new Map();
    this.auditRules = new Map();
    this.compliancePolicies = new Map();
    this.auditReports = new Map();
    this.auditMetrics = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize user audit system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing User Audit', { userId });

      // Load audit rules and compliance policies
      await this.loadAuditRules(userId);
      await this.loadCompliancePolicies(userId);
      await this.loadAuditLogs(userId);
      await this.loadAuditReports(userId);
      await this.loadAuditMetrics(userId);

      this.isInitialized = true;
      logger.info('User Audit initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize User Audit', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Log user activity
   */
  async logUserActivity(userId, activityType, activityData) {
    try {
      logger.info('Logging user activity', { userId, activityType });

      // Validate activity data
      const validationResult = await this.validateActivityData(activityData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Create audit log entry
      const auditLog = await this.createAuditLogEntry(userId, activityType, activityData);

      // Store audit log
      await this.storeAuditLog(userId, auditLog);

      // Check compliance policies
      await this.checkCompliancePolicies(userId, auditLog);

      // Update audit metrics
      await this.updateAuditMetrics(userId, auditLog);

      logger.info('User activity logged successfully', { 
        userId, 
        activityType,
        auditLogId: auditLog.id
      });

      return {
        success: true,
        auditLog
      };
    } catch (error) {
      logger.error('Failed to log user activity', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(userId, auditFilters = {}) {
    try {
      logger.info('Getting audit logs', { userId, filters: auditFilters });

      // Get audit logs from database
      const auditLogs = await this.fetchAuditLogsFromDatabase(userId, auditFilters);

      // Filter logs based on criteria
      const filteredLogs = await this.filterAuditLogs(auditLogs, auditFilters);

      // Format logs for display
      const formattedLogs = await this.formatAuditLogs(filteredLogs);

      logger.info('Audit logs retrieved successfully', { 
        userId, 
        totalLogs: auditLogs.length,
        filteredLogs: filteredLogs.length
      });

      return {
        success: true,
        auditLogs: formattedLogs,
        totalCount: auditLogs.length,
        filteredCount: filteredLogs.length
      };
    } catch (error) {
      logger.error('Failed to get audit logs', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(userId, reportConfig) {
    try {
      logger.info('Generating audit report', { userId, reportType: reportConfig.type });

      // Validate report configuration
      const validationResult = await this.validateReportConfig(reportConfig);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }

      // Generate report based on type
      let auditReport;
      switch (reportConfig.type) {
        case 'compliance':
          auditReport = await this.generateComplianceReport(userId, reportConfig);
          break;
        case 'security':
          auditReport = await this.generateSecurityReport(userId, reportConfig);
          break;
        case 'access':
          auditReport = await this.generateAccessReport(userId, reportConfig);
          break;
        case 'activity':
          auditReport = await this.generateActivityReport(userId, reportConfig);
          break;
        default:
          throw new Error(`Unknown report type: ${reportConfig.type}`);
      }

      // Store audit report
      await this.storeAuditReport(userId, auditReport);

      logger.info('Audit report generated successfully', { 
        userId, 
        reportType: reportConfig.type,
        reportId: auditReport.id
      });

      return {
        success: true,
        auditReport
      };
    } catch (error) {
      logger.error('Failed to generate audit report', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Check compliance policies
   */
  async checkCompliancePolicies(userId, auditLog) {
    try {
      const userPolicies = this.compliancePolicies.get(userId) || [];
      const violations = [];

      for (const policy of userPolicies) {
        const violation = await this.checkPolicyViolation(auditLog, policy);
        if (violation) {
          violations.push(violation);
        }
      }

      if (violations.length > 0) {
        await this.handlePolicyViolations(userId, violations);
      }

      return violations;
    } catch (error) {
      logger.error('Failed to check compliance policies', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLogEntry(userId, activityType, activityData) {
    try {
      const auditLog = {
        id: this.generateAuditLogId(),
        user_id: userId,
        activity_type: activityType,
        activity_data: activityData,
        timestamp: new Date().toISOString(),
        ip_address: activityData.ipAddress || 'unknown',
        user_agent: activityData.userAgent || 'unknown',
        session_id: activityData.sessionId || 'unknown',
        resource: activityData.resource || 'unknown',
        action: activityData.action || 'unknown',
        result: activityData.result || 'unknown',
        severity: this.calculateSeverity(activityType, activityData),
        compliance_status: 'pending'
      };

      return auditLog;
    } catch (error) {
      logger.error('Failed to create audit log entry', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Calculate severity
   */
  calculateSeverity(activityType, activityData) {
    try {
      // High severity activities
      const highSeverityActivities = [
        'user_provisioned',
        'user_suspended',
        'user_offboarded',
        'permission_granted',
        'permission_revoked',
        'role_assigned',
        'role_removed',
        'admin_access',
        'data_export',
        'data_deletion'
      ];

      // Medium severity activities
      const mediumSeverityActivities = [
        'user_activated',
        'user_reactivated',
        'permission_updated',
        'role_updated',
        'profile_updated',
        'password_changed',
        'login_success',
        'login_failure'
      ];

      // Low severity activities
      const lowSeverityActivities = [
        'login_attempt',
        'page_view',
        'search_performed',
        'report_generated',
        'data_viewed'
      ];

      if (highSeverityActivities.includes(activityType)) {
        return 'high';
      } else if (mediumSeverityActivities.includes(activityType)) {
        return 'medium';
      } else if (lowSeverityActivities.includes(activityType)) {
        return 'low';
      } else {
        return 'medium';
      }
    } catch (error) {
      logger.error('Failed to calculate severity', { error: error.message });
      return 'medium';
    }
  }

  /**
   * Store audit log
   */
  async storeAuditLog(userId, auditLog) {
    try {
      const { error } = await supabase
        .from('user_audit_logs')
        .insert(auditLog);

      if (error) throw error;

      // Update in-memory logs
      if (!this.auditLogs.has(userId)) {
        this.auditLogs.set(userId, []);
      }
      this.auditLogs.get(userId).unshift(auditLog);

      // Keep only recent logs
      const userLogs = this.auditLogs.get(userId);
      if (userLogs.length > 1000) {
        userLogs.splice(1000);
      }
    } catch (error) {
      logger.error('Failed to store audit log', { error: error.message, userId });
    }
  }

  /**
   * Fetch audit logs from database
   */
  async fetchAuditLogsFromDatabase(userId, auditFilters) {
    try {
      let query = supabase
        .from('user_audit_logs')
        .select('*')
        .eq('user_id', userId);

      // Apply filters
      if (auditFilters.startDate) {
        query = query.gte('timestamp', auditFilters.startDate);
      }
      if (auditFilters.endDate) {
        query = query.lte('timestamp', auditFilters.endDate);
      }
      if (auditFilters.activityType) {
        query = query.eq('activity_type', auditFilters.activityType);
      }
      if (auditFilters.severity) {
        query = query.eq('severity', auditFilters.severity);
      }
      if (auditFilters.resource) {
        query = query.eq('resource', auditFilters.resource);
      }

      query = query.order('timestamp', { ascending: false });

      if (auditFilters.limit) {
        query = query.limit(auditFilters.limit);
      }

      const { data: logs, error } = await query;

      if (error) throw error;

      return logs || [];
    } catch (error) {
      logger.error('Failed to fetch audit logs from database', { error: error.message, userId });
      return [];
    }
  }

  /**
   * Filter audit logs
   */
  async filterAuditLogs(auditLogs, auditFilters) {
    try {
      let filteredLogs = auditLogs;

      // Filter by text search
      if (auditFilters.search) {
        const searchTerm = auditFilters.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.activity_type.toLowerCase().includes(searchTerm) ||
          log.resource.toLowerCase().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm) ||
          (log.activity_data && JSON.stringify(log.activity_data).toLowerCase().includes(searchTerm))
        );
      }

      // Filter by compliance status
      if (auditFilters.complianceStatus) {
        filteredLogs = filteredLogs.filter(log => 
          log.compliance_status === auditFilters.complianceStatus
        );
      }

      // Filter by result
      if (auditFilters.result) {
        filteredLogs = filteredLogs.filter(log => 
          log.result === auditFilters.result
        );
      }

      return filteredLogs;
    } catch (error) {
      logger.error('Failed to filter audit logs', { error: error.message });
      return auditLogs;
    }
  }

  /**
   * Format audit logs
   */
  async formatAuditLogs(auditLogs) {
    try {
      return auditLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        activityType: log.activity_type,
        resource: log.resource,
        action: log.action,
        result: log.result,
        severity: log.severity,
        complianceStatus: log.compliance_status,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        sessionId: log.session_id,
        activityData: log.activity_data
      }));
    } catch (error) {
      logger.error('Failed to format audit logs', { error: error.message });
      return auditLogs;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(userId, reportConfig) {
    try {
      const startDate = reportConfig.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = reportConfig.endDate || new Date().toISOString();

      // Get compliance-related audit logs
      const complianceLogs = await this.fetchAuditLogsFromDatabase(userId, {
        startDate,
        endDate,
        complianceStatus: 'violation'
      });

      // Generate compliance metrics
      const complianceMetrics = await this.generateComplianceMetrics(complianceLogs);

      // Generate compliance recommendations
      const complianceRecommendations = await this.generateComplianceRecommendations(complianceLogs);

      const complianceReport = {
        id: this.generateReportId(),
        user_id: userId,
        type: 'compliance',
        start_date: startDate,
        end_date: endDate,
        generated_at: new Date().toISOString(),
        metrics: complianceMetrics,
        recommendations: complianceRecommendations,
        violations: complianceLogs,
        summary: {
          totalViolations: complianceLogs.length,
          criticalViolations: complianceLogs.filter(log => log.severity === 'high').length,
          mediumViolations: complianceLogs.filter(log => log.severity === 'medium').length,
          lowViolations: complianceLogs.filter(log => log.severity === 'low').length
        }
      };

      return complianceReport;
    } catch (error) {
      logger.error('Failed to generate compliance report', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(userId, reportConfig) {
    try {
      const startDate = reportConfig.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = reportConfig.endDate || new Date().toISOString();

      // Get security-related audit logs
      const securityLogs = await this.fetchAuditLogsFromDatabase(userId, {
        startDate,
        endDate,
        activityType: 'security'
      });

      // Generate security metrics
      const securityMetrics = await this.generateSecurityMetrics(securityLogs);

      // Generate security recommendations
      const securityRecommendations = await this.generateSecurityRecommendations(securityLogs);

      const securityReport = {
        id: this.generateReportId(),
        user_id: userId,
        type: 'security',
        start_date: startDate,
        end_date: endDate,
        generated_at: new Date().toISOString(),
        metrics: securityMetrics,
        recommendations: securityRecommendations,
        securityEvents: securityLogs,
        summary: {
          totalSecurityEvents: securityLogs.length,
          failedLogins: securityLogs.filter(log => log.activity_type === 'login_failure').length,
          successfulLogins: securityLogs.filter(log => log.activity_type === 'login_success').length,
          suspiciousActivities: securityLogs.filter(log => log.severity === 'high').length
        }
      };

      return securityReport;
    } catch (error) {
      logger.error('Failed to generate security report', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Generate access report
   */
  async generateAccessReport(userId, reportConfig) {
    try {
      const startDate = reportConfig.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = reportConfig.endDate || new Date().toISOString();

      // Get access-related audit logs
      const accessLogs = await this.fetchAuditLogsFromDatabase(userId, {
        startDate,
        endDate,
        activityType: 'access'
      });

      // Generate access metrics
      const accessMetrics = await this.generateAccessMetrics(accessLogs);

      // Generate access recommendations
      const accessRecommendations = await this.generateAccessRecommendations(accessLogs);

      const accessReport = {
        id: this.generateReportId(),
        user_id: userId,
        type: 'access',
        start_date: startDate,
        end_date: endDate,
        generated_at: new Date().toISOString(),
        metrics: accessMetrics,
        recommendations: accessRecommendations,
        accessEvents: accessLogs,
        summary: {
          totalAccessEvents: accessLogs.length,
          successfulAccess: accessLogs.filter(log => log.result === 'success').length,
          failedAccess: accessLogs.filter(log => log.result === 'failure').length,
          deniedAccess: accessLogs.filter(log => log.result === 'denied').length
        }
      };

      return accessReport;
    } catch (error) {
      logger.error('Failed to generate access report', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Generate activity report
   */
  async generateActivityReport(userId, reportConfig) {
    try {
      const startDate = reportConfig.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = reportConfig.endDate || new Date().toISOString();

      // Get all audit logs
      const activityLogs = await this.fetchAuditLogsFromDatabase(userId, {
        startDate,
        endDate
      });

      // Generate activity metrics
      const activityMetrics = await this.generateActivityMetrics(activityLogs);

      // Generate activity recommendations
      const activityRecommendations = await this.generateActivityRecommendations(activityLogs);

      const activityReport = {
        id: this.generateReportId(),
        user_id: userId,
        type: 'activity',
        start_date: startDate,
        end_date: endDate,
        generated_at: new Date().toISOString(),
        metrics: activityMetrics,
        recommendations: activityRecommendations,
        activities: activityLogs,
        summary: {
          totalActivities: activityLogs.length,
          activitiesByType: this.groupActivitiesByType(activityLogs),
          activitiesBySeverity: this.groupActivitiesBySeverity(activityLogs),
          activitiesByResult: this.groupActivitiesByResult(activityLogs)
        }
      };

      return activityReport;
    } catch (error) {
      logger.error('Failed to generate activity report', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Store audit report
   */
  async storeAuditReport(userId, auditReport) {
    try {
      const { error } = await supabase
        .from('user_audit_reports')
        .insert(auditReport);

      if (error) throw error;

      // Update in-memory reports
      if (!this.auditReports.has(userId)) {
        this.auditReports.set(userId, []);
      }
      this.auditReports.get(userId).unshift(auditReport);

      // Keep only recent reports
      const userReports = this.auditReports.get(userId);
      if (userReports.length > 100) {
        userReports.splice(100);
      }
    } catch (error) {
      logger.error('Failed to store audit report', { error: error.message, userId });
    }
  }

  /**
   * Generate audit log ID
   */
  generateAuditLogId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `AUDIT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate report ID
   */
  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `REPORT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Load audit rules
   */
  async loadAuditRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('user_audit_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.auditRules.set(userId, rules || []);
      logger.info('Audit rules loaded', { userId, ruleCount: rules?.length || 0 });
    } catch (error) {
      logger.error('Failed to load audit rules', { error: error.message, userId });
    }
  }

  /**
   * Load compliance policies
   */
  async loadCompliancePolicies(userId) {
    try {
      const { data: policies, error } = await supabase
        .from('user_compliance_policies')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      this.compliancePolicies.set(userId, policies || []);
      logger.info('Compliance policies loaded', { userId, policyCount: policies?.length || 0 });
    } catch (error) {
      logger.error('Failed to load compliance policies', { error: error.message, userId });
    }
  }

  /**
   * Load audit logs
   */
  async loadAuditLogs(userId) {
    try {
      const { data: logs, error } = await supabase
        .from('user_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.auditLogs.set(userId, logs || []);
      logger.info('Audit logs loaded', { userId, logCount: logs?.length || 0 });
    } catch (error) {
      logger.error('Failed to load audit logs', { error: error.message, userId });
    }
  }

  /**
   * Load audit reports
   */
  async loadAuditReports(userId) {
    try {
      const { data: reports, error } = await supabase
        .from('user_audit_reports')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.auditReports.set(userId, reports || []);
      logger.info('Audit reports loaded', { userId, reportCount: reports?.length || 0 });
    } catch (error) {
      logger.error('Failed to load audit reports', { error: error.message, userId });
    }
  }

  /**
   * Load audit metrics
   */
  async loadAuditMetrics(userId) {
    try {
      const { data: metrics, error } = await supabase
        .from('user_audit_metrics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      this.auditMetrics.set(userId, metrics || []);
      logger.info('Audit metrics loaded', { userId, metricCount: metrics?.length || 0 });
    } catch (error) {
      logger.error('Failed to load audit metrics', { error: error.message, userId });
    }
  }

  /**
   * Get audit metrics
   */
  async getAuditMetrics(userId) {
    try {
      const userLogs = this.auditLogs.get(userId) || [];
      const userReports = this.auditReports.get(userId) || [];

      const metrics = {
        totalLogs: userLogs.length,
        logsByType: this.groupLogsByType(userLogs),
        logsBySeverity: this.groupLogsBySeverity(userLogs),
        totalReports: userReports.length,
        reportsByType: this.groupReportsByType(userReports),
        auditTrends: this.analyzeAuditTrends(userLogs)
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get audit metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get audit insights
   */
  async getAuditInsights(userId) {
    try {
      const userLogs = this.auditLogs.get(userId) || [];
      const userReports = this.auditReports.get(userId) || [];

      const insights = {
        auditTrends: this.analyzeAuditTrends(userLogs),
        complianceAnalysis: this.analyzeComplianceAnalysis(userLogs),
        securityAnalysis: this.analyzeSecurityAnalysis(userLogs),
        recommendations: this.generateAuditRecommendations(userLogs, userReports)
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to get audit insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset audit system for user
   */
  async reset(userId) {
    try {
      this.auditLogs.delete(userId);
      this.auditRules.delete(userId);
      this.compliancePolicies.delete(userId);
      this.auditReports.delete(userId);
      this.auditMetrics.delete(userId);

      logger.info('Audit system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset audit system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
