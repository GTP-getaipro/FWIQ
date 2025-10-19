/**
 * Push Notification Templates for FloWorx
 * Templates for browser push notifications
 */

export const pushTemplates = {
  DEFAULT: {
    title: 'FloWorx Notification',
    body: 'You have a new notification from FloWorx.',
    icon: '/icons/floworx-192.png',
    badge: '/icons/floworx-badge.png',
    url: '{{appUrl}}/notifications',
    tag: 'default',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: []
  },

  EMAIL_RECEIVED: {
    title: '📧 New Email',
    body: '{{emailCount}} new email(s) in {{user.companyName}} inbox',
    icon: '/icons/email-192.png',
    badge: '/icons/email-badge.png',
    url: '{{appUrl}}/dashboard/emails',
    tag: 'email_received',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Emails', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]
  },

  EMAIL_PROCESSED: {
    title: '✅ Email Processed',
    body: 'Your email has been {{action}} successfully',
    icon: '/icons/check-192.png',
    badge: '/icons/check-badge.png',
    url: '{{appUrl}}/dashboard/emails/{{emailId}}',
    tag: 'email_processed',
    requireInteraction: false,
    silent: true,
    vibrate: [100],
    actions: [
      { action: 'view', title: 'View Email', icon: '/icons/view.png' }
    ]
  },

  WORKFLOW_DEPLOYED: {
    title: '🚀 Workflow Deployed',
    body: '{{workflowName}} is now active and running',
    icon: '/icons/workflow-192.png',
    badge: '/icons/workflow-badge.png',
    url: '{{appUrl}}/dashboard/workflows/{{workflowId}}',
    tag: 'workflow_deployed',
    requireInteraction: false,
    silent: false,
    vibrate: [300, 100, 300],
    actions: [
      { action: 'view', title: 'View Workflow', icon: '/icons/view.png' },
      { action: 'monitor', title: 'Monitor', icon: '/icons/monitor.png' }
    ]
  },

  WORKFLOW_FAILED: {
    title: '⚠️ Workflow Failed',
    body: '{{workflowName}} needs attention - {{errorMessage}}',
    icon: '/icons/warning-192.png',
    badge: '/icons/warning-badge.png',
    url: '{{appUrl}}/dashboard/workflows/{{workflowId}}',
    tag: 'workflow_failed',
    requireInteraction: true,
    silent: false,
    vibrate: [500, 200, 500, 200, 500],
    actions: [
      { action: 'fix', title: 'Fix Now', icon: '/icons/fix.png' },
      { action: 'view', title: 'View Details', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]
  },

  INTEGRATION_CONNECTED: {
    title: '🔗 Integration Connected',
    body: '{{integrationType}} is now connected and ready',
    icon: '/icons/integration-192.png',
    badge: '/icons/integration-badge.png',
    url: '{{appUrl}}/dashboard/integrations',
    tag: 'integration_connected',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Integration', icon: '/icons/view.png' },
      { action: 'test', title: 'Test Connection', icon: '/icons/test.png' }
    ]
  },

  INTEGRATION_DISCONNECTED: {
    title: '⚠️ Integration Disconnected',
    body: '{{integrationType}} connection lost - reconnect needed',
    icon: '/icons/warning-192.png',
    badge: '/icons/warning-badge.png',
    url: '{{appUrl}}/dashboard/integrations',
    tag: 'integration_disconnected',
    requireInteraction: true,
    silent: false,
    vibrate: [400, 200, 400],
    actions: [
      { action: 'reconnect', title: 'Reconnect', icon: '/icons/reconnect.png' },
      { action: 'view', title: 'View Status', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]
  },

  SYSTEM_ALERT: {
    title: '🚨 System Alert',
    body: '{{alertMessage}} - immediate attention required',
    icon: '/icons/alert-192.png',
    badge: '/icons/alert-badge.png',
    url: '{{appUrl}}/dashboard/alerts',
    tag: 'system_alert',
    requireInteraction: true,
    silent: false,
    vibrate: [600, 300, 600, 300, 600],
    actions: [
      { action: 'view', title: 'View Alert', icon: '/icons/view.png' },
      { action: 'acknowledge', title: 'Acknowledge', icon: '/icons/check.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]
  },

  PERFORMANCE_WARNING: {
    title: '⚠️ Performance Warning',
    body: '{{metricName}} is {{metricValue}} - performance below optimal',
    icon: '/icons/performance-192.png',
    badge: '/icons/warning-badge.png',
    url: '{{appUrl}}/dashboard/performance',
    tag: 'performance_warning',
    requireInteraction: false,
    silent: false,
    vibrate: [300, 100, 300],
    actions: [
      { action: 'view', title: 'View Performance', icon: '/icons/view.png' },
      { action: 'optimize', title: 'Optimize', icon: '/icons/optimize.png' }
    ]
  },

  SECURITY_ALERT: {
    title: '🔒 Security Alert',
    body: 'Security event: {{securityEvent}} - review immediately',
    icon: '/icons/security-192.png',
    badge: '/icons/security-badge.png',
    url: '{{appUrl}}/dashboard/security',
    tag: 'security_alert',
    requireInteraction: true,
    silent: false,
    vibrate: [500, 200, 500, 200, 500],
    actions: [
      { action: 'review', title: 'Review Now', icon: '/icons/security.png' },
      { action: 'view', title: 'View Details', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]
  },

  BILLING_REMINDER: {
    title: '💳 Billing Reminder',
    body: 'Subscription renews {{renewalDate}} - {{amount}}',
    icon: '/icons/billing-192.png',
    badge: '/icons/billing-badge.png',
    url: '{{appUrl}}/dashboard/billing',
    tag: 'billing_reminder',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'pay', title: 'Pay Now', icon: '/icons/pay.png' },
      { action: 'view', title: 'View Billing', icon: '/icons/view.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]
  },

  ONBOARDING_REMINDER: {
    title: '🎯 Complete Setup',
    body: 'Finish your FloWorx setup to unlock all features',
    icon: '/icons/onboarding-192.png',
    badge: '/icons/onboarding-badge.png',
    url: '{{appUrl}}/onboarding/{{currentStep}}',
    tag: 'onboarding_reminder',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'continue', title: 'Continue Setup', icon: '/icons/continue.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss.png' }
    ]
  },

  DAILY_SUMMARY: {
    title: '📊 Daily Summary',
    body: '{{emailsProcessed}} emails processed, {{workflowsExecuted}} workflows executed',
    icon: '/icons/summary-192.png',
    badge: '/icons/summary-badge.png',
    url: '{{appUrl}}/dashboard/summary',
    tag: 'daily_summary',
    requireInteraction: false,
    silent: true,
    vibrate: [100],
    actions: [
      { action: 'view', title: 'View Summary', icon: '/icons/view.png' }
    ]
  },

  WEEKLY_REPORT: {
    title: '📈 Weekly Report',
    body: 'Your weekly FloWorx performance report is ready',
    icon: '/icons/report-192.png',
    badge: '/icons/report-badge.png',
    url: '{{appUrl}}/dashboard/reports/weekly',
    tag: 'weekly_report',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'view', title: 'View Report', icon: '/icons/view.png' },
      { action: 'download', title: 'Download', icon: '/icons/download.png' }
    ]
  }
};

// Push notification configuration
export const pushConfig = {
  // Maximum body length for different platforms
  maxBodyLength: {
    chrome: 200,
    firefox: 200,
    safari: 100,
    edge: 200
  },
  
  // Icon sizes
  iconSizes: {
    small: 72,
    medium: 192,
    large: 512
  },
  
  // Badge sizes
  badgeSizes: {
    small: 24,
    medium: 48,
    large: 96
  },
  
  // Vibration patterns
  vibrationPatterns: {
    subtle: [100],
    normal: [200, 100, 200],
    strong: [300, 100, 300],
    urgent: [500, 200, 500, 200, 500],
    critical: [600, 300, 600, 300, 600]
  }
};

// Helper function to get push template by type
export function getPushTemplate(type) {
  return pushTemplates[type] || pushTemplates.DEFAULT;
}

// Helper function to validate push template
export function validatePushTemplate(template) {
  const errors = [];
  
  if (!template.title || template.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!template.body || template.body.trim() === '') {
    errors.push('Body is required');
  }
  
  if (!template.icon || template.icon.trim() === '') {
    errors.push('Icon is required');
  }
  
  if (template.title && template.title.length > 100) {
    errors.push('Title exceeds maximum length of 100 characters');
  }
  
  if (template.body && template.body.length > 200) {
    errors.push('Body exceeds maximum length of 200 characters');
  }
  
  if (template.actions && template.actions.length > 2) {
    errors.push('Maximum 2 actions allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to optimize template for platform
export function optimizeForPlatform(template, platform = 'chrome') {
  const optimized = { ...template };
  const maxLength = pushConfig.maxBodyLength[platform] || pushConfig.maxBodyLength.chrome;
  
  if (optimized.body && optimized.body.length > maxLength) {
    optimized.body = optimized.body.substring(0, maxLength - 3) + '...';
  }
  
  return optimized;
}

// Helper function to compile template with data
export function compilePushTemplate(template, data) {
  const compiled = { ...template };
  
  Object.keys(compiled).forEach(key => {
    if (typeof compiled[key] === 'string') {
      compiled[key] = replaceTemplateVariables(compiled[key], data);
    }
  });
  
  return compiled;
}

// Helper function to replace template variables
function replaceTemplateVariables(template, data) {
  let processed = template;
  
  // Replace user variables
  if (data.user) {
    processed = processed.replace(/\{\{user\.firstName\}\}/g, data.user.firstName || 'User');
    processed = processed.replace(/\{\{user\.lastName\}\}/g, data.user.lastName || '');
    processed = processed.replace(/\{\{user\.companyName\}\}/g, data.user.companyName || 'Your Company');
  }
  
  // Replace app variables
  processed = processed.replace(/\{\{appUrl\}\}/g, data.appUrl || 'https://app.floworx-iq.com');
  
  // Replace custom variables
  Object.keys(data).forEach(key => {
    if (key !== 'user' && key !== 'appUrl') {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, data[key] || '');
    }
  });
  
  return processed;
}

// Helper function to get template by priority
export function getTemplatesByPriority(priority) {
  const priorityMap = {
    low: ['daily_summary', 'weekly_report'],
    normal: ['email_received', 'email_processed', 'integration_connected', 'performance_warning', 'billing_reminder', 'onboarding_reminder'],
    high: ['workflow_deployed', 'workflow_failed', 'integration_disconnected', 'system_alert', 'security_alert']
  };
  
  return priorityMap[priority] || [];
}

// Helper function to get templates by category
export function getTemplatesByCategory(category) {
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

export default pushTemplates;
