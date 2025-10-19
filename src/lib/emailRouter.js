import { supabase } from './customSupabaseClient';

export class EmailRouter {
  constructor() {
    this.routingRules = {
      // Critical urgency - immediate action required
      critical: {
        auto_reply: true,
        escalate: true,
        notify_immediately: true,
        max_response_time: 15 // minutes
      },
      
      // High urgency - same day response
      high: {
        auto_reply: true,
        escalate: false,
        notify_immediately: false,
        max_response_time: 240 // 4 hours
      },
      
      // Normal urgency - standard processing
      normal: {
        auto_reply: true,
        escalate: false,
        notify_immediately: false,
        max_response_time: 1440 // 24 hours
      },
      
      // Low urgency - can wait
      low: {
        auto_reply: false,
        escalate: false,
        notify_immediately: false,
        max_response_time: 2880 // 48 hours
      }
    };

    this.categoryActions = {
      urgent: 'auto_reply_escalate',
      complaint: 'auto_reply_escalate',
      appointment: 'auto_reply',
      inquiry: 'auto_reply',
      followup: 'auto_reply',
      general: 'queue_for_review'
    };
  }

  async route(classification, userId) {
    try {
      // Get user's business hours and escalation rules
      const businessRules = await this.getBusinessRules(userId);
      
      // Determine routing action based on classification
      const routingDecision = this.determineRouting(classification, businessRules);
      
      // Apply business hour constraints
      const finalRouting = this.applyBusinessHourConstraints(routingDecision, businessRules);
      
      // Log routing decision
      await this.logRoutingDecision(userId, classification, finalRouting);
      
      return finalRouting;

    } catch (error) {
      console.error('Email routing failed:', error);
      return this.getDefaultRouting(classification);
    }
  }

  determineRouting(classification, businessRules) {
    const { category, urgency, sentiment, requires_response } = classification;
    
    // Get base routing rules for urgency level
    const urgencyRules = this.routingRules[urgency] || this.routingRules.normal;
    
    // Get category-specific action
    const categoryAction = this.categoryActions[category] || 'queue_for_review';
    
    // Determine primary action
    let primaryAction = 'queue_for_review';
    let autoReply = false;
    let escalate = false;
    let notify = false;

    // Apply category-specific logic
    switch (categoryAction) {
      case 'auto_reply_escalate':
        primaryAction = 'auto_reply';
        autoReply = true;
        escalate = urgency === 'critical' || urgency === 'high';
        notify = escalate;
        break;
        
      case 'auto_reply':
        primaryAction = 'auto_reply';
        autoReply = true;
        escalate = urgency === 'critical';
        notify = escalate;
        break;
        
      case 'queue_for_review':
        primaryAction = 'queue_for_review';
        autoReply = urgency !== 'low' && requires_response;
        escalate = urgency === 'critical';
        notify = escalate;
        break;
    }

    // Override based on sentiment for complaints
    if (sentiment === 'negative' && category === 'complaint') {
      escalate = true;
      notify = true;
    }

    // Apply business rules overrides
    if (businessRules.auto_escalate_all) {
      escalate = true;
      notify = true;
    }

    if (businessRules.disable_auto_reply) {
      autoReply = false;
      if (primaryAction === 'auto_reply') {
        primaryAction = 'queue_for_review';
      }
    }

    return {
      action: primaryAction,
      auto_reply: autoReply,
      escalate: escalate,
      notify_immediately: notify,
      max_response_time: urgencyRules.max_response_time,
      priority: this.calculatePriority(urgency, category, sentiment),
      routing_reason: this.generateRoutingReason(category, urgency, sentiment),
      business_hours_dependent: !urgencyRules.notify_immediately,
      timestamp: new Date().toISOString()
    };
  }

  async getBusinessRules(userId) {
    try {
      // Get business hours
      const { data: businessHours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get escalation rules
      const { data: escalationRules } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: true });

      // Get notification settings
      const { data: notificationSettings } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      return {
        businessHours: businessHours || this.getDefaultBusinessHours(),
        escalationRules: escalationRules || [],
        notificationSettings: notificationSettings || this.getDefaultNotificationSettings(),
        auto_escalate_all: escalationRules?.some(rule => rule.condition === 'all_emails') || false,
        disable_auto_reply: notificationSettings?.auto_reply_enabled === false
      };

    } catch (error) {
      console.error('Failed to get business rules:', error);
      return {
        businessHours: this.getDefaultBusinessHours(),
        escalationRules: [],
        notificationSettings: this.getDefaultNotificationSettings(),
        auto_escalate_all: false,
        disable_auto_reply: false
      };
    }
  }

  applyBusinessHourConstraints(routing, businessRules) {
    const now = new Date();
    const isBusinessHours = this.isWithinBusinessHours(now, businessRules.businessHours);
    
    // If outside business hours and not critical
    if (!isBusinessHours && routing.business_hours_dependent) {
      // Modify response time expectations
      const nextBusinessDay = this.getNextBusinessDay(now, businessRules.businessHours);
      const hoursUntilBusiness = Math.ceil((nextBusinessDay - now) / (1000 * 60 * 60));
      
      routing.max_response_time = Math.max(routing.max_response_time, hoursUntilBusiness * 60);
      routing.outside_business_hours = true;
      routing.next_business_day = nextBusinessDay.toISOString();
      
      // Adjust auto-reply message to mention business hours
      if (routing.auto_reply) {
        routing.include_business_hours_message = true;
      }
    }

    return routing;
  }

  isWithinBusinessHours(dateTime, businessHours) {
    if (!businessHours || !businessHours.schedule) {
      return true; // Default to always available if no schedule defined
    }

    const dayOfWeek = dateTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const timeString = dateTime.toTimeString().slice(0, 5); // HH:MM format
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    const daySchedule = businessHours.schedule[dayName];
    
    if (!daySchedule || !daySchedule.open) {
      return false; // Closed on this day
    }

    return timeString >= daySchedule.start && timeString <= daySchedule.end;
  }

  getNextBusinessDay(currentDate, businessHours) {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(9, 0, 0, 0); // Default to 9 AM

    // If business hours are defined, use the opening time
    if (businessHours?.schedule) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      // Find next open day
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() + i + 1);
        
        const dayName = dayNames[checkDate.getDay()];
        const daySchedule = businessHours.schedule[dayName];
        
        if (daySchedule?.open) {
          const [hours, minutes] = daySchedule.start.split(':');
          checkDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return checkDate;
        }
      }
    }

    return nextDay;
  }

  calculatePriority(urgency, category, sentiment) {
    let priority = 50; // Base priority

    // Urgency modifiers
    switch (urgency) {
      case 'critical': priority += 40; break;
      case 'high': priority += 25; break;
      case 'normal': priority += 0; break;
      case 'low': priority -= 15; break;
    }

    // Category modifiers
    switch (category) {
      case 'urgent': priority += 30; break;
      case 'complaint': priority += 20; break;
      case 'appointment': priority += 10; break;
      case 'inquiry': priority += 5; break;
      case 'followup': priority += 0; break;
      default: priority -= 5; break;
    }

    // Sentiment modifiers
    switch (sentiment) {
      case 'negative': priority += 15; break;
      case 'neutral': priority += 0; break;
      case 'positive': priority -= 5; break;
    }

    return Math.max(1, Math.min(100, priority));
  }

  generateRoutingReason(category, urgency, sentiment) {
    const reasons = [];
    
    reasons.push(`Category: ${category}`);
    reasons.push(`Urgency: ${urgency}`);
    
    if (sentiment !== 'neutral') {
      reasons.push(`Sentiment: ${sentiment}`);
    }

    return reasons.join(', ');
  }

  async logRoutingDecision(userId, classification, routing) {
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userId,
          email_from: classification.from || 'unknown',
          email_subject: classification.subject || 'No subject',
          category: classification.category,
          urgency: classification.urgency,
          routing_action: routing.action,
          priority: routing.priority,
          auto_reply: routing.auto_reply,
          escalated: routing.escalate,
          routing_reason: routing.routing_reason
        });
    } catch (error) {
      console.error('Failed to log routing decision:', error);
    }
  }

  getDefaultRouting(classification) {
    return {
      action: 'queue_for_review',
      auto_reply: classification.requires_response || false,
      escalate: classification.urgency === 'critical',
      notify_immediately: classification.urgency === 'critical',
      max_response_time: 1440, // 24 hours
      priority: 50,
      routing_reason: 'Default routing due to processing error',
      business_hours_dependent: true,
      timestamp: new Date().toISOString()
    };
  }

  getDefaultBusinessHours() {
    return {
      schedule: {
        monday: { open: true, start: '09:00', end: '17:00' },
        tuesday: { open: true, start: '09:00', end: '17:00' },
        wednesday: { open: true, start: '09:00', end: '17:00' },
        thursday: { open: true, start: '09:00', end: '17:00' },
        friday: { open: true, start: '09:00', end: '17:00' },
        saturday: { open: false },
        sunday: { open: false }
      },
      timezone: 'America/New_York'
    };
  }

  getDefaultNotificationSettings() {
    return {
      auto_reply_enabled: true,
      immediate_notification: true,
      email_notifications: true,
      sms_notifications: false,
      escalation_enabled: true
    };
  }

  // Batch routing for multiple emails
  async routeBatch(classifications, userId) {
    const routings = [];
    
    for (const { emailId, classification } of classifications) {
      try {
        const routing = await this.route(classification, userId);
        routings.push({
          emailId,
          routing,
          success: true
        });
      } catch (error) {
        console.error(`Failed to route email ${emailId}:`, error);
        routings.push({
          emailId,
          routing: this.getDefaultRouting(classification),
          success: false,
          error: error.message
        });
      }
    }

    return routings;
  }

  // Get routing statistics
  getRoutingStats(routings) {
    const stats = {
      total: routings.length,
      actions: {},
      priorities: { high: 0, medium: 0, low: 0 },
      autoReplies: 0,
      escalations: 0,
      averagePriority: 0
    };

    let totalPriority = 0;

    routings.forEach(({ routing }) => {
      // Count actions
      stats.actions[routing.action] = (stats.actions[routing.action] || 0) + 1;
      
      // Count priority levels
      if (routing.priority >= 70) stats.priorities.high++;
      else if (routing.priority >= 40) stats.priorities.medium++;
      else stats.priorities.low++;
      
      // Count auto replies and escalations
      if (routing.auto_reply) stats.autoReplies++;
      if (routing.escalate) stats.escalations++;
      
      totalPriority += routing.priority;
    });

    stats.averagePriority = routings.length > 0 ? totalPriority / routings.length : 0;

    return stats;
  }
}
