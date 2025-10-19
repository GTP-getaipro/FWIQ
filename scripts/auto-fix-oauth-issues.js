/**
 * Automated OAuth Issue Fix
 * Attempts to automatically fix common OAuth token issues
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

async function autoFixOAuthIssues() {
  console.log('🔧 AUTOMATED OAUTH ISSUE FIX');
  console.log('============================================================');
  console.log('');

  const fixes = {
    deactivatedIntegrations: 0,
    cleanedOrphans: 0,
    markedForReauth: 0,
    errors: []
  };

  try {
    // Step 1: Find integrations with issues
    console.log('📋 Step 1: Identifying Problem Integrations');
    console.log('----------------------------------------');

    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .in('provider', ['outlook', 'gmail']);

    if (intError) throw intError;

    console.log(`Found ${integrations.length} email integrations`);
    console.log('');

    // Step 2: Check each integration
    console.log('📋 Step 2: Analyzing and Fixing');
    console.log('----------------------------------------');
    console.log('');

    for (const integration of integrations) {
      console.log(`Checking: ${integration.provider} for user ${integration.user_id.substring(0, 8)}...`);

      let needsFix = false;
      let fixAction = '';

      // Issue 1: Missing refresh token in Supabase
      if (!integration.refresh_token && integration.status === 'active') {
        needsFix = true;
        fixAction = 'DEACTIVATE';
        console.log('  ⚠️  Missing refresh token in Supabase');
      }

      // Issue 2: No N8N credential linked
      if (!integration.n8n_credential_id && integration.status === 'active') {
        needsFix = true;
        fixAction = 'DEACTIVATE';
        console.log('  ⚠️  No N8N credential linked');
      }

      // Issue 3: N8N credential doesn't exist
      if (integration.n8n_credential_id) {
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

          if (n8nResponse.status === 404) {
            needsFix = true;
            fixAction = 'CLEAN_ORPHAN';
            console.log('  ⚠️  N8N credential not found (orphaned reference)');
          } else if (n8nResponse.ok) {
            const n8nCred = await n8nResponse.json();
            
            // Issue 4: N8N credential missing refresh token
            if (!n8nCred.data?.refreshToken) {
              needsFix = true;
              fixAction = 'MARK_REAUTH';
              console.log('  🚨 N8N credential missing refresh token - CRITICAL');
            }
          }
        } catch (error) {
          console.log(`  ⚠️  Could not check N8N credential: ${error.message}`);
        }
      }

      // Apply fixes
      if (needsFix) {
        console.log(`  🔧 Applying fix: ${fixAction}`);

        try {
          if (fixAction === 'DEACTIVATE') {
            // Deactivate integration to prevent failures
            const { error: updateError } = await supabase
              .from('integrations')
              .update({
                status: 'inactive',
                metadata: {
                  ...integration.metadata,
                  deactivated_reason: 'Missing refresh token',
                  deactivated_at: new Date().toISOString(),
                  requires_reauth: true
                }
              })
              .eq('id', integration.id);

            if (updateError) {
              fixes.errors.push({
                integration: integration.id,
                error: updateError.message
              });
              console.log(`  ❌ Failed to deactivate: ${updateError.message}`);
            } else {
              fixes.deactivatedIntegrations++;
              console.log('  ✅ Deactivated integration (prevents errors)');
            }

          } else if (fixAction === 'CLEAN_ORPHAN') {
            // Clean orphaned N8N credential reference
            const { error: updateError } = await supabase
              .from('integrations')
              .update({
                n8n_credential_id: null,
                status: 'inactive',
                metadata: {
                  ...integration.metadata,
                  cleaned_orphan: true,
                  cleaned_at: new Date().toISOString()
                }
              })
              .eq('id', integration.id);

            if (updateError) {
              fixes.errors.push({
                integration: integration.id,
                error: updateError.message
              });
              console.log(`  ❌ Failed to clean orphan: ${updateError.message}`);
            } else {
              fixes.cleanedOrphans++;
              console.log('  ✅ Cleaned orphaned credential reference');
            }

          } else if (fixAction === 'MARK_REAUTH') {
            // Mark for reauthorization
            const { error: updateError } = await supabase
              .from('integrations')
              .update({
                metadata: {
                  ...integration.metadata,
                  requires_reauth: true,
                  reauth_reason: 'Missing refresh token in N8N',
                  flagged_at: new Date().toISOString()
                }
              })
              .eq('id', integration.id);

            if (updateError) {
              fixes.errors.push({
                integration: integration.id,
                error: updateError.message
              });
              console.log(`  ❌ Failed to mark for reauth: ${updateError.message}`);
            } else {
              fixes.markedForReauth++;
              console.log('  ✅ Marked for reauthorization');
            }
          }

        } catch (fixError) {
          fixes.errors.push({
            integration: integration.id,
            error: fixError.message
          });
          console.log(`  ❌ Fix failed: ${fixError.message}`);
        }

      } else {
        console.log('  ✅ No issues found');
      }

      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('📊 AUTO-FIX SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Integrations Analyzed:    ${integrations.length}`);
    console.log(`Deactivated:              ${fixes.deactivatedIntegrations}`);
    console.log(`Orphans Cleaned:          ${fixes.cleanedOrphans}`);
    console.log(`Marked for Reauth:        ${fixes.markedForReauth}`);
    console.log(`Errors:                   ${fixes.errors.length}`);
    console.log('');

    if (fixes.errors.length > 0) {
      console.log('❌ Errors encountered:');
      fixes.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. Integration ${err.integration}: ${err.error}`);
      });
      console.log('');
    }

    // Next steps
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🎯 NEXT STEPS');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');

    if (fixes.markedForReauth > 0) {
      console.log('🔐 Reauthorization Required:');
      console.log(`   ${fixes.markedForReauth} integrations need manual reauthorization`);
      console.log('');
      console.log('   For each affected user:');
      console.log('   1. Navigate to N8N credentials');
      console.log('   2. Click "Reconnect" on their OAuth credential');
      console.log('   3. Ensure offline_access scope is included');
      console.log('   4. Verify refresh token appears');
      console.log('   5. Update integration status to "active"');
      console.log('');
      console.log('   📖 See: docs/fixes/OUTLOOK_OAUTH_REFRESH_TOKEN_FIX.md');
      console.log('');
    }

    if (fixes.deactivatedIntegrations > 0) {
      console.log('✅ Prevented Errors:');
      console.log(`   ${fixes.deactivatedIntegrations} problematic integrations deactivated`);
      console.log('   This prevents "Unable to sign" errors');
      console.log('   Users will see "Reconnect" button instead of errors');
      console.log('');
    }

    if (fixes.cleanedOrphans > 0) {
      console.log('🧹 Cleaned Up:');
      console.log(`   ${fixes.cleanedOrphans} orphaned credential references removed`);
      console.log('   Database integrity improved');
      console.log('');
    }

    console.log('🔄 Monitor System:');
    console.log('   Run: npm run ops:dashboard');
    console.log('   Run: npm run ops:health');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');

    if (fixes.markedForReauth > 0 || fixes.deactivatedIntegrations > 0) {
      console.log('⚠️  AUTO-FIX COMPLETE - MANUAL ACTION STILL REQUIRED');
    } else {
      console.log('✅ AUTO-FIX COMPLETE - NO MANUAL ACTION NEEDED');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Auto-fix failed:', error.message);
    console.log('');
    console.log('💡 Try running diagnostic first:');
    console.log('   node scripts/diagnose-oauth-token-sync.js');
    console.log('');
    process.exit(1);
  }
}

// Run auto-fix
autoFixOAuthIssues();

