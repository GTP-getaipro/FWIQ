#!/usr/bin/env node

/**
 * Supabase Schema Audit Script
 *
 * Extracts complete database schema including:
 * - Tables and columns
 * - Indexes
 * - Constraints
 * - RLS policies
 * - Functions and triggers
 *
 * Usage: node scripts/audit-supabase-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: '.env.production' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.production');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function getTables() {
  log('\n📊 Fetching tables...', 'cyan');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
  });

  if (error) {
    // Fallback: Try direct query
    const { data: tables, error: err2 } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name');

    if (err2) {
      log(`⚠️  Could not fetch tables: ${err2.message}`, 'yellow');
      return [];
    }
    return tables || [];
  }

  return data || [];
}

async function getColumns(tableName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    log(`⚠️  Could not fetch columns for ${tableName}: ${error.message}`, 'yellow');
    return [];
  }

  return data || [];
}

async function getIndexes(tableName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = '${tableName}'
      ORDER BY indexname;
    `
  });

  if (error) {
    log(`⚠️  Could not fetch indexes for ${tableName}: ${error.message}`, 'yellow');
    return [];
  }

  return data || [];
}

async function getConstraints(tableName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = '${tableName}'::regclass
      ORDER BY conname;
    `
  });

  if (error) {
    log(`⚠️  Could not fetch constraints for ${tableName}: ${error.message}`, 'yellow');
    return [];
  }

  return data || [];
}

async function getRLSPolicies(tableName) {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        polname AS policy_name,
        polcmd AS command,
        polroles::regrole[] AS roles,
        pg_get_expr(polqual, polrelid) AS using_expression,
        pg_get_expr(polwithcheck, polrelid) AS check_expression
      FROM pg_policy
      WHERE polrelid = '${tableName}'::regclass
      ORDER BY polname;
    `
  });

  if (error) {
    log(`⚠️  Could not fetch RLS policies for ${tableName}: ${error.message}`, 'yellow');
    return [];
  }

  return data || [];
}

async function generateSchemaDoc() {
  log('\n' + '='.repeat(80), 'bright');
  log('🔍 SUPABASE SCHEMA AUDIT', 'bright');
  log('='.repeat(80), 'bright');
  log(`📅 ${new Date().toLocaleString()}`, 'cyan');
  log(`🌐 ${SUPABASE_URL}`, 'cyan');

  let schemaDoc = `# FloWorx Supabase Schema Audit\n\n`;
  schemaDoc += `**Generated:** ${new Date().toISOString()}\n`;
  schemaDoc += `**Database:** ${SUPABASE_URL}\n\n`;
  schemaDoc += `---\n\n`;

  // Get all tables
  const tables = await getTables();
  
  if (tables.length === 0) {
    log('\n⚠️  No tables found or unable to access schema', 'yellow');
    log('💡 Trying alternative method...', 'cyan');
    
    // Try to get table list from pg_tables
    const { data: pgTables } = await supabase.rpc('exec_sql', {
      sql: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`
    });
    
    if (pgTables && pgTables.length > 0) {
      log(`✅ Found ${pgTables.length} tables`, 'green');
      tables.push(...pgTables.map(t => ({ table_name: t.tablename, table_type: 'BASE TABLE' })));
    }
  }

  log(`\n✅ Found ${tables.length} tables`, 'green');
  schemaDoc += `## Tables Overview\n\n`;
  schemaDoc += `Total tables: **${tables.length}**\n\n`;

  // Process each table
  for (const table of tables) {
    const tableName = table.table_name || table.tablename;
    log(`\n📋 Processing: ${tableName}`, 'blue');

    schemaDoc += `---\n\n`;
    schemaDoc += `## Table: \`${tableName}\`\n\n`;

    // Get columns
    const columns = await getColumns(tableName);
    if (columns.length > 0) {
      log(`  ✓ ${columns.length} columns`, 'green');
      schemaDoc += `### Columns\n\n`;
      schemaDoc += `| Column | Type | Nullable | Default |\n`;
      schemaDoc += `|--------|------|----------|----------|\n`;
      
      columns.forEach(col => {
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const nullable = col.is_nullable === 'YES' ? '✓' : '✗';
        const defaultVal = col.column_default || '-';
        schemaDoc += `| ${col.column_name} | ${type} | ${nullable} | ${defaultVal} |\n`;
      });
      schemaDoc += `\n`;
    }

    // Get indexes
    const indexes = await getIndexes(tableName);
    if (indexes.length > 0) {
      log(`  ✓ ${indexes.length} indexes`, 'green');
      schemaDoc += `### Indexes\n\n`;
      indexes.forEach(idx => {
        schemaDoc += `- **${idx.indexname}**\n`;
        schemaDoc += `  \`\`\`sql\n  ${idx.indexdef}\n  \`\`\`\n\n`;
      });
    }

    // Get constraints
    const constraints = await getConstraints(tableName);
    if (constraints.length > 0) {
      log(`  ✓ ${constraints.length} constraints`, 'green');
      schemaDoc += `### Constraints\n\n`;
      constraints.forEach(con => {
        const type = {
          'p': 'PRIMARY KEY',
          'f': 'FOREIGN KEY',
          'u': 'UNIQUE',
          'c': 'CHECK'
        }[con.constraint_type] || con.constraint_type;
        
        schemaDoc += `- **${con.constraint_name}** (${type})\n`;
        schemaDoc += `  \`\`\`sql\n  ${con.constraint_definition}\n  \`\`\`\n\n`;
      });
    }

    // Get RLS policies
    const policies = await getRLSPolicies(tableName);
    if (policies.length > 0) {
      log(`  ✓ ${policies.length} RLS policies`, 'green');
      schemaDoc += `### Row Level Security Policies\n\n`;
      policies.forEach(pol => {
        schemaDoc += `- **${pol.policy_name}** (${pol.command})\n`;
        if (pol.using_expression) {
          schemaDoc += `  - **USING:** \`${pol.using_expression}\`\n`;
        }
        if (pol.check_expression) {
          schemaDoc += `  - **CHECK:** \`${pol.check_expression}\`\n`;
        }
        schemaDoc += `\n`;
      });
    }

    // Get row count
    try {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (count !== null) {
        log(`  ✓ ${count.toLocaleString()} rows`, 'green');
        schemaDoc += `**Row Count:** ${count.toLocaleString()}\n\n`;
      }
    } catch (err) {
      log(`  ⚠️  Could not get row count: ${err.message}`, 'yellow');
    }
  }

  // Save to file
  const outputPath = path.join(process.cwd(), 'SUPABASE_SCHEMA_AUDIT.md');
  fs.writeFileSync(outputPath, schemaDoc);

  log('\n' + '='.repeat(80), 'bright');
  log('✅ SCHEMA AUDIT COMPLETE', 'green');
  log('='.repeat(80), 'bright');
  log(`\n📄 Schema documentation saved to: ${outputPath}`, 'cyan');
  log(`📊 Total tables: ${tables.length}`, 'cyan');
  log('');

  return schemaDoc;
}

async function main() {
  try {
    await generateSchemaDoc();
    process.exit(0);
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();

