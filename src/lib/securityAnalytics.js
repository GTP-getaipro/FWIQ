/**
 * Security Analytics System
 * 
 * Handles security analytics, reporting, and insights
 * for threat detection, incidents, compliance, and encryption.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class SecurityAnalytics {
  constructor() {
    this.analyticsData = new Map();
    this.threatAnalytics = new Map();
    this.incidentAnalytics = new Map();
    this.complianceAnalytics = new Map();
    this.encryptionAnalytics = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize analytics system
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Security Analytics', { userId });

      // Load analytics data
      await this.loadAnalyticsData(userId);
      await this.loadThreatAnalytics(userId);
      await this.loadIncidentAnalytics(userId);
      await this.loadComplianceAnalytics(userId);
      await this.loadEncryptionAnalytics(userId);

      this.isInitialized = true;
      logger.info('Security Analytics initialized', { userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize Security Analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Record threat detection
   */
  async recordThreatDetection(userId, threatAnalysis) {
    try {
      const threatData = {
        user_id: userId,
        threat_type: threatAnalysis.threatType,
        threat_level: threatAnalysis.threatLevel,
        threats_detected: threatAnalysis.threatsDetected,
        detection_method: threatAnalysis.detectionMethod,
        confidence_score: threatAnalysis.confidenceScore,
        timestamp: new Date().toISOString()
      };

      // Store threat detection data
      const { error } = await supabase
        .from('security_threat_analytics')
        .insert(threatData);

      if (error) throw error;

      // Update in-memory analytics
      if (!this.threatAnalytics.has(userId)) {
        this.threatAnalytics.set(userId, []);
      }
      this.threatAnalytics.get(userId).push(threatData);

      logger.info('Threat detection recorded', { userId, threatType: threatAnalysis.threatType });
    } catch (error) {
      logger.error('Failed to record threat detection', { error: error.message, userId });
    }
  }

  /**
   * Record normal event
   */
  async recordNormalEvent(userId, eventData) {
    try {
      const normalEvent = {
        user_id: userId,
        event_type: eventData.type,
        event_data: eventData,
        timestamp: new Date().toISOString()
      };

      // Store normal event data
      const { error } = await supabase
        .from('security_normal_events')
        .insert(normalEvent);

      if (error) throw error;

      logger.info('Normal event recorded', { userId, eventType: eventData.type });
    } catch (error) {
      logger.error('Failed to record normal event', { error: error.message, userId });
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
        incident_severity: incidentResponse.severity,
        incident_status: incidentResponse.status,
        response_time: incidentResponse.responseTime,
        resolution_time: incidentResponse.resolutionTime,
        incident_data: incidentData,
        incident_response: incidentResponse,
        timestamp: new Date().toISOString()
      };

      // Store incident data
      const { error } = await supabase
        .from('security_incident_analytics')
        .insert(incident);

      if (error) throw error;

      // Update in-memory analytics
      if (!this.incidentAnalytics.has(userId)) {
        this.incidentAnalytics.set(userId, []);
      }
      this.incidentAnalytics.get(userId).push(incident);

      logger.info('Incident recorded', { userId, incidentType: incidentData.type });
    } catch (error) {
      logger.error('Failed to record incident', { error: error.message, userId });
    }
  }

  /**
   * Record encryption operation
   */
  async recordEncryptionOperation(userId, encryptionType, encryptionResult) {
    try {
      const encryptionData = {
        user_id: userId,
        encryption_type: encryptionType,
        operation_type: 'encryption',
        key_id: encryptionResult.keyId,
        data_size: encryptionResult.metadata.dataSize,
        encrypted_size: encryptionResult.metadata.encryptedSize,
        algorithm: encryptionResult.metadata.algorithm,
        timestamp: new Date().toISOString()
      };

      // Store encryption data
      const { error } = await supabase
        .from('security_encryption_analytics')
        .insert(encryptionData);

      if (error) throw error;

      // Update in-memory analytics
      if (!this.encryptionAnalytics.has(userId)) {
        this.encryptionAnalytics.set(userId, []);
      }
      this.encryptionAnalytics.get(userId).push(encryptionData);

      logger.info('Encryption operation recorded', { userId, encryptionType });
    } catch (error) {
      logger.error('Failed to record encryption operation', { error: error.message, userId });
    }
  }

  /**
   * Record decryption operation
   */
  async recordDecryptionOperation(userId, keyId, decryptionResult) {
    try {
      const decryptionData = {
        user_id: userId,
        operation_type: 'decryption',
        key_id: keyId,
        algorithm: decryptionResult.metadata.algorithm,
        timestamp: new Date().toISOString()
      };

      // Store decryption data
      const { error } = await supabase
        .from('security_encryption_analytics')
        .insert(decryptionData);

      if (error) throw error;

      // Update in-memory analytics
      if (!this.encryptionAnalytics.has(userId)) {
        this.encryptionAnalytics.set(userId, []);
      }
      this.encryptionAnalytics.get(userId).push(decryptionData);

      logger.info('Decryption operation recorded', { userId, keyId });
    } catch (error) {
      logger.error('Failed to record decryption operation', { error: error.message, userId });
    }
  }

  /**
   * Get threat analytics
   */
  async getThreatAnalytics(userId) {
    try {
      const threatData = this.threatAnalytics.get(userId) || [];

      const analytics = {
        totalThreats: threatData.length,
        threatsByType: this.groupThreatsByType(threatData),
        threatsByLevel: this.groupThreatsByLevel(threatData),
        threatTrends: this.analyzeThreatTrends(threatData),
        detectionEffectiveness: this.analyzeDetectionEffectiveness(threatData),
        topThreatSources: this.analyzeTopThreatSources(threatData),
        threatPatterns: this.analyzeThreatPatterns(threatData)
      };

      return {
        success: true,
        analytics
      };
    } catch (error) {
      logger.error('Failed to get threat analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get incident analytics
   */
  async getIncidentAnalytics(userId) {
    try {
      const incidentData = this.incidentAnalytics.get(userId) || [];

      const analytics = {
        totalIncidents: incidentData.length,
        incidentsByType: this.groupIncidentsByType(incidentData),
        incidentsBySeverity: this.groupIncidentsBySeverity(incidentData),
        incidentsByStatus: this.groupIncidentsByStatus(incidentData),
        incidentTrends: this.analyzeIncidentTrends(incidentData),
        responseTimeAnalysis: this.analyzeResponseTimes(incidentData),
        resolutionTimeAnalysis: this.analyzeResolutionTimes(incidentData),
        incidentPatterns: this.analyzeIncidentPatterns(incidentData)
      };

      return {
        success: true,
        analytics
      };
    } catch (error) {
      logger.error('Failed to get incident analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get compliance analytics
   */
  async getComplianceAnalytics(userId) {
    try {
      const complianceData = this.complianceAnalytics.get(userId) || [];

      const analytics = {
        totalComplianceEvents: complianceData.length,
        complianceByType: this.groupComplianceByType(complianceData),
        complianceTrends: this.analyzeComplianceTrends(complianceData),
        violationAnalysis: this.analyzeViolations(complianceData),
        complianceScore: this.calculateComplianceScore(complianceData),
        auditFrequency: this.analyzeAuditFrequency(complianceData),
        complianceRecommendations: this.generateComplianceRecommendations(complianceData)
      };

      return {
        success: true,
        analytics
      };
    } catch (error) {
      logger.error('Failed to get compliance analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get encryption analytics
   */
  async getEncryptionAnalytics(userId) {
    try {
      const encryptionData = this.encryptionAnalytics.get(userId) || [];

      const analytics = {
        totalOperations: encryptionData.length,
        operationsByType: this.groupOperationsByType(encryptionData),
        operationsByAlgorithm: this.groupOperationsByAlgorithm(encryptionData),
        encryptionTrends: this.analyzeEncryptionTrends(encryptionData),
        keyUsageAnalysis: this.analyzeKeyUsage(encryptionData),
        performanceAnalysis: this.analyzeEncryptionPerformance(encryptionData),
        securityAnalysis: this.analyzeEncryptionSecurity(encryptionData)
      };

      return {
        success: true,
        analytics
      };
    } catch (error) {
      logger.error('Failed to get encryption analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate security insights
   */
  async generateSecurityInsights(userId) {
    try {
      const threatAnalytics = await this.getThreatAnalytics(userId);
      const incidentAnalytics = await this.getIncidentAnalytics(userId);
      const complianceAnalytics = await this.getComplianceAnalytics(userId);
      const encryptionAnalytics = await this.getEncryptionAnalytics(userId);

      const insights = {
        overallSecurityScore: this.calculateOverallSecurityScore(
          threatAnalytics.analytics,
          incidentAnalytics.analytics,
          complianceAnalytics.analytics,
          encryptionAnalytics.analytics
        ),
        securityTrends: this.analyzeSecurityTrends(
          threatAnalytics.analytics,
          incidentAnalytics.analytics,
          complianceAnalytics.analytics
        ),
        riskAssessment: this.performRiskAssessment(
          threatAnalytics.analytics,
          incidentAnalytics.analytics,
          complianceAnalytics.analytics
        ),
        recommendations: this.generateSecurityRecommendations(
          threatAnalytics.analytics,
          incidentAnalytics.analytics,
          complianceAnalytics.analytics,
          encryptionAnalytics.analytics
        ),
        alerts: this.generateSecurityAlerts(
          threatAnalytics.analytics,
          incidentAnalytics.analytics,
          complianceAnalytics.analytics
        )
      };

      return {
        success: true,
        insights
      };
    } catch (error) {
      logger.error('Failed to generate security insights', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Group threats by type
   */
  groupThreatsByType(threatData) {
    const grouped = {};
    threatData.forEach(threat => {
      if (!grouped[threat.threat_type]) {
        grouped[threat.threat_type] = 0;
      }
      grouped[threat.threat_type]++;
    });
    return grouped;
  }

  /**
   * Group threats by level
   */
  groupThreatsByLevel(threatData) {
    const grouped = {};
    threatData.forEach(threat => {
      if (!grouped[threat.threat_level]) {
        grouped[threat.threat_level] = 0;
      }
      grouped[threat.threat_level]++;
    });
    return grouped;
  }

  /**
   * Analyze threat trends
   */
  analyzeThreatTrends(threatData) {
    if (threatData.length < 2) return { trend: 'insufficient_data' };

    const recentThreats = threatData.slice(0, 7); // Last 7 days
    const olderThreats = threatData.slice(7, 14); // Previous 7 days

    const recentCount = recentThreats.length;
    const olderCount = olderThreats.length;

    if (recentCount > olderCount) {
      return { trend: 'increasing', change: ((recentCount - olderCount) / olderCount * 100).toFixed(1) };
    } else if (recentCount < olderCount) {
      return { trend: 'decreasing', change: ((olderCount - recentCount) / olderCount * 100).toFixed(1) };
    } else {
      return { trend: 'stable', change: 0 };
    }
  }

  /**
   * Group incidents by type
   */
  groupIncidentsByType(incidentData) {
    const grouped = {};
    incidentData.forEach(incident => {
      if (!grouped[incident.incident_type]) {
        grouped[incident.incident_type] = 0;
      }
      grouped[incident.incident_type]++;
    });
    return grouped;
  }

  /**
   * Group incidents by severity
   */
  groupIncidentsBySeverity(incidentData) {
    const grouped = {};
    incidentData.forEach(incident => {
      if (!grouped[incident.incident_severity]) {
        grouped[incident.incident_severity] = 0;
      }
      grouped[incident.incident_severity]++;
    });
    return grouped;
  }

  /**
   * Group incidents by status
   */
  groupIncidentsByStatus(incidentData) {
    const grouped = {};
    incidentData.forEach(incident => {
      if (!grouped[incident.incident_status]) {
        grouped[incident.incident_status] = 0;
      }
      grouped[incident.incident_status]++;
    });
    return grouped;
  }

  /**
   * Analyze incident trends
   */
  analyzeIncidentTrends(incidentData) {
    if (incidentData.length < 2) return { trend: 'insufficient_data' };

    const recentIncidents = incidentData.slice(0, 7);
    const olderIncidents = incidentData.slice(7, 14);

    const recentCount = recentIncidents.length;
    const olderCount = olderIncidents.length;

    if (recentCount > olderCount) {
      return { trend: 'increasing', change: ((recentCount - olderCount) / olderCount * 100).toFixed(1) };
    } else if (recentCount < olderCount) {
      return { trend: 'decreasing', change: ((olderCount - recentCount) / olderCount * 100).toFixed(1) };
    } else {
      return { trend: 'stable', change: 0 };
    }
  }

  /**
   * Group operations by type
   */
  groupOperationsByType(encryptionData) {
    const grouped = {};
    encryptionData.forEach(operation => {
      if (!grouped[operation.operation_type]) {
        grouped[operation.operation_type] = 0;
      }
      grouped[operation.operation_type]++;
    });
    return grouped;
  }

  /**
   * Group operations by algorithm
   */
  groupOperationsByAlgorithm(encryptionData) {
    const grouped = {};
    encryptionData.forEach(operation => {
      if (!grouped[operation.algorithm]) {
        grouped[operation.algorithm] = 0;
      }
      grouped[operation.algorithm]++;
    });
    return grouped;
  }

  /**
   * Calculate overall security score
   */
  calculateOverallSecurityScore(threatAnalytics, incidentAnalytics, complianceAnalytics, encryptionAnalytics) {
    let score = 100;

    // Deduct points for threats
    const threatCount = threatAnalytics.totalThreats;
    score -= Math.min(threatCount * 2, 20);

    // Deduct points for incidents
    const incidentCount = incidentAnalytics.totalIncidents;
    score -= Math.min(incidentCount * 5, 30);

    // Deduct points for compliance violations
    const violationCount = complianceAnalytics.violationAnalysis?.totalViolations || 0;
    score -= Math.min(violationCount * 3, 25);

    // Deduct points for encryption issues
    const encryptionIssues = encryptionAnalytics.securityAnalysis?.issues || 0;
    score -= Math.min(encryptionIssues * 2, 15);

    return Math.max(score, 0);
  }

  /**
   * Load analytics data
   */
  async loadAnalyticsData(userId) {
    try {
      const { data: analytics, error } = await supabase
        .from('security_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.analyticsData.set(userId, analytics || []);
      logger.info('Analytics data loaded', { userId, dataCount: analytics?.length || 0 });
    } catch (error) {
      logger.error('Failed to load analytics data', { error: error.message, userId });
    }
  }

  /**
   * Load threat analytics
   */
  async loadThreatAnalytics(userId) {
    try {
      const { data: threats, error } = await supabase
        .from('security_threat_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.threatAnalytics.set(userId, threats || []);
      logger.info('Threat analytics loaded', { userId, threatCount: threats?.length || 0 });
    } catch (error) {
      logger.error('Failed to load threat analytics', { error: error.message, userId });
    }
  }

  /**
   * Load incident analytics
   */
  async loadIncidentAnalytics(userId) {
    try {
      const { data: incidents, error } = await supabase
        .from('security_incident_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.incidentAnalytics.set(userId, incidents || []);
      logger.info('Incident analytics loaded', { userId, incidentCount: incidents?.length || 0 });
    } catch (error) {
      logger.error('Failed to load incident analytics', { error: error.message, userId });
    }
  }

  /**
   * Load compliance analytics
   */
  async loadComplianceAnalytics(userId) {
    try {
      const { data: compliance, error } = await supabase
        .from('security_compliance_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.complianceAnalytics.set(userId, compliance || []);
      logger.info('Compliance analytics loaded', { userId, complianceCount: compliance?.length || 0 });
    } catch (error) {
      logger.error('Failed to load compliance analytics', { error: error.message, userId });
    }
  }

  /**
   * Load encryption analytics
   */
  async loadEncryptionAnalytics(userId) {
    try {
      const { data: encryption, error } = await supabase
        .from('security_encryption_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      this.encryptionAnalytics.set(userId, encryption || []);
      logger.info('Encryption analytics loaded', { userId, encryptionCount: encryption?.length || 0 });
    } catch (error) {
      logger.error('Failed to load encryption analytics', { error: error.message, userId });
    }
  }

  /**
   * Reset analytics system for user
   */
  async reset(userId) {
    try {
      this.analyticsData.delete(userId);
      this.threatAnalytics.delete(userId);
      this.incidentAnalytics.delete(userId);
      this.complianceAnalytics.delete(userId);
      this.encryptionAnalytics.delete(userId);

      logger.info('Analytics system reset', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to reset analytics system', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}
