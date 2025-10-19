/**
 * CORRECTED Folder Migration Script
 * 
 * This script migrates from the current flat folder structure to the proper
 * hierarchical structure that respects the existing poolsSpasLabels.js organization.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { CORRECTED_UNIFIED_STRUCTURE, FOLDER_MIGRATION_MAP, getCorrectedFolderStructure } from './correctedUnifiedFolderStructure.js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Fetch current Outlook folders from Microsoft Graph API
 */
async function fetchCurrentOutlookFolders(accessToken) {
  try {
    console.log('📁 Fetching current Outlook folders...');
    
    const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch folders: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.value.length} folders`);
    
    return data.value.map(folder => ({
      id: folder.id,
      name: folder.displayName,
      parentId: folder.parentFolderId,
      childFolderCount: folder.childFolderCount,
      unreadItemCount: folder.unreadItemCount,
      totalItemCount: folder.totalItemCount
    }));
  } catch (error) {
    console.error('❌ Error fetching Outlook folders:', error);
    throw error;
  }
}

/**
 * Create parent category folders in Outlook
 */
async function createParentFolders(accessToken, userId, businessType) {
  console.log('🏗️ Creating parent category folders...');
  
  const parentFolders = Object.entries(CORRECTED_UNIFIED_STRUCTURE).map(([key, category]) => ({
    name: category.category,
    category: category.category,
    intent: category.category.toLowerCase(),
    sort_order: category.sort_order,
    color: category.color,
    isParent: true,
    level: 1
  }));

  const createdFolders = [];
  
  for (const folder of parentFolders) {
    try {
      console.log(`📁 Creating parent folder: ${folder.name}`);
      
      const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: folder.name
        })
      });

      if (response.ok) {
        const folderData = await response.json();
        createdFolders.push({
          ...folder,
          provider_id: folderData.id,
          provider: 'outlook'
        });
        console.log(`✅ Created: ${folder.name} (${folderData.id})`);
      } else if (response.status === 409) {
        console.log(`⚠️ Folder already exists: ${folder.name}`);
        // Try to find existing folder
        const existingFolders = await fetchCurrentOutlookFolders(accessToken);
        const existing = existingFolders.find(f => f.name === folder.name);
        if (existing) {
          createdFolders.push({
            ...folder,
            provider_id: existing.id,
            provider: 'outlook'
          });
        }
      } else {
        console.error(`❌ Failed to create ${folder.name}:`, await response.text());
      }
    } catch (error) {
      console.error(`❌ Error creating ${folder.name}:`, error);
    }
  }

  return createdFolders;
}

/**
 * Move existing folders into their correct parent categories
 */
async function moveFoldersToParents(accessToken, currentFolders, parentFolders) {
  console.log('🔄 Moving folders to correct parent categories...');
  
  const movedFolders = [];
  
  for (const folder of currentFolders) {
    const migration = FOLDER_MIGRATION_MAP[folder.name];
    if (!migration) {
      console.log(`⚠️ No migration mapping for: ${folder.name}`);
      continue;
    }

    const parentFolder = parentFolders.find(p => p.name === migration.parent);
    if (!parentFolder) {
      console.log(`⚠️ Parent folder not found: ${migration.parent}`);
      continue;
    }

    try {
      console.log(`📁 Moving ${folder.name} to ${parentFolder.name}...`);
      
      // Move folder to parent
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${folder.id}/move`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destinationId: parentFolder.provider_id
        })
      });

      if (response.ok) {
        const movedData = await response.json();
        movedFolders.push({
          name: folder.name,
          provider_id: movedData.id,
          provider: 'outlook',
          category: migration.category,
          intent: migration.intent,
          path: `${migration.category}/${folder.name}`,
          parent_id: parentFolder.provider_id,
          level: 2,
          isParent: false,
          hasChildren: false
        });
        console.log(`✅ Moved: ${folder.name} to ${parentFolder.name}`);
      } else {
        console.error(`❌ Failed to move ${folder.name}:`, await response.text());
      }
    } catch (error) {
      console.error(`❌ Error moving ${folder.name}:`, error);
    }
  }

  return movedFolders;
}

/**
 * Update Supabase with the new folder structure
 */
async function updateSupabaseWithNewStructure(userId, businessType, parentFolders, movedFolders) {
  console.log('💾 Updating Supabase with new folder structure...');
  
  const allFolders = [...parentFolders, ...movedFolders];
  
  for (const folder of allFolders) {
    try {
      const { error } = await supabase
        .from('business_labels')
        .upsert({
          label_id: folder.provider_id,
          label_name: folder.name,
          provider: folder.provider,
          business_profile_id: userId,
          business_type: businessType,
          category: folder.category,
          intent: folder.intent,
          path: folder.path,
          parent_id: folder.parent_id || null,
          synced_at: new Date().toISOString(),
          is_deleted: false,
          level: folder.level || 1,
          is_parent: folder.isParent || false,
          has_children: folder.hasChildren || false,
          color: folder.color || null,
          sort_order: folder.sort_order || 0
        }, {
          onConflict: 'label_id'
        });

      if (error) {
        console.error(`❌ Error updating Supabase for ${folder.name}:`, error);
      } else {
        console.log(`✅ Updated Supabase: ${folder.name}`);
      }
    } catch (error) {
      console.error(`❌ Error updating Supabase for ${folder.name}:`, error);
    }
  }
}

/**
 * Generate n8n Label Generator node with corrected structure
 */
function generateN8nLabelGenerator(parentFolders, movedFolders) {
  console.log('🔧 Generating n8n Label Generator node...');
  
  const allFolders = [...parentFolders, ...movedFolders];
  
  // Create the Label Generator node structure
  const labelGeneratorNode = {
    "parameters": {
      "values": {
        "string": allFolders.map(folder => ({
          name: folder.name,
          value: folder.provider_id
        }))
      },
      "options": {}
    },
    "id": "LabelGenerator",
    "name": "Label Generator",
    "type": "n8n-nodes-base.set",
    "typeVersion": 3.1,
    "position": [240, 300],
    "webhookId": "label-generator"
  };

  // Create environment variables mapping
  const envVars = {};
  allFolders.forEach(folder => {
    const envVarName = `LABEL_${folder.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    envVars[envVarName] = folder.provider_id;
  });

  return {
    labelGeneratorNode,
    envVars,
    folderCount: allFolders.length,
    parentCount: parentFolders.length,
    subfolderCount: movedFolders.length
  };
}

/**
 * Main migration function
 */
export async function migrateToCorrectedStructure(userId, businessType, accessToken) {
  try {
    console.log('🚀 Starting CORRECTED folder structure migration...');
    console.log(`👤 User: ${userId}`);
    console.log(`🏢 Business Type: ${businessType}`);
    
    // Step 1: Fetch current folders
    const currentFolders = await fetchCurrentOutlookFolders(accessToken);
    console.log(`📊 Current folders: ${currentFolders.length}`);
    
    // Step 2: Create parent category folders
    const parentFolders = await createParentFolders(accessToken, userId, businessType);
    console.log(`📁 Created parent folders: ${parentFolders.length}`);
    
    // Step 3: Move existing folders to correct parents
    const movedFolders = await moveFoldersToParents(accessToken, currentFolders, parentFolders);
    console.log(`🔄 Moved folders: ${movedFolders.length}`);
    
    // Step 4: Update Supabase
    await updateSupabaseWithNewStructure(userId, businessType, parentFolders, movedFolders);
    
    // Step 5: Generate n8n configuration
    const n8nConfig = generateN8nLabelGenerator(parentFolders, movedFolders);
    
    // Step 6: Generate summary report
    const summary = {
      migration: 'CORRECTED_UNIFIED_STRUCTURE',
      timestamp: new Date().toISOString(),
      userId,
      businessType,
      stats: {
        originalFolders: currentFolders.length,
        parentFolders: parentFolders.length,
        movedFolders: movedFolders.length,
        totalNewStructure: parentFolders.length + movedFolders.length
      },
      structure: {
        categories: parentFolders.map(f => f.name),
        subfolders: movedFolders.map(f => `${f.category}/${f.name}`)
      },
      n8nConfig: {
        nodeGenerated: true,
        envVarsCount: Object.keys(n8nConfig.envVars).length,
        labelGeneratorReady: true
      }
    };
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Summary:', JSON.stringify(summary, null, 2));
    
    return {
      success: true,
      summary,
      n8nConfig,
      parentFolders,
      movedFolders
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const userId = process.argv[2];
  const businessType = process.argv[3];
  const accessToken = process.argv[4];
  
  if (!userId || !businessType || !accessToken) {
    console.error('❌ Usage: node migrateToCorrectedStructure.js <userId> <businessType> <accessToken>');
    process.exit(1);
  }
  
  migrateToCorrectedStructure(userId, businessType, accessToken)
    .then(result => {
      if (result.success) {
        console.log('🎉 Migration completed successfully!');
        process.exit(0);
      } else {
        console.error('💥 Migration failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

