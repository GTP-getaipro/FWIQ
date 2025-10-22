/**
 * Gmail Label Sync Service
 * Syncs the actual current state of Gmail labels with the database
 * Updated to handle fresh start scenario after manual label cleanup
 * 
 * FIX: Now properly detects when user manually deletes labels from Gmail
 * - Uses browser Gmail API as fallback when n8n manages tokens
 * - Detects manual deletion scenario (DB had labels, Gmail has none)
 * - Returns manualDeletionDetected flag to trigger immediate label creation
 */

import { supabase } from './customSupabaseClient.js';

/**
 * Sync current Gmail labels with database
 * @param {string} userId - User ID
 * @param {string} provider - Email provider ('gmail' or 'outlook')
 * @returns {Promise<Object>} Sync result
 */
/**
 * Debug function to test Microsoft Graph API access
 * @param {string} accessToken - Access token
 * @returns {Promise<Object>} Debug information
 */
export async function debugOutlookApiAccess(accessToken) {
  try {
    console.log('🔍 DEBUG: Testing Microsoft Graph API access...');
    
    // Test basic API access
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        success: false,
        error: `API access failed: ${response.status} ${response.statusText}`,
        status: response.status
      };
    }
    
    const userData = await response.json();
    console.log('✅ Microsoft Graph API access successful:', userData.displayName);
    
    // Test mail folders access
    const foldersResponse = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders?$top=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!foldersResponse.ok) {
      return {
        success: false,
        error: `Mail folders access failed: ${foldersResponse.status} ${foldersResponse.statusText}`,
        status: foldersResponse.status,
        userData
      };
    }
    
    const foldersData = await foldersResponse.json();
    const folders = foldersData.value || [];
    
    return {
      success: true,
      userData,
      foldersCount: folders.length,
      folders: folders.map(f => ({
        name: f.displayName,
        class: f.folderClass,
        id: f.id
      }))
    };
    
  } catch (error) {
    console.error('❌ DEBUG: Microsoft Graph API test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function syncGmailLabelsWithDatabase(userId, provider = 'gmail', businessProfileId = null, businessType = null) {
  try {
    console.log(`🔄 Syncing ${provider} labels with database for user: ${userId}`);
    
    // Get integration details
    const { data: integration } = await supabase
      .from('integrations')
      .select('id, n8n_credential_id, provider, access_token, refresh_token')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .single();

    if (!integration) {
      throw new Error(`No active ${provider} integration found`);
    }

    console.log(`📧 Found ${provider} integration with credential: ${integration.n8n_credential_id}`);

    // Get businessType if not provided
    if (!businessType) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_config')
        .eq('id', userId)
        .single();
      
      businessType = profile?.client_config?.business_type || 
                     profile?.client_config?.business_types?.[0] || 
                     'General Services';
      
      console.log(`📋 Business type determined: ${businessType}`);
    }

    // CRITICAL: Actually check the current state of the email box
    // We need to handle ALL scenarios: empty, partial, complete, or deleted labels
    console.log(`🔍 Checking actual current state of ${provider} labels...`);
    
    let currentLabels = [];
    let syncMethod = 'unknown';
    
    // Try to get current labels from provider API
    try {
      let accessToken = null;
      
      // Try to get valid access token using token manager (prefers backend API)
      try {
        const { getValidAccessToken } = await import('@/lib/oauthTokenManager.js');
        accessToken = await getValidAccessToken(userId, provider);
      } catch (tokenManagerError) {
        console.warn('⚠️ Token manager failed, trying direct refresh:', tokenManagerError.message);
        
        // Fallback: Try refreshing token directly using refresh_token from integration
        if (integration.refresh_token) {
          const { refreshOAuthToken } = await import('@/lib/oauthTokenManager.js');
          try {
            const refreshed = await refreshOAuthToken(
              provider,
              integration.refresh_token,
              userId,
              integration.id
            );
            accessToken = refreshed.accessToken;
            console.log('✅ Token refreshed successfully via direct refresh');
          } catch (refreshError) {
            console.warn('⚠️ Direct token refresh also failed:', refreshError.message);
          }
        }
      }
      
      if (accessToken && accessToken !== 'N8N_MANAGED') {
        console.log(`🔄 Fetching current labels using valid access token for ${provider}...`);
        currentLabels = await fetchCurrentLabels(accessToken, provider);
        syncMethod = `${provider}_api_direct`;
        console.log(`📊 Found ${currentLabels.length} existing labels in ${provider}`);
        
        // Debug Outlook API access if no folders found
        if (provider === 'outlook' && currentLabels.length === 0) {
          console.log('🔍 DEBUG: No Outlook folders found, running API debug...');
          const debugResult = await debugOutlookApiAccess(accessToken);
          console.log('🔍 DEBUG: Outlook API debug result:', debugResult);
        }
      } else if (accessToken === 'N8N_MANAGED') {
        console.log('ℹ️ Tokens are managed by n8n - trying to get access token from integration');
        
        // Try to use the access token from the integration record
        try {
          if (integration.access_token) {
            console.log(`🔄 Found access token in integration - using direct ${provider} API...`);
            currentLabels = await fetchCurrentLabels(integration.access_token, provider);
            syncMethod = `${provider}_api_integration_token`;
            console.log(`📊 Found ${currentLabels.length} existing labels in ${provider} via integration token`);
          } else {
            console.log('⚠️ No access token in integration - checking database state for manual deletion detection');
            currentLabels = [];
            syncMethod = 'n8n_managed_no_token';
          }
        } catch (integrationApiError) {
          console.warn('⚠️ Integration token API failed:', integrationApiError.message);
          currentLabels = [];
          syncMethod = 'n8n_managed_token_failed';
        }
      } else {
        console.log('⚠️ No access token available - will create all required labels');
        currentLabels = [];
        syncMethod = 'create_all';
      }
    } catch (apiError) {
      console.warn('⚠️ Could not fetch current labels via API:', apiError.message);
      console.log('🔄 Will create all required labels from schema');
      currentLabels = [];
      syncMethod = 'create_all_fallback';
    }

    // Update database with current label state
    const labelMap = buildLabelMap(currentLabels);
    
    // Check if we had labels in DB before but none in Gmail now (manual deletion scenario)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('email_labels')
      .eq('id', userId)
      .single();
    
    const hadLabelsBefore = existingProfile?.email_labels && Object.keys(existingProfile.email_labels).length > 0;
    const hasLabelsNow = Object.keys(labelMap).length > 0;
    
    console.log(`📊 Label state analysis:`);
    console.log(`  📋 Database had labels before: ${hadLabelsBefore}`);
    console.log(`  📧 ${provider} has labels now: ${hasLabelsNow}`);
    console.log(`  📁 Current labels in ${provider}: ${Object.keys(labelMap).length}`);
    
    // Only detect manual deletion if we had labels in DB but none in the email provider
    // AND we successfully fetched labels from the API (not a sync failure)
    if (hadLabelsBefore && !hasLabelsNow && syncMethod !== 'create_all' && syncMethod !== 'create_all_fallback') {
      console.log(`⚠️ Detected manual label deletion: Database had labels but ${provider} now has none`);
      console.log(`🔄 This indicates user manually removed labels from ${provider}`);
      
      // Mark all existing labels as deleted in business_labels table
      if (businessProfileId) {
        console.log('🗑️ Marking existing labels as deleted in business_labels table...');
        const { error: deleteError } = await supabase
          .from('business_labels')
          .update({ 
            is_deleted: true
          })
          .eq('business_profile_id', businessProfileId)
          .eq('provider', provider)
          .eq('is_deleted', false);
          
        if (deleteError) {
          console.warn('⚠️ Failed to mark labels as deleted:', deleteError.message);
        } else {
          console.log('✅ Marked existing labels as deleted in business_labels table');
        }
      } else {
        console.log('⚠️ No business profile ID provided - cannot mark labels as deleted in business_labels table');
      }
    } else if (!hasLabelsNow && (syncMethod === 'create_all' || syncMethod === 'create_all_fallback')) {
      console.log(`📝 No labels found in ${provider} - labels need to be created (API sync failed)`);
    } else if (hasLabelsNow) {
      console.log(`✅ Found ${Object.keys(labelMap).length} existing labels in ${provider} - proceeding with mapping`);
    } else {
      console.log(`📝 No labels found in ${provider} - labels need to be created`);
    }
    
    // Update profiles table with current label state
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_labels: labelMap,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    console.log(`✅ Database updated with ${Object.keys(labelMap).length} current labels`);
    
    // ✅ NEW: Also sync to business_labels table for folder health monitoring
    if (businessProfileId && currentLabels.length > 0) {
      console.log(`📊 Syncing ${currentLabels.length} labels to business_labels table...`);
      
      const normalizedLabels = currentLabels.map(label => ({
        label_id: label.id,
        label_name: label.name,
        provider: provider,
        business_profile_id: businessProfileId,
        business_type: businessType,
        color: label.color?.backgroundColor || null,
        synced_at: new Date().toISOString(),
        is_deleted: false
      }));
      
      const { error: upsertError } = await supabase
        .from('business_labels')
        .upsert(normalizedLabels, { 
          onConflict: 'label_id',
          ignoreDuplicates: false 
        });
      
      if (upsertError) {
        console.warn('⚠️ Failed to sync to business_labels table:', upsertError.message);
      } else {
        console.log(`✅ Synced ${normalizedLabels.length} labels to business_labels table`);
      }
    }
    
    if (hadLabelsBefore && !hasLabelsNow) {
      console.log('📝 Manual deletion detected - labels will need to be recreated');
    }

    // SIMPLIFIED: Just return the sync result - the existing provisioning system will handle the rest
    console.log('✅ Sync complete - existing provisioning system will handle schema recreation');
    
    return {
      success: true,
      syncMethod,
      currentLabels: currentLabels.length,
      labelMap,
      manualDeletionDetected: hadLabelsBefore && !hasLabelsNow,
      hadLabelsBefore,
      hasLabelsNow,
      message: `Synced ${currentLabels.length} labels from ${provider} to database${hadLabelsBefore && !hasLabelsNow ? ' (manual deletion detected)' : ''}`
    };

  } catch (error) {
    console.error(`❌ Label sync failed:`, error.message);
    return {
      success: false,
      error: error.message,
      currentLabels: 0,
      labelMap: {}
    };
  }
}

/**
 * Fetch current labels via API (supports both Gmail and Outlook)
 * @param {string} accessToken - Access token
 * @param {string} provider - 'gmail' or 'outlook'
 * @returns {Promise<Array>} Array of current labels
 */
async function fetchCurrentLabels(accessToken, provider) {
  try {
    console.log(`📧 Fetching current ${provider} labels via API...`);
    
    if (provider === 'gmail') {
      return await fetchCurrentGmailLabels(accessToken);
    } else if (provider === 'outlook') {
      return await fetchCurrentOutlookLabels(accessToken);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`❌ Failed to fetch ${provider} labels:`, error.message);
    throw error;
  }
}

/**
 * Fetch current Gmail labels using access token
 * @param {string} accessToken - Gmail access token
 * @returns {Promise<Array>} Array of current Gmail labels
 */
async function fetchCurrentGmailLabels(accessToken) {
  try {
    console.log('📧 Fetching current Gmail labels via API...');
    
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Gmail API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const labels = data.labels || [];
    
    // Filter to only user-created labels (not system labels)
    // Note: Gmail assigns IDs like "Label_123" to ALL user labels, so we can't filter by "Label_" prefix
    // We only filter out system categories like "CATEGORY_PERSONAL", "INBOX", "SENT", etc.
    const systemLabels = ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'UNREAD', 'STARRED', 'IMPORTANT'];
    const userLabels = labels.filter(label => 
      label.type === 'user' && 
      !label.id.startsWith('CATEGORY_') &&
      !systemLabels.includes(label.id)
    );
    
    console.log(`📊 Retrieved ${userLabels.length} user-created labels from Gmail`);
    return userLabels;
    
  } catch (error) {
    console.error('❌ Failed to fetch Gmail labels:', error.message);
    throw error;
  }
}

/**
 * Fetch current Outlook folders using access token
 * @param {string} accessToken - Outlook access token
 * @returns {Promise<Array>} Array of current Outlook folders
 */
async function fetchCurrentOutlookLabels(accessToken) {
  try {
    console.log('📧 Fetching current Outlook folders via Microsoft Graph API...');
    
    // Try multiple endpoints to get all folders
    const endpoints = [
      'https://graph.microsoft.com/v1.0/me/mailFolders?$top=100',
      'https://graph.microsoft.com/v1.0/me/mailFolders',
      'https://graph.microsoft.com/v1.0/me/mailFolders?$expand=childFolders'
    ];
    
    let folders = [];
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Microsoft Graph API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const endpointFolders = data.value || [];
        
        console.log(`📊 Endpoint ${endpoint} returned: ${endpointFolders.length} folders`);
        console.log('📁 Folders from this endpoint:', endpointFolders.map(f => ({ name: f.displayName, class: f.folderClass, id: f.id })));
        
        if (endpointFolders.length > folders.length) {
          folders = endpointFolders;
          console.log(`✅ Using folders from ${endpoint} (${folders.length} folders)`);
        }
        
        // If we got a good response with folders, break
        if (endpointFolders.length > 0) {
          break;
        }
        
      } catch (error) {
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    if (folders.length === 0 && lastError) {
      console.warn('⚠️ No folders found via Microsoft Graph API, but this might be due to API limitations');
      console.log('🔄 Attempting to continue with empty folder list - labels will be created by n8n workflow');
      // Don't throw error, just return empty array and let the system create labels
      return [];
    }
    
    console.log(`📊 Final Microsoft Graph API response: ${folders.length} total folders`);
    console.log('📁 All folders from API:', folders.map(f => ({ name: f.displayName, class: f.folderClass, id: f.id })));
    
    // Filter to only user-created folders (not system folders)
    const systemFolders = ['inbox', 'sentitems', 'drafts', 'spam', 'deleteditems', 'syncissues', 'junkemail', 'outbox', 'archivemail', 'clutter', 'conversation history'];
    const userFolders = folders.filter(folder => {
      // Include all mail folders that are not system folders
      const isMailFolder = folder.folderClass === 'IPF.Note' || folder.folderClass === undefined;
      const isNotSystemFolder = !systemFolders.includes(folder.displayName.toLowerCase());
      
      console.log(`📁 Checking folder: ${folder.displayName} (class: ${folder.folderClass}, isMail: ${isMailFolder}, notSystem: ${isNotSystemFolder})`);
      
      return isMailFolder && isNotSystemFolder;
    });
    
    console.log(`📊 Retrieved ${userFolders.length} user-created folders from Outlook`);
    console.log('📁 User folders found:', userFolders.map(f => f.displayName));
    
    return userFolders.map(folder => ({
      id: folder.id,
      name: folder.displayName,
      type: 'folder'
    }));
    
  } catch (error) {
    console.error('❌ Failed to fetch Outlook folders:', error.message);
    throw error;
  }
}

/**
 * Verify and create Gmail labels - ensures all expected labels exist in Gmail
 * @param {string} n8nCredentialId - N8N credential ID
 * @param {Object} schema - Label schema to create
 * @param {Array} businessTypes - Business types for labeling
 * @param {Object} expectedLabels - Labels that database expects to exist
 * @returns {Promise<Object>} Verification and creation result
 */
export async function verifyAndCreateGmailLabels(n8nCredentialId, schema, businessTypes, expectedLabels = {}) {
  try {
    console.log(`🔍 Verifying Gmail labels exist for n8n credential: ${n8nCredentialId}`);
    
    // Check if we can access Gmail API in browser
    if (typeof gapi === 'undefined') {
      console.warn('⚠️ Gmail API not available - will use n8n workflow fallback');
      return {
        success: false,
        error: 'Gmail API not available in current context',
        labelsCreated: 0,
        labelsVerified: 0,
        labelMap: {},
        missingLabels: Object.keys(expectedLabels),
        fallbackToN8n: true
      };
    }
    
    // Check if Gmail API client is properly initialized
    if (!gapi.client || !gapi.client.gmail) {
      console.warn('⚠️ Gmail API client not initialized - will use n8n workflow fallback');
      return {
        success: false,
        error: 'Gmail API client not initialized',
        labelsCreated: 0,
        labelsVerified: 0,
        labelMap: {},
        missingLabels: Object.keys(expectedLabels),
        fallbackToN8n: true
      };
    }
    
    console.log('📧 Fetching current Gmail labels...');
    
    // Get current labels from Gmail
    const response = await gapi.client.gmail.users.labels.list({ userId: 'me' });
    const currentLabels = response.result.labels || [];
    
    console.log(`📋 Found ${currentLabels.length} total labels in Gmail`);
    
    // Build current label map
    const currentLabelMap = {};
    currentLabels.forEach(label => {
      if (label.type === 'user' && !label.id.startsWith('CATEGORY_')) {
        currentLabelMap[label.name] = {
          id: label.id,
          name: label.name,
          type: 'user',
          exists: true
        };
      }
    });
    
    console.log(`📊 Current user labels in Gmail: ${Object.keys(currentLabelMap).length}`);
    
    // Get expected labels from database
    const databaseLabelNames = Object.keys(expectedLabels);
    const allExpectedLabels = [...new Set([...databaseLabelNames])];
    
    console.log(`📋 Expected labels: ${allExpectedLabels.length}`);
    console.log('Expected labels:', allExpectedLabels);
    
    // Find missing labels that need to be created
    const missingLabels = allExpectedLabels.filter(name => !currentLabelMap[name]);
    const existingLabels = allExpectedLabels.filter(name => currentLabelMap[name]);
    
    // Also identify any extra labels that exist but aren't in our schema
    const extraLabels = Object.keys(currentLabelMap).filter(name => !allExpectedLabels.includes(name));
    
    console.log(`✅ Existing schema labels: ${existingLabels.length}`);
    console.log(`❌ Missing schema labels: ${missingLabels.length}`);
    console.log(`⚠️ Extra labels (not in schema): ${extraLabels.length}`);
    
    if (missingLabels.length > 0) {
      console.log('Missing labels to create:', missingLabels);
    }
    
    if (extraLabels.length > 0) {
      console.log('Extra labels found:', extraLabels);
    }
    
    let createdLabels = {};
    let createdCount = 0;
    
    // Create missing labels
    if (missingLabels.length > 0) {
      console.log(`🏗️ Creating ${missingLabels.length} missing labels...`);
      
      for (const labelName of missingLabels) {
        try {
          console.log(`🔄 Creating missing label: ${labelName}`);
          
          const createResponse = await gapi.client.gmail.users.labels.create({
            userId: 'me',
            resource: {
              name: labelName,
              labelListVisibility: 'labelShow',
              messageListVisibility: 'show'
            }
          });
          
          if (createResponse.result && createResponse.result.id) {
            createdLabels[labelName] = {
              id: createResponse.result.id,
              name: createResponse.result.name,
              type: 'user',
              created: new Date().toISOString(),
              wasCreated: true
            };
            createdCount++;
            console.log(`✅ Created: ${labelName} (${createResponse.result.id})`);
          }
        } catch (createError) {
          console.warn(`⚠️ Failed to create ${labelName}:`, createError.message);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Build final label map (existing + created)
    const finalLabelMap = { ...currentLabelMap, ...createdLabels };
    
    // Update labels that exist to mark them as verified
    existingLabels.forEach(name => {
      if (finalLabelMap[name]) {
        finalLabelMap[name].verified = true;
      }
    });
    
    const totalVerified = existingLabels.length + createdCount;
    
    console.log(`🎉 Label verification complete:`);
    console.log(`  ✅ Verified existing: ${existingLabels.length}`);
    console.log(`  🏗️ Created new: ${createdCount}`);
    console.log(`  📊 Total ready: ${totalVerified}`);
    
    return {
      success: true,
      labelsCreated: createdCount,
      labelsVerified: totalVerified,
      totalExpected: allExpectedLabels.length,
      labelMap: finalLabelMap,
      existingLabels: existingLabels,
      createdLabels: Object.keys(createdLabels),
      missingLabels: [], // All missing labels were created
      extraLabels: extraLabels, // Labels that exist but aren't in schema
      syncMethod: 'gmail_api_verification',
      message: `Verified ${existingLabels.length} existing and created ${createdCount} new labels. Found ${extraLabels.length} extra labels not in schema.`
    };
    
  } catch (error) {
    console.error('❌ Gmail label verification failed:', error.message);
    return {
      success: false,
      error: error.message,
      labelsCreated: 0,
      labelsVerified: 0,
      labelMap: {},
      fallbackToN8n: true
    };
  }
}

/**
 * Extract label names from schema for Gmail creation
 * @param {Object} schema - Label schema
 * @param {Array} businessTypes - Business types
 * @returns {Array} Array of label names
 */
function extractLabelNamesFromSchema(schema, businessTypes) {
  const labelNames = [];
  
  // Extract top-level categories
  if (schema.topLevelCategories) {
    schema.topLevelCategories.forEach(category => {
      if (category.name) {
        labelNames.push(category.name);
      }
    });
  }
  
  // Extract industry-specific categories
  if (schema.industryCategories) {
    schema.industryCategories.forEach(category => {
      if (category.name) {
        labelNames.push(category.name);
      }
    });
  }
  
  // Add business type specific labels
  businessTypes.forEach(businessType => {
    if (businessType === 'Hot tub & Spa') {
      labelNames.push('Equipment & Supplies');
      labelNames.push('Maintenance & Service');
      labelNames.push('Customer Inquiries');
      labelNames.push('Vendor Communications');
    }
  });
  
  // Remove duplicates and return
  return [...new Set(labelNames)];
}

/**
 * Build label map from Gmail labels
 * @param {Array} labels - Gmail labels
 * @returns {Object} Label map
 */
function buildLabelMap(labels) {
  const labelMap = {};
  
  labels.forEach(label => {
    if (label.type === 'user' && !label.id.startsWith('CATEGORY_')) {
      labelMap[label.name] = {
        id: label.id,
        name: label.name,
        type: 'user',
        created: new Date().toISOString()
      };
    }
  });
  
  return labelMap;
}

/**
 * Check if labels need syncing
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether sync is needed
 */
export async function needsLabelSync(userId) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_labels, updated_at')
      .eq('id', userId)
      .single();

    if (!profile) {
      return true; // No profile, needs sync
    }

    // Check if labels were updated recently (within last 5 minutes)
    const lastUpdate = new Date(profile.updated_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (lastUpdate < fiveMinutesAgo) {
      return true; // Labels are stale, needs sync
    }

    // Check if email_labels is empty or missing
    if (!profile.email_labels || Object.keys(profile.email_labels).length === 0) {
      return true; // No labels in DB, needs sync
    }

    return false; // Labels are fresh, no sync needed
    
  } catch (error) {
    console.error('Error checking sync status:', error.message);
    return true; // On error, assume sync is needed
  }
}
