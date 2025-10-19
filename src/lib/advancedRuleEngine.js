/**
 * Advanced Rule Engine
 * Implements advanced rule chaining, composition, and orchestration
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class AdvancedRuleEngine {
  constructor() {
    this.ruleChains = new Map();
    this.ruleCompositions = new Map();
    this.executionContext = new Map();
    this.performanceMetrics = new Map();
    this.debugMode = false;
  }

  /**
   * Create a rule chain that executes rules in sequence
   * @param {string} chainId - Unique chain identifier
   * @param {Array} ruleIds - Array of rule IDs in execution order
   * @param {Object} options - Chain configuration options
   * @returns {Promise<Object>} Created chain
   */
  async createRuleChain(chainId, ruleIds, options = {}) {
    try {
      const chain = {
        id: chainId,
        name: options.name || `Chain ${chainId}`,
        description: options.description || '',
        ruleIds,
        executionMode: options.executionMode || 'sequential', // sequential, parallel, conditional
        stopOnFailure: options.stopOnFailure !== false,
        maxExecutionTime: options.maxExecutionTime || 30000, // 30 seconds
        retryConfig: options.retryConfig || { maxRetries: 0, delay: 1000 },
        conditions: options.conditions || [],
        metadata: {
          created_at: new Date().toISOString(),
          created_by: options.userId,
          version: 1,
          ...options.metadata
        }
      };

      // Validate chain configuration
      const validation = await this.validateRuleChain(chain);
      if (!validation.isValid) {
        throw new Error(`Chain validation failed: ${validation.errors.join(', ')}`);
      }

      // Store chain configuration
      const { data, error } = await supabase
        .from('rule_chains')
        .insert(chain)
        .select()
        .single();

      if (error) throw error;

      // Cache the chain
      this.ruleChains.set(chainId, chain);

      logger.info('Rule chain created successfully', {
        chainId,
        ruleCount: ruleIds.length,
        executionMode: chain.executionMode
      });

      return data;

    } catch (error) {
      logger.error('Failed to create rule chain', {
        chainId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute a rule chain
   * @param {string} chainId - Chain identifier
   * @param {Object} emailData - Email data
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Chain execution results
   */
  async executeRuleChain(chainId, emailData, context = {}) {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get chain configuration
      const chain = this.ruleChains.get(chainId) || await this.loadRuleChain(chainId);
      if (!chain) {
        throw new Error(`Rule chain not found: ${chainId}`);
      }

      // Initialize execution context
      const executionContext = {
        executionId,
        chainId,
        startTime,
        emailData,
        context: { ...context },
        results: [],
        errors: [],
        metrics: {
          rulesExecuted: 0,
          rulesSucceeded: 0,
          rulesFailed: 0,
          totalTime: 0
        }
      };

      this.executionContext.set(executionId, executionContext);

      logger.debug('Starting rule chain execution', {
        executionId,
        chainId,
        ruleCount: chain.ruleIds.length,
        executionMode: chain.executionMode
      });

      // Execute rules based on chain mode
      let results;
      switch (chain.executionMode) {
        case 'sequential':
          results = await this.executeSequentialChain(chain, executionContext);
          break;
        case 'parallel':
          results = await this.executeParallelChain(chain, executionContext);
          break;
        case 'conditional':
          results = await this.executeConditionalChain(chain, executionContext);
          break;
        default:
          throw new Error(`Unknown execution mode: ${chain.executionMode}`);
      }

      // Calculate final metrics
      const totalTime = Date.now() - startTime;
      executionContext.metrics.totalTime = totalTime;

      // Store execution results
      await this.storeExecutionResults(executionContext);

      logger.info('Rule chain execution completed', {
        executionId,
        chainId,
        totalTime,
        rulesExecuted: executionContext.metrics.rulesExecuted,
        successRate: executionContext.metrics.rulesSucceeded / executionContext.metrics.rulesExecuted
      });

      return {
        executionId,
        chainId,
        success: executionContext.errors.length === 0,
        results,
        metrics: executionContext.metrics,
        errors: executionContext.errors
      };

    } catch (error) {
      logger.error('Rule chain execution failed', {
        executionId,
        chainId,
        error: error.message
      });

      // Clean up execution context
      this.executionContext.delete(executionId);

      throw error;
    }
  }

  /**
   * Execute rules sequentially
   * @param {Object} chain - Chain configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Array>} Execution results
   */
  async executeSequentialChain(chain, executionContext) {
    const results = [];

    for (const ruleId of chain.ruleIds) {
      try {
        // Check execution timeout
        if (Date.now() - executionContext.startTime > chain.maxExecutionTime) {
          throw new Error('Chain execution timeout exceeded');
        }

        // Execute individual rule
        const ruleResult = await this.executeRule(ruleId, executionContext);
        results.push(ruleResult);
        executionContext.metrics.rulesExecuted++;
        executionContext.metrics.rulesSucceeded++;

        // Stop on failure if configured
        if (!ruleResult.success && chain.stopOnFailure) {
          executionContext.errors.push(`Chain stopped due to rule failure: ${ruleId}`);
          break;
        }

      } catch (error) {
        executionContext.metrics.rulesExecuted++;
        executionContext.metrics.rulesFailed++;
        executionContext.errors.push(`Rule ${ruleId} failed: ${error.message}`);

        if (chain.stopOnFailure) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute rules in parallel
   * @param {Object} chain - Chain configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Array>} Execution results
   */
  async executeParallelChain(chain, executionContext) {
    const rulePromises = chain.ruleIds.map(async (ruleId) => {
      try {
        const result = await this.executeRule(ruleId, executionContext);
        executionContext.metrics.rulesExecuted++;
        executionContext.metrics.rulesSucceeded++;
        return result;
      } catch (error) {
        executionContext.metrics.rulesExecuted++;
        executionContext.metrics.rulesFailed++;
        executionContext.errors.push(`Rule ${ruleId} failed: ${error.message}`);
        return { ruleId, success: false, error: error.message };
      }
    });

    // Wait for all rules to complete or timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Parallel execution timeout')), chain.maxExecutionTime);
    });

    const results = await Promise.race([
      Promise.all(rulePromises),
      timeoutPromise
    ]);

    return results;
  }

  /**
   * Execute rules conditionally based on previous results
   * @param {Object} chain - Chain configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Array>} Execution results
   */
  async executeConditionalChain(chain, executionContext) {
    const results = [];
    let currentContext = { ...executionContext.context };

    for (let i = 0; i < chain.ruleIds.length; i++) {
      const ruleId = chain.ruleIds[i];
      const condition = chain.conditions[i];

      try {
        // Evaluate condition if present
        if (condition && !await this.evaluateCondition(condition, currentContext, results)) {
          logger.debug('Skipping rule due to condition', { ruleId, condition });
          continue;
        }

        // Execute rule with current context
        const ruleResult = await this.executeRule(ruleId, {
          ...executionContext,
          context: currentContext
        });

        results.push(ruleResult);
        executionContext.metrics.rulesExecuted++;
        executionContext.metrics.rulesSucceeded++;

        // Update context with rule results
        currentContext = this.updateContextWithResults(currentContext, ruleResult);

        // Stop on failure if configured
        if (!ruleResult.success && chain.stopOnFailure) {
          executionContext.errors.push(`Chain stopped due to rule failure: ${ruleId}`);
          break;
        }

      } catch (error) {
        executionContext.metrics.rulesExecuted++;
        executionContext.metrics.rulesFailed++;
        executionContext.errors.push(`Rule ${ruleId} failed: ${error.message}`);

        if (chain.stopOnFailure) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Execute a single rule within a chain
   * @param {string} ruleId - Rule identifier
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Rule execution result
   */
  async executeRule(ruleId, executionContext) {
    const ruleStartTime = Date.now();

    try {
      // Load rule configuration
      const { data: rule, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('id', ruleId)
        .eq('enabled', true)
        .single();

      if (error || !rule) {
        throw new Error(`Rule not found or disabled: ${ruleId}`);
      }

      // Execute rule logic (simplified - would integrate with existing BusinessRulesEngine)
      const ruleResult = {
        ruleId,
        success: true,
        executedAt: new Date().toISOString(),
        executionTime: Date.now() - ruleStartTime,
        data: {
          condition: rule.condition,
          action: rule.escalation_action,
          priority: rule.priority
        }
      };

      // Simulate rule evaluation
      const conditionMet = await this.evaluateRuleCondition(rule, executionContext.emailData, executionContext.context);
      
      if (conditionMet) {
        ruleResult.data.triggered = true;
        ruleResult.data.actionResult = await this.executeRuleAction(rule, executionContext);
      } else {
        ruleResult.data.triggered = false;
      }

      return ruleResult;

    } catch (error) {
      return {
        ruleId,
        success: false,
        executedAt: new Date().toISOString(),
        executionTime: Date.now() - ruleStartTime,
        error: error.message
      };
    }
  }

  /**
   * Create a rule composition (complex rule with multiple conditions)
   * @param {string} compositionId - Composition identifier
   * @param {Object} composition - Composition configuration
   * @returns {Promise<Object>} Created composition
   */
  async createRuleComposition(compositionId, composition) {
    try {
      const compositionConfig = {
        id: compositionId,
        name: composition.name || `Composition ${compositionId}`,
        description: composition.description || '',
        conditions: composition.conditions || [],
        logic: composition.logic || 'AND', // AND, OR, custom expression
        actions: composition.actions || [],
        priority: composition.priority || 5,
        enabled: composition.enabled !== false,
        metadata: {
          created_at: new Date().toISOString(),
          created_by: composition.userId,
          version: 1,
          ...composition.metadata
        }
      };

      // Validate composition
      const validation = await this.validateRuleComposition(compositionConfig);
      if (!validation.isValid) {
        throw new Error(`Composition validation failed: ${validation.errors.join(', ')}`);
      }

      // Store composition
      const { data, error } = await supabase
        .from('rule_compositions')
        .insert(compositionConfig)
        .select()
        .single();

      if (error) throw error;

      // Cache composition
      this.ruleCompositions.set(compositionId, compositionConfig);

      logger.info('Rule composition created successfully', {
        compositionId,
        conditionCount: compositionConfig.conditions.length,
        actionCount: compositionConfig.actions.length
      });

      return data;

    } catch (error) {
      logger.error('Failed to create rule composition', {
        compositionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Evaluate a rule composition
   * @param {string} compositionId - Composition identifier
   * @param {Object} emailData - Email data
   * @param {Object} context - Evaluation context
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateRuleComposition(compositionId, emailData, context = {}) {
    try {
      const composition = this.ruleCompositions.get(compositionId) || 
                         await this.loadRuleComposition(compositionId);

      if (!composition) {
        throw new Error(`Rule composition not found: ${compositionId}`);
      }

      // Evaluate all conditions
      const conditionResults = await Promise.all(
        composition.conditions.map(condition => 
          this.evaluateCompositionCondition(condition, emailData, context)
        )
      );

      // Apply composition logic
      const overallResult = this.applyCompositionLogic(
        conditionResults, 
        composition.logic
      );

      const result = {
        compositionId,
        triggered: overallResult,
        conditionResults,
        actions: overallResult ? composition.actions : [],
        evaluatedAt: new Date().toISOString()
      };

      logger.debug('Rule composition evaluated', {
        compositionId,
        triggered: overallResult,
        conditionCount: composition.conditions.length
      });

      return result;

    } catch (error) {
      logger.error('Rule composition evaluation failed', {
        compositionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate rule chain configuration
   * @param {Object} chain - Chain configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateRuleChain(chain) {
    const result = { isValid: true, errors: [] };

    try {
      // Check required fields
      if (!chain.id || !chain.ruleIds || !Array.isArray(chain.ruleIds)) {
        result.errors.push('Chain ID and rule IDs are required');
        result.isValid = false;
      }

      // Check rule IDs exist and are enabled
      if (chain.ruleIds && chain.ruleIds.length > 0) {
        const { data: rules, error } = await supabase
          .from('escalation_rules')
          .select('id, enabled')
          .in('id', chain.ruleIds);

        if (error) throw error;

        const existingRuleIds = rules.map(r => r.id);
        const missingRules = chain.ruleIds.filter(id => !existingRuleIds.includes(id));
        
        if (missingRules.length > 0) {
          result.errors.push(`Rules not found: ${missingRules.join(', ')}`);
          result.isValid = false;
        }

        const disabledRules = rules.filter(r => !r.enabled);
        if (disabledRules.length > 0) {
          result.errors.push(`Disabled rules in chain: ${disabledRules.map(r => r.id).join(', ')}`);
          result.isValid = false;
        }
      }

      // Validate execution mode
      const validModes = ['sequential', 'parallel', 'conditional'];
      if (!validModes.includes(chain.executionMode)) {
        result.errors.push(`Invalid execution mode: ${chain.executionMode}`);
        result.isValid = false;
      }

      // Validate timeout
      if (chain.maxExecutionTime && chain.maxExecutionTime < 1000) {
        result.errors.push('Maximum execution time must be at least 1000ms');
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate rule composition configuration
   * @param {Object} composition - Composition configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateRuleComposition(composition) {
    const result = { isValid: true, errors: [] };

    try {
      // Check required fields
      if (!composition.id || !composition.conditions || !Array.isArray(composition.conditions)) {
        result.errors.push('Composition ID and conditions are required');
        result.isValid = false;
      }

      // Validate conditions
      if (composition.conditions.length === 0) {
        result.errors.push('At least one condition is required');
        result.isValid = false;
      }

      // Validate logic
      const validLogic = ['AND', 'OR'];
      if (composition.logic && !validLogic.includes(composition.logic)) {
        result.errors.push(`Invalid logic operator: ${composition.logic}`);
        result.isValid = false;
      }

      // Validate actions
      if (composition.actions && composition.actions.length === 0) {
        result.errors.push('At least one action is required');
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Load rule chain from database
   * @param {string} chainId - Chain identifier
   * @returns {Promise<Object>} Chain configuration
   */
  async loadRuleChain(chainId) {
    try {
      const { data, error } = await supabase
        .from('rule_chains')
        .select('*')
        .eq('id', chainId)
        .single();

      if (error) throw error;

      this.ruleChains.set(chainId, data);
      return data;

    } catch (error) {
      logger.error('Failed to load rule chain', { chainId, error: error.message });
      return null;
    }
  }

  /**
   * Load rule composition from database
   * @param {string} compositionId - Composition identifier
   * @returns {Promise<Object>} Composition configuration
   */
  async loadRuleComposition(compositionId) {
    try {
      const { data, error } = await supabase
        .from('rule_compositions')
        .select('*')
        .eq('id', compositionId)
        .single();

      if (error) throw error;

      this.ruleCompositions.set(compositionId, data);
      return data;

    } catch (error) {
      logger.error('Failed to load rule composition', { compositionId, error: error.message });
      return null;
    }
  }

  /**
   * Evaluate a condition within a composition
   * @param {Object} condition - Condition configuration
   * @param {Object} emailData - Email data
   * @param {Object} context - Evaluation context
   * @returns {Promise<boolean>} Condition result
   */
  async evaluateCompositionCondition(condition, emailData, context) {
    // Simplified condition evaluation
    // In a real implementation, this would parse and evaluate complex conditions
    switch (condition.type) {
      case 'subject_contains':
        return (emailData.subject || '').toLowerCase().includes(condition.value.toLowerCase());
      case 'body_contains':
        return (emailData.body || '').toLowerCase().includes(condition.value.toLowerCase());
      case 'from_email':
        return (emailData.from || '').toLowerCase() === condition.value.toLowerCase();
      case 'urgency_level':
        return context.urgency === condition.value;
      default:
        return false;
    }
  }

  /**
   * Apply composition logic to condition results
   * @param {Array} conditionResults - Array of condition results
   * @param {string} logic - Logic operator
   * @returns {boolean} Overall result
   */
  applyCompositionLogic(conditionResults, logic) {
    switch (logic) {
      case 'AND':
        return conditionResults.every(result => result === true);
      case 'OR':
        return conditionResults.some(result => result === true);
      default:
        return conditionResults.every(result => result === true);
    }
  }

  /**
   * Evaluate a condition for conditional execution
   * @param {Object} condition - Condition configuration
   * @param {Object} context - Current context
   * @param {Array} results - Previous results
   * @returns {Promise<boolean>} Condition result
   */
  async evaluateCondition(condition, context, results) {
    // Simplified condition evaluation
    // In a real implementation, this would support complex expressions
    if (!condition) return true;

    switch (condition.type) {
      case 'previous_rule_success':
        return results.some(r => r.ruleId === condition.ruleId && r.success);
      case 'context_value':
        return context[condition.key] === condition.value;
      case 'result_count':
        return results.length >= condition.minCount;
      default:
        return true;
    }
  }

  /**
   * Update context with rule results
   * @param {Object} context - Current context
   * @param {Object} ruleResult - Rule execution result
   * @returns {Object} Updated context
   */
  updateContextWithResults(context, ruleResult) {
    return {
      ...context,
      [`rule_${ruleResult.ruleId}_result`]: ruleResult,
      lastRuleId: ruleResult.ruleId,
      lastRuleSuccess: ruleResult.success
    };
  }

  /**
   * Evaluate rule condition (simplified)
   * @param {Object} rule - Rule configuration
   * @param {Object} emailData - Email data
   * @param {Object} context - Evaluation context
   * @returns {Promise<boolean>} Condition result
   */
  async evaluateRuleCondition(rule, emailData, context) {
    // Simplified rule condition evaluation
    // This would integrate with the existing BusinessRulesEngine
    return true; // Placeholder
  }

  /**
   * Execute rule action (simplified)
   * @param {Object} rule - Rule configuration
   * @param {Object} executionContext - Execution context
   * @returns {Promise<Object>} Action result
   */
  async executeRuleAction(rule, executionContext) {
    // Simplified rule action execution
    // This would integrate with the existing BusinessRulesEngine
    return { action: rule.escalation_action, executed: true };
  }

  /**
   * Store execution results
   * @param {Object} executionContext - Execution context
   */
  async storeExecutionResults(executionContext) {
    try {
      const { error } = await supabase
        .from('rule_execution_logs')
        .insert({
          execution_id: executionContext.executionId,
          chain_id: executionContext.chainId,
          email_data: executionContext.emailData,
          results: executionContext.results,
          metrics: executionContext.metrics,
          errors: executionContext.errors,
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
   * Get chain execution statistics
   * @param {string} chainId - Chain identifier
   * @param {string} timeframe - Timeframe for statistics
   * @returns {Promise<Object>} Execution statistics
   */
  async getChainStatistics(chainId, timeframe = '7d') {
    try {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 24h, 7d, 30d
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data: logs, error } = await supabase
        .from('rule_execution_logs')
        .select('*')
        .eq('chain_id', chainId)
        .gte('executed_at', since);

      if (error) throw error;

      const stats = {
        totalExecutions: logs.length,
        successfulExecutions: logs.filter(log => log.errors.length === 0).length,
        failedExecutions: logs.filter(log => log.errors.length > 0).length,
        averageExecutionTime: 0,
        averageRulesExecuted: 0,
        successRate: 0
      };

      if (logs.length > 0) {
        stats.averageExecutionTime = logs.reduce((sum, log) => 
          sum + (log.metrics?.totalTime || 0), 0) / logs.length;
        stats.averageRulesExecuted = logs.reduce((sum, log) => 
          sum + (log.metrics?.rulesExecuted || 0), 0) / logs.length;
        stats.successRate = stats.successfulExecutions / stats.totalExecutions;
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get chain statistics', { chainId, error: error.message });
      return null;
    }
  }

  /**
   * Enable debug mode for detailed logging
   * @param {boolean} enabled - Debug mode enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    logger.info('Debug mode updated', { enabled });
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      activeChains: this.ruleChains.size,
      activeCompositions: this.ruleCompositions.size,
      activeExecutions: this.executionContext.size,
      debugMode: this.debugMode
    };
  }
}

// Export singleton instance
export const advancedRuleEngine = new AdvancedRuleEngine();
