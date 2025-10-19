/**
 * Migration Script: Business Type Templates to Database
 * 
 * Purpose: Migrate hardcoded business type templates from deploy-n8n Edge Function
 *          to the new business_type_templates table in Supabase
 * 
 * Usage: node scripts/migrate-business-templates.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Business type templates from deploy-n8n/index.ts (lines 54-250+)
const businessTypeTemplates = {
  'Hot tub & Spa': {
    inquiryTypes: [
      {
        name: 'Service Job Inquiry',
        description: 'Repairs, site inspections, troubleshooting, warranty work',
        keywords: 'repair, broken, not working, error code, leaking, pump, heater',
        pricing: 'Site inspection: $105, Labor: $125/hr, Mileage: $1.50/km outside Red Deer/Leduc'
      },
      {
        name: 'New Spa Inquiry',
        description: 'Shopping for a new hot tub or spa',
        keywords: 'new hot tub, buying, purchasing, models, prices',
        pricing: 'Schedule consultation - do NOT send price lists by email'
      },
      {
        name: 'Chemicals & Parts',
        description: 'Ordering supplies, filters, chemicals',
        keywords: 'chemicals, filter, parts, chlorine, test strips',
        pricing: 'Harmony treatment: $39/kg'
      },
      {
        name: 'Technical Help',
        description: 'Advice on error codes, water chemistry, maintenance',
        keywords: 'how to, help with, advice, water chemistry, error',
        pricing: 'Free advice, may lead to service call'
      }
    ],
    protocols: `**Service Call Booking:** Search Gmail for previous conversations. If existing customer, use known details. Site inspection $105, Labor $125/hr. Response within 24 hours. Link: https://www.thehottubman.ca/repairs\n\n**New Spa Sales:** Offer call/visit. NO price lists by email. Link: https://www.thehottubman.ca/hot-tub-spas\n\n**Parts & Chemicals:** Direct to online store. Link: https://www.thehottubman.ca\n\n**Emergency:** Priority response for leaks, no power. Within 2 hours.`,
    specialRules: [
      'Always ask if customer needs filters, chemicals, or test strips when booking service',
      'For mailed items: confirm send date, provide clear delivery timeline',
      'For payment follow-ups: offer all 3 methods (link, e-transfer to payments@thehottubman.ca, phone)',
      'For attachments: always acknowledge receipt'
    ],
    upsellPrompts: [
      'If you need any filters, chemicals, or test strips, let us know—we can have the tech bring those out with them!'
    ]
  },
  'Electrician': {
    inquiryTypes: [
      {
        name: 'Emergency Electrical',
        description: 'No power, sparking, breaker trips, burning smell',
        keywords: 'emergency, no power, sparking, smoke, breaker',
        pricing: 'Emergency fee: $150, Labor: $125/hr'
      },
      {
        name: 'Installation & Upgrades',
        description: 'Panel upgrades, new circuits, outlets, lighting',
        keywords: 'install, upgrade, panel, circuit, outlet, lighting',
        pricing: 'Quote required - varies by scope'
      },
      {
        name: 'Troubleshooting',
        description: 'Diagnosing electrical issues',
        keywords: 'troubleshoot, diagnose, not working, flickering',
        pricing: 'Diagnostic fee: $95, Labor: $125/hr'
      },
      {
        name: 'Maintenance',
        description: 'Inspections, testing, preventive maintenance',
        keywords: 'inspection, testing, maintenance, check',
        pricing: 'Inspection: $150'
      }
    ],
    protocols: `**Emergency Calls:** Respond within 1 hour. Emergency fee $150 + labor.\n\n**Installations:** Provide detailed quote. Include permit costs if applicable.\n\n**Safety Issues:** Prioritize immediately. Advise customer to shut off power if safe to do so.\n\n**Permits:** Always mention if permit required for the work.`,
    specialRules: [
      'Always ask about permit requirements for installations',
      'For safety issues, prioritize and respond immediately',
      'Provide detailed quotes for installation work',
      'Mention warranty on workmanship (1 year standard)'
    ],
    upsellPrompts: [
      'While we\'re there, would you like us to inspect your electrical panel?',
      'Consider upgrading to LED lighting for energy savings'
    ]
  },
  'HVAC': {
    inquiryTypes: [
      {
        name: 'Emergency Service',
        description: 'No heat/cooling, system failure',
        keywords: 'emergency, no heat, no cooling, not working, broken',
        pricing: 'Emergency fee: $150, Labor: $125/hr'
      },
      {
        name: 'Maintenance',
        description: 'Seasonal tune-ups, filter changes, inspections',
        keywords: 'maintenance, tune-up, service, inspection, filter',
        pricing: 'Seasonal tune-up: $150'
      },
      {
        name: 'Installation',
        description: 'New system installation, replacements',
        keywords: 'install, new system, replace, upgrade',
        pricing: 'Quote required - varies by system'
      },
      {
        name: 'Repair',
        description: 'Fixing existing system issues',
        keywords: 'repair, fix, broken, not cooling, not heating',
        pricing: 'Diagnostic: $95, Labor: $125/hr + parts'
      }
    ],
    protocols: `**Emergency Service:** Respond within 2 hours. Emergency fee $150.\n\n**Seasonal Maintenance:** Recommend twice yearly (spring/fall).\n\n**Installations:** Provide detailed quote including rebates/financing options.\n\n**Filter Changes:** Recommend every 3 months, offer filter subscription.`,
    specialRules: [
      'Always mention seasonal maintenance programs',
      'Offer financing options for new installations',
      'Recommend filter subscription service',
      'Mention energy rebates when applicable'
    ],
    upsellPrompts: [
      'Sign up for our seasonal maintenance program and save 15%',
      'Consider a smart thermostat installation for better efficiency'
    ]
  },
  'Plumber': {
    inquiryTypes: [
      {
        name: 'Emergency Plumbing',
        description: 'Burst pipes, major leaks, no water, sewage backup',
        keywords: 'emergency, burst, leak, flooding, no water, backup',
        pricing: 'Emergency fee: $150, Labor: $125/hr'
      },
      {
        name: 'Repairs',
        description: 'Fixing leaks, clogs, running toilets',
        keywords: 'repair, leak, clog, toilet, faucet, drain',
        pricing: 'Service call: $95, Labor: $125/hr'
      },
      {
        name: 'Installation',
        description: 'New fixtures, water heaters, appliances',
        keywords: 'install, new, water heater, fixture, dishwasher',
        pricing: 'Quote required - varies by scope'
      },
      {
        name: 'Drain Cleaning',
        description: 'Clearing clogged drains and sewers',
        keywords: 'drain, clog, backup, slow drain, sewer',
        pricing: 'Drain cleaning: $150-$300'
      }
    ],
    protocols: `**Emergency Calls:** Respond within 1 hour. Advise customer to shut off water if needed.\n\n**Water Heater Issues:** Ask age of unit, symptoms. Recommend replacement if >10 years.\n\n**Drain Cleaning:** Offer camera inspection for recurring issues.\n\n**Installations:** Provide quote including permit costs.`,
    specialRules: [
      'For emergencies, advise customer on immediate actions (shut off water)',
      'Recommend water heater replacement if unit is >10 years old',
      'Offer camera inspection for recurring drain issues',
      'Mention warranty on parts and labor'
    ],
    upsellPrompts: [
      'Consider a water heater flush to extend its life',
      'We offer annual plumbing inspections to catch issues early'
    ]
  },
  'Roofing': {
    inquiryTypes: [
      {
        name: 'Emergency Repairs',
        description: 'Active leaks, storm damage, urgent repairs',
        keywords: 'emergency, leak, storm damage, urgent, water coming in',
        pricing: 'Emergency service: $200, Labor: $125/hr'
      },
      {
        name: 'Roof Replacement',
        description: 'Full roof replacement or re-roofing',
        keywords: 'replace, new roof, re-roof, replacement',
        pricing: 'Quote required - free inspection'
      },
      {
        name: 'Repairs',
        description: 'Fixing leaks, replacing shingles, flashing',
        keywords: 'repair, fix, leak, shingles, flashing',
        pricing: 'Service call: $150, Labor: $125/hr'
      },
      {
        name: 'Inspection',
        description: 'Roof inspections, assessments',
        keywords: 'inspection, assess, check, evaluation',
        pricing: 'Inspection: $150 (credited toward work)'
      }
    ],
    protocols: `**Emergency Leaks:** Respond same day. Provide temporary fix if needed.\n\n**Inspections:** Offer free inspection for replacement quotes.\n\n**Insurance Claims:** Assist with documentation and photos.\n\n**Warranties:** Mention manufacturer and workmanship warranties.`,
    specialRules: [
      'For active leaks, prioritize and respond same day',
      'Offer free inspection for replacement quotes',
      'Assist with insurance claims documentation',
      'Mention both manufacturer and workmanship warranties'
    ],
    upsellPrompts: [
      'Consider upgrading to architectural shingles for better durability',
      'We offer gutter cleaning and installation services'
    ]
  },
  'Pools': {
    inquiryTypes: [
      {
        name: 'Pool Service',
        description: 'Regular maintenance, cleaning, chemical balancing',
        keywords: 'service, maintenance, cleaning, chemicals, balance',
        pricing: 'Weekly service: $120/month'
      },
      {
        name: 'Repairs',
        description: 'Equipment repairs, leak detection, pump/filter issues',
        keywords: 'repair, broken, leak, pump, filter, heater',
        pricing: 'Service call: $95, Labor: $125/hr + parts'
      },
      {
        name: 'Opening/Closing',
        description: 'Seasonal pool opening and closing',
        keywords: 'opening, closing, winterize, spring',
        pricing: 'Opening: $250, Closing: $200'
      },
      {
        name: 'Installation',
        description: 'New pool installation, equipment upgrades',
        keywords: 'install, new pool, upgrade, equipment',
        pricing: 'Quote required - free consultation'
      }
    ],
    protocols: `**Service Plans:** Offer weekly, bi-weekly, or monthly service.\n\n**Chemical Sales:** Direct to online store or in-person pickup.\n\n**Emergency Repairs:** Respond within 24 hours.\n\n**Seasonal Services:** Book early for spring opening.`,
    specialRules: [
      'Recommend service plans for regular maintenance',
      'Offer chemical delivery with service plans',
      'Book seasonal services early (limited availability)',
      'Mention warranty on equipment installations'
    ],
    upsellPrompts: [
      'Sign up for weekly service and get 10% off chemicals',
      'Consider upgrading to a variable-speed pump for energy savings'
    ]
  },
  'Flooring': {
    inquiryTypes: [
      {
        name: 'Installation',
        description: 'Hardwood, tile, carpet, vinyl installation',
        keywords: 'install, new floor, hardwood, tile, carpet, vinyl, laminate',
        pricing: 'Quote required - free measurement'
      },
      {
        name: 'Refinishing',
        description: 'Hardwood floor refinishing and restoration',
        keywords: 'refinish, restore, sand, stain, polish',
        pricing: 'Quote required - varies by square footage'
      },
      {
        name: 'Repair',
        description: 'Floor repairs, replacement of damaged sections',
        keywords: 'repair, fix, damaged, scratch, water damage',
        pricing: 'Service call: $95, Labor: $125/hr'
      },
      {
        name: 'Commercial Flooring',
        description: 'Commercial flooring installation and maintenance',
        keywords: 'commercial, business, office, retail, warehouse',
        pricing: 'Quote required - commercial rates'
      }
    ],
    protocols: `**Measurements:** Offer free in-home measurement for quotes.\n\n**Material Selection:** Provide samples and material recommendations.\n\n**Installation Timeline:** Provide clear timeline and preparation requirements.\n\n**Warranty:** Mention installation warranty and material warranties.`,
    specialRules: [
      'Offer free in-home measurements for installation quotes',
      'Provide material samples when requested',
      'Explain subfloor preparation requirements',
      'Mention both installation and material warranties'
    ],
    upsellPrompts: [
      'Consider adding baseboards or trim work',
      'We also offer subfloor repair and leveling services'
    ]
  },
  'General Construction': {
    inquiryTypes: [
      {
        name: 'Home Renovations',
        description: 'Kitchen, bathroom, basement renovations',
        keywords: 'renovation, remodel, kitchen, bathroom, basement',
        pricing: 'Quote required - free consultation'
      },
      {
        name: 'Construction Projects',
        description: 'New builds, additions, structural work',
        keywords: 'build, addition, extension, structural, new construction',
        pricing: 'Quote required - detailed estimate provided'
      },
      {
        name: 'Permits & Coordination',
        description: 'Permit acquisition, subcontractor coordination',
        keywords: 'permit, approval, coordination, project management',
        pricing: 'Included in project quote'
      },
      {
        name: 'Project Management',
        description: 'Full project management services',
        keywords: 'manage, coordinate, oversee, timeline, budget',
        pricing: 'Quote required - varies by project scope'
      }
    ],
    protocols: `**Consultations:** Offer free initial consultation.\n\n**Permits:** Handle all permit applications and approvals.\n\n**Timeline:** Provide detailed project timeline with milestones.\n\n**Communication:** Weekly progress updates during construction.`,
    specialRules: [
      'Offer free initial consultation for all projects',
      'Provide detailed written estimates with breakdown',
      'Handle all permit applications',
      'Provide weekly progress updates during construction'
    ],
    upsellPrompts: [
      'Consider upgrading fixtures and finishes',
      'We can coordinate all trades for a turnkey solution'
    ]
  },
  'Insulation & Foam Spray': {
    inquiryTypes: [
      {
        name: 'Attic Insulation',
        description: 'Attic and wall insulation installation',
        keywords: 'attic, wall, insulation, insulate, cold, drafty',
        pricing: 'Quote required - free energy assessment'
      },
      {
        name: 'Spray Foam Application',
        description: 'Spray foam insulation for walls, attics, crawl spaces',
        keywords: 'spray foam, foam, air sealing, vapor barrier',
        pricing: 'Quote required - varies by square footage'
      },
      {
        name: 'Air Sealing',
        description: 'Air sealing and draft prevention',
        keywords: 'air seal, draft, leak, cold spots, energy loss',
        pricing: 'Quote required - includes blower door test'
      },
      {
        name: 'Energy Efficiency Upgrades',
        description: 'Comprehensive energy efficiency improvements',
        keywords: 'energy, efficiency, save, bills, rebate',
        pricing: 'Quote required - rebates may be available'
      }
    ],
    protocols: `**Energy Assessment:** Offer free energy assessment.\n\n**Rebates:** Inform customers about available energy rebates.\n\n**Air Quality:** Explain ventilation requirements for spray foam.\n\n**ROI:** Provide energy savings estimates.`,
    specialRules: [
      'Offer free energy assessment with blower door test',
      'Inform customers about available energy rebates',
      'Explain ventilation requirements for spray foam',
      'Provide estimated ROI and energy savings'
    ],
    upsellPrompts: [
      'Consider air sealing along with insulation for maximum efficiency',
      'We can also upgrade your attic ventilation'
    ]
  },
  'Landscaping': {
    inquiryTypes: [
      {
        name: 'Lawn Care',
        description: 'Mowing, fertilizing, weed control, aeration',
        keywords: 'lawn, mowing, fertilize, weeds, aeration, grass',
        pricing: 'Monthly service: $150-$300'
      },
      {
        name: 'Garden Design',
        description: 'Landscape design, planting, garden beds',
        keywords: 'design, garden, planting, flowers, shrubs, trees',
        pricing: 'Design consultation: $200 (credited toward work)'
      },
      {
        name: 'Irrigation',
        description: 'Sprinkler system installation and repair',
        keywords: 'irrigation, sprinkler, watering, system, repair',
        pricing: 'Quote required - varies by system size'
      },
      {
        name: 'Seasonal Maintenance',
        description: 'Spring cleanup, fall cleanup, winterization',
        keywords: 'cleanup, spring, fall, winter, seasonal, maintenance',
        pricing: 'Spring cleanup: $200-$500, Fall cleanup: $200-$500'
      }
    ],
    protocols: `**Service Plans:** Offer seasonal or annual service plans.\n\n**Design Consultations:** Provide design consultation with 3D rendering.\n\n**Plant Selection:** Recommend plants suitable for local climate.\n\n**Irrigation:** Offer smart irrigation systems for water conservation.`,
    specialRules: [
      'Offer seasonal service plans with discounts',
      'Provide design consultation with 3D rendering',
      'Recommend native and drought-resistant plants',
      'Mention smart irrigation for water conservation'
    ],
    upsellPrompts: [
      'Sign up for our seasonal service plan and save 15%',
      'Consider adding landscape lighting for curb appeal'
    ]
  },
  'Painting': {
    inquiryTypes: [
      {
        name: 'Interior Painting',
        description: 'Interior painting for homes and businesses',
        keywords: 'interior, paint, walls, ceiling, rooms, color',
        pricing: 'Quote required - free color consultation'
      },
      {
        name: 'Exterior Painting',
        description: 'Exterior painting, siding, trim, decks',
        keywords: 'exterior, outside, siding, trim, deck, fence',
        pricing: 'Quote required - free estimate'
      },
      {
        name: 'Surface Preparation',
        description: 'Drywall repair, sanding, priming',
        keywords: 'prep, repair, drywall, sand, prime, patch',
        pricing: 'Included in painting quote'
      },
      {
        name: 'Commercial Painting',
        description: 'Commercial and industrial painting services',
        keywords: 'commercial, business, office, warehouse, industrial',
        pricing: 'Quote required - after-hours available'
      }
    ],
    protocols: `**Color Consultation:** Offer free color consultation.\n\n**Surface Prep:** Explain importance of proper surface preparation.\n\n**Paint Quality:** Recommend premium paints for durability.\n\n**Timeline:** Provide clear timeline and minimize disruption.`,
    specialRules: [
      'Offer free color consultation with paint samples',
      'Explain surface preparation included in quote',
      'Recommend premium paints for better coverage and durability',
      'Provide clear timeline and work schedule'
    ],
    upsellPrompts: [
      'Consider upgrading to premium paint for better durability',
      'We also offer cabinet painting and refinishing'
    ]
  },
  'Sauna & Icebath': {
    inquiryTypes: [
      {
        name: 'Sauna Installation',
        description: 'Traditional and infrared sauna installation',
        keywords: 'sauna, install, traditional, infrared, steam',
        pricing: 'Quote required - free consultation'
      },
      {
        name: 'Cold Plunge Installation',
        description: 'Ice bath and cold plunge installation',
        keywords: 'ice bath, cold plunge, cold therapy, recovery',
        pricing: 'Quote required - free consultation'
      },
      {
        name: 'Repair & Maintenance',
        description: 'Sauna and ice bath repair and maintenance',
        keywords: 'repair, fix, maintenance, heater, chiller',
        pricing: 'Service call: $95, Labor: $125/hr'
      },
      {
        name: 'Heater/Chiller Repair',
        description: 'Heater and chiller system repair',
        keywords: 'heater, chiller, not working, broken, temperature',
        pricing: 'Service call: $95, Labor: $125/hr + parts'
      }
    ],
    protocols: `**Consultations:** Offer free consultation for new installations.\n\n**Health Benefits:** Educate customers on health and recovery benefits.\n\n**Maintenance:** Recommend regular maintenance schedules.\n\n**Warranty:** Mention equipment and installation warranties.`,
    specialRules: [
      'Offer free consultation for new installations',
      'Educate customers on health and recovery benefits',
      'Recommend regular maintenance for longevity',
      'Mention equipment and installation warranties'
    ],
    upsellPrompts: [
      'Consider a combo package with both sauna and cold plunge',
      'We offer maintenance packages to keep your equipment running optimally'
    ]
  },
  'General': {
    inquiryTypes: [
      {
        name: 'Service Inquiry',
        description: 'General service requests',
        keywords: 'service, help, need, request',
        pricing: 'Varies by service'
      },
      {
        name: 'Quote Request',
        description: 'Requesting a quote or estimate',
        keywords: 'quote, estimate, price, cost, how much',
        pricing: 'Free quotes available'
      },
      {
        name: 'Support',
        description: 'General support and questions',
        keywords: 'question, help, support, info, information',
        pricing: 'Free consultation'
      }
    ],
    protocols: `**Service Requests:** Respond within 24 hours.\n\n**Quotes:** Provide detailed quotes with breakdown.\n\n**Support:** Answer questions promptly and professionally.`,
    specialRules: [
      'Respond to all inquiries within 24 hours',
      'Provide detailed quotes with itemized breakdown',
      'Be professional and courteous in all communications'
    ],
    upsellPrompts: [
      'Ask about additional services we can help with'
    ]
  },
  'Landscaping': {
    inquiryTypes: [
      {
        name: 'Lawn Care Service',
        description: 'Mowing, edging, fertilization, weed control',
        keywords: 'lawn, mowing, grass, fertilizer, weeds, yard',
        pricing: 'Weekly service: $40-$80, Fertilization: $60-$120'
      },
      {
        name: 'Tree & Shrub Service',
        description: 'Pruning, trimming, removal, stump grinding',
        keywords: 'tree, shrub, pruning, trimming, removal, stump',
        pricing: 'Quote required - varies by size and scope'
      },
      {
        name: 'Irrigation & Sprinklers',
        description: 'Installation, repair, winterization',
        keywords: 'irrigation, sprinkler, watering, system, winterize',
        pricing: 'Repair: $95 service call + parts, Installation: Custom quote'
      },
      {
        name: 'Landscape Design',
        description: 'Garden design, hardscaping, installation',
        keywords: 'design, landscaping, garden, patio, hardscape',
        pricing: 'Design consultation: $150, Installation: Custom quote'
      }
    ],
    protocols: `**Lawn Care:** Offer weekly, bi-weekly, or monthly service plans.\n\n**Tree Service:** Schedule on-site assessment for large jobs.\n\n**Irrigation:** Spring startup and fall winterization are critical.\n\n**Design Projects:** Require consultation and detailed quote.`,
    specialRules: [
      'Promote seasonal services (spring cleanup, fall winterization)',
      'Offer service plans for recurring lawn care',
      'Always mention irrigation winterization before first freeze',
      'Provide detailed quotes for design and installation projects'
    ],
    upsellPrompts: [
      'Would you like to add fertilization to your lawn care plan?',
      'Consider a spring cleanup package',
      'We also offer irrigation system maintenance'
    ]
  },
  'Cleaning Services': {
    inquiryTypes: [
      {
        name: 'Residential Cleaning',
        description: 'House cleaning, deep cleaning, move-in/out',
        keywords: 'house cleaning, home cleaning, deep clean, move out',
        pricing: 'Standard clean: $120-$200, Deep clean: $200-$350'
      },
      {
        name: 'Commercial Cleaning',
        description: 'Office cleaning, janitorial services',
        keywords: 'office, commercial, janitorial, business cleaning',
        pricing: 'Quote required - based on square footage and frequency'
      },
      {
        name: 'Specialty Cleaning',
        description: 'Carpet cleaning, window washing, post-construction',
        keywords: 'carpet, windows, post construction, specialty',
        pricing: 'Carpet: $0.30-$0.50/sq ft, Windows: $5-$15/window'
      },
      {
        name: 'Recurring Service',
        description: 'Weekly, bi-weekly, or monthly cleaning plans',
        keywords: 'recurring, weekly, bi-weekly, monthly, regular',
        pricing: 'Discounts available for recurring service'
      }
    ],
    protocols: `**Residential:** Offer free in-home estimates for first-time customers.\n\n**Commercial:** Require site visit for accurate quote.\n\n**Recurring Service:** Promote service plans with discounted rates.\n\n**Specialty:** Schedule based on availability and equipment needs.`,
    specialRules: [
      'Always offer free estimates for new customers',
      'Promote recurring service plans with 10-15% discount',
      'Ask about pets, special requirements, or access instructions',
      'Confirm cleaning supplies provided or customer preference'
    ],
    upsellPrompts: [
      'Save 15% with a recurring cleaning plan',
      'Add carpet cleaning to your service',
      'Consider our move-in deep clean package'
    ]
  },
  'Pest Control': {
    inquiryTypes: [
      {
        name: 'Emergency Pest Control',
        description: 'Urgent infestations, wasps, rodents',
        keywords: 'emergency, infestation, wasps, hornets, rats, mice',
        pricing: 'Emergency service: $150-$250'
      },
      {
        name: 'General Pest Control',
        description: 'Ants, spiders, roaches, general pests',
        keywords: 'ants, spiders, roaches, bugs, insects, pests',
        pricing: 'Initial treatment: $150-$200, Follow-up: $80-$120'
      },
      {
        name: 'Preventive Service',
        description: 'Quarterly or monthly pest prevention',
        keywords: 'prevention, quarterly, monthly, maintenance, plan',
        pricing: 'Quarterly plan: $100/visit, Monthly: $80/visit'
      },
      {
        name: 'Termite Inspection',
        description: 'Termite inspections and treatments',
        keywords: 'termite, wood damage, inspection, treatment',
        pricing: 'Inspection: $100, Treatment: $500-$2000'
      }
    ],
    protocols: `**Emergency:** Respond same day for wasps, hornets, or severe infestations.\n\n**General Service:** Schedule within 2-3 days.\n\n**Preventive Plans:** Promote quarterly service for year-round protection.\n\n**Termite:** Require inspection before providing treatment quote.`,
    specialRules: [
      'Emergency pest issues (wasps, hornets) get same-day response',
      'Always ask about pets and children for treatment safety',
      'Promote quarterly plans for ongoing protection',
      'Mention warranty on treatments (typically 30-90 days)'
    ],
    upsellPrompts: [
      'Sign up for quarterly service and save 20%',
      'Add rodent exclusion to your service',
      'Consider a termite inspection for peace of mind'
    ]
  },
  'Locksmith': {
    inquiryTypes: [
      {
        name: 'Emergency Lockout',
        description: 'Locked out of home, car, or business',
        keywords: 'locked out, lockout, emergency, can\'t get in',
        pricing: 'Emergency lockout: $75-$150'
      },
      {
        name: 'Rekeying Service',
        description: 'Rekey locks, change locks, new keys',
        keywords: 'rekey, change locks, new keys, lock change',
        pricing: 'Rekey: $25-$35 per lock, Lock change: $50-$100'
      },
      {
        name: 'Security Upgrade',
        description: 'Deadbolts, smart locks, security systems',
        keywords: 'security, deadbolt, smart lock, upgrade, installation',
        pricing: 'Installation: $100-$300 depending on lock type'
      },
      {
        name: 'Commercial Locksmith',
        description: 'Master key systems, access control, panic bars',
        keywords: 'commercial, master key, access control, business',
        pricing: 'Quote required - varies by system complexity'
      }
    ],
    protocols: `**Emergency Lockout:** Respond within 30-60 minutes. Verify ownership before service.\n\n**Rekeying:** Schedule same day or next day.\n\n**Security Upgrades:** Recommend consultation for complex systems.\n\n**Commercial:** Require on-site assessment for master key systems.`,
    specialRules: [
      'ALWAYS verify ownership before lockout service',
      'Emergency lockouts get priority response (30-60 min)',
      'Recommend rekeying when moving into new home',
      'Promote smart lock upgrades for convenience and security'
    ],
    upsellPrompts: [
      'Consider upgrading to a smart lock for keyless entry',
      'Add a deadbolt for enhanced security',
      'We can rekey all your locks to match one key'
    ]
  },
  'Appliance Repair': {
    inquiryTypes: [
      {
        name: 'Refrigerator Repair',
        description: 'Not cooling, ice maker issues, leaking',
        keywords: 'refrigerator, fridge, not cooling, ice maker, leaking',
        pricing: 'Diagnostic: $95, Labor: $125/hr + parts'
      },
      {
        name: 'Washer/Dryer Repair',
        description: 'Not spinning, not draining, not heating',
        keywords: 'washer, dryer, not spinning, not draining, not heating',
        pricing: 'Diagnostic: $95, Labor: $125/hr + parts'
      },
      {
        name: 'Oven/Stove Repair',
        description: 'Not heating, burner issues, control panel',
        keywords: 'oven, stove, range, not heating, burner, control',
        pricing: 'Diagnostic: $95, Labor: $125/hr + parts'
      },
      {
        name: 'Dishwasher Repair',
        description: 'Not cleaning, not draining, leaking',
        keywords: 'dishwasher, not cleaning, not draining, leaking',
        pricing: 'Diagnostic: $95, Labor: $125/hr + parts'
      }
    ],
    protocols: `**Emergency:** Refrigerator not cooling gets priority (food spoilage risk).\n\n**Diagnostic:** $95 diagnostic fee applies to all service calls.\n\n**Parts:** Provide quote before ordering parts.\n\n**Warranty:** Mention warranty on parts and labor.`,
    specialRules: [
      'Refrigerator not cooling = priority response (food safety)',
      'Always ask appliance brand, model, and age',
      'Provide parts quote before ordering',
      'Mention warranty on repairs (typically 90 days parts/labor)'
    ],
    upsellPrompts: [
      'Consider a maintenance plan for all your appliances',
      'We can also service your other appliances while we\'re here',
      'Extended warranty available for major repairs'
    ]
  }
};

async function migrateTemplates() {
  console.log('🚀 Starting business type template migration...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [businessType, template] of Object.entries(businessTypeTemplates)) {
    try {
      console.log(`📝 Migrating: ${businessType}`);
      
      const { data, error } = await supabase
        .from('business_type_templates')
        .upsert({
          business_type: businessType,
          inquiry_types: template.inquiryTypes,
          protocols: template.protocols,
          special_rules: template.specialRules,
          upsell_prompts: template.upsellPrompts,
          template_version: 1,
          is_active: true
        }, {
          onConflict: 'business_type'
        })
        .select();
      
      if (error) {
        console.error(`   ❌ Failed: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Success (ID: ${data[0].id})`);
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Exception: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📦 Total: ${Object.keys(businessTypeTemplates).length}`);
  console.log('='.repeat(60));
  
  if (errorCount === 0) {
    console.log('\n🎉 All templates migrated successfully!');
  } else {
    console.log('\n⚠️  Some templates failed to migrate. Check errors above.');
  }
}

// Run migration
migrateTemplates()
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

