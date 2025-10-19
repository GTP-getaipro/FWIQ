/**
 * Advanced AI UI Component
 * 
 * A comprehensive React component for managing advanced AI features,
 * including model management, personalization, learning, and optimization.
 */

import React, { useState, useEffect, useRef } from 'react';
import { advancedAIEngine } from '../lib/advancedAI.js';

const AIAdvanced = ({ 
  userId, 
  onModelDeployed = () => {},
  onPersonalizationUpdated = () => {},
  onLearningInsights = () => {},
  onOptimizationComplete = () => {},
  showModelManagement = true,
  showPersonalization = true,
  showLearning = true,
  showOptimization = true
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [aiStatus, setAIStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [personalization, setPersonalization] = useState(null);
  const [learningInsights, setLearningInsights] = useState(null);
  const [optimizationMetrics, setOptimizationMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const aiEngineRef = useRef(null);

  // Initialize component
  useEffect(() => {
    if (userId) {
      initializeAI();
    }
  }, [userId]);

  // Initialize AI engine
  const initializeAI = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await advancedAIEngine.initialize(userId);
      if (result.success) {
        await loadAIData();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load AI data
  const loadAIData = async () => {
    try {
      // Get AI status
      const statusResult = await advancedAIEngine.getAIStatus(userId);
      if (statusResult.success) {
        setAIStatus(statusResult.status);
      }

      // Get model metrics
      const modelResult = await advancedAIEngine.manageModel(userId, 'list', {});
      if (modelResult.success) {
        setModels(modelResult.result || []);
      }

      // Get personalization insights
      if (showPersonalization) {
        const personalizationResult = await advancedAIEngine.getAIInsights(userId);
        if (personalizationResult.success) {
          setPersonalization(personalizationResult.insights.personalization);
        }
      }

      // Get learning insights
      if (showLearning) {
        const learningResult = await advancedAIEngine.getAIInsights(userId);
        if (learningResult.success) {
          setLearningInsights(learningResult.insights.learning);
        }
      }

      // Get optimization metrics
      if (showOptimization) {
        const optimizationResult = await advancedAIEngine.getPerformanceMetrics(userId);
        if (optimizationResult.success) {
          setOptimizationMetrics(optimizationResult.metrics);
        }
      }
    } catch (error) {
      console.error('Failed to load AI data:', error);
      setError(error.message);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle model deployment
  const handleModelDeploy = async (modelData) => {
    try {
      setIsLoading(true);
      const result = await advancedAIEngine.manageModel(userId, 'deploy', modelData);
      
      if (result.success) {
        await loadAIData();
        onModelDeployed(result.result);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to deploy model:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle personalization update
  const handlePersonalizationUpdate = async (preferences) => {
    try {
      setIsLoading(true);
      const result = await advancedAIEngine.personalizeResponse(userId, {}, { preferences });
      
      if (result.success) {
        await loadAIData();
        onPersonalizationUpdated(result.personalizedResponse);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to update personalization:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle optimization
  const handleOptimization = async () => {
    try {
      setIsLoading(true);
      const result = await advancedAIEngine.optimizePerformance(userId);
      
      if (result.success) {
        await loadAIData();
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
    if (!aiStatus) return null;

    return (
      <div className="ai-advanced-overview">
        {/* AI Status */}
        <div className="ai-status">
          <h3>AI System Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">Initialized</div>
              <div className={`status-value ${aiStatus.initialized ? 'success' : 'error'}`}>
                {aiStatus.initialized ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Active Models</div>
              <div className="status-value">{aiStatus.activeModels}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Personalization Profiles</div>
              <div className="status-value">{aiStatus.personalizationProfiles}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Learning Data Points</div>
              <div className="status-value">{aiStatus.learningDataPoints}</div>
            </div>
          </div>
        </div>

        {/* Component Status */}
        <div className="component-status">
          <h3>Component Status</h3>
          <div className="component-grid">
            {Object.entries(aiStatus.components).map(([component, status]) => (
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
              onClick={() => handleTabChange('models')}
              disabled={!showModelManagement}
            >
              Manage Models
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('personalization')}
              disabled={!showPersonalization}
            >
              Personalization
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('learning')}
              disabled={!showLearning}
            >
              Learning Insights
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleTabChange('optimization')}
              disabled={!showOptimization}
            >
              Optimization
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render model management tab
  const renderModelManagement = () => {
    return (
      <div className="ai-advanced-models">
        <div className="models-header">
          <h3>AI Model Management</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleTabChange('deploy-model')}
          >
            Deploy New Model
          </button>
        </div>

        <div className="models-list">
          {models.map((model, index) => (
            <div key={index} className="model-card">
              <div className="model-info">
                <div className="model-name">{model.name}</div>
                <div className="model-type">{model.type}</div>
                <div className="model-version">v{model.version}</div>
              </div>
              <div className="model-status">
                <div className={`status-badge ${model.status}`}>
                  {model.status}
                </div>
              </div>
              <div className="model-actions">
                <button className="btn btn-sm btn-secondary">Update</button>
                <button className="btn btn-sm btn-warning">Rollback</button>
                <button className="btn btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {models.length === 0 && (
          <div className="no-models">
            <p>No models deployed yet. Deploy your first model to get started.</p>
          </div>
        )}
      </div>
    );
  };

  // Render personalization tab
  const renderPersonalization = () => {
    if (!personalization) return null;

    return (
      <div className="ai-advanced-personalization">
        <div className="personalization-header">
          <h3>AI Personalization</h3>
          <div className="personalization-level">
            Level: <span className={`level-badge ${personalization.level}`}>
              {personalization.level}
            </span>
          </div>
        </div>

        <div className="personalization-content">
          {/* User Preferences */}
          <div className="preferences-section">
            <h4>User Preferences</h4>
            <div className="preferences-grid">
              {Object.entries(personalization.preferences || {}).map(([key, value]) => (
                <div key={key} className="preference-item">
                  <div className="preference-key">{key}</div>
                  <div className="preference-value">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior Patterns */}
          <div className="behavior-section">
            <h4>Behavior Patterns</h4>
            <div className="behavior-list">
              {Object.entries(personalization.behaviorPatterns || {}).map(([pattern, data]) => (
                <div key={pattern} className="behavior-item">
                  <div className="behavior-type">{pattern}</div>
                  <div className="behavior-data">
                    <div className="behavior-count">Count: {data.count}</div>
                    <div className="behavior-satisfaction">Avg Satisfaction: {data.avgSatisfaction?.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations-section">
            <h4>Recommendations</h4>
            <div className="recommendations-list">
              {personalization.recommendations?.map((rec, index) => (
                <div key={index} className={`recommendation-item ${rec.priority}`}>
                  <div className="recommendation-message">{rec.message}</div>
                  <div className="recommendation-priority">Priority: {rec.priority}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render learning tab
  const renderLearning = () => {
    if (!learningInsights) return null;

    return (
      <div className="ai-advanced-learning">
        <div className="learning-header">
          <h3>AI Learning & Adaptation</h3>
          <div className="learning-progress">
            Progress: <span className="progress-value">{learningInsights.progress || 0}%</span>
          </div>
        </div>

        <div className="learning-content">
          {/* Learning Trends */}
          <div className="trends-section">
            <h4>Learning Trends</h4>
            <div className="trends-grid">
              <div className="trend-item">
                <div className="trend-label">Overall Trend</div>
                <div className={`trend-value ${learningInsights.trends?.overallTrend || 'stable'}`}>
                  {learningInsights.trends?.overallTrend || 'stable'}
                </div>
              </div>
              <div className="trend-item">
                <div className="trend-label">Satisfaction Trend</div>
                <div className={`trend-value ${learningInsights.trends?.satisfactionTrend || 'stable'}`}>
                  {learningInsights.trends?.satisfactionTrend || 'stable'}
                </div>
              </div>
              <div className="trend-item">
                <div className="trend-label">Response Time Trend</div>
                <div className={`trend-value ${learningInsights.trends?.responseTimeTrend || 'stable'}`}>
                  {learningInsights.trends?.responseTimeTrend || 'stable'}
                </div>
              </div>
            </div>
          </div>

          {/* Adaptation Insights */}
          <div className="adaptation-section">
            <h4>Adaptation Insights</h4>
            <div className="adaptation-metrics">
              <div className="metric-item">
                <div className="metric-label">Adaptation Level</div>
                <div className="metric-value">{learningInsights.adaptation?.adaptationLevel || 0}%</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Model Performance</div>
                <div className="metric-value">{learningInsights.adaptation?.modelPerformance || 0}%</div>
              </div>
            </div>
          </div>

          {/* Learning Recommendations */}
          <div className="learning-recommendations">
            <h4>Learning Recommendations</h4>
            <div className="recommendations-list">
              {learningInsights.recommendations?.map((rec, index) => (
                <div key={index} className={`recommendation-item ${rec.priority}`}>
                  <div className="recommendation-message">{rec.message}</div>
                  <div className="recommendation-priority">Priority: {rec.priority}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render optimization tab
  const renderOptimization = () => {
    if (!optimizationMetrics) return null;

    return (
      <div className="ai-advanced-optimization">
        <div className="optimization-header">
          <h3>AI Performance Optimization</h3>
          <button 
            className="btn btn-primary" 
            onClick={handleOptimization}
            disabled={isLoading}
          >
            {isLoading ? 'Optimizing...' : 'Run Optimization'}
          </button>
        </div>

        <div className="optimization-content">
          {/* Performance Metrics */}
          <div className="metrics-section">
            <h4>Performance Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Total Requests</div>
                <div className="metric-value">{optimizationMetrics.totalRequests || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg Response Time</div>
                <div className="metric-value">{optimizationMetrics.avgResponseTime?.toFixed(0) || 0}ms</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg Token Usage</div>
                <div className="metric-value">{optimizationMetrics.avgTokenUsage?.toFixed(0) || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Success Rate</div>
                <div className="metric-value">{(optimizationMetrics.successRate * 100)?.toFixed(1) || 0}%</div>
              </div>
            </div>
          </div>

          {/* Model Performance */}
          <div className="model-performance-section">
            <h4>Model Performance</h4>
            <div className="model-performance-list">
              {Object.entries(optimizationMetrics.modelPerformance || {}).map(([model, metrics]) => (
                <div key={model} className="model-performance-item">
                  <div className="model-name">{model}</div>
                  <div className="model-metrics">
                    <div className="model-metric">Response Time: {metrics.avgResponseTime?.toFixed(0)}ms</div>
                    <div className="model-metric">Token Usage: {metrics.avgTokenUsage?.toFixed(0)}</div>
                    <div className="model-metric">Success Rate: {(metrics.successRate * 100)?.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Usage */}
          <div className="resource-usage-section">
            <h4>Resource Usage</h4>
            <div className="resource-metrics">
              <div className="resource-item">
                <div className="resource-label">CPU Usage</div>
                <div className="resource-value">{optimizationMetrics.resourceUsage?.cpuUsage || 0}%</div>
              </div>
              <div className="resource-item">
                <div className="resource-label">Memory Usage</div>
                <div className="resource-value">{optimizationMetrics.resourceUsage?.memoryUsage || 0}%</div>
              </div>
              <div className="resource-item">
                <div className="resource-label">Disk Usage</div>
                <div className="resource-value">{optimizationMetrics.resourceUsage?.diskUsage || 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !aiStatus) {
    return (
      <div className="ai-advanced-loading">
        <div className="loading-spinner"></div>
        <p>Initializing AI system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-advanced-error">
        <div className="error-icon">❌</div>
        <h3>AI System Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={initializeAI}>
          Retry Initialization
        </button>
      </div>
    );
  }

  return (
    <div className="ai-advanced">
      {/* Header */}
      <div className="ai-advanced-header">
        <h2>Advanced AI Features</h2>
        <div className="ai-actions">
          <button className="btn btn-secondary" onClick={loadAIData}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-advanced-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        {showModelManagement && (
          <button 
            className={`tab ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => handleTabChange('models')}
          >
            Models
          </button>
        )}
        {showPersonalization && (
          <button 
            className={`tab ${activeTab === 'personalization' ? 'active' : ''}`}
            onClick={() => handleTabChange('personalization')}
          >
            Personalization
          </button>
        )}
        {showLearning && (
          <button 
            className={`tab ${activeTab === 'learning' ? 'active' : ''}`}
            onClick={() => handleTabChange('learning')}
          >
            Learning
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
      <div className="ai-advanced-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'models' && renderModelManagement()}
        {activeTab === 'personalization' && renderPersonalization()}
        {activeTab === 'learning' && renderLearning()}
        {activeTab === 'optimization' && renderOptimization()}
      </div>
    </div>
  );
};

export default AIAdvanced;
