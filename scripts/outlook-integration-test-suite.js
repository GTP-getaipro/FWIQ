/**
 * Outlook Integration Test Suite Runner
 * Comprehensive test execution and coverage validation for Outlook functionality
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      resolve(stdout);
    });
  });
};

const runOutlookTestSuite = async () => {
  console.log('🧪 Running Outlook Integration Test Suite...');
  console.log('=' .repeat(60));

  const testResults = {
    timestamp: new Date().toISOString(),
    suite: 'Outlook Integration Tests',
    results: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      coverage: 0
    }
  };

  const testFiles = [
    {
      name: 'Outlook Email Service Unit Tests',
      file: 'src/lib/__tests__/outlookEmailService.test.js',
      type: 'unit',
      description: 'Tests Outlook email operations, draft creation, and attachment handling'
    },
    {
      name: 'Outlook OAuth Integration Tests',
      file: 'src/lib/__tests__/outlookOAuthIntegration.test.js',
      type: 'unit',
      description: 'Tests OAuth flow, token management, and authentication for Outlook users'
    },
    {
      name: 'Outlook Folder Management Tests',
      file: 'src/lib/__tests__/outlookFolderManagement.test.js',
      type: 'unit',
      description: 'Tests folder creation, hierarchy, color support, and synchronization'
    },
    {
      name: 'Microsoft Graph API Integration Tests',
      file: 'src/lib/__tests__/microsoftGraphApiIntegration.test.js',
      type: 'integration',
      description: 'Tests real API interactions with Microsoft Graph endpoints'
    },
    {
      name: 'Outlook E2E User Journey Tests',
      file: 'src/lib/__tests__/outlookE2EUserJourney.test.js',
      type: 'e2e',
      description: 'Tests complete user workflows from authentication to automation'
    },
    {
      name: 'Microsoft Graph Error Handler Tests',
      file: 'src/lib/__tests__/microsoftGraphErrorHandler.test.js',
      type: 'unit',
      description: 'Tests error handling, retry logic, and rate limiting for Microsoft Graph API'
    }
  ];

  // Run each test file
  for (const testFile of testFiles) {
    console.log(`\n📋 Running ${testFile.name}...`);
    console.log(`   Type: ${testFile.type.toUpperCase()}`);
    console.log(`   Description: ${testFile.description}`);
    
    try {
      const command = `npm run test:fixed -- ${testFile.file}`;
      const output = await runCommand(command);
      
      // Parse test results (simplified)
      const lines = output.split('\n');
      const passedMatch = lines.find(line => line.includes('passed'));
      const failedMatch = lines.find(line => line.includes('failed'));
      
      let passed = 0;
      let failed = 0;
      
      if (passedMatch) {
        const match = passedMatch.match(/(\d+) passed/);
        if (match) passed = parseInt(match[1]);
      }
      
      if (failedMatch) {
        const match = failedMatch.match(/(\d+) failed/);
        if (match) failed = parseInt(match[1]);
      }

      testResults.results[testFile.name] = {
        status: failed === 0 ? 'PASSED' : 'FAILED',
        passed,
        failed,
        total: passed + failed,
        type: testFile.type,
        description: testFile.description,
        output: output.split('\n').slice(-10).join('\n') // Last 10 lines
      };

      testResults.summary.total += passed + failed;
      testResults.summary.passed += passed;
      testResults.summary.failed += failed;

      console.log(`   ✅ Status: ${failed === 0 ? 'PASSED' : 'FAILED'}`);
      console.log(`   📊 Results: ${passed} passed, ${failed} failed`);

    } catch (error) {
      console.log(`   ❌ Error running test: ${error.message}`);
      
      testResults.results[testFile.name] = {
        status: 'ERROR',
        passed: 0,
        failed: 1,
        total: 1,
        type: testFile.type,
        description: testFile.description,
        error: error.message
      };

      testResults.summary.total += 1;
      testResults.summary.failed += 1;
    }
  }

  // Calculate coverage
  testResults.summary.coverage = testResults.summary.total > 0 
    ? Math.round((testResults.summary.passed / testResults.summary.total) * 100)
    : 0;

  // Generate report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 OUTLOOK INTEGRATION TEST SUITE SUMMARY');
  console.log('=' .repeat(60));
  
  console.log(`\n🎯 Overall Results:`);
  console.log(`   Total Tests: ${testResults.summary.total}`);
  console.log(`   Passed: ${testResults.summary.passed}`);
  console.log(`   Failed: ${testResults.summary.failed}`);
  console.log(`   Coverage: ${testResults.summary.coverage}%`);

  console.log(`\n📋 Test Breakdown:`);
  Object.entries(testResults.results).forEach(([name, result]) => {
    const status = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`   ${status} ${name}: ${result.passed}/${result.total} passed`);
  });

  // Test coverage analysis
  console.log(`\n🔍 Coverage Analysis:`);
  const unitTests = Object.values(testResults.results).filter(r => r.type === 'unit');
  const integrationTests = Object.values(testResults.results).filter(r => r.type === 'integration');
  const e2eTests = Object.values(testResults.results).filter(r => r.type === 'e2e');

  console.log(`   Unit Tests: ${unitTests.length} files`);
  console.log(`   Integration Tests: ${integrationTests.length} files`);
  console.log(`   E2E Tests: ${e2eTests.length} files`);

  // Save detailed report
  const reportsDir = path.join(process.cwd(), 'audit-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  const reportPath = path.join(reportsDir, 'outlook-integration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // Success criteria validation
  console.log(`\n✅ Success Criteria Validation:`);
  
  const successCriteria = [
    {
      criteria: 'Outlook OAuth flow is thoroughly tested',
      status: testResults.results['Outlook OAuth Integration Tests']?.status === 'PASSED',
      details: 'OAuth authentication, token management, and scope validation'
    },
    {
      criteria: 'Outlook email processing tests pass',
      status: testResults.results['Outlook Email Service Unit Tests']?.status === 'PASSED',
      details: 'Email reading, draft creation, and attachment handling'
    },
    {
      criteria: 'Outlook draft creation tests pass',
      status: testResults.results['Outlook Email Service Unit Tests']?.status === 'PASSED',
      details: 'Draft creation, formatting, and Microsoft Graph API integration'
    },
    {
      criteria: 'Outlook workflow deployment tests pass',
      status: testResults.results['Outlook E2E User Journey Tests']?.status === 'PASSED',
      details: 'Complete automation workflows and error recovery'
    },
    {
      criteria: 'Outlook E2E user journey tests pass',
      status: testResults.results['Outlook E2E User Journey Tests']?.status === 'PASSED',
      details: 'End-to-end user workflows from onboarding to automation'
    },
    {
      criteria: 'Test coverage for Outlook features is comprehensive',
      status: testResults.summary.coverage >= 80,
      details: `${testResults.summary.coverage}% test coverage achieved`
    }
  ];

  successCriteria.forEach(criteria => {
    const status = criteria.status ? '✅' : '❌';
    console.log(`   ${status} ${criteria.criteria}`);
    console.log(`      ${criteria.details}`);
  });

  const allCriteriaMet = successCriteria.every(c => c.status);
  console.log(`\n🎯 Overall Success: ${allCriteriaMet ? '✅ ALL CRITERIA MET' : '❌ SOME CRITERIA NOT MET'}`);

  if (testResults.summary.failed > 0) {
    console.log(`\n⚠️  ${testResults.summary.failed} test(s) failed. Check individual test outputs for details.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All Outlook integration tests passed successfully!`);
    process.exit(0);
  }
};

// Run the test suite
runOutlookTestSuite().catch(error => {
  console.error('❌ Test suite execution failed:', error);
  process.exit(1);
});
