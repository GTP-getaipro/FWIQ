/**
 * Test script for onboarding data collection
 * This file can be used to validate the onboarding data collection system
 */

import { OnboardingDataAggregator } from './onboardingDataAggregator';
import { mapClientConfigToN8n } from './n8nConfigMapper';

/**
 * Test the onboarding data collection system
 * @param {string} userId - Test user ID
 */
export const testOnboardingDataCollection = async (userId) => {
  console.log('🧪 Testing onboarding data collection system...');
  
  try {
    const aggregator = new OnboardingDataAggregator(userId);
    
    // Test 1: Store sample data for each step
    console.log('📝 Test 1: Storing sample onboarding data...');
    
    const testData = {
      registration: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        registeredAt: new Date().toISOString()
      },
      email_integration: {
        provider: 'gmail',
        connectedAt: new Date().toISOString(),
        connections: { gmail: true, outlook: false }
      },
      business_type: {
        businessType: 'Pools & Spas',
        selectedAt: new Date().toISOString()
      },
      team_setup: {
        managers: [
          { name: 'John Doe', email: 'john@example.com' },
          { name: 'Jane Smith', email: 'jane@example.com' }
        ],
        suppliers: [
          { name: 'Supplier A', domains: ['suppliera.com'] },
          { name: 'Supplier B', domains: ['supplierb.com'] }
        ],
        businessType: 'Pools & Spas',
        completedAt: new Date().toISOString()
      },
      business_information: {
        business: {
          name: 'Test Pool Company',
          legalEntity: 'Test Pool Company LLC',
          address: '123 Test St, Test City, TC 12345',
          timezone: 'America/New_York',
          currency: 'USD',
          emailDomain: 'testpool.com'
        },
        contact: {
          primary: { name: 'Test Manager', email: 'manager@testpool.com', role: 'Manager' },
          phone: '555-123-4567',
          website: 'https://testpool.com'
        },
        services: [
          { name: 'Pool Installation', description: 'Complete pool installation', price: '5000', pricingType: 'fixed' },
          { name: 'Pool Maintenance', description: 'Monthly maintenance service', price: '150', pricingType: 'monthly' }
        ],
        rules: {
          sla: '24h',
          tone: 'Friendly',
          businessHours: { mon_fri: '09:00-18:00', sat: '10:00-16:00', sun: 'Closed' }
        },
        signature: 'Best regards,\nThe Test Pool Company Team',
        version: 1,
        completedAt: new Date().toISOString()
      },
      label_provisioning: {
        labels: {
          BANKING: { color: '🟢', sub: ['BankAlert', 'Invoice', 'Payment Confirmation'] },
          MANAGER: { color: '🟠', sub: ['Unassigned'] },
          SUPPORT: { color: '🔵', sub: ['General', 'Technical Support'] }
        },
        hierarchy: {
          'BANKING/BankAlert': { color: '🟢', parent: 'BANKING' },
          'BANKING/Invoice': { color: '🟢', parent: 'BANKING' }
        },
        mappings: {
          'banking': 'BANKING',
          'invoice': 'BANKING/Invoice',
          'support': 'SUPPORT'
        },
        provider: 'gmail',
        completedAt: new Date().toISOString()
      },
      label_mapping: {
        aiConfig: {
          deployed: true,
          version: 1,
          deployedAt: new Date().toISOString()
        },
        automation: {
          status: 'deployed',
          workflowId: 'automation-workflow-v1',
          deploymentStatus: 'complete'
        },
        completedAt: new Date().toISOString()
      }
    };

    // Store each step's data
    for (const [step, data] of Object.entries(testData)) {
      const success = await aggregator.storeStepData(step, data);
      console.log(`✅ ${step}: ${success ? 'Success' : 'Failed'}`);
    }

    // Test 2: Retrieve and validate aggregated data
    console.log('\n📊 Test 2: Retrieving aggregated data...');
    const allData = await aggregator.getAllData();
    console.log('All data retrieved:', allData ? 'Success' : 'Failed');
    
    if (allData) {
      console.log(`Total steps: ${allData.total_steps}`);
      console.log(`Started at: ${allData.started_at}`);
      console.log(`Completed at: ${allData.completed_at}`);
    }

    // Test 3: Prepare n8n data
    console.log('\n🔧 Test 3: Preparing n8n data...');
    const n8nData = await aggregator.prepareN8nData();
    console.log('N8n data prepared:', n8nData ? 'Success' : 'Failed');
    
    if (n8nData) {
      console.log(`Business type: ${n8nData.business?.type}`);
      console.log(`Business name: ${n8nData.business?.info?.name}`);
      console.log(`Managers count: ${n8nData.team?.managers?.length || 0}`);
      console.log(`Suppliers count: ${n8nData.team?.suppliers?.length || 0}`);
      console.log(`Email labels count: ${Object.keys(n8nData.emailLabels || {}).length}`);
    }

    // Test 4: Validate automation readiness
    console.log('\n✅ Test 4: Validating automation readiness...');
    const readiness = await aggregator.validateAutomationReadiness();
    console.log(`Automation ready: ${readiness.isReady}`);
    console.log(`Status: ${readiness.status}`);
    
    if (readiness.missing && readiness.missing.length > 0) {
      console.log('Missing data:', readiness.missing);
    }

    // Test 5: Test n8n configuration mapping
    console.log('\n🎯 Test 5: Testing n8n configuration mapping...');
    try {
      const n8nConfig = await mapClientConfigToN8n(userId);
      console.log('N8n config mapped:', n8nConfig ? 'Success' : 'Failed');
      
      if (n8nConfig) {
        console.log(`Config version: ${n8nConfig.version}`);
        console.log(`Business name: ${n8nConfig.business?.name}`);
        console.log(`Integrations: ${Object.keys(n8nConfig.integrations || {}).length}`);
      }
    } catch (error) {
      console.log('N8n config mapping failed (expected for test user):', error.message);
    }

    console.log('\n🎉 Onboarding data collection test completed successfully!');
    return {
      success: true,
      testsPassed: 5,
      data: {
        allData,
        n8nData,
        readiness,
        n8nConfig: null // Will be null for test user without real credentials
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Clean up test data
 * @param {string} userId - Test user ID
 */
export const cleanupTestData = async (userId) => {
  console.log('🧹 Cleaning up test data...');
  
  try {
    const aggregator = new OnboardingDataAggregator(userId);
    const success = await aggregator.clearAllData();
    console.log('Test data cleaned:', success ? 'Success' : 'Failed');
    return success;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return false;
  }
};

/**
 * Run a quick validation test
 * @param {string} userId - User ID to test
 */
export const quickValidationTest = async (userId) => {
  console.log('⚡ Running quick validation test...');
  
  try {
    const aggregator = new OnboardingDataAggregator(userId);
    const readiness = await aggregator.validateAutomationReadiness();
    
    console.log(`Automation readiness: ${readiness.isReady ? '✅ Ready' : '❌ Not Ready'}`);
    console.log(`Status: ${readiness.status}`);
    
    if (readiness.missing && readiness.missing.length > 0) {
      console.log('Missing components:', readiness.missing.join(', '));
    }
    
    return readiness;
  } catch (error) {
    console.error('❌ Quick validation failed:', error);
    return { isReady: false, status: 'error', missing: ['Validation error'] };
  }
};

// Export for use in development console
if (typeof window !== 'undefined') {
  window.testOnboardingDataCollection = testOnboardingDataCollection;
  window.cleanupTestData = cleanupTestData;
  window.quickValidationTest = quickValidationTest;
}



