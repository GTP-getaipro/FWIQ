/**
 * Advanced Business Intelligence UI Component
 * 
 * A comprehensive React component for managing advanced BI features,
 * reporting, insights, data modeling, optimization, and scheduling.
 */

import React, { useState, useEffect, useRef } from 'react';
import { advancedBIEngine } from '../lib/advancedBIReporting.js';

const BusinessIntelligenceAdvanced = ({ 
  userId, 
  onReportGenerated = () => {},
  onInsightsGenerated = () => {},
  onDataModelCreated = () => {},
  onPerformanceOptimized = () => {},
  onReportScheduled = () => {},
  showBIReporting = true,
  showAutomatedInsights = true,
  showDataModeling = true,
  showBIOptimization = true,
  showBIScheduling = true
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [biStatus, setBiStatus] = useState(null);
  const [reports, setReports] = useState([]);
  const [insights, setInsights] = useState([]);
  const [dataModels, setDataModels] = useState([]);
  const [optimizations, setOptimizations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [biInsights, setBiInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const biEngineRef = useRef(null);

  // Initialize component
  useEffect(() => {
    if (userId) {
      initializeBI();
    }
  }, [userId]);

  // Initialize BI engine
  const initializeBI = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await advancedBIEngine.initialize(userId);
      if (result.success) {
        await loadBIData();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to initialize BI:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load BI data
  const loadBIData = async () => {
    try {
      // Get BI status
      const statusResult = await advancedBIEngine.getBIStatus(userId);
      if (statusResult.success) {
        setBiStatus(statusResult.status);
      }

      // Get BI insights
      const insightsResult = await advancedBIEngine.getBIInsights(userId);
      if (insightsResult.success) {
        setBiInsights(insightsResult.insights);
      }
    } catch (error) {
      console.error('Failed to load BI data:', error);
      setError(error.message);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle report generation
  const handleReportGenerate = async (reportData) => {
    try {
      setIsLoading(true);
      const result = await advancedBIEngine.generateBIReport(userId, reportData);
      
      if (result.success) {
        await loadBIData();
        onReportGenerated(result.report);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle insights generation
  const handleInsightsGenerate = async (insightData) => {
    try {
      setIsLoading(true);
      const result = await advancedBIEngine.generateAutomatedInsights(userId, insightData);
      
      if (result.success) {
        await loadBIData();
        onInsightsGenerated(result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data model creation
  const handleDataModelCreate = async (modelData) => {
    try {
      setIsLoading(true);
      const result = await advancedBIEngine.createDataModel(userId, modelData);
      
      if (result.success) {
        await loadBIData();
        onDataModelCreated(result.dataModel);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to create data model:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle performance optimization
  const handlePerformanceOptimize = async (optimizationData) => {
    try {
      setIsLoading(true);
      const result = await advancedBIEngine.optimizeBIPerformance(userId, optimizationData);
      
      if (result.success) {
        await loadBIData();
        onPerformanceOptimized(result);
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

  // Handle report scheduling
  const handleReportSchedule = async (scheduleData) => {
    try {
      setIsLoading(true);
      const result = await advancedBIEngine.scheduleBIReport(userId, scheduleData);
      
      if (result.success) {
        await loadBIData();
        onReportScheduled(result.schedule);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to schedule report:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render overview tab
  const renderOverview = () => {
    if (!biStatus) return null;

    return (
      <div className="bi-dashboard-overview">
        {/* BI Status */}
        <div className="bi-status">
          <h3>Business Intelligence System Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Initialized</div>
              <div className={`status-value ${biStatus.initialized ? 'success' : 'error'}`}>
                {biStatus.initialized ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Report Templates</div>
              <div className="status-value">{biStatus.reportTemplates}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Insight Rules</div>
              <div className="status-value">{biStatus.insightRules}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Data Models</div>
              <div className="status-value">{biStatus.dataModels}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Optimization Configs</div>
              <div className="status-value">{biStatus.optimizationConfigs}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Scheduled Reports</div>
              <div className="status-value">{biStatus.scheduledReports}</div>
            </div>
          </div>
        </div>

        {/* Component Status */}
        <div className="component-status">
          <h3>Component Status</h3>
          <div className="component-grid">
            {Object.entries(biStatus.components).map(([component, status]) => (
              <div key={component} className="component-item">
                <div className="component-name">{component}</div>
                <div className={`component-status ${status ? 'active' : 'inactive'}`}>
                  {status ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BI Insights */}
        {biInsights && (
          <div className="bi-insights">
            <h3>Business Intelligence Insights</h3>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-label">Overall BI Score</div>
                <div className={`insight-value ${biInsights.overall?.score >= 80 ? 'good' : biInsights.overall?.score >= 60 ? 'fair' : 'poor'}`}>
                  {biInsights.overall?.score || 0}/100
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Active Reports</div>
                <div className="insight-value">
                  {biInsights.reporting?.totalReports || 0}
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Automated Insights</div>
                <div className="insight-value">
                  {biInsights.automated?.totalInsights || 0}
                </div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Data Models</div>
                <div className="insight-value">
                  {biInsights.dataModeling?.totalModels || 0}
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
              onClick={() => handleTabChange('bi-reporting')}
              disabled={!showBIReporting}
            >
              BI Reporting
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('automated-insights')}
              disabled={!showAutomatedInsights}
            >
              Automated Insights
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('data-modeling')}
              disabled={!showDataModeling}
            >
              Data Modeling
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('bi-optimization')}
              disabled={!showBIOptimization}
            >
              BI Optimization
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('bi-scheduling')}
              disabled={!showBIScheduling}
            >
              BI Scheduling
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render BI reporting tab
  const renderBIReporting = () => {
    return (
      <div className="bi-dashboard-reporting">
        <div className="reporting-header">
          <h3>BI Reporting</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleReportGenerate({ 
              type: 'executive', 
              name: 'Executive Report', 
              dataSource: 'sales_data' 
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        <div className="report-types">
          <h4>Report Types</h4>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-name">Executive Reports</div>
              <div className="type-description">High-level strategic reports for executives</div>
              <button className="btn btn-sm btn-primary">Create Report</button>
            </div>
            <div className="type-card">
              <div className="type-name">Operational Reports</div>
              <div className="type-description">Day-to-day operational metrics and KPIs</div>
              <button className="btn btn-sm btn-primary">Create Report</button>
            </div>
            <div className="type-card">
              <div className="type-name">Financial Reports</div>
              <div className="type-description">Financial performance and analysis</div>
              <button className="btn btn-sm btn-primary">Create Report</button>
            </div>
            <div className="type-card">
              <div className="type-name">Custom Reports</div>
              <div className="type-description">Custom reports with specific requirements</div>
              <button className="btn btn-sm btn-primary">Create Report</button>
            </div>
          </div>
        </div>

        <div className="report-list">
          <h4>Existing Reports</h4>
          <div className="reports-grid">
            {reports.map((report, index) => (
              <div key={index} className="report-card">
                <div className="report-info">
                  <div className="report-name">{report.name}</div>
                  <div className="report-type">{report.type}</div>
                  <div className="report-status">{report.status}</div>
                </div>
                <div className="report-actions">
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-primary">View</button>
                  <button className="btn btn-sm btn-warning">Schedule</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render automated insights tab
  const renderAutomatedInsights = () => {
    return (
      <div className="bi-dashboard-insights">
        <div className="insights-header">
          <h3>Automated Insights</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleInsightsGenerate({ 
              type: 'trend_analysis', 
              dataPoints: 30 
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Insights'}
          </button>
        </div>

        <div className="insight-types">
          <h4>Insight Types</h4>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-name">Trend Analysis</div>
              <div className="type-description">Identify trends and patterns in data</div>
              <button className="btn btn-sm btn-primary">Generate</button>
            </div>
            <div className="type-card">
              <div className="type-name">Anomaly Detection</div>
              <div className="type-description">Detect unusual patterns and outliers</div>
              <button className="btn btn-sm btn-primary">Generate</button>
            </div>
            <div className="type-card">
              <div className="type-name">Correlation Analysis</div>
              <div className="type-description">Find relationships between variables</div>
              <button className="btn btn-sm btn-primary">Generate</button>
            </div>
            <div className="type-card">
              <div className="type-name">Seasonal Analysis</div>
              <div className="type-description">Identify seasonal patterns and cycles</div>
              <button className="btn btn-sm btn-primary">Generate</button>
            </div>
          </div>
        </div>

        <div className="insights-list">
          <h4>Generated Insights</h4>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className="insight-card">
                <div className="insight-info">
                  <div className="insight-name">{insight.type}</div>
                  <div className="insight-confidence">Confidence: {(insight.confidence * 100).toFixed(1)}%</div>
                  <div className="insight-description">{insight.description}</div>
                </div>
                <div className="insight-actions">
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

  // Render data modeling tab
  const renderDataModeling = () => {
    return (
      <div className="bi-dashboard-modeling">
        <div className="modeling-header">
          <h3>Data Modeling</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleDataModelCreate({ 
              name: 'Sales Model', 
              type: 'dimensional',
              description: 'Sales data model'
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Data Model'}
          </button>
        </div>

        <div className="model-types">
          <h4>Model Types</h4>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-name">Dimensional Model</div>
              <div className="type-description">Star and snowflake schemas for analytics</div>
              <button className="btn btn-sm btn-primary">Create Model</button>
            </div>
            <div className="type-card">
              <div className="type-name">Relational Model</div>
              <div className="type-description">Traditional relational database design</div>
              <button className="btn btn-sm btn-primary">Create Model</button>
            </div>
            <div className="type-card">
              <div className="type-name">Star Schema</div>
              <div className="type-description">Central fact table with dimension tables</div>
              <button className="btn btn-sm btn-primary">Create Model</button>
            </div>
            <div className="type-card">
              <div className="type-name">Snowflake Schema</div>
              <div className="type-description">Normalized dimension tables</div>
              <button className="btn btn-sm btn-primary">Create Model</button>
            </div>
          </div>
        </div>

        <div className="models-list">
          <h4>Existing Data Models</h4>
          <div className="models-grid">
            {dataModels.map((model, index) => (
              <div key={index} className="model-card">
                <div className="model-info">
                  <div className="model-name">{model.name}</div>
                  <div className="model-type">{model.type}</div>
                  <div className="model-description">{model.description}</div>
                </div>
                <div className="model-actions">
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-primary">View</button>
                  <button className="btn btn-sm btn-warning">Validate</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render BI optimization tab
  const renderBIOptimization = () => {
    return (
      <div className="bi-dashboard-optimization">
        <div className="optimization-header">
          <h3>BI Performance Optimization</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handlePerformanceOptimize({ 
              type: 'query', 
              query: 'SELECT * FROM sales_data' 
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Optimizing...' : 'Optimize Performance'}
          </button>
        </div>

        <div className="optimization-types">
          <h4>Optimization Types</h4>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-name">Query Optimization</div>
              <div className="type-description">Optimize SQL queries for better performance</div>
              <button className="btn btn-sm btn-primary">Optimize</button>
            </div>
            <div className="type-card">
              <div className="type-name">Index Optimization</div>
              <div className="type-description">Optimize database indexes</div>
              <button className="btn btn-sm btn-primary">Optimize</button>
            </div>
            <div className="type-card">
              <div className="type-name">Cache Optimization</div>
              <div className="type-description">Optimize caching strategies</div>
              <button className="btn btn-sm btn-primary">Optimize</button>
            </div>
            <div className="type-card">
              <div className="type-name">Resource Optimization</div>
              <div className="type-description">Optimize system resources</div>
              <button className="btn btn-sm btn-primary">Optimize</button>
            </div>
          </div>
        </div>

        <div className="optimizations-list">
          <h4>Optimization Results</h4>
          <div className="optimizations-grid">
            {optimizations.map((optimization, index) => (
              <div key={index} className="optimization-card">
                <div className="optimization-info">
                  <div className="optimization-type">{optimization.type}</div>
                  <div className="optimization-gain">Performance Gain: {optimization.performanceGain}%</div>
                  <div className="optimization-status">{optimization.status}</div>
                </div>
                <div className="optimization-actions">
                  <button className="btn btn-sm btn-secondary">View Details</button>
                  <button className="btn btn-sm btn-primary">Apply</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render BI scheduling tab
  const renderBIScheduling = () => {
    return (
      <div className="bi-dashboard-scheduling">
        <div className="scheduling-header">
          <h3>BI Report Scheduling</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleReportSchedule({ 
              type: 'daily', 
              reportId: 'executive_report',
              scheduleConfig: { hour: 9, minute: 0 }
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Scheduling...' : 'Schedule Report'}
          </button>
        </div>

        <div className="schedule-types">
          <h4>Schedule Types</h4>
          <div className="types-grid">
            <div className="type-card">
              <div className="type-name">Daily Schedule</div>
              <div className="type-description">Run reports daily at specified time</div>
              <button className="btn btn-sm btn-primary">Schedule</button>
            </div>
            <div className="type-card">
              <div className="type-name">Weekly Schedule</div>
              <div className="type-description">Run reports weekly on specific day</div>
              <button className="btn btn-sm btn-primary">Schedule</button>
            </div>
            <div className="type-card">
              <div className="type-name">Monthly Schedule</div>
              <div className="type-description">Run reports monthly on specific date</div>
              <button className="btn btn-sm btn-primary">Schedule</button>
            </div>
            <div className="type-card">
              <div className="type-name">Custom Schedule</div>
              <div className="type-description">Custom scheduling with specific intervals</div>
              <button className="btn btn-sm btn-primary">Schedule</button>
            </div>
          </div>
        </div>

        <div className="schedules-list">
          <h4>Scheduled Reports</h4>
          <div className="schedules-grid">
            {schedules.map((schedule, index) => (
              <div key={index} className="schedule-card">
                <div className="schedule-info">
                  <div className="schedule-name">{schedule.name}</div>
                  <div className="schedule-type">{schedule.type}</div>
                  <div className="schedule-next-run">Next Run: {new Date(schedule.next_run).toLocaleString()}</div>
                </div>
                <div className="schedule-actions">
                  <button className="btn btn-sm btn-secondary">Edit</button>
                  <button className="btn btn-sm btn-primary">Execute</button>
                  <button className="btn btn-sm btn-warning">Pause</button>
                  <button className="btn btn-sm btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !biStatus) {
    return (
      <div className="bi-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Initializing Business Intelligence system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-dashboard-error">
        <div className="error-icon">❌</div>
        <h3>Business Intelligence System Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={initializeBI}>
          Retry Initialization
        </button>
      </div>
    );
  }

  return (
    <div className="bi-dashboard">
      {/* Header */}
      <div className="bi-dashboard-header">
        <h2>Advanced Business Intelligence Dashboard</h2>
        <div className="dashboard-actions">
          <button className="btn btn-secondary" onClick={loadBIData}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bi-dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        {showBIReporting && (
          <button 
            className={`tab ${activeTab === 'bi-reporting' ? 'active' : ''}`}
            onClick={() => handleTabChange('bi-reporting')}
          >
            BI Reporting
          </button>
        )}
        {showAutomatedInsights && (
          <button 
            className={`tab ${activeTab === 'automated-insights' ? 'active' : ''}`}
            onClick={() => handleTabChange('automated-insights')}
          >
            Automated Insights
          </button>
        )}
        {showDataModeling && (
          <button 
            className={`tab ${activeTab === 'data-modeling' ? 'active' : ''}`}
            onClick={() => handleTabChange('data-modeling')}
          >
            Data Modeling
          </button>
        )}
        {showBIOptimization && (
          <button 
            className={`tab ${activeTab === 'bi-optimization' ? 'active' : ''}`}
            onClick={() => handleTabChange('bi-optimization')}
          >
            BI Optimization
          </button>
        )}
        {showBIScheduling && (
          <button 
            className={`tab ${activeTab === 'bi-scheduling' ? 'active' : ''}`}
            onClick={() => handleTabChange('bi-scheduling')}
          >
            BI Scheduling
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bi-dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'bi-reporting' && renderBIReporting()}
        {activeTab === 'automated-insights' && renderAutomatedInsights()}
        {activeTab === 'data-modeling' && renderDataModeling()}
        {activeTab === 'bi-optimization' && renderBIOptimization()}
        {activeTab === 'bi-scheduling' && renderBIScheduling()}
      </div>
    </div>
  );
};

export default BusinessIntelligenceAdvanced;
