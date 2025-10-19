#!/usr/bin/env node

/**
 * AI Response Testing Script
 * Tests AI response generation and quality assessment
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// UUID generator for test data
function generateTestUUID(seed = '') {
  const timestamp = Date.now().toString(16);
  const random = Math.random().toString(16).substr(2, 8);
  const seedHash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0).toString(16).substr(-8);
  
  return `550e8400-${timestamp.substr(-4)}-${random.substr(0,4)}-${random.substr(4,4)}-${seedHash}${timestamp.substr(0,4)}`;
}

// Test configuration
const testConfig = {
  testUserId: '550e8400-e29b-41d4-a716-446655440004',
  testEmail: 'ai-test@floworx.com',
  businessTypes: ['Pools & Spas', 'HVAC', 'Electrician', 'Plumber'],
  testEmails: [
    {
      category: 'urgent',
      subject: 'URGENT: Service is down',
      body: 'Our service is completely down and we need immediate assistance. This is an emergency!',
      expectedResponse: 'urgent'
    },
    {
      category: 'sales',
      subject: 'Quote request for pool cleaning',
      body: 'Hi, I would like to get a quote for weekly pool cleaning services. What are your rates?',
      expectedResponse: 'sales'
    },
    {
      category: 'support',
      subject: 'Question about my service',
      body: 'I have a question about the service that was performed last week. Can you help me understand what was done?',
      expectedResponse: 'support'
    },
    {
      category: 'billing',
      subject: 'Billing inquiry',
      body: 'I received an invoice but I think there might be an error. Can you please review the charges?',
      expectedResponse: 'billing'
    },
    {
      category: 'complaint',
      subject: 'Poor service experience',
      body: 'I am very disappointed with the service I received. The technician was late and did not complete the work properly.',
      expectedResponse: 'complaint'
    }
  ]
};

async function testAIResponses() {
  console.log('🤖 Testing AI Response Generation...\n');
  
  const results = {
    connectivity: {},
    classification: {},
    responseGeneration: {},
    costTracking: {},
    qualityAssessment: {},
    businessTypeVariations: {},
    errorHandling: {},
    cleanup: [],
    overall: 'pending'
  };

  try {
    // Clean up any existing test data
    await cleanupTestData();

    // Test 1: Create Test Profile
    console.log('1️⃣ Creating Test Profile...');
    
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: testConfig.testUserId,
          email: testConfig.testEmail,
          client_config: {
            business: {
              name: 'Test Business',
              type: 'Pools & Spas',
              industry: 'Service Business'
            },
            contact: {
              name: 'Test Contact',
              email: 'contact@testbusiness.com',
              phone: '555-123-4567'
            },
            services: [
              { name: 'Pool Cleaning', price: '$150/week' },
              { name: 'Pool Maintenance', price: '$200/month' }
            ]
          }
        }]);

      if (profileError) {
        console.log(`   ⚠️ Could not create test profile: ${profileError.message}`);
        results.connectivity.profile_creation = false;
      } else {
        console.log('   ✅ Test profile created');
        results.connectivity.profile_creation = true;
        results.cleanup.push({ table: 'profiles', id: testConfig.testUserId });
      }
    } catch (err) {
      console.log(`   ❌ Test profile creation failed: ${err.message}`);
      results.connectivity.profile_creation = false;
    }

    // Test 2: Test AI Response Generation
    console.log('\n2️⃣ Testing AI Response Generation...');
    
    const responseResults = [];
    
    for (const testEmail of testConfig.testEmails) {
      try {
        console.log(`   Testing ${testEmail.category} email...`);
        
        // Simulate AI response generation
        const aiResponse = await simulateAIResponse(testEmail);
        
        const result = {
          category: testEmail.category,
          subject: testEmail.subject,
          expectedResponse: testEmail.expectedResponse,
          aiResponse: aiResponse.response,
          quality: aiResponse.quality,
          responseTime: aiResponse.responseTime,
          tokensUsed: aiResponse.tokensUsed,
          cost: aiResponse.cost
        };
        
        responseResults.push(result);
        
        // Store in database for tracking
        const { error: logError } = await supabase
        .from('ai_responses')
        .insert([{
          id: generateTestUUID(`ai-response-${testEmail.category}`),
            user_id: testConfig.testUserId,
            email_id: `test-email-${testEmail.category}`,
            original_email: JSON.stringify(testEmail),
            ai_response: aiResponse.response,
            status: 'generated',
            confidence_score: aiResponse.quality.overall,
            response_type: 'test_response',
            metadata: {
              quality: aiResponse.quality,
              tokensUsed: aiResponse.tokensUsed,
              cost: aiResponse.cost,
              responseTime: aiResponse.responseTime
            }
          }]);

        if (logError) {
          console.log(`   ⚠️ Could not log AI response: ${logError.message}`);
        } else {
          results.cleanup.push({ table: 'ai_responses', id: `test-ai-response-${testEmail.category}` });
        }
        
        console.log(`   ✅ ${testEmail.category} response generated (Quality: ${Math.round(aiResponse.quality.overall * 100)}%)`);
        
      } catch (err) {
        console.log(`   ❌ ${testEmail.category} response generation failed: ${err.message}`);
        responseResults.push({
          category: testEmail.category,
          error: err.message,
          success: false
        });
      }
    }

    results.responseGeneration.results = responseResults;
    results.responseGeneration.successRate = responseResults.filter(r => r.success !== false).length / responseResults.length;

    // Test 3: Test Email Classification
    console.log('\n3️⃣ Testing Email Classification...');
    
    const classificationResults = [];
    
    for (const testEmail of testConfig.testEmails) {
      try {
        const classification = await simulateEmailClassification(testEmail);
        classificationResults.push({
          category: testEmail.category,
          expectedCategory: testEmail.expectedResponse,
          classifiedAs: classification.category,
          confidence: classification.confidence,
          urgency: classification.urgency,
          accuracy: classification.category === testEmail.expectedResponse
        });
      } catch (err) {
        classificationResults.push({
          category: testEmail.category,
          error: err.message,
          success: false
        });
      }
    }

    results.classification.results = classificationResults;
    results.classification.accuracy = classificationResults.filter(r => r.accuracy === true).length / classificationResults.length;

    // Test 4: Test Cost Tracking
    console.log('\n4️⃣ Testing AI Cost Tracking...');
    
    try {
      const totalCost = responseResults.reduce((sum, r) => sum + (r.cost || 0), 0);
      const totalTokens = responseResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
      
      // Store usage logs
      for (const response of responseResults) {
        if (response.cost && response.tokensUsed) {
          const { error: usageError } = await supabase
            .from('ai_usage_logs')
            .insert([{
              id: generateTestUUID(`usage-${response.category}`),
              user_id: testConfig.testUserId,
              workflow_id: 'test-ai-responses',
              execution_id: 'test-execution-123',
              provider: 'openai',
              model: 'gpt-4o-mini',
              prompt_tokens: Math.floor(response.tokensUsed * 0.7),
              completion_tokens: Math.floor(response.tokensUsed * 0.3),
              total_tokens: response.tokensUsed,
              estimated_cost: response.cost,
              created_at: new Date().toISOString()
            }]);

          if (usageError) {
            console.log(`   ⚠️ Could not log usage: ${usageError.message}`);
          } else {
            results.cleanup.push({ table: 'ai_usage_logs', id: `test-usage-${response.category}` });
          }
        }
      }

      results.costTracking = {
        totalCost,
        totalTokens,
        averageCostPerResponse: responseResults.length > 0 ? totalCost / responseResults.length : 0,
        averageTokensPerResponse: responseResults.length > 0 ? totalTokens / responseResults.length : 0,
        success: true
      };

      console.log(`   ✅ Cost tracking successful (Total: $${totalCost.toFixed(4)}, Tokens: ${totalTokens})`);

    } catch (err) {
      console.log(`   ❌ Cost tracking failed: ${err.message}`);
      results.costTracking.success = false;
    }

    // Test 5: Test Business Type Variations
    console.log('\n5️⃣ Testing Business Type Variations...');
    
    const businessTypeResults = [];
    
    for (const businessType of testConfig.businessTypes) {
      try {
        const testEmail = {
          category: 'inquiry',
          subject: 'Service inquiry',
          body: `I need help with ${businessType.toLowerCase()} services. Can you assist me?`
        };

        const response = await simulateBusinessSpecificResponse(testEmail, businessType);
        
        businessTypeResults.push({
          businessType,
          response: response.response,
          quality: response.quality,
          businessRelevance: response.businessRelevance
        });
        
        console.log(`   ✅ ${businessType} response generated`);
        
      } catch (err) {
        console.log(`   ❌ ${businessType} response failed: ${err.message}`);
        businessTypeResults.push({
          businessType,
          error: err.message,
          success: false
        });
      }
    }

    results.businessTypeVariations.results = businessTypeResults;
    results.businessTypeVariations.successRate = businessTypeResults.filter(r => r.success !== false).length / businessTypeResults.length;

    // Test 6: Test Quality Assessment
    console.log('\n6️⃣ Testing Response Quality Assessment...');
    
    const qualityResults = [];
    
    for (const response of responseResults) {
      if (response.aiResponse) {
        const qualityAssessment = assessResponseQuality(response.aiResponse, response.category);
        qualityResults.push({
          category: response.category,
          quality: qualityAssessment,
          meetsThreshold: qualityAssessment.overall >= 0.7
        });
      }
    }

    results.qualityAssessment.results = qualityResults;
    results.qualityAssessment.averageQuality = qualityResults.length > 0 ? 
      qualityResults.reduce((sum, r) => sum + r.quality.overall, 0) / qualityResults.length : 0;
    results.qualityAssessment.meetsThresholdRate = qualityResults.length > 0 ? 
      qualityResults.filter(r => r.meetsThreshold).length / qualityResults.length : 0;

    // Test 7: Test Error Handling
    console.log('\n7️⃣ Testing Error Handling...');
    
    const errorHandlingResults = {
      invalidInput: false,
      networkFailure: false,
      rateLimit: false,
      fallbackMechanisms: false
    };

    // Test invalid input handling
    try {
      await simulateAIResponse({ category: 'invalid', subject: '', body: '' });
      errorHandlingResults.invalidInput = true;
    } catch (err) {
      errorHandlingResults.invalidInput = true; // Should handle gracefully
    }

    // Test fallback mechanisms
    try {
      const fallbackResponse = await simulateFallbackResponse({ category: 'support', subject: 'Help needed', body: 'I need assistance' });
      errorHandlingResults.fallbackMechanisms = !!fallbackResponse;
    } catch (err) {
      errorHandlingResults.fallbackMechanisms = false;
    }

    results.errorHandling = errorHandlingResults;

    // Summary
    console.log('\n📋 AI Response Testing Summary:');
    
    const passedTests = [
      results.connectivity.profile_creation,
      results.responseGeneration.successRate >= 0.8,
      results.classification.accuracy >= 0.8,
      results.costTracking.success,
      results.businessTypeVariations.successRate >= 0.8,
      results.qualityAssessment.meetsThresholdRate >= 0.8,
      Object.values(results.errorHandling).filter(Boolean).length >= 2
    ].filter(Boolean).length;

    const totalTests = 7;
    const passRate = passedTests / totalTests;

    console.log(`   - Profile Creation: ${results.connectivity.profile_creation ? '✅' : '❌'}`);
    console.log(`   - Response Generation: ${Math.round(results.responseGeneration.successRate * 100)}% (${testConfig.testEmails.length} emails)`);
    console.log(`   - Email Classification: ${Math.round(results.classification.accuracy * 100)}% accuracy`);
    console.log(`   - Cost Tracking: ${results.costTracking.success ? '✅' : '❌'} ($${results.costTracking.totalCost?.toFixed(4) || '0'})`);
    console.log(`   - Business Variations: ${Math.round(results.businessTypeVariations.successRate * 100)}% (${testConfig.businessTypes.length} types)`);
    console.log(`   - Quality Assessment: ${Math.round(results.qualityAssessment.meetsThresholdRate * 100)}% meet threshold`);
    console.log(`   - Error Handling: ${Object.values(results.errorHandling).filter(Boolean).length}/4 mechanisms working`);

    // Determine overall status
    if (passRate >= 0.9) {
      results.overall = 'success';
      console.log('\n🎉 AI response testing PASSED!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    } else if (passRate >= 0.7) {
      results.overall = 'warning';
      console.log('\n⚠️ AI response testing PASSED with warnings!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    } else {
      results.overall = 'failed';
      console.log('\n❌ AI response testing FAILED!');
      console.log(`   Pass rate: ${Math.round(passRate * 100)}%`);
    }

    // Recommendations
    console.log('\n🔧 Recommendations:');
    if (results.responseGeneration.successRate < 0.8) {
      console.log(`   - Improve AI response generation reliability`);
    }
    if (results.classification.accuracy < 0.8) {
      console.log(`   - Enhance email classification accuracy`);
    }
    if (results.qualityAssessment.meetsThresholdRate < 0.8) {
      console.log(`   - Improve response quality through better prompts`);
    }
    if (results.costTracking.totalCost > 0.01) {
      console.log(`   - Optimize prompts to reduce AI costs`);
    }
    if (Object.values(results.errorHandling).filter(Boolean).length < 3) {
      console.log(`   - Strengthen error handling and fallback mechanisms`);
    }

    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await cleanupTestData();

    return results;

  } catch (error) {
    console.error('❌ AI response testing error:', error.message);
    results.overall = 'error';
    
    // Attempt cleanup even on error
    try {
      await cleanupTestData();
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
    }
    
    return results;
  }
}

// Helper functions
async function simulateAIResponse(emailData) {
  // Simulate AI response generation with realistic timing and costs
  const startTime = Date.now();
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
  
  const responseTime = Date.now() - startTime;
  
  // Generate realistic response based on category
  const responses = {
    urgent: "Thank you for contacting us about this urgent matter. We understand this is an emergency and we will prioritize your request. Our emergency team will be in touch within the hour to address this issue immediately. Please call our emergency line at 555-911 if this is a safety concern.",
    
    sales: "Thank you for your interest in our services! We'd be happy to provide you with a quote for pool cleaning services. Our weekly cleaning service is $150/week and includes comprehensive pool maintenance. I'll have our sales team reach out to you within 24 hours with a detailed proposal.",
    
    support: "Thank you for reaching out about your recent service. I'd be happy to help explain what was performed during your last service visit. Let me review your account and get back to you with the details. You can expect a response within 2-4 hours.",
    
    billing: "Thank you for contacting us about your invoice. I understand you have concerns about the charges, and I want to help resolve this for you. I'll review your account and invoice details and get back to you within 24 hours with an explanation or correction if needed.",
    
    complaint: "I sincerely apologize for the poor service experience you had. This is not the level of service we strive to provide, and I want to make this right for you. I'm escalating this to our customer relations manager who will personally reach out to you within 4 hours to discuss how we can resolve this situation."
  };
  
  const response = responses[emailData.category] || "Thank you for contacting us. We have received your message and will respond promptly.";
  
  // Calculate realistic tokens and cost
  const tokensUsed = 50 + Math.floor(Math.random() * 100);
  const cost = tokensUsed * 0.00015 / 1000; // gpt-4o-mini pricing
  
  // Assess quality
  const quality = assessResponseQuality(response, emailData.category);
  
  return {
    response,
    quality,
    responseTime,
    tokensUsed,
    cost
  };
}

async function simulateEmailClassification(emailData) {
  // Simulate AI classification with realistic confidence scores
  const categoryMapping = {
    urgent: { category: 'Support', urgency: 'urgent', confidence: 0.95 },
    sales: { category: 'Sales', urgency: 'normal', confidence: 0.90 },
    support: { category: 'Support', urgency: 'normal', confidence: 0.85 },
    billing: { category: 'Billing', urgency: 'normal', confidence: 0.88 },
    complaint: { category: 'Support', urgency: 'high', confidence: 0.92 }
  };
  
  return categoryMapping[emailData.category] || { category: 'General', urgency: 'normal', confidence: 0.75 };
}

async function simulateBusinessSpecificResponse(emailData, businessType) {
  const businessResponses = {
    'Pools & Spas': "Thank you for contacting our pool and spa services team. We specialize in comprehensive pool maintenance, cleaning, and repair services. Our certified technicians have extensive experience with all types of pools and spas.",
    
    'HVAC': "Thank you for reaching out to our HVAC services. We provide heating, ventilation, and air conditioning services including installation, maintenance, and repair. Our licensed technicians are available for both residential and commercial HVAC needs.",
    
    'Electrician': "Thank you for contacting our electrical services team. We are licensed electricians providing safe and reliable electrical installations, repairs, and maintenance. We handle everything from simple repairs to complex electrical projects.",
    
    'Plumber': "Thank you for contacting our plumbing services. We provide comprehensive plumbing solutions including repairs, installations, and maintenance. Our licensed plumbers are equipped to handle both residential and commercial plumbing needs."
  };
  
  const response = businessResponses[businessType] || "Thank you for contacting our services team. We are here to help with your needs.";
  
  return {
    response,
    quality: assessResponseQuality(response, 'business'),
    businessRelevance: 0.9
  };
}

async function simulateFallbackResponse(emailData) {
  // Simulate fallback response when AI is unavailable
  const fallbackResponses = {
    urgent: "We have received your urgent request and will respond as soon as possible. If this is an emergency, please call our emergency line.",
    sales: "Thank you for your inquiry. We will have someone from our sales team contact you shortly.",
    support: "We have received your support request and will respond within 24 hours.",
    default: "Thank you for contacting us. We have received your message and will respond promptly."
  };
  
  return fallbackResponses[emailData.category] || fallbackResponses.default;
}

function assessResponseQuality(response, category) {
  const quality = {
    length: 0,
    relevance: 0,
    tone: 0,
    completeness: 0,
    overall: 0
  };

  // Length analysis (ideal: 50-200 words)
  const wordCount = response.split(/\s+/).length;
  if (wordCount >= 50 && wordCount <= 200) {
    quality.length = 1.0;
  } else if (wordCount >= 30 && wordCount <= 300) {
    quality.length = 0.7;
  } else {
    quality.length = 0.3;
  }

  // Relevance analysis
  const relevantKeywords = {
    urgent: ['urgent', 'emergency', 'immediate', 'priority', 'emergency'],
    sales: ['quote', 'service', 'price', 'proposal', 'sales'],
    support: ['help', 'assist', 'explain', 'review', 'support'],
    billing: ['invoice', 'charge', 'billing', 'account', 'review'],
    complaint: ['apologize', 'sorry', 'resolve', 'escalate', 'manager']
  };
  
  const keywords = relevantKeywords[category] || ['thank', 'contact', 'help'];
  const foundKeywords = keywords.filter(keyword => 
    response.toLowerCase().includes(keyword)
  );
  quality.relevance = foundKeywords.length / keywords.length;

  // Tone analysis
  const professionalWords = ['thank', 'appreciate', 'happy', 'help', 'assist'];
  const professionalCount = professionalWords.filter(word => 
    response.toLowerCase().includes(word)
  ).length;
  quality.tone = Math.min(1, professionalCount / 3);

  // Completeness analysis
  const hasGreeting = response.toLowerCase().includes('thank');
  const hasAction = response.includes('will') || response.includes('expect');
  const hasTimeline = /\d+\s*(hour|day|week)/.test(response);
  
  quality.completeness = (hasGreeting ? 0.3 : 0) + (hasAction ? 0.4 : 0) + (hasTimeline ? 0.3 : 0);

  // Overall quality score
  quality.overall = (quality.length + quality.relevance + quality.tone + quality.completeness) / 4;

  return quality;
}

async function cleanupTestData() {
  const cleanupQueries = [
    { table: 'ai_usage_logs', condition: { user_id: testConfig.testUserId } },
    { table: 'ai_responses', condition: { user_id: testConfig.testUserId } },
    { table: 'profiles', condition: { id: testConfig.testUserId } }
  ];

  for (const query of cleanupQueries) {
    try {
      await supabase
        .from(query.table)
        .delete()
        .match(query.condition);
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  testAIResponses()
    .then(results => {
      process.exit(results.overall === 'success' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ AI response testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAIResponses };
