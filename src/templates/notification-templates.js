/**
 * Notification Templates for FloWorx
 * Template definitions for different notification types
 */

export const notificationTemplates = {
  DEFAULT: {
    subject: 'FloWorx Notification',
    title: 'FloWorx Notification',
    body: 'You have a new notification from FloWorx.',
    icon: '/icons/floworx-192.png',
    url: '{{appUrl}}/notifications'
  },

  EMAIL_RECEIVED: {
    subject: 'New Email Received - {{user.companyName}}',
    title: '📧 New Email',
    body: '{{emailCount}} new email(s) received in {{user.companyName}} inbox.',
    icon: '/icons/email-192.png',
    url: '{{appUrl}}/dashboard/emails',
    priority: 'normal',
    category: 'email'
  },

  EMAIL_PROCESSED: {
    subject: 'Email Processed - {{user.companyName}}',
    title: '✅ Email Processed',
    body: 'Your email has been processed and {{action}} successfully.',
    icon: '/icons/check-192.png',
    url: '{{appUrl}}/dashboard/emails/{{emailId}}',
    priority: 'normal',
    category: 'email'
  },

  WORKFLOW_DEPLOYED: {
    subject: 'Workflow Deployed Successfully - {{user.companyName}}',
    title: '🚀 Workflow Deployed',
    body: 'Your automation workflow "{{workflowName}}" has been deployed successfully.',
    icon: '/icons/workflow-192.png',
    url: '{{appUrl}}/dashboard/workflows/{{workflowId}}',
    priority: 'high',
    category: 'automation'
  },

  WORKFLOW_FAILED: {
    subject: '⚠️ Workflow Failed - {{user.companyName}}',
    title: '⚠️ Workflow Failed',
    body: 'Your workflow "{{workflowName}}" has failed. Click to review and fix.',
    icon: '/icons/warning-192.png',
    url: '{{appUrl}}/dashboard/workflows/{{workflowId}}',
    priority: 'high',
    category: 'automation',
    requireInteraction: true
  },

  INTEGRATION_CONNECTED: {
    subject: 'Integration Connected - {{user.companyName}}',
    title: '🔗 Integration Connected',
    body: '{{integrationType}} integration has been successfully connected.',
    icon: '/icons/integration-192.png',
    url: '{{appUrl}}/dashboard/integrations',
    priority: 'normal',
    category: 'integration'
  },

  INTEGRATION_DISCONNECTED: {
    subject: '⚠️ Integration Disconnected - {{user.companyName}}',
    title: '⚠️ Integration Disconnected',
    body: '{{integrationType}} integration has been disconnected. Please reconnect.',
    icon: '/icons/warning-192.png',
    url: '{{appUrl}}/dashboard/integrations',
    priority: 'high',
    category: 'integration',
    requireInteraction: true
  },

  SYSTEM_ALERT: {
    subject: '🚨 System Alert - {{user.companyName}}',
    title: '🚨 System Alert',
    body: '{{alertMessage}} - Immediate attention required.',
    icon: '/icons/alert-192.png',
    url: '{{appUrl}}/dashboard/alerts',
    priority: 'high',
    category: 'system',
    requireInteraction: true
  },

  PERFORMANCE_WARNING: {
    subject: '⚠️ Performance Warning - {{user.companyName}}',
    title: '⚠️ Performance Warning',
    body: 'System performance is below optimal levels. {{metricName}}: {{metricValue}}.',
    icon: '/icons/performance-192.png',
    url: '{{appUrl}}/dashboard/performance',
    priority: 'normal',
    category: 'performance'
  },

  SECURITY_ALERT: {
    subject: '🔒 Security Alert - {{user.companyName}}',
    title: '🔒 Security Alert',
    body: 'Security event detected: {{securityEvent}}. Please review immediately.',
    icon: '/icons/security-192.png',
    url: '{{appUrl}}/dashboard/security',
    priority: 'high',
    category: 'security',
    requireInteraction: true
  },

  BILLING_REMINDER: {
    subject: '💳 Billing Reminder - {{user.companyName}}',
    title: '💳 Billing Reminder',
    body: 'Your FloWorx subscription will renew on {{renewalDate}}. Amount: {{amount}}.',
    icon: '/icons/billing-192.png',
    url: '{{appUrl}}/dashboard/billing',
    priority: 'normal',
    category: 'billing'
  },

  ONBOARDING_REMINDER: {
    subject: '🎯 Complete Your FloWorx Setup - {{user.companyName}}',
    title: '🎯 Complete Setup',
    body: 'You\'re almost done! Complete your FloWorx onboarding to unlock all features.',
    icon: '/icons/onboarding-192.png',
    url: '{{appUrl}}/onboarding/{{currentStep}}',
    priority: 'normal',
    category: 'onboarding'
  },

  DAILY_SUMMARY: {
    subject: '📊 Daily Summary - {{user.companyName}}',
    title: '📊 Daily Summary',
    body: 'Today: {{emailsProcessed}} emails processed, {{workflowsExecuted}} workflows executed.',
    icon: '/icons/summary-192.png',
    url: '{{appUrl}}/dashboard/summary',
    priority: 'low',
    category: 'summary'
  },

  WEEKLY_REPORT: {
    subject: '📈 Weekly Report - {{user.companyName}}',
    title: '📈 Weekly Report',
    body: 'Your weekly FloWorx performance report is ready. {{totalEmails}} emails processed.',
    icon: '/icons/report-192.png',
    url: '{{appUrl}}/dashboard/reports/weekly',
    priority: 'low',
    category: 'report'
  }
};

// Template validation schema
export const templateSchema = {
  subject: { type: 'string', required: true, maxLength: 200 },
  title: { type: 'string', required: true, maxLength: 100 },
  body: { type: 'string', required: true, maxLength: 500 },
  icon: { type: 'string', required: false, format: 'url' },
  url: { type: 'string', required: false, format: 'url' },
  priority: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
  category: { type: 'string', required: false },
  requireInteraction: { type: 'boolean', default: false }
};

// Helper function to validate template
export function validateTemplate(template) {
  const errors = [];
  
  Object.keys(templateSchema).forEach(key => {
    const field = templateSchema[key];
    const value = template[key];
    
    if (field.required && (!value || value === '')) {
      errors.push(`${key} is required`);
    }
    
    if (value && field.type === 'string' && field.maxLength && value.length > field.maxLength) {
      errors.push(`${key} exceeds maximum length of ${field.maxLength}`);
    }
    
    if (value && field.enum && !field.enum.includes(value)) {
      errors.push(`${key} must be one of: ${field.enum.join(', ')}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to get template by type
export function getTemplate(type) {
  return notificationTemplates[type] || notificationTemplates.DEFAULT;
}

// Helper function to list all available templates
export function getAllTemplates() {
  return Object.keys(notificationTemplates).map(key => ({
    type: key,
    ...notificationTemplates[key]
  }));
}

// Helper function to get templates by category
export function getTemplatesByCategory(category) {
  return Object.keys(notificationTemplates)
    .filter(key => notificationTemplates[key].category === category)
    .map(key => ({
      type: key,
      ...notificationTemplates[key]
    }));
}

// Helper function to get templates by priority
export function getTemplatesByPriority(priority) {
  return Object.keys(notificationTemplates)
    .filter(key => notificationTemplates[key].priority === priority)
    .map(key => ({
      type: key,
      ...notificationTemplates[key]
    }));
}

export default notificationTemplates;
