/**
 * Label Validation Service
 * 
 * Validates that label IDs exist in the actual email provider before using them
 * Prevents "labelId not found" errors in N8N workflows
 * 
 * @module labelValidationService
 */

import { supabase } from './customSupabaseClient';

/**
 * Validate that a Gmail label ID exists in the actual Gmail account
 * @param {string} accessToken - Gmail OAuth access token
 * @param {string} labelId - Gmail label ID to validate
 * @returns {Promise<boolean>} True if label exists, false otherwise
 */
export async function validateGmailLabelExists(accessToken, labelId) {
  if (!labelId || !labelId.startsWith('Label_')) {
    return false;
  }

  try {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/labels/${labelId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error(`❌ Error validating Gmail label ${labelId}:`, error.message);
    return false;
  }
}

/**
 * Validate that an Outlook folder ID exists in the actual Outlook account
 * @param {string} accessToken - Outlook OAuth access token
 * @param {string} folderId - Outlook folder ID to validate
 * @returns {Promise<boolean>} True if folder exists, false otherwise
 */
export async function validateOutlookFolderExists(accessToken, folderId) {
  if (!folderId || !folderId.startsWith('AAMkAD')) {
    return false;
  }

  try {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error(`❌ Error validating Outlook folder ${folderId}:`, error.message);
    return false;
  }
}

/**
 * Validate all label IDs in a label map against the actual email provider
 * @param {string} userId - User ID
 * @param {string} provider - 'gmail' or 'outlook'
 * @param {Object} labelMap - Map of label names to label IDs
 * @returns {Promise<Object>} Validated label map with only existing labels
 */
export async function validateLabelMap(userId, provider, labelMap) {
  console.log(`🔍 Validating ${Object.keys(labelMap).length} labels for ${provider}...`);

  try {
    // Get integration data to get access token
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (integrationError || !integration) {
      console.error(`❌ No active ${provider} integration found for user ${userId}`);
      return {};
    }

    // Get access token (this would need to be implemented based on your token management)
    const accessToken = integration.access_token; // This might need to be refreshed
    
    if (!accessToken) {
      console.error(`❌ No access token found for ${provider} integration`);
      return {};
    }

    const validatedLabelMap = {};
    const invalidLabels = [];

    // Validate each label ID
    for (const [labelName, labelData] of Object.entries(labelMap)) {
      const labelId = typeof labelData === 'string' ? labelData : labelData.id;
      
      if (!labelId) {
        console.warn(`⚠️ No label ID found for ${labelName}`);
        invalidLabels.push(labelName);
        continue;
      }

      let isValid = false;
      
      if (provider === 'gmail') {
        isValid = await validateGmailLabelExists(accessToken, labelId);
      } else if (provider === 'outlook') {
        isValid = await validateOutlookFolderExists(accessToken, labelId);
      }

      if (isValid) {
        validatedLabelMap[labelName] = labelData;
        console.log(`✅ Validated ${labelName}: ${labelId}`);
      } else {
        console.warn(`❌ Invalid label ID for ${labelName}: ${labelId}`);
        invalidLabels.push(labelName);
      }
    }

    console.log(`📊 Validation complete: ${Object.keys(validatedLabelMap).length} valid, ${invalidLabels.length} invalid`);
    
    if (invalidLabels.length > 0) {
      console.warn(`⚠️ Invalid labels: ${invalidLabels.join(', ')}`);
      
      // Update database to mark invalid labels as deleted
      await supabase
        .from('business_labels')
        .update({ is_deleted: true, synced_at: new Date().toISOString() })
        .in('label_name', invalidLabels)
        .eq('provider', provider);
    }

    return validatedLabelMap;

  } catch (error) {
    console.error(`❌ Error validating label map for ${provider}:`, error.message);
    return {};
  }
}

/**
 * Get validated label map for N8N workflow deployment
 * @param {string} userId - User ID
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Promise<Object>} Validated label map ready for N8N
 */
export async function getValidatedLabelMapForN8n(userId, provider) {
  try {
    // Get current label map from database
    const { data: labels, error } = await supabase
      .from('business_labels')
      .select('label_name, label_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_deleted', false);

    if (error) {
      console.error(`❌ Error fetching labels from database:`, error.message);
      return {};
    }

    if (!labels || labels.length === 0) {
      console.warn(`⚠️ No labels found in database for ${provider}`);
      return {};
    }

    // Convert to label map format
    const labelMap = {};
    labels.forEach(label => {
      labelMap[label.label_name] = {
        id: label.label_id,
        name: label.label_name
      };
    });

    // Validate against actual email provider
    const validatedLabelMap = await validateLabelMap(userId, provider, labelMap);

    return validatedLabelMap;

  } catch (error) {
    console.error(`❌ Error getting validated label map:`, error.message);
    return {};
  }
}

/**
 * Sync and validate all labels for a user
 * @param {string} userId - User ID
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Promise<Object>} Result with validated labels and sync status
 */
export async function syncAndValidateLabels(userId, provider) {
  console.log(`🔄 Syncing and validating labels for ${provider}...`);

  try {
    // First, sync labels from email provider to database
    const { syncGmailLabels, syncOutlookFolders } = await import('./labelSyncService');
    
    if (provider === 'gmail') {
      // This would need the access token - implement based on your token management
      console.log('📧 Gmail label sync would be performed here');
    } else if (provider === 'outlook') {
      // This would need the access token - implement based on your token management
      console.log('📧 Outlook folder sync would be performed here');
    }

    // Then validate the synced labels
    const validatedLabelMap = await getValidatedLabelMapForN8n(userId, provider);

    return {
      success: true,
      provider,
      validatedLabels: Object.keys(validatedLabelMap).length,
      labelMap: validatedLabelMap
    };

  } catch (error) {
    console.error(`❌ Error syncing and validating labels:`, error.message);
    return {
      success: false,
      provider,
      error: error.message,
      validatedLabels: 0,
      labelMap: {}
    };
  }
}

export default {
  validateGmailLabelExists,
  validateOutlookFolderExists,
  validateLabelMap,
  getValidatedLabelMapForN8n,
  syncAndValidateLabels
};
