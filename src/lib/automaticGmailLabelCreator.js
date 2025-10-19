/**
 * Email Label Creator - Moved to N8N Deployment
 * 
 * This functionality has been moved to the n8n deployment process
 * in supabase/functions/deploy-n8n/index.ts
 * 
 * Labels are now automatically provisioned during workflow deployment.
 */

// Stub functions to prevent import errors
export async function createGmailLabelsAutomatically(userId, businessTypes) {
  console.log('ℹ️ Email label creation has been moved to n8n deployment process');
  return {
    success: true,
    skipped: true,
    reason: 'moved_to_n8n_deployment',
    message: 'Labels will be created automatically during n8n workflow deployment',
    labelsCreated: 0,
    totalLabels: 0,
    labelMap: {}
  };
}

export async function createEmailLabelsAutomatically(userId, businessTypes, provider = 'gmail') {
  console.log('ℹ️ Email label creation has been moved to n8n deployment process');
  return {
    success: true,
    skipped: true,
    reason: 'moved_to_n8n_deployment',
    message: 'Labels will be created automatically during n8n workflow deployment',
    labelsCreated: 0,
    totalLabels: 0,
    labelMap: {}
  };
}

export async function createOutlookFoldersAutomatically(userId, businessTypes) {
  console.log('ℹ️ Email folder creation has been moved to n8n deployment process');
  return {
    success: true,
    skipped: true,
    reason: 'moved_to_n8n_deployment',
    message: 'Folders will be created automatically during n8n workflow deployment',
    labelsCreated: 0,
    totalLabels: 0,
    labelMap: {}
  };
}








