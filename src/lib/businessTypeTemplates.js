/**
 * Business Type Templates
 * 
 * Comprehensive templates for each business type with:
 * - Inquiry types and classification
 * - Response protocols
 * - Pricing structures
 * - Special rules and guidelines
 * - Upsell opportunities
 * 
 * @module businessTypeTemplates
 */

export const businessTypeTemplates = {
  /**
   * HOT TUB & SPA TEMPLATE
   * Based on actual Hot Tub Man business
   */
  'Hot tub & Spa': {
    inquiryTypes: [
      {
        name: 'Service Job Inquiry',
        description: 'Repairs, site inspections, troubleshooting, warranty work',
        keywords: ['repair', 'broken', 'not working', 'error code', 'leaking', 'pump', 'heater', 'inspection'],
        examples: ['Hot tub not heating', 'Pump making noise', 'Error code FL1'],
        pricing: 'Site inspection: $105, Labor: $125/hr, Mileage: $1.50/km outside Red Deer/Leduc'
      },
      {
        name: 'New Spa Inquiry',
        description: 'Shopping for a new hot tub or spa',
        keywords: ['new hot tub', 'buying', 'purchasing', 'models', 'prices', 'delivery'],
        examples: ['Looking for 6-person hot tub', 'What models do you have?'],
        pricing: 'Schedule consultation call - do NOT send full price lists by email'
      },
      {
        name: 'Chemicals & Parts Inquiry',
        description: 'Ordering supplies, replacement parts, filters, chemicals',
        keywords: ['chemicals', 'filter', 'parts', 'chlorine', 'test strips', 'cover'],
        examples: ['Need a new filter', 'How much are test strips?'],
        pricing: 'Harmony treatment: $39/kg, Filter prices vary by model'
      },
      {
        name: 'Technical Help / Troubleshooting',
        description: 'Advice on error codes, leaks, water chemistry, maintenance',
        keywords: ['how to', 'help with', 'advice', 'water chemistry', 'cloudy water', 'error'],
        examples: ['How do I balance pH?', 'What does error code mean?'],
        pricing: 'Free advice, may lead to service call if needed'
      }
    ],

    protocols: [
      {
        name: 'Service Call Booking',
        instructions: 'Search Gmail for previous conversations. If existing customer, use known details. Only request missing information. Include booking link.',
        pricing: 'Site inspection: $105, Labor: $125/hr',
        responseTime: 'Within 24 hours',
        requiredInfo: ['Full name', 'Address with city', 'Spa brand and year', 'Problem description', 'Error codes if any'],
        nextSteps: 'Please fill out our short form: https://www.thehottubman.ca/repairs'
      },
      {
        name: 'New Spa Sales',
        instructions: 'Offer to schedule a call or visit. Do NOT send full spec sheets or price lists by email.',
        responseTime: 'Within 4 hours',
        requiredInfo: ['Space requirements', 'Number of people', 'Budget range', 'Timeline'],
        nextSteps: 'Browse spas: https://www.thehottubman.ca/hot-tub-spas or schedule call'
      },
      {
        name: 'Parts & Chemicals',
        instructions: 'Direct to online store. Offer to have tech bring items if service call is booked.',
        pricing: 'Varies by product',
        responseTime: 'Within 24 hours',
        nextSteps: 'Order online: https://www.thehottubman.ca or https://www.thehottubman.ca/treatment-packages'
      },
      {
        name: 'Emergency Repairs',
        instructions: 'If customer mentions leak, no power, or urgent issue, prioritize immediate response.',
        pricing: 'Site inspection: $105 + labor $125/hr',
        responseTime: 'Within 2 hours',
        requiredInfo: ['Address', 'Nature of emergency', 'Safety concerns'],
        nextSteps: 'Immediate booking: https://www.thehottubman.ca/repairs'
      }
    ],

    specialRules: [
      'Always ask if customer needs filters, chemicals, or test strips when booking service',
      'For mailed items (cheques, parts): confirm send date, provide clear delivery timeline, offer backup plan',
      'If customer has followed up multiple times, acknowledge delay and provide specific resolution',
      'When confirming appointments, restate time, technician prep needs, and service scope',
      'Recognize payment follow-ups: offer all 3 payment methods (link, e-transfer, phone)',
      'For attachment inquiries: always acknowledge receipt and reference how it helps'
    ],

    upsellPrompts: [
      'If you need any filters, chemicals, or test strips, let us know—we can have the tech bring those out with them!',
      'Would you like us to include any Harmony treatment packs with your service?',
      'We can also bring test strips or any other supplies you might need'
    ]
  },

  /**
   * ELECTRICIAN TEMPLATE
   */
  'Electrician': {
    inquiryTypes: [
      {
        name: 'Emergency Electrical',
        description: 'No power, sparking, breaker trips, burning smell, electrical hazards',
        keywords: ['emergency', 'no power', 'sparking', 'smoke', 'burning smell', 'breaker', 'shock'],
        examples: ['No power in house', 'Breaker keeps tripping', 'Outlet sparking'],
        pricing: 'Emergency fee: $150, Labor: $125/hr'
      },
      {
        name: 'Scheduled Service',
        description: 'Panel upgrades, outlet installation, wiring, lighting, inspections',
        keywords: ['panel upgrade', 'outlet', 'wiring', 'lighting', 'install', 'inspection'],
        examples: ['Need panel upgrade', 'Install new outlets', 'Light fixture installation'],
        pricing: 'Labor: $125/hr + materials'
      },
      {
        name: 'Safety Inspection',
        description: 'Code compliance, home sale inspections, electrical audits',
        keywords: ['inspection', 'code', 'compliance', 'safety', 'audit', 'home sale'],
        examples: ['Need inspection for home sale', 'Code compliance check'],
        pricing: '$150 flat rate for residential inspection'
      },
      {
        name: 'Quote Request',
        description: 'New construction, renovations, major electrical work',
        keywords: ['quote', 'estimate', 'new build', 'renovation', 'rewire'],
        examples: ['Quote for new construction', 'Estimate for full rewire'],
        pricing: 'Custom quote based on scope'
      }
    ],

    protocols: [
      {
        name: 'Emergency Response',
        instructions: 'SAFETY FIRST: If sparking, smoke, or burning smell, instruct customer to turn off main breaker immediately. Respond within 2 hours.',
        pricing: '$150 emergency fee + $125/hr labor',
        responseTime: 'Within 2 hours',
        requiredInfo: ['Address', 'Nature of emergency', 'Breaker status', 'Safety concerns'],
        nextSteps: 'Emergency booking form or direct phone call'
      },
      {
        name: 'Scheduled Work',
        instructions: 'Request panel photos if applicable. Confirm amperage needs. Schedule during business hours.',
        pricing: '$125/hr + materials',
        responseTime: 'Within 24 hours',
        requiredInfo: ['Scope of work', 'Timeline', 'Panel photos if upgrade'],
        nextSteps: 'Schedule appointment via booking system'
      }
    ],

    specialRules: [
      'ALWAYS prioritize safety - instruct customers to turn off power if dangerous',
      'For breaker issues: advise against repeatedly resetting (can damage circuit board)',
      'Panel upgrades: request current panel photos and electrical needs',
      'Code compliance: mention inspection takes 3-5 business days',
      'Emergency calls get priority within 2 hours'
    ],

    upsellPrompts: [
      'While we\'re there, would you like us to check your panel for any other issues?',
      'We can also install GFCI outlets in your bathrooms and kitchen if needed',
      'Consider upgrading to LED lighting while we\'re doing the electrical work'
    ]
  },

  /**
   * HVAC TEMPLATE
   */
  'HVAC': {
    inquiryTypes: [
      {
        name: 'Emergency Heating/Cooling',
        description: 'No heat, no AC, system not working, urgent comfort issues',
        keywords: ['no heat', 'no cooling', 'not working', 'broken', 'emergency', 'urgent', 'cold', 'hot'],
        examples: ['Furnace not working', 'AC died in heatwave', 'No heat in winter'],
        pricing: 'Emergency service: $175, Labor: $135/hr'
      },
      {
        name: 'Maintenance Service',
        description: 'Seasonal tune-ups, filter changes, duct cleaning, routine maintenance',
        keywords: ['maintenance', 'tune-up', 'service', 'check', 'filter', 'cleaning'],
        examples: ['Annual furnace service', 'AC tune-up', 'Duct cleaning'],
        pricing: 'Maintenance: $150, Tune-up: $125'
      },
      {
        name: 'New Installation',
        description: 'New furnace, AC unit, heat pump installation',
        keywords: ['new', 'install', 'replacement', 'upgrade', 'system'],
        examples: ['Need new furnace', 'AC replacement', 'Heat pump install'],
        pricing: 'Custom quote based on system and home size'
      },
      {
        name: 'Indoor Air Quality',
        description: 'Air purifiers, humidifiers, ventilation, air quality concerns',
        keywords: ['air quality', 'purifier', 'humidifier', 'ventilation', 'allergies'],
        examples: ['Improve air quality', 'Add humidifier', 'Air purification'],
        pricing: 'Varies by solution'
      }
    ],

    protocols: [
      {
        name: 'Emergency HVAC',
        instructions: 'Priority response for no heat/cooling. Check if system is still under warranty. Respond within 2-4 hours.',
        pricing: '$175 emergency fee + $135/hr',
        responseTime: 'Within 2-4 hours',
        requiredInfo: ['System age', 'Brand/model', 'Problem description', 'Error codes'],
        nextSteps: 'Emergency booking or phone call'
      },
      {
        name: 'Seasonal Maintenance',
        instructions: 'Promote seasonal tune-ups. Spring for AC, Fall for heating. Mention filter replacement schedule.',
        pricing: '$150 maintenance visit',
        responseTime: 'Within 24-48 hours',
        requiredInfo: ['System type', 'Last service date', 'Preferred timing'],
        nextSteps: 'Schedule seasonal service'
      }
    ],

    specialRules: [
      'Winter emergencies (no heat) get highest priority',
      'Always ask about system age and warranty status',
      'Promote seasonal maintenance twice per year',
      'Filter changes recommended every 3 months',
      'Mention energy efficiency benefits for upgrades'
    ],

    upsellPrompts: [
      'Would you like us to check your filter and replace it if needed?',
      'We can also inspect your ductwork while we\'re there',
      'Consider a maintenance plan for priority service and discounts'
    ]
  },

  /**
   * PLUMBER TEMPLATE
   */
  'Plumber': {
    inquiryTypes: [
      {
        name: 'Emergency Plumbing',
        description: 'Water leaks, burst pipes, flooding, no water, sewage backup',
        keywords: ['leak', 'burst', 'flooding', 'water damage', 'no water', 'backup', 'sewage', 'emergency'],
        examples: ['Pipe burst', 'Major leak', 'Toilet overflowing', 'No water'],
        pricing: 'Emergency fee: $175, Labor: $135/hr'
      },
      {
        name: 'Drain Cleaning',
        description: 'Clogged drains, slow drainage, main line cleaning',
        keywords: ['clogged', 'drain', 'slow', 'backup', 'cleaning', 'snake'],
        examples: ['Kitchen sink clogged', 'Shower draining slow', 'Main line backup'],
        pricing: 'Drain cleaning: $150-$300 depending on severity'
      },
      {
        name: 'Water Heater',
        description: 'Water heater repair, replacement, no hot water',
        keywords: ['water heater', 'hot water', 'tank', 'tankless', 'no hot water'],
        examples: ['No hot water', 'Water heater leaking', 'Replace water heater'],
        pricing: 'Repair: $135/hr, Replacement: $1,500-$3,000'
      },
      {
        name: 'Fixture Installation',
        description: 'Faucets, toilets, sinks, dishwasher installation',
        keywords: ['install', 'faucet', 'toilet', 'sink', 'fixture', 'dishwasher'],
        examples: ['Install new faucet', 'Replace toilet', 'Dishwasher hookup'],
        pricing: '$135/hr + fixtures'
      }
    ],

    protocols: [
      {
        name: 'Emergency Response',
        instructions: 'CRITICAL: If active leak/flooding, instruct to shut off main water valve. Respond immediately.',
        pricing: '$175 emergency + $135/hr',
        responseTime: 'Within 1-2 hours',
        requiredInfo: ['Location of leak/problem', 'Water shut-off status', 'Extent of damage'],
        nextSteps: 'Emergency dispatch or phone call'
      },
      {
        name: 'Scheduled Plumbing',
        instructions: 'Book during business hours. Confirm fixture details if installation. Mention warranty on work.',
        pricing: '$135/hr + materials',
        responseTime: 'Within 24 hours',
        requiredInfo: ['Problem description', 'Fixture models if applicable', 'Timeline'],
        nextSteps: 'Schedule via booking system'
      }
    ],

    specialRules: [
      'Active leaks/flooding = highest priority',
      'Always ask if customer knows location of main water shut-off',
      'For water heaters: ask age, capacity needs, gas vs electric',
      'Mention camera inspection for recurring drain issues',
      'Warranty on all labor and parts'
    ],

    upsellPrompts: [
      'While we\'re there, would you like us to check your other drains?',
      'We can also inspect your water heater if it\'s due for service',
      'Consider a whole-home leak detection system'
    ]
  },

  /**
   * ROOFING TEMPLATE
   */
  'Roofing': {
    inquiryTypes: [
      {
        name: 'Emergency Roof Repair',
        description: 'Active leaks, storm damage, urgent repairs',
        keywords: ['leak', 'emergency', 'storm', 'damage', 'water coming in', 'urgent'],
        examples: ['Roof leaking', 'Storm damage', 'Water coming through ceiling'],
        pricing: 'Emergency service: $200, Repair pricing varies'
      },
      {
        name: 'Roof Replacement',
        description: 'Full roof replacement, re-roofing',
        keywords: ['replacement', 'new roof', 're-roof', 'install'],
        examples: ['Need new roof', 'Replace old shingles', 'Full roof replacement'],
        pricing: 'Custom quote based on size and materials'
      },
      {
        name: 'Roof Inspection',
        description: 'Annual inspection, home sale inspection, insurance inspection',
        keywords: ['inspection', 'check', 'assessment', 'home sale', 'insurance'],
        examples: ['Roof inspection', 'Home sale requirement', 'Insurance inspection'],
        pricing: '$150-$200 depending on size'
      },
      {
        name: 'Maintenance & Repairs',
        description: 'Shingle replacement, flashing repair, gutter work',
        keywords: ['repair', 'maintenance', 'shingles', 'flashing', 'gutters'],
        examples: ['Fix loose shingles', 'Repair flashing', 'Gutter cleaning'],
        pricing: '$150/hr + materials'
      }
    ],

    protocols: [
      {
        name: 'Emergency Leak',
        instructions: 'Active leaks get same-day service. Ask about interior damage. Recommend temporary tarping if needed.',
        pricing: '$200 emergency + repair costs',
        responseTime: 'Same day',
        requiredInfo: ['Leak location', 'Interior damage', 'Roof age', 'Photos if possible'],
        nextSteps: 'Emergency dispatch'
      },
      {
        name: 'Roof Replacement Quote',
        instructions: 'Schedule on-site inspection. Measure roof size. Discuss material options (asphalt, metal, etc.).',
        pricing: 'Varies by size and materials',
        responseTime: 'Within 2-3 days',
        requiredInfo: ['Roof size', 'Current material', 'Age', 'Insurance claim?'],
        nextSteps: 'Schedule inspection for detailed quote'
      }
    ],

    specialRules: [
      'Active leaks = emergency response',
      'Always ask about insurance claims for storm damage',
      'Recommend annual inspections',
      'Warranty varies by material: 15-50 years',
      'Spring and fall are peak seasons - book early'
    ],

    upsellPrompts: [
      'We can also inspect and clean your gutters while we\'re up there',
      'Consider upgrading to architectural shingles for better protection',
      'Would you like us to check your attic ventilation?'
    ]
  },

  /**
   * POOLS & SPAS TEMPLATE
   */
  'Pools': {
    inquiryTypes: [
      {
        name: 'Pool Service & Maintenance',
        description: 'Weekly cleaning, chemical balancing, equipment maintenance',
        keywords: ['service', 'maintenance', 'cleaning', 'chemicals', 'weekly'],
        examples: ['Weekly pool service', 'Chemical balancing', 'Equipment check'],
        pricing: '$100-$150 per visit'
      },
      {
        name: 'Equipment Repair',
        description: 'Pump, filter, heater repairs',
        keywords: ['repair', 'pump', 'filter', 'heater', 'broken', 'not working'],
        examples: ['Pump not working', 'Filter leaking', 'Heater won\'t turn on'],
        pricing: '$125/hr + parts'
      },
      {
        name: 'Pool Opening/Closing',
        description: 'Seasonal opening and winterization',
        keywords: ['opening', 'closing', 'winterize', 'seasonal'],
        examples: ['Open pool for summer', 'Winterize pool', 'Seasonal service'],
        pricing: 'Opening: $200, Closing: $150'
      },
      {
        name: 'New Pool Installation',
        description: 'New pool construction, liner replacement',
        keywords: ['new pool', 'install', 'construction', 'liner'],
        examples: ['Build new pool', 'Install above-ground pool', 'Replace liner'],
        pricing: 'Custom quote based on size and type'
      }
    ],

    protocols: [
      {
        name: 'Emergency Leak',
        instructions: 'If pool is losing water rapidly, prioritize response. Check for equipment leaks vs structural.',
        pricing: '$150 diagnostic + repair',
        responseTime: 'Within 24 hours',
        requiredInfo: ['Pool type', 'Rate of water loss', 'Equipment age'],
        nextSteps: 'Emergency service call'
      },
      {
        name: 'Seasonal Service',
        instructions: 'Spring opening (April-May), Fall closing (September-October). Book early!',
        pricing: 'Opening: $200, Closing: $150',
        responseTime: '1-2 weeks',
        requiredInfo: ['Pool size', 'Type', 'Preferred date'],
        nextSteps: 'Schedule seasonal service'
      }
    ],

    specialRules: [
      'Promote seasonal services in spring and fall',
      'Chemical balance is critical for equipment longevity',
      'Recommend weekly service during swim season',
      'Leak detection: 1+ inch per week is problem',
      'Winterization prevents costly freeze damage'
    ],

    upsellPrompts: [
      'Would you like to add weekly chemical service?',
      'We can also clean your filter cartridge while we\'re there',
      'Consider a pool heater for extended season use'
    ]
  },

  /**
   * GENERAL / FALLBACK TEMPLATE
   */
  'General': {
    inquiryTypes: [
      {
        name: 'Service Request',
        description: 'General service inquiries',
        keywords: ['service', 'help', 'need', 'repair', 'fix'],
        examples: ['Need service', 'Can you help?', 'Looking for estimate']
      },
      {
        name: 'Quote Request',
        description: 'Pricing and estimates',
        keywords: ['quote', 'estimate', 'price', 'cost', 'how much'],
        examples: ['How much does it cost?', 'Need a quote', 'Pricing information']
      },
      {
        name: 'General Inquiry',
        description: 'Questions about services',
        keywords: ['question', 'info', 'information', 'about'],
        examples: ['Do you offer...?', 'What services...?', 'Tell me about...']
      }
    ],

    protocols: [
      {
        name: 'Standard Response',
        instructions: 'Acknowledge request, provide relevant information, offer clear next step',
        responseTime: 'Within 24 hours',
        nextSteps: 'Contact us to schedule or discuss further'
      }
    ],

    specialRules: [
      'Be professional and helpful',
      'Provide clear next steps',
      'Match customer tone and urgency'
    ],

    upsellPrompts: []
  }
};

/**
 * Get template for business type
 * @param {string} businessType - Business type name
 * @returns {Object} - Business type template
 */
export function getBusinessTypeTemplate(businessType) {
  return businessTypeTemplates[businessType] || businessTypeTemplates['General'];
}

export default businessTypeTemplates;


