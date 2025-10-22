#!/usr/bin/env node

/**
 * Manual Label Sync Script
 * 
 * This script manually syncs Gmail labels to the business_labels table
 * for a specific user to fix folder health check issues.
 * 
 * Usage: node scripts/manual-label-sync.js --userId=USER_ID
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function manualLabelSync(userId) {
  console.log(`🔄 Starting manual label sync for user: ${userId}`);
  
  try {
    // Step 1: Get user's Gmail integration
    console.log('📧 Fetching Gmail integration...');
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      console.error('❌ No active Gmail integration found:', integrationError);
      return { success: false, error: 'No active Gmail integration' };
    }

    console.log(`✅ Found Gmail integration: ${integration.id}`);

    // Step 2: Get business profile
    console.log('📋 Fetching business profile...');
    const { data: businessProfile, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !businessProfile) {
      console.error('❌ No business profile found:', profileError);
      return { success: false, error: 'No business profile found' };
    }

    console.log(`✅ Found business profile: ${businessProfile.id}`);

    // Step 3: Get valid access token
    console.log('🔑 Getting valid access token...');
    let accessToken = integration.access_token;
    
    // Check if token is expired
    const expiresAt = new Date(integration.expires_at);
    const now = new Date();
    const needsRefresh = expiresAt <= now;

    if (needsRefresh) {
      console.log('🔄 Token expired, refreshing...');
      
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const params = new URLSearchParams({
        client_id: process.env.VITE_GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token'
      });
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('❌ Token refresh failed:', errorData);
        return { success: false, error: 'Token refresh failed' };
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      
      // Update database with new token
      const newExpiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
      await supabase
        .from('integrations')
        .update({
          access_token: tokenData.access_token,
          expires_at: newExpiresAt.toISOString()
        })
        .eq('id', integration.id);
        
      console.log('✅ Token refreshed successfully');
    }

    // Step 4: Fetch Gmail labels
    console.log('📧 Fetching Gmail labels...');
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Gmail API error:', error);
      return { success: false, error: `Gmail API error: ${error.error?.message}` };
    }

    const data = await response.json();
    const gmailLabels = data.labels || [];
    
    // Filter user-created labels
    const userLabels = gmailLabels.filter(label => 
      label.type === 'user' && !label.name.startsWith('CATEGORY_')
    );

    console.log(`📋 Found ${userLabels.length} user-created labels in Gmail`);

    // Step 5: Sync to business_labels table
    console.log('🔄 Syncing labels to business_labels table...');
    
    const normalizedLabels = userLabels.map(label => ({
      label_id: label.id,
      label_name: label.name,
      provider: 'gmail',
      business_profile_id: businessProfile.id,
      business_type: 'Hot tub & Spa', // Default business type
      color: label.color?.backgroundColor || null,
      synced_at: new Date().toISOString(),
      is_deleted: false
    }));

    const { error: upsertError } = await supabase
      .from('business_labels')
      .upsert(normalizedLabels, { 
        onConflict: 'label_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('❌ Failed to sync to business_labels table:', upsertError);
      return { success: false, error: upsertError.message };
    }

    console.log(`✅ Synced ${normalizedLabels.length} labels to business_labels table`);

    // Step 6: Update profiles.email_labels
    console.log('🔄 Updating profiles.email_labels...');
    
    const labelMap = {};
    userLabels.forEach(label => {
      if (label.type === 'user' && !label.id.startsWith('CATEGORY_')) {
        labelMap[label.name] = label.id;
      }
    });

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_labels: labelMap,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Failed to update profiles.email_labels:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Updated profiles.email_labels with ${Object.keys(labelMap).length} labels`);

    // Step 7: Verify sync
    console.log('🔍 Verifying sync...');
    const { data: syncedLabels } = await supabase
      .from('business_labels')
      .select('label_id, label_name')
      .eq('business_profile_id', businessProfile.id)
      .eq('provider', 'gmail')
      .eq('is_deleted', false);

    console.log(`✅ Verification complete: ${syncedLabels?.length || 0} labels in business_labels table`);

    return {
      success: true,
      message: `Successfully synced ${userLabels.length} labels`,
      labelsSynced: userLabels.length,
      labelsInDatabase: syncedLabels?.length || 0
    };

  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const userIdArg = args.find(arg => arg.startsWith('--userId='));
  
  if (!userIdArg) {
    console.error('❌ Usage: node scripts/manual-label-sync.js --userId=USER_ID');
    console.error('   Example: node scripts/manual-label-sync.js --userId=fedf818f-986f-4b30-bfa1-7fc339c7bb60');
    process.exit(1);
  }

  const userId = userIdArg.split('=')[1];
  
  if (!userId) {
    console.error('❌ Invalid userId provided');
    process.exit(1);
  }

  console.log('🚀 Manual Label Sync Script');
  console.log('============================');
  
  const result = await manualLabelSync(userId);
  
  console.log('\n📊 Final Result:');
  console.log('================');
  
  if (result.success) {
    console.log('✅ SUCCESS!');
    console.log(`📧 Labels synced: ${result.labelsSynced}`);
    console.log(`💾 Labels in database: ${result.labelsInDatabase}`);
    console.log(`📝 Message: ${result.message}`);
    console.log('\n🎉 Folder health check should now work correctly!');
  } else {
    console.log('❌ FAILED!');
    console.log(`📝 Error: ${result.error}`);
    console.log('\n🔧 Please check the error and try again.');
  }
}

// Run the script
main().catch(console.error);
