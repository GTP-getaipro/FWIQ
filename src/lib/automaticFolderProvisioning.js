/**
 * Automatic Folder Provisioning Service
 * 
 * Automatically triggers folder/label provisioning based on:
 * - Business type changes
 * - Team setup completion (managers/suppliers added)
 * - Onboarding completion
 * 
 * Provides real-time validation and immediate feedback
 */

import { supabase } from './customSupabaseClient.js';
import { provisionLabelSchemaFor } from './labelProvisionService.js';
import { checkFolderHealth } from './folderHealthCheck.js';

/**
 * Automatically provision folders after business type selection
 * Triggered from Step3BusinessType
 * @param {string} userId - User ID
 * @param {string[]} businessTypes - Selected business types
 * @returns {Promise<Object>} Provisioning result with validation
 */
/**
 * Automatically provision folders when business type changes (Step 3)
 * Creates SKELETON only - core business folders without dynamic team folders
 * Team folders (managers/suppliers) are added later in Step 4 after user enters them
 * 
 * @param {string} userId - User ID
 * @param {Array<string>} businessTypes - Array of business types
 * @returns {Promise<Object>} - Provisioning result
 */
export async function autoProvisionOnBusinessTypeChange(userId, businessTypes) {
  console.log('📁 AUTO-PROVISIONING: Business type changed', {
    userId,
    businessTypes,
    timestamp: new Date().toISOString()
  });

  try {
    // Check if user has active email integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('provider, status, access_token')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('provider', ['gmail', 'outlook'])
      .single();

    if (integrationError || !integration) {
      console.log('ℹ️ No active email integration found - skipping folder provisioning');
      return {
        success: false,
        skipped: true,
        reason: 'No active email integration',
        message: 'Email folders will be created after email integration'
      };
    }

    // ✅ FIXED: Check if managers/suppliers exist to determine provisioning mode
    const { data: profile } = await supabase
      .from('profiles')
      .select('managers, suppliers')
      .eq('id', userId)
      .single();

    const hasTeam = (profile?.managers?.length > 0) || (profile?.suppliers?.length > 0);

    if (!hasTeam) {
      // ✅ CREATE SKELETON: Core business folders only (no team folders yet)
      console.log('🏗️ No team members yet - creating SKELETON (core folders only)');
      console.log('📋 Team folders will be injected after Team Setup (Step 4)');
      
      const provisioningResult = await provisionLabelSchemaFor(userId, businessTypes, {
        skeletonOnly: true,
        injectTeamFolders: false
      });
      
      return {
        ...provisioningResult,
        skipped: false,
        skeletonCreated: true,
        message: `Created ${provisioningResult.labelsCreated || 0} core business folders (skeleton)`
      };
    }

    // ✅ FULL PROVISIONING: Team members exist, create everything including team folders
    console.log('🚀 Starting full folder provisioning with team members...');
    const provisioningResult = await provisionLabelSchemaFor(userId, businessTypes, {
      skeletonOnly: false,
      injectTeamFolders: true
    });

    if (!provisioningResult.success) {
      return {
        success: false,
        error: provisioningResult.error,
        message: `Folder provisioning failed: ${provisioningResult.error}`
      };
    }

    // Validate created folders
    console.log('✅ Validating created folders...');
    const validation = await validateFolderProvisioning(userId, integration.provider);

    return {
      success: true,
      provisioning: provisioningResult,
      validation,
      message: `Successfully created ${provisioningResult.labelsCreated || 0} folders`,
      trigger: 'business_type_change'
    };

  } catch (error) {
    console.error('❌ Error in autoProvisionOnBusinessTypeChange:', error);
    return {
      success: false,
      error: error.message,
      message: 'Automatic folder provisioning failed'
    };
  }
}

/**
 * Automatically provision folders after team setup completion
 * Triggered from Step4TeamSetup
 * @param {string} userId - User ID
 * @param {Array} managers - Manager list
 * @param {Array} suppliers - Supplier list
 * @returns {Promise<Object>} Provisioning result with validation
 */
export async function autoProvisionOnTeamSetup(userId, managers = [], suppliers = []) {
  console.log('📁 AUTO-PROVISIONING: Team setup completed', {
    userId,
    managersCount: managers.length,
    suppliersCount: suppliers.length,
    timestamp: new Date().toISOString()
  });

  try {
    // Get business types from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_type, business_types')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Could not fetch user profile',
        message: 'Failed to retrieve business information'
      };
    }

    const businessTypes = profile.business_types || [profile.business_type];

    // Check if email integration is active
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('provider, status, access_token')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('provider', ['gmail', 'outlook'])
      .single();

    if (integrationError || !integration) {
      console.log('ℹ️ No active email integration - skipping folder provisioning');
      return {
        success: false,
        skipped: true,
        reason: 'No active email integration',
        message: 'Email folders will be created after email integration'
      };
    }

    // Provision folders with team members
    console.log('🚀 Starting automatic folder provisioning with team data...');
    const provisioningResult = await provisionLabelSchemaFor(userId, businessTypes);

    if (!provisioningResult.success) {
      return {
        success: false,
        error: provisioningResult.error,
        message: `Folder provisioning failed: ${provisioningResult.error}`
      };
    }

    // Validate created folders
    console.log('✅ Validating created folders with team structure...');
    const validation = await validateFolderProvisioning(userId, integration.provider);

    // Check specifically for manager and supplier folders
    const teamFoldersValid = await validateTeamFolders(userId, managers, suppliers, integration.provider);

    return {
      success: true,
      provisioning: provisioningResult,
      validation,
      teamFoldersValid,
      message: `Successfully created ${provisioningResult.labelsCreated || 0} folders including ${managers.length} managers and ${suppliers.length} suppliers`,
      trigger: 'team_setup_complete'
    };

  } catch (error) {
    console.error('❌ Error in autoProvisionOnTeamSetup:', error);
    return {
      success: false,
      error: error.message,
      message: 'Automatic folder provisioning failed'
    };
  }
}

/**
 * Automatically provision folders on onboarding completion
 * Triggered from Step5Deploy or final onboarding step
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Provisioning result with validation
 */
export async function autoProvisionOnOnboardingComplete(userId) {
  console.log('📁 AUTO-PROVISIONING: Onboarding completed', {
    userId,
    timestamp: new Date().toISOString()
  });

  try {
    // Get full profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_type, business_types, managers, suppliers, client_config')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Could not fetch user profile',
        message: 'Failed to retrieve business information'
      };
    }

    const businessTypes = profile.business_types || [profile.business_type];

    // Check if email integration is active
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('provider, status, access_token')
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('provider', ['gmail', 'outlook'])
      .single();

    if (integrationError || !integration) {
      console.log('⚠️ No active email integration found');
      return {
        success: false,
        skipped: true,
        reason: 'No active email integration',
        message: 'Please complete email integration to create folders'
      };
    }

    // Check if folders already exist
    const existingHealth = await checkFolderHealth(userId, integration.provider);
    
    if (existingHealth.allFoldersPresent && existingHealth.healthPercentage >= 90) {
      console.log('✅ Folders already exist and are healthy');
      return {
        success: true,
        skipped: true,
        reason: 'Folders already exist',
        message: 'Email folders are already configured',
        health: existingHealth
      };
    }

    // Provision folders
    console.log('🚀 Starting comprehensive folder provisioning...');
    const provisioningResult = await provisionLabelSchemaFor(userId, businessTypes);

    if (!provisioningResult.success) {
      return {
        success: false,
        error: provisioningResult.error,
        message: `Folder provisioning failed: ${provisioningResult.error}`
      };
    }

    // Perform comprehensive validation
    console.log('✅ Performing comprehensive folder validation...');
    const validation = await validateFolderProvisioning(userId, integration.provider);
    const teamFoldersValid = await validateTeamFolders(
      userId, 
      profile.managers || [], 
      profile.suppliers || [], 
      integration.provider
    );

    return {
      success: true,
      provisioning: provisioningResult,
      validation,
      teamFoldersValid,
      message: `Successfully provisioned all folders for ${businessTypes.join(', ')}`,
      trigger: 'onboarding_complete',
      readyForDeployment: validation.allFoldersPresent
    };

  } catch (error) {
    console.error('❌ Error in autoProvisionOnOnboardingComplete:', error);
    return {
      success: false,
      error: error.message,
      message: 'Automatic folder provisioning failed'
    };
  }
}

/**
 * Validate folder provisioning with real-time health check
 * @param {string} userId - User ID
 * @param {string} provider - Email provider (gmail/outlook)
 * @returns {Promise<Object>} Validation result
 */
async function validateFolderProvisioning(userId, provider) {
  try {
    console.log('🔍 Running real-time folder validation...');
    
    const health = await checkFolderHealth(userId, provider);
    
    return {
      success: true,
      allFoldersPresent: health.allFoldersPresent,
      healthPercentage: health.healthPercentage,
      totalExpected: health.totalExpected,
      totalFound: health.totalFound,
      missingFolders: health.missingFolders || [],
      validatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error in validateFolderProvisioning:', error);
    return {
      success: false,
      error: error.message,
      allFoldersPresent: false
    };
  }
}

/**
 * Validate that team folders (managers/suppliers) were created
 * @param {string} userId - User ID
 * @param {Array} managers - Manager list
 * @param {Array} suppliers - Supplier list
 * @param {string} provider - Email provider
 * @returns {Promise<Object>} Team folder validation result
 */
async function validateTeamFolders(userId, managers, suppliers, provider) {
  try {
    console.log('🔍 Validating team-specific folders...');
    
    // Get all folders from business_labels
    const { data: businessLabels, error } = await supabase
      .from('business_labels')
      .select('label_name, label_id')
      .eq('business_profile_id', userId)
      .eq('is_deleted', false);

    if (error) {
      throw error;
    }

    const folderNames = new Set(businessLabels?.map(l => l.label_name) || []);
    
    // Check for manager folders
    const missingManagers = managers.filter(m => !folderNames.has(m.name));
    const foundManagers = managers.filter(m => folderNames.has(m.name));
    
    // Check for supplier folders
    const missingSuppliers = suppliers.filter(s => !folderNames.has(s.name));
    const foundSuppliers = suppliers.filter(s => folderNames.has(s.name));
    
    const allTeamFoldersPresent = missingManagers.length === 0 && missingSuppliers.length === 0;
    
    return {
      success: true,
      allTeamFoldersPresent,
      managers: {
        total: managers.length,
        found: foundManagers.length,
        missing: missingManagers.map(m => m.name)
      },
      suppliers: {
        total: suppliers.length,
        found: foundSuppliers.length,
        missing: missingSuppliers.map(s => s.name)
      },
      validatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error in validateTeamFolders:', error);
    return {
      success: false,
      error: error.message,
      allTeamFoldersPresent: false
    };
  }
}

/**
 * Get immediate feedback on folder provisioning status
 * @param {Object} provisioningResult - Result from auto-provision function
 * @returns {Object} User-friendly feedback
 */
export function getFolderProvisioningFeedback(provisioningResult) {
  if (!provisioningResult) {
    return {
      type: 'error',
      title: 'Provisioning Failed',
      message: 'No result returned from folder provisioning',
      icon: '❌'
    };
  }

  if (provisioningResult.skipped) {
    return {
      type: 'info',
      title: 'Folders Not Created Yet',
      message: provisioningResult.message || 'Folders will be created later',
      icon: 'ℹ️'
    };
  }

  if (!provisioningResult.success) {
    return {
      type: 'error',
      title: 'Folder Creation Failed',
      message: provisioningResult.message || 'Failed to create email folders',
      details: provisioningResult.error,
      icon: '❌'
    };
  }

  // Success case
  const validation = provisioningResult.validation || {};
  const allFoldersPresent = validation.allFoldersPresent || false;
  
  if (allFoldersPresent) {
    return {
      type: 'success',
      title: 'Folders Created Successfully! ✅',
      message: provisioningResult.message || 'All email folders have been created',
      details: {
        created: provisioningResult.provisioning?.labelsCreated || 0,
        matched: provisioningResult.provisioning?.labelsMatched || 0,
        total: validation.totalFound || 0,
        healthPercentage: validation.healthPercentage || 100
      },
      icon: '✅'
    };
  } else {
    return {
      type: 'warning',
      title: 'Folders Partially Created ⚠️',
      message: `Created ${validation.totalFound || 0} of ${validation.totalExpected || 0} folders`,
      details: {
        missing: validation.missingFolders || [],
        healthPercentage: validation.healthPercentage || 0
      },
      icon: '⚠️'
    };
  }
}

