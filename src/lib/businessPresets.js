// Comprehensive presets by business type. Each preset includes industry-specific services, rules, suppliers, and AI settings.
export const businessPresets = {
  'Electrician': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'no power','power outage','electrical outage',
        'tripping breaker','breaker keeps tripping','gfi tripped',
        'sparking','electrical spark','smoke','burning smell',
        'electrical hazard','shock','electrical fire',
        'hot wire','live wire','exposed wire',
        'panel not working','main breaker','electrical panel'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Electrical Repair',
        description: '24/7 emergency electrical repair service for power outages, tripping breakers, and electrical hazards.',
        duration: '1-4 hours',
        availability: '24/7 Emergency',
        category: 'Emergency',
        pricingType: 'hourly',
        price: '',
        sku: 'ELEC-001',
        notes: 'Emergency service rates apply after hours'
      },
      {
        name: 'Electrical Panel Upgrade',
        description: 'Complete electrical panel upgrade including new panel, breakers, and code compliance.',
        duration: '4-8 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-002',
        notes: 'Requires permit and inspection'
      },
      {
        name: 'Outlet Installation',
        description: 'Installation of new electrical outlets including GFCI outlets and USB outlets.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-003',
        notes: 'Per outlet pricing'
      },
      {
        name: 'Light Fixture Installation',
        description: 'Installation of new light fixtures including chandeliers, recessed lighting, and outdoor lighting.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-004',
        notes: 'Includes fixture and installation'
      },
      {
        name: 'Circuit Breaker Repair',
        description: 'Repair and replacement of faulty circuit breakers and electrical panels.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-005',
        notes: 'Includes diagnostic and parts'
      },
      {
        name: 'Wiring Installation',
        description: 'New electrical wiring installation for renovations, additions, and new construction.',
        duration: '2-8 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-006',
        notes: 'Requires permit for new construction'
      },
      {
        name: 'Electrical Inspection',
        description: 'Comprehensive electrical safety inspection and code compliance check.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Inspection',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-007',
        notes: 'Includes detailed report'
      },
      {
        name: 'GFCI Outlet Installation',
        description: 'Installation of Ground Fault Circuit Interrupter outlets for safety compliance.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-008',
        notes: 'Required in kitchens, bathrooms, and outdoor areas'
      },
      {
        name: 'Ceiling Fan Installation',
        description: 'Installation of ceiling fans including electrical connection and mounting.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-009',
        notes: 'Includes fan and installation'
      },
      {
        name: 'Electrical Troubleshooting',
        description: 'Diagnostic service to identify and resolve electrical problems.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        sku: 'ELEC-010',
        notes: 'Hourly diagnostic service'
      },
      {
        name: 'Whole House Surge Protection',
        description: 'Installation of whole house surge protection system.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-011',
        notes: 'Protects all electrical devices'
      },
      {
        name: 'EV Charger Installation',
        description: 'Installation of electric vehicle charging stations for home and commercial use.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-012',
        notes: 'Requires permit and inspection'
      },
      {
        name: 'Generator Installation',
        description: 'Installation of backup generators including electrical connection and transfer switch.',
        duration: '4-8 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-013',
        notes: 'Includes transfer switch installation'
      },
      {
        name: 'Smart Home Wiring',
        description: 'Installation of smart home electrical systems including smart switches and outlets.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-014',
        notes: 'Includes smart device setup'
      },
      {
        name: 'Electrical Code Compliance',
        description: 'Bringing existing electrical systems up to current code standards.',
        duration: '2-8 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'ELEC-015',
        notes: 'Required for home sales and renovations'
      }
    ],
    suppliers: [
      { name: 'Square D', category: 'Equipment', contact: 'support@squared.com' },
      { name: 'Siemens', category: 'Equipment', contact: 'service@siemens.com' },
      { name: 'Eaton', category: 'Equipment', contact: 'support@eaton.com' },
      { name: 'Leviton', category: 'Equipment', contact: 'service@leviton.com' },
      { name: 'Lutron', category: 'Equipment', contact: 'support@lutron.com' },
      { name: 'Electrical Supply Co', category: 'Supplies', contact: 'orders@electricalsupply.com' },
      { name: 'Graybar', category: 'Supplies', contact: 'orders@graybar.com' }
    ]
  },
  'Flooring': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'water damage','flooding','leak','water leak',
        'floor buckling','floor warping','floor lifting',
        'mold','mildew','floor damage','structural damage',
        'trip hazard','safety hazard','loose floorboards',
        'floor replacement','floor repair','immediate repair'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Hardwood Floor Installation',
        description: 'Professional hardwood floor installation including solid and engineered hardwood.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-001',
        notes: 'Includes subfloor preparation and finishing'
      },
      {
        name: 'Hardwood Floor Refinishing',
        description: 'Complete hardwood floor refinishing including sanding, staining, and sealing.',
        duration: '3-5 days',
        availability: 'Monday - Friday',
        category: 'Refinishing',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-002',
        notes: 'Includes dust containment and cleanup'
      },
      {
        name: 'Tile Installation',
        description: 'Professional tile installation including ceramic, porcelain, and natural stone tiles.',
        duration: '1-4 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-003',
        notes: 'Includes grouting and sealing'
      },
      {
        name: 'Carpet Installation',
        description: 'Complete carpet installation including padding, stretching, and trimming.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-004',
        notes: 'Includes furniture moving and cleanup'
      },
      {
        name: 'Luxury Vinyl Plank Installation',
        description: 'Installation of luxury vinyl plank (LVP) flooring including waterproof options.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-005',
        notes: 'Waterproof and pet-friendly options available'
      },
      {
        name: 'Laminate Floor Installation',
        description: 'Professional laminate floor installation with click-lock systems.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-006',
        notes: 'Includes underlayment and trim work'
      },
      {
        name: 'Floor Repair',
        description: 'Repair service for damaged floors including boards, tiles, and planks.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-007',
        notes: 'Includes matching materials when possible'
      },
      {
        name: 'Water Damage Floor Repair',
        description: 'Emergency repair service for water-damaged floors and subfloors.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Emergency',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-008',
        notes: 'Includes moisture testing and mold prevention'
      },
      {
        name: 'Floor Sanding',
        description: 'Professional floor sanding service for hardwood floors.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Refinishing',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-009',
        notes: 'Includes dust containment system'
      },
      {
        name: 'Floor Staining',
        description: 'Custom floor staining service to match existing floors or create new looks.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Refinishing',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-010',
        notes: 'Custom color matching available'
      },
      {
        name: 'Baseboard Installation',
        description: 'Installation of baseboards and trim work for finished flooring projects.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-011',
        notes: 'Includes caulking and touch-up'
      },
      {
        name: 'Subfloor Repair',
        description: 'Repair and replacement of damaged subfloors and structural support.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-012',
        notes: 'Includes structural assessment'
      },
      {
        name: 'Floor Leveling',
        description: 'Professional floor leveling service for uneven or sloping floors.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Preparation',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-013',
        notes: 'Self-leveling compound application'
      },
      {
        name: 'Commercial Flooring',
        description: 'Commercial flooring installation including vinyl, rubber, and specialty surfaces.',
        duration: '2-5 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-014',
        notes: 'After-hours installation available'
      },
      {
        name: 'Floor Removal & Disposal',
        description: 'Complete floor removal service including disposal of old materials.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Removal',
        pricingType: 'fixed',
        price: '',
        sku: 'FLOOR-015',
        notes: 'Includes eco-friendly disposal'
      }
    ],
    suppliers: [
      { name: 'Shaw Floors', category: 'Materials', contact: 'orders@shawfloors.com' },
      { name: 'Mohawk Industries', category: 'Materials', contact: 'support@mohawkflooring.com' },
      { name: 'Armstrong Flooring', category: 'Materials', contact: 'service@armstrongflooring.com' },
      { name: 'Mannington Mills', category: 'Materials', contact: 'orders@mannington.com' },
      { name: 'Tarkett', category: 'Materials', contact: 'support@tarkett.com' },
      { name: 'Floor & Decor', category: 'Supplies', contact: 'orders@flooranddecor.com' },
      { name: 'Flooring Supply', category: 'Supplies', contact: 'orders@flooringsupply.com' }
    ]
  },
  'General Construction': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'structural damage','foundation crack','wall crack',
        'roof leak','water damage','flooding','leak',
        'electrical hazard','gas leak','safety hazard',
        'building collapse','structural failure','immediate repair',
        'permit violation','code violation','inspection failed'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Home Renovation',
        description: 'Complete home renovation including kitchen, bathroom, and living space updates.',
        duration: '2-8 weeks',
        availability: 'Monday - Friday',
        category: 'Renovation',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-001',
        notes: 'Includes design consultation and project management'
      },
      {
        name: 'Kitchen Remodeling',
        description: 'Complete kitchen remodeling including cabinets, countertops, appliances, and plumbing.',
        duration: '2-4 weeks',
        availability: 'Monday - Friday',
        category: 'Renovation',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-002',
        notes: 'Includes electrical and plumbing work'
      },
      {
        name: 'Bathroom Remodeling',
        description: 'Complete bathroom remodeling including fixtures, tile, plumbing, and electrical.',
        duration: '1-3 weeks',
        availability: 'Monday - Friday',
        category: 'Renovation',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-003',
        notes: 'Includes waterproofing and ventilation'
      },
      {
        name: 'Room Addition',
        description: 'Construction of new room additions including foundation, framing, and finishing.',
        duration: '4-12 weeks',
        availability: 'Monday - Friday',
        category: 'Construction',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-004',
        notes: 'Requires permits and inspections'
      },
      {
        name: 'Deck Construction',
        description: 'Professional deck construction including framing, decking, and railings.',
        duration: '1-2 weeks',
        availability: 'Monday - Friday',
        category: 'Construction',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-005',
        notes: 'Includes permits and structural engineering'
      },
      {
        name: 'Basement Finishing',
        description: 'Complete basement finishing including framing, electrical, plumbing, and flooring.',
        duration: '2-6 weeks',
        availability: 'Monday - Friday',
        category: 'Renovation',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-006',
        notes: 'Includes moisture control and egress windows'
      },
      {
        name: 'Structural Repair',
        description: 'Repair of structural damage including foundation, beams, and load-bearing walls.',
        duration: '1-4 weeks',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-007',
        notes: 'Includes engineering assessment and permits'
      },
      {
        name: 'Permit Services',
        description: 'Complete permit application and management for construction projects.',
        duration: '1-2 weeks',
        availability: 'Monday - Friday',
        category: 'Administrative',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-008',
        notes: 'Includes plan preparation and city coordination'
      },
      {
        name: 'Project Management',
        description: 'Complete project management for construction and renovation projects.',
        duration: 'Ongoing',
        availability: 'Monday - Friday',
        category: 'Management',
        pricingType: 'hourly',
        price: '',
        sku: 'GC-009',
        notes: 'Includes scheduling and subcontractor coordination'
      },
      {
        name: 'Subcontractor Coordination',
        description: 'Coordination and management of subcontractors for multi-trade projects.',
        duration: 'Ongoing',
        availability: 'Monday - Friday',
        category: 'Management',
        pricingType: 'hourly',
        price: '',
        sku: 'GC-010',
        notes: 'Includes quality control and scheduling'
      },
      {
        name: 'Construction Consultation',
        description: 'Professional consultation for construction projects and feasibility studies.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Consultation',
        pricingType: 'hourly',
        price: '',
        sku: 'GC-011',
        notes: 'Includes cost estimation and timeline planning'
      },
      {
        name: 'Code Compliance',
        description: 'Ensuring construction projects meet all local building codes and regulations.',
        duration: 'Ongoing',
        availability: 'Monday - Friday',
        category: 'Compliance',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-012',
        notes: 'Includes inspections and corrections'
      },
      {
        name: 'Emergency Repairs',
        description: 'Emergency structural and safety repairs for urgent situations.',
        duration: '1-3 days',
        availability: '24/7 Emergency',
        category: 'Emergency',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-013',
        notes: 'Emergency service rates apply after hours'
      },
      {
        name: 'Foundation Repair',
        description: 'Professional foundation repair including crack repair and structural reinforcement.',
        duration: '1-2 weeks',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-014',
        notes: 'Includes engineering assessment and permits'
      },
      {
        name: 'Commercial Construction',
        description: 'Commercial construction projects including offices, retail, and industrial spaces.',
        duration: '8-24 weeks',
        availability: 'Monday - Friday',
        category: 'Construction',
        pricingType: 'fixed',
        price: '',
        sku: 'GC-015',
        notes: 'Includes after-hours work and specialized permits'
      }
    ],
    suppliers: [
      { name: 'Home Depot Pro', category: 'Materials', contact: 'orders@homedepotpro.com' },
      { name: 'Lowe\'s Pro', category: 'Materials', contact: 'orders@lowespro.com' },
      { name: '84 Lumber', category: 'Materials', contact: 'orders@84lumber.com' },
      { name: 'Builders FirstSource', category: 'Materials', contact: 'orders@bfs.com' },
      { name: 'ABC Supply', category: 'Materials', contact: 'orders@abcsupply.com' },
      { name: 'Construction Supply', category: 'Supplies', contact: 'orders@constructionsupply.com' },
      { name: 'Contractor Supply', category: 'Supplies', contact: 'orders@contractorsupply.com' }
    ]
  },
  'HVAC': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'no heat','no cooling','broken ac','furnace not working',
        'heat pump not working','air conditioner not working',
        'no air conditioning','heating not working','cooling not working',
        'gas leak','carbon monoxide','co detector','gas smell',
        'frozen coil','ice on unit','refrigerant leak',
        'thermostat not working','blower not working','fan not working'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency HVAC Repair',
        description: '24/7 emergency HVAC repair service for heating and cooling system failures.',
        duration: '1-4 hours',
        availability: '24/7 Emergency',
        category: 'Emergency',
        pricingType: 'hourly',
        price: '',
        sku: 'HVAC-001',
        notes: 'Emergency service rates apply after hours'
      },
      {
        name: 'Furnace Installation',
        description: 'Complete furnace installation including gas and electric furnaces.',
        duration: '4-8 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-002',
        notes: 'Includes permits and inspection'
      },
      {
        name: 'Air Conditioner Installation',
        description: 'Complete air conditioning system installation including central AC and heat pumps.',
        duration: '4-8 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-003',
        notes: 'Includes electrical and refrigerant work'
      },
      {
        name: 'Heat Pump Installation',
        description: 'Complete heat pump installation for year-round heating and cooling.',
        duration: '6-10 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-004',
        notes: 'Includes electrical and refrigerant work'
      },
      {
        name: 'Ductwork Installation',
        description: 'Complete ductwork installation and replacement for HVAC systems.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-005',
        notes: 'Includes insulation and sealing'
      },
      {
        name: 'Thermostat Installation',
        description: 'Installation of programmable and smart thermostats.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-006',
        notes: 'Includes programming and setup'
      },
      {
        name: 'HVAC Maintenance',
        description: 'Complete HVAC system maintenance including cleaning, inspection, and tune-up.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-007',
        notes: 'Seasonal maintenance recommended'
      },
      {
        name: 'Duct Cleaning',
        description: 'Professional duct cleaning service to improve air quality and efficiency.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-008',
        notes: 'Includes sanitizing and deodorizing'
      },
      {
        name: 'Filter Replacement',
        description: 'Regular filter replacement service for all HVAC systems.',
        duration: '30 minutes',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-009',
        notes: 'Monthly service available'
      },
      {
        name: 'Refrigerant Recharge',
        description: 'Professional refrigerant recharge service for air conditioning systems.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-010',
        notes: 'Includes leak detection'
      },
      {
        name: 'Compressor Repair',
        description: 'Repair and replacement of HVAC compressor units.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-011',
        notes: 'Includes diagnostic and parts'
      },
      {
        name: 'Blower Motor Repair',
        description: 'Repair and replacement of HVAC blower motors.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-012',
        notes: 'Includes diagnostic and parts'
      },
      {
        name: 'Gas Line Installation',
        description: 'Installation of gas lines for furnaces and gas appliances.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-013',
        notes: 'Requires permits and inspection'
      },
      {
        name: 'Indoor Air Quality Testing',
        description: 'Professional indoor air quality testing and assessment.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Inspection',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-014',
        notes: 'Includes detailed report and recommendations'
      },
      {
        name: 'HVAC System Upgrade',
        description: 'Complete HVAC system upgrade for improved efficiency and performance.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'HVAC-015',
        notes: 'Includes energy efficiency assessment'
      }
    ],
    suppliers: [
      { name: 'Carrier', category: 'Equipment', contact: 'support@carrier.com' },
      { name: 'Trane', category: 'Equipment', contact: 'service@trane.com' },
      { name: 'Lennox', category: 'Equipment', contact: 'support@lennox.com' },
      { name: 'Rheem', category: 'Equipment', contact: 'service@rheem.com' },
      { name: 'Goodman', category: 'Equipment', contact: 'support@goodmanmfg.com' },
      { name: 'HVAC Supply', category: 'Supplies', contact: 'orders@hvacsupply.com' },
      { name: 'Johnstone Supply', category: 'Supplies', contact: 'orders@johnstone.com' }
    ]
  },
  'Insulation & Foam Spray': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'energy audit','energy assessment','high energy bills',
        'drafty house','cold spots','hot spots','temperature issues',
        'ice dams','roof ice','attic condensation','moisture problems',
        'mold in attic','insulation damage','water damage',
        'air leaks','drafty windows','drafty doors',
        'energy efficiency','utility rebate','tax credit'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Attic Insulation Installation',
        description: 'Professional attic insulation installation including blown-in and batt insulation.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-001',
        notes: 'Includes air sealing and ventilation assessment'
      },
      {
        name: 'Wall Insulation Installation',
        description: 'Wall insulation installation including blown-in insulation for existing walls.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-002',
        notes: 'Includes drilling and patching'
      },
      {
        name: 'Spray Foam Insulation',
        description: 'Professional spray foam insulation installation for walls, attics, and crawl spaces.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-003',
        notes: 'Open-cell and closed-cell options available'
      },
      {
        name: 'Crawl Space Insulation',
        description: 'Complete crawl space insulation including walls and floor insulation.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-004',
        notes: 'Includes vapor barrier installation'
      },
      {
        name: 'Basement Insulation',
        description: 'Basement wall and rim joist insulation for improved energy efficiency.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-005',
        notes: 'Includes moisture control measures'
      },
      {
        name: 'Air Sealing',
        description: 'Complete air sealing service to eliminate drafts and improve energy efficiency.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-006',
        notes: 'Includes caulking, weatherstripping, and foam sealing'
      },
      {
        name: 'Blown-In Insulation',
        description: 'Blown-in insulation installation for attics and walls using specialized equipment.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-007',
        notes: 'Cellulose, fiberglass, and mineral wool options'
      },
      {
        name: 'Insulation Removal',
        description: 'Professional removal of old or damaged insulation including asbestos testing.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Removal',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-008',
        notes: 'Includes proper disposal and safety measures'
      },
      {
        name: 'Insulation Repair',
        description: 'Repair and replacement of damaged or deteriorated insulation.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-009',
        notes: 'Includes moisture damage assessment'
      },
      {
        name: 'Energy Audit',
        description: 'Comprehensive energy audit including blower door testing and thermal imaging.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Assessment',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-010',
        notes: 'Includes detailed report and recommendations'
      },
      {
        name: 'Blower Door Testing',
        description: 'Professional blower door testing to measure air leakage and efficiency.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Assessment',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-011',
        notes: 'Required for many utility rebates'
      },
      {
        name: 'Thermal Imaging',
        description: 'Thermal imaging inspection to identify heat loss and insulation gaps.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Assessment',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-012',
        notes: 'Includes detailed thermal images and report'
      },
      {
        name: 'Vapor Barrier Installation',
        description: 'Installation of vapor barriers to prevent moisture problems.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-013',
        notes: 'Critical for crawl spaces and basements'
      },
      {
        name: 'Soundproofing Insulation',
        description: 'Specialized soundproofing insulation for noise reduction.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-014',
        notes: 'Includes acoustic sealants and materials'
      },
      {
        name: 'Ice Dam Prevention',
        description: 'Ice dam prevention through proper attic insulation and ventilation.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'INSUL-015',
        notes: 'Includes ventilation improvements'
      }
    ],
    suppliers: [
      { name: 'Owens Corning', category: 'Materials', contact: 'orders@owenscorning.com' },
      { name: 'Johns Manville', category: 'Materials', contact: 'support@jm.com' },
      { name: 'CertainTeed', category: 'Materials', contact: 'orders@certainteed.com' },
      { name: 'Knauf Insulation', category: 'Materials', contact: 'support@knaufinsulation.com' },
      { name: 'Huntsman', category: 'Materials', contact: 'orders@huntsman.com' },
      { name: 'Insulation Supply', category: 'Supplies', contact: 'orders@insulationsupply.com' },
      { name: 'Energy Supply', category: 'Supplies', contact: 'orders@energysupply.com' }
    ]
  },
  'Landscaping': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'storm damage','tree down','fallen tree','branch down',
        'flooding','water damage','drainage problem','standing water',
        'safety hazard','tree hazard','dead tree','diseased tree',
        'pest infestation','lawn disease','fungus','mold',
        'irrigation leak','sprinkler broken','water leak',
        'landscape emergency','immediate cleanup'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Landscape Design',
        description: 'Complete landscape design including plant selection, hardscaping, and irrigation planning.',
        duration: '1-2 weeks',
        availability: 'Monday - Friday',
        category: 'Design',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-001',
        notes: 'Includes 3D renderings and plant specifications'
      },
      {
        name: 'Lawn Installation',
        description: 'Complete lawn installation including sod, seeding, and hydroseeding.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-002',
        notes: 'Includes soil preparation and irrigation setup'
      },
      {
        name: 'Tree Planting',
        description: 'Professional tree planting including selection, planting, and staking.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-003',
        notes: 'Includes warranty and care instructions'
      },
      {
        name: 'Shrub & Plant Installation',
        description: 'Installation of shrubs, perennials, and annual plants.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-004',
        notes: 'Includes mulching and initial watering'
      },
      {
        name: 'Irrigation Installation',
        description: 'Complete irrigation system installation including sprinklers and controllers.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-005',
        notes: 'Includes permits and winterization'
      },
      {
        name: 'Hardscaping',
        description: 'Hardscaping installation including patios, walkways, and retaining walls.',
        duration: '2-5 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-006',
        notes: 'Includes materials and labor'
      },
      {
        name: 'Tree Removal',
        description: 'Professional tree removal including stump grinding and cleanup.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Removal',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-007',
        notes: 'Includes permits for protected trees'
      },
      {
        name: 'Tree Trimming',
        description: 'Professional tree trimming and pruning for health and aesthetics.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-008',
        notes: 'Includes debris removal'
      },
      {
        name: 'Lawn Mowing',
        description: 'Regular lawn mowing service including edging and cleanup.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-009',
        notes: 'Weekly or bi-weekly service available'
      },
      {
        name: 'Lawn Fertilization',
        description: 'Professional lawn fertilization program for healthy, green grass.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-010',
        notes: 'Seasonal program available'
      },
      {
        name: 'Pest Control',
        description: 'Landscape pest control including grubs, insects, and disease treatment.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-011',
        notes: 'Includes follow-up treatments'
      },
      {
        name: 'Mulching',
        description: 'Professional mulching service for beds and around trees.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-012',
        notes: 'Includes weed barrier installation'
      },
      {
        name: 'Seasonal Cleanup',
        description: 'Seasonal landscape cleanup including leaf removal and pruning.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-013',
        notes: 'Spring and fall cleanup available'
      },
      {
        name: 'Drainage Solutions',
        description: 'Landscape drainage solutions including French drains and grading.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-014',
        notes: 'Includes permits for major work'
      },
      {
        name: 'Emergency Tree Service',
        description: '24/7 emergency tree removal for storm damage and safety hazards.',
        duration: '2-8 hours',
        availability: '24/7 Emergency',
        category: 'Emergency',
        pricingType: 'fixed',
        price: '',
        sku: 'LAND-015',
        notes: 'Emergency service rates apply after hours'
      }
    ],
    suppliers: [
      { name: 'John Deere Landscapes', category: 'Equipment', contact: 'orders@johndeere.com' },
      { name: 'Toro', category: 'Equipment', contact: 'support@toro.com' },
      { name: 'Husqvarna', category: 'Equipment', contact: 'service@husqvarna.com' },
      { name: 'Stihl', category: 'Equipment', contact: 'support@stihl.com' },
      { name: 'Rain Bird', category: 'Equipment', contact: 'orders@rainbird.com' },
      { name: 'Landscape Supply', category: 'Supplies', contact: 'orders@landscapesupply.com' },
      { name: 'Nursery Supply', category: 'Supplies', contact: 'orders@nurserysupply.com' }
    ]
  },
  'Painting': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'water damage','flooding','leak','water leak',
        'peeling paint','cracked paint','paint failure',
        'mold','mildew','water stains','stain removal',
        'lead paint','asbestos','hazardous materials',
        'color matching','touch up','repair',
        'immediate painting','rush job'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Interior Painting',
        description: 'Complete interior painting including walls, ceilings, and trim work.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Painting',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-001',
        notes: 'Includes primer and two coats of paint'
      },
      {
        name: 'Exterior Painting',
        description: 'Complete exterior painting including siding, trim, and doors.',
        duration: '2-5 days',
        availability: 'Monday - Friday',
        category: 'Painting',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-002',
        notes: 'Weather-dependent scheduling'
      },
      {
        name: 'Cabinet Painting',
        description: 'Professional cabinet painting including doors, drawers, and frames.',
        duration: '3-5 days',
        availability: 'Monday - Friday',
        category: 'Painting',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-003',
        notes: 'Includes removal, painting, and reinstallation'
      },
      {
        name: 'Deck & Fence Painting',
        description: 'Deck and fence painting including pressure washing and staining.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Painting',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-004',
        notes: 'Includes wood preparation and sealing'
      },
      {
        name: 'Commercial Painting',
        description: 'Commercial painting services including offices, retail, and industrial spaces.',
        duration: '1-2 weeks',
        availability: 'Monday - Friday',
        category: 'Painting',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-005',
        notes: 'After-hours work available'
      },
      {
        name: 'Pressure Washing',
        description: 'Professional pressure washing for exterior surfaces and preparation.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Preparation',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-006',
        notes: 'Includes surface cleaning and preparation'
      },
      {
        name: 'Surface Preparation',
        description: 'Complete surface preparation including scraping, sanding, and priming.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Preparation',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-007',
        notes: 'Critical for paint adhesion and longevity'
      },
      {
        name: 'Drywall Repair',
        description: 'Professional drywall repair including patching and texturing.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-008',
        notes: 'Includes texture matching'
      },
      {
        name: 'Color Consultation',
        description: 'Professional color consultation and selection service.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Consultation',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-009',
        notes: 'Includes color samples and recommendations'
      },
      {
        name: 'Wallpaper Removal',
        description: 'Professional wallpaper removal including adhesive cleanup.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Removal',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-010',
        notes: 'Includes wall preparation for painting'
      },
      {
        name: 'Stain Removal',
        description: 'Professional stain removal and wall cleaning service.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-011',
        notes: 'Specialized cleaning solutions used'
      },
      {
        name: 'Touch-Up Painting',
        description: 'Professional touch-up painting for small repairs and corrections.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-012',
        notes: 'Color matching and blending'
      },
      {
        name: 'Primer Application',
        description: 'Professional primer application for optimal paint adhesion.',
        duration: '1 day',
        availability: 'Monday - Friday',
        category: 'Preparation',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-013',
        notes: 'Essential for new surfaces and color changes'
      },
      {
        name: 'Texturing Services',
        description: 'Wall texturing services including knockdown, orange peel, and smooth finish.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Finishing',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-014',
        notes: 'Custom texture matching available'
      },
      {
        name: 'Lead Paint Removal',
        description: 'Professional lead paint removal and abatement services.',
        duration: '2-5 days',
        availability: 'Monday - Friday',
        category: 'Specialty',
        pricingType: 'fixed',
        price: '',
        sku: 'PAINT-015',
        notes: 'Licensed and certified lead abatement'
      }
    ],
    suppliers: [
      { name: 'Sherwin Williams', category: 'Materials', contact: 'orders@sherwin.com' },
      { name: 'Benjamin Moore', category: 'Materials', contact: 'support@benjaminmoore.com' },
      { name: 'Behr', category: 'Materials', contact: 'orders@behr.com' },
      { name: 'PPG', category: 'Materials', contact: 'support@ppg.com' },
      { name: 'Valspar', category: 'Materials', contact: 'orders@valspar.com' },
      { name: 'Paint Supply', category: 'Supplies', contact: 'orders@paintsupply.com' },
      { name: 'Contractor Paint', category: 'Supplies', contact: 'orders@contractorpaint.com' }
    ]
  },
  'Plumber': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'water leak','burst pipe','flooding','water damage',
        'no water','water shut off','main water line',
        'sewer backup','drain clogged','toilet overflowing',
        'gas leak','gas smell','carbon monoxide',
        'water heater not working','no hot water','water heater leak',
        'frozen pipe','pipe burst','emergency repair'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Plumbing Repair',
        description: '24/7 emergency plumbing repair for water leaks, burst pipes, and flooding.',
        duration: '1-4 hours',
        availability: '24/7 Emergency',
        category: 'Emergency',
        pricingType: 'hourly',
        price: '',
        sku: 'PLUMB-001',
        notes: 'Emergency service rates apply after hours'
      },
      {
        name: 'Water Heater Installation',
        description: 'Complete water heater installation including gas and electric units.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-002',
        notes: 'Includes permits and inspection'
      },
      {
        name: 'Water Heater Repair',
        description: 'Professional water heater repair including tank and tankless units.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-003',
        notes: 'Includes diagnostic and parts'
      },
      {
        name: 'Drain Cleaning',
        description: 'Professional drain cleaning service using hydro-jetting and augers.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-004',
        notes: 'Includes video inspection'
      },
      {
        name: 'Pipe Installation',
        description: 'New pipe installation including copper, PEX, and PVC piping.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-005',
        notes: 'Includes permits for major work'
      },
      {
        name: 'Pipe Repair',
        description: 'Professional pipe repair including leak repair and pipe replacement.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-006',
        notes: 'Includes leak detection'
      },
      {
        name: 'Fixture Installation',
        description: 'Installation of plumbing fixtures including toilets, sinks, and faucets.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-007',
        notes: 'Per fixture pricing'
      },
      {
        name: 'Toilet Repair',
        description: 'Complete toilet repair including flapper, fill valve, and seal replacement.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-008',
        notes: 'Includes parts and labor'
      },
      {
        name: 'Sewer Line Repair',
        description: 'Professional sewer line repair including trenchless methods.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-009',
        notes: 'Includes video inspection and permits'
      },
      {
        name: 'Gas Line Installation',
        description: 'Gas line installation for appliances including furnaces and water heaters.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-010',
        notes: 'Requires permits and inspection'
      },
      {
        name: 'Leak Detection',
        description: 'Professional leak detection service using specialized equipment.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Inspection',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-011',
        notes: 'Includes detailed report and recommendations'
      },
      {
        name: 'Pipe Inspection',
        description: 'Video pipe inspection service for sewer lines and drains.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Inspection',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-012',
        notes: 'Includes video recording and report'
      },
      {
        name: 'Backflow Prevention',
        description: 'Backflow prevention device installation and testing.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-013',
        notes: 'Required for irrigation and commercial systems'
      },
      {
        name: 'Water Filtration Installation',
        description: 'Water filtration system installation including whole house and point-of-use.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-014',
        notes: 'Includes system setup and testing'
      },
      {
        name: 'Plumbing Maintenance',
        description: 'Complete plumbing system maintenance including inspection and cleaning.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'PLUMB-015',
        notes: 'Annual maintenance program available'
      }
    ],
    suppliers: [
      { name: 'Kohler', category: 'Fixtures', contact: 'orders@kohler.com' },
      { name: 'Delta', category: 'Fixtures', contact: 'support@deltafaucet.com' },
      { name: 'Moen', category: 'Fixtures', contact: 'service@moen.com' },
      { name: 'Bradford White', category: 'Equipment', contact: 'support@bradfordwhite.com' },
      { name: 'Rheem', category: 'Equipment', contact: 'service@rheem.com' },
      { name: 'Plumbing Supply', category: 'Supplies', contact: 'orders@plumbingsupply.com' },
      { name: 'Ferguson', category: 'Supplies', contact: 'orders@ferguson.com' }
    ]
  },
  'Roofing': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'roof leak','water damage','ceiling leak','rain coming in',
        'storm damage','hail damage','wind damage','missing shingles',
        'roof collapse','structural damage','safety hazard',
        'ice dams','snow damage','winter damage',
        'roof repair','immediate repair','emergency tarp',
        'insurance claim','storm restoration'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Roof Repair',
        description: '24/7 emergency roof repair including tarping and temporary fixes.',
        duration: '2-6 hours',
        availability: '24/7 Emergency',
        category: 'Emergency',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-001',
        notes: 'Emergency service rates apply after hours'
      },
      {
        name: 'Roof Replacement',
        description: 'Complete roof replacement including tear-off, decking, and new materials.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-002',
        notes: 'Includes permits and inspection'
      },
      {
        name: 'Roof Repair',
        description: 'Professional roof repair including shingle replacement and leak fixes.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-003',
        notes: 'Includes leak detection and waterproofing'
      },
      {
        name: 'Storm Damage Repair',
        description: 'Specialized storm damage repair including hail and wind damage.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-004',
        notes: 'Insurance claim assistance available'
      },
      {
        name: 'Gutter Installation',
        description: 'Complete gutter installation including seamless and sectional gutters.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-005',
        notes: 'Includes downspouts and leaf guards'
      },
      {
        name: 'Gutter Cleaning',
        description: 'Professional gutter cleaning service including debris removal.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-006',
        notes: 'Seasonal service available'
      },
      {
        name: 'Gutter Repair',
        description: 'Gutter repair service including leak fixes and reattachment.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-007',
        notes: 'Includes downspout repair'
      },
      {
        name: 'Roof Inspection',
        description: 'Comprehensive roof inspection including structural assessment.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Inspection',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-008',
        notes: 'Includes detailed report and photos'
      },
      {
        name: 'Shingle Installation',
        description: 'Professional shingle installation including asphalt, architectural, and premium shingles.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-009',
        notes: 'Includes underlayment and flashing'
      },
      {
        name: 'Metal Roof Installation',
        description: 'Metal roof installation including standing seam and corrugated panels.',
        duration: '2-4 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-010',
        notes: 'Includes insulation and ventilation'
      },
      {
        name: 'Flat Roof Installation',
        description: 'Flat roof installation including EPDM, TPO, and modified bitumen.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-011',
        notes: 'Includes drainage and insulation'
      },
      {
        name: 'Roof Ventilation',
        description: 'Roof ventilation installation including ridge vents and soffit vents.',
        duration: '1-2 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-012',
        notes: 'Improves energy efficiency and prevents ice dams'
      },
      {
        name: 'Ice Dam Removal',
        description: 'Professional ice dam removal and prevention service.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-013',
        notes: 'Includes prevention measures'
      },
      {
        name: 'Roof Maintenance',
        description: 'Complete roof maintenance including cleaning, inspection, and minor repairs.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-014',
        notes: 'Annual maintenance program available'
      },
      {
        name: 'Commercial Roofing',
        description: 'Commercial roofing services including flat roofs and membrane systems.',
        duration: '3-7 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'ROOF-015',
        notes: 'After-hours work available'
      }
    ],
    suppliers: [
      { name: 'GAF', category: 'Materials', contact: 'orders@gaf.com' },
      { name: 'Owens Corning', category: 'Materials', contact: 'support@owenscorning.com' },
      { name: 'CertainTeed', category: 'Materials', contact: 'orders@certainteed.com' },
      { name: 'Tamko', category: 'Materials', contact: 'support@tamko.com' },
      { name: 'IKO', category: 'Materials', contact: 'orders@iko.com' },
      { name: 'Roofing Supply', category: 'Supplies', contact: 'orders@roofingsupply.com' },
      { name: 'ABC Supply', category: 'Supplies', contact: 'orders@abcsupply.com' }
    ]
  },
  'Pools': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'leaking','leak','water leak','dripping',
        'pump not working','filter clogged','circulation pump',
        'no power','power off','tripping breaker','gfi tripped',
        'error code','chemical imbalance','algae','cloudy water',
        'smell burning','smoke','sparking','electrical'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Pool Installation',
        description: 'Complete pool installation including excavation, plumbing, electrical, and finishing.',
        duration: '2-4 weeks',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'POOL-001',
        notes: 'Requires permits and inspections'
      },
      {
        name: 'Pool Repair',
        description: 'Professional repair service for pool equipment, plumbing, and structural issues.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'POOL-002',
        notes: 'Includes diagnostic and parts (parts charged separately)'
      },
      {
        name: 'Pool Maintenance',
        description: 'Regular maintenance service including cleaning, chemical balancing, and equipment check.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'POOL-003',
        notes: 'Weekly, bi-weekly, or monthly service available'
      },
      {
        name: 'Pool Opening',
        description: 'Spring opening service including cleaning, equipment startup, and chemical balancing.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'POOL-004',
        notes: 'Seasonal service typically done in spring'
      },
      {
        name: 'Pool Closing',
        description: 'Winter closing service including cleaning, equipment winterization, and cover installation.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'POOL-005',
        notes: 'Seasonal service typically done in fall'
      },
      {
        name: 'Pool Equipment Repair',
        description: 'Repair service for pumps, filters, heaters, and other pool equipment.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'POOL-006',
        notes: 'Specialized equipment repair'
      },
      {
        name: 'Pool Cleaning',
        description: 'Professional pool cleaning service including skimming, vacuuming, and brushing.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'POOL-007',
        notes: 'Regular cleaning service'
      },
      {
        name: 'Pool Leak Detection',
        description: 'Professional leak detection service using specialized equipment.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'POOL-008',
        notes: 'Advanced leak detection technology'
      }
    ],
    suppliers: [
      { name: 'Pentair', category: 'Equipment', contact: 'sales@pentair.com' },
      { name: 'Hayward', category: 'Equipment', contact: 'support@hayward.com' },
      { name: 'Jandy', category: 'Equipment', contact: 'info@jandy.com' },
      { name: 'Pool Supply World', category: 'Supplies', contact: 'orders@poolsupplyworld.com' }
    ]
  },
  'Sauna & Icebath': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'not heating','heater not working','temperature low',
        'not cooling','temperature high','chiller not working',
        'no power','power off','tripping breaker','gfi tripped',
        'error code','heater error','thermostat not working',
        'smell burning','smoke','sparking','electrical',
        'door not sealing','glass cracked','wood damage'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Sauna Installation',
        description: 'Complete sauna installation including electrical hookup, ventilation, and finishing.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'SAUNA-001',
        notes: 'Requires electrical permit and proper ventilation'
      },
      {
        name: 'Sauna Repair',
        description: 'Professional repair service for sauna heaters, controls, and structural issues.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'SAUNA-002',
        notes: 'Includes diagnostic and parts (parts charged separately)'
      },
      {
        name: 'Sauna Maintenance',
        description: 'Regular maintenance service including cleaning, heater check, and wood care.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SAUNA-003',
        notes: 'Monthly or quarterly service available'
      },
      {
        name: 'Heater Repair',
        description: 'Specialized repair service for sauna heaters and heating elements.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'SAUNA-004',
        notes: 'Specialized heater equipment repair'
      },
      {
        name: 'Sauna Cleaning',
        description: 'Professional cleaning service for sauna interior and wood surfaces.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SAUNA-005',
        notes: 'Deep cleaning and wood treatment'
      },
      {
        name: 'Control Panel Repair',
        description: 'Repair service for sauna control panels and temperature controls.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'SAUNA-006',
        notes: 'Control system repair and calibration'
      },
      {
        name: 'Wood Repair',
        description: 'Repair service for sauna wood panels, benches, and structural elements.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'SAUNA-007',
        notes: 'Wood repair and replacement'
      },
      {
        name: 'Door & Glass Repair',
        description: 'Repair service for sauna doors, glass panels, and sealing systems.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'SAUNA-008',
        notes: 'Door and glass repair service'
      },
      {
        name: 'Cold Plunge Installation',
        description: 'Complete cold plunge installation including plumbing, electrical, and chiller setup.',
        duration: '1-3 days',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'COLD-001',
        notes: 'Requires electrical permit and proper drainage'
      },
      {
        name: 'Cold Plunge Repair',
        description: 'Professional repair service for cold plunge equipment and systems.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'COLD-002',
        notes: 'Includes diagnostic and parts (parts charged separately)'
      },
      {
        name: 'Cold Plunge Maintenance',
        description: 'Regular maintenance service including cleaning, sanitizing, and equipment check.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'COLD-003',
        notes: 'Weekly or bi-weekly service available'
      },
      {
        name: 'Chiller Repair',
        description: 'Specialized repair service for cold plunge chillers and cooling systems.',
        duration: '2-6 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'COLD-004',
        notes: 'Specialized chiller equipment repair'
      },
      {
        name: 'Cold Plunge Cleaning',
        description: 'Professional cleaning and sanitizing service for cold plunge units.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'COLD-005',
        notes: 'Deep cleaning and sanitization'
      },
      {
        name: 'Temperature Control Repair',
        description: 'Repair service for temperature control systems and sensors.',
        duration: '1-3 hours',
        availability: 'Monday - Friday',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        sku: 'COLD-006',
        notes: 'Temperature control system repair'
      }
    ],
    suppliers: [
      { name: 'Finnleo', category: 'Equipment', contact: 'service@finnleo.com' },
      { name: 'Harvia', category: 'Equipment', contact: 'support@harvia.com' },
      { name: 'SaunaCore', category: 'Equipment', contact: 'info@saunacore.com' },
      { name: 'Cold Plunge Co', category: 'Equipment', contact: 'support@coldplungeco.com' },
      { name: 'Ice Barrel', category: 'Equipment', contact: 'service@icebarrel.com' },
      { name: 'Plunge', category: 'Equipment', contact: 'help@plunge.com' },
      { name: 'Sauna Supply', category: 'Supplies', contact: 'orders@saunasupply.com' },
      { name: 'Cold Therapy Supply', category: 'Supplies', contact: 'orders@coldtherapysupply.com' }
    ]
  },
  'Hot tub & Spa': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'notify@ringcentral.com', 'notify.ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'noreply@reports.connecteam.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','immediately','emergency',
        'leaking','leak','water leak','dripping',
        'won\'t heat','not heating','cold water','temp low','heater error',
        'no power','power off','tripping breaker','gfi tripped',
        'error code','flo','hl','dr','oh',
        'pump not working','jets not working','motor noise','circulation pump',
        'smell burning','smoke','sparking','electrical'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Hot Tub Repair',
        description: 'Professional repair service for hot tub issues, malfunctions, and breakdowns.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-001',
        notes: 'Includes diagnostic and parts (parts charged separately)'
      },
      {
        name: 'Hot Tub Installation',
        description: 'Complete hot tub installation including electrical hookup and setup.',
        duration: '4-8 hours',
        availability: 'Monday - Friday',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-002',
        notes: 'Requires electrical permit and inspection'
      },
      {
        name: 'Hot Tub Maintenance',
        description: 'Regular maintenance service to keep your hot tub in optimal condition.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-003',
        notes: 'Recommended quarterly'
      },
      {
        name: 'Water Testing & Treatment',
        description: 'Professional water testing & treatment for balanced, safe spa water.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-004',
        notes: 'Includes chemical balance and sanitization'
      },
      {
        name: 'Hot Tub Cleaning',
        description: 'Deep cleaning service including drain, clean, and refill.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-005',
        notes: 'Includes filter cleaning'
      },
      {
        name: 'Winterization',
        description: 'Seasonal winterization to protect your hot tub during cold months.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Seasonal',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-006',
        notes: 'Recommended before winter'
      },
      {
        name: 'Parts Replacement',
        description: 'Replacement of worn or damaged hot tub components and parts.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-007',
        notes: 'Parts charged separately'
      },
      {
        name: 'Pump Repair',
        description: 'Repair or replacement of hot tub pump and motor systems.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-008',
        notes: 'Includes pump diagnostic'
      },
      {
        name: 'Heater Repair',
        description: 'Repair or replacement of hot tub heating elements and systems.',
        duration: '2-4 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-009',
        notes: 'Includes heater diagnostic'
      },
      {
        name: 'Cover Replacement',
        description: 'Replacement of worn or damaged hot tub covers.',
        duration: '2 hours',
        availability: 'Monday - Friday',
        category: 'Accessories',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-010',
        notes: 'Custom covers available'
      },
      {
        name: 'Filter Replacement',
        description: 'Replacement of hot tub filters for optimal water filtration.',
        duration: '1-2 hours',
        availability: 'Monday - Friday',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-011',
        notes: 'Filters charged separately'
      },
      {
        name: 'Inspection & Diagnostics',
        description: 'Comprehensive inspection and diagnostic service for hot tubs.',
        duration: '1 hour',
        availability: 'Monday - Friday',
        category: 'Service',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-012',
        notes: 'Includes written report'
      },
      {
        name: 'Emergency Service',
        description: 'Priority emergency service for urgent hot tub issues.',
        duration: '2 hours',
        availability: '24/7',
        category: 'Service',
        pricingType: 'hourly',
        price: '',
        sku: 'SVC-013',
        notes: 'Emergency rate applies'
      },
      {
        name: 'Moving & Relocation',
        description: 'Professional hot tub moving and relocation service.',
        duration: '4-8 hours',
        availability: 'Monday - Friday',
        category: 'Service',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-014',
        notes: 'Crane may be required for difficult moves'
      },
      {
        name: 'Consultation',
        description: 'Expert consultation for hot tub selection, installation, and maintenance.',
        duration: '1 hour',
        availability: 'Monday - Friday',
        category: 'Service',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-015',
        notes: 'Free with purchase'
      },
      {
        name: 'Spa Treatment Packages',
        description: 'Complete spa treatment packages for ongoing maintenance and care.',
        duration: '2 hours',
        availability: 'Monday - Friday',
        category: 'Service',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-016',
        notes: 'Monthly or quarterly packages available'
      },
      {
        name: 'Service Call',
        description: 'Standard service call for hot tub visits and appointments.',
        duration: '2 hours',
        availability: 'Monday - Friday',
        category: 'Service',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-017',
        notes: 'Service fee may be waived with repair'
      },
      {
        name: 'Valet Service',
        description: 'Concierge-level service for premium hot tub care and maintenance.',
        duration: '2 hours',
        availability: 'Monday - Friday',
        category: 'Service',
        pricingType: 'fixed',
        price: '',
        sku: 'SVC-018',
        notes: 'Premium service tier'
      }
    ],
    linkPaths: {
      bookingForm: '/repairs',
      catalog: '/hot-tub-spas',
      treatmentPackages: '/treatment-packages',
      supplies: '/category/all-products'
    },
    supplierTemplates: [
      { name: 'Aqua Spa Supply', domains: ['asp-supply.com'] },
      { name: 'Strong Spas', domains: ['strong9.com'] },
      { name: 'Balboa Water Group', domains: ['balboawater.com','balboadirect.com'] },
      { name: 'Gecko Alliance', domains: ['geckoalliance.com','geckoinfo.com'] },
      { name: 'Pentair', domains: ['pentair.com'] },
      { name: 'Hayward', domains: ['hayward.com'] },
      { name: 'Waterway Plastics', domains: ['waterwayplastics.com'] },
      { name: 'CMP (Custom Molded Products)', domains: ['cmpusa.com'] },
      { name: 'Pleatco', domains: ['pleatco.com'] },
      { name: 'Leisure Concepts', domains: ['leisureconcepts.com'] },
      { name: 'CoverMate / CoverLift', domains: ['covermate.com','coverlift.com'] },
      { name: 'AquaChek', domains: ['aquachek.com'] },
      { name: 'Coast Spas', domains: ['coastspas.com'] },
      { name: 'Jacuzzi', domains: ['jacuzzi.com'] },
      { name: 'Sundance Spas', domains: ['sundancespas.com'] }
    ]
  },
  'Cold Plunge': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','not cooling','won\'t start','error code','no power','leak','emergency'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Cold Plunge Installation & Setup',
        description: 'Professional installation, electrical hookup, and initial setup of cold plunge tub.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: ''
      },
      {
        name: 'Cold Plunge Maintenance Service',
        description: 'Regular cleaning, filter replacement, water treatment, and system check.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: ''
      },
      {
        name: 'Cold Plunge Repair Service',
        description: 'Troubleshooting and repair of pumps, heaters, filters, and electrical components.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: ''
      }
    ],
    linkPaths: {
      bookingForm: '/cold-plunge-service',
      catalog: '/cold-plunge-tubs',
      treatmentPackages: '/cold-therapy-packages',
      supplies: '/cold-plunge-supplies'
    },
    supplierTemplates: [
      { name: 'ChillTech', domains: ['chilltech.com'] },
      { name: 'Polar Monkeys', domains: ['polar-monkeys.com'] },
      { name: 'The Cold Life', domains: ['thecoldlife.com'] },
      { name: 'Ice Barrel', domains: ['icebarrel.com'] },
      { name: 'Cold Plunge Supply', domains: ['coldplungesupply.com'] }
    ]
  },
  'HVAC': {
    rules: {
      phoneProvider: {
        name: 'RingCentral',
        senders: ['service@ringcentral.com', 'dispatch@ringcentral.com']
      },
      crmAlertEmails: ['alerts@servicetitan.com', 'dispatch@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','asap','immediately',
        'no heat','no heating','furnace not working','boiler down',
        'no air conditioning','ac not working','no cooling',
        'gas leak','carbon monoxide','gas smell','pilot light out',
        'thermostat not working','temperature emergency','freezing','overheating',
        'strange noises','burning smell','smoke','electrical burning',
        'water leak','flooding','system failure','emergency repair'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency HVAC Service Call',
        description: '24/7 emergency service for no heat, no AC, gas leaks, or system failures.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Emergency after-hours rates apply'
      },
      {
        name: 'HVAC System Installation',
        description: 'Complete furnace, AC, heat pump, or ductless system installation with permits.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes system design and permit coordination'
      },
      {
        name: 'Seasonal Maintenance Tune-up',
        description: 'Comprehensive heating or cooling system inspection, cleaning, and efficiency testing.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Spring AC tune-up or Fall furnace tune-up'
      },
      {
        name: 'HVAC Repair Service',
        description: 'Diagnostic and repair of heating, cooling, ventilation, and air quality systems.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Written estimate provided before repairs'
      },
      {
        name: 'Indoor Air Quality Assessment',
        description: 'Complete air quality testing, duct inspection, and filtration system evaluation.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes air quality report and recommendations'
      }
    ],
    linkPaths: {
      bookingForm: '/hvac-service',
      catalog: '/hvac-systems',
      treatmentPackages: '/hvac-maintenance-plans',
      supplies: '/hvac-parts-filters'
    },
    supplierTemplates: [
      { name: 'Carrier', domains: ['carrier.com'] },
      { name: 'Trane', domains: ['trane.com'] },
      { name: 'Lennox', domains: ['lennox.com'] },
      { name: 'Rheem', domains: ['rheem.com'] },
      { name: 'Goodman', domains: ['goodmanmfg.com'] },
      { name: 'York', domains: ['york.com'] },
      { name: 'American Standard', domains: ['americanstandardair.com'] },
      { name: 'Bryant', domains: ['bryant.com'] },
      { name: 'Aprilaire', domains: ['aprilaire.com'] },
      { name: 'Honeywell', domains: ['honeywell.com'] },
      { name: 'Nest', domains: ['nest.com'] },
      { name: 'Ecobee', domains: ['ecobee.com'] }
    ]
  },
  'Electrician': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'emergency@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'dispatch@servicetitan.com'],
      urgentKeywords: [
        'urgent','emergency','asap','immediately','life safety',
        'power outage','no power','power failure','blackout',
        'electrical fire','smoke','burning smell','sparking','arcing',
        'exposed wires','live wires','electrocution hazard',
        'breaker tripping','circuit breaker','gfci tripping',
        'outlet not working','switch not working','light not working',
        'electrical panel','main breaker','service entrance',
        'code violation','safety inspection','permit required'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Electrical Service',
        description: '24/7 emergency electrical repairs for power outages, safety hazards, and critical failures.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Licensed electrician response within 2 hours'
      },
      {
        name: 'Electrical Panel Upgrade',
        description: 'Main service panel upgrade, subpanel installation, or panel replacement.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes permit and inspection coordination'
      },
      {
        name: 'Electrical Safety Inspection',
        description: 'Comprehensive electrical safety inspection with detailed report and recommendations.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes thermal imaging and code compliance check'
      },
      {
        name: 'New Construction Wiring',
        description: 'Complete electrical rough-in and finish work for new construction projects.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Licensed and insured electrical contractor'
      },
      {
        name: 'Smart Home Wiring',
        description: 'Pre-wiring for smart home systems, EV charging stations, and home automation.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Future-ready wiring for technology upgrades'
      }
    ],
    linkPaths: {
      bookingForm: '/electrical-service',
      catalog: '/electrical-services',
      treatmentPackages: '/electrical-maintenance-plans',
      supplies: '/electrical-supplies'
    },
    supplierTemplates: [
      { name: 'Schneider Electric', domains: ['schneider-electric.com'] },
      { name: 'Siemens', domains: ['siemens.com'] },
      { name: 'Eaton', domains: ['eaton.com'] },
      { name: 'Square D', domains: ['squared.com'] },
      { name: 'GE', domains: ['ge.com'] },
      { name: 'Leviton', domains: ['leviton.com'] },
      { name: 'Lutron', domains: ['lutron.com'] },
      { name: 'Pass & Seymour', domains: ['passandsemour.com'] },
      { name: 'Hubbell', domains: ['hubbell.com'] },
      { name: 'Milbank', domains: ['milbankmfg.com'] },
      { name: 'Murray', domains: ['murray.com'] },
      { name: 'Cutler-Hammer', domains: ['cutler-hammer.com'] }
    ]
  },
  'Plumber': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'emergency@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'dispatch@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','asap','immediately','burst pipe','flooding',
        'water leak','leak','dripping','flood','water damage',
        'no water','no hot water','water heater','boiler',
        'sewage backup','sewer','drain backup','toilet overflow',
        'gas leak','gas smell','pilot light','carbon monoxide',
        'frozen pipes','pipe burst','pipe break','broken pipe',
        'sump pump','basement flooding','water main break'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Plumbing Service',
        description: '24/7 emergency plumbing for leaks, floods, backups, and critical failures.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Licensed plumber response within 2 hours'
      },
      {
        name: 'Water Heater Installation',
        description: 'Tank, tankless, or hybrid water heater installation with code compliance.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes removal of old unit and permit coordination'
      },
      {
        name: 'Drain Cleaning Service',
        description: 'Professional drain cleaning for clogs, slow drains, and sewer line issues.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Video camera inspection included'
      },
      {
        name: 'Pipe Repair & Replacement',
        description: 'Copper, PEX, or PVC pipe repair and replacement services.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Trenchless options available when possible'
      },
      {
        name: 'Fixture Installation',
        description: 'Toilet, faucet, sink, shower, or tub installation and replacement.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes all necessary plumbing modifications'
      }
    ],
    linkPaths: {
      bookingForm: '/plumbing-service',
      catalog: '/plumbing-services',
      treatmentPackages: '/plumbing-maintenance-plans',
      supplies: '/plumbing-supplies'
    },
    supplierTemplates: [
      { name: 'Rheem', domains: ['rheem.com'] },
      { name: 'Bradford White', domains: ['bradfordwhite.com'] },
      { name: 'AO Smith', domains: ['aosmith.com'] },
      { name: 'State Water Heaters', domains: ['statewaterheaters.com'] },
      { name: 'Delta Faucet', domains: ['deltafaucet.com'] },
      { name: 'Moen', domains: ['moen.com'] },
      { name: 'Kohler', domains: ['kohler.com'] },
      { name: 'American Standard', domains: ['americanstandard-us.com'] },
      { name: 'Toto', domains: ['toto.com'] },
      { name: 'Grohe', domains: ['grohe.com'] },
      { name: 'Pfister', domains: ['pfisterfaucets.com'] },
      { name: 'Milwaukee', domains: ['milwaukeetool.com'] }
    ]
  },
  'Drywall & Ceiling Tile Installer': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','emergency','immediate','water damage','flood damage',
        'ceiling collapse','structural damage','hole in wall','drywall damage',
        'mold damage','moisture damage','ceiling leak','roof leak',
        'insurance claim','storm damage','fire damage','renovation emergency'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Drywall Repair',
        description: 'Emergency drywall and ceiling repairs for water damage, holes, and structural issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: '24/7 emergency response available'
      },
      {
        name: 'New Construction Drywall',
        description: 'Complete drywall hanging, taping, and finishing for new construction projects.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes texture matching and paint preparation'
      },
      {
        name: 'Ceiling Tile Installation',
        description: 'Drop ceiling installation, replacement, and repair services.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Commercial and residential ceiling systems'
      },
      {
        name: 'Drywall Texture & Finish',
        description: 'Professional drywall texturing, skim coating, and finishing services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Match existing textures and finishes'
      },
      {
        name: 'Insurance Restoration',
        description: 'Complete drywall and ceiling restoration for insurance claims and damage repair.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        notes: 'Work directly with insurance adjusters'
      }
    ],
    linkPaths: {
      bookingForm: '/drywall-service',
      catalog: '/drywall-services',
      treatmentPackages: '/drywall-maintenance-plans',
      supplies: '/drywall-supplies'
    },
    supplierTemplates: [
      { name: 'USG', domains: ['usg.com'] },
      { name: 'CertainTeed', domains: ['certainteed.com'] },
      { name: 'National Gypsum', domains: ['nationalgypsum.com'] },
      { name: 'Georgia-Pacific', domains: ['gp.com'] },
      { name: 'Armstrong Ceilings', domains: ['armstrongceilings.com'] },
      { name: 'USG Ceilings', domains: ['usgceilings.com'] },
      { name: 'Rockfon', domains: ['rockfon.com'] },
      { name: 'Owatonna', domains: ['owatonnaplanning.com'] },
      { name: 'Celotex', domains: ['celotex.co.uk'] },
      { name: 'Ferguson', domains: ['ferguson.com'] },
      { name: 'HD Supply', domains: ['hdsupply.com'] },
      { name: 'Lowe\'s Pro', domains: ['lowespro.com'] }
    ]
  },
  'Carpenter': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','structural damage','roof damage','framing damage',
        'deck collapse','stair failure','railing failure','safety hazard',
        'water damage','rot damage','termite damage','foundation settling',
        'permit violation','code violation','inspection failure'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Structural Repair',
        description: 'Emergency framing, structural repairs, and safety hazard corrections.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Licensed contractor response for safety issues'
      },
      {
        name: 'Custom Carpentry & Millwork',
        description: 'Custom cabinets, built-ins, trim work, and architectural millwork.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Design consultation and detailed estimates'
      },
      {
        name: 'Deck Construction & Repair',
        description: 'Custom deck design, construction, repair, and maintenance services.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes permit coordination and material selection'
      },
      {
        name: 'Interior Trim & Finish Work',
        description: 'Interior trim installation, crown molding, wainscoting, and finish carpentry.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Seamless integration with existing architecture'
      },
      {
        name: 'Door & Window Installation',
        description: 'Interior/exterior door installation, window replacement, and hardware installation.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Energy-efficient options and code compliance'
      }
    ],
    linkPaths: {
      bookingForm: '/carpentry-service',
      catalog: '/carpentry-services',
      treatmentPackages: '/carpentry-maintenance-plans',
      supplies: '/carpentry-supplies'
    },
    supplierTemplates: [
      { name: 'Andersen Windows', domains: ['andersenwindows.com'] },
      { name: 'Pella', domains: ['pella.com'] },
      { name: 'Marvin Windows', domains: ['marvin.com'] },
      { name: 'Therma-Tru', domains: ['thermatru.com'] },
      { name: 'Masonite', domains: ['masonite.com'] },
      { name: 'Simpson Door Company', domains: ['simpsondoor.com'] },
      { name: 'Feeney CableRail', domains: ['feeneyinc.com'] },
      { name: 'Trex', domains: ['trex.com'] },
      { name: 'TimberTech', domains: ['timbertech.com'] },
      { name: 'Azek', domains: ['azek.com'] },
      { name: 'Westbury Aluminum Railing', domains: ['westburyaluminum.com'] },
      { name: 'Crown Heritage', domains: ['crownheritage.com'] }
    ]
  },
  'Welder': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'mobile@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: [
        'urgent','emergency','structural failure','crack','break','failure',
        'safety hazard','collapse risk','load bearing','critical weld',
        'equipment failure','machinery breakdown','production stoppage',
        'certification required','code violation','inspection failure'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Welding Repair',
        description: 'Emergency welding repairs for structural failures, equipment breakdowns, and safety hazards.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Certified welder response for critical repairs'
      },
      {
        name: 'Mobile Welding Service',
        description: 'On-site welding services for construction, repair, and fabrication projects.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Fully equipped mobile welding unit'
      },
      {
        name: 'Structural Steel Fabrication',
        description: 'Custom steel fabrication, beams, columns, and structural components.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'AWS certified welding and fabrication'
      },
      {
        name: 'Equipment Repair & Modification',
        description: 'Heavy equipment repair, modification, and preventive maintenance welding.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Specialized in industrial and construction equipment'
      },
      {
        name: 'Pipeline & Pressure Vessel Welding',
        description: 'Certified welding for pipelines, pressure vessels, and high-pressure systems.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'ASME certified welding procedures'
      }
    ],
    linkPaths: {
      bookingForm: '/welding-service',
      catalog: '/welding-services',
      treatmentPackages: '/welding-maintenance-plans',
      supplies: '/welding-supplies'
    },
    supplierTemplates: [
      { name: 'Lincoln Electric', domains: ['lincolnelectric.com'] },
      { name: 'Miller Electric', domains: ['millerwelds.com'] },
      { name: 'ESAB', domains: ['esab.com'] },
      { name: 'Hobart', domains: ['hobartbrothers.com'] },
      { name: 'Hypertherm', domains: ['hypertherm.com'] },
      { name: 'Victor Technologies', domains: ['victortechnologies.com'] },
      { name: 'Airgas', domains: ['airgas.com'] },
      { name: 'Praxair', domains: ['praxair.com'] },
      { name: 'Matheson Tri-Gas', domains: ['mathesontri-gas.com'] },
      { name: 'TW Metals', domains: ['twmetals.com'] },
      { name: 'Ryerson', domains: ['ryerson.com'] },
      { name: 'Metals Depot', domains: ['metalsdepot.com'] }
    ]
  },
  'Roofer': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'emergency@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','leak','roof leak','water damage','flooding',
        'storm damage','wind damage','hail damage','tree damage',
        'ceiling leak','interior damage','structural damage',
        'insurance claim','adjuster meeting','tarping needed'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Roof Repair & Tarping',
        description: 'Emergency roof repairs, leak stopping, and protective tarping services.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: '24/7 emergency response with tarping'
      },
      {
        name: 'Roof Replacement',
        description: 'Complete roof replacement with premium materials and warranty coverage.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Multiple material options and warranty packages'
      },
      {
        name: 'Roof Inspection & Assessment',
        description: 'Comprehensive roof inspection with detailed report and repair recommendations.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes drone photography and thermal imaging'
      },
      {
        name: 'Roof Repair Service',
        description: 'Targeted roof repairs for leaks, damaged shingles, flashing, and ventilation issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Written estimate before all repairs'
      },
      {
        name: 'Insurance Claim Assistance',
        description: 'Complete insurance claim support including documentation, estimates, and adjuster coordination.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Work directly with insurance companies'
      }
    ],
    linkPaths: {
      bookingForm: '/roofing-service',
      catalog: '/roofing-services',
      treatmentPackages: '/roofing-maintenance-plans',
      supplies: '/roofing-supplies'
    },
    supplierTemplates: [
      { name: 'GAF', domains: ['gaf.com'] },
      { name: 'CertainTeed', domains: ['certainteed.com'] },
      { name: 'Owens Corning', domains: ['owenscorning.com'] },
      { name: 'TAMKO', domains: ['tamko.com'] },
      { name: 'IKO', domains: ['iko.com'] },
      { name: 'Atlas Roofing', domains: ['atlasroofing.com'] },
      { name: 'Johns Manville', domains: ['jm.com'] },
      { name: 'Firestone Building Products', domains: ['firestonebpco.com'] },
      { name: 'Versico', domains: ['versico.com'] },
      { name: 'Carlisle SynTec', domains: ['carlislesyntec.com'] },
      { name: 'ABC Supply', domains: ['abcsupply.com'] },
      { name: 'Beacon Roofing Supply', domains: ['beaconroofingsupply.com'] }
    ]
  },
  'Painter': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','emergency','water damage','mold','mildew',
        'peeling paint','bubbling paint','flaking','chipping',
        'staining','discoloration','color mismatch','paint failure',
        'interior damage','exterior damage','weather damage'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Interior Painting',
        description: 'Professional interior painting for residential and commercial properties.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes surface preparation and cleanup'
      },
      {
        name: 'Exterior Painting',
        description: 'Exterior house painting with weather-resistant paints and proper surface preparation.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Power washing and surface preparation included'
      },
      {
        name: 'Commercial Painting',
        description: 'Large-scale commercial painting projects with minimal business disruption.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'After-hours and weekend scheduling available'
      },
      {
        name: 'Paint Correction & Repair',
        description: 'Paint repair for damage, discoloration, and surface imperfections.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Color matching and seamless repairs'
      },
      {
        name: 'Color Consultation',
        description: 'Professional color consultation and design services with digital mockups.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes color samples and digital visualization'
      }
    ],
    linkPaths: {
      bookingForm: '/painting-service',
      catalog: '/painting-services',
      treatmentPackages: '/painting-maintenance-plans',
      supplies: '/painting-supplies'
    },
    supplierTemplates: [
      { name: 'Sherwin-Williams', domains: ['sherwin-williams.com'] },
      { name: 'Benjamin Moore', domains: ['benjaminmoore.com'] },
      { name: 'PPG Paints', domains: ['ppgpaints.com'] },
      { name: 'Behr', domains: ['behr.com'] },
      { name: 'Dunn-Edwards', domains: ['dunnedwards.com'] },
      { name: 'Kelly-Moore', domains: ['kellymoore.com'] },
      { name: 'Glidden', domains: ['glidden.com'] },
      { name: 'Valspar', domains: ['valspar.com'] },
      { name: 'Dutch Boy', domains: ['dutchboy.com'] },
      { name: 'Kilz', domains: ['kilz.com'] },
      { name: 'Zinsser', domains: ['zinsser.com'] },
      { name: 'California Paints', domains: ['californiapaints.com'] }
    ]
  },
  'Insulation Installer': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','asap','moisture damage','mold','water damage',
        'ice dams','ice damming','frozen pipes','energy loss',
        'high energy bills','cold rooms','hot attic','temperature issues'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Insulation Repair',
        description: 'Emergency insulation repairs for water damage, mold, and critical energy loss issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Rapid response for urgent insulation issues'
      },
      {
        name: 'Attic Insulation Installation',
        description: 'Complete attic insulation installation with air sealing and ventilation improvements.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Energy efficiency assessment included'
      },
      {
        name: 'Wall Insulation Services',
        description: 'Interior and exterior wall insulation for improved energy efficiency and comfort.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Multiple insulation types available'
      },
      {
        name: 'Crawl Space Encapsulation',
        description: 'Complete crawl space encapsulation with moisture barrier and insulation.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes sump pump and dehumidifier installation'
      },
      {
        name: 'Energy Efficiency Audit',
        description: 'Comprehensive energy audit with thermal imaging and efficiency recommendations.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Detailed report with ROI calculations'
      }
    ],
    linkPaths: {
      bookingForm: '/insulation-service',
      catalog: '/insulation-services',
      treatmentPackages: '/insulation-maintenance-plans',
      supplies: '/insulation-supplies'
    },
    supplierTemplates: [
      { name: 'Owens Corning', domains: ['owenscorning.com'] },
      { name: 'Johns Manville', domains: ['jm.com'] },
      { name: 'Knauf Insulation', domains: ['knaufinsulation.com'] },
      { name: 'Rockwool', domains: ['rockwool.com'] },
      { name: 'CertainTeed', domains: ['certainteed.com'] },
      { name: 'Dow Chemical', domains: ['dow.com'] },
      { name: 'BASF', domains: ['basf.com'] },
      { name: 'Icynene', domains: ['icynene.com'] },
      { name: 'Demilec', domains: ['demilec.com'] },
      { name: 'Lapolla', domains: ['lapolla.com'] },
      { name: 'IDI Distributors', domains: ['ididistributors.com'] },
      { name: 'Atlas Roofing', domains: ['atlasroofing.com'] }
    ]
  },
  'Landscaping & Lawn Care': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','storm damage','tree down','flooding',
        'drainage issue','standing water','erosion','slope failure',
        'irrigation failure','sprinkler broken','leak','water waste',
        'disease outbreak','pest infestation','lawn damage','dead grass',
        'safety hazard','falling branches','tree removal','stump grinding'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Storm Cleanup',
        description: 'Emergency tree removal, debris cleanup, and storm damage restoration.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: '24/7 emergency response for storm damage'
      },
      {
        name: 'Lawn Maintenance Service',
        description: 'Regular mowing, edging, trimming, and basic lawn care services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Weekly, bi-weekly, or monthly service options'
      },
      {
        name: 'Landscape Design & Installation',
        description: 'Complete landscape design, plant selection, and installation services.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes design consultation and 3D renderings'
      },
      {
        name: 'Irrigation System Service',
        description: 'Sprinkler system installation, repair, maintenance, and winterization.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'starting',
        price: '',
        notes: 'Smart irrigation system upgrades available'
      },
      {
        name: 'Tree & Shrub Care',
        description: 'Tree pruning, shrub trimming, disease treatment, and fertilization.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Certified arborist services available'
      }
    ],
    linkPaths: {
      bookingForm: '/landscaping-service',
      catalog: '/landscaping-services',
      treatmentPackages: '/landscaping-maintenance-plans',
      supplies: '/landscaping-supplies'
    },
    supplierTemplates: [
      { name: 'John Deere', domains: ['deere.com'] },
      { name: 'Husqvarna', domains: ['husqvarna.com'] },
      { name: 'Toro', domains: ['toro.com'] },
      { name: 'Rain Bird', domains: ['rainbird.com'] },
      { name: 'Hunter Industries', domains: ['hunterindustries.com'] },
      { name: 'Orbit Irrigation', domains: ['orbitonline.com'] },
      { name: 'Scotts', domains: ['scotts.com'] },
      { name: 'Miracle-Gro', domains: ['miraclegro.com'] },
      { name: 'Bayer', domains: ['bayer.com'] },
      { name: 'Bonide', domains: ['bonide.com'] },
      { name: 'Spectracide', domains: ['spectracide.com'] },
      { name: 'Ortho', domains: ['ortho.com'] }
    ]
  },
  'Flooring Installer': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','water damage','flooding','floor buckling',
        'floor separation','gaps','cracking','loose tiles','safety hazard',
        'trip hazard','uneven floor','squeaking','sagging','structural damage',
        'mold under floor','moisture damage','installation failure'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Floor Repair',
        description: 'Emergency floor repairs for water damage, safety hazards, and structural issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Rapid response for safety and water damage issues'
      },
      {
        name: 'Floor Installation Service',
        description: 'Professional installation of hardwood, laminate, tile, vinyl, and carpet flooring.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes subfloor preparation and material handling'
      },
      {
        name: 'Floor Refinishing & Restoration',
        description: 'Hardwood floor sanding, staining, and refinishing services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Eco-friendly finishing options available'
      },
      {
        name: 'Floor Repair & Maintenance',
        description: 'Tile replacement, carpet repair, and general floor maintenance services.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Color and pattern matching guaranteed'
      },
      {
        name: 'Commercial Flooring',
        description: 'Commercial grade flooring installation and maintenance for businesses.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'After-hours installation available'
      }
    ],
    linkPaths: {
      bookingForm: '/flooring-service',
      catalog: '/flooring-services',
      treatmentPackages: '/flooring-maintenance-plans',
      supplies: '/flooring-supplies'
    },
    supplierTemplates: [
      { name: 'Shaw Floors', domains: ['shawfloors.com'] },
      { name: 'Mohawk', domains: ['mohawkflooring.com'] },
      { name: 'Armstrong Flooring', domains: ['armstrongflooring.com'] },
      { name: 'Mannington', domains: ['mannington.com'] },
      { name: 'Pergo', domains: ['pergo.com'] },
      { name: 'Karndean', domains: ['karndean.com'] },
      { name: 'Luxury Vinyl Plank', domains: ['lvp.com'] },
      { name: 'Lumber Liquidators', domains: ['lumberliquidators.com'] },
      { name: 'Floor & Decor', domains: ['flooranddecor.com'] },
      { name: 'Home Depot Pro', domains: ['homedepot.com'] },
      { name: 'Lowe\'s Pro', domains: ['lowespro.com'] },
      { name: 'Ferguson', domains: ['ferguson.com'] }
    ]
  },
  'Locksmith': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'emergency@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'dispatch@servicetitan.com'],
      urgentKeywords: [
        'urgent','emergency','locked out','key lost','broken key',
        'lock broken','deadbolt stuck','door won\'t open','security breach',
        'break-in','burglary','theft','stolen keys','unauthorized access',
        'safe locked','vault locked','car locked','commercial lockout',
        'after hours','weekend emergency','holiday emergency'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Lockout Service',
        description: '24/7 emergency lockout service for homes, cars, and businesses.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Response time within 30 minutes'
      },
      {
        name: 'Lock Installation & Rekeying',
        description: 'Professional lock installation, rekeying, and security upgrades.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes security assessment and recommendations'
      },
      {
        name: 'Safe Opening & Repair',
        description: 'Safe opening, repair, and maintenance services for residential and commercial safes.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Certified safe technician services'
      },
      {
        name: 'Master Key System',
        description: 'Design and installation of master key systems for businesses and multi-unit properties.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes key tracking and access control'
      },
      {
        name: 'Security System Integration',
        description: 'Integration of locks with smart home and security systems.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Smart lock installation and programming'
      }
    ],
    linkPaths: {
      bookingForm: '/locksmith-service',
      catalog: '/locksmith-services',
      treatmentPackages: '/locksmith-maintenance-plans',
      supplies: '/locksmith-supplies'
    },
    supplierTemplates: [
      { name: 'Schlage', domains: ['schlage.com'] },
      { name: 'Kwikset', domains: ['kwikset.com'] },
      { name: 'Yale', domains: ['yale.com'] },
      { name: 'Baldwin', domains: ['baldwinhardware.com'] },
      { name: 'Medeco', domains: ['medeco.com'] },
      { name: 'Assa Abloy', domains: ['assaabloy.com'] },
      { name: 'Master Lock', domains: ['masterlock.com'] },
      { name: 'American Lock', domains: ['americanlock.com'] },
      { name: 'Sentry Safe', domains: ['sentrysafe.com'] },
      { name: 'Liberty Safe', domains: ['libertysafe.com'] },
      { name: 'Cannon Safe', domains: ['cannonsafe.com'] },
      { name: 'Browning', domains: ['browning.com'] }
    ]
  },
  'Handyman Services': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','water leak','electrical issue','gas leak',
        'door broken','window broken','security issue','safety hazard',
        'appliance failure','heating issue','cooling issue','plumbing emergency',
        'structural damage','falling object','loose fixture','trip hazard',
        'after hours','weekend emergency','same day service'
      ],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Handyman Service',
        description: '24/7 emergency handyman services for urgent repairs and safety issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Licensed and insured for all trades'
      },
      {
        name: 'Home Repair & Maintenance',
        description: 'General home repairs, maintenance, and small renovation projects.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'hourly',
        price: '',
        notes: 'Multi-trade expertise for comprehensive solutions'
      },
      {
        name: 'Appliance Installation & Repair',
        description: 'Appliance installation, repair, and maintenance services.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'starting',
        price: '',
        notes: 'Works on all major appliance brands'
      },
      {
        name: 'Furniture Assembly',
        description: 'Professional furniture assembly and disassembly services.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'IKEA and other major furniture brands'
      },
      {
        name: 'TV & Electronics Mounting',
        description: 'TV mounting, home theater setup, and electronics installation.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes cable management and setup'
      }
    ],
    linkPaths: {
      bookingForm: '/handyman-service',
      catalog: '/handyman-services',
      treatmentPackages: '/handyman-maintenance-plans',
      supplies: '/handyman-supplies'
    },
    supplierTemplates: [
      { name: 'Home Depot', domains: ['homedepot.com'] },
      { name: 'Lowe\'s', domains: ['lowes.com'] },
      { name: 'Menards', domains: ['menards.com'] },
      { name: 'Ace Hardware', domains: ['acehardware.com'] },
      { name: 'True Value', domains: ['truevalue.com'] },
      { name: 'Grainger', domains: ['grainger.com'] },
      { name: 'Fastenal', domains: ['fastenal.com'] },
      { name: 'McMaster-Carr', domains: ['mcmaster.com'] },
      { name: 'Amazon Business', domains: ['amazon.com'] },
      { name: 'Zoro', domains: ['zoro.com'] },
      { name: 'Global Industrial', domains: ['globalindustrial.com'] },
      { name: 'Uline', domains: ['uline.com'] }
    ]
  },
  'Cleaning Services': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','biohazard','mold cleanup','water damage cleanup',
        'crime scene cleanup','trauma cleanup','hoarding cleanup','fire damage cleanup',
        'flood cleanup','sewage backup','contamination','health hazard',
        'same day','immediate','asap','weekend','after hours'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Cleanup Service',
        description: '24/7 emergency cleanup for water damage, biohazards, and trauma situations.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Certified for biohazard and trauma cleanup'
      },
      {
        name: 'Residential Cleaning Service',
        description: 'Regular house cleaning, deep cleaning, and move-in/move-out cleaning.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Weekly, bi-weekly, or monthly service options'
      },
      {
        name: 'Commercial Cleaning',
        description: 'Office, retail, and commercial space cleaning services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'After-hours and weekend cleaning available'
      },
      {
        name: 'Carpet & Upholstery Cleaning',
        description: 'Professional carpet, rug, and upholstery cleaning services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Eco-friendly cleaning solutions available'
      },
      {
        name: 'Window Cleaning Service',
        description: 'Interior and exterior window cleaning for residential and commercial properties.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes screens, tracks, and frame cleaning'
      }
    ],
    linkPaths: {
      bookingForm: '/cleaning-service',
      catalog: '/cleaning-services',
      treatmentPackages: '/cleaning-maintenance-plans',
      supplies: '/cleaning-supplies'
    },
    supplierTemplates: [
      { name: 'ECOLAB', domains: ['ecolab.com'] },
      { name: 'Diversey', domains: ['diversey.com'] },
      { name: 'Clorox Professional', domains: ['cloroxpro.com'] },
      { name: 'Lysol Professional', domains: ['lysol.com'] },
      { name: '3M', domains: ['3m.com'] },
      { name: 'SC Johnson Professional', domains: ['scjprofessional.com'] },
      { name: 'Zep', domains: ['zep.com'] },
      { name: 'Simple Green', domains: ['simplegreen.com'] },
      { name: 'Gojo', domains: ['gojo.com'] },
      { name: 'Rubbermaid Commercial', domains: ['rubbermaidcommercial.com'] },
      { name: 'Uline', domains: ['uline.com'] },
      { name: 'Grainger', domains: ['grainger.com'] }
    ]
  },
  'Garage Door Service': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'emergency@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'dispatch@servicetitan.com'],
      urgentKeywords: [
        'urgent','emergency','garage door stuck','door won\'t open','door won\'t close',
        'broken spring','cable broken','opener not working','remote not working',
        'safety issue','sensor problem','door off track','panel damaged',
        'security breach','break-in attempt','same day','immediate'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Garage Door Repair',
        description: '24/7 emergency garage door repairs for stuck doors and safety issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Response time within 2 hours'
      },
      {
        name: 'Garage Door Installation',
        description: 'Complete garage door installation with opener and accessories.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes warranty and maintenance program'
      },
      {
        name: 'Garage Door Spring Repair',
        description: 'Professional garage door spring replacement and repair services.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Torsion and extension spring replacement'
      },
      {
        name: 'Garage Door Opener Installation',
        description: 'New garage door opener installation with smart home integration.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'WiFi-enabled openers with smartphone control'
      },
      {
        name: 'Garage Door Maintenance',
        description: 'Preventive maintenance service to keep garage doors operating smoothly.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Annual maintenance program available'
      }
    ],
    linkPaths: {
      bookingForm: '/garage-door-service',
      catalog: '/garage-door-services',
      treatmentPackages: '/garage-door-maintenance-plans',
      supplies: '/garage-door-supplies'
    },
    supplierTemplates: [
      { name: 'Chamberlain', domains: ['chamberlain.com'] },
      { name: 'LiftMaster', domains: ['liftmaster.com'] },
      { name: 'Genie', domains: ['geniecompany.com'] },
      { name: 'Overhead Door', domains: ['overheaddoor.com'] },
      { name: 'Wayne Dalton', domains: ['waynedalton.com'] },
      { name: 'Clopay', domains: ['clopaydoor.com'] },
      { name: 'Amarr', domains: ['amarr.com'] },
      { name: 'Raynor', domains: ['raynor.com'] },
      { name: 'Garaga', domains: ['garaga.com'] },
      { name: 'C.H.I.', domains: ['chioverheaddoors.com'] },
      { name: 'Martin Door', domains: ['martindoor.com'] },
      { name: 'Marietta Overhead Door', domains: ['mariettaoverhead.com'] }
    ]
  },
  'Pest Control': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','infestation','swarm','bed bugs',
        'termites','carpenter ants','rodents','mice','rats',
        'health hazard','allergic reaction','stinging insects',
        'food contamination','structural damage','same day','immediate'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Pest Control',
        description: '24/7 emergency pest control for infestations and health hazards.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Licensed and certified pest control technician'
      },
      {
        name: 'General Pest Control Service',
        description: 'Regular pest control treatments for common household pests.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Monthly, quarterly, or annual service plans'
      },
      {
        name: 'Termite Inspection & Treatment',
        description: 'Comprehensive termite inspection and treatment services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes warranty and follow-up monitoring'
      },
      {
        name: 'Bed Bug Treatment',
        description: 'Professional bed bug detection and elimination services.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'fixed',
        price: '',
        notes: 'Heat treatment and chemical treatment options'
      },
      {
        name: 'Wildlife Removal',
        description: 'Humane wildlife removal and exclusion services.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Licensed wildlife control specialist'
      }
    ],
    linkPaths: {
      bookingForm: '/pest-control-service',
      catalog: '/pest-control-services',
      treatmentPackages: '/pest-control-maintenance-plans',
      supplies: '/pest-control-supplies'
    },
    supplierTemplates: [
      { name: 'Orkin', domains: ['orkin.com'] },
      { name: 'Terminix', domains: ['terminix.com'] },
      { name: 'EcoLab Pest Elimination', domains: ['ecolabpestelimination.com'] },
      { name: 'Bayer Environmental Science', domains: ['bayer.com'] },
      { name: 'Syngenta', domains: ['syngenta.com'] },
      { name: 'FMC Corporation', domains: ['fmc.com'] },
      { name: 'Dow AgroSciences', domains: ['dow.com'] },
      { name: 'BASF', domains: ['basf.com'] },
      { name: 'Bell Laboratories', domains: ['belllabs.com'] },
      { name: 'Nisus Corporation', domains: ['nisuscorp.com'] },
      { name: 'Neogen Corporation', domains: ['neogen.com'] },
      { name: 'Liphatech', domains: ['liphatech.com'] }
    ]
  },
  'Appliance Repair': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'emergency@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'dispatch@servicetitan.com'],
      urgentKeywords: [
        'urgent','emergency','not working','broken','won\'t start','won\'t turn on',
        'water leak','flooding','electrical issue','smoke','burning smell',
        'food spoiling','refrigerator not cooling','freezer not freezing',
        'dishwasher flooding','washer not draining','dryer not heating',
        'oven not heating','stove not working','microwave not working',
        'same day','immediate','asap','weekend emergency'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Appliance Repair',
        description: '24/7 emergency appliance repairs for water leaks, electrical issues, and critical failures.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Response time within 2 hours for emergencies'
      },
      {
        name: 'Refrigerator Repair',
        description: 'Refrigerator and freezer repair services for cooling issues, leaks, and electrical problems.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Works on all major brands including Samsung, LG, Whirlpool'
      },
      {
        name: 'Washer & Dryer Repair',
        description: 'Washing machine and dryer repair for drainage, heating, and mechanical issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Front-load and top-load machines, all brands'
      },
      {
        name: 'Dishwasher Repair',
        description: 'Dishwasher repair for drainage, cleaning, and electrical issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Includes water leak repairs and pump replacement'
      },
      {
        name: 'Oven & Range Repair',
        description: 'Stove, oven, and cooktop repair for heating, electrical, and gas issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Gas and electric models, all major brands'
      }
    ],
    linkPaths: {
      bookingForm: '/appliance-repair',
      catalog: '/appliance-repair-services',
      treatmentPackages: '/appliance-maintenance-plans',
      supplies: '/appliance-parts'
    },
    supplierTemplates: [
      { name: 'Samsung', domains: ['samsung.com'] },
      { name: 'LG Electronics', domains: ['lg.com'] },
      { name: 'Whirlpool', domains: ['whirlpool.com'] },
      { name: 'GE Appliances', domains: ['geappliances.com'] },
      { name: 'Maytag', domains: ['maytag.com'] },
      { name: 'KitchenAid', domains: ['kitchenaid.com'] },
      { name: 'Bosch', domains: ['bosch-home.com'] },
      { name: 'Frigidaire', domains: ['frigidaire.com'] },
      { name: 'Electrolux', domains: ['electrolux.com'] },
      { name: 'Viking', domains: ['vikingrange.com'] },
      { name: 'Sub-Zero', domains: ['subzero-wolf.com'] },
      { name: 'Wolf', domains: ['subzero-wolf.com'] }
    ]
  },
  'Window & Door Installer': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','broken window','glass broken','window shattered',
        'door broken','door won\'t open','door won\'t close','security issue',
        'draft','air leak','water leak','storm damage','break-in',
        'safety hazard','glass falling','frame damaged','same day','immediate'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Window Repair',
        description: 'Emergency window and glass replacement for broken or damaged windows.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: '24/7 emergency boarding and glass replacement'
      },
      {
        name: 'Window Replacement',
        description: 'Complete window replacement with energy-efficient options and warranty.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes disposal of old windows and cleanup'
      },
      {
        name: 'Door Installation & Repair',
        description: 'Interior and exterior door installation, repair, and replacement services.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'starting',
        price: '',
        notes: 'All door types including security doors'
      },
      {
        name: 'Storm Door & Screen Installation',
        description: 'Storm door and screen door installation for weather protection.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Energy-efficient storm door options available'
      },
      {
        name: 'Window & Door Maintenance',
        description: 'Regular maintenance, weatherstripping, and hardware repair services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Annual maintenance programs available'
      }
    ],
    linkPaths: {
      bookingForm: '/window-door-service',
      catalog: '/window-door-services',
      treatmentPackages: '/window-door-maintenance-plans',
      supplies: '/window-door-supplies'
    },
    supplierTemplates: [
      { name: 'Andersen Windows', domains: ['andersenwindows.com'] },
      { name: 'Pella', domains: ['pella.com'] },
      { name: 'Marvin Windows', domains: ['marvin.com'] },
      { name: 'Jeld-Wen', domains: ['jeld-wen.com'] },
      { name: 'Milgard', domains: ['milgard.com'] },
      { name: 'Therma-Tru Doors', domains: ['thermatru.com'] },
      { name: 'Masonite', domains: ['masonite.com'] },
      { name: 'Simpson Door Company', domains: ['simpsondoor.com'] },
      { name: 'Larson Storm Doors', domains: ['larsondoors.com'] },
      { name: 'Emco', domains: ['emcodoor.com'] },
      { name: 'Crestline', domains: ['crestlinedoors.com'] },
      { name: 'ProVia', domains: ['provia.com'] }
    ]
  },
  'Auto Repair Shop': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','breakdown','won\'t start','engine problem',
        'transmission issue','brake problem','steering issue','safety hazard',
        'check engine light','overheating','smoking','strange noise',
        'vibration','pulling','stalling','no power','electrical issue',
        'same day','immediate','roadside assistance','tow needed'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Auto Repair',
        description: 'Emergency automotive repairs for breakdowns and safety issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'ASE certified technicians, same-day service available'
      },
      {
        name: 'Engine Repair & Maintenance',
        description: 'Engine diagnostics, repair, and preventive maintenance services.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'All makes and models, warranty on all repairs'
      },
      {
        name: 'Brake Service & Repair',
        description: 'Brake inspection, pad replacement, rotor service, and brake system repair.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Free brake inspection with service'
      },
      {
        name: 'Transmission Service',
        description: 'Transmission diagnostics, repair, and fluid service.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Automatic and manual transmission specialists'
      },
      {
        name: 'Oil Change & Lube Service',
        description: 'Regular oil changes, fluid checks, and basic maintenance services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Conventional, synthetic, and high-mileage oil options'
      }
    ],
    linkPaths: {
      bookingForm: '/auto-repair-service',
      catalog: '/auto-repair-services',
      treatmentPackages: '/auto-maintenance-plans',
      supplies: '/auto-parts'
    },
    supplierTemplates: [
      { name: 'AutoZone', domains: ['autozone.com'] },
      { name: 'Advance Auto Parts', domains: ['advanceautoparts.com'] },
      { name: 'O\'Reilly Auto Parts', domains: ['oreillyauto.com'] },
      { name: 'NAPA Auto Parts', domains: ['napaonline.com'] },
      { name: 'CarQuest', domains: ['carquest.com'] },
      { name: 'Bumper to Bumper', domains: ['bumpertobumper.com'] },
      { name: 'Worldpac', domains: ['worldpac.com'] },
      { name: 'Motorcraft', domains: ['motorcraft.com'] },
      { name: 'ACDelco', domains: ['acdelco.com'] },
      { name: 'Mopar', domains: ['mopar.com'] },
      { name: 'Genuine Parts Company', domains: ['genpt.com'] },
      { name: 'LKQ Corporation', domains: ['lkqcorp.com'] }
    ]
  },
  'Security Systems': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'monitoring@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'monitoring@servicetitan.com'],
      urgentKeywords: [
        'urgent','emergency','security breach','break-in','burglary',
        'alarm going off','false alarm','system down','monitoring offline',
        'camera not working','sensor not working','keypad not working',
        'door sensor','motion detector','glass break sensor',
        'same day','immediate','weekend emergency','after hours'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Security Service',
        description: '24/7 emergency security system repairs and monitoring issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Certified security technicians, 2-hour response time'
      },
      {
        name: 'Security System Installation',
        description: 'Complete home and business security system installation with monitoring.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Wireless and hardwired systems, smart home integration'
      },
      {
        name: 'Security Camera Installation',
        description: 'Indoor and outdoor security camera installation and setup.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'starting',
        price: '',
        notes: 'HD, 4K, and night vision cameras available'
      },
      {
        name: 'Access Control Systems',
        description: 'Keyless entry, keypad, and biometric access control installation.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Commercial and residential access control solutions'
      },
      {
        name: 'Security System Maintenance',
        description: 'Regular system maintenance, testing, and monitoring service.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Annual maintenance contracts with 24/7 monitoring'
      }
    ],
    linkPaths: {
      bookingForm: '/security-service',
      catalog: '/security-systems',
      treatmentPackages: '/security-monitoring-plans',
      supplies: '/security-equipment'
    },
    supplierTemplates: [
      { name: 'ADT', domains: ['adt.com'] },
      { name: 'Vivint', domains: ['vivint.com'] },
      { name: 'Frontpoint', domains: ['frontpointsecurity.com'] },
      { name: 'SimpliSafe', domains: ['simplisafe.com'] },
      { name: 'Ring', domains: ['ring.com'] },
      { name: 'Nest', domains: ['nest.com'] },
      { name: 'Honeywell', domains: ['honeywell.com'] },
      { name: 'DSC', domains: ['dsc.com'] },
      { name: '2GIG', domains: ['2gig.com'] },
      { name: 'Qolsys', domains: ['qolsys.com'] },
      { name: 'Interlogix', domains: ['interlogix.com'] },
      { name: 'Bosch Security', domains: ['boschsecurity.com'] }
    ]
  },
  'Pool Maintenance': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','pool green','algae bloom','chemical imbalance',
        'pump not working','filter not working','heater not working',
        'water leak','drainage issue','equipment failure',
        'safety hazard','electrical issue','same day','immediate'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Pool Service',
        description: 'Emergency pool repairs for equipment failures and water quality issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Same-day response for equipment emergencies'
      },
      {
        name: 'Weekly Pool Maintenance',
        description: 'Regular weekly pool cleaning, chemical balancing, and equipment checks.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes water testing and chemical adjustment'
      },
      {
        name: 'Pool Opening Service',
        description: 'Spring pool opening including equipment startup and water balancing.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes equipment inspection and chemical startup'
      },
      {
        name: 'Pool Closing Service',
        description: 'Winter pool closing including equipment winterization and cover installation.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes chemical treatment and equipment protection'
      },
      {
        name: 'Pool Equipment Repair',
        description: 'Pool pump, filter, heater, and automation system repair services.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'All major pool equipment brands serviced'
      }
    ],
    linkPaths: {
      bookingForm: '/pool-maintenance',
      catalog: '/pool-services',
      treatmentPackages: '/pool-maintenance-plans',
      supplies: '/pool-supplies'
    },
    supplierTemplates: [
      { name: 'Pentair', domains: ['pentair.com'] },
      { name: 'Hayward', domains: ['hayward.com'] },
      { name: 'Jandy', domains: ['jandy.com'] },
      { name: 'Raypak', domains: ['raypak.com'] },
      { name: 'Sta-Rite', domains: ['sta-rite.com'] },
      { name: 'Zodiac', domains: ['zodiac.com'] },
      { name: 'Chemtrol', domains: ['chemtrol.com'] },
      { name: 'Pool Supply World', domains: ['poolsupplyworld.com'] },
      { name: 'In The Swim', domains: ['intheswim.com'] },
      { name: 'PoolGeek', domains: ['poolgeek.com'] },
      { name: 'Leslie\'s Pool Supplies', domains: ['lesliespool.com'] },
      { name: 'Pinch A Penny', domains: ['pinchapenny.com'] }
    ]
  },
  'Gutter Services': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','gutter overflowing','water damage','leaking gutters',
        'gutter pulling away','downspout blocked','ice dams','water pooling',
        'foundation damage','basement flooding','storm damage','same day','immediate'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Gutter Repair',
        description: 'Emergency gutter repairs for leaks, separation, and water damage prevention.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Same-day response for water damage prevention'
      },
      {
        name: 'Gutter Cleaning Service',
        description: 'Professional gutter and downspout cleaning and debris removal.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes downspout flushing and debris disposal'
      },
      {
        name: 'Gutter Installation',
        description: 'New gutter and downspout installation with gutter guards.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Aluminum, steel, and copper gutter options'
      },
      {
        name: 'Gutter Guard Installation',
        description: 'Gutter guard installation to prevent debris buildup and reduce maintenance.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Mesh, screen, and foam gutter guard options'
      },
      {
        name: 'Seasonal Gutter Service',
        description: 'Seasonal gutter maintenance including fall cleanup and spring inspection.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Spring and fall maintenance packages available'
      }
    ],
    linkPaths: {
      bookingForm: '/gutter-service',
      catalog: '/gutter-services',
      treatmentPackages: '/gutter-maintenance-plans',
      supplies: '/gutter-supplies'
    },
    supplierTemplates: [
      { name: 'LeafFilter', domains: ['leaffilter.com'] },
      { name: 'LeafGuard', domains: ['leafguard.com'] },
      { name: 'Gutter Helmet', domains: ['gutterhelmet.com'] },
      { name: 'Amerimax', domains: ['amerimax.com'] },
      { name: 'Alcoa', domains: ['alcoa.com'] },
      { name: 'CertainTeed', domains: ['certainteed.com'] },
      { name: 'Vista', domains: ['vista.com'] },
      { name: 'Mastic', domains: ['mastic.com'] },
      { name: 'Sexton', domains: ['sexton.com'] },
      { name: 'Spectrum', domains: ['spectrum.com'] },
      { name: 'Leaf Relief', domains: ['leafrelief.com'] },
      { name: 'GutterMaxx', domains: ['guttermaxx.com'] }
    ]
  },
  'Snow Removal': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'dispatch@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'dispatch@servicetitan.com'],
      urgentKeywords: [
        'urgent','emergency','snow emergency','blizzard','heavy snow',
        'ice storm','freezing rain','safety hazard','slippery conditions',
        'emergency access','medical emergency','fire department access',
        'same day','immediate','asap','winter storm warning'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Snow Removal',
        description: '24/7 emergency snow removal for safety hazards and access issues.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Priority response for emergency access needs'
      },
      {
        name: 'Residential Snow Plowing',
        description: 'Regular residential driveway and walkway snow removal service.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Seasonal contracts with automatic service activation'
      },
      {
        name: 'Commercial Snow Removal',
        description: 'Commercial parking lot and sidewalk snow removal and ice management.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Liability insurance and commercial equipment'
      },
      {
        name: 'Ice Management',
        description: 'Ice melting, sanding, and traction control services.',
        duration: '',
        availability: '',
        category: 'Maintenance',
        pricingType: 'fixed',
        price: '',
        notes: 'Eco-friendly de-icing options available'
      },
      {
        name: 'Snow Removal Equipment Rental',
        description: 'Snow blower and snow removal equipment rental services.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Delivery and pickup service available'
      }
    ],
    linkPaths: {
      bookingForm: '/snow-removal',
      catalog: '/snow-removal-services',
      treatmentPackages: '/snow-removal-contracts',
      supplies: '/snow-removal-supplies'
    },
    supplierTemplates: [
      { name: 'Ariens', domains: ['ariens.com'] },
      { name: 'Honda Power Equipment', domains: ['hondapowerequipment.com'] },
      { name: 'Toro', domains: ['toro.com'] },
      { name: 'Cub Cadet', domains: ['cubcadet.com'] },
      { name: 'Yard Machines', domains: ['yardmachines.com'] },
      { name: 'Craftsman', domains: ['craftsman.com'] },
      { name: 'Poulan Pro', domains: ['poulanpro.com'] },
      { name: 'Briggs & Stratton', domains: ['briggsandstratton.com'] },
      { name: 'Sno-Way', domains: ['sno-way.com'] },
      { name: 'Meyer', domains: ['meyerproducts.com'] },
      { name: 'Western', domains: ['westernplows.com'] },
      { name: 'Fisher', domains: ['fisherplows.com'] }
    ]
  },
  'Kitchen Remodeling': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','water damage','cabinet failure','countertop damage',
        'appliance failure','electrical issue','plumbing leak','safety hazard',
        'structural damage','mold damage','same day','immediate repair needed'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Kitchen Repair',
        description: 'Emergency kitchen repairs for water damage, electrical issues, and safety hazards.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Same-day response for emergency repairs'
      },
      {
        name: 'Complete Kitchen Remodel',
        description: 'Full kitchen renovation including cabinets, countertops, appliances, and flooring.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes design consultation and project management'
      },
      {
        name: 'Cabinet Installation & Refacing',
        description: 'New cabinet installation or cabinet refacing and hardware replacement.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'starting',
        price: '',
        notes: 'Custom and stock cabinet options available'
      },
      {
        name: 'Countertop Installation',
        description: 'Granite, quartz, and solid surface countertop installation and replacement.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'starting',
        price: '',
        notes: 'Templates, fabrication, and installation included'
      },
      {
        name: 'Kitchen Appliance Installation',
        description: 'Professional installation of kitchen appliances with electrical and plumbing connections.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'All major appliance brands and types'
      }
    ],
    linkPaths: {
      bookingForm: '/kitchen-remodel',
      catalog: '/kitchen-remodeling-services',
      treatmentPackages: '/kitchen-maintenance-plans',
      supplies: '/kitchen-materials'
    },
    supplierTemplates: [
      { name: 'KraftMaid', domains: ['kraftmaid.com'] },
      { name: 'Merillat', domains: ['merillat.com'] },
      { name: 'Diamond Cabinetry', domains: ['diamondcabinetry.com'] },
      { name: 'Wellborn Cabinets', domains: ['wellborn.com'] },
      { name: 'Cambria', domains: ['cambriausa.com'] },
      { name: 'Caesarstone', domains: ['caesarstone.com'] },
      { name: 'Silestone', domains: ['silestone.com'] },
      { name: 'Corian', domains: ['corian.com'] },
      { name: 'Formica', domains: ['formica.com'] },
      { name: 'Wilsonart', domains: ['wilsonart.com'] },
      { name: 'Kohler', domains: ['kohler.com'] },
      { name: 'Delta Faucet', domains: ['deltafaucet.com'] }
    ]
  },
  'Bathroom Remodeling': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com', 'scheduling@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com', 'no-reply@housecallpro.com'],
      urgentKeywords: [
        'urgent','emergency','water leak','flooding','mold damage',
        'fixture failure','toilet not working','shower leak','tub leak',
        'electrical issue','plumbing emergency','safety hazard','same day','immediate'
      ],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      {
        name: 'Emergency Bathroom Repair',
        description: 'Emergency bathroom repairs for leaks, flooding, and fixture failures.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'hourly',
        price: '',
        notes: 'Same-day response for water damage prevention'
      },
      {
        name: 'Complete Bathroom Remodel',
        description: 'Full bathroom renovation including fixtures, tile, plumbing, and electrical.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'fixed',
        price: '',
        notes: 'Includes design consultation and project management'
      },
      {
        name: 'Bathroom Fixture Installation',
        description: 'Toilet, sink, bathtub, and shower installation and replacement.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'starting',
        price: '',
        notes: 'All major fixture brands and styles'
      },
      {
        name: 'Tile Installation & Repair',
        description: 'Bathroom tile installation, repair, and grout restoration services.',
        duration: '',
        availability: '',
        category: 'Installation',
        pricingType: 'starting',
        price: '',
        notes: 'Ceramic, porcelain, and natural stone tile work'
      },
      {
        name: 'Bathroom Plumbing Services',
        description: 'Bathroom plumbing repairs, upgrades, and fixture connections.',
        duration: '',
        availability: '',
        category: 'Repair',
        pricingType: 'starting',
        price: '',
        notes: 'Licensed plumber for all plumbing work'
      }
    ],
    linkPaths: {
      bookingForm: '/bathroom-remodel',
      catalog: '/bathroom-remodeling-services',
      treatmentPackages: '/bathroom-maintenance-plans',
      supplies: '/bathroom-materials'
    },
    supplierTemplates: [
      { name: 'Kohler', domains: ['kohler.com'] },
      { name: 'American Standard', domains: ['americanstandard-us.com'] },
      { name: 'Toto', domains: ['toto.com'] },
      { name: 'Delta Faucet', domains: ['deltafaucet.com'] },
      { name: 'Moen', domains: ['moen.com'] },
      { name: 'Pfister', domains: ['pfisterfaucets.com'] },
      { name: 'Grohe', domains: ['grohe.com'] },
      { name: 'Hansgrohe', domains: ['hansgrohe.com'] },
      { name: 'Daltile', domains: ['daltile.com'] },
      { name: 'Marazzi', domains: ['marazzitileusa.com'] },
      { name: 'Florida Tile', domains: ['floridatile.com'] },
      { name: 'Crossville', domains: ['crossvilleinc.com'] }
    ]
  },

  // Construction & Trades
  'General Construction': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','delay','behind schedule','weather','safety','permit','inspection','change order','budget','timeline'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Project Consultation', description: 'Initial project assessment, planning, and budgeting.', category: 'Consultation', pricingType: 'fixed' },
      { name: 'Permit Processing', description: 'Handling building permits and inspections.', category: 'Administrative', pricingType: 'fixed' },
      { name: 'Construction Management', description: 'Overseeing project execution and coordination.', category: 'Management', pricingType: 'hourly' },
      { name: 'Subcontractor Coordination', description: 'Managing trades and scheduling.', category: 'Management', pricingType: 'hourly' }
    ],
    supplierTemplates: [
      { name: 'Home Depot Pro', domains: ['homedepot.com'] },
      { name: 'Lowe\'s Pro', domains: ['lowes.com'] },
      { name: '84 Lumber', domains: ['84lumber.com'] },
      { name: 'ABC Supply', domains: ['abcsupply.com'] }
    ]
  },

  'Roofing': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','leak','water damage','storm damage','wind damage','hail','missing shingles','sagging','structural'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Roof Inspection', description: 'Comprehensive roof assessment and damage evaluation.', category: 'Inspection', pricingType: 'fixed' },
      { name: 'Emergency Repair', description: 'Urgent leak repairs and storm damage fixes.', category: 'Repair', pricingType: 'hourly' },
      { name: 'Roof Replacement', description: 'Complete roof replacement with warranty.', category: 'Installation', pricingType: 'fixed' },
      { name: 'Gutter Installation', description: 'Gutter and downspout installation and repair.', category: 'Installation', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'GAF Materials', domains: ['gaf.com'] },
      { name: 'Owens Corning', domains: ['owenscorning.com'] },
      { name: 'CertainTeed', domains: ['certainteed.com'] },
      { name: 'ABC Supply', domains: ['abcsupply.com'] }
    ]
  },

  'Landscaping': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','tree down','storm damage','flooding','drainage','irrigation','sprinkler','dead plants','pest'],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Lawn Maintenance', description: 'Regular mowing, edging, and lawn care.', category: 'Maintenance', pricingType: 'fixed' },
      { name: 'Tree Services', description: 'Tree trimming, removal, and health assessment.', category: 'Maintenance', pricingType: 'hourly' },
      { name: 'Landscape Design', description: 'Custom landscape planning and installation.', category: 'Design', pricingType: 'fixed' },
      { name: 'Irrigation System', description: 'Sprinkler installation, repair, and maintenance.', category: 'Installation', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'John Deere Landscapes', domains: ['johndeerelandscapes.com'] },
      { name: 'SiteOne Landscape Supply', domains: ['siteone.com'] },
      { name: 'Ewing Irrigation', domains: ['ewingirrigation.com'] },
      { name: 'Rain Bird', domains: ['rainbird.com'] }
    ]
  },

  'Painting': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','peeling','fading','stain','water damage','mold','lead paint','safety','hazard'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Interior Painting', description: 'Complete interior painting with color consultation.', category: 'Painting', pricingType: 'fixed' },
      { name: 'Exterior Painting', description: 'Exterior house painting with weather protection.', category: 'Painting', pricingType: 'fixed' },
      { name: 'Color Consultation', description: 'Professional color selection and design advice.', category: 'Consultation', pricingType: 'fixed' },
      { name: 'Pressure Washing', description: 'Surface preparation and cleaning services.', category: 'Preparation', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Sherwin Williams', domains: ['sherwin-williams.com'] },
      { name: 'Benjamin Moore', domains: ['benjaminmoore.com'] },
      { name: 'Behr', domains: ['behr.com'] },
      { name: 'PPG Paints', domains: ['ppg.com'] }
    ]
  },

  'Flooring': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','water damage','buckling','loose','squeaking','stain','warping','mold','safety'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Hardwood Installation', description: 'Professional hardwood floor installation.', category: 'Installation', pricingType: 'fixed' },
      { name: 'Tile Installation', description: 'Ceramic, porcelain, and natural stone tile work.', category: 'Installation', pricingType: 'fixed' },
      { name: 'Carpet Installation', description: 'Carpet selection and professional installation.', category: 'Installation', pricingType: 'fixed' },
      { name: 'Floor Refinishing', description: 'Hardwood sanding, staining, and refinishing.', category: 'Refinishing', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Mohawk Industries', domains: ['mohawkflooring.com'] },
      { name: 'Shaw Floors', domains: ['shawfloors.com'] },
      { name: 'Armstrong Flooring', domains: ['armstrong.com'] },
      { name: 'Mannington', domains: ['mannington.com'] }
    ]
  },

  // Automotive & Transportation
  'Auto Body Shop': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','insurance claim','totaled','frame damage','airbag','safety','rental car','deadline'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Collision Repair', description: 'Complete collision damage repair and restoration.', category: 'Repair', pricingType: 'fixed' },
      { name: 'Dent Removal', description: 'Paintless dent repair and body work.', category: 'Repair', pricingType: 'fixed' },
      { name: 'Paint Matching', description: 'Professional paint matching and application.', category: 'Painting', pricingType: 'fixed' },
      { name: 'Frame Straightening', description: 'Structural repair and frame alignment.', category: 'Repair', pricingType: 'hourly' }
    ],
    supplierTemplates: [
      { name: 'LKQ Corporation', domains: ['lkqcorp.com'] },
      { name: 'Keystone Automotive', domains: ['keystone-auto.com'] },
      { name: 'Sherwin Williams Automotive', domains: ['sherwin-williams.com'] },
      { name: 'PPG Automotive', domains: ['ppg.com'] }
    ]
  },

  'Towing Service': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','breakdown','accident','stuck','stranded','highway','dangerous','blocking traffic'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Emergency Towing', description: '24/7 emergency towing service.', category: 'Emergency', pricingType: 'fixed' },
      { name: 'Roadside Assistance', description: 'Jump starts, tire changes, lockouts.', category: 'Assistance', pricingType: 'fixed' },
      { name: 'Vehicle Recovery', description: 'Recovery from accidents and difficult locations.', category: 'Recovery', pricingType: 'hourly' },
      { name: 'Impound Services', description: 'Vehicle impound and storage services.', category: 'Storage', pricingType: 'daily' }
    ],
    supplierTemplates: [
      { name: 'AAA', domains: ['aaa.com'] },
      { name: 'Allstate Motor Club', domains: ['allstate.com'] },
      { name: 'Geico Roadside', domains: ['geico.com'] },
      { name: 'Progressive', domains: ['progressive.com'] }
    ]
  },

  // Home Services
  'Cleaning Services': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','biohazard','mold','flood','fire damage','move-in','move-out','event','party'],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Regular House Cleaning', description: 'Weekly or bi-weekly residential cleaning.', category: 'Maintenance', pricingType: 'fixed' },
      { name: 'Deep Cleaning', description: 'Thorough cleaning for move-in/out or special occasions.', category: 'Deep Clean', pricingType: 'fixed' },
      { name: 'Commercial Cleaning', description: 'Office and commercial space cleaning.', category: 'Commercial', pricingType: 'fixed' },
      { name: 'Post-Construction Cleanup', description: 'Cleaning after construction or renovation.', category: 'Specialty', pricingType: 'hourly' }
    ],
    supplierTemplates: [
      { name: 'Ecolab', domains: ['ecolab.com'] },
      { name: 'Diversey', domains: ['diversey.com'] },
      { name: 'Clorox Professional', domains: ['cloroxpro.com'] },
      { name: '3M Commercial', domains: ['3m.com'] }
    ]
  },

  'Pest Control': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','infestation','swarm','nest','sting','bite','allergic','health','safety'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Pest Inspection', description: 'Comprehensive pest assessment and identification.', category: 'Inspection', pricingType: 'fixed' },
      { name: 'Termite Treatment', description: 'Termite control and prevention services.', category: 'Treatment', pricingType: 'fixed' },
      { name: 'Rodent Control', description: 'Mouse and rat removal and prevention.', category: 'Treatment', pricingType: 'fixed' },
      { name: 'Preventive Maintenance', description: 'Regular pest prevention and monitoring.', category: 'Maintenance', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Orkin', domains: ['orkin.com'] },
      { name: 'Terminix', domains: ['terminix.com'] },
      { name: 'Ecolab Pest Elimination', domains: ['ecolab.com'] },
      { name: 'Rentokil', domains: ['rentokil.com'] }
    ]
  },

  // Health & Wellness
  'Dental Practice': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','pain','swelling','infection','broken tooth','crown','root canal','extraction'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Emergency Dental Care', description: 'Urgent dental treatment for pain and injuries.', category: 'Emergency', pricingType: 'fixed' },
      { name: 'Routine Cleaning', description: 'Professional teeth cleaning and examination.', category: 'Preventive', pricingType: 'fixed' },
      { name: 'Cosmetic Procedures', description: 'Teeth whitening, veneers, and cosmetic work.', category: 'Cosmetic', pricingType: 'fixed' },
      { name: 'Orthodontic Consultation', description: 'Braces and alignment treatment planning.', category: 'Consultation', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Henry Schein', domains: ['henryschein.com'] },
      { name: 'Patterson Dental', domains: ['pattersondental.com'] },
      { name: 'Benco Dental', domains: ['benco.com'] },
      { name: 'Dentsply Sirona', domains: ['dentsplysirona.com'] }
    ]
  },

  'Medical Practice': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','pain','fever','shortness of breath','chest pain','allergic reaction','medication','prescription'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Primary Care Consultation', description: 'General health assessment and treatment.', category: 'Consultation', pricingType: 'fixed' },
      { name: 'Annual Physical', description: 'Comprehensive health examination.', category: 'Preventive', pricingType: 'fixed' },
      { name: 'Urgent Care', description: 'Same-day treatment for non-emergency conditions.', category: 'Urgent', pricingType: 'fixed' },
      { name: 'Chronic Disease Management', description: 'Ongoing care for diabetes, hypertension, etc.', category: 'Management', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'McKesson', domains: ['mckesson.com'] },
      { name: 'Cardinal Health', domains: ['cardinalhealth.com'] },
      { name: 'AmerisourceBergen', domains: ['amerisourcebergen.com'] },
      { name: 'Henry Schein Medical', domains: ['henryschein.com'] }
    ]
  },

  'Veterinary Clinic': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','injury','poisoning','difficulty breathing','vomiting','diarrhea','not eating','lethargic'],
      tone: 'Caring',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Emergency Veterinary Care', description: '24/7 emergency pet treatment.', category: 'Emergency', pricingType: 'fixed' },
      { name: 'Wellness Exam', description: 'Annual health checkup and vaccinations.', category: 'Preventive', pricingType: 'fixed' },
      { name: 'Surgery', description: 'Spay/neuter and other surgical procedures.', category: 'Surgery', pricingType: 'fixed' },
      { name: 'Grooming Services', description: 'Professional pet grooming and bathing.', category: 'Grooming', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Patterson Veterinary', domains: ['pattersonvet.com'] },
      { name: 'Henry Schein Animal Health', domains: ['henryschein.com'] },
      { name: 'MWI Animal Health', domains: ['mwi.com'] },
      { name: 'Zoetis', domains: ['zoetis.com'] }
    ]
  },

  'Fitness Center': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','injury','equipment broken','safety','maintenance','membership','billing','refund'],
      tone: 'Motivational',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Personal Training', description: 'One-on-one fitness coaching and training.', category: 'Training', pricingType: 'hourly' },
      { name: 'Group Classes', description: 'Yoga, Pilates, cycling, and group fitness.', category: 'Classes', pricingType: 'fixed' },
      { name: 'Membership Management', description: 'Gym membership and facility access.', category: 'Membership', pricingType: 'monthly' },
      { name: 'Nutrition Coaching', description: 'Diet planning and nutritional guidance.', category: 'Nutrition', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Life Fitness', domains: ['lifefitness.com'] },
      { name: 'Precor', domains: ['precor.com'] },
      { name: 'Matrix Fitness', domains: ['matrixfitness.com'] },
      { name: 'Technogym', domains: ['technogym.com'] }
    ]
  },

  // Professional Services
  'Law Firm': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','deadline','court','hearing','trial','deposition','settlement','litigation'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Legal Consultation', description: 'Initial case evaluation and legal advice.', category: 'Consultation', pricingType: 'hourly' },
      { name: 'Document Preparation', description: 'Contracts, wills, and legal document drafting.', category: 'Documentation', pricingType: 'fixed' },
      { name: 'Court Representation', description: 'Litigation and court appearance services.', category: 'Litigation', pricingType: 'hourly' },
      { name: 'Business Law', description: 'Corporate law and business formation.', category: 'Business', pricingType: 'hourly' }
    ],
    supplierTemplates: [
      { name: 'Westlaw', domains: ['westlaw.com'] },
      { name: 'LexisNexis', domains: ['lexisnexis.com'] },
      { name: 'Thomson Reuters', domains: ['thomsonreuters.com'] },
      { name: 'Bloomberg Law', domains: ['bloomberglaw.com'] }
    ]
  },

  'Accounting Firm': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','tax deadline','audit','IRS','penalty','extension','quarterly','year-end'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Tax Preparation', description: 'Individual and business tax return preparation.', category: 'Tax', pricingType: 'fixed' },
      { name: 'Bookkeeping Services', description: 'Monthly bookkeeping and financial record keeping.', category: 'Bookkeeping', pricingType: 'monthly' },
      { name: 'Financial Consulting', description: 'Business financial planning and advice.', category: 'Consulting', pricingType: 'hourly' },
      { name: 'Audit Services', description: 'Financial statement audits and reviews.', category: 'Audit', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'QuickBooks', domains: ['quickbooks.intuit.com'] },
      { name: 'Xero', domains: ['xero.com'] },
      { name: 'Sage', domains: ['sage.com'] },
      { name: 'FreshBooks', domains: ['freshbooks.com'] }
    ]
  },

  'Real Estate Agency': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','showing','offer','counter-offer','closing','inspection','appraisal','deadline'],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Property Listing', description: 'Professional property marketing and listing services.', category: 'Listing', pricingType: 'commission' },
      { name: 'Buyer Representation', description: 'Home buying assistance and representation.', category: 'Buying', pricingType: 'commission' },
      { name: 'Market Analysis', description: 'Property valuation and market assessment.', category: 'Analysis', pricingType: 'fixed' },
      { name: 'Transaction Management', description: 'Complete transaction coordination and closing.', category: 'Transaction', pricingType: 'commission' }
    ],
    supplierTemplates: [
      { name: 'Zillow', domains: ['zillow.com'] },
      { name: 'Realtor.com', domains: ['realtor.com'] },
      { name: 'MLS', domains: ['mls.com'] },
      { name: 'ShowingTime', domains: ['showingtime.com'] }
    ]
  },

  'Insurance Agency': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','claim','accident','damage','coverage','policy','premium','deductible'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Policy Review', description: 'Insurance policy analysis and optimization.', category: 'Review', pricingType: 'fixed' },
      { name: 'Claims Assistance', description: 'Claims filing and processing support.', category: 'Claims', pricingType: 'fixed' },
      { name: 'Coverage Consultation', description: 'Insurance needs assessment and recommendations.', category: 'Consultation', pricingType: 'fixed' },
      { name: 'Risk Management', description: 'Business risk assessment and mitigation.', category: 'Risk', pricingType: 'hourly' }
    ],
    supplierTemplates: [
      { name: 'State Farm', domains: ['statefarm.com'] },
      { name: 'Allstate', domains: ['allstate.com'] },
      { name: 'Progressive', domains: ['progressive.com'] },
      { name: 'Geico', domains: ['geico.com'] }
    ]
  },

  // Food & Hospitality
  'Restaurant': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','reservation','catering','delivery','staff','equipment','supply','shortage'],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Dine-In Service', description: 'Full-service restaurant dining experience.', category: 'Service', pricingType: 'menu' },
      { name: 'Catering Services', description: 'Event catering and large party orders.', category: 'Catering', pricingType: 'fixed' },
      { name: 'Takeout & Delivery', description: 'Food pickup and delivery services.', category: 'Delivery', pricingType: 'menu' },
      { name: 'Private Events', description: 'Private dining and event hosting.', category: 'Events', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Sysco', domains: ['sysco.com'] },
      { name: 'US Foods', domains: ['usfoods.com'] },
      { name: 'Performance Food Group', domains: ['pfgc.com'] },
      { name: 'Gordon Food Service', domains: ['gfs.com'] }
    ]
  },

  'Catering Service': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','last minute','change','cancellation','weather','venue','equipment','staffing'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Wedding Catering', description: 'Complete wedding catering and coordination.', category: 'Wedding', pricingType: 'fixed' },
      { name: 'Corporate Events', description: 'Business meeting and corporate event catering.', category: 'Corporate', pricingType: 'fixed' },
      { name: 'Private Parties', description: 'Birthday parties and private celebrations.', category: 'Private', pricingType: 'fixed' },
      { name: 'Drop-Off Catering', description: 'Food delivery and setup services.', category: 'Drop-Off', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Sysco', domains: ['sysco.com'] },
      { name: 'US Foods', domains: ['usfoods.com'] },
      { name: 'Performance Food Group', domains: ['pfgc.com'] },
      { name: 'Gordon Food Service', domains: ['gfs.com'] }
    ]
  },

  'Food Truck': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','location','event','weather','equipment','supply','staffing','permit'],
      tone: 'Casual',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Event Catering', description: 'Food truck services for festivals and events.', category: 'Events', pricingType: 'fixed' },
      { name: 'Corporate Catering', description: 'Office and corporate event food service.', category: 'Corporate', pricingType: 'fixed' },
      { name: 'Wedding Catering', description: 'Unique wedding food truck experiences.', category: 'Wedding', pricingType: 'fixed' },
      { name: 'Regular Locations', description: 'Scheduled stops at regular locations.', category: 'Regular', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Sysco', domains: ['sysco.com'] },
      { name: 'US Foods', domains: ['usfoods.com'] },
      { name: 'Performance Food Group', domains: ['pfgc.com'] },
      { name: 'Gordon Food Service', domains: ['gfs.com'] }
    ]
  },

  // Beauty & Personal Care
  'Hair Salon': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','appointment','cancellation','reschedule','allergic','reaction','damage'],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Haircut & Styling', description: 'Professional haircut and styling services.', category: 'Styling', pricingType: 'fixed' },
      { name: 'Hair Coloring', description: 'Hair coloring, highlights, and color correction.', category: 'Coloring', pricingType: 'fixed' },
      { name: 'Hair Treatments', description: 'Deep conditioning and hair repair treatments.', category: 'Treatment', pricingType: 'fixed' },
      { name: 'Special Occasion Styling', description: 'Wedding and special event hair styling.', category: 'Special', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'L\'Oreal Professional', domains: ['lorealpro.com'] },
      { name: 'Wella Professionals', domains: ['wella.com'] },
      { name: 'Schwarzkopf Professional', domains: ['schwarzkopf-professional.com'] },
      { name: 'Redken', domains: ['redken.com'] }
    ]
  },

  'Nail Salon': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','appointment','cancellation','reschedule','allergic','infection','damage'],
      tone: 'Friendly',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Manicure Services', description: 'Classic and gel manicure services.', category: 'Manicure', pricingType: 'fixed' },
      { name: 'Pedicure Services', description: 'Relaxing pedicure and foot care.', category: 'Pedicure', pricingType: 'fixed' },
      { name: 'Nail Art', description: 'Custom nail art and design services.', category: 'Art', pricingType: 'fixed' },
      { name: 'Spa Services', description: 'Hand and foot spa treatments.', category: 'Spa', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'OPI', domains: ['opi.com'] },
      { name: 'Essie', domains: ['essie.com'] },
      { name: 'CND', domains: ['cnd.com'] },
      { name: 'Gelish', domains: ['gelish.com'] }
    ]
  },

  'Spa & Wellness': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','appointment','cancellation','reschedule','allergic','reaction','medical'],
      tone: 'Calming',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Massage Therapy', description: 'Swedish, deep tissue, and therapeutic massage.', category: 'Massage', pricingType: 'fixed' },
      { name: 'Facial Treatments', description: 'Customized facial treatments and skincare.', category: 'Facial', pricingType: 'fixed' },
      { name: 'Body Treatments', description: 'Body wraps, scrubs, and detox treatments.', category: 'Body', pricingType: 'fixed' },
      { name: 'Wellness Programs', description: 'Holistic wellness and stress management.', category: 'Wellness', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Eminence Organic', domains: ['eminenceorganics.com'] },
      { name: 'Dermalogica', domains: ['dermalogica.com'] },
      { name: 'Murad', domains: ['murad.com'] },
      { name: 'Obagi', domains: ['obagi.com'] }
    ]
  },

  // Photography & Events
  'Photography Studio': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','deadline','delivery','wedding','event','weather','equipment','backup'],
      tone: 'Creative',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Wedding Photography', description: 'Complete wedding photography and videography.', category: 'Wedding', pricingType: 'fixed' },
      { name: 'Portrait Sessions', description: 'Professional portrait and headshot photography.', category: 'Portrait', pricingType: 'fixed' },
      { name: 'Event Photography', description: 'Corporate events and special occasion coverage.', category: 'Event', pricingType: 'fixed' },
      { name: 'Photo Editing', description: 'Professional photo editing and retouching.', category: 'Editing', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Canon Professional', domains: ['canon.com'] },
      { name: 'Nikon Professional', domains: ['nikon.com'] },
      { name: 'Sony Professional', domains: ['sony.com'] },
      { name: 'Adobe Creative Cloud', domains: ['adobe.com'] }
    ]
  },

  'Event Planning': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','cancellation','weather','venue','vendor','timeline','deadline','change'],
      tone: 'Energetic',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Wedding Planning', description: 'Complete wedding planning and coordination.', category: 'Wedding', pricingType: 'fixed' },
      { name: 'Corporate Events', description: 'Business meeting and corporate event planning.', category: 'Corporate', pricingType: 'fixed' },
      { name: 'Private Parties', description: 'Birthday parties and private celebrations.', category: 'Private', pricingType: 'fixed' },
      { name: 'Event Coordination', description: 'Day-of event coordination and management.', category: 'Coordination', pricingType: 'fixed' }
    ],
    supplierTemplates: [
      { name: 'Eventbrite', domains: ['eventbrite.com'] },
      { name: 'Cvent', domains: ['cvent.com'] },
      { name: 'Planning Pod', domains: ['planningpod.com'] },
      { name: 'Social Tables', domains: ['socialtables.com'] }
    ]
  },

  // Manufacturing & Industrial
  'Manufacturing': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','production','delay','equipment','breakdown','safety','quality','supply'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Production Planning', description: 'Manufacturing schedule and production planning.', category: 'Planning', pricingType: 'hourly' },
      { name: 'Quality Control', description: 'Product quality inspection and testing.', category: 'Quality', pricingType: 'fixed' },
      { name: 'Equipment Maintenance', description: 'Manufacturing equipment repair and maintenance.', category: 'Maintenance', pricingType: 'hourly' },
      { name: 'Supply Chain Management', description: 'Raw material sourcing and inventory management.', category: 'Supply', pricingType: 'hourly' }
    ],
    supplierTemplates: [
      { name: 'SAP', domains: ['sap.com'] },
      { name: 'Oracle Manufacturing', domains: ['oracle.com'] },
      { name: 'Epicor', domains: ['epicor.com'] },
      { name: 'Infor', domains: ['infor.com'] }
    ]
  },

  'Warehouse & Logistics': {
    rules: {
      phoneProvider: { name: 'RingCentral', senders: ['service@ringcentral.com'] },
      crmAlertEmails: ['alerts@servicetitan.com'],
      urgentKeywords: ['urgent','asap','immediately','emergency','shipping','delay','inventory','shortage','damage','safety','equipment'],
      tone: 'Professional',
      language: 'en',
      ai: { model: 'gpt-4o-mini', maxTokens: 900 }
    },
    services: [
      { name: 'Inventory Management', description: 'Warehouse inventory tracking and management.', category: 'Inventory', pricingType: 'monthly' },
      { name: 'Order Fulfillment', description: 'Order picking, packing, and shipping.', category: 'Fulfillment', pricingType: 'per-order' },
      { name: 'Receiving Services', description: 'Incoming shipment processing and inspection.', category: 'Receiving', pricingType: 'per-shipment' },
      { name: 'Fleet Management', description: 'Delivery vehicle management and coordination.', category: 'Fleet', pricingType: 'monthly' }
    ],
    supplierTemplates: [
      { name: 'FedEx', domains: ['fedex.com'] },
      { name: 'UPS', domains: ['ups.com'] },
      { name: 'DHL', domains: ['dhl.com'] },
      { name: 'Amazon Logistics', domains: ['amazon.com'] }
    ]
  }
};

export function mergePresetIntoConfig(current, preset) {
  if (!preset) return current;
  const out = { ...current };
  out.rules = { ...(out.rules || {}) };
  const curRules = out.rules;
  const pr = preset.rules || {};
  // only set if empty/missing
  if (!curRules.phoneProvider || !curRules.phoneProvider.name) curRules.phoneProvider = pr.phoneProvider;
  if (!Array.isArray(curRules.crmAlertEmails) || curRules.crmAlertEmails.length === 0) curRules.crmAlertEmails = pr.crmAlertEmails || [];
  const existingKW = new Set((curRules.urgentKeywords || []).map(s => s.toLowerCase()));
  (pr.urgentKeywords || []).forEach(k => existingKW.add(k.toLowerCase()));
  curRules.urgentKeywords = Array.from(existingKW);
  if (!curRules.tone) curRules.tone = pr.tone;
  if (!curRules.language) curRules.language = pr.language;
  out.ai = out.ai || {};
  if (!out.ai.model && pr.ai?.model) out.ai.model = pr.ai.model;
  if (!out.ai.maxTokens && pr.ai?.maxTokens) out.ai.maxTokens = pr.ai.maxTokens;
  // attach services if none provided
  if ((!Array.isArray(current.services) || current.services.length === 0) && Array.isArray(preset.services)) {
    out.services = preset.services;
  }
  return out;
}

export function derivePresetLinks(website, preset) {
  if (!website || !preset?.linkPaths) return {};
  const base = website.replace(/\/$/, '');
  const toUrl = (p) => p ? (p.startsWith('http') ? p : `${base}${p}`) : '';
  return {
    bookingFormUrl: toUrl(preset.linkPaths.bookingForm),
    catalogUrl: toUrl(preset.linkPaths.catalog),
    treatmentPackagesUrl: toUrl(preset.linkPaths.treatmentPackages),
    suppliesUrl: toUrl(preset.linkPaths.supplies)
  };
}