/**
 * System Health Monitor
 * Comprehensive health check for all FloworxV2 systems
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

async function monitorSystemHealth() {
  console.log('🏥 FLOWORXV2 SYSTEM HEALTH MONITOR');
  console.log('============================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');

  const healthReport = {
    timestamp: new Date().toISOString(),
    services: {},
    issues: [],
    recommendations: []
  };

  // 1. Check Supabase Connection
  console.log('📋 1. Supabase Database Health');
  console.log('----------------------------------------');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      healthReport.services.supabase = { status: 'ERROR', error: error.message };
      healthReport.issues.push('Supabase connection failed');
      console.log('❌ Supabase: ERROR');
      console.log(`   Error: ${error.message}`);
    } else {
      healthReport.services.supabase = { status: 'OK' };
      console.log('✅ Supabase: Connected');
    }
  } catch (error) {
    healthReport.services.supabase = { status: 'ERROR', error: error.message };
    healthReport.issues.push('Supabase unreachable');
    console.log('❌ Supabase: UNREACHABLE');
  }

  // 2. Check N8N API
  console.log('\n📋 2. N8N API Health');
  console.log('----------------------------------------');
  try {
    if (!N8N_API_KEY) {
      healthReport.services.n8n = { status: 'NOT_CONFIGURED' };
      healthReport.issues.push('N8N_API_KEY not set');
      console.log('⚠️ N8N: NOT CONFIGURED');
      console.log('   Missing N8N_API_KEY in environment');
    } else {
      const response = await fetch(`${N8N_API_URL}/api/v1/workflows`, {
        headers: {
          'Authorization': `Bearer ${N8N_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        healthReport.services.n8n = {
          status: 'OK',
          workflowCount: data.data?.length || 0
        };
        console.log('✅ N8N: Connected');
        console.log(`   Workflows: ${data.data?.length || 0}`);
      } else {
        healthReport.services.n8n = { status: 'ERROR', statusCode: response.status };
        healthReport.issues.push(`N8N API returned ${response.status}`);
        console.log(`❌ N8N: ERROR (${response.status})`);
      }
    }
  } catch (error) {
    healthReport.services.n8n = { status: 'UNREACHABLE', error: error.message };
    healthReport.issues.push('N8N API unreachable');
    console.log('❌ N8N: UNREACHABLE');
  }

  // 3. Check Active Integrations
  console.log('\n📋 3. Email Integrations Health');
  console.log('----------------------------------------');
  try {
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('provider, status, access_token, refresh_token, access_token_expires_at')
      .eq('status', 'active');

    if (error) {
      healthReport.services.integrations = { status: 'ERROR', error: error.message };
      console.log('❌ Integrations: ERROR');
    } else {
      const total = integrations?.length || 0;
      const withRefreshTokens = integrations?.filter(i => i.refresh_token)?.length || 0;
      const expiringSoon = integrations?.filter(i => {
        if (!i.access_token_expires_at) return false;
        const expiry = new Date(i.access_token_expires_at);
        const fiveMinutes = 5 * 60 * 1000;
        return expiry.getTime() - Date.now() < fiveMinutes;
      })?.length || 0;

      healthReport.services.integrations = {
        status: 'OK',
        total,
        withRefreshTokens,
        expiringSoon
      };

      console.log('✅ Integrations: OK');
      console.log(`   Total active: ${total}`);
      console.log(`   With refresh tokens: ${withRefreshTokens}`);
      console.log(`   Expiring soon: ${expiringSoon}`);

      if (withRefreshTokens < total) {
        healthReport.issues.push(`${total - withRefreshTokens} integrations missing refresh tokens`);
        healthReport.recommendations.push('Reconnect integrations to obtain refresh tokens');
      }

      integrations?.forEach(int => {
        console.log(`   - ${int.provider}: ${int.refresh_token ? '✅' : '❌'} refresh token`);
      });
    }
  } catch (error) {
    healthReport.services.integrations = { status: 'ERROR', error: error.message };
    console.log('❌ Integrations: ERROR');
  }

  // 4. Check Email Queue
  console.log('\n📋 4. Email Queue Health');
  console.log('----------------------------------------');
  try {
    const { data: stats, error } = await supabase
      .from('email_queue')
      .select('status, direction, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      healthReport.services.emailQueue = { status: 'ERROR', error: error.message };
      console.log('❌ Email Queue: ERROR');
    } else {
      const total = stats?.length || 0;
      const inbound = stats?.filter(e => e.direction === 'inbound')?.length || 0;
      const outbound = stats?.filter(e => e.direction === 'outbound')?.length || 0;
      const processed = stats?.filter(e => e.status === 'processed' || e.status === 'succeeded')?.length || 0;
      const failed = stats?.filter(e => e.status === 'failed')?.length || 0;

      healthReport.services.emailQueue = {
        status: 'OK',
        last24Hours: { total, inbound, outbound, processed, failed }
      };

      console.log('✅ Email Queue: OK');
      console.log(`   Last 24h: ${total} emails`);
      console.log(`   Inbound: ${inbound} | Outbound: ${outbound}`);
      console.log(`   Processed: ${processed} | Failed: ${failed}`);

      if (failed > 0) {
        healthReport.issues.push(`${failed} failed emails in last 24 hours`);
        healthReport.recommendations.push('Investigate failed email processing');
      }
    }
  } catch (error) {
    healthReport.services.emailQueue = { status: 'ERROR', error: error.message };
    console.log('❌ Email Queue: ERROR');
  }

  // 5. Check Voice Analysis Coverage
  console.log('\n📋 5. Voice Analysis Coverage');
  console.log('----------------------------------------');
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, voice_analysis, business_type');

    if (error) {
      healthReport.services.voiceAnalysis = { status: 'ERROR', error: error.message };
      console.log('❌ Voice Analysis: ERROR');
    } else {
      const total = profiles?.length || 0;
      const analyzed = profiles?.filter(p => p.voice_analysis)?.length || 0;
      const coverage = total > 0 ? ((analyzed / total) * 100).toFixed(1) : 0;

      healthReport.services.voiceAnalysis = {
        status: 'OK',
        totalProfiles: total,
        analyzed,
        coverage: `${coverage}%`
      };

      console.log('✅ Voice Analysis: OK');
      console.log(`   Total profiles: ${total}`);
      console.log(`   Analyzed: ${analyzed} (${coverage}%)`);
      console.log(`   Not analyzed: ${total - analyzed}`);

      if (coverage < 80 && total > 5) {
        healthReport.recommendations.push('Run voice analysis for users without analysis');
      }
    }
  } catch (error) {
    healthReport.services.voiceAnalysis = { status: 'ERROR', error: error.message };
    console.log('❌ Voice Analysis: ERROR');
  }

  // 6. Check Business Labels/Folders
  console.log('\n📋 6. Business Labels/Folders Health');
  console.log('----------------------------------------');
  try {
    const { data: labels, error } = await supabase
      .from('business_labels')
      .select('provider, label_name, business_profile_id');

    if (error) {
      healthReport.services.businessLabels = { status: 'ERROR', error: error.message };
      console.log('❌ Business Labels: ERROR');
    } else {
      const total = labels?.length || 0;
      const outlook = labels?.filter(l => l.provider === 'outlook')?.length || 0;
      const gmail = labels?.filter(l => l.provider === 'gmail')?.length || 0;

      healthReport.services.businessLabels = {
        status: 'OK',
        total,
        outlook,
        gmail
      };

      console.log('✅ Business Labels: OK');
      console.log(`   Total labels: ${total}`);
      console.log(`   Outlook: ${outlook}`);
      console.log(`   Gmail: ${gmail}`);
    }
  } catch (error) {
    healthReport.services.businessLabels = { status: 'ERROR', error: error.message };
    console.log('❌ Business Labels: ERROR');
  }

  // 7. Check Backend API
  console.log('\n📋 7. Backend API Health');
  console.log('----------------------------------------');
  try {
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET'
    });

    if (response.ok) {
      healthReport.services.backendAPI = { status: 'OK' };
      console.log('✅ Backend API: Running');
      console.log('   Port: 3001');
    } else {
      healthReport.services.backendAPI = { status: 'ERROR', statusCode: response.status };
      healthReport.issues.push('Backend API not healthy');
      console.log(`❌ Backend API: ERROR (${response.status})`);
    }
  } catch (error) {
    healthReport.services.backendAPI = { status: 'UNREACHABLE' };
    healthReport.issues.push('Backend API not running');
    console.log('❌ Backend API: NOT RUNNING');
    console.log('   💡 Start with: .\\start-backend.ps1');
  }

  // Final Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 OVERALL SYSTEM HEALTH');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const totalServices = Object.keys(healthReport.services).length;
  const healthyServices = Object.values(healthReport.services)
    .filter(s => s.status === 'OK').length;
  const healthPercentage = ((healthyServices / totalServices) * 100).toFixed(1);

  console.log(`Services Checked: ${totalServices}`);
  console.log(`Healthy: ${healthyServices} (${healthPercentage}%)`);
  console.log(`Issues Found: ${healthReport.issues.length}`);
  console.log('');

  if (healthReport.issues.length === 0) {
    console.log('🎉 SYSTEM HEALTH: EXCELLENT ✅');
    console.log('All systems are operational and healthy!');
  } else if (healthPercentage >= 80) {
    console.log('✅ SYSTEM HEALTH: GOOD');
    console.log('System is operational with minor issues');
  } else if (healthPercentage >= 60) {
    console.log('⚠️ SYSTEM HEALTH: DEGRADED');
    console.log('System has issues requiring attention');
  } else {
    console.log('❌ SYSTEM HEALTH: CRITICAL');
    console.log('System has critical issues');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');

  // Save report
  const fs = await import('fs');
  fs.writeFileSync(
    'monitoring/health-report.json',
    JSON.stringify(healthReport, null, 2)
  );
  console.log('💾 Health report saved to: monitoring/health-report.json');
  console.log('');
}

// Run monitor
monitorSystemHealth();

