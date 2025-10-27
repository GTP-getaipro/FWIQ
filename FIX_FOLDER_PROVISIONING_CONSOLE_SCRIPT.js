/**
 * Browser Console Script to Fix Missing Folder Provisioning
 * 
 * USER: The Hot Tub Man (40b2d58f-b0f1-4645-9f2f-12373a889bc8)
 * ISSUE: Folders never provisioned during onboarding
 * 
 * INSTRUCTIONS:
 * 1. Open browser console (F12) while on dashboard
 * 2. Copy and paste this entire script
 * 3. Press Enter and wait for completion
 * 4. Refresh the dashboard after completion
 */

(async function fixFolderProvisioning() {
  console.log('🚀 Starting folder provisioning fix...');
  console.log('==================================================');
  
  try {
    // Get Supabase client from window
    const supabase = window.supabase;
    if (!supabase) {
      throw new Error('Supabase client not found. Make sure you are on the dashboard page.');
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    console.log('✅ User authenticated:', user.id);
    console.log('📧 User email:', user.email);
    
    // Step 1: Check current state
    console.log('\n📊 Step 1: Checking current state...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }
    
    console.log('✅ Profile found');
    console.log('  - Business type:', profile.client_config?.business_type || profile.client_config?.business_types || 'Not set');
    console.log('  - Onboarding step:', profile.onboarding_step);
    console.log('  - Current folders:', Object.keys(profile.email_labels || {}).length);
    console.log('  - Managers:', profile.managers?.length || 0);
    console.log('  - Suppliers:', profile.suppliers?.length || 0);
    
    // Step 2: Check integration
    console.log('\n📧 Step 2: Checking email integration...');
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (integrationError || !integration) {
      throw new Error('No active email integration found');
    }
    
    console.log('✅ Integration found');
    console.log('  - Provider:', integration.provider);
    console.log('  - N8N Credential ID:', integration.n8n_credential_id);
    console.log('  - Last sync:', integration.last_sync || 'Never');
    
    // Step 3: Determine business type
    const businessType = profile.client_config?.business_type || 
                         profile.client_config?.business_types?.[0] ||
                         'Pools & Spas'; // Default for Hot Tub Man
    
    console.log('\n🏢 Step 3: Business type determined:', businessType);
    
    // Step 4: Import and run provisioning service
    console.log('\n🔧 Step 4: Running folder provisioning...');
    console.log('⏳ This may take 30-60 seconds...');
    
    // Dynamic import of provisioning service
    const { provisionLabelSchemaFor } = await import('/src/lib/labelProvisionService.js');
    
    // Run provisioning with full options
    const provisioningResult = await provisionLabelSchemaFor(user.id, businessType, {
      skeletonOnly: false,      // Create full structure
      injectTeamFolders: true   // Include manager/supplier folders
    });
    
    console.log('\n✅ Provisioning completed!');
    console.log('📊 Results:');
    console.log('  - Success:', provisioningResult.success);
    console.log('  - Labels created:', Object.keys(provisioningResult.labelMap || {}).length);
    console.log('  - Provider:', provisioningResult.provider);
    
    if (provisioningResult.error) {
      console.error('⚠️ Provisioning had errors:', provisioningResult.error);
    }
    
    // Step 5: Verify folders were created
    console.log('\n🔍 Step 5: Verifying folder creation...');
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('email_labels')
      .eq('id', user.id)
      .single();
    
    if (verifyError) {
      console.warn('⚠️ Could not verify folders:', verifyError.message);
    } else {
      const folderCount = Object.keys(updatedProfile.email_labels || {}).length;
      console.log('✅ Verification complete');
      console.log('  - Folders in database:', folderCount);
      
      if (folderCount === 0) {
        console.error('❌ No folders found after provisioning!');
        console.error('   This means provisioning failed silently.');
      }
    }
    
    // Step 6: Check if we need to update n8n workflow
    console.log('\n🔄 Step 6: Checking n8n workflow status...');
    const { data: deployment, error: deploymentError } = await supabase
      .from('n8n_deployments')
      .select('*')
      .eq('user_id', user.id)
      .order('deployed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (deployment) {
      console.log('✅ N8N workflow found');
      console.log('  - Workflow ID:', deployment.workflow_id);
      console.log('  - Version:', deployment.workflow_version);
      console.log('  - Status:', deployment.status);
      console.log('  - Deployed:', deployment.deployed_at);
      
      console.log('\n💡 The workflow may need to be redeployed with new folder IDs');
      console.log('   Click "Reconfigure & Redeploy" button on dashboard to update');
    } else {
      console.warn('⚠️ No n8n deployment found');
    }
    
    // Summary
    console.log('\n==================================================');
    console.log('✅ FOLDER PROVISIONING FIX COMPLETE!');
    console.log('==================================================');
    console.log('\n📋 Summary:');
    console.log(`  - User: ${user.email}`);
    console.log(`  - Business: ${businessType}`);
    console.log(`  - Folders created: ${Object.keys(provisioningResult.labelMap || {}).length}`);
    console.log(`  - Provider: ${integration.provider}`);
    console.log('\n🎯 Next Steps:');
    console.log('  1. Refresh the dashboard (F5)');
    console.log('  2. Check "Folder Health" widget - should show X/X folders (100%)');
    console.log('  3. If workflow needs update, click "Reconfigure & Redeploy"');
    console.log('  4. Send a test email to verify automation');
    console.log('\n💡 The dashboard should update within 5 minutes');
    
    return {
      success: true,
      foldersCreated: Object.keys(provisioningResult.labelMap || {}).length,
      provider: integration.provider,
      businessType: businessType
    };
    
  } catch (error) {
    console.error('\n❌ ERROR during folder provisioning fix:');
    console.error(error);
    console.error('\n📋 Error details:');
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);
    
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Make sure you are logged in and on the dashboard');
    console.log('  2. Check browser console for additional errors');
    console.log('  3. Try refreshing the page and running script again');
    console.log('  4. If issue persists, contact support with error message above');
    
    return {
      success: false,
      error: error.message
    };
  }
})();

