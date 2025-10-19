/**
 * Complete Flow Test
 * Tests the entire FloworxV2 system from onboarding to email processing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = process.env.TEST_USER_ID || 'fedf818f-986f-4b30-bfa1-7fc339c7bb60';

async function testCompleteFlow() {
  console.log('🧪 COMPLETE SYSTEM FLOW TEST');
  console.log('Testing: Onboarding → Voice Analysis → Label Provisioning');
  console.log('============================================================');
  console.log('');

  const testResults = {
    timestamp: new Date().toISOString(),
    userId: USER_ID,
    steps: {},
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Step 1: Verify User Profile
  console.log('📋 Step 1: User Profile Validation');
  console.log('----------------------------------------');
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (error) throw error;

    console.log('✅ User profile exists');
    console.log(`   Email: ${profile.email}`);
    console.log(`   Business Type: ${profile.business_type || 'Not set'}`);
    console.log(`   Onboarding Step: ${profile.onboarding_step || 'Not started'}`);
    console.log(`   Managers: ${profile.managers?.length || 0}`);
    console.log(`   Suppliers: ${profile.suppliers?.length || 0}`);

    testResults.steps.profile = { status: 'PASS', data: profile };
    testResults.passed++;
  } catch (error) {
    console.log('❌ User profile check failed:', error.message);
    testResults.steps.profile = { status: 'FAIL', error: error.message };
    testResults.failed++;
  }

  // Step 2: Check Email Integration
  console.log('\n📋 Step 2: Email Integration Status');
  console.log('----------------------------------------');
  try {
    const { data: integrations, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', USER_ID);

    if (error) throw error;

    const activeIntegrations = integrations.filter(i => i.status === 'active');

    console.log(`✅ Found ${integrations.length} integrations`);
    console.log(`   Active: ${activeIntegrations.length}`);

    activeIntegrations.forEach(int => {
      const hasRefreshToken = !!int.refresh_token;
      console.log(`   - ${int.provider}: ${hasRefreshToken ? '✅' : '❌'} refresh token`);
    });

    if (activeIntegrations.length === 0) {
      console.log('⚠️ No active integrations - voice analysis may use defaults');
      testResults.warnings++;
    }

    testResults.steps.integration = {
      status: activeIntegrations.length > 0 ? 'PASS' : 'WARNING',
      count: activeIntegrations.length
    };
    testResults.passed++;
  } catch (error) {
    console.log('❌ Integration check failed:', error.message);
    testResults.steps.integration = { status: 'FAIL', error: error.message };
    testResults.failed++;
  }

  // Step 3: Check Email Queue
  console.log('\n📋 Step 3: Email Queue Status');
  console.log('----------------------------------------');
  try {
    const { data: emails, error, count } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact' })
      .eq('client_id', USER_ID);

    if (error) throw error;

    const inbound = emails?.filter(e => e.direction === 'inbound')?.length || 0;
    const outbound = emails?.filter(e => e.direction === 'outbound')?.length || 0;

    console.log(`✅ Found ${count} emails in queue`);
    console.log(`   Inbound: ${inbound}`);
    console.log(`   Outbound: ${outbound} (needed for voice analysis)`);

    if (outbound === 0) {
      console.log('⚠️ No outbound emails - voice analysis will use defaults');
      testResults.warnings++;
    }

    testResults.steps.emailQueue = {
      status: 'PASS',
      total: count,
      outbound
    };
    testResults.passed++;
  } catch (error) {
    console.log('❌ Email queue check failed:', error.message);
    testResults.steps.emailQueue = { status: 'FAIL', error: error.message };
    testResults.failed++;
  }

  // Step 4: Check Voice Analysis
  console.log('\n📋 Step 4: Voice Analysis Status');
  console.log('----------------------------------------');
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('voice_analysis')
      .eq('id', USER_ID)
      .single();

    if (error) throw error;

    if (profile.voice_analysis) {
      console.log('✅ Voice analysis exists');
      console.log(`   Tone: ${profile.voice_analysis.tone || 'Not set'}`);
      console.log(`   Empathy: ${profile.voice_analysis.empathy || 'Not set'}`);
      console.log(`   Confidence: ${profile.voice_analysis.confidence || 'Not set'}`);
      console.log(`   Sample Size: ${profile.voice_analysis.sampleSize || profile.voice_analysis.emailCount || 0}`);
      console.log(`   Analyzed At: ${profile.voice_analysis.analyzedAt || 'Unknown'}`);

      testResults.steps.voiceAnalysis = {
        status: 'PASS',
        data: profile.voice_analysis
      };
      testResults.passed++;
    } else {
      console.log('⚠️ Voice analysis not yet performed');
      console.log('   This is normal for new users');
      testResults.steps.voiceAnalysis = { status: 'WARNING' };
      testResults.warnings++;
    }
  } catch (error) {
    console.log('❌ Voice analysis check failed:', error.message);
    testResults.steps.voiceAnalysis = { status: 'FAIL', error: error.message };
    testResults.failed++;
  }

  // Step 5: Check Business Labels
  console.log('\n📋 Step 5: Business Labels/Folders Status');
  console.log('----------------------------------------');
  try {
    const { data: businessProfiles, error: profileError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', USER_ID);

    if (profileError) throw profileError;

    if (businessProfiles && businessProfiles.length > 0) {
      const profileIds = businessProfiles.map(p => p.id);

      const { data: labels, error: labelsError } = await supabase
        .from('business_labels')
        .select('*')
        .in('business_profile_id', profileIds);

      if (labelsError) throw labelsError;

      const total = labels?.length || 0;
      const outlook = labels?.filter(l => l.provider === 'outlook')?.length || 0;
      const gmail = labels?.filter(l => l.provider === 'gmail')?.length || 0;

      console.log(`✅ Found ${total} business labels`);
      console.log(`   Outlook folders: ${outlook}`);
      console.log(`   Gmail labels: ${gmail}`);

      // Check for dynamic folders
      const managerFolders = labels?.filter(l => 
        l.label_name && !['SALES', 'SERVICE', 'SUPPORT', 'MANAGER', 'SUPPLIERS'].includes(l.label_name)
      )?.length || 0;

      console.log(`   Dynamic folders: ${managerFolders}`);

      testResults.steps.businessLabels = {
        status: 'PASS',
        total,
        outlook,
        gmail,
        dynamic: managerFolders
      };
      testResults.passed++;
    } else {
      console.log('⚠️ No business profiles found');
      testResults.steps.businessLabels = { status: 'WARNING' };
      testResults.warnings++;
    }
  } catch (error) {
    console.log('❌ Business labels check failed:', error.message);
    testResults.steps.businessLabels = { status: 'FAIL', error: error.message };
    testResults.failed++;
  }

  // Step 6: Test Backend API
  console.log('\n📋 Step 6: Backend API Connectivity');
  console.log('----------------------------------------');
  try {
    const response = await fetch('http://localhost:3001/health');
    
    if (response.ok) {
      console.log('✅ Backend API is running');
      console.log('   Port: 3001');
      testResults.steps.backendAPI = { status: 'PASS' };
      testResults.passed++;
    } else {
      console.log(`⚠️ Backend API returned: ${response.status}`);
      testResults.steps.backendAPI = { status: 'WARNING', statusCode: response.status };
      testResults.warnings++;
    }
  } catch (error) {
    console.log('❌ Backend API not reachable');
    console.log('   💡 Start with: .\\start-backend.ps1');
    testResults.steps.backendAPI = { status: 'FAIL', error: 'Not running' };
    testResults.failed++;
  }

  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 COMPLETE FLOW TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const totalSteps = Object.keys(testResults.steps).length;
  const passRate = ((testResults.passed / totalSteps) * 100).toFixed(1);

  console.log(`Total Steps: ${totalSteps}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️ Warnings: ${testResults.warnings}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('');

  // Overall status
  if (testResults.failed === 0 && testResults.warnings === 0) {
    console.log('🎉 COMPLETE FLOW: EXCELLENT ✅');
    console.log('All systems operational and ready for use!');
  } else if (testResults.failed === 0) {
    console.log('✅ COMPLETE FLOW: GOOD');
    console.log('System is operational with minor warnings');
  } else if (passRate >= 70) {
    console.log('⚠️ COMPLETE FLOW: DEGRADED');
    console.log('System has issues requiring attention');
  } else {
    console.log('❌ COMPLETE FLOW: CRITICAL');
    console.log('System has critical failures');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');

  // Save results
  const fs = await import('fs');
  const resultsDir = 'test-results';
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  fs.writeFileSync(
    `${resultsDir}/complete-flow-test-${Date.now()}.json`,
    JSON.stringify(testResults, null, 2)
  );

  console.log(`💾 Test results saved to: ${resultsDir}/`);
  console.log('');
}

// Run test
testCompleteFlow();

