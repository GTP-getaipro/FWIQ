/**
 * Security Compliance Reporting Service
 * Comprehensive compliance monitoring and reporting for FloWorx
 */

import { supabase } from './customSupabaseClient.js';
import { logger } from './logger.js';
import { securityManager } from './security.js';

export class SecurityComplianceReporting {
  constructor() {
    this.complianceFrameworks = {
      'gdpr': {
        name: 'General Data Protection Regulation (GDPR)',
        description: 'EU data protection and privacy regulation',
        requirements: [
          'data_protection_by_design',
          'consent_management',
          'data_subject_rights',
          'data_breach_notification',
          'privacy_impact_assessment',
          'data_minimization',
          'purpose_limitation',
          'storage_limitation',
          'accuracy',
          'confidentiality',
          'accountability'
        ]
      },
      'ccpa': {
        name: 'California Consumer Privacy Act (CCPA)',
        description: 'California state privacy law',
        requirements: [
          'consumer_rights',
          'data_collection_disclosure',
          'opt_out_rights',
          'data_deletion',
          'data_portability',
          'non_discrimination',
          'privacy_policy',
          'data_security'
        ]
      },
      'sox': {
        name: 'Sarbanes-Oxley Act (SOX)',
        description: 'Financial reporting and corporate governance',
        requirements: [
          'financial_reporting_accuracy',
          'internal_controls',
          'audit_trail',
          'data_integrity',
          'access_controls',
          'change_management',
          'risk_assessment',
          'compliance_monitoring'
        ]
      },
      'hipaa': {
        name: 'Health Insurance Portability and Accountability Act (HIPAA)',
        description: 'Healthcare data protection',
        requirements: [
          'administrative_safeguards',
          'physical_safeguards',
          'technical_safeguards',
          'privacy_rule',
          'breach_notification',
          'business_associate_agreements',
          'risk_assessment',
          'workforce_training'
        ]
      },
      'iso27001': {
        name: 'ISO/IEC 27001',
        description: 'Information security management system',
        requirements: [
          'information_security_policy',
          'risk_assessment',
          'risk_treatment',
          'security_controls',
          'monitoring_review',
          'continuous_improvement',
          'management_commitment',
          'resource_management'
        ]
      },
      'pci_dss': {
        name: 'Payment Card Industry Data Security Standard (PCI DSS)',
        description: 'Payment card data security',
        requirements: [
          'secure_network',
          'cardholder_data_protection',
          'vulnerability_management',
          'access_control',
          'network_monitoring',
          'security_policy',
          'regular_testing',
          'incident_response'
        ]
      }
    };
    
    this.complianceStatuses = {
      'compliant': 'Compliant',
      'non_compliant': 'Non-Compliant',
      'partially_compliant': 'Partially Compliant',
      'not_assessed': 'Not Assessed',
      'under_review': 'Under Review'
    };
    
    this.reportData = null;
    this.lastUpdated = null;
  }

  /**
   * Generate comprehensive compliance report
   * @param {string} userId - User ID
   * @param {Array} frameworks - Compliance frameworks to assess
   * @param {string} timeRange - Time range for assessment
   * @returns {Promise<Object>} Compliance report
   */
  async generateComplianceReport(userId, frameworks = ['gdpr', 'ccpa'], timeRange = '30d') {
    try {
      const dateFilter = this.getDateFilter(timeRange);
      
      // Get compliance data for each framework
      const frameworkAssessments = await Promise.all(
        frameworks.map(framework => this.assessFrameworkCompliance(userId, framework, dateFilter))
      );

      // Calculate overall compliance score
      const overallScore = this.calculateOverallComplianceScore(frameworkAssessments);
      
      // Generate compliance recommendations
      const recommendations = this.generateComplianceRecommendations(frameworkAssessments);
      
      // Get compliance violations
      const violations = await this.getComplianceViolations(userId, dateFilter);
      
      // Get compliance trends
      const trends = await this.getComplianceTrends(userId, timeRange);

      const report = {
        userId,
        frameworks: frameworkAssessments,
        overallScore,
        recommendations,
        violations,
        trends,
        timeRange,
        generatedAt: new Date().toISOString(),
        reportId: this.generateReportId()
      };

      this.reportData = report;
      this.lastUpdated = new Date();
      
      // Store report in database
      await this.storeComplianceReport(userId, report);
      
      logger.info('Compliance report generated', {
        userId,
        frameworks: frameworks.length,
        overallScore,
        violations: violations.length,
        reportId: report.reportId
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report', {
        userId,
        frameworks,
        timeRange,
        error: error.message
      });
      
      return this.getDefaultComplianceReport();
    }
  }

  /**
   * Assess compliance for a specific framework
   * @param {string} userId - User ID
   * @param {string} framework - Framework name
   * @param {Date} dateFilter - Date filter
   * @returns {Promise<Object>} Framework assessment
   */
  async assessFrameworkCompliance(userId, framework, dateFilter) {
    try {
      const frameworkConfig = this.complianceFrameworks[framework];
      if (!frameworkConfig) {
        throw new Error(`Unknown compliance framework: ${framework}`);
      }

      // Get compliance data for this framework
      const { data: complianceData, error } = await supabase
        .from('compliance_assessments')
        .select('*')
        .eq('user_id', userId)
        .eq('framework', framework)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Assess each requirement
      const requirementAssessments = await Promise.all(
        frameworkConfig.requirements.map(requirement => 
          this.assessRequirement(userId, framework, requirement, dateFilter)
        )
      );

      // Calculate framework score
      const frameworkScore = this.calculateFrameworkScore(requirementAssessments);
      
      // Determine compliance status
      const status = this.determineComplianceStatus(frameworkScore);

      return {
        framework,
        name: frameworkConfig.name,
        description: frameworkConfig.description,
        score: frameworkScore,
        status,
        requirements: requirementAssessments,
        lastAssessment: complianceData?.[0]?.created_at || null,
        assessmentCount: complianceData?.length || 0
      };
    } catch (error) {
      logger.error('Failed to assess framework compliance', {
        userId,
        framework,
        error: error.message
      });
      
      return {
        framework,
        name: this.complianceFrameworks[framework]?.name || framework,
        description: this.complianceFrameworks[framework]?.description || '',
        score: 0,
        status: 'not_assessed',
        requirements: [],
        lastAssessment: null,
        assessmentCount: 0
      };
    }
  }

  /**
   * Assess individual compliance requirement
   * @param {string} userId - User ID
   * @param {string} framework - Framework name
   * @param {string} requirement - Requirement name
   * @param {Date} dateFilter - Date filter
   * @returns {Promise<Object>} Requirement assessment
   */
  async assessRequirement(userId, framework, requirement, dateFilter) {
    try {
      // Get requirement-specific data
      const { data: requirementData, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('user_id', userId)
        .eq('framework', framework)
        .eq('requirement', requirement)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Assess requirement based on data and security status
      const assessment = this.performRequirementAssessment(requirement, requirementData);
      
      return {
        requirement,
        score: assessment.score,
        status: assessment.status,
        evidence: assessment.evidence,
        gaps: assessment.gaps,
        recommendations: assessment.recommendations,
        lastChecked: requirementData?.[0]?.created_at || null
      };
    } catch (error) {
      logger.error('Failed to assess requirement', {
        userId,
        framework,
        requirement,
        error: error.message
      });
      
      return {
        requirement,
        score: 0,
        status: 'not_assessed',
        evidence: [],
        gaps: ['Assessment failed'],
        recommendations: ['Review assessment process'],
        lastChecked: null
      };
    }
  }

  /**
   * Perform requirement assessment
   * @param {string} requirement - Requirement name
   * @param {Array} data - Requirement data
   * @returns {Object} Assessment result
   */
  performRequirementAssessment(requirement, data) {
    // This is a simplified assessment - in practice, this would be more sophisticated
    const securityStatus = securityManager.getSecurityStatus();
    
    let score = 0;
    let status = 'not_assessed';
    const evidence = [];
    const gaps = [];
    const recommendations = [];

    // Basic security requirements assessment
    switch (requirement) {
      case 'data_protection_by_design':
        if (securityStatus.basicSecurity?.cspConfigured) {
          score += 30;
          evidence.push('Content Security Policy configured');
        } else {
          gaps.push('Content Security Policy not configured');
        }
        
        if (securityStatus.advancedSecurity?.dataEncryption) {
          score += 40;
          evidence.push('Data encryption implemented');
        } else {
          gaps.push('Data encryption not implemented');
        }
        
        if (securityStatus.advancedSecurity?.auditLogging) {
          score += 30;
          evidence.push('Audit logging enabled');
        } else {
          gaps.push('Audit logging not enabled');
        }
        break;

      case 'access_controls':
        if (securityStatus.basicSecurity?.rateLimitingConfigured) {
          score += 50;
          evidence.push('Rate limiting configured');
        } else {
          gaps.push('Rate limiting not configured');
        }
        
        if (securityStatus.advancedSecurity?.securityMonitoring) {
          score += 50;
          evidence.push('Security monitoring active');
        } else {
          gaps.push('Security monitoring not active');
        }
        break;

      case 'data_security':
        if (securityStatus.basicSecurity?.sanitizationConfigured) {
          score += 60;
          evidence.push('Input sanitization configured');
        } else {
          gaps.push('Input sanitization not configured');
        }
        
        if (securityStatus.advancedSecurity?.threatDetection) {
          score += 40;
          evidence.push('Threat detection active');
        } else {
          gaps.push('Threat detection not active');
        }
        break;

      default:
        // Generic assessment for other requirements
        score = data?.length > 0 ? 50 : 0;
        if (score > 0) {
          evidence.push('Requirement data available');
        } else {
          gaps.push('No requirement data available');
        }
    }

    // Determine status based on score
    if (score >= 80) status = 'compliant';
    else if (score >= 50) status = 'partially_compliant';
    else if (score > 0) status = 'non_compliant';
    else status = 'not_assessed';

    // Generate recommendations based on gaps
    gaps.forEach(gap => {
      recommendations.push(`Address: ${gap}`);
    });

    return {
      score: Math.min(100, score),
      status,
      evidence,
      gaps,
      recommendations
    };
  }

  /**
   * Calculate framework compliance score
   * @param {Array} requirements - Requirement assessments
   * @returns {number} Framework score
   */
  calculateFrameworkScore(requirements) {
    if (requirements.length === 0) return 0;
    
    const totalScore = requirements.reduce((sum, req) => sum + req.score, 0);
    return Math.round(totalScore / requirements.length);
  }

  /**
   * Calculate overall compliance score
   * @param {Array} frameworks - Framework assessments
   * @returns {number} Overall score
   */
  calculateOverallComplianceScore(frameworks) {
    if (frameworks.length === 0) return 0;
    
    const totalScore = frameworks.reduce((sum, framework) => sum + framework.score, 0);
    return Math.round(totalScore / frameworks.length);
  }

  /**
   * Determine compliance status
   * @param {number} score - Compliance score
   * @returns {string} Compliance status
   */
  determineComplianceStatus(score) {
    if (score >= 90) return 'compliant';
    if (score >= 70) return 'partially_compliant';
    if (score >= 30) return 'non_compliant';
    return 'not_assessed';
  }

  /**
   * Generate compliance recommendations
   * @param {Array} frameworks - Framework assessments
   * @returns {Array} Recommendations
   */
  generateComplianceRecommendations(frameworks) {
    const recommendations = [];

    frameworks.forEach(framework => {
      if (framework.status === 'non_compliant') {
        recommendations.push({
          type: 'critical',
          framework: framework.framework,
          title: `${framework.name} Non-Compliance`,
          description: `${framework.name} compliance score is ${framework.score}%`,
          action: `Address compliance gaps in ${framework.name}`,
          priority: 'high'
        });
      } else if (framework.status === 'partially_compliant') {
        recommendations.push({
          type: 'warning',
          framework: framework.framework,
          title: `${framework.name} Partial Compliance`,
          description: `${framework.name} compliance score is ${framework.score}%`,
          action: `Improve compliance in ${framework.name}`,
          priority: 'medium'
        });
      }

      // Add requirement-specific recommendations
      framework.requirements.forEach(requirement => {
        if (requirement.status === 'non_compliant' && requirement.gaps.length > 0) {
          recommendations.push({
            type: 'info',
            framework: framework.framework,
            title: `${requirement.requirement} Non-Compliance`,
            description: requirement.gaps.join(', '),
            action: requirement.recommendations.join(', '),
            priority: 'medium'
          });
        }
      });
    });

    return recommendations;
  }

  /**
   * Get compliance violations
   * @param {string} userId - User ID
   * @param {Date} dateFilter - Date filter
   * @returns {Promise<Array>} Compliance violations
   */
  async getComplianceViolations(userId, dateFilter) {
    try {
      const { data: violations, error } = await supabase
        .from('compliance_violations')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return violations || [];
    } catch (error) {
      logger.error('Failed to get compliance violations', {
        userId,
        error: error.message
      });
      
      return [];
    }
  }

  /**
   * Get compliance trends
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range
   * @returns {Promise<Object>} Compliance trends
   */
  async getComplianceTrends(userId, timeRange) {
    try {
      const dateFilter = this.getDateFilter(timeRange);
      
      const { data: assessments, error } = await supabase
        .from('compliance_assessments')
        .select('framework, score, created_at')
        .eq('user_id', userId)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group assessments by framework and time
      const trends = {};
      
      assessments?.forEach(assessment => {
        const framework = assessment.framework;
        const date = new Date(assessment.created_at).toISOString().split('T')[0];
        
        if (!trends[framework]) {
          trends[framework] = {};
        }
        
        trends[framework][date] = assessment.score;
      });

      return trends;
    } catch (error) {
      logger.error('Failed to get compliance trends', {
        userId,
        timeRange,
        error: error.message
      });
      
      return {};
    }
  }

  /**
   * Store compliance report
   * @param {string} userId - User ID
   * @param {Object} report - Compliance report
   */
  async storeComplianceReport(userId, report) {
    try {
      const { error } = await supabase
        .from('compliance_reports')
        .insert({
          user_id: userId,
          report_id: report.reportId,
          frameworks: report.frameworks.map(f => f.framework),
          overall_score: report.overallScore,
          report_data: report,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to store compliance report', {
        userId,
        reportId: report.reportId,
        error: error.message
      });
    }
  }

  /**
   * Export compliance report
   * @param {string} format - Export format (json, pdf, csv)
   * @returns {Object} Exported report
   */
  exportComplianceReport(format = 'json') {
    if (!this.reportData) {
      throw new Error('No compliance report available. Generate a report first.');
    }

    switch (format) {
      case 'csv':
        return this.convertToCSV(this.reportData);
      case 'pdf':
        return this.convertToPDF(this.reportData);
      default:
        return this.reportData;
    }
  }

  /**
   * Convert report to CSV format
   * @param {Object} report - Compliance report
   * @returns {string} CSV data
   */
  convertToCSV(report) {
    const csvRows = [];
    
    // Add summary
    csvRows.push('Framework,Score,Status');
    report.frameworks.forEach(framework => {
      csvRows.push(`${framework.name},${framework.score},${framework.status}`);
    });
    
    csvRows.push('');
    csvRows.push(`Overall Score,${report.overallScore}`);
    
    return csvRows.join('\n');
  }

  /**
   * Convert report to PDF format (placeholder)
   * @param {Object} report - Compliance report
   * @returns {Object} PDF data placeholder
   */
  convertToPDF(report) {
    // In a real implementation, this would generate a PDF
    return {
      format: 'pdf',
      data: 'PDF generation not implemented',
      reportId: report.reportId,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate unique report ID
   * @returns {string} Report ID
   */
  generateReportId() {
    return `compliance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get date filter for time period
   * @param {string} timeRange - Time range
   * @returns {Date} Date filter
   */
  getDateFilter(timeRange) {
    const now = new Date();
    const filters = {
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      '1y': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };

    return filters[timeRange] || filters['30d'];
  }

  /**
   * Get default compliance report
   * @returns {Object} Default report
   */
  getDefaultComplianceReport() {
    return {
      userId: null,
      frameworks: [],
      overallScore: 0,
      recommendations: [],
      violations: [],
      trends: {},
      timeRange: '30d',
      generatedAt: new Date().toISOString(),
      reportId: this.generateReportId()
    };
  }

  /**
   * Get available compliance frameworks
   * @returns {Object} Available frameworks
   */
  getAvailableFrameworks() {
    return this.complianceFrameworks;
  }

  /**
   * Get compliance statuses
   * @returns {Object} Available statuses
   */
  getComplianceStatuses() {
    return this.complianceStatuses;
  }
}

// Export singleton instance
export const securityComplianceReporting = new SecurityComplianceReporting();

export default SecurityComplianceReporting;
