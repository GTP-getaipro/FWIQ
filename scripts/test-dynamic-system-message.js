/**
 * Test Dynamic System Message Generation
 * 
 * This script tests the dynamic system message generation to ensure
 * all business information is properly injected and placeholders are replaced.
 */

import { extractBehaviorConfigForN8n } from '../src/lib/behaviorSchemaInjector.js';
import { GoldStandardReplyPrompt } from '../src/lib/goldStandardReplyPrompt.js';

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
  responseTime: '24 hours',
  managers: [
    { name: 'Hailey', email: 'hailey@thehottubman.ca' },
    { name: 'Jillian', email: 'jillian@thehottubman.ca' }
  ],
  suppliers: [
    { name: 'Aqua Spa Pool Supply', email: 'orders@asp-supply.com' }
  ]
};

// Mock voice profile
const mockVoiceProfile = {
  learning_count: 5,
  style_profile: {
    voice: {
      empathyLevel: 0.3,
      formalityLevel: 0.85,
      directnessLevel: 0.6,
      confidence: 0.85
    },
    signaturePhrases: [
      { phrase: "Thanks so much for supporting our small business!", confidence: 0.9, context: "closing" },
      { phrase: "We'll see you then!", confidence: 0.8, context: "appointment confirmation" }
    ],
    fewShotExamples: {
      'service_confirmation': [
        'Thanks for confirming the appointment details. We\'ll see you Thursday at 2 PM for the hot tub service.',
        'Perfect! Adam will be there Thursday at 2 PM to take care of your spa maintenance.'
      ],
      'pricing_inquiry': [
        'Thanks for your interest in our hot tub services. I\'ll have Hailey send you a detailed quote by end of day.',
        'I\'ll get you pricing for the new hot tub installation. You should hear back from us within 24 hours.'
      ]
    }
  }
};

async function testDynamicSystemMessage() {
  try {
    console.log('🧪 Testing Dynamic System Message Generation...\n');

    // Step 1: Extract behavior config
    console.log('📊 Step 1: Extracting behavior configuration...');
    const behaviorConfig = extractBehaviorConfigForN8n(
      testBusinessInfo.businessTypes,
      testBusinessInfo,
      mockVoiceProfile
    );

    console.log('✅ Behavior config extracted:', {
      voiceTone: behaviorConfig.voiceTone,
      formalityLevel: behaviorConfig.formalityLevel,
      allowPricing: behaviorConfig.allowPricing,
      hasReplyPrompt: !!behaviorConfig.replyPrompt
    });

    // Step 2: Generate system message using GoldStandardReplyPrompt
    console.log('\n📝 Step 2: Generating system message...');
    const goldStandardPrompt = new GoldStandardReplyPrompt();
    
    // Build prompt data (this is what the system does internally)
    const promptData = {
      businessName: testBusinessInfo.name,
      businessPhone: testBusinessInfo.phone,
      websiteUrl: testBusinessInfo.websiteUrl,
      businessType: testBusinessInfo.businessTypes.join(', '),
      primaryProductService: 'hot tubs and spas',
      primaryProductCategory: 'spas',
      operatingHours: testBusinessInfo.operatingHours,
      responseTime: testBusinessInfo.responseTime,
      inquiryTypes: [
        'Service Job Inquiry (repairs / site inspections)',
        'New Spa Inquiry (shopping for a new hot tub)',
        'Chemicals & Parts Inquiry (supplies or replacement parts)',
        'Technical Help / Troubleshooting (advice on error codes, leaks, water chemistry, etc.)'
      ],
      paymentOptions: `For payment, you can:
- Click the link in the estimate
- E-transfer to payments@${testBusinessInfo.emailDomain}
- Call us with your credit card at ${testBusinessInfo.phone}—whichever method is easiest for you!`,
      callToActionOptions: `- Schedule a service call → ${testBusinessInfo.websiteUrl}/repairs
- Order online → ${testBusinessInfo.websiteUrl}
- Browse products → ${testBusinessInfo.websiteUrl}/products`,
      signatureBlock: `Thanks so much for supporting our small business!
Best regards,
The ${testBusinessInfo.name} Team
${testBusinessInfo.phone}`,
      managers: testBusinessInfo.managers,
      suppliers: testBusinessInfo.suppliers,
      serviceAreas: testBusinessInfo.serviceAreas,
      techPrepTips: '(like ensuring the tub is full and accessible)',
      deliveryPrepActions: '(gate width, electrical readiness, access path)',
      partnerSupport: '(like electricians for spa electrical work)',
      technicalSpecs: 'amperage, clearance, or installation requirements',
      upsellOpportunities: '(like filters, chemicals, or accessories)',
      upsellLanguage: '"If you need any filters, chemicals, or test strips, let us know — we can have the tech bring those out with them!"',
      productDetails: 'brand, model, and approximate year',
      newClientInfoRequired: `- Full name
- Address (with city)
- Spa brand and approx. year
- Access details
- Problem description and any error codes`,
      pricingInfo: `### Place prices exactly as listed:
Site inspection: $105
Labour: $125/hr
Mileage: $1.50/km outside main service areas
Delivery fee: $5 (within city limits)`,
      additionalLinks: `## Additional context
- Current date/time: ${new Date().toISOString()} (${testBusinessInfo.timezone})
- Phone: ${testBusinessInfo.phone}
- Website ordering link: ${testBusinessInfo.websiteUrl}
- Website: ${testBusinessInfo.websiteUrl}
- Service booking: ${testBusinessInfo.websiteUrl}/repairs
- Products: ${testBusinessInfo.websiteUrl}/products
- Contact: ${testBusinessInfo.phone}`,
      timezone: testBusinessInfo.timezone,
      currentDateTime: new Date().toISOString(),
      exampleReplies: `\nSERVICE_CONFIRMATION:\n\n"Thanks for confirming the appointment details. We'll see you Thursday at 2 PM for the hot tub service."\n\n"Perfect! Adam will be there Thursday at 2 PM to take care of your spa maintenance."\n\nPRICING_INQUIRY:\n\n"Thanks for your interest in our hot tub services. I'll have Hailey send you a detailed quote by end of day."\n\n"I'll get you pricing for the new hot tub installation. You should hear back from us within 24 hours."`
    };

    const systemMessage = goldStandardPrompt.generateReplyPrompt(promptData);

    // Step 3: Check for remaining placeholders
    console.log('\n🔍 Step 3: Checking for remaining placeholders...');
    const placeholderMatches = systemMessage.match(/\{\{.*?\}\}/g);
    
    if (placeholderMatches && placeholderMatches.length > 0) {
      console.log('❌ Found remaining placeholders:');
      placeholderMatches.forEach(placeholder => {
        console.log(`   - ${placeholder}`);
      });
    } else {
      console.log('✅ No remaining placeholders found');
    }

    // Step 4: Check for specific dynamic data
    console.log('\n📋 Step 4: Verifying dynamic data injection...');
    
    const checks = [
      { name: 'Business Name', pattern: /The Hot Tub Man/, found: systemMessage.includes('The Hot Tub Man') },
      { name: 'Phone Number', pattern: /\(403\) 123-4567/, found: systemMessage.includes('(403) 123-4567') },
      { name: 'Website URL', pattern: /thehottubman\.ca/, found: systemMessage.includes('thehottubman.ca') },
      { name: 'Service Areas', pattern: /Calgary.*Edmonton.*Red Deer/, found: systemMessage.includes('Calgary') && systemMessage.includes('Edmonton') && systemMessage.includes('Red Deer') },
      { name: 'Primary Product Service', pattern: /hot tubs and spas/, found: systemMessage.includes('hot tubs and spas') },
      { name: 'Operating Hours', pattern: /Monday-Friday 8AM-5PM/, found: systemMessage.includes('Monday-Friday 8AM-5PM') },
      { name: 'Payment Options', pattern: /payments@thehottubman\.ca/, found: systemMessage.includes('payments@thehottubman.ca') },
      { name: 'Voice Profile', pattern: /Empathy Level: 0\.3/, found: systemMessage.includes('Empathy Level: 0.3') },
      { name: 'Example Replies', pattern: /Thanks for confirming the appointment/, found: systemMessage.includes('Thanks for confirming the appointment') }
    ];

    checks.forEach(check => {
      if (check.found) {
        console.log(`✅ ${check.name}: Found`);
      } else {
        console.log(`❌ ${check.name}: Missing`);
      }
    });

    // Step 5: Show sample of generated system message
    console.log('\n📄 Step 5: Sample of generated system message (first 500 characters):');
    console.log('─'.repeat(80));
    console.log(systemMessage.substring(0, 500) + '...');
    console.log('─'.repeat(80));

    console.log('\n✅ Dynamic system message generation test completed!');
    
    const passedChecks = checks.filter(check => check.found).length;
    const totalChecks = checks.length;
    
    console.log(`\n📊 Results: ${passedChecks}/${totalChecks} checks passed`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 All dynamic data injection is working correctly!');
    } else {
      console.log('⚠️ Some dynamic data injection issues found. Check the missing items above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDynamicSystemMessage();
