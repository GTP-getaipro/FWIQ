/**
 * Comprehensive Test Runner
 * Executes all tests and generates a summary report
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_RESULTS_DIR = 'test-results';

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

function runCommand(command, description) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 ${description}`, 'bright');
  log('='.repeat(60), 'cyan');
  
  try {
    const startTime = Date.now();
    execSync(command, { stdio: 'inherit' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log(`✅ ${description} completed in ${duration}s`, 'green');
    return { success: true, duration };
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    return { success: false, duration: 0, error: error.message };
  }
}

async function runAllTests() {
  log('\n🚀 FloworxV2 Comprehensive Test Suite', 'bright');
  log('='.repeat(60), 'cyan');
  
  const startTime = Date.now();
  const results = [];

  // Ensure test results directory exists
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
  }

  // 1. Contract Validation
  results.push({
    name: 'Contract Validation',
    ...runCommand('npm run validate-contracts', 'Contract Validation')
  });

  // 2. Unit Tests
  results.push({
    name: 'Unit Tests',
    ...runCommand('npm run test:unit', 'Unit Tests')
  });

  // 3. Integration Tests
  results.push({
    name: 'Integration Tests',
    ...runCommand('npm run test:integration', 'Integration Tests')
  });

  // 4. E2E Tests
  results.push({
    name: 'E2E Tests',
    ...runCommand('npm run test:e2e', 'E2E Tests')
  });

  // 5. Generate coverage report
  results.push({
    name: 'Coverage Report',
    ...runCommand('npm run test:coverage', 'Coverage Report Generation')
  });

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Generate Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'bright');
  log('='.repeat(60), 'cyan');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    const duration = result.duration ? ` (${result.duration}s)` : '';
    log(`${status} ${result.name}${duration}`, color);
  });

  log('\n' + '-'.repeat(60), 'cyan');
  log(`Total Tests: ${total}`, 'bright');
  log(`Passed: ${passed}`, passed === total ? 'green' : 'yellow');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Duration: ${totalDuration}s`, 'blue');
  log('-'.repeat(60), 'cyan');

  // Save summary to JSON
  const summary = {
    timestamp: new Date().toISOString(),
    totalDuration: parseFloat(totalDuration),
    results,
    totals: {
      total,
      passed,
      failed,
      passRate: ((passed / total) * 100).toFixed(2) + '%'
    }
  };

  const summaryPath = path.join(TEST_RESULTS_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  log(`\n💾 Summary saved to ${summaryPath}`, 'cyan');

  // Exit with appropriate code
  if (failed > 0) {
    log('\n❌ TEST SUITE FAILED', 'red');
    process.exit(1);
  } else {
    log('\n🎉 ALL TESTS PASSED!', 'green');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test runner error: ${error.message}`, 'red');
  process.exit(1);
});

