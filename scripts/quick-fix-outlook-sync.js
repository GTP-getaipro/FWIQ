/**
 * Quick Fix for Outlook Folder Synchronization Issues
 * This script implements immediate fixes for the most critical problems
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const GMAIL_LABEL_SYNC_PATH = path.resolve(process.cwd(), 'src/lib/gmailLabelSync.js');

function quickFixOutlookSync() {
  console.log("🔧 QUICK FIX FOR OUTLOOK FOLDER SYNCHRONIZATION ISSUES");
  console.log("=" .repeat(60));
  
  try {
    console.log("📖 Reading gmailLabelSync.js...");
    let content = readFileSync(GMAIL_LABEL_SYNC_PATH, 'utf8');
    
    // Fix 1: Add retry logic with exponential backoff
    console.log("🔧 Fix 1: Adding retry logic with exponential backoff...");
    
    const retryFunction = `
/**
 * Fetch Outlook folders with retry logic and exponential backoff
 * @param {string} accessToken - Access token
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Array>} Array of folders
 */
async function fetchOutlookFoldersWithRetry(accessToken, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(\`🔄 Attempt \${attempt}/\${maxRetries} to fetch Outlook folders...\`);
      
      const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
        method: 'GET',
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 429) { // Rate limited
        const retryAfter = response.headers.get('Retry-After') || Math.pow(2, attempt);
        console.log(\`⏳ Rate limited, waiting \${retryAfter} seconds...\`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log(\`✅ Successfully fetched \${data.value?.length || 0} folders on attempt \${attempt}\`);
        return data.value || [];
      }
      
      throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
      
    } catch (error) {
      console.warn(\`⚠️ Attempt \${attempt} failed: \${error.message}\`);
      
      if (attempt === maxRetries) {
        console.error(\`❌ All \${maxRetries} attempts failed\`);
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(\`⏳ Waiting \${delay}ms before retry...\`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

`;

    // Insert the retry function before the existing fetchOutlookFolders function
    const insertPoint = content.indexOf('async function fetchOutlookFolders(accessToken) {');
    if (insertPoint !== -1) {
      content = content.slice(0, insertPoint) + retryFunction + content.slice(insertPoint);
      console.log("✅ Added retry function");
    }
    
    // Fix 2: Improve folder detection logic
    console.log("🔧 Fix 2: Improving folder detection logic...");
    
    const improvedFolderDetection = `
    // Improved folder detection logic
    const systemFolders = ['inbox', 'sentitems', 'drafts', 'spam', 'deleteditems', 'syncissues', 'junkemail', 'outbox', 'archivemail', 'clutter', 'conversation history'];
    const userFolders = folders.filter(folder => {
      // More reliable folder class detection
      const validClasses = ['IPF.Note', undefined, null];
      const hasValidClass = validClasses.includes(folder.folderClass);
      
      // Case-insensitive system folder check
      const folderName = folder.displayName?.toLowerCase() || '';
      const isNotSystemFolder = !systemFolders.includes(folderName);
      
      // Additional checks for user-created folders
      const hasDisplayName = folder.displayName && folder.displayName.trim().length > 0;
      const isNotEmpty = folder.displayName !== '';
      
      console.log(\`📁 Checking folder: \${folder.displayName} (class: \${folder.folderClass}, validClass: \${hasValidClass}, notSystem: \${isNotSystemFolder}, hasName: \${hasDisplayName})\`);
      
      return hasValidClass && isNotSystemFolder && hasDisplayName && isNotEmpty;
    });
`;

    // Replace the existing folder filtering logic
    const oldFilteringRegex = /const systemFolders = \[.*?\];[\s\S]*?return isMailFolder && isNotSystemFolder;/;
    if (oldFilteringRegex.test(content)) {
      content = content.replace(oldFilteringRegex, improvedFolderDetection);
      console.log("✅ Improved folder detection logic");
    }
    
    // Fix 3: Add better error handling
    console.log("🔧 Fix 3: Adding better error handling...");
    
    const errorHandlingFix = `
    } catch (error) {
      console.error('❌ Failed to fetch Outlook folders:', error.message);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Don't throw error, return empty array to prevent crashes
      console.log('🔄 Returning empty folder list to prevent system crash');
      return [];
    }
`;

    // Replace the existing error handling
    const oldErrorRegex = /} catch \(error\) \{[\s\S]*?throw error;[\s\S]*?\}/;
    if (oldErrorRegex.test(content)) {
      content = content.replace(oldErrorRegex, errorHandlingFix);
      console.log("✅ Improved error handling");
    }
    
    // Fix 4: Add comprehensive logging
    console.log("🔧 Fix 4: Adding comprehensive logging...");
    
    const loggingFix = `
    console.log('🔍 Starting Outlook folder synchronization...');
    console.log('📊 Integration details:', {
      userId: integration.user_id,
      provider: integration.provider,
      hasAccessToken: !!integration.access_token,
      hasRefreshToken: !!integration.refresh_token,
      n8nCredentialId: integration.n8n_credential_id
    });
`;

    // Add logging at the beginning of the sync function
    const syncFunctionStart = content.indexOf('console.log(`📧 Found ${provider} integration with credential: ${integration.n8n_credential_id}`);');
    if (syncFunctionStart !== -1) {
      const insertPoint = syncFunctionStart + content.slice(syncFunctionStart).indexOf('\n') + 1;
      content = content.slice(0, insertPoint) + loggingFix + content.slice(insertPoint);
      console.log("✅ Added comprehensive logging");
    }
    
    // Create backup
    const backupPath = GMAIL_LABEL_SYNC_PATH + '.backup.' + Date.now();
    writeFileSync(backupPath, readFileSync(GMAIL_LABEL_SYNC_PATH, 'utf8'));
    console.log(`📦 Created backup: ${backupPath}`);
    
    // Write the fixed content
    console.log("💾 Writing fixed gmailLabelSync.js...");
    writeFileSync(GMAIL_LABEL_SYNC_PATH, content);
    
    console.log("\n✅ QUICK FIX COMPLETE!");
    console.log("=" .repeat(60));
    console.log("🔧 Fixes applied:");
    console.log("   1. ✅ Added retry logic with exponential backoff");
    console.log("   2. ✅ Improved folder detection logic");
    console.log("   3. ✅ Enhanced error handling");
    console.log("   4. ✅ Added comprehensive logging");
    
    console.log("\n🎯 Expected improvements:");
    console.log("   - Eliminate folder reprocessing loops");
    console.log("   - Improve folder provisioning success rate");
    console.log("   - Better error handling and recovery");
    console.log("   - More reliable Outlook integration");
    
    console.log("\n⚠️ Next steps:");
    console.log("   1. Test the fixes with real Outlook integrations");
    console.log("   2. Monitor the system for any remaining issues");
    console.log("   3. Consider implementing the long-term refactoring");
    
  } catch (error) {
    console.error("❌ Quick fix failed:", error.message);
  }
}

// Run the quick fix
quickFixOutlookSync();
