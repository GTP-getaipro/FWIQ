/**
 * Security Compliance Monitoring System
 * 
 * Handles security compliance monitoring, policy enforcement,
 * and regulatory compliance tracking.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class SecurityCompliance {
  constructor() {
    this.compliancePolicies = new Map();
    this.complianceViolations = new Map();
    this.auditLogs = new Map();
    this.complianceMetrics = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize compliance monitoring system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Security Compliance', { userId });

      // Load compliance policies and data
      await this.loadCompliancePolicies(userId);
      await this.loadComplianceViolations(userId);
      await this.loadAuditLogs(userId);

      this.isInitialized = true;
      logger.info('Security Compliance initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Security Compliance', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Check compliance status
   */
  async checkCompliance(userId, complianceType = null) {
    try {
      logger.info('Checking compliance status', { userId, complianceType });

      const policies = this.compliancePolicies.get(userId) || [];
      const relevantPolicies = complianceType ? 
        policies.filter(policy => policy.compliance_type === complianceType) :
        policies;

      const complianceResults = [];

      for (const policy of relevantPolicies) {
        const result = await this.evaluatePolicyCompliance(userId, policy);
        complianceResults.push(result);
      }

      const overallCompliance = this.calculateOverallCompliance(complianceResults);

      return {
        success: true,
        complianceStatus: overallCompliance.status,
        complianceScore: overallCompliance.score,
        policyResults: complianceResults,
        violations: complianceResults.filter(result => !result.compliant),
        recommendations: this.generateComplianceRecommendations(complianceResults)
      };
    } catch (error) {
      logger.error('Failed to check compliance', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Record security event
   */
  async recordSecurityEvent(userId, eventData, threatAnalysis) {
    try {
      const event = {
        user_id: userId,
        event_type: eventData.type,
        event_data: eventData,
        threat_level: threatAnalysis.threatLevel,
        threats_detected: threatAnalysis.threatsDetected,
        compliance_impact: this.assessComplianceImpact(eventData, threatAnalysis),
        timestamp: new Date().toISOString()
      };

      // Store security event
      const { error } = await supabase
        .from('security_events')
        .insert(event);

      if (error) throw error;

      // Update audit logs
      await this.updateAuditLog(userId, 'security_event', event);

      // Check for compliance violations
      await this.checkForViolations(userId, event);

      logger.info('Security event recorded', { userId, eventType: eventData.type });
    } catch (error) {
      logger.error('Failed to record security event', { error: error.message, userId });
    }
  }

  /**
   * Record incident
   */
  async recordIncident(userId, incidentData, incidentResponse) {
    try {
      const incident = {
        user_id: userId,
        incident_type: incidentData.type,
        incident_data: incidentData,
        incident_response: incidentResponse,
        compliance_impact: this.assessIncidentComplianceImpact(incidentData),
        timestamp: new Date().toISOString()
      };

      // Store incident
      const { error } = await supabase
        .from('security_incidents')
        .insert(incident);

      if (error) throw error;

      // Update audit logs
      await this.updateAuditLog(userId, 'security_incident', incident);

      // Check for compliance violations
      await this.checkForViolations(userId, incident);

      logger.info('Security incident recorded', { userId, incidentType: incidentData.type });
    } catch (error) {
      logger.error('Failed to record incident', { error: error.message, userId });
    }
  }

  /**
   * Get compliance metrics
   */
  async getComplianceMetrics(userId) {
    try {
      const policies = this.compliancePolicies.get(userId) || [];
      const violations = this.complianceViolations.get(userId) || [];
      const auditLogs = this.auditLogs.get(userId) || [];

      const metrics = {
        totalPolicies: policies.length,
        activePolicies: policies.filter(policy => policy.active).length,
        complianceScore: this.calculateComplianceScore(policies, violations),
        totalViolations: violations.length,
        unresolvedViolations: violations.filter(violation => !violation.resolved).length,
        violationsByType: this.groupViolationsByType(violations),
        violationsBySeverity: this.groupViolationsBySeverity(violations),
        auditEvents: auditLogs.length,
        lastAuditDate: auditLogs.length > 0 ? auditLogs[0].timestamp : null
      };

      return {
        success: true,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get compliance metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get compliance violations
   */
  async getComplianceViolations(userId) {
    try {
      const violations = this.complianceViolations.get(userId) || [];
      
      const violationsByStatus = {
        unresolved: violations.filter(violation => !violation.resolved),
        resolved: violations.filter(violation => violation.resolved),
        critical: violations.filter(violation => violation.severity === 'critical'),
        high: violations.filter(violation => violation.severity === 'high'),
        medium: violations.filter(violation => violation.severity === 'medium'),
        low: violations.filter(violation => violation.severity === 'low')
      };

      return {
        success: true,
        violations: violationsByStatus,
        totalViolations: violations.length
      };
    } catch (error) {
      logger.error('Failed to get compliance violations', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get compliance recommendations
   */
  async getComplianceRecommendations(userId) {
    try {
      const policies = this.compliancePolicies.get(userId) || [];
      const violations = this.complianceViolations.get(userId) || [];
      const auditLogs = this.auditLogs.get(userId) || [];

      const recommendations = [];

      // Policy-based recommendations
      const inactivePolicies = policies.filter(policy => !policy.active);
      if (inactivePolicies.length > 0) {
        recommendations.push({
          type: 'policy_activation',
          priority: 'medium',
          message: `${inactivePolicies.length} compliance policies are inactive`,
          action: 'Activate inactive policies to improve compliance coverage'
        });
      }

      // Violation-based recommendations
      const unresolvedViolations = violations.filter(violation => !violation.resolved);
      if (unresolvedViolations.length > 0) {
        recommendations.push({
          type: 'violation_resolution',
          priority: 'high',
          message: `${unresolvedViolations.length} compliance violations are unresolved`,
          action: 'Resolve outstanding violations to maintain compliance'
        });
      }

      // Audit-based recommendations
      const recentAudits = auditLogs.filter(log => 
        new Date(log.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      if (recentAudits.length === 0) {
        recommendations.push({
          type: 'audit_frequency',
          priority: 'low',
          message: 'No recent audit activities detected',
          action: 'Conduct regular security audits to ensure compliance'
        });
      }

      return {
        success: true,
        recommendations
      };
    } catch (error) {
      logger.error('Failed to get compliance recommendations', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get incident compliance impact
   */
  async getIncidentComplianceImpact(userId, incidentData) {
    try {
      const policies = this.compliancePolicies.get(userId) || [];
      const violations = this.complianceViolations.get(userId) || [];

      const impact = {
        affectedPolicies: [],
        newViolations: [],
        complianceScoreImpact: 0,
        regulatoryImpact: []
      };

      // Check which policies are affected by the incident
      for (const policy of policies) {
        if (this.isPolicyAffectedByIncident(policy, incidentData)) {
          impact.affectedPolicies.push(policy);
          
          // Check if this creates a new violation
          const existingViolation = violations.find(violation => 
            violation.policy_id === policy.id && 
            violation.incident_id === incidentData.id
          );

          if (!existingViolation) {
            const newViolation = {
              policy_id: policy.id,
              incident_id: incidentData.id,
              violation_type: 'incident_related',
              severity: this.determineViolationSeverity(policy, incidentData),
              description: `Incident ${incidentData.type} violates policy ${policy.name}`,
              created_at: new Date().toISOString()
            };
            impact.newViolations.push(newViolation);
          }
        }
      }

      // Calculate compliance score impact
      impact.complianceScoreImpact = this.calculateComplianceScoreImpact(impact.newViolations);

      return impact;
    } catch (error) {
      logger.error('Failed to get incident compliance impact', { error: error.message, userId });
      return { affectedPolicies: [], newViolations: [], complianceScoreImpact: 0 };
    }
  }

  /**
   * Evaluate policy compliance
   */
  async evaluatePolicyCompliance(userId, policy) {
    try {
      const violations = this.complianceViolations.get(userId) || [];
      const policyViolations = violations.filter(violation => 
        violation.policy_id === policy.id && !violation.resolved
      );

      const complianceScore = this.calculatePolicyComplianceScore(policy, policyViolations);
      const isCompliant = complianceScore >= policy.compliance_threshold;

      return {
        policyId: policy.id,
        policyName: policy.name,
        complianceType: policy.compliance_type,
        compliant: isCompliant,
        complianceScore,
        violations: policyViolations,
        lastEvaluated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to evaluate policy compliance', { error: error.message, policyId: policy.id });
      return {
        policyId: policy.id,
        policyName: policy.name,
        compliant: false,
        complianceScore: 0,
        violations: [],
        error: error.message
      };
    }
  }

  /**
   * Check for violations
   */
  async checkForViolations(userId, event) {
    try {
      const policies = this.compliancePolicies.get(userId) || [];
      
      for (const policy of policies) {
        if (this.isEventViolation(policy, event)) {
          const violation = {
            user_id: userId,
            policy_id: policy.id,
            violation_type: 'event_triggered',
            severity: this.determineViolationSeverity(policy, event),
            description: `Event ${event.event_type} violates policy ${policy.name}`,
            event_data: event,
            created_at: new Date().toISOString()
          };

          // Store violation
          const { error } = await supabase
            .from('security_compliance_violations')
            .insert(violation);

          if (error) throw error;

          // Update in-memory violations
          if (!this.complianceViolations.has(userId)) {
            this.complianceViolations.set(userId, []);
          }
          this.complianceViolations.get(userId).push(violation);
        }
      }
    } catch (error) {
      logger.error('Failed to check for violations', { error: error.message, userId });
    }
  }

  /**
   * Update audit log
   */
  async updateAuditLog(userId, action, data) {
    try {
      const auditEntry = {
        user_id: userId,
        action,
        data,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('security_audit_logs')
        .insert(auditEntry);

      if (error) throw error;

      // Update in-memory audit logs
      if (!this.auditLogs.has(userId)) {
        this.auditLogs.set(userId, []);
      }
      this.auditLogs.get(userId).unshift(auditEntry);

      // Keep only recent audit logs
      const userAuditLogs = this.auditLogs.get(userId);
      if (userAuditLogs.length > 1000) {
        userAuditLogs.splice(1000);
      }
    } catch (error) {
      logger.error('Failed to update audit log', { error: error.message, userId });
    }
  }

  /**
   * Load compliance policies
   */
  async loadCompliancePolicies(userId) {
    try {
      const { data: policies, error } = await supabase
        .from('security_compliance_policies')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      this.compliancePolicies.set(userId, policies || []);
      logger.info('Compliance policies loaded', { userId, policyCount: policies?.length || 0 });
    } catch (error) {
      logger.error('Failed to load compliance policies', { error: error.message, userId });
    }
  }

  /**
   * Load compliance violations
   */
  async loadComplianceViolations(userId) {
    try {
      const { data: violations, error } = await supabase
        .from('security_compliance_violations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.complianceViolations.set(userId, violations || []);
      logger.info('Compliance violations loaded', { userId, violationCount: violations?.length || 0 });
    } catch (error) {
      logger.error('Failed to load compliance violations', { error: error.message, userId });
    }
  }

  /**
   * Load audit logs
   */
  async loadAuditLogs(userId) {
    try {
      const { data: logs, error } = await supabase
        .from('security_audit_logs')
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
   * Reset compliance system for user
   */
  async reset(userId) {
    try {
      this.compliancePolicies.delete(userId);
      this.complianceViolations.delete(userId);
      this.auditLogs.delete(userId);
      this.complianceMetrics.delete(userId);

      logger.info('Compliance system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset compliance system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
