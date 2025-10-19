/**
 * SMS Templates for FloWorx
 * Short message templates for SMS notifications
 */

export const smsTemplates = {
  DEFAULT: 'FloWorx: You have a new notification. Visit {{appUrl}} for details.',

  EMAIL_RECEIVED: 'FloWorx: {{emailCount}} new email(s) in {{user.companyName}} inbox. View: {{appUrl}}/emails',

  EMAIL_PROCESSED: 'FloWorx: Email {{action}} successfully. View: {{appUrl}}/emails/{{emailId}}',

  WORKFLOW_DEPLOYED: 'FloWorx: {{workflowName}} workflow deployed successfully. Monitor: {{appUrl}}/workflows/{{workflowId}}',

  WORKFLOW_FAILED: 'FloWorx: {{workflowName}} workflow FAILED. Fix: {{appUrl}}/workflows/{{workflowId}}',

  INTEGRATION_CONNECTED: 'FloWorx: {{integrationType}} integration connected successfully.',

  INTEGRATION_DISCONNECTED: 'FloWorx: {{integrationType}} integration DISCONNECTED. Reconnect: {{appUrl}}/integrations',

  SYSTEM_ALERT: 'FloWorx ALERT: {{alertMessage}}. Immediate attention required. View: {{appUrl}}/alerts',

  PERFORMANCE_WARNING: 'FloWorx: Performance warning - {{metricName}}: {{metricValue}}. Check: {{appUrl}}/performance',

  SECURITY_ALERT: 'FloWorx SECURITY: {{securityEvent}} detected. Review immediately: {{appUrl}}/security',

  BILLING_REMINDER: 'FloWorx: Subscription renews {{renewalDate}} - {{amount}}. Manage: {{appUrl}}/billing',

  ONBOARDING_REMINDER: 'FloWorx: Complete your setup to unlock all features. Continue: {{appUrl}}/onboarding',

  DAILY_SUMMARY: 'FloWorx Daily: {{emailsProcessed}} emails processed, {{workflowsExecuted}} workflows executed. Summary: {{appUrl}}/summary',

  WEEKLY_REPORT: 'FloWorx Weekly Report ready. View: {{appUrl}}/reports/weekly'
};

// SMS configuration
export const smsConfig = {
  // Maximum message length
  maxLength: 160,
  
  // Character limits for different SMS types
  limits: {
    single: 160,
    concatenated: 153, // 153 characters per segment for concatenated SMS
    unicode: 70 // Reduced limit for Unicode characters
  },
  
  // URL shortening configuration
  urlShortening: {
    enabled: true,
    provider: 'bit.ly', // or 'tinyurl', 'is.gd', etc.
    apiKey: import.meta.env.VITE_URL_SHORTENER_API_KEY
  },
  
  // Template optimization
  optimization: {
    removeEmojis: true, // Remove emojis to save characters
    shortenUrls: true,  // Shorten URLs to save characters
    abbreviate: true    // Use abbreviations where possible
  }
};

// Abbreviation mappings for SMS optimization
export const abbreviations = {
  'successfully': 'success',
  'integration': 'int',
  'workflow': 'wf',
  'dashboard': 'dash',
  'notification': 'notif',
  'performance': 'perf',
  'immediately': 'ASAP',
  'attention': 'attn',
  'required': 'req',
  'detected': 'det',
  'automatically': 'auto',
  'subscription': 'sub',
  'received': 'rcvd',
  'processed': 'proc',
  'deployed': 'deploy',
  'disconnected': 'disconn',
  'reconnect': 'reconn'
};

// Helper function to get SMS template by type
export function getSMSTemplate(type) {
  return smsTemplates[type] || smsTemplates.DEFAULT;
}

// Helper function to optimize SMS template for length
export function optimizeSMSTemplate(template, data) {
  let optimized = template;
  
  // Replace variables first
  optimized = replaceTemplateVariables(optimized, data);
  
  // Apply optimizations if enabled
  if (smsConfig.optimization.removeEmojis) {
    optimized = removeEmojis(optimized);
  }
  
  if (smsConfig.optimization.abbreviate) {
    optimized = applyAbbreviations(optimized);
  }
  
  if (smsConfig.optimization.shortenUrls && optimized.length > smsConfig.maxLength) {
    optimized = shortenUrls(optimized);
  }
  
  // Truncate if still too long
  if (optimized.length > smsConfig.maxLength) {
    optimized = optimized.substring(0, smsConfig.maxLength - 3) + '...';
  }
  
  return optimized;
}

// Helper function to replace template variables
function replaceTemplateVariables(template, data) {
  let processed = template;
  
  // Replace user variables
  if (data.user) {
    processed = processed.replace(/\{\{user\.firstName\}\}/g, data.user.firstName || 'User');
    processed = processed.replace(/\{\{user\.lastName\}\}/g, data.user.lastName || '');
    processed = processed.replace(/\{\{user\.companyName\}\}/g, data.user.companyName || 'Company');
  }
  
  // Replace app variables
  processed = processed.replace(/\{\{appUrl\}\}/g, data.appUrl || 'app.floworx-iq.com');
  
  // Replace custom variables
  Object.keys(data).forEach(key => {
    if (key !== 'user' && key !== 'appUrl') {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, data[key] || '');
    }
  });
  
  return processed;
}

// Helper function to remove emojis
function removeEmojis(text) {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
}

// Helper function to apply abbreviations
function applyAbbreviations(text) {
  let abbreviated = text;
  
  Object.keys(abbreviations).forEach(full => {
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    abbreviated = abbreviated.replace(regex, abbreviations[full]);
  });
  
  return abbreviated;
}

// Helper function to shorten URLs
function shortenUrls(text) {
  // Simple URL shortening - in production, use a URL shortening service
  return text.replace(/https?:\/\/[^\s]+/g, (url) => {
    // For demo purposes, just truncate the URL
    // In production, you would call a URL shortening service
    return url.length > 20 ? url.substring(0, 17) + '...' : url;
  });
}

// Helper function to validate SMS template
export function validateSMSTemplate(template) {
  const errors = [];
  
  if (!template || template.trim() === '') {
    errors.push('Template is required');
  }
  
  if (template && template.length > smsConfig.maxLength) {
    errors.push(`Template exceeds maximum length of ${smsConfig.maxLength} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to get SMS character count
export function getSMSCharacterCount(template, data) {
  const processed = replaceTemplateVariables(template, data);
  return processed.length;
}

// Helper function to estimate SMS cost
export function estimateSMSCost(template, data, provider = 'twilio') {
  const processed = replaceTemplateVariables(template, data);
  const characterCount = processed.length;
  
  const costs = {
    twilio: {
      single: 0.0075,      // $0.0075 per SMS
      concatenated: 0.0075 // Same cost per segment
    },
    aws: {
      single: 0.00645,     // $0.00645 per SMS
      concatenated: 0.00645
    }
  };
  
  const providerCosts = costs[provider] || costs.twilio;
  
  // Calculate number of SMS segments needed
  const segments = Math.ceil(characterCount / smsConfig.limits.single);
  
  return {
    characterCount,
    segments,
    costPerSegment: providerCosts.single,
    totalCost: segments * providerCosts.single
  };
}

// Helper function to get templates by priority
export function getSMSTemplatesByPriority(priority) {
  const priorityMap = {
    low: ['daily_summary', 'weekly_report'],
    normal: ['email_received', 'email_processed', 'integration_connected', 'performance_warning', 'billing_reminder', 'onboarding_reminder'],
    high: ['workflow_failed', 'integration_disconnected', 'system_alert', 'security_alert']
  };
  
  return priorityMap[priority] || [];
}

// Helper function to get templates by category
export function getSMSTemplatesByCategory(category) {
  const categoryMap = {
    email: ['email_received', 'email_processed'],
    automation: ['workflow_deployed', 'workflow_failed'],
    integration: ['integration_connected', 'integration_disconnected'],
    system: ['system_alert', 'performance_warning', 'security_alert'],
    billing: ['billing_reminder'],
    onboarding: ['onboarding_reminder'],
    summary: ['daily_summary', 'weekly_report']
  };
  
  return categoryMap[category] || [];
}

// Helper function to create custom SMS template
export function createCustomSMSTemplate(type, message, category = 'custom') {
  return {
    type,
    message,
    category,
    created: new Date().toISOString(),
    validated: validateSMSTemplate(message)
  };
}

// Helper function to compile SMS template with data
export function compileSMSTemplate(type, data) {
  const template = getSMSTemplate(type);
  return optimizeSMSTemplate(template, data);
}

export default smsTemplates;
