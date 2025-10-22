/**
 * Folder Health Check Service
 * 
 * Validates that all expected folders/labels exist in Gmail/Outlook
 * and provides health status for the dashboard
 * 
 * INTEGRATED with existing provisioning system
 */

import { supabase } from './customSupabaseClient.js';
import { getValidAccessToken } from './oauthTokenManager.js';
import { fetchGmailLabels, fetchOutlookFoldersRecursive } from './gmailLabelSync.js';
import { getFolderIdsForN8n } from './labelSyncValidator.js';

/**
 * Check health of all folders for a user
 * @param {string} userId - User ID
 * @param {string} provider - Email provider (gmail/outlook) - optional, will detect if not provided
 * @returns {Promise<Object>} Folder health status
 */
export async function checkFolderHealth(userId, provider = null) {
  try {
    console.log('🏥 Starting folder health check for user:', userId);
    
    // Get user's integration if provider not provided
    if (!provider) {
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('provider')
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
      provider = integration.provider;
    }

    console.log(`📧 Provider: ${provider}`);

    // Get expected folders from business_labels table (INTEGRATED with provisioning system)
    const { data: businessLabels, error: labelsError } = await supabase
      .from('business_labels')
      .select('*')
      .eq('business_profile_id', userId)
      .eq('is_deleted', false);

    if (labelsError) {
      console.error('❌ Error fetching business labels:', labelsError);
      return {
        success: false,
        error: 'Could not fetch expected folders from database',
        provider,
        totalExpected: 0,
        totalFound: 0,
        missingFolders: [],
        allFoldersPresent: false
      };
    }

    const expectedFolders = businessLabels || [];
    console.log(`📁 Expected folders from business_labels: ${expectedFolders.length}`);

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
        missingFolders: expectedFolders.map(f => f.label_name),
        allFoldersPresent: false
      };
    }

    // Fetch actual folders from provider using existing functions
    let actualFolders = [];
    if (provider === 'gmail') {
      actualFolders = await fetchGmailLabels(accessToken);
    } else if (provider === 'outlook') {
      actualFolders = await fetchOutlookFoldersRecursive(accessToken);
    }

    console.log(`📬 Actual folders found: ${actualFolders.length}`);

    // Compare expected vs actual folders using business_labels data
    const actualFolderIds = new Set(actualFolders.map(f => f.id));
    const actualFolderNames = new Set(actualFolders.map(f => f.name));
    
    const missingFolders = [];
    const foundFolders = [];

    for (const expectedFolder of expectedFolders) {
      const folderName = expectedFolder.label_name;
      const folderId = expectedFolder.label_id;
      
      // Check if folder exists by ID or name
      const existsById = actualFolderIds.has(folderId);
      const existsByName = actualFolderNames.has(folderName);
      
      if (existsById || existsByName) {
        foundFolders.push({
          name: folderName,
          id: folderId,
          status: 'found',
          matchedBy: existsById ? 'id' : 'name',
          syncedAt: expectedFolder.synced_at
        });
      } else {
        missingFolders.push({
          name: folderName,
          id: folderId,
          status: 'missing',
          lastSynced: expectedFolder.synced_at
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
      checkedAt: new Date().toISOString(),
      // Additional info for debugging
      businessLabelsCount: expectedFolders.length,
      actualFoldersCount: actualFolders.length
    };

  } catch (error) {
    console.error('❌ Folder health check failed:', error);
    return {
      success: false,
      error: error.message,
      provider: provider || null,
      totalExpected: 0,
      totalFound: 0,
      missingFolders: [],
      allFoldersPresent: false
    };
  }
}

/**
 * Get folder health summary for dashboard display
 * @param {string} userId - User ID
 * @param {string} provider - Email provider (optional)
 * @returns {Promise<Object>} Simplified health summary
 */
export async function getFolderHealthSummary(userId, provider = null) {
  const health = await checkFolderHealth(userId, provider);
  
  return {
    healthy: health.allFoldersPresent,
    healthPercentage: health.healthPercentage || 0,
    totalFolders: health.totalExpected,
    missingCount: health.missingFolders?.length || 0,
    missingFolders: health.missingFolders?.slice(0, 5).map(f => f.name) || [], // First 5 only
    provider: health.provider,
    lastChecked: health.checkedAt,
    error: health.error,
    // Additional debugging info
    businessLabelsCount: health.businessLabelsCount,
    actualFoldersCount: health.actualFoldersCount
  };
}

