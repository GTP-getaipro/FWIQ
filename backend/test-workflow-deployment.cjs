#!/usr/bin/env node

/**
 * Test script for deploying workflows with client credentials to N8N
 * This will test the complete flow: credential injection → N8N deployment → database storage
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWorkflowDeployment() {
  console.log('🧪 Testing Workflow Deployment with Client Credentials\n');

  try {
    // Step 1: Get a test user from the database
    console.log('1️⃣ Finding test user...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, client_config')
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      console.error('❌ No test users found. Please ensure you have user profiles in the database.');
      return;
    }

    const testUser = profiles[0];
    console.log(`✅ Found test user: ${testUser.email} (${testUser.id})`);

    // Step 2: Check user credentials
    console.log('\n2️⃣ Checking user credentials...');
    const { data: credentials } = await supabase
      .from('credentials')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('status', 'active');

    const { data: integrations } = await supabase
      .from('integrations')
      .select('access_token, refresh_token, provider')
      .eq('user_id', testUser.id)
      .eq('status', 'active');

    console.log(`📋 Credentials: ${credentials?.length || 0} stored`);
    console.log(`📧 Integrations: ${integrations?.length || 0} found`);

    // Step 3: Test backend deployment endpoint
    console.log('\n3️⃣ Testing workflow deployment...');
    
    const deploymentData = {
      userId: testUser.id,
      workflowData: {
        name: `FloWorx Test Workflow - ${new Date().toISOString().split('T')[0]}`,
        description: 'Test workflow deployment with client credentials'
      }
    };

    console.log(`🚀 Deploying to: http://localhost:3001/api/workflows/deploy`);
    console.log(`👤 User ID: ${testUser.id}`);
    console.log(`📧 User Email: ${testUser.email}`);

    const response = await fetch('http://localhost:3001/api/workflows/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deploymentData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Workflow deployment successful!');
      console.log('📊 Result:', JSON.stringify(result, null, 2));
      
      if (result.workflowId) {
        console.log(`\n🎉 Workflow deployed with ID: ${result.workflowId}`);
        console.log(`🔗 N8N Dashboard: https://n8n.srv995290.hstgr.cloud`);
        console.log(`📝 Workflow URL: https://n8n.srv995290.hstgr.cloud/workflow/${result.workflowId}`);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Workflow deployment failed:');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${errorText}`);
    }

    // Step 4: Verify in database
    console.log('\n4️⃣ Verifying workflow in database...');
    const { data: workflows } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (workflows && workflows.length > 0) {
      const latestWorkflow = workflows[0];
      console.log('✅ Workflow found in database:');
      console.log(`   - ID: ${latestWorkflow.id}`);
      console.log(`   - Name: ${latestWorkflow.name}`);
      console.log(`   - N8N ID: ${latestWorkflow.n8n_workflow_id}`);
      console.log(`   - Status: ${latestWorkflow.status}`);
      console.log(`   - Deployment Status: ${latestWorkflow.deployment_status}`);
    }

    // Step 5: Test N8N connectivity
    console.log('\n5️⃣ Testing N8N connectivity...');
    try {
      const n8nResponse = await fetch('https://n8n.srv995290.hstgr.cloud/healthz', {
        method: 'GET',
        timeout: 5000
      });
      
      if (n8nResponse.ok) {
        console.log('✅ N8N instance is accessible');
      } else {
        console.log(`⚠️ N8N responded with status: ${n8nResponse.status}`);
      }
    } catch (error) {
      console.log(`⚠️ N8N connectivity test failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }

  console.log('\n🏁 Workflow deployment test completed');
  console.log('\n📋 Next Steps:');
  console.log('1. Check N8N dashboard for the deployed workflow');
  console.log('2. Verify credentials are properly configured');
  console.log('3. Test workflow execution manually');
  console.log('4. Check Gmail integration if configured');
}

// Run the test
if (require.main === module) {
  testWorkflowDeployment().catch(console.error);
}

module.exports = { testWorkflowDeployment };
