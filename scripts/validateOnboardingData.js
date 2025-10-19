#!/usr/bin/env node

/**
 * Onboarding Data Validation Script
 * 
 * Command-line tool to validate onboarding data for n8n deployment
 * Usage: node scripts/validateOnboardingData.js [userId]
 */

import { OnboardingValidationSystem, quickValidateDeploymentReadiness, generateValidationReport } from '../src/lib/onboardingValidation.js';
import { supabase } from '../src/lib/customSupabaseClient.js';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('\n' + '='.repeat(60));
  console.log(colorize(title, 'bright'));
  console.log('='.repeat(60));
}

function printSection(title) {
  console.log('\n' + colorize(title, 'cyan'));
  console.log('-'.repeat(title.length));
}

function printStatus(status, message) {
  const statusColor = status === 'valid' ? 'green' : status === 'warning' ? 'yellow' : 'red';
  const statusSymbol = status === 'valid' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  console.log(`${statusSymbol} ${colorize(status.toUpperCase(), statusColor)}: ${message}`);
}

function printError(error) {
  console.log(`${colorize('❌ ERROR:', 'red')} ${error}`);
}

function printWarning(warning) {
  console.log(`${colorize('⚠️ WARNING:', 'yellow')} ${warning}`);
}

function printSuccess(message) {
  console.log(`${colorize('✅ SUCCESS:', 'green')} ${message}`);
}

async function validateUser(userId) {
  printHeader(`VALIDATING ONBOARDING DATA FOR USER: ${userId}`);
  
  try {
    // Quick validation first
    printSection('Quick Deployment Readiness Check');
    const quickValidation = await quickValidateDeploymentReadiness(userId);
    
    if (quickValidation.isReady) {
      printSuccess('User is ready for n8n deployment!');
    } else {
      printError(`User is not ready for deployment: ${quickValidation.status}`);
    }
    
    // Detailed validation
    printSection('Detailed Validation Report');
    const detailedValidation = await generateValidationReport(userId);
    
    // Print step-by-step results
    printSection('Step-by-Step Validation');
    Object.entries(detailedValidation.steps).forEach(([stepName, stepData]) => {
      const stepDisplayName = stepName.replace('step', 'Step ').replace(/_/g, ' ').toUpperCase();
      printStatus(stepData.status, stepDisplayName);
      
      if (stepData.errors && stepData.errors.length > 0) {
        stepData.errors.forEach(error => printError(`  ${error}`));
      }
      
      if (stepData.warnings && stepData.warnings.length > 0) {
        stepData.warnings.forEach(warning => printWarning(`  ${warning}`));
      }
    });
    
    // Print data quality results
    printSection('Data Quality Validation');
    printStatus(detailedValidation.dataQuality.status, 'Data Quality');
    
    if (detailedValidation.dataQuality.errors && detailedValidation.dataQuality.errors.length > 0) {
      detailedValidation.dataQuality.errors.forEach(error => printError(`  ${error}`));
    }
    
    // Print n8n readiness results
    printSection('N8N Readiness Validation');
    printStatus(detailedValidation.n8nReadiness.status, 'N8N Readiness');
    
    if (detailedValidation.n8nReadiness.errors && detailedValidation.n8nReadiness.errors.length > 0) {
      detailedValidation.n8nReadiness.errors.forEach(error => printError(`  ${error}`));
    }
    
    // Print provider support results
    printSection('Provider Support Validation');
    printStatus(detailedValidation.providerSupport.status, `Provider Support (${detailedValidation.providerSupport.provider})`);
    
    if (detailedValidation.providerSupport.errors && detailedValidation.providerSupport.errors.length > 0) {
      detailedValidation.providerSupport.errors.forEach(error => printError(`  ${error}`));
    }
    
    // Print overall status
    printSection('Overall Validation Status');
    printStatus(detailedValidation.overallStatus, 'Overall Status');
    
    // Print recommendations
    if (detailedValidation.recommendations && detailedValidation.recommendations.length > 0) {
      printSection('Recommendations');
      detailedValidation.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    // Print summary
    printSection('Summary');
    console.log(`User ID: ${userId}`);
    console.log(`Validation Timestamp: ${detailedValidation.timestamp}`);
    console.log(`Overall Status: ${colorize(detailedValidation.overallStatus.toUpperCase(), detailedValidation.overallStatus === 'valid' ? 'green' : 'red')}`);
    console.log(`Total Errors: ${detailedValidation.errors.length}`);
    console.log(`Total Warnings: ${detailedValidation.warnings.length}`);
    
    return detailedValidation;
    
  } catch (error) {
    printError(`Validation failed: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function validateAllUsers() {
  printHeader('VALIDATING ALL USERS');
  
  try {
    // Get all users with onboarding data
    const { data: users, error } = await supabase
      .from('onboarding_data')
      .select('user_id')
      .not('user_id', 'is', null);
    
    if (error) {
      printError(`Failed to fetch users: ${error.message}`);
      return;
    }
    
    const uniqueUserIds = [...new Set(users.map(u => u.user_id))];
    console.log(`Found ${uniqueUserIds.length} users with onboarding data`);
    
    const results = {
      valid: [],
      warning: [],
      invalid: [],
      error: []
    };
    
    for (const userId of uniqueUserIds) {
      console.log(`\nValidating user: ${userId}`);
      const validation = await quickValidateDeploymentReadiness(userId);
      
      if (validation.isReady) {
        results.valid.push(userId);
        printSuccess(`User ${userId} is ready for deployment`);
      } else {
        results[validation.status].push(userId);
        printError(`User ${userId} is not ready: ${validation.status}`);
      }
    }
    
    // Print summary
    printSection('Validation Summary');
    console.log(`Total Users: ${uniqueUserIds.length}`);
    console.log(`${colorize('Ready for Deployment:', 'green')} ${results.valid.length}`);
    console.log(`${colorize('Has Warnings:', 'yellow')} ${results.warning.length}`);
    console.log(`${colorize('Not Ready:', 'red')} ${results.invalid.length}`);
    console.log(`${colorize('Has Errors:', 'red')} ${results.error.length}`);
    
    return results;
    
  } catch (error) {
    printError(`Batch validation failed: ${error.message}`);
    console.error(error);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/validateOnboardingData.js [userId]');
    console.log('       node scripts/validateOnboardingData.js --all');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/validateOnboardingData.js user-123');
    console.log('  node scripts/validateOnboardingData.js --all');
    process.exit(1);
  }
  
  if (args[0] === '--all') {
    await validateAllUsers();
  } else {
    const userId = args[0];
    await validateUser(userId);
  }
}

// Run the script
main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
