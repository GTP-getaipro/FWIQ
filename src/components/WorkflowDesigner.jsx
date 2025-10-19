/**
 * Advanced Workflow Designer Component
 * 
 * A comprehensive React component for designing, editing, and managing
 * complex workflows with drag-and-drop functionality and real-time preview.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { advancedWorkflowEngine } from '../lib/advancedWorkflowEngine.js';
import { workflowOrchestrator } from '../lib/workflowOrchestrator.js';
import { workflowErrorRecovery } from '../lib/workflowErrorRecovery.js';
import { advancedWorkflowMonitor } from '../lib/advancedWorkflowMonitor.js';
import { workflowTemplateManager } from '../lib/workflowTemplateManager.js';

const WorkflowDesigner = ({ 
  workflowId = null, 
  onSave = () => {}, 
  onDeploy = () => {},
  onTest = () => {},
  userId 
}) => {
  // State management
  const [workflow, setWorkflow] = useState({
    id: null,
    name: '',
    description: '',
    nodes: [],
    connections: [],
    metadata: {},
    status: 'draft'
  });
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Refs
  const canvasRef = useRef(null);
  const nodeLibraryRef = useRef(null);
  const connectionPreviewRef = useRef(null);

  // Node types and templates
  const nodeTypes = {
    'trigger': {
      name: 'Trigger',
      icon: '⚡',
      color: '#10B981',
      description: 'Starts the workflow execution',
      categories: ['email', 'webhook', 'schedule', 'manual']
    },
    'action': {
      name: 'Action',
      icon: '⚙️',
      color: '#3B82F6',
      description: 'Performs a specific action',
      categories: ['email', 'data', 'api', 'notification']
    },
    'condition': {
      name: 'Condition',
      icon: '❓',
      color: '#F59E0B',
      description: 'Evaluates conditions and routes flow',
      categories: ['logic', 'comparison', 'validation']
    },
    'transform': {
      name: 'Transform',
      icon: '🔄',
      color: '#8B5CF6',
      description: 'Transforms or processes data',
      categories: ['data', 'format', 'calculation']
    },
    'delay': {
      name: 'Delay',
      icon: '⏱️',
      color: '#06B6D4',
      description: 'Adds a delay or wait period',
      categories: ['timing', 'scheduling']
    },
    'webhook': {
      name: 'Webhook',
      icon: '🔗',
      color: '#EF4444',
      description: 'Sends data to external systems',
      categories: ['integration', 'api', 'notification']
    }
  };

  // Initialize component
  useEffect(() => {
    initializeWorkflow();
    loadTemplates();
  }, [workflowId]);

  // Initialize workflow
  const initializeWorkflow = async () => {
    try {
      setIsLoading(true);
      
      if (workflowId) {
        // Load existing workflow
        const result = await advancedWorkflowEngine.getWorkflow(userId, workflowId);
        if (result.success) {
          setWorkflow(result.data);
        } else {
          setError(result.error);
        }
      } else {
        // Create new workflow
        const newWorkflow = {
          id: null,
          name: 'New Workflow',
          description: '',
          nodes: [],
          connections: [],
          metadata: {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            complexity: 'basic'
          },
          status: 'draft'
        };
        setWorkflow(newWorkflow);
      }
    } catch (error) {
      setError('Failed to initialize workflow');
      console.error('Initialize workflow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load templates
  const loadTemplates = async () => {
    try {
      const result = await workflowTemplateManager.getAllTemplates(userId);
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  // Add node to workflow
  const addNode = useCallback((nodeType, position = { x: 100, y: 100 }) => {
    const newNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: nodeType,
      name: `${nodeTypes[nodeType]?.name || 'Node'} ${workflow.nodes.length + 1}`,
      position: { ...position },
      parameters: getDefaultParameters(nodeType),
      status: 'idle',
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));

    return newNode;
  }, [workflow.nodes.length]);

  // Get default parameters for node type
  const getDefaultParameters = (nodeType) => {
    const defaults = {
      trigger: {
        trigger_type: 'manual',
        conditions: []
      },
      action: {
        action_type: 'email_send',
        parameters: {}
      },
      condition: {
        conditions: [],
        true_path: null,
        false_path: null
      },
      transform: {
        transformation_type: 'data_mapping',
        mapping: {}
      },
      delay: {
        delay_type: 'fixed',
        duration: 1000
      },
      webhook: {
        url: '',
        method: 'POST',
        headers: {},
        body: {}
      }
    };

    return defaults[nodeType] || {};
  };

  // Remove node from workflow
  const removeNode = useCallback((nodeId) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(conn => 
        conn.from !== nodeId && conn.to !== nodeId
      )
    }));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Update node
  const updateNode = useCallback((nodeId, updates) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  // Add connection between nodes
  const addConnection = useCallback((fromNodeId, toNodeId) => {
    // Check if connection already exists
    const existingConnection = workflow.connections.find(conn => 
      conn.from === fromNodeId && conn.to === toNodeId
    );

    if (existingConnection) return;

    // Check for circular dependencies
    if (wouldCreateCycle(fromNodeId, toNodeId)) {
      setError('Cannot create circular connections');
      return;
    }

    const newConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from: fromNodeId,
      to: toNodeId,
      type: 'default',
      metadata: {
        created_at: new Date().toISOString()
      }
    };

    setWorkflow(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
  }, [workflow.connections]);

  // Check for circular dependencies
  const wouldCreateCycle = (fromNodeId, toNodeId) => {
    const visited = new Set();
    
    const dfs = (nodeId) => {
      if (visited.has(nodeId)) return true;
      if (nodeId === fromNodeId) return true;
      
      visited.add(nodeId);
      
      const outgoingConnections = workflow.connections.filter(conn => conn.from === nodeId);
      for (const conn of outgoingConnections) {
        if (dfs(conn.to)) return true;
      }
      
      return false;
    };

    return dfs(toNodeId);
  };

  // Remove connection
  const removeConnection = useCallback((connectionId) => {
    setWorkflow(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== connectionId)
    }));

    if (selectedConnection?.id === connectionId) {
      setSelectedConnection(null);
    }
  }, [selectedConnection]);

  // Handle canvas interactions
  const handleCanvasClick = (event) => {
    if (event.target === canvasRef.current) {
      setSelectedNode(null);
      setSelectedConnection(null);
    }
  };

  const handleCanvasMouseDown = (event) => {
    if (event.target === canvasRef.current) {
      setIsDragging(true);
      setDragOffset({
        x: event.clientX - canvasOffset.x,
        y: event.clientY - canvasOffset.y
      });
    }
  };

  const handleCanvasMouseMove = (event) => {
    if (isDragging) {
      setCanvasOffset({
        x: event.clientX - dragOffset.x,
        y: event.clientY - dragOffset.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  // Handle node interactions
  const handleNodeClick = (node, event) => {
    event.stopPropagation();
    setSelectedNode(node);
    setSelectedConnection(null);
  };

  const handleNodeDrag = (nodeId, newPosition) => {
    updateNode(nodeId, { position: newPosition });
  };

  // Handle connection creation
  const handleConnectionStart = (nodeId, event) => {
    event.stopPropagation();
    // Start connection preview
    connectionPreviewRef.current = {
      startNode: nodeId,
      startPosition: { x: event.clientX, y: event.clientY }
    };
  };

  const handleConnectionEnd = (nodeId, event) => {
    event.stopPropagation();
    
    if (connectionPreviewRef.current && connectionPreviewRef.current.startNode !== nodeId) {
      addConnection(connectionPreviewRef.current.startNode, nodeId);
    }
    
    connectionPreviewRef.current = null;
  };

  // Validate workflow
  const validateWorkflow = useCallback(() => {
    const errors = [];

    // Check for at least one trigger node
    const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }

    // Check for orphaned nodes
    const connectedNodes = new Set();
    workflow.connections.forEach(conn => {
      connectedNodes.add(conn.from);
      connectedNodes.add(conn.to);
    });

    workflow.nodes.forEach(node => {
      if (node.type !== 'trigger' && !connectedNodes.has(node.id)) {
        errors.push(`Node "${node.name}" is not connected to the workflow`);
      }
    });

    // Check for nodes without required parameters
    workflow.nodes.forEach(node => {
      const requiredParams = getRequiredParameters(node.type);
      requiredParams.forEach(param => {
        if (!node.parameters[param]) {
          errors.push(`Node "${node.name}" is missing required parameter: ${param}`);
        }
      });
    });

    setValidationErrors(errors);
    return errors.length === 0;
  }, [workflow]);

  // Get required parameters for node type
  const getRequiredParameters = (nodeType) => {
    const required = {
      trigger: ['trigger_type'],
      action: ['action_type'],
      condition: ['conditions'],
      webhook: ['url', 'method']
    };

    return required[nodeType] || [];
  };

  // Save workflow
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate workflow
      if (!validateWorkflow()) {
        setError('Please fix validation errors before saving');
        return;
      }

      const workflowData = {
        ...workflow,
        updated_at: new Date().toISOString()
      };

      let result;
      if (workflowId) {
        result = await advancedWorkflowEngine.updateWorkflow(userId, workflowId, workflowData);
      } else {
        result = await advancedWorkflowEngine.createWorkflow(userId, workflowData);
      }

      if (result.success) {
        setWorkflow(result.data);
        onSave(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to save workflow');
      console.error('Save workflow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Deploy workflow
  const handleDeploy = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate workflow
      if (!validateWorkflow()) {
        setError('Please fix validation errors before deploying');
        return;
      }

      const result = await advancedWorkflowEngine.deployWorkflow(userId, workflow.id);
      
      if (result.success) {
        setWorkflow(prev => ({ ...prev, status: 'deployed' }));
        onDeploy(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to deploy workflow');
      console.error('Deploy workflow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test workflow
  const handleTest = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await advancedWorkflowEngine.testWorkflow(userId, workflow.id);
      
      if (result.success) {
        onTest(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to test workflow');
      console.error('Test workflow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load template
  const handleLoadTemplate = async (templateId) => {
    try {
      const result = await workflowTemplateManager.getTemplate(templateId, userId);
      
      if (result.success) {
        const template = result.data;
        setWorkflow({
          ...workflow,
          name: `${template.name} (Copy)`,
          description: template.description,
          nodes: template.workflow.nodes || [],
          connections: template.workflow.connections || [],
          metadata: {
            ...workflow.metadata,
            ...template.metadata,
            created_from_template: templateId
          }
        });
        setShowTemplates(false);
      }
    } catch (error) {
      setError('Failed to load template');
      console.error('Load template error:', error);
    }
  };

  // Render node
  const renderNode = (node) => {
    const nodeType = nodeTypes[node.type];
    const isSelected = selectedNode?.id === node.id;
    
    return (
      <div
        key={node.id}
        className={`workflow-node ${isSelected ? 'selected' : ''}`}
        style={{
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          backgroundColor: nodeType?.color || '#6B7280',
          border: isSelected ? '2px solid #3B82F6' : '1px solid #D1D5DB',
          borderRadius: '8px',
          padding: '12px',
          minWidth: '120px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transform: `scale(${zoom})`
        }}
        onClick={(e) => handleNodeClick(node, e)}
        onMouseDown={(e) => handleConnectionStart(node.id, e)}
        onMouseUp={(e) => handleConnectionEnd(node.id, e)}
        draggable
        onDrag={(e) => {
          const rect = canvasRef.current.getBoundingClientRect();
          const newPosition = {
            x: (e.clientX - rect.left - canvasOffset.x) / zoom,
            y: (e.clientY - rect.top - canvasOffset.y) / zoom
          };
          handleNodeDrag(node.id, newPosition);
        }}
      >
        <div className="node-header">
          <span className="node-icon">{nodeType?.icon || '⚙️'}</span>
          <span className="node-name">{node.name}</span>
        </div>
        <div className="node-type">{nodeType?.name || node.type}</div>
        {node.status !== 'idle' && (
          <div className={`node-status ${node.status}`}>
            {node.status}
          </div>
        )}
      </div>
    );
  };

  // Render connection
  const renderConnection = (connection) => {
    const fromNode = workflow.nodes.find(n => n.id === connection.from);
    const toNode = workflow.nodes.find(n => n.id === connection.to);
    
    if (!fromNode || !toNode) return null;

    const isSelected = selectedConnection?.id === connection.id;
    
    return (
      <svg
        key={connection.id}
        className={`workflow-connection ${isSelected ? 'selected' : ''}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <path
          d={`M ${fromNode.position.x + 60} ${fromNode.position.y + 20} 
              L ${toNode.position.x} ${toNode.position.y + 20}`}
          stroke={isSelected ? '#3B82F6' : '#6B7280'}
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedConnection(connection);
            setSelectedNode(null);
          }}
          style={{ pointerEvents: 'stroke' }}
        />
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={isSelected ? '#3B82F6' : '#6B7280'}
            />
          </marker>
        </defs>
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="workflow-designer-loading">
        <div className="loading-spinner"></div>
        <p>Loading workflow designer...</p>
      </div>
    );
  }

  return (
    <div className="workflow-designer">
      {/* Toolbar */}
      <div className="workflow-toolbar">
        <div className="toolbar-section">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn btn-primary"
          >
            💾 Save
          </button>
          <button
            onClick={handleDeploy}
            disabled={isLoading || workflow.status === 'deployed'}
            className="btn btn-success"
          >
            🚀 Deploy
          </button>
          <button
            onClick={handleTest}
            disabled={isLoading}
            className="btn btn-info"
          >
            🧪 Test
          </button>
        </div>

        <div className="toolbar-section">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="btn btn-secondary"
          >
            📋 Templates
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`btn ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            👁️ Preview
          </button>
        </div>

        <div className="toolbar-section">
          <label>Zoom:</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
          />
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="workflow-designer-content">
        {/* Node Library */}
        <div className="node-library" ref={nodeLibraryRef}>
          <h3>Node Library</h3>
          {Object.entries(nodeTypes).map(([type, config]) => (
            <div
              key={type}
              className="node-library-item"
              onClick={() => addNode(type)}
              style={{
                backgroundColor: config.color,
                color: 'white',
                padding: '8px',
                margin: '4px 0',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{config.icon}</span>
              <span>{config.name}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="workflow-canvas-container">
          <div
            ref={canvasRef}
            className="workflow-canvas"
            style={{
              position: 'relative',
              width: '100%',
              height: '600px',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            {/* Connections */}
            {workflow.connections.map(renderConnection)}
            
            {/* Nodes */}
            {workflow.nodes.map(renderNode)}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="properties-panel">
          <h3>Properties</h3>
          {selectedNode ? (
            <div className="node-properties">
              <h4>{selectedNode.name}</h4>
              <div className="property-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={selectedNode.name}
                  onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                />
              </div>
              <div className="property-group">
                <label>Type:</label>
                <select
                  value={selectedNode.type}
                  onChange={(e) => updateNode(selectedNode.id, { 
                    type: e.target.value,
                    parameters: getDefaultParameters(e.target.value)
                  })}
                >
                  {Object.entries(nodeTypes).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Add more property fields based on node type */}
            </div>
          ) : selectedConnection ? (
            <div className="connection-properties">
              <h4>Connection</h4>
              <p>From: {workflow.nodes.find(n => n.id === selectedConnection.from)?.name}</p>
              <p>To: {workflow.nodes.find(n => n.id === selectedConnection.to)?.name}</p>
              <button
                onClick={() => removeConnection(selectedConnection.id)}
                className="btn btn-danger"
              >
                Remove Connection
              </button>
            </div>
          ) : (
            <div className="workflow-properties">
              <h4>Workflow Properties</h4>
              <div className="property-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={workflow.name}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="property-group">
                <label>Description:</label>
                <textarea
                  value={workflow.description}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="templates-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Workflow Templates</h3>
              <button onClick={() => setShowTemplates(false)}>✕</button>
            </div>
            <div className="modal-body">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="template-item"
                  onClick={() => handleLoadTemplate(template.id)}
                >
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <div className="template-meta">
                    <span className="template-category">{template.category}</span>
                    <span className="template-complexity">{template.metadata?.complexity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>Validation Errors:</h4>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>❌ {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WorkflowDesigner;
