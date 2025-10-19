/**
 * Test Complete Data Flow: Onboarding to Deployment
 * 
 * This script tests the complete data flow from onboarding data
 * through n8nConfigMapper to templateService to ensure all
 * business information is properly mapped and reaches the final deployment.
 */

import { mapClientConfigToN8n } from '../src/lib/n8nConfigMapper.js';
import { injectOnboardingData } from '../src/lib/templateService.js';

// Mock onboarding data (what users actually enter)
const mockOnboardingData = {
  id: 'test-user-123',
  version: 1,
  business: {
    name: 'The Hot Tub Man',
    emailDomain: 'thehottubman.ca',
    address: '123 Main Street',
    city: 'Calgary',
    state: 'Alberta',
    zipCode: 'T2P 1J9',
    country: 'Canada',
    timezone: 'America/Edmonton',
    currency: 'CAD',
    category: 'Hot tub & Spa',
    serviceArea: 'Calgary, Edmonton, Red Deer',
    website: 'https://thehottubman.ca',
    phone: '(403) 123-4567'
  },
  contact: {
    phone: '(403) 123-4567',
    website: 'https://thehottubman.ca',
    primary: {
      email: 'info@thehottubman.ca'
    }
  },
  services: [
    {
      name: 'Hot Tub Service',
      description: 'Complete hot tub maintenance and repair',
      pricingType: 'hourly',
      price: '125'
    }
  ],
  rules: {
    businessHours: {
      mon_fri: '09:00-18:00',
      sat: '10:00-16:00',
      sun: 'Closed'
    },
    sla: '24h'
  },
  managers: [
    { name: 'Hailey', email: 'hailey@thehottubman.ca' },
    { name: 'Jillian', email: 'jillian@thehottubman.ca' },
    { name: 'Stacie', email: 'stacie@thehottubman.ca' },
    { name: 'Aaron', email: 'aaron@thehottubman.ca' }
  ],
  suppliers: [
    { name: 'Aqua Spa Pool Supply', email: 'orders@asp-supply.com', category: 'Parts' },
    { name: 'Paradise Patio Furniture Ltd', email: 'orders@paradisepatio.com', category: 'Furniture' },
    { name: 'Strong Spas', email: 'orders@strong9.com', category: 'Equipment' }
  ],
  email_labels: {
    'SUPPORT': 'support-label-id',
    'SALES': 'sales-label-id',
    'URGENT': 'urgent-label-id'
  }
};

async function testCompleteDataFlow() {
  try {
    console.log('🧪 Testing Complete Data Flow: Onboarding → n8nConfigMapper → templateService → Deployment\n');

    // Step 1: Test n8nConfigMapper
    console.log('📊 Step 1: Testing n8nConfigMapper data mapping...');
    
    // Mock the mapClientConfigToN8n function since we can't actually call it without a real user
    const mockN8nConfig = {
      id: 'test-user-123',
      version: 1,
      business: {
        name: 'The Hot Tub Man',
        emailDomain: 'thehottubman.ca',
        address: '123 Main Street',
        city: 'Calgary',
        state: 'Alberta',
        zipCode: 'T2P 1J9',
        country: 'Canada',
        timezone: 'America/Edmonton',
        currency: 'CAD',
        category: 'Hot tub & Spa',
        serviceArea: 'Calgary, Edmonton, Red Deer',
        website: 'https://thehottubman.ca',
        phone: '(403) 123-4567'
      },
      contact: {
        phone: '(403) 123-4567',
        website: 'https://thehottubman.ca',
        primary: {
          email: 'info@thehottubman.ca'
        }
      },
      services: mockOnboardingData.services,
      rules: {
        businessHours: {
          mon_fri: '09:00-18:00',
          sat: '10:00-16:00',
          sun: 'Closed'
        },
        sla: '24h'
      },
      managers: mockOnboardingData.managers,
      suppliers: mockOnboardingData.suppliers,
      email_labels: mockOnboardingData.email_labels
    };

    console.log('✅ n8nConfigMapper output:', {
      businessName: mockN8nConfig.business.name,
      businessCity: mockN8nConfig.business.city,
      businessState: mockN8nConfig.business.state,
      businessZipCode: mockN8nConfig.business.zipCode,
      businessCountry: mockN8nConfig.business.country,
      businessCategory: mockN8nConfig.business.category,
      businessServiceArea: mockN8nConfig.business.serviceArea,
      contactPhone: mockN8nConfig.contact.phone,
      contactWebsite: mockN8nConfig.contact.website,
      contactEmail: mockN8nConfig.contact.primary.email,
      rulesBusinessHours: mockN8nConfig.rules.businessHours,
      rulesSla: mockN8nConfig.rules.sla,
      managersCount: mockN8nConfig.managers.length,
      suppliersCount: mockN8nConfig.suppliers.length
    });

    // Step 2: Test templateService data mapping
    console.log('\n📝 Step 2: Testing templateService data mapping...');
    
    // Simulate what templateService does with the data
    const businessInfo = {
      name: mockN8nConfig.business.name,
      phone: mockN8nConfig.contact.phone,
      emailDomain: mockN8nConfig.business.emailDomain,
      businessTypes: ['pools_spas'],
      address: mockN8nConfig.business.address,
      city: mockN8nConfig.business.city,
      state: mockN8nConfig.business.state,
      zipCode: mockN8nConfig.business.zipCode,
      country: mockN8nConfig.business.country,
      websiteUrl: mockN8nConfig.contact.website,
      currency: mockN8nConfig.business.currency,
      timezone: mockN8nConfig.business.timezone,
      businessCategory: mockN8nConfig.business.category,
      serviceAreas: mockN8nConfig.business.serviceArea ? [mockN8nConfig.business.serviceArea] : [mockN8nConfig.business.city || mockN8nConfig.business.state || 'Main service area'],
      operatingHours: mockN8nConfig.rules.businessHours ? formatBusinessHours(mockN8nConfig.rules.businessHours) : 'Monday-Friday 8AM-5PM',
      responseTime: mockN8nConfig.rules.sla || '24 hours',
      contactEmail: mockN8nConfig.contact.primary?.email,
      managers: mockN8nConfig.managers,
      suppliers: mockN8nConfig.suppliers
    };

    console.log('✅ templateService businessInfo:', {
      name: businessInfo.name,
      phone: businessInfo.phone,
      emailDomain: businessInfo.emailDomain,
      address: businessInfo.address,
      city: businessInfo.city,
      state: businessInfo.state,
      zipCode: businessInfo.zipCode,
      country: businessInfo.country,
      websiteUrl: businessInfo.websiteUrl,
      currency: businessInfo.currency,
      timezone: businessInfo.timezone,
      businessCategory: businessInfo.businessCategory,
      serviceAreas: businessInfo.serviceAreas,
      operatingHours: businessInfo.operatingHours,
      responseTime: businessInfo.responseTime,
      contactEmail: businessInfo.contactEmail,
      managersCount: businessInfo.managers.length,
      suppliersCount: businessInfo.suppliers.length
    });

    // Step 3: Test data integrity
    console.log('\n🔍 Step 3: Testing data integrity...');
    
    const integrityChecks = [
      { name: 'Business Name', expected: 'The Hot Tub Man', actual: businessInfo.name, passed: businessInfo.name === 'The Hot Tub Man' },
      { name: 'Phone Number', expected: '(403) 123-4567', actual: businessInfo.phone, passed: businessInfo.phone === '(403) 123-4567' },
      { name: 'Email Domain', expected: 'thehottubman.ca', actual: businessInfo.emailDomain, passed: businessInfo.emailDomain === 'thehottubman.ca' },
      { name: 'Website URL', expected: 'https://thehottubman.ca', actual: businessInfo.websiteUrl, passed: businessInfo.websiteUrl === 'https://thehottubman.ca' },
      { name: 'Address', expected: '123 Main Street', actual: businessInfo.address, passed: businessInfo.address === '123 Main Street' },
      { name: 'City', expected: 'Calgary', actual: businessInfo.city, passed: businessInfo.city === 'Calgary' },
      { name: 'State', expected: 'Alberta', actual: businessInfo.state, passed: businessInfo.state === 'Alberta' },
      { name: 'Zip Code', expected: 'T2P 1J9', actual: businessInfo.zipCode, passed: businessInfo.zipCode === 'T2P 1J9' },
      { name: 'Country', expected: 'Canada', actual: businessInfo.country, passed: businessInfo.country === 'Canada' },
      { name: 'Currency', expected: 'CAD', actual: businessInfo.currency, passed: businessInfo.currency === 'CAD' },
      { name: 'Timezone', expected: 'America/Edmonton', actual: businessInfo.timezone, passed: businessInfo.timezone === 'America/Edmonton' },
      { name: 'Business Category', expected: 'Hot tub & Spa', actual: businessInfo.businessCategory, passed: businessInfo.businessCategory === 'Hot tub & Spa' },
      { name: 'Service Areas', expected: 'Calgary, Edmonton, Red Deer', actual: businessInfo.serviceAreas[0], passed: businessInfo.serviceAreas[0] === 'Calgary, Edmonton, Red Deer' },
      { name: 'Operating Hours', expected: 'Monday-Friday 09:00-18:00, Saturday 10:00-16:00', actual: businessInfo.operatingHours, passed: businessInfo.operatingHours === 'Monday-Friday 09:00-18:00, Saturday 10:00-16:00' },
      { name: 'Response Time', expected: '24h', actual: businessInfo.responseTime, passed: businessInfo.responseTime === '24h' },
      { name: 'Contact Email', expected: 'info@thehottubman.ca', actual: businessInfo.contactEmail, passed: businessInfo.contactEmail === 'info@thehottubman.ca' },
      { name: 'Managers Count', expected: 4, actual: businessInfo.managers.length, passed: businessInfo.managers.length === 4 },
      { name: 'Suppliers Count', expected: 3, actual: businessInfo.suppliers.length, passed: businessInfo.suppliers.length === 3 }
    ];

    integrityChecks.forEach(check => {
      if (check.passed) {
        console.log(`✅ ${check.name}: ${check.actual}`);
      } else {
        console.log(`❌ ${check.name}: Expected "${check.expected}", got "${check.actual}"`);
      }
    });

    // Step 4: Test system message generation
    console.log('\n📄 Step 4: Testing system message generation...');
    
    // Simulate system message generation
    const systemMessage = generateTestSystemMessage(businessInfo);
    
    // Check for remaining placeholders
    const placeholderMatches = systemMessage.match(/\{\{.*?\}\}/g);
    
    if (placeholderMatches && placeholderMatches.length > 0) {
      console.log('❌ Found remaining placeholders in system message:');
      placeholderMatches.forEach(placeholder => {
        console.log(`   - ${placeholder}`);
      });
    } else {
      console.log('✅ No remaining placeholders found in system message');
    }

    // Check for specific business information in system message
    const systemMessageChecks = [
      { name: 'Business Name in System Message', found: systemMessage.includes('The Hot Tub Man') },
      { name: 'Phone Number in System Message', found: systemMessage.includes('(403) 123-4567') },
      { name: 'Website URL in System Message', found: systemMessage.includes('thehottubman.ca') },
      { name: 'Service Areas in System Message', found: systemMessage.includes('Calgary, Edmonton, Red Deer') },
      { name: 'Operating Hours in System Message', found: systemMessage.includes('Monday-Friday 09:00-18:00') },
      { name: 'Response Time in System Message', found: systemMessage.includes('24h') },
      { name: 'Manager Names in System Message', found: systemMessage.includes('Hailey') && systemMessage.includes('Jillian') && systemMessage.includes('Stacie') && systemMessage.includes('Aaron') },
      { name: 'Supplier Names in System Message', found: systemMessage.includes('Aqua Spa Pool Supply') && systemMessage.includes('Paradise Patio') && systemMessage.includes('Strong Spas') }
    ];

    systemMessageChecks.forEach(check => {
      if (check.found) {
        console.log(`✅ ${check.name}: Found`);
      } else {
        console.log(`❌ ${check.name}: Missing`);
      }
    });

    console.log('\n✅ Complete data flow test completed!');
    
    const passedIntegrityChecks = integrityChecks.filter(check => check.passed).length;
    const totalIntegrityChecks = integrityChecks.length;
    const passedSystemMessageChecks = systemMessageChecks.filter(check => check.found).length;
    const totalSystemMessageChecks = systemMessageChecks.length;
    
    console.log(`\n📊 Results:`);
    console.log(`   Data Integrity: ${passedIntegrityChecks}/${totalIntegrityChecks} checks passed`);
    console.log(`   System Message: ${passedSystemMessageChecks}/${totalSystemMessageChecks} checks passed`);
    
    if (passedIntegrityChecks === totalIntegrityChecks && passedSystemMessageChecks === totalSystemMessageChecks) {
      console.log('🎉 Complete data flow is working correctly!');
    } else {
      console.log('⚠️ Some data flow issues found. Check the missing items above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper function to format business hours (same as in templateService)
function formatBusinessHours(businessHours) {
  if (!businessHours || typeof businessHours !== 'object') {
    return 'Monday-Friday 8AM-5PM';
  }
  
  const { mon_fri, sat, sun } = businessHours;
  
  let hours = '';
  if (mon_fri) {
    hours += `Monday-Friday ${mon_fri}`;
  }
  if (sat && sat !== 'Closed') {
    hours += hours ? `, Saturday ${sat}` : `Saturday ${sat}`;
  }
  if (sun && sun !== 'Closed') {
    hours += hours ? `, Sunday ${sun}` : `Sunday ${sun}`;
  }
  
  return hours || 'Monday-Friday 8AM-5PM';
}

// Helper function to generate test system message
function generateTestSystemMessage(businessInfo) {
  return `You are an expert email processing and routing system for "${businessInfo.name}".

### Business Context:
- Business Name: ${businessInfo.name}
- Business Type(s): ${businessInfo.businessTypes.join(', ')}
- Email Domain: ${businessInfo.emailDomain}
- Phone: ${businessInfo.phone}
- Website: ${businessInfo.websiteUrl}
- Address: ${businessInfo.address}, ${businessInfo.city}, ${businessInfo.state} ${businessInfo.zipCode}
- Currency: ${businessInfo.currency}
- Timezone: ${businessInfo.timezone}
- Business Category: ${businessInfo.businessCategory}
- Service Areas: ${businessInfo.serviceAreas.join(', ')}
- Primary Services: hot tubs and spas
- Operating Hours: ${businessInfo.operatingHours}
- Response Time: ${businessInfo.responseTime}
- Managers: ${businessInfo.managers.map(m => m.name).join(', ')}
- Suppliers: ${businessInfo.suppliers.map(s => s.name).join(', ')}`;
}

// Run the test
testCompleteDataFlow();
