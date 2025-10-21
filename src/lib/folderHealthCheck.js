/**
 * Folder Health Check Service
 * 
 * Validates that all expected folders/labels exist in Gmail/Outlook
 * and provides health status for the dashboard
 */

import { supabase } from './customSupabaseClient.js';
import { getValidAccessToken } from './oauthTokenManager.js';

/**
 * Check health of all folders for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Folder health status
 */
export async function checkFolderHealth(userId) {
  try {
    console.log('🏥 Starting folder health check for user:', userId);
    
    // Get user's integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      return {
        success: false,
        error: 'No active email integration found',
        provider: null,
        totalExpected: 0,
        totalFound: 0,
        missingFolders: [],
        allFoldersPresent: false
      };
    }

    const provider = integration.provider;
    console.log(`📧 Provider: ${provider}`);

    // Get expected folders from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_config, email_labels')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Could not fetch user profile',
        provider,
        totalExpected: 0,
        totalFound: 0,
        missingFolders: [],
        allFoldersPresent: false
      };
    }

    // Get expected label map from either email_labels or client_config
    const expectedLabelMap = profile.email_labels || profile.client_config?.channels?.email?.label_map || {};
    const expectedFolders = Object.keys(expectedLabelMap);
    
    console.log(`📁 Expected folders: ${expectedFolders.length}`);

    if (expectedFolders.length === 0) {
      return {
        success: true,
        message: 'No folders configured yet',
        provider,
        totalExpected: 0,
        totalFound: 0,
        missingFolders: [],
        allFoldersPresent: true
      };
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(userId, provider);
    if (!accessToken) {
      return {
        success: false,
        error: 'Could not get valid access token',
        provider,
        totalExpected: expectedFolders.length,
        totalFound: 0,
        missingFolders: expectedFolders,
        allFoldersPresent: false
      };
    }

    // Fetch actual folders from provider
    let actualFolders = [];
    if (provider === 'gmail') {
      actualFolders = await fetchGmailLabels(accessToken);
    } else if (provider === 'outlook') {
      actualFolders = await fetchOutlookFolders(accessToken);
    }

    console.log(`📬 Actual folders found: ${actualFolders.length}`);

    // Compare expected vs actual folders
    const actualFolderIds = new Set(actualFolders.map(f => f.id));
    const actualFolderNames = new Set(actualFolders.map(f => f.name));
    
    const missingFolders = [];
    const foundFolders = [];

    for (const [folderName, folderData] of Object.entries(expectedLabelMap)) {
      const folderId = typeof folderData === 'string' ? folderData : folderData.id;
      
      // Check if folder exists by ID or name
      const existsById = actualFolderIds.has(folderId);
      const existsByName = actualFolderNames.has(folderName);
      
      if (existsById || existsByName) {
        foundFolders.push({
          name: folderName,
          id: folderId,
          status: 'found',
          matchedBy: existsById ? 'id' : 'name'
        });
      } else {
        missingFolders.push({
          name: folderName,
          id: folderId,
          status: 'missing'
        });
      }
    }

    const allFoldersPresent = missingFolders.length === 0;
    const healthPercentage = Math.round((foundFolders.length / expectedFolders.length) * 100);

    console.log(`📊 Folder health: ${foundFolders.length}/${expectedFolders.length} folders found (${healthPercentage}%)`);
    if (missingFolders.length > 0) {
      console.log(`⚠️ Missing folders:`, missingFolders.map(f => f.name));
    }

    return {
      success: true,
      provider,
      totalExpected: expectedFolders.length,
      totalFound: foundFolders.length,
      healthPercentage,
      missingFolders,
      foundFolders,
      allFoldersPresent,
      checkedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Folder health check failed:', error);
    return {
      success: false,
      error: error.message,
      provider: null,
      totalExpected: 0,
      totalFound: 0,
      missingFolders: [],
      allFoldersPresent: false
    };
  }
}

/**
 * Fetch Gmail labels
 * @param {string} accessToken - Gmail access token
 * @returns {Promise<Array>} Array of Gmail labels
 */
async function fetchGmailLabels(accessToken) {
  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const data = await response.json();
    return (data.labels || []).map(label => ({
      id: label.id,
      name: label.name,
      type: label.type
    }));
  } catch (error) {
    console.error('❌ Failed to fetch Gmail labels:', error);
    return [];
  }
}

/**
 * Fetch Outlook folders
 * @param {string} accessToken - Outlook access token
 * @returns {Promise<Array>} Array of Outlook folders
 */
async function fetchOutlookFolders(accessToken) {
  try {
    const folders = [];
    const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.statusText}`);
    }

    const data = await response.json();
    const rootFolders = data.value || [];
    
    // Recursively fetch all folders (including children)
    for (const folder of rootFolders) {
      folders.push({
        id: folder.id,
        name: folder.displayName,
        parentId: folder.parentFolderId
      });
      
      // Fetch child folders
      const childFolders = await fetchOutlookChildFolders(accessToken, folder.id);
      folders.push(...childFolders);
    }

    return folders;
  } catch (error) {
    console.error('❌ Failed to fetch Outlook folders:', error);
    return [];
  }
}

/**
 * Fetch Outlook child folders recursively
 * @param {string} accessToken - Outlook access token
 * @param {string} parentId - Parent folder ID
 * @returns {Promise<Array>} Array of child folders
 */
async function fetchOutlookChildFolders(accessToken, parentId) {
  try {
    const folders = [];
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Child folders endpoint might not be accessible - that's okay
      return folders;
    }

    const data = await response.json();
    const childFolders = data.value || [];
    
    for (const folder of childFolders) {
      folders.push({
        id: folder.id,
        name: folder.displayName,
        parentId: folder.parentFolderId
      });
      
      // Recursively fetch deeper child folders
      const deeperChildren = await fetchOutlookChildFolders(accessToken, folder.id);
      folders.push(...deeperChildren);
    }

    return folders;
  } catch (error) {
    console.error('❌ Failed to fetch Outlook child folders:', error);
    return [];
  }
}

/**
 * Get folder health summary for dashboard display
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Simplified health summary
 */
export async function getFolderHealthSummary(userId) {
  const health = await checkFolderHealth(userId);
  
  return {
    healthy: health.allFoldersPresent,
    healthPercentage: health.healthPercentage || 0,
    totalFolders: health.totalExpected,
    missingCount: health.missingFolders?.length || 0,
    missingFolders: health.missingFolders?.slice(0, 5).map(f => f.name) || [], // First 5 only
    provider: health.provider,
    lastChecked: health.checkedAt,
    error: health.error
  };
}

