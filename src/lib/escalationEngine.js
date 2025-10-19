import { supabase } from './customSupabaseClient';
import { BusinessRulesEngine } from './businessRules';

export class EscalationEngine {
  constructor() {
    this.rulesEngine = new BusinessRulesEngine();
    this.escalationQueue = new Map();
    this.processingInterval = null;
  }

  async processEscalation(emailData, userId, classification = {}, routing = {}) {
    try {
      console.log(`Processing escalation for email from ${emailData.from}`);

      // Evaluate business rules to determine escalation needs
      const triggeredRules = await this.rulesEngine.evaluateRules(
        emailData, 
        userId, 
        { classification, routing }
      );

      if (triggeredRules.length === 0) {
        console.log('No escalation rules triggered');
        return {
          escalated: false,
          reason: 'No escalation rules triggered'
        };
      }

      // Process each triggered rule
      const escalationResults = [];
      
      for (const ruleResult of triggeredRules) {
        const result = await this.executeEscalationAction(
          ruleResult,
          emailData,
          userId,
          classification
        );
        escalationResults.push(result);
      }

      // Log the escalation
      await this.logEscalation(emailData, userId, triggeredRules, escalationResults);

      return {
        escalated: true,
        triggeredRules,
        results: escalationResults,
        highestPriority: Math.max(...triggeredRules.map(r => r.priority))
      };

    } catch (error) {
      console.error('Escalation processing failed:', error);
      throw error;
    }
  }

  async executeEscalationAction(ruleResult, emailData, userId, classification) {
    const { action, rule, priority } = ruleResult;

    try {
      console.log(`Executing escalation action: ${action} (Priority: ${priority})`);

      switch (action) {
        case 'escalate':
          return await this.createEscalationRecord(ruleResult, emailData, userId);
        
        case 'notify_manager':
          return await this.notifyManager(ruleResult, emailData, userId);
        
        case 'high_priority':
          return await this.setHighPriority(ruleResult, emailData, userId);
        
        case 'immediate_response':
          return await this.triggerImmediateResponse(ruleResult, emailData, userId);
        
        case 'create_ticket':
          return await this.createSupportTicket(ruleResult, emailData, userId);
        
        case 'send_sms':
          return await this.sendSMSNotification(ruleResult, emailData, userId);
        
        case 'call_customer':
          return await this.scheduleCustomerCall(ruleResult, emailData, userId);
        
        case 'auto_reply':
          return await this.triggerAutoReply(ruleResult, emailData, userId);
        
        default:
          console.warn(`Unknown escalation action: ${action}`);
          return {
            success: false,
            action,
            error: `Unknown action: ${action}`
          };
      }

    } catch (error) {
      console.error(`Failed to execute escalation action ${action}:`, error);
      return {
        success: false,
        action,
        error: error.message
      };
    }
  }

  async createEscalationRecord(ruleResult, emailData, userId) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from,
          email_subject: emailData.subject,
          category: 'escalation',
          urgency: 'high',
          escalated: true,
          escalation_reason: ruleResult.description,
          escalation_rule_id: ruleResult.ruleId,
          priority: ruleResult.priority
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        action: 'escalate',
        escalationId: data.id,
        priority: ruleResult.priority,
        reason: ruleResult.description
      };

    } catch (error) {
      console.error('Failed to create escalation record:', error);
      throw error;
    }
  }

  async notifyManager(ruleResult, emailData, userId) {
    try {
      // Get manager notification settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', userId)
        .single();

      const managers = profile?.client_config?.managers || [];
      
      if (managers.length === 0) {
        return {
          success: false,
          action: 'notify_manager',
          error: 'No managers configured'
        };
      }

      // In a real implementation, this would send actual notifications
      const notifications = managers.map(manager => ({
        type: 'email',
        recipient: manager.email,
        subject: `Escalation Alert: ${emailData.subject}`,
        message: `Email from ${emailData.from} has been escalated due to: ${ruleResult.description}`,
        status: 'simulated' // In real implementation, would be 'sent'
      }));

      return {
        success: true,
        action: 'notify_manager',
        notifications,
        managersNotified: managers.length
      };

    } catch (error) {
      console.error('Failed to notify manager:', error);
      throw error;
    }
  }

  async setHighPriority(ruleResult, emailData, userId) {
    try {
      // Update email queue priority if it exists
      const { data: queueItems } = await supabase
        .from('email_queue')
        .select('id')
        .eq('user_id', userId)
        .eq('from_email', emailData.from)
        .eq('subject', emailData.subject)
        .eq('status', 'pending');

      if (queueItems && queueItems.length > 0) {
        await supabase
          .from('email_queue')
          .update({ priority: Math.max(90, ruleResult.priority * 10) })
          .in('id', queueItems.map(item => item.id));
      }

      return {
        success: true,
        action: 'high_priority',
        priority: Math.max(90, ruleResult.priority * 10),
        queueItemsUpdated: queueItems?.length || 0
      };

    } catch (error) {
      console.error('Failed to set high priority:', error);
      throw error;
    }
  }

  async triggerImmediateResponse(ruleResult, emailData, userId) {
    try {
      // Mark for immediate processing
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          user_id: userId,
          email_id: emailData.id || 'escalation_' + Date.now(),
          provider: emailData.provider || 'escalation',
          from_email: emailData.from,
          subject: emailData.subject,
          body: emailData.body,
          status: 'pending',
          priority: 95,
          scheduled_for: new Date().toISOString(), // Process immediately
          metadata: {
            escalation: true,
            escalation_rule: ruleResult.ruleId,
            escalation_reason: ruleResult.description
          }
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        action: 'immediate_response',
        queueId: data.id,
        priority: 95,
        scheduledFor: 'immediate'
      };

    } catch (error) {
      console.error('Failed to trigger immediate response:', error);
      throw error;
    }
  }

  async createSupportTicket(ruleResult, emailData, userId) {
    try {
      // Create a support ticket record
      // In a real implementation, this might integrate with a ticketing system
      const ticketData = {
        user_id: userId,
        customer_email: emailData.from,
        subject: emailData.subject,
        description: emailData.body,
        priority: ruleResult.priority >= 7 ? 'high' : ruleResult.priority >= 4 ? 'medium' : 'low',
        status: 'open',
        escalation_rule_id: ruleResult.ruleId,
        created_from: 'email_escalation'
      };

      // For now, we'll log it as an escalation record
      const { data, error } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from,
          email_subject: emailData.subject,
          category: 'support_ticket',
          urgency: ticketData.priority,
          escalated: true,
          escalation_reason: `Support ticket created: ${ruleResult.description}`,
          escalation_rule_id: ruleResult.ruleId
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        action: 'create_ticket',
        ticketId: data.id,
        priority: ticketData.priority,
        status: 'open'
      };

    } catch (error) {
      console.error('Failed to create support ticket:', error);
      throw error;
    }
  }

  async sendSMSNotification(ruleResult, emailData, userId) {
    try {
      // Get SMS notification settings
      const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!notificationSettings?.sms_notifications || !notificationSettings?.phone_number) {
        return {
          success: false,
          action: 'send_sms',
          error: 'SMS notifications not configured'
        };
      }

      // In a real implementation, this would send actual SMS
      const smsMessage = `Escalation Alert: Email from ${emailData.from} - ${ruleResult.description}`;

      return {
        success: true,
        action: 'send_sms',
        recipient: notificationSettings.phone_number,
        message: smsMessage,
        status: 'simulated' // In real implementation, would be 'sent'
      };

    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      throw error;
    }
  }

  async scheduleCustomerCall(ruleResult, emailData, userId) {
    try {
      // Schedule a customer callback
      const callbackTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

      const { data, error } = await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: emailData.from,
          email_subject: `Callback scheduled: ${emailData.subject}`,
          category: 'callback',
          urgency: 'high',
          escalated: true,
          escalation_reason: `Customer callback scheduled: ${ruleResult.description}`,
          escalation_rule_id: ruleResult.ruleId,
          metadata: {
            callback_scheduled: callbackTime.toISOString(),
            callback_reason: ruleResult.description
          }
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        action: 'call_customer',
        callbackId: data.id,
        scheduledFor: callbackTime.toISOString(),
        customerEmail: emailData.from
      };

    } catch (error) {
      console.error('Failed to schedule customer call:', error);
      throw error;
    }
  }

  async triggerAutoReply(ruleResult, emailData, userId) {
    try {
      // Mark for auto-reply processing
      const { data, error } = await supabase
        .from('ai_responses')
        .insert({
          user_id: userId,
          email_id: emailData.id || 'escalation_' + Date.now(),
          category: 'escalation_auto_reply',
          urgency: 'high',
          response_type: 'escalation_triggered',
          status: 'pending',
          metadata: {
            escalation_rule: ruleResult.ruleId,
            escalation_reason: ruleResult.description,
            priority: ruleResult.priority
          }
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        action: 'auto_reply',
        responseId: data.id,
        status: 'pending',
        priority: ruleResult.priority
      };

    } catch (error) {
      console.error('Failed to trigger auto reply:', error);
      throw error;
    }
  }

  async logEscalation(emailData, userId, triggeredRules, escalationResults) {
    try {
      const logData = {
        user_id: userId,
        email_from: emailData.from,
        email_subject: emailData.subject,
        category: 'escalation_summary',
        urgency: 'high',
        escalated: true,
        escalation_reason: `Multiple rules triggered: ${triggeredRules.map(r => r.condition).join(', ')}`,
        metadata: {
          triggered_rules: triggeredRules,
          escalation_results: escalationResults,
          escalation_count: triggeredRules.length,
          highest_priority: Math.max(...triggeredRules.map(r => r.priority))
        }
      };

      await supabase
        .from('email_logs')
        .insert(logData);

      console.log(`Escalation logged for email from ${emailData.from}`);

    } catch (error) {
      console.error('Failed to log escalation:', error);
    }
  }

  // Batch escalation processing
  async processBatchEscalations(emails, userId) {
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await this.processEscalation(email.emailData, userId, email.classification, email.routing);
        results.push({
          emailId: email.emailData.id,
          success: true,
          escalation: result
        });
      } catch (error) {
        console.error(`Failed to process escalation for email ${email.emailData.id}:`, error);
        results.push({
          emailId: email.emailData.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Get escalation statistics
  async getEscalationStats(userId, timeframe = '24h') {
    try {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data: escalations, error } = await supabase
        .from('email_logs')
        .select('escalation_reason, escalation_rule_id, priority, created_at')
        .eq('user_id', userId)
        .eq('escalated', true)
        .gte('created_at', since);

      if (error) throw error;

      const stats = {
        total: escalations.length,
        byReason: {},
        byPriority: { high: 0, medium: 0, low: 0 },
        byHour: {},
        averagePerDay: 0
      };

      escalations.forEach(escalation => {
        // Count by reason
        const reason = escalation.escalation_reason || 'Unknown';
        stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;

        // Count by priority
        const priority = escalation.priority || 1;
        if (priority >= 7) stats.byPriority.high++;
        else if (priority >= 4) stats.byPriority.medium++;
        else stats.byPriority.low++;

        // Count by hour
        const hour = new Date(escalation.created_at).getHours();
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      });

      stats.averagePerDay = escalations.length / (hours / 24);

      return stats;

    } catch (error) {
      console.error('Failed to get escalation stats:', error);
      return null;
    }
  }

  // Manual escalation trigger
  async manualEscalation(emailData, userId, reason, priority = 5) {
    try {
      const escalationResult = {
        ruleId: 'manual',
        rule: { condition: 'manual_escalation', action: 'escalate' },
        action: 'escalate',
        priority: priority,
        condition: 'manual_escalation',
        description: reason,
        timestamp: new Date().toISOString()
      };

      const result = await this.executeEscalationAction(escalationResult, emailData, userId);
      
      await this.logEscalation(emailData, userId, [escalationResult], [result]);

      return {
        success: true,
        escalated: true,
        reason: reason,
        result: result
      };

    } catch (error) {
      console.error('Manual escalation failed:', error);
      throw error;
    }
  }

  // Clear escalation queue
  clearEscalationQueue() {
    this.escalationQueue.clear();
  }

  // Get pending escalations
  getPendingEscalations() {
    return Array.from(this.escalationQueue.values());
  }
}
