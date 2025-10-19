/**
 * Advanced Threat Detection System
 * 
 * Core engine for advanced threat detection, incident response,
 * compliance monitoring, and encryption features.
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';
import { AdvancedThreatDetection } from './advancedThreatDetection.js';
import { SecurityIncidentResponse } from './securityIncidentResponse.js';
import { SecurityCompliance } from './securityCompliance.js';
import { AdvancedEncryption } from './advancedEncryption.js';
import { SecurityAnalytics } from './securityAnalytics.js';

export class AdvancedSecurityEngine {
  constructor() {
    this.threatDetectionRules = new Map();
    this.incidentResponsePlans = new Map();
    this.compliancePolicies = new Map();
    this.encryptionKeys = new Map();
    this.securityMetrics = new Map();
    this.isInitialized = false;
    
    // Initialize integrated components
    this.threatDetection = new AdvancedThreatDetection();
    this.incidentResponse = new SecurityIncidentResponse();
    this.compliance = new SecurityCompliance();
    this.encryption = new AdvancedEncryption();
    this.analytics = new SecurityAnalytics();
  }

  /**
   * Initialize the advanced security engine
   */
  async initialize(userId) {
    try {
      logger.info('Initializing Advanced Security Engine', { userId });

      // Initialize all components
      await this.threatDetection.initialize(userId);
      await this.incidentResponse.initialize(userId);
      await this.compliance.initialize(userId);
      await this.encryption.initialize(userId);
      await this.analytics.initialize(userId);

      // Load existing security configurations
      await this.loadThreatDetectionRules(userId);
      await this.loadIncidentResponsePlans(userId);
      await this.loadCompliancePolicies(userId);
      await this.loadEncryptionKeys(userId);

      this.isInitialized = true;
      logger.info('Advanced Security Engine initialized successfully', { userId });

      return { success: true, message: 'Advanced Security Engine initialized' };
    } catch (error) {
      logger.error('Failed to initialize Advanced Security Engine', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect and analyze security threats
   */
  async detectThreats(userId, eventData) {
    try {
      if (!this.isInitialized) {
        await this.initialize(userId);
      }

      logger.info('Detecting security threats', { userId, eventType: eventData.type });

      // Analyze event for threats
      const threatAnalysis = await this.threatDetection.analyzeEvent(userId, eventData);

      // If threats detected, trigger incident response
      if (threatAnalysis.threatsDetected.length > 0) {
        const incidentResponse = await this.incidentResponse.handleIncident(userId, threatAnalysis);
        
        // Update compliance monitoring
        await this.compliance.recordSecurityEvent(userId, eventData, threatAnalysis);

        // Update analytics
        await this.analytics.recordThreatDetection(userId, threatAnalysis);

        logger.warn('Security threats detected and incident response triggered', { 
          userId, 
          threatCount: threatAnalysis.threatsDetected.length,
          incidentId: incidentResponse.incidentId
        });

        return {
          success: true,
          threatsDetected: threatAnalysis.threatsDetected,
          incidentResponse,
          complianceStatus: await this.compliance.getComplianceStatus(userId),
          recommendations: threatAnalysis.recommendations
        };
      }

      // Update analytics for normal events
      await this.analytics.recordNormalEvent(userId, eventData);

      return {
        success: true,
        threatsDetected: [],
        message: 'No threats detected'
      };
    } catch (error) {
      logger.error('Failed to detect threats', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle security incident
   */
  async handleIncident(userId, incidentData) {
    try {
      logger.info('Handling security incident', { userId, incidentType: incidentData.type });

      const incidentResponse = await this.incidentResponse.handleIncident(userId, incidentData);

      // Update compliance monitoring
      await this.compliance.recordIncident(userId, incidentData, incidentResponse);

      // Update analytics
      await this.analytics.recordIncident(userId, incidentData, incidentResponse);

      logger.info('Security incident handled', { 
        userId, 
        incidentId: incidentResponse.incidentId,
        responseStatus: incidentResponse.status
      });

      return {
        success: true,
        incidentResponse,
        complianceImpact: await this.compliance.getIncidentComplianceImpact(userId, incidentData)
      };
    } catch (error) {
      logger.error('Failed to handle incident', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitor security compliance
   */
  async monitorCompliance(userId, complianceType = null) {
    try {
      logger.info('Monitoring security compliance', { userId, complianceType });

      const complianceStatus = await this.compliance.checkCompliance(userId, complianceType);
      const complianceMetrics = await this.compliance.getComplianceMetrics(userId);
      const complianceViolations = await this.compliance.getComplianceViolations(userId);

      return {
        success: true,
        complianceStatus,
        complianceMetrics,
        violations: complianceViolations,
        recommendations: await this.compliance.getComplianceRecommendations(userId)
      };
    } catch (error) {
      logger.error('Failed to monitor compliance', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(userId, data, encryptionType = 'standard') {
    try {
      logger.info('Encrypting sensitive data', { userId, encryptionType, dataSize: data.length });

      const encryptionResult = await this.encryption.encryptData(userId, data, encryptionType);

      // Update analytics
      await this.analytics.recordEncryptionOperation(userId, encryptionType, encryptionResult);

      return {
        success: true,
        encryptedData: encryptionResult.encryptedData,
        encryptionKey: encryptionResult.keyId,
        encryptionMetadata: encryptionResult.metadata
      };
    } catch (error) {
      logger.error('Failed to encrypt data', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(userId, encryptedData, keyId) {
    try {
      logger.info('Decrypting sensitive data', { userId, keyId });

      const decryptionResult = await this.encryption.decryptData(userId, encryptedData, keyId);

      // Update analytics
      await this.analytics.recordDecryptionOperation(userId, keyId, decryptionResult);

      return {
        success: true,
        decryptedData: decryptionResult.decryptedData,
        decryptionMetadata: decryptionResult.metadata
      };
    } catch (error) {
      logger.error('Failed to decrypt data', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get security analytics
   */
  async getSecurityAnalytics(userId) {
    try {
      const threatAnalytics = await this.analytics.getThreatAnalytics(userId);
      const incidentAnalytics = await this.analytics.getIncidentAnalytics(userId);
      const complianceAnalytics = await this.analytics.getComplianceAnalytics(userId);
      const encryptionAnalytics = await this.analytics.getEncryptionAnalytics(userId);

      return {
        success: true,
        analytics: {
          threats: threatAnalytics,
          incidents: incidentAnalytics,
          compliance: complianceAnalytics,
          encryption: encryptionAnalytics
        }
      };
    } catch (error) {
      logger.error('Failed to get security analytics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(userId) {
    try {
      const threatMetrics = await this.threatDetection.getThreatMetrics(userId);
      const incidentMetrics = await this.incidentResponse.getIncidentMetrics(userId);
      const complianceMetrics = await this.compliance.getComplianceMetrics(userId);
      const encryptionMetrics = await this.encryption.getEncryptionMetrics(userId);

      return {
        success: true,
        metrics: {
          threats: threatMetrics,
          incidents: incidentMetrics,
          compliance: complianceMetrics,
          encryption: encryptionMetrics
        }
      };
    } catch (error) {
      logger.error('Failed to get security metrics', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update security configuration
   */
  async updateSecurityConfiguration(userId, configType, configuration) {
    try {
      logger.info('Updating security configuration', { userId, configType });

      let result;
      switch (configType) {
        case 'threat_detection':
          result = await this.threatDetection.updateConfiguration(userId, configuration);
          break;
        case 'incident_response':
          result = await this.incidentResponse.updateConfiguration(userId, configuration);
          break;
        case 'compliance':
          result = await this.compliance.updateConfiguration(userId, configuration);
          break;
        case 'encryption':
          result = await this.encryption.updateConfiguration(userId, configuration);
          break;
        default:
          throw new Error(`Unknown configuration type: ${configType}`);
      }

      return {
        success: true,
        result
      };
    } catch (error) {
      logger.error('Failed to update security configuration', { error: error.message, userId, configType });
      return { success: false, error: error.message };
    }
  }

  /**
   * Load threat detection rules
   */
  async loadThreatDetectionRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('security_threat_detection_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      rules.forEach(rule => {
        this.threatDetectionRules.set(rule.id, rule);
      });

      logger.info('Threat detection rules loaded', { userId, ruleCount: rules.length });
    } catch (error) {
      logger.error('Failed to load threat detection rules', { error: error.message, userId });
    }
  }

  /**
   * Load incident response plans
   */
  async loadIncidentResponsePlans(userId) {
    try {
      const { data: plans, error } = await supabase
        .from('security_incident_response_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      plans.forEach(plan => {
        this.incidentResponsePlans.set(plan.id, plan);
      });

      logger.info('Incident response plans loaded', { userId, planCount: plans.length });
    } catch (error) {
      logger.error('Failed to load incident response plans', { error: error.message, userId });
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
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      policies.forEach(policy => {
        this.compliancePolicies.set(policy.id, policy);
      });

      logger.info('Compliance policies loaded', { userId, policyCount: policies.length });
    } catch (error) {
      logger.error('Failed to load compliance policies', { error: error.message, userId });
    }
  }

  /**
   * Load encryption keys
   */
  async loadEncryptionKeys(userId) {
    try {
      const { data: keys, error } = await supabase
        .from('security_encryption_keys')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;

      keys.forEach(key => {
        this.encryptionKeys.set(key.id, key);
      });

      logger.info('Encryption keys loaded', { userId, keyCount: keys.length });
    } catch (error) {
      logger.error('Failed to load encryption keys', { error: error.message, userId });
    }
  }

  /**
   * Get security status
   */
  async getSecurityStatus(userId) {
    try {
      const status = {
        initialized: this.isInitialized,
        threatDetectionRules: this.threatDetectionRules.size,
        incidentResponsePlans: this.incidentResponsePlans.size,
        compliancePolicies: this.compliancePolicies.size,
        encryptionKeys: this.encryptionKeys.size,
        components: {
          threatDetection: this.threatDetection.isInitialized,
          incidentResponse: this.incidentResponse.isInitialized,
          compliance: this.compliance.isInitialized,
          encryption: this.encryption.isInitialized,
          analytics: this.analytics.isInitialized
        }
      };

      return {
        success: true,
        status
      };
    } catch (error) {
      logger.error('Failed to get security status', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset security engine for user
   */
  async resetSecurityEngine(userId) {
    try {
      // Clear in-memory data
      this.threatDetectionRules.clear();
      this.incidentResponsePlans.clear();
      this.compliancePolicies.clear();
      this.encryptionKeys.clear();
      this.securityMetrics.clear();

      // Reset components
      await this.threatDetection.reset(userId);
      await this.incidentResponse.reset(userId);
      await this.compliance.reset(userId);
      await this.encryption.reset(userId);
      await this.analytics.reset(userId);

      this.isInitialized = false;

      logger.info('Security engine reset', { userId });

      return {
        success: true,
        message: 'Security engine reset successfully'
      };
    } catch (error) {
      logger.error('Failed to reset security engine', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }
}

export const advancedSecurityEngine = new AdvancedSecurityEngine();
