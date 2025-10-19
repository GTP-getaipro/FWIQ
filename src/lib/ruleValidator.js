/**
 * Rule Validator
 * Validates business rules for syntax, logic, and best practices
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class RuleValidator {
  constructor() {
    this.validationRules = {
      // Required fields
      required: ['name', 'condition', 'escalation_action'],
      
      // Field validation patterns
      patterns: {
        name: /^[a-zA-Z0-9\s\-_]{1,100}$/,
        condition: /^[a-zA-Z0-9\s\-_\.]+$/,
        conditionValue: /^.{1,500}$/,
        escalationAction: /^(escalate|auto_reply|queue_for_review|send_notification|create_task)$/,
        escalationTarget: /^.{0,200}$/,
        priority: /^[1-9]|10$/
      },
      
      // Validation messages
      messages: {
        required: 'Field is required',
        invalidPattern: 'Field format is invalid',
        tooLong: 'Field is too long',
        tooShort: 'Field is too short',
        invalidValue: 'Invalid value provided',
        duplicateName: 'Rule name already exists'
      },
      
      // Best practices
      bestPractices: {
        maxRulesPerUser: 50,
        maxConditionsPerRule: 10,
        minPriority: 1,
        maxPriority: 10,
        recommendedConditions: [
          'subject_contains',
          'body_contains',
          'from_email',
          'urgency_level',
          'category',
          'sentiment'
        ]
      }
    };
  }

  /**
   * Validate a single rule
   * @param {Object} rule - Rule object to validate
   * @returns {Object} Validation result
   */
  async validateRule(rule) {
    try {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
      
      // Validate required fields
      this.validateRequiredFields(rule, result);
      
      // Validate field patterns
      this.validateFieldPatterns(rule, result);
      
      // Validate field lengths
      this.validateFieldLengths(rule, result);
      
      // Validate business logic
      await this.validateBusinessLogic(rule, result);
      
      // Check for best practices
      this.validateBestPractices(rule, result);
      
      // Check for duplicate names
      await this.checkDuplicateName(rule, result);
      
      // Overall validation result
      result.isValid = result.errors.length === 0;
      
      logger.debug('Rule validation completed', {
        ruleName: rule.name,
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Rule validation failed', { error: error.message });
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Validate rule update
   * @param {Object} updateData - Update data to validate
   * @returns {Object} Validation result
   */
  async validateRuleUpdate(updateData) {
    try {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      };
      
      // Only validate fields that are being updated
      const fieldsToValidate = Object.keys(updateData);
      
      // Validate required fields if present
      fieldsToValidate.forEach(field => {
        if (this.validationRules.required.includes(field)) {
          this.validateRequiredField(field, updateData[field], result);
        }
      });
      
      // Validate field patterns
      fieldsToValidate.forEach(field => {
        this.validateFieldPattern(field, updateData[field], result);
      });
      
      // Validate field lengths
      fieldsToValidate.forEach(field => {
        this.validateFieldLength(field, updateData[field], result);
      });
      
      // Validate business logic for updated fields
      await this.validateBusinessLogic(updateData, result);
      
      // Overall validation result
      result.isValid = result.errors.length === 0;
      
      logger.debug('Rule update validation completed', {
        fieldsUpdated: fieldsToValidate,
        isValid: result.isValid,
        errorCount: result.errors.length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Rule update validation failed', { error: error.message });
      return {
        isValid: false,
        errors: [`Update validation error: ${error.message}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Validate required fields
   * @param {Object} rule - Rule object
   * @param {Object} result - Validation result object
   */
  validateRequiredFields(rule, result) {
    this.validationRules.required.forEach(field => {
      this.validateRequiredField(field, rule[field], result);
    });
  }

  /**
   * Validate a single required field
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @param {Object} result - Validation result object
   */
  validateRequiredField(field, value, result) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      result.errors.push(`${field}: ${this.validationRules.messages.required}`);
    }
  }

  /**
   * Validate field patterns
   * @param {Object} rule - Rule object
   * @param {Object} result - Validation result object
   */
  validateFieldPatterns(rule, result) {
    Object.entries(this.validationRules.patterns).forEach(([field, pattern]) => {
      this.validateFieldPattern(field, rule[field], result);
    });
  }

  /**
   * Validate a single field pattern
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @param {Object} result - Validation result object
   */
  validateFieldPattern(field, value, result) {
    if (value === undefined || value === null) return;
    
    const pattern = this.validationRules.patterns[field];
    if (pattern && !pattern.test(value)) {
      result.errors.push(`${field}: ${this.validationRules.messages.invalidPattern}`);
    }
  }

  /**
   * Validate field lengths
   * @param {Object} rule - Rule object
   * @param {Object} result - Validation result object
   */
  validateFieldLengths(rule, result) {
    const lengthRules = {
      name: { min: 1, max: 100 },
      condition: { min: 1, max: 200 },
      condition_value: { min: 1, max: 500 },
      escalation_target: { min: 0, max: 200 },
      description: { min: 0, max: 1000 }
    };
    
    Object.entries(lengthRules).forEach(([field, rules]) => {
      this.validateFieldLength(field, rule[field], result, rules);
    });
  }

  /**
   * Validate a single field length
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @param {Object} result - Validation result object
   * @param {Object} rules - Length rules
   */
  validateFieldLength(field, value, result, rules) {
    if (value === undefined || value === null) return;
    
    const length = typeof value === 'string' ? value.length : String(value).length;
    
    if (rules.min && length < rules.min) {
      result.errors.push(`${field}: ${this.validationRules.messages.tooShort}`);
    }
    
    if (rules.max && length > rules.max) {
      result.errors.push(`${field}: ${this.validationRules.messages.tooLong}`);
    }
  }

  /**
   * Validate business logic
   * @param {Object} rule - Rule object
   * @param {Object} result - Validation result object
   */
  async validateBusinessLogic(rule, result) {
    // Validate escalation action and target combination
    if (rule.escalation_action === 'escalate' && !rule.escalation_target) {
      result.errors.push('escalation_target: Escalation target is required when action is "escalate"');
    }
    
    // Validate priority range
    if (rule.priority !== undefined) {
      if (rule.priority < this.validationRules.bestPractices.minPriority || 
          rule.priority > this.validationRules.bestPractices.maxPriority) {
        result.errors.push(`priority: Priority must be between ${this.validationRules.bestPractices.minPriority} and ${this.validationRules.bestPractices.maxPriority}`);
      }
    }
    
    // Validate condition and value combination
    if (rule.condition && !rule.condition_value) {
      result.warnings.push('condition_value: Consider adding a condition value for better rule specificity');
    }
    
    // Validate escalation target format for email actions
    if (rule.escalation_action === 'escalate' && rule.escalation_target) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(rule.escalation_target)) {
        result.warnings.push('escalation_target: Target does not appear to be a valid email address');
      }
    }
  }

  /**
   * Validate best practices
   * @param {Object} rule - Rule object
   * @param {Object} result - Validation result object
   */
  validateBestPractices(rule, result) {
    // Check condition against recommended conditions
    if (rule.condition && !this.validationRules.bestPractices.recommendedConditions.includes(rule.condition)) {
      result.suggestions.push(`condition: Consider using one of the recommended conditions: ${this.validationRules.bestPractices.recommendedConditions.join(', ')}`);
    }
    
    // Check priority distribution
    if (rule.priority !== undefined) {
      if (rule.priority <= 3) {
        result.suggestions.push('priority: High priority rules (1-3) should be used sparingly for critical escalations');
      } else if (rule.priority >= 8) {
        result.suggestions.push('priority: Low priority rules (8-10) may not be triggered if higher priority rules are active');
      }
    }
    
    // Check for overly complex conditions
    if (rule.condition_value && rule.condition_value.length > 200) {
      result.warnings.push('condition_value: Very long condition values may impact performance. Consider breaking into multiple rules.');
    }
    
    // Check for generic rule names
    if (rule.name && (rule.name.toLowerCase().includes('rule') || rule.name.toLowerCase().includes('test'))) {
      result.suggestions.push('name: Consider using more descriptive rule names that clearly indicate the purpose');
    }
  }

  /**
   * Check for duplicate rule names
   * @param {Object} rule - Rule object
   * @param {Object} result - Validation result object
   */
  async checkDuplicateName(rule, result) {
    try {
      if (!rule.name || !rule.user_id) return;
      
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('id, name')
        .eq('user_id', rule.user_id)
        .eq('name', rule.name)
        .neq('id', rule.id || '') // Exclude current rule if updating
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        result.errors.push(`name: ${this.validationRules.messages.duplicateName}`);
      }
      
    } catch (error) {
      logger.warn('Failed to check duplicate rule name', { error: error.message });
      result.warnings.push('name: Could not verify if rule name is unique');
    }
  }

  /**
   * Validate rule configuration for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Configuration validation result
   */
  async validateRuleConfiguration(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const result = {
        isValid: true,
        totalRules: rules.length,
        enabledRules: rules.filter(r => r.enabled).length,
        disabledRules: rules.filter(r => !r.enabled).length,
        errors: [],
        warnings: [],
        suggestions: []
      };
      
      // Check rule count limits
      if (result.totalRules > this.validationRules.bestPractices.maxRulesPerUser) {
        result.warnings.push(`Total rules (${result.totalRules}) exceeds recommended limit (${this.validationRules.bestPractices.maxRulesPerUser})`);
      }
      
      // Check for rules without escalation targets
      const rulesWithoutTargets = rules.filter(r => 
        r.escalation_action === 'escalate' && !r.escalation_target
      );
      
      if (rulesWithoutTargets.length > 0) {
        result.errors.push(`${rulesWithoutTargets.length} rules have escalation action but no target`);
      }
      
      // Check priority distribution
      const priorityDistribution = {};
      rules.forEach(rule => {
        priorityDistribution[rule.priority] = (priorityDistribution[rule.priority] || 0) + 1;
      });
      
      const highPriorityCount = Object.entries(priorityDistribution)
        .filter(([priority]) => parseInt(priority) <= 3)
        .reduce((sum, [, count]) => sum + count, 0);
      
      if (highPriorityCount > 5) {
        result.warnings.push(`Too many high priority rules (${highPriorityCount}). Consider reviewing priorities.`);
      }
      
      // Check for disabled rules
      if (result.disabledRules > result.enabledRules) {
        result.suggestions.push('More rules are disabled than enabled. Consider cleaning up unused rules.');
      }
      
      // Overall configuration validity
      result.isValid = result.errors.length === 0;
      
      logger.info('Rule configuration validation completed', {
        userId,
        isValid: result.isValid,
        totalRules: result.totalRules,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });
      
      return result;
      
    } catch (error) {
      logger.error('Rule configuration validation failed', { error: error.message });
      return {
        isValid: false,
        totalRules: 0,
        enabledRules: 0,
        disabledRules: 0,
        errors: [`Configuration validation error: ${error.message}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Get validation recommendations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Validation recommendations
   */
  async getValidationRecommendations(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true);
      
      if (error) throw error;
      
      const recommendations = {
        performance: [],
        bestPractices: [],
        security: [],
        maintenance: []
      };
      
      // Performance recommendations
      if (rules.length > 20) {
        recommendations.performance.push('Consider consolidating similar rules to improve performance');
      }
      
      // Best practices recommendations
      const genericNames = rules.filter(r => 
        r.name.toLowerCase().includes('rule') || 
        r.name.toLowerCase().includes('test') ||
        r.name.length < 5
      );
      
      if (genericNames.length > 0) {
        recommendations.bestPractices.push(`${genericNames.length} rules have generic names. Consider more descriptive names.`);
      }
      
      // Security recommendations
      const rulesWithEmailTargets = rules.filter(r => 
        r.escalation_action === 'escalate' && r.escalation_target
      );
      
      const externalEmails = rulesWithEmailTargets.filter(r => 
        !r.escalation_target.includes('@yourdomain.com') // Replace with actual domain check
      );
      
      if (externalEmails.length > 0) {
        recommendations.security.push(`${externalEmails.length} rules escalate to external email addresses. Verify these are correct.`);
      }
      
      // Maintenance recommendations
      const oldRules = rules.filter(r => {
        const createdDate = new Date(r.created_at);
        const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
        return createdDate < sixMonthsAgo;
      });
      
      if (oldRules.length > 0) {
        recommendations.maintenance.push(`${oldRules.length} rules are older than 6 months. Consider reviewing for relevance.`);
      }
      
      return recommendations;
      
    } catch (error) {
      logger.error('Failed to get validation recommendations', { error: error.message });
      return {
        performance: [],
        bestPractices: [],
        security: [],
        maintenance: []
      };
    }
  }

  /**
   * Validate rule syntax for complex conditions
   * @param {string} condition - Condition string
   * @returns {Object} Syntax validation result
   */
  validateConditionSyntax(condition) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    try {
      // Basic syntax validation
      if (!condition || condition.trim() === '') {
        result.errors.push('Condition cannot be empty');
        result.isValid = false;
        return result;
      }
      
      // Check for balanced parentheses
      const openParens = (condition.match(/\(/g) || []).length;
      const closeParens = (condition.match(/\)/g) || []).length;
      
      if (openParens !== closeParens) {
        result.errors.push('Unbalanced parentheses in condition');
        result.isValid = false;
      }
      
      // Check for valid operators
      const validOperators = ['AND', 'OR', 'NOT', '&&', '||', '!'];
      const operators = condition.match(/\b(AND|OR|NOT|&&|\|\||!)\b/g) || [];
      
      operators.forEach(op => {
        if (!validOperators.includes(op)) {
          result.warnings.push(`Unknown operator: ${op}`);
        }
      });
      
      // Check for proper condition format
      const conditionPattern = /^[a-zA-Z_][a-zA-Z0-9_]*\s*[=!<>]+\s*.+$/;
      const conditions = condition.split(/\s+(?:AND|OR|&&|\|\|)\s+/);
      
      conditions.forEach(cond => {
        if (!conditionPattern.test(cond.trim())) {
          result.warnings.push(`Condition format may be invalid: ${cond.trim()}`);
        }
      });
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Syntax validation error: ${error.message}`);
    }
    
    return result;
  }
}

// Export singleton instance
export const ruleValidator = new RuleValidator();
