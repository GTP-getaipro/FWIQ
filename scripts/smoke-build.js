#!/usr/bin/env node

/**
 * Smoke Test Script for N8N Build Process
 * Runs a quick validation of the integrated profile system
 */

import { IntegratedProfileSystem } from '../src/lib/integratedProfileSystem.js';
import { featureFlags, monitoring } from '../src/lib/rolloutInfrastructure.js';
import fs from 'fs';
import path from 'path';

// Test cases for smoke testing
const SMOKE_TEST_CASES = [
  {
    name: 'single-electrician',
    description: 'Single business type (Electrician)',
    profile: {
      business: {
        name: 'Smoke Test Electric',
        types: ['Electrician'],
        primaryType: 'Electrician',
        timezone: 'America/New_York',
        currency: 'USD',
        emailDomain: 'smoketestelectric.com',
        address: '123 Smoke Test St',
        serviceArea: 'Smoke Test Area',
        businessHours: {
          mon_fri: '09:00-18:00',
          sat: '10:00-16:00',
          sun: 'Closed'
        }
      },
      contact: {
        primaryContactName: 'John Smoke',
        primaryContactRole: 'Owner',
        primaryContactEmail: 'john@smoketestelectric.com',
        responseSLA: '24h'
      },
      team: {
        managers: [
          { name: 'John Smoke', email: 'john@smoketestelectric.com', role: 'Owner' }
        ],
        suppliers: []
      },
      rules: {
        defaultReplyTone: 'Friendly',
        language: 'en',
        allowPricing: false,
        includeSignature: true
      }
    }
  },
  {
    name: 'multi-electrician-hvac',
    description: 'Multiple business types (Electrician + HVAC)',
    profile: {
      business: {
        name: 'Smoke Test Multi-Service',
        types: ['Electrician', 'HVAC'],
        primaryType: 'Electrician',
        timezone: 'America/New_York',
        currency: 'USD',
        emailDomain: 'smoketestmultiservice.com',
        address: '456 Smoke Test Ave',
        serviceArea: 'Smoke Test Metro',
        businessHours: {
          mon_fri: '09:00-18:00',
          sat: '10:00-16:00',
          sun: 'Closed'
        }
      },
      contact: {
        primaryContactName: 'Jane Smoke',
        primaryContactRole: 'Manager',
        primaryContactEmail: 'jane@smoketestmultiservice.com',
        responseSLA: '24h'
      },
      team: {
        managers: [
          { name: 'Jane Smoke', email: 'jane@smoketestmultiservice.com', role: 'Manager' },
          { name: 'Bob HVAC', email: 'bob@smoketestmultiservice.com', role: 'HVAC Manager' }
        ],
        suppliers: [
          { name: 'Smoke Test Supply', domains: ['smoketestsupply.com'], category: 'Electrical' }
        ]
      },
      rules: {
        defaultReplyTone: 'Professional',
        language: 'en',
        allowPricing: true,
        includeSignature: true
      }
    }
  },
  {
    name: 'pools-spas-specialized',
    description: 'Specialized business type (Pools & Spas)',
    profile: {
      business: {
        name: 'Smoke Test Pools & Spas',
        types: ['Pools & Spas'],
        primaryType: 'Pools & Spas',
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        emailDomain: 'smoketestpoolsandspas.com',
        address: '789 Smoke Test Blvd',
        serviceArea: 'Smoke Test County',
        businessHours: {
          mon_fri: '08:00-17:00',
          sat: '09:00-15:00',
          sun: 'Closed'
        }
      },
      contact: {
        primaryContactName: 'Alice Pool',
        primaryContactRole: 'Owner',
        primaryContactEmail: 'alice@smoketestpoolsandspas.com',
        responseSLA: '4h'
      },
      team: {
        managers: [
          { name: 'Alice Pool', email: 'alice@smoketestpoolsandspas.com', role: 'Owner' }
        ],
        suppliers: [
          { name: 'Pool Supply Co', domains: ['poolsupply.com'], category: 'Pool Supplies' }
        ]
      },
      rules: {
        defaultReplyTone: 'Friendly',
        language: 'en',
        allowPricing: true,
        includeSignature: true
      }
    }
  }
];

/**
 * Run a single smoke test case
 * @param {object} testCase - Test case configuration
 * @returns {object} - Test result
 */
async function runSmokeTest(testCase) {
  const startTime = Date.now();
  const testUserId = `smoke-test-${testCase.name}`;
  
  try {
    console.log(`🧪 Running smoke test: ${testCase.name} - ${testCase.description}`);
    
    // Create integrated system instance
    const integratedSystem = new IntegratedProfileSystem(testUserId);
    
    // Mock the profile data
    integratedSystem.getCompleteProfile = jest.fn().mockResolvedValue({
      success: true,
      profile: testCase.profile,
      validation: {
        isValid: true,
        score: 95,
        errors: [],
        warnings: []
      },
      template: {
        type: testCase.profile.business.types.length > 1 ? 'composite' : 'single',
        businessTypes: testCase.profile.business.types,
        template: {
          name: `${testCase.profile.business.name} Template`,
          nodes: [
            {
              id: 'webhook-trigger',
              name: 'Webhook Trigger',
              type: 'n8n-nodes-base.webhook',
              typeVersion: 1,
              position: [240, 300]
            },
            {
              id: 'email-processor',
              name: 'Email Processor',
              type: 'n8n-nodes-base.function',
              typeVersion: 1,
              position: [460, 300]
            }
          ],
          connections: {
            'Webhook Trigger': {
              main: [[{ node: 'Email Processor', type: 'main', index: 0 }]]
            }
          },
          settings: { executionOrder: 'v1' }
        }
      },
      integrations: [
        { provider: 'gmail', n8n_credential_id: 'gmail-cred-123' },
        { provider: 'openai', n8n_credential_id: 'openai-cred-456' }
      ],
      metadata: {
        fromCache: false,
        cacheAge: 0,
        systemVersion: '2.0',
        generatedAt: new Date().toISOString()
      }
    });
    
    // Mock the deployment
    integratedSystem.executeN8nDeployment = jest.fn().mockResolvedValue({
      workflowId: `wf_smoke_${Date.now()}`,
      status: 'deployed',
      version: 1,
      deployedAt: new Date().toISOString(),
      template: testCase.profile.business.types.length > 1 ? 'composite' : 'single'
    });
    
    // Test profile retrieval
    const profileResult = await integratedSystem.getCompleteProfile({
      forceRefresh: false,
      includeValidation: true,
      includeTemplates: true,
      includeIntegrations: true
    });
    
    if (!profileResult.success) {
      throw new Error('Profile retrieval failed');
    }
    
    // Test N8N deployment
    const deploymentResult = await integratedSystem.deployN8nWorkflow({
      useOptimizedTemplate: true,
      validateBeforeDeploy: true,
      createBackup: true,
      batchOperations: true
    });
    
    if (!deploymentResult.success) {
      throw new Error('N8N deployment failed');
    }
    
    // Test system health
    const systemStatus = await integratedSystem.getSystemStatus();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Record metrics
    monitoring.recordTiming('smoke_test_duration', startTime, {
      testCase: testCase.name,
      success: true
    });
    
    monitoring.recordMetric('smoke_test_success', 1, {
      testCase: testCase.name
    });
    
    console.log(`✅ Smoke test passed: ${testCase.name} (${duration}ms)`);
    
    return {
      name: testCase.name,
      success: true,
      duration,
      profileValidation: profileResult.validation,
      deployment: deploymentResult.deployment,
      systemStatus: systemStatus.status,
      metrics: {
        profileScore: profileResult.validation.score,
        templateType: deploymentResult.template?.type,
        workflowId: deploymentResult.deployment.workflowId
      }
    };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Record error metrics
    monitoring.recordTiming('smoke_test_duration', startTime, {
      testCase: testCase.name,
      success: false
    });
    
    monitoring.recordError('smoke_test_failure', testCase.name, {
      error: error.message,
      duration
    });
    
    console.error(`❌ Smoke test failed: ${testCase.name} - ${error.message}`);
    
    return {
      name: testCase.name,
      success: false,
      duration,
      error: error.message
    };
  }
}

/**
 * Run all smoke tests
 * @returns {object} - Test results summary
 */
async function runAllSmokeTests() {
  console.log('🚀 Starting smoke tests for integrated profile system...\n');
  
  const startTime = Date.now();
  const results = [];
  
  // Run all test cases
  for (const testCase of SMOKE_TEST_CASES) {
    const result = await runSmokeTest(testCase);
    results.push(result);
  }
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  // Calculate summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log('\n📊 Smoke Test Results Summary:');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`Average Duration: ${Math.round(avgDuration)}ms`);
  
  // Check SLOs
  const health = monitoring.getSystemHealth();
  console.log('\n🏥 System Health:');
  console.log(`Overall: ${health.overall}`);
  console.log(`Build Latency P95: ${health.buildLatency.p95}ms (SLO: ≤400ms)`);
  console.log(`Cache Hit Rate: ${health.cacheHitRate.rate.toFixed(1)}% (SLO: ≥85%)`);
  
  // Feature flag status
  console.log('\n🚩 Feature Flag Status:');
  const flagStatus = featureFlags.getFeatureStatus('smoke-test-user');
  for (const [flagName, status] of Object.entries(flagStatus)) {
    console.log(`${flagName}: ${status.enabled ? '✅' : '❌'} (${status.rolloutPercentage}%)`);
  }
  
  // Save results to file
  const resultsFile = path.join(process.cwd(), 'smoke-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful,
      failed,
      totalDuration,
      avgDuration
    },
    results,
    systemHealth: health,
    featureFlags: flagStatus
  }, null, 2));
  
  console.log(`\n📄 Results saved to: ${resultsFile}`);
  
  // Exit with appropriate code
  if (failed > 0) {
    console.log('\n❌ Some smoke tests failed. Check the results above.');
    process.exit(1);
  } else {
    console.log('\n✅ All smoke tests passed!');
    process.exit(0);
  }
}

/**
 * Run smoke tests for specific feature flags
 * @param {array} features - Features to test
 */
async function runFeatureSmokeTests(features) {
  console.log(`🧪 Running smoke tests for features: ${features.join(', ')}\n`);
  
  const results = [];
  
  for (const feature of features) {
    const testCase = SMOKE_TEST_CASES.find(tc => tc.name.includes(feature.toLowerCase()));
    if (testCase) {
      const result = await runSmokeTest(testCase);
      results.push(result);
    } else {
      console.warn(`⚠️ No test case found for feature: ${feature}`);
    }
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Feature Test Results: ${successful}/${results.length} passed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Run specific feature tests
    runFeatureSmokeTests(args);
  } else {
    // Run all smoke tests
    runAllSmokeTests();
  }
}

export { runSmokeTest, runAllSmokeTests, runFeatureSmokeTests, SMOKE_TEST_CASES };
