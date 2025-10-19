/**
 * Automated N8N Refresh Token Fix
 * Identifies and reports credentials missing refresh tokens
 */

import dotenv from 'dotenv';
dotenv.config();

const N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.srv995290.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function fixN8NRefreshTokens() {
  console.log('🔧 N8N REFRESH TOKEN FIX UTILITY');
  console.log('============================================================');
  console.log('');

  if (!N8N_API_KEY) {
    console.error('❌ N8N_API_KEY not found in environment variables');
    console.log('💡 Set N8N_API_KEY in your .env file');
    return;
  }

  try {
    // Step 1: Fetch all credentials
    console.log('📋 Step 1: Fetching Credentials');
    console.log('----------------------------------------');
    
    const response = await fetch(`${N8N_API_URL}/api/v1/credentials`, {
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const credentials = await response.json();
    console.log(`✅ Found ${credentials.data?.length || 0} credentials\n`);

    // Step 2: Identify problematic credentials
    console.log('📋 Step 2: Identifying Issues');
    console.log('----------------------------------------');

    const oauthCredentials = credentials.data?.filter(c => 
      c.type === 'microsoftOutlookOAuth2Api' ||
      c.type === 'googleOAuth2Api' ||
      c.type === 'microsoftOAuth2Api'
    ) || [];

    const missingRefreshTokens = oauthCredentials.filter(c => 
      !c.data?.refreshToken || c.data.refreshToken === ''
    );

    console.log(`OAuth Credentials: ${oauthCredentials.length}`);
    console.log(`Missing Refresh Tokens: ${missingRefreshTokens.length}`);
    console.log('');

    if (missingRefreshTokens.length === 0) {
      console.log('🎉 ALL CREDENTIALS HAVE REFRESH TOKENS!');
      console.log('');
      console.log('✅ No action required');
      console.log('✅ All OAuth credentials are properly configured');
      return;
    }

    // Step 3: Report issues
    console.log('📋 Step 3: Credentials Requiring Fix');
    console.log('----------------------------------------');
    console.log('');

    missingRefreshTokens.forEach((cred, index) => {
      console.log(`${index + 1}. ${cred.name}`);
      console.log(`   ID: ${cred.id}`);
      console.log(`   Type: ${cred.type}`);
      console.log(`   Status: ❌ Missing refresh token`);
      console.log('');
    });

    // Step 4: Provide fix instructions
    console.log('📋 Step 4: How to Fix');
    console.log('----------------------------------------');
    console.log('');
    console.log('🔧 Manual Fix (Recommended):');
    console.log('');

    missingRefreshTokens.forEach((cred, index) => {
      console.log(`${index + 1}. Fix "${cred.name}" (${cred.id})`);
      console.log(`   URL: ${N8N_API_URL}/credentials/edit/${cred.id}`);
      console.log('   Steps:');
      console.log('   a) Click "Reconnect" or "Connect my account"');
      console.log('   b) Complete OAuth flow (ensure offline_access scope)');
      console.log('   c) Verify refresh token appears');
      console.log('   d) Save credential');
      console.log('');
    });

    console.log('💡 Verification Command:');
    console.log('');
    missingRefreshTokens.forEach(cred => {
      console.log(`curl ${N8N_API_URL}/api/v1/credentials/${cred.id} \\`);
      console.log(`  -H "Authorization: Bearer $N8N_API_KEY" \\`);
      console.log('  | jq \'.data.refreshToken\'');
      console.log('');
    });

    // Step 5: Check affected workflows
    console.log('📋 Step 5: Checking Affected Workflows');
    console.log('----------------------------------------');
    console.log('');

    const workflowsResponse = await fetch(`${N8N_API_URL}/api/v1/workflows`, {
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (workflowsResponse.ok) {
      const workflows = await workflowsResponse.json();
      const credIds = missingRefreshTokens.map(c => c.id);

      const affectedWorkflows = workflows.data?.filter(w => {
        const workflowStr = JSON.stringify(w);
        return credIds.some(credId => workflowStr.includes(credId));
      }) || [];

      console.log(`⚠️ Affected Workflows: ${affectedWorkflows.length}`);
      console.log('');

      affectedWorkflows.forEach((workflow, index) => {
        console.log(`${index + 1}. ${workflow.name} (${workflow.id})`);
        console.log(`   Status: ${workflow.active ? '🟢 Active' : '🔴 Inactive'}`);
        console.log('   Action Required: Reactivate after fixing credentials');
        console.log('');
      });

      if (affectedWorkflows.length > 0) {
        healthReport.recommendations.push('Reactivate affected workflows after credential fix');
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎯 FIX SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Credentials to fix: ${missingRefreshTokens.length}`);
    console.log(`Workflows affected: ${affectedWorkflows?.length || 0}`);
    console.log('');
    console.log('📖 Detailed Instructions:');
    console.log('   docs/fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md');
    console.log('');
    console.log('🔍 Troubleshooting Guide:');
    console.log('   docs/systems/N8N_CREDENTIAL_TROUBLESHOOTING.md');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Fix utility failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Verify N8N_API_URL and N8N_API_KEY');
    console.log('   2. Check N8N is accessible');
    console.log('   3. Ensure API key has proper permissions');
  }
}

// Run fix utility
fixN8NRefreshTokens();

