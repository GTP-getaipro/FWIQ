import { supabase } from './customSupabaseClient';

export class ConfigManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.defaultConfigs = this.getDefaultConfigurations();
  }

  async getConfig(userId, configType) {
    const cacheKey = `${userId}_${configType}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.config;
      }
    }

    try {
      let config = null;

      switch (configType) {
        case 'business_hours':
          config = await this.getBusinessHours(userId);
          break;
        case 'escalation_rules':
          config = await this.getEscalationRules(userId);
          break;
        case 'notification_settings':
          config = await this.getNotificationSettings(userId);
          break;
        case 'response_templates':
          config = await this.getResponseTemplates(userId);
          break;
        case 'approval_workflows':
          config = await this.getApprovalWorkflows(userId);
          break;
        case 'business_profile':
          config = await this.getBusinessProfile(userId);
          break;
        default:
          throw new Error(`Unknown config type: ${configType}`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        config,
        timestamp: Date.now()
      });

      return config;

    } catch (error) {
      console.error(`Failed to get config ${configType} for user ${userId}:`, error);
      
      // Return default config on error
      return this.getDefaultConfig(configType);
    }
  }

  async setConfig(userId, configType, configData) {
    try {
      let result = null;

      switch (configType) {
        case 'business_hours':
          result = await this.setBusinessHours(userId, configData);
          break;
        case 'escalation_rules':
          result = await this.setEscalationRules(userId, configData);
          break;
        case 'notification_settings':
          result = await this.setNotificationSettings(userId, configData);
          break;
        case 'response_templates':
          result = await this.setResponseTemplates(userId, configData);
          break;
        case 'approval_workflows':
          result = await this.setApprovalWorkflows(userId, configData);
          break;
        case 'business_profile':
          result = await this.setBusinessProfile(userId, configData);
          break;
        default:
          throw new Error(`Unknown config type: ${configType}`);
      }

      // Clear cache for this config
      const cacheKey = `${userId}_${configType}`;
      this.cache.delete(cacheKey);

      return result;

    } catch (error) {
      console.error(`Failed to set config ${configType} for user ${userId}:`, error);
      throw error;
    }
  }

  async getBusinessHours(userId) {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || this.getDefaultConfig('business_hours');

    } catch (error) {
      console.error('Failed to get business hours:', error);
      return this.getDefaultConfig('business_hours');
    }
  }

  async setBusinessHours(userId, hoursData) {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .upsert({
          user_id: userId,
          schedule: hoursData.schedule,
          timezone: hoursData.timezone || 'America/New_York',
          holiday_schedule: hoursData.holidaySchedule || {},
          emergency_hours: hoursData.emergencyHours || false
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Failed to set business hours:', error);
      throw error;
    }
  }

  async getEscalationRules(userId) {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get escalation rules:', error);
      return [];
    }
  }

  async setEscalationRules(userId, rulesData) {
    try {
      // Delete existing rules
      await supabase
        .from('escalation_rules')
        .delete()
        .eq('user_id', userId);

      // Insert new rules
      if (rulesData.length > 0) {
        const rules = rulesData.map(rule => ({
          user_id: userId,
          condition: rule.condition,
          value: rule.value,
          escalation_action: rule.action,
          priority: rule.priority,
          description: rule.description,
          enabled: rule.enabled !== false
        }));

        const { data, error } = await supabase
          .from('escalation_rules')
          .insert(rules)
          .select();

        if (error) throw error;
        return data;
      }

      return [];

    } catch (error) {
      console.error('Failed to set escalation rules:', error);
      throw error;
    }
  }

  async getNotificationSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || this.getDefaultConfig('notification_settings');

    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return this.getDefaultConfig('notification_settings');
    }
  }

  async setNotificationSettings(userId, settingsData) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          email_notifications: settingsData.emailNotifications !== false,
          sms_notifications: settingsData.smsNotifications || false,
          push_notifications: settingsData.pushNotifications !== false,
          phone_number: settingsData.phoneNumber,
          email_address: settingsData.emailAddress,
          notification_hours: settingsData.notificationHours || {},
          escalation_enabled: settingsData.escalationEnabled !== false,
          auto_reply_enabled: settingsData.autoReplyEnabled !== false
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Failed to set notification settings:', error);
      throw error;
    }
  }

  async getResponseTemplates(userId) {
    try {
      const { data, error } = await supabase
        .from('response_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || this.getDefaultConfig('response_templates');

    } catch (error) {
      console.error('Failed to get response templates:', error);
      return this.getDefaultConfig('response_templates');
    }
  }

  async setResponseTemplates(userId, templatesData) {
    try {
      // Delete existing templates
      await supabase
        .from('response_templates')
        .delete()
        .eq('user_id', userId);

      // Insert new templates
      if (templatesData.length > 0) {
        const templates = templatesData.map(template => ({
          user_id: userId,
          name: template.name,
          category: template.category,
          subject_template: template.subjectTemplate,
          body_template: template.bodyTemplate,
          variables: template.variables || [],
          enabled: template.enabled !== false
        }));

        const { data, error } = await supabase
          .from('response_templates')
          .insert(templates)
          .select();

        if (error) throw error;
        return data;
      }

      return [];

    } catch (error) {
      console.error('Failed to set response templates:', error);
      throw error;
    }
  }

  async getApprovalWorkflows(userId) {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('condition', 'approval_workflow')
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get approval workflows:', error);
      return [];
    }
  }

  async setApprovalWorkflows(userId, workflowsData) {
    try {
      // Delete existing workflows
      await supabase
        .from('escalation_rules')
        .delete()
        .eq('user_id', userId)
        .eq('condition', 'approval_workflow');

      // Insert new workflows
      if (workflowsData.length > 0) {
        const workflows = workflowsData.map(workflow => ({
          user_id: userId,
          condition: 'approval_workflow',
          value: workflow.name,
          escalation_action: 'approval_required',
          priority: workflow.priority || 5,
          description: workflow.description,
          enabled: workflow.enabled !== false,
          metadata: workflow
        }));

        const { data, error } = await supabase
          .from('escalation_rules')
          .insert(workflows)
          .select();

        if (error) throw error;
        return data;
      }

      return [];

    } catch (error) {
      console.error('Failed to set approval workflows:', error);
      throw error;
    }
  }

  async getBusinessProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.client_config || this.getDefaultConfig('business_profile');

    } catch (error) {
      console.error('Failed to get business profile:', error);
      return this.getDefaultConfig('business_profile');
    }
  }

  async setBusinessProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          client_config: profileData
        })
        .eq('id', userId)
        .select('client_config')
        .single();

      if (error) throw error;
      return data.client_config;

    } catch (error) {
      console.error('Failed to set business profile:', error);
      throw error;
    }
  }

  // Bulk configuration operations
  async getAllConfigs(userId) {
    try {
      const configTypes = [
        'business_hours', 'escalation_rules', 'notification_settings',
        'response_templates', 'approval_workflows', 'business_profile'
      ];

      const configs = {};
      
      for (const configType of configTypes) {
        configs[configType] = await this.getConfig(userId, configType);
      }

      return configs;

    } catch (error) {
      console.error('Failed to get all configs:', error);
      throw error;
    }
  }

  async setAllConfigs(userId, allConfigs) {
    try {
      const results = {};
      
      for (const [configType, configData] of Object.entries(allConfigs)) {
        try {
          results[configType] = await this.setConfig(userId, configType, configData);
        } catch (error) {
          console.error(`Failed to set config ${configType}:`, error);
          results[configType] = { error: error.message };
        }
      }

      return results;

    } catch (error) {
      console.error('Failed to set all configs:', error);
      throw error;
    }
  }

  // Configuration validation
  validateConfig(configType, configData) {
    const validators = {
      business_hours: this.validateBusinessHours,
      escalation_rules: this.validateEscalationRules,
      notification_settings: this.validateNotificationSettings,
      response_templates: this.validateResponseTemplates,
      approval_workflows: this.validateApprovalWorkflows,
      business_profile: this.validateBusinessProfile
    };

    const validator = validators[configType];
    if (!validator) {
      return { valid: false, errors: [`Unknown config type: ${configType}`] };
    }

    return validator(configData);
  }

  validateBusinessHours(hoursData) {
    const errors = [];
    
    if (!hoursData.schedule) {
      errors.push('Schedule is required');
    } else {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day of days) {
        const daySchedule = hoursData.schedule[day];
        if (daySchedule && daySchedule.open) {
          if (!daySchedule.start || !daySchedule.end) {
            errors.push(`${day} schedule missing start or end time`);
          }
          
          if (daySchedule.start >= daySchedule.end) {
            errors.push(`${day} start time must be before end time`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateEscalationRules(rulesData) {
    const errors = [];
    
    if (!Array.isArray(rulesData)) {
      errors.push('Escalation rules must be an array');
    } else {
      rulesData.forEach((rule, index) => {
        if (!rule.condition) {
          errors.push(`Rule ${index + 1}: condition is required`);
        }
        
        if (!rule.action) {
          errors.push(`Rule ${index + 1}: action is required`);
        }
        
        if (rule.priority && (rule.priority < 1 || rule.priority > 10)) {
          errors.push(`Rule ${index + 1}: priority must be between 1 and 10`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  validateNotificationSettings(settingsData) {
    const errors = [];
    
    if (settingsData.smsNotifications && !settingsData.phoneNumber) {
      errors.push('Phone number is required for SMS notifications');
    }
    
    if (settingsData.emailNotifications && !settingsData.emailAddress) {
      errors.push('Email address is required for email notifications');
    }

    return { valid: errors.length === 0, errors };
  }

  validateResponseTemplates(templatesData) {
    const errors = [];
    
    if (!Array.isArray(templatesData)) {
      errors.push('Response templates must be an array');
    } else {
      templatesData.forEach((template, index) => {
        if (!template.name) {
          errors.push(`Template ${index + 1}: name is required`);
        }
        
        if (!template.bodyTemplate) {
          errors.push(`Template ${index + 1}: body template is required`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  validateApprovalWorkflows(workflowsData) {
    const errors = [];
    
    if (!Array.isArray(workflowsData)) {
      errors.push('Approval workflows must be an array');
    } else {
      workflowsData.forEach((workflow, index) => {
        if (!workflow.name) {
          errors.push(`Workflow ${index + 1}: name is required`);
        }
        
        if (!workflow.description) {
          errors.push(`Workflow ${index + 1}: description is required`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  }

  validateBusinessProfile(profileData) {
    const errors = [];
    
    if (!profileData.business) {
      errors.push('Business information is required');
    } else {
      if (!profileData.business.name) {
        errors.push('Business name is required');
      }
      
      if (!profileData.business.type) {
        errors.push('Business type is required');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Default configurations
  getDefaultConfigurations() {
    return {
      business_hours: {
        schedule: {
          monday: { open: true, start: '09:00', end: '17:00' },
          tuesday: { open: true, start: '09:00', end: '17:00' },
          wednesday: { open: true, start: '09:00', end: '17:00' },
          thursday: { open: true, start: '09:00', end: '17:00' },
          friday: { open: true, start: '09:00', end: '17:00' },
          saturday: { open: false },
          sunday: { open: false }
        },
        timezone: 'America/New_York',
        holiday_schedule: {},
        emergency_hours: false
      },

      notification_settings: {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        escalation_enabled: true,
        auto_reply_enabled: true,
        notification_hours: {
          start: '08:00',
          end: '20:00'
        }
      },

      response_templates: [
        {
          name: 'General Inquiry',
          category: 'inquiry',
          subject_template: 'Re: {{subject}}',
          body_template: 'Thank you for your inquiry. We will get back to you within 24 hours.',
          variables: ['subject'],
          enabled: true
        },
        {
          name: 'Urgent Response',
          category: 'urgent',
          subject_template: 'URGENT: Re: {{subject}}',
          body_template: 'We have received your urgent message and will respond immediately.',
          variables: ['subject'],
          enabled: true
        }
      ],

      business_profile: {
        business: {
          name: 'My Business',
          type: 'Service Business',
          industry: 'General',
          phone: '',
          email: '',
          address: ''
        },
        managers: [],
        suppliers: []
      }
    };
  }

  getDefaultConfig(configType) {
    return this.defaultConfigs[configType] || {};
  }

  // Cache management
  clearCache(userId = null, configType = null) {
    if (userId && configType) {
      const cacheKey = `${userId}_${configType}`;
      this.cache.delete(cacheKey);
    } else if (userId) {
      // Clear all configs for a user
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${userId}_`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }
}
