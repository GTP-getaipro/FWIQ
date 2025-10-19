import { supabase } from './customSupabaseClient';

export class BusinessRulesEngine {
  constructor() {
    this.rules = new Map();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async loadRules(userId) {
    // Check cache first
    const cacheKey = `rules_${userId}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        this.rules = cached.rules;
        return;
      }
    }

    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      this.rules.clear();
      rules.forEach(rule => {
        this.rules.set(rule.id, rule);
      });

      // Cache the rules
      this.cache.set(cacheKey, {
        rules: new Map(this.rules),
        timestamp: Date.now()
      });

      console.log(`Loaded ${rules.length} business rules for user ${userId}`);

    } catch (error) {
      console.error('Failed to load business rules:', error);
      throw error;
    }
  }

  async evaluateRules(emailData, userId, context = {}) {
    try {
      await this.loadRules(userId);
      
      const results = [];
      
      for (const [ruleId, rule] of this.rules) {
        try {
          const conditionMet = await this.evaluateCondition(rule.condition, emailData, userId, context);
          
          if (conditionMet) {
            const ruleResult = {
              ruleId: ruleId,
              rule: rule,
              action: rule.escalation_action || rule.action,
              priority: rule.priority || this.getDefaultPriority(rule.condition),
              condition: rule.condition,
              value: rule.value,
              description: rule.description || `Rule triggered: ${rule.condition}`,
              timestamp: new Date().toISOString()
            };
            
            results.push(ruleResult);
            console.log(`Rule triggered: ${rule.condition} (ID: ${ruleId})`);
          }

        } catch (error) {
          console.error(`Failed to evaluate rule ${ruleId}:`, error);
          // Continue with other rules even if one fails
        }
      }
      
      // Sort by priority (highest first)
      return results.sort((a, b) => b.priority - a.priority);

    } catch (error) {
      console.error('Failed to evaluate business rules:', error);
      return [];
    }
  }

  async evaluateCondition(condition, emailData, userId, context = {}) {
    switch (condition) {
      case 'after_hours':
        return await this.isAfterHours(userId);
      
      case 'high_urgency':
        return this.isHighUrgency(emailData, context);
      
      case 'keyword_match':
        return this.hasKeywordMatch(emailData, context);
      
      case 'manager_required':
        return this.requiresManager(emailData, context);
      
      case 'customer_vip':
        return await this.isVIPCustomer(emailData, userId);
      
      case 'complaint_detected':
        return this.isComplaint(emailData, context);
      
      case 'emergency_keywords':
        return this.hasEmergencyKeywords(emailData);
      
      case 'response_overdue':
        return await this.isResponseOverdue(emailData, userId);
      
      case 'multiple_emails':
        return await this.hasMultipleRecentEmails(emailData, userId);
      
      case 'all_emails':
        return true; // Always triggers
      
      case 'urgency_level':
        return this.matchesUrgencyLevel(emailData, context);
      
      case 'category_match':
        return this.matchesCategory(emailData, context);
      
      case 'sentiment_negative':
        return this.hasNegativeSentiment(emailData, context);
      
      default:
        console.warn(`Unknown condition: ${condition}`);
        return false;
    }
  }

  async isAfterHours(userId) {
    try {
      const { data: businessHours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!businessHours || !businessHours.schedule) {
        return false; // If no business hours defined, assume always open
      }

      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      const todaySchedule = businessHours.schedule[dayName];
      
      if (!todaySchedule || !todaySchedule.open) {
        return true; // Closed today
      }

      // Convert time strings to HHMM format for comparison
      const startTime = parseInt(todaySchedule.start.replace(':', ''));
      const endTime = parseInt(todaySchedule.end.replace(':', ''));

      return currentTime < startTime || currentTime > endTime;

    } catch (error) {
      console.error('Failed to check business hours:', error);
      return false;
    }
  }

  isHighUrgency(emailData, context = {}) {
    // Check classification first if available
    if (context.classification && context.classification.urgency) {
      return context.classification.urgency === 'critical' || context.classification.urgency === 'high';
    }

    // Fallback to keyword detection
    const urgentKeywords = [
      'urgent', 'asap', 'emergency', 'critical', 'immediate', 'help',
      'broken', 'not working', 'stopped', 'failed', 'down', 'out of order'
    ];
    
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body || '').toLowerCase();
    const content = subject + ' ' + body;
    
    return urgentKeywords.some(keyword => content.includes(keyword));
  }

  hasKeywordMatch(emailData, context = {}) {
    // This would typically be configured per rule with specific keywords
    // For now, we'll use some common business keywords
    const businessKeywords = [
      'quote', 'estimate', 'pricing', 'cost', 'payment', 'invoice',
      'schedule', 'appointment', 'booking', 'availability',
      'warranty', 'guarantee', 'service', 'repair', 'maintenance'
    ];
    
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body || '').toLowerCase();
    const content = subject + ' ' + body;
    
    return businessKeywords.some(keyword => content.includes(keyword));
  }

  requiresManager(emailData, context = {}) {
    const managerKeywords = [
      'manager', 'supervisor', 'complaint', 'refund', 'cancel',
      'lawsuit', 'legal', 'attorney', 'better business bureau',
      'review', 'yelp', 'google review', 'social media'
    ];
    
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body || '').toLowerCase();
    const content = subject + ' ' + body;
    
    return managerKeywords.some(keyword => content.includes(keyword));
  }

  async isVIPCustomer(emailData, userId) {
    try {
      // Check if customer email is in VIP list
      // This would typically be stored in a customer database
      const vipEmails = [
        // This could be loaded from a VIP customers table
      ];
      
      return vipEmails.includes(emailData.from?.toLowerCase());

    } catch (error) {
      console.error('Failed to check VIP status:', error);
      return false;
    }
  }

  isComplaint(emailData, context = {}) {
    // Check classification first if available
    if (context.classification && context.classification.category) {
      return context.classification.category === 'complaint';
    }

    // Fallback to keyword detection
    const complaintKeywords = [
      'complaint', 'complain', 'unhappy', 'dissatisfied', 'disappointed',
      'poor service', 'bad experience', 'terrible', 'awful', 'horrible',
      'refund', 'money back', 'cancel', 'dispute'
    ];
    
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body || '').toLowerCase();
    const content = subject + ' ' + body;
    
    return complaintKeywords.some(keyword => content.includes(keyword));
  }

  hasEmergencyKeywords(emailData) {
    const emergencyKeywords = [
      'emergency', 'urgent', 'asap', 'immediately', 'right now',
      'can\'t wait', 'critical', 'life threatening', 'dangerous',
      'flooding', 'fire', 'smoke', 'gas leak', 'electrical hazard'
    ];
    
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body || '').toLowerCase();
    const content = subject + ' ' + body;
    
    return emergencyKeywords.some(keyword => content.includes(keyword));
  }

  async isResponseOverdue(emailData, userId) {
    try {
      // Check if there's an existing email thread that hasn't been responded to
      const { data: recentEmails } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('email_from', emailData.from)
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()) // Last 48 hours
        .order('created_at', { ascending: false });

      if (!recentEmails || recentEmails.length === 0) {
        return false;
      }

      // Check if the most recent email was responded to
      const mostRecent = recentEmails[0];
      return !mostRecent.response_sent;

    } catch (error) {
      console.error('Failed to check response status:', error);
      return false;
    }
  }

  async hasMultipleRecentEmails(emailData, userId) {
    try {
      const { data: recentEmails } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('email_from', emailData.from)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false });

      return recentEmails && recentEmails.length >= 2;

    } catch (error) {
      console.error('Failed to check recent emails:', error);
      return false;
    }
  }

  matchesUrgencyLevel(emailData, context = {}) {
    if (!context.classification || !context.ruleValue) {
      return false;
    }
    
    return context.classification.urgency === context.ruleValue;
  }

  matchesCategory(emailData, context = {}) {
    if (!context.classification || !context.ruleValue) {
      return false;
    }
    
    return context.classification.category === context.ruleValue;
  }

  hasNegativeSentiment(emailData, context = {}) {
    // Check classification first if available
    if (context.classification && context.classification.sentiment) {
      return context.classification.sentiment === 'negative';
    }

    // Fallback to keyword detection
    const negativeKeywords = [
      'angry', 'frustrated', 'upset', 'mad', 'furious', 'disappointed',
      'terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusted'
    ];
    
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.body || '').toLowerCase();
    const content = subject + ' ' + body;
    
    return negativeKeywords.some(keyword => content.includes(keyword));
  }

  getDefaultPriority(condition) {
    const priorityMap = {
      'emergency_keywords': 10,
      'high_urgency': 9,
      'manager_required': 8,
      'customer_vip': 7,
      'complaint_detected': 6,
      'after_hours': 5,
      'response_overdue': 4,
      'multiple_emails': 3,
      'keyword_match': 2,
      'sentiment_negative': 2,
      'all_emails': 1
    };
    
    return priorityMap[condition] || 1;
  }

  // Rule management methods
  async createRule(userId, ruleData) {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .insert({
          user_id: userId,
          condition: ruleData.condition,
          value: ruleData.value,
          escalation_action: ruleData.action,
          priority: ruleData.priority || this.getDefaultPriority(ruleData.condition),
          description: ruleData.description,
          enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      // Clear cache to force reload
      this.cache.delete(`rules_${userId}`);

      return data;

    } catch (error) {
      console.error('Failed to create rule:', error);
      throw error;
    }
  }

  async updateRule(ruleId, updates) {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .update(updates)
        .eq('id', ruleId)
        .select()
        .single();

      if (error) throw error;

      // Clear cache to force reload
      this.cache.clear();

      return data;

    } catch (error) {
      console.error('Failed to update rule:', error);
      throw error;
    }
  }

  async deleteRule(ruleId) {
    try {
      const { error } = await supabase
        .from('escalation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      // Clear cache to force reload
      this.cache.clear();

      return true;

    } catch (error) {
      console.error('Failed to delete rule:', error);
      throw error;
    }
  }

  async getRules(userId) {
    try {
      const { data: rules, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return rules;

    } catch (error) {
      console.error('Failed to get rules:', error);
      throw error;
    }
  }

  // Batch evaluation for multiple emails
  async evaluateBatch(emails, userId, context = {}) {
    const results = [];
    
    for (const email of emails) {
      try {
        const emailResults = await this.evaluateRules(email, userId, context);
        results.push({
          emailId: email.id,
          success: true,
          rules: emailResults
        });
      } catch (error) {
        console.error(`Failed to evaluate rules for email ${email.id}:`, error);
        results.push({
          emailId: email.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Get rule evaluation statistics
  async getRuleStats(userId, timeframe = '24h') {
    try {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 24h, 7d, 30d
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data: logs, error } = await supabase
        .from('email_logs')
        .select('escalated, escalation_reason, category, urgency, created_at')
        .eq('user_id', userId)
        .gte('created_at', since);

      if (error) throw error;

      const stats = {
        total: logs.length,
        escalated: logs.filter(log => log.escalated).length,
        byCategory: {},
        byUrgency: {},
        escalationReasons: {}
      };

      logs.forEach(log => {
        // Count by category
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
        
        // Count by urgency
        stats.byUrgency[log.urgency] = (stats.byUrgency[log.urgency] || 0) + 1;
        
        // Count escalation reasons
        if (log.escalated && log.escalation_reason) {
          stats.escalationReasons[log.escalation_reason] = (stats.escalationReasons[log.escalation_reason] || 0) + 1;
        }
      });

      return stats;

    } catch (error) {
      console.error('Failed to get rule stats:', error);
      return null;
    }
  }

  // Clear cache
  clearCache(userId = null) {
    if (userId) {
      this.cache.delete(`rules_${userId}`);
    } else {
      this.cache.clear();
    }
  }

  // Validate rule configuration
  validateRule(ruleData) {
    const validConditions = [
      'after_hours', 'high_urgency', 'keyword_match', 'manager_required',
      'customer_vip', 'complaint_detected', 'emergency_keywords',
      'response_overdue', 'multiple_emails', 'all_emails',
      'urgency_level', 'category_match', 'sentiment_negative'
    ];

    const validActions = [
      'escalate', 'notify_manager', 'auto_reply', 'high_priority',
      'immediate_response', 'create_ticket', 'send_sms', 'call_customer'
    ];

    const errors = [];

    if (!ruleData.condition || !validConditions.includes(ruleData.condition)) {
      errors.push(`Invalid condition: ${ruleData.condition}`);
    }

    if (!ruleData.action || !validActions.includes(ruleData.action)) {
      errors.push(`Invalid action: ${ruleData.action}`);
    }

    if (ruleData.priority && (ruleData.priority < 1 || ruleData.priority > 10)) {
      errors.push('Priority must be between 1 and 10');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
