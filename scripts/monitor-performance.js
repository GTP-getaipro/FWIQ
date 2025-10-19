#!/usr/bin/env node

/**
 * FloWorx Performance Monitoring Script
 * 
 * Monitors:
 * - Database query performance
 * - Redis cache hit rates
 * - API response times
 * - Index usage statistics
 * 
 * Usage:
 *   node scripts/monitor-performance.js
 *   node scripts/monitor-performance.js --continuous  # Run every 5 minutes
 */

const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');
require('dotenv').config({ path: '.env.production' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REDIS_URL = process.env.REDIS_URL;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
let redis = null;

// Try to connect to Redis
try {
  if (REDIS_URL) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 2000);
      }
    });
  }
} catch (error) {
  console.warn('⚠️  Redis not available:', error.message);
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function checkDatabasePerformance() {
  log('\n📊 DATABASE PERFORMANCE', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    // Check slow queries
    const { data: slowQueries, error: slowError } = await supabase.rpc('pg_stat_statements', {
      query: `
        SELECT 
          LEFT(query, 80) AS query_preview,
          calls,
          ROUND(mean_exec_time::numeric, 2) AS avg_ms,
          ROUND(max_exec_time::numeric, 2) AS max_ms
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
          AND calls > 10
        ORDER BY mean_exec_time DESC
        LIMIT 5
      `
    });

    if (!slowError && slowQueries) {
      log('\n🐌 Top 5 Slowest Queries:', 'yellow');
      slowQueries.forEach((q, i) => {
        const status = q.avg_ms > 100 ? '🔴' : q.avg_ms > 50 ? '⚠️' : '✅';
        log(`  ${i + 1}. ${status} ${q.avg_ms}ms avg (${q.max_ms}ms max) - ${q.calls} calls`);
        log(`     ${q.query_preview}...`, 'bright');
      });
    }

    // Check table sizes
    const { data: tables } = await supabase
      .from('pg_stat_user_tables')
      .select('schemaname, relname, n_live_tup, n_dead_tup')
      .eq('schemaname', 'public')
      .order('n_live_tup', { ascending: false })
      .limit(5);

    if (tables) {
      log('\n📦 Largest Tables:', 'blue');
      tables.forEach((t, i) => {
        const deadPct = t.n_live_tup > 0 
          ? Math.round(100 * t.n_dead_tup / (t.n_live_tup + t.n_dead_tup))
          : 0;
        const status = deadPct > 20 ? '🔴' : deadPct > 10 ? '⚠️' : '✅';
        log(`  ${i + 1}. ${status} ${t.relname}: ${t.n_live_tup.toLocaleString()} rows (${deadPct}% dead)`);
      });
    }

  } catch (error) {
    log(`❌ Database check failed: ${error.message}`, 'red');
  }
}

async function checkIndexUsage() {
  log('\n🔍 INDEX USAGE STATISTICS', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    // This is a simplified check - in production you'd query pg_stat_user_indexes
    const tables = ['email_logs', 'ai_responses', 'workflows', 'outlook_analytics_events'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        log(`  ✅ ${table}: ${count?.toLocaleString() || 0} rows`, 'green');
      }
    }

    log('\n  💡 Run scripts/monitor-database-performance.sql in Supabase for detailed index stats', 'yellow');

  } catch (error) {
    log(`❌ Index check failed: ${error.message}`, 'red');
  }
}

async function checkRedisPerformance() {
  log('\n🔴 REDIS CACHE PERFORMANCE', 'cyan');
  log('='.repeat(60), 'cyan');

  if (!redis) {
    log('  ⚠️  Redis not configured or not available', 'yellow');
    return;
  }

  try {
    // Test Redis connection
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      log('  ❌ Redis not responding', 'red');
      return;
    }

    // Get Redis info
    const info = await redis.info('stats');
    const memory = await redis.info('memory');

    // Parse stats
    const statsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);
    const memoryMatch = memory.match(/used_memory_human:([^\r\n]+)/);

    const hits = statsMatch ? parseInt(statsMatch[1]) : 0;
    const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
    const total = hits + misses;
    const hitRate = total > 0 ? Math.round(100 * hits / total) : 0;

    log(`  ✅ Redis connected`, 'green');
    log(`  📊 Cache Hits: ${hits.toLocaleString()}`);
    log(`  📊 Cache Misses: ${misses.toLocaleString()}`);
    
    const hitRateStatus = hitRate >= 80 ? '✅' : hitRate >= 60 ? '⚠️' : '🔴';
    log(`  ${hitRateStatus} Hit Rate: ${hitRate}%`, hitRate >= 80 ? 'green' : 'yellow');
    
    if (memoryMatch) {
      log(`  💾 Memory Used: ${memoryMatch[1]}`);
    }

    // Get key count
    const dbSize = await redis.dbsize();
    log(`  🔑 Total Keys: ${dbSize.toLocaleString()}`);

    // Sample some keys
    const keys = await redis.keys('cache:*');
    if (keys.length > 0) {
      log(`\n  📝 Sample Cache Keys (${Math.min(5, keys.length)} of ${keys.length}):`);
      keys.slice(0, 5).forEach(key => {
        log(`     - ${key}`, 'bright');
      });
    }

  } catch (error) {
    log(`  ❌ Redis check failed: ${error.message}`, 'red');
  }
}

async function checkAPIPerformance() {
  log('\n🌐 API ENDPOINT PERFORMANCE', 'cyan');
  log('='.repeat(60), 'cyan');

  const endpoints = [
    { name: 'Email Logs', table: 'email_logs', limit: 20 },
    { name: 'AI Responses', table: 'ai_responses', limit: 20 },
    { name: 'Workflows', table: 'workflows', limit: 20 },
    { name: 'Analytics Events', table: 'outlook_analytics_events', limit: 20 }
  ];

  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      
      const { data, error } = await supabase
        .from(endpoint.table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(endpoint.limit);

      const duration = Date.now() - start;
      
      if (error) {
        log(`  ❌ ${endpoint.name}: ${error.message}`, 'red');
      } else {
        const status = duration < 50 ? '✅' : duration < 100 ? '⚡' : duration < 200 ? '⚠️' : '🔴';
        const color = duration < 100 ? 'green' : duration < 200 ? 'yellow' : 'red';
        log(`  ${status} ${endpoint.name}: ${duration}ms (${data?.length || 0} rows)`, color);
      }

    } catch (error) {
      log(`  ❌ ${endpoint.name}: ${error.message}`, 'red');
    }
  }
}

async function generateReport() {
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 FLOWORX PERFORMANCE MONITORING REPORT', 'bright');
  log('='.repeat(60), 'bright');
  log(`📅 ${new Date().toLocaleString()}`, 'cyan');

  await checkDatabasePerformance();
  await checkIndexUsage();
  await checkRedisPerformance();
  await checkAPIPerformance();

  log('\n' + '='.repeat(60), 'bright');
  log('✅ MONITORING COMPLETE', 'green');
  log('='.repeat(60), 'bright');
  log('\n💡 Tips:', 'yellow');
  log('  - Run scripts/monitor-database-performance.sql for detailed DB stats');
  log('  - Check Supabase Dashboard → Database → Query Performance');
  log('  - Monitor Redis with: docker exec -it floworx-redis redis-cli INFO');
  log('  - Set up alerts for slow queries (>100ms) and low cache hit rates (<80%)');
  log('');
}

async function main() {
  const continuous = process.argv.includes('--continuous');

  if (continuous) {
    log('🔄 Running in continuous mode (every 5 minutes)', 'cyan');
    log('   Press Ctrl+C to stop\n', 'yellow');

    // Run immediately
    await generateReport();

    // Then run every 5 minutes
    setInterval(async () => {
      await generateReport();
    }, 5 * 60 * 1000);

  } else {
    // Run once
    await generateReport();
    
    // Cleanup
    if (redis) {
      await redis.quit();
    }
    process.exit(0);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', async () => {
  log('\n\n👋 Shutting down monitoring...', 'yellow');
  if (redis) {
    await redis.quit();
  }
  process.exit(0);
});

// Run
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

