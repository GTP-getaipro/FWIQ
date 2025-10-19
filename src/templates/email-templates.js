/**
 * Email Templates for FloWorx
 * HTML and text email templates for different notification types
 */

export const emailTemplates = {
  DEFAULT: {
    subject: 'FloWorx Notification',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FloWorx Notification</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">FloWorx</div>
            </div>
            <div class="content">
              <h2>You have a new notification</h2>
              <p>Hello {{user.firstName}},</p>
              <p>You have a new notification from FloWorx.</p>
              <a href="{{appUrl}}" class="button">View Dashboard</a>
            </div>
            <div class="footer">
              <p>© 2024 FloWorx. All rights reserved.</p>
              <p>This email was sent to {{user.email}} because you have notifications enabled.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: 'Hello {{user.firstName}},\n\nYou have a new notification from FloWorx.\n\nVisit {{appUrl}} to view your dashboard.\n\nBest regards,\nThe FloWorx Team'
  },

  EMAIL_RECEIVED: {
    subject: '📧 New Email Received - {{user.companyName}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Email Received</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .stats { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📧 New Email</div>
            </div>
            <div class="content">
              <h2>New Email Received</h2>
              <p>Hello {{user.firstName}},</p>
              <p>You have received <strong>{{emailCount}}</strong> new email(s) in your {{user.companyName}} inbox.</p>
              
              {{#if latestEmails}}
              <div class="stats">
                <h3>Latest Emails:</h3>
                <ul>
                  {{#each latestEmails}}
                  <li><strong>{{sender}}</strong> - {{subject}} ({{timeAgo}})</li>
                  {{/each}}
                </ul>
              </div>
              {{/if}}
              
              <a href="{{appUrl}}/dashboard/emails" class="button">View Emails</a>
            </div>
            <div class="footer">
              <p>© 2024 FloWorx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: 'Hello {{user.firstName}},\n\nYou have received {{emailCount}} new email(s) in your {{user.companyName}} inbox.\n\n{{#if latestEmails}}Latest emails:\n{{#each latestEmails}}{{sender}} - {{subject}} ({{timeAgo}})\n{{/each}}{{/if}}\n\nVisit {{appUrl}}/dashboard/emails to view all emails.\n\nBest regards,\nThe FloWorx Team'
  },

  WORKFLOW_DEPLOYED: {
    subject: '🚀 Workflow Deployed Successfully - {{user.companyName}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Workflow Deployed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .workflow-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 Workflow Deployed</div>
            </div>
            <div class="content">
              <h2>Workflow Deployed Successfully!</h2>
              <p>Hello {{user.firstName}},</p>
              <p>Great news! Your automation workflow has been deployed successfully.</p>
              
              <div class="workflow-info">
                <h3>Workflow Details:</h3>
                <p><strong>Name:</strong> {{workflowName}}</p>
                <p><strong>Type:</strong> {{workflowType}}</p>
                <p><strong>Status:</strong> Active</p>
                <p><strong>Deployed:</strong> {{deploymentTime}}</p>
              </div>
              
              <p>Your workflow is now running and will automatically process emails according to your configuration.</p>
              
              <a href="{{appUrl}}/dashboard/workflows/{{workflowId}}" class="button">View Workflow</a>
            </div>
            <div class="footer">
              <p>© 2024 FloWorx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: 'Hello {{user.firstName}},\n\nGreat news! Your automation workflow has been deployed successfully.\n\nWorkflow Details:\nName: {{workflowName}}\nType: {{workflowType}}\nStatus: Active\nDeployed: {{deploymentTime}}\n\nYour workflow is now running and will automatically process emails.\n\nVisit {{appUrl}}/dashboard/workflows/{{workflowId}} to view your workflow.\n\nBest regards,\nThe FloWorx Team'
  },

  WORKFLOW_FAILED: {
    subject: '⚠️ Workflow Failed - {{user.companyName}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Workflow Failed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .error-info { background: #FEF2F2; border: 1px solid #FECACA; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">⚠️ Workflow Failed</div>
            </div>
            <div class="content">
              <h2>Workflow Execution Failed</h2>
              <p>Hello {{user.firstName}},</p>
              <p>We need to notify you that your workflow has encountered an error.</p>
              
              <div class="error-info">
                <h3>Error Details:</h3>
                <p><strong>Workflow:</strong> {{workflowName}}</p>
                <p><strong>Error:</strong> {{errorMessage}}</p>
                <p><strong>Failed at:</strong> {{failureTime}}</p>
                <p><strong>Node:</strong> {{failedNode}}</p>
              </div>
              
              <p>Please review and fix the issue to restore your workflow functionality.</p>
              
              <a href="{{appUrl}}/dashboard/workflows/{{workflowId}}" class="button">Fix Workflow</a>
            </div>
            <div class="footer">
              <p>© 2024 FloWorx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: 'Hello {{user.firstName}},\n\nWe need to notify you that your workflow has encountered an error.\n\nError Details:\nWorkflow: {{workflowName}}\nError: {{errorMessage}}\nFailed at: {{failureTime}}\nNode: {{failedNode}}\n\nPlease review and fix the issue to restore your workflow functionality.\n\nVisit {{appUrl}}/dashboard/workflows/{{workflowId}} to fix your workflow.\n\nBest regards,\nThe FloWorx Team'
  },

  SYSTEM_ALERT: {
    subject: '🚨 System Alert - {{user.companyName}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>System Alert</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .alert-info { background: #FEF2F2; border: 1px solid #FECACA; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚨 System Alert</div>
            </div>
            <div class="content">
              <h2>System Alert</h2>
              <p>Hello {{user.firstName}},</p>
              <p>We need to notify you of a system alert that requires your attention.</p>
              
              <div class="alert-info">
                <h3>Alert Details:</h3>
                <p><strong>Severity:</strong> {{alertSeverity}}</p>
                <p><strong>Message:</strong> {{alertMessage}}</p>
                <p><strong>Detected:</strong> {{alertTime}}</p>
                <p><strong>Component:</strong> {{alertComponent}}</p>
              </div>
              
              <p>Please review this alert and take appropriate action if necessary.</p>
              
              <a href="{{appUrl}}/dashboard/alerts" class="button">View Alerts</a>
            </div>
            <div class="footer">
              <p>© 2024 FloWorx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: 'Hello {{user.firstName}},\n\nWe need to notify you of a system alert that requires your attention.\n\nAlert Details:\nSeverity: {{alertSeverity}}\nMessage: {{alertMessage}}\nDetected: {{alertTime}}\nComponent: {{alertComponent}}\n\nPlease review this alert and take appropriate action.\n\nVisit {{appUrl}}/dashboard/alerts to view all alerts.\n\nBest regards,\nThe FloWorx Team'
  },

  BILLING_REMINDER: {
    subject: '💳 Billing Reminder - {{user.companyName}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Billing Reminder</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .billing-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">💳 Billing Reminder</div>
            </div>
            <div class="content">
              <h2>Billing Reminder</h2>
              <p>Hello {{user.firstName}},</p>
              <p>This is a friendly reminder about your upcoming FloWorx subscription renewal.</p>
              
              <div class="billing-info">
                <h3>Billing Details:</h3>
                <p><strong>Plan:</strong> {{planName}}</p>
                <p><strong>Amount:</strong> {{amount}}</p>
                <p><strong>Renewal Date:</strong> {{renewalDate}}</p>
                <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
              </div>
              
              <p>Your subscription will automatically renew on the date shown above. No action is required if you want to continue your current plan.</p>
              
              <a href="{{appUrl}}/dashboard/billing" class="button">Manage Billing</a>
            </div>
            <div class="footer">
              <p>© 2024 FloWorx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: 'Hello {{user.firstName}},\n\nThis is a friendly reminder about your upcoming FloWorx subscription renewal.\n\nBilling Details:\nPlan: {{planName}}\nAmount: {{amount}}\nRenewal Date: {{renewalDate}}\nPayment Method: {{paymentMethod}}\n\nYour subscription will automatically renew on the date shown above.\n\nVisit {{appUrl}}/dashboard/billing to manage your billing settings.\n\nBest regards,\nThe FloWorx Team'
  },

  DAILY_SUMMARY: {
    subject: '📊 Daily Summary - {{user.companyName}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Summary</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .stat-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #3B82F6; }
            .logo { font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📊 Daily Summary</div>
            </div>
            <div class="content">
              <h2>Your Daily FloWorx Summary</h2>
              <p>Hello {{user.firstName}},</p>
              <p>Here's a summary of your FloWorx activity for today.</p>
              
              <div class="stats">
                <div class="stat-card">
                  <div class="stat-number">{{emailsProcessed}}</div>
                  <div>Emails Processed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{workflowsExecuted}}</div>
                  <div>Workflows Executed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{responseRate}}%</div>
                  <div>Response Rate</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">{{avgResponseTime}}m</div>
                  <div>Avg Response Time</div>
                </div>
              </div>
              
              <a href="{{appUrl}}/dashboard/summary" class="button">View Full Summary</a>
            </div>
            <div class="footer">
              <p>© 2024 FloWorx. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: 'Hello {{user.firstName}},\n\nHere\'s your daily FloWorx summary:\n\n📧 Emails Processed: {{emailsProcessed}}\n🚀 Workflows Executed: {{workflowsExecuted}}\n📊 Response Rate: {{responseRate}}%\n⏱️ Avg Response Time: {{avgResponseTime}}m\n\nVisit {{appUrl}}/dashboard/summary for the full report.\n\nBest regards,\nThe FloWorx Team'
  }
};

// Helper function to get email template by type
export function getEmailTemplate(type) {
  return emailTemplates[type] || emailTemplates.DEFAULT;
}

// Helper function to validate email template
export function validateEmailTemplate(template) {
  const errors = [];
  
  if (!template.subject || template.subject.trim() === '') {
    errors.push('Subject is required');
  }
  
  if (!template.html || template.html.trim() === '') {
    errors.push('HTML content is required');
  }
  
  if (!template.text || template.text.trim() === '') {
    errors.push('Text content is required');
  }
  
  if (template.subject && template.subject.length > 200) {
    errors.push('Subject exceeds maximum length of 200 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to compile template with data
export function compileEmailTemplate(template, data) {
  const compiled = { ...template };
  
  Object.keys(compiled).forEach(key => {
    if (typeof compiled[key] === 'string') {
      compiled[key] = replaceTemplateVariables(compiled[key], data);
    }
  });
  
  return compiled;
}

// Helper function to replace template variables with performance optimization
function replaceTemplateVariables(template, data) {
  let processed = template;
  
  // Use a more efficient replacement strategy
  const replacements = new Map();
  
  // Replace user variables
  if (data.user) {
    replacements.set('{{user.firstName}}', data.user.firstName || 'User');
    replacements.set('{{user.lastName}}', data.user.lastName || '');
    replacements.set('{{user.email}}', data.user.email || '');
    replacements.set('{{user.companyName}}', data.user.companyName || 'Your Company');
  }
  
  // Replace app variables
  replacements.set('{{appUrl}}', data.appUrl || 'https://app.floworx-iq.com');
  
  // Replace custom variables
  Object.keys(data).forEach(key => {
    if (key !== 'user' && key !== 'appUrl') {
      replacements.set(`{{${key}}}`, data[key] || '');
    }
  });
  
  // Apply all replacements in one pass
  replacements.forEach((value, placeholder) => {
    processed = processed.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), value);
  });
  
  return processed;
}

export default emailTemplates;
