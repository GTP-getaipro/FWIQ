/**
 * Rule Conflict Resolver
 * Detects and resolves conflicts between business rules
 */

import { logger } from './logger.js';
import { supabase } from './customSupabaseClient.js';

export class RuleConflictResolver {
  constructor() {
    this.conflictTypes = {
      PRIORITY_CONFLICT: 'priority_conflict',
      CONDITION_OVERLAP: 'condition_overlap',
      ACTION_CONFLICT: 'action_conflict',
      TARGET_CONFLICT: 'target_conflict',
      TIMING_CONFLICT: 'timing_conflict'
    };
    
    this.resolutionStrategies = {
      HIGHEST_PRIORITY: 'highest_priority',
      MOST_SPECIFIC: 'most_specific',
      USER_CHOICE: 'user_choice',
      MERGE_CONDITIONS: 'merge_conditions',
      SEQUENTIAL_EXECUTION: 'sequential_execution'
    };
  }

  /**
   * Detect conflicts between rules
   * @param {Array} rules - Array of rules to analyze
   * @returns {Object} Conflict detection results
   */
  async detectConflicts(rules) {
    try {
      const conflicts = [];
      const analyzedPairs = new Set();
      
      // Compare each rule with every other rule
      for (let i = 0; i < rules.length; i++) {
        for (let j = i + 1; j < rules.length; j++) {
          const pairKey = `${Math.min(rules[i].id, rules[j].id)}-${Math.max(rules[i].id, rules[j].id)}`;
          
          if (analyzedPairs.has(pairKey)) continue;
          analyzedPairs.add(pairKey);
          
          const conflict = await this.analyzeRulePair(rules[i], rules[j]);
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
      
      const result = {
        hasConflicts: conflicts.length > 0,
        conflicts,
        conflictCount: conflicts.length,
        conflictTypes: this.categorizeConflicts(conflicts)
      };
      
      logger.debug('Conflict detection completed', {
        ruleCount: rules.length,
        conflictCount: conflicts.length,
        conflictTypes: result.conflictTypes
      });
      
      return result;
      
    } catch (error) {
      logger.error('Conflict detection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze a pair of rules for conflicts
   * @param {Object} rule1 - First rule
   * @param {Object} rule2 - Second rule
   * @returns {Object|null} Conflict information or null if no conflict
   */
  async analyzeRulePair(rule1, rule2) {
    const conflicts = [];
    
    // Check for condition overlap
    const conditionConflict = this.checkConditionOverlap(rule1, rule2);
    if (conditionConflict) {
      conflicts.push(conditionConflict);
    }
    
    // Check for action conflicts
    const actionConflict = this.checkActionConflict(rule1, rule2);
    if (actionConflict) {
      conflicts.push(actionConflict);
    }
    
    // Check for target conflicts
    const targetConflict = this.checkTargetConflict(rule1, rule2);
    if (targetConflict) {
      conflicts.push(targetConflict);
    }
    
    // Check for priority conflicts
    const priorityConflict = this.checkPriorityConflict(rule1, rule2);
    if (priorityConflict) {
      conflicts.push(priorityConflict);
    }
    
    if (conflicts.length === 0) {
      return null;
    }
    
    return {
      rule1: { id: rule1.id, name: rule1.name, priority: rule1.priority },
      rule2: { id: rule2.id, name: rule2.name, priority: rule2.priority },
      conflicts,
      severity: this.calculateConflictSeverity(conflicts),
      suggestedResolution: this.suggestResolution(conflicts, rule1, rule2)
    };
  }

  /**
   * Check for condition overlap between rules
   * @param {Object} rule1 - First rule
   * @param {Object} rule2 - Second rule
   * @returns {Object|null} Condition conflict or null
   */
  checkConditionOverlap(rule1, rule2) {
    // Simple condition overlap detection
    // In a real implementation, this would parse and analyze conditions more deeply
    
    if (rule1.condition === rule2.condition && 
        rule1.condition_value === rule2.condition_value) {
      return {
        type: this.conflictTypes.CONDITION_OVERLAP,
        description: 'Rules have identical conditions',
        overlap: {
          condition: rule1.condition,
          value: rule1.condition_value
        }
      };
    }
    
    // Check for partial condition overlap
    const condition1Words = (rule1.condition_value || '').toLowerCase().split(/\s+/);
    const condition2Words = (rule2.condition_value || '').toLowerCase().split(/\s+/);
    
    const commonWords = condition1Words.filter(word => 
      condition2Words.includes(word) && word.length > 3
    );
    
    if (commonWords.length > 0 && rule1.condition === rule2.condition) {
      return {
        type: this.conflictTypes.CONDITION_OVERLAP,
        description: `Rules have overlapping conditions with common keywords: ${commonWords.join(', ')}`,
        overlap: {
          condition: rule1.condition,
          commonKeywords: commonWords
        }
      };
    }
    
    return null;
  }

  /**
   * Check for action conflicts between rules
   * @param {Object} rule1 - First rule
   * @param {Object} rule2 - Second rule
   * @returns {Object|null} Action conflict or null
   */
  checkActionConflict(rule1, rule2) {
    const conflictingActions = [
      ['escalate', 'auto_reply'],
      ['escalate', 'queue_for_review'],
      ['auto_reply', 'escalate'],
      ['queue_for_review', 'escalate']
    ];
    
    const rule1Action = rule1.escalation_action;
    const rule2Action = rule2.escalation_action;
    
    const hasConflict = conflictingActions.some(([action1, action2]) => 
      (rule1Action === action1 && rule2Action === action2) ||
      (rule1Action === action2 && rule2Action === action1)
    );
    
    if (hasConflict) {
      return {
        type: this.conflictTypes.ACTION_CONFLICT,
        description: `Conflicting actions: ${rule1Action} vs ${rule2Action}`,
        actions: [rule1Action, rule2Action]
      };
    }
    
    return null;
  }

  /**
   * Check for target conflicts between rules
   * @param {Object} rule1 - First rule
   * @param {Object} rule2 - Second rule
   * @returns {Object|null} Target conflict or null
   */
  checkTargetConflict(rule1, rule2) {
    if (rule1.escalation_target === rule2.escalation_target &&
        rule1.escalation_action === rule2.escalation_action &&
        rule1.escalation_action === 'escalate') {
      
      return {
        type: this.conflictTypes.TARGET_CONFLICT,
        description: 'Rules escalate to the same target',
        target: rule1.escalation_target
      };
    }
    
    return null;
  }

  /**
   * Check for priority conflicts between rules
   * @param {Object} rule1 - First rule
   * @param {Object} rule2 - Second rule
   * @returns {Object|null} Priority conflict or null
   */
  checkPriorityConflict(rule1, rule2) {
    // Rules with same priority and overlapping conditions might conflict
    if (rule1.priority === rule2.priority) {
      const hasOverlap = this.checkConditionOverlap(rule1, rule2);
      
      if (hasOverlap) {
        return {
          type: this.conflictTypes.PRIORITY_CONFLICT,
          description: 'Rules have same priority with overlapping conditions',
          priority: rule1.priority
        };
      }
    }
    
    return null;
  }

  /**
   * Calculate conflict severity
   * @param {Array} conflicts - Array of conflicts
   * @returns {string} Severity level
   */
  calculateConflictSeverity(conflicts) {
    const severityScores = {
      [this.conflictTypes.ACTION_CONFLICT]: 3,
      [this.conflictTypes.TARGET_CONFLICT]: 2,
      [this.conflictTypes.PRIORITY_CONFLICT]: 2,
      [this.conflictTypes.CONDITION_OVERLAP]: 1,
      [this.conflictTypes.TIMING_CONFLICT]: 2
    };
    
    const maxScore = Math.max(...conflicts.map(c => severityScores[c.type] || 1));
    
    if (maxScore >= 3) return 'high';
    if (maxScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Suggest resolution for conflicts
   * @param {Array} conflicts - Array of conflicts
   * @param {Object} rule1 - First rule
   * @param {Object} rule2 - Second rule
   * @returns {Object} Suggested resolution
   */
  suggestResolution(conflicts, rule1, rule2) {
    const suggestions = [];
    
    conflicts.forEach(conflict => {
      switch (conflict.type) {
        case this.conflictTypes.PRIORITY_CONFLICT:
          suggestions.push({
            strategy: this.resolutionStrategies.HIGHEST_PRIORITY,
            description: 'Adjust priority of one rule to resolve conflict',
            action: rule1.priority > rule2.priority ? 
              `Increase priority of rule "${rule2.name}"` : 
              `Increase priority of rule "${rule1.name}"`
          });
          break;
          
        case this.conflictTypes.CONDITION_OVERLAP:
          suggestions.push({
            strategy: this.resolutionStrategies.MOST_SPECIFIC,
            description: 'Make conditions more specific to avoid overlap',
            action: 'Refine condition values to be more specific'
          });
          break;
          
        case this.conflictTypes.ACTION_CONFLICT:
          suggestions.push({
            strategy: this.resolutionStrategies.SEQUENTIAL_EXECUTION,
            description: 'Execute actions sequentially based on priority',
            action: 'Configure rules to execute in priority order'
          });
          break;
          
        case this.conflictTypes.TARGET_CONFLICT:
          suggestions.push({
            strategy: this.resolutionStrategies.USER_CHOICE,
            description: 'Choose different escalation targets',
            action: 'Assign different managers or escalation targets'
          });
          break;
      }
    });
    
    return {
      primaryStrategy: suggestions[0]?.strategy || this.resolutionStrategies.USER_CHOICE,
      suggestions,
      autoResolvable: suggestions.some(s => s.strategy === this.resolutionStrategies.HIGHEST_PRIORITY)
    };
  }

  /**
   * Resolve conflicts between rules
   * @param {Array} rules - Array of rules with conflicts
   * @param {Object} emailData - Email data for context
   * @param {Object} context - Additional context
   * @returns {Array} Resolved rules
   */
  async resolveConflicts(rules, emailData = null, context = {}) {
    try {
      if (!Array.isArray(rules)) {
        return rules;
      }
      
      // Sort rules by priority (highest first)
      const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
      
      const resolvedRules = [];
      const processedRules = new Set();
      
      for (const rule of sortedRules) {
        if (processedRules.has(rule.id)) continue;
        
        // Check for conflicts with already processed rules
        let hasConflict = false;
        
        for (const processedRule of resolvedRules) {
          const conflict = await this.analyzeRulePair(rule, processedRule);
          if (conflict && conflict.severity === 'high') {
            hasConflict = true;
            
            // Apply conflict resolution
            const resolution = await this.applyResolution(conflict, rule, processedRule);
            
            if (resolution.keepRule) {
              resolvedRules.push(rule);
              processedRules.add(rule.id);
            }
            
            break;
          }
        }
        
        if (!hasConflict) {
          resolvedRules.push(rule);
          processedRules.add(rule.id);
        }
      }
      
      logger.debug('Conflict resolution completed', {
        originalCount: rules.length,
        resolvedCount: resolvedRules.length,
        conflictsResolved: rules.length - resolvedRules.length
      });
      
      return resolvedRules;
      
    } catch (error) {
      logger.error('Conflict resolution failed', { error: error.message });
      // Return original rules if resolution fails
      return rules;
    }
  }

  /**
   * Apply conflict resolution strategy
   * @param {Object} conflict - Conflict information
   * @param {Object} rule1 - First rule
   * @param {Object} rule2 - Second rule
   * @returns {Object} Resolution result
   */
  async applyResolution(conflict, rule1, rule2) {
    const suggestion = conflict.suggestedResolution;
    
    switch (suggestion.primaryStrategy) {
      case this.resolutionStrategies.HIGHEST_PRIORITY:
        return {
          keepRule: rule1.priority >= rule2.priority,
          reason: 'Higher priority rule kept',
          action: 'priority_based_resolution'
        };
        
      case this.resolutionStrategies.MOST_SPECIFIC:
        // Keep the rule with more specific conditions
        const specificity1 = this.calculateSpecificity(rule1);
        const specificity2 = this.calculateSpecificity(rule2);
        
        return {
          keepRule: specificity1 >= specificity2,
          reason: 'More specific rule kept',
          action: 'specificity_based_resolution'
        };
        
      case this.resolutionStrategies.SEQUENTIAL_EXECUTION:
        // Keep both rules but mark for sequential execution
        return {
          keepRule: true,
          reason: 'Sequential execution configured',
          action: 'sequential_execution'
        };
        
      default:
        // Default to keeping the higher priority rule
        return {
          keepRule: rule1.priority >= rule2.priority,
          reason: 'Default priority-based resolution',
          action: 'default_resolution'
        };
    }
  }

  /**
   * Calculate rule specificity score
   * @param {Object} rule - Rule object
   * @returns {number} Specificity score
   */
  calculateSpecificity(rule) {
    let score = 0;
    
    // Base score for having a condition
    if (rule.condition) score += 1;
    
    // Score based on condition value length (longer = more specific)
    if (rule.condition_value) {
      score += rule.condition_value.length / 10;
    }
    
    // Score based on condition type
    if (rule.condition_type === 'complex') score += 2;
    if (rule.condition_type === 'regex') score += 3;
    
    // Score based on metadata complexity
    if (rule.metadata && typeof rule.metadata === 'object') {
      score += Object.keys(rule.metadata).length * 0.5;
    }
    
    return score;
  }

  /**
   * Check for potential conflicts when creating/updating a rule
   * @param {Object} ruleData - Rule data
   * @param {string} userId - User ID
   * @param {string} excludeRuleId - Rule ID to exclude from conflict check
   * @returns {Object} Conflict check results
   */
  async checkForConflicts(ruleData, userId, excludeRuleId = null) {
    try {
      const { data: existingRules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true);
      
      if (error) throw error;
      
      // Filter out the rule being updated
      const rulesToCheck = existingRules.filter(rule => rule.id !== excludeRuleId);
      
      // Create a temporary rule object for comparison
      const tempRule = {
        id: 'temp',
        name: ruleData.name || 'New Rule',
        condition: ruleData.condition,
        condition_value: ruleData.conditionValue,
        escalation_action: ruleData.escalationAction,
        escalation_target: ruleData.escalationTarget,
        priority: ruleData.priority || 5
      };
      
      const conflicts = [];
      
      for (const existingRule of rulesToCheck) {
        const conflict = await this.analyzeRulePair(tempRule, existingRule);
        if (conflict) {
          conflicts.push({
            ...conflict,
            existingRule: {
              id: existingRule.id,
              name: existingRule.name
            }
          });
        }
      }
      
      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        conflictCount: conflicts.length,
        severity: conflicts.length > 0 ? 
          Math.max(...conflicts.map(c => this.calculateConflictSeverity([c]) === 'high' ? 3 : 
                                       this.calculateConflictSeverity([c]) === 'medium' ? 2 : 1)) : 0
      };
      
    } catch (error) {
      logger.error('Conflict check failed', { error: error.message });
      return {
        hasConflicts: false,
        conflicts: [],
        conflictCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Categorize conflicts by type
   * @param {Array} conflicts - Array of conflicts
   * @returns {Object} Conflict categorization
   */
  categorizeConflicts(conflicts) {
    const categories = {};
    
    conflicts.forEach(conflict => {
      conflict.conflicts.forEach(c => {
        categories[c.type] = (categories[c.type] || 0) + 1;
      });
    });
    
    return categories;
  }

  /**
   * Get conflict resolution recommendations
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Recommendations
   */
  async getResolutionRecommendations(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true);
      
      if (error) throw error;
      
      const conflictDetection = await this.detectConflicts(rules);
      
      const recommendations = {
        totalRules: rules.length,
        conflictCount: conflictDetection.conflictCount,
        hasConflicts: conflictDetection.hasConflicts,
        recommendations: []
      };
      
      if (conflictDetection.hasConflicts) {
        conflictDetection.conflicts.forEach(conflict => {
          recommendations.recommendations.push({
            rule1: conflict.rule1.name,
            rule2: conflict.rule2.name,
            conflictTypes: conflict.conflicts.map(c => c.type),
            severity: conflict.severity,
            suggestedResolution: conflict.suggestedResolution
          });
        });
      }
      
      return recommendations;
      
    } catch (error) {
      logger.error('Failed to get resolution recommendations', { error: error.message });
      throw error;
    }
  }
}

// Export singleton instance
export const ruleConflictResolver = new RuleConflictResolver();
