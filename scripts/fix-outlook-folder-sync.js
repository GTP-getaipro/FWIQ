/**
 * Fix Outlook Folder Synchronization Issues
 * This script addresses the specific problems with Outlook folder reprocessing and provisioning
 */

import { supabase } from '../src/lib/customSupabaseClient.js';

async function fixOutlookFolderSync() {
  console.log("🔧 FIXING OUTLOOK FOLDER SYNCHRONIZATION ISSUES");
  console.log("=" .repeat(60));
  
  try {
    // Get all users with Outlook integrations
    const { data: integrations, error } = await supabase
      .from('email_integrations')
      .select(`
        id,
        user_id,
        provider,
        status,
        access_token,
        refresh_token,
        n8n_credential_id,
        created_at,
        updated_at
      `)
      .eq('provider', 'outlook')
      .eq('status', 'active');
    
    if (error) {
      throw new Error(`Failed to fetch Outlook integrations: ${error.message}`);
    }
    
    console.log(`📊 Found ${integrations.length} active Outlook integrations to fix`);
    
    if (integrations.length === 0) {
      console.log("ℹ️ No active Outlook integrations found");
      return;
    }
    
    // Fix each integration
    for (const integration of integrations) {
      console.log(`\n🔧 FIXING INTEGRATION ${integration.id}:`);
      console.log("-".repeat(40));
      
      const fixResult = await fixIntegration(integration);
      console.log(`   Result: ${fixResult.success ? '✅ Success' : '❌ Failed'}`);
      if (fixResult.message) {
        console.log(`   Message: ${fixResult.message}`);
      }
      if (fixResult.actions) {
        console.log(`   Actions taken: ${fixResult.actions.join(', ')}`);
      }
    }
    
    // Apply global fixes
    console.log(`\n🌐 APPLYING GLOBAL FIXES:`);
    console.log("-".repeat(40));
    
    const globalFixes = await applyGlobalFixes();
    globalFixes.forEach(fix => {
      console.log(`   ${fix.success ? '✅' : '❌'} ${fix.description}`);
    });
    
    console.log(`\n🎯 FIX COMPLETE!`);
    console.log("=" .repeat(60));
    
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  }
}

async function fixIntegration(integration) {
  const actions = [];
  let success = true;
  let message = '';
  
  try {
    // Check if access token is valid
    if (!integration.access_token || integration.access_token.length < 100) {
      console.log(`   🔄 Access token invalid, attempting refresh...`);
      
      // Try to refresh the token
      const refreshResult = await refreshIntegrationToken(integration);
      if (refreshResult.success) {
        actions.push('Token refreshed');
        console.log(`   ✅ Token refreshed successfully`);
      } else {
        actions.push('Token refresh failed');
        console.log(`   ❌ Token refresh failed: ${refreshResult.error}`);
        success = false;
        message = `Token refresh failed: ${refreshResult.error}`;
      }
    }
    
    // Check if user has proper email labels configuration
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email_labels, business_types')
      .eq('id', integration.user_id)
      .single();
    
    if (profileError) {
      actions.push('Profile check failed');
      success = false;
      message = `Profile check failed: ${profileError.message}`;
    } else {
      // Check if email labels need to be provisioned
      if (!profile.email_labels || Object.keys(profile.email_labels).length === 0) {
        console.log(`   🔄 No email labels configured, provisioning...`);
        
        const provisionResult = await provisionEmailLabels(integration.user_id, profile.business_types);
        if (provisionResult.success) {
          actions.push('Email labels provisioned');
          console.log(`   ✅ Email labels provisioned successfully`);
        } else {
          actions.push('Email labels provisioning failed');
          console.log(`   ❌ Email labels provisioning failed: ${provisionResult.error}`);
          success = false;
          message = `Email labels provisioning failed: ${provisionResult.error}`;
        }
      } else {
        actions.push('Email labels already configured');
        console.log(`   ✅ Email labels already configured`);
      }
    }
    
    // Update integration timestamp to mark as recently processed
    const { error: updateError } = await supabase
      .from('email_integrations')
      .update({ 
        updated_at: new Date().toISOString(),
        last_sync_attempt: new Date().toISOString()
      })
      .eq('id', integration.id);
    
    if (updateError) {
      console.log(`   ⚠️ Failed to update integration timestamp: ${updateError.message}`);
    } else {
      actions.push('Integration timestamp updated');
    }
    
    if (success && !message) {
      message = 'Integration fixed successfully';
    }
    
  } catch (error) {
    success = false;
    message = error.message;
    actions.push('Fix failed');
  }
  
  return { success, message, actions };
}

async function refreshIntegrationToken(integration) {
  try {
    // Import the OAuth token manager
    const { refreshOAuthToken } = await import('../src/lib/oauthTokenManager.js');
    
    // Attempt to refresh the token
    const refreshResult = await refreshOAuthToken(
      'outlook',
      integration.refresh_token,
      integration.user_id,
      integration.id
    );
    
    return {
      success: true,
      accessToken: refreshResult.accessToken,
      refreshToken: refreshResult.refreshToken
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function provisionEmailLabels(userId, businessTypes) {
  try {
    // Import the label provisioning system
    const { generateSystemMessageWithLabels } = await import('../src/lib/labelLibrary.js');
    
    // Generate labels based on business types
    const labelSchema = generateSystemMessageWithLabels([], { businessTypes }, [], []);
    
    // Update the user profile with email labels
    const { error } = await supabase
      .from('profiles')
      .update({ 
        email_labels: labelSchema,
        labels_provisioned_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Failed to update profile with email labels: ${error.message}`);
    }
    
    return { success: true };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function applyGlobalFixes() {
  const fixes = [];
  
  try {
    // Fix 1: Add missing columns to email_integrations table
    console.log(`   🔄 Adding missing columns to email_integrations table...`);
    
    const { error: columnError } = await supabase.rpc('add_missing_integration_columns');
    if (columnError) {
      fixes.push({
        success: false,
        description: `Failed to add missing columns: ${columnError.message}`
      });
    } else {
      fixes.push({
        success: true,
        description: 'Added missing columns to email_integrations table'
      });
    }
    
    // Fix 2: Update integration status for stale integrations
    console.log(`   🔄 Updating stale integration statuses...`);
    
    const { error: statusError } = await supabase
      .from('email_integrations')
      .update({ 
        status: 'needs_refresh',
        last_sync_attempt: new Date().toISOString()
      })
      .eq('provider', 'outlook')
      .eq('status', 'active')
      .lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Older than 7 days
    
    if (statusError) {
      fixes.push({
        success: false,
        description: `Failed to update stale integrations: ${statusError.message}`
      });
    } else {
      fixes.push({
        success: true,
        description: 'Updated stale integration statuses'
      });
    }
    
    // Fix 3: Clean up orphaned integration records
    console.log(`   🔄 Cleaning up orphaned integration records...`);
    
    const { error: cleanupError } = await supabase
      .from('email_integrations')
      .delete()
      .eq('provider', 'outlook')
      .eq('status', 'inactive')
      .lt('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Older than 30 days
    
    if (cleanupError) {
      fixes.push({
        success: false,
        description: `Failed to clean up orphaned records: ${cleanupError.message}`
      });
    } else {
      fixes.push({
        success: true,
        description: 'Cleaned up orphaned integration records'
      });
    }
    
  } catch (error) {
    fixes.push({
      success: false,
      description: `Global fixes failed: ${error.message}`
    });
  }
  
  return fixes;
}

// Run the fix
fixOutlookFolderSync();
