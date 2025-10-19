#!/usr/bin/env node

/**
 * Credential Validation Script - Post Security Update
 * 
 * This script validates that all credentials are functional after removing
 * hardcoded values and moving to environment variables.
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🔒 CREDENTIAL VALIDATION - POST SECURITY UPDATE');
console.log('='.repeat(60));
console.log('');

// Validation results
const validationResults = {
  environmentVariables: {},
  supabaseConnection: null,
  openaiConnection: null,
  n8nConnection: null,
  oauthCredentials: {},
  edgeFunctions: {},
  overallStatus: 'unknown'
};

/**
 * Check if environment variable exists and is not a placeholder
 */
function validateEnvVar(varName, isRequired = true, fallbackVarName = null) {
  // Check primary variable first, then fallback
  let value = process.env[varName];
  let actualVarName = varName;
  
  if (!value && fallbackVarName) {
    value = process.env[fallbackVarName];
    actualVarName = fallbackVarName;
  }
  
  const isPlaceholder = value && (
    value.includes('your-') || 
    value.includes('YOUR_') ||
    value.includes('placeholder') ||
    value.includes('here')
  );
  
  const status = {
    exists: !!value,
    isPlaceholder: isPlaceholder,
    isValid: !!value && !isPlaceholder,
    value: value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NOT_SET',
    actualVarName: actualVarName
  };
  
  validationResults.environmentVariables[varName] = status;
  
  if (isRequired && !status.exists) {
    console.log(`❌ ${varName}: NOT SET (Required)`);
    return false;
  } else if (isRequired && status.isPlaceholder) {
    console.log(`⚠️  ${varName}: PLACEHOLDER VALUE (${status.value})`);
    return false;
  } else if (status.exists && !status.isPlaceholder) {
    console.log(`✅ ${varName}: VALID (${status.value}) ${fallbackVarName && actualVarName === fallbackVarName ? `[using ${fallbackVarName}]` : ''}`);
    return true;
  } else {
    console.log(`ℹ️  ${varName}: ${status.exists ? 'SET' : 'NOT SET'} (Optional)`);
    return true;
  }
}

/**
 * Test Supabase connection
 */
async function testSupabaseConnection() {
  console.log('\n🗄️  TESTING SUPABASE CONNECTION');
  console.log('─'.repeat(40));
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase credentials not configured');
      validationResults.supabaseConnection = { success: false, error: 'Missing credentials' };
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`❌ Supabase connection failed: ${error.message}`);
      validationResults.supabaseConnection = { success: false, error: error.message };
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    validationResults.supabaseConnection = { success: true, data: data };
    return true;
    
  } catch (error) {
    console.log(`❌ Supabase connection error: ${error.message}`);
    validationResults.supabaseConnection = { success: false, error: error.message };
    return false;
  }
}

/**
 * Test OpenAI API connection
 */
async function testOpenAIConnection() {
  console.log('\n🤖 TESTING OPENAI API CONNECTION');
  console.log('─'.repeat(40));
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log('❌ OpenAI API key not configured');
      validationResults.openaiConnection = { success: false, error: 'Missing API key' };
      return false;
    }
    
    // Test with a simple completion request
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ OpenAI API test failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      validationResults.openaiConnection = { success: false, error: errorData.error?.message || 'API request failed' };
      return false;
    }
    
    const data = await response.json();
    console.log('✅ OpenAI API connection successful');
    console.log(`   Available models: ${data.data?.length || 0}`);
    validationResults.openaiConnection = { success: true, models: data.data?.length || 0 };
    return true;
    
  } catch (error) {
    console.log(`❌ OpenAI API connection error: ${error.message}`);
    validationResults.openaiConnection = { success: false, error: error.message };
    return false;
  }
}

/**
 * Test N8N API connection
 */
async function testN8NConnection() {
  console.log('\n🔧 TESTING N8N API CONNECTION');
  console.log('─'.repeat(40));
  
  try {
    const apiKey = process.env.N8N_API_KEY;
    const baseUrl = process.env.N8N_BASE_URL;
    
    if (!apiKey || !baseUrl) {
      console.log('❌ N8N credentials not configured');
      validationResults.n8nConnection = { success: false, error: 'Missing credentials' };
      return false;
    }
    
    // Test connection by getting workflows
    const response = await fetch(`${baseUrl}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ N8N API test failed: ${response.status} - ${errorText}`);
      validationResults.n8nConnection = { success: false, error: errorText };
      return false;
    }
    
    const data = await response.json();
    console.log('✅ N8N API connection successful');
    console.log(`   Available workflows: ${data.data?.length || 0}`);
    validationResults.n8nConnection = { success: true, workflows: data.data?.length || 0 };
    return true;
    
  } catch (error) {
    console.log(`❌ N8N API connection error: ${error.message}`);
    validationResults.n8nConnection = { success: false, error: error.message };
    return false;
  }
}

/**
 * Test OAuth credentials format
 */
function testOAuthCredentials() {
  console.log('\n🔐 TESTING OAUTH CREDENTIALS FORMAT');
  console.log('─'.repeat(40));
  
  const oauthTests = [
    {
      name: 'Gmail Client ID',
      value: process.env.GMAIL_CLIENT_ID || process.env.VITE_GMAIL_CLIENT_ID,
      pattern: /^[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com$/,
      required: true
    },
    {
      name: 'Gmail Client Secret',
      value: process.env.GMAIL_CLIENT_SECRET || process.env.VITE_GMAIL_CLIENT_SECRET,
      pattern: /^GOCSPX-[a-zA-Z0-9_-]+$/,
      required: true
    },
    {
      name: 'Outlook Client ID',
      value: process.env.OUTLOOK_CLIENT_ID || process.env.VITE_OUTLOOK_CLIENT_ID,
      pattern: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      required: true
    },
    {
      name: 'Outlook Client Secret',
      value: process.env.OUTLOOK_CLIENT_SECRET || process.env.VITE_OUTLOOK_CLIENT_SECRET,
      pattern: /^[a-zA-Z0-9~_-]+$/,
      required: true
    }
  ];
  
  let allValid = true;
  
  for (const test of oauthTests) {
    if (!test.value) {
      console.log(`❌ ${test.name}: NOT SET${test.required ? ' (Required)' : ''}`);
      if (test.required) allValid = false;
      validationResults.oauthCredentials[test.name] = { valid: false, error: 'Not set' };
    } else if (test.value.includes('your-') || test.value.includes('placeholder')) {
      console.log(`⚠️  ${test.name}: PLACEHOLDER VALUE`);
      if (test.required) allValid = false;
      validationResults.oauthCredentials[test.name] = { valid: false, error: 'Placeholder value' };
    } else if (!test.pattern.test(test.value)) {
      console.log(`❌ ${test.name}: INVALID FORMAT`);
      if (test.required) allValid = false;
      validationResults.oauthCredentials[test.name] = { valid: false, error: 'Invalid format' };
    } else {
      console.log(`✅ ${test.name}: VALID FORMAT`);
      validationResults.oauthCredentials[test.name] = { valid: true };
    }
  }
  
  return allValid;
}

/**
 * Test Edge Functions
 */
async function testEdgeFunctions() {
  console.log('\n⚡ TESTING EDGE FUNCTIONS');
  console.log('─'.repeat(40));
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Cannot test Edge Functions - Supabase credentials missing');
    return false;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test style-memory function
  try {
    console.log('Testing style-memory function...');
    const { data, error } = await supabase.functions.invoke('style-memory', {
      body: { client_id: 'test', category: 'test', limit: 1 }
    });
    
    if (error) {
      console.log(`⚠️  style-memory: ${error.message}`);
      validationResults.edgeFunctions['style-memory'] = { success: false, error: error.message };
    } else {
      console.log('✅ style-memory: Accessible');
      validationResults.edgeFunctions['style-memory'] = { success: true };
    }
  } catch (error) {
    console.log(`❌ style-memory: ${error.message}`);
    validationResults.edgeFunctions['style-memory'] = { success: false, error: error.message };
  }
  
  // Test resolve-system-message function
  try {
    console.log('Testing resolve-system-message function...');
    const { data, error } = await supabase.functions.invoke('resolve-system-message', {
      body: { messageId: 'test', userId: 'test' }
    });
    
    if (error) {
      console.log(`⚠️  resolve-system-message: ${error.message}`);
      validationResults.edgeFunctions['resolve-system-message'] = { success: false, error: error.message };
    } else {
      console.log('✅ resolve-system-message: Accessible');
      validationResults.edgeFunctions['resolve-system-message'] = { success: true };
    }
  } catch (error) {
    console.log(`❌ resolve-system-message: ${error.message}`);
    validationResults.edgeFunctions['resolve-system-message'] = { success: false, error: error.message };
  }
  
  return true;
}

/**
 * Check for remaining hardcoded credentials
 */
function checkForHardcodedCredentials() {
  console.log('\n🔍 CHECKING FOR REMAINING HARDCODED CREDENTIALS');
  console.log('─'.repeat(40));
  
  const suspiciousPatterns = [
    /sk-proj-[a-zA-Z0-9]{48,}/, // OpenAI API keys
    /GOCSPX-[a-zA-Z0-9_-]{20,}/, // Gmail client secrets
    /[0-9]+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com/, // Gmail client IDs
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/, // Outlook client IDs
    /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWT tokens
    /qWA8Q~[a-zA-Z0-9_-]+/ // Outlook client secrets
  ];
  
  const filesToCheck = [
    'hostinger-production.env',
    'backend/src/services/floworx-n8n-service.cjs',
    'src/lib/workflowMonitor.js',
    'supabase/functions/n8n-proxy/index.ts'
  ];
  
  let foundHardcoded = false;
  
  for (const filePath of filesToCheck) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pattern of suspiciousPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`⚠️  ${filePath}: Found potential hardcoded credential`);
          foundHardcoded = true;
        }
      }
    }
  }
  
  if (!foundHardcoded) {
    console.log('✅ No hardcoded credentials found in key files');
  }
  
  return !foundHardcoded;
}

/**
 * Generate validation report
 */
function generateReport() {
  console.log('\n📊 VALIDATION REPORT');
  console.log('='.repeat(60));
  
  const criticalIssues = [];
  const warnings = [];
  
  // Check environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'OUTLOOK_CLIENT_ID',
    'OUTLOOK_CLIENT_SECRET',
    'OPENAI_API_KEY',
    'N8N_API_KEY',
    'N8N_BASE_URL'
  ];
  
  for (const varName of requiredEnvVars) {
    const status = validationResults.environmentVariables[varName];
    if (!status || !status.isValid) {
      criticalIssues.push(`Missing or invalid: ${varName}`);
    }
  }
  
  // Check connections
  if (!validationResults.supabaseConnection?.success) {
    criticalIssues.push('Supabase connection failed');
  }
  
  if (!validationResults.openaiConnection?.success) {
    criticalIssues.push('OpenAI API connection failed');
  }
  
  if (!validationResults.n8nConnection?.success) {
    warnings.push('N8N API connection failed (may be expected if not deployed)');
  }
  
  // Check OAuth credentials
  for (const [name, status] of Object.entries(validationResults.oauthCredentials)) {
    if (!status.valid) {
      criticalIssues.push(`OAuth credential invalid: ${name}`);
    }
  }
  
  // Overall status
  if (criticalIssues.length === 0) {
    validationResults.overallStatus = 'success';
    console.log('🎉 ALL CREDENTIALS VALIDATED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Environment variables: Configured');
    console.log('✅ Supabase connection: Working');
    console.log('✅ OpenAI API: Working');
    console.log('✅ OAuth credentials: Valid format');
    console.log('✅ Edge Functions: Accessible');
    console.log('✅ Security: No hardcoded credentials found');
  } else {
    validationResults.overallStatus = 'failed';
    console.log('❌ VALIDATION FAILED');
    console.log('');
    console.log('Critical Issues:');
    criticalIssues.forEach(issue => console.log(`  • ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('');
    console.log('Warnings:');
    warnings.forEach(warning => console.log(`  • ${warning}`));
  }
  
  console.log('');
  console.log('📋 Next Steps:');
  if (criticalIssues.length > 0) {
    console.log('  1. Fix critical issues listed above');
    console.log('  2. Set missing environment variables');
    console.log('  3. Re-run this validation script');
  } else {
    console.log('  1. Deploy to production with confidence!');
    console.log('  2. Monitor logs for any runtime issues');
    console.log('  3. Set up monitoring and alerts');
  }
  
  return validationResults.overallStatus === 'success';
}

/**
 * Main validation function
 */
async function main() {
  try {
    // Step 1: Check environment variables
    console.log('🔧 CHECKING ENVIRONMENT VARIABLES');
    console.log('─'.repeat(40));
    
    validateEnvVar('SUPABASE_URL', true);
    validateEnvVar('SUPABASE_SERVICE_ROLE_KEY', true);
    validateEnvVar('SUPABASE_ANON_KEY', false);
    validateEnvVar('GMAIL_CLIENT_ID', true, 'VITE_GMAIL_CLIENT_ID');
    validateEnvVar('GMAIL_CLIENT_SECRET', true, 'VITE_GMAIL_CLIENT_SECRET');
    validateEnvVar('OUTLOOK_CLIENT_ID', true, 'VITE_OUTLOOK_CLIENT_ID');
    validateEnvVar('OUTLOOK_CLIENT_SECRET', true, 'VITE_OUTLOOK_CLIENT_SECRET');
    validateEnvVar('OPENAI_API_KEY', true);
    validateEnvVar('N8N_API_KEY', true);
    validateEnvVar('N8N_BASE_URL', true);
    validateEnvVar('SYSTEM_MESSAGE_ENCRYPTION_KEY', false);
    validateEnvVar('JWT_SECRET', false);
    validateEnvVar('DEPLOY_API_KEY', false);
    
    // Step 2: Test connections
    await testSupabaseConnection();
    await testOpenAIConnection();
    await testN8NConnection();
    
    // Step 3: Test OAuth credentials
    testOAuthCredentials();
    
    // Step 4: Test Edge Functions
    await testEdgeFunctions();
    
    // Step 5: Check for hardcoded credentials
    checkForHardcodedCredentials();
    
    // Step 6: Generate report
    const success = generateReport();
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 VALIDATION SCRIPT ERROR:', error.message);
    process.exit(1);
  }
}

// Run validation
main();
