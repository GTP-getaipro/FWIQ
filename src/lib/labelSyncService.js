/**
 * Label Sync Service
 * 
 * Ensures Supabase database always reflects the real state of Gmail/Outlook folders.
 * Prevents stale label IDs and 409 Conflict errors.
 * 
 * @module labelSyncService
 */

import { supabase } from './customSupabaseClient';

/**
 * Sync Gmail labels with Supabase database
 * 
 * @param {string} accessToken - Gmail OAuth access token
 * @param {string} businessProfileId - UUID of the business profile
 * @param {string} businessType - Business type (e.g., 'Pools', 'HVAC')
 * @returns {Promise<{synced: number, created: number, deleted: number}>}
 */
export async function syncGmailLabels(accessToken, businessProfileId, businessType) {
  console.log('🔄 Syncing Gmail labels for profile:', businessProfileId);

  try {
    // Step 1: Fetch all labels from Gmail
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gmail API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const gmailLabels = data.labels || [];

    console.log(`📋 Found ${gmailLabels.length} labels in Gmail`);

    // Step 2: Filter only user-created labels (exclude system labels)
    const userLabels = gmailLabels.filter(label => 
      label.type === 'user' && !label.name.startsWith('CATEGORY_')
    );

    console.log(`📋 ${userLabels.length} user-created labels`);

    // Step 3: Get existing labels to preserve user-customized colors
    const { data: existingLabels } = await supabase
      .from('business_labels')
      .select('label_id, color')
      .eq('business_profile_id', businessProfileId)
      .eq('provider', 'gmail');

    const existingColorMap = new Map(
      (existingLabels || []).map(l => [l.label_id, l.color])
    );

    // Step 4: Normalize labels for Supabase
    const normalizedLabels = userLabels.map(label => {
      // Preserve existing custom color if label already exists
      const existingColor = existingColorMap.get(label.id);
      
      return {
        label_id: label.id,
        label_name: label.name,
        provider: 'gmail',
        business_profile_id: businessProfileId,
        business_type: detectBusinessTypeFromLabel(label.name, businessType),
        // Priority: existing color > Gmail color > generated color
        color: existingColor || (label.color?.backgroundColor 
          ? label.color.backgroundColor  // Store just the background color as string
          : generateLabelColor(label.name)),
        synced_at: new Date().toISOString(),
        is_deleted: false
      };
    });

    // Step 5: Upsert live labels to Supabase
    if (normalizedLabels.length > 0) {
      const { error: upsertError } = await supabase
        .from('business_labels')
        .upsert(normalizedLabels, { 
          onConflict: 'label_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('❌ Error upserting labels:', upsertError);
        throw upsertError;
      }
    }

    // Step 6: Mark stale labels as deleted (exist in Supabase but not in Gmail)
    const liveIds = normalizedLabels.map(l => l.label_id);
    const { data: staleLabels, error: fetchError } = await supabase
      .from('business_labels')
      .select('label_id, label_name')
      .eq('business_profile_id', businessProfileId)
      .eq('provider', 'gmail')
      .not('label_id', 'in', `(${liveIds.join(',')})`)
      .eq('is_deleted', false);

    if (fetchError) {
      console.error('❌ Error fetching stale labels:', fetchError);
    }

    let deletedCount = 0;
    if (staleLabels && staleLabels.length > 0) {
      console.log(`🗑️ Marking ${staleLabels.length} stale labels as deleted`);
      
      const { error: deleteError } = await supabase
        .from('business_labels')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('business_profile_id', businessProfileId)
        .eq('provider', 'gmail')
        .not('label_id', 'in', `(${liveIds.join(',')})`)
        .eq('is_deleted', false);

      if (deleteError) {
        console.error('❌ Error marking stale labels:', deleteError);
      } else {
        deletedCount = staleLabels.length;
      }
    }

    console.log('✅ Gmail sync complete:', {
      synced: normalizedLabels.length,
      deleted: deletedCount
    });

    return {
      synced: normalizedLabels.length,
      created: 0, // Will be calculated by comparing with previous state
      deleted: deletedCount
    };

  } catch (error) {
    console.error('❌ Error syncing Gmail labels:', error);
    throw error;
  }
}

/**
 * Sync Outlook folders with Supabase database
 * 
 * @param {string} accessToken - Outlook OAuth access token
 * @param {string} businessProfileId - UUID of the business profile
 * @param {string} businessType - Business type (e.g., 'Pools', 'HVAC')
 * @returns {Promise<{synced: number, created: number, deleted: number}>}
 */
export async function syncOutlookFolders(accessToken, businessProfileId, businessType) {
  console.log('🔄 Syncing Outlook folders for profile:', businessProfileId);

  try {
    // Step 1: Fetch all mail folders from Outlook
    const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Outlook API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const outlookFolders = data.value || [];

    console.log(`📋 Found ${outlookFolders.length} folders in Outlook`);

    // Step 2: Recursively fetch child folders
    const allFolders = await fetchAllOutlookFolders(accessToken, outlookFolders);

    console.log(`📋 Total folders (including children): ${allFolders.length}`);

    // Step 3: Normalize folders for Supabase
    // Outlook folders created without colors for consistency with schema
    const normalizedFolders = allFolders.map(folder => {
      
      return {
        label_id: folder.id,
        label_name: folder.displayName,
        provider: 'outlook',
        business_profile_id: businessProfileId,
        business_type: detectBusinessTypeFromLabel(folder.displayName, businessType),
        parent_id: folder.parentFolderId || null,
        // Outlook folders created without colors for consistency with schema
        color: null,
        synced_at: new Date().toISOString(),
        is_deleted: false
      };
    });

    // Step 5: Upsert live folders to Supabase
    if (normalizedFolders.length > 0) {
      const { error: upsertError } = await supabase
        .from('business_labels')
        .upsert(normalizedFolders, { 
          onConflict: 'label_id',
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error('❌ Error upserting folders:', upsertError);
        throw upsertError;
      }
    }

    // Step 6: Mark stale folders as deleted
    const liveIds = normalizedFolders.map(f => f.label_id);
    const { data: staleFolders, error: fetchError } = await supabase
      .from('business_labels')
      .select('label_id, label_name')
      .eq('business_profile_id', businessProfileId)
      .eq('provider', 'outlook')
      .not('label_id', 'in', `(${liveIds.join(',')})`)
      .eq('is_deleted', false);

    if (fetchError) {
      console.error('❌ Error fetching stale folders:', fetchError);
    }

    let deletedCount = 0;
    if (staleFolders && staleFolders.length > 0) {
      console.log(`🗑️ Marking ${staleFolders.length} stale folders as deleted`);
      
      const { error: deleteError } = await supabase
        .from('business_labels')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('business_profile_id', businessProfileId)
        .eq('provider', 'outlook')
        .not('label_id', 'in', `(${liveIds.join(',')})`)
        .eq('is_deleted', false);

      if (deleteError) {
        console.error('❌ Error marking stale folders:', deleteError);
      } else {
        deletedCount = staleFolders.length;
      }
    }

    console.log('✅ Outlook sync complete:', {
      synced: normalizedFolders.length,
      deleted: deletedCount
    });

    return {
      synced: normalizedFolders.length,
      created: 0,
      deleted: deletedCount
    };

  } catch (error) {
    console.error('❌ Error syncing Outlook folders:', error);
    throw error;
  }
}

/**
 * Recursively fetch all Outlook folders including children
 * 
 * @param {string} accessToken - Outlook OAuth access token
 * @param {Array} folders - Array of parent folders
 * @returns {Promise<Array>}
 */
async function fetchAllOutlookFolders(accessToken, folders) {
  const allFolders = [...folders];

  for (const folder of folders) {
    if (folder.childFolderCount > 0) {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.id}/childFolders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const childFolders = data.value || [];
        
        // Recursively fetch children of children
        const allChildren = await fetchAllOutlookFolders(accessToken, childFolders);
        allFolders.push(...allChildren);
      }
    }
  }

  return allFolders;
}

/**
 * Generate a color for a label based on its name
 * Creates consistent, visually appealing colors
 * 
 * @param {string} labelName - Label/folder name
 * @returns {string} Background color as hex string
 */
function generateLabelColor(labelName) {
  // Predefined color palette for common label types
  const colorMap = {
    // Priority/Status
    'urgent': { backgroundColor: '#ff0000', textColor: '#ffffff' },
    'priority': { backgroundColor: '#ff6b6b', textColor: '#ffffff' },
    'important': { backgroundColor: '#f59e0b', textColor: '#ffffff' },
    'follow up': { backgroundColor: '#3b82f6', textColor: '#ffffff' },
    'waiting': { backgroundColor: '#fbbf24', textColor: '#000000' },
    'done': { backgroundColor: '#10b981', textColor: '#ffffff' },
    'completed': { backgroundColor: '#059669', textColor: '#ffffff' },
    
    // Client/Sales
    'client': { backgroundColor: '#8b5cf6', textColor: '#ffffff' },
    'customer': { backgroundColor: '#a78bfa', textColor: '#ffffff' },
    'quote': { backgroundColor: '#14b8a6', textColor: '#ffffff' },
    'estimate': { backgroundColor: '#06b6d4', textColor: '#ffffff' },
    'invoice': { backgroundColor: '#0ea5e9', textColor: '#ffffff' },
    'payment': { backgroundColor: '#22c55e', textColor: '#ffffff' },
    
    // Operations
    'schedule': { backgroundColor: '#ec4899', textColor: '#ffffff' },
    'appointment': { backgroundColor: '#f472b6', textColor: '#ffffff' },
    'service': { backgroundColor: '#6366f1', textColor: '#ffffff' },
    'maintenance': { backgroundColor: '#8b5cf6', textColor: '#ffffff' },
    'repair': { backgroundColor: '#ef4444', textColor: '#ffffff' },
    'installation': { backgroundColor: '#f97316', textColor: '#ffffff' },
    
    // Communication
    'email': { backgroundColor: '#64748b', textColor: '#ffffff' },
    'call': { backgroundColor: '#0891b2', textColor: '#ffffff' },
    'message': { backgroundColor: '#06b6d4', textColor: '#ffffff' },
    
    // Admin
    'archive': { backgroundColor: '#9ca3af', textColor: '#ffffff' },
    'reference': { backgroundColor: '#6b7280', textColor: '#ffffff' },
    'internal': { backgroundColor: '#475569', textColor: '#ffffff' },
  };

  // Check if label name contains any of the predefined keywords
  const lowerName = labelName.toLowerCase();
  for (const [keyword, color] of Object.entries(colorMap)) {
    if (lowerName.includes(keyword)) {
      return color.backgroundColor; // Return just the background color string
    }
  }

  // Generate a consistent color from the label name using hash
  let hash = 0;
  for (let i = 0; i < labelName.length; i++) {
    hash = labelName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Create a pleasant color using HSL
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 45 + (Math.abs(hash >> 8) % 15); // 45-60%
  
  const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return backgroundColor; // Return just the background color string
}

/**
 * Detect business type from label name
 * Falls back to provided business type if not detected
 * 
 * @param {string} labelName - Label/folder name
 * @param {string} defaultBusinessType - Default business type
 * @returns {string}
 */
function detectBusinessTypeFromLabel(labelName, defaultBusinessType) {
  // Common business type keywords
  const businessTypeMap = {
    'pool': 'Pools',
    'spa': 'Pools',
    'hvac': 'HVAC',
    'heating': 'HVAC',
    'cooling': 'HVAC',
    'electric': 'Electrician',
    'electrical': 'Electrician',
    'roof': 'Roofing',
    'roofing': 'Roofing',
    'paint': 'Painting',
    'painting': 'Painting',
    'floor': 'Flooring',
    'flooring': 'Flooring',
    'landscape': 'Landscaping',
    'landscaping': 'Landscaping',
    'contractor': 'General Contractor',
    'general': 'General Contractor'
  };

  const lowerName = labelName.toLowerCase();
  
  for (const [keyword, type] of Object.entries(businessTypeMap)) {
    if (lowerName.includes(keyword)) {
      return type;
    }
  }

  return defaultBusinessType;
}

/**
 * Sync labels for all providers associated with a business profile
 * 
 * @param {string} businessProfileId - UUID of the business profile
 * @param {string} businessType - Business type
 * @returns {Promise<{gmail?: object, outlook?: object}>}
 */
export async function syncAllLabels(businessProfileId, businessType) {
  console.log('🔄 Syncing all labels for profile:', businessProfileId);

  const results = {};

  try {
    // Fetch integrations for this profile
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('provider, access_token, status')
      .eq('user_id', businessProfileId) // Assuming user_id maps to profile
      .eq('status', 'active')
      .in('provider', ['gmail', 'outlook']);

    if (error) {
      console.error('❌ Error fetching integrations:', error);
      throw error;
    }

    if (!integrations || integrations.length === 0) {
      console.log('⚠️ No active integrations found');
      return results;
    }

    // Sync each provider
    for (const integration of integrations) {
      const { provider, access_token } = integration;

      try {
        if (provider === 'gmail') {
          results.gmail = await syncGmailLabels(access_token, businessProfileId, businessType);
        } else if (provider === 'outlook') {
          results.outlook = await syncOutlookFolders(access_token, businessProfileId, businessType);
        }
      } catch (error) {
        console.error(`❌ Error syncing ${provider}:`, error);
        results[provider] = { error: error.message };
      }
    }

    console.log('✅ All labels synced:', results);
    return results;

  } catch (error) {
    console.error('❌ Error syncing all labels:', error);
    throw error;
  }
}

/**
 * Get existing labels from database
 * Only returns non-deleted labels
 * 
 * @param {string} businessProfileId - UUID of the business profile
 * @param {string} provider - Provider ('gmail' or 'outlook')
 * @returns {Promise<Array>}
 */
export async function getExistingLabels(businessProfileId, provider) {
  const { data, error } = await supabase
    .from('business_labels')
    .select('*')
    .eq('business_profile_id', businessProfileId)
    .eq('provider', provider)
    .eq('is_deleted', false)
    .order('label_name');

  if (error) {
    console.error('❌ Error fetching existing labels:', error);
    throw error;
  }

  return data || [];
}

/**
 * Check if a label exists in the database
 * 
 * @param {string} labelId - Provider label ID
 * @returns {Promise<boolean>}
 */
export async function labelExists(labelId) {
  const { data, error } = await supabase
    .from('business_labels')
    .select('label_id')
    .eq('label_id', labelId)
    .eq('is_deleted', false)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('❌ Error checking label existence:', error);
    throw error;
  }

  return !!data;
}

