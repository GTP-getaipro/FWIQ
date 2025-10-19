/**
 * Architecture Contract Validator
 * 
 * Validates that frozen contracts haven't been modified without proper RFC
 * Run this in CI/CD before allowing merges to main
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Frozen contract definitions
const FROZEN_CONTRACTS = {
  database: {
    tables: ['profiles', 'integrations', 'business_labels', 'workflows'],
    requiredColumns: {
      integrations: ['id', 'user_id', 'provider', 'access_token', 'refresh_token', 'status'],
      business_labels: ['id', 'provider', 'label_id', 'label_name', 'business_profile_id'],
      workflows: ['id', 'client_id', 'n8n_workflow_id', 'version', 'status'],
      profiles: ['id', 'email', 'onboarding_step']
    }
  },
  api: {
    endpoints: [
      { method: 'POST', path: '/api/workflows/deploy' }
    ]
  },
  n8n: {
    credentialTypes: ['gmailOAuth2Api', 'microsoftOutlookOAuth2Api'],
    endpoints: ['/rest/credentials', '/rest/workflows', '/rest/workflows/{id}/activate']
  },
  enums: {
    providers: ['gmail', 'outlook'],
    onboarding_steps: ['email_integration', 'business_type', 'business_information', 'team_setup', 'deploy', 'completed'],
    label_categories: ['Sales', 'Support', 'Operations', 'Banking', 'Marketing', 'HR', 'Admin']
  }
};

async function validateDatabaseContracts() {
  console.log('\n🔍 Validating Database Contracts...');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('⚠️  Skipping database validation - credentials not configured');
    return { passed: true, warnings: ['Database credentials not configured'] };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const errors = [];
  const warnings = [];

  try {
    // Check each required table
    for (const tableName of FROZEN_CONTRACTS.database.tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        if (error.code === 'PGRST116') {
          errors.push(`❌ Required table missing: ${tableName}`);
        } else {
          warnings.push(`⚠️  Table ${tableName}: ${error.message}`);
        }
      } else {
        console.log(`✅ Table exists: ${tableName}`);
      }
    }

    // Validate required columns (basic check)
    for (const [table, columns] of Object.entries(FROZEN_CONTRACTS.database.requiredColumns)) {
      const { data, error } = await supabase
        .from(table)
        .select(columns.join(','))
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          const missingCol = error.message.match(/column [^\s]+ /)?.[0];
          errors.push(`❌ Missing required column in ${table}: ${missingCol || 'unknown'}`);
        } else {
          warnings.push(`⚠️  Column validation warning for ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ Required columns present in: ${table}`);
      }
    }

  } catch (err) {
    errors.push(`❌ Database validation error: ${err.message}`);
  }

  return { passed: errors.length === 0, errors, warnings };
}

function validateFileContracts() {
  console.log('\n🔍 Validating File Contracts...');
  
  const errors = [];
  const warnings = [];

  // Check critical files exist
  const criticalFiles = [
    'src/lib/workflowDeployer.js',
    'src/lib/n8nCorsProxy.js',
    'src/lib/labelSyncService.js',
    'src/lib/deployment.js',
    'backend/src/server.js',
    'supabase/functions/n8n-proxy/index.ts'
  ];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      errors.push(`❌ Critical file missing: ${file}`);
    } else {
      console.log(`✅ File exists: ${file}`);
    }
  }

  // Check for required API endpoints in backend
  const backendServer = fs.readFileSync('backend/src/server.js', 'utf8');
  
  for (const endpoint of FROZEN_CONTRACTS.api.endpoints) {
    const pattern = new RegExp(`app\\.${endpoint.method.toLowerCase()}\\(['"]${endpoint.path.replace(/\//g, '\\/')}['"]`);
    if (!pattern.test(backendServer)) {
      errors.push(`❌ API endpoint missing: ${endpoint.method} ${endpoint.path}`);
    } else {
      console.log(`✅ API endpoint found: ${endpoint.method} ${endpoint.path}`);
    }
  }

  return { passed: errors.length === 0, errors, warnings };
}

function validateN8nContracts() {
  console.log('\n🔍 Validating n8n Contracts...');
  
  const errors = [];
  const warnings = [];

  // Check credential creator uses correct types
  if (fs.existsSync('src/lib/n8nCredentialCreator.js')) {
    const credCreator = fs.readFileSync('src/lib/n8nCredentialCreator.js', 'utf8');
    
    for (const credType of FROZEN_CONTRACTS.n8n.credentialTypes) {
      if (!credCreator.includes(credType)) {
        warnings.push(`⚠️  Credential type not found in creator: ${credType}`);
      } else {
        console.log(`✅ Credential type used: ${credType}`);
      }
    }

    // Validate correct endpoints
    if (!credCreator.includes('/rest/credentials')) {
      errors.push(`❌ Credential creator using wrong endpoint (should be /rest/credentials)`);
    } else {
      console.log(`✅ Using correct n8n endpoint: /rest/credentials`);
    }
  }

  return { passed: errors.length === 0, errors, warnings };
}

async function main() {
  console.log('🏛️  FloworxV2 Architecture Contract Validator');
  console.log('='.repeat(60));

  const results = {
    database: await validateDatabaseContracts(),
    files: validateFileContracts(),
    n8n: validateN8nContracts()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 Validation Results:');
  console.log('='.repeat(60));

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const [category, result] of Object.entries(results)) {
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (result.errors?.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
      result.errors.forEach(err => console.log(`    ${err}`));
      totalErrors += result.errors.length;
    }
    
    if (result.warnings?.length > 0) {
      console.log(`  Warnings: ${result.warnings.length}`);
      result.warnings.forEach(warn => console.log(`    ${warn}`));
      totalWarnings += result.warnings.length;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📈 Summary: ${totalErrors} errors, ${totalWarnings} warnings`);
  console.log('='.repeat(60));

  if (totalErrors > 0) {
    console.log('\n❌ Contract validation FAILED');
    console.log('   Fix errors above or create RFC for contract changes');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  Contract validation passed with warnings');
    console.log('   Review warnings to ensure compliance');
    process.exit(0);
  } else {
    console.log('\n✅ All contracts validated successfully!');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('\n❌ Validation script error:', error);
  process.exit(1);
});

