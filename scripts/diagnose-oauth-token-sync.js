/**
 * OAuth Token Synchronization Diagnostic
 * Identifies token sync issues between Supabase and N8N
 * Pinpoints users who will break on re-login
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.srv995290.hstgr.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY;

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function diagnoseOAuthTokenSync() {
  console.log(colorize('\n╔═══════════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║                                                                   ║', 'cyan'));
  console.log(colorize('║', 'cyan') + colorize('     🔍 OAUTH TOKEN SYNCHRONIZATION DIAGNOSTIC 🔍', 'bright') + colorize('         ║', 'cyan'));
  console.log(colorize('║                                                                   ║', 'cyan'));
  console.log(colorize('╚═══════════════════════════════════════════════════════════════════╝', 'cyan'));
  console.log('');
  console.log(colorize(`📅 ${new Date().toISOString()}`, 'gray'));
  console.log('');

  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    totalUsers: 0,
    usersAnalyzed: 0,
    criticalIssues: [],
    warnings: [],
    healthy: [],
    summary: {}
  };

  if (!N8N_API_KEY) {
    console.log(colorize('❌ N8N_API_KEY not configured', 'red'));
    console.log(colorize('💡 Set N8N_API_KEY in your .env file', 'yellow'));
    return;
  }

  try {
    // Step 1: Fetch all integrations from Supabase
    console.log(colorize('📋 Step 1: Fetching Supabase Integrations', 'cyan'));
    console.log('─'.repeat(70));
    console.log('');

    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select(`
        id,
        user_id,
        provider,
        status,
        access_token,
        refresh_token,
        access_token_expires_at,
        n8n_credential_id,
        metadata,
        created_at,
        updated_at
      `)
      .in('provider', ['outlook', 'gmail']);

    if (intError) {
      throw new Error(`Supabase query failed: ${intError.message}`);
    }

    diagnosticResults.totalUsers = new Set(integrations.map(i => i.user_id)).size;
    diagnosticResults.usersAnalyzed = integrations.length;

    console.log(colorize(`✅ Found ${integrations.length} email integrations`, 'green'));
    console.log(colorize(`   Unique users: ${diagnosticResults.totalUsers}`, 'gray'));
    console.log('');

    // Step 2: Analyze each integration
    console.log(colorize('📋 Step 2: Analyzing Token Health', 'cyan'));
    console.log('─'.repeat(70));
    console.log('');

    for (const integration of integrations) {
      console.log(colorize(`\n🔍 Integration ${integration.id}`, 'bright'));
      console.log(colorize(`   User ID: ${integration.user_id}`, 'gray'));
      console.log(colorize(`   Provider: ${integration.provider}`, 'gray'));
      console.log(colorize(`   Status: ${integration.status}`, integration.status === 'active' ? 'green' : 'yellow'));
      console.log('');

      const issues = [];
      const analysis = {
        integrationId: integration.id,
        userId: integration.user_id,
        provider: integration.provider,
        status: integration.status,
        supabaseTokens: {},
        n8nCredential: {},
        issues: [],
        severity: 'OK'
      };

      // Check Supabase tokens
      console.log(colorize('  📊 Supabase Token Analysis:', 'cyan'));
      
      const hasSupabaseAccessToken = !!integration.access_token;
      const hasSupabaseRefreshToken = !!integration.refresh_token;
      const tokenExpiry = integration.access_token_expires_at ? 
        new Date(integration.access_token_expires_at) : null;
      const isExpired = tokenExpiry && tokenExpiry < new Date();

      analysis.supabaseTokens = {
        hasAccessToken: hasSupabaseAccessToken,
        hasRefreshToken: hasSupabaseRefreshToken,
        expiresAt: integration.access_token_expires_at,
        isExpired: isExpired || false
      };

      console.log(`     Access Token:  ${hasSupabaseAccessToken ? colorize('✅ Present', 'green') : colorize('❌ Missing', 'red')}`);
      console.log(`     Refresh Token: ${hasSupabaseRefreshToken ? colorize('✅ Present', 'green') : colorize('❌ Missing', 'red')}`);
      
      if (tokenExpiry) {
        const timeUntilExpiry = tokenExpiry - new Date();
        const hoursUntilExpiry = (timeUntilExpiry / (1000 * 60 * 60)).toFixed(1);
        console.log(`     Expires: ${isExpired ? colorize('❌ EXPIRED', 'red') : colorize(`✅ In ${hoursUntilExpiry}h`, 'green')}`);
      } else {
        console.log(`     Expires: ${colorize('⚠️  Not tracked', 'yellow')}`);
      }

      // Check N8N credential
      console.log('');
      console.log(colorize('  📊 N8N Credential Analysis:', 'cyan'));

      if (!integration.n8n_credential_id) {
        issues.push('❌ CRITICAL: No N8N credential ID linked');
        analysis.severity = 'CRITICAL';
        console.log(colorize('     ❌ CRITICAL: No N8N credential linked', 'red'));
      } else {
        try {
          const n8nResponse = await fetch(
            `${N8N_API_URL}/api/v1/credentials/${integration.n8n_credential_id}`,
            {
              headers: {
                'Authorization': `Bearer ${N8N_API_KEY}`,
                'Accept': 'application/json'
              }
            }
          );

          if (n8nResponse.ok) {
            const n8nCred = await n8nResponse.json();
            
            const hasN8NAccessToken = !!n8nCred.data?.accessToken;
            const hasN8NRefreshToken = !!n8nCred.data?.refreshToken;

            analysis.n8nCredential = {
              id: n8nCred.id,
              name: n8nCred.name,
              type: n8nCred.type,
              hasAccessToken: hasN8NAccessToken,
              hasRefreshToken: hasN8NRefreshToken
            };

            console.log(`     Credential ID:  ${colorize(integration.n8n_credential_id, 'gray')}`);
            console.log(`     Credential Name: ${n8nCred.name}`);
            console.log(`     Access Token:  ${hasN8NAccessToken ? colorize('✅ Present', 'green') : colorize('❌ Missing', 'red')}`);
            console.log(`     Refresh Token: ${hasN8NRefreshToken ? colorize('✅ Present', 'green') : colorize('❌ MISSING', 'red')}`);

            // Critical issue: No refresh token in N8N
            if (!hasN8NRefreshToken) {
              issues.push('❌ CRITICAL: N8N credential missing refresh token');
              analysis.severity = 'CRITICAL';
              console.log('');
              console.log(colorize('     🚨 CRITICAL ISSUE:', 'red'));
              console.log(colorize('        User WILL fail on re-login or token expiry', 'red'));
              console.log(colorize('        Action: Reauthorize credential in N8N', 'yellow'));
            }

            // Warning: Token desynchronization
            if (hasSupabaseRefreshToken !== hasN8NRefreshToken) {
              issues.push('⚠️ Token desync between Supabase and N8N');
              if (analysis.severity !== 'CRITICAL') analysis.severity = 'WARNING';
              console.log('');
              console.log(colorize('     ⚠️  WARNING: Token desynchronization detected', 'yellow'));
            }

          } else if (n8nResponse.status === 404) {
            issues.push('❌ CRITICAL: N8N credential not found (deleted?)');
            analysis.severity = 'CRITICAL';
            console.log(colorize('     ❌ CRITICAL: N8N credential not found', 'red'));
            console.log(colorize('        Credential may have been deleted', 'red'));
          } else {
            issues.push(`⚠️ N8N API error: ${n8nResponse.status}`);
            if (analysis.severity !== 'CRITICAL') analysis.severity = 'WARNING';
            console.log(colorize(`     ⚠️ N8N API returned: ${n8nResponse.status}`, 'yellow'));
          }

        } catch (n8nError) {
          issues.push(`❌ N8N API unreachable: ${n8nError.message}`);
          analysis.severity = 'CRITICAL';
          console.log(colorize(`     ❌ N8N API error: ${n8nError.message}`, 'red'));
        }
      }

      // Check workflow linkage
      if (integration.metadata?.workflow_id) {
        console.log('');
        console.log(colorize('  📊 Workflow Linkage:', 'cyan'));
        console.log(`     Workflow ID: ${integration.metadata.workflow_id}`);

        try {
          const workflowResponse = await fetch(
            `${N8N_API_URL}/api/v1/workflows/${integration.metadata.workflow_id}`,
            {
              headers: {
                'Authorization': `Bearer ${N8N_API_KEY}`,
                'Accept': 'application/json'
              }
            }
          );

          if (workflowResponse.ok) {
            const workflow = await workflowResponse.json();
            console.log(`     Workflow: ${colorize(workflow.name, 'green')}`);
            console.log(`     Active: ${workflow.active ? colorize('✅ Yes', 'green') : colorize('❌ No', 'red')}`);

            if (!workflow.active) {
              issues.push('⚠️ Workflow is inactive');
              if (analysis.severity === 'OK') analysis.severity = 'WARNING';
            }
          } else {
            console.log(colorize('     ⚠️ Workflow not found', 'yellow'));
          }
        } catch (error) {
          console.log(colorize('     ⚠️ Could not check workflow', 'yellow'));
        }
      }

      // Store analysis results
      analysis.issues = issues;

      if (analysis.severity === 'CRITICAL') {
        diagnosticResults.criticalIssues.push(analysis);
      } else if (analysis.severity === 'WARNING') {
        diagnosticResults.warnings.push(analysis);
      } else {
        diagnosticResults.healthy.push(analysis);
      }

      console.log('');
      console.log(colorize(`  🎯 Verdict: ${analysis.severity}`, 
        analysis.severity === 'CRITICAL' ? 'red' : 
        analysis.severity === 'WARNING' ? 'yellow' : 'green'));
      console.log('');
    }

    // Step 3: Generate Summary Report
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(colorize('📊 DIAGNOSTIC SUMMARY REPORT', 'bright'));
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');

    console.log(colorize(`Total Integrations Analyzed: ${integrations.length}`, 'white'));
    console.log(colorize(`Unique Users: ${diagnosticResults.totalUsers}`, 'white'));
    console.log('');
    console.log(colorize(`✅ Healthy: ${diagnosticResults.healthy.length}`, 'green'));
    console.log(colorize(`⚠️  Warnings: ${diagnosticResults.warnings.length}`, 'yellow'));
    console.log(colorize(`❌ Critical: ${diagnosticResults.criticalIssues.length}`, 'red'));
    console.log('');

    // Critical Issues Detail
    if (diagnosticResults.criticalIssues.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log(colorize('🚨 CRITICAL ISSUES - IMMEDIATE ACTION REQUIRED', 'red'));
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('');

      diagnosticResults.criticalIssues.forEach((issue, index) => {
        console.log(colorize(`${index + 1}. User: ${issue.userId}`, 'bright'));
        console.log(`   Provider: ${issue.provider}`);
        console.log(`   Integration ID: ${issue.integrationId}`);
        console.log(colorize('   Issues:', 'red'));
        issue.issues.forEach(i => console.log(`     - ${i}`));
        console.log('');
        console.log(colorize('   ⚡ ACTION REQUIRED:', 'yellow'));

        if (issue.issues.some(i => i.includes('No N8N credential'))) {
          console.log('     1. Create N8N credential via OAuth');
          console.log('     2. Link credential ID to Supabase integration');
        } else if (issue.issues.some(i => i.includes('missing refresh token'))) {
          console.log('     1. Open N8N credentials page');
          console.log(`     2. Edit credential: ${issue.n8nCredential.id}`);
          console.log('     3. Click "Reconnect" / "Connect my account"');
          console.log('     4. Complete OAuth with offline_access scope');
          console.log('     5. Verify refresh token appears');
          console.log('     6. Save credential');
        } else if (issue.issues.some(i => i.includes('not found'))) {
          console.log('     1. Credential was deleted - need to recreate');
          console.log('     2. Complete fresh OAuth flow');
          console.log('     3. Update integration record with new credential ID');
        }

        console.log('');
        console.log(colorize('   📖 Documentation:', 'cyan'));
        console.log('      docs/fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md');
        console.log('      docs/guides/OAUTH_CREDENTIAL_MANAGEMENT.md');
        console.log('');
      });
    }

    // Warnings Detail
    if (diagnosticResults.warnings.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log(colorize('⚠️  WARNINGS - ATTENTION NEEDED', 'yellow'));
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('');

      diagnosticResults.warnings.forEach((warning, index) => {
        console.log(colorize(`${index + 1}. User: ${warning.userId}`, 'bright'));
        console.log(`   Provider: ${warning.provider}`);
        console.log(colorize('   Issues:', 'yellow'));
        warning.issues.forEach(i => console.log(`     - ${i}`));
        console.log('');
      });
    }

    // Healthy Integrations
    if (diagnosticResults.healthy.length > 0) {
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log(colorize('✅ HEALTHY INTEGRATIONS', 'green'));
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('');
      console.log(colorize(`${diagnosticResults.healthy.length} integrations are properly configured`, 'green'));
      console.log('');
      diagnosticResults.healthy.forEach((healthy, index) => {
        console.log(`   ${index + 1}. ${healthy.provider} - User: ${healthy.userId.substring(0, 8)}...`);
      });
      console.log('');
    }

    // Risk Analysis
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(colorize('🎯 RISK ANALYSIS', 'bright'));
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');

    const totalIntegrations = integrations.length;
    const criticalCount = diagnosticResults.criticalIssues.length;
    const warningCount = diagnosticResults.warnings.length;
    const healthyCount = diagnosticResults.healthy.length;

    console.log(colorize('Users at Risk of Re-Login Failure:', 'bright'));
    console.log('');
    console.log(`  ${colorize('🔴 HIGH RISK:', 'red')}    ${criticalCount} users`);
    console.log(`  ${colorize('🟡 MEDIUM RISK:', 'yellow')} ${warningCount} users`);
    console.log(`  ${colorize('🟢 LOW RISK:', 'green')}    ${healthyCount} users`);
    console.log('');

    const riskPercentage = totalIntegrations > 0 ? 
      (((criticalCount + warningCount) / totalIntegrations) * 100).toFixed(1) : 0;

    console.log(colorize(`Overall Risk Score: ${riskPercentage}%`, 
      riskPercentage > 50 ? 'red' : 
      riskPercentage > 20 ? 'yellow' : 'green'));
    console.log('');

    if (riskPercentage > 50) {
      console.log(colorize('🚨 CRITICAL: Over 50% of integrations at risk', 'red'));
      console.log(colorize('   Immediate action required to prevent user disruption', 'red'));
    } else if (riskPercentage > 20) {
      console.log(colorize('⚠️  WARNING: Significant portion of integrations need attention', 'yellow'));
    } else {
      console.log(colorize('✅ GOOD: Most integrations are healthy', 'green'));
    }

    // Recommendations
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(colorize('💡 RECOMMENDATIONS', 'bright'));
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');

    if (criticalCount > 0) {
      console.log(colorize('Immediate Actions:', 'yellow'));
      console.log('  1. Fix missing refresh tokens in N8N credentials');
      console.log('  2. Run: npm run ops:fix-tokens');
      console.log('  3. Reauthorize affected credentials');
      console.log('  4. Verify refresh tokens present');
      console.log('  5. Test workflow activations');
      console.log('');
    }

    if (warningCount > 0) {
      console.log(colorize('This Week:', 'yellow'));
      console.log('  1. Review warned integrations');
      console.log('  2. Fix token desynchronization');
      console.log('  3. Activate inactive workflows');
      console.log('  4. Update documentation');
      console.log('');
    }

    console.log(colorize('Ongoing:', 'cyan'));
    console.log('  1. Monitor token expiry proactively');
    console.log('  2. Set up automated health checks');
    console.log('  3. Implement token refresh monitoring');
    console.log('  4. Run diagnostics weekly');
    console.log('');

    // Save detailed report
    diagnosticResults.summary = {
      total: totalIntegrations,
      healthy: healthyCount,
      warnings: warningCount,
      critical: criticalCount,
      riskPercentage: parseFloat(riskPercentage)
    };

    const fs = await import('fs');
    const reportDir = 'monitoring';
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = `${reportDir}/oauth-diagnostic-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(diagnosticResults, null, 2));

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');
    console.log(colorize(`💾 Detailed report saved to: ${reportPath}`, 'cyan'));
    console.log('');

    // Exit code based on severity
    if (criticalCount > 0) {
      console.log(colorize('❌ DIAGNOSTIC RESULT: CRITICAL ISSUES FOUND', 'red'));
      console.log('');
      process.exit(1);
    } else if (warningCount > 0) {
      console.log(colorize('⚠️  DIAGNOSTIC RESULT: WARNINGS FOUND', 'yellow'));
      console.log('');
      process.exit(0);
    } else {
      console.log(colorize('🎉 DIAGNOSTIC RESULT: ALL SYSTEMS HEALTHY', 'green'));
      console.log('');
      process.exit(0);
    }

  } catch (error) {
    console.error(colorize('\n❌ Diagnostic failed:', 'red'), error.message);
    console.log('');
    console.log(colorize('💡 Troubleshooting:', 'yellow'));
    console.log('   1. Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('   2. Verify N8N_API_URL and N8N_API_KEY');
    console.log('   3. Check network connectivity');
    console.log('   4. Review error message above');
    console.log('');
    process.exit(1);
  }
}

// Run diagnostic
diagnoseOAuthTokenSync();

