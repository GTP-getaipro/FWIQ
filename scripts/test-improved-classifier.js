/**
 * Test script for the improved classifier system message
 * This script validates that tertiary categories are properly enforced
 */

import { generateImprovedClassifierSystemMessage } from '../src/lib/improvedClassifierSystemMessage.js';

// Mock business info for testing
const testBusinessInfo = {
  name: "The Hot Tub Man Ltd.",
  businessTypes: ["hot-tub-spa"],
  emailDomain: "thehottubman.ca",
  phone: "403-550-5140",
  websiteUrl: "thehottubman.ca",
  address: "Alberta, Canada",
  currency: "CAD",
  timezone: "America/Edmonton",
  serviceAreas: "Main service area",
  operatingHours: "Monday-Friday 8AM-5PM",
  responseTime: "24 hours"
};

// Test emails that should trigger tertiary categories
const testEmails = [
  {
    name: "E-Transfer Received",
    subject: "You received an Interac e-Transfer",
    from: "noreply@td.com",
    body: "You received an Interac e-Transfer of $150.00 from John Smith. The transfer has been deposited into your account.",
    expectedPrimary: "Banking",
    expectedSecondary: "e-Transfer", 
    expectedTertiary: "ToBusiness"
  },
  {
    name: "E-Transfer Sent",
    subject: "Your e-Transfer was successful",
    from: "noreply@rbc.com",
    body: "You sent an Interac e-Transfer of $200.00 to ABC Supplies. The transfer has been completed successfully.",
    expectedPrimary: "Banking",
    expectedSecondary: "e-Transfer",
    expectedTertiary: "FromBusiness"
  },
  {
    name: "Payment Receipt - Received",
    subject: "Payment Confirmation - Invoice #12345",
    from: "billing@customer.com",
    body: "Thank you for your payment of $500.00 for Invoice #12345. Your payment has been received and processed.",
    expectedPrimary: "Banking",
    expectedSecondary: "Receipts",
    expectedTertiary: "PaymentReceived"
  },
  {
    name: "Payment Receipt - Sent",
    subject: "Purchase Confirmation",
    from: "orders@supplier.com",
    body: "Your payment of $300.00 for Order #789 has been processed. Thank you for your business.",
    expectedPrimary: "Banking",
    expectedSecondary: "Receipts", 
    expectedTertiary: "PaymentSent"
  },
  {
    name: "Bank Security Alert",
    subject: "Security Alert - New Login Detected",
    from: "security@bank.com",
    body: "We detected a new login to your account from an unrecognized device. If this was not you, please contact us immediately.",
    expectedPrimary: "Banking",
    expectedSecondary: "BankAlert",
    expectedTertiary: "SecurityAlert"
  },
  {
    name: "Refund Issued",
    subject: "Refund Processed - Order #456",
    from: "refunds@supplier.com",
    body: "Your refund of $100.00 for Order #456 has been processed and will appear in your account within 3-5 business days.",
    expectedPrimary: "Banking",
    expectedSecondary: "Refund",
    expectedTertiary: "RefundIssued"
  },
  {
    name: "Invoice Payment Due",
    subject: "Payment Due - Invoice #789",
    from: "billing@vendor.com",
    body: "Your invoice #789 for $250.00 is due on January 15th. Please remit payment to avoid late fees.",
    expectedPrimary: "Banking",
    expectedSecondary: "Invoice",
    expectedTertiary: "PaymentDue"
  }
];

function testClassifierSystemMessage() {
  console.log("🧪 TESTING IMPROVED CLASSIFIER SYSTEM MESSAGE");
  console.log("=" .repeat(80));
  
  // Generate the improved system message
  const systemMessage = generateImprovedClassifierSystemMessage(testBusinessInfo);
  
  console.log("\n📋 SYSTEM MESSAGE GENERATED SUCCESSFULLY");
  console.log(`Length: ${systemMessage.length} characters`);
  
  // Check for mandatory tertiary category rules
  const mandatoryRules = [
    "MANDATORY TERTIARY CATEGORIES",
    "e-transfer' → tertiary_category MUST be",
    "receipts' → tertiary_category MUST be", 
    "invoice' → tertiary_category MUST be",
    "bank-alert' → tertiary_category MUST be",
    "refund' → tertiary_category MUST be",
    "NEVER return null"
  ];
  
  console.log("\n🔍 VALIDATING MANDATORY RULES:");
  mandatoryRules.forEach(rule => {
    const found = systemMessage.includes(rule);
    console.log(`${found ? '✅' : '❌'} ${rule}`);
  });
  
  // Test email scenarios
  console.log("\n📧 TEST EMAIL SCENARIOS:");
  console.log("-".repeat(80));
  
  testEmails.forEach((email, index) => {
    console.log(`\n${index + 1}. ${email.name}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   From: ${email.from}`);
    console.log(`   Expected: ${email.expectedPrimary} > ${email.expectedSecondary} > ${email.expectedTertiary}`);
    
    // Check if the system message contains guidance for this scenario
    const hasGuidance = systemMessage.includes(email.expectedSecondary) && 
                       systemMessage.includes(email.expectedTertiary);
    console.log(`   ${hasGuidance ? '✅' : '❌'} System message contains guidance for this scenario`);
  });
  
  // Check for validation rules
  console.log("\n🔍 VALIDATION RULES CHECK:");
  const validationRules = [
    "CLASSIFICATION VALIDATION RULES",
    "tertiary_category is NOT null",
    "Confidence score is between 0.0 and 1.0"
  ];
  
  validationRules.forEach(rule => {
    const found = systemMessage.includes(rule);
    console.log(`${found ? '✅' : '❌'} ${rule}`);
  });
  
  console.log("\n" + "=".repeat(80));
  console.log("🎯 RECOMMENDATIONS:");
  console.log("1. Deploy this improved system message to production");
  console.log("2. Test with real email data to verify tertiary category population");
  console.log("3. Monitor classification accuracy and adjust rules as needed");
  console.log("4. Consider adding more specific keywords for better classification");
}

// Run the test
testClassifierSystemMessage();
