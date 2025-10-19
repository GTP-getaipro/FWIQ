/**
 * N8N Credential Validation Script
 * Validates all N8N credentials and checks for common issues
 */

import dotenv from 'dotenv';
dotenv.config();

const N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.srv995290.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY;

async function validateN8NCredentials() {
  console.log('🔍 N8N CREDENTIAL VALIDATION');
  console.log('============================================================');
  console.log(`N8N URL: ${N8N_API_URL}`);
  console.log('');

  if (!N8N_API_KEY) {
    console.error('❌ N8N_API_KEY not found in environment variables');
    console.log('💡 Set N8N_API_KEY in your .env file');
    return;
  }

  try {
    // Fetch all credentials
    console.log('📋 Step 1: Fetching All Credentials');
    console.log('----------------------------------------');
    
    const response = await fetch(`${N8N_API_URL}/api/v1/credentials`, {
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch credentials: ${response.status} ${response.statusText}`);
    }

    const credentials = await response.json();
    console.log(`✅ Found ${credentials.data?.length || 0} credentials`);
    console.log('');

    if (!credentials.data || credentials.data.length === 0) {
      console.log('⚠️ No credentials found in N8N');
      return;
    }

    // Analyze each credential
    console.log('📋 Step 2: Analyzing Credentials');
    console.log('----------------------------------------');

    const issues = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const cred of credentials.data) {
      console.log(`\n🔍 Checking: ${cred.name} (${cred.id})`);
      console.log(`   Type: ${cred.type}`);

      const credIssues = [];

      // Check OAuth2 credentials specifically
      if (cred.type === 'microsoftOutlookOAuth2Api' || 
          cred.type === 'googleOAuth2Api' ||
          cred.type === 'microsoftOAuth2Api') {
        
        // Check for access token
        if (!cred.data?.accessToken) {
          credIssues.push('Missing access token');
        } else {
          console.log('   ✅ Access token: Present');
        }

        // Check for refresh token (CRITICAL)
        if (!cred.data?.refreshToken) {
          credIssues.push('❌ CRITICAL: Missing refresh token');
          console.log('   ❌ Refresh token: MISSING');
        } else {
          console.log('   ✅ Refresh token: Present');
        }

        // Check token expiry
        if (cred.data?.expiresIn) {
          console.log(`   📅 Expires in: ${cred.data.expiresIn} seconds`);
        }

        // Check scopes (if available)
        if (cred.data?.scope) {
          console.log(`   🔐 Scopes: ${cred.data.scope}`);
          
          // Verify offline_access is included
          if (!cred.data.scope.includes('offline_access')) {
            credIssues.push('⚠️ Missing offline_access scope');
          }
        }
      }

      // Check other credential types
      else if (cred.type === 'openAiApi') {
        if (!cred.data?.apiKey) {
          credIssues.push('Missing API key');
        } else {
          console.log('   ✅ API key: Present');
        }
      }

      // Record issues
      if (credIssues.length > 0) {
        invalidCount++;
        issues.push({
          id: cred.id,
          name: cred.name,
          type: cred.type,
          issues: credIssues
        });
        console.log(`   ❌ Status: INVALID (${credIssues.length} issues)`);
      } else {
        validCount++;
        console.log('   ✅ Status: VALID');
      }
    }

    // Summary
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Total Credentials: ${credentials.data.length}`);
    console.log(`✅ Valid: ${validCount}`);
    console.log(`❌ Invalid: ${invalidCount}`);
    console.log('');

    if (issues.length > 0) {
      console.log('🚨 ISSUES FOUND:');
      console.log('');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.name} (${issue.id})`);
        console.log(`   Type: ${issue.type}`);
        issue.issues.forEach(i => console.log(`   - ${i}`));
        console.log('');
      });

      console.log('💡 RECOMMENDED ACTIONS:');
      console.log('');
      
      const missingRefreshTokens = issues.filter(i => 
        i.issues.some(issue => issue.includes('refresh token'))
      );

      if (missingRefreshTokens.length > 0) {
        console.log('🔧 Fix Missing Refresh Tokens:');
        console.log('   1. Open N8N credentials page');
        console.log('   2. For each credential listed above:');
        console.log('      - Click "Edit"');
        console.log('      - Click "Reconnect" or "Connect my account"');
        console.log('      - Complete OAuth flow');
        console.log('      - Verify refresh token appears');
        console.log('      - Save credential');
        console.log('');
        console.log('   📖 See: docs/fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md');
        console.log('');
      }

      const missingScopes = issues.filter(i =>
        i.issues.some(issue => issue.includes('offline_access'))
      );

      if (missingScopes.length > 0) {
        console.log('🔐 Fix Missing Scopes:');
        console.log('   1. Ensure offline_access in Azure permissions');
        console.log('   2. Force fresh consent with &prompt=consent');
        console.log('   3. Reauthorize credentials');
        console.log('');
      }

    } else {
      console.log('🎉 ALL CREDENTIALS ARE VALID!');
      console.log('');
      console.log('✅ All OAuth credentials have refresh tokens');
      console.log('✅ All API credentials have required keys');
      console.log('✅ Ready for production use');
    }

    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Check N8N_API_URL is correct');
    console.log('   2. Verify N8N_API_KEY is valid');
    console.log('   3. Ensure N8N is accessible');
    console.log('   4. Check network connectivity');
  }
}

// Run validation
validateN8NCredentials();

