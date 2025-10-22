// Dynamic Label Provisioning Service
// This service creates labels based on business card schemas
// Updated to use sync-then-create pattern for label ID integrity
// Supports multi-business type schema merging

import { supabase } from '@/lib/customSupabaseClient';
import { getBusinessCard } from '@/lib/businessCards';
import { FolderIntegrationManager } from './labelSyncValidator';
import { getCompleteSchemaForBusiness } from './baseMasterSchema';
import { mergeBusinessTypeSchemas } from './labelSchemaMerger';
import { getExistingLabels } from './labelSyncService';
import { labelColors } from './labelSyncValidator';

/**
 * Process schema using base master schema with business extensions
 * Supports both single and multiple business types
 * @param {string|array} businessType - Business type(s)
 * @param {Array} managers - Array of manager objects
 * @param {Array} suppliers - Array of supplier objects
 * @returns {Object} Processed schema with placeholders replaced
 */
function processDynamicSchema(businessType, managers = [], suppliers = []) {
  // Handle array of business types (multi-business mode)
  const businessTypes = Array.isArray(businessType) ? businessType : [businessType];
  
  console.log(`🔄 Processing schema for ${businessTypes.length} business type(s):`, {
    types: businessTypes,
    managers: managers.length,
    suppliers: suppliers.length
  });

  // If multiple business types, use schema merger
  if (businessTypes.length > 1) {
    console.log('📦 Using multi-business schema merger for:', businessTypes);
    const mergedSchema = mergeBusinessTypeSchemas(businessTypes);
    
    // Replace dynamic variables in merged schema
    return replaceDynamicVariables(mergedSchema, managers, suppliers);
  }

  // Single business type - use existing master schema system
  return getCompleteSchemaForBusiness(businessTypes[0], managers, suppliers);
}

/**
 * Replace dynamic variables in a schema
 * @param {object} schema - Label schema with {{Manager1}}, {{Supplier1}} placeholders
 * @param {array} managers - Manager objects
 * @param {array} suppliers - Supplier objects
 * @returns {object} - Schema with replaced variables
 */
function replaceDynamicVariables(schema, managers = [], suppliers = []) {
  const schemaClone = JSON.parse(JSON.stringify(schema));
  
  if (!schemaClone.labels) return schemaClone;
  
  // Replace manager placeholders
  schemaClone.labels.forEach(label => {
    if (label.sub && Array.isArray(label.sub)) {
      label.sub = label.sub.map(subLabel => {
        // Replace {{Manager1}}, {{Manager2}}, etc.
        const managerMatch = subLabel.name.match(/\{\{Manager(\d+)\}\}/);
        if (managerMatch) {
          const managerIndex = parseInt(managerMatch[1]) - 1;
          if (managers[managerIndex]) {
            return { ...subLabel, name: managers[managerIndex].name };
          }
          return null; // Remove placeholder if no manager
        }
        
        // Replace {{Supplier1}}, {{Supplier2}}, etc.
        const supplierMatch = subLabel.name.match(/\{\{Supplier(\d+)\}\}/);
        if (supplierMatch) {
          const supplierIndex = parseInt(supplierMatch[1]) - 1;
          if (suppliers[supplierIndex]) {
            return { ...subLabel, name: suppliers[supplierIndex].name };
          }
          return null; // Remove placeholder if no supplier
        }
        
        return subLabel;
      }).filter(s => s !== null); // Remove null placeholders
    }
  });
  
  return schemaClone;
}

/**
 * Provisions labels for specific business type(s) based on schema(s)
 * Uses sync-then-create pattern to ensure label ID integrity
 * Supports both single and multiple business types with intelligent schema merging
 * 
 * @param {string} userId - User ID
 * @param {string|array} businessType - Business type(s) (e.g., 'Pools & Spas' or ['Electrician', 'Plumber'])
 * @returns {Promise<Object>} - Result with labelMap and success status
 */
export async function provisionLabelSchemaFor(userId, businessType) {
  const businessTypes = Array.isArray(businessType) ? businessType : [businessType];
  console.log(`🚀 Provisioning labels for ${businessTypes.length} business type(s):`, businessTypes);
  
  try {
    // Get client configuration (managers, suppliers, and business_types) from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('managers, suppliers, business_types, business_type')
      .eq('id', userId)
      .single();

    const managers = profile?.managers || [];
    const suppliers = profile?.suppliers || [];
    
    // If businessType not provided, use from profile
    let finalBusinessTypes = businessTypes;
    if (!businessType || (Array.isArray(businessType) && businessType.length === 0)) {
      finalBusinessTypes = profile?.business_types || (profile?.business_type ? [profile.business_type] : []);
      console.log('📋 Using business types from profile:', finalBusinessTypes);
    }

    console.log(`📋 Client configuration loaded:`, {
      businessTypes: finalBusinessTypes,
      managers: managers.length,
      suppliers: suppliers.length
    });

    // Process schema with dynamic placeholder replacement
    // Supports both single and multiple business types
    const schema = processDynamicSchema(finalBusinessTypes, managers, suppliers);
    console.log(`📋 Processed schema for ${finalBusinessTypes.length} business type(s):`, {
      topLevelCategories: schema.labels?.length || 0,
      hasIndustryCategories: schema.labels?.some(l => !['BANKING', 'MANAGER', 'SUPPLIERS', 'SUPPORT', 'SALES', 'URGENT', 'MISC'].includes(l.name))
    });

    // Get active email integration
    const { data: integrations } = await supabase
      .from('integrations')
      .select('provider, status, n8n_credential_id, access_token')
      .eq('user_id', userId)
      .in('provider', ['gmail', 'outlook'])
      .eq('status', 'active')
      .single();

    if (!integrations) {
      throw new Error('No active email integration found');
    }

    console.log(`📧 Found ${integrations.provider} integration for user ${userId}`);
    
    // Get business profile ID first (needed for sync)
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!businessProfile?.id) {
      throw new Error('No business profile found for user');
    }

    const businessProfileId = businessProfile.id;
    console.log(`📋 Using business profile ID: ${businessProfileId}`);
    
    // CRITICAL: Sync current Gmail label state with database first
    console.log('🔄 Syncing current Gmail label state with database...');
    const { syncGmailLabelsWithDatabase } = await import('@/lib/gmailLabelSync.js');
    const syncResult = await syncGmailLabelsWithDatabase(userId, integrations.provider, businessProfileId, businessTypes[0]);
    
    if (!syncResult.success) {
      console.warn(`⚠️ Label sync failed: ${syncResult.error}`);
    } else {
      console.log(`✅ Label sync completed: ${syncResult.message}`);
      console.log(`📊 Current label state: ${syncResult.currentLabels} labels found`);
    }
    
    // Check if manual deletion was detected - if so, create labels immediately
    if (syncResult.manualDeletionDetected) {
      console.log('⚠️ Manual deletion detected - creating labels immediately instead of waiting for n8n');
      console.log('🔄 Proceeding with direct label creation...');
    } else if (syncResult.currentLabels === 0) {
      console.log('⚠️ No labels found in email provider - creating labels immediately');
      console.log('🔄 Proceeding with direct label creation...');
    } else {
      // Check if we have existing folders that match our schema
      console.log(`📊 Found ${syncResult.currentLabels} existing folders in ${integrations.provider}`);
      console.log('📁 Existing folders:', Object.keys(syncResult.labelMap || {}));
      
      // For Outlook, we should always proceed with folder mapping since folders already exist
      if (integrations.provider === 'outlook' && syncResult.currentLabels > 0) {
        console.log('📧 Outlook provider with existing folders - proceeding with folder mapping');
        console.log('🔄 Proceeding with direct folder mapping...');
      } else {
        // Labels will be created automatically during n8n workflow deployment
        console.log('ℹ️ Labels will be created automatically during n8n workflow deployment');
        
        // Return success with sync result - labels will be provisioned by n8n
        return {
          success: true,
          skipped: true,
          reason: 'labels_provisioned_by_n8n',
          message: 'Labels will be created automatically during n8n workflow deployment.',
          businessType: businessTypes.join(' + '),
          labelMap: syncResult.labelMap || {},
          labelsCreated: 0,
          totalLabels: 0,
          syncResult: syncResult
        };
      }
    }

    // Continue with normal provisioning for direct API access
    // Note: businessProfileId is already obtained above

    // Note: Label sync is already handled above with syncGmailLabelsWithDatabase
    // This ensures database state matches actual Gmail state before provisioning

    // Get existing labels from database (after sync)
    // Note: This should now return 0 labels if manual deletion was detected and cleanup was performed
    const existingLabels = await getExistingLabels(businessProfileId, integrations.provider);
    console.log(`📋 Found ${existingLabels.length} existing labels in database (after sync)`);
    
    // If manual deletion was detected, verify the cleanup worked
    if (syncResult.manualDeletionDetected && existingLabels.length > 0) {
      console.log('⚠️ Manual deletion detected but database still has labels - this indicates cleanup failed');
      console.log('🗑️ Manually marking existing labels as deleted...');
      
      // Mark all existing labels as deleted as a fallback
      const { error: deleteError } = await supabase
        .from('business_labels')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('business_profile_id', businessProfileId)
        .eq('provider', integrations.provider)
        .eq('is_deleted', false);
        
      if (deleteError) {
        console.warn('⚠️ Failed to mark labels as deleted:', deleteError.message);
      } else {
        console.log('✅ Manually marked existing labels as deleted');
        
        // Re-fetch existing labels after cleanup
        const { data: cleanedLabels } = await supabase
          .from('business_labels')
          .select('*')
          .eq('business_profile_id', businessProfileId)
          .eq('provider', integrations.provider)
          .eq('is_deleted', false);
          
        console.log(`📋 After cleanup: ${cleanedLabels?.length || 0} existing labels in database`);
      }
    }

    // Get provisioning order if available (for Pools & Spas schema)
    let provisioningOrder = null;
    if (businessType === 'Pools & Spas') {
      try {
        const { provisioningOrder: order } = await import('./poolsSpasLabels.js');
        provisioningOrder = order;
        console.log(`📋 Using provisioning order for ${businessType}:`, provisioningOrder);
      } catch (error) {
        console.warn('⚠️ Could not load provisioning order, using schema order');
      }
    }

    // Convert schema to standard labels format (use enhanced version for comprehensive schemas)
    const standardLabels = convertComprehensiveSchemaToStandardLabels(schema, provisioningOrder);
    
    // ✨ NEW: Add dynamic supplier and manager folders
    console.log('🔄 Step 1.5: Adding dynamic team folders...');
    const enhancedStandardLabels = await addDynamicTeamFolders(standardLabels, userId);
    console.log(`🔄 Enhanced schema with team folders:`, enhancedStandardLabels);

    // ✨ NEW: Check if all required folders are already present
    console.log('🔍 Step 1.75: Checking if folder provisioning is needed...');
    
    // If manual deletion was detected OR database cleanup failed, force recreation of all labels
    let allFoldersPresent = false;
    if (syncResult.manualDeletionDetected || (syncResult.manualDeletionDetected && existingLabels.length > 0)) {
      console.log('⚠️ Manual deletion detected - forcing label recreation');
      allFoldersPresent = false;
    } else {
    // ✨ FIXED: Check for core business structure folders while supporting dynamic injection
    console.log('🔍 Checking for core business structure folders...');
    console.log('📋 Enhanced schema folders (including dynamic):', Object.keys(enhancedStandardLabels));
    console.log('📁 Existing folders from sync:', Object.keys(syncResult.labelMap || {}));
    
    // Define core business structure folders that must exist (excluding dynamic ones)
    const coreBusinessFolders = [
      'BANKING', 'FORMSUB', 'GOOGLE REVIEW', 'MANAGER', 'SALES', 
      'SUPPLIERS', 'SUPPORT', 'URGENT', 'MISC', 'PHONE', 'PROMO', 
      'RECRUITMENT', 'SOCIALMEDIA', 'SEASONAL'
    ];
    
    console.log('📋 Core business structure folders:', coreBusinessFolders);
    
    // Check if core business folders exist (ignore dynamic manager/supplier folders)
    const existingFolderNames = Object.keys(syncResult.labelMap || {});
    const coreFoldersPresent = coreBusinessFolders.filter(coreFolder => 
      existingFolderNames.some(existing => 
        existing.toLowerCase() === coreFolder.toLowerCase()
      )
    );
    
    console.log('🔍 Core business folders found:', coreFoldersPresent);
    console.log('🔍 Core business folders missing:', coreBusinessFolders.filter(f => !coreFoldersPresent.includes(f)));
    
    // If less than 70% of core business folders exist, force recreation
    if (coreFoldersPresent.length < coreBusinessFolders.length * 0.7) {
      console.log('⚠️ Less than 70% of core business folders exist - forcing recreation');
      console.log(`📊 Found ${coreFoldersPresent.length}/${coreBusinessFolders.length} core folders`);
      allFoldersPresent = false;
    } else {
      // Use the standard check for all folders (including dynamic ones)
      allFoldersPresent = checkIfAllFoldersPresent(enhancedStandardLabels, existingLabels);
    }
    }
    
    if (allFoldersPresent) {
      console.log('✅ All required folders are already present! Skipping provisioning.');
      
      // Build label map from existing labels
      const labelMap = buildLabelMapFromExisting(existingLabels, schema);
      console.log(`🗺️ Built label map from existing labels:`, labelMap);
      
      // Store label map in user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          email_labels: labelMap,
          onboarding_step: 'business_type' // Allow user to proceed
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      console.log(`💾 Stored label map in profile for user ${userId}`);

      return {
        success: true,
        labelMap,
        businessType,
        provider: integrations.provider,
        labelsCreated: 0,
        labelsMatched: existingLabels.length,
        totalLabels: existingLabels.length,
        skipped: true,
        message: 'All folders already present, provisioning skipped'
      };
    }

    // Create FolderIntegrationManager instance
    const manager = new FolderIntegrationManager(
      integrations.provider,
      integrations.access_token,
      userId
    );

    // ✨ UPDATED: Create business structure labels with dynamic injection support
    // This creates core business folders (BANKING, SALES, SUPPORT, etc.) AND dynamic folders (managers/suppliers)
    console.log('🔄 Step 2: Creating business structure labels with dynamic injection...');
    console.log('📋 Creating labels for Hot tub & Spa business:', Object.keys(enhancedStandardLabels));
    console.log('🔍 Dynamic folders will be created for managers and suppliers');
    const result = await manager.integrateAllFolders(enhancedStandardLabels, existingLabels);
    console.log(`✅ Integration result:`, result);

    // Build label map from results
    const labelMap = buildLabelMapFromResults(result, schema);
    console.log(`🗺️ Built label map:`, labelMap);

    // Store label map in user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        email_labels: labelMap,
        onboarding_step: 'business_type' // Allow user to proceed
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    console.log(`💾 Stored label map in profile for user ${userId}`);

    return {
      success: true,
      labelMap,
      businessType,
      provider: integrations.provider,
      labelsCreated: result.created?.length || 0,
      labelsMatched: result.matched?.length || 0,
      totalLabels: (result.created?.length || 0) + (result.matched?.length || 0),
      skipped: false,
      message: `Created ${result.created?.length || 0} new labels and matched ${result.matched?.length || 0} existing labels`
    };

  } catch (error) {
    console.error(`❌ Error provisioning labels for ${businessType}:`, error);
    
    // Update onboarding step to allow user to continue even if labels fail
    await supabase
      .from('profiles')
      .update({ onboarding_step: 'business_type' })
      .eq('id', userId);

    return {
      success: false,
      error: error.message,
      businessType,
      labelMap: {},
      labelsCreated: 0,
      labelsMatched: 0,
      totalLabels: 0
    };
  }
}

/**
 * Converts business card schema to standard labels format
 * @param {Object} schema - Label schema from business card
 * @returns {Array} - Standard labels array
 */
function convertSchemaToStandardLabels(schema) {
  const standardLabels = [];

  for (const [parentName, config] of Object.entries(schema)) {
    const parentLabel = {
      name: parentName,
      sub: []
    };

    // Add sub-labels
    if (config.sub && Array.isArray(config.sub)) {
      parentLabel.sub = config.sub.map(subName => ({
        name: subName,
        sub: []
      }));

      // Add nested labels
      if (config.nested) {
        for (const [subName, nestedLabels] of Object.entries(config.nested)) {
          const subLabel = parentLabel.sub.find(s => s.name === subName);
          if (subLabel && Array.isArray(nestedLabels)) {
            subLabel.sub = nestedLabels.map(nestedName => ({
              name: nestedName,
              sub: []
            }));
          }
        }
      }
    }

    standardLabels.push(parentLabel);
  }

  return standardLabels;
}

/**
 * Add dynamic supplier and manager folders to standard labels
 * @param {Object} standardLabels - Base standard labels
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Enhanced standard labels with team folders
 */
async function addDynamicTeamFolders(standardLabels, userId) {
  try {
    console.log('🔍 Fetching team data for dynamic folders...');
    
    // Get user's team data from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('managers, suppliers')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('⚠️ Could not fetch team data:', error.message);
      return standardLabels;
    }

    const enhancedLabels = { ...standardLabels };
    
    // Add dynamic SUPPLIER folder with supplier names (streamlined)
    if (profile.suppliers && profile.suppliers.length > 0) {
      console.log(`📁 Processing ${profile.suppliers.length} suppliers from team setup`);
      const supplierNames = profile.suppliers
        .filter(supplier => supplier.name && supplier.name.trim() !== '')
        .map(supplier => supplier.name.trim());
      
      if (supplierNames.length > 0) {
        // Override SUPPLIERS folder with dynamic supplier names
        if (enhancedLabels['SUPPLIERS']) {
          enhancedLabels['SUPPLIERS'].sub = supplierNames;
          enhancedLabels['SUPPLIERS'].dynamic = true;
          console.log(`✅ Updated SUPPLIERS folder with ${supplierNames.length} suppliers: ${supplierNames.join(', ')}`);
        }

        // ✨ NEW: Create top-level supplier folders
        console.log(`🔄 Adding ${supplierNames.length} top-level supplier folders:`, supplierNames);
        supplierNames.forEach(supplierName => {
          console.log(`🔄 Processing supplier folder: ${supplierName}`);
          enhancedLabels[supplierName] = {
            sub: [],
            color: labelColors['SUPPLIERS'], // Use same color as SUPPLIERS category (null for Outlook)
            dynamic: true,
            type: 'supplier'
          };
          console.log(`✅ Added top-level supplier folder: ${supplierName}`);
        });
      } else {
        console.log(`⚠️ No valid supplier names found - using default SUPPLIERS structure`);
      }
    } else {
      console.log(`ℹ️ No suppliers in team setup - using default SUPPLIERS structure`);
    }

    // Add dynamic MANAGER subfolders with manager names (streamlined)
    if (profile.managers && profile.managers.length > 0) {
      console.log(`📁 Processing ${profile.managers.length} managers from team setup`);
      const managerNames = profile.managers
        .filter(manager => manager.name && manager.name.trim() !== '')
        .map(manager => manager.name.trim());
      
      if (managerNames.length > 0) {
        // Override MANAGER folder with Unassigned + dynamic manager names only
        if (enhancedLabels['MANAGER']) {
          enhancedLabels['MANAGER'].sub = [
            "Unassigned",
            ...managerNames
          ];
          enhancedLabels['MANAGER'].dynamic = true;
          console.log(`✅ Updated MANAGER folder with Unassigned + ${managerNames.length} managers: ${managerNames.join(', ')}`);
        }

        // ✨ NEW: Create top-level manager folders
        console.log(`🔄 Adding ${managerNames.length} top-level manager folders:`, managerNames);
        managerNames.forEach(managerName => {
          console.log(`🔄 Processing manager folder: ${managerName}`);
          enhancedLabels[managerName] = {
            sub: [],
            color: labelColors['MANAGER'], // Use same color as MANAGER category (null for Outlook)
            dynamic: true,
            type: 'manager'
          };
          console.log(`✅ Added top-level manager folder: ${managerName}`);
        });
      } else {
        console.log(`⚠️ No valid manager names found - MANAGER folder will have Unassigned only`);
        if (enhancedLabels['MANAGER']) {
          enhancedLabels['MANAGER'].sub = ["Unassigned"];
        }
      }
    } else {
      console.log(`ℹ️ No managers in team setup - using default MANAGER structure`);
    }

    return enhancedLabels;

  } catch (error) {
    console.error('❌ Failed to add dynamic team folders:', error);
    return standardLabels; // Return original labels if enhancement fails
  }
}

/**
 * @param {Object} schema - Label schema from business card
 * @param {Array} provisioningOrder - Optional provisioning order array
 * @returns {Array} - Standard labels array with proper color handling
 */
function convertComprehensiveSchemaToStandardLabels(schema, provisioningOrder = null) {
  const standardLabels = {};
  
  // Extract only the labels array from the schema, not the metadata
  const labels = schema.labels || [];
  
  // Use provisioning order if available, otherwise use schema order
  const labelOrder = provisioningOrder || labels.map(label => label.name);

  for (const parentName of labelOrder) {
    const labelConfig = labels.find(label => label.name === parentName);
    if (!labelConfig) continue;

    // Process sub-labels and filter out empty/null values
    const processedSubLabels = [];
    const nestedStructure = {};
    
    if (labelConfig.sub && Array.isArray(labelConfig.sub)) {
      for (const subLabel of labelConfig.sub) {
        // Handle both string and object formats
        const subName = typeof subLabel === 'string' ? subLabel : subLabel.name;
        
        // Skip empty, null, or placeholder values
        if (!subName || subName.trim() === '' || subName.includes('{{') || subName.includes('}}')) {
          continue;
        }
        
        processedSubLabels.push(subName.trim());
        
        // Check if this sub-label has tertiary children
        if (typeof subLabel === 'object' && subLabel.sub && Array.isArray(subLabel.sub)) {
          const tertiaryLabels = [];
          for (const tertiaryLabel of subLabel.sub) {
            const tertiaryName = typeof tertiaryLabel === 'string' ? tertiaryLabel : tertiaryLabel.name;
            if (tertiaryName && tertiaryName.trim() !== '' && !tertiaryName.includes('{{') && !tertiaryName.includes('}}')) {
              tertiaryLabels.push(tertiaryName.trim());
            }
          }
          
          if (tertiaryLabels.length > 0) {
            nestedStructure[subName.trim()] = tertiaryLabels;
          }
        }
      }
    }

    // Convert to the object format expected by FolderIntegrationManager
    standardLabels[parentName] = {
      sub: processedSubLabels,
      nested: nestedStructure,
      // Include enhanced metadata
      color: labelConfig.color || null,
      description: labelConfig.description || null,
      n8nEnvVar: labelConfig.n8nEnvVar || null,
      intent: labelConfig.intent || null,
      critical: labelConfig.critical || false
    };
  }

  return standardLabels;
}

/**
 * Generate a short, unique n8n-friendly variable name for a label
 * @param {string} labelName - Full label name (e.g., "BANKING/Receipts/Payment Sent")
 * @returns {string} - Short n8n variable name (e.g., "BANK_RCPT_SENT")
 */
function generateN8nVariableName(labelName) {
  // Remove leading/trailing spaces
  const cleaned = labelName.trim();
  
  // Handle hierarchical labels (e.g., "BANKING/Receipts/Payment Sent")
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    
    // Primary category: first 4-5 letters
    const primary = parts[0].substring(0, 5).toUpperCase();
    
    // Secondary: first 4 letters
    const secondary = parts[1] ? parts[1].replace(/\s+/g, '').substring(0, 4).toUpperCase() : '';
    
    // Tertiary: first 4 letters
    const tertiary = parts[2] ? parts[2].replace(/\s+/g, '').substring(0, 4).toUpperCase() : '';
    
    // Combine with underscores
    return [primary, secondary, tertiary].filter(Boolean).join('_');
  }
  
  // For single-level labels, use abbreviation rules
  const words = cleaned.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/);
  
  if (words.length === 1) {
    // Single word: use first 6-8 characters
    return words[0].substring(0, 8).toUpperCase();
  } else if (words.length === 2) {
    // Two words: use first 4 chars of each
    return words.map(w => w.substring(0, 4)).join('_').toUpperCase();
  } else {
    // Multiple words: use first 3 chars of each word (max 3 words)
    return words.slice(0, 3).map(w => w.substring(0, 3)).join('_').toUpperCase();
  }
}

/**
 * Builds label map from integration results
 * @param {Object} result - Integration result
 * @param {Object} schema - Original schema
 * @returns {Object} - Label map with IDs (using n8n-friendly variable names)
 */
function buildLabelMapFromResults(result, schema) {
  const labelMap = {};

  // Handle the case where result might be undefined or have different structure
  if (!result) {
    console.warn('⚠️ No result provided to buildLabelMapFromResults');
    return labelMap;
  }

  // Process created labels - handle both old and new result formats
  const createdLabels = result.created || result.summary?.details?.created || [];
  
  for (const created of createdLabels) {
    const labelName = created.name;
    const labelId = created.id;
    
    // Generate n8n-friendly variable name
    const n8nVarName = generateN8nVariableName(labelName);
    labelMap[n8nVarName] = labelId;
  }

  // Process matched labels - handle both old and new result formats
  const matchedLabels = result.matched || result.summary?.details?.matched || [];
  
  for (const matched of matchedLabels) {
    const labelName = matched.name;
    const labelId = matched.id;
    
    // Generate n8n-friendly variable name
    const n8nVarName = generateN8nVariableName(labelName);
    labelMap[n8nVarName] = labelId;
  }

  console.log(`🗺️ Built label map with ${Object.keys(labelMap).length} n8n-friendly variable names`);
  return labelMap;
}

/**
 * Checks if labels are already provisioned for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Status of label provisioning
 */
export async function checkLabelProvisioningStatus(userId) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_labels, onboarding_step')
      .eq('id', userId)
      .single();

    const hasLabels = profile?.email_labels && Object.keys(profile.email_labels).length > 0;
    const labelCount = hasLabels ? Object.keys(profile.email_labels).length : 0;

    return {
      hasLabels,
      labelCount,
      labelMap: profile?.email_labels || {},
      onboardingStep: profile?.onboarding_step
    };
  } catch (error) {
    console.error('Error checking label provisioning status:', error);
    return {
      hasLabels: false,
      labelCount: 0,
      labelMap: {},
      onboardingStep: null
    };
  }
}

/**
 * Gets label schema preview for a business type
 * @param {string} businessType - Business type
 * @returns {Object} - Schema preview
 */
export function getLabelSchemaPreview(businessType) {
  const businessCard = getBusinessCard(businessType);
  if (!businessCard?.labelSchema) {
    return null;
  }

  const schema = businessCard.labelSchema;
  const preview = {};

  for (const [parent, config] of Object.entries(schema)) {
    preview[parent] = {
      sub: config.sub || [],
      nested: config.nested || {}
    };
  }

  return preview;
}

/**
 * Check if all required folders are already present
 * @param {Object} standardLabels - Standard labels object with required structure
 * @param {Array} existingLabels - Array of existing labels from database
 * @returns {boolean} - True if all folders are present
 */
function checkIfAllFoldersPresent(standardLabels, existingLabels) {
  try {
    // Create a set of existing label names for quick lookup
    const existingLabelNames = new Set(existingLabels.map(label => label.label_name));
    
    // Track missing folders
    const missingFolders = [];
    const matchedFolders = [];
    
    console.log(`🔍 Checking folder presence for ${Object.keys(standardLabels).length} categories against ${existingLabels.length} existing folders`);
    console.log('📁 Existing folders:', Array.from(existingLabelNames));
    
    // Check each primary category
    for (const [categoryName, categoryConfig] of Object.entries(standardLabels)) {
      console.log(`🔍 Checking category: ${categoryName}`);
      
      // Check if primary category exists (case-insensitive for Outlook)
      const categoryExists = Array.from(existingLabelNames).some(existingName => 
        existingName.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (categoryExists) {
        matchedFolders.push(categoryName);
        console.log(`✅ Found primary category: ${categoryName}`);
      } else {
        missingFolders.push(categoryName);
        console.log(`❌ Missing primary category: ${categoryName}`);
        continue; // If primary is missing, no need to check children
      }
      
      // Check secondary categories (subfolders)
      if (categoryConfig.sub && categoryConfig.sub.length > 0) {
        for (const subFolderName of categoryConfig.sub) {
          // For Outlook, check if subfolder exists as a separate folder
          const subFolderExists = Array.from(existingLabelNames).some(existingName => 
            existingName.toLowerCase() === subFolderName.toLowerCase()
          );
          
          if (subFolderExists) {
            matchedFolders.push(subFolderName);
            console.log(`✅ Found subfolder: ${subFolderName}`);
          } else {
            // For Gmail, also check hierarchical name (e.g., "BANKING/Invoice")
            const hierarchicalName = `${categoryName}/${subFolderName}`;
            const hierarchicalExists = existingLabelNames.has(hierarchicalName);
            
            if (hierarchicalExists) {
              matchedFolders.push(hierarchicalName);
              console.log(`✅ Found hierarchical subfolder: ${hierarchicalName}`);
            } else {
              missingFolders.push(subFolderName);
              console.log(`❌ Missing subfolder: ${subFolderName}`);
            }
          }
        }
      }
      
      // Check tertiary categories (nested) - only for Gmail
      if (categoryConfig.nested && Object.keys(categoryConfig.nested).length > 0) {
        for (const [nestedParentName, nestedChildren] of Object.entries(categoryConfig.nested)) {
          for (const nestedChildName of nestedChildren) {
            // For Gmail, check hierarchical name (e.g., "BANKING/Receipts/Payment Sent")
            const hierarchicalName = `${categoryName}/${nestedParentName}/${nestedChildName}`;
            
            if (existingLabelNames.has(hierarchicalName)) {
              matchedFolders.push(hierarchicalName);
              console.log(`✅ Found nested folder: ${hierarchicalName}`);
            } else {
              missingFolders.push(hierarchicalName);
              console.log(`❌ Missing nested folder: ${hierarchicalName}`);
            }
          }
        }
      }
    }
    
    console.log(`📊 Folder analysis complete:`);
    console.log(`  ✅ Matched: ${matchedFolders.length} folders`);
    console.log(`  ❌ Missing: ${missingFolders.length} folders`);
    
    if (missingFolders.length > 0) {
      console.log(`📋 Missing folders:`, missingFolders.slice(0, 10));
      return false;
    }
    
    console.log(`✅ All required folders are present (${matchedFolders.length} matched, ${existingLabels.length} total in DB)`);
    return true;
    
  } catch (error) {
    console.error('❌ Error checking folder presence:', error);
    return false; // If check fails, proceed with provisioning to be safe
  }
}

/**
 * Map existing Outlook folders to schema
 * @param {Object} standardLabels - Standard labels object with required structure
 * @param {Object} currentLabelMap - Current label map from sync
 * @returns {Object} - Mapping result with success status and mapped labels
 */
function mapExistingOutlookFoldersToSchema(standardLabels, currentLabelMap) {
  try {
    console.log('🔄 Mapping existing Outlook folders to schema...');
    console.log('📁 Current folders:', Object.keys(currentLabelMap));
    
    const mappedLabels = [];
    const unmappedFolders = [];
    const requiredFolders = [];
    
    // Extract all required folder names from schema
    for (const [categoryName, categoryConfig] of Object.entries(standardLabels)) {
      requiredFolders.push(categoryName);
      
      if (categoryConfig.sub && categoryConfig.sub.length > 0) {
        requiredFolders.push(...categoryConfig.sub);
      }
      
      if (categoryConfig.nested && Object.keys(categoryConfig.nested).length > 0) {
        for (const [nestedParentName, nestedChildren] of Object.entries(categoryConfig.nested)) {
          requiredFolders.push(nestedParentName);
          requiredFolders.push(...nestedChildren);
        }
      }
    }
    
    console.log('📋 Required folders from schema:', requiredFolders);
    
    // Try to map each existing folder to a required folder
    for (const [folderName, folderData] of Object.entries(currentLabelMap)) {
      // Find matching required folder (case-insensitive)
      const matchingRequiredFolder = requiredFolders.find(required => 
        required.toLowerCase() === folderName.toLowerCase()
      );
      
      if (matchingRequiredFolder) {
        mappedLabels.push({
          label_name: folderName,
          label_id: folderData.id,
          provider: 'outlook',
          mapped_to: matchingRequiredFolder
        });
        console.log(`✅ Mapped: ${folderName} -> ${matchingRequiredFolder}`);
      } else {
        unmappedFolders.push(folderName);
        console.log(`⚠️ Unmapped: ${folderName}`);
      }
    }
    
    // Check if we have enough mapped folders to consider it successful
    const mappedFolderNames = mappedLabels.map(l => l.label_name.toLowerCase());
    const requiredFolderNames = requiredFolders.map(f => f.toLowerCase());
    const mappedRequiredCount = requiredFolderNames.filter(required => 
      mappedFolderNames.includes(required)
    ).length;
    
    const success = mappedRequiredCount >= requiredFolders.length * 0.7; // 70% threshold
    
    console.log(`📊 Mapping analysis:`);
    console.log(`  ✅ Mapped: ${mappedLabels.length} folders`);
    console.log(`  ⚠️ Unmapped: ${unmappedFolders.length} folders`);
    console.log(`  📋 Required: ${requiredFolders.length} folders`);
    console.log(`  🎯 Mapped required: ${mappedRequiredCount} folders`);
    console.log(`  ✅ Success: ${success ? 'Yes' : 'No'} (${Math.round(mappedRequiredCount / requiredFolders.length * 100)}%)`);
    
    return {
      success,
      mappedLabels,
      unmappedFolders,
      requiredFolders,
      mappedRequiredCount,
      totalRequired: requiredFolders.length,
      coverage: Math.round(mappedRequiredCount / requiredFolders.length * 100)
    };
    
  } catch (error) {
    console.error('❌ Error mapping Outlook folders to schema:', error);
    return {
      success: false,
      error: error.message,
      mappedLabels: [],
      unmappedFolders: [],
      requiredFolders: [],
      mappedRequiredCount: 0,
      totalRequired: 0,
      coverage: 0
    };
  }
}

/**
 * Build label map from existing labels with n8n-friendly variable names
 * @param {Array} existingLabels - Array of existing labels from database
 * @param {Object} schema - Original schema
 * @returns {Object} - Label map with n8n-friendly keys and label IDs
 */
function buildLabelMapFromExisting(existingLabels, schema) {
  const labelMap = {};
  
  try {
    // Process each existing label and generate n8n variable name
    for (const label of existingLabels) {
      const labelName = label.label_name;
      const labelId = label.label_id;
      
      // Generate n8n-friendly variable name
      const n8nVarName = generateN8nVariableName(labelName);
      labelMap[n8nVarName] = labelId;
    }
    
    console.log(`🗺️ Built label map with ${Object.keys(labelMap).length} n8n-friendly variable names from existing labels`);
    return labelMap;
    
  } catch (error) {
    console.error('❌ Error building label map from existing labels:', error);
    return {};
  }
}
