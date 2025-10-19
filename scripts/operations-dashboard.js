/**
 * Operations Dashboard
 * Real-time view of system status with visual indicators
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

// ANSI color codes for terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function statusBadge(status) {
  if (status === 'OK' || status === 'PASS') {
    return colorize(' ✅ OK ', 'bgGreen') + colorize(' ', 'reset');
  } else if (status === 'WARNING' || status === 'WARN') {
    return colorize(' ⚠️  WARN ', 'bgYellow') + colorize(' ', 'reset');
  } else if (status === 'ERROR' || status === 'FAIL') {
    return colorize(' ❌ ERROR ', 'bgRed') + colorize(' ', 'reset');
  } else {
    return colorize(' ℹ️  INFO ', 'dim');
  }
}

async function showOperationsDashboard() {
  console.clear();
  console.log(colorize('\n╔════════════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║                                                                    ║', 'cyan'));
  console.log(colorize('║', 'cyan') + colorize('            🎛️  FLOWORXV2 OPERATIONS DASHBOARD 🎛️            ', 'bright') + colorize('║', 'cyan'));
  console.log(colorize('║                                                                    ║', 'cyan'));
  console.log(colorize('╚════════════════════════════════════════════════════════════════════╝', 'cyan'));
  console.log('');
  console.log(colorize(`📅 ${new Date().toLocaleString()}`, 'dim'));
  console.log(colorize('─'.repeat(72), 'dim'));
  console.log('');

  const metrics = {
    database: { status: 'CHECKING', metrics: {} },
    n8n: { status: 'CHECKING', metrics: {} },
    integrations: { status: 'CHECKING', metrics: {} },
    emailQueue: { status: 'CHECKING', metrics: {} },
    voiceAnalysis: { status: 'CHECKING', metrics: {} },
    backendAPI: { status: 'CHECKING', metrics: {} }
  };

  // Check Database
  console.log(colorize('🗄️  DATABASE', 'cyan'));
  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - start;

    if (error) throw error;

    metrics.database = {
      status: 'OK',
      metrics: {
        responseTime: `${responseTime}ms`,
        connection: 'Active'
      }
    };

    console.log('  ' + statusBadge('OK') + colorize(`Response: ${responseTime}ms`, 'green'));
  } catch (error) {
    metrics.database = { status: 'ERROR', error: error.message };
    console.log('  ' + statusBadge('ERROR') + colorize(error.message, 'red'));
  }

  // Check N8N
  console.log('');
  console.log(colorize('⚡ N8N AUTOMATION', 'cyan'));
  try {
    if (!N8N_API_KEY) throw new Error('N8N_API_KEY not configured');

    const response = await fetch(`${N8N_API_URL}/api/v1/workflows`, {
      headers: { 'Authorization': `Bearer ${N8N_API_KEY}` }
    });

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    const workflows = data.data || [];
    const activeWorkflows = workflows.filter(w => w.active);

    metrics.n8n = {
      status: 'OK',
      metrics: {
        totalWorkflows: workflows.length,
        active: activeWorkflows.length
      }
    };

    console.log('  ' + statusBadge('OK') + colorize(`Workflows: ${activeWorkflows.length}/${workflows.length} active`, 'green'));
  } catch (error) {
    metrics.n8n = { status: 'ERROR', error: error.message };
    console.log('  ' + statusBadge('ERROR') + colorize(error.message, 'red'));
  }

  // Check Integrations
  console.log('');
  console.log(colorize('📧 EMAIL INTEGRATIONS', 'cyan'));
  try {
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('provider, status, refresh_token');

    if (error) throw error;

    const active = integrations?.filter(i => i.status === 'active') || [];
    const withRefresh = active.filter(i => i.refresh_token);

    let status = 'OK';
    if (withRefresh.length < active.length) status = 'WARNING';
    if (active.length === 0) status = 'WARNING';

    metrics.integrations = {
      status,
      metrics: {
        active: active.length,
        withRefreshTokens: withRefresh.length
      }
    };

    console.log('  ' + statusBadge(status) + colorize(`Active: ${active.length} | With Refresh: ${withRefresh.length}`, status === 'OK' ? 'green' : 'yellow'));
  } catch (error) {
    metrics.integrations = { status: 'ERROR', error: error.message };
    console.log('  ' + statusBadge('ERROR') + colorize(error.message, 'red'));
  }

  // Check Email Queue
  console.log('');
  console.log(colorize('📨 EMAIL QUEUE', 'cyan'));
  try {
    const { data: emails, error, count } = await supabase
      .from('email_queue')
      .select('status, direction', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const processed = emails?.filter(e => e.status === 'processed' || e.status === 'succeeded')?.length || 0;
    const failed = emails?.filter(e => e.status === 'failed')?.length || 0;
    const queued = emails?.filter(e => e.status === 'queued')?.length || 0;

    let status = 'OK';
    if (failed > count * 0.05) status = 'WARNING'; // > 5% failure rate
    if (queued > 100) status = 'WARNING'; // Large backlog

    metrics.emailQueue = {
      status,
      metrics: {
        last24h: count || 0,
        processed,
        failed,
        queued
      }
    };

    console.log('  ' + statusBadge(status) + colorize(`24h: ${count} | Processed: ${processed} | Failed: ${failed}`, status === 'OK' ? 'green' : 'yellow'));
  } catch (error) {
    metrics.emailQueue = { status: 'ERROR', error: error.message };
    console.log('  ' + statusBadge('ERROR') + colorize(error.message, 'red'));
  }

  // Check Voice Analysis
  console.log('');
  console.log(colorize('🎤 VOICE ANALYSIS', 'cyan'));
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('voice_analysis');

    if (error) throw error;

    const total = profiles?.length || 0;
    const analyzed = profiles?.filter(p => p.voice_analysis)?.length || 0;
    const coverage = total > 0 ? ((analyzed / total) * 100).toFixed(1) : 0;

    let status = 'OK';
    if (coverage < 70) status = 'WARNING';
    if (coverage < 50) status = 'ERROR';

    metrics.voiceAnalysis = {
      status,
      metrics: {
        coverage: `${coverage}%`,
        analyzed,
        total
      }
    };

    console.log('  ' + statusBadge(status) + colorize(`Coverage: ${coverage}% (${analyzed}/${total})`, status === 'OK' ? 'green' : status === 'WARNING' ? 'yellow' : 'red'));
  } catch (error) {
    metrics.voiceAnalysis = { status: 'ERROR', error: error.message };
    console.log('  ' + statusBadge('ERROR') + colorize(error.message, 'red'));
  }

  // Check Backend API
  console.log('');
  console.log(colorize('🔌 BACKEND API', 'cyan'));
  try {
    const response = await fetch('http://localhost:3001/health', { signal: AbortSignal.timeout(3000) });
    
    if (response.ok) {
      metrics.backendAPI = { status: 'OK', metrics: { port: 3001 } };
      console.log('  ' + statusBadge('OK') + colorize('Port 3001: Running', 'green'));
    } else {
      metrics.backendAPI = { status: 'WARNING', statusCode: response.status };
      console.log('  ' + statusBadge('WARNING') + colorize(`Port 3001: Status ${response.status}`, 'yellow'));
    }
  } catch (error) {
    metrics.backendAPI = { status: 'ERROR', error: 'Not running' };
    console.log('  ' + statusBadge('ERROR') + colorize('Port 3001: Not running', 'red'));
  }

  // Overall Health Score
  console.log('');
  console.log(colorize('─'.repeat(72), 'dim'));
  console.log('');
  console.log(colorize('📊 OVERALL SYSTEM HEALTH', 'cyan'));
  console.log('');

  const services = Object.values(metrics);
  const total = services.length;
  const ok = services.filter(s => s.status === 'OK').length;
  const warning = services.filter(s => s.status === 'WARNING').length;
  const error = services.filter(s => s.status === 'ERROR').length;
  
  const healthScore = ((ok / total) * 100).toFixed(1);

  console.log(`  Services Checked:  ${total}`);
  console.log(`  ${colorize('✅ OK:', 'green')}           ${ok}`);
  console.log(`  ${colorize('⚠️  Warning:', 'yellow')}      ${warning}`);
  console.log(`  ${colorize('❌ Error:', 'red')}         ${error}`);
  console.log('');
  console.log(`  ${colorize('Health Score:', 'bright')}   ${healthScore}%`);
  console.log('');

  let overallStatus = 'EXCELLENT';
  let statusColor = 'green';

  if (healthScore < 100 && healthScore >= 80) {
    overallStatus = 'GOOD';
    statusColor = 'green';
  } else if (healthScore < 80 && healthScore >= 60) {
    overallStatus = 'DEGRADED';
    statusColor = 'yellow';
  } else if (healthScore < 60) {
    overallStatus = 'CRITICAL';
    statusColor = 'red';
  }

  console.log(colorize(`  Status: ${overallStatus}`, statusColor));
  console.log('');
  console.log(colorize('─'.repeat(72), 'dim'));
  console.log('');

  // Quick Actions
  if (error > 0 || warning > 0) {
    console.log(colorize('🔧 RECOMMENDED ACTIONS:', 'yellow'));
    console.log('');

    if (metrics.n8n.status !== 'OK') {
      console.log('  • Fix N8N credentials: node scripts/fix-n8n-refresh-tokens.js');
    }
    if (metrics.integrations.status !== 'OK') {
      console.log('  • Reconnect email integrations in app');
    }
    if (metrics.backendAPI.status !== 'OK') {
      console.log('  • Start backend: .\\start-backend.ps1');
    }
    if (metrics.emailQueue.status !== 'OK') {
      console.log('  • Check email processing logs');
    }
    if (metrics.voiceAnalysis.status !== 'OK') {
      console.log('  • Trigger voice analysis for users');
    }

    console.log('');
    console.log('  📖 See: IMMEDIATE_ACTION_PLAN.md');
    console.log('');
  } else {
    console.log(colorize('🎉 ALL SYSTEMS OPERATIONAL!', 'green'));
    console.log('');
  }

  console.log(colorize('─'.repeat(72), 'dim'));
  console.log('');
  console.log(colorize('💡 Quick Commands:', 'cyan'));
  console.log('  • Health Check:      node scripts/monitor-system-health.js');
  console.log('  • Validate Creds:    node scripts/validate-n8n-credentials.js');
  console.log('  • Test Flow:         node scripts/test-complete-flow.js');
  console.log('  • Run Tests:         npm run test:all');
  console.log('');
  console.log(colorize('─'.repeat(72), 'dim'));
  console.log('');
}

// Run dashboard
showOperationsDashboard();

