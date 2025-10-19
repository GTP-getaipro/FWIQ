#!/usr/bin/env node
/**
 * Email Folder Clearing Script
 * 
 * This script helps with testing by clearing all user-created folders 
 * from Gmail and Outlook email accounts. It's designed for manual testing
 * and should be used carefully in production environments.
 * 
 * Usage:
 *   node scripts/clear-email-folders.js [user-id] [provider]
 * 
 * Examples:
 *   node scripts/clear-email-folders.js
 *   node scripts/clear-email-folders.js fedf818f-986f-4b30-bfa1-7fc339c7bb60
 *   node scripts/clear-email-folders.js fedf818f-986f-4b30-bfa1-7fc339c7bb60 outlook
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Find existing labels/folders using API calls
 */
const findExistingLabels = async (provider, accessToken) => {
  const endpoints = {
    gmail: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
    outlook: 'https://graph.microsoft.com/v1.0/me/mailFolders'
  };

  try {
    const response = await fetch(endpoints[provider], {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${provider} labels/folders: ${response.status}`);
    }

    const data = await response.json();
    const existingMap = {};

    if (provider === 'gmail') {
      data.labels.forEach(label => {
        existingMap[label.name] = label.id;
      });
    } else if (provider === 'outlook') {
      const fetchAllFolders = async (folders, parentPath = '') => {
        for (const folder of folders) {
          const fullPath = parentPath ? `${parentPath}/${folder.displayName}` : folder.displayName;
          existingMap[fullPath] = { id: folder.id, displayName: folder.displayName };

          // Recursively fetch child folders
          if (folder.childFolderCount > 0) {
            try {
              const childResponse = await fetch(
                `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.id}/childFolders`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
              );
              
              if (childResponse.ok) {
                const childData = await childResponse.json();
                await fetchAllFolders(childData.value, fullPath);
              }
            } catch (error) {
              console.warn(`⚠️ Could not fetch child folders for ${folder.displayName}:`, error.message);
            }
          }
        }
      };

      await fetchAllFolders(data.value);
    }

    return existingMap;
  } catch (error) {
    console.error(`❌ Error finding existing ${provider} labels:`, error.message);
    return {};
  }
};

/**
 * Clear all user-created folders from email account
 */
const clearAllEmailFolders = async (userId, provider = null) => {
  console.log(`🗑️ Starting to clear all email folders for user: ${userId}`);
  
  const result = {
    success: false,
    deletedFolders: [],
    errors: [],
    provider: null
  };

  try {
    // Get user's integrations
    const { data: integrations, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .in('provider', ['gmail', 'outlook'])
      .eq('status', 'active');

    if (integrationError) {
      throw new Error(`Failed to fetch user integrations: ${integrationError.message}`);
    }

    if (!integrations || integrations.length === 0) {
      throw new Error('No active email integrations found for user');
    }

    // Filter to target provider if specified
    const targetIntegrations = provider ? integrations.filter(i => i.provider === provider) : integrations;
    
    if (targetIntegrations.length === 0) {
      throw new Error(`No active ${provider || 'email'} integrations found`);
    }

    console.log(`📧 Found ${targetIntegrations.length} email integration(s) to process`);

    // Process each integration
    for (const integration of targetIntegrations) {
      const currentProvider = integration.provider;
      result.provider = currentProvider;
      
      console.log(`🔄 Processing ${currentProvider} integration...`);

      try {
        // Get access token (try to refresh if needed)
        let accessToken = integration.access_token;
        
        // Simple token validation - in production you might want to refresh tokens here
        if (!accessToken) {
          throw new Error(`No valid access token available for ${currentProvider}`);
        }

        // Find all existing folders/labels
        const existingFolders = await findExistingLabels(currentProvider, accessToken);
        console.log(`📋 Found ${Object.keys(existingFolders).length} existing folders/labels`);

        // System folders/labels to skip (these should never be deleted)
        const systemItems = currentProvider === 'gmail' 
          ? ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'UNREAD', 'STARRED', 'IMPORTANT']
          : ['inbox', 'sentitems', 'drafts', 'spam', 'deleteditems', 'syncissues', 'junkemail', 'outbox', 'archivemail', 'clutter'];

        // Delete user-created folders/labels
        for (const [folderName, folderId] of Object.entries(existingFolders)) {
          // Skip system folders/labels
          if (systemItems.some(systemItem => folderName.toLowerCase().includes(systemItem.toLowerCase()))) {
            console.log(`⏭️ Skipping system ${currentProvider} item: ${folderName}`);
            continue;
          }

          try {
            console.log(`🗑️ Attempting to delete ${currentProvider} folder: ${folderName}`);
            
            let deleteResponse;
            
            if (currentProvider === 'gmail') {
              // Delete Gmail label
              deleteResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/labels/${folderId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
            } else if (currentProvider === 'outlook') {
              // Delete Outlook folder
              const actualFolderId = typeof folderId === 'object' ? folderId.id : folderId;
              deleteResponse = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${actualFolderId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
            }

            if (deleteResponse && deleteResponse.ok) {
              console.log(`✅ Successfully deleted ${currentProvider} folder: ${folderName}`);
              result.deletedFolders.push({
                provider: currentProvider,
                name: folderName,
                status: 'deleted'
              });
            } else {
              const errorText = deleteResponse ? await deleteResponse.text().catch(() => 'Unknown error') : 'No response';
              console.warn(`⚠️ Failed to delete ${currentProvider} folder '${folderName}': ${deleteResponse?.status || 'No response'} - ${errorText}`);
              result.errors.push({
                provider: currentProvider,
                folder: folderName,
                error: `Failed to delete: ${deleteResponse?.status || 'No response'}`
              });
            }

          } catch (deleteError) {
            console.error(`❌ Error deleting ${currentProvider} folder '${folderName}':`, deleteError.message);
            result.errors.push({
              provider: currentProvider,
              folder: folderName,
              error: deleteError.message
            });
          }
        }

        console.log(`✅ Completed processing ${currentProvider} integration`);

      } catch (providerError) {
        console.error(`❌ Error processing ${currentProvider} integration:`, providerError.message);
        result.errors.push({
          provider: currentProvider,
          error: providerError.message
        });
      }
    }

    // Mark as successful if at least some folders were deleted and no critical errors occurred
    result.success = result.deletedFolders.length > 0 || result.errors.length === 0;
    
    console.log(`🏁 Folder clearing completed. Deleted: ${result.deletedFolders.length}, Errors: ${result.errors.length}`);
    
    return result;

  } catch (error) {
    console.error('❌ Failed to clear email folders:', error.message);
    result.errors.push({ error: error.message });
    return result;
  }
};

/**
 * Main execution function
 */
const main = async () => {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const userId = args[0];
  const provider = args[1];

  console.log('🚀 Email Folder Clearing Script');
  console.log('================================');
  
  if (!userId) {
    console.error('❌ Please provide a user ID as the first argument');
    console.log('\nUsage: node scripts/clear-email-folders.js <user-id> [provider]');
    console.log('\nExamples:');
    console.log('  node scripts/clear-email-folders.js fedf818f-986f-4b30-bfa1-7fc339c7bb60');
    console.log('  node scripts/clear-email-folders.js fedf818f-986f-4b30-bfa1-7fc339c7bb60 outlook');
    console.log('  node scripts/clear-email-folders.js fedf818f-986f-4b30-bfa1-7fc339c7bb60 gmail');
    process.exit(1);
  }

  if (provider && !['gmail', 'outlook'].includes(provider.toLowerCase())) {
    console.error('❌ Provider must be either "gmail" or "outlook"');
    process.exit(1);
  }

  console.log(`👤 User ID: ${userId}`);
  if (provider) {
    console.log(`📧 Provider: ${provider}`);
  } else {
    console.log(`📧 Provider: Auto-detect (all providers)`);
  }
  console.log('');

  try {
    const result = await clearAllEmailFolders(userId, provider?.toLowerCase());
    
    console.log('\n📊 RESULTS:');
    console.log('===========');
    console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`📧 Provider: ${result.provider || 'Multiple/None'}`);
    console.log(`🗑️ Folders Deleted: ${result.deletedFolders.length}`);
    console.log(`❌ Errors: ${result.errors.length}`);

    if (result.deletedFolders.length > 0) {
      console.log('\n🗑️ Deleted Folders:');
      result.deletedFolders.forEach((folder, index) => {
        console.log(`  ${index + 1}. ${folder.name} (${folder.provider})`);
      });
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, index) => {
        if (error.folder) {
          console.log(`  ${index + 1}. ${error.folder} (${error.provider}): ${error.error}`);
        } else {
          console.log(`  ${index + 1}. ${error.error}`);
        }
      });
    }

    if (result.success) {
      console.log('\n🎉 Email folders cleared successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Folder clearing completed with some issues.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
main().catch(console.error);
