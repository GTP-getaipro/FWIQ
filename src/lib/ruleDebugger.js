/**
 * Rule Debugger
 * Provides debugging and testing tools for business rules
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class RuleDebugger {
  constructor() {
    this.debugSessions = new Map();
    this.testCases = new Map();
    this.debugMode = false;
    this.breakpoints = new Map();
    this.watchExpressions = new Map();
    this.executionHistory = new Map();
  }

  /**
   * Start a debug session for rule evaluation
   * @param {string} sessionId - Unique session identifier
   * @param {Object} config - Debug configuration
   * @returns {Promise<Object>} Debug session
   */
  async startDebugSession(sessionId, config = {}) {
    try {
      const session = {
        id: sessionId,
        userId: config.userId,
        emailData: config.emailData,
        rules: config.rules || [],
        context: config.context || {},
        breakpoints: new Set(),
        watchExpressions: new Set(),
        stepMode: config.stepMode || false,
        verboseLogging: config.verboseLogging || false,
        startedAt: new Date().toISOString(),
        status: 'active',
        executionSteps: [],
        variables: new Map(),
        callStack: []
      };

      this.debugSessions.set(sessionId, session);

      logger.info('Debug session started', {
        sessionId,
        userId: config.userId,
        ruleCount: session.rules.length,
        stepMode: session.stepMode
      });

      return session;

    } catch (error) {
      logger.error('Failed to start debug session', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute rules in debug mode
   * @param {string} sessionId - Debug session ID
   * @param {Array} rules - Rules to debug
   * @returns {Promise<Object>} Debug execution results
   */
  async debugRuleExecution(sessionId, rules) {
    try {
      const session = this.debugSessions.get(sessionId);
      if (!session) {
        throw new Error(`Debug session not found: ${sessionId}`);
      }

      const debugResults = {
        sessionId,
        executedRules: [],
        breakpointsHit: [],
        watchValues: new Map(),
        executionTime: 0,
        errors: [],
        warnings: []
      };

      const startTime = Date.now();

      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        
        // Check for breakpoint
        if (session.breakpoints.has(rule.id)) {
          debugResults.breakpointsHit.push({
            ruleId: rule.id,
            ruleName: rule.name,
            step: i,
            timestamp: new Date().toISOString()
          });
          
          if (session.stepMode) {
            await this.pauseExecution(sessionId, rule);
          }
        }

        // Execute rule with debugging
        const ruleDebugResult = await this.debugSingleRule(sessionId, rule, i);
        debugResults.executedRules.push(ruleDebugResult);

        // Update watch expressions
        await this.updateWatchExpressions(sessionId, rule, debugResults);

        // Log execution step
        session.executionSteps.push({
          step: i,
          ruleId: rule.id,
          ruleName: rule.name,
          result: ruleDebugResult,
          timestamp: new Date().toISOString()
        });

        // Check for errors
        if (!ruleDebugResult.success) {
          debugResults.errors.push({
            ruleId: rule.id,
            error: ruleDebugResult.error,
            step: i
          });
        }
      }

      debugResults.executionTime = Date.now() - startTime;
      session.status = 'completed';

      logger.info('Debug execution completed', {
        sessionId,
        rulesExecuted: debugResults.executedRules.length,
        breakpointsHit: debugResults.breakpointsHit.length,
        executionTime: debugResults.executionTime
      });

      return debugResults;

    } catch (error) {
      logger.error('Debug execution failed', {
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Debug a single rule execution
   * @param {string} sessionId - Debug session ID
   * @param {Object} rule - Rule to debug
   * @param {number} step - Execution step
   * @returns {Promise<Object>} Rule debug result
   */
  async debugSingleRule(sessionId, rule, step) {
    try {
      const session = this.debugSessions.get(sessionId);
      const debugResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        step,
        success: false,
        conditionResult: null,
        actionResult: null,
        executionTime: 0,
        variables: new Map(),
        error: null,
        warnings: []
      };

      const startTime = Date.now();

      // Debug condition evaluation
      try {
        debugResult.conditionResult = await this.debugConditionEvaluation(
          sessionId, 
          rule, 
          session.emailData, 
          session.context
        );
      } catch (error) {
        debugResult.error = `Condition evaluation failed: ${error.message}`;
        debugResult.executionTime = Date.now() - startTime;
        return debugResult;
      }

      // Debug action execution if condition is met
      if (debugResult.conditionResult.met) {
        try {
          debugResult.actionResult = await this.debugActionExecution(
            sessionId,
            rule,
            session.emailData,
            session.context
          );
        } catch (error) {
          debugResult.error = `Action execution failed: ${error.message}`;
          debugResult.executionTime = Date.now() - startTime;
          return debugResult;
        }
      }

      debugResult.success = true;
      debugResult.executionTime = Date.now() - startTime;

      return debugResult;

    } catch (error) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        step,
        success: false,
        error: error.message,
        executionTime: Date.now() - Date.now()
      };
    }
  }

  /**
   * Debug condition evaluation
   * @param {string} sessionId - Debug session ID
   * @param {Object} rule - Rule object
   * @param {Object} emailData - Email data
   * @param {Object} context - Evaluation context
   * @returns {Promise<Object>} Condition debug result
   */
  async debugConditionEvaluation(sessionId, rule, emailData, context) {
    const conditionDebug = {
      ruleId: rule.id,
      condition: rule.condition,
      conditionValue: rule.condition_value,
      met: false,
      evaluationSteps: [],
      variables: new Map(),
      error: null
    };

    try {
      // Step 1: Parse condition
      conditionDebug.evaluationSteps.push({
        step: 'parse',
        description: 'Parsing condition',
        result: 'success'
      });

      // Step 2: Evaluate condition based on type
      switch (rule.condition) {
        case 'subject_contains':
          conditionDebug.met = (emailData.subject || '').toLowerCase()
            .includes((rule.condition_value || '').toLowerCase());
          conditionDebug.evaluationSteps.push({
            step: 'evaluate',
            description: `Checking if subject contains "${rule.condition_value}"`,
            result: conditionDebug.met ? 'true' : 'false',
            details: {
              subject: emailData.subject,
              searchValue: rule.condition_value
            }
          });
          break;

        case 'body_contains':
          conditionDebug.met = (emailData.body || '').toLowerCase()
            .includes((rule.condition_value || '').toLowerCase());
          conditionDebug.evaluationSteps.push({
            step: 'evaluate',
            description: `Checking if body contains "${rule.condition_value}"`,
            result: conditionDebug.met ? 'true' : 'false',
            details: {
              bodyLength: emailData.body?.length || 0,
              searchValue: rule.condition_value
            }
          });
          break;

        case 'from_email':
          conditionDebug.met = (emailData.from || '').toLowerCase() === 
            (rule.condition_value || '').toLowerCase();
          conditionDebug.evaluationSteps.push({
            step: 'evaluate',
            description: `Checking if from email matches "${rule.condition_value}"`,
            result: conditionDebug.met ? 'true' : 'false',
            details: {
              fromEmail: emailData.from,
              expectedEmail: rule.condition_value
            }
          });
          break;

        case 'urgency_level':
          conditionDebug.met = context.urgency === rule.condition_value;
          conditionDebug.evaluationSteps.push({
            step: 'evaluate',
            description: `Checking if urgency level matches "${rule.condition_value}"`,
            result: conditionDebug.met ? 'true' : 'false',
            details: {
              currentUrgency: context.urgency,
              expectedUrgency: rule.condition_value
            }
          });
          break;

        default:
          conditionDebug.error = `Unknown condition type: ${rule.condition}`;
          conditionDebug.evaluationSteps.push({
            step: 'error',
            description: 'Unknown condition type',
            result: 'error',
            error: conditionDebug.error
          });
      }

      // Store variables for watch expressions
      conditionDebug.variables.set('emailData', emailData);
      conditionDebug.variables.set('context', context);
      conditionDebug.variables.set('rule', rule);

    } catch (error) {
      conditionDebug.error = error.message;
      conditionDebug.evaluationSteps.push({
        step: 'error',
        description: 'Condition evaluation error',
        result: 'error',
        error: error.message
      });
    }

    return conditionDebug;
  }

  /**
   * Debug action execution
   * @param {string} sessionId - Debug session ID
   * @param {Object} rule - Rule object
   * @param {Object} emailData - Email data
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Action debug result
   */
  async debugActionExecution(sessionId, rule, emailData, context) {
    const actionDebug = {
      ruleId: rule.id,
      action: rule.escalation_action,
      target: rule.escalation_target,
      executed: false,
      executionSteps: [],
      result: null,
      error: null
    };

    try {
      actionDebug.executionSteps.push({
        step: 'prepare',
        description: 'Preparing action execution',
        result: 'success'
      });

      // Simulate action execution based on type
      switch (rule.escalation_action) {
        case 'escalate':
          actionDebug.executionSteps.push({
            step: 'escalate',
            description: `Escalating to ${rule.escalation_target}`,
            result: 'success',
            details: {
              target: rule.escalation_target,
              emailFrom: emailData.from,
              emailSubject: emailData.subject
            }
          });
          actionDebug.result = { escalated: true, target: rule.escalation_target };
          break;

        case 'auto_reply':
          actionDebug.executionSteps.push({
            step: 'auto_reply',
            description: 'Sending auto-reply',
            result: 'success',
            details: {
              replyTo: emailData.from,
              subject: emailData.subject
            }
          });
          actionDebug.result = { autoReplySent: true };
          break;

        case 'queue_for_review':
          actionDebug.executionSteps.push({
            step: 'queue',
            description: 'Adding to review queue',
            result: 'success',
            details: {
              queueType: 'review',
              priority: rule.priority
            }
          });
          actionDebug.result = { queued: true, queueType: 'review' };
          break;

        default:
          actionDebug.error = `Unknown action type: ${rule.escalation_action}`;
          actionDebug.executionSteps.push({
            step: 'error',
            description: 'Unknown action type',
            result: 'error',
            error: actionDebug.error
          });
      }

      actionDebug.executed = !actionDebug.error;

    } catch (error) {
      actionDebug.error = error.message;
      actionDebug.executionSteps.push({
        step: 'error',
        description: 'Action execution error',
        result: 'error',
        error: error.message
      });
    }

    return actionDebug;
  }

  /**
   * Set breakpoint for rule
   * @param {string} sessionId - Debug session ID
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Success status
   */
  setBreakpoint(sessionId, ruleId) {
    const session = this.debugSessions.get(sessionId);
    if (!session) return false;

    session.breakpoints.add(ruleId);
    this.breakpoints.set(`${sessionId}_${ruleId}`, {
      sessionId,
      ruleId,
      setAt: new Date().toISOString()
    });

    logger.debug('Breakpoint set', { sessionId, ruleId });
    return true;
  }

  /**
   * Remove breakpoint for rule
   * @param {string} sessionId - Debug session ID
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Success status
   */
  removeBreakpoint(sessionId, ruleId) {
    const session = this.debugSessions.get(sessionId);
    if (!session) return false;

    session.breakpoints.delete(ruleId);
    this.breakpoints.delete(`${sessionId}_${ruleId}`);

    logger.debug('Breakpoint removed', { sessionId, ruleId });
    return true;
  }

  /**
   * Add watch expression
   * @param {string} sessionId - Debug session ID
   * @param {string} expression - Expression to watch
   * @returns {boolean} Success status
   */
  addWatchExpression(sessionId, expression) {
    const session = this.debugSessions.get(sessionId);
    if (!session) return false;

    session.watchExpressions.add(expression);
    this.watchExpressions.set(`${sessionId}_${expression}`, {
      sessionId,
      expression,
      addedAt: new Date().toISOString()
    });

    logger.debug('Watch expression added', { sessionId, expression });
    return true;
  }

  /**
   * Update watch expressions
   * @param {string} sessionId - Debug session ID
   * @param {Object} rule - Current rule
   * @param {Object} debugResults - Debug results
   */
  async updateWatchExpressions(sessionId, rule, debugResults) {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    for (const expression of session.watchExpressions) {
      try {
        const value = await this.evaluateWatchExpression(expression, {
          rule,
          emailData: session.emailData,
          context: session.context,
          variables: session.variables
        });

        debugResults.watchValues.set(expression, {
          value,
          timestamp: new Date().toISOString(),
          ruleId: rule.id
        });

      } catch (error) {
        debugResults.watchValues.set(expression, {
          error: error.message,
          timestamp: new Date().toISOString(),
          ruleId: rule.id
        });
      }
    }
  }

  /**
   * Evaluate watch expression
   * @param {string} expression - Expression to evaluate
   * @param {Object} context - Evaluation context
   * @returns {Promise<any>} Expression value
   */
  async evaluateWatchExpression(expression, context) {
    try {
      // Simple expression evaluation
      // In a real implementation, this would use a proper expression parser
      const safeExpression = expression.replace(/[^a-zA-Z0-9._]/g, '');
      
      // Evaluate common expressions
      if (safeExpression.includes('emailData.from')) {
        return context.emailData?.from || null;
      }
      if (safeExpression.includes('emailData.subject')) {
        return context.emailData?.subject || null;
      }
      if (safeExpression.includes('rule.priority')) {
        return context.rule?.priority || null;
      }
      if (safeExpression.includes('context.urgency')) {
        return context.context?.urgency || null;
      }

      return `Expression "${expression}" not supported`;

    } catch (error) {
      return `Error evaluating expression: ${error.message}`;
    }
  }

  /**
   * Pause execution for step mode
   * @param {string} sessionId - Debug session ID
   * @param {Object} rule - Current rule
   */
  async pauseExecution(sessionId, rule) {
    const session = this.debugSessions.get(sessionId);
    if (!session) return;

    session.status = 'paused';
    
    logger.debug('Execution paused', {
      sessionId,
      ruleId: rule.id,
      ruleName: rule.name
    });

    // In a real implementation, this would wait for user input
    // For now, we'll just log the pause
    await new Promise(resolve => setTimeout(resolve, 100));
    
    session.status = 'active';
  }

  /**
   * Create test case for rule
   * @param {string} testCaseId - Test case identifier
   * @param {Object} testCase - Test case configuration
   * @returns {Promise<Object>} Created test case
   */
  async createTestCase(testCaseId, testCase) {
    try {
      const testCaseConfig = {
        id: testCaseId,
        name: testCase.name || `Test Case ${testCaseId}`,
        description: testCase.description || '',
        emailData: testCase.emailData,
        expectedResults: testCase.expectedResults || [],
        context: testCase.context || {},
        rules: testCase.rules || [],
        created_at: new Date().toISOString(),
        created_by: testCase.userId
      };

      this.testCases.set(testCaseId, testCaseConfig);

      logger.info('Test case created', {
        testCaseId,
        name: testCaseConfig.name,
        ruleCount: testCaseConfig.rules.length
      });

      return testCaseConfig;

    } catch (error) {
      logger.error('Failed to create test case', {
        testCaseId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Run test case
   * @param {string} testCaseId - Test case identifier
   * @returns {Promise<Object>} Test results
   */
  async runTestCase(testCaseId) {
    try {
      const testCase = this.testCases.get(testCaseId);
      if (!testCase) {
        throw new Error(`Test case not found: ${testCaseId}`);
      }

      const testResults = {
        testCaseId,
        testCaseName: testCase.name,
        executedAt: new Date().toISOString(),
        results: [],
        passed: 0,
        failed: 0,
        total: testCase.expectedResults.length,
        executionTime: 0
      };

      const startTime = Date.now();

      // Run each expected result test
      for (const expectedResult of testCase.expectedResults) {
        const result = await this.runSingleTest(testCase, expectedResult);
        testResults.results.push(result);
        
        if (result.passed) {
          testResults.passed++;
        } else {
          testResults.failed++;
        }
      }

      testResults.executionTime = Date.now() - startTime;

      logger.info('Test case executed', {
        testCaseId,
        passed: testResults.passed,
        failed: testResults.failed,
        executionTime: testResults.executionTime
      });

      return testResults;

    } catch (error) {
      logger.error('Test case execution failed', {
        testCaseId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Run single test within test case
   * @param {Object} testCase - Test case configuration
   * @param {Object} expectedResult - Expected result configuration
   * @returns {Promise<Object>} Test result
   */
  async runSingleTest(testCase, expectedResult) {
    try {
      const testResult = {
        testName: expectedResult.name,
        passed: false,
        actualResult: null,
        expectedResult: expectedResult.result,
        error: null,
        executionTime: 0
      };

      const startTime = Date.now();

      // Execute rule with test data
      const actualResult = await this.executeRuleForTest(
        testCase.emailData,
        testCase.context,
        expectedResult.ruleId
      );

      testResult.actualResult = actualResult;
      testResult.executionTime = Date.now() - startTime;

      // Compare actual vs expected result
      testResult.passed = this.compareResults(actualResult, expectedResult.result);

      return testResult;

    } catch (error) {
      return {
        testName: expectedResult.name,
        passed: false,
        error: error.message,
        executionTime: 0
      };
    }
  }

  /**
   * Execute rule for testing
   * @param {Object} emailData - Test email data
   * @param {Object} context - Test context
   * @param {string} ruleId - Rule ID to test
   * @returns {Promise<Object>} Execution result
   */
  async executeRuleForTest(emailData, context, ruleId) {
    try {
      // Load rule
      const { data: rule, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('id', ruleId)
        .single();

      if (error || !rule) {
        throw new Error(`Rule not found: ${ruleId}`);
      }

      // Execute rule (simplified)
      const result = {
        ruleId,
        conditionMet: false,
        actionExecuted: false,
        result: null
      };

      // Evaluate condition
      switch (rule.condition) {
        case 'subject_contains':
          result.conditionMet = (emailData.subject || '').toLowerCase()
            .includes((rule.condition_value || '').toLowerCase());
          break;
        case 'body_contains':
          result.conditionMet = (emailData.body || '').toLowerCase()
            .includes((rule.condition_value || '').toLowerCase());
          break;
        case 'from_email':
          result.conditionMet = (emailData.from || '').toLowerCase() === 
            (rule.condition_value || '').toLowerCase();
          break;
        case 'urgency_level':
          result.conditionMet = context.urgency === rule.condition_value;
          break;
      }

      // Execute action if condition met
      if (result.conditionMet) {
        result.actionExecuted = true;
        result.result = {
          action: rule.escalation_action,
          target: rule.escalation_target
        };
      }

      return result;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Compare actual and expected results
   * @param {Object} actual - Actual result
   * @param {Object} expected - Expected result
   * @returns {boolean} Comparison result
   */
  compareResults(actual, expected) {
    try {
      // Simple comparison - in a real implementation, this would be more sophisticated
      return JSON.stringify(actual) === JSON.stringify(expected);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get debug session information
   * @param {string} sessionId - Session ID
   * @returns {Object} Session information
   */
  getDebugSession(sessionId) {
    return this.debugSessions.get(sessionId);
  }

  /**
   * Get all debug sessions
   * @returns {Array} All debug sessions
   */
  getAllDebugSessions() {
    return Array.from(this.debugSessions.values());
  }

  /**
   * End debug session
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  endDebugSession(sessionId) {
    const session = this.debugSessions.get(sessionId);
    if (!session) return false;

    session.status = 'ended';
    session.endedAt = new Date().toISOString();

    logger.info('Debug session ended', { sessionId });
    return true;
  }

  /**
   * Clear debug session
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  clearDebugSession(sessionId) {
    const removed = this.debugSessions.delete(sessionId);
    
    // Clean up related data
    for (const [key, value] of this.breakpoints.entries()) {
      if (value.sessionId === sessionId) {
        this.breakpoints.delete(key);
      }
    }

    for (const [key, value] of this.watchExpressions.entries()) {
      if (value.sessionId === sessionId) {
        this.watchExpressions.delete(key);
      }
    }

    if (removed) {
      logger.info('Debug session cleared', { sessionId });
    }

    return removed;
  }

  /**
   * Get debugger statistics
   * @returns {Object} Debugger statistics
   */
  getDebuggerStatistics() {
    return {
      activeSessions: Array.from(this.debugSessions.values()).filter(s => s.status === 'active').length,
      totalSessions: this.debugSessions.size,
      totalBreakpoints: this.breakpoints.size,
      totalWatchExpressions: this.watchExpressions.size,
      totalTestCases: this.testCases.size,
      debugMode: this.debugMode
    };
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug mode enabled
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    logger.info('Debug mode updated', { enabled });
  }
}

// Export singleton instance
export const ruleDebugger = new RuleDebugger();
