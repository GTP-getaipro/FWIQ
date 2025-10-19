/**
 * Integration Dashboard UI Component
 * 
 * A comprehensive React component for managing integrations,
 * monitoring health, and optimizing performance.
 */

import React, { useState, useEffect, useRef } from 'react';
import { advancedIntegrationEngine } from '../lib/advancedIntegrations.js';

const IntegrationDashboard = ({ 
  userId, 
  onIntegrationCreated = () => {},
  onIntegrationUpdated = () => {},
  onHealthCheckComplete = () => {},
  onOptimizationComplete = () => {},
  showMonitoring = true,
  showRecovery = true,
  showOptimization = true
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [healthResults, setHealthResults] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [recoveryMetrics, setRecoveryMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const integrationEngineRef = useRef(null);

  // Initialize component
  useEffect(() => {
    if (userId) {
      initializeIntegrations();
    }
  }, [userId]);

  // Initialize integration engine
  const initializeIntegrations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await advancedIntegrationEngine.initialize(userId);
      if (result.success) {
        await loadIntegrationData();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to initialize integrations:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load integration data
  const loadIntegrationData = async () => {
    try {
      // Get integration status
      const statusResult = await advancedIntegrationEngine.getIntegrationStatus(userId);
      if (statusResult.success) {
        setIntegrationStatus(statusResult.status);
      }

      // Get integrations
      const integrationsResult = await advancedIntegrationEngine.manageIntegration(userId, 'list', {});
      if (integrationsResult.success) {
        setIntegrations(integrationsResult.result || []);
      }

      // Get health results
      if (showMonitoring) {
        const healthResult = await advancedIntegrationEngine.monitorHealth(userId);
        if (healthResult.success) {
          setHealthResults(healthResult.healthResults);
        }
      }

      // Get performance metrics
      if (showOptimization) {
        const metricsResult = await advancedIntegrationEngine.getIntegrationMetrics(userId);
        if (metricsResult.success) {
          setPerformanceMetrics(metricsResult.metrics);
        }
      }

      // Get recovery metrics
      if (showRecovery) {
        const recoveryResult = await advancedIntegrationEngine.getIntegrationMetrics(userId);
        if (recoveryResult.success) {
          setRecoveryMetrics(recoveryResult.metrics.recovery);
        }
      }
    } catch (error) {
      console.error('Failed to load integration data:', error);
      setError(error.message);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle integration creation
  const handleIntegrationCreate = async (integrationData) => {
    try {
      setIsLoading(true);
      const result = await advancedIntegrationEngine.manageIntegration(userId, 'create', integrationData);
      
      if (result.success) {
        await loadIntegrationData();
        onIntegrationCreated(result.result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to create integration:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle integration update
  const handleIntegrationUpdate = async (integrationData) => {
    try {
      setIsLoading(true);
      const result = await advancedIntegrationEngine.manageIntegration(userId, 'update', integrationData);
      
      if (result.success) {
        await loadIntegrationData();
        onIntegrationUpdated(result.result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to update integration:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle health check
  const handleHealthCheck = async () => {
    try {
      setIsLoading(true);
      const result = await advancedIntegrationEngine.monitorHealth(userId);
      
      if (result.success) {
        setHealthResults(result.healthResults);
        onHealthCheckComplete(result.healthResults);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to perform health check:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle optimization
  const handleOptimization = async () => {
    try {
      setIsLoading(true);
      const result = await advancedIntegrationEngine.optimizePerformance(userId);
      
      if (result.success) {
        await loadIntegrationData();
        onOptimizationComplete(result.optimizationResult);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to optimize performance:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render overview tab
  const renderOverview = () => {
    if (!integrationStatus) return null;

    return (
      <div className="integration-dashboard-overview">
        {/* Integration Status */}
        <div className="integration-status">
          <h3>Integration System Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Initialized</div>
              <div className={`status-value ${integrationStatus.initialized ? 'success' : 'error'}`}>
                {integrationStatus.initialized ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Active Integrations</div>
              <div className="status-value">{integrationStatus.activeIntegrations}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Health Checks</div>
              <div className="status-value">{integrationStatus.healthChecks}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Recovery Strategies</div>
              <div className="status-value">{integrationStatus.errorRecoveryStrategies}</div>
            </div>
          </div>
        </div>

        {/* Component Status */}
        <div className="component-status">
          <h3>Component Status</h3>
          <div className="component-grid">
            {Object.entries(integrationStatus.components).map(([component, status]) => (
              <div key={component} className="component-item">
                <div className="component-name">{component}</div>
                <div className={`component-status ${status ? 'active' : 'inactive'}`}>
                  {status ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button 
              className="btn btn-primary" 
              onClick={() => handleTabChange('integrations')}
            >
              Manage Integrations
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('monitoring')}
              disabled={!showMonitoring}
            >
              Health Monitoring
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('recovery')}
              disabled={!showRecovery}
            >
              Error Recovery
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('optimization')}
              disabled={!showOptimization}
            >
              Performance Optimization
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render integrations tab
  const renderIntegrations = () => {
    return (
      <div className="integration-dashboard-integrations">
        <div className="integrations-header">
          <h3>Integration Management</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleTabChange('create-integration')}
          >
            Create New Integration
          </button>
        </div>

        <div className="integrations-list">
          {integrations.map((integration, index) => (
            <div key={index} className="integration-card">
              <div className="integration-info">
                <div className="integration-name">{integration.name}</div>
                <div className="integration-type">{integration.type}</div>
                <div className="integration-provider">{integration.provider}</div>
              </div>
              <div className="integration-status">
                <div className={`status-badge ${integration.status}`}>
                  {integration.status}
                </div>
              </div>
              <div className="integration-actions">
                <button className="btn btn-sm btn-secondary">Edit</button>
                <button className="btn btn-sm btn-warning">Deactivate</button>
                <button className="btn btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {integrations.length === 0 && (
          <div className="no-integrations">
            <p>No integrations configured yet. Create your first integration to get started.</p>
          </div>
        )}
      </div>
    );
  };

  // Render monitoring tab
  const renderMonitoring = () => {
    if (!healthResults) return null;

    return (
      <div className="integration-dashboard-monitoring">
        <div className="monitoring-header">
          <h3>Health Monitoring</h3>
          <button 
            className="btn btn-primary" 
            onClick={handleHealthCheck}
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Run Health Check'}
          </button>
        </div>

        <div className="health-results">
          {healthResults.map((result, index) => (
            <div key={index} className={`health-check-card ${result.isHealthy ? 'healthy' : 'unhealthy'}`}>
              <div className="health-check-info">
                <div className="health-check-name">{result.name}</div>
                <div className="health-check-type">{result.check_type}</div>
                <div className="health-check-integration">{result.integration_type}</div>
              </div>
              <div className="health-check-status">
                <div className={`status-indicator ${result.isHealthy ? 'healthy' : 'unhealthy'}`}>
                  {result.isHealthy ? '✓' : '✗'}
                </div>
                <div className="status-message">{result.message}</div>
              </div>
              <div className="health-check-details">
                <div className="response-time">Response Time: {result.responseTime}ms</div>
                <div className="last-checked">Last Checked: {new Date(result.timestamp).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>

        {healthResults.length === 0 && (
          <div className="no-health-checks">
            <p>No health checks configured. Set up health checks to monitor your integrations.</p>
          </div>
        )}
      </div>
    );
  };

  // Render recovery tab
  const renderRecovery = () => {
    if (!recoveryMetrics) return null;

    return (
      <div className="integration-dashboard-recovery">
        <div className="recovery-header">
          <h3>Error Recovery</h3>
          <div className="recovery-summary">
            <div className="recovery-rate">
              Recovery Rate: <span className="rate-value">{recoveryMetrics.recoveryRate?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="recovery-metrics">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Errors</div>
              <div className="metric-value">{recoveryMetrics.totalErrors || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Recovery Attempts</div>
              <div className="metric-value">{recoveryMetrics.recoveryAttempts || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Successful Recoveries</div>
              <div className="metric-value">{recoveryMetrics.successfulRecoveries || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg Recovery Time</div>
              <div className="metric-value">{recoveryMetrics.avgRecoveryTime?.toFixed(0) || 0}ms</div>
            </div>
          </div>
        </div>

        <div className="recovery-trends">
          <h4>Recovery Trends</h4>
          <div className="trends-list">
            {recoveryMetrics.recoveryTrends?.map((trend, index) => (
              <div key={index} className="trend-item">
                <div className="trend-type">{trend.type}</div>
                <div className={`trend-value ${trend.trend}`}>{trend.trend}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render optimization tab
  const renderOptimization = () => {
    if (!performanceMetrics) return null;

    return (
      <div className="integration-dashboard-optimization">
        <div className="optimization-header">
          <h3>Performance Optimization</h3>
          <button 
            className="btn btn-primary" 
            onClick={handleOptimization}
            disabled={isLoading}
          >
            {isLoading ? 'Optimizing...' : 'Run Optimization'}
          </button>
        </div>

        <div className="performance-metrics">
          <h4>Performance Metrics</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Requests</div>
              <div className="metric-value">{performanceMetrics.integration?.totalRequests || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Success Rate</div>
              <div className="metric-value">{(performanceMetrics.integration?.successRate * 100)?.toFixed(1) || 0}%</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Avg Response Time</div>
              <div className="metric-value">{performanceMetrics.integration?.avgResponseTime?.toFixed(0) || 0}ms</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Error Rate</div>
              <div className="metric-value">{(performanceMetrics.integration?.errorRate * 100)?.toFixed(1) || 0}%</div>
            </div>
          </div>
        </div>

        <div className="performance-trends">
          <h4>Performance Trends</h4>
          <div className="trends-list">
            {performanceMetrics.integration?.metricsByIntegration && 
              Object.entries(performanceMetrics.integration.metricsByIntegration).map(([integration, metrics]) => (
                <div key={integration} className="integration-metrics">
                  <div className="integration-name">{integration}</div>
                  <div className="integration-metrics-details">
                    <div className="metric-item">Requests: {metrics.length}</div>
                    <div className="metric-item">Success Rate: {(metrics.filter(m => m.success).length / metrics.length * 100)?.toFixed(1)}%</div>
                    <div className="metric-item">Avg Response Time: {(metrics.reduce((sum, m) => sum + m.response_time, 0) / metrics.length)?.toFixed(0)}ms</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !integrationStatus) {
    return (
      <div className="integration-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Initializing integration system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="integration-dashboard-error">
        <div className="error-icon">❌</div>
        <h3>Integration System Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={initializeIntegrations}>
          Retry Initialization
        </button>
      </div>
    );
  }

  return (
    <div className="integration-dashboard">
      {/* Header */}
      <div className="integration-dashboard-header">
        <h2>Integration Dashboard</h2>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={loadIntegrationData}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="integration-dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'integrations' ? 'active' : ''}`}
          onClick={() => handleTabChange('integrations')}
        >
          Integrations
        </button>
        {showMonitoring && (
          <button 
            className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => handleTabChange('monitoring')}
          >
            Monitoring
          </button>
        )}
        {showRecovery && (
          <button 
            className={`tab ${activeTab === 'recovery' ? 'active' : ''}`}
            onClick={() => handleTabChange('recovery')}
          >
            Recovery
          </button>
        )}
        {showOptimization && (
          <button 
            className={`tab ${activeTab === 'optimization' ? 'active' : ''}`}
            onClick={() => handleTabChange('optimization')}
          >
            Optimization
          </button>
        )}
      </div>

      {/* Content */}
      <div className="integration-dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'integrations' && renderIntegrations()}
        {activeTab === 'monitoring' && renderMonitoring()}
        {activeTab === 'recovery' && renderRecovery()}
        {activeTab === 'optimization' && renderOptimization()}
      </div>
    </div>
  );
};

export default IntegrationDashboard;
