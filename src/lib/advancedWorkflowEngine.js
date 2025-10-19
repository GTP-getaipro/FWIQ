/**
 * Advanced Workflow Engine
 * Implements complex workflow orchestration, error recovery, and performance monitoring
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';
import { WorkflowOrchestrator } from './workflowOrchestrator.js';
import { WorkflowErrorRecovery } from './workflowErrorRecovery.js';
import { AdvancedWorkflowMonitor } from './advancedWorkflowMonitor.js';
import { WorkflowTemplateManager } from './workflowTemplateManager.js';

export class AdvancedWorkflowEngine {
  constructor() {
    this.activeWorkflows = new Map();
    this.workflowExecutions = new Map();
    this.errorRecoveryStrategies = new Map();
    this.performanceMetrics = new Map();
    this.orchestrationQueue = [];
    this.isProcessing = false;
    
    // Initialize integrated components
    this.orchestrator = new WorkflowOrchestrator();
    this.errorRecovery = new WorkflowErrorRecovery();
    this.monitor = new AdvancedWorkflowMonitor();
    this.templateManager = new WorkflowTemplateManager();
  }

  /**
   * Create and deploy a complex workflow
   * @param {string} userId - User ID
   * @param {Object} workflowConfig - Workflow configuration
   * @returns {Promise<Object>} Deployed workflow
   */
  async createAdvancedWorkflow(userId, workflowConfig) {
    try {
      const workflow = {
        id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        name: workflowConfig.name || 'Advanced Workflow',
        description: workflowConfig.description || '',
        nodes: workflowConfig.nodes || [],
        connections: workflowConfig.connections || {},
        triggers: workflowConfig.triggers || [],
        errorHandling: workflowConfig.errorHandling || {},
        performanceSettings: workflowConfig.performanceSettings || {},
        status: 'draft',
        version: 1,
        created_at: new Date().toISOString(),
        metadata: {
          ...workflowConfig.metadata,
          orchestrationLevel: 'advanced',
          errorRecoveryEnabled: true,
          performanceMonitoringEnabled: true
        }
      };

      // Validate workflow configuration
      const validation = await this.validateWorkflowConfiguration(workflow);
      if (!validation.isValid) {
        throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
      }

      // Store workflow
      const { data: storedWorkflow, error } = await supabase
        .from('advanced_workflows')
        .insert(workflow)
        .select()
        .single();

      if (error) throw error;

      // Initialize workflow orchestration
      await this.initializeWorkflowOrchestration(storedWorkflow);

      logger.info('Advanced workflow created successfully', {
        workflowId: storedWorkflow.id,
        userId,
        nodeCount: workflow.nodes.length,
        triggerCount: workflow.triggers.length
      });

      return storedWorkflow;

    } catch (error) {
      logger.error('Failed to create advanced workflow', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute workflow with advanced orchestration
   * @param {string} workflowId - Workflow ID
   * @param {Object} inputData - Input data
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async executeWorkflow(workflowId, inputData, context = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Get workflow configuration
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // Initialize execution context
      const executionContext = {
        executionId,
        workflowId,
        userId: workflow.user_id,
        startTime,
        inputData,
        context: { ...context },
        currentNode: null,
        executionPath: [],
        results: [],
        errors: [],
        metrics: {
          nodesExecuted: 0,
          nodesSucceeded: 0,
          nodesFailed: 0,
          totalTime: 0,
          memoryUsage: 0
        },
        state: 'running'
      };

      this.workflowExecutions.set(executionId, executionContext);

      logger.debug('Starting workflow execution', {
        executionId,
        workflowId,
        nodeCount: workflow.nodes.length
      });

      // Execute workflow orchestration
      const result = await this.orchestrateWorkflowExecution(workflow, executionContext);

      // Calculate final metrics
      executionContext.metrics.totalTime = Date.now() - startTime;
      executionContext.state = 'completed';

      // Store execution results
      await this.storeExecutionResults(executionContext);

      logger.info('Workflow execution completed', {
        executionId,
        workflowId,
        totalTime: executionContext.metrics.totalTime,
        successRate: executionContext.metrics.nodesSucceeded / executionContext.metrics.nodesExecuted
      });

      return {
        executionId,
        workflowId,
        success: executionContext.errors.length === 0,
        results: result,
        metrics: executionContext.metrics,
        errors: executionContext.errors
      };

    } catch (error) {
      logger.error('Workflow execution failed', {
        executionId,
        workflowId,
        error: error.message
      });

      // Clean up execution context
      this.workflowExecutions.delete(executionId);

      throw error;
    }
  }

  /**
   * Orchestrate workflow execution with complex logic
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Orchestration result
   */
  async orchestrateWorkflowExecution(workflow, executionContext) {
    try {
      // Find starting nodes (nodes with no incoming connections)
      const startingNodes = this.findStartingNodes(workflow);
      
      if (startingNodes.length === 0) {
        throw new Error('No starting nodes found in workflow');
      }

      // Execute workflow based on orchestration strategy
      const orchestrationStrategy = workflow.metadata?.orchestrationStrategy || 'sequential';
      
      let result;
      switch (orchestrationStrategy) {
        case 'sequential':
          result = await this.executeSequentialOrchestration(workflow, executionContext, startingNodes);
          break;
        case 'parallel':
          result = await this.executeParallelOrchestration(workflow, executionContext, startingNodes);
          break;
        case 'conditional':
          result = await this.executeConditionalOrchestration(workflow, executionContext, startingNodes);
          break;
        case 'hybrid':
          result = await this.executeHybridOrchestration(workflow, executionContext, startingNodes);
          break;
        default:
          result = await this.executeSequentialOrchestration(workflow, executionContext, startingNodes);
      }

      return result;

    } catch (error) {
      // Apply error recovery if configured
      if (workflow.errorHandling?.recoveryEnabled) {
        return await this.applyErrorRecovery(workflow, executionContext, error);
      }
      throw error;
    }
  }

  /**
   * Execute sequential orchestration
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Array} startingNodes - Starting nodes
   * @returns {Promise<Object>} Execution result
   */
  async executeSequentialOrchestration(workflow, executionContext, startingNodes) {
    const results = [];
    const executedNodes = new Set();
    const executionQueue = [...startingNodes];

    while (executionQueue.length > 0) {
      const currentNode = executionQueue.shift();
      
      if (executedNodes.has(currentNode.id)) {
        continue;
      }

      try {
        // Execute node
        const nodeResult = await this.executeNode(currentNode, executionContext);
        results.push(nodeResult);
        executedNodes.add(currentNode.id);
        executionContext.metrics.nodesExecuted++;
        executionContext.metrics.nodesSucceeded++;

        // Add connected nodes to queue
        const connectedNodes = this.getConnectedNodes(workflow, currentNode.id);
        executionQueue.push(...connectedNodes.filter(node => !executedNodes.has(node.id)));

      } catch (error) {
        executionContext.metrics.nodesExecuted++;
        executionContext.metrics.nodesFailed++;
        executionContext.errors.push({
          nodeId: currentNode.id,
          nodeName: currentNode.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Handle node failure based on error handling strategy
        const errorStrategy = workflow.errorHandling?.nodeFailureStrategy || 'continue';
        if (errorStrategy === 'stop') {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute parallel orchestration
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Array} startingNodes - Starting nodes
   * @returns {Promise<Object>} Execution result
   */
  async executeParallelOrchestration(workflow, executionContext, startingNodes) {
    const nodePromises = startingNodes.map(async (node) => {
      try {
        const result = await this.executeNode(node, executionContext);
        executionContext.metrics.nodesExecuted++;
        executionContext.metrics.nodesSucceeded++;
        return { nodeId: node.id, success: true, result };
      } catch (error) {
        executionContext.metrics.nodesExecuted++;
        executionContext.metrics.nodesFailed++;
        executionContext.errors.push({
          nodeId: node.id,
          nodeName: node.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        return { nodeId: node.id, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(nodePromises);
    return results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason });
  }

  /**
   * Execute conditional orchestration
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Array} startingNodes - Starting nodes
   * @returns {Promise<Object>} Execution result
   */
  async executeConditionalOrchestration(workflow, executionContext, startingNodes) {
    const results = [];
    const executedNodes = new Set();
    const executionQueue = [...startingNodes];

    while (executionQueue.length > 0) {
      const currentNode = executionQueue.shift();
      
      if (executedNodes.has(currentNode.id)) {
        continue;
      }

      try {
        // Evaluate conditions before execution
        const shouldExecute = await this.evaluateNodeConditions(currentNode, executionContext);
        
        if (shouldExecute) {
          const nodeResult = await this.executeNode(currentNode, executionContext);
          results.push(nodeResult);
          executedNodes.add(currentNode.id);
          executionContext.metrics.nodesExecuted++;
          executionContext.metrics.nodesSucceeded++;

          // Add connected nodes based on conditions
          const connectedNodes = this.getConditionalConnectedNodes(workflow, currentNode.id, nodeResult);
          executionQueue.push(...connectedNodes.filter(node => !executedNodes.has(node.id)));
        } else {
          logger.debug('Node skipped due to conditions', {
            nodeId: currentNode.id,
            nodeName: currentNode.name
          });
        }

      } catch (error) {
        executionContext.metrics.nodesExecuted++;
        executionContext.metrics.nodesFailed++;
        executionContext.errors.push({
          nodeId: currentNode.id,
          nodeName: currentNode.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Execute hybrid orchestration (combination of strategies)
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Array} startingNodes - Starting nodes
   * @returns {Promise<Object>} Execution result
   */
  async executeHybridOrchestration(workflow, executionContext, startingNodes) {
    // Group nodes by execution strategy
    const sequentialNodes = startingNodes.filter(node => 
      node.metadata?.executionStrategy === 'sequential'
    );
    const parallelNodes = startingNodes.filter(node => 
      node.metadata?.executionStrategy === 'parallel'
    );

    const results = [];

    // Execute sequential nodes first
    if (sequentialNodes.length > 0) {
      const sequentialResults = await this.executeSequentialOrchestration(
        workflow, 
        executionContext, 
        sequentialNodes
      );
      results.push(...sequentialResults);
    }

    // Execute parallel nodes
    if (parallelNodes.length > 0) {
      const parallelResults = await this.executeParallelOrchestration(
        workflow, 
        executionContext, 
        parallelNodes
      );
      results.push(...parallelResults);
    }

    return results;
  }

  /**
   * Execute a single workflow node
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Node execution result
   */
  async executeNode(node, executionContext) {
    const nodeStartTime = Date.now();

    try {
      // Update execution context
      executionContext.currentNode = node;
      executionContext.executionPath.push({
        nodeId: node.id,
        nodeName: node.name,
        startTime: nodeStartTime
      });

      // Execute node based on type
      let result;
      switch (node.type) {
        case 'email_processor':
          result = await this.executeEmailProcessorNode(node, executionContext);
          break;
        case 'ai_classifier':
          result = await this.executeAIClassifierNode(node, executionContext);
          break;
        case 'rule_engine':
          result = await this.executeRuleEngineNode(node, executionContext);
          break;
        case 'notification':
          result = await this.executeNotificationNode(node, executionContext);
          break;
        case 'data_transformer':
          result = await this.executeDataTransformerNode(node, executionContext);
          break;
        case 'conditional':
          result = await this.executeConditionalNode(node, executionContext);
          break;
        default:
          result = await this.executeGenericNode(node, executionContext);
      }

      // Update execution path
      const nodeEndTime = Date.now();
      const pathEntry = executionContext.executionPath[executionContext.executionPath.length - 1];
      pathEntry.endTime = nodeEndTime;
      pathEntry.executionTime = nodeEndTime - nodeStartTime;
      pathEntry.success = true;

      return {
        nodeId: node.id,
        nodeName: node.name,
        success: true,
        result,
        executionTime: nodeEndTime - nodeStartTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // Update execution path with error
      const nodeEndTime = Date.now();
      const pathEntry = executionContext.executionPath[executionContext.executionPath.length - 1];
      pathEntry.endTime = nodeEndTime;
      pathEntry.executionTime = nodeEndTime - nodeStartTime;
      pathEntry.success = false;
      pathEntry.error = error.message;

      throw error;
    }
  }

  /**
   * Execute email processor node
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Node result
   */
  async executeEmailProcessorNode(node, executionContext) {
    // Simulate email processing
    const emailData = executionContext.inputData;
    
    return {
      processed: true,
      emailData: {
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        processedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Execute AI classifier node
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Node result
   */
  async executeAIClassifierNode(node, executionContext) {
    // Simulate AI classification
    const emailData = executionContext.inputData;
    
    return {
      classification: {
        category: 'support',
        urgency: 'medium',
        sentiment: 'neutral',
        confidence: 0.85
      },
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Execute rule engine node
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Node result
   */
  async executeRuleEngineNode(node, executionContext) {
    // Simulate rule engine execution
    const emailData = executionContext.inputData;
    
    return {
      rulesTriggered: [
        {
          ruleId: 'rule-1',
          ruleName: 'Urgent Email Rule',
          action: 'escalate',
          priority: 2
        }
      ],
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Execute notification node
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Node result
   */
  async executeNotificationNode(node, executionContext) {
    // Simulate notification sending
    return {
      notificationSent: true,
      recipients: node.parameters?.recipients || [],
      message: node.parameters?.message || 'Workflow notification',
      sentAt: new Date().toISOString()
    };
  }

  /**
   * Execute data transformer node
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Node result
   */
  async executeDataTransformerNode(node, executionContext) {
    // Simulate data transformation
    const inputData = executionContext.inputData;
    
    return {
      transformed: true,
      outputData: {
        ...inputData,
        transformedAt: new Date().toISOString(),
        transformationType: node.parameters?.transformationType || 'default'
      }
    };
  }

  /**
   * Execute conditional node
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Node result
   */
  async executeConditionalNode(node, executionContext) {
    // Evaluate conditions
    const conditions = node.parameters?.conditions || [];
    const results = conditions.map(condition => ({
      condition: condition.expression,
      result: this.evaluateCondition(condition.expression, executionContext)
    }));

    return {
      conditionsEvaluated: results,
      nextPath: results.find(r => r.result)?.condition || 'default'
    };
  }

  /**
   * Execute generic node
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Node result
   */
  async executeGenericNode(node, executionContext) {
    // Generic node execution
    return {
      executed: true,
      nodeType: node.type,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Apply error recovery strategies
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Error} error - Original error
   * @returns {Promise<Object>} Recovery result
   */
  async applyErrorRecovery(workflow, executionContext, error) {
    try {
      const recoveryStrategy = workflow.errorHandling?.recoveryStrategy || 'retry';
      
      switch (recoveryStrategy) {
        case 'retry':
          return await this.retryExecution(workflow, executionContext, error);
        case 'fallback':
          return await this.executeFallbackPath(workflow, executionContext, error);
        case 'compensate':
          return await this.executeCompensation(workflow, executionContext, error);
        case 'skip':
          return await this.skipFailedNodes(workflow, executionContext, error);
        default:
          throw error;
      }

    } catch (recoveryError) {
      logger.error('Error recovery failed', {
        workflowId: workflow.id,
        executionId: executionContext.executionId,
        originalError: error.message,
        recoveryError: recoveryError.message
      });
      throw recoveryError;
    }
  }

  /**
   * Retry execution with exponential backoff
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Error} error - Original error
   * @returns {Promise<Object>} Retry result
   */
  async retryExecution(workflow, executionContext, error) {
    const maxRetries = workflow.errorHandling?.maxRetries || 3;
    const retryDelay = workflow.errorHandling?.retryDelay || 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug('Retrying workflow execution', {
          executionId: executionContext.executionId,
          attempt,
          maxRetries
        });

        // Wait with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));

        // Reset execution context for retry
        executionContext.errors = [];
        executionContext.metrics.nodesFailed = 0;

        // Retry execution
        return await this.orchestrateWorkflowExecution(workflow, executionContext);

      } catch (retryError) {
        if (attempt === maxRetries) {
          throw retryError;
        }
        logger.warn('Retry attempt failed', {
          executionId: executionContext.executionId,
          attempt,
          error: retryError.message
        });
      }
    }
  }

  /**
   * Execute fallback path
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Error} error - Original error
   * @returns {Promise<Object>} Fallback result
   */
  async executeFallbackPath(workflow, executionContext, error) {
    const fallbackNodes = workflow.errorHandling?.fallbackNodes || [];
    
    if (fallbackNodes.length === 0) {
      throw error;
    }

    logger.info('Executing fallback path', {
      executionId: executionContext.executionId,
      fallbackNodeCount: fallbackNodes.length
    });

    const fallbackResults = [];
    for (const node of fallbackNodes) {
      try {
        const result = await this.executeNode(node, executionContext);
        fallbackResults.push(result);
      } catch (fallbackError) {
        logger.error('Fallback node execution failed', {
          nodeId: node.id,
          error: fallbackError.message
        });
      }
    }

    return {
      fallbackExecuted: true,
      results: fallbackResults,
      originalError: error.message
    };
  }

  /**
   * Execute compensation (rollback) actions
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Error} error - Original error
   * @returns {Promise<Object>} Compensation result
   */
  async executeCompensation(workflow, executionContext, error) {
    const compensationNodes = workflow.errorHandling?.compensationNodes || [];
    
    logger.info('Executing compensation actions', {
      executionId: executionContext.executionId,
      compensationNodeCount: compensationNodes.length
    });

    const compensationResults = [];
    for (const node of compensationNodes) {
      try {
        const result = await this.executeNode(node, executionContext);
        compensationResults.push(result);
      } catch (compensationError) {
        logger.error('Compensation node execution failed', {
          nodeId: node.id,
          error: compensationError.message
        });
      }
    }

    return {
      compensationExecuted: true,
      results: compensationResults,
      originalError: error.message
    };
  }

  /**
   * Skip failed nodes and continue execution
   * @param {Object} workflow - Workflow configuration
   * @param {Object} executionContext - Execution context
   * @param {Error} error - Original error
   * @returns {Promise<Object>} Skip result
   */
  async skipFailedNodes(workflow, executionContext, error) {
    logger.info('Skipping failed nodes and continuing execution', {
      executionId: executionContext.executionId
    });

    // Continue with remaining nodes
    const remainingNodes = workflow.nodes.filter(node => 
      !executionContext.executionPath.some(path => path.nodeId === node.id)
    );

    const results = [];
    for (const node of remainingNodes) {
      try {
        const result = await this.executeNode(node, executionContext);
        results.push(result);
      } catch (nodeError) {
        logger.warn('Node execution failed during skip mode', {
          nodeId: node.id,
          error: nodeError.message
        });
      }
    }

    return {
      skippedFailedNodes: true,
      results,
      originalError: error.message
    };
  }

  /**
   * Validate workflow configuration
   * @param {Object} workflow - Workflow configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateWorkflowConfiguration(workflow) {
    const result = { isValid: true, errors: [] };

    try {
      // Check required fields
      if (!workflow.name || !workflow.userId) {
        result.errors.push('Workflow name and userId are required');
        result.isValid = false;
      }

      // Validate nodes
      if (!workflow.nodes || workflow.nodes.length === 0) {
        result.errors.push('Workflow must have at least one node');
        result.isValid = false;
      }

      // Validate node configurations
      for (const node of workflow.nodes) {
        if (!node.id || !node.name || !node.type) {
          result.errors.push(`Node missing required fields: ${node.id || 'unknown'}`);
          result.isValid = false;
        }
      }

      // Validate connections
      if (workflow.connections) {
        const nodeIds = workflow.nodes.map(n => n.id);
        for (const [sourceNode, connections] of Object.entries(workflow.connections)) {
          if (!nodeIds.includes(sourceNode)) {
            result.errors.push(`Connection references non-existent node: ${sourceNode}`);
            result.isValid = false;
          }
        }
      }

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Get workflow by ID
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Workflow configuration
   */
  async getWorkflow(workflowId) {
    try {
      const { data: workflow, error } = await supabase
        .from('advanced_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;
      return workflow;

    } catch (error) {
      logger.error('Failed to get workflow', { workflowId, error: error.message });
      return null;
    }
  }

  /**
   * Find starting nodes in workflow
   * @param {Object} workflow - Workflow configuration
   * @returns {Array} Starting nodes
   */
  findStartingNodes(workflow) {
    const connectedNodes = new Set();
    
    // Find all nodes that have incoming connections
    for (const connections of Object.values(workflow.connections || {})) {
      for (const connectionGroup of connections.main || []) {
        for (const connection of connectionGroup) {
          connectedNodes.add(connection.node);
        }
      }
    }

    // Return nodes that are not connected to any other node
    return workflow.nodes.filter(node => !connectedNodes.has(node.name));
  }

  /**
   * Get connected nodes for a given node
   * @param {Object} workflow - Workflow configuration
   * @param {string} nodeId - Node ID
   * @returns {Array} Connected nodes
   */
  getConnectedNodes(workflow, nodeId) {
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return [];

    const connections = workflow.connections?.[node.name];
    if (!connections) return [];

    const connectedNodes = [];
    for (const connectionGroup of connections.main || []) {
      for (const connection of connectionGroup) {
        const connectedNode = workflow.nodes.find(n => n.name === connection.node);
        if (connectedNode) {
          connectedNodes.push(connectedNode);
        }
      }
    }

    return connectedNodes;
  }

  /**
   * Get conditional connected nodes
   * @param {Object} workflow - Workflow configuration
   * @param {string} nodeId - Node ID
   * @param {Object} nodeResult - Node execution result
   * @returns {Array} Conditional connected nodes
   */
  getConditionalConnectedNodes(workflow, nodeId, nodeResult) {
    // Simplified conditional logic
    // In a real implementation, this would evaluate complex conditions
    return this.getConnectedNodes(workflow, nodeId);
  }

  /**
   * Evaluate node conditions
   * @param {Object} node - Node configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<boolean>} Should execute node
   */
  async evaluateNodeConditions(node, executionContext) {
    const conditions = node.parameters?.conditions || [];
    
    if (conditions.length === 0) {
      return true;
    }

    // Evaluate all conditions (AND logic)
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition.expression, executionContext);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   * @param {string} expression - Condition expression
   * @param {Object} executionContext - Execution context
   * @returns {boolean} Condition result
   */
  evaluateCondition(expression, executionContext) {
    // Simplified condition evaluation
    // In a real implementation, this would parse and evaluate complex expressions
    try {
      // Replace variables with actual values
      let evaluatedExpression = expression;
      evaluatedExpression = evaluatedExpression.replace(/\$input\.(\w+)/g, (match, field) => {
        return executionContext.inputData[field] || '';
      });
      evaluatedExpression = evaluatedExpression.replace(/\$context\.(\w+)/g, (match, field) => {
        return executionContext.context[field] || '';
      });

      // Simple evaluation (in production, use a proper expression parser)
      return eval(evaluatedExpression);
    } catch (error) {
      logger.warn('Condition evaluation failed', { expression, error: error.message });
      return false;
    }
  }

  /**
   * Initialize workflow orchestration
   * @param {Object} workflow - Workflow configuration
   */
  async initializeWorkflowOrchestration(workflow) {
    try {
      // Set up orchestration monitoring
      this.activeWorkflows.set(workflow.id, {
        workflow,
        status: 'active',
        initializedAt: new Date().toISOString()
      });

      // Initialize performance monitoring
      this.performanceMetrics.set(workflow.id, {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        lastExecutionTime: 0
      });

      logger.info('Workflow orchestration initialized', {
        workflowId: workflow.id,
        nodeCount: workflow.nodes.length
      });

    } catch (error) {
      logger.error('Failed to initialize workflow orchestration', {
        workflowId: workflow.id,
        error: error.message
      });
    }
  }

  /**
   * Store execution results
   * @param {Object} executionContext - Execution context
   */
  async storeExecutionResults(executionContext) {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .insert({
          execution_id: executionContext.executionId,
          workflow_id: executionContext.workflowId,
          user_id: executionContext.userId,
          input_data: executionContext.inputData,
          results: executionContext.results,
          execution_path: executionContext.executionPath,
          metrics: executionContext.metrics,
          errors: executionContext.errors,
          status: executionContext.state,
          executed_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      logger.error('Failed to store execution results', {
        executionId: executionContext.executionId,
        error: error.message
      });
    }
  }

  /**
   * Get workflow performance metrics
   * @param {string} workflowId - Workflow ID
   * @returns {Object} Performance metrics
   */
  getWorkflowPerformanceMetrics(workflowId) {
    return this.performanceMetrics.get(workflowId) || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0
    };
  }

  /**
   * Get all active workflows
   * @returns {Array} Active workflows
   */
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Get workflow execution statistics
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Execution statistics
   */
  async getWorkflowExecutionStatistics(workflowId) {
    try {
      const { data: executions, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .gte('executed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        totalExecutions: executions.length,
        successfulExecutions: executions.filter(e => e.status === 'completed').length,
        failedExecutions: executions.filter(e => e.status === 'failed').length,
        averageExecutionTime: 0,
        averageNodesExecuted: 0
      };

      if (executions.length > 0) {
        stats.averageExecutionTime = executions.reduce((sum, e) => 
          sum + (e.metrics?.totalTime || 0), 0) / executions.length;
        stats.averageNodesExecuted = executions.reduce((sum, e) => 
          sum + (e.metrics?.nodesExecuted || 0), 0) / executions.length;
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get workflow execution statistics', {
        workflowId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Create workflow from template
   * @param {string} userId - User ID
   * @param {string} templateId - Template ID
   * @param {Object} customizations - Customizations
   * @returns {Promise<Object>} Created workflow
   */
  async createWorkflowFromTemplate(userId, templateId, customizations = {}) {
    try {
      const result = await this.templateManager.createWorkflowFromTemplate(
        userId,
        templateId,
        customizations
      );

      if (result.success) {
        // Initialize monitoring for the new workflow
        await this.monitor.initializeMetrics(userId);
        
        logger.info('Workflow created from template', {
          workflowId: result.data.id,
          templateId,
          userId
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to create workflow from template', {
        templateId,
        userId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Start monitoring for user workflows
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Monitoring result
   */
  async startMonitoring(userId) {
    try {
      const result = await this.monitor.startMonitoring(userId);
      
      if (result.success) {
        logger.info('Advanced workflow monitoring started', { userId });
      }

      return result;
    } catch (error) {
      logger.error('Failed to start monitoring', {
        userId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop monitoring for user workflows
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Monitoring result
   */
  async stopMonitoring(userId) {
    try {
      const result = await this.monitor.stopMonitoring(userId);
      
      if (result.success) {
        logger.info('Advanced workflow monitoring stopped', { userId });
      }

      return result;
    } catch (error) {
      logger.error('Failed to stop monitoring', {
        userId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive workflow metrics
   * @param {string} userId - User ID
   * @param {string} workflowId - Optional workflow ID
   * @returns {Promise<Object>} Workflow metrics
   */
  async getWorkflowMetrics(userId, workflowId = null) {
    try {
      const result = await this.monitor.getWorkflowMetrics(userId, workflowId);
      return result;
    } catch (error) {
      logger.error('Failed to get workflow metrics', {
        userId,
        workflowId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workflow alerts
   * @param {string} userId - User ID
   * @param {string} workflowId - Optional workflow ID
   * @param {boolean} acknowledged - Filter by acknowledgment status
   * @returns {Promise<Object>} Workflow alerts
   */
  async getWorkflowAlerts(userId, workflowId = null, acknowledged = false) {
    try {
      const result = await this.monitor.getWorkflowAlerts(userId, workflowId, acknowledged);
      return result;
    } catch (error) {
      logger.error('Failed to get workflow alerts', {
        userId,
        workflowId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workflow templates
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Workflow templates
   */
  async getWorkflowTemplates(userId, filters = {}) {
    try {
      const result = await this.templateManager.getAllTemplates(userId, filters);
      return result;
    } catch (error) {
      logger.error('Failed to get workflow templates', {
        userId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Search workflow templates
   * @param {string} query - Search query
   * @param {string} userId - User ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Search results
   */
  async searchWorkflowTemplates(query, userId, filters = {}) {
    try {
      const result = await this.templateManager.searchTemplates(query, userId, filters);
      return result;
    } catch (error) {
      logger.error('Failed to search workflow templates', {
        query,
        userId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Test workflow without full execution
   * @param {string} userId - User ID
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Test results
   */
  async testWorkflow(userId, workflowId) {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      // Validate workflow configuration
      const validation = await this.validateWorkflowConfiguration(workflow);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: 'Workflow validation failed',
          validationErrors: validation.errors
        };
      }

      // Test orchestration logic
      const orchestrationTest = await this.orchestrator.testOrchestration(workflow);
      
      // Test error recovery
      const errorRecoveryTest = await this.errorRecovery.testRecoveryStrategies(workflow);

      const testResults = {
        validation: validation,
        orchestration: orchestrationTest,
        errorRecovery: errorRecoveryTest,
        testPassed: validation.isValid && orchestrationTest.success && errorRecoveryTest.success
      };

      logger.info('Workflow test completed', {
        workflowId,
        userId,
        testPassed: testResults.testPassed
      });

      return { success: true, data: testResults };
    } catch (error) {
      logger.error('Failed to test workflow', {
        workflowId,
        userId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Deploy workflow to external systems
   * @param {string} userId - User ID
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Deployment result
   */
  async deployWorkflow(userId, workflowId) {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      // Test workflow before deployment
      const testResult = await this.testWorkflow(userId, workflowId);
      if (!testResult.success) {
        return { 
          success: false, 
          error: 'Workflow test failed, cannot deploy',
          testErrors: testResult.error
        };
      }

      // Deploy using orchestrator
      const deploymentResult = await this.orchestrator.deployWorkflow(workflow);
      
      if (deploymentResult.success) {
        // Update workflow status
        await this.updateWorkflowStatus(workflowId, 'deployed');
        
        // Start monitoring for deployed workflow
        await this.monitor.initializeMetrics(userId);
        
        logger.info('Workflow deployed successfully', {
          workflowId,
          userId,
          deploymentId: deploymentResult.data.deploymentId
        });
      }

      return deploymentResult;
    } catch (error) {
      logger.error('Failed to deploy workflow', {
        workflowId,
        userId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update workflow status
   * @param {string} workflowId - Workflow ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Update result
   */
  async updateWorkflowStatus(workflowId, status) {
    try {
      const { error } = await supabase
        .from('advanced_workflows')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;

      return { success: true, message: 'Workflow status updated' };
    } catch (error) {
      logger.error('Failed to update workflow status', {
        workflowId,
        status,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const advancedWorkflowEngine = new AdvancedWorkflowEngine();
