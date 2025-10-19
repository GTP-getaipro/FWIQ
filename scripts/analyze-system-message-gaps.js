/**
 * Comprehensive System Message Gap Analysis
 * Analyzes the current system message for gaps and creates a dynamic, business-agnostic solution
 */

import { generateImprovedClassifierSystemMessage } from '../src/lib/improvedClassifierSystemMessage.js';

// All supported business types from behaviorSchemaMerger.js
const SUPPORTED_BUSINESS_TYPES = [
  'Electrician',
  'Plumber', 
  'Pools',
  'Pools & Spas',
  'Hot tub & Spa',
  'Sauna & Icebath',
  'Flooring',
  'Flooring Contractor',
  'General Construction',
  'General Contractor',
  'HVAC',
  'Insulation & Foam Spray',
  'Landscaping',
  'Painting',
  'Painting Contractor',
  'Roofing',
  'Roofing Contractor'
];

// Categories from current system message
const CURRENT_CATEGORIES = [
  'BANKING', 'FORMSUB', 'GOOGLE REVIEW', 'MANAGER', 'PHONE', 'PROMO',
  'RECRUITMENT', 'SALES', 'SOCIALMEDIA', 'SUPPLIERS', 'SUPPORT', 'URGENT', 'MISC'
];

// Categories from original system message that might be missing
const POTENTIAL_MISSING_CATEGORIES = [
  'SERVICE', 'WARRANTY', 'INVOICE', 'PAYMENT_CONFIRMATION'
];

function analyzeSystemMessageGaps() {
  console.log("🔍 COMPREHENSIVE SYSTEM MESSAGE GAP ANALYSIS");
  console.log("=" .repeat(80));
  
  // Test with different business types
  console.log("\n📊 TESTING WITH DIFFERENT BUSINESS TYPES:");
  console.log("-".repeat(80));
  
  SUPPORTED_BUSINESS_TYPES.slice(0, 5).forEach(businessType => {
    const testBusinessInfo = createTestBusinessInfo(businessType);
    const systemMessage = generateImprovedClassifierSystemMessage(testBusinessInfo);
    
    console.log(`\n🏢 ${businessType}:`);
    console.log(`   System message length: ${systemMessage.length} characters`);
    console.log(`   Business-specific content: ${systemMessage.includes(businessType) ? '✅' : '❌'}`);
    console.log(`   Dynamic business name: ${systemMessage.includes(testBusinessInfo.name) ? '✅' : '❌'}`);
  });
  
  // Analyze category coverage
  console.log("\n📋 CATEGORY COVERAGE ANALYSIS:");
  console.log("-".repeat(80));
  
  const testBusinessInfo = createTestBusinessInfo('Hot tub & Spa');
  const systemMessage = generateImprovedClassifierSystemMessage(testBusinessInfo);
  
  console.log("\n✅ CURRENT CATEGORIES COVERED:");
  CURRENT_CATEGORIES.forEach(category => {
    const found = systemMessage.includes(category);
    console.log(`   ${found ? '✅' : '❌'} ${category}`);
  });
  
  console.log("\n❓ POTENTIALLY MISSING CATEGORIES:");
  POTENTIAL_MISSING_CATEGORIES.forEach(category => {
    const found = systemMessage.includes(category);
    console.log(`   ${found ? '✅' : '❌'} ${category}`);
  });
  
  // Analyze business-specific gaps
  console.log("\n🏢 BUSINESS-SPECIFIC GAP ANALYSIS:");
  console.log("-".repeat(80));
  
  analyzeBusinessSpecificGaps();
  
  // Analyze dynamic content gaps
  console.log("\n🔄 DYNAMIC CONTENT GAP ANALYSIS:");
  console.log("-".repeat(80));
  
  analyzeDynamicContentGaps();
  
  // Generate recommendations
  console.log("\n🎯 RECOMMENDATIONS:");
  console.log("-".repeat(80));
  
  generateRecommendations();
}

function createTestBusinessInfo(businessType) {
  return {
    name: `Test ${businessType} Business`,
    businessTypes: [businessType],
    emailDomain: 'testbusiness.com',
    phone: '555-123-4567',
    websiteUrl: 'testbusiness.com',
    address: '123 Test St, Test City, TC 12345',
    currency: 'USD',
    timezone: 'America/New_York',
    serviceAreas: 'Test Service Area',
    operatingHours: 'Monday-Friday 9AM-5PM',
    responseTime: '24 hours'
  };
}

function analyzeBusinessSpecificGaps() {
  const gaps = [
    {
      issue: "Hardcoded Business Names",
      description: "System message contains hardcoded 'The Hot Tub Man Ltd.' references",
      impact: "Not applicable to other businesses",
      solution: "Use dynamic business name from businessInfo"
    },
    {
      issue: "Business-Specific Categories",
      description: "Categories like 'NewSpaSales', 'AquaSpaSupply' are hot tub specific",
      impact: "Not applicable to HVAC, Plumbing, etc.",
      solution: "Create dynamic category generation based on business type"
    },
    {
      issue: "Service-Specific Keywords",
      description: "Keywords like 'hot tub', 'spa', 'leak' are service specific",
      impact: "Poor classification for other service types",
      solution: "Generate keywords dynamically based on business services"
    },
    {
      issue: "Supplier Categories",
      description: "Hardcoded suppliers like 'AquaSpaSupply', 'StrongSpas'",
      impact: "Not applicable to other businesses",
      solution: "Use dynamic supplier list from businessInfo"
    }
  ];
  
  gaps.forEach((gap, index) => {
    console.log(`\n${index + 1}. ${gap.issue}:`);
    console.log(`   Description: ${gap.description}`);
    console.log(`   Impact: ${gap.impact}`);
    console.log(`   Solution: ${gap.solution}`);
  });
}

function analyzeDynamicContentGaps() {
  const gaps = [
    {
      issue: "Static Category Structure",
      description: "All businesses get the same category structure",
      impact: "Irrelevant categories for some businesses",
      solution: "Generate categories based on business type and services"
    },
    {
      issue: "Fixed Secondary Categories",
      description: "Secondary categories are hardcoded",
      impact: "Some businesses don't need certain categories",
      solution: "Dynamically generate secondary categories based on business needs"
    },
    {
      issue: "Static Keywords",
      description: "Keywords are the same for all businesses",
      impact: "Poor classification accuracy for different industries",
      solution: "Generate industry-specific keywords dynamically"
    },
    {
      issue: "Fixed AI Reply Logic",
      description: "AI reply logic is the same for all businesses",
      impact: "May not be appropriate for all business types",
      solution: "Customize AI reply logic based on business type and services"
    }
  ];
  
  gaps.forEach((gap, index) => {
    console.log(`\n${index + 1}. ${gap.issue}:`);
    console.log(`   Description: ${gap.description}`);
    console.log(`   Impact: ${gap.impact}`);
    console.log(`   Solution: ${gap.solution}`);
  });
}

function generateRecommendations() {
  const recommendations = [
    {
      priority: "HIGH",
      title: "Create Dynamic Category Generator",
      description: "Build a system that generates categories based on business type, services, and industry",
      implementation: "Create category templates for each business type and merge them dynamically"
    },
    {
      priority: "HIGH", 
      title: "Implement Business-Specific Keywords",
      description: "Generate keywords dynamically based on business services and industry",
      implementation: "Create keyword libraries for each business type and service"
    },
    {
      priority: "MEDIUM",
      title: "Dynamic Supplier Integration",
      description: "Use actual supplier data from businessInfo instead of hardcoded suppliers",
      implementation: "Read suppliers from businessInfo and generate categories dynamically"
    },
    {
      priority: "MEDIUM",
      title: "Industry-Specific AI Reply Logic",
      description: "Customize AI reply logic based on business type and industry standards",
      implementation: "Create AI reply templates for different business types"
    },
    {
      priority: "LOW",
      title: "Add Missing Categories",
      description: "Add SERVICE, WARRANTY, and other missing categories",
      implementation: "Extend category structure to include all relevant categories"
    }
  ];
  
  recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. [${rec.priority}] ${rec.title}:`);
    console.log(`   Description: ${rec.description}`);
    console.log(`   Implementation: ${rec.implementation}`);
  });
}

// Run the analysis
analyzeSystemMessageGaps();
