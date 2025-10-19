/**
 * Test script for the dynamic classifier system message
 * Tests the system with different business types to ensure it's truly dynamic
 */

import { generateDynamicClassifierSystemMessage } from '../src/lib/dynamicClassifierSystemMessage.js';

// Test different business types
const testBusinesses = [
  {
    name: "ABC Electric Co",
    businessTypes: ["Electrician"],
    emailDomain: "abcelectric.com",
    phone: "555-123-4567",
    websiteUrl: "abcelectric.com",
    address: "123 Electric St, City, ST 12345",
    currency: "USD",
    timezone: "America/New_York",
    serviceAreas: "Metro Area",
    operatingHours: "Monday-Friday 8AM-6PM",
    responseTime: "2 hours",
    services: ["Electrical Installation", "Electrical Repair", "Panel Upgrades"]
  },
  {
    name: "XYZ Plumbing Services",
    businessTypes: ["Plumber"],
    emailDomain: "xyzplumbing.com",
    phone: "555-987-6543",
    websiteUrl: "xyzplumbing.com",
    address: "456 Pipe Ave, City, ST 12345",
    currency: "USD",
    timezone: "America/Chicago",
    serviceAreas: "Greater Metro",
    operatingHours: "24/7 Emergency Service",
    responseTime: "1 hour",
    services: ["Plumbing Installation", "Plumbing Repair", "Drain Cleaning"]
  },
  {
    name: "Cool Air HVAC",
    businessTypes: ["HVAC"],
    emailDomain: "coolairhvac.com",
    phone: "555-456-7890",
    websiteUrl: "coolairhvac.com",
    address: "789 Air St, City, ST 12345",
    currency: "USD",
    timezone: "America/Denver",
    serviceAreas: "Regional Coverage",
    operatingHours: "Monday-Sunday 7AM-9PM",
    responseTime: "4 hours",
    services: ["HVAC Installation", "HVAC Repair", "Maintenance"]
  },
  {
    name: "The Hot Tub Man Ltd.",
    businessTypes: ["Hot tub & Spa"],
    emailDomain: "thehottubman.ca",
    phone: "403-550-5140",
    websiteUrl: "thehottubman.ca",
    address: "Alberta, Canada",
    currency: "CAD",
    timezone: "America/Edmonton",
    serviceAreas: "Main service area",
    operatingHours: "Monday-Friday 8AM-5PM",
    responseTime: "24 hours",
    services: ["Hot Tub Installation", "Hot Tub Repair", "Chemical Service"]
  },
  {
    name: "BuildRight Construction",
    businessTypes: ["General Contractor"],
    emailDomain: "buildright.com",
    phone: "555-321-9876",
    websiteUrl: "buildright.com",
    address: "321 Build Blvd, City, ST 12345",
    currency: "USD",
    timezone: "America/Los_Angeles",
    serviceAreas: "West Coast",
    operatingHours: "Monday-Friday 7AM-5PM",
    responseTime: "48 hours",
    services: ["Construction", "Renovation", "Remodeling"]
  }
];

function testDynamicClassifier() {
  console.log("🧪 TESTING DYNAMIC CLASSIFIER SYSTEM MESSAGE");
  console.log("=" .repeat(80));
  
  testBusinesses.forEach((business, index) => {
    console.log(`\n🏢 TEST ${index + 1}: ${business.name} (${business.businessTypes[0]})`);
    console.log("-".repeat(60));
    
    // Generate system message
    const systemMessage = generateDynamicClassifierSystemMessage(business);
    
    // Test dynamic content
    const tests = [
      {
        name: "Business Name Integration",
        test: () => systemMessage.includes(business.name),
        expected: true
      },
      {
        name: "Business Type Integration", 
        test: () => systemMessage.includes(business.businessTypes[0]),
        expected: true
      },
      {
        name: "Email Domain Integration",
        test: () => systemMessage.includes(business.emailDomain),
        expected: true
      },
      {
        name: "Services Integration",
        test: () => business.services.some(service => systemMessage.includes(service)),
        expected: true
      },
      {
        name: "Business-Specific Keywords",
        test: () => {
          const businessType = business.businessTypes[0];
          const expectedKeywords = getExpectedKeywords(businessType);
          return expectedKeywords.some(keyword => systemMessage.includes(keyword));
        },
        expected: true
      },
      {
        name: "Business-Specific Categories",
        test: () => {
          const businessType = business.businessTypes[0];
          const expectedCategories = getExpectedCategories(businessType);
          return expectedCategories.some(category => systemMessage.includes(category));
        },
        expected: true
      },
      {
        name: "Dynamic Supplier Categories",
        test: () => {
          const businessType = business.businessTypes[0];
          const expectedSuppliers = getExpectedSuppliers(businessType);
          return expectedSuppliers.some(supplier => systemMessage.includes(supplier));
        },
        expected: true
      }
    ];
    
    // Run tests
    tests.forEach(test => {
      const result = test.test();
      const status = result === test.expected ? '✅' : '❌';
      console.log(`   ${status} ${test.name}`);
    });
    
    console.log(`   📊 System message length: ${systemMessage.length} characters`);
  });
  
  // Test cross-business compatibility
  console.log("\n🔄 CROSS-BUSINESS COMPATIBILITY TEST:");
  console.log("-".repeat(60));
  
  testCrossBusinessCompatibility();
  
  // Test missing business type handling
  console.log("\n❓ UNKNOWN BUSINESS TYPE TEST:");
  console.log("-".repeat(60));
  
  testUnknownBusinessType();
  
  console.log("\n" + "=".repeat(80));
  console.log("🎯 DYNAMIC CLASSIFIER VALIDATION COMPLETE!");
}

function getExpectedKeywords(businessType) {
  const keywordMap = {
    'Electrician': ['electrical', 'wiring', 'outlet', 'breaker', 'circuit', 'power'],
    'Plumber': ['plumbing', 'pipe', 'drain', 'toilet', 'faucet', 'leak', 'water'],
    'HVAC': ['hvac', 'heating', 'cooling', 'air conditioning', 'furnace', 'thermostat'],
    'Hot tub & Spa': ['hot tub', 'spa', 'jacuzzi', 'chemicals', 'filter', 'heater'],
    'General Contractor': ['construction', 'renovation', 'remodel', 'contractor', 'building']
  };
  
  return keywordMap[businessType] || ['service', 'repair', 'installation'];
}

function getExpectedCategories(businessType) {
  const categoryMap = {
    'Electrician': ['NewInstallation', 'RepairService', 'UpgradeService', 'ElectricalEmergency'],
    'Plumber': ['NewInstallation', 'RepairService', 'MaintenanceService', 'WaterLeak'],
    'HVAC': ['NewInstallation', 'RepairService', 'MaintenanceService', 'NoHeat'],
    'Hot tub & Spa': ['NewSpaSales', 'AccessorySales', 'Consultations', 'LeakEmergencies'],
    'General Contractor': ['NewProject', 'Renovation', 'Remodeling', 'SafetyIssue']
  };
  
  return categoryMap[businessType] || ['NewService', 'RepairService', 'MaintenanceService'];
}

function getExpectedSuppliers(businessType) {
  const supplierMap = {
    'Electrician': ['Electrical Supply Co', 'Wire & Cable Co', 'Electrical Parts Inc'],
    'Plumber': ['Plumbing Supply Co', 'Pipe & Fitting Co', 'Plumbing Parts Inc'],
    'HVAC': ['HVAC Supply Co', 'Refrigeration Parts', 'HVAC Equipment Inc'],
    'Hot tub & Spa': ['Aqua Spa Supply', 'Strong Spas', 'Paradise Patio Furniture'],
    'General Contractor': ['Building Supply Co', 'Construction Materials', 'Contractor Supply']
  };
  
  return supplierMap[businessType] || ['General Supply Co', 'Service Parts Inc'];
}

function testCrossBusinessCompatibility() {
  // Test that different business types don't interfere with each other
  const electricianMessage = generateDynamicClassifierSystemMessage(testBusinesses[0]);
  const plumberMessage = generateDynamicClassifierSystemMessage(testBusinesses[1]);
  
  const tests = [
    {
      name: "Electrician message doesn't contain plumbing keywords",
      test: () => !electricianMessage.includes('plumbing') && !electricianMessage.includes('pipe'),
      expected: true
    },
    {
      name: "Plumber message doesn't contain electrical keywords", 
      test: () => !plumberMessage.includes('electrical') && !plumberMessage.includes('wiring'),
      expected: true
    },
    {
      name: "Both messages contain universal categories",
      test: () => electricianMessage.includes('BANKING') && plumberMessage.includes('BANKING'),
      expected: true
    }
  ];
  
  tests.forEach(test => {
    const result = test.test();
    const status = result === test.expected ? '✅' : '❌';
    console.log(`   ${status} ${test.name}`);
  });
}

function testUnknownBusinessType() {
  const unknownBusiness = {
    name: "Mystery Service Co",
    businessTypes: ["Unknown Service Type"],
    emailDomain: "mysteryservice.com",
    phone: "555-000-0000",
    websiteUrl: "mysteryservice.com",
    address: "Unknown Address",
    currency: "USD",
    timezone: "America/New_York",
    serviceAreas: "Unknown Area",
    operatingHours: "Unknown Hours",
    responseTime: "Unknown",
    services: ["Unknown Service"]
  };
  
  const systemMessage = generateDynamicClassifierSystemMessage(unknownBusiness);
  
  const tests = [
    {
      name: "Handles unknown business type gracefully",
      test: () => systemMessage.length > 0,
      expected: true
    },
    {
      name: "Uses default template for unknown business",
      test: () => systemMessage.includes('General Service') || systemMessage.includes('Unknown Service Type'),
      expected: true
    },
    {
      name: "Still contains universal categories",
      test: () => systemMessage.includes('BANKING') && systemMessage.includes('SUPPORT'),
      expected: true
    }
  ];
  
  tests.forEach(test => {
    const result = test.test();
    const status = result === test.expected ? '✅' : '❌';
    console.log(`   ${status} ${test.name}`);
  });
}

// Run the test
testDynamicClassifier();
