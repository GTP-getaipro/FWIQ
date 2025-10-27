/**
 * Folder Health Check Service
 * 
 * Validates that all expected folders/labels exist in Gmail/Outlook
 * and provides health status for the dashboard
 * 
 * ENHANCED: Now validates classifier coverage - ensures no more folders than classifier can handle
 * 
 * INTEGRATED with existing provisioning system
 */

import { supabase } from './customSupabaseClient.js';
import { getValidAccessToken } from './oauthTokenManager.js';
import { getFolderIdsForN8n } from './labelSyncValidator.js';

// Expected classifier categories - these are the categories the AI can handle
const CLASSIFIER_CATEGORIES = [
  'Phone', 'Promo', 'Socialmedia', 'Sales', 'Recruitment', 'GoogleReview', 
  'Urgent', 'Misc', 'Manager', 'FormSub', 'Suppliers', 'Support', 'Banking'
];

// Expected secondary categories for each primary category
const CLASSIFIER_SECONDARY_CATEGORIES = {
  'Phone': ['Phone'],
  'Promo': ['Promo'],
  'Socialmedia': ['Socialmedia'],
  'Sales': ['Sales'], // Dynamic based on business type
  'Recruitment': ['Recruitment'],
  'GoogleReview': ['GoogleReview'],
  'Urgent': ['Urgent'],
  'Misc': ['Misc'],
  'Manager': ['Manager'], // Dynamic based on managers
  'FormSub': ['NewSubmission', 'WorkOrderForms'],
  'Suppliers': [], // Dynamic based on suppliers
  'Support': ['Appointment Scheduling', 'General', 'Technical Support', 'Parts And Chemicals'],
  'Banking': ['e-transfer', 'invoice', 'bank-alert', 'refund', 'receipts']
};

// Expected tertiary categories for specific primary categories
const CLASSIFIER_TERTIARY_CATEGORIES = {
  'Banking': {
    'e-transfer': ['FromBusiness', 'ToBusiness'],
    'receipts': ['PaymentSent', 'PaymentReceived']
  }
};

/**
 * Validate classifier coverage - ensure no more folders than classifier can handle
 * @param {Array} actualFolders - Array of actual folders from email provider
 * @param {Array} expectedFolders - Array of expected folders from business_labels
 * @param {Object} businessInfo - Business information (managers, suppliers, business type)
 * @returns {Object} Classifier coverage validation result
 */
function validateClassifierCoverage(actualFolders, expectedFolders, businessInfo = {}) {
  console.log('🔍 Validating classifier coverage...');
  
  const actualFolderNames = actualFolders.map(f => f.name);
  const expectedFolderNames = expectedFolders.map(f => f.label_name);
  
  // Calculate expected classifier categories based on business info
  const expectedCategories = calculateExpectedCategories(businessInfo);
  
  // Check for folders that classifier cannot handle
  const unclassifiableFolders = [];
  const classifierCoverage = {
    totalFolders: actualFolderNames.length,
    classifiableFolders: 0,
    unclassifiableFolders: [],
    coveragePercentage: 0,
    warnings: []
  };
  
  // Check each actual folder against classifier capabilities
  actualFolderNames.forEach(folderName => {
    const isClassifiable = isFolderClassifiable(folderName, expectedCategories);
    
    if (isClassifiable) {
      classifierCoverage.classifiableFolders++;
    } else {
      classifierCoverage.unclassifiableFolders.push(folderName);
      unclassifiableFolders.push(folderName);
    }
  });
  
  // Calculate coverage percentage
  classifierCoverage.coveragePercentage = classifierCoverage.totalFolders > 0 
    ? Math.round((classifierCoverage.classifiableFolders / classifierCoverage.totalFolders) * 100)
    : 100;
  
  // Generate warnings
  if (unclassifiableFolders.length > 0) {
    classifierCoverage.warnings.push(
      `Found ${unclassifiableFolders.length} folders that the AI classifier cannot handle: ${unclassifiableFolders.slice(0, 3).join(', ')}${unclassifiableFolders.length > 3 ? '...' : ''}`
    );
  }
  
  if (classifierCoverage.coveragePercentage < 90) {
    classifierCoverage.warnings.push(
      `Only ${classifierCoverage.coveragePercentage}% of folders can be classified by AI. Consider removing or renaming unclassifiable folders.`
    );
  }
  
  console.log(`📊 Classifier coverage: ${classifierCoverage.classifiableFolders}/${classifierCoverage.totalFolders} folders (${classifierCoverage.coveragePercentage}%)`);
  
  return classifierCoverage;
}

/**
 * Calculate expected categories based on business information
 * @param {Object} businessInfo - Business information
 * @returns {Object} Expected categories with dynamic expansions
 */
function calculateExpectedCategories(businessInfo) {
  const expectedCategories = { ...CLASSIFIER_SECONDARY_CATEGORIES };
  
  // Add dynamic manager categories
  if (businessInfo.managers && businessInfo.managers.length > 0) {
    expectedCategories.Manager = businessInfo.managers.map(manager => manager.name || 'Manager');
  }
  
  // Add dynamic supplier categories
  if (businessInfo.suppliers && businessInfo.suppliers.length > 0) {
    expectedCategories.Suppliers = businessInfo.suppliers.map(supplier => supplier.name || 'Supplier');
  }
  
  // Add business-specific sales categories
  if (businessInfo.businessType) {
    expectedCategories.Sales = getBusinessSpecificSalesCategories(businessInfo.businessType);
  }
  
  return expectedCategories;
}

/**
 * Check if a folder name is classifiable by the AI
 * @param {string} folderName - Folder name to check
 * @param {Object} expectedCategories - Expected categories
 * @returns {boolean} True if folder is classifiable
 */
function isFolderClassifiable(folderName, expectedCategories) {
  // Normalize folder name (remove spaces and special chars for comparison)
  const normalizedFolderName = folderName.toLowerCase().replace(/[\s-_]/g, '');
  
  // Check if folder matches any primary category
  for (const primaryCategory of CLASSIFIER_CATEGORIES) {
    const normalizedCategory = primaryCategory.toLowerCase().replace(/[\s-_]/g, '');
    if (normalizedFolderName.includes(normalizedCategory) || normalizedCategory.includes(normalizedFolderName)) {
      return true;
    }
  }
  
  // Check if folder matches any secondary category
  for (const [primaryCategory, secondaryCategories] of Object.entries(expectedCategories)) {
    for (const secondaryCategory of secondaryCategories) {
      const normalizedSecondary = secondaryCategory.toLowerCase().replace(/[\s-_]/g, '');
      if (normalizedFolderName.includes(normalizedSecondary) || normalizedSecondary.includes(normalizedFolderName)) {
        return true;
      }
    }
  }
  
  // Check if folder matches any tertiary category
  for (const [primaryCategory, tertiaryMap] of Object.entries(CLASSIFIER_TERTIARY_CATEGORIES)) {
    for (const [secondaryCategory, tertiaryCategories] of Object.entries(tertiaryMap)) {
      for (const tertiaryCategory of tertiaryCategories) {
        const normalizedTertiary = tertiaryCategory.toLowerCase().replace(/[\s-_]/g, '');
        if (normalizedFolderName.includes(normalizedTertiary) || normalizedTertiary.includes(normalizedFolderName)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Get business-specific sales categories
 * @param {string} businessType - Business type
 * @returns {Array} Sales categories for the business type
 */
function getBusinessSpecificSalesCategories(businessType) {
  const salesCategories = {
    'Hot tub & Spa': ['New Spa Sales', 'Accessory Sales', 'Consultations', 'Quote Requests'],
    'Pools': ['Pool Sales', 'Equipment Sales', 'Consultations', 'Quote Requests'],
    'Electrician': ['Electrical Services', 'Equipment Sales', 'Consultations', 'Quote Requests'],
    'HVAC': ['HVAC Sales', 'Equipment Sales', 'Consultations', 'Quote Requests'],
    'Plumber': ['Plumbing Services', 'Equipment Sales', 'Consultations', 'Quote Requests'],
    'Flooring': ['Flooring Sales', 'Material Sales', 'Consultations', 'Quote Requests'],
    'General Construction': ['Construction Services', 'Material Sales', 'Consultations', 'Quote Requests'],
    'Landscaping': ['Landscaping Services', 'Equipment Sales', 'Consultations', 'Quote Requests'],
    'Roofing': ['Roofing Services', 'Material Sales', 'Consultations', 'Quote Requests'],
    'Painting': ['Painting Services', 'Material Sales', 'Consultations', 'Quote Requests'],
    'Cleaning': ['Cleaning Services', 'Equipment Sales', 'Consultations', 'Quote Requests'],
    'General Services': ['Service Sales', 'Equipment Sales', 'Consultations', 'Quote Requests']
  };
  
  return salesCategories[businessType] || salesCategories['General Services'];
}
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

    // Get valid access token FIRST - to check actual Gmail/Outlook state
    const accessToken = await getValidAccessToken(userId, provider);
    if (!accessToken) {
      return {
        success: false,
        error: 'Could not get valid access token',
        provider,
        totalExpected: 0,
        totalFound: 0,
        missingFolders: [],
        allFoldersPresent: false,
        needsSync: false
      };
    }

    // Fetch actual folders from Gmail/Outlook FIRST
    let actualFolders = [];
    if (provider === 'gmail') {
      actualFolders = await fetchCurrentGmailLabels(accessToken);
    } else if (provider === 'outlook') {
      actualFolders = await fetchCurrentOutlookFolders(accessToken);
    }

    console.log(`📬 Actual folders in ${provider}: ${actualFolders.length}`);

    // Get expected folders from profiles.email_labels (primary source)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_labels')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      // If we can't get profile but have actual folders, return state showing sync needed
      if (actualFolders.length > 0) {
        return {
          success: true,
          provider,
          totalExpected: 0,
          totalFound: actualFolders.length,
          actualFoldersCount: actualFolders.length,
          healthPercentage: 0,
          missingFolders: [],
          allFoldersPresent: false,
          needsSync: true,
          message: `Found ${actualFolders.length} folders in ${provider} but database is not synced`,
          checkedAt: new Date().toISOString()
        };
      }
      return {
        success: false,
        error: 'Could not fetch profile',
        provider,
        totalExpected: 0,
        totalFound: 0,
        missingFolders: [],
        allFoldersPresent: false,
        needsSync: false
      };
    }

    const emailLabels = profile?.email_labels || {};
    const expectedFolders = Object.entries(emailLabels).map(([name, data]) => ({
      label_name: name,
      label_id: data.id || data,
      synced_at: data.synced_at || null
    }));

    console.log(`📁 Expected folders from database: ${expectedFolders.length}`);
    console.log(`📬 Actual folders in ${provider}: ${actualFolders.length}`);

    // SPECIAL CASE: Database is empty but Gmail/Outlook has folders
    if (expectedFolders.length === 0 && actualFolders.length > 0) {
      console.log(`⚠️ Database empty but ${provider} has ${actualFolders.length} folders - NEEDS SYNC`);
      return {
        success: true,
        provider,
        totalExpected: 0,
        totalFound: actualFolders.length,
        actualFoldersCount: actualFolders.length,
        healthPercentage: 0,
        missingFolders: [],
        allFoldersPresent: false,
        needsSync: true,
        message: `Found ${actualFolders.length} folders in ${provider} but not synced to database`,
        checkedAt: new Date().toISOString()
      };
    }

    // SPECIAL CASE: Both are empty
    if (expectedFolders.length === 0 && actualFolders.length === 0) {
      return {
        success: true,
        message: 'No folders configured yet',
        provider,
        totalExpected: 0,
        totalFound: 0,
        actualFoldersCount: 0,
        missingFolders: [],
        allFoldersPresent: true,
        needsSync: false,
        checkedAt: new Date().toISOString()
      };
    }

    // Get business information for classifier coverage validation
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('business_type, managers, suppliers')
      .eq('user_id', userId)
      .single();

    const businessInfo = {
      businessType: businessProfile?.business_type || 'General Services',
      managers: businessProfile?.managers || [],
      suppliers: businessProfile?.suppliers || []
    };

    // Validate classifier coverage
    const classifierCoverage = validateClassifierCoverage(actualFolders, expectedFolders, businessInfo);

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
      needsSync: false,
      checkedAt: new Date().toISOString(),
      // Additional info for debugging
      businessLabelsCount: expectedFolders.length,
      actualFoldersCount: actualFolders.length,
      // NEW: Classifier coverage validation
      classifierCoverage: {
        totalFolders: classifierCoverage.totalFolders,
        classifiableFolders: classifierCoverage.classifiableFolders,
        unclassifiableFolders: classifierCoverage.unclassifiableFolders,
        coveragePercentage: classifierCoverage.coveragePercentage,
        warnings: classifierCoverage.warnings,
        isHealthy: classifierCoverage.coveragePercentage >= 90
      }
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
  try {
    console.log(`🔍 getFolderHealthSummary called with userId: ${userId}, provider: ${provider}`);
    
    if (!userId) {
      console.error('❌ userId is required but was not provided');
      throw new Error('User ID is required');
    }
    
    const health = await checkFolderHealth(userId, provider);
    
    console.log('📊 checkFolderHealth returned:', {
      success: health.success,
      allFoldersPresent: health.allFoldersPresent,
      totalExpected: health.totalExpected,
      provider: health.provider,
      hasError: !!health.error
    });
    
    return {
      healthy: health.allFoldersPresent || false,
      healthPercentage: health.healthPercentage || 0,
      totalFolders: health.totalExpected || 0,
      missingCount: health.missingFolders?.length || 0,
      missingFolders: health.missingFolders?.slice(0, 5).map(f => f.name) || [], // First 5 only
      provider: health.provider || provider || 'unknown',
      lastChecked: health.checkedAt || new Date().toISOString(),
      error: health.error || null,
      // Additional debugging info
      businessLabelsCount: health.businessLabelsCount || 0,
      actualFoldersCount: health.actualFoldersCount || 0,
      // NEW: Classifier coverage information
      classifierCoverage: health.classifierCoverage ? {
      healthy: health.classifierCoverage.isHealthy,
      coveragePercentage: health.classifierCoverage.coveragePercentage,
      totalFolders: health.classifierCoverage.totalFolders,
      classifiableFolders: health.classifierCoverage.classifiableFolders,
      unclassifiableCount: health.classifierCoverage.unclassifiableFolders?.length || 0,
      unclassifiableFolders: health.classifierCoverage.unclassifiableFolders?.slice(0, 3) || [],
      warnings: health.classifierCoverage.warnings || []
    } : null
  };
  } catch (error) {
    console.error('❌ getFolderHealthSummary error:', error);
    return {
      healthy: false,
      healthPercentage: 0,
      totalFolders: 0,
      missingCount: 0,
      missingFolders: [],
      provider: provider || 'unknown',
      lastChecked: new Date().toISOString(),
      error: error.message || 'Failed to check folder health',
      businessLabelsCount: 0,
      actualFoldersCount: 0,
      classifierCoverage: null
    };
  }
}

/**
 * Fetch current Gmail labels using Gmail API
 * @param {string} accessToken - Gmail OAuth access token
 * @returns {Promise<Array>} Array of label objects with id and name
 */
async function fetchCurrentGmailLabels(accessToken) {
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
    const labels = data.labels || [];

    // Filter to user-created labels only (exclude system labels)
    const userLabels = labels.filter(label => 
      label.type === 'user' && !label.name.startsWith('CATEGORY_')
    );

    return userLabels.map(label => ({
      id: label.id,
      name: label.name
    }));
  } catch (error) {
    console.error('❌ Error fetching Gmail labels:', error);
    return [];
  }
}

/**
 * Fetch current Outlook folders using Microsoft Graph API
 * @param {string} accessToken - Outlook OAuth access token
 * @returns {Promise<Array>} Array of folder objects with id and name
 */
async function fetchCurrentOutlookFolders(accessToken) {
  try {
    // Fetch all mail folders recursively
    const folders = await fetchOutlookFoldersRecursive(accessToken);
    
    return folders.map(folder => ({
      id: folder.id,
      name: folder.displayName
    }));
  } catch (error) {
    console.error('❌ Error fetching Outlook folders:', error);
    return [];
  }
}

/**
 * Recursively fetch all Outlook folders including child folders
 * @param {string} accessToken - Outlook OAuth access token
 * @param {string} parentId - Parent folder ID (null for root folders)
 * @returns {Promise<Array>} Array of all folders
 */
async function fetchOutlookFoldersRecursive(accessToken, parentId = null) {
  try {
    const url = parentId
      ? `https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders`
      : 'https://graph.microsoft.com/v1.0/me/mailFolders';

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    const folders = data.value || [];

    // Recursively fetch child folders
    let allFolders = [...folders];
    for (const folder of folders) {
      const childFolders = await fetchOutlookFoldersRecursive(accessToken, folder.id);
      allFolders = allFolders.concat(childFolders);
    }

    return allFolders;
  } catch (error) {
    console.error('❌ Error fetching Outlook folders recursively:', error);
    return [];
  }
}

/**
 * Create missing folders for user
 * Only creates the specific folders that are missing (surgical fix)
 * @param {string} userId - User ID
 * @param {string} provider - Email provider ('gmail' or 'outlook')
 * @param {Array<string>} missingFolderNames - Array of folder names to create
 * @returns {Promise<Object>} Result with created folders
 */
export async function createMissingFolders(userId, provider, missingFolderNames) {
  console.log('🔧 Creating missing folders...', {
    userId,
    provider,
    missingCount: missingFolderNames.length,
    folders: missingFolderNames
  });
  
  try {
    if (!userId || !provider || !missingFolderNames || missingFolderNames.length === 0) {
      return {
        success: true,
        created: [],
        message: 'No folders to create'
      };
    }
    
    // Get valid access token
    const accessToken = await getValidAccessToken(userId, provider);
    if (!accessToken) {
      throw new Error('No valid access token available');
    }
    
    // Get current email_labels from profile to update
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_labels')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      throw new Error(`Failed to load profile: ${profileError.message}`);
    }
    
    const currentLabels = profile?.email_labels || {};
    const createdFolders = [];
    const errors = [];
    
    // Create each missing folder
    for (const folderName of missingFolderNames) {
      try {
        console.log(`📁 Creating folder: ${folderName}`);
        
        let folderId;
        if (provider === 'gmail') {
          folderId = await createGmailLabel(accessToken, folderName);
        } else if (provider === 'outlook') {
          folderId = await createOutlookFolder(accessToken, folderName);
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }
        
        if (folderId) {
          // Add to label map
          currentLabels[folderName] = {
            id: folderId,
            name: folderName
          };
          
          createdFolders.push({ name: folderName, id: folderId });
          console.log(`✅ Created folder: ${folderName} (${folderId})`);
        }
      } catch (error) {
        console.error(`❌ Failed to create folder ${folderName}:`, error);
        errors.push({ folder: folderName, error: error.message });
      }
    }
    
    // Update profile with new folders
    if (createdFolders.length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          email_labels: currentLabels,
          label_provisioning_status: 'completed',
          label_provisioning_date: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Failed to update profile with new folders:', updateError);
        throw new Error(`Failed to save folders: ${updateError.message}`);
      }
    }
    
    return {
      success: true,
      created: createdFolders,
      errors: errors,
      message: `Successfully created ${createdFolders.length} of ${missingFolderNames.length} folders`
    };
    
  } catch (error) {
    console.error('❌ createMissingFolders failed:', error);
    return {
      success: false,
      created: [],
      error: error.message
    };
  }
}

/**
 * Create a Gmail label
 * @param {string} accessToken - Gmail access token
 * @param {string} labelName - Label name to create
 * @returns {Promise<string>} Created label ID
 */
async function createGmailLabel(accessToken, labelName) {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.id;
}

/**
 * Create an Outlook folder
 * @param {string} accessToken - Outlook access token
 * @param {string} folderName - Folder name to create
 * @returns {Promise<string>} Created folder ID
 */
async function createOutlookFolder(accessToken, folderName) {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      displayName: folderName
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft Graph API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  return data.id;
}

