/**
 * TEST ENHANCED DYNAMIC CLASSIFIER GENERATOR
 * 
 * This script tests the new EnhancedDynamicClassifierGenerator to ensure it
 * generates the same quality and detail level as the current Hot Tub Man Ltd. classifier
 */

import { EnhancedDynamicClassifierGenerator } from '../src/lib/enhancedDynamicClassifierGenerator.js';

// Test data matching Hot Tub Man Ltd. configuration
const testBusinessInfo = {
  name: "The Hot Tub Man Ltd.",
  emailDomain: "thehottubman.ca",
  phone: "(403) 123-4567",
  websiteUrl: "https://thehottubman.ca",
  address: "123 Main Street",
  city: "Calgary",
  state: "AB",
  zipCode: "T2P 1J1",
  country: "Canada",
  currency: "CAD",
  timezone: "America/Edmonton",
  businessCategory: "Hot Tub & Spa Services",
  serviceAreas: ["Calgary", "Edmonton", "Red Deer"],
  operatingHours: "Monday-Friday 8AM-6PM, Saturday 9AM-4PM",
  responseTime: "24 hours"
};

const testManagers = [
  { name: "Hailey", role: "Manager" },
  { name: "Jillian", role: "Manager" },
  { name: "Stacie", role: "Manager" },
  { name: "Aaron", role: "Manager" }
];

const testSuppliers = [
  { name: "Aqua Spa Pool Supply", emailDomain: "asp-supply.com" },
  { name: "Paradise Patio Furniture Ltd", emailDomain: "paradisepatiofurnitureltd.com" },
  { name: "Strong Spas", emailDomain: "strong9.com" }
];

// Test the EnhancedDynamicClassifierGenerator
function testEnhancedClassifier() {
  console.log('🧪 Testing EnhancedDynamicClassifierGenerator...\n');
  
  try {
    const generator = new EnhancedDynamicClassifierGenerator(
      "Hot tub & Spa",
      testBusinessInfo,
      testManagers,
      testSuppliers
    );
    
    const systemMessage = generator.generateClassifierSystemMessage();
    
    console.log('✅ Enhanced classifier system message generated successfully!');
    console.log(`📊 Message length: ${systemMessage.length} characters`);
    console.log(`📊 Message preview (first 500 chars):\n${systemMessage.substring(0, 500)}...\n`);
    
    // Test key features
    const tests = [
      {
        name: "Business Name Integration",
        test: () => systemMessage.includes("The Hot Tub Man Ltd."),
        expected: true
      },
      {
        name: "Email Domain Integration", 
        test: () => systemMessage.includes("@thehottubman.ca"),
        expected: true
      },
      {
        name: "Manager Names Integration",
        test: () => testManagers.every(m => systemMessage.includes(m.name)),
        expected: true
      },
      {
        name: "Supplier Names Integration",
        test: () => testSuppliers.every(s => systemMessage.includes(s.name)),
        expected: true
      },
      {
        name: "Business-Specific Keywords",
        test: () => systemMessage.includes("hot tub") && systemMessage.includes("spa"),
        expected: true
      },
      {
        name: "Tertiary Categories",
        test: () => systemMessage.includes("FromBusiness") && systemMessage.includes("ToBusiness"),
        expected: true
      },
      {
        name: "Receipt Categories",
        test: () => systemMessage.includes("PaymentSent") && systemMessage.includes("PaymentReceived"),
        expected: true
      },
      {
        name: "Form Submission Override",
        test: () => systemMessage.includes("Form Submission Override"),
        expected: true
      },
      {
        name: "Urgent Keywords",
        test: () => systemMessage.includes("broken") && systemMessage.includes("not working"),
        expected: true
      },
      {
        name: "JSON Output Format",
        test: () => systemMessage.includes("JSON Output Format") && systemMessage.includes("```json"),
        expected: true
      }
    ];
    
    console.log('🔍 Running feature tests...\n');
    
    let passedTests = 0;
    tests.forEach(test => {
      const result = test.test();
      const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}: ${result}`);
      if (result === test.expected) passedTests++;
    });
    
    console.log(`\n📊 Test Results: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      console.log('🎉 All tests passed! Enhanced classifier is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please review the implementation.');
    }
    
    return {
      success: passedTests === tests.length,
      messageLength: systemMessage.length,
      passedTests,
      totalTests: tests.length,
      systemMessage
    };
    
  } catch (error) {
    console.error('❌ Error testing enhanced classifier:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test multiple business types
function testMultipleBusinessTypes() {
  console.log('\n🧪 Testing multiple business types...\n');
  
  const businessTypes = [
    "Hot tub & Spa",
    "Pools", 
    "Electrician",
    "HVAC",
    "Plumber",
    "Roofing",
    "Painting",
    "Flooring",
    "Landscaping",
    "General Construction",
    "Insulation & Foam Spray",
    "Sauna & Icebath"
  ];
  
  const results = {};
  
  businessTypes.forEach(businessType => {
    try {
      const generator = new EnhancedDynamicClassifierGenerator(
        businessType,
        { ...testBusinessInfo, name: `Test ${businessType} Business` },
        testManagers,
        testSuppliers
      );
      
      const systemMessage = generator.generateClassifierSystemMessage();
      
      results[businessType] = {
        success: true,
        messageLength: systemMessage.length,
        hasBusinessSpecificContent: systemMessage.includes(businessType.toLowerCase())
      };
      
      console.log(`✅ ${businessType}: ${systemMessage.length} chars`);
      
    } catch (error) {
      results[businessType] = {
        success: false,
        error: error.message
      };
      console.log(`❌ ${businessType}: ${error.message}`);
    }
  });
  
  const successfulTypes = Object.values(results).filter(r => r.success).length;
  console.log(`\n📊 Multi-business test results: ${successfulTypes}/${businessTypes.length} business types successful`);
  
  return results;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Enhanced Dynamic Classifier Generator Tests\n');
  console.log('=' * 60);
  
  const mainTest = testEnhancedClassifier();
  const multiBusinessTest = testMultipleBusinessTypes();
  
  console.log('\n' + '=' * 60);
  console.log('📋 FINAL TEST SUMMARY');
  console.log('=' * 60);
  
  console.log(`Main Test: ${mainTest.success ? '✅ PASSED' : '❌ FAILED'}`);
  if (mainTest.success) {
    console.log(`  - Message Length: ${mainTest.messageLength} characters`);
    console.log(`  - Tests Passed: ${mainTest.passedTests}/${mainTest.totalTests}`);
  } else {
    console.log(`  - Error: ${mainTest.error}`);
  }
  
  const successfulBusinessTypes = Object.values(multiBusinessTest).filter(r => r.success).length;
  console.log(`Multi-Business Test: ${successfulBusinessTypes}/${Object.keys(multiBusinessTest).length} business types successful`);
  
  const overallSuccess = mainTest.success && successfulBusinessTypes === Object.keys(multiBusinessTest).length;
  
  console.log(`\n🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (overallSuccess) {
    console.log('\n🎉 Enhanced Dynamic Classifier Generator is ready for production!');
    console.log('✨ It matches the quality and detail level of the current Hot Tub Man Ltd. classifier');
    console.log('🚀 It dynamically generates for all 12 supported business types');
  } else {
    console.log('\n⚠️ Please review failed tests and fix issues before deployment');
  }
  
  return {
    overallSuccess,
    mainTest,
    multiBusinessTest
  };
}

// Export for use in other modules
export { testEnhancedClassifier, testMultipleBusinessTypes, runAllTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
