/**
 * Test Classifier System Message Generation
 * 
 * This script tests the classifier system message generation to ensure
 * all business information is properly injected and the system message
 * is complete and accurate.
 */

import { buildProductionClassifier } from '../src/lib/aiSchemaInjector.js';

// Test data for "The Hot Tub Man"
const testBusinessInfo = {
  name: 'The Hot Tub Man',
  phone: '(403) 123-4567',
  emailDomain: 'thehottubman.ca',
  businessTypes: ['pools_spas'],
  address: '123 Main Street',
  city: 'Calgary',
  state: 'Alberta',
  zipCode: 'T2P 1J9',
  country: 'Canada',
  websiteUrl: 'https://thehottubman.ca',
  currency: 'CAD',
  timezone: 'America/Edmonton',
  businessCategory: 'Hot tub & Spa',
  serviceAreas: ['Calgary', 'Edmonton', 'Red Deer'],
  operatingHours: 'Monday-Friday 8AM-5PM',
  responseTime: '24 hours'
};

// Mock AI config
const mockAiConfig = {
  businessTypes: 'Hot tub & Spa',
  primaryServices: 'hot tubs and spas'
};

// Mock label config
const mockLabelConfig = {
  labels: [
    {
      name: 'SUPPORT',
      description: 'Customer service and technical support',
      classificationRules: {
        keywords: {
          general: ['help', 'support', 'question'],
          technical: ['broken', 'not working', 'error']
        }
      }
    }
  ]
};

// Mock managers and suppliers
const mockManagers = [
  { name: 'Hailey', email: 'hailey@thehottubman.ca' },
  { name: 'Jillian', email: 'jillian@thehottubman.ca' },
  { name: 'Stacie', email: 'stacie@thehottubman.ca' },
  { name: 'Aaron', email: 'aaron@thehottubman.ca' }
];

const mockSuppliers = [
  { name: 'Aqua Spa Pool Supply', email: 'orders@asp-supply.com' },
  { name: 'Paradise Patio Furniture Ltd', email: 'orders@paradisepatio.com' },
  { name: 'Strong Spas', email: 'orders@strong9.com' }
];

async function testClassifierSystemMessage() {
  try {
    console.log('🧪 Testing Classifier System Message Generation...\n');

    // Generate the classifier system message
    console.log('📊 Generating classifier system message...');
    const systemMessage = buildProductionClassifier(
      mockAiConfig,
      mockLabelConfig,
      testBusinessInfo,
      mockManagers,
      mockSuppliers
    );

    // Step 1: Check for remaining placeholders
    console.log('\n🔍 Step 1: Checking for remaining placeholders...');
    const placeholderMatches = systemMessage.match(/\{\{.*?\}\}/g);
    
    if (placeholderMatches && placeholderMatches.length > 0) {
      console.log('❌ Found remaining placeholders:');
      placeholderMatches.forEach(placeholder => {
        console.log(`   - ${placeholder}`);
      });
    } else {
      console.log('✅ No remaining placeholders found');
    }

    // Step 2: Check for specific business information
    console.log('\n📋 Step 2: Verifying business information injection...');
    
    const checks = [
      { name: 'Business Name', pattern: /The Hot Tub Man/, found: systemMessage.includes('The Hot Tub Man') },
      { name: 'Phone Number', pattern: /\(403\) 123-4567/, found: systemMessage.includes('(403) 123-4567') },
      { name: 'Email Domain', pattern: /thehottubman\.ca/, found: systemMessage.includes('thehottubman.ca') },
      { name: 'Website URL', pattern: /thehottubman\.ca/, found: systemMessage.includes('thehottubman.ca') },
      { name: 'Service Areas', pattern: /Calgary.*Edmonton.*Red Deer/, found: systemMessage.includes('Calgary') && systemMessage.includes('Edmonton') && systemMessage.includes('Red Deer') },
      { name: 'Primary Services', pattern: /hot tubs and spas/, found: systemMessage.includes('hot tubs and spas') },
      { name: 'Operating Hours', pattern: /Monday-Friday 8AM-5PM/, found: systemMessage.includes('Monday-Friday 8AM-5PM') },
      { name: 'Response Time', pattern: /24 hours/, found: systemMessage.includes('24 hours') },
      { name: 'Currency', pattern: /CAD/, found: systemMessage.includes('CAD') },
      { name: 'Timezone', pattern: /America\/Edmonton/, found: systemMessage.includes('America/Edmonton') },
      { name: 'Manager Names', pattern: /Hailey.*Jillian.*Stacie.*Aaron/, found: systemMessage.includes('Hailey') && systemMessage.includes('Jillian') && systemMessage.includes('Stacie') && systemMessage.includes('Aaron') },
      { name: 'Supplier Names', pattern: /Aqua Spa Pool Supply.*Paradise Patio.*Strong Spas/, found: systemMessage.includes('Aqua Spa Pool Supply') && systemMessage.includes('Paradise Patio') && systemMessage.includes('Strong Spas') }
    ];

    checks.forEach(check => {
      if (check.found) {
        console.log(`✅ ${check.name}: Found`);
      } else {
        console.log(`❌ ${check.name}: Missing`);
      }
    });

    // Step 3: Check for business context section
    console.log('\n📄 Step 3: Verifying business context section...');
    
    const contextChecks = [
      { name: 'Business Context Header', pattern: /### Business Context:/, found: systemMessage.includes('### Business Context:') },
      { name: 'Business Name Line', pattern: /- Business Name: The Hot Tub Man/, found: systemMessage.includes('- Business Name: The Hot Tub Man') },
      { name: 'Business Type Line', pattern: /- Business Type\(s\): pools_spas/, found: systemMessage.includes('- Business Type(s): pools_spas') },
      { name: 'Email Domain Line', pattern: /- Email Domain: thehottubman\.ca/, found: systemMessage.includes('- Email Domain: thehottubman.ca') },
      { name: 'Phone Line', pattern: /- Phone: \(403\) 123-4567/, found: systemMessage.includes('- Phone: (403) 123-4567') },
      { name: 'Website Line', pattern: /- Website: https:\/\/thehottubman\.ca/, found: systemMessage.includes('- Website: https://thehottubman.ca') },
      { name: 'Address Line', pattern: /- Address: 123 Main Street/, found: systemMessage.includes('- Address: 123 Main Street') },
      { name: 'Currency Line', pattern: /- Currency: CAD/, found: systemMessage.includes('- Currency: CAD') },
      { name: 'Timezone Line', pattern: /- Timezone: America\/Edmonton/, found: systemMessage.includes('- Timezone: America/Edmonton') },
      { name: 'Service Areas Line', pattern: /- Service Areas: Calgary, Edmonton, Red Deer/, found: systemMessage.includes('- Service Areas: Calgary, Edmonton, Red Deer') },
      { name: 'Primary Services Line', pattern: /- Primary Services: hot tubs and spas/, found: systemMessage.includes('- Primary Services: hot tubs and spas') },
      { name: 'Managers Line', pattern: /- Managers: Hailey, Jillian, Stacie, Aaron/, found: systemMessage.includes('- Managers: Hailey, Jillian, Stacie, Aaron') },
      { name: 'Suppliers Line', pattern: /- Suppliers: Aqua Spa Pool Supply, Paradise Patio Furniture Ltd, Strong Spas/, found: systemMessage.includes('- Suppliers: Aqua Spa Pool Supply, Paradise Patio Furniture Ltd, Strong Spas') }
    ];

    contextChecks.forEach(check => {
      if (check.found) {
        console.log(`✅ ${check.name}: Found`);
      } else {
        console.log(`❌ ${check.name}: Missing`);
      }
    });

    // Step 4: Show sample of generated system message
    console.log('\n📄 Step 4: Sample of generated classifier system message (first 1000 characters):');
    console.log('─'.repeat(80));
    console.log(systemMessage.substring(0, 1000) + '...');
    console.log('─'.repeat(80));

    console.log('\n✅ Classifier system message generation test completed!');
    
    const passedChecks = checks.filter(check => check.found).length;
    const totalChecks = checks.length;
    const passedContextChecks = contextChecks.filter(check => check.found).length;
    const totalContextChecks = contextChecks.length;
    
    console.log(`\n📊 Results:`);
    console.log(`   Business Information: ${passedChecks}/${totalChecks} checks passed`);
    console.log(`   Business Context: ${passedContextChecks}/${totalContextChecks} checks passed`);
    
    if (passedChecks === totalChecks && passedContextChecks === totalContextChecks) {
      console.log('🎉 All classifier system message generation is working correctly!');
    } else {
      console.log('⚠️ Some classifier system message issues found. Check the missing items above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testClassifierSystemMessage();
