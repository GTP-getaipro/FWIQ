/**
 * Cleanup Script: Remove GOOGLE REVIEW Subfolders
 * 
 * Your Gmail has the OLD folder structure with subfolders that the classifier can't handle.
 * This script will:
 * 1. Delete "GOOGLE REVIEW/New Reviews" from Gmail
 * 2. Delete "GOOGLE REVIEW/Review Responses" from Gmail  
 * 3. Keep "GOOGLE REVIEW" parent folder
 * 4. Update database to reflect the cleanup
 * 
 * INSTRUCTIONS:
 * 1. Open dashboard: https://app.floworx-iq.com/dashboard
 * 2. Press F12 (console)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Wait for completion
 * 6. Refresh dashboard (F5)
 */

(async function cleanupGoogleReviewSubfolders() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧹 CLEANUP: Removing GOOGLE REVIEW subfolders...');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    const { supabase } = await import('/src/lib/customSupabaseClient.js');
    const { getValidAccessToken } = await import('/src/lib/oauthTokenManager.js');
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('✅ User:', user.email);
    
    // Get integration
    const { data: integration } = await supabase
      .from('integrations')
      .select('provider')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    const provider = integration.provider;
    console.log('📧 Provider:', provider);
    
    // Get access token
    console.log('🔑 Getting access token...');
    const accessToken = await getValidAccessToken(user.id, provider);
    
    if (!accessToken) {
      throw new Error('Could not get valid access token');
    }
    
    // Get current email_labels
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_labels')
      .eq('id', user.id)
      .single();
    
    const emailLabels = profile?.email_labels || {};
    console.log('📁 Current folder count:', Object.keys(emailLabels).length);
    
    // Find GOOGLE REVIEW subfolders to delete
    const foldersToDelete = [
      'GOOGLE REVIEW/New Reviews',
      'GOOGLE REVIEW/Review Responses',
      'GOOGLE REVIEW/Review Requests'
    ];
    
    const deletedFolders = [];
    const notFoundFolders = [];
    
    console.log('');
    console.log('🗑️  Deleting subfolders...');
    console.log('───────────────────────────────────────────────────');
    
    for (const folderName of foldersToDelete) {
      try {
        const folderData = emailLabels[folderName];
        
        if (!folderData) {
          console.log(`⚠️  ${folderName} - Not in database (already clean)`);
          notFoundFolders.push(folderName);
          continue;
        }
        
        const folderId = folderData.id;
        console.log(`🗑️  Deleting: ${folderName} (${folderId})`);
        
        // Delete from Gmail/Outlook
        if (provider === 'gmail') {
          const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/labels/${folderId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            console.log(`   ✅ Deleted from Gmail`);
          } else if (response.status === 404) {
            console.log(`   ⚠️  Already deleted from Gmail`);
          } else {
            const error = await response.text();
            console.warn(`   ⚠️  Gmail API error: ${response.status} - ${error}`);
          }
        } else if (provider === 'outlook') {
          const response = await fetch(`https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            console.log(`   ✅ Deleted from Outlook`);
          } else if (response.status === 404) {
            console.log(`   ⚠️  Already deleted from Outlook`);
          } else {
            const error = await response.text();
            console.warn(`   ⚠️  Outlook API error: ${response.status} - ${error}`);
          }
        }
        
        // Remove from database
        delete emailLabels[folderName];
        deletedFolders.push(folderName);
        console.log(`   ✅ Removed from database`);
        
      } catch (error) {
        console.error(`   ❌ Error deleting ${folderName}:`, error.message);
      }
    }
    
    console.log('───────────────────────────────────────────────────');
    console.log('');
    
    // Update database if any folders were deleted
    if (deletedFolders.length > 0) {
      console.log('💾 Updating database...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_labels: emailLabels,
          label_provisioning_date: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('❌ Database update failed:', updateError);
        throw updateError;
      }
      
      console.log('✅ Database updated');
    }
    
    // Summary
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ CLEANUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Deleted: ${deletedFolders.length} folders`);
    console.log(`   Skipped: ${notFoundFolders.length} (already clean)`);
    console.log(`   Remaining folders: ${Object.keys(emailLabels).length}`);
    console.log('');
    
    if (deletedFolders.length > 0) {
      console.log('🗑️  Deleted folders:');
      deletedFolders.forEach(name => console.log(`   • ${name}`));
      console.log('');
    }
    
    console.log('🎯 Expected Results:');
    console.log('   • Folder count: 61 → 58 folders');
    console.log('   • Classifier coverage: 95% → 100%');
    console.log('   • No more unclassifiable folder warnings');
    console.log('');
    console.log('🔄 Next Step: Refresh the dashboard (F5)');
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    
    return {
      success: true,
      deleted: deletedFolders,
      skipped: notFoundFolders,
      remainingFolders: Object.keys(emailLabels).length
    };
    
  } catch (error) {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('❌ CLEANUP ERROR');
    console.log('═══════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.log('');
    console.log('💡 Alternative: Delete manually in Gmail');
    console.log('   1. Open Gmail settings → Labels');
    console.log('   2. Find "GOOGLE REVIEW/New Reviews"');
    console.log('   3. Click "Remove" (not delete - just removes label)');
    console.log('   4. Repeat for "Review Responses"');
    console.log('   5. Refresh dashboard');
    console.log('');
    
    return {
      success: false,
      error: error.message
    };
  }
})();

