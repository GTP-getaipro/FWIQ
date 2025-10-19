/**
 * Workflow Orchestrator
 * Handles complex workflow orchestration, coordination, and execution management
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class WorkflowOrchestrator {
  constructor() {
    this.orchestrationQueue = [];
    this.activeOrchestrations = new Map();
    this.orchestrationStrategies = new Map();
    this.coordinationRules = new Map();
    this.isProcessing = false;
    this.maxConcurrentOrchestrations = 10;
  }

  /**
   * Initialize orchestration strategies
   */
  initializeOrchestrationStrategies() {
    this.orchestrationStrategies.set('sequential', {
      name: 'Sequential Orchestration',
      description: 'Execute workflows one after another',
      maxConcurrency: 1,
      timeoutMs: 300000 // 5 minutes
    });

    this.orchestrationStrategies.set('parallel', {
      name: 'Parallel Orchestration',
      description: 'Execute workflows simultaneously',
      maxConcurrency: 5,
      timeoutMs: 600000 // 10 minutes
    });

    this.orchestrationStrategies.set('conditional', {
      name: 'Conditional Orchestration',
      description: 'Execute workflows based on conditions',
      maxConcurrency: 3,
      timeoutMs: 450000 // 7.5 minutes
    });

    this.orchestrationStrategies.set('hybrid', {
      name: 'Hybrid Orchestration',
      description: 'Combine multiple orchestration strategies',
      maxConcurrency: 4,
      timeoutMs: 900000 // 15 minutes
    });

    this.orchestrationStrategies.set('event-driven', {
      name: 'Event-Driven Orchestration',
      description: 'Execute workflows based on events',
      maxConcurrency: 8,
      timeoutMs: 1800000 // 30 minutes
    });
  }

  /**
   * Orchestrate multiple workflows
   * @param {string} orchestrationId - Orchestration identifier
   * @param {Object} orchestrationConfig - Orchestration configuration
   * @returns {Promise<Object>} Orchestration result
   */
  async orchestrateWorkflows(orchestrationId, orchestrationConfig) {
    try {
      const orchestration = {
        id: orchestrationId,
        name: orchestrationConfig.name || `Orchestration ${orchestrationId}`,
        description: orchestrationConfig.description || '',
        strategy: orchestrationConfig.strategy || 'sequential',
        workflows: orchestrationConfig.workflows || [],
        dependencies: orchestrationConfig.dependencies || {},
        coordinationRules: orchestrationConfig.coordinationRules || {},
        timeout: orchestrationConfig.timeout || 300000, // 5 minutes default
        retryConfig: orchestrationConfig.retryConfig || { maxRetries: 3, delay: 1000 },
        status: 'pending',
        startedAt: null,
        completedAt: null,
        results: [],
        errors: [],
        metrics: {
          workflowsExecuted: 0,
          workflowsSucceeded: 0,
          workflowsFailed: 0,
          totalExecutionTime: 0
        }
      };

      // Validate orchestration configuration
      const validation = await this.validateOrchestrationConfig(orchestration);
      if (!validation.isValid) {
        throw new Error(`Orchestration validation failed: ${validation.errors.join(', ')}`);
      }

      // Add to orchestration queue
      this.orchestrationQueue.push(orchestration);
      this.activeOrchestrations.set(orchestrationId, orchestration);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.startOrchestrationProcessing();
      }

      logger.info('Workflow orchestration queued', {
        orchestrationId,
        strategy: orchestration.strategy,
        workflowCount: orchestration.workflows.length
      });

      return {
        orchestrationId,
        status: 'queued',
        estimatedCompletionTime: this.estimateCompletionTime(orchestration)
      };

    } catch (error) {
      logger.error('Failed to orchestrate workflows', {
        orchestrationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Start orchestration processing
   */
  async startOrchestrationProcessing() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    logger.info('Starting orchestration processing');

    while (this.orchestrationQueue.length > 0) {
      const orchestration = this.orchestrationQueue.shift();
      
      try {
        await this.executeOrchestration(orchestration);
      } catch (error) {
        logger.error('Orchestration execution failed', {
          orchestrationId: orchestration.id,
          error: error.message
        });
      }
    }

    this.isProcessing = false;
    logger.info('Orchestration processing completed');
  }

  /**
   * Execute orchestration based on strategy
   * @param {Object} orchestration - Orchestration configuration
   */
  async executeOrchestration(orchestration) {
    const startTime = Date.now();
    orchestration.status = 'running';
    orchestration.startedAt = new Date().toISOString();

    try {
      logger.debug('Executing orchestration', {
        orchestrationId: orchestration.id,
        strategy: orchestration.strategy,
        workflowCount: orchestration.workflows.length
      });

      let results;
      switch (orchestration.strategy) {
        case 'sequential':
          results = await this.executeSequentialOrchestration(orchestration);
          break;
        case 'parallel':
          results = await this.executeParallelOrchestration(orchestration);
          break;
        case 'conditional':
          results = await this.executeConditionalOrchestration(orchestration);
          break;
        case 'hybrid':
          results = await this.executeHybridOrchestration(orchestration);
          break;
        case 'event-driven':
          results = await this.executeEventDrivenOrchestration(orchestration);
          break;
        default:
          results = await this.executeSequentialOrchestration(orchestration);
      }

      orchestration.results = results;
      orchestration.status = 'completed';
      orchestration.completedAt = new Date().toISOString();
      orchestration.metrics.totalExecutionTime = Date.now() - startTime;

      // Store orchestration results
      await this.storeOrchestrationResults(orchestration);

      logger.info('Orchestration completed successfully', {
        orchestrationId: orchestration.id,
        executionTime: orchestration.metrics.totalExecutionTime,
        successRate: orchestration.metrics.workflowsSucceeded / orchestration.metrics.workflowsExecuted
      });

    } catch (error) {
      orchestration.status = 'failed';
      orchestration.completedAt = new Date().toISOString();
      orchestration.errors.push({
        error: error.message,
        timestamp: new Date().toISOString()
      });

      logger.error('Orchestration failed', {
        orchestrationId: orchestration.id,
        error: error.message
      });

      throw error;
    } finally {
      this.activeOrchestrations.delete(orchestration.id);
    }
  }

  /**
   * Execute sequential orchestration
   * @param {Object} orchestration - Orchestration configuration
   * @returns {Promise<Array>} Execution results
   */
  async executeSequentialOrchestration(orchestration) {
    const results = [];
    const executedWorkflows = new Set();

    // Sort workflows by dependencies
    const sortedWorkflows = this.sortWorkflowsByDependencies(orchestration.workflows, orchestration.dependencies);

    for (const workflow of sortedWorkflows) {
      try {
        // Check if workflow has unmet dependencies
        if (this.hasUnmetDependencies(workflow, orchestration.dependencies, executedWorkflows)) {
          logger.warn('Skipping workflow due to unmet dependencies', {
            workflowId: workflow.id,
            orchestrationId: orchestration.id
          });
          continue;
        }

        // Execute workflow
        const result = await this.executeWorkflowInOrchestration(workflow, orchestration);
        results.push(result);
        executedWorkflows.add(workflow.id);
        orchestration.metrics.workflowsExecuted++;
        orchestration.metrics.workflowsSucceeded++;

        // Apply coordination rules
        await this.applyCoordinationRules(workflow, result, orchestration);

      } catch (error) {
        orchestration.metrics.workflowsExecuted++;
        orchestration.metrics.workflowsFailed++;
        orchestration.errors.push({
          workflowId: workflow.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        // Handle workflow failure based on coordination rules
        const failureStrategy = orchestration.coordinationRules?.workflowFailureStrategy || 'continue';
        if (failureStrategy === 'stop') {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute parallel orchestration
   * @param {Object} orchestration - Orchestration configuration
   * @returns {Promise<Array>} Execution results
   */
  async executeParallelOrchestration(orchestration) {
    const strategy = this.orchestrationStrategies.get('parallel');
    const maxConcurrency = Math.min(strategy.maxConcurrency, orchestration.workflows.length);
    
    const results = [];
    const workflowPromises = [];

    // Group workflows by dependency levels
    const workflowGroups = this.groupWorkflowsByDependencyLevel(orchestration.workflows, orchestration.dependencies);

    for (const group of workflowGroups) {
      const groupPromises = group.map(async (workflow) => {
        try {
          const result = await this.executeWorkflowInOrchestration(workflow, orchestration);
          orchestration.metrics.workflowsExecuted++;
          orchestration.metrics.workflowsSucceeded++;
          return { workflowId: workflow.id, success: true, result };
        } catch (error) {
          orchestration.metrics.workflowsExecuted++;
          orchestration.metrics.workflowsFailed++;
          orchestration.errors.push({
            workflowId: workflow.id,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          return { workflowId: workflow.id, success: false, error: error.message };
        }
      });

      // Execute group with concurrency limit
      const groupResults = await this.executeWithConcurrencyLimit(groupPromises, maxConcurrency);
      results.push(...groupResults);
    }

    return results;
  }

  /**
   * Execute conditional orchestration
   * @param {Object} orchestration - Orchestration configuration
   * @returns {Promise<Array>} Execution results
   */
  async executeConditionalOrchestration(orchestration) {
    const results = [];
    const executedWorkflows = new Set();
    const workflowQueue = [...orchestration.workflows];

    while (workflowQueue.length > 0) {
      const workflow = workflowQueue.shift();
      
      if (executedWorkflows.has(workflow.id)) {
        continue;
      }

      try {
        // Evaluate workflow conditions
        const shouldExecute = await this.evaluateWorkflowConditions(workflow, orchestration, results);
        
        if (shouldExecute) {
          const result = await this.executeWorkflowInOrchestration(workflow, orchestration);
          results.push(result);
          executedWorkflows.add(workflow.id);
          orchestration.metrics.workflowsExecuted++;
          orchestration.metrics.workflowsSucceeded++;

          // Add dependent workflows to queue
          const dependentWorkflows = this.getDependentWorkflows(workflow.id, orchestration.dependencies);
          workflowQueue.push(...dependentWorkflows.filter(w => !executedWorkflows.has(w.id)));
        } else {
          logger.debug('Workflow skipped due to conditions', {
            workflowId: workflow.id,
            orchestrationId: orchestration.id
          });
        }

      } catch (error) {
        orchestration.metrics.workflowsExecuted++;
        orchestration.metrics.workflowsFailed++;
        orchestration.errors.push({
          workflowId: workflow.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }

  /**
   * Execute hybrid orchestration
   * @param {Object} orchestration - Orchestration configuration
   * @returns {Promise<Array>} Execution results
   */
  async executeHybridOrchestration(orchestration) {
    const results = [];

    // Group workflows by execution strategy
    const sequentialWorkflows = orchestration.workflows.filter(w => 
      w.metadata?.executionStrategy === 'sequential'
    );
    const parallelWorkflows = orchestration.workflows.filter(w => 
      w.metadata?.executionStrategy === 'parallel'
    );
    const conditionalWorkflows = orchestration.workflows.filter(w => 
      w.metadata?.executionStrategy === 'conditional'
    );

    // Execute sequential workflows first
    if (sequentialWorkflows.length > 0) {
      const sequentialOrchestration = { ...orchestration, workflows: sequentialWorkflows };
      const sequentialResults = await this.executeSequentialOrchestration(sequentialOrchestration);
      results.push(...sequentialResults);
    }

    // Execute parallel workflows
    if (parallelWorkflows.length > 0) {
      const parallelOrchestration = { ...orchestration, workflows: parallelWorkflows };
      const parallelResults = await this.executeParallelOrchestration(parallelOrchestration);
      results.push(...parallelResults);
    }

    // Execute conditional workflows
    if (conditionalWorkflows.length > 0) {
      const conditionalOrchestration = { ...orchestration, workflows: conditionalWorkflows };
      const conditionalResults = await this.executeConditionalOrchestration(conditionalOrchestration);
      results.push(...conditionalResults);
    }

    return results;
  }

  /**
   * Execute event-driven orchestration
   * @param {Object} orchestration - Orchestration configuration
   * @returns {Promise<Array>} Execution results
   */
  async executeEventDrivenOrchestration(orchestration) {
    const results = [];
    const eventListeners = new Map();

    // Set up event listeners for workflows
    for (const workflow of orchestration.workflows) {
      const events = workflow.metadata?.events || [];
      for (const event of events) {
        if (!eventListeners.has(event.type)) {
          eventListeners.set(event.type, []);
        }
        eventListeners.get(event.type).push(workflow);
      }
    }

    // Wait for events and execute workflows
    const eventPromises = Array.from(eventListeners.entries()).map(async ([eventType, workflows]) => {
      try {
        // Simulate event waiting (in real implementation, this would listen to actual events)
        await this.waitForEvent(eventType, orchestration.timeout);
        
        // Execute workflows for this event
        const eventResults = [];
        for (const workflow of workflows) {
          try {
            const result = await this.executeWorkflowInOrchestration(workflow, orchestration);
            eventResults.push(result);
            orchestration.metrics.workflowsExecuted++;
            orchestration.metrics.workflowsSucceeded++;
          } catch (error) {
            orchestration.metrics.workflowsExecuted++;
            orchestration.metrics.workflowsFailed++;
            orchestration.errors.push({
              workflowId: workflow.id,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        return eventResults;
      } catch (error) {
        logger.error('Event-driven execution failed', {
          eventType,
          orchestrationId: orchestration.id,
          error: error.message
        });
        return [];
      }
    });

    const eventResults = await Promise.allSettled(eventPromises);
    eventResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(...result.value);
      }
    });

    return results;
  }

  /**
   * Execute a single workflow within orchestration
   * @param {Object} workflow - Workflow configuration
   * @param {Object} orchestration - Orchestration context
   * @returns {Promise<Object>} Workflow execution result
   */
  async executeWorkflowInOrchestration(workflow, orchestration) {
    try {
      // Import advanced workflow engine dynamically
      const { advancedWorkflowEngine } = await import('./advancedWorkflowEngine.js');
      
      // Prepare input data for workflow
      const inputData = this.prepareWorkflowInputData(workflow, orchestration);
      
      // Execute workflow
      const result = await advancedWorkflowEngine.executeWorkflow(
        workflow.id,
        inputData,
        {
          orchestrationId: orchestration.id,
          orchestrationStrategy: orchestration.strategy,
          coordinationRules: orchestration.coordinationRules
        }
      );

      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        success: result.success,
        result: result.results,
        executionTime: result.metrics.totalTime,
        executedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Workflow execution failed in orchestration', {
        workflowId: workflow.id,
        orchestrationId: orchestration.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Prepare input data for workflow execution
   * @param {Object} workflow - Workflow configuration
   * @param {Object} orchestration - Orchestration context
   * @returns {Object} Prepared input data
   */
  prepareWorkflowInputData(workflow, orchestration) {
    // Get input data from orchestration context or workflow configuration
    const orchestrationData = orchestration.inputData || {};
    const workflowData = workflow.inputData || {};
    
    // Merge data based on coordination rules
    const mergeStrategy = orchestration.coordinationRules?.dataMergeStrategy || 'workflow_first';
    
    switch (mergeStrategy) {
      case 'orchestration_first':
        return { ...workflowData, ...orchestrationData };
      case 'workflow_first':
        return { ...orchestrationData, ...workflowData };
      case 'merge_deep':
        return this.deepMerge(orchestrationData, workflowData);
      default:
        return { ...orchestrationData, ...workflowData };
    }
  }

  /**
   * Apply coordination rules
   * @param {Object} workflow - Workflow configuration
   * @param {Object} result - Workflow execution result
   * @param {Object} orchestration - Orchestration context
   */
  async applyCoordinationRules(workflow, result, orchestration) {
    const rules = orchestration.coordinationRules || {};
    
    // Apply data sharing rules
    if (rules.dataSharing && rules.dataSharing.enabled) {
      await this.shareWorkflowData(workflow.id, result, orchestration);
    }

    // Apply notification rules
    if (rules.notifications && rules.notifications.enabled) {
      await this.sendCoordinationNotification(workflow, result, orchestration);
    }

    // Apply logging rules
    if (rules.logging && rules.logging.enabled) {
      await this.logCoordinationEvent(workflow, result, orchestration);
    }
  }

  /**
   * Share workflow data with other workflows
   * @param {string} workflowId - Workflow ID
   * @param {Object} result - Workflow result
   * @param {Object} orchestration - Orchestration context
   */
  async shareWorkflowData(workflowId, result, orchestration) {
    try {
      // Store shared data for other workflows to access
      const sharedData = {
        workflowId,
        orchestrationId: orchestration.id,
        data: result.result,
        sharedAt: new Date().toISOString()
      };

      // In a real implementation, this would store data in a shared store
      logger.debug('Workflow data shared', {
        workflowId,
        orchestrationId: orchestration.id,
        dataSize: JSON.stringify(result.result).length
      });

    } catch (error) {
      logger.error('Failed to share workflow data', {
        workflowId,
        orchestrationId: orchestration.id,
        error: error.message
      });
    }
  }

  /**
   * Send coordination notification
   * @param {Object} workflow - Workflow configuration
   * @param {Object} result - Workflow result
   * @param {Object} orchestration - Orchestration context
   */
  async sendCoordinationNotification(workflow, result, orchestration) {
    try {
      const notification = {
        type: 'workflow_completed',
        orchestrationId: orchestration.id,
        workflowId: workflow.id,
        workflowName: workflow.name,
        success: result.success,
        executionTime: result.executionTime,
        timestamp: new Date().toISOString()
      };

      // In a real implementation, this would send actual notifications
      logger.info('Coordination notification sent', notification);

    } catch (error) {
      logger.error('Failed to send coordination notification', {
        workflowId: workflow.id,
        orchestrationId: orchestration.id,
        error: error.message
      });
    }
  }

  /**
   * Log coordination event
   * @param {Object} workflow - Workflow configuration
   * @param {Object} result - Workflow result
   * @param {Object} orchestration - Orchestration context
   */
  async logCoordinationEvent(workflow, result, orchestration) {
    try {
      const logEntry = {
        orchestrationId: orchestration.id,
        workflowId: workflow.id,
        event: 'workflow_execution_completed',
        success: result.success,
        executionTime: result.executionTime,
        timestamp: new Date().toISOString()
      };

      // Store in orchestration logs
      await supabase
        .from('orchestration_logs')
        .insert(logEntry);

    } catch (error) {
      logger.error('Failed to log coordination event', {
        workflowId: workflow.id,
        orchestrationId: orchestration.id,
        error: error.message
      });
    }
  }

  /**
   * Sort workflows by dependencies
   * @param {Array} workflows - Workflows array
   * @param {Object} dependencies - Dependencies configuration
   * @returns {Array} Sorted workflows
   */
  sortWorkflowsByDependencies(workflows, dependencies) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (workflow) => {
      if (visiting.has(workflow.id)) {
        throw new Error(`Circular dependency detected involving workflow ${workflow.id}`);
      }
      if (visited.has(workflow.id)) {
        return;
      }

      visiting.add(workflow.id);
      
      const deps = dependencies[workflow.id] || [];
      for (const depId of deps) {
        const depWorkflow = workflows.find(w => w.id === depId);
        if (depWorkflow) {
          visit(depWorkflow);
        }
      }

      visiting.delete(workflow.id);
      visited.add(workflow.id);
      sorted.push(workflow);
    };

    for (const workflow of workflows) {
      visit(workflow);
    }

    return sorted;
  }

  /**
   * Check if workflow has unmet dependencies
   * @param {Object} workflow - Workflow configuration
   * @param {Object} dependencies - Dependencies configuration
   * @param {Set} executedWorkflows - Set of executed workflow IDs
   * @returns {boolean} Has unmet dependencies
   */
  hasUnmetDependencies(workflow, dependencies, executedWorkflows) {
    const deps = dependencies[workflow.id] || [];
    return deps.some(depId => !executedWorkflows.has(depId));
  }

  /**
   * Group workflows by dependency level
   * @param {Array} workflows - Workflows array
   * @param {Object} dependencies - Dependencies configuration
   * @returns {Array} Workflow groups
   */
  groupWorkflowsByDependencyLevel(workflows, dependencies) {
    const groups = [];
    const remaining = [...workflows];
    const processed = new Set();

    while (remaining.length > 0) {
      const currentGroup = [];
      
      for (let i = remaining.length - 1; i >= 0; i--) {
        const workflow = remaining[i];
        const deps = dependencies[workflow.id] || [];
        
        if (deps.every(depId => processed.has(depId))) {
          currentGroup.push(workflow);
          remaining.splice(i, 1);
          processed.add(workflow.id);
        }
      }

      if (currentGroup.length === 0) {
        // Handle circular dependencies by adding remaining workflows
        currentGroup.push(...remaining);
        remaining.length = 0;
      }

      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Execute promises with concurrency limit
   * @param {Array} promises - Array of promises
   * @param {number} limit - Concurrency limit
   * @returns {Promise<Array>} Results
   */
  async executeWithConcurrencyLimit(promises, limit) {
    const results = [];
    
    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit);
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : r.reason));
    }

    return results;
  }

  /**
   * Evaluate workflow conditions
   * @param {Object} workflow - Workflow configuration
   * @param {Object} orchestration - Orchestration context
   * @param {Array} previousResults - Previous execution results
   * @returns {Promise<boolean>} Should execute workflow
   */
  async evaluateWorkflowConditions(workflow, orchestration, previousResults) {
    const conditions = workflow.metadata?.conditions || [];
    
    if (conditions.length === 0) {
      return true;
    }

    // Evaluate all conditions (AND logic)
    for (const condition of conditions) {
      const result = this.evaluateCondition(condition.expression, {
        orchestration,
        previousResults,
        workflow
      });
      if (!result) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   * @param {string} expression - Condition expression
   * @param {Object} context - Evaluation context
   * @returns {boolean} Condition result
   */
  evaluateCondition(expression, context) {
    try {
      // Replace variables with actual values
      let evaluatedExpression = expression;
      evaluatedExpression = evaluatedExpression.replace(/\$orchestration\.(\w+)/g, (match, field) => {
        return context.orchestration[field] || '';
      });
      evaluatedExpression = evaluatedExpression.replace(/\$workflow\.(\w+)/g, (match, field) => {
        return context.workflow[field] || '';
      });
      evaluatedExpression = evaluatedExpression.replace(/\$previousResults\.length/g, context.previousResults.length);

      // Simple evaluation (in production, use a proper expression parser)
      return eval(evaluatedExpression);
    } catch (error) {
      logger.warn('Condition evaluation failed', { expression, error: error.message });
      return false;
    }
  }

  /**
   * Get dependent workflows
   * @param {string} workflowId - Workflow ID
   * @param {Object} dependencies - Dependencies configuration
   * @returns {Array} Dependent workflows
   */
  getDependentWorkflows(workflowId, dependencies) {
    const dependentIds = Object.keys(dependencies).filter(id => 
      dependencies[id].includes(workflowId)
    );
    
    // In a real implementation, this would fetch workflow configurations
    return dependentIds.map(id => ({ id, name: `Workflow ${id}` }));
  }

  /**
   * Wait for event (simulated)
   * @param {string} eventType - Event type
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForEvent(eventType, timeout) {
    // Simulate event waiting
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug('Event received', { eventType });
        resolve();
      }, Math.min(timeout, 5000)); // Max 5 seconds for simulation
    });
  }

  /**
   * Deep merge objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Validate orchestration configuration
   * @param {Object} orchestration - Orchestration configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateOrchestrationConfig(orchestration) {
    const result = { isValid: true, errors: [] };

    try {
      // Check required fields
      if (!orchestration.name || !orchestration.strategy) {
        result.errors.push('Orchestration name and strategy are required');
        result.isValid = false;
      }

      // Validate strategy
      if (!this.orchestrationStrategies.has(orchestration.strategy)) {
        result.errors.push(`Invalid orchestration strategy: ${orchestration.strategy}`);
        result.isValid = false;
      }

      // Validate workflows
      if (!orchestration.workflows || orchestration.workflows.length === 0) {
        result.errors.push('Orchestration must have at least one workflow');
        result.isValid = false;
      }

      // Validate dependencies
      if (orchestration.dependencies) {
        for (const [workflowId, deps] of Object.entries(orchestration.dependencies)) {
          const workflowExists = orchestration.workflows.some(w => w.id === workflowId);
          if (!workflowExists) {
            result.errors.push(`Dependencies reference non-existent workflow: ${workflowId}`);
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
   * Estimate completion time for orchestration
   * @param {Object} orchestration - Orchestration configuration
   * @returns {Date} Estimated completion time
   */
  estimateCompletionTime(orchestration) {
    const strategy = this.orchestrationStrategies.get(orchestration.strategy);
    const baseTime = strategy?.timeoutMs || 300000;
    const workflowCount = orchestration.workflows.length;
    
    // Simple estimation based on strategy and workflow count
    let estimatedTime = baseTime;
    if (orchestration.strategy === 'sequential') {
      estimatedTime = baseTime * workflowCount;
    } else if (orchestration.strategy === 'parallel') {
      estimatedTime = baseTime * Math.ceil(workflowCount / strategy.maxConcurrency);
    }

    return new Date(Date.now() + estimatedTime);
  }

  /**
   * Store orchestration results
   * @param {Object} orchestration - Orchestration configuration
   */
  async storeOrchestrationResults(orchestration) {
    try {
      const { error } = await supabase
        .from('orchestration_results')
        .insert({
          orchestration_id: orchestration.id,
          name: orchestration.name,
          strategy: orchestration.strategy,
          status: orchestration.status,
          results: orchestration.results,
          errors: orchestration.errors,
          metrics: orchestration.metrics,
          started_at: orchestration.startedAt,
          completed_at: orchestration.completedAt,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      logger.error('Failed to store orchestration results', {
        orchestrationId: orchestration.id,
        error: error.message
      });
    }
  }

  /**
   * Get orchestration status
   * @param {string} orchestrationId - Orchestration ID
   * @returns {Object} Orchestration status
   */
  getOrchestrationStatus(orchestrationId) {
    const orchestration = this.activeOrchestrations.get(orchestrationId);
    if (!orchestration) {
      return { status: 'not_found' };
    }

    return {
      id: orchestration.id,
      status: orchestration.status,
      startedAt: orchestration.startedAt,
      completedAt: orchestration.completedAt,
      metrics: orchestration.metrics,
      errors: orchestration.errors
    };
  }

  /**
   * Get all active orchestrations
   * @returns {Array} Active orchestrations
   */
  getActiveOrchestrations() {
    return Array.from(this.activeOrchestrations.values());
  }

  /**
   * Cancel orchestration
   * @param {string} orchestrationId - Orchestration ID
   * @returns {boolean} Success status
   */
  cancelOrchestration(orchestrationId) {
    const orchestration = this.activeOrchestrations.get(orchestrationId);
    if (!orchestration) {
      return false;
    }

    orchestration.status = 'cancelled';
    orchestration.completedAt = new Date().toISOString();

    logger.info('Orchestration cancelled', { orchestrationId });
    return true;
  }
}

// Export singleton instance
export const workflowOrchestrator = new WorkflowOrchestrator();

// Initialize orchestration strategies
workflowOrchestrator.initializeOrchestrationStrategies();
