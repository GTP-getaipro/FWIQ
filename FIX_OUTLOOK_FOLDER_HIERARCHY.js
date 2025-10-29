/**
 * Fix Outlook Folder Hierarchy - Reorganize Misplaced Folders
 * Run this in browser console at app.floworx-iq.com/dashboard
 * 
 * This will:
 * 1. Find all misplaced folders at root level
 * 2. Delete them from root
 * 3. Recreate them under proper parent folders
 */

(async function fixOutlookFolderHierarchy() {
  console.log('🔧 Starting Outlook folder hierarchy fix...');
  
  const userId = '40b2d58f-b0f1-4645-9f2f-12373a889bc8'; // Your user ID
  
  // Import required functions
  const { supabase } = await import('/src/lib/customSupabaseClient.js');
  const { getValidAccessToken } = await import('/src/lib/oauthTokenManager.js');
  
  try {
    // Step 1: Get access token
    console.log('🔑 Step 1: Getting Outlook access token...');
    const accessToken = await getValidAccessToken(userId, 'outlook');
    
    if (!accessToken) {
      console.error('❌ No valid Outlook access token found');
      return;
    }
    
    console.log('✅ Access token obtained');
    
    // Step 2: Fetch current folder structure
    console.log('📁 Step 2: Fetching current Outlook folders...');
    const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders?$top=200', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch folders:', await response.text());
      return;
    }
    
    const data = await response.json();
    const allFolders = data.value || [];
    
    console.log(`📊 Found ${allFolders.length} folders total`);
    
    // Step 3: Find parent folders
    const parentFolders = {
      SUPPORT: allFolders.find(f => f.displayName === 'SUPPORT'),
      SUPPLIERS: allFolders.find(f => f.displayName === 'SUPPLIERS'),
      URGENT: allFolders.find(f => f.displayName === 'URGENT'),
      SALES: allFolders.find(f => f.displayName === 'SALES'),
      PHONE: allFolders.find(f => f.displayName === 'PHONE'),
      MANAGER: allFolders.find(f => f.displayName === 'MANAGER')
    };
    
    console.log('🔍 Step 3: Parent folder status:');
    Object.entries(parentFolders).forEach(([name, folder]) => {
      if (folder) {
        console.log(`  ✅ ${name}: Found (ID: ${folder.id})`);
      } else {
        console.log(`  ❌ ${name}: MISSING - needs creation`);
      }
    });
    
    // Step 4: Create missing parent folders
    console.log('📁 Step 4: Creating missing parent folders...');
    for (const [name, folder] of Object.entries(parentFolders)) {
      if (!folder) {
        console.log(`🔨 Creating parent folder: ${name}`);
        const createResponse = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ displayName: name })
        });
        
        if (createResponse.ok) {
          const created = await createResponse.json();
          parentFolders[name] = created;
          console.log(`✅ Created ${name} (ID: ${created.id})`);
        } else {
          console.error(`❌ Failed to create ${name}:`, await createResponse.text());
        }
      }
    }
    
    // Step 5: Define misplaced folders and their correct parents
    const folderMappings = {
      'Accessory Sales': 'SALES',
      'Consultations': 'SALES',
      'New Spa Sales': 'SALES',
      'Quote Requests': 'SALES',
      'Social Media': 'SALES',
      'Voicemails': 'SALES',
      
      'Appointment Scheduling': 'SUPPORT',
      'General': 'SUPPORT',
      'Technical Support': 'SUPPORT',
      'Parts And Chemicals': 'SUPPORT',
      
      'Emergency Repairs': 'URGENT',
      'Leak Emergencies': 'URGENT',
      'Power Outages': 'URGENT',
      'Other': 'URGENT',
      
      'Incoming Calls': 'PHONE',
      
      'StrongSpas': 'SUPPLIERS',
      'AquaSpaPoolSupply': 'SUPPLIERS',
      'ParadisePatioFurnitureLtd': 'SUPPLIERS',
      'WaterwayPlastics': 'SUPPLIERS'
    };
    
    // Step 6: Find and reorganize misplaced folders
    console.log('🔄 Step 5: Reorganizing misplaced folders...');
    let fixed = 0;
    let errors = 0;
    
    for (const [folderName, correctParent] of Object.entries(folderMappings)) {
      const folder = allFolders.find(f => f.displayName === folderName && !f.parentFolderId);
      
      if (folder) {
        console.log(`🔨 Found misplaced folder: ${folderName} (should be under ${correctParent})`);
        
        // Check if parent exists
        const parent = parentFolders[correctParent];
        if (!parent) {
          console.error(`❌ Parent ${correctParent} not found for ${folderName}, skipping`);
          errors++;
          continue;
        }
        
        try {
          // Delete from root
          console.log(`  🗑️ Deleting from root: ${folderName}`);
          const deleteResponse = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${folder.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          
          if (!deleteResponse.ok) {
            console.warn(`⚠️ Could not delete ${folderName}:`, await deleteResponse.text());
          } else {
            console.log(`  ✅ Deleted ${folderName} from root`);
          }
          
          // Wait a bit for deletion to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Recreate under correct parent
          console.log(`  📁 Recreating under ${correctParent}...`);
          const createResponse = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${parent.id}/childFolders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ displayName: folderName })
          });
          
          if (createResponse.ok) {
            const created = await createResponse.json();
            console.log(`  ✅ Recreated ${folderName} under ${correctParent} (ID: ${created.id})`);
            fixed++;
          } else {
            console.error(`  ❌ Failed to recreate ${folderName}:`, await createResponse.text());
            errors++;
          }
          
          // Wait between operations to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Error processing ${folderName}:`, error);
          errors++;
        }
      }
    }
    
    console.log('');
    console.log('✨ ===== OUTLOOK FOLDER FIX COMPLETE =====');
    console.log(`✅ Fixed: ${fixed} folders`);
    console.log(`❌ Errors: ${errors} folders`);
    console.log('');
    console.log('🔄 Refresh your Outlook to see the updated folder structure!');
    
  } catch (error) {
    console.error('❌ Fix script failed:', error);
  }
})();

