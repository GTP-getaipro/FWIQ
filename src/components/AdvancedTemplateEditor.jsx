/**
 * Advanced Template Editor UI Component
 * 
 * A comprehensive React component for managing advanced email templates,
 * including editing, A/B testing, analytics, collaboration, and optimization.
 */

import React, { useState, useEffect, useRef } from 'react';
import { advancedTemplateEditor } from '../lib/advancedTemplateEditor.js';

const AdvancedTemplateEditor = ({ 
  userId, 
  onTemplateCreated = () => {},
  onTemplateUpdated = () => {},
  onTemplateDeleted = () => {},
  onTemplateShared = () => {},
  onTemplateOptimized = () => {},
  showABTesting = true,
  showAnalytics = true,
  showCollaboration = true,
  showOptimization = true
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('editor');
  const [templateEditorStatus, setTemplateEditorStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateVersions, setTemplateVersions] = useState([]);
  const [abTests, setAbTests] = useState([]);
  const [templateAnalytics, setTemplateAnalytics] = useState(null);
  const [collaborationData, setCollaborationData] = useState(null);
  const [optimizationRecommendations, setOptimizationRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const templateEditorRef = useRef(null);

  // Initialize component
  useEffect(() => {
    if (userId) {
      initializeTemplateEditor();
    }
  }, [userId]);

  // Initialize template editor
  const initializeTemplateEditor = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await advancedTemplateEditor.initialize(userId);
      if (result.success) {
        await loadTemplateEditorData();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to initialize template editor:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load template editor data
  const loadTemplateEditorData = async () => {
    try {
      // Get template editor status
      const statusResult = await advancedTemplateEditor.getTemplateEditorStatus(userId);
      if (statusResult.success) {
        setTemplateEditorStatus(statusResult.status);
      }
    } catch (error) {
      console.error('Failed to load template editor data:', error);
      setError(error.message);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle template creation
  const handleTemplateCreate = async (templateData) => {
    try {
      setIsLoading(true);
      const result = await advancedTemplateEditor.createTemplate(userId, templateData);
      
      if (result.success) {
        await loadTemplateEditorData();
        onTemplateCreated(result.template);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template update
  const handleTemplateUpdate = async (templateId, updates) => {
    try {
      setIsLoading(true);
      const result = await advancedTemplateEditor.updateTemplate(userId, templateId, updates);
      
      if (result.success) {
        await loadTemplateEditorData();
        onTemplateUpdated(result.template);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to update template:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template deletion
  const handleTemplateDelete = async (templateId) => {
    try {
      setIsLoading(true);
      const result = await advancedTemplateEditor.deleteTemplate(userId, templateId);
      
      if (result.success) {
        await loadTemplateEditorData();
        onTemplateDeleted(result.template);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template sharing
  const handleTemplateShare = async (templateId, shareConfig) => {
    try {
      setIsLoading(true);
      const result = await advancedTemplateEditor.shareTemplate(userId, templateId, shareConfig);
      
      if (result.success) {
        await loadTemplateEditorData();
        onTemplateShared(result.share);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to share template:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle template optimization
  const handleTemplateOptimization = async (templateId, optimizationConfig) => {
    try {
      setIsLoading(true);
      const result = await advancedTemplateEditor.applyTemplateOptimization(userId, templateId, optimizationConfig);
      
      if (result.success) {
        await loadTemplateEditorData();
        onTemplateOptimized(result.optimizationResult);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Failed to optimize template:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render editor tab
  const renderEditor = () => {
    return (
      <div className="template-editor">
        <div className="editor-header">
          <h3>Template Editor</h3>
          <div className="editor-actions">
            <button 
              className="btn btn-primary" 
              onClick={() => handleTemplateCreate({ 
                name: 'New Template',
                description: 'A new email template',
                content: '<h1>Hello World</h1><p>This is a new template.</p>'
              })}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>

        <div className="editor-workspace">
          <div className="editor-sidebar">
            <div className="template-list">
              <h4>Templates</h4>
              <ul>
                {templates.map((template, index) => (
                  <li 
                    key={index}
                    className={`template-item ${currentTemplate?.id === template.id ? 'active' : ''}`}
                    onClick={() => setCurrentTemplate(template)}
                  >
                    <div className="template-name">{template.name}</div>
                    <div className="template-status">{template.status}</div>
                    <div className="template-actions">
                      <button className="btn btn-sm btn-secondary">Edit</button>
                      <button className="btn btn-sm btn-primary">View</button>
                      <button className="btn btn-sm btn-warning">Duplicate</button>
                      <button className="btn btn-sm btn-danger">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="template-components">
              <h4>Components</h4>
              <div className="components-grid">
                <div className="component-item">
                  <div className="component-name">Header</div>
                  <button className="btn btn-sm btn-primary">Add</button>
                </div>
                <div className="component-item">
                  <div className="component-name">Content</div>
                  <button className="btn btn-sm btn-primary">Add</button>
                </div>
                <div className="component-item">
                  <div className="component-name">Footer</div>
                  <button className="btn btn-sm btn-primary">Add</button>
                </div>
                <div className="component-item">
                  <div className="component-name">Button</div>
                  <button className="btn btn-sm btn-primary">Add</button>
                </div>
              </div>
            </div>
          </div>

          <div className="editor-main">
            <div className="editor-toolbar">
              <div className="toolbar-group">
                <button className="btn btn-sm btn-secondary">Undo</button>
                <button className="btn btn-sm btn-secondary">Redo</button>
              </div>
              <div className="toolbar-group">
                <button className="btn btn-sm btn-secondary">Bold</button>
                <button className="btn btn-sm btn-secondary">Italic</button>
                <button className="btn btn-sm btn-secondary">Underline</button>
              </div>
              <div className="toolbar-group">
                <button className="btn btn-sm btn-secondary">Align Left</button>
                <button className="btn btn-sm btn-secondary">Align Center</button>
                <button className="btn btn-sm btn-secondary">Align Right</button>
              </div>
              <div className="toolbar-group">
                <button className="btn btn-sm btn-secondary">Insert Link</button>
                <button className="btn btn-sm btn-secondary">Insert Image</button>
              </div>
            </div>

            <div className="editor-content">
              <div className="editor-preview">
                <h4>Preview</h4>
                <div className="preview-container">
                  {currentTemplate ? (
                    <div dangerouslySetInnerHTML={{ __html: currentTemplate.content }} />
                  ) : (
                    <div className="preview-placeholder">
                      <p>Select a template to preview</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="editor-code">
                <h4>Code</h4>
                <textarea
                  className="code-editor"
                  value={currentTemplate?.content || ''}
                  onChange={(e) => {
                    if (currentTemplate) {
                      setCurrentTemplate({
                        ...currentTemplate,
                        content: e.target.value
                      });
                    }
                  }}
                  placeholder="Enter template HTML code..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render A/B testing tab
  const renderABTesting = () => {
    return (
      <div className="template-ab-testing">
        <div className="ab-testing-header">
          <h3>A/B Testing</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleTemplateCreate({ 
              name: 'A/B Test Template',
              description: 'Template for A/B testing',
              content: '<h1>A/B Test Template</h1>'
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create A/B Test'}
          </button>
        </div>

        <div className="ab-testing-content">
          <div className="test-list">
            <h4>Active Tests</h4>
            <div className="tests-grid">
              {abTests.map((test, index) => (
                <div key={index} className="test-card">
                  <div className="test-info">
                    <div className="test-name">{test.name}</div>
                    <div className="test-status">{test.status}</div>
                    <div className="test-metrics">
                      <div className="metric">Open Rate: {test.openRate}%</div>
                      <div className="metric">Click Rate: {test.clickRate}%</div>
                    </div>
                  </div>
                  <div className="test-actions">
                    <button className="btn btn-sm btn-secondary">View</button>
                    <button className="btn btn-sm btn-primary">Edit</button>
                    <button className="btn btn-sm btn-warning">Stop</button>
                    <button className="btn btn-sm btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="test-creator">
            <h4>Create New Test</h4>
            <div className="test-form">
              <div className="form-group">
                <label>Test Name</label>
                <input type="text" className="form-control" placeholder="Enter test name" />
              </div>
              <div className="form-group">
                <label>Test Description</label>
                <textarea className="form-control" placeholder="Enter test description" />
              </div>
              <div className="form-group">
                <label>Test Duration (days)</label>
                <input type="number" className="form-control" placeholder="7" />
              </div>
              <div className="form-group">
                <label>Traffic Split (%)</label>
                <input type="number" className="form-control" placeholder="50" />
              </div>
              <button className="btn btn-primary">Create Test</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render analytics tab
  const renderAnalytics = () => {
    return (
      <div className="template-analytics">
        <div className="analytics-header">
          <h3>Template Analytics</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleTemplateCreate({ 
              name: 'Analytics Template',
              description: 'Template for analytics tracking',
              content: '<h1>Analytics Template</h1>'
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Generate Report'}
          </button>
        </div>

        <div className="analytics-content">
          <div className="analytics-overview">
            <h4>Overview</h4>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Total Templates</div>
                <div className="metric-value">{templateEditorStatus?.templates || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Active Templates</div>
                <div className="metric-value">{templates.filter(t => t.status === 'active').length}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Sends</div>
                <div className="metric-value">1,234</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Open Rate</div>
                <div className="metric-value">24.5%</div>
              </div>
            </div>
          </div>

          <div className="analytics-details">
            <h4>Template Performance</h4>
            <div className="performance-table">
              <table>
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>Sends</th>
                    <th>Opens</th>
                    <th>Clicks</th>
                    <th>Open Rate</th>
                    <th>Click Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template, index) => (
                    <tr key={index}>
                      <td>{template.name}</td>
                      <td>1,234</td>
                      <td>302</td>
                      <td>45</td>
                      <td>24.5%</td>
                      <td>3.6%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render collaboration tab
  const renderCollaboration = () => {
    return (
      <div className="template-collaboration">
        <div className="collaboration-header">
          <h3>Template Collaboration</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleTemplateShare('template_123', { 
              shareType: 'view',
              recipients: [{ userId: 'user_456', email: 'collaborator@example.com' }]
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share Template'}
          </button>
        </div>

        <div className="collaboration-content">
          <div className="collaborators">
            <h4>Collaborators</h4>
            <div className="collaborators-list">
              {collaborationData?.collaborators?.map((collaborator, index) => (
                <div key={index} className="collaborator-item">
                  <div className="collaborator-info">
                    <div className="collaborator-name">{collaborator.collaborator_name}</div>
                    <div className="collaborator-email">{collaborator.collaborator_email}</div>
                    <div className="collaborator-role">{collaborator.role}</div>
                  </div>
                  <div className="collaborator-actions">
                    <button className="btn btn-sm btn-secondary">Edit</button>
                    <button className="btn btn-sm btn-danger">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="comments">
            <h4>Comments</h4>
            <div className="comments-list">
              {collaborationData?.comments?.map((comment, index) => (
                <div key={index} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-author">{comment.created_by}</div>
                    <div className="comment-date">{new Date(comment.created_at).toLocaleString()}</div>
                  </div>
                  <div className="comment-content">{comment.comment_text}</div>
                  <div className="comment-actions">
                    <button className="btn btn-sm btn-secondary">Reply</button>
                    <button className="btn btn-sm btn-primary">Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="add-comment">
            <h4>Add Comment</h4>
            <div className="comment-form">
              <textarea className="form-control" placeholder="Enter your comment..." />
              <button className="btn btn-primary">Add Comment</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render optimization tab
  const renderOptimization = () => {
    return (
      <div className="template-optimization">
        <div className="optimization-header">
          <h3>Template Optimization</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => handleTemplateOptimization('template_123', { 
              type: 'content_optimization',
              addHeadings: true,
              improveReadability: true
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Optimizing...' : 'Apply Optimization'}
          </button>
        </div>

        <div className="optimization-content">
          <div className="optimization-overview">
            <h4>Optimization Overview</h4>
            <div className="optimization-metrics">
              <div className="metric-card">
                <div className="metric-label">Overall Score</div>
                <div className="metric-value">85/100</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Content Score</div>
                <div className="metric-value">90/100</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Performance Score</div>
                <div className="metric-value">80/100</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Accessibility Score</div>
                <div className="metric-value">75/100</div>
              </div>
            </div>
          </div>

          <div className="optimization-recommendations">
            <h4>Recommendations</h4>
            <div className="recommendations-list">
              {optimizationRecommendations.map((recommendation, index) => (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-header">
                    <div className="recommendation-title">{recommendation.title}</div>
                    <div className={`recommendation-priority ${recommendation.priority}`}>
                      {recommendation.priority}
                    </div>
                  </div>
                  <div className="recommendation-description">{recommendation.description}</div>
                  <div className="recommendation-actions">
                    <button className="btn btn-sm btn-primary">Apply</button>
                    <button className="btn btn-sm btn-secondary">Learn More</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="optimization-history">
            <h4>Optimization History</h4>
            <div className="history-list">
              <div className="history-item">
                <div className="history-date">2024-01-15</div>
                <div className="history-action">Content optimization applied</div>
                <div className="history-impact">+15% improvement</div>
              </div>
              <div className="history-item">
                <div className="history-date">2024-01-10</div>
                <div className="history-action">Performance optimization applied</div>
                <div className="history-impact">+8% improvement</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !templateEditorStatus) {
    return (
      <div className="template-editor-loading">
        <div className="loading-spinner"></div>
        <p>Initializing Template Editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="template-editor-error">
        <div className="error-icon">❌</div>
        <h3>Template Editor Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={initializeTemplateEditor}>
          Retry Initialization
        </button>
      </div>
    );
  }

  return (
    <div className="advanced-template-editor">
      {/* Header */}
      <div className="template-editor-header">
        <h2>Advanced Template Editor</h2>
        <div className="editor-actions">
          <button className="btn btn-secondary" onClick={loadTemplateEditorData}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="template-editor-tabs">
        <button 
          className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => handleTabChange('editor')}
        >
          Editor
        </button>
        {showABTesting && (
          <button 
            className={`tab ${activeTab === 'ab-testing' ? 'active' : ''}`}
            onClick={() => handleTabChange('ab-testing')}
          >
            A/B Testing
          </button>
        )}
        {showAnalytics && (
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            Analytics
          </button>
        )}
        {showCollaboration && (
          <button 
            className={`tab ${activeTab === 'collaboration' ? 'active' : ''}`}
            onClick={() => handleTabChange('collaboration')}
          >
            Collaboration
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
      <div className="template-editor-content">
        {activeTab === 'editor' && renderEditor()}
        {activeTab === 'ab-testing' && renderABTesting()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'collaboration' && renderCollaboration()}
        {activeTab === 'optimization' && renderOptimization()}
      </div>
    </div>
  );
};

export default AdvancedTemplateEditor;
