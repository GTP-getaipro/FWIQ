/**
 * Security Dashboard UI Component
 * 
 * A comprehensive React component for managing security features,
 * monitoring threats, incidents, compliance, and encryption.
 */

import React, { useState, useEffect, useRef } from 'react';
import { advancedSecurityEngine } from '../lib/advancedThreatDetection.js';

const SecurityDashboard = ({ 
  userId, 
  onThreatDetected = () => {},
  onIncidentHandled = () => {},
  onComplianceChecked = () => {},
  onDataEncrypted = () => {},
  showThreatDetection = true,
  showIncidentResponse = true,
  showCompliance = true,
  showEncryption = true
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [securityStatus, setSecurityStatus] = useState(null);
  const [threatAnalytics, setThreatAnalytics] = useState(null);
  const [incidentAnalytics, setIncidentAnalytics] = useState(null);
  const [complianceAnalytics, setComplianceAnalytics] = useState(null);
  const [encryptionAnalytics, setEncryptionAnalytics] = useState(null);
  const [securityInsights, setSecurityInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const securityEngineRef = useRef(null);

  // Initialize component
  useEffect(() => {
    if (userId) {
      initializeSecurity();
    }
  }, [userId]);

  // Initialize security engine
  const initializeSecurity = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await advancedSecurityEngine.initialize(userId);
      if (result.success) {
        await loadSecurityData();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to initialize security:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load security data
  const loadSecurityData = async () => {
    try {
      // Get security status
      const statusResult = await advancedSecurityEngine.getSecurityStatus(userId);
      if (statusResult.success) {
        setSecurityStatus(statusResult.status);
      }

      // Get security analytics
      const analyticsResult = await advancedSecurityEngine.getSecurityAnalytics(userId);
      if (analyticsResult.success) {
        setThreatAnalytics(analyticsResult.analytics.threats);
        setIncidentAnalytics(analyticsResult.analytics.incidents);
        setComplianceAnalytics(analyticsResult.analytics.compliance);
        setEncryptionAnalytics(analyticsResult.analytics.encryption);
      }

      // Get security insights
      const insightsResult = await advancedSecurityEngine.getSecurityInsights(userId);
      if (insightsResult.success) {
        setSecurityInsights(insightsResult.insights);
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
      setError(error.message);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle threat detection
  const handleThreatDetection = async (eventData) => {
    try {
      setIsLoading(true);
      const result = await advancedSecurityEngine.detectThreats(userId, eventData);
      
      if (result.success) {
        await loadSecurityData();
        onThreatDetected(result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to detect threats:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle incident response
  const handleIncidentResponse = async (incidentData) => {
    try {
      setIsLoading(true);
      const result = await advancedSecurityEngine.handleIncident(userId, incidentData);
      
      if (result.success) {
        await loadSecurityData();
        onIncidentHandled(result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to handle incident:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle compliance check
  const handleComplianceCheck = async () => {
    try {
      setIsLoading(true);
      const result = await advancedSecurityEngine.monitorCompliance(userId);
      
      if (result.success) {
        await loadSecurityData();
        onComplianceChecked(result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to check compliance:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data encryption
  const handleDataEncryption = async (data, encryptionType) => {
    try {
      setIsLoading(true);
      const result = await advancedSecurityEngine.encryptData(userId, data, encryptionType);
      
      if (result.success) {
        await loadSecurityData();
        onDataEncrypted(result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render overview tab
  const renderOverview = () => {
    if (!securityStatus) return null;

    return (
      <div className="security-dashboard-overview">
        {/* Security Status */}
        <div className="security-status">
          <h3>Security System Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Initialized</div>
              <div className={`status-value ${securityStatus.initialized ? 'success' : 'error'}`}>
                {securityStatus.initialized ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Threat Detection Rules</div>
              <div className="status-value">{securityStatus.threatDetectionRules}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Incident Response Plans</div>
              <div className="status-value">{securityStatus.incidentResponsePlans}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Compliance Policies</div>
              <div className="status-value">{securityStatus.compliancePolicies}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Encryption Keys</div>
              <div className="status-value">{securityStatus.encryptionKeys}</div>
            </div>
          </div>
        </div>

        {/* Component Status */}
        <div className="component-status">
          <h3>Component Status</h3>
          <div className="component-grid">
            {Object.entries(securityStatus.components).map(([component, status]) => (
              <div key={component} className="component-item">
                <div className="component-name">{component}</div>
                <div className={`component-status ${status ? 'active' : 'inactive'}`}>
                  {status ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Insights */}
        {securityInsights && (
          <div className="security-insights">
            <h3>Security Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-label">Overall Security Score</div>
                <div className={`insight-value ${securityInsights.overallSecurityScore >= 80 ? 'good' : securityInsights.overallSecurityScore >= 60 ? 'fair' : 'poor'}`}>
                  {securityInsights.overallSecurityScore}/100
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Risk Level</div>
                <div className={`insight-value ${securityInsights.riskAssessment?.level || 'unknown'}`}>
                  {securityInsights.riskAssessment?.level || 'Unknown'}
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Active Alerts</div>
                <div className="insight-value">
                  {securityInsights.alerts?.length || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button 
              className="btn btn-primary" 
              onClick={() => handleTabChange('threat-detection')}
              disabled={!showThreatDetection}
            >
              Threat Detection
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('incident-response')}
              disabled={!showIncidentResponse}
            >
              Incident Response
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('compliance')}
              disabled={!showCompliance}
            >
              Compliance Monitoring
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('encryption')}
              disabled={!showEncryption}
            >
              Encryption Management
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render threat detection tab
  const renderThreatDetection = () => {
    if (!threatAnalytics) return null;

    return (
      <div className="security-dashboard-threat-detection">
        <div className="threat-detection-header">
          <h3>Threat Detection</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleThreatDetection({ type: 'test_threat', data: 'test data' })}
            disabled={isLoading}
          >
            {isLoading ? 'Detecting...' : 'Test Threat Detection'}
          </button>
        </div>

        <div className="threat-analytics">
          <h4>Threat Analytics</h4>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-label">Total Threats</div>
              <div className="analytics-value">{threatAnalytics.totalThreats || 0}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Threats by Type</div>
              <div className="analytics-value">
                {Object.entries(threatAnalytics.threatsByType || {}).map(([type, count]) => (
                  <div key={type} className="threat-type">
                    {type}: {count}
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Threats by Level</div>
              <div className="analytics-value">
                {Object.entries(threatAnalytics.threatsByLevel || {}).map(([level, count]) => (
                  <div key={level} className={`threat-level ${level}`}>
                    {level}: {count}
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Threat Trend</div>
              <div className={`analytics-value ${threatAnalytics.threatTrends?.trend || 'unknown'}`}>
                {threatAnalytics.threatTrends?.trend || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        <div className="threat-patterns">
          <h4>Threat Patterns</h4>
          <div className="patterns-list">
            {threatAnalytics.threatPatterns?.map((pattern, index) => (
              <div key={index} className="pattern-item">
                <div className="pattern-type">{pattern.type}</div>
                <div className="pattern-description">{pattern.description}</div>
                <div className="pattern-frequency">Frequency: {pattern.frequency}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render incident response tab
  const renderIncidentResponse = () => {
    if (!incidentAnalytics) return null;

    return (
      <div className="security-dashboard-incident-response">
        <div className="incident-response-header">
          <h3>Incident Response</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleIncidentResponse({ type: 'test_incident', data: 'test incident data' })}
            disabled={isLoading}
          >
            {isLoading ? 'Handling...' : 'Test Incident Response'}
          </button>
        </div>

        <div className="incident-analytics">
          <h4>Incident Analytics</h4>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-label">Total Incidents</div>
              <div className="analytics-value">{incidentAnalytics.totalIncidents || 0}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Incidents by Type</div>
              <div className="analytics-value">
                {Object.entries(incidentAnalytics.incidentsByType || {}).map(([type, count]) => (
                  <div key={type} className="incident-type">
                    {type}: {count}
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Incidents by Severity</div>
              <div className="analytics-value">
                {Object.entries(incidentAnalytics.incidentsBySeverity || {}).map(([severity, count]) => (
                  <div key={severity} className={`incident-severity ${severity}`}>
                    {severity}: {count}
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Incidents by Status</div>
              <div className="analytics-value">
                {Object.entries(incidentAnalytics.incidentsByStatus || {}).map(([status, count]) => (
                  <div key={status} className={`incident-status ${status}`}>
                    {status}: {count}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="incident-trends">
          <h4>Incident Trends</h4>
          <div className="trends-list">
            <div className="trend-item">
              <div className="trend-type">Overall Trend</div>
              <div className={`trend-value ${incidentAnalytics.incidentTrends?.trend || 'unknown'}`}>
                {incidentAnalytics.incidentTrends?.trend || 'Unknown'}
              </div>
            </div>
            <div className="trend-item">
              <div className="trend-type">Response Time</div>
              <div className="trend-value">
                {incidentAnalytics.responseTimeAnalysis?.avgResponseTime || 'N/A'}ms
              </div>
            </div>
            <div className="trend-item">
              <div className="trend-type">Resolution Time</div>
              <div className="trend-value">
                {incidentAnalytics.resolutionTimeAnalysis?.avgResolutionTime || 'N/A'}ms
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render compliance tab
  const renderCompliance = () => {
    if (!complianceAnalytics) return null;

    return (
      <div className="security-dashboard-compliance">
        <div className="compliance-header">
          <h3>Compliance Monitoring</h3>
          <button 
            className="btn btn-primary" 
            onClick={handleComplianceCheck}
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Check Compliance'}
          </button>
        </div>

        <div className="compliance-analytics">
          <h4>Compliance Analytics</h4>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-label">Compliance Score</div>
              <div className={`analytics-value ${complianceAnalytics.complianceScore >= 80 ? 'good' : complianceAnalytics.complianceScore >= 60 ? 'fair' : 'poor'}`}>
                {complianceAnalytics.complianceScore || 0}/100
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Total Events</div>
              <div className="analytics-value">{complianceAnalytics.totalComplianceEvents || 0}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Compliance by Type</div>
              <div className="analytics-value">
                {Object.entries(complianceAnalytics.complianceByType || {}).map(([type, count]) => (
                  <div key={type} className="compliance-type">
                    {type}: {count}
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Violations</div>
              <div className="analytics-value">
                {complianceAnalytics.violationAnalysis?.totalViolations || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="compliance-recommendations">
          <h4>Compliance Recommendations</h4>
          <div className="recommendations-list">
            {complianceAnalytics.complianceRecommendations?.map((recommendation, index) => (
              <div key={index} className={`recommendation-item ${recommendation.priority}`}>
                <div className="recommendation-priority">{recommendation.priority}</div>
                <div className="recommendation-message">{recommendation.message}</div>
                <div className="recommendation-action">{recommendation.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render encryption tab
  const renderEncryption = () => {
    if (!encryptionAnalytics) return null;

    return (
      <div className="security-dashboard-encryption">
        <div className="encryption-header">
          <h3>Encryption Management</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleDataEncryption('test data', 'standard')}
            disabled={isLoading}
          >
            {isLoading ? 'Encrypting...' : 'Test Encryption'}
          </button>
        </div>

        <div className="encryption-analytics">
          <h4>Encryption Analytics</h4>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-label">Total Operations</div>
              <div className="analytics-value">{encryptionAnalytics.totalOperations || 0}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Operations by Type</div>
              <div className="analytics-value">
                {Object.entries(encryptionAnalytics.operationsByType || {}).map(([type, count]) => (
                  <div key={type} className="operation-type">
                    {type}: {count}
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Operations by Algorithm</div>
              <div className="analytics-value">
                {Object.entries(encryptionAnalytics.operationsByAlgorithm || {}).map(([algorithm, count]) => (
                  <div key={algorithm} className="algorithm-type">
                    {algorithm}: {count}
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Encryption Trend</div>
              <div className={`analytics-value ${encryptionAnalytics.encryptionTrends?.trend || 'unknown'}`}>
                {encryptionAnalytics.encryptionTrends?.trend || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        <div className="encryption-performance">
          <h4>Encryption Performance</h4>
          <div className="performance-list">
            <div className="performance-item">
              <div className="performance-type">Average Encryption Time</div>
              <div className="performance-value">
                {encryptionAnalytics.performanceAnalysis?.avgEncryptionTime || 'N/A'}ms
              </div>
            </div>
            <div className="performance-item">
              <div className="performance-type">Average Decryption Time</div>
              <div className="performance-value">
                {encryptionAnalytics.performanceAnalysis?.avgDecryptionTime || 'N/A'}ms
              </div>
            </div>
            <div className="performance-item">
              <div className="performance-type">Key Usage</div>
              <div className="performance-value">
                {Object.keys(encryptionAnalytics.keyUsageAnalysis || {}).length} keys
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !securityStatus) {
    return (
      <div className="security-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Initializing security system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="security-dashboard-error">
        <div className="error-icon">❌</div>
        <h3>Security System Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={initializeSecurity}>
          Retry Initialization
        </button>
      </div>
    );
  }

  return (
    <div className="security-dashboard">
      {/* Header */}
      <div className="security-dashboard-header">
        <h2>Security Dashboard</h2>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={loadSecurityData}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="security-dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        {showThreatDetection && (
          <button 
            className={`tab ${activeTab === 'threat-detection' ? 'active' : ''}`}
            onClick={() => handleTabChange('threat-detection')}
          >
            Threat Detection
          </button>
        )}
        {showIncidentResponse && (
          <button 
            className={`tab ${activeTab === 'incident-response' ? 'active' : ''}`}
            onClick={() => handleTabChange('incident-response')}
          >
            Incident Response
          </button>
        )}
        {showCompliance && (
          <button 
            className={`tab ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => handleTabChange('compliance')}
          >
            Compliance
          </button>
        )}
        {showEncryption && (
          <button 
            className={`tab ${activeTab === 'encryption' ? 'active' : ''}`}
            onClick={() => handleTabChange('encryption')}
          >
            Encryption
          </button>
        )}
      </div>

      {/* Content */}
      <div className="security-dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'threat-detection' && renderThreatDetection()}
        {activeTab === 'incident-response' && renderIncidentResponse()}
        {activeTab === 'compliance' && renderCompliance()}
        {activeTab === 'encryption' && renderEncryption()}
      </div>
    </div>
  );
};

export default SecurityDashboard;
