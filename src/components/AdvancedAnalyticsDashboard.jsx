/**
 * Advanced Analytics Dashboard UI Component
 * 
 * A comprehensive React component for managing advanced analytics,
 * data visualization, predictive models, custom dashboards, and sharing.
 */

import React, { useState, useEffect, useRef } from 'react';
import { advancedAnalyticsEngine } from '../lib/advancedDataVisualization.js';

const AdvancedAnalyticsDashboard = ({ 
  userId, 
  onVisualizationCreated = () => {},
  onPredictiveModelGenerated = () => {},
  onDashboardCreated = () => {},
  onDataExported = () => {},
  onDataShared = () => {},
  showDataVisualization = true,
  showPredictiveModels = true,
  showCustomDashboards = true,
  showExport = true,
  showSharing = true
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsStatus, setAnalyticsStatus] = useState(null);
  const [visualizations, setVisualizations] = useState([]);
  const [predictiveModels, setPredictiveModels] = useState([]);
  const [customDashboards, setCustomDashboards] = useState([]);
  const [exportTemplates, setExportTemplates] = useState([]);
  const [sharingLinks, setSharingLinks] = useState([]);
  const [analyticsInsights, setAnalyticsInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const analyticsEngineRef = useRef(null);

  // Initialize component
  useEffect(() => {
    if (userId) {
      initializeAnalytics();
    }
  }, [userId]);

  // Initialize analytics engine
  const initializeAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await advancedAnalyticsEngine.initialize(userId);
      if (result.success) {
        await loadAnalyticsData();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      // Get analytics status
      const statusResult = await advancedAnalyticsEngine.getAnalyticsStatus(userId);
      if (statusResult.success) {
        setAnalyticsStatus(statusResult.status);
      }

      // Get analytics insights
      const insightsResult = await advancedAnalyticsEngine.getAnalyticsInsights(userId);
      if (insightsResult.success) {
        setAnalyticsInsights(insightsResult.insights);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      setError(error.message);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle visualization creation
  const handleVisualizationCreate = async (visualizationData) => {
    try {
      setIsLoading(true);
      const result = await advancedAnalyticsEngine.createVisualization(userId, visualizationData);
      
      if (result.success) {
        await loadAnalyticsData();
        onVisualizationCreated(result.visualization);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to create visualization:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle predictive model generation
  const handlePredictiveModelGenerate = async (modelData) => {
    try {
      setIsLoading(true);
      const result = await advancedAnalyticsEngine.generatePredictiveAnalytics(userId, modelData);
      
      if (result.success) {
        await loadAnalyticsData();
        onPredictiveModelGenerated(result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to generate predictive model:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dashboard creation
  const handleDashboardCreate = async (dashboardData) => {
    try {
      setIsLoading(true);
      const result = await advancedAnalyticsEngine.createCustomDashboard(userId, dashboardData);
      
      if (result.success) {
        await loadAnalyticsData();
        onDashboardCreated(result.dashboard);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data export
  const handleDataExport = async (exportData) => {
    try {
      setIsLoading(true);
      const result = await advancedAnalyticsEngine.exportAnalytics(userId, exportData);
      
      if (result.success) {
        await loadAnalyticsData();
        onDataExported(result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data sharing
  const handleDataShare = async (sharingData) => {
    try {
      setIsLoading(true);
      const result = await advancedAnalyticsEngine.shareAnalytics(userId, sharingData);
      
      if (result.success) {
        await loadAnalyticsData();
        onDataShared(result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to share data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render overview tab
  const renderOverview = () => {
    if (!analyticsStatus) return null;

    return (
      <div className="analytics-dashboard-overview">
        {/* Analytics Status */}
        <div className="analytics-status">
          <h3>Analytics System Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Initialized</div>
              <div className={`status-value ${analyticsStatus.initialized ? 'success' : 'error'}`}>
                {analyticsStatus.initialized ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Visualization Configs</div>
              <div className="status-value">{analyticsStatus.visualizationConfigs}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Predictive Models</div>
              <div className="status-value">{analyticsStatus.predictiveModels}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Custom Dashboards</div>
              <div className="status-value">{analyticsStatus.customDashboards}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Export Templates</div>
              <div className="status-value">{analyticsStatus.exportTemplates}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Sharing Configs</div>
              <div className="status-value">{analyticsStatus.sharingConfigs}</div>
            </div>
          </div>
        </div>

        {/* Component Status */}
        <div className="component-status">
          <h3>Component Status</h3>
          <div className="component-grid">
            {Object.entries(analyticsStatus.components).map(([component, status]) => (
              <div key={component} className="component-item">
                <div className="component-name">{component}</div>
                <div className={`component-status ${status ? 'active' : 'inactive'}`}>
                  {status ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Insights */}
        {analyticsInsights && (
          <div className="analytics-insights">
            <h3>Analytics Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-label">Overall Analytics Score</div>
                <div className={`insight-value ${analyticsInsights.overall?.score >= 80 ? 'good' : analyticsInsights.overall?.score >= 60 ? 'fair' : 'poor'}`}>
                  {analyticsInsights.overall?.score || 0}/100
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Active Visualizations</div>
                <div className="insight-value">
                  {analyticsInsights.visualization?.totalVisualizations || 0}
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Predictive Models</div>
                <div className="insight-value">
                  {analyticsInsights.predictive?.totalModels || 0}
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Custom Dashboards</div>
                <div className="insight-value">
                  {analyticsInsights.dashboard?.totalDashboards || 0}
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
              onClick={() => handleTabChange('data-visualization')}
              disabled={!showDataVisualization}
            >
              Data Visualization
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('predictive-models')}
              disabled={!showPredictiveModels}
            >
              Predictive Models
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('custom-dashboards')}
              disabled={!showCustomDashboards}
            >
              Custom Dashboards
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('export')}
              disabled={!showExport}
            >
              Export Data
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('sharing')}
              disabled={!showSharing}
            >
              Share Analytics
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render data visualization tab
  const renderDataVisualization = () => {
    return (
      <div className="analytics-dashboard-data-visualization">
        <div className="visualization-header">
          <h3>Data Visualization</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleVisualizationCreate({ 
              type: 'chart', 
              name: 'Test Chart', 
              dataSource: 'test_data' 
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Visualization'}
          </button>
        </div>

        <div className="visualization-types">
          <h4>Visualization Types</h4>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-name">Charts</div>
              <div className="type-description">Bar, line, pie, and other chart types</div>
              <button className="btn btn-sm btn-primary">Create Chart</button>
            </div>
            <div className="type-card">
              <div className="type-name">Maps</div>
              <div className="type-description">Geographic data visualization</div>
              <button className="btn btn-sm btn-primary">Create Map</button>
            </div>
            <div className="type-card">
              <div className="type-name">Tables</div>
              <div className="type-description">Data tables with sorting and filtering</div>
              <button className="btn btn-sm btn-primary">Create Table</button>
            </div>
            <div className="type-card">
              <div className="type-name">Metrics</div>
              <div className="type-description">Key performance indicators</div>
              <button className="btn btn-sm btn-primary">Create Metric</button>
            </div>
          </div>
        </div>

        <div className="visualization-list">
          <h4>Existing Visualizations</h4>
          <div className="visualizations-grid">
            {visualizations.map((visualization, index) => (
              <div key={index} className="visualization-card">
                <div className="visualization-info">
                  <div className="visualization-name">{visualization.name}</div>
                  <div className="visualization-type">{visualization.type}</div>
                </div>
                <div className="visualization-actions">
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-warning">Share</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render predictive models tab
  const renderPredictiveModels = () => {
    return (
      <div className="analytics-dashboard-predictive-models">
        <div className="predictive-models-header">
          <h3>Predictive Models</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handlePredictiveModelGenerate({ 
              type: 'regression', 
              features: [{ name: 'feature1', value: 100 }] 
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Predictions'}
          </button>
        </div>

        <div className="model-types">
          <h4>Model Types</h4>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-name">Regression</div>
              <div className="type-description">Predict continuous values</div>
              <button className="btn btn-sm btn-primary">Create Model</button>
            </div>
            <div className="type-card">
              <div className="type-name">Classification</div>
              <div className="type-description">Categorize data into classes</div>
              <button className="btn btn-sm btn-primary">Create Model</button>
            </div>
            <div className="type-card">
              <div className="type-name">Time Series</div>
              <div className="type-description">Forecast future values</div>
              <button className="btn btn-sm btn-primary">Create Model</button>
            </div>
            <div className="type-card">
              <div className="type-name">Clustering</div>
              <div className="type-description">Group similar data points</div>
              <button className="btn btn-sm btn-primary">Create Model</button>
            </div>
          </div>
        </div>

        <div className="model-list">
          <h4>Existing Models</h4>
          <div className="models-grid">
            {predictiveModels.map((model, index) => (
              <div key={index} className="model-card">
                <div className="model-info">
                  <div className="model-name">{model.name}</div>
                  <div className="model-type">{model.type}</div>
                  <div className="model-accuracy">Accuracy: {(model.accuracy * 100).toFixed(1)}%</div>
                </div>
                <div className="model-actions">
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-primary">Predict</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render custom dashboards tab
  const renderCustomDashboards = () => {
    return (
      <div className="analytics-dashboard-custom-dashboards">
        <div className="dashboards-header">
          <h3>Custom Dashboards</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleDashboardCreate({ 
              name: 'Test Dashboard', 
              description: 'A test dashboard' 
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Dashboard'}
          </button>
        </div>

        <div className="dashboard-templates">
          <h4>Dashboard Templates</h4>
          <div className="templates-grid">
            <div className="template-card">
              <div className="template-name">Executive Dashboard</div>
              <div className="template-description">High-level metrics and KPIs</div>
              <button className="btn btn-sm btn-primary">Use Template</button>
            </div>
            <div className="template-card">
              <div className="template-name">Operational Dashboard</div>
              <div className="template-description">Day-to-day operations metrics</div>
              <button className="btn btn-sm btn-primary">Use Template</button>
            </div>
            <div className="template-card">
              <div className="template-name">Analytical Dashboard</div>
              <div className="template-description">Detailed analysis and insights</div>
              <button className="btn btn-sm btn-primary">Use Template</button>
            </div>
            <div className="template-card">
              <div className="template-name">Blank Dashboard</div>
              <div className="template-description">Start from scratch</div>
              <button className="btn btn-sm btn-primary">Create Blank</button>
            </div>
          </div>
        </div>

        <div className="dashboard-list">
          <h4>Existing Dashboards</h4>
          <div className="dashboards-grid">
            {customDashboards.map((dashboard, index) => (
              <div key={index} className="dashboard-card">
                <div className="dashboard-info">
                  <div className="dashboard-name">{dashboard.name}</div>
                  <div className="dashboard-description">{dashboard.description}</div>
                  <div className="dashboard-components">Components: {dashboard.components.length}</div>
                </div>
                <div className="dashboard-actions">
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-primary">View</button>
                  <button className="btn btn-sm btn-warning">Share</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render export tab
  const renderExport = () => {
    return (
      <div className="analytics-dashboard-export">
        <div className="export-header">
          <h3>Export Data</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleDataExport({ 
              format: 'csv', 
              dataSources: ['test_data'] 
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Exporting...' : 'Export Data'}
          </button>
        </div>

        <div className="export-formats">
          <h4>Export Formats</h4>
          <div className="formats-grid">
            <div className="format-card">
              <div className="format-name">CSV</div>
              <div className="format-description">Comma-separated values</div>
              <button className="btn btn-sm btn-primary">Export CSV</button>
            </div>
            <div className="format-card">
              <div className="format-name">Excel</div>
              <div className="format-description">Microsoft Excel format</div>
              <button className="btn btn-sm btn-primary">Export Excel</button>
            </div>
            <div className="format-card">
              <div className="format-name">PDF</div>
              <div className="format-description">Portable Document Format</div>
              <button className="btn btn-sm btn-primary">Export PDF</button>
            </div>
            <div className="format-card">
              <div className="format-name">JSON</div>
              <div className="format-description">JavaScript Object Notation</div>
              <button className="btn btn-sm btn-primary">Export JSON</button>
            </div>
          </div>
        </div>

        <div className="export-templates">
          <h4>Export Templates</h4>
          <div className="templates-grid">
            {exportTemplates.map((template, index) => (
              <div key={index} className="template-card">
                <div className="template-info">
                  <div className="template-name">{template.name}</div>
                  <div className="template-format">{template.format}</div>
                  <div className="template-description">{template.description}</div>
                </div>
                <div className="template-actions">
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-primary">Use</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render sharing tab
  const renderSharing = () => {
    return (
      <div className="analytics-dashboard-sharing">
        <div className="sharing-header">
          <h3>Share Analytics</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleDataShare({ 
              type: 'dashboard', 
              resourceId: 'test_dashboard',
              resourceType: 'dashboard'
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share Data'}
          </button>
        </div>

        <div className="sharing-types">
          <h4>Sharing Types</h4>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-name">Public Link</div>
              <div className="type-description">Share with anyone via link</div>
              <button className="btn btn-sm btn-primary">Create Link</button>
            </div>
            <div className="type-card">
              <div className="type-name">Password Protected</div>
              <div className="type-description">Share with password protection</div>
              <button className="btn btn-sm btn-primary">Create Link</button>
            </div>
            <div className="type-card">
              <div className="type-name">Time Limited</div>
              <div className="type-description">Share with expiration date</div>
              <button className="btn btn-sm btn-primary">Create Link</button>
            </div>
            <div className="type-card">
              <div className="type-name">Collaborative</div>
              <div className="type-description">Share with specific users</div>
              <button className="btn btn-sm btn-primary">Create Link</button>
            </div>
          </div>
        </div>

        <div className="sharing-links">
          <h4>Active Sharing Links</h4>
          <div className="links-grid">
            {sharingLinks.map((link, index) => (
              <div key={index} className="link-card">
                <div className="link-info">
                  <div className="link-name">{link.resource_type}</div>
                  <div className="link-url">{link.sharing_url}</div>
                  <div className="link-expires">Expires: {new Date(link.expires_at).toLocaleDateString()}</div>
                </div>
                <div className="link-actions">
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-warning">Copy Link</button>
                  <button className="btn btn-sm btn-danger">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !analyticsStatus) {
    return (
      <div className="analytics-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Initializing analytics system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard-error">
        <div className="error-icon">❌</div>
        <h3>Analytics System Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={initializeAnalytics}>
          Retry Initialization
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-dashboard-header">
        <h2>Advanced Analytics Dashboard</h2>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={loadAnalyticsData}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        {showDataVisualization && (
          <button 
            className={`tab ${activeTab === 'data-visualization' ? 'active' : ''}`}
            onClick={() => handleTabChange('data-visualization')}
          >
            Data Visualization
          </button>
        )}
        {showPredictiveModels && (
          <button 
            className={`tab ${activeTab === 'predictive-models' ? 'active' : ''}`}
            onClick={() => handleTabChange('predictive-models')}
          >
            Predictive Models
          </button>
        )}
        {showCustomDashboards && (
          <button 
            className={`tab ${activeTab === 'custom-dashboards' ? 'active' : ''}`}
            onClick={() => handleTabChange('custom-dashboards')}
          >
            Custom Dashboards
          </button>
        )}
        {showExport && (
          <button 
            className={`tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => handleTabChange('export')}
          >
            Export
          </button>
        )}
        {showSharing && (
          <button 
            className={`tab ${activeTab === 'sharing' ? 'active' : ''}`}
            onClick={() => handleTabChange('sharing')}
          >
            Sharing
          </button>
        )}
      </div>

      {/* Content */}
      <div className="analytics-dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'data-visualization' && renderDataVisualization()}
        {activeTab === 'predictive-models' && renderPredictiveModels()}
        {activeTab === 'custom-dashboards' && renderCustomDashboards()}
        {activeTab === 'export' && renderExport()}
        {activeTab === 'sharing' && renderSharing()}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
